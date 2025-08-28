import axios from 'axios';
import Movie from '../../models/Movie.js';
import StreamVersion from '../../models/StreamVersion.js';
import IngestLog from '../../models/IngestLog.js';
import Settings from '../../models/Settings.js';
import provider from '../services/provider.js';
import { normalizeQuality, pickBest, meetsMinimumQuality } from '../services/quality.js';

/**
 * Content Matching Job
 * Finds streaming sources for a given TMDB ID and creates/updates StreamVersions
 */
async function contentMatchJob(job) {
  const startTime = Date.now();
  const { tmdbId, movieId } = job.attrs.data || {};
  
  if (!tmdbId && !movieId) {
    throw new Error('Either tmdbId or movieId is required');
  }

  try {
    console.log(`🔍 Starting content matching for ${tmdbId ? `TMDB ID: ${tmdbId}` : `Movie ID: ${movieId}`}`);
    
    let movie;
    
    // Get movie by TMDB ID or Movie ID
    if (tmdbId) {
      movie = await Movie.findOne({ tmdbId });
      if (!movie) {
        // Movie doesn't exist yet, skip for now
        // This will be handled when the movie is imported
        console.log(`⏭️ Movie with TMDB ID ${tmdbId} not found, skipping`);
        return;
      }
    } else {
      movie = await Movie.findById(movieId);
      if (!movie) {
        throw new Error(`Movie with ID ${movieId} not found`);
      }
    }

    console.log(`🎬 Processing movie: ${movie.title} (${movie.year})`);

    // Search for streaming sources using the provider
    const providerResults = await provider.searchByExternalIds({
      tmdbId: movie.tmdbId,
      imdbId: movie.imdbId,
      title: movie.title,
      year: movie.year
    });

    if (providerResults.length === 0) {
      console.log(`⚠️ No streaming sources found for ${movie.title}`);
      
      await IngestLog.create({
        job: 'content.match',
        tmdbId: movie.tmdbId,
        movieId: movie._id,
        status: 'SKIP',
        message: 'No streaming sources found',
        duration: Date.now() - startTime
      });
      
      return;
    }

    const allStreams = [];
    
    // Get streams from each provider
    for (const providerResult of providerResults) {
      try {
        const streams = await provider.getStreams(providerResult.providerId);
        
        // Normalize and enrich stream data
        const enrichedStreams = streams.map(stream => ({
          ...stream,
          provider: providerResult.provider,
          quality: normalizeQuality(stream.quality),
          movieId: movie._id,
          addedAt: new Date(),
          lastCheckedAt: new Date()
        }));
        
        allStreams.push(...enrichedStreams);
        
      } catch (error) {
        console.warn(`Failed to get streams from ${providerResult.provider}:`, error.message);
      }
    }

    if (allStreams.length === 0) {
      console.log(`⚠️ No valid streams found for ${movie.title}`);
      
      await IngestLog.create({
        job: 'content.match',
        tmdbId: movie.tmdbId,
        movieId: movie._id,
        status: 'SKIP',
        message: 'No valid streams found',
        duration: Date.now() - startTime
      });
      
      return;
    }

    console.log(`📺 Found ${allStreams.length} streaming sources for ${movie.title}`);

    // Get current settings
    const minQualityToPublish = await Settings.getValue('MIN_QUALITY_TO_PUBLISH', '720p');
    const allowLowerQuality = await Settings.getValue('ALLOW_LOWER_QUALITY_UNTIL_UPGRADE', true);

    // Filter streams by minimum quality
    const publishableStreams = allStreams.filter(stream => 
      meetsMinimumQuality(stream.quality, minQualityToPublish)
    );

    if (publishableStreams.length === 0) {
      console.log(`⚠️ No streams meet minimum quality requirement (${minQualityToPublish}) for ${movie.title}`);
      
      await IngestLog.create({
        job: 'content.match',
        tmdbId: movie.tmdbId,
        movieId: movie._id,
        status: 'SKIP',
        message: `No streams meet minimum quality: ${minQualityToPublish}`,
        duration: Date.now() - startTime
      });
      
      return;
    }

    // Upsert all streams
    const upsertPromises = publishableStreams.map(async (streamData) => {
      try {
        await StreamVersion.findOneAndUpdate(
          { movieId: movie._id, url: streamData.url },
          streamData,
          { upsert: true, new: true, runValidators: true }
        );
      } catch (error) {
        console.error(`Failed to upsert stream ${streamData.url}:`, error.message);
      }
    });

    await Promise.allSettled(upsertPromises);

    // Get current active stream for this movie
    const currentActive = await StreamVersion.findOne({
      movieId: movie._id,
      isActive: true
    });

    // Pick the best available stream
    const bestStream = pickBest(publishableStreams);
    
    if (!bestStream) {
      throw new Error('Failed to determine best stream');
    }

    // Determine if we should activate a new stream
    let shouldActivate = false;
    let activationReason = '';

    if (!currentActive) {
      // No active stream, activate the best one
      shouldActivate = true;
      activationReason = 'First available stream';
    } else if (bestStream.quality !== currentActive.quality) {
      // Quality changed, check if we should upgrade
      if (allowLowerQuality) {
        // Allow lower quality temporarily
        shouldActivate = true;
        activationReason = `Quality change: ${currentActive.quality} → ${bestStream.quality}`;
      } else if (bestStream.quality > currentActive.quality) {
        // Only upgrade to better quality
        shouldActivate = true;
        activationReason = `Quality upgrade: ${currentActive.quality} → ${bestStream.quality}`;
      }
    }

    if (shouldActivate) {
      // Deactivate current stream if exists
      if (currentActive) {
        await StreamVersion.findByIdAndUpdate(currentActive._id, {
          isActive: false,
          replacedBy: bestStream._id || null
        });
      }

      // Activate the best stream
      const bestStreamDoc = await StreamVersion.findOne({
        movieId: movie._id,
        url: bestStream.url
      });

      if (bestStreamDoc) {
        await StreamVersion.findByIdAndUpdate(bestStreamDoc._id, {
          isActive: true,
          lastCheckedAt: new Date()
        });

        console.log(`✅ Activated stream: ${bestStream.quality} from ${bestStream.provider}`);
      }
    }

    // Log success
    await IngestLog.create({
      job: 'content.match',
      tmdbId: movie.tmdbId,
      movieId: movie._id,
      status: 'OK',
      message: `Found ${allStreams.length} streams, ${publishableStreams.length} publishable`,
      payload: {
        totalStreams: allStreams.length,
        publishableStreams: publishableStreams.length,
        bestQuality: bestStream.quality,
        activated: shouldActivate,
        activationReason
      },
      metadata: {
        provider: bestStream.provider,
        quality: bestStream.quality,
        url: bestStream.url
      },
      duration: Date.now() - startTime
    });

    console.log(`✅ Content matching completed for ${movie.title}`);

  } catch (error) {
    console.error('❌ Content matching job failed:', error);

    // Log error
    await IngestLog.create({
      job: 'content.match',
      tmdbId,
      movieId,
      status: 'ERROR',
      message: error.message,
      error: error.stack,
      duration: Date.now() - startTime
    });

    throw error;
  }
}

export default contentMatchJob;

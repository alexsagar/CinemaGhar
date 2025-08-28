import axios from 'axios';
import Movie from '../../models/Movie.js';
import IngestLog from '../../models/IngestLog.js';
import Settings from '../../models/Settings.js';
import jobScheduler from './agenda.js';

/**
 * TMDB Discovery Job
 * Discovers new content from TMDB and queues content matching
 */
async function tmdbDiscoverJob(job) {
  const startTime = Date.now();
  const jobData = job.attrs.data || {};
  
  try {
    console.log('🔍 Starting TMDB discovery job');
    
    // Check if TMDB API key is configured
    const tmdbApiKey = process.env.TMDB_API_KEY;
    if (!tmdbApiKey) {
      throw new Error('TMDB API key not configured');
    }

    const tmdbBaseUrl = 'https://api.themoviedb.org/3';
    const discoveredIds = new Set();

    // Discover from multiple sources
    const discoveryTasks = [
      discoverNowPlaying(tmdbBaseUrl, tmdbApiKey),
      discoverPopular(tmdbBaseUrl, tmdbApiKey),
      discoverTopRated(tmdbBaseUrl, tmdbApiKey),
      discoverUpcoming(tmdbBaseUrl, tmdbApiKey)
    ];

    const results = await Promise.allSettled(discoveryTasks);
    
    // Collect all discovered TMDB IDs
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        result.value.forEach(id => discoveredIds.add(id));
      } else {
        console.warn(`Discovery task ${index} failed:`, result.reason);
      }
    });

    console.log(`📊 Discovered ${discoveredIds.size} unique TMDB IDs`);

    // Check which ones are new (not in our database)
    const existingMovies = await Movie.find(
      { tmdbId: { $in: Array.from(discoveredIds) } },
      'tmdbId'
    ).lean();

    const existingTmdbIds = new Set(existingMovies.map(m => m.tmdbId));
    const newTmdbIds = Array.from(discoveredIds).filter(id => !existingTmdbIds.has(id));

    console.log(`🆕 Found ${newTmdbIds.length} new TMDB IDs`);

    // Queue content matching for new IDs
    if (newTmdbIds.length > 0) {
      for (const tmdbId of newTmdbIds) {
        try {
          await jobScheduler.runJob('content.match', { tmdbId });
        } catch (error) {
          console.error(`Failed to queue content.match for TMDB ID ${tmdbId}:`, error);
        }
      }
    }

    // Log success
    await IngestLog.create({
      job: 'tmdb.discover',
      status: 'OK',
      message: `Discovered ${discoveredIds.size} IDs, ${newTmdbIds.length} new`,
      payload: {
        totalDiscovered: discoveredIds.size,
        newIds: newTmdbIds.length,
        existingIds: existingMovies.length
      },
      duration: Date.now() - startTime
    });

    console.log('✅ TMDB discovery job completed successfully');

  } catch (error) {
    console.error('❌ TMDB discovery job failed:', error);

    // Log error
    await IngestLog.create({
      job: 'tmdb.discover',
      status: 'ERROR',
      message: error.message,
      error: error.stack,
      duration: Date.now() - startTime
    });

    throw error;
  }
}

/**
 * Discover now playing movies
 */
async function discoverNowPlaying(baseUrl, apiKey) {
  try {
    const response = await axios.get(`${baseUrl}/movie/now_playing`, {
      params: { api_key: apiKey, page: 1 },
      timeout: 10000
    });
    return response.data.results?.map(movie => movie.id) || [];
  } catch (error) {
    console.warn('Failed to discover now playing:', error.message);
    return [];
  }
}

/**
 * Discover popular movies
 */
async function discoverPopular(baseUrl, apiKey) {
  try {
    const response = await axios.get(`${baseUrl}/movie/popular`, {
      params: { api_key: apiKey, page: 1 },
      timeout: 10000
    });
    return response.data.results?.map(movie => movie.id) || [];
  } catch (error) {
    console.warn('Failed to discover popular:', error.message);
    return [];
  }
}

/**
 * Discover top rated movies
 */
async function discoverTopRated(baseUrl, apiKey) {
  try {
    const response = await axios.get(`${baseUrl}/movie/top_rated`, {
      params: { api_key: apiKey, page: 1 },
      timeout: 10000
    });
    return response.data.results?.map(movie => movie.id) || [];
  } catch (error) {
    console.warn('Failed to discover top rated:', error.message);
    return [];
  }
}

/**
 * Discover upcoming movies
 */
async function discoverUpcoming(baseUrl, apiKey) {
  try {
    const response = await axios.get(`${baseUrl}/movie/upcoming`, {
      params: { api_key: apiKey, page: 1 },
      timeout: 10000
    });
    return response.data.results?.map(movie => movie.id) || [];
  } catch (error) {
    console.warn('Failed to discover upcoming:', error.message);
    return [];
  }
}

export default tmdbDiscoverJob;

import StreamVersion from '../../models/StreamVersion.js';
import IngestLog from '../../models/IngestLog.js';
import Settings from '../../models/Settings.js';
import provider from '../services/provider.js';
import { isBetterQuality } from '../services/quality.js';

/**
 * Content Refresh Job
 * Periodically checks for quality upgrades and replaces lower quality streams
 */
async function contentRefreshJob(job) {
  const startTime = Date.now();
  
  try {
    console.log('🔄 Starting content refresh job');
    
    // Get settings
    const targetQuality = await Settings.getValue('TARGET_QUALITY', '2160p');
    const allowLowerQuality = await Settings.getValue('ALLOW_LOWER_QUALITY_UNTIL_UPGRADE', true);
    
    // Find movies with active streams below target quality
    const streamsToCheck = await StreamVersion.find({
      isActive: true,
      quality: { $ne: targetQuality }
    }).populate('movieId', 'title tmdbId');
    
    if (streamsToCheck.length === 0) {
      console.log('✅ All active streams are at target quality');
      return;
    }
    
    console.log(`🔍 Checking ${streamsToCheck.length} streams for quality upgrades`);
    
    let upgradedCount = 0;
    let checkedCount = 0;
    
    for (const stream of streamsToCheck) {
      try {
        checkedCount++;
        
        if (!stream.movieId) {
          console.warn(`⚠️ Stream ${stream._id} has no associated movie, skipping`);
          continue;
        }
        
        console.log(`📺 Checking ${stream.movieId.title} (${stream.quality} → target: ${targetQuality})`);
        
        // Search for better quality streams
        const providerResults = await provider.searchByExternalIds({
          tmdbId: stream.movieId.tmdbId,
          title: stream.movieId.title
        });
        
        let bestNewStream = null;
        
        // Check each provider for better quality
        for (const providerResult of providerResults) {
          try {
            const streams = await provider.getStreams(providerResult.providerId);
            
            for (const newStream of streams) {
              if (isBetterQuality(newStream.quality, stream.quality)) {
                if (!bestNewStream || isBetterQuality(newStream.quality, bestNewStream.quality)) {
                  bestNewStream = {
                    ...newStream,
                    provider: providerResult.provider
                  };
                }
              }
            }
          } catch (error) {
            console.warn(`Failed to check ${providerResult.provider}:`, error.message);
          }
        }
        
        if (bestNewStream) {
          console.log(`🎉 Found better quality: ${stream.quality} → ${bestNewStream.quality}`);
          
          // Create new stream version
          const newStreamVersion = new StreamVersion({
            movieId: stream.movieId._id,
            provider: bestNewStream.provider,
            url: bestNewStream.url,
            delivery: bestNewStream.delivery || 'licensed-embed',
            quality: bestNewStream.quality,
            codecs: bestNewStream.codecs,
            score: bestNewStream.score || 0,
            isActive: false, // Will be activated after deactivating old one
            addedAt: new Date(),
            lastCheckedAt: new Date()
          });
          
          await newStreamVersion.save();
          
          // Deactivate old stream
          await StreamVersion.findByIdAndUpdate(stream._id, {
            isActive: false,
            replacedBy: newStreamVersion._id
          });
          
          // Activate new stream
          await StreamVersion.findByIdAndUpdate(newStreamVersion._id, {
            isActive: true
          });
          
          upgradedCount++;
          
          // Log upgrade
          await IngestLog.create({
            job: 'content.refresh',
            tmdbId: stream.movieId.tmdbId,
            movieId: stream.movieId._id,
            status: 'UPGRADED',
            message: `Quality upgraded: ${stream.quality} → ${bestNewStream.quality}`,
            payload: {
              oldQuality: stream.quality,
              newQuality: bestNewStream.quality,
              provider: bestNewStream.provider
            },
            metadata: {
              oldQuality: stream.quality,
              newQuality: bestNewStream.quality,
              url: bestNewStream.url
            }
          });
          
        } else {
          console.log(`⏳ No better quality found for ${stream.movieId.title}`);
        }
        
      } catch (error) {
        console.error(`❌ Failed to check stream ${stream._id}:`, error.message);
      }
    }
    
    // Log completion
    await IngestLog.create({
      job: 'content.refresh',
      status: 'OK',
      message: `Checked ${checkedCount} streams, upgraded ${upgradedCount}`,
      payload: {
        checked: checkedCount,
        upgraded: upgradedCount,
        targetQuality
      },
      duration: Date.now() - startTime
    });
    
    console.log(`✅ Content refresh completed: ${checkedCount} checked, ${upgradedCount} upgraded`);
    
  } catch (error) {
    console.error('❌ Content refresh job failed:', error);
    
    await IngestLog.create({
      job: 'content.refresh',
      status: 'ERROR',
      message: error.message,
      error: error.stack,
      duration: Date.now() - startTime
    });
    
    throw error;
  }
}

export default contentRefreshJob;

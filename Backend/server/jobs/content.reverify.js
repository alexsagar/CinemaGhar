import StreamVersion from '../../models/StreamVersion.js';
import IngestLog from '../../models/IngestLog.js';
import Settings from '../../models/Settings.js';
import provider from '../services/provider.js';

/**
 * Content Reverify Job
 * Checks if streams are still working and marks broken ones as inactive
 */
async function contentReverifyJob(job) {
  const startTime = Date.now();
  
  try {
    console.log('🔍 Starting content reverify job');
    
    // Get settings
    const gracePeriodHours = await Settings.getValue('GRACE_PERIOD_HOURS', 24);
    const gracePeriodMs = gracePeriodHours * 60 * 60 * 1000;
    
    // Find streams that haven't been verified recently
    const streamsToVerify = await StreamVersion.find({
      isActive: true,
      lastVerifiedAt: {
        $lt: new Date(Date.now() - gracePeriodMs)
      }
    }).populate('movieId', 'title tmdbId');
    
    if (streamsToVerify.length === 0) {
      console.log('✅ No streams need verification');
      return;
    }
    
    console.log(`🔍 Verifying ${streamsToVerify.length} streams`);
    
    let verifiedCount = 0;
    let brokenCount = 0;
    
    for (const stream of streamsToVerify) {
      try {
        verifiedCount++;
        
        if (!stream.movieId) {
          console.warn(`⚠️ Stream ${stream._id} has no associated movie, skipping`);
          continue;
        }
        
        console.log(`🔍 Verifying ${stream.movieId.title} (${stream.quality})`);
        
        // Verify stream using provider
        const isWorking = await provider.verifyStream(stream.url);
        
        if (isWorking) {
          // Stream is working, update verification timestamp
          await StreamVersion.findByIdAndUpdate(stream._id, {
            lastVerifiedAt: new Date(),
            isBroken: false
          });
          
          console.log(`✅ Stream verified: ${stream.movieId.title}`);
          
        } else {
          // Stream is broken, mark as inactive
          await StreamVersion.findByIdAndUpdate(stream._id, {
            isActive: false,
            isBroken: true,
            lastVerifiedAt: new Date()
          });
          
          console.log(`❌ Stream broken: ${stream.movieId.title}`);
          brokenCount++;
          
          // Log broken stream
          await IngestLog.create({
            job: 'content.reverify',
            tmdbId: stream.movieId.tmdbId,
            movieId: stream.movieId._id,
            status: 'ERROR',
            message: `Stream marked as broken: ${stream.url}`,
            payload: {
              streamId: stream._id,
              url: stream.url,
              provider: stream.provider,
              quality: stream.quality
            },
            metadata: {
              provider: stream.provider,
              quality: stream.quality,
              url: stream.url
            }
          });
          
          // Try to find alternative streams for this movie
          try {
            console.log(`🔄 Attempting to find alternative streams for ${stream.movieId.title}`);
            
            const providerResults = await provider.searchByExternalIds({
              tmdbId: stream.movieId.tmdbId,
              title: stream.movieId.title
            });
            
            let alternativeFound = false;
            
            for (const providerResult of providerResults) {
              try {
                const streams = await provider.getStreams(providerResult.providerId);
                
                for (const newStream of streams) {
                  if (newStream.url !== stream.url) {
                    // Create new stream version
                    const newStreamVersion = new StreamVersion({
                      movieId: stream.movieId._id,
                      provider: providerResult.provider,
                      url: newStream.url,
                      delivery: newStream.delivery || 'licensed-embed',
                      quality: newStream.quality,
                      codecs: newStream.codecs,
                      score: newStream.score || 0,
                      isActive: true, // Activate immediately as replacement
                      addedAt: new Date(),
                      lastCheckedAt: new Date(),
                      lastVerifiedAt: new Date()
                    });
                    
                    await newStreamVersion.save();
                    
                    console.log(`✅ Alternative stream found: ${newStream.quality} from ${providerResult.provider}`);
                    alternativeFound = true;
                    break;
                  }
                }
                
                if (alternativeFound) break;
                
              } catch (error) {
                console.warn(`Failed to check ${providerResult.provider}:`, error.message);
              }
            }
            
            if (!alternativeFound) {
              console.log(`⚠️ No alternative streams found for ${stream.movieId.title}`);
            }
            
          } catch (error) {
            console.warn(`Failed to find alternatives for ${stream.movieId.title}:`, error.message);
          }
        }
        
      } catch (error) {
        console.error(`❌ Failed to verify stream ${stream._id}:`, error.message);
      }
    }
    
    // Clean up old broken streams (older than grace period)
    const oldBrokenStreams = await StreamVersion.find({
      isBroken: true,
      lastVerifiedAt: {
        $lt: new Date(Date.now() - gracePeriodMs)
      }
    });
    
    if (oldBrokenStreams.length > 0) {
      console.log(`🧹 Cleaning up ${oldBrokenStreams.length} old broken streams`);
      
      for (const oldStream of oldBrokenStreams) {
        await StreamVersion.findByIdAndDelete(oldStream._id);
      }
    }
    
    // Log completion
    await IngestLog.create({
      job: 'content.reverify',
      status: 'OK',
      message: `Verified ${verifiedCount} streams, ${brokenCount} broken`,
      payload: {
        verified: verifiedCount,
        broken: brokenCount,
        cleaned: oldBrokenStreams.length,
        gracePeriodHours
      },
      duration: Date.now() - startTime
    });
    
    console.log(`✅ Content reverify completed: ${verifiedCount} verified, ${brokenCount} broken, ${oldBrokenStreams.length} cleaned up`);
    
  } catch (error) {
    console.error('❌ Content reverify job failed:', error);
    
    await IngestLog.create({
      job: 'content.reverify',
      status: 'ERROR',
      message: error.message,
      error: error.stack,
      duration: Date.now() - startTime
    });
    
    throw error;
  }
}

export default contentReverifyJob;

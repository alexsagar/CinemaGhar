import express from 'express';
import StreamVersion from '../models/StreamVersion.js';
import Movie from '../models/Movie.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/movies/:id/active-stream
 * Get the active streaming version for a movie
 */
router.get('/:id/active-stream', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the movie
    const movie = await Movie.findById(id);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    
    // Find the active stream version
    const activeStream = await StreamVersion.findOne({
      movieId: id,
      isActive: true
    });
    
    if (!activeStream) {
      return res.status(404).json({ 
        message: 'No active stream available',
        movieId: id,
        tmdbId: movie.tmdbId
      });
    }
    
    // Return stream information
    res.json({
      success: true,
      data: {
        id: activeStream._id,
        url: activeStream.url,
        quality: activeStream.quality,
        provider: activeStream.provider,
        delivery: activeStream.delivery,
        codecs: activeStream.codecs,
        audioLanguages: activeStream.audioLanguages,
        subtitles: activeStream.subtitles,
        score: activeStream.score,
        addedAt: activeStream.addedAt
      }
    });
    
  } catch (error) {
    console.error('Error fetching active stream:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

/**
 * GET /api/movies/:id/stream-events
 * Server-Sent Events for stream updates
 */
router.get('/:id/stream-events', auth, (req, res) => {
  const { id } = req.params;
  
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });
  
  // Send initial connection message
  res.write(`data: ${JSON.stringify({
    type: 'CONNECTED',
    message: 'Stream events connected',
    movieId: id,
    timestamp: new Date().toISOString()
  })}\n\n`);
  
  // Keep connection alive with heartbeat
  const heartbeat = setInterval(() => {
    res.write(`data: ${JSON.stringify({
      type: 'HEARTBEAT',
      timestamp: new Date().toISOString()
    })}\n\n`);
  }, 30000); // Every 30 seconds
  
  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
    console.log(`Client disconnected from stream events for movie ${id}`);
  });
  
  // Store connection for potential future use (e.g., sending upgrade notifications)
  if (!req.app.locals.streamConnections) {
    req.app.locals.streamConnections = new Map();
  }
  
  req.app.locals.streamConnections.set(id, res);
});

/**
 * GET /api/movies/:id/stream-versions
 * Get all available stream versions for a movie (admin only)
 */
router.get('/:id/stream-versions', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the movie
    const movie = await Movie.findById(id);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    
    // Get all stream versions for this movie
    const streamVersions = await StreamVersion.find({ movieId: id })
      .sort({ quality: -1, score: -1, addedAt: -1 });
    
    res.json({
      success: true,
      data: streamVersions.map(stream => ({
        id: stream._id,
        url: stream.url,
        quality: stream.quality,
        provider: stream.provider,
        delivery: stream.delivery,
        isActive: stream.isActive,
        score: stream.score,
        addedAt: stream.addedAt,
        lastCheckedAt: stream.lastCheckedAt,
        isBroken: stream.isBroken,
        replacedBy: stream.replacedBy
      }))
    });
    
  } catch (error) {
    console.error('Error fetching stream versions:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

/**
 * POST /api/movies/:id/activate-stream
 * Activate a specific stream version (admin only)
 */
router.post('/:id/activate-stream', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { streamVersionId } = req.body;
    
    if (!streamVersionId) {
      return res.status(400).json({ message: 'Stream version ID is required' });
    }
    
    // Find the movie
    const movie = await Movie.findById(id);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    
    // Find the stream version
    const streamVersion = await StreamVersion.findById(streamVersionId);
    if (!streamVersion || streamVersion.movieId.toString() !== id) {
      return res.status(404).json({ message: 'Stream version not found' });
    }
    
    // Deactivate current active stream
    await StreamVersion.updateMany(
      { movieId: id, isActive: true },
      { isActive: false }
    );
    
    // Activate the selected stream
    await StreamVersion.findByIdAndUpdate(streamVersionId, {
      isActive: true,
      lastCheckedAt: new Date()
    });
    
    res.json({
      success: true,
      message: 'Stream activated successfully',
      data: {
        id: streamVersion._id,
        quality: streamVersion.quality,
        provider: streamVersion.provider
      }
    });
    
  } catch (error) {
    console.error('Error activating stream:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

/**
 * POST /api/movies/:id/recheck
 * Manually trigger content matching for a movie
 */
router.post('/:id/recheck', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the movie
    const movie = await Movie.findById(id);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    
    // Import the job scheduler
    const jobScheduler = await import('../server/jobs/agenda.js');
    
    // Queue content matching job
    const result = await jobScheduler.default.runJob('content.match', { 
      movieId: id,
      tmdbId: movie.tmdbId 
    });
    
    res.json({
      success: true,
      message: 'Content recheck queued successfully',
      data: result
    });
    
  } catch (error) {
    console.error('Error queuing content recheck:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

export default router;

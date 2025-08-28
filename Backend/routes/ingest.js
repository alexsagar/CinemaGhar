import express from 'express';
import { auth, adminAuth } from '../middleware/auth.js';
import jobScheduler from '../server/jobs/agenda.js';

const router = express.Router();

/**
 * GET /api/ingest/status
 * Get current job status and counts
 */
router.get('/status', adminAuth, async (req, res) => {
  try {
    const status = await jobScheduler.getJobStatus();
    const history = await jobScheduler.getJobHistory(10);
    
    res.json({
      success: true,
      data: {
        status,
        recentJobs: history,
        scheduler: {
          initialized: jobScheduler.isInitialized,
          uptime: process.uptime()
        }
      }
    });
    
  } catch (error) {
    console.error('Error getting ingest status:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

/**
 * POST /api/ingest/run/:job
 * Manually trigger a specific job
 */
router.post('/run/:job', adminAuth, async (req, res) => {
  try {
    const { job } = req.params;
    const jobData = req.body || {};
    
    // Validate job name
    const validJobs = ['tmdb.discover', 'content.match', 'content.refresh', 'content.reverify'];
    if (!validJobs.includes(job)) {
      return res.status(400).json({ 
        message: 'Invalid job name',
        validJobs 
      });
    }
    
    // Queue the job
    const result = await jobScheduler.runJob(job, jobData);
    
    res.json({
      success: true,
      message: `Job ${job} queued successfully`,
      data: result
    });
    
  } catch (error) {
    console.error('Error queuing job:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

/**
 * POST /api/ingest/run-content-match
 * Run content matching for a specific TMDB ID
 */
router.post('/run-content-match', adminAuth, async (req, res) => {
  try {
    const { tmdbId, movieId } = req.body;
    
    if (!tmdbId && !movieId) {
      return res.status(400).json({ 
        message: 'Either tmdbId or movieId is required' 
      });
    }
    
    // Queue content matching job
    const result = await jobScheduler.runJob('content.match', { tmdbId, movieId });
    
    res.json({
      success: true,
      message: 'Content matching queued successfully',
      data: result
    });
    
  } catch (error) {
    console.error('Error queuing content matching:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

/**
 * GET /api/ingest/logs
 * Get recent ingestion logs
 */
router.get('/logs', adminAuth, async (req, res) => {
  try {
    const { limit = 50, job, status, tmdbId } = req.query;
    
    // Build query
    const query = {};
    if (job) query.job = job;
    if (status) query.status = status;
    if (tmdbId) query.tmdbId = parseInt(tmdbId);
    
    // Import IngestLog model
    const IngestLog = await import('../models/IngestLog.js');
    
    const logs = await IngestLog.default.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('movieId', 'title');
    
    res.json({
      success: true,
      data: logs
    });
    
  } catch (error) {
    console.error('Error fetching ingest logs:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

/**
 * POST /api/ingest/initialize
 * Initialize the job scheduler and settings
 */
router.post('/initialize', adminAuth, async (req, res) => {
  try {
    await jobScheduler.initialize();
    
    res.json({
      success: true,
      message: 'Job scheduler initialized successfully',
      data: {
        initialized: jobScheduler.isInitialized
      }
    });
    
  } catch (error) {
    console.error('Error initializing job scheduler:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

export default router;

import Agenda from 'agenda';
import mongoose from 'mongoose';
import Settings from '../../models/Settings.js';

class JobScheduler {
  constructor() {
    this.agenda = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Initialize Agenda with MongoDB connection
      this.agenda = new Agenda({
        db: {
          address: process.env.MONGODB_URI || 'mongodb://localhost:27017/netflix-clone',
          collection: 'agendaJobs'
        },
        processEvery: '30 seconds',
        maxConcurrency: 5,
        defaultConcurrency: 2
      });

      // Graceful shutdown
      process.on('SIGTERM', () => this.gracefulShutdown());
      process.on('SIGINT', () => this.gracefulShutdown());

      // Wait for Agenda to be ready
      await this.agenda.start();

      // Initialize default settings
      await Settings.initializeDefaults();

      // Load job definitions
      await this.loadJobs();

      this.isInitialized = true;
      console.log('✅ Agenda job scheduler initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize Agenda:', error);
      throw error;
    }
  }

  async loadJobs() {
    try {
      // Import job modules
      const tmdbDiscover = await import('./tmdb.discover.js');
      const contentMatch = await import('./content.match.js');
      const contentRefresh = await import('./content.refresh.js');
      const contentReverify = await import('./content.reverify.js');

      // Register jobs
      this.agenda.define('tmdb.discover', tmdbDiscover.default);
      this.agenda.define('content.match', contentMatch.default);
      this.agenda.define('content.refresh', contentRefresh.default);
      this.agenda.define('content.reverify', contentReverify.default);

      // Schedule recurring jobs
      await this.scheduleRecurringJobs();

      console.log('✅ All jobs loaded and scheduled');

    } catch (error) {
      console.error('❌ Failed to load jobs:', error);
      throw error;
    }
  }

  async scheduleRecurringJobs() {
    try {
      // Get cron schedules from settings
      const discoverCron = await Settings.getValue('INGEST_DISCOVER_CRON', '*/30 * * * *');
      const refreshCron = await Settings.getValue('INGEST_REFRESH_CRON', '0 */6 * * *');
      const reverifyCron = await Settings.getValue('INGEST_REVERIFY_CRON', '0 */12 * * *');

      // Schedule TMDB discovery
      this.agenda.every(discoverCron, 'tmdb.discover', {}, {
        priority: 'high',
        removeOnComplete: 10,
        removeOnFail: 5
      });

      // Schedule quality refresh
      this.agenda.every(refreshCron, 'content.refresh', {}, {
        priority: 'normal',
        removeOnComplete: 10,
        removeOnFail: 5
      });

      // Schedule stream verification
      this.agenda.every(reverifyCron, 'content.reverify', {}, {
        priority: 'low',
        removeOnComplete: 10,
        removeOnFail: 5
      });

      console.log('📅 Recurring jobs scheduled:', {
        discover: discoverCron,
        refresh: refreshCron,
        reverify: reverifyCron
      });

    } catch (error) {
      console.error('❌ Failed to schedule recurring jobs:', error);
      throw error;
    }
  }

  async gracefulShutdown() {
    console.log('🔄 Shutting down Agenda gracefully...');
    
    if (this.agenda) {
      await this.agenda.stop();
      console.log('✅ Agenda stopped');
    }
    
    process.exit(0);
  }

  // Manual job execution
  async runJob(jobName, data = {}) {
    if (!this.isInitialized) {
      throw new Error('Job scheduler not initialized');
    }

    try {
      const job = this.agenda.create(jobName, data);
      await job.save();
      
      console.log(`🚀 Manual job queued: ${jobName}`);
      return { success: true, jobId: job.attrs._id };
      
    } catch (error) {
      console.error(`❌ Failed to queue job ${jobName}:`, error);
      throw error;
    }
  }

  // Get job status
  async getJobStatus() {
    if (!this.isInitialized) {
      throw new Error('Job scheduler not initialized');
    }

    try {
      const [queued, running, completed, failed] = await Promise.all([
        this.agenda.jobs({ status: 'queued' }),
        this.agenda.jobs({ status: 'running' }),
        this.agenda.jobs({ status: 'completed' }),
        this.agenda.jobs({ status: 'failed' })
      ]);

      return {
        queued: queued.length,
        running: running.length,
        completed: completed.length,
        failed: failed.length,
        total: queued.length + running.length + completed.length + failed.length
      };
      
    } catch (error) {
      console.error('❌ Failed to get job status:', error);
      throw error;
    }
  }

  // Get recent job history
  async getJobHistory(limit = 20) {
    if (!this.isInitialized) {
      throw new Error('Job scheduler not initialized');
    }

    try {
      const jobs = await this.agenda.jobs({}, { sort: { lastRunAt: -1 }, limit });
      
      return jobs.map(job => ({
        id: job.attrs._id,
        name: job.attrs.name,
        status: job.attrs.status,
        lastRunAt: job.attrs.lastRunAt,
        nextRunAt: job.attrs.nextRunAt,
        data: job.attrs.data,
        result: job.attrs.result,
        failedAt: job.attrs.failedAt,
        failReason: job.attrs.failReason
      }));
      
    } catch (error) {
      console.error('❌ Failed to get job history:', error);
      throw error;
    }
  }
}

export default new JobScheduler();

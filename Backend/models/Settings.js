import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  description: {
    type: String
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Default settings
const defaultSettings = [
  {
    key: 'TARGET_QUALITY',
    value: '2160p',
    description: 'Target quality for automatic upgrades'
  },
  {
    key: 'ALLOW_LOWER_QUALITY_UNTIL_UPGRADE',
    value: true,
    description: 'Allow publishing lower quality while waiting for upgrade'
  },
  {
    key: 'MIN_QUALITY_TO_PUBLISH',
    value: '720p',
    description: 'Minimum quality to publish to users'
  },
  {
    key: 'INGEST_DISCOVER_CRON',
    value: '*/30 * * * *',
    description: 'Cron schedule for TMDB discovery (every 30 minutes)'
  },
  {
    key: 'INGEST_REFRESH_CRON',
    value: '0 */6 * * *',
    description: 'Cron schedule for quality refresh (every 6 hours)'
  },
  {
    key: 'INGEST_REVERIFY_CRON',
    value: '0 */12 * * *',
    description: 'Cron schedule for stream verification (every 12 hours)'
  },
  {
    key: 'RATE_LIMIT_RPS',
    value: 3,
    description: 'Rate limit for provider API calls (requests per second)'
  },
  {
    key: 'GRACE_PERIOD_HOURS',
    value: 24,
    description: 'Hours to keep old streams before pruning'
  },
  {
    key: 'MAX_RETRY_ATTEMPTS',
    value: 3,
    description: 'Maximum retry attempts for failed operations'
  }
];

// Initialize default settings if they don't exist
settingsSchema.statics.initializeDefaults = async function() {
  for (const setting of defaultSettings) {
    await this.findOneAndUpdate(
      { key: setting.key },
      setting,
      { upsert: true, new: true }
    );
  }
};

// Get setting value with fallback
settingsSchema.statics.getValue = async function(key, fallback = null) {
  const setting = await this.findOne({ key });
  return setting ? setting.value : fallback;
};

// Set setting value
settingsSchema.statics.setValue = async function(key, value, description = null) {
  return await this.findOneAndUpdate(
    { key },
    { value, description, updatedAt: new Date() },
    { upsert: true, new: true }
  );
};

export default mongoose.model('Settings', settingsSchema);

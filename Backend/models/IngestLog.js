import mongoose from 'mongoose';

const ingestLogSchema = new mongoose.Schema({
  job: {
    type: String,
    required: true,
    enum: ['tmdb.discover', 'content.match', 'content.refresh', 'content.reverify'],
    index: true
  },
  tmdbId: {
    type: Number,
    sparse: true,
    index: true
  },
  movieId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    sparse: true,
    index: true
  },
  status: {
    type: String,
    required: true,
    enum: ['OK', 'SKIP', 'ERROR', 'UPGRADED'],
    index: true
  },
  message: {
    type: String,
    required: true
  },
  payload: {
    type: mongoose.Schema.Types.Mixed
  },
  error: {
    type: String
  },
  duration: {
    type: Number, // milliseconds
    default: 0
  },
  metadata: {
    provider: String,
    quality: String,
    url: String,
    oldQuality: String,
    newQuality: String
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Index for job performance analysis
ingestLogSchema.index({ job: 1, status: 1, createdAt: -1 });

// Index for error tracking
ingestLogSchema.index({ status: 'ERROR', createdAt: -1 });

// Index for upgrade tracking
ingestLogSchema.index({ status: 'UPGRADED', createdAt: -1 });

// TTL index to automatically clean old logs (keep for 30 days)
ingestLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export default mongoose.model('IngestLog', ingestLogSchema);

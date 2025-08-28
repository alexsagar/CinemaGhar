import mongoose from 'mongoose';

const streamVersionSchema = new mongoose.Schema({
  movieId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    required: true,
    index: true
  },
  provider: {
    type: String,
    required: true,
    enum: ['AutoEmbed', '2Embed', 'MultiEmbed', 'EmbedSu', 'LicensedProvider'],
    default: 'AutoEmbed'
  },
  providerId: {
    type: String,
    sparse: true
  },
  url: {
    type: String,
    required: true
  },
  delivery: {
    type: String,
    required: true,
    enum: ['hls', 'dash', 'progressive', 'licensed-embed'],
    default: 'licensed-embed'
  },
  quality: {
    type: String,
    required: true,
    enum: ['CAM', 'SD', '720p', '1080p', '1440p', '2160p'],
    default: '1080p'
  },
  codecs: {
    type: String,
    enum: ['h264', 'hevc', 'av1']
  },
  audioLanguages: [{
    type: String
  }],
  subtitles: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: false,
    index: true
  },
  score: {
    type: Number,
    default: 0
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  lastCheckedAt: {
    type: Date,
    default: Date.now
  },
  replacedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StreamVersion',
    sparse: true
  },
  isBroken: {
    type: Boolean,
    default: false
  },
  lastVerifiedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound unique index for movie + URL to prevent duplicates
streamVersionSchema.index({ movieId: 1, url: 1 }, { unique: true });

// Index for active streams per movie
streamVersionSchema.index({ movieId: 1, isActive: 1 });

// Index for quality-based queries
streamVersionSchema.index({ quality: 1, isActive: 1 });

// Index for provider-based queries
streamVersionSchema.index({ provider: 1, isActive: 1 });

// Index for broken streams cleanup
streamVersionSchema.index({ isBroken: 1, lastVerifiedAt: 1 });

export default mongoose.model('StreamVersion', streamVersionSchema);

import mongoose from 'mongoose';

const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Mystery', 'Romance', 'Sci-Fi', 'TV Movie', 'Thriller', 'War', 'Western']
  },
  contentType: {
    type: String,
    required: true,
    enum: ['movie', 'series', 'animated'],
    default: 'movie'
  },
  seriesInfo: {
    totalSeasons: {
      type: Number,
      default: 1
    },
    totalEpisodes: {
      type: Number,
      default: 1
    },
    status: {
      type: String,
      enum: ['ongoing', 'completed', 'cancelled'],
      default: 'completed'
    },
    firstAirDate: {
      type: Date
    },
    lastAirDate: {
      type: Date
    }
  },
  animatedInfo: {
    animationType: {
      type: String,
      enum: ['2D', '3D', 'CGI', 'Stop Motion', 'Mixed'],
      default: '2D'
    },
    targetAudience: {
      type: String,
      enum: ['Kids', 'Teen', 'Adult', 'All Ages'],
      default: 'All Ages'
    },
    studio: {
      type: String,
      default: ''
    }
  },
  thumbnailURL: {
    type: String,
    required: true
  },
  backdropURL: {
    type: String,
    default: ''
  },
  videoURL: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    default: '2h 0m'
  },
  rating: {
    type: String,
    default: 'PG-13',
    enum: ['G', 'PG', 'PG-13', 'R', 'NC-17']
  },
  year: {
    type: Number,
    default: 2024
  },
  tmdbId: {
    type: Number,
    unique: true,
    sparse: true
  },
  imdbId: {
    type: String,
    sparse: true
  },
  voteAverage: {
    type: Number,
    default: 0
  },
  voteCount: {
    type: Number,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  quality: {
    type: String,
    enum: ['720p', '1080p', '4K'],
    default: '1080p'
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Index for better search performance
movieSchema.index({ title: 'text', description: 'text' });
movieSchema.index({ category: 1 });
movieSchema.index({ contentType: 1 });
movieSchema.index({ year: -1 });
movieSchema.index({ voteAverage: -1 });
movieSchema.index({ 'seriesInfo.status': 1 });
movieSchema.index({ 'animatedInfo.targetAudience': 1 });

export default mongoose.model('Movie', movieSchema);
// Movie and Content Types
export const MovieCategory = {
  ACTION: 'Action',
  ADVENTURE: 'Adventure',
  ANIMATION: 'Animation',
  COMEDY: 'Comedy',
  CRIME: 'Crime',
  DOCUMENTARY: 'Documentary',
  DRAMA: 'Drama',
  FAMILY: 'Family',
  FANTASY: 'Fantasy',
  HISTORY: 'History',
  HORROR: 'Horror',
  MUSIC: 'Music',
  MYSTERY: 'Mystery',
  ROMANCE: 'Romance',
  SCI_FI: 'Sci-Fi',
  TV_MOVIE: 'TV Movie',
  THRILLER: 'Thriller',
  WAR: 'War',
  WESTERN: 'Western'
};

export const ContentType = {
  MOVIE: 'movie',
  SERIES: 'series',
  ANIMATED: 'animated'
};

export const Quality = {
  HD_720P: '720p',
  HD_1080P: '1080p',
  UHD_4K: '4K'
};

export const Rating = {
  G: 'G',
  PG: 'PG',
  PG_13: 'PG-13',
  R: 'R',
  NC_17: 'NC-17'
};

// Movie Interface
export const MovieSchema = {
  _id: String,
  title: String,
  description: String,
  category: String,
  contentType: String,
  seriesInfo: {
    totalSeasons: Number,
    totalEpisodes: Number,
    status: String,
    firstAirDate: Date,
    lastAirDate: Date
  },
  animatedInfo: {
    animationType: String,
    targetAudience: String,
    studio: String
  },
  thumbnailURL: String,
  backdropURL: String,
  videoURL: String,
  duration: String,
  rating: String,
  year: Number,
  tmdbId: Number,
  imdbId: String,
  voteAverage: Number,
  voteCount: Number,
  featured: Boolean,
  quality: String,
  tags: [String],
  createdAt: Date,
  updatedAt: Date
};

// User Types
export const UserRole = {
  USER: 'user',
  ADMIN: 'admin'
};

export const UserSchema = {
  _id: String,
  name: String,
  email: String,
  role: String,
  watchlist: [String], // Array of movie IDs
  watchHistory: [String], // Array of movie IDs
  createdAt: Date,
  updatedAt: Date
};

// API Response Types
export const PaginatedResponse = {
  data: [MovieSchema],
  page: Number,
  totalPages: Number,
  totalItems: Number,
  hasNextPage: Boolean,
  hasPrevPage: Boolean
};

export const ApiResponse = {
  success: Boolean,
  message: String,
  data: Object,
  error: String
};

// Filter and Search Types
export const MovieFilters = {
  query: String,
  category: String,
  contentType: String,
  yearMin: Number,
  yearMax: Number,
  ratingMin: Number,
  ratingMax: Number,
  quality: String,
  featured: Boolean,
  sortBy: String,
  sortOrder: String
};

export const SortOptions = {
  TITLE_ASC: 'title_asc',
  TITLE_DESC: 'title_desc',
  YEAR_ASC: 'year_asc',
  YEAR_DESC: 'year_desc',
  RATING_ASC: 'rating_asc',
  RATING_DESC: 'rating_desc',
  CREATED_ASC: 'created_asc',
  CREATED_DESC: 'created_desc'
};

// UI Component Props
export const MovieCardProps = {
  movie: MovieSchema,
  showActions: Boolean,
  showRating: Boolean,
  variant: String // 'default', 'compact', 'featured'
};

export const MovieSectionProps = {
  title: String,
  icon: Object,
  movies: [MovieSchema],
  className: String,
  showViewAll: Boolean
};

// Form Types
export const LoginFormData = {
  email: String,
  password: String
};

export const RegisterFormData = {
  name: String,
  email: String,
  password: String,
  confirmPassword: String
};

// Theme Types
export const Theme = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
};

// Navigation Types
export const NavItem = {
  label: String,
  href: String,
  icon: Object,
  children: [NavItem]
};

// Toast Types
export const ToastType = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

export const ToastProps = {
  id: String,
  type: ToastType,
  title: String,
  message: String,
  duration: Number,
  action: Object
};

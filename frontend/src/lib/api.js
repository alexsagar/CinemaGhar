import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const endpoints = {
  // Auth
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    profile: '/auth/profile',
  },
  
  // Movies
  movies: {
    list: '/movies',
    detail: (id) => `/movies/${id}`,
    search: '/movies/search',
    trending: '/movies/trending',
    popular: '/movies/popular',
    latest: '/movies/latest',
    byCategory: (category) => `/movies?category=${category}`,
    // New streaming endpoints
    activeStream: (id) => `/movies/${id}/active-stream`,
    streamEvents: (id) => `/movies/${id}/stream-events`,
    streamVersions: (id) => `/movies/${id}/stream-versions`,
    activateStream: (id) => `/movies/${id}/activate-stream`,
    recheck: (id) => `/movies/${id}/recheck`,
  },
  
  // Users
  users: {
    profile: '/users/profile',
    watchlist: '/users/watchlist',
    history: '/users/history',
    preferences: '/users/preferences',
  },
  
  // External
  external: {
    tmdb: '/external/tmdb',
    search: '/external/search',
  },

  // Ingestion
  ingest: {
    status: '/ingest/status',
    runJob: (job) => `/ingest/run/${job}`,
    runContentMatch: '/ingest/run-content-match',
    logs: '/ingest/logs',
    initialize: '/ingest/initialize',
  },
};

// API functions
export const apiClient = {
  // Auth
  login: async (credentials) => {
    const response = await api.post(endpoints.auth.login, credentials);
    return response.data;
  },
  
  register: async (userData) => {
    const response = await api.post(endpoints.auth.register, userData);
    return response.data;
  },
  
  getProfile: async () => {
    const response = await api.get(endpoints.auth.profile);
    return response.data;
  },
  
  // Movies
  getMovies: async (params = {}) => {
    const response = await api.get(endpoints.movies.list, { params });
    return response.data;
  },
  
  getMovie: async (id) => {
    const response = await api.get(endpoints.movies.detail(id));
    return response.data;
  },
  
  searchMovies: async (query, params = {}) => {
    const response = await api.get(endpoints.movies.search, {
      params: { query, ...params }
    });
    return response.data;
  },
  
  getTrendingMovies: async () => {
    const response = await api.get(endpoints.movies.trending);
    return response.data;
  },
  
  getPopularMovies: async () => {
    const response = await api.get(endpoints.movies.popular);
    return response.data;
  },
  
  getLatestMovies: async () => {
    const response = await api.get(endpoints.movies.latest);
    return response.data;
  },
  
  getMoviesByCategory: async (category) => {
    const response = await api.get(endpoints.movies.byCategory(category));
    return response.data;
  },

  // New streaming functions
  getActiveStream: async (movieId) => {
    const response = await api.get(endpoints.movies.activeStream(movieId));
    return response.data;
  },

  getStreamVersions: async (movieId) => {
    const response = await api.get(endpoints.movies.streamVersions(movieId));
    return response.data;
  },

  activateStream: async (movieId, streamVersionId) => {
    const response = await api.post(endpoints.movies.activateStream(movieId), {
      streamVersionId
    });
    return response.data;
  },

  recheckMovie: async (movieId) => {
    const response = await api.post(endpoints.movies.recheck(movieId));
    return response.data;
  },
  
  // User
  getUserProfile: async () => {
    const response = await api.get(endpoints.users.profile);
    return response.data;
  },
  
  getWatchlist: async () => {
    const response = await api.get(endpoints.users.watchlist);
    return response.data;
  },
  
  addToWatchlist: async (movieId) => {
    const response = await api.post(endpoints.users.watchlist, { movieId });
    return response.data;
  },
  
  removeFromWatchlist: async (movieId) => {
    const response = await api.delete(`${endpoints.users.watchlist}/${movieId}`);
    return response.data;
  },
  
  getWatchHistory: async () => {
    const response = await api.get(endpoints.users.history);
    return response.data;
  },
  
  addToHistory: async (movieId) => {
    const response = await api.post(endpoints.users.history, { movieId });
    return response.data;
  },

  // Ingestion
  getIngestStatus: async () => {
    const response = await api.get(endpoints.ingest.status);
    return response.data;
  },

  runIngestJob: async (jobName, jobData = {}) => {
    const response = await api.post(endpoints.ingest.runJob(jobName), jobData);
    return response.data;
  },

  runContentMatch: async (tmdbId, movieId) => {
    const response = await api.post(endpoints.ingest.runContentMatch, {
      tmdbId,
      movieId
    });
    return response.data;
  },

  getIngestLogs: async (params = {}) => {
    const response = await api.get(endpoints.ingest.logs, { params });
    return response.data;
  },

  initializeIngest: async () => {
    const response = await api.post(endpoints.ingest.initialize);
    return response.data;
  },
  
  // External
  searchExternal: async (query, type = 'movie') => {
    const response = await api.get(endpoints.external.search, {
      params: { query, type }
    });
    return response.data;
  },
};

// Utility functions
export const buildQueryParams = (filters) => {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => params.append(key, v));
      } else {
        params.append(key, value);
      }
    }
  });
  
  return params.toString();
};

export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    return {
      status,
      message: data?.message || `HTTP ${status} error`,
      details: data?.error || data,
    };
  } else if (error.request) {
    // Request made but no response
    return {
      status: 0,
      message: 'Network error - no response received',
      details: error.request,
    };
  } else {
    // Something else happened
    return {
      status: -1,
      message: 'Request setup error',
      details: error.message,
    };
  }
};

export default api;

// Enhanced TMDB API functions for bulk imports
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Debug logging
console.log('Environment variables:', import.meta.env);
console.log('All env variables:', import.meta.env);
console.log('TMDB API Key check:', TMDB_API_KEY ? 'Found' : 'Missing');
console.log('Current working directory:', window.location.href);

if (!TMDB_API_KEY) {
  console.error('TMDB API key not found. Please set VITE_TMDB_API_KEY in your .env file');
}

// Enhanced fetch function with retry logic
async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
    }
  }
}

// Bulk fetch movies with pagination
export async function fetchBulkMovies(options = {}) {
  const {
    category = 'popular', // popular, top_rated, upcoming, now_playing
    startPage = 1,
    endPage = 250, // TMDB allows up to 500 pages (20 movies per page = 10,000 movies)
    includeAdult = false,
    language = 'en-US',
    region = 'US'
  } = options;

  const movies = [];
  const errors = [];

  console.log(`Starting bulk import: ${category} movies, pages ${startPage}-${endPage}`);

  for (let page = startPage; page <= endPage; page++) {
    try {
      const url = `${TMDB_BASE_URL}/movie/${category}?api_key=${TMDB_API_KEY}&language=${language}&page=${page}&include_adult=${includeAdult}&region=${region}`;
      
      console.log(`Fetching page ${page}/${endPage}...`);
      const data = await fetchWithRetry(url);
      
      if (data.results && data.results.length > 0) {
        const processedMovies = data.results.map(movie => ({
          tmdbId: movie.id,
          title: movie.title,
          originalTitle: movie.original_title,
          overview: movie.overview,
          posterURL: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '',
          backdropURL: movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : '',
          thumbnailURL: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '',
          videoURL: '', // Leave empty for SE Player
          releaseDate: movie.release_date,
          year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
          duration: movie.runtime || null,
          rating: movie.vote_average,
          voteCount: movie.vote_count,
          popularity: movie.popularity,
          genreIds: movie.genre_ids || [],
          genres: movie.genre_ids ? fetchGenresSync(movie.genre_ids) : [],
          category: movie.genre_ids && movie.genre_ids.length > 0 ? fetchGenresSync(movie.genre_ids)[0] : 'Action',
          contentType: 'movie',
          language: movie.original_language,
          adult: movie.adult,
          status: 'released'
        }));
        
        movies.push(...processedMovies);
        console.log(`✓ Page ${page}: ${processedMovies.length} movies processed`);
      } else {
        console.log(`⚠ Page ${page}: No results found`);
      }

      // Rate limiting: wait between requests
      await new Promise(resolve => setTimeout(resolve, 250));
      
    } catch (error) {
      console.error(`✗ Page ${page} failed:`, error);
      errors.push({ page, error: error.message });
      
      // If we get too many errors, stop
      if (errors.length > 10) {
        console.error('Too many errors, stopping import');
        break;
      }
    }
  }

  return {
    movies,
    errors,
    totalPages: endPage - startPage + 1,
    successPages: movies.length / 20, // Assuming 20 movies per page
    failedPages: errors.length
  };
}

// Fetch genres for a movie (synchronous version)
function fetchGenresSync(genreIds) {
  // For now, return a simple mapping based on common genre IDs
  const genreMap = {
    28: 'Action',
    12: 'Adventure',
    16: 'Animation',
    35: 'Comedy',
    80: 'Crime',
    99: 'Documentary',
    18: 'Drama',
    10751: 'Family',
    14: 'Fantasy',
    36: 'History',
    27: 'Horror',
    10402: 'Music',
    9648: 'Mystery',
    10749: 'Romance',
    878: 'Sci-Fi',
    10770: 'TV Movie',
    53: 'Thriller',
    10752: 'War',
    37: 'Western'
  };
  
  return genreIds.map(id => genreMap[id] || 'Unknown');
}

// Fetch genres for a movie (async version - for future use)
async function fetchGenres(genreIds) {
  try {
    const url = `${TMDB_BASE_URL}/genre/movie/list?api_key=${TMDB_API_KEY}`;
    const data = await fetchWithRetry(url);
    
    return genreIds.map(id => {
      const genre = data.genres.find(g => g.id === id);
      return genre ? genre.name : 'Unknown';
    });
  } catch (error) {
    console.error('Error fetching genres:', error);
    return ['Unknown'];
  }
}

// Enhanced TV series import
export async function fetchBulkSeries(options = {}) {
  const {
    category = 'popular', // popular, top_rated, on_the_air, airing_today
    startPage = 1,
    endPage = 250,
    includeAdult = false,
    language = 'en-US'
  } = options;

  const series = [];
  const errors = [];

  console.log(`Starting bulk import: ${category} TV series, pages ${startPage}-${endPage}`);

  for (let page = startPage; page <= endPage; page++) {
    try {
      const url = `${TMDB_BASE_URL}/tv/${category}?api_key=${TMDB_API_KEY}&language=${language}&page=${page}&include_adult=${includeAdult}`;
      
      console.log(`Fetching TV page ${page}/${endPage}...`);
      const data = await fetchWithRetry(url);
      
      if (data.results && data.results.length > 0) {
        const processedSeries = data.results.map(show => ({
          tmdbId: show.id,
          title: show.name,
          originalTitle: show.original_name,
          overview: show.overview,
          posterURL: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : '',
          backdropURL: show.backdrop_path ? `https://image.tmdb.org/t/p/original${show.backdrop_path}` : '',
          thumbnailURL: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : '',
          videoURL: '', // Leave empty for SE Player
          releaseDate: show.first_air_date,
          year: show.first_air_date ? new Date(show.first_air_date).getFullYear() : null,
          duration: show.episode_run_time?.[0] || null,
          rating: show.vote_average,
          voteCount: show.vote_count,
          popularity: show.popularity,
          genreIds: show.genre_ids || [],
          genres: show.genre_ids ? fetchTVGenresSync(show.genre_ids) : [],
          category: show.genre_ids && show.genre_ids.length > 0 ? fetchTVGenresSync(show.genre_ids)[0] : 'Drama',
          contentType: 'series',
          language: show.original_language,
          adult: show.adult,
          status: show.status,
          numberOfSeasons: show.number_of_seasons,
          numberOfEpisodes: show.number_of_episodes
        }));
        
        series.push(...processedSeries);
        console.log(`✓ TV Page ${page}: ${processedSeries.length} series processed`);
      } else {
        console.log(`⚠ TV Page ${page}: No results found`);
      }

      // Rate limiting: wait between requests
      await new Promise(resolve => setTimeout(resolve, 250));
      
    } catch (error) {
      console.error(`✗ TV Page ${page} failed:`, error);
      errors.push({ page, error: error.message });
      
      if (errors.length > 10) {
        console.error('Too many TV errors, stopping import');
        break;
      }
    }
  }

  return {
    series,
    errors,
    totalPages: endPage - startPage + 1,
    successPages: series.length / 20,
    failedPages: errors.length
  };
}

// Fetch TV genres (synchronous version)
function fetchTVGenresSync(genreIds) {
  // For now, return a simple mapping based on common TV genre IDs
  const genreMap = {
    10759: 'Action & Adventure',
    16: 'Animation',
    35: 'Comedy',
    80: 'Crime',
    99: 'Documentary',
    18: 'Drama',
    10751: 'Family',
    10762: 'Kids',
    9648: 'Mystery',
    10763: 'News',
    10764: 'Reality',
    10765: 'Sci-Fi & Fantasy',
    10766: 'Soap',
    10767: 'Talk',
    10768: 'War & Politics',
    37: 'Western'
  };
  
  return genreIds.map(id => genreMap[id] || 'Unknown');
}

// Fetch TV genres (async version - for future use)
async function fetchTVGenres(genreIds) {
  try {
    const url = `${TMDB_BASE_URL}/genre/tv/list?api_key=${TMDB_API_KEY}`;
    const data = await fetchWithRetry(url);
    
    return genreIds.map(id => {
      const genre = data.genres.find(g => g.id === id);
      return genre ? genre.name : 'Unknown';
    });
  } catch (error) {
    console.error('Error fetching TV genres:', error);
    return ['Unknown'];
  }
}

// Enhanced animated content import
export async function fetchBulkAnimated(options = {}) {
  const {
    startPage = 1,
    endPage = 250,
    includeAdult = false,
    language = 'en-US'
  } = options;

  const animated = [];
  const errors = [];

  console.log(`Starting bulk import: animated content, pages ${startPage}-${endPage}`);

  for (let page = startPage; page <= endPage; page++) {
    try {
      // Fetch animated movies
      const movieUrl = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=${language}&page=${page}&include_adult=${includeAdult}&with_genres=16&sort_by=popularity.desc`;
      const movieData = await fetchWithRetry(movieUrl);
      
      if (movieData.results && movieData.results.length > 0) {
        const processedMovies = movieData.results.map(movie => ({
          tmdbId: movie.id,
          title: movie.title,
          originalTitle: movie.original_title,
          overview: movie.overview,
          posterURL: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '',
          backdropURL: movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : '',
          thumbnailURL: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '',
          videoURL: '', // Leave empty for SE Player
          releaseDate: movie.release_date,
          year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
          duration: movie.runtime || null,
          rating: movie.vote_average,
          voteCount: movie.vote_count,
          popularity: movie.popularity,
          genreIds: movie.genre_ids || [],
          genres: movie.genre_ids ? fetchGenresSync(movie.genre_ids) : [],
          category: movie.genre_ids && movie.genre_ids.length > 0 ? fetchGenresSync(movie.genre_ids)[0] : 'Animation',
          contentType: 'animated',
          language: movie.original_language,
          adult: movie.adult,
          status: 'released'
        }));
        
        animated.push(...processedMovies);
        console.log(`✓ Animated Page ${page}: ${processedMovies.length} movies processed`);
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 250));
      
    } catch (error) {
      console.error(`✗ Animated Page ${page} failed:`, error);
      errors.push({ page, error: error.message });
      
      if (errors.length > 10) {
        console.error('Too many animated errors, stopping import');
        break;
      }
    }
  }

  return {
    animated,
    errors,
    totalPages: endPage - startPage + 1,
    successPages: animated.length / 20,
    failedPages: errors.length
  };
}

// Legacy functions for backward compatibility
export async function fetchPopularMovies(page = 1) {
  const result = await fetchBulkMovies({ startPage: page, endPage: page });
  return result.movies;
}

export async function fetchPopularSeries(page = 1) {
  const result = await fetchBulkSeries({ startPage: page, endPage: page });
  return result.series;
}

export async function fetchAnimatedMovies(page = 1) {
  const result = await fetchBulkAnimated({ startPage: page, endPage: page });
  return result.animated;
}

// Search function (unchanged)
export async function searchMovies(query, page = 1) {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB API key not found');
  }

  try {
    const url = `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}&include_adult=false`;
    const data = await fetch(url);
    
    if (!data.ok) {
      throw new Error(`HTTP ${data.status}: ${data.statusText}`);
    }
    
    const result = await data.json();
    
    if (!result.results) {
      return [];
    }

    return result.results
      .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
      .map(item => {
        const isAnimated = item.genre_ids && item.genre_ids.includes(16);
        
        return {
          tmdbId: item.id,
          title: item.title || item.name,
          originalTitle: item.original_title || item.original_name,
          overview: item.overview,
          posterURL: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '',
          backdropURL: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : '',
          thumbnailURL: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '',
          videoURL: '', // Leave empty for SE Player
          releaseDate: item.release_date || item.first_air_date,
          year: (item.release_date || item.first_air_date) ? new Date(item.release_date || item.first_air_date).getFullYear() : null,
          duration: item.runtime || item.episode_run_time?.[0] || null,
          rating: item.vote_average,
          voteCount: item.vote_count,
          popularity: item.popularity,
          genreIds: item.genre_ids || [],
          genres: [],
          category: isAnimated ? 'Animation' : (item.media_type === 'tv' ? 'Series' : 'Movie'),
          contentType: isAnimated ? 'animated' : (item.media_type === 'tv' ? 'series' : 'movie'),
          language: item.original_language,
          adult: item.adult,
          status: item.status || 'released'
        };
      });
  } catch (error) {
    console.error('Error searching movies:', error);
    throw error;
  }
}

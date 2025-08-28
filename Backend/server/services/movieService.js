import dotenv from 'dotenv';
dotenv.config();


import axios from 'axios';
import Movie from '../../models/Movie.js';


class MovieService {
  constructor() {
    // TMDB API for movie metadata
    this.TMDB_API_KEY = process.env.TMDB_API_KEY;
    this.TMDB_BASE_URL = 'https://api.themoviedb.org/3';
    this.IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
    this.BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/original';
    
    // AutoEmbed.co for all streaming (movies and series)
    this.AUTOEMBED_BASE_URL = 'https://autoembed.co';
  }

  // Check if TMDB API key is configured
  checkApiKey() {
    if (!this.TMDB_API_KEY) {
      throw new Error('TMDB API key is not configured. Please add TMDB_API_KEY to your environment variables.');
    }
  }

  // Generate streaming URL using AutoEmbed.co
  generateStreamingUrl(tmdbId, contentType = 'movie', season = null, episode = null) {
    if (contentType === 'series' && season && episode) {
      return `${this.AUTOEMBED_BASE_URL}/tv/tmdb/${tmdbId}-${season}-${episode}`;
    } else if (contentType === 'series') {
      // Default to season 1, episode 1 for series
      return `${this.AUTOEMBED_BASE_URL}/tv/tmdb/${tmdbId}-1-1`;
    } else {
      // Movies and animated content
      return `${this.AUTOEMBED_BASE_URL}/movie/tmdb/${tmdbId}`;
    }
  }

  // Generate multiple streaming sources (simplified for AutoEmbed)
  generateStreamingSources(tmdbId, contentType = 'movie', season = null, episode = null) {
    if (!tmdbId) return [];

    const sources = [];

    if (contentType === 'series') {
      // Series with specific episode
      if (season && episode) {
        sources.push({
          name: 'AutoEmbed (Episode)',
          url: this.generateStreamingUrl(tmdbId, contentType, season, episode),
          description: `Season ${season}, Episode ${episode}`,
          type: 'primary',
          domain: 'autoembed.co'
        });
      }
      
      // Series main page
      sources.push({
        name: 'AutoEmbed (Series)',
        url: this.generateStreamingUrl(tmdbId, contentType),
        description: 'Full series access',
        type: 'series',
        domain: 'autoembed.co'
      });
    } else {
      // Movies and animated content
      sources.push({
        name: 'AutoEmbed',
        url: this.generateStreamingUrl(tmdbId, contentType),
        description: 'High-quality streaming with auto source selection',
        type: 'primary',
        domain: 'autoembed.co'
      });
    }

    return sources;
  }

  // Check if a movie is a duplicate
  isDuplicateMovie(newMovie, existingMovies) {
    const normalize = (str) => {
      if (!str) return '';
      return str.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const newTitle = normalize(newMovie.title);
    const newYear = newMovie.year;
    const newTmdbId = newMovie.tmdbId;

    for (const existing of existingMovies) {
      // Check TMDB ID match (most reliable)
      if (newTmdbId && existing.tmdbId && newTmdbId === existing.tmdbId) {
        console.log(`Duplicate found by TMDB ID: ${newMovie.title} (${newTmdbId})`);
        return true;
      }

      // Check title and year match
      const existingTitle = normalize(existing.title);
      if (newTitle === existingTitle) {
        if (newYear && existing.year) {
          if (Math.abs(newYear - existing.year) <= 1) {
            console.log(`Duplicate found by title and year: ${newMovie.title} (${newYear})`);
            return true;
          }
        } else {
          console.log(`Duplicate found by title: ${newMovie.title}`);
          return true;
        }
      }

      // Check very similar titles (90% similarity)
      if (newTitle.length > 3 && existingTitle.length > 3) {
        const similarity = this.calculateStringSimilarity(newTitle, existingTitle);
        if (similarity > 0.9) {
          if (newYear && existing.year && Math.abs(newYear - existing.year) <= 1) {
            console.log(`Duplicate found by similar title: ${newMovie.title} vs ${existing.title} (similarity: ${similarity.toFixed(2)})`);
            return true;
          }
        }
      }
    }

    return false;
  }

  // Calculate string similarity using Levenshtein distance
  calculateStringSimilarity(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    
    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;
    
    const matrix = Array(len2 + 1).fill().map(() => Array(len1 + 1).fill(0));
    
    for (let i = 0; i <= len1; i++) matrix[0][i] = i;
    for (let j = 0; j <= len2; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= len2; j++) {
      for (let i = 1; i <= len1; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j - 1][i] + 1,
          matrix[j][i - 1] + 1,
          matrix[j - 1][i - 1] + cost
        );
      }
    }
    
    const maxLen = Math.max(len1, len2);
    return (maxLen - matrix[len2][len1]) / maxLen;
  }

  // Fetch popular movies from TMDB
  async fetchPopularMovies(page = 1) {
    try {
      this.checkApiKey();
      
      const response = await axios.get(`${this.TMDB_BASE_URL}/movie/popular`, {
        params: {
          api_key: this.TMDB_API_KEY,
          page: page
        },
        timeout: 10000
      });
      
      return response.data.results || [];
    } catch (error) {
      console.error('Error fetching popular movies:', error.message);
      if (error.response?.status === 401) {
        throw new Error('Invalid TMDB API key. Please check your API key configuration.');
      }
      throw new Error(`Failed to fetch movies from TMDB: ${error.message}`);
    }
  }

  // Fetch popular TV series from TMDB
  async fetchPopularSeries(page = 1) {
    try {
      this.checkApiKey();
      
      const response = await axios.get(`${this.TMDB_BASE_URL}/tv/popular`, {
        params: {
          api_key: this.TMDB_API_KEY,
          page: page
        },
        timeout: 10000
      });
      
      return response.data.results || [];
    } catch (error) {
      console.error('Error fetching popular series:', error.message);
      if (error.response?.status === 401) {
        throw new Error('Invalid TMDB API key. Please check your API key configuration.');
      }
      throw new Error(`Failed to fetch series from TMDB: ${error.message}`);
    }
  }

  // Fetch top-rated TV series from TMDB
  async fetchTopRatedSeries(page = 1) {
    try {
      this.checkApiKey();
      
      const response = await axios.get(`${this.TMDB_BASE_URL}/tv/top_rated`, {
        params: {
          api_key: this.TMDB_API_KEY,
          page: page
        },
        timeout: 10000
      });
      
      return response.data.results || [];
    } catch (error) {
      console.error('Error fetching top-rated series:', error.message);
      if (error.response?.status === 401) {
        throw new Error('Invalid TMDB API key. Please check your API key configuration.');
      }
      throw new Error(`Failed to fetch top-rated series from TMDB: ${error.message}`);
    }
  }

  // Fetch animated content (movies and series with animation genre)
  async fetchAnimatedContent(page = 1, type = 'movie') {
    try {
      this.checkApiKey();
      
      const endpoint = type === 'tv' ? 'tv' : 'movie';
      const response = await axios.get(`${this.TMDB_BASE_URL}/discover/${endpoint}`, {
        params: {
          api_key: this.TMDB_API_KEY,
          page: page,
          with_genres: 16, // Animation genre ID
          sort_by: 'popularity.desc'
        },
        timeout: 10000
      });
      
      return response.data.results || [];
    } catch (error) {
      console.error('Error fetching animated content:', error.message);
      if (error.response?.status === 401) {
        throw new Error('Invalid TMDB API key. Please check your API key configuration.');
      }
      throw new Error(`Failed to fetch animated content from TMDB: ${error.message}`);
    }
  }

  // Search movies
  async searchMovies(query, page = 1) {
    try {
      this.checkApiKey();
      
      const response = await axios.get(`${this.TMDB_BASE_URL}/search/movie`, {
        params: {
          api_key: this.TMDB_API_KEY,
          query: query,
          page: page
        },
        timeout: 10000
      });
      
      return response.data.results || [];
    } catch (error) {
      console.error('Error searching movies:', error.message);
      if (error.response?.status === 401) {
        throw new Error('Invalid TMDB API key. Please check your API key configuration.');
      }
      throw new Error(`Failed to search movies: ${error.message}`);
    }
  }

  // Search TV series
  async searchSeries(query, page = 1) {
    try {
      this.checkApiKey();
      
      const response = await axios.get(`${this.TMDB_BASE_URL}/search/tv`, {
        params: {
          api_key: this.TMDB_API_KEY,
          query: query,
          page: page
        },
        timeout: 10000
      });
      
      return response.data.results || [];
    } catch (error) {
      console.error('Error searching series:', error.message);
      if (error.response?.status === 401) {
        throw new Error('Invalid TMDB API key. Please check your API key configuration.');
      }
      throw new Error(`Failed to search series: ${error.message}`);
    }
  }

  // Get movie details including videos and external IDs
  async getMovieDetails(tmdbId) {
    try {
      this.checkApiKey();
      
      const [movieResponse, videosResponse, externalIdsResponse] = await Promise.all([
        axios.get(`${this.TMDB_BASE_URL}/movie/${tmdbId}`, {
          params: { api_key: this.TMDB_API_KEY },
          timeout: 10000
        }),
        axios.get(`${this.TMDB_BASE_URL}/movie/${tmdbId}/videos`, {
          params: { api_key: this.TMDB_API_KEY },
          timeout: 10000
        }),
        axios.get(`${this.TMDB_BASE_URL}/movie/${tmdbId}/external_ids`, {
          params: { api_key: this.TMDB_API_KEY },
          timeout: 10000
        })
      ]);

      const movie = movieResponse.data;
      const videos = videosResponse.data.results;
      const externalIds = externalIdsResponse.data;

      return {
        ...movie,
        videos: videos,
        external_ids: externalIds
      };
    } catch (error) {
      console.error('Error fetching movie details:', error.message);
      if (error.response?.status === 401) {
        throw new Error('Invalid TMDB API key. Please check your API key configuration.');
      }
      throw new Error(`Failed to fetch movie details: ${error.message}`);
    }
  }

  // Get TV series details with comprehensive season/episode information and external IDs
  async getSeriesDetails(tmdbId) {
    try {
      this.checkApiKey();
      
      console.log(`Fetching detailed series information for TMDB ID: ${tmdbId}`);
      
      const [seriesResponse, videosResponse, externalIdsResponse] = await Promise.all([
        axios.get(`${this.TMDB_BASE_URL}/tv/${tmdbId}`, {
          params: { api_key: this.TMDB_API_KEY },
          timeout: 15000
        }),
        axios.get(`${this.TMDB_BASE_URL}/tv/${tmdbId}/videos`, {
          params: { api_key: this.TMDB_API_KEY },
          timeout: 10000
        }),
        axios.get(`${this.TMDB_BASE_URL}/tv/${tmdbId}/external_ids`, {
          params: { api_key: this.TMDB_API_KEY },
          timeout: 10000
        })
      ]);

      const series = seriesResponse.data;
      const videos = videosResponse.data.results;
      const externalIds = externalIdsResponse.data;

      console.log(`Series "${series.name}" basic info:`, {
        seasons: series.number_of_seasons,
        episodes: series.number_of_episodes,
        status: series.status,
        imdbId: externalIds.imdb_id
      });

      // Get detailed season information for accurate episode counts
      let detailedSeasons = [];
      let totalEpisodesCalculated = 0;

      if (series.seasons && series.seasons.length > 0) {
        // Filter out season 0 (specials) for main count but include in details
        const mainSeasons = series.seasons.filter(season => season.season_number > 0);
        const specialSeason = series.seasons.find(season => season.season_number === 0);
        
        // Calculate total episodes from main seasons
        totalEpisodesCalculated = mainSeasons.reduce((total, season) => {
          return total + (season.episode_count || 0);
        }, 0);

        // Include special season in detailed info but not main count
        detailedSeasons = series.seasons.map(season => ({
          season_number: season.season_number,
          episode_count: season.episode_count || 0,
          name: season.name,
          air_date: season.air_date
        }));

        console.log(`Calculated episodes from seasons: ${totalEpisodesCalculated}`);
        console.log(`Season breakdown:`, mainSeasons.map(s => `S${s.season_number}: ${s.episode_count} episodes`));
      }

      // Use the more accurate calculation or fall back to TMDB's number
      const finalEpisodeCount = totalEpisodesCalculated > 0 ? totalEpisodesCalculated : series.number_of_episodes;
      const finalSeasonCount = series.number_of_seasons || (detailedSeasons.filter(s => s.season_number > 0).length);

      console.log(`Final counts - Seasons: ${finalSeasonCount}, Episodes: ${finalEpisodeCount}`);

      return {
        ...series,
        videos: videos,
        external_ids: externalIds,
        // Enhanced episode count calculation
        number_of_episodes: finalEpisodeCount,
        number_of_seasons: finalSeasonCount,
        // Add detailed season information
        detailed_seasons: detailedSeasons,
        // Calculate average episodes per season for better distribution
        avg_episodes_per_season: finalSeasonCount > 0 ? Math.ceil(finalEpisodeCount / finalSeasonCount) : 20
      };
    } catch (error) {
      console.error('Error fetching series details:', error.message);
      if (error.response?.status === 401) {
        throw new Error('Invalid TMDB API key. Please check your API key configuration.');
      }
      throw new Error(`Failed to fetch series details: ${error.message}`);
    }
  }

  // Convert TMDB movie/series to our database format with AutoEmbed URLs
  convertTmdbToMovie(tmdbMovie, customVideoUrl = null, contentType = 'movie') {
    const categoryMap = {
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

    const primaryGenre = tmdbMovie.genre_ids?.[0] || tmdbMovie.genres?.[0]?.id;
    const category = categoryMap[primaryGenre] || 'Drama';

    // Determine content type based on genre or explicit parameter
    let finalContentType = contentType;
    if (primaryGenre === 16 && contentType === 'movie') { // Animation
      finalContentType = 'animated';
    }

    // Get IMDB ID if available
    const imdbId = tmdbMovie.external_ids?.imdb_id || tmdbMovie.imdb_id;

    // Generate streaming URL using AutoEmbed
    const streamingUrl = customVideoUrl || this.generateStreamingUrl(
      tmdbMovie.id, 
      finalContentType
    );

    const movieData = {
      title: tmdbMovie.title || tmdbMovie.name || 'Unknown Title',
      description: tmdbMovie.overview || 'No description available.',
      category: category,
      contentType: finalContentType,
      thumbnailURL: tmdbMovie.poster_path ? `${this.IMAGE_BASE_URL}${tmdbMovie.poster_path}` : '',
      backdropURL: tmdbMovie.backdrop_path ? `${this.BACKDROP_BASE_URL}${tmdbMovie.backdrop_path}` : '',
      videoURL: streamingUrl,
      duration: tmdbMovie.runtime ? `${Math.floor(tmdbMovie.runtime / 60)}h ${tmdbMovie.runtime % 60}m` : '2h 0m',
      rating: this.convertRating(tmdbMovie.vote_average || 0),
      year: tmdbMovie.release_date ? new Date(tmdbMovie.release_date).getFullYear() : 
            tmdbMovie.first_air_date ? new Date(tmdbMovie.first_air_date).getFullYear() : 
            new Date().getFullYear(),
      tmdbId: tmdbMovie.id,
      imdbId: imdbId,
      voteAverage: tmdbMovie.vote_average || 0,
      voteCount: tmdbMovie.vote_count || 0,
      quality: this.determineQuality(tmdbMovie.vote_average || 0)
    };

    // Add series-specific information with enhanced episode calculation
    if (finalContentType === 'series') {
      const totalSeasons = tmdbMovie.number_of_seasons || 1;
      let totalEpisodes = tmdbMovie.number_of_episodes || 20;
      
      // Use detailed season information if available
      if (tmdbMovie.detailed_seasons && Array.isArray(tmdbMovie.detailed_seasons)) {
        // Calculate from detailed seasons (excluding specials)
        const mainSeasons = tmdbMovie.detailed_seasons.filter(season => season.season_number > 0);
        const calculatedEpisodes = mainSeasons.reduce((total, season) => {
          return total + (season.episode_count || 0);
        }, 0);
        
        if (calculatedEpisodes > 0) {
          totalEpisodes = calculatedEpisodes;
        }
        
        console.log(`Series "${movieData.title}" - Using detailed season data: ${totalSeasons} seasons, ${totalEpisodes} episodes`);
      } else {
        console.log(`Series "${movieData.title}" - Using basic TMDB data: ${totalSeasons} seasons, ${totalEpisodes} episodes`);
      }
      
      movieData.seriesInfo = {
        totalSeasons: totalSeasons,
        totalEpisodes: totalEpisodes,
        status: tmdbMovie.status === 'Ended' ? 'completed' : 
                tmdbMovie.status === 'Canceled' ? 'cancelled' : 'ongoing',
        firstAirDate: tmdbMovie.first_air_date ? new Date(tmdbMovie.first_air_date) : null,
        lastAirDate: tmdbMovie.last_air_date ? new Date(tmdbMovie.last_air_date) : null,
        // Add average episodes per season for better episode distribution
        avgEpisodesPerSeason: tmdbMovie.avg_episodes_per_season || Math.ceil(totalEpisodes / totalSeasons)
      };
    }

    // Add animated-specific information if it's animated
    if (finalContentType === 'animated') {
      movieData.animatedInfo = {
        animationType: '2D', // Default, could be enhanced with more data
        targetAudience: this.determineTargetAudience(tmdbMovie.vote_average, category),
        studio: tmdbMovie.production_companies?.[0]?.name || ''
      };
    }

    return movieData;
  }

  // Determine target audience for animated content
  determineTargetAudience(voteAverage, category) {
    if (category === 'Family') return 'Kids';
    if (voteAverage >= 7.5) return 'All Ages';
    if (category === 'Horror' || category === 'Thriller') return 'Adult';
    return 'Teen';
  }

  // Determine video quality based on movie rating
  determineQuality(voteAverage) {
    if (voteAverage >= 8) return '4K';
    if (voteAverage >= 6.5) return '1080p';
    return '720p';
  }

  // Convert TMDB rating to standard rating
  convertRating(voteAverage) {
    if (voteAverage >= 8) return 'R';
    if (voteAverage >= 6.5) return 'PG-13';
    if (voteAverage >= 5) return 'PG';
    return 'G';
  }

  // Import movies from TMDB to database with AutoEmbed streaming
  async importMoviesToDatabase(count = 20, existingMovies = null) {
    try {
      this.checkApiKey();
      
      // Get existing movies if not provided
      if (!existingMovies) {
        existingMovies = await Movie.find({}, 'title tmdbId imdbId year').lean();
      }
      
      console.log(`Starting import with ${existingMovies.length} existing movies for duplicate checking`);
      
      const pages = Math.ceil(count / 20);
      const allMovies = [];

      for (let page = 1; page <= pages; page++) {
        try {
          const movies = await this.fetchPopularMovies(page);
          allMovies.push(...movies);
        } catch (error) {
          console.error(`Error fetching page ${page}:`, error.message);
          // Continue with other pages
        }
      }

      if (allMovies.length === 0) {
        throw new Error('No movies could be fetched from TMDB. Please check your API key and internet connection.');
      }

      const moviesToImport = allMovies.slice(0, count);
      const importedMovies = [];
      let skippedCount = 0;

      for (const tmdbMovie of moviesToImport) {
        try {
          // Get detailed movie info including external IDs
          const detailedMovie = await this.getMovieDetails(tmdbMovie.id);
          const movieData = this.convertTmdbToMovie(detailedMovie, null, 'movie');
          
          // Check for duplicates
          if (this.isDuplicateMovie(movieData, existingMovies)) {
            console.log(`Skipping duplicate: ${movieData.title} (${movieData.year})`);
            skippedCount++;
            continue;
          }

          const newMovie = new Movie(movieData);
          await newMovie.save();
          importedMovies.push(newMovie);
          
          // Add to existing movies list for future duplicate checking
          existingMovies.push({
            title: movieData.title,
            tmdbId: movieData.tmdbId,
            imdbId: movieData.imdbId,
            year: movieData.year
          });
          
          console.log(`Imported: ${movieData.title} (${movieData.year}) - AutoEmbed streaming`);
        } catch (error) {
          console.error(`Error importing movie ${tmdbMovie.title}:`, error.message);
          // Continue with other movies
        }
      }

      console.log(`Import complete: ${importedMovies.length} imported, ${skippedCount} skipped as duplicates`);
      return importedMovies;
    } catch (error) {
      console.error('Error importing movies:', error.message);
      throw error;
    }
  }

  // Import TV series from TMDB to database with AutoEmbed streaming
  async importSeriesToDatabase(count = 20, existingMovies = null, type = 'popular') {
    try {
      this.checkApiKey();
      
      // Get existing movies if not provided
      if (!existingMovies) {
        existingMovies = await Movie.find({}, 'title tmdbId imdbId year').lean();
      }
      
      console.log(`Starting series import with ${existingMovies.length} existing items for duplicate checking`);
      
      const pages = Math.ceil(count / 20);
      const allSeries = [];

      for (let page = 1; page <= pages; page++) {
        try {
          const series = type === 'top_rated' 
            ? await this.fetchTopRatedSeries(page)
            : await this.fetchPopularSeries(page);
          allSeries.push(...series);
        } catch (error) {
          console.error(`Error fetching series page ${page}:`, error.message);
          // Continue with other pages
        }
      }

      if (allSeries.length === 0) {
        throw new Error('No series could be fetched from TMDB. Please check your API key and internet connection.');
      }

      const seriesToImport = allSeries.slice(0, count);
      const importedSeries = [];
      let skippedCount = 0;

      for (const tmdbSeries of seriesToImport) {
        try {
          console.log(`\nProcessing series: ${tmdbSeries.name} (TMDB ID: ${tmdbSeries.id})`);
          
          // Get detailed series information for accurate episode counts and external IDs
          const detailedSeries = await this.getSeriesDetails(tmdbSeries.id);
          const seriesData = this.convertTmdbToMovie(detailedSeries, null, 'series');
          
          // Check for duplicates
          if (this.isDuplicateMovie(seriesData, existingMovies)) {
            console.log(`Skipping duplicate series: ${seriesData.title} (${seriesData.year})`);
            skippedCount++;
            continue;
          }

          const newSeries = new Movie(seriesData);
          await newSeries.save();
          importedSeries.push(newSeries);
          
          // Add to existing movies list for future duplicate checking
          existingMovies.push({
            title: seriesData.title,
            tmdbId: seriesData.tmdbId,
            imdbId: seriesData.imdbId,
            year: seriesData.year
          });
          
          console.log(`✅ Imported series: ${seriesData.title} (${seriesData.year}) - ${seriesData.seriesInfo.totalSeasons} seasons, ${seriesData.seriesInfo.totalEpisodes} episodes - AutoEmbed streaming`);
        } catch (error) {
          console.error(`❌ Error importing series ${tmdbSeries.name}:`, error.message);
          // Continue with other series
        }
      }

      console.log(`\n🎬 Series import complete: ${importedSeries.length} imported, ${skippedCount} skipped as duplicates`);
      return importedSeries;
    } catch (error) {
      console.error('Error importing series:', error.message);
      throw error;
    }
  }

  // Import animated content from TMDB to database with AutoEmbed streaming
  async importAnimatedToDatabase(count = 20, existingMovies = null, contentType = 'mixed') {
    try {
      this.checkApiKey();
      
      // Get existing movies if not provided
      if (!existingMovies) {
        existingMovies = await Movie.find({}, 'title tmdbId imdbId year').lean();
      }
      
      console.log(`Starting animated content import with ${existingMovies.length} existing items for duplicate checking`);
      
      const allAnimated = [];
      const pages = Math.ceil(count / 20);

      // Fetch both animated movies and series
      if (contentType === 'mixed' || contentType === 'movies') {
        for (let page = 1; page <= Math.ceil(pages / 2); page++) {
          try {
            const animatedMovies = await this.fetchAnimatedContent(page, 'movie');
            allAnimated.push(...animatedMovies.map(item => ({ ...item, contentType: 'animated' })));
          } catch (error) {
            console.error(`Error fetching animated movies page ${page}:`, error.message);
          }
        }
      }

      if (contentType === 'mixed' || contentType === 'series') {
        for (let page = 1; page <= Math.ceil(pages / 2); page++) {
          try {
            const animatedSeries = await this.fetchAnimatedContent(page, 'tv');
            allAnimated.push(...animatedSeries.map(item => ({ ...item, contentType: 'animated' })));
          } catch (error) {
            console.error(`Error fetching animated series page ${page}:`, error.message);
          }
        }
      }

      if (allAnimated.length === 0) {
        throw new Error('No animated content could be fetched from TMDB. Please check your API key and internet connection.');
      }

      // Sort by popularity and take the requested count
      const animatedToImport = allAnimated
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        .slice(0, count);

      const importedAnimated = [];
      let skippedCount = 0;

      for (const tmdbAnimated of animatedToImport) {
        try {
          const animatedData = this.convertTmdbToMovie(tmdbAnimated, null, 'animated');
          
          // Check for duplicates
          if (this.isDuplicateMovie(animatedData, existingMovies)) {
            console.log(`Skipping duplicate animated content: ${animatedData.title} (${animatedData.year})`);
            skippedCount++;
            continue;
          }

          const newAnimated = new Movie(animatedData);
          await newAnimated.save();
          importedAnimated.push(newAnimated);
          
          // Add to existing movies list for future duplicate checking
          existingMovies.push({
            title: animatedData.title,
            tmdbId: animatedData.tmdbId,
            imdbId: animatedData.imdbId,
            year: animatedData.year
          });
          
          console.log(`Imported animated: ${animatedData.title} (${animatedData.year}) - AutoEmbed streaming`);
        } catch (error) {
          console.error(`Error importing animated content ${tmdbAnimated.title || tmdbAnimated.name}:`, error.message);
          // Continue with other content
        }
      }

      console.log(`Animated import complete: ${importedAnimated.length} imported, ${skippedCount} skipped as duplicates`);
      return importedAnimated;
    } catch (error) {
      console.error('Error importing animated content:', error.message);
      throw error;
    }
  }

  // Import high-rated movies with AutoEmbed streaming
  async importHighRatedMovies(count = 20, existingMovies = null) {
    try {
      this.checkApiKey();
      
      // Get existing movies if not provided
      if (!existingMovies) {
        existingMovies = await Movie.find({}, 'title tmdbId imdbId year').lean();
      }
      
      console.log(`Starting top-rated import with ${existingMovies.length} existing movies for duplicate checking`);
      
      const response = await axios.get(`${this.TMDB_BASE_URL}/movie/top_rated`, {
        params: {
          api_key: this.TMDB_API_KEY,
          page: 1
        },
        timeout: 10000
      });

      const topRatedMovies = response.data.results || [];
      const moviesToImport = topRatedMovies.slice(0, count);
      const importedMovies = [];
      let skippedCount = 0;

      for (const tmdbMovie of moviesToImport) {
        try {
          // Get detailed movie info including external IDs
          const detailedMovie = await this.getMovieDetails(tmdbMovie.id);
          const movieData = this.convertTmdbToMovie(detailedMovie, null, 'movie');
          
          // Check for duplicates
          if (this.isDuplicateMovie(movieData, existingMovies)) {
            console.log(`Skipping duplicate top-rated: ${movieData.title} (${movieData.year})`);
            skippedCount++;
            continue;
          }

          const newMovie = new Movie(movieData);
          await newMovie.save();
          importedMovies.push(newMovie);
          
          // Add to existing movies list for future duplicate checking
          existingMovies.push({
            title: movieData.title,
            tmdbId: movieData.tmdbId,
            imdbId: movieData.imdbId,
            year: movieData.year
          });
          
          console.log(`Imported top-rated: ${movieData.title} (${movieData.year}) - AutoEmbed streaming`);
        } catch (error) {
          console.error(`Error importing movie ${tmdbMovie.title}:`, error.message);
          // Continue with other movies
        }
      }

      console.log(`Top-rated import complete: ${importedMovies.length} imported, ${skippedCount} skipped as duplicates`);
      return importedMovies;
    } catch (error) {
      console.error('Error importing high-rated movies:', error.message);
      throw error;
    }
  }
}

export default new MovieService();
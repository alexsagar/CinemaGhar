import express from 'express';
import movieService from '../services/movieService.js';
import Movie from '../../models/Movie.js';
import { adminAuth } from '../../middleware/auth.js';


const router = express.Router();

// Test TMDB API connection
router.get('/test-tmdb', adminAuth, async (req, res) => {
  try {
    if (!process.env.TMDB_API_KEY) {
      return res.status(400).json({ 
        success: false,
        message: 'TMDB API key is not configured. Please add TMDB_API_KEY to your environment variables.'
      });
    }

    // Test the API key by making a simple request
    const movies = await movieService.fetchPopularMovies(1);
    res.json({
      success: true,
      message: `TMDB API connection successful! Found ${movies.length} popular movies.`,
      movieCount: movies.length,
      sampleMovie: movies[0]?.title || 'No movies found'
    });
  } catch (error) {
    console.error('TMDB test error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'TMDB API connection failed', 
      error: error.name || 'Connection Error'
    });
  }
});

// Find and remove duplicate movies
router.post('/remove-duplicates', adminAuth, async (req, res) => {
  try {
    console.log('Starting duplicate movie detection and removal...');
    
    // Get all movies from database
    const allMovies = await Movie.find({}).sort({ createdAt: 1 }); // Sort by creation date, keep oldest
    console.log(`Found ${allMovies.length} total movies in database`);
    
    if (allMovies.length === 0) {
      return res.json({
        message: 'No movies found in database',
        duplicatesFound: 0,
        duplicatesRemoved: 0,
        moviesKept: 0
      });
    }

    const duplicateGroups = [];
    const processedMovies = new Set();
    
    // Group movies by potential duplicates
    for (let i = 0; i < allMovies.length; i++) {
      const movie1 = allMovies[i];
      
      if (processedMovies.has(movie1._id.toString())) {
        continue;
      }
      
      const duplicates = [movie1];
      processedMovies.add(movie1._id.toString());
      
      // Find duplicates of this movie
      for (let j = i + 1; j < allMovies.length; j++) {
        const movie2 = allMovies[j];
        
        if (processedMovies.has(movie2._id.toString())) {
          continue;
        }
        
        if (areMoviesDuplicate(movie1, movie2)) {
          duplicates.push(movie2);
          processedMovies.add(movie2._id.toString());
        }
      }
      
      if (duplicates.length > 1) {
        duplicateGroups.push(duplicates);
      }
    }
    
    console.log(`Found ${duplicateGroups.length} groups of duplicates`);
    
    let totalDuplicatesRemoved = 0;
    const removalDetails = [];
    
    // Remove duplicates (keep the first/oldest one in each group)
    for (const group of duplicateGroups) {
      const [keepMovie, ...removeMovies] = group;
      
      console.log(`Duplicate group for "${keepMovie.title}":`);
      console.log(`  Keeping: ${keepMovie._id} (created: ${keepMovie.createdAt})`);
      
      const removedIds = [];
      for (const movieToRemove of removeMovies) {
        console.log(`  Removing: ${movieToRemove._id} (created: ${movieToRemove.createdAt})`);
        await Movie.findByIdAndDelete(movieToRemove._id);
        removedIds.push(movieToRemove._id);
        totalDuplicatesRemoved++;
      }
      
      removalDetails.push({
        title: keepMovie.title,
        kept: keepMovie._id,
        removed: removedIds,
        duplicateCount: removeMovies.length
      });
    }
    
    const finalCount = await Movie.countDocuments();
    
    res.json({
      message: `Successfully removed ${totalDuplicatesRemoved} duplicate movies`,
      duplicateGroupsFound: duplicateGroups.length,
      duplicatesRemoved: totalDuplicatesRemoved,
      moviesKept: finalCount,
      originalCount: allMovies.length,
      details: removalDetails
    });
    
  } catch (error) {
    console.error('Error removing duplicates:', error);
    res.status(500).json({ 
      message: error.message || 'Error removing duplicate movies', 
      error: error.name || 'Duplicate Removal Error'
    });
  }
});

// Get duplicate movies report (without removing)
router.get('/find-duplicates', adminAuth, async (req, res) => {
  try {
    console.log('Scanning for duplicate movies...');
    
    const allMovies = await Movie.find({}).sort({ createdAt: 1 });
    console.log(`Scanning ${allMovies.length} movies for duplicates`);
    
    if (allMovies.length === 0) {
      return res.json({
        message: 'No movies found in database',
        duplicateGroups: [],
        totalDuplicates: 0
      });
    }

    const duplicateGroups = [];
    const processedMovies = new Set();
    
    for (let i = 0; i < allMovies.length; i++) {
      const movie1 = allMovies[i];
      
      if (processedMovies.has(movie1._id.toString())) {
        continue;
      }
      
      const duplicates = [movie1];
      processedMovies.add(movie1._id.toString());
      
      for (let j = i + 1; j < allMovies.length; j++) {
        const movie2 = allMovies[j];
        
        if (processedMovies.has(movie2._id.toString())) {
          continue;
        }
        
        if (areMoviesDuplicate(movie1, movie2)) {
          duplicates.push(movie2);
          processedMovies.add(movie2._id.toString());
        }
      }
      
      if (duplicates.length > 1) {
        duplicateGroups.push({
          title: movie1.title,
          count: duplicates.length,
          movies: duplicates.map(m => ({
            id: m._id,
            title: m.title,
            year: m.year,
            tmdbId: m.tmdbId,
            createdAt: m.createdAt,
            category: m.category
          }))
        });
      }
    }
    
    const totalDuplicates = duplicateGroups.reduce((sum, group) => sum + (group.count - 1), 0);
    
    res.json({
      message: `Found ${duplicateGroups.length} groups with ${totalDuplicates} duplicate movies`,
      duplicateGroups,
      totalDuplicates,
      totalMovies: allMovies.length
    });
    
  } catch (error) {
    console.error('Error finding duplicates:', error);
    res.status(500).json({ 
      message: error.message || 'Error finding duplicate movies', 
      error: error.name || 'Duplicate Detection Error'
    });
  }
});

// Helper function to determine if two movies are duplicates
function areMoviesDuplicate(movie1, movie2) {
  // Normalize strings for comparison
  const normalize = (str) => {
    if (!str) return '';
    return str.toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ')    // Normalize whitespace
      .trim();
  };
  
  const title1 = normalize(movie1.title);
  const title2 = normalize(movie2.title);
  
  // Check 1: Exact title match
  if (title1 === title2) {
    // If titles match, check year (if available)
    if (movie1.year && movie2.year) {
      return Math.abs(movie1.year - movie2.year) <= 1; // Allow 1 year difference
    }
    return true; // Same title, no year info
  }
  
  // Check 2: TMDB ID match (most reliable)
  if (movie1.tmdbId && movie2.tmdbId && movie1.tmdbId === movie2.tmdbId) {
    return true;
  }
  
  // Check 3: IMDB ID match
  if (movie1.imdbId && movie2.imdbId && movie1.imdbId === movie2.imdbId) {
    return true;
  }
  
  // Check 4: Very similar titles (fuzzy matching)
  if (title1.length > 3 && title2.length > 3) {
    const similarity = calculateStringSimilarity(title1, title2);
    if (similarity > 0.9) { // 90% similarity
      // If very similar titles, check year
      if (movie1.year && movie2.year) {
        return Math.abs(movie1.year - movie2.year) <= 1;
      }
      return true;
    }
  }
  
  return false;
}

// Calculate string similarity using Levenshtein distance
function calculateStringSimilarity(str1, str2) {
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
        matrix[j - 1][i] + 1,     // deletion
        matrix[j][i - 1] + 1,     // insertion
        matrix[j - 1][i - 1] + cost // substitution
      );
    }
  }
  
  const maxLen = Math.max(len1, len2);
  return (maxLen - matrix[len2][len1]) / maxLen;
}

// Import movies from TMDB with VidSrc.xyz streaming (with duplicate prevention)
router.post('/import-movies', adminAuth, async (req, res) => {
  try {
    const { count = 20 } = req.body;
    
    // Check if TMDB API key is configured
    if (!process.env.TMDB_API_KEY) {
      return res.status(400).json({ 
        message: 'TMDB API key is not configured. Please add TMDB_API_KEY to your environment variables.',
        error: 'Missing API Key'
      });
    }
    
    console.log(`Starting import of ${count} movies with VidSrc.xyz streaming and duplicate prevention...`);
    
    // Get existing movies for duplicate checking
    const existingMovies = await Movie.find({}, 'title tmdbId imdbId year').lean();
    console.log(`Found ${existingMovies.length} existing movies in database`);
    
    const importedMovies = await movieService.importMoviesToDatabase(count, existingMovies);
    
    res.json({
      message: `Successfully imported ${importedMovies.length} new movies with VidSrc.xyz streaming`,
      movies: importedMovies,
      count: importedMovies.length,
      skippedDuplicates: count - importedMovies.length
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ 
      message: error.message || 'Error importing movies', 
      error: error.name || 'Import Error'
    });
  }
});

// Import TV series from TMDB with VidSrc.xyz streaming and accurate episode data
router.post('/import-series', adminAuth, async (req, res) => {
  try {
    const { count = 20, type = 'popular' } = req.body;
    
    // Check if TMDB API key is configured
    if (!process.env.TMDB_API_KEY) {
      return res.status(400).json({ 
        message: 'TMDB API key is not configured. Please add TMDB_API_KEY to your environment variables.',
        error: 'Missing API Key'
      });
    }
    
    console.log(`\n🎬 Starting import of ${count} ${type} TV series with VidSrc.xyz streaming and enhanced episode data...`);
    
    // Get existing content for duplicate checking
    const existingMovies = await Movie.find({}, 'title tmdbId imdbId year').lean();
    console.log(`📊 Found ${existingMovies.length} existing items in database for duplicate checking`);
    
    const importedSeries = await movieService.importSeriesToDatabase(count, existingMovies, type);
    
    // Log detailed results
    console.log(`\n✅ Series import completed successfully!`);
    console.log(`📺 Imported: ${importedSeries.length} new series`);
    console.log(`⏭️  Skipped: ${count - importedSeries.length} duplicates`);
    
    if (importedSeries.length > 0) {
      console.log(`\n📋 Sample imported series:`);
      importedSeries.slice(0, 3).forEach(series => {
        console.log(`  • ${series.title} - ${series.seriesInfo?.totalSeasons || 1}S/${series.seriesInfo?.totalEpisodes || 1}E`);
      });
    }
    
    res.json({
      message: `Successfully imported ${importedSeries.length} new TV series with VidSrc.xyz streaming and accurate episode data`,
      series: importedSeries,
      count: importedSeries.length,
      skippedDuplicates: count - importedSeries.length,
      details: importedSeries.map(s => ({
        title: s.title,
        seasons: s.seriesInfo?.totalSeasons || 1,
        episodes: s.seriesInfo?.totalEpisodes || 1,
        status: s.seriesInfo?.status || 'unknown'
      }))
    });
  } catch (error) {
    console.error('❌ Import series error:', error);
    res.status(500).json({ 
      message: error.message || 'Error importing TV series', 
      error: error.name || 'Import Error'
    });
  }
});

// Import animated content from TMDB with RiveStream streaming (unchanged)
router.post('/import-animated', adminAuth, async (req, res) => {
  try {
    const { count = 20, contentType = 'mixed' } = req.body;
    
    // Check if TMDB API key is configured
    if (!process.env.TMDB_API_KEY) {
      return res.status(400).json({ 
        message: 'TMDB API key is not configured. Please add TMDB_API_KEY to your environment variables.',
        error: 'Missing API Key'
      });
    }
    
    console.log(`Starting import of ${count} animated content (${contentType}) with RiveStream streaming and duplicate prevention...`);
    
    // Get existing content for duplicate checking
    const existingMovies = await Movie.find({}, 'title tmdbId imdbId year').lean();
    console.log(`Found ${existingMovies.length} existing items in database`);
    
    const importedAnimated = await movieService.importAnimatedToDatabase(count, existingMovies, contentType);
    
    res.json({
      message: `Successfully imported ${importedAnimated.length} new animated content with RiveStream streaming`,
      animated: importedAnimated,
      count: importedAnimated.length,
      skippedDuplicates: count - importedAnimated.length
    });
  } catch (error) {
    console.error('Import animated error:', error);
    res.status(500).json({ 
      message: error.message || 'Error importing animated content', 
      error: error.name || 'Import Error'
    });
  }
});

// Import top-rated movies from TMDB with VidSrc.xyz streaming (with duplicate prevention)
router.post('/import-top-rated', adminAuth, async (req, res) => {
  try {
    const { count = 20 } = req.body;
    
    // Check if TMDB API key is configured
    if (!process.env.TMDB_API_KEY) {
      return res.status(400).json({ 
        message: 'TMDB API key is not configured. Please add TMDB_API_KEY to your environment variables.',
        error: 'Missing API Key'
      });
    }
    
    console.log(`Starting import of ${count} top-rated movies with VidSrc.xyz streaming and duplicate prevention...`);
    
    // Get existing movies for duplicate checking
    const existingMovies = await Movie.find({}, 'title tmdbId imdbId year').lean();
    console.log(`Found ${existingMovies.length} existing movies in database`);
    
    const importedMovies = await movieService.importHighRatedMovies(count, existingMovies);
    
    res.json({
      message: `Successfully imported ${importedMovies.length} new top-rated movies with VidSrc.xyz streaming`,
      movies: importedMovies,
      count: importedMovies.length,
      skippedDuplicates: count - importedMovies.length
    });
  } catch (error) {
    console.error('Import top-rated error:', error);
    res.status(500).json({ 
      message: error.message || 'Error importing top-rated movies', 
      error: error.name || 'Import Error'
    });
  }
});

// Search movies from TMDB
router.get('/search-tmdb', adminAuth, async (req, res) => {
  try {
    const { query, page = 1, type = 'movie' } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    if (!process.env.TMDB_API_KEY) {
      return res.status(400).json({ 
        message: 'TMDB API key is not configured. Please add TMDB_API_KEY to your environment variables.'
      });
    }

    let results;
    if (type === 'series') {
      results = await movieService.searchSeries(query, page);
    } else {
      results = await movieService.searchMovies(query, page);
    }
    
    const convertedResults = results.map(item => movieService.convertTmdbToMovie(item, null, type));
    
    res.json(convertedResults);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      message: error.message || 'Error searching content', 
      error: error.name || 'Search Error'
    });
  }
});

// Get popular movies from TMDB
router.get('/popular-tmdb', adminAuth, async (req, res) => {
  try {
    const { page = 1 } = req.query;
    
    if (!process.env.TMDB_API_KEY) {
      return res.status(400).json({ 
        message: 'TMDB API key is not configured. Please add TMDB_API_KEY to your environment variables.'
      });
    }

    const movies = await movieService.fetchPopularMovies(page);
    const convertedMovies = movies.map(movie => movieService.convertTmdbToMovie(movie));
    
    res.json(convertedMovies);
  } catch (error) {
    console.error('Popular movies error:', error);
    res.status(500).json({ 
      message: error.message || 'Error fetching popular movies', 
      error: error.name || 'Fetch Error'
    });
  }
});

// Add movie from TMDB to database (with duplicate checking and enhanced series support)
router.post('/add-from-tmdb', adminAuth, async (req, res) => {
  try {
    const { tmdbId, customVideoUrl, contentType = 'movie' } = req.body;
    
    if (!process.env.TMDB_API_KEY) {
      return res.status(400).json({ 
        message: 'TMDB API key is not configured. Please add TMDB_API_KEY to your environment variables.'
      });
    }
    
    // Check if content already exists by TMDB ID
    const existingContent = await Movie.findOne({ tmdbId: tmdbId });
    if (existingContent) {
      return res.status(400).json({ 
        message: 'Content already exists in database',
        existingContent: {
          id: existingContent._id,
          title: existingContent.title,
          year: existingContent.year,
          contentType: existingContent.contentType
        }
      });
    }
    
    let contentDetails;
    if (contentType === 'series') {
      console.log(`Fetching detailed series information for TMDB ID: ${tmdbId}`);
      contentDetails = await movieService.getSeriesDetails(tmdbId);
    } else {
      contentDetails = await movieService.getMovieDetails(tmdbId);
    }
    
    const contentData = movieService.convertTmdbToMovie(contentDetails, customVideoUrl, contentType);
    
    // Double-check for duplicates by title and year
    const titleDuplicate = await Movie.findOne({
      title: { $regex: new RegExp(`^${contentData.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      year: contentData.year
    });
    
    if (titleDuplicate) {
      return res.status(400).json({ 
        message: 'Content with same title and year already exists',
        existingContent: {
          id: titleDuplicate._id,
          title: titleDuplicate.title,
          year: titleDuplicate.year,
          contentType: titleDuplicate.contentType
        }
      });
    }
    
    const newContent = new Movie(contentData);
    await newContent.save();
    
    console.log(`✅ Successfully added ${contentType}: ${contentData.title} with ${contentType === 'animated' ? 'RiveStream' : 'VidSrc.xyz'} streaming`);
    if (contentType === 'series' && contentData.seriesInfo) {
      console.log(`   📺 Series details: ${contentData.seriesInfo.totalSeasons} seasons, ${contentData.seriesInfo.totalEpisodes} episodes`);
    }
    
    res.status(201).json(newContent);
  } catch (error) {
    console.error('Add content error:', error);
    res.status(500).json({ 
      message: error.message || 'Error adding content from TMDB', 
      error: error.name || 'Add Content Error'
    });
  }
});

// Test VidSrc.xyz availability
router.get('/test-vidsrc/:tmdbId', adminAuth, async (req, res) => {
  try {
    const { tmdbId } = req.params;
    const { type = 'movie', imdbId } = req.query;
    const availabilityResults = await movieService.testVidsrcAvailability(parseInt(tmdbId), imdbId, type);
    
    res.json({ 
      tmdbId: parseInt(tmdbId),
      imdbId: imdbId,
      results: availabilityResults,
      streamingUrl: movieService.generateStreamingUrl(tmdbId, imdbId, type),
      sources: movieService.generateStreamingSources(tmdbId, imdbId, type)
    });
  } catch (error) {
    console.error('VidSrc.xyz test error:', error);
    res.status(500).json({ 
      message: error.message || 'Error testing VidSrc.xyz availability', 
      error: error.name || 'Test Error'
    });
  }
});

export default router;
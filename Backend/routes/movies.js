import express from 'express';
import Movie from '../models/Movie.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// Get all movies
router.get('/', async (req, res) => {
  try {
    const { category, search, contentType } = req.query;
    let query = {};

    if (category && category !== 'all') {
      query.category = category;
    }

    if (contentType && contentType !== 'all') {
      query.contentType = contentType;
    }

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const movies = await Movie.find(query).sort({ createdAt: -1 });
    res.json(movies);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single movie
router.get('/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    res.json(movie);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create movie (admin only)
router.post('/', async (req, res) => {
  try {
    console.log('Creating movie with data:', JSON.stringify(req.body, null, 2));
    
    // Check if movie with this tmdbId already exists
    if (req.body.tmdbId) {
      const existingMovie = await Movie.findOne({ tmdbId: req.body.tmdbId });
      if (existingMovie) {
        console.log(`Movie with tmdbId ${req.body.tmdbId} already exists, skipping...`);
        return res.status(200).json({ 
          message: 'Movie already exists', 
          movie: existingMovie,
          skipped: true 
        });
      }
    }
    
    const movie = new Movie(req.body);
    await movie.save();
    res.status(201).json(movie);
  } catch (error) {
    console.error('Error creating movie:', error);
    if (error.name === 'ValidationError') {
      console.error('Validation errors:', Object.values(error.errors).map(err => err.message));
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    if (error.code === 11000) {
      // Duplicate key error
      console.log('Duplicate key error, movie likely already exists');
      return res.status(200).json({ 
        message: 'Movie already exists', 
        skipped: true 
      });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update movie (admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    
    res.json(movie);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete movie (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    res.json({ message: 'Movie deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
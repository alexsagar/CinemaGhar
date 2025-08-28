import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Info, RefreshCw, Star, Clock, Film } from 'lucide-react';
import MovieCard from '../components/MovieCard';
import EmbedPlayer from '../components/EmbedPlayer';
import { apiClient } from '../lib/api';

const MoviePlayer = () => {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [streamChange, setStreamChange] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchMovie();
  }, [id]);

  useEffect(() => {
    if (movie) {
      fetchRecommendations();
    }
  }, [movie]);

  const fetchMovie = async () => {
    try {
      const response = await axios.get(`${API_URL}/movies/${id}`);
      setMovie(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching movie:', error);
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await axios.get(`${API_URL}/movies`);
      const allMovies = response.data || [];
      
      // Filter recommendations based on same category or high rating
      const filtered = allMovies
        .filter(m => m._id !== movie._id) // Exclude current movie
        .filter(m => 
          m.category === movie.category || // Same category
          (m.voteAverage && m.voteAverage >= 7) || // High rated
          m.contentType === 'series' // Include series
        )
        .sort((a, b) => (b.voteAverage || 0) - (a.voteAverage || 0)) // Sort by rating
        .slice(0, 8); // Limit to 8 recommendations

      setRecommendations(filtered);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const handleStreamChange = (changeData) => {
    setStreamChange(changeData);
    console.log('Stream changed:', changeData);
  };

  const handleRecheck = async () => {
    try {
      await apiClient.recheckMovie(id);
      // The EmbedPlayer will automatically fetch the new stream
      console.log('Content recheck queued successfully');
    } catch (error) {
      console.error('Error queuing recheck:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground">Loading movie...</p>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Movie not found</h2>
          <p className="text-muted-foreground">The movie you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Header */}
      <div className="bg-card/95 backdrop-blur-sm border-b border-border sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link 
              to="/" 
              className="flex items-center gap-2 text-foreground hover:text-primary transition-colors duration-200 bg-muted hover:bg-muted/80 px-4 py-2 rounded-lg"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back to Home</span>
            </Link>
            
            <div className="text-center flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                {movie.title}
              </h1>
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground flex-wrap">
                <span>{movie.year}</span>
                {movie.duration && (
                  <div className="flex items-center gap-1">
                    <Clock size={16} />
                    <span>{movie.duration}</span>
                  </div>
                )}
                {movie.voteAverage && (
                  <div className="flex items-center gap-1 text-warning">
                    <Star size={16} className="fill-current" />
                    <span className="font-medium">{movie.voteAverage.toFixed(1)}</span>
                  </div>
                )}
                {movie.contentType && (
                  <div className="flex items-center gap-1">
                    <Film size={16} />
                    <span className="capitalize">{movie.contentType}</span>
                  </div>
                )}
              </div>
            </div>

            <Link
              to={`/info/${movie._id}`}
              className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200 px-4 py-2 rounded-lg font-medium"
            >
              <Info size={20} />
              <span>Details</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Video Player */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-black rounded-xl overflow-hidden shadow-2xl">
          <EmbedPlayer movieId={id} onStreamChange={handleStreamChange} />
        </div>
        
        {/* Recheck Section */}
        <div className="mt-6 text-center">
          <button 
            onClick={handleRecheck}
            className="inline-flex items-center gap-2 bg-muted hover:bg-muted/80 text-foreground px-6 py-3 rounded-lg font-medium transition-colors duration-200 border border-border"
          >
            <RefreshCw size={16} />
            Check for Better Quality
          </button>
          <p className="text-sm text-muted-foreground mt-2">
            Automatically checks for higher quality versions
          </p>
        </div>
      </div>

      {/* Movie Details */}
      <div className="bg-muted/30 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Poster */}
            <div className="lg:col-span-1">
              <div className="sticky top-32">
                <img
                  src={movie.posterURL || '/placeholder-poster.jpg'}
                  alt={movie.title}
                  className="w-full rounded-xl shadow-2xl"
                />
                
                {/* Badges */}
                <div className="mt-4 space-y-2">
                  {movie.quality && (
                    <div className="inline-block bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                      {movie.quality}
                    </div>
                  )}
                  {movie.voteAverage && (
                    <div className="inline-block bg-warning/20 text-warning border border-warning/30 px-3 py-1 rounded-full text-sm font-medium ml-2">
                      ⭐ {movie.voteAverage.toFixed(1)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {/* Title and Meta */}
                <div>
                  <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                    {movie.title}
                  </h2>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {movie.category && (
                      <span className="bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-full text-sm font-medium">
                        {movie.category}
                      </span>
                    )}
                    {movie.year && (
                      <span className="bg-muted text-foreground px-3 py-1 rounded-full text-sm font-medium">
                        {movie.year}
                      </span>
                    )}
                    {movie.contentType && (
                      <span className="bg-secondary/20 text-secondary-foreground border border-secondary/30 px-3 py-1 rounded-full text-sm font-medium">
                        {movie.contentType}
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                {movie.description && (
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">Synopsis</h3>
                    <p className="text-muted-foreground leading-relaxed text-base">
                      {movie.description}
                    </p>
                  </div>
                )}

                {/* Additional Info */}
                <div className="grid sm:grid-cols-2 gap-6">
                  {movie.duration && (
                    <div className="bg-card p-4 rounded-lg border border-border">
                      <h4 className="font-medium text-foreground mb-2">Duration</h4>
                      <p className="text-muted-foreground">{movie.duration}</p>
                    </div>
                  )}
                  
                  {movie.category && (
                    <div className="bg-card p-4 rounded-lg border border-border">
                      <h4 className="font-medium text-foreground mb-2">Category</h4>
                      <p className="text-muted-foreground capitalize">{movie.category}</p>
                    </div>
                  )}
                  
                  {movie.voteAverage && (
                    <div className="bg-card p-4 rounded-lg border border-border">
                      <h4 className="font-medium text-foreground mb-2">Rating</h4>
                      <div className="flex items-center gap-2">
                        <Star size={20} className="fill-warning text-warning" />
                        <span className="text-warning font-medium">{movie.voteAverage.toFixed(1)}</span>
                      </div>
                    </div>
                  )}
                  
                  {movie.contentType && (
                    <div className="bg-card p-4 rounded-lg border border-border">
                      <h4 className="font-medium text-foreground mb-2">Type</h4>
                      <p className="text-muted-foreground capitalize">{movie.contentType}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-muted/30 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground text-center mb-8">
              You Might Also Like
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {recommendations.map((rec) => (
                <MovieCard key={rec._id} movie={rec} variant="compact" />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoviePlayer;
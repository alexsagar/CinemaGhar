import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Play, Star, Calendar, Clock, Tag, Download, ExternalLink, Share2, Heart, Plus } from 'lucide-react';

const MovieInfo = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchMovie();
    checkWatchlist();
  }, [id]);

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

  const checkWatchlist = () => {
    const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
    setIsInWatchlist(watchlist.includes(id));
  };

  const toggleWatchlist = () => {
    const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
    let newWatchlist;
    
    if (isInWatchlist) {
      newWatchlist = watchlist.filter(movieId => movieId !== id);
    } else {
      newWatchlist = [...watchlist, id];
    }
    
    localStorage.setItem('watchlist', JSON.stringify(newWatchlist));
    setIsInWatchlist(!isInWatchlist);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: movie.title,
          text: movie.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const getStreamingSources = () => {
    if (movie?.tmdbId) {
      return [
        {
          name: 'AutoEmbed (Primary)',
          url: `https://autoembed.co/movie/tmdb/${movie.tmdbId}`,
          description: 'High-quality streaming with auto source selection',
          type: 'primary'
        },
        {
          name: '2Embed',
          url: `https://www.2embed.cc/embed/tmdb/movie?id=${movie.tmdbId}`,
          description: 'Alternative streaming source',
          type: 'secondary'
        },
        {
          name: 'MultiEmbed',
          url: `https://multiembed.mov/?video_id=${movie.tmdbId}&tmdb=1`,
          description: 'Multiple server sources',
          type: 'tertiary'
        },
        {
          name: 'Embed.su',
          url: `https://embed.su/embed/movie/${movie.tmdbId}`,
          description: 'Backup streaming source',
          type: 'backup'
        }
      ];
    }
    return [];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground">Loading movie information...</p>
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

  const streamingSources = getStreamingSources();

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Back Button */}
      <div className="bg-card/95 backdrop-blur-sm border-b border-border sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-foreground hover:text-primary transition-colors duration-200 bg-muted hover:bg-muted/80 px-4 py-2 rounded-lg"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Back to Home</span>
          </Link>
        </div>
      </div>

      {/* Movie Info Section */}
      <div className="bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Movie Poster */}
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

            {/* Movie Information */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {/* Title and Meta */}
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                    {movie.title}
                  </h1>
                  
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
                      <div className="flex items-center gap-2">
                        <Clock size={20} className="text-muted-foreground" />
                        <p className="text-muted-foreground">{movie.duration}</p>
                      </div>
                    </div>
                  )}
                  
                  {movie.category && (
                    <div className="bg-card p-4 rounded-lg border border-border">
                      <h4 className="font-medium text-foreground mb-2">Category</h4>
                      <div className="flex items-center gap-2">
                        <Tag size={20} className="text-muted-foreground" />
                        <p className="text-muted-foreground capitalize">{movie.category}</p>
                      </div>
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
                  
                  {movie.year && (
                    <div className="bg-card p-4 rounded-lg border border-border">
                      <h4 className="font-medium text-foreground mb-2">Release Year</h4>
                      <div className="flex items-center gap-2">
                        <Calendar size={20} className="text-muted-foreground" />
                        <p className="text-muted-foreground">{movie.year}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons Section */}
      <div className="bg-card/50 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to={`/movie/${movie._id}`}
              className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200 px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl"
            >
              <Play size={20} />
              Watch Now
            </Link>
            
            <button
              onClick={toggleWatchlist}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl ${
                isInWatchlist
                  ? 'bg-success text-success-foreground hover:bg-success/90'
                  : 'bg-muted text-foreground hover:bg-muted/80 border border-border'
              }`}
            >
              {isInWatchlist ? <Heart size={20} className="fill-current" /> : <Plus size={20} />}
              {isInWatchlist ? 'Added to Watchlist' : 'Add to Watchlist'}
            </button>
            
            <button
              onClick={handleShare}
              className="flex items-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors duration-200 px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl"
            >
              <Share2 size={20} />
              Share
            </button>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="bg-muted/30 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="bg-card p-6 rounded-xl border border-border">
                <h2 className="text-2xl font-bold text-foreground mb-6">About</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-border">
                    <span className="text-muted-foreground">Title</span>
                    <span className="text-foreground font-medium">{movie.title}</span>
                  </div>
                  {movie.year && (
                    <div className="flex justify-between items-center py-3 border-b border-border">
                      <span className="text-muted-foreground">Release Year</span>
                      <span className="text-foreground font-medium">{movie.year}</span>
                    </div>
                  )}
                  {movie.category && (
                    <div className="flex justify-between items-center py-3 border-b border-border">
                      <span className="text-muted-foreground">Category</span>
                      <span className="text-foreground font-medium capitalize">{movie.category}</span>
                    </div>
                  )}
                  {movie.contentType && (
                    <div className="flex justify-between items-center py-3 border-b border-border">
                      <span className="text-muted-foreground">Content Type</span>
                      <span className="text-foreground font-medium capitalize">{movie.contentType}</span>
                    </div>
                  )}
                  {movie.voteAverage && (
                    <div className="flex justify-between items-center py-3 border-b border-border">
                      <span className="text-muted-foreground">Rating</span>
                      <div className="flex items-center gap-2">
                        <Star size={16} className="fill-warning text-warning" />
                        <span className="text-foreground font-medium">{movie.voteAverage.toFixed(1)}</span>
                      </div>
                    </div>
                  )}
                  {movie.duration && (
                    <div className="flex justify-between items-center py-3 border-b border-border">
                      <span className="text-muted-foreground">Duration</span>
                      <span className="text-foreground font-medium">{movie.duration}</span>
                    </div>
                  )}
                  {movie.description && (
                    <div className="flex justify-between items-start py-3">
                      <span className="text-muted-foreground">Description</span>
                      <span className="text-foreground font-medium text-right max-w-md">{movie.description}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                {/* Quick Actions */}
                <div className="bg-card p-6 rounded-xl border border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Link
                      to={`/movie/${movie._id}`}
                      className="flex items-center gap-3 w-full p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors duration-200"
                    >
                      <Play size={20} />
                      <span className="font-medium">Play Movie</span>
                    </Link>
                    
                    <button
                      onClick={toggleWatchlist}
                      className={`flex items-center gap-3 w-full p-3 rounded-lg transition-colors duration-200 ${
                        isInWatchlist
                          ? 'bg-success text-success-foreground'
                          : 'bg-muted text-foreground hover:bg-muted/80'
                      }`}
                    >
                      {isInWatchlist ? <Heart size={20} className="fill-current" /> : <Plus size={20} />}
                      <span className="font-medium">
                        {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* External Links */}
                {movie.tmdbId && (
                  <div className="bg-card p-6 rounded-xl border border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-4">External Links</h3>
                    <div className="space-y-3">
                      <a
                        href={`https://www.themoviedb.org/movie/${movie.tmdbId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 w-full p-3 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors duration-200"
                      >
                        <ExternalLink size={20} />
                        <span className="font-medium">TMDB</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Streaming Section */}
      {streamingSources.length > 0 && (
        <div className="bg-card/50 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h2 className="text-2xl font-bold text-foreground text-center mb-8">Streaming Sources</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {streamingSources.map((source, index) => (
                <div
                  key={index}
                  className={`p-6 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                    source.type === 'primary'
                      ? 'border-primary bg-primary/10'
                      : source.type === 'secondary'
                      ? 'border-secondary bg-secondary/10'
                      : source.type === 'tertiary'
                      ? 'border-success bg-success/10'
                      : 'border-warning bg-warning/10'
                  }`}
                >
                  <div className="text-center">
                    <h3 className="font-semibold text-foreground mb-2">{source.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{source.description}</p>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-foreground text-background hover:bg-foreground/90 transition-colors duration-200 px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      <ExternalLink size={16} />
                      Open
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieInfo;
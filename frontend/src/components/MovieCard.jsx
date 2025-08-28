import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Heart, Info, Star, Clock, Film } from 'lucide-react';
import { cn, formatDuration, formatYear, truncateText } from '../lib/utils';

const MovieCard = ({ 
  movie, 
  variant = 'default',
  showActions = true,
  showRating = true,
  className = '' 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  const handleAddToWatchlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsInWatchlist(!isInWatchlist);
    // TODO: Implement actual watchlist functionality
  };

  const getContentTypeIcon = (contentType) => {
    switch (contentType) {
      case 'series':
        return <Film className="h-3 w-3" />;
      case 'animated':
        return <span className="text-xs">🎬</span>;
      default:
        return <Film className="h-3 w-3" />;
    }
  };

  const getContentTypeLabel = (contentType) => {
    switch (contentType) {
      case 'series':
        return 'TV Series';
      case 'animated':
        return 'Animated';
      default:
        return 'Movie';
    }
  };

  const renderRating = () => {
    if (!showRating || !movie.voteAverage) return null;
    
    return (
      <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1 z-10">
        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
        <span className="text-xs font-medium text-white">
          {movie.voteAverage.toFixed(1)}
        </span>
      </div>
    );
  };

  const renderContentTypeBadge = () => (
    <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1 z-10">
      {getContentTypeIcon(movie.contentType)}
      <span className="text-xs font-medium text-white">
        {getContentTypeLabel(movie.contentType)}
      </span>
    </div>
  );

  const renderQualityBadge = () => {
    if (!movie.quality) return null;
    
    return (
      <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded-full z-10">
        {movie.quality}
      </div>
    );
  };

  const renderDuration = () => {
    if (!movie.duration) return null;
    
    return (
      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span>{formatDuration(movie.duration)}</span>
      </div>
    );
  };

  const renderYear = () => {
    if (!movie.year) return null;
    
    return (
      <span className="text-xs text-muted-foreground">
        {formatYear(movie.year)}
      </span>
    );
  };

  const renderGenres = () => {
    if (!movie.category) return null;
    
    return (
      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
        <span className="bg-muted px-2 py-1 rounded-full border border-border">
          {movie.category}
        </span>
      </div>
    );
  };

  const getCardClasses = () => {
    const baseClasses = "group relative bg-card border border-border rounded-xl overflow-hidden transition-all duration-300 cursor-pointer hover:scale-105 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/20 hover:border-primary/30";
    
    switch (variant) {
      case 'compact':
        return cn(baseClasses, "h-80", className);
      case 'featured':
        return cn(baseClasses, "h-96", className);
      default:
        return cn(baseClasses, "h-[450px]", className);
    }
  };

  const getImageClasses = () => {
    switch (variant) {
      case 'compact':
        return "h-48";
      case 'featured':
        return "h-60";
      default:
        return "h-72";
    }
  };

  const getTitleClasses = () => {
    switch (variant) {
      case 'compact':
        return "text-sm font-semibold line-clamp-2";
      case 'featured':
        return "text-lg font-bold line-clamp-2";
      default:
        return "text-base font-semibold line-clamp-2";
    }
  };

  return (
    <div 
      className={getCardClasses()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className={cn("relative overflow-hidden bg-muted", getImageClasses())}>
        <img
          src={movie.posterURL || '/placeholder-poster.jpg'}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          loading="lazy"
        />
        
        {/* Overlay with actions */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          "flex flex-col justify-end p-4"
        )}>
          {showActions && (
            <div className="flex gap-2 mb-3">
              <Link
                to={`/movie/${movie._id}`}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200 rounded-lg px-3 py-2 text-sm font-medium text-center flex items-center justify-center gap-2"
              >
                <Play className="h-4 w-4" />
                Play
              </Link>
              <button
                onClick={handleAddToWatchlist}
                className={cn(
                  "p-2 rounded-lg border border-border hover:bg-muted transition-colors duration-200",
                  isInWatchlist ? "bg-destructive text-destructive-foreground border-destructive" : "bg-background/80 text-foreground"
                )}
              >
                <Heart className={cn("h-4 w-4", isInWatchlist && "fill-current")} />
              </button>
            </div>
          )}
        </div>

        {/* Badges */}
        {renderContentTypeBadge()}
        {renderRating()}
        {renderQualityBadge()}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col h-full">
        <div className="flex-1">
          <h3 className={cn("text-foreground mb-2", getTitleClasses())}>
            {movie.title}
          </h3>
          
          <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
            {renderYear()}
            {renderDuration()}
          </div>
          
          {renderGenres()}
          
          {movie.description && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
              {truncateText(movie.description, 80)}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto pt-3 border-t border-border">
          <div className="flex items-center justify-between text-xs">
            <span className="text-primary font-medium capitalize">
              {movie.category}
            </span>
            {movie.voteAverage && (
              <div className="flex items-center gap-1 text-warning">
                <Star className="h-3 w-3 fill-current" />
                <span className="font-medium">{movie.voteAverage.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
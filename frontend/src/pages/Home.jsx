import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { 
  Search, 
  Filter, 
  TrendingUp, 
  Clock, 
  Tv, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Star, 
  Film,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../lib/api';
import { cn, debounce } from '../lib/utils';
import MovieCard from '../components/MovieCard';
import MovieCardSkeleton from '../components/ui/MovieCardSkeleton';
import Skeleton from '../components/ui/Skeleton';

const Home = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedContentType, setSelectedContentType] = useState('all');

  // Get search query from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchParam = urlParams.get('search');
    const categoryParam = urlParams.get('category');
    
    if (searchParam) {
      setSearchTerm(searchParam);
      setSelectedCategory('all');
      setSelectedContentType('all');
    } else if (categoryParam) {
      setSelectedCategory(categoryParam);
      setSearchTerm('');
      setSelectedContentType('all');
    }
  }, [location.search]);

  // Fetch movies with React Query
  const { data: movies = [], isLoading, error } = useQuery({
    queryKey: ['movies', searchTerm, selectedCategory, selectedContentType],
    queryFn: () => apiClient.getMovies({
      search: searchTerm || undefined,
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      contentType: selectedContentType !== 'all' ? selectedContentType : undefined,
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Debounced search
  const debouncedSearch = debounce((value) => {
    setSearchTerm(value);
    if (value) {
      navigate(`/?search=${encodeURIComponent(value)}`);
    } else {
      navigate('/');
    }
  }, 300);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setSelectedCategory(category);
    setSearchTerm('');
    setSelectedContentType('all');
    
    if (category !== 'all') {
      navigate(`/?category=${category}`);
    } else {
      navigate('/');
    }
  };

  const handleContentTypeChange = (e) => {
    const contentType = e.target.value;
    setSelectedContentType(contentType);
    setSearchTerm('');
    setSelectedCategory('all');
    
    if (contentType !== 'all') {
      navigate(`/?contentType=${contentType}`);
    } else {
      navigate('/');
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedContentType('all');
    navigate('/');
  };

  // Categorize content
  const categorizeContent = () => {
    if (!movies.length) return {};

    const trending = movies
      .filter(movie => (movie.voteAverage || 0) >= 7)
      .sort((a, b) => (b.voteAverage || 0) - (a.voteAverage || 0))
      .slice(0, 12);

    const trendingMovies = trending.filter(movie => 
      movie.contentType === 'movie' || !movie.contentType
    );
    
    const trendingSeries = trending.filter(movie => 
      movie.contentType === 'series'
    );
    
    const trendingAnimated = trending.filter(movie => 
      movie.contentType === 'animated'
    );

    const popular = movies
      .sort((a, b) => (b.voteAverage || 0) - (a.voteAverage || 0))
      .slice(0, 12);

    const latest = movies
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 12);

    const action = movies
      .filter(movie => movie.category === 'Action')
      .slice(0, 12);

    const comedy = movies
      .filter(movie => movie.category === 'Comedy')
      .slice(0, 12);

    return {
      trendingMovies,
      trendingSeries,
      trendingAnimated,
      popular,
      latest,
      action,
      comedy
    };
  };

  const content = categorizeContent();
  const showSections = !searchTerm && selectedCategory === 'all' && selectedContentType === 'all';
  const hasActiveFilters = searchTerm || selectedCategory !== 'all' || selectedContentType !== 'all';

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-4">Error Loading Content</h2>
          <p className="text-muted-foreground mb-4">
            {error.message || 'Something went wrong while loading the content.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>StreamFlix - Unlimited Movies, TV Shows & More</title>
        <meta name="description" content="Watch unlimited movies, TV shows, and animated content. Stream anywhere, cancel anytime with StreamFlix." />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        {showSections && (
          <section className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background py-20">
            <div className="container mx-auto px-4 text-center">
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex justify-center">
                  <div className="bg-primary/10 p-4 rounded-full">
                    <Play className="h-16 w-16 text-primary" />
                  </div>
                </div>
                
                <h1 className="text-5xl md:text-6xl font-bold text-foreground">
                  StreamFlix
                </h1>
                
                <h2 className="text-2xl md:text-3xl font-semibold text-muted-foreground">
                  Unlimited movies, TV shows, and more
                </h2>
                
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  Watch anywhere. Cancel anytime. Stream thousands of movies, TV series, and animated content 
                  with high-quality video and audio. Discover new favorites and revisit classics 
                  in our extensive library of entertainment.
                </p>

                <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <Film className="h-5 w-5" />
                    <span>Movies</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Tv className="h-5 w-5" />
                    <span>TV Series</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-5 w-5" />
                    <span>Animated</span>
                  </div>
                </div>

                {user && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {movies.filter(m => m.contentType === 'movie' || !m.contentType).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Movies</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {movies.filter(m => m.contentType === 'series').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Series</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {movies.filter(m => m.contentType === 'animated').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Animated</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Filters Section */}
        <section className="py-6 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search movies, series, and more..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-2 bg-muted border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-3">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <select
                    value={selectedCategory}
                    onChange={handleCategoryChange}
                    className="pl-10 pr-8 py-2 bg-muted border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent appearance-none"
                  >
                    <option value="all">All Categories</option>
                    <option value="Action">Action</option>
                    <option value="Comedy">Comedy</option>
                    <option value="Drama">Drama</option>
                    <option value="Horror">Horror</option>
                    <option value="Romance">Romance</option>
                    <option value="Sci-Fi">Sci-Fi</option>
                    <option value="Thriller">Thriller</option>
                    <option value="Documentary">Documentary</option>
                    <option value="Animation">Animation</option>
                  </select>
                </div>

                <div className="relative">
                  <Film className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <select
                    value={selectedContentType}
                    onChange={handleContentTypeChange}
                    className="pl-10 pr-8 py-2 bg-muted border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent appearance-none"
                  >
                    <option value="all">All Types</option>
                    <option value="movie">Movies</option>
                    <option value="series">TV Series</option>
                    <option value="animated">Animated</option>
                  </select>
                </div>

                {/* Reset Filters */}
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="flex items-center space-x-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                  >
                    <X className="h-4 w-4" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            {isLoading ? (
              // Loading State
              <div className="space-y-8">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="h-8 w-48" />
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {[...Array(6)].map((_, j) => (
                        <MovieCardSkeleton key={j} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : showSections ? (
              // Categorized Sections
              <div className="space-y-12">
                {/* Trending Movies */}
                {content.trendingMovies?.length > 0 && (
                  <MovieSection
                    title="Trending Movies"
                    icon={<TrendingUp className="h-6 w-6" />}
                    movies={content.trendingMovies}
                    className="trending-movies"
                  />
                )}

                {/* Trending Series */}
                {content.trendingSeries?.length > 0 && (
                  <MovieSection
                    title="Trending TV Series"
                    icon={<Tv className="h-6 w-6" />}
                    movies={content.trendingSeries}
                    className="trending-series"
                  />
                )}

                {/* Trending Animated */}
                {content.trendingAnimated?.length > 0 && (
                  <MovieSection
                    title="Trending Animated"
                    icon={<Sparkles className="h-6 w-6" />}
                    movies={content.trendingAnimated}
                    className="trending-animated"
                  />
                )}

                {/* Popular Content */}
                {content.popular?.length > 0 && (
                  <MovieSection
                    title="Popular Now"
                    icon={<Star className="h-6 w-6" />}
                    movies={content.popular}
                    className="popular"
                  />
                )}

                {/* Latest Content */}
                {content.latest?.length > 0 && (
                  <MovieSection
                    title="New Releases"
                    icon={<Clock className="h-6 w-6" />}
                    movies={content.latest}
                    className="latest"
                  />
                )}

                {/* Action Content */}
                {content.action?.length > 0 && (
                  <MovieSection
                    title="Action & Adventure"
                    icon={<span className="text-2xl">💥</span>}
                    movies={content.action}
                    className="action"
                  />
                )}

                {/* Comedy Content */}
                {content.comedy?.length > 0 && (
                  <MovieSection
                    title="Comedy"
                    icon={<span className="text-2xl">😂</span>}
                    movies={content.comedy}
                    className="comedy"
                  />
                )}

                {/* Fallback: All Content */}
                {!content.trendingMovies?.length && !content.trendingSeries?.length && 
                 !content.trendingAnimated?.length && !content.popular?.length && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold">All Content</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {movies.map((movie) => (
                        <MovieCard key={movie._id} movie={movie} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Filtered Results
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">
                    {searchTerm ? `Search Results for "${searchTerm}"` : 
                     selectedCategory !== 'all' ? `${selectedCategory} Content` :
                     selectedContentType !== 'all' ? `${selectedContentType} Content` : 'Filtered Results'}
                  </h2>
                  <span className="text-muted-foreground">
                    {movies.length} result{movies.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {movies.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {movies.map((movie) => (
                      <MovieCard key={movie._id} movie={movie} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="max-w-md mx-auto space-y-4">
                      <div className="text-6xl">🔍</div>
                      <h3 className="text-xl font-semibold">No content found</h3>
                      <p className="text-muted-foreground">
                        Try adjusting your search terms or filters to find what you're looking for.
                      </p>
                      <button
                        onClick={resetFilters}
                        className="btn-primary"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
};

// Movie Section Component
const MovieSection = ({ title, icon, movies, className }) => {
  const sectionRef = React.useRef(null);

  const scrollLeft = () => {
    if (sectionRef.current) {
      sectionRef.current.scrollBy({ left: -400, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (sectionRef.current) {
      sectionRef.current.scrollBy({ left: 400, behavior: 'smooth' });
    }
  };

  return (
    <div className={`movie-section ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center space-x-3">
          {icon}
          <span>{title}</span>
        </h2>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={scrollLeft}
            className="p-2 rounded-full bg-muted hover:bg-accent transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={scrollRight}
            className="p-2 rounded-full bg-muted hover:bg-accent transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      <div 
        ref={sectionRef}
        className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {movies.map((movie) => (
          <div key={movie._id} className="flex-shrink-0 w-48">
            <MovieCard movie={movie} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
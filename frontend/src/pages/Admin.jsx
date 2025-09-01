import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, Film, BarChart3, Search, Star, RefreshCw, AlertTriangle, Tv, Sparkles, Filter, Globe, X, FileText, Video, TrendingUp, Database, Target, Download } from 'lucide-react';
import { cn } from '../lib/utils';
import { fetchPopularMovies, fetchPopularSeries, fetchAnimatedMovies } from '../lib/tmdb';
import { apiClient } from '../lib/api';
import { generateSEPlayerUrl } from '../lib/utils';

const Admin = () => {

  const [showMovieForm, setShowMovieForm] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedContentType, setSelectedContentType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [importPage, setImportPage] = useState(2);
  const [totalImported, setTotalImported] = useState(0);
  const [totalSkipped, setTotalSkipped] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);
  const [isImporting, setIsImporting] = useState(false); // Add import state
  const [shouldStopImport, setShouldStopImport] = useState(false); // Add stop flag

  // Mock data for now - replace with actual API calls
  const [moviesLoading, setMoviesLoading] = useState(false);
  const [ingestLoading, setIngestLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);

  // Mock queryClient for now - replace with actual React Query client
  const queryClient = {
    invalidateQueries: (queryKey) => {
      console.log('Invalidating queries:', queryKey);
      // TODO: Implement actual query invalidation
    }
  };

  const categories = ['Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Mystery', 'Romance', 'Sci-Fi', 'TV Movie', 'Thriller', 'War', 'Western'];
  const contentTypes = ['movie', 'series', 'animated'];

  useEffect(() => {
    // Data will be fetched by React Query
  }, []);







  const handleDeleteMovie = async (id) => {
    if (window.confirm('Are you sure you want to delete this movie?')) {
      try {
        await deleteMovieMutation.mutateAsync(id);
      } catch (error) {
        console.error('Error deleting movie:', error);
      }
    }
  };

  const handleEditMovie = (movie) => {
    setEditingMovie(movie);
    setShowMovieForm(true);
  };



  const handleInitializeIngest = async () => {
    try {
      await initializeIngestMutation.mutateAsync();
    } catch (error) {
      console.error('Error initializing ingest:', error);
    }
  };

  // Enhanced bulk import function for 5000+ movies
  const handleImportFromTMDB = async () => {
    try {
      setLoading(true);
      setIsImporting(true);
      setShouldStopImport(false);
      console.log('Starting bulk import from TMDB...');
      
      // Import settings for bulk import
      const importSettings = {
        moviePages: 250, // 250 pages = 5000 movies
        seriesPages: 100, // 100 pages = 2000 series
        animatedPages: 50, // 50 pages = 1000 animated
        movieCategory: 'popular', // popular, top_rated, upcoming, now_playing
        seriesCategory: 'popular' // popular, top_rated, on_the_air, airing_today
      };

      let totalImported = 0;
      let totalSkipped = 0;
      let totalErrors = 0;

      // Reset counters
      setTotalImported(0);
      setTotalSkipped(0);
      setTotalErrors(0);

      // Import movies (5000 movies)
      console.log('Importing movies...');
      for (let page = 1; page <= importSettings.moviePages; page++) {
        // Check if user wants to stop
        if (shouldStopImport) {
          console.log('Import stopped by user');
          break;
        }

        try {
          const moviesData = await fetchPopularMovies(page);
          
          for (const movie of moviesData) {
            // Check if user wants to stop
            if (shouldStopImport) {
              console.log('Import stopped by user');
              break;
            }

            try {
              const response = await apiClient.createMovie({
                title: movie.title,
                description: movie.overview || 'No description available',
                year: movie.year,
                category: movie.category,
                contentType: movie.contentType,
                quality: movie.quality || '1080p',
                voteAverage: movie.voteAverage || 0,
                voteCount: movie.voteCount || 0,
                posterURL: movie.posterURL,
                backdropURL: movie.backdropURL,
                thumbnailURL: movie.thumbnailURL,
                videoURL: movie.videoURL,
                duration: movie.duration ? `${Math.floor(movie.duration / 60)}h ${movie.duration % 60}m` : '2h 0m',
                rating: 'PG-13', // Default rating since TMDB doesn't provide this
                tmdbId: movie.tmdbId,
                featured: false,
                tags: movie.genres || []
              });
              
              if (response.skipped) {
                totalSkipped++;
                setTotalSkipped(prev => prev + 1);
              } else {
                totalImported++;
                setTotalImported(prev => prev + 1);
              }
            } catch (error) {
              totalErrors++;
              setTotalErrors(prev => prev + 1);
              console.error(`Error saving ${movie.title}:`, error);
            }
          }
          
          console.log(`Page ${page}/${importSettings.moviePages}: Imported ${totalImported}, Skipped ${totalSkipped}, Errors ${totalErrors}`);
          
          // Rate limiting: wait between pages
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error(`Error on page ${page}:`, error);
          totalErrors++;
        }
      }

      // Import series (2000 series)
      if (!shouldStopImport) {
        console.log('Importing TV series...');
        for (let page = 1; page <= importSettings.seriesPages; page++) {
          // Check if user wants to stop
          if (shouldStopImport) {
            console.log('Import stopped by user');
            break;
          }

          try {
            const seriesData = await fetchPopularSeries(page);
            
            for (const series of seriesData) {
              // Check if user wants to stop
              if (shouldStopImport) {
                console.log('Import stopped by user');
                break;
              }

              try {
                const response = await apiClient.createMovie({
                  title: series.title,
                  description: series.overview || 'No description available',
                  year: series.year,
                  category: series.category,
                  contentType: series.contentType,
                  quality: series.quality || '1080p',
                  voteAverage: series.voteAverage || 0,
                  voteCount: series.voteCount || 0,
                  posterURL: series.posterURL,
                  backdropURL: series.backdropURL,
                  thumbnailURL: series.thumbnailURL,
                  videoURL: series.videoURL,
                  duration: series.duration ? `${Math.floor(series.duration / 60)}h ${series.duration % 60}m` : '2h 0m',
                  rating: 'PG-13', // Default rating since TMDB doesn't provide this
                  tmdbId: series.tmdbId,
                  featured: false,
                  tags: series.genres || [],
                  seriesInfo: {
                    totalSeasons: series.numberOfSeasons || 1,
                    totalEpisodes: series.numberOfEpisodes || 1,
                    status: series.status === 'Ended' ? 'completed' : 'ongoing',
                    firstAirDate: series.releaseDate ? new Date(series.releaseDate) : null,
                    lastAirDate: null
                  }
                });
                
                if (response.skipped) {
                  totalSkipped++;
                  setTotalSkipped(prev => prev + 1);
                } else {
                  totalImported++;
                  setTotalImported(prev => prev + 1);
                }
              } catch (error) {
                totalErrors++;
                setTotalErrors(prev => prev + 1);
                console.error(`Error saving ${series.title}:`, error);
              }
            }
            
            console.log(`Series Page ${page}/${importSettings.seriesPages}: Total Imported ${totalImported}, Skipped ${totalSkipped}, Errors ${totalErrors}`);
            
            // Rate limiting: wait between pages
            await new Promise(resolve => setTimeout(resolve, 100));
            
          } catch (error) {
            console.error(`Error on series page ${page}:`, error);
            totalErrors++;
          }
        }
      }

      // Import animated content (1000 animated)
      if (!shouldStopImport) {
        console.log('Importing animated content...');
        for (let page = 1; page <= importSettings.animatedPages; page++) {
          // Check if user wants to stop
          if (shouldStopImport) {
            console.log('Import stopped by user');
            break;
          }

          try {
            const animatedData = await fetchAnimatedMovies(page);
            
            for (const animated of animatedData) {
              // Check if user wants to stop
              if (shouldStopImport) {
                console.log('Import stopped by user');
                break;
              }

              try {
                const response = await apiClient.createMovie({
                  title: animated.title,
                  description: animated.overview || 'No description available',
                  year: animated.year,
                  category: animated.category,
                  contentType: animated.contentType,
                  quality: animated.quality || '1080p',
                  voteAverage: animated.voteAverage || 0,
                  voteCount: animated.voteCount || 0,
                  posterURL: animated.posterURL,
                  backdropURL: animated.backdropURL,
                  thumbnailURL: animated.thumbnailURL,
                  videoURL: animated.videoURL,
                  duration: animated.duration ? `${Math.floor(animated.duration / 60)}h ${animated.duration % 60}m` : '2h 0m',
                  rating: 'PG-13', // Default rating since TMDB doesn't provide this
                  tmdbId: animated.tmdbId,
                  featured: false,
                  tags: animated.genres || [],
                  animatedInfo: {
                    animationType: '2D',
                    targetAudience: 'All Ages',
                    studio: ''
                  }
                });
                
                if (response.skipped) {
                  totalSkipped++;
                  setTotalSkipped(prev => prev + 1);
                } else {
                  totalImported++;
                  setTotalImported(prev => prev + 1);
                }
              } catch (error) {
                totalErrors++;
                setTotalErrors(prev => prev + 1);
                console.error(`Error saving ${animated.title}:`, error);
              }
            }
            
            console.log(`Animated Page ${page}/${importSettings.animatedPages}: Total Imported ${totalImported}, Skipped ${totalSkipped}, Errors ${totalErrors}`);
            
            // Rate limiting: wait between pages
            await new Promise(resolve => setTimeout(resolve, 100));
            
          } catch (error) {
            console.error(`Error on animated page ${page}:`, error);
            totalErrors++;
          }
        }
      }

      const finalMessage = shouldStopImport 
        ? `Import stopped by user!\n\nImported: ${totalImported} new movies/series\nSkipped: ${totalSkipped} existing movies\nErrors: ${totalErrors} failed imports\n\nTotal processed: ${totalImported + totalSkipped + totalErrors}`
        : `Bulk import completed!\n\nImported: ${totalImported} new movies/series\nSkipped: ${totalSkipped} existing movies\nErrors: ${totalErrors} failed imports\n\nTotal processed: ${totalImported + totalSkipped + totalErrors}`;

      console.log(`Bulk import ${shouldStopImport ? 'stopped' : 'completed'}! Total: Imported ${totalImported}, Skipped ${totalSkipped}, Errors ${totalErrors}`);
      alert(finalMessage);
      
      // Refresh the movies list
      window.location.reload();
      
    } catch (error) {
      console.error('Error during bulk import:', error);
      alert('Failed to import from TMDB. Check console for details.');
    } finally {
      setLoading(false);
      setIsImporting(false);
      setShouldStopImport(false);
    }
  };

  // Stop import function
  const handleStopImport = () => {
    setShouldStopImport(true);
    setIsImporting(false);
    console.log('Stopping import...');
  };

  // Mock functions for now - replace with actual API calls
  const handleRunIngestJob = async (jobName, data = {}) => {
    console.log('Running ingest job:', jobName, data);
    // TODO: Implement actual API call
  };

  const deleteMovieMutation = {
    mutateAsync: async (id) => {
      console.log('Deleting movie:', id);
      // TODO: Implement actual API call
    }
  };

  const runIngestJobMutation = {
    isPending: false,
    mutateAsync: async (data) => {
      console.log('Running ingest job:', data);
      // TODO: Implement actual API call
    }
  };

  const initializeIngestMutation = {
    isPending: false,
    mutateAsync: async () => {
      console.log('Initializing ingest');
      // TODO: Implement actual API call
    }
  };

  // Real data from backend API
  const [movies, setMovies] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch movies and users from your backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch movies
        const moviesResponse = await fetch('http://localhost:5000/api/movies');
        if (moviesResponse.ok) {
          const moviesData = await moviesResponse.json();
          setMovies(moviesData.data || moviesData); // Handle both paginated and non-paginated responses
        } else {
          console.error('Failed to fetch movies:', moviesResponse.statusText);
          setMovies(getMockMovies());
        }

        // Fetch users (if you have a users endpoint)
        try {
          const usersResponse = await fetch('http://localhost:5000/api/users');
          if (usersResponse.ok) {
            const usersData = await usersResponse.json();
            setUsers(usersData.data || usersData);
          } else {
            console.error('Failed to fetch users:', usersResponse.statusText);
            setUsers(getMockUsers());
          }
        } catch (error) {
          console.error('Error fetching users:', error);
          setUsers(getMockUsers());
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        setMovies(getMockMovies());
        setUsers(getMockUsers());
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Mock data fallback functions
  const getMockMovies = () => [
    {
      _id: '1',
      title: 'The Matrix',
      year: 1999,
      category: 'Action',
      contentType: 'movie',
      quality: '1080p',
      voteAverage: 8.7,
      posterURL: 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
      description: 'A computer programmer discovers a mysterious world.'
    },
    {
      _id: '2',
      title: 'Breaking Bad',
      year: 2008,
      category: 'Drama',
      contentType: 'series',
      quality: '2160p',
      voteAverage: 9.5,
      posterURL: 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
      description: 'A high school chemistry teacher turned methamphetamine manufacturer.'
    },
    {
      _id: '3',
      title: 'Inception',
      year: 2010,
      category: 'Sci-Fi',
      contentType: 'movie',
      quality: '1440p',
      voteAverage: 8.8,
      posterURL: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
      description: 'A thief who steals corporate secrets through dream-sharing technology.'
    },
    {
      _id: '4',
      title: 'The Lion King',
      year: 1994,
      category: 'Animation',
      contentType: 'animated',
      quality: '1080p',
      voteAverage: 8.5,
      posterURL: 'https://image.tmdb.org/t/p/w500/sKCr78MXSLixu6hT0PloPUW7iqG.jpg',
      description: 'A young lion prince flees his kingdom only to learn the true meaning of responsibility.'
    },
    {
      _id: '5',
      title: 'Game of Thrones',
      year: 2011,
      category: 'Fantasy',
      contentType: 'series',
      quality: '2160p',
      voteAverage: 9.3,
      posterURL: 'https://image.tmdb.org/t/p/w500/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg',
      description: 'Nine noble families fight for control over the lands of Westeros.'
    }
  ];

  const getMockUsers = () => [
    {
      _id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user',
      createdAt: new Date('2024-01-01')
    },
    {
      _id: '2',
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin',
      createdAt: new Date('2024-01-01')
    },
    {
      _id: '3',
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'user',
      createdAt: new Date('2024-02-15')
    },
    {
      _id: '4',
      name: 'Bob Johnson',
      email: 'bob@example.com',
      role: 'user',
      createdAt: new Date('2024-03-01')
    },
    {
      _id: '5',
      name: 'Alice Brown',
      email: 'alice@example.com',
      role: 'admin',
      createdAt: new Date('2024-01-15')
    }
  ];



  // Mock ingest data
  const mockIngestStatus = {
    tmdbDiscover: { status: 'idle' },
    contentMatch: { status: 'idle' },
    contentRefresh: { status: 'idle' }
  };

  const mockIngestLogs = [
    {
      job: 'tmdb.discover',
      status: 'OK',
      message: 'Successfully discovered 15 new movies',
      duration: 2500,
      createdAt: new Date()
    },
    {
      job: 'content.match',
      status: 'OK',
      message: 'Matched 12 movies with streaming sources',
      duration: 1800,
      createdAt: new Date(Date.now() - 60000)
    }
  ];

  // Use mock ingest data
  const ingestStatus = mockIngestStatus;
  const ingestLogs = mockIngestLogs;

  // Calculate stats from actual data
  const stats = {
    totalMovies: movies.length,
    totalUsers: users.length,
    totalSeries: movies.filter(m => m.contentType === 'series').length,
    totalAnimated: movies.filter(m => m.contentType === 'animated').length,
    activeStreams: movies.filter(m => m.quality && m.quality !== 'CAM').length,
    highQuality: movies.filter(m => m.quality && ['1080p', '1440p', '2160p'].includes(m.quality)).length,
  };

  // Filtered movies based on search and filters
  const filteredMovies = movies.filter(movie => {
    if (searchQuery && !movie.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedCategory !== 'all' && movie.category !== selectedCategory) return false;
    if (selectedContentType !== 'all' && movie.contentType !== selectedContentType) return false;
    return true;
  });

  // Error boundary for debugging
  if (!movies || !users) {
    return (
      <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Loading Admin Panel...</h1>
          <p className="text-muted-foreground">Please wait while we initialize the data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-1">Manage your streaming platform</p>
            </div>
                                       <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground">Page:</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={importPage}
                    onChange={(e) => setImportPage(parseInt(e.target.value) || 1)}
                    className="w-16 px-2 py-1 text-sm bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                                 <button
                   onClick={handleImportFromTMDB}
                   disabled={loading}
                   className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 disabled:bg-muted disabled:text-muted-foreground transition-colors duration-200 px-4 py-2 rounded-lg font-medium"
                 >
                   <Download size={20} />
                   Bulk Import (8000+ Movies)
                 </button>
                 
                 {isImporting && (
                   <button
                     onClick={handleStopImport}
                     className="inline-flex items-center gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors duration-200 px-4 py-2 rounded-lg font-medium"
                   >
                     <X size={20} />
                     Stop Import
                   </button>
                 )}
                 
                 {loading && (
                   <div className="mt-4 p-4 bg-muted rounded-lg">
                     <div className="text-sm font-medium mb-2">Import Progress</div>
                     <div className="w-full bg-background rounded-full h-2 mb-2">
                       <div 
                         className="bg-primary h-2 rounded-full transition-all duration-300"
                         style={{ width: `${((totalImported + totalSkipped) / 8000) * 100}%` }}
                       ></div>
                     </div>
                     <div className="text-xs text-muted-foreground">
                       Imported: {totalImported} | Skipped: {totalSkipped} | Errors: {totalErrors}
                     </div>
                   </div>
                 )}
                <button
                  onClick={() => setShowMovieForm(true)}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200 px-4 py-2 rounded-lg font-medium"
                >
                  <Plus size={20} />
                  Add Movie
                </button>
              </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-muted/30 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'movies', label: 'Movies', icon: Film },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'ingest', label: 'Ingest Pipeline', icon: Database },
              { id: 'streams', label: 'Stream Management', icon: Video },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 whitespace-nowrap",
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  )}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && <DashboardTab stats={stats} />}
                 {activeTab === 'movies' && (
           <MoviesTab 
             movies={filteredMovies}
             loading={loading}
             onDelete={handleDeleteMovie}
             onEdit={handleEditMovie}
             searchQuery={searchQuery}
             setSearchQuery={setSearchQuery}
             selectedCategory={selectedCategory}
             setSelectedCategory={setSelectedCategory}
             selectedContentType={selectedContentType}
             setSelectedContentType={setSelectedContentType}
             showFilters={showFilters}
             setShowFilters={setShowFilters}
             categories={categories}
             contentTypes={contentTypes}
           />
         )}
        {activeTab === 'users' && <UsersTab users={users} loading={loading} />}
        {activeTab === 'ingest' && (
          <IngestTab 
            status={ingestStatus}
            logs={ingestLogs}
            loading={ingestLoading}
            logsLoading={logsLoading}
            onRunJob={handleRunIngestJob}
            onInitialize={handleInitializeIngest}
            running={runIngestJobMutation.isPending || initializeIngestMutation.isPending}
          />
        )}
        {activeTab === 'streams' && <StreamsTab movies={movies} />}
        {activeTab === 'analytics' && <AnalyticsTab movies={movies} users={users} />}
      </div>

      {/* Movie Form Modal */}
      {showMovieForm && (
        <MovieFormModal
          movie={editingMovie}
          onClose={() => {
            setShowMovieForm(false);
            setEditingMovie(null);
          }}
          onSave={(movieData) => {
            // Handle save logic
            setShowMovieForm(false);
            setEditingMovie(null);
            queryClient.invalidateQueries(['admin-movies']);
          }}
        />
      )}
    </div>
  );
};

// Dashboard Tab Component
const DashboardTab = ({ stats }) => (
  <div className="space-y-8">
    {/* Stats Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[
        { label: 'Total Movies', value: stats.totalMovies, icon: Film, color: 'bg-blue-500' },
        { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'bg-green-500' },
        { label: 'Active Streams', value: stats.activeStreams, icon: Video, color: 'bg-purple-500' },
        { label: 'High Quality', value: stats.highQuality, icon: Star, color: 'bg-yellow-500' },
      ].map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <p className="text-3xl font-bold text-foreground mt-2">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        );
      })}
    </div>

    {/* Quick Actions */}
    <div className="bg-card border border-border rounded-xl p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="flex items-center gap-3 p-4 bg-muted hover:bg-muted/80 rounded-lg transition-colors duration-200">
          <Database className="w-5 h-5 text-primary" />
          <span className="font-medium">Initialize Ingest</span>
        </button>
        <button className="flex items-center gap-3 p-4 bg-muted hover:bg-muted/80 rounded-lg transition-colors duration-200">
          <RefreshCw className="w-5 h-5 text-primary" />
          <span className="font-medium">Refresh Content</span>
        </button>
        <button className="flex items-center gap-3 p-4 bg-muted hover:bg-muted/80 rounded-lg transition-colors duration-200">
          <BarChart3 className="w-5 h-5 text-primary" />
          <span className="font-medium">View Analytics</span>
        </button>
      </div>
    </div>
  </div>
);

// Movies Tab Component
const MoviesTab = ({ 
  movies, 
  loading, 
  onDelete,
  onEdit,
  searchQuery, 
  setSearchQuery, 
  selectedCategory, 
  setSelectedCategory, 
  selectedContentType, 
  setSelectedContentType,
  showFilters,
  setShowFilters,
  categories,
  contentTypes
}) => (
  <div className="space-y-6">
    {/* Search and Filters */}
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input
              type="text"
              placeholder="Search movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors duration-200"
        >
          <Filter size={18} />
          Filters
        </button>
      </div>

      {showFilters && (
        <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Content Type</label>
            <select
              value={selectedContentType}
              onChange={(e) => setSelectedContentType(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Types</option>
              {contentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>

    {/* Movies Table */}
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">
          Movies ({movies.length})
        </h3>
      </div>
      
      {loading ? (
        <div className="p-8 text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading movies...</p>
        </div>
      ) : movies.length === 0 ? (
        <div className="p-8 text-center">
          <Film className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No movies found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Movie</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Quality</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Rating</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Stream URL</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {movies.map((movie) => (
                <tr key={movie._id} className="hover:bg-muted/30 transition-colors duration-200">
                                     <td className="px-6 py-4">
                     <div className="flex items-center">
                       <div className="w-12 h-12 bg-muted rounded-lg mr-3 flex items-center justify-center">
                         {movie.posterURL ? (
                           <img
                             src={movie.posterURL}
                             alt={movie.title}
                             className="w-full h-full object-cover rounded-lg"
                             onError={(e) => {
                               e.target.style.display = 'none';
                               e.target.nextSibling.style.display = 'flex';
                             }}
                           />
                         ) : null}
                         <div className="hidden text-muted-foreground text-xs text-center px-1">
                           {movie.title.charAt(0)}
                         </div>
                       </div>
                       <div>
                         <div className="font-medium text-foreground">{movie.title}</div>
                         <div className="text-sm text-muted-foreground">{movie.year}</div>
                       </div>
                     </div>
                   </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-primary/20 text-primary rounded-full">
                      {movie.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-secondary/20 text-secondary-foreground rounded-full">
                      {movie.contentType === 'series' && <Tv size={12} />}
                      {movie.contentType === 'animated' && <Sparkles size={12} />}
                      {movie.contentType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {movie.quality && (
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-warning/20 text-warning rounded-full">
                        {movie.quality}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {movie.voteAverage && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-warning text-warning" />
                        <span className="text-sm">{movie.voteAverage.toFixed(1)}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      {movie.videoURL ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-success font-medium">✓ Custom URL</span>
                          <button 
                            onClick={() => window.open(movie.videoURL, '_blank')}
                            className="text-xs text-primary hover:underline"
                          >
                            Test
                          </button>
                        </div>
                      ) : movie.tmdbId ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-warning font-medium">✓ SE Player Ready</span>
                          <button 
                            onClick={() => window.open(generateSEPlayerUrl(movie.tmdbId), '_blank')}
                            className="text-xs text-primary hover:underline"
                          >
                            Test SE Player
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No Stream</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleEditMovie(movie)}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors duration-200"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => onDelete(movie._id)}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors duration-200"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>
);

// Users Tab Component
const UsersTab = ({ users, loading }) => (
  <div className="bg-card border border-border rounded-xl overflow-hidden">
    <div className="px-6 py-4 border-b border-border">
      <h3 className="text-lg font-semibold text-foreground">
        Users ({users.length})
      </h3>
    </div>
    
    {loading ? (
      <div className="p-8 text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading users...</p>
      </div>
    ) : users.length === 0 ? (
      <div className="p-8 text-center">
        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No users found</p>
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Joined</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr key={user._id} className="hover:bg-muted/30 transition-colors duration-200">
                <td className="px-6 py-4">
                  <div className="font-medium text-foreground">{user.name}</div>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "inline-flex px-2 py-1 text-xs font-medium rounded-full",
                    user.role === 'admin' 
                      ? "bg-destructive/20 text-destructive" 
                      : "bg-muted text-foreground"
                  )}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button className="p-1 text-muted-foreground hover:text-foreground transition-colors duration-200">
                      <Edit size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

// Ingest Tab Component
const IngestTab = ({ status, logs, loading, logsLoading, onRunJob, onInitialize, running }) => (
  <div className="space-y-6">
    {/* Status Overview */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Pipeline Status</h3>
        {loading ? (
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : status ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">TMDB Discover</span>
              <span className={cn(
                "px-2 py-1 text-xs rounded-full",
                status.tmdbDiscover?.status === 'running' ? "bg-warning/20 text-warning" : "bg-success/20 text-success"
              )}>
                {status.tmdbDiscover?.status || 'idle'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Content Match</span>
              <span className={cn(
                "px-2 py-1 text-xs rounded-full",
                status.contentMatch?.status === 'running' ? "bg-warning/20 text-warning" : "bg-success/20 text-success"
              )}>
                {status.contentMatch?.status || 'idle'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Content Refresh</span>
              <span className={cn(
                "px-2 py-1 text-xs rounded-full",
                status.contentRefresh?.status === 'running' ? "bg-warning/20 text-warning" : "bg-success/20 text-success"
              )}>
                {status.contentRefresh?.status || 'idle'}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">No status available</p>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
        <div className="space-y-3">
          <button
            onClick={() => onInitialize()}
            disabled={running}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground rounded-lg transition-colors duration-200"
          >
            <Database size={16} />
            Initialize Pipeline
          </button>
          <button
            onClick={() => onRunJob('tmdb.discover')}
            disabled={running}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 disabled:bg-muted disabled:text-muted-foreground rounded-lg transition-colors duration-200"
          >
            <Globe size={16} />
            Discover New Content
          </button>
          <button
            onClick={() => onRunJob('content.refresh')}
            disabled={running}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-warning text-warning-foreground hover:bg-warning/90 disabled:bg-muted disabled:text-muted-foreground rounded-lg transition-colors duration-200"
          >
            <RefreshCw size={16} />
            Refresh Content
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
        {logsLoading ? (
          <div className="text-center">
            <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-muted-foreground">Loading...</p>
          </div>
        ) : logs.length > 0 ? (
          <div className="space-y-2">
            {logs.slice(0, 5).map((log, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  log.status === 'OK' ? "bg-success" : log.status === 'ERROR' ? "bg-destructive" : "bg-warning"
                )} />
                <span className="text-muted-foreground">{log.job}</span>
                <span className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No recent activity</p>
        )}
      </div>
    </div>

    {/* Logs Table */}
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">Ingest Logs</h3>
      </div>
      
      {logsLoading ? (
        <div className="p-8 text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading logs...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="p-8 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No logs found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Job</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Message</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((log, index) => (
                <tr key={index} className="hover:bg-muted/30 transition-colors duration-200">
                  <td className="px-6 py-4">
                    <span className="font-medium text-foreground">{log.job}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-flex px-2 py-1 text-xs font-medium rounded-full",
                      log.status === 'OK' ? "bg-success/20 text-success" :
                      log.status === 'ERROR' ? "bg-destructive/20 text-destructive" :
                      log.status === 'UPGRADED' ? "bg-warning/20 text-warning" :
                      "bg-muted text-foreground"
                    )}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">
                    {log.message}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {log.duration ? `${log.duration}ms` : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>
);

// Streams Tab Component
const StreamsTab = ({ movies }) => {
  const activeStreams = movies.filter(m => m.quality && m.quality !== 'CAM');
  const highQualityStreams = movies.filter(m => m.quality && ['1080p', '1440p', '2160p'].includes(m.quality));
  
  return (
    <div className="space-y-6">
      {/* Stream Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Stream Quality Distribution</h3>
          <div className="space-y-3">
            {['2160p', '1440p', '1080p', '720p', 'SD', 'CAM'].map(quality => {
              const count = movies.filter(m => m.quality === quality).length;
              const percentage = movies.length > 0 ? (count / movies.length * 100).toFixed(1) : 0;
              return (
                <div key={quality} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{quality}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Content Type Streams</h3>
          <div className="space-y-3">
            {['movie', 'series', 'animated'].map(type => {
              const count = movies.filter(m => m.contentType === type).length;
              const activeCount = movies.filter(m => m.contentType === type && m.quality && m.quality !== 'CAM').length;
              return (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground capitalize">{type}</span>
                  <div className="text-right">
                    <div className="font-medium text-foreground">{activeCount}</div>
                    <div className="text-xs text-muted-foreground">of {count} total</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Quality Targets</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">High Quality (1080p+)</span>
              <span className="text-sm font-medium text-success">{highQualityStreams.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Standard Quality</span>
              <span className="text-sm font-medium text-warning">{activeStreams.length - highQualityStreams.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Low Quality</span>
              <span className="text-sm font-medium text-destructive">{movies.length - activeStreams.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stream Management */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Stream Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="flex items-center gap-3 p-4 bg-muted hover:bg-muted/80 rounded-lg transition-colors duration-200">
            <RefreshCw className="w-5 h-5 text-primary" />
            <span className="font-medium">Refresh All Streams</span>
          </button>
          <button className="flex items-center gap-3 p-4 bg-muted hover:bg-muted/80 rounded-lg transition-colors duration-200">
            <Target className="w-5 h-5 text-primary" />
            <span className="font-medium">Quality Upgrade Check</span>
          </button>
          <button className="flex items-center gap-3 p-4 bg-muted hover:bg-muted/80 rounded-lg transition-colors duration-200">
            <AlertTriangle className="w-5 h-5 text-primary" />
            <span className="font-medium">Broken Stream Check</span>
          </button>
          <button className="flex items-center gap-3 p-4 bg-muted hover:bg-muted/80 rounded-lg transition-colors duration-200">
            <BarChart3 className="w-5 h-5 text-primary" />
            <span className="font-medium">Stream Analytics</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Analytics Tab Component
const AnalyticsTab = ({ movies, users }) => {
  const categoryStats = movies.reduce((acc, movie) => {
    acc[movie.category] = (acc[movie.category] || 0) + 1;
    return acc;
  }, {});

  const contentTypeStats = movies.reduce((acc, movie) => {
    acc[movie.contentType] = (acc[movie.contentType] || 0) + 1;
    return acc;
  }, {});

  const qualityStats = movies.reduce((acc, movie) => {
    if (movie.quality) {
      acc[movie.quality] = (acc[movie.quality] || 0) + 1;
    }
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Category Distribution</h3>
          <div className="space-y-3">
            {Object.entries(categoryStats)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 8)
              .map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{category}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${(count / movies.length * 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Content Type Distribution */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Content Type Distribution</h3>
          <div className="space-y-3">
            {Object.entries(contentTypeStats).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground capitalize">{type}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-muted rounded-full h-2">
                    <div 
                      className="bg-secondary h-2 rounded-full" 
                      style={{ width: `${(count / movies.length * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quality Distribution */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Quality Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(qualityStats)
            .sort(([a], [b]) => {
              const qualityOrder = ['CAM', 'SD', '720p', '1080p', '1440p', '2160p'];
              return qualityOrder.indexOf(a) - qualityOrder.indexOf(b);
            })
            .map(([quality, count]) => (
              <div key={quality} className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-foreground">{count}</div>
                <div className="text-sm text-muted-foreground">{quality}</div>
              </div>
            ))}
        </div>
      </div>

      {/* User Growth */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">User Growth</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground">{users.length}</div>
            <div className="text-sm text-muted-foreground">Total Users</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground">
              {users.filter(u => u.role === 'admin').length}
            </div>
            <div className="text-sm text-muted-foreground">Admin Users</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground">
              {users.filter(u => new Date(u.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
            </div>
            <div className="text-sm text-muted-foreground">New This Month</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Movie Form Modal Component
const MovieFormModal = ({ movie, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Action',
    contentType: 'movie',
    posterURL: '',
    backdropURL: '',
    videoURL: '',
    duration: '',
    year: new Date().getFullYear(),
    quality: '1080p',
    voteAverage: 0,
    tmdbId: '',
    imdbId: '',
    // Series specific fields
    totalSeasons: 1,
    totalEpisodes: 1,
    status: 'completed',
    firstAirDate: '',
    lastAirDate: '',
    // Animated specific fields
    animationType: '2D',
    targetAudience: 'All Ages',
    studio: ''
  });

  useEffect(() => {
    if (movie) {
      setFormData(movie);
    }
  }, [movie]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">
              {movie ? 'Edit Movie' : 'Add New Movie'}
            </h2>
            <button
              onClick={onClose}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {['Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Mystery', 'Romance', 'Sci-Fi', 'TV Movie', 'Thriller', 'War', 'Western'].map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Stream URL (Embedded)</label>
            <input
              type="url"
              name="videoURL"
              value={formData.videoURL || ''}
              onChange={handleChange}
              placeholder="https://example.com/embed/..."
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter a custom embedded URL, or leave empty to use SE Player with TMDB ID (if available)
            </p>
            {formData.tmdbId && (
              <div className="mt-2 p-2 bg-muted rounded text-xs">
                <strong>SE Player Available:</strong> This movie has TMDB ID {formData.tmdbId}. 
                If no custom URL is provided, it will automatically use SE Player for streaming.
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Year</label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleChange}
                min="1900"
                max={new Date().getFullYear() + 1}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Quality</label>
              <select
                name="quality"
                value={formData.quality}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {['CAM', 'SD', '720p', '1080p', '1440p', '2160p'].map(quality => (
                  <option key={quality} value={quality}>{quality}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Rating</label>
              <input
                type="number"
                name="voteAverage"
                value={formData.voteAverage}
                onChange={handleChange}
                min="0"
                max="10"
                step="0.1"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors duration-200"
            >
              {movie ? 'Update Movie' : 'Add Movie'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Admin;
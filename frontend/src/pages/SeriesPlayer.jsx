import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, ChevronLeft, ChevronRight, Tv, Info, Star, Clock, Film, Play, List } from 'lucide-react';
import MovieCard from '../components/MovieCard';
import EmbedPlayer from '../components/EmbedPlayer';
import { generateSEPlayerUrl } from '../lib/utils';

const SeriesPlayer = () => {
  const { id } = useParams();
  const [series, setSeries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentSeason, setCurrentSeason] = useState(1);
  const [currentEpisode, setCurrentEpisode] = useState(1);
  const [recommendations, setRecommendations] = useState([]);
  const [showEpisodeList, setShowEpisodeList] = useState(false);
  const [episodeList, setEpisodeList] = useState([]);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchSeries();
  }, [id]);

  useEffect(() => {
    if (series) {
      fetchRecommendations();
    }
  }, [series]);

  const fetchSeries = async () => {
    try {
      const response = await axios.get(`${API_URL}/movies/${id}`);
      const seriesData = response.data;
      setSeries(seriesData);
      
      if (seriesData.seriesInfo) {
        setCurrentSeason(1);
        setCurrentEpisode(1);
        
        // Generate episode list for all seasons
        const episodes = [];
        if (seriesData.seriesInfo.seasons) {
          seriesData.seriesInfo.seasons.forEach((season, seasonIndex) => {
            if (season.episodes) {
              season.episodes.forEach((episode, episodeIndex) => {
                episodes.push({
                  season: seasonIndex + 1,
                  episode: episodeIndex + 1,
                  title: episode.title || `Episode ${episodeIndex + 1}`,
                  description: episode.description,
                  duration: episode.duration
                });
              });
            }
          });
        }
        setEpisodeList(episodes);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching series:', error);
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await axios.get(`${API_URL}/movies`);
      const allMovies = response.data || [];
      
      // Filter recommendations for series - prefer other series
      const filtered = allMovies
        .filter(m => m._id !== series._id) // Exclude current series
        .filter(m => 
          m.contentType === 'series' || // Prefer other series
          m.category === series.category || // Same category
          (m.voteAverage && m.voteAverage >= 7) // High rated content
        )
        .sort((a, b) => {
          // Prioritize series, then by rating
          if (a.contentType === 'series' && b.contentType !== 'series') return -1;
          if (b.contentType === 'series' && a.contentType !== 'series') return 1;
          return (b.voteAverage || 0) - (a.voteAverage || 0);
        })
        .slice(0, 8); // Limit to 8 recommendations

      setRecommendations(filtered);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const handleSeasonChange = (e) => {
    setCurrentSeason(parseInt(e.target.value));
    setCurrentEpisode(1); // Reset to first episode when season changes
  };

  const handleEpisodeChange = (e) => {
    setCurrentEpisode(parseInt(e.target.value));
  };

  const nextEpisode = () => {
    if (series?.seriesInfo?.seasons?.[currentSeason - 1]?.episodes) {
      const maxEpisodes = series.seriesInfo.seasons[currentSeason - 1].episodes.length;
      if (currentEpisode < maxEpisodes) {
        setCurrentEpisode(currentEpisode + 1);
      }
    }
  };

  const prevEpisode = () => {
    if (currentEpisode > 1) {
      setCurrentEpisode(currentEpisode - 1);
    }
  };

  const getCurrentEpisodeInfo = () => {
    if (!series?.seriesInfo?.seasons) return null;
    const season = series.seriesInfo.seasons[currentSeason - 1];
    if (!season) return null;
    return season.episodes[currentEpisode - 1];
  };

  const getStreamingUrl = () => {
    if (!series?.tmdbId) return null;
    
    // Use SE Player for series with season/episode parameters
    return generateSEPlayerUrl(series.tmdbId, currentSeason, currentEpisode);
  };

  const handleEpisodeSelect = (season, episode) => {
    setCurrentSeason(season);
    setCurrentEpisode(episode);
    setShowEpisodeList(false);
  };

  const getEpisodeTitle = (season, episode) => {
    const episodeData = episodeList.find(ep => ep.season === season && ep.episode === episode);
    return episodeData?.title || `Episode ${episode}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground">Loading series...</p>
        </div>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Series not found</h2>
          <p className="text-muted-foreground">The series you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const currentEpisodeInfo = getCurrentEpisodeInfo();

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
                {series.title}
              </h1>
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground flex-wrap">
                <span>{series.year}</span>
                {series.duration && (
                  <div className="flex items-center gap-1">
                    <Clock size={16} />
                    <span>{series.duration}</span>
                  </div>
                )}
                {series.voteAverage && (
                  <div className="flex items-center gap-1 text-warning">
                    <Star size={16} className="fill-current" />
                    <span className="font-medium">{series.voteAverage.toFixed(1)}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Tv size={16} />
                  <span>TV Series</span>
                </div>
              </div>
            </div>

            <Link
              to={`/info/${series._id}`}
              className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200 px-4 py-2 rounded-lg font-medium"
            >
              <Info size={20} />
              <span>Details</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Episode Selector */}
      {series.seriesInfo && (
        <div className="bg-muted/50 border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
              {/* Season Selector */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-foreground">Season:</label>
                <select
                  value={currentSeason}
                  onChange={handleSeasonChange}
                  className="bg-card border border-border text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {series.seriesInfo.seasons?.map((season, index) => (
                    <option key={index + 1} value={index + 1}>
                      Season {index + 1}
                    </option>
                  ))}
                </select>
              </div>

              {/* Episode Selector */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-foreground">Episode:</label>
                <select
                  value={currentEpisode}
                  onChange={handleEpisodeChange}
                  className="bg-card border border-border text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {series.seriesInfo.seasons?.[currentSeason - 1]?.episodes?.map((episode, index) => (
                    <option key={index + 1} value={index + 1}>
                      Episode {index + 1}
                    </option>
                  ))}
                </select>
              </div>

              {/* Episode Navigation */}
              <div className="flex items-center gap-2">
                <button
                  onClick={prevEpisode}
                  disabled={currentEpisode <= 1}
                  className="flex items-center gap-1 bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors duration-200 px-3 py-2 rounded-lg text-sm font-medium"
                >
                  <ChevronLeft size={16} />
                  Prev
                </button>
                <button
                  onClick={nextEpisode}
                  disabled={!series.seriesInfo?.seasons?.[currentSeason - 1]?.episodes || 
                           currentEpisode >= series.seriesInfo.seasons[currentSeason - 1].episodes.length}
                  className="flex items-center gap-1 bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors duration-200 px-3 py-2 rounded-lg text-sm font-medium"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Episode List Button */}
              <button
                onClick={() => setShowEpisodeList(!showEpisodeList)}
                className="flex items-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors duration-200 px-3 py-2 rounded-lg text-sm font-medium"
              >
                <List size={16} />
                All Episodes
              </button>
            </div>

            {/* Current Episode Info */}
            {currentEpisodeInfo && (
              <div className="mt-4 text-center">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {currentEpisodeInfo.title || `Episode ${currentEpisode}`}
                </h3>
                {currentEpisodeInfo.description && (
                  <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
                    {currentEpisodeInfo.description}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Episode List Modal */}
      {showEpisodeList && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">
                  All Episodes - {series.title}
                </h2>
                <button
                  onClick={() => setShowEpisodeList(false)}
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid gap-4">
                {series.seriesInfo?.seasons?.map((season, seasonIndex) => (
                  <div key={seasonIndex} className="space-y-3">
                    <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                      Season {seasonIndex + 1}
                    </h3>
                    <div className="grid gap-2">
                      {season.episodes?.map((episode, episodeIndex) => {
                        const isCurrent = (seasonIndex + 1) === currentSeason && (episodeIndex + 1) === currentEpisode;
                        return (
                          <button
                            key={episodeIndex}
                            onClick={() => handleEpisodeSelect(seasonIndex + 1, episodeIndex + 1)}
                            className={`flex items-center justify-between p-3 rounded-lg text-left transition-colors duration-200 ${
                              isCurrent 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted hover:bg-muted/80 text-foreground'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-background/20 rounded-full flex items-center justify-center text-sm font-medium">
                                {episodeIndex + 1}
                              </div>
                              <div>
                                <div className="font-medium">
                                  {episode.title || `Episode ${episodeIndex + 1}`}
                                </div>
                                {episode.description && (
                                  <div className="text-sm text-muted-foreground line-clamp-2">
                                    {episode.description}
                                  </div>
                                )}
                              </div>
                            </div>
                            {isCurrent && (
                              <Play size={16} className="text-primary-foreground" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Player */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-black rounded-xl overflow-hidden shadow-2xl">
          <EmbedPlayer 
            movieId={id} 
            onStreamChange={() => {}} 
            episodeInfo={{ season: currentSeason, episode: currentEpisode }}
          />
        </div>
      </div>

      {/* Series Details */}
      <div className="bg-muted/30 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Poster */}
            <div className="lg:col-span-1">
              <div className="sticky top-32">
                <img
                  src={series.posterURL || '/placeholder-poster.jpg'}
                  alt={series.title}
                  className="w-full rounded-xl shadow-2xl"
                />
                
                {/* Badges */}
                <div className="mt-4 space-y-2">
                  {series.quality && (
                    <div className="inline-block bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                      {series.quality}
                    </div>
                  )}
                  {series.voteAverage && (
                    <div className="inline-block bg-warning/20 text-warning border border-warning/30 px-3 py-1 rounded-full text-sm font-medium ml-2">
                      ⭐ {series.voteAverage.toFixed(1)}
                    </div>
                  )}
                </div>

                {/* Series Stats */}
                {series.seriesInfo && (
                  <div className="mt-6 bg-card p-4 rounded-lg border border-border">
                    <h4 className="font-semibold text-foreground mb-3">Series Info</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Seasons:</span>
                        <span className="text-foreground font-medium">{series.seriesInfo.seasons?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Episodes:</span>
                        <span className="text-foreground font-medium">
                          {series.seriesInfo.seasons?.reduce((total, season) => total + (season.episodes?.length || 0), 0) || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Current:</span>
                        <span className="text-foreground font-medium">
                          S{currentSeason.toString().padStart(2, '0')}E{currentEpisode.toString().padStart(2, '0')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {/* Title and Meta */}
                <div>
                  <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                    {series.title}
                  </h2>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {series.category && (
                      <span className="bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-full text-sm font-medium">
                        {series.category}
                      </span>
                    )}
                    {series.year && (
                      <span className="bg-muted text-foreground px-3 py-1 rounded-full text-sm font-medium">
                        {series.year}
                      </span>
                    )}
                    <span className="bg-secondary/20 text-secondary-foreground border border-secondary/30 px-3 py-1 rounded-full text-sm font-medium">
                      TV Series
                    </span>
                  </div>
                </div>

                {/* Description */}
                {series.description && (
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">Synopsis</h3>
                    <p className="text-muted-foreground leading-relaxed text-base">
                      {series.description}
                    </p>
                  </div>
                )}

                {/* Additional Info */}
                <div className="grid sm:grid-cols-2 gap-6">
                  {series.duration && (
                    <div className="bg-card p-4 rounded-lg border border-border">
                      <h4 className="font-medium text-foreground mb-2">Episode Duration</h4>
                      <p className="text-muted-foreground">{series.duration}</p>
                    </div>
                  )}
                  
                  {series.category && (
                    <div className="bg-card p-4 rounded-lg border border-border">
                      <h4 className="font-medium text-foreground mb-2">Category</h4>
                      <p className="text-muted-foreground capitalize">{series.category}</p>
                    </div>
                  )}
                  
                  {series.voteAverage && (
                    <div className="bg-card p-4 rounded-lg border border-border">
                      <h4 className="font-medium text-foreground mb-2">Rating</h4>
                      <div className="flex items-center gap-2">
                        <Star size={20} className="fill-warning text-warning" />
                        <span className="text-warning font-medium">{series.voteAverage.toFixed(1)}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-card p-4 rounded-lg border border-border">
                    <h4 className="font-medium text-foreground mb-2">Type</h4>
                    <p className="text-muted-foreground capitalize">TV Series</p>
                  </div>
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

export default SeriesPlayer;
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Play, AlertCircle, RefreshCw, CheckCircle } from 'lucide-react';
import { apiClient } from '../lib/api';
import { getQualityDisplayName } from '../lib/utils';

const EmbedPlayer = ({ movieId, onStreamChange, episodeInfo }) => {
  const [streamData, setStreamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [upgradeNotification, setUpgradeNotification] = useState(null);
  
  const iframeRef = useRef(null);
  const eventSourceRef = useRef(null);

  useEffect(() => {
    fetchActiveStream();
    setupStreamEvents();
    
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [movieId]);

  const fetchActiveStream = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.getActiveStream(movieId);
      setStreamData(response.data);
      
      // Reset iframe state
      setIframeLoaded(false);
      
    } catch (error) {
      console.error('Error fetching active stream:', error);
      setError(error.message || 'Failed to load stream');
    } finally {
      setLoading(false);
    }
  };

  const setupStreamEvents = () => {
    try {
      // Close existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // Setup Server-Sent Events for stream updates
      const eventSource = new EventSource(`/api/movies/${movieId}/stream-events`);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'CONNECTED':
              console.log('Stream events connected');
              break;
              
            case 'UPGRADED':
              handleStreamUpgrade(data);
              break;
              
            case 'HEARTBEAT':
              // Keep connection alive
              break;
              
            default:
              console.log('Unknown event type:', data.type);
          }
        } catch (error) {
          console.error('Error parsing stream event:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('Stream events error:', error);
        eventSource.close();
      };

    } catch (error) {
      console.warn('Failed to setup stream events:', error);
    }
  };

  const handleStreamUpgrade = (upgradeData) => {
    console.log('Stream upgraded:', upgradeData);
    
    // Show upgrade notification
    setUpgradeNotification({
      type: 'success',
      message: `Upgraded to ${getQualityDisplayName(upgradeData.newQuality)}`,
      newQuality: upgradeData.newQuality,
      oldQuality: upgradeData.oldQuality
    });

    // Update stream data
    if (streamData) {
      setStreamData(prev => ({
        ...prev,
        quality: upgradeData.newQuality,
        url: upgradeData.url
      }));
    }

    // Notify parent component
    if (onStreamChange) {
      onStreamChange({
        type: 'UPGRADED',
        newQuality: upgradeData.newQuality,
        oldQuality: upgradeData.oldQuality,
        url: upgradeData.url
      });
    }

    // Auto-hide notification after 5 seconds
    setTimeout(() => {
      setUpgradeNotification(null);
    }, 5000);
  };

  const handleIframeLoad = () => {
    setIframeLoaded(true);
  };

  const handleRetry = () => {
    fetchActiveStream();
  };

  // Loading state
  if (loading) {
    return (
      <div className="relative w-full aspect-video bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium mb-2">Loading stream...</p>
          <p className="text-sm text-gray-300">
            {episodeInfo ? `Season ${episodeInfo.season}, Episode ${episodeInfo.episode}` : 'Preparing video player'}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="relative w-full aspect-video bg-black flex items-center justify-center">
        <div className="text-center text-white p-8">
          <AlertCircle size={48} className="text-destructive mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Failed to Load Stream</h3>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200 px-4 py-2 rounded-lg font-medium"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No stream available
  if (!streamData) {
    return (
      <div className="relative w-full aspect-video bg-black flex items-center justify-center">
        <div className="text-center text-white p-8">
          <Play size={48} className="text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Stream Available</h3>
          <p className="text-gray-300 mb-4">
            This content is not currently available for streaming.
          </p>
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200 px-4 py-2 rounded-lg font-medium"
          >
            <RefreshCw size={16} />
            Check Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video bg-black">
      {/* Upgrade Notification */}
      {upgradeNotification && (
        <div className="absolute top-4 right-4 z-50 bg-success text-success-foreground px-4 py-2 rounded-lg shadow-lg animate-in slide-in-from-right-5 duration-300">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="fill-current" />
            <span className="font-medium">{upgradeNotification.message}</span>
          </div>
        </div>
      )}

      {/* Quality Badge */}
      {streamData.quality && (
        <div className="absolute top-4 left-4 z-40 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium shadow-lg">
          {getQualityDisplayName(streamData.quality)}
        </div>
      )}

      {/* Stream Container */}
      <div className="relative w-full h-full">
        {/* Loading Overlay */}
        {!iframeLoaded && (
          <div className="absolute inset-0 bg-black flex items-center justify-center z-20">
            <div className="text-center text-white">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm text-gray-300">Loading stream...</p>
            </div>
          </div>
        )}

        {/* Iframe */}
        <iframe
          ref={iframeRef}
          src={streamData.url}
          title="Movie Player"
          className="w-full h-full border-0"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          onLoad={handleIframeLoad}
        />
      </div>

      {/* Stream Info */}
      <div className="absolute bottom-4 left-4 right-4 z-40">
        <div className="bg-black/80 backdrop-blur-sm text-white p-3 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              {streamData.provider && (
                <span className="text-gray-300">
                  Provider: {streamData.provider}
                </span>
              )}
              {streamData.quality && (
                <span className="text-primary font-medium">
                  Quality: {getQualityDisplayName(streamData.quality)}
                </span>
              )}
            </div>
            {episodeInfo && (
              <span className="text-gray-300">
                S{episodeInfo.season.toString().padStart(2, '0')}E{episodeInfo.episode.toString().padStart(2, '0')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmbedPlayer;

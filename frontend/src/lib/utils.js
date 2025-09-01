import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatDuration(duration) {
  if (!duration) return "Unknown";
  
  // Handle "2h 0m" format
  if (typeof duration === 'string' && duration.includes('h')) {
    return duration;
  }
  
  // Handle minutes
  if (typeof duration === 'number') {
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }
  
  return duration;
}

export function formatYear(year) {
  if (!year) return "Unknown";
  return year.toString();
}

export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

export function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map(word => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Quality display functions
export function getQualityDisplayName(quality) {
  if (!quality) return 'Unknown';
  
  const qualityMap = {
    'CAM': 'CAM',
    'SD': 'SD (480p)',
    '720p': 'HD (720p)',
    '1080p': 'Full HD (1080p)',
    '1440p': '2K (1440p)',
    '2160p': '4K UHD (2160p)'
  };
  
  return qualityMap[quality] || quality;
}

export function getQualityColor(quality) {
  const colorMap = {
    'CAM': 'text-red-500',
    'SD': 'text-orange-500',
    '720p': 'text-yellow-500',
    '1080p': 'text-green-500',
    '1440p': 'text-blue-500',
    '2160p': 'text-purple-500'
  };
  
  return colorMap[quality] || 'text-gray-500';
}

export function getQualityBadgeClass(quality) {
  const baseClass = 'px-2 py-1 text-xs font-medium rounded-full';
  const qualityClass = getQualityColor(quality);
  
  return `${baseClass} ${qualityClass} bg-opacity-10`;
}

// SE Player utility functions
export const generateSEPlayerUrl = (tmdbId, season = null, episode = null) => {
  const baseUrl = '/players/se_player.html';
  const params = new URLSearchParams();
  
  params.append('video_id', tmdbId);
  params.append('tmdb', '1');
  
  if (season && episode) {
    params.append('s', season);
    params.append('e', episode);
  }
  
  return `${baseUrl}?${params.toString()}`;
};

export const generateIMDBPlayerUrl = (imdbId, season = null, episode = null) => {
  const baseUrl = '/players/se_player.html';
  const params = new URLSearchParams();
  
  params.append('video_id', imdbId);
  
  if (season && episode) {
    params.append('s', season);
    params.append('e', episode);
  }
  
  return `${baseUrl}?${params.toString()}`;
};

// Test SE Player URLs
export const testSEPlayerUrls = {
  // Movies
  movieTMDB: (id) => generateSEPlayerUrl(id),
  movieIMDB: (id) => generateIMDBPlayerUrl(id),
  
  // TV Shows
  tvTMDB: (id, season, episode) => generateSEPlayerUrl(id, season, episode),
  tvIMDB: (id, season, episode) => generateIMDBPlayerUrl(id, season, episode),
  
  // Example URLs
  examples: {
    movieTMDB: '/players/se_player.php?video_id=522931&tmdb=1',
    movieIMDB: '/players/se_player.php?video_id=tt8385148',
    tvTMDB: '/players/se_player.php?video_id=60625&tmdb=1&s=5&e=5',
    tvIMDB: '/players/se_player.php?video_id=tt2861424&s=5&e=5'
  }
};

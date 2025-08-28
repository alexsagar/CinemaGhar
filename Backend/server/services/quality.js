/**
 * Quality normalization and ranking service
 * Handles quality string parsing and comparison
 */

// Quality hierarchy (lower index = lower quality)
const QUALITY_HIERARCHY = ['CAM', 'SD', '720p', '1080p', '1440p', '2160p'];

/**
 * Normalize quality string to standard format
 * @param {string} qualityStr - Raw quality string from provider
 * @returns {string} - Normalized quality from QUALITY_HIERARCHY
 */
export function normalizeQuality(qualityStr) {
  if (!qualityStr) return 'SD';
  
  const normalized = qualityStr.toString().toUpperCase().trim();
  
  // Handle common variations
  if (normalized.includes('CAM') || normalized.includes('CAMRIP')) return 'CAM';
  if (normalized.includes('SD') || normalized.includes('480P') || normalized.includes('480')) return 'SD';
  if (normalized.includes('720') || normalized.includes('720P') || normalized.includes('HD')) return '720p';
  if (normalized.includes('1080') || normalized.includes('1080P') || normalized.includes('FULLHD')) return '1080p';
  if (normalized.includes('1440') || normalized.includes('1440P') || normalized.includes('2K')) return '1440p';
  if (normalized.includes('2160') || normalized.includes('2160P') || normalized.includes('4K') || normalized.includes('UHD')) return '2160p';
  
  // Default fallback
  return 'SD';
}

/**
 * Get numeric rank for quality comparison
 * @param {string} quality - Normalized quality string
 * @returns {number} - Numeric rank (higher = better quality)
 */
export function rankQuality(quality) {
  const normalized = normalizeQuality(quality);
  return QUALITY_HIERARCHY.indexOf(normalized);
}

/**
 * Compare two qualities
 * @param {string} quality1 - First quality
 * @param {string} quality2 - Second quality
 * @returns {number} - -1 if quality1 < quality2, 0 if equal, 1 if quality1 > quality2
 */
export function compareQuality(quality1, quality2) {
  const rank1 = rankQuality(quality1);
  const rank2 = rankQuality(quality2);
  
  if (rank1 < rank2) return -1;
  if (rank1 > rank2) return 1;
  return 0;
}

/**
 * Check if quality1 is better than quality2
 * @param {string} quality1 - First quality
 * @param {string} quality2 - Second quality
 * @returns {boolean} - True if quality1 is better
 */
export function isBetterQuality(quality1, quality2) {
  return compareQuality(quality1, quality2) > 0;
}

/**
 * Check if quality meets minimum requirement
 * @param {string} quality - Quality to check
 * @param {string} minQuality - Minimum required quality
 * @returns {boolean} - True if quality meets or exceeds minimum
 */
export function meetsMinimumQuality(quality, minQuality) {
  return compareQuality(quality, minQuality) >= 0;
}

/**
 * Pick the best quality from a list of stream versions
 * @param {Array} versions - Array of StreamVersion objects
 * @returns {Object|null} - Best StreamVersion or null if none available
 */
export function pickBest(versions) {
  if (!versions || versions.length === 0) return null;
  
  // Sort by quality rank (descending), then by score (descending)
  const sorted = versions.sort((a, b) => {
    const qualityDiff = rankQuality(b.quality) - rankQuality(a.quality);
    if (qualityDiff !== 0) return qualityDiff;
    
    // If quality is the same, sort by score
    return (b.score || 0) - (a.score || 0);
  });
  
  return sorted[0];
}

/**
 * Get quality display name
 * @param {string} quality - Normalized quality
 * @returns {string} - Human-readable quality name
 */
export function getQualityDisplayName(quality) {
  const normalized = normalizeQuality(quality);
  
  switch (normalized) {
    case 'CAM': return 'CAM';
    case 'SD': return 'SD (480p)';
    case '720p': return 'HD (720p)';
    case '1080p': return 'Full HD (1080p)';
    case '1440p': return '2K (1440p)';
    case '2160p': return '4K UHD (2160p)';
    default: return normalized;
  }
}

/**
 * Get all available qualities
 * @returns {Array} - Array of all quality strings
 */
export function getAvailableQualities() {
  return [...QUALITY_HIERARCHY];
}

export default {
  normalizeQuality,
  rankQuality,
  compareQuality,
  isBetterQuality,
  meetsMinimumQuality,
  pickBest,
  getQualityDisplayName,
  getAvailableQualities
};

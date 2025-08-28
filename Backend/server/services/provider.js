import axios from 'axios';
import axiosRetry from 'axios-retry';
import { normalizeQuality } from './quality.js';
import Settings from '../../models/Settings.js';

/**
 * Licensed Provider Adapter
 * Adapts existing embed server logic to the new streaming pipeline
 */
class LicensedProvider {
  constructor() {
    this.rateLimitRPS = 3;
    this.maxRetries = 3;
    
    // Configure axios retry
    axiosRetry(axios, { 
      retries: this.maxRetries,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
               error.response?.status >= 500;
      }
    });
    
    this.initializeSettings();
  }

  async initializeSettings() {
    try {
      this.rateLimitRPS = await Settings.getValue('RATE_LIMIT_RPS', 3);
      this.maxRetries = await Settings.getValue('MAX_RETRY_ATTEMPTS', 3);
    } catch (error) {
      console.warn('Failed to load provider settings, using defaults:', error.message);
    }
  }

  /**
   * Search for content by external IDs
   * @param {Object} args - Search arguments
   * @returns {Promise<Array>} - Array of provider IDs
   */
  async searchByExternalIds(args) {
    const { tmdbId, imdbId, title, year } = args;
    
    if (!tmdbId && !imdbId && !title) {
      throw new Error('At least one of tmdbId, imdbId, or title is required');
    }

    // Use existing embed server logic from MovieService
    const providers = [
      {
        providerId: `autoembed-${tmdbId || imdbId || title}`,
        provider: 'AutoEmbed',
        priority: 1
      },
      {
        providerId: `2embed-${tmdbId || imdbId || title}`,
        provider: '2Embed',
        priority: 2
      },
      {
        providerId: `multiembed-${tmdbId || imdbId || title}`,
        provider: 'MultiEmbed',
        priority: 3
      },
      {
        providerId: `embedsu-${tmdbId || imdbId || title}`,
        provider: 'EmbedSu',
        priority: 4
      }
    ];

    return providers;
  }

  /**
   * Get available streams for a provider ID
   * @param {string} providerId - Provider identifier
   * @returns {Promise<Array>} - Array of stream objects
   */
  async getStreams(providerId) {
    const [provider, id] = providerId.split('-', 2);
    
    if (!id) {
      throw new Error('Invalid provider ID format');
    }

    const streams = [];

    try {
      // Rate limiting
      await this.delay(1000 / this.rateLimitRPS);

      switch (provider) {
        case 'autoembed':
          streams.push(...await this.getAutoEmbedStreams(id));
          break;
        case '2embed':
          streams.push(...await this.get2EmbedStreams(id));
          break;
        case 'multiembed':
          streams.push(...await this.getMultiEmbedStreams(id));
          break;
        case 'embedsu':
          streams.push(...await this.getEmbedSuStreams(id));
          break;
        default:
          throw new Error(`Unknown provider: ${provider}`);
      }
    } catch (error) {
      console.error(`Error fetching streams from ${provider}:`, error.message);
      // Return empty array instead of throwing to allow other providers to work
      return [];
    }

    return streams;
  }

  /**
   * Get streams from AutoEmbed (existing logic)
   */
  async getAutoEmbedStreams(tmdbId) {
    const baseUrl = 'https://autoembed.co';
    
    return [
      {
        url: `${baseUrl}/movie/tmdb/${tmdbId}`,
        delivery: 'licensed-embed',
        quality: '1080p', // AutoEmbed typically provides good quality
        codecs: 'h264',
        score: 85
      }
    ];
  }

  /**
   * Get streams from 2Embed
   */
  async get2EmbedStreams(tmdbId) {
    const baseUrl = 'https://www.2embed.cc';
    
    return [
      {
        url: `${baseUrl}/embed/tmdb/movie?id=${tmdbId}`,
        delivery: 'licensed-embed',
        quality: '720p',
        codecs: 'h264',
        score: 75
      }
    ];
  }

  /**
   * Get streams from MultiEmbed
   */
  async getMultiEmbedStreams(tmdbId) {
    const baseUrl = 'https://multiembed.mov';
    
    return [
      {
        url: `${baseUrl}/?video_id=${tmdbId}&tmdb=1`,
        delivery: 'licensed-embed',
        quality: '720p',
        codecs: 'h264',
        score: 70
      }
    ];
  }

  /**
   * Get streams from EmbedSu
   */
  async getEmbedSuStreams(tmdbId) {
    const baseUrl = 'https://embed.su';
    
    return [
      {
        url: `${baseUrl}/embed/movie/${tmdbId}`,
        delivery: 'licensed-embed',
        quality: '720p',
        codecs: 'h264',
        score: 65
      }
    ];
  }

  /**
   * Verify if a stream is still working
   * @param {string} url - Stream URL to verify
   * @returns {Promise<boolean>} - True if stream is working
   */
  async verifyStream(url) {
    try {
      const response = await axios.head(url, {
        timeout: 10000,
        validateStatus: (status) => status < 400
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Rate limiting delay
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get provider information
   */
  getProviderInfo() {
    return {
      name: 'LicensedProvider',
      version: '1.0.0',
      capabilities: ['search', 'streams', 'verification'],
      rateLimit: this.rateLimitRPS
    };
  }
}

export default new LicensedProvider();

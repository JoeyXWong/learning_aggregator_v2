import { logger } from '../utils/logger';

export type ResourceType =
  | 'video'
  | 'article'
  | 'course'
  | 'book'
  | 'tutorial'
  | 'documentation'
  | 'repository'
  | 'other';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'unspecified';

export type PricingType = 'free' | 'freemium' | 'premium' | 'unknown';

export interface RawResource {
  url: string;
  title: string;
  description?: string;
  duration?: number; // in minutes
  platform?: string;
  stars?: number;
  viewCount?: number;
  rating?: number;
  publishDate?: Date;
  lastUpdated?: Date;
}

export interface ClassifiedResource extends RawResource {
  type: ResourceType;
  difficulty: DifficultyLevel;
  pricing: PricingType;
  qualityScore: number;
  normalizedUrl: string;
}

/**
 * Resource Classification Service
 * Classifies resources by type, difficulty, pricing, and quality
 */
export class ClassifierService {
  /**
   * Classify a raw resource
   */
  classify(resource: RawResource): ClassifiedResource {
    return {
      ...resource,
      type: this.detectType(resource),
      difficulty: this.detectDifficulty(resource),
      pricing: this.detectPricing(resource),
      qualityScore: this.calculateQualityScore(resource),
      normalizedUrl: this.normalizeUrl(resource.url),
    };
  }

  /**
   * Detect resource type based on URL and metadata
   */
  private detectType(resource: RawResource): ResourceType {
    const url = resource.url.toLowerCase();
    const title = resource.title.toLowerCase();
    const description = (resource.description || '').toLowerCase();

    // Video platforms
    if (
      url.includes('youtube.com') ||
      url.includes('youtu.be') ||
      url.includes('vimeo.com')
    ) {
      return 'video';
    }

    // GitHub repositories
    if (url.includes('github.com')) {
      return 'repository';
    }

    // Documentation sites
    if (
      url.includes('/docs/') ||
      url.includes('developer.mozilla.org') ||
      url.includes('devdocs.io') ||
      url.includes('.readthedocs.io')
    ) {
      return 'documentation';
    }

    // Course platforms
    if (
      url.includes('udemy.com') ||
      url.includes('coursera.org') ||
      url.includes('edx.org') ||
      url.includes('pluralsight.com') ||
      url.includes('linkedin.com/learning')
    ) {
      return 'course';
    }

    // Books
    if (
      title.includes('book') ||
      url.includes('books.google.com') ||
      url.includes('amazon.com') ||
      description.includes('isbn')
    ) {
      return 'book';
    }

    // Tutorial indicators
    if (
      title.includes('tutorial') ||
      title.includes('guide') ||
      title.includes('how to') ||
      description.includes('step-by-step')
    ) {
      return 'tutorial';
    }

    // Article/blog (default for web content)
    if (resource.duration && resource.duration < 30) {
      return 'article';
    }

    return 'other';
  }

  /**
   * Detect difficulty level based on content analysis
   */
  private detectDifficulty(resource: RawResource): DifficultyLevel {
    const text = `${resource.title} ${resource.description || ''}`.toLowerCase();

    // Beginner indicators
    const beginnerKeywords = [
      'beginner',
      'introduction',
      'getting started',
      'basics',
      '101',
      'fundamentals',
      'for beginners',
      'start here',
      'first steps',
      'crash course',
    ];

    // Advanced indicators
    const advancedKeywords = [
      'advanced',
      'expert',
      'mastery',
      'deep dive',
      'internals',
      'architecture',
      'optimization',
      'performance',
      'scaling',
      'production',
      'best practices',
      'design patterns',
    ];

    // Intermediate indicators
    const intermediateKeywords = [
      'intermediate',
      'practical',
      'real-world',
      'hands-on',
      'building',
      'creating',
      'developing',
    ];

    // Count keyword matches
    const beginnerCount = beginnerKeywords.filter((kw) =>
      text.includes(kw)
    ).length;
    const advancedCount = advancedKeywords.filter((kw) =>
      text.includes(kw)
    ).length;
    const intermediateCount = intermediateKeywords.filter((kw) =>
      text.includes(kw)
    ).length;

    // Explicit matches take precedence
    if (beginnerCount > 0 && beginnerCount >= advancedCount) {
      return 'beginner';
    }
    if (advancedCount > 0 && advancedCount > beginnerCount) {
      return 'advanced';
    }
    if (intermediateCount > 0) {
      return 'intermediate';
    }

    // Analyze prerequisites mentioned
    const prerequisiteCount = this.countPrerequisites(text);
    if (prerequisiteCount === 0) {
      return 'beginner';
    }
    if (prerequisiteCount > 3) {
      return 'advanced';
    }

    // Default to intermediate for ambiguous cases
    return 'intermediate';
  }

  /**
   * Count prerequisite mentions in text
   */
  private countPrerequisites(text: string): number {
    const prereqKeywords = [
      'prerequisite',
      'requires',
      'familiarity with',
      'knowledge of',
      'understanding of',
      'experience with',
      'should know',
      'must know',
      'assumes',
    ];

    return prereqKeywords.filter((kw) => text.includes(kw)).length;
  }

  /**
   * Detect pricing type (free vs premium)
   */
  private detectPricing(resource: RawResource): PricingType {
    const url = resource.url.toLowerCase();
    const title = resource.title.toLowerCase();
    const description = (resource.description || '').toLowerCase();

    // Always free platforms
    const freePlatforms = [
      'youtube.com',
      'youtu.be',
      'github.com',
      'developer.mozilla.org',
      'freecodecamp.org',
      'devdocs.io',
      'wikipedia.org',
    ];

    if (freePlatforms.some((platform) => url.includes(platform))) {
      return 'free';
    }

    // Premium indicators
    const premiumKeywords = ['paid', 'purchase', 'buy', 'subscription', 'premium'];
    if (
      premiumKeywords.some(
        (kw) => title.includes(kw) || description.includes(kw)
      )
    ) {
      return 'premium';
    }

    // Freemium platforms
    const freemiumPlatforms = ['udemy.com', 'coursera.org', 'skillshare.com'];
    if (freemiumPlatforms.some((platform) => url.includes(platform))) {
      return 'freemium';
    }

    // Free indicators
    const freeKeywords = ['free', 'open source', 'no cost'];
    if (
      freeKeywords.some(
        (kw) => title.includes(kw) || description.includes(kw)
      )
    ) {
      return 'free';
    }

    return 'unknown';
  }

  /**
   * Calculate quality score (0-100)
   * Combines rating, popularity, recency, and platform reputation
   */
  calculateQualityScore(resource: RawResource): number {
    let score = 0;

    // Rating signal (0-40 points)
    if (resource.rating) {
      score += (resource.rating / 5) * 40;
    } else {
      score += 20; // Neutral score if no rating
    }

    // Popularity signal (0-25 points)
    const popularity = resource.viewCount || resource.stars || 0;
    if (popularity > 0) {
      const popularityScore = Math.min(Math.log10(popularity) / 6, 1);
      score += popularityScore * 25;
    } else {
      score += 10; // Neutral score
    }

    // Recency signal (0-20 points)
    const date = resource.publishDate || resource.lastUpdated;
    if (date) {
      const ageInYears =
        (Date.now() - date.getTime()) / (365 * 24 * 60 * 60 * 1000);
      const recencyScore = Math.max(0, 1 - ageInYears / 3); // Decay over 3 years
      score += recencyScore * 20;
    } else {
      score += 10; // Neutral score
    }

    // Platform reputation (0-15 points)
    const platformScores: Record<string, number> = {
      'youtube.com': 10,
      'github.com': 15,
      'developer.mozilla.org': 15,
      'coursera.org': 12,
      'udemy.com': 10,
      'freecodecamp.org': 14,
      'edx.org': 12,
      'pluralsight.com': 11,
    };

    const platform = this.extractDomain(resource.url);
    score += platformScores[platform] || 5;

    return Math.round(score);
  }

  /**
   * Normalize URL for deduplication
   */
  normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);

      // Remove common tracking parameters
      const trackingParams = [
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_content',
        'ref',
        'source',
      ];

      trackingParams.forEach((param) => {
        urlObj.searchParams.delete(param);
      });

      // Remove www prefix first
      const host = urlObj.hostname.replace(/^www\./, '');

      // Normalize YouTube URLs
      if (host.includes('youtube.com')) {
        const videoId = urlObj.searchParams.get('v');
        if (videoId) {
          return `https://${host}/watch?v=${videoId}`;
        }
      }

      // Sort query parameters for consistency
      const params = Array.from(urlObj.searchParams.entries()).sort();
      const searchParams = new URLSearchParams(params);

      return `${urlObj.protocol}//${host}${urlObj.pathname}${
        searchParams.toString() ? '?' + searchParams.toString() : ''
      }`;
    } catch (error) {
      logger.warn('Failed to normalize URL', { url, error });
      return url;
    }
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, '');
    } catch (error) {
      return '';
    }
  }

  /**
   * Batch classify multiple resources
   */
  classifyBatch(resources: RawResource[]): ClassifiedResource[] {
    return resources.map((resource) => this.classify(resource));
  }
}

export const classifierService = new ClassifierService();

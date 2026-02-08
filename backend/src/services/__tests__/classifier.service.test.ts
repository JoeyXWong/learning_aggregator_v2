import { classifierService, type RawResource } from '../classifier.service';

describe('ClassifierService', () => {
  describe('detectType', () => {
    it('should detect YouTube videos', () => {
      const resource: RawResource = {
        url: 'https://www.youtube.com/watch?v=abc123',
        title: 'Learn React Hooks Tutorial',
        description: 'A comprehensive guide to React Hooks',
      };

      const classified = classifierService.classify(resource);
      expect(classified.type).toBe('video');
    });

    it('should detect GitHub repositories', () => {
      const resource: RawResource = {
        url: 'https://github.com/facebook/react',
        title: 'facebook/react',
        description: 'A JavaScript library for building user interfaces',
      };

      const classified = classifierService.classify(resource);
      expect(classified.type).toBe('repository');
    });

    it('should detect documentation', () => {
      const resource: RawResource = {
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
        title: 'JavaScript Documentation',
        description: 'Complete JavaScript reference',
      };

      const classified = classifierService.classify(resource);
      expect(classified.type).toBe('documentation');
    });

    it('should detect courses', () => {
      const resource: RawResource = {
        url: 'https://www.udemy.com/course/react-complete-guide',
        title: 'Complete React Developer Course',
        description: 'Master React from scratch',
      };

      const classified = classifierService.classify(resource);
      expect(classified.type).toBe('course');
    });
  });

  describe('detectDifficulty', () => {
    it('should detect beginner level', () => {
      const resource: RawResource = {
        url: 'https://example.com/intro',
        title: 'Introduction to React for Beginners',
        description: 'Getting started with React - no prior experience needed',
      };

      const classified = classifierService.classify(resource);
      expect(classified.difficulty).toBe('beginner');
    });

    it('should detect advanced level', () => {
      const resource: RawResource = {
        url: 'https://example.com/advanced',
        title: 'Advanced React Performance Optimization',
        description: 'Deep dive into React internals and optimization techniques',
      };

      const classified = classifierService.classify(resource);
      expect(classified.difficulty).toBe('advanced');
    });

    it('should detect intermediate level', () => {
      const resource: RawResource = {
        url: 'https://example.com/practical',
        title: 'Building Real-World React Applications',
        description: 'Intermediate practical hands-on guide to creating apps',
      };

      const classified = classifierService.classify(resource);
      expect(classified.difficulty).toBe('intermediate');
    });
  });

  describe('detectPricing', () => {
    it('should detect free YouTube content', () => {
      const resource: RawResource = {
        url: 'https://www.youtube.com/watch?v=abc123',
        title: 'Free React Tutorial',
      };

      const classified = classifierService.classify(resource);
      expect(classified.pricing).toBe('free');
    });

    it('should detect free GitHub content', () => {
      const resource: RawResource = {
        url: 'https://github.com/awesome/list',
        title: 'Awesome React Resources',
      };

      const classified = classifierService.classify(resource);
      expect(classified.pricing).toBe('free');
    });

    it('should detect freemium platforms', () => {
      const resource: RawResource = {
        url: 'https://www.udemy.com/course/react-guide',
        title: 'React Complete Guide',
      };

      const classified = classifierService.classify(resource);
      expect(classified.pricing).toBe('freemium');
    });

    it('should detect premium content', () => {
      const resource: RawResource = {
        url: 'https://example.com/premium-course',
        title: 'Premium React Course',
        description: 'This is a paid subscription course',
      };

      const classified = classifierService.classify(resource);
      expect(classified.pricing).toBe('premium');
    });
  });

  describe('calculateQualityScore', () => {
    it('should score high-quality resources higher', () => {
      const highQuality: RawResource = {
        url: 'https://github.com/facebook/react',
        title: 'React',
        rating: 4.8,
        stars: 200000,
        publishDate: new Date('2023-01-01'),
      };

      const lowQuality: RawResource = {
        url: 'https://example.com/unknown',
        title: 'Unknown Resource',
        rating: 2.0,
        viewCount: 100,
        publishDate: new Date('2010-01-01'),
      };

      const highScore = classifierService.calculateQualityScore(highQuality);
      const lowScore = classifierService.calculateQualityScore(lowQuality);

      expect(highScore).toBeGreaterThan(lowScore);
      expect(highScore).toBeGreaterThan(60);
      expect(lowScore).toBeLessThan(50);
    });

    it('should give neutral score to resources without metrics', () => {
      const resource: RawResource = {
        url: 'https://example.com/new',
        title: 'New Resource',
      };

      const score = classifierService.calculateQualityScore(resource);
      expect(score).toBeGreaterThan(30);
      expect(score).toBeLessThan(60);
    });
  });

  describe('normalizeUrl', () => {
    it('should remove tracking parameters', () => {
      const resource: RawResource = {
        url: 'https://example.com/page?utm_source=google&utm_campaign=test&ref=twitter',
        title: 'Test',
      };

      const classified = classifierService.classify(resource);
      expect(classified.normalizedUrl).toBe('https://example.com/page');
    });

    it('should normalize YouTube URLs', () => {
      const resource: RawResource = {
        url: 'https://www.youtube.com/watch?v=abc123&t=100&utm_source=share',
        title: 'Test Video',
      };

      const classified = classifierService.classify(resource);
      expect(classified.normalizedUrl).toBe(
        'https://youtube.com/watch?v=abc123'
      );
    });

    it('should remove www prefix', () => {
      const resource: RawResource = {
        url: 'https://www.example.com/page',
        title: 'Test',
      };

      const classified = classifierService.classify(resource);
      expect(classified.normalizedUrl).not.toContain('www.');
    });
  });

  describe('classifyBatch', () => {
    it('should classify multiple resources', () => {
      const resources: RawResource[] = [
        {
          url: 'https://www.youtube.com/watch?v=1',
          title: 'Video 1',
        },
        {
          url: 'https://github.com/test/repo',
          title: 'Test Repo',
        },
        {
          url: 'https://example.com/article',
          title: 'Article',
        },
      ];

      const classified = classifierService.classifyBatch(resources);

      expect(classified).toHaveLength(3);
      expect(classified[0].type).toBe('video');
      expect(classified[1].type).toBe('repository');
      expect(classified[2]).toHaveProperty('qualityScore');
    });
  });
});

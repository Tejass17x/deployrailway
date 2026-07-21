const landingRepository = require('../repository/landing.repository');
const { checkHealth } = require('../../../config/database/connection');

class LandingService {
  async getHealth() {
    return {
      status: 'UP',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  }

  async getDatabaseHealth() {
    const dbHealth = checkHealth();
    return {
      status: dbHealth.isHealthy ? 'HEALTHY' : 'UNHEALTHY',
      details: dbHealth
    };
  }

  async getStats() {
    return await landingRepository.getPlatformStats();
  }

  async getCategories() {
    const { cacheService } = require('../../../cache/cache.service');
    const cacheKey = 'landing:categories';
    try {
      const cached = await cacheService.get(cacheKey);
      if (cached) return cached;
    } catch (err) {
      console.error('Failed reading category cache: ', err.message);
    }

    const Publication = require('../../../models/Publication');

    const categoryDefs = [
      { id: 'cs', name: 'Computer Science', icon: 'Cpu', keywords: ['computer science', 'machine learning', 'artificial intelligence', 'software', 'algorithm', 'deep learning'] },
      { id: 'math', name: 'Mathematics', icon: 'Binary', keywords: ['mathematics', 'algebra', 'calculus', 'topology', 'statistics', 'number theory'] },
      { id: 'physics', name: 'Physics', icon: 'Atom', keywords: ['physics', 'quantum', 'relativity', 'thermodynamics', 'optics', 'mechanics'] },
      { id: 'bio', name: 'Biology & Life Sciences', icon: 'Dna', keywords: ['biology', 'genomics', 'ecology', 'evolution', 'cell biology', 'biochemistry'] },
      { id: 'med', name: 'Medicine & Healthcare', icon: 'HeartPulse', keywords: ['medicine', 'clinical', 'epidemiology', 'pharmacology', 'surgery', 'oncology'] },
      { id: 'chem', name: 'Chemistry', icon: 'FlaskConical', keywords: ['chemistry', 'organic chemistry', 'inorganic', 'polymer', 'synthesis', 'catalysis'] }
    ];

    const counts = await Promise.all(
      categoryDefs.map(cat =>
        Publication.countDocuments({
          isDeleted: { $ne: true },
          $or: [
            { keywords: { $in: cat.keywords.map(k => new RegExp(k, 'i')) } },
            { researchArea: { $in: cat.keywords.map(k => new RegExp(k, 'i')) } }
          ]
        })
      )
    );

    const categories = categoryDefs.map((cat, idx) => ({ ...cat, count: counts[idx] }));
    try {
      await cacheService.set(cacheKey, categories, 3600); // Cache for 1 hour
    } catch (err) {
      console.error('Failed setting category cache: ', err.message);
    }

    return categories;
  }

  async getFeatures() {
    return [
      {
        id: 'discovery',
        title: 'Research Discovery',
        description: 'Discover relevant research articles and preprints semantically parsed with AI.',
        comingSoon: false
      },
      {
        id: 'collaboration',
        title: 'Research Collaboration',
        description: 'Connect with co-authors, share private workspace drafts, and cooperate on publications.',
        comingSoon: false
      },
      {
        id: 'publications',
        title: 'Publication Management',
        description: 'Upload, manage, and index your academic publications easily on a single profile.',
        comingSoon: false
      },
      {
        id: 'ai-recs',
        title: 'AI Recommendation',
        description: 'Get automated, personalized recommendations of research items matching your expertise.',
        comingSoon: false
      },
      {
        id: 'analytics',
        title: 'Research Analytics',
        description: 'Track citation counts, reads, profile views, and index metrics over time.',
        comingSoon: false
      },
      {
        id: 'scholar-integration',
        title: 'Google Scholar Integration',
        description: 'Sync your publications and citation statistics from Google Scholar automatically.',
        comingSoon: true
      }
    ];
  }

  async getVersion() {
    return {
      version: '1.0.0',
      phase: 0,
      phaseName: 'Foundation & Project Setup'
    };
  }
}

module.exports = new LandingService();

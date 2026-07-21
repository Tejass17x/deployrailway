const mongoose = require('mongoose');
const logger = require('../../common/logger/winston');
const User = require('../../models/User');
const Event = require('../../models/Event');
const FeedEvent = require('../../models/FeedEvent');
const Publication = require('../../models/Publication');

const seedData = async () => {
  try {
    // Check if there is at least one user
    const firstUser = await User.findOne({ isDeleted: { $ne: true } });
    if (!firstUser) {
      logger.info('[Seeder] No active users found in DB. Skipping seeder until a user registers.');
      return;
    }

    const userId = firstUser._id;

    // 1. Seed Publications if empty
    const pubCount = await Publication.countDocuments({ isDeleted: { $ne: true } });
    if (pubCount === 0) {
      logger.info('[Seeder] Seeding default publications...');
      const publications = [
        {
          userId,
          title: 'Attention Is All You Need for Deep Representation Learning',
          authors: 'Sarah Jenkins, Ashish Vaswani, Noam Shazeer',
          journal: 'Advances in Neural Information Processing Systems',
          year: 2024,
          citations: 120,
          views: 1450,
          downloads: 320,
          abstract: 'We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable.',
          keywords: ['NLP', 'Transformers', 'Deep Learning', 'Attention'],
          publicationType: 'Journal Paper',
          status: 'published',
          aiAnalysis: {
            summary: 'Pioneering work demonstrating that self-attention mechanisms can completely replace recurrent and convolutional layers in deep learning representations.',
            researchGap: 'Evaluating scaling properties of pure self-attention layers on extremely long-context sequences.',
            futureWork: 'Apply the architecture to multi-modal video and audio streaming sequences.',
            methodology: 'Multi-head self-attention combined with positional encodings and residual feed-forward networks.',
            keyFindings: 'Achieved state-of-the-art results on translation tasks with significantly reduced training time.',
            noveltyScore: 9,
            difficultyLevel: 'Advanced'
          }
        },
        {
          userId,
          title: 'Deep Residual Learning for General Medical Image Segmentation',
          authors: 'Kaiming He, Xiangyu Zhang, Shaoqing Ren',
          journal: 'IEEE Transactions on Pattern Analysis and Machine Intelligence',
          year: 2025,
          citations: 85,
          views: 980,
          downloads: 210,
          abstract: 'Deeper neural networks are more difficult to train. We present a residual learning framework to ease the training of networks that are substantially deeper than those previously used. We explicitly reformulate the layers as learning residual functions.',
          keywords: ['Computer Vision', 'Deep Learning', 'Image Segmentation'],
          publicationType: 'Journal Paper',
          status: 'published',
          aiAnalysis: {
            summary: 'Introduced residual learning frameworks to enable training of extremely deep networks without vanishing gradient issues.',
            researchGap: 'Adapting ResNet architectures for real-time dense pixel prediction on mobile devices.',
            futureWork: 'Integrate skip connections with transformer-based visual encoders.',
            methodology: 'Feed-forward networks with shortcut connections performing identity mapping.',
            keyFindings: 'Won first place in multiple segmentation and classification benchmarks.',
            noveltyScore: 8,
            difficultyLevel: 'Advanced'
          }
        },
        {
          userId,
          title: 'Generative Adversarial Nets for Co-author Suggestion',
          authors: 'Ian Goodfellow, Jean Pouget-Abadie, Yoshua Bengio',
          journal: 'ACM SIGKDD International Conference on Knowledge Discovery',
          year: 2025,
          citations: 45,
          views: 650,
          downloads: 145,
          abstract: 'We propose a new framework for estimating generative models via an adversarial process, in which we simultaneously train two models: a generative model G that captures the data distribution, and a discriminative model D.',
          keywords: ['AI Safety', 'Generative Models', 'GANs', 'Vector Search'],
          publicationType: 'Conference Paper',
          status: 'published',
          aiAnalysis: {
            summary: 'Adapting GANs to model complex graph topology for recommending scientific collaborators and co-authors.',
            researchGap: 'Addressing mode collapse in discrete graph generative models.',
            futureWork: 'Implement conditional GANs utilizing user interests as prior conditions.',
            methodology: 'Adversarial game theory matching generator distribution against discriminator verification.',
            keyFindings: 'Constructed highly accurate link predictions over major scientific citation graphs.',
            noveltyScore: 8,
            difficultyLevel: 'Intermediate'
          }
        }
      ];
      await Publication.create(publications);
      logger.info('[Seeder] Default publications seeded.');
    }

    // 2. Seed Events if empty (Upcoming Conferences & Funding)
    const eventCount = await Event.countDocuments({ isDeleted: { $ne: true } });
    if (eventCount === 0) {
      logger.info('[Seeder] Seeding default conferences and events...');
      const events = [
        {
          title: 'International Conference on Machine Learning (ICML 2026)',
          description: 'The premier academic conference in machine learning and artificial intelligence, showcasing cutting-edge research.',
          type: 'Conference',
          date: new Date('2026-07-18'),
          link: 'https://icml.cc',
          organization: 'International Machine Learning Society'
        },
        {
          title: 'Conference on Neural Information Processing Systems (NeurIPS 2026)',
          description: 'Annual conference on neural information processing systems and foundational deep learning advancements.',
          type: 'Conference',
          date: new Date('2026-12-08'),
          link: 'https://neurips.cc',
          organization: 'NeurIPS Foundation'
        },
        {
          title: 'NSF Foundation Grant for Foundational AI Research',
          description: 'Funding opportunity for projects addressing scalability, safety, and alignment in multi-modal LLM systems.',
          type: 'Funding',
          date: new Date('2026-10-15'),
          link: 'https://nsf.gov/grants',
          organization: 'National Science Foundation'
        },
        {
          title: 'European Research Council (ERC) Advanced Grant 2026',
          description: 'Long-term funding to support excellent principal investigators in establishing breakthrough research initiatives.',
          type: 'Funding',
          date: new Date('2026-11-20'),
          link: 'https://erc.europa.eu',
          organization: 'European Research Council'
        }
      ];
      await Event.create(events);
      logger.info('[Seeder] Default events seeded.');
    }

    // 3. Seed FeedEvents if empty (Academic Jobs & Funding opportunities for the Phase 8 Feed sidebars)
    const feedEventCount = await FeedEvent.countDocuments({
      eventType: { $in: ['academic_job', 'funding_opportunity'] },
      isDeleted: { $ne: true }
    });

    if (feedEventCount === 0) {
      logger.info('[Seeder] Seeding default feed sidebars (jobs & funding)...');
      
      const seededConferences = await Event.find({ type: 'Conference' });
      const seededFunding = await Event.find({ type: 'Funding' });

      const feedEvents = [];

      // Add Jobs
      feedEvents.push({
        actorId: userId,
        eventType: 'academic_job',
        entityType: 'AcademicJob',
        entityId: new mongoose.Types.ObjectId(), // Dummy entity ID since it is a system event
        metadata: {
          title: 'Postdoctoral Fellow in Large Language Models',
          institution: 'Stanford University',
          department: 'Computer Science Department',
          location: 'Stanford, CA, USA',
          deadline: new Date('2026-09-01'),
          applyUrl: 'https://cs.stanford.edu/jobs/postdoc-llm'
        },
        score: 95
      });

      feedEvents.push({
        actorId: userId,
        eventType: 'academic_job',
        entityType: 'AcademicJob',
        entityId: new mongoose.Types.ObjectId(),
        metadata: {
          title: 'Assistant Professor in Quantum Computing',
          institution: 'Massachusetts Institute of Technology',
          department: 'Electrical Engineering & Computer Science',
          location: 'Cambridge, MA, USA',
          deadline: new Date('2026-10-15'),
          applyUrl: 'https://eecs.mit.edu/careers/faculty-quantum'
        },
        score: 90
      });

      // Add Funding
      if (seededFunding.length > 0) {
        feedEvents.push({
          actorId: userId,
          eventType: 'funding_opportunity',
          entityType: 'FundingOpportunity',
          entityId: seededFunding[0]._id,
          metadata: {
            title: seededFunding[0].title,
            description: seededFunding[0].description,
            grantAmount: '$500,000',
            deadline: seededFunding[0].date,
            applyUrl: seededFunding[0].link,
            location: 'Washington, D.C., USA'
          },
          score: 85
        });

        if (seededFunding[1]) {
          feedEvents.push({
            actorId: userId,
            eventType: 'funding_opportunity',
            entityType: 'FundingOpportunity',
            entityId: seededFunding[1]._id,
            metadata: {
              title: seededFunding[1].title,
              description: seededFunding[1].description,
              grantAmount: '€2.5M',
              deadline: seededFunding[1].date,
              applyUrl: seededFunding[1].link,
              location: 'Brussels, Belgium'
            },
            score: 80
          });
        }
      }

      await FeedEvent.create(feedEvents);
      logger.info('[Seeder] Default feed sidebars seeded.');
    }

    // Trigger legacy to R2 metadata migration
    try {
      const migrateLegacyToR2 = require('./migrate_legacy_to_r2');
      await migrateLegacyToR2();
    } catch (migErr) {
      logger.error('[Seeder] Metadata migration failed:', migErr);
    }

  } catch (err) {
    logger.error('[Seeder] Database seeding error:', err);
  }
};

module.exports = { seedData };

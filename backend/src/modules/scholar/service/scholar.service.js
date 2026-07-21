const mongoose = require('mongoose');
const googleScholarProfileRepository = require('../repository/google-scholar-profile.repository');
const publicationRepository = require('../repository/publication.repository');
const publicationAuthorRepository = require('../repository/publication-author.repository');
const coAuthorRepository = require('../repository/co-author.repository');
const citationGraphRepository = require('../repository/citation-graph.repository');
const researchAreaRepository = require('../repository/research-area.repository');
const keywordRepository = require('../repository/keyword.repository');
const importRepository = require('../repository/import.repository');
const importLogRepository = require('../repository/import-log.repository');
const derivedAnalyticsRepository = require('../repository/derived-analytics.repository');
const syncHistoryRepository = require('../repository/sync-history.repository');

const serpApiService = require('./serpapi.service');
const enrichmentService = require('./enrichment.service');
const importQueueService = require('./import-queue.service');

const Profile = require('../../../models/Profile');
const User = require('../../../models/User');
const SyncHistory = require('../../../models/SyncHistory');
const DerivedAnalytics = require('../../../models/DerivedAnalytics');
const Upload = require('../../../models/Upload');
const { ValidationError, NotFoundError, AppError } = require('../../../common/errors/AppError');
const logger = require('../../../common/logger/winston');

class ScholarService {
  constructor() {
    importQueueService.setScholarService(this);
  }

  /**
   * Validate Google Scholar URL format
   * Supported format: https://scholar.google.com/citations?user=XXXXXXXX
   */
  validateScholarURL(url) {
    if (!url) return false;
    const scholarRegex = /^https?:\/\/(www\.)?scholar\.google\.[a-z.]+\/citations\?.*user=([a-zA-Z0-9_-]{12}|[a-zA-Z0-9_-]{8,16})/;
    return scholarRegex.test(url);
  }

  /**
   * Extract Author ID from Google Scholar URL
   */
  extractAuthorId(url) {
    if (!url) return null;
    const match = url.match(/[?&]user=([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  }

  /**
   * Sync academic identity of user (Google Scholar)
   * Creates background job
   */
  async syncScholar(userId) {
    const profile = await Profile.findOne({ userId, isDeleted: { $ne: true } });
    if (!profile) {
      throw new NotFoundError('Profile not found.');
    }

    const scholarUrl = profile.socialLinks?.googleScholar;
    if (!scholarUrl) {
      throw new ValidationError('Google Scholar URL is not connected to your profile.');
    }

    const authorId = this.extractAuthorId(scholarUrl);
    if (!authorId) {
      throw new ValidationError('Invalid Google Scholar URL: Author ID could not be extracted.');
    }

    // Enqueue job in queue
    return await importQueueService.enqueue(userId, 'google_scholar', { authorId });
  }

  /**
   * Force reimport of scholar profile
   */
  async reImportScholar(userId) {
    // Force-clear any stale jobs (pending or running) so a fresh sync can start
    await importRepository.model.updateMany(
      { userId, provider: 'google_scholar', status: { $in: ['pending', 'running'] } },
      { $set: { status: 'failed', error: { message: 'Force-cleared by reimport request' } } }
    );
    return await this.syncScholar(userId);
  }

  /**
   * Sync only publications
   */
  async syncScholarPublications(userId) {
    const profile = await Profile.findOne({ userId, isDeleted: { $ne: true } });
    if (!profile) {
      throw new NotFoundError('Profile not found.');
    }

    const scholarUrl = profile.socialLinks?.googleScholar;
    if (!scholarUrl) {
      throw new ValidationError('Google Scholar URL is not connected to your profile.');
    }

    const authorId = this.extractAuthorId(scholarUrl);
    if (!authorId) {
      throw new ValidationError('Invalid Google Scholar URL.');
    }

    return await importQueueService.enqueue(userId, 'google_scholar', { authorId, syncType: 'publications' });
  }

  /**
   * Sync only metrics
   */
  async syncScholarMetrics(userId) {
    const profile = await Profile.findOne({ userId, isDeleted: { $ne: true } });
    if (!profile) {
      throw new NotFoundError('Profile not found.');
    }

    const scholarUrl = profile.socialLinks?.googleScholar;
    if (!scholarUrl) {
      throw new ValidationError('Google Scholar URL is not connected to your profile.');
    }

    const authorId = this.extractAuthorId(scholarUrl);
    if (!authorId) {
      throw new ValidationError('Invalid Google Scholar URL.');
    }

    return await importQueueService.enqueue(userId, 'google_scholar', { authorId, syncType: 'metrics' });
  }

  /**
   * Inner synchronization execution worker (called by ImportQueueService)
   */
  async syncScholarData(jobId, userId, authorId) {
    const startedAt = new Date();
    let importedPublicationsCount = 0;
    let importedCitationsCount = 0;
    let importedCoAuthorsCount = 0;
    let enrichedCount = 0;
    let missingDoiCount = 0;
    let missingAbstractCount = 0;
    let missingPdfCount = 0;
    const failedPublications = [];

    const jobRecord = await importRepository.findById(jobId);
    const syncType = jobRecord?.metadata?.syncType || 'full';

    const updateProgress = async (prog, msg) => {
      await importRepository.update(jobId, { progress: prog });
      await importQueueService.log(jobId, userId, msg, 'info');
    };

    try {
      // --- STEP 1: Fetch Author Profile Details (10%) ---
      await updateProgress(10, 'Fetching author profile metadata from SerpAPI...');
      const data = await serpApiService.fetchAuthorDetails(authorId);
      const isMockData = data?._isMock === true; // Check if SerpAPI fell back to mock data

      if (!data || !data.author) {
        throw new Error('Author details not found in SerpAPI response.');
      }

      await updateProgress(20, 'Saving author profile metadata to database...');
      
      const interests = data.author.interests ? data.author.interests.map(i => i.title) : [];
      const totalCitations = data.cited_by?.table?.[0]?.citations?.all || 0;
      const hIndex = data.cited_by?.table?.[1]?.h_index?.all || 0;
      const i10Index = data.cited_by?.table?.[2]?.i10_index?.all || 0;
      importedCitationsCount = totalCitations;

      // Check if there is an existing scholar profile for this user
      const existingScholarProfile = await googleScholarProfileRepository.model.findOne({ userId });
      const isDifferentProfile = existingScholarProfile && existingScholarProfile.authorId !== authorId;

      if (isDifferentProfile) {
        logger.info(`[ScholarSync] Different profile detected for user ${userId}. Old: ${existingScholarProfile.authorId}, New: ${authorId}. Cleaning up old profile data...`);

        // 1. Find and delete all publications imported from Google Scholar
        const scholarPubs = await publicationRepository.model.find({
          userId,
          $or: [
            { googleScholarVerified: true },
            { googleScholarPublicationId: { $exists: true, $ne: null } }
          ]
        });

        const scholarPubIds = scholarPubs.map(p => p._id);

        if (scholarPubIds.length > 0) {
          // Delete publication authors associated with these publications
          await publicationAuthorRepository.model.deleteMany({ publicationId: { $in: scholarPubIds } });

          // Delete metrics associated with these publications
          const PublicationMetric = require('../../../models/PublicationMetric');
          await PublicationMetric.deleteMany({ publicationId: { $in: scholarPubIds } });

          // Delete publications themselves
          await publicationRepository.model.deleteMany({ _id: { $in: scholarPubIds } });
        }

        // 2. Delete scholar metrics
        const AcademicMetrics = require('../../../models/AcademicMetrics');
        await AcademicMetrics.deleteMany({ userId, provider: 'google_scholar' });

        // 3. Delete co-authors
        await coAuthorRepository.deleteByUserId(userId);

        // 4. Delete citation graph
        await citationGraphRepository.deleteByUserId(userId);

        // 5. Delete keywords
        const Keyword = require('../../../models/Keyword');
        await Keyword.deleteMany({ userId });

        // 6. Delete research areas
        const ResearchArea = require('../../../models/ResearchArea');
        await ResearchArea.deleteMany({ userId });

        // 7. Delete sync history
        const SyncHistory = require('../../../models/SyncHistory');
        await SyncHistory.deleteMany({ userId });

        // 8. Delete derived analytics
        const DerivedAnalytics = require('../../../models/DerivedAnalytics');
        await DerivedAnalytics.deleteMany({ userId });

        // 9. Delete research metrics
        const ResearchMetric = require('../../../models/ResearchMetric');
        await ResearchMetric.deleteMany({ userId });

        // 10. Delete old google scholar profiles
        await googleScholarProfileRepository.model.deleteMany({ userId });
      } else {
        // Same profile: delete any other conflicting profiles if they somehow exist
        await googleScholarProfileRepository.model.deleteMany({ userId, authorId: { $ne: authorId } });
      }

      // Google Scholar profile details - upsert by authorId (globally unique) instead of userId
      await googleScholarProfileRepository.model.findOneAndUpdate(
        { authorId },
        {
          userId,
          authorId,
          profileURL: `https://scholar.google.com/citations?user=${authorId}`,
          name: data.author.name,
          affiliation: data.author.affiliation || '',
          verifiedEmail: data.author.email || '',
          profileImage: data.author.thumbnail || '',
          researchInterests: interests,
          totalCitations,
          hIndex,
          i10Index,
          verified: data.author.verified || false,
          lastImportedAt: new Date(),
          syncStatus: 'completed',
          isDeleted: false,
          deletedAt: null,
          deletedBy: null
        },
        { upsert: true, new: true }
      );

      // Check if the user has custom-uploaded a profile image to Cloudflare R2
      const activeAvatarUpload = await Upload.findOne({ userId, purpose: 'profile-avatar', isDeleted: { $ne: true } });
      let profileImageVal;
      if (activeAvatarUpload) {
        profileImageVal = {
          url: activeAvatarUpload.secure_url,
          objectKey: activeAvatarUpload.public_id || '',
          mimeType: activeAvatarUpload.mimetype || 'image/jpeg',
          fileSize: activeAvatarUpload.bytes || 0,
          uploadedAt: activeAvatarUpload.createdAt || new Date()
        };
      } else {
        profileImageVal = data.author.thumbnail || '';
      }

      // Sync basic profile data back to main researcher profile using Data Source Tracking
      const mainProfile = await Profile.findOne({ userId });
      if (mainProfile) {
        const syncField = (profile, field, val) => {
          if (!profile.dataSourceTracking) {
            profile.dataSourceTracking = new Map();
          }
          const tracking = profile.dataSourceTracking.get(field);
          if (tracking && tracking.userModified === true) {
            logger.info(`Preserving user-modified field '${field}' with value: ${typeof tracking.value === 'object' ? JSON.stringify(tracking.value) : tracking.value}`);
            return;
          }
          profile[field] = val;
          profile.dataSourceTracking.set(field, {
            value: typeof val === 'object' ? val.url : val,
            source: 'google_scholar',
            lastSyncedAt: new Date(),
            userModified: false
          });
        };

        syncField(mainProfile, 'institution', data.author.affiliation || '');
        syncField(mainProfile, 'displayName', data.author.name || '');
        syncField(mainProfile, 'profileImage', profileImageVal);
        await mainProfile.save();
      }

      const mainUser = await User.findById(userId).select('+password');
      if (mainUser) {
        mainUser.profileImage = profileImageVal;
        await mainUser.save();
      }

      // --- STEP 2: Fetch and Save Publications (Incremental Sync) (30%-50%) ---
      let articles = [];
      let updatedCount = 0;
      let duplicateCount = 0;
      let skippedCount = 0;

      if (syncType !== 'metrics') {
        await updateProgress(30, 'Fetching publications list from Google Scholar...');
        
        // Use the first batch of articles already fetched in the details request (up to 100)
        if (data.articles && data.articles.length > 0) {
          articles = data.articles;
        }

        // Sequential fetching to avoid rate limits (SerpAPI has strict limits)
        if (articles.length === 100) {
          let hasMore = true;
          let nextStart = 100;
          const SEQUENTIAL_DELAY_MS = 3000; // 3 second delay between sequential requests

          while (hasMore) {
            await importQueueService.log(jobId, userId, `Fetching publications starting at index ${nextStart}...`);

            // Sequential fetching with delay between requests
            const batch = await serpApiService.fetchAuthorArticles(authorId, nextStart);

            if (batch && batch.articles && batch.articles.length > 0) {
              articles = articles.concat(batch.articles);
              if (batch.articles.length < 100) {
                hasMore = false;
              } else {
                nextStart += 100;
                // Add delay between requests to respect rate limits
                await new Promise(resolve => setTimeout(resolve, SEQUENTIAL_DELAY_MS));
              }
            } else {
              hasMore = false;
            }
          }
        }

        await updateProgress(50, `Indexing and comparing ${articles.length} publications for duplicates...`);

        // Incremental Syncing to prevent duplicating existing records
        const existingPubs = await publicationRepository.model.find({ userId });
        
        const getTitleSimilarity = (title1, title2) => {
          const clean = (str) => str.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
          const words1 = new Set(clean(title1));
          const words2 = new Set(clean(title2));
          if (words1.size === 0 || words2.size === 0) return 0;
          const intersection = new Set([...words1].filter(x => words2.has(x)));
          const union = new Set([...words1, ...words2]);
          return intersection.size / union.size;
        };

        const findMatchingPublication = (article, existingList) => {
          if (article.citation_id) {
            const match = existingList.find(p => p.googleScholarPublicationId === article.citation_id || p.citationId === article.citation_id);
            if (match) return match;
          }
          if (article.doi) {
            const match = existingList.find(p => p.doi && p.doi.toLowerCase().trim() === article.doi.toLowerCase().trim());
            if (match) return match;
          }
          const normArticleTitle = article.title.toLowerCase().replace(/[^a-z0-9]/g, '');
          const exactMatch = existingList.find(p => p.title.toLowerCase().replace(/[^a-z0-9]/g, '') === normArticleTitle);
          if (exactMatch) return exactMatch;

          for (const pub of existingList) {
            const sim = getTitleSimilarity(article.title, pub.title);
            const yearDiff = Math.abs((article.year || 0) - (pub.year || 0));
            if (sim > 0.85 && yearDiff <= 1) {
              return pub;
            }
            if (sim > 0.70 && article.authors && pub.authors) {
              const cleanAuthor = (name) => name.toLowerCase().replace(/[^a-z]/g, '');
              const artAuthors = article.authors.split(',').map(cleanAuthor);
              const pubAuthors = pub.authors.split(',').map(cleanAuthor);
              const hasAuthorOverlap = artAuthors.some(a => pubAuthors.some(p => p.includes(a) || a.includes(p)));
              if (hasAuthorOverlap && yearDiff <= 1) {
                return pub;
              }
            }
          }
          return null;
        };

        const bulkUpdateOps = [];
        const newPubsToCreate = [];
        const newAuthorsToCreate = [];
        const newMetricsToCreate = [];

        const PublicationEdit = require('../../../models/PublicationEdit');

        for (const article of articles) {
          const dbPublication = findMatchingPublication(article, existingPubs);

          if (dbPublication) {
            duplicateCount++;

            const isManual = !dbPublication.googleScholarPublicationId;
            const manualEdits = await PublicationEdit.findOne({ publicationId: dbPublication._id });
            const hasEdits = !!manualEdits;

            const updateFields = {
              citations: article.cited_by?.value || dbPublication.citations || 0,
              googleScholarPublicationId: article.citation_id || dbPublication.googleScholarPublicationId,
              citationId: article.citation_id || dbPublication.citationId,
              googleScholarVerified: true,
              lastSyncedAt: new Date()
            };

            // If NOT manually edited or manually created, sync metadata
            if (!isManual && !hasEdits) {
              updateFields.paperURL = article.link || dbPublication.paperURL || '';
              updateFields.year = article.year || dbPublication.year;
              if (article.publication) {
                updateFields.publication = article.publication;
              }
            }

            bulkUpdateOps.push({
              updateOne: {
                filter: { _id: dbPublication._id },
                update: { $set: updateFields }
              }
            });
            
            updatedCount++;
          } else {
            const { generateSlug } = require('../../publication/helper/slug.helper');
            const slug = generateSlug(article.title);
            const tempPubId = new mongoose.Types.ObjectId();

            // ── Metadata Enrichment (skip for mock data, timeout for real) ──
            let pubDoi = article.doi || null;
            let enrichedMeta = {};
            const ENRICH_TIMEOUT_MS = isMockData ? 1 : 10000; // skip enrichment if mock data

            if (!pubDoi && !isMockData) {
              try {
                pubDoi = await Promise.race([
                  enrichmentService.lookupDOI(article.title, article.year, article.authors),
                  new Promise(resolve => setTimeout(() => resolve(null), ENRICH_TIMEOUT_MS))
                ]);
              } catch (e) {
                pubDoi = null;
              }
            }

            if (!isMockData && (pubDoi || article.title)) {
              try {
                enrichedMeta = await Promise.race([
                  enrichmentService.fetchMetadata(pubDoi, article.title),
                  new Promise(resolve => setTimeout(() => resolve({}), ENRICH_TIMEOUT_MS))
                ]);
                if (enrichedMeta && Object.keys(enrichedMeta).length > 0) {
                  enrichedCount++;
                }
              } catch (enrichErr) {
                enrichedMeta = {};
              }
            }
            // ────────────────────────────────────────────────────────────────

            let newPub = {
              _id: tempPubId,
              userId,
              ownerId: userId,
              title: article.title,
              slug,
              authors: article.authors || '',
              publication: article.publication || '',
              year: article.year,
              citations: article.cited_by?.value || 0,
              citationId: article.citation_id || '',
              googleScholarPublicationId: article.citation_id || '',
              googleScholarVerified: true,
              lastSyncedAt: new Date(),
              paperURL: article.link || '',
              publisher: article.publisher || '',
              status: 'published',
              visibility: 'Public',
              doi: pubDoi || undefined
            };

            // Step 3: Merge enriched metadata (never overwrites Google Scholar values)
            newPub = enrichmentService.merge(newPub, enrichedMeta);

            // Step 4: If still unresolved (no Crossref type match), guess from Scholar's own venue text
            if (!newPub.publicationType) {
              const venueText = `${article.publication || ''} ${newPub.journal || ''}`.toLowerCase();
              if (venueText.includes('patent')) newPub.publicationType = 'Patent';
              else if (venueText.includes('chapter')) newPub.publicationType = 'Book Chapter';
              else if (/\bbook\b/.test(venueText)) newPub.publicationType = 'Book';
              else if (/proceedings|conference|symposium|workshop/.test(venueText)) newPub.publicationType = 'Conference Paper';
              else newPub.publicationType = 'Journal Paper';
            }

            // Track missing field counts
            if (!newPub.doi) missingDoiCount++;
            if (!newPub.abstract) missingAbstractCount++;
            if (!newPub.pdfURL) missingPdfCount++;

            newPubsToCreate.push(newPub);

            newMetricsToCreate.push({
              publicationId: tempPubId,
              views: 0,
              downloads: 0,
              citations: article.cited_by?.value || 0,
              shares: 0,
              bookmarks: 0,
              comments: 0
            });

            if (article.authors) {
              const authorNames = article.authors.split(',').map(name => name.trim());
              authorNames.forEach((name, index) => {
                newAuthorsToCreate.push({
                  publicationId: tempPubId,
                  name,
                  isCoAuthor: name.toLowerCase() !== data.author.name.toLowerCase(),
                  order: index
                });
              });
            }
            importedPublicationsCount++;
          }
        }

        // Execute bulk database updates and inserts in a single high-performance bulkWrite call
        const bulkOps = [...bulkUpdateOps];
        const successfulPubIds = new Set();

        for (const pubDoc of newPubsToCreate) {
          bulkOps.push({
            insertOne: {
              document: pubDoc
            }
          });
          successfulPubIds.add(pubDoc._id.toString());
        }

        if (bulkOps.length > 0) {
          try {
            await publicationRepository.model.bulkWrite(bulkOps, { ordered: false });
          } catch (bulkErr) {
            logger.error(`[Scholar] Bulk write publications failed or returned partial errors: ${bulkErr.message}`);
            // Check for individual write errors and populate failedPublications/importedPublicationsCount
            if (bulkErr.writeErrors) {
              bulkErr.writeErrors.forEach(we => {
                const op = bulkOps[we.index];
                if (op && op.insertOne) {
                  const title = op.insertOne.document.title;
                  const pubId = op.insertOne.document._id.toString();
                  logger.error(`[Scholar] Failed to insert publication "${title}": ${we.errmsg}`);
                  failedPublications.push({ title, error: we.errmsg });
                  successfulPubIds.delete(pubId);
                  importedPublicationsCount--;
                }
              });
            }
          }
        }

        // Insert publication authors only for successfully inserted pubs
        const validAuthors = newAuthorsToCreate.filter(a => successfulPubIds.has(a.publicationId.toString()));
        if (validAuthors.length > 0) {
          try {
            await publicationAuthorRepository.model.insertMany(validAuthors, { ordered: false });
          } catch (authorErr) {
            logger.warn(`[Scholar] Some author records failed to insert during bulk save: ${authorErr.message}`);
          }
        }

        // Insert metrics only for successfully inserted pubs
        const validMetrics = newMetricsToCreate.filter(m => successfulPubIds.has(m.publicationId.toString()));
        if (validMetrics.length > 0) {
          try {
            const PublicationMetric = require('../../../models/PublicationMetric');
            await PublicationMetric.insertMany(validMetrics, { ordered: false });
          } catch (metricErr) {
            logger.warn(`[Scholar] Some metric records failed to insert during bulk save: ${metricErr.message}`);
          }
        }
      }

      // --- STEP 3: Save Citations Graph History (60%) ---
      await updateProgress(65, 'Updating citations history graph...');
      await citationGraphRepository.deleteByUserId(userId);
      
      if (data.cited_by?.graph && data.cited_by.graph.length > 0) {
        const graphData = data.cited_by.graph.map(g => ({
          userId,
          year: g.year,
          citations: g.citations
        }));
        await citationGraphRepository.createMany(graphData);
      }

      if (syncType !== 'metrics') {
        // --- STEP 4: Save Co-Authors (75%) ---
        await updateProgress(75, 'Updating co-authors directory...');
        await coAuthorRepository.deleteByUserId(userId);

        if (data.co_authors && data.co_authors.length > 0) {
          const coAuthorsData = data.co_authors.map(c => ({
            userId,
            authorId: c.author_id,
            name: c.name,
            affiliation: c.affiliation || '',
            email: c.email || '',
            photo: c.thumbnail || '',
            profileURL: c.link || `https://scholar.google.com/citations?user=${c.author_id}`
          }));
          await coAuthorRepository.createMany(coAuthorsData);
          importedCoAuthorsCount = coAuthorsData.length;
        }

        // --- STEP 5: Generate Research Areas & Keywords (90%) ---
        await updateProgress(90, 'Normalizing keywords and research area tags...');
        
        if (interests.length > 0) {
          await researchAreaRepository.model.findOneAndUpdate(
            { userId, name: 'Primary Research Interests' },
            { $addToSet: { topics: { $each: interests }, domains: { $each: interests.slice(0, 3) } } },
            { upsert: true, new: true }
          );

          // Run keyword upserts in parallel
          await Promise.all(interests.map(interest => 
            keywordRepository.model.findOneAndUpdate(
              { userId, name: interest },
              { $inc: { count: 1 } },
              { upsert: true }
            )
          ));
        }
      }

      // --- STEP 6: Derived Analytics & Post-sync calculations (95%) ---
      await updateProgress(95, 'Recalculating derived analytics and profile stats...');
      await this.calculateDerivedAnalytics(userId);

      // Update AcademicMetrics (scholar_metrics)
      try {
        const AcademicMetrics = require('../../../models/AcademicMetrics');
        await AcademicMetrics.findOneAndUpdate(
          { userId, provider: 'google_scholar' },
          {
            userId,
            provider: 'google_scholar',
            publications: articles.length,
            citations: totalCitations,
            hIndex,
            i10Index,
            isDeleted: false
          },
          { upsert: true, new: true }
        );

        await AcademicMetrics.findOneAndUpdate(
          { userId, provider: 'aggregate' },
          {
            userId,
            provider: 'aggregate',
            publications: articles.length,
            citations: totalCitations,
            hIndex,
            i10Index,
            isDeleted: false
          },
          { upsert: true, new: true }
        );
      } catch (metricsErr) {
        logger.error('Error updating AcademicMetrics: ' + metricsErr.message);
      }

      try {
        const profileService = require('../../profile/service/profile.service');
        await profileService.calculateAndSaveProfileCompletion(userId);
        await profileService.calculateAndSaveResearchMetrics(userId);
      } catch (err) {
        logger.error('Error in post-sync metric calculations: ' + err.message);
        // Fallback: directly update Profile.metrics from GoogleScholarProfile data
        // so the user sees correct h-index/i10-index even if full recalculation fails
        try {
          const GoogleScholarProfile = require('../../../models/GoogleScholarProfile');
          const Profile = require('../../../models/Profile');
          const scholarProfile = await GoogleScholarProfile.findOne({ userId }).lean();
          if (scholarProfile) {
            await Profile.findOneAndUpdate(
              { userId },
              {
                $set: {
                  'metrics.totalCitations': scholarProfile.totalCitations || 0,
                  'metrics.hIndex': scholarProfile.hIndex || 0,
                  'metrics.i10Index': scholarProfile.i10Index || 0
                }
              }
            );
            logger.info(`[ScholarSync] Fallback metrics update succeeded for user ${userId}`);
          }
        } catch (fallbackErr) {
          logger.error('Fallback metrics update also failed: ' + fallbackErr.message);
        }
      }

      // Record Sync History
      await syncHistoryRepository.create({
        userId,
        startedAt,
        completedAt: new Date(),
        status: 'completed',
        importedPublicationsCount,
        importedCitationsCount,
        importedCoAuthorsCount
      });

      // Update background import job metadata stats (detailed report)
      const job = await importRepository.findById(jobId);
      if (job) {
        await importRepository.update(jobId, {
          metadata: {
            ...(job.metadata || {}),
            importedCount: importedPublicationsCount,
            updatedCount: updatedCount,
            duplicateCount: duplicateCount,
            skippedCount: skippedCount,
            enrichedCount,
            failedCount: failedPublications.length,
            missingDoiCount,
            missingAbstractCount,
            missingPdfCount,
            failedPublications,
            lastSyncTime: new Date()
          }
        });
      }

      await updateProgress(100, 'Academic portfolio synchronized successfully!');

      // Invalidate Redis/in-memory caches to update UI immediately
      try {
        const { ProfileCache, FeedCache, ScholarCache, LookupCache } = require('../../../cache/cache.service');
        await Promise.all([
          ProfileCache.del(String(userId)),
          ScholarCache.del(String(userId)),
          FeedCache.flush()
        ]);
        if (LookupCache && LookupCache.invalidate) {
          await LookupCache.invalidate();
        }
        logger.info(`[ScholarSync] Redis cache invalidated successfully for user: ${userId}`);
      } catch (cacheErr) {
        logger.error(`[ScholarSync] Redis cache invalidation failed: ${cacheErr.message}`);
      }

      // Emit Socket.IO events for instant UI update
      try {
        const socket = require('../../../socket');
        if (socket) {
          socket.emitToUser(String(userId), 'scholarImported', { userId: String(userId), authorId });
          socket.emitToUser(String(userId), 'scholarSyncCompleted', { userId: String(userId), authorId });
          socket.emitToUser(String(userId), 'profileUpdated', { userId: String(userId) });
        }
      } catch (sockErr) {
        logger.warn(`[ScholarSync] Socket emit failed: ${sockErr.message}`);
      }
    } catch (err) {
      // Record Sync History failure
      await syncHistoryRepository.create({
        userId,
        startedAt,
        completedAt: new Date(),
        status: 'failed',
        importedPublicationsCount,
        importedCitationsCount,
        importedCoAuthorsCount,
        error: { message: err.message }
      });
      throw err;
    }
  }

  /**
   * Recalculates all derived analytics from MongoDB collections and stores them.
   */
  async calculateDerivedAnalytics(userId) {
    const publications = await publicationRepository.model.find({ userId, isDeleted: { $ne: true } });
    const totalPublications = publications.length;

    if (totalPublications === 0) {
      return null;
    }

    let journalCount = 0;
    let conferenceCount = 0;
    let totalCitations = 0;
    let oldestYear = new Date().getFullYear();
    let latestYear = 1900;
    let mostCitedPub = null;
    let oldestPub = null;
    let latestPub = null;

    const yearCounts = {};

    publications.forEach(pub => {
      const pubName = (pub.publication || '').toLowerCase();
      const pubTitle = (pub.title || '').toLowerCase();
      const pubType = (pub.publicationType || '').toLowerCase();

      // Simple keywords heuristic matching for journal vs conference
      if (pubType === 'journal' || pubName.includes('journal') || pubName.includes('transactions') || pubName.includes('letters')) {
        journalCount++;
      } else if (pubType === 'conference' || pubName.includes('proceedings') || pubName.includes('conference') || pubName.includes('symposium') || pubName.includes('proceedings') || pubName.includes('workshop')) {
        conferenceCount++;
      } else {
        // Fallback default
        journalCount++;
      }

      totalCitations += pub.citations || 0;

      if (pub.year) {
        if (pub.year < oldestYear) {
          oldestYear = pub.year;
          oldestPub = pub;
        }
        if (pub.year > latestYear) {
          latestYear = pub.year;
          latestPub = pub;
        }
        yearCounts[pub.year] = (yearCounts[pub.year] || 0) + 1;
      }

      if (!mostCitedPub || (pub.citations || 0) > (mostCitedPub.citations || 0)) {
        mostCitedPub = pub;
      }
    });

    const averageCitations = totalPublications > 0 ? (totalCitations / totalPublications) : 0;
    const yearRange = Math.max(1, latestYear - oldestYear + 1);
    const averagePublicationsPerYear = totalPublications / yearRange;

    let mostActiveResearchYear = null;
    let maxActiveYearCount = 0;
    Object.entries(yearCounts).forEach(([yr, cnt]) => {
      if (cnt > maxActiveYearCount) {
        maxActiveYearCount = cnt;
        mostActiveResearchYear = parseInt(yr);
      }
    });

    // Keywords
    const topKeywords = await keywordRepository.model.find({ userId }).sort({ count: -1 }).limit(2);
    const mostFrequentKeyword = topKeywords[0]?.name || 'Research';
    const topResearchDomain = topKeywords[1]?.name || 'Computer Science';

    // Experience
    const researchExperience = Math.max(0, new Date().getFullYear() - oldestYear);

    // Citations Growth rate (using citation graph)
    const citationHistory = await citationGraphRepository.findByUserId(userId);
    let citationGrowthRate = 0;
    if (citationHistory.length >= 2) {
      const prev = citationHistory[citationHistory.length - 2].citations || 0;
      const curr = citationHistory[citationHistory.length - 1].citations || 0;
      if (prev > 0) {
        citationGrowthRate = ((curr - prev) / prev) * 100;
      }
    }

    // Publication Growth rate (comparing counts across years)
    let publicationGrowthRate = 0;
    if (Object.keys(yearCounts).length >= 2) {
      const sortedYears = Object.keys(yearCounts).map(Number).sort((a, b) => a - b);
      const prevYear = sortedYears[sortedYears.length - 2];
      const currYear = sortedYears[sortedYears.length - 1];
      const prevCount = yearCounts[prevYear];
      const currCount = yearCounts[currYear];
      if (prevCount > 0) {
        publicationGrowthRate = ((currCount - prevCount) / prevCount) * 100;
      }
    }

    // Research Score
    const ResearchMetric = require('../../../models/ResearchMetric');
    const metric = await ResearchMetric.findOne({ userId });
    const researchScore = metric?.researchScore || 0;

    const derivedData = {
      userId,
      totalPublications,
      journalPapers: journalCount,
      conferencePapers: conferenceCount,
      averageCitations: Math.round(averageCitations * 100) / 100,
      averagePublicationsPerYear: Math.round(averagePublicationsPerYear * 100) / 100,
      mostActiveResearchYear,
      mostCitedPublication: mostCitedPub?._id || null,
      mostCitedPublicationTitle: mostCitedPub?.title || '',
      mostCitedPublicationCitations: mostCitedPub?.citations || 0,
      mostFrequentKeyword,
      topResearchDomain,
      researchExperience,
      citationGrowthRate: Math.round(citationGrowthRate * 100) / 100,
      publicationGrowthRate: Math.round(publicationGrowthRate * 100) / 100,
      trendingResearchArea: mostFrequentKeyword,
      latestPublication: latestPub?._id || null,
      latestPublicationTitle: latestPub?.title || '',
      oldestPublication: oldestPub?._id || null,
      oldestPublicationTitle: oldestPub?.title || '',
      researchScore
    };

    return await DerivedAnalytics.findOneAndUpdate(
      { userId },
      derivedData,
      { upsert: true, new: true }
    );
  }

  // Retrieve scholar profile details
  async getProfile(userId) {
    const profile = await googleScholarProfileRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundError('Complete Your profile and link Google Scholar');
    }
    return profile;
  }

  // Retrieve publications list
  async getPublications(userId, options = {}) {
    return await publicationRepository.findByUserId(userId, options);
  }

  // Retrieve coauthors
  async getCoAuthors(userId) {
    return await coAuthorRepository.findByUserId(userId);
  }

  // Retrieve citation graph history
  async getCitations(userId) {
    return await citationGraphRepository.findByUserId(userId);
  }

  // Retrieve derived analytics details
  async getAnalytics(userId) {
    const analytics = await derivedAnalyticsRepository.findByUserId(userId);
    if (!analytics) {
      // Trigger a recalculation if not found
      return await this.calculateDerivedAnalytics(userId);
    }
    return analytics;
  }

  // Retrieve sync progress status
  async getImportStatus(userId) {
    const activeJob = await importRepository.findActiveImportByUserId(userId);
    if (activeJob) {
      const logs = await importLogRepository.findByImportId(activeJob._id);
      return {
        active: true,
        job: activeJob,
        logs
      };
    }

    const lastCompleted = await importRepository.findLastCompletedByUserId(userId);
    return {
      active: false,
      job: lastCompleted || null,
      logs: []
    };
  }
}

module.exports = new ScholarService();
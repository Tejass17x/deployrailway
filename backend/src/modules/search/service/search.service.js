const mongoose = require('mongoose');
const Publication = require('../../../models/Publication');
const PublicationAuthor = require('../../../models/PublicationAuthor');
const PublicationKeyword = require('../../../models/PublicationKeyword');
const PublicationResearchArea = require('../../../models/PublicationResearchArea');
const SearchHistory = require('../../../models/SearchHistory');
const SearchAnalytic = require('../../../models/SearchAnalytic');
const User = require('../../../models/User');
const Profile = require('../../../models/Profile');
const Project = require('../../project/models/Project');
const { ValidationError } = require('../../../common/errors/AppError');

// Sanitize a query string to prevent regex injection
const sanitizeQuery = (q = '') => {
  if (typeof q !== 'string') return '';
  return q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').trim().slice(0, 500);
};

// Build a safe regex for partial matching
const buildRegex = (q, options = 'i') => new RegExp(sanitizeQuery(q), options);

class SearchService {

  async searchProjects(params) {
    const { q = '', status, domain, tags, owner, page = 1, limit = 20, sort = 'relevance', currentUserId } = params;
    const pageNum = Math.max(1, parseInt(page, 10)); const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    // ── Intelligent Profile Matching for Empty Queries ──
    if (!q.trim() && !status && !domain && !tags && currentUserId) {
      const currentUserProfile = await Profile.findOne({ userId: currentUserId }).lean();
      let userKeywords = [];
      if (currentUserProfile) {
        if (currentUserProfile.skills) userKeywords = userKeywords.concat(currentUserProfile.skills.map(s => s.name?.toLowerCase()));
        if (currentUserProfile.researchAreas) userKeywords = userKeywords.concat(currentUserProfile.researchAreas.map(r => r?.toLowerCase()));
      }
      userKeywords = [...new Set(userKeywords.filter(Boolean))];

      if (userKeywords.length > 0) {
        const pipeline = [
          { $match: { isArchived: false, visibility: 'Public', owner: { $ne: new mongoose.Types.ObjectId(currentUserId) } } },
          {
            $addFields: {
              lowercaseTags: {
                $map: { input: { $ifNull: ["$tags", []] }, as: "t", in: { $toLower: "$$t" } }
              },
              lowercaseDomain: { $toLower: { $ifNull: ["$researchDomain", ""] } }
            }
          },
          {
            $addFields: {
              allProjectKeywords: { $setUnion: ["$lowercaseTags", ["$lowercaseDomain"]] }
            }
          },
          {
            $addFields: {
              sharedKeywords: { $setIntersection: ["$allProjectKeywords", userKeywords] }
            }
          },
          {
            $addFields: {
              intersectSize: { $size: { $ifNull: ["$sharedKeywords", []] } }
            }
          },
          {
            $match: { intersectSize: { $gt: 0 } }
          },
          { $sort: { intersectSize: -1, createdAt: -1 } },
          {
            $facet: {
              metadata: [{ $count: "total" }],
              data: [{ $skip: skip }, { $limit: limitNum }]
            }
          }
        ];

        const aggResult = await Project.aggregate(pipeline);
        const data = aggResult[0].data;
        const total = aggResult[0].metadata[0]?.total || 0;

        if (total > 0) {
          const ownerIds = data.map(p => p.owner);
          const owners = await User.find({ _id: { $in: ownerIds } })
            .select('firstName lastName fullName profileSlug avatar')
            .lean();
          
          const results = data.map(proj => {
            proj.owner = owners.find(u => u._id.toString() === proj.owner.toString()) || proj.owner;
            proj.reasons = [`Matches ${proj.intersectSize} of your research interests/skills`];
            return proj;
          });

          return { results, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
        }
      }
    }

    // ── Generic Fallback ──
    const filter = { isArchived: false, visibility: 'Public' };
    if (q.trim()) filter.$text = { $search: q.trim() };
    if (status) filter.status = status; 
    if (domain) filter.researchDomain = buildRegex(domain); 
    if (tags) filter.tags = { $in: String(tags).split(',').map(buildRegex) }; 
    if (owner) filter.owner = owner;
    
    // Exclude current user's own projects from generic discovery if empty query
    // Commented out so that the user can see their own public projects if they are the only one with projects
    // if (!q.trim() && currentUserId && !status && !domain && !tags && !owner) {
    //    filter.owner = { $ne: currentUserId };
    // }

    const sortMap = { newest: { createdAt: -1 }, oldest: { createdAt: 1 }, alphabetical: { title: 1 }, updated: { updatedAt: -1 }, relevance: filter.$text ? { score: { $meta: 'textScore' }, updatedAt: -1 } : { updatedAt: -1 } };
    const [results, total] = await Promise.all([Project.find(filter, filter.$text ? { score: { $meta: 'textScore' } } : {}).populate('owner', 'firstName lastName fullName profileSlug avatar').sort(sortMap[sort] || sortMap.relevance).skip((pageNum - 1) * limitNum).limit(limitNum).lean(), Project.countDocuments(filter)]);
    return { results, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  }

  // ─── Core Publication Search ─────────────────────────────────────────────────
  async searchPublications(params) {
    const {
      q = '',
      type = 'all',        // keyword | title | abstract | doi | author | journal | conference
      publicationType,
      yearFrom,
      yearTo,
      year,
      minCitations,
      journal,
      conference,
      publisher,
      researchArea,
      institution,
      country,
      language,
      openAccess,
      hasPDF,
      isScholarImported,
      visibility = 'Public',
      sort = 'relevance',
      page = 1,
      limit = 20,
      // Advanced search
      exactPhrase,
      booleanMode,         // AND | OR | NOT
    } = params;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Meilisearch Integration
    const { isMeiliAvailable, meiliClient } = require('../../../config/meilisearch');
    if (isMeiliAvailable()) {
      try {
        const index = meiliClient.index('publications');
        const filterArray = [
          'isDeleted != true',
          'status = "published"',
          'visibility = "Public"'
        ];
        if (publicationType && publicationType !== 'all') {
          filterArray.push(`publicationType = "${publicationType}"`);
        }
        if (year) {
          filterArray.push(`year = ${parseInt(year, 10)}`);
        } else {
          if (yearFrom) {
            filterArray.push(`year >= ${parseInt(yearFrom, 10)}`);
          }
          if (yearTo) {
            filterArray.push(`year <= ${parseInt(yearTo, 10)}`);
          }
        }
        if (minCitations) {
          filterArray.push(`citations >= ${parseInt(minCitations, 10)}`);
        }

        const searchParams = {
          limit: limitNum,
          offset: skip,
          filter: filterArray
        };

        const meiliRes = await index.search(q, searchParams);
        return {
          results: meiliRes.hits,
          total: meiliRes.totalHits || meiliRes.estimatedTotalHits || meiliRes.hits.length,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil((meiliRes.totalHits || meiliRes.hits.length) / limitNum)
        };
      } catch (meiliErr) {
        console.error('[MEILI SEARCH FALLBACK] Falling back to MongoDB:', meiliErr);
      }
    }

    // ── Base filter (always applied) ─────────────────────────────────
    const baseFilter = {
      isDeleted: { $ne: true },
      status: 'published',
      visibility: 'Public',
    };

    // ── Query filter ─────────────────────────────────────────────────
    let textFilter = {};
    if (q && q.trim()) {
      const useAtlas = process.env.ATLAS_SEARCH === 'true';
      if (useAtlas) {
        // Atlas $search handled separately via aggregation pipeline
        // Marker: will be added to pipeline stage
        textFilter._atlasSearch = true;
      } else {
        // MongoDB native text index
        if (exactPhrase) {
          textFilter.$text = { $search: `"${q.replace(/"/g, '')}"` };
        } else {
          // Build field-specific regex filter based on type
          switch (type) {
            case 'title':
              textFilter.title = buildRegex(q);
              break;
            case 'abstract':
              textFilter.abstract = buildRegex(q);
              break;
            case 'doi':
              textFilter.doi = buildRegex(q);
              break;
            case 'author':
              // Will handle via author subquery
              break;
            case 'journal':
              textFilter.$or = [
                { journal: buildRegex(q) },
                { publication: buildRegex(q) }
              ];
              break;
            case 'conference':
              textFilter.conference = buildRegex(q);
              break;
            default:
              // Full-text across all fields via $text
              textFilter.$text = { $search: q };
          }
        }
      }
    }

    // ── Optional Filters ──────────────────────────────────────────────
    if (publicationType && publicationType !== 'all') {
      baseFilter.publicationType = publicationType;
    }
    if (year) {
      baseFilter.year = parseInt(year, 10);
    } else if (yearFrom || yearTo) {
      baseFilter.year = {};
      if (yearFrom) baseFilter.year.$gte = parseInt(yearFrom, 10);
      if (yearTo) baseFilter.year.$lte = parseInt(yearTo, 10);
    }
    if (minCitations) {
      baseFilter.citations = { $gte: parseInt(minCitations, 10) };
    }
    if (journal) baseFilter.$or = [{ journal: buildRegex(journal) }, { publication: buildRegex(journal) }];
    if (conference) baseFilter.conference = buildRegex(conference);
    if (publisher) baseFilter.publisher = buildRegex(publisher);
    if (institution) baseFilter.institution = buildRegex(institution);
    if (language) baseFilter.language = buildRegex(language);
    if (openAccess === 'true' || openAccess === true) baseFilter.openAccess = true;
    if (hasPDF === 'true' || hasPDF === true) baseFilter.pdfUrl = { $ne: '' };
    if (isScholarImported === 'true' || isScholarImported === true) baseFilter.googleScholarVerified = true;

    // ── Author sub-query (for author-type search) ────────────────────
    let publicationIdsFromAuthors = null;
    if (q && (type === 'author' || type === 'all')) {
      const authorDocs = await PublicationAuthor.find(
        { name: buildRegex(q) },
        { publicationId: 1 }
      ).lean();
      if (type === 'author') {
        publicationIdsFromAuthors = authorDocs.map(a => a.publicationId);
        if (publicationIdsFromAuthors.length === 0) {
          return { results: [], total: 0, page: pageNum, limit: limitNum, totalPages: 0 };
        }
        baseFilter._id = { $in: publicationIdsFromAuthors };
        textFilter = {}; // author filter supersedes text filter
      }
    }

    // ── Research Area sub-query ──────────────────────────────────────
    if (researchArea) {
      const areaDocs = await PublicationResearchArea.find(
        { researchArea: buildRegex(researchArea) },
        { publicationId: 1 }
      ).lean();
      const ids = areaDocs.map(a => a.publicationId);
      if (ids.length === 0) {
        return { results: [], total: 0, page: pageNum, limit: limitNum, totalPages: 0 };
      }
      baseFilter._id = { $in: ids };
    }

    const filter = { ...baseFilter, ...textFilter };
    if (filter._atlasSearch) delete filter._atlasSearch;

    // ── Sort ──────────────────────────────────────────────────────────
    let sortObj = { createdAt: -1 };
    switch (sort) {
      case 'newest':    sortObj = { createdAt: -1 }; break;
      case 'oldest':    sortObj = { createdAt: 1 };  break;
      case 'mostCited': sortObj = { citations: -1 }; break;
      case 'mostViewed': sortObj = { views: -1 };    break;
      case 'mostDownloaded': sortObj = { downloads: -1 }; break;
      case 'alphabetical': sortObj = { title: 1 };   break;
      case 'year':      sortObj = { year: -1 };      break;
      case 'relevance':
        if (filter.$text) sortObj = { score: { $meta: 'textScore' }, createdAt: -1 };
        else sortObj = { createdAt: -1 };
        break;
      default: sortObj = { createdAt: -1 };
    }

    const projection = {
      title: 1, subtitle: 1, authors: 1, journal: 1, publication: 1,
      conference: 1, publisher: 1, year: 1, publicationDate: 1,
      publicationType: 1, abstract: 1, keywords: 1, researchAreas: 1,
      slug: 1, doi: 1, views: 1, downloads: 1, citations: 1,
      recommendations: 1, pdfUrl: 1, thumbnail: 1,
      openAccess: 1, googleScholarVerified: 1, institution: 1,
      language: 1, readingTime: 1, researchScore: 1, createdAt: 1,
      publicationCode: 1,
      ...(filter.$text ? { score: { $meta: 'textScore' } } : {})
    };

    const [results, total] = await Promise.all([
      Publication.find(filter, projection)
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Publication.countDocuments(filter)
    ]);

    // Enrich with authorsList from PublicationAuthor
    const pubIds = results.map(p => p._id);
    const authorsDocs = await PublicationAuthor.find(
      { publicationId: { $in: pubIds } },
      { publicationId: 1, name: 1, institution: 1, isCorresponding: 1, order: 1 }
    ).sort({ order: 1 }).lean();

    const authorsMap = {};
    for (const a of authorsDocs) {
      const pid = a.publicationId.toString();
      if (!authorsMap[pid]) authorsMap[pid] = [];
      authorsMap[pid].push(a);
    }

    const enriched = results.map(pub => ({
      ...pub,
      id: pub._id,
      authorsList: authorsMap[pub._id.toString()] || [],
      hasPDF: !!(pub.pdfUrl),
    }));

    return {
      results: enriched,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  // ─── Author Search ───────────────────────────────────────────────────────────
  async searchAuthors(params) {
    const { q = '', page = 1, limit = 20 } = params;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    if (!q.trim()) return { results: [], total: 0, page: pageNum, limit: limitNum, totalPages: 0 };

    const pipeline = [
      { $match: { name: buildRegex(q) } },
      {
        $group: {
          _id: '$name',
          institution: { $first: '$institution' },
          publicationCount: { $sum: 1 },
          email: { $first: '$email' },
          authorId: { $first: '$authorId' },
          profileSlug: { $first: '$profileSlug' },
        }
      },
      { $sort: { publicationCount: -1 } },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limitNum }],
          count: [{ $count: 'total' }]
        }
      }
    ];

    const [result] = await PublicationAuthor.aggregate(pipeline);
    const results = result?.data || [];
    const total = result?.count?.[0]?.total || 0;

    // Enrich authors with User slug/profileSlug/username
    if (results.length > 0) {
      const authorIds = results.map(r => r.authorId).filter(id => id && mongoose.Types.ObjectId.isValid(id));
      const authorNames = results.map(r => r._id);
      
      const users = await User.find({
        $or: [
          { _id: { $in: authorIds } },
          { fullName: { $in: authorNames } }
        ]
      }).select('firstName lastName fullName username profileSlug slug').lean();

      for (const r of results) {
        let matchedUser = users.find(u => r.authorId && u._id.toString() === r.authorId.toString());
        if (!matchedUser) {
          matchedUser = users.find(u => u.fullName && u.fullName.toLowerCase() === r._id.toLowerCase());
        }
        if (matchedUser) {
          r.profileSlug = matchedUser.slug || matchedUser.profileSlug || matchedUser.username;
          r.userId = matchedUser._id;
        }
      }
    }

    return { results, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  }

  // ─── Researcher Search ────────────────────────────────────────────────────────
  async searchResearchers(params) {
    const { q = '', page = 1, limit = 20, country, institution, researchArea, currentUserId, minCitations } = params;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    // ── Intelligent Profile Matching for Empty Queries ──
    if (!q.trim() && !country && !institution && !researchArea && !minCitations && currentUserId) {
      const currentUserProfile = await Profile.findOne({ userId: currentUserId }).lean();
      
      let userKeywords = [];
      if (currentUserProfile) {
        if (currentUserProfile.skills) {
          userKeywords = userKeywords.concat(currentUserProfile.skills.map(s => s.name?.toLowerCase()));
        }
        if (currentUserProfile.researchAreas) {
          userKeywords = userKeywords.concat(currentUserProfile.researchAreas.map(r => r?.toLowerCase()));
        }
      }
      userKeywords = [...new Set(userKeywords.filter(Boolean))];

      if (userKeywords.length > 0) {
        const pipeline = [
          { $match: { userId: { $ne: new mongoose.Types.ObjectId(currentUserId) }, isDeleted: { $ne: true } } },
          {
            $addFields: {
              lowercaseSkills: {
                $map: {
                  input: { $ifNull: ["$skills", []] },
                  as: "s",
                  in: { $toLower: "$$s.name" }
                }
              },
              lowercaseAreas: {
                $map: {
                  input: { $ifNull: ["$researchAreas", []] },
                  as: "a",
                  in: { $toLower: "$$a" }
                }
              }
            }
          },
          {
            $addFields: {
              allKeywords: { $setUnion: ["$lowercaseSkills", "$lowercaseAreas"] }
            }
          },
          {
            $addFields: {
              sharedKeywords: { $setIntersection: ["$allKeywords", userKeywords] }
            }
          },
          {
            $addFields: {
              intersectSize: { $size: { $ifNull: ["$sharedKeywords", []] } }
            }
          },
          {
            $match: { intersectSize: { $gt: 0 } }
          },
          {
            $addFields: {
              matchPercentage: {
                $round: [
                  { $multiply: [ { $divide: ["$intersectSize", userKeywords.length] }, 100 ] },
                  0
                ]
              }
            }
          },
          { $sort: { matchPercentage: -1, intersectSize: -1 } },
          {
            $facet: {
              metadata: [{ $count: "total" }],
              data: [{ $skip: skip }, { $limit: limitNum }]
            }
          }
        ];

        const aggResult = await Profile.aggregate(pipeline);
        const data = aggResult[0].data;
        const total = aggResult[0].metadata[0]?.total || 0;

        if (total > 0) {
          const userIds = data.map(p => p.userId);
          const users = await User.find({ _id: { $in: userIds }, isDeleted: { $ne: true }, isActive: true })
            .select('firstName lastName fullName email profileImage profileSlug slug username researcherType institution')
            .lean();

          const results = data.map(prof => {
            const user = users.find(u => u._id.toString() === prof.userId.toString());
            if (!user) return null;
            return {
              ...user,
              profile: prof,
              institution: prof.institution || user.institution || '',
              researchAreas: prof.researchAreas || [],
              profileSlug: user.slug || user.profileSlug || user.username,
              matchPercentage: prof.matchPercentage,
              reasons: prof.intersectSize > 0 ? [`Matches ${prof.intersectSize} of your research interests/skills`] : []
            };
          }).filter(Boolean);

          return { results, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
        }
      }
    }

    // ── Fallback for completely empty queries to avoid full DB scan ──
    if (!q.trim() && !country && !institution && !researchArea && !minCitations) {
      const finalUserFilter = { isDeleted: { $ne: true }, isActive: true };
      if (currentUserId) finalUserFilter._id = { $ne: new mongoose.Types.ObjectId(currentUserId) };
      
      const [users, total] = await Promise.all([
        User.find(finalUserFilter)
          .skip(skip)
          .limit(limitNum)
          .select('firstName lastName fullName email profileImage profileSlug slug username researcherType institution')
          .lean(),
        User.countDocuments(finalUserFilter)
      ]);

      const userIds = users.map(u => u._id);
      const profiles = await Profile.find({ userId: { $in: userIds }, isDeleted: { $ne: true } }).lean();

      const results = users.map((user) => {
        const prof = profiles.find(p => p.userId.toString() === user._id.toString());
        return {
          ...user,
          profile: prof || null,
          institution: prof?.institution || user.institution || '',
          researchAreas: prof?.researchAreas || [],
          profileSlug: user.slug || user.profileSlug || user.username,
          matchPercentage: 0,
          reasons: []
        };
      });

      return { results, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
    }

    // Search query on user's fullName / email or profile's bio / institution / researchAreas
    const userQuery = {};
    const profileQuery = { isDeleted: { $ne: true } };

    if (country) profileQuery['institutionLocation.country'] = country;
    if (institution) profileQuery.institution = { $regex: institution, $options: 'i' };
    if (researchArea) profileQuery.researchAreas = { $in: [new RegExp(researchArea, 'i')] };
    if (minCitations) profileQuery['metrics.totalCitations'] = { $gte: parseInt(minCitations, 10) };

    if (q.trim()) {
      const regex = buildRegex(q);
      profileQuery.$or = [
        { institution: regex },
        { department: regex },
        { biography: regex },
        { researchAreas: { $in: [regex] } }
      ];
      userQuery.$or = [
        { firstName: regex },
        { lastName: regex },
        { email: regex }
      ];
    }

    // First find matching profiles
    const matchedProfiles = await Profile.find(profileQuery).lean();
    const matchedUserIdsFromProfiles = matchedProfiles.map(p => p.userId);

    // Find users matching either userQuery OR having profile match
    const finalUserFilter = {
      isDeleted: { $ne: true },
      isActive: true
    };

    if (q.trim()) {
      finalUserFilter.$or = [
        ...userQuery.$or,
        { _id: { $in: matchedUserIdsFromProfiles } }
      ];
    } else if (matchedUserIdsFromProfiles.length > 0) {
      finalUserFilter._id = { $in: matchedUserIdsFromProfiles };
    } else if (country || institution || researchArea || minCitations) {
      // If filters applied but no profiles matched, we should return empty
      return { results: [], total: 0, page: pageNum, limit: limitNum, totalPages: 0 };
    }

    const [users, total] = await Promise.all([
      User.find(finalUserFilter)
        .skip(skip)
        .limit(limitNum)
        .select('firstName lastName fullName email profileImage profileSlug slug username researcherType institution')
        .lean(),
      User.countDocuments(finalUserFilter)
    ]);

    // Attach profile details & compatibility score if currentUserId is present
    const userIds = users.map(u => u._id);
    const profiles = await Profile.find({ userId: { $in: userIds }, isDeleted: { $ne: true } }).lean();

    const results = users.map((user) => {
      const prof = profiles.find(p => p.userId.toString() === user._id.toString());
      
      return {
        ...user,
        profile: prof || null,
        institution: prof?.institution || user.institution || '',
        researchAreas: prof?.researchAreas || [],
        profileSlug: user.slug || user.profileSlug || user.username,
        matchPercentage: 0,
        reasons: []
      };
    });

    return { results, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  }

  // ─── Journal / Conference Search ─────────────────────────────────────────────
  async searchJournals(params) {
    const { q = '', page = 1, limit = 20 } = params;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const matchStage = {
      isDeleted: { $ne: true },
      status: 'published',
      visibility: 'Public',
    };
    if (q.trim()) {
      matchStage.$or = [
        { journal: buildRegex(q) },
        { publication: buildRegex(q) },
      ];
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: { $ifNull: ['$journal', '$publication'] },
          publicationCount: { $sum: 1 },
          totalCitations: { $sum: '$citations' },
          latestYear: { $max: '$year' },
        }
      },
      { $match: { _id: { $ne: null, $ne: '' } } },
      { $sort: { publicationCount: -1 } },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limitNum }],
          count: [{ $count: 'total' }]
        }
      }
    ];

    const [result] = await Publication.aggregate(pipeline);
    const results = (result?.data || []).map(r => ({
      name: r._id,
      publicationCount: r.publicationCount,
      totalCitations: r.totalCitations,
      latestYear: r.latestYear,
    }));
    const total = result?.count?.[0]?.total || 0;

    return { results, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  }

  async searchConferences(params) {
    const { q = '', page = 1, limit = 20 } = params;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const matchStage = {
      isDeleted: { $ne: true },
      status: 'published',
      visibility: 'Public',
      conference: { $ne: '' },
    };
    if (q.trim()) matchStage.conference = buildRegex(q);

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: '$conference',
          publicationCount: { $sum: 1 },
          totalCitations: { $sum: '$citations' },
          latestYear: { $max: '$year' },
        }
      },
      { $match: { _id: { $ne: null, $ne: '' } } },
      { $sort: { publicationCount: -1 } },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limitNum }],
          count: [{ $count: 'total' }]
        }
      }
    ];

    const [result] = await Publication.aggregate(pipeline);
    const results = (result?.data || []).map(r => ({
      name: r._id,
      publicationCount: r.publicationCount,
      totalCitations: r.totalCitations,
      latestYear: r.latestYear,
    }));
    const total = result?.count?.[0]?.total || 0;

    return { results, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  }

  // ─── Autocomplete ────────────────────────────────────────────────────────────
  async getAutocomplete(query) {
    if (!query || query.trim().length < 2) return { publications: [], authors: [], journals: [], conferences: [], keywords: [], projects: [], researchers: [] };

    const regex = buildRegex(query);
    const baseFilter = { isDeleted: { $ne: true }, status: 'published', visibility: 'Public' };

    const [publications, authors, journalDocs, conferenceDocs, keywordDocs, projects, researchers] = await Promise.all([
      Publication.find(
        { ...baseFilter, title: regex },
        { title: 1, slug: 1, publicationType: 1, authors: 1, year: 1 }
      ).sort({ views: -1 }).limit(5).lean(),

      PublicationAuthor.aggregate([
        { $match: { name: regex } },
        { $group: { _id: '$name', institution: { $first: '$institution' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),

      Publication.distinct('journal', { ...baseFilter, journal: regex }).then(r => r.slice(0, 5)),
      Publication.distinct('conference', { ...baseFilter, conference: regex }).then(r => r.slice(0, 5)),
      PublicationKeyword.aggregate([
        { $match: { keyword: regex } },
        { $group: { _id: '$keyword', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      Project.find({ isArchived: false, visibility: 'Public', $text: { $search: query } }, { title: 1, slug: 1, researchDomain: 1, status: 1 }).limit(5).lean(),
      User.find(
        {
          $or: [
            { firstName: regex },
            { lastName: regex },
            { fullName: regex }
          ]
        },
        { firstName: 1, lastName: 1, fullName: 1, profileSlug: 1, avatar: 1 }
      ).limit(5).lean()
    ]);

    return {
      publications: publications.map(p => ({ id: p._id, title: p.title, slug: p.slug, type: p.publicationType, year: p.year })),
      authors: authors.map(a => ({ name: a._id, institution: a.institution })),
      journals: journalDocs.filter(Boolean),
      conferences: conferenceDocs.filter(Boolean),
      keywords: keywordDocs.map(k => k._id),
      projects: projects.map(p => ({ id: p._id, title: p.title, slug: p.slug, domain: p.researchDomain, status: p.status })),
      researchers: researchers.map(r => ({
        id: r._id,
        fullName: r.fullName || `${r.firstName} ${r.lastName}`,
        profileSlug: r.profileSlug,
        avatar: r.avatar
      }))
    };
  }

  // ─── Trending ────────────────────────────────────────────────────────────────
  async getTrending() {
    const [trendingQueries, popularAreas, popularJournals] = await Promise.all([
      SearchAnalytic.find({})
        .sort({ hitCount: -1 })
        .limit(10)
        .select('query hitCount searchType')
        .lean(),

      PublicationResearchArea.aggregate([
        { $group: { _id: '$researchArea', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 }
      ]),

      Publication.aggregate([
        { $match: { isDeleted: { $ne: true }, status: 'published', journal: { $ne: '' } } },
        { $group: { _id: { $ifNull: ['$journal', '$publication'] }, count: { $sum: 1 } } },
        { $match: { _id: { $ne: null, $ne: '' } } },
        { $sort: { count: -1 } },
        { $limit: 6 }
      ])
    ]);

    return {
      trendingQueries: trendingQueries.map(t => ({ query: t.query, count: t.hitCount })),
      trendingResearchAreas: popularAreas.map(a => ({ area: a._id, count: a.count })),
      popularJournals: popularJournals.map(j => ({ journal: j._id, count: j.count })),
    };
  }

  // ─── Search History ──────────────────────────────────────────────────────────
  async saveHistory(userId, query, filters, resultCount, searchType) {
    if (!userId || !query?.trim()) return;

    // Upsert: if same user queried this before, update timestamp
    await SearchHistory.findOneAndUpdate(
      { userId, query: query.trim(), isDeleted: { $ne: true } },
      { $set: { filters: filters || {}, resultCount: resultCount || 0, searchType: searchType || 'all', updatedAt: new Date() } },
      { upsert: true, new: true }
    );

    // Bump analytic counter
    const normalized = query.trim().toLowerCase();
    await SearchAnalytic.findOneAndUpdate(
      { normalizedQuery: normalized, searchType: searchType || 'all' },
      {
        $inc: { hitCount: 1 },
        $set: { query: query.trim(), lastSearchedAt: new Date() }
      },
      { upsert: true }
    );
  }

  async getHistory(userId) {
    return SearchHistory.find({ userId, isDeleted: { $ne: true } })
      .sort({ updatedAt: -1 })
      .limit(20)
      .select('query filters resultCount searchType isFavorite createdAt updatedAt')
      .lean();
  }

  async clearHistory(userId, entryId) {
    if (entryId) {
      await SearchHistory.findOneAndUpdate(
        { _id: entryId, userId },
        { $set: { isDeleted: true } }
      );
    } else {
      await SearchHistory.updateMany({ userId }, { $set: { isDeleted: true } });
    }
  }

  async toggleFavoriteHistory(userId, entryId) {
    const entry = await SearchHistory.findOne({ _id: entryId, userId });
    if (!entry) return null;
    entry.isFavorite = !entry.isFavorite;
    await entry.save();
    return entry;
  }

  /**
   * Search conversations by participant name or group name
   */
  async searchConversations(userId, q) {
    const mongoose = require('mongoose');
    const Conversation = mongoose.model('Conversation');
    const User = mongoose.model('User');
    const Profile = mongoose.model('Profile');

    const searchRegex = new RegExp(q, 'i');

    // 1. Find users who match first name / last name
    const matchedUsers = await User.find({
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { username: searchRegex }
      ],
      isDeleted: { $ne: true }
    }).select('_id').lean();
    const matchedUserIds = matchedUsers.map(u => u._id);

    // 2. Find conversations containing the user and either group name matches or participants contain matched users
    const conversations = await Conversation.find({
      participants: userId,
      $or: [
        { name: searchRegex },
        { participants: { $in: matchedUserIds } }
      ]
    })
      .populate('participants', 'firstName lastName profileImage username profileSlug slug email')
      .populate({
        path: 'lastMessageId',
        populate: { path: 'attachmentId' }
      })
      .sort({ lastMessageTime: -1 })
      .lean();

    // 3. Process
    const processed = await Promise.all(
      conversations.map(async (conv) => {
        const otherParticipant = conv.participants.find(
          p => p._id.toString() !== userId.toString()
        );

        let detailedParticipant = null;
        if (otherParticipant) {
          const profile = await Profile.findOne({ userId: otherParticipant._id }).lean();
          detailedParticipant = {
            ...otherParticipant,
            isOnline: false,
            bio: profile?.bio || '',
            institution: profile?.institution || '',
            designation: profile?.designation || ''
          };
        }

        const isPinned = Array.isArray(conv.isPinned) && conv.isPinned.map(id => id.toString()).includes(userId.toString());
        const isArchived = Array.isArray(conv.isArchived) && conv.isArchived.map(id => id.toString()).includes(userId.toString());
        const isMuted = Array.isArray(conv.isMuted) && conv.isMuted.map(id => id.toString()).includes(userId.toString());

        return {
          ...conv,
          lastMessage: conv.lastMessageId ? {
            ...conv.lastMessageId,
            attachment: conv.lastMessageId.attachmentId
          } : null,
          otherParticipant: detailedParticipant,
          isPinned,
          isArchived,
          isMuted
        };
      })
    );

    return processed;
  }

  /**
   * Search message content
   */
  async searchMessages(userId, q) {
    const messageService = require('../../messaging/service/message.service');
    return await messageService.searchMessages(userId, q);
  }

  async searchKeywords(params) {
    const { q = '', page = 1, limit = 20 } = params;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    if (!q.trim()) return { results: [], total: 0, page: pageNum, limit: limitNum, totalPages: 0 };
    const regex = buildRegex(q);

    const keywordGroups = await PublicationKeyword.aggregate([
      { $match: { keyword: regex } },
      { $group: { _id: '$keyword', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limitNum }],
          count: [{ $count: 'total' }]
        }
      }
    ]);

    const items = keywordGroups[0]?.data || [];
    const total = keywordGroups[0]?.count?.[0]?.total || 0;

    const results = await Promise.all(items.map(async (item) => {
      const researchersCount = await Profile.countDocuments({ 
        researchAreas: { $regex: new RegExp('^' + sanitizeQuery(item._id) + '$', 'i') } 
      });
      return {
        keyword: item._id,
        relatedPublicationsCount: item.count,
        relatedResearchersCount: researchersCount
      };
    }));

    return { results, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  }

  async searchInstitutions(params) {
    const { q = '', page = 1, limit = 20 } = params;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const queryFilter = { isActive: true };
    if (q.trim()) {
      queryFilter.name = buildRegex(q);
    }

    const [items, total] = await Promise.all([
      mongoose.model('Institution').find(queryFilter)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      mongoose.model('Institution').countDocuments(queryFilter)
    ]);

    const results = await Promise.all(items.map(async (inst) => {
      const [researchersCount, publicationsCount] = await Promise.all([
        Profile.countDocuments({ institution: { $regex: new RegExp('^' + sanitizeQuery(inst.name) + '$', 'i') } }),
        Publication.countDocuments({ institution: { $regex: new RegExp('^' + sanitizeQuery(inst.name) + '$', 'i') } })
      ]);
      return {
        ...inst,
        researchersCount,
        publicationsCount
      };
    }));

    return { results, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  }

  async combinedSearch(params) {
    const { q = '', currentUserId } = params;
    if (!q || !q.trim()) {
      return {
        researchers: [],
        publications: [],
        authors: [],
        keywords: [],
        institutions: []
      };
    }

    const [researchers, publications, authors, keywords, institutions] = await Promise.all([
      this.searchResearchers({ q, currentUserId, page: 1, limit: 5 }),
      this.searchPublications({ q, page: 1, limit: 5 }),
      this.searchAuthors({ q, page: 1, limit: 5 }),
      this.searchKeywords({ q, page: 1, limit: 5 }),
      this.searchInstitutions({ q, page: 1, limit: 5 })
    ]);

    return {
      researchers: researchers.results,
      publications: publications.results,
      authors: authors.results,
      keywords: keywords.results,
      institutions: institutions.results
    };
  }
}

module.exports = new SearchService();

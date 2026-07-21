const BaseRepository = require('../../../common/repository/base.repository');
const Project = require('../../../models/Project');

class ProjectRepository extends BaseRepository {
  constructor() {
    super(Project);
  }

  /**
   * Find a project by ID or slug, excluding deleted records.
   */
  async findByIdOrSlug(idOrSlug) {
    return await this.model.findOne({
      $or: [{ slug: idOrSlug }, { _id: idOrSlug.match(/^[0-9a-fA-F]{24}$/) ? idOrSlug : null }],
      isDeleted: { $ne: true },
    });
  }

  /**
   * Paginated project listing with filtering and text search.
   */
  async search({
    page = 1,
    limit = 12,
    search = '',
    status,
    visibility,
    researchDomain,
    country,
    category,
    keywords,
    owner,
    isFeatured,
    allowApplications,
    sort = '-createdAt',
  } = {}) {
    const filter = { isDeleted: { $ne: true } };

    if (status) filter.status = status;
    if (visibility) filter.visibility = visibility;
    if (researchDomain) filter.researchDomain = researchDomain;
    if (country) filter.country = country;
    if (category) filter.category = category;
    if (owner) filter.owner = owner;
    if (isFeatured !== undefined) filter.isFeatured = isFeatured;
    if (allowApplications !== undefined) filter.allowApplications = allowApplications;
    if (keywords && keywords.length > 0) {
      filter.keywords = { $in: Array.isArray(keywords) ? keywords : [keywords] };
    }
    if (search) {
      filter.$text = { $search: search };
    }

    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      this.model
        .find(filter)
        .populate('owner', 'firstName lastName fullName profileImage username profileSlug')
        .sort(search ? { score: { $meta: 'textScore' }, ...this._parseSort(sort) } : sort)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      this.model.countDocuments(filter),
    ]);

    return {
      docs,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Trending projects by view + star count.
   */
  async getTrending(limit = 10) {
    return await this.model
      .find({ status: { $in: ['recruiting', 'active'] }, visibility: 'public', isDeleted: { $ne: true } })
      .populate('owner', 'firstName lastName fullName profileImage username')
      .sort({ viewCount: -1, starCount: -1, createdAt: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Projects recommended for a user based on research areas and skills.
   */
  async getRecommended(userId, researchAreas = [], skills = [], limit = 10) {
    const filter = {
      owner: { $ne: userId },
      status: { $in: ['recruiting', 'active'] },
      visibility: 'public',
      isDeleted: { $ne: true },
    };

    if (researchAreas.length > 0 || skills.length > 0) {
      filter.$or = [
        { researchAreas: { $in: researchAreas } },
        { requiredSkills: { $in: skills } },
      ];
    }

    return await this.model
      .find(filter)
      .populate('owner', 'firstName lastName fullName profileImage username')
      .sort({ isFeatured: -1, viewCount: -1, createdAt: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Increment view counter atomically.
   */
  async incrementView(projectId) {
    return await this.model.findByIdAndUpdate(
      projectId,
      { $inc: { viewCount: 1 } },
      { new: true, select: 'viewCount' }
    );
  }

  /**
   * Increment/decrement a numeric counter field.
   */
  async incrementCounter(projectId, field, delta = 1) {
    return await this.model.findByIdAndUpdate(
      projectId,
      { $inc: { [field]: delta } },
      { new: true, select: field }
    );
  }

  /**
   * Owner dashboard stats aggregation.
   */
  async getOwnerStats(ownerId) {
    return await this.model.aggregate([
      { $match: { owner: ownerId, isDeleted: { $ne: true } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalViews: { $sum: '$viewCount' },
          totalApplications: { $sum: '$applicationCount' },
          totalMembers: { $sum: '$memberCount' },
        },
      },
    ]);
  }

  _parseSort(sortStr) {
    const result = {};
    if (!sortStr) return result;
    String(sortStr)
      .split(',')
      .forEach((s) => {
        const dir = s.startsWith('-') ? -1 : 1;
        result[s.replace(/^-/, '')] = dir;
      });
    return result;
  }
}

module.exports = new ProjectRepository();

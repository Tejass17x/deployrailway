const projectRepository = require('../repository/project.repository');
const projectMemberRepository = require('../repository/projectMember.repository');
const activityLogRepository = require('../repository/projectActivityLog.repository');
const projectNotification = require('../helper/projectNotification.helper');
const { cacheService } = require('../../../cache/cache.service');
const { NotFoundError, ForbiddenError, ConflictError, ValidationError } = require('../../../common/errors/AppError');
const logger = require('../../../common/logger/winston');

const CACHE_TTL = 300; // 5 min

const ProjectService = {
  async createProject(userId, data) {
    const project = await projectRepository.create({
      ...data,
      owner: userId,
      userId,
      memberCount: 1,
    });

    // Auto-add owner as principal-investigator member
    await projectMemberRepository.create({
      projectId: project._id,
      userId,
      role: 'principal-investigator',
      status: 'active',
      joinedAt: new Date(),
      permissions: {},
    });

    await activityLogRepository.log({
      projectId: project._id,
      actorId: userId,
      type: 'project_created',
      description: `Project "${project.title}" created`,
      resourceType: 'project',
      resourceId: project._id,
    });

    await cacheService.del(`project:owner-stats:${userId}`);

    return project;
  },

  // ─── LIST / SEARCH ─────────────────────────────────────────────────────────
  async listProjects(query) {
    return await projectRepository.search(query);
  },

  async getTrending(limit = 10) {
    return await projectRepository.getTrending(limit);
  },

  async getRecommended(user, limit = 10) {
    const profile = await this._getUserProfile(user._id);
    const researchAreas = profile?.researchAreas || [];
    const skills = profile?.skills || [];
    return await projectRepository.getRecommended(user._id, researchAreas, skills, limit);
  },

  // ─── DETAIL ────────────────────────────────────────────────────────────────
  async getProject(idOrSlug, viewerId = null) {
    const cacheKey = `project:${idOrSlug}`;
    let project = await cacheService.get(cacheKey);

    if (!project) {
      project = await projectRepository.findByIdOrSlug(idOrSlug);
      if (!project) throw new NotFoundError('Project not found.');
      await cacheService.set(cacheKey, project, CACHE_TTL);
    }

    // Increment view count asynchronously (fire and forget)
    if (viewerId) {
      projectRepository.incrementView(project._id).catch((e) => logger.error('View inc error:', e));
    }

    return project;
  },

  // ─── UPDATE ────────────────────────────────────────────────────────────────
  async updateProject(projectId, userId, data) {
    const project = await this._getOwnedProject(projectId, userId);

    // Prevent status updates through this method
    delete data.status;
    delete data.owner;
    delete data.userId;
    delete data.viewCount;
    delete data.applicationCount;
    delete data.memberCount;

    Object.assign(project, data);
    await project.save();

    await cacheService.del(`project:${project._id}`);
    await cacheService.del(`project:${project.slug}`);
    await cacheService.del(`project:owner-stats:${userId}`);

    await activityLogRepository.log({
      projectId: project._id,
      actorId: userId,
      type: 'project_updated',
      description: 'Project details updated',
      resourceType: 'project',
      resourceId: project._id,
    });

    return project;
  },

  // ─── STATUS ────────────────────────────────────────────────────────────────
  async updateStatus(projectId, userId, status) {
    const project = await this._getOwnedProject(projectId, userId);
    const oldStatus = project.status;
    project.status = status;
    if (status === 'completed') project.completedAt = new Date();
    await project.save();

    await cacheService.del(`project:${project._id}`);
    await cacheService.del(`project:${project.slug}`);
    await cacheService.del(`project:owner-stats:${userId}`);

    await activityLogRepository.log({
      projectId: project._id,
      actorId: userId,
      type: 'project_status_changed',
      description: `Status changed from "${oldStatus}" to "${status}"`,
      metadata: { oldStatus, newStatus: status },
    });

    return project;
  },

  // ─── ARCHIVE ───────────────────────────────────────────────────────────────
  async archiveProject(projectId, userId) {
    const project = await this._getOwnedProject(projectId, userId);
    project.isArchived = !project.isArchived;
    project.status = project.isArchived ? 'archived' : 'active';
    await project.save();

    await cacheService.del(`project:${project._id}`);
    await cacheService.del(`project:${project.slug}`);
    await cacheService.del(`project:owner-stats:${userId}`);

    return project;
  },

  // ─── DELETE (soft) ─────────────────────────────────────────────────────────
  async deleteProject(projectId, userId) {
    const project = await this._getOwnedProject(projectId, userId);
    project.isDeleted = true;
    project.deletedAt = new Date();
    project.deletedBy = userId;
    await project.save();

    await cacheService.del(`project:${project._id}`);
    await cacheService.del(`project:${project.slug}`);
    await cacheService.del(`project:owner-stats:${userId}`);

    return { deleted: true, projectId };
  },

  // ─── DASHBOARD STATS ───────────────────────────────────────────────────────
  async getOwnerStats(userId) {
    const cacheKey = `project:owner-stats:${userId}`;
    try {
      const cached = await cacheService.get(cacheKey);
      if (cached) return cached;
    } catch (err) {
      logger.warn(`Failed reading owner stats cache: ${err.message}`);
    }

    const mongoose = require('mongoose');
    const rows = await projectRepository.getOwnerStats(mongoose.Types.ObjectId.createFromHexString
      ? mongoose.Types.ObjectId.createFromHexString(userId.toString())
      : new mongoose.Types.ObjectId(userId.toString()));

    const value = (status) => rows.find((r) => r._id === status)?.count || 0;
    const stats = {
      totalProjects: rows.reduce((n, r) => n + r.count, 0),
      totalViews: rows.reduce((n, r) => n + (r.totalViews || 0), 0),
      totalApplications: rows.reduce((n, r) => n + (r.totalApplications || 0), 0),
      totalMembers: rows.reduce((n, r) => n + (r.totalMembers || 0), 0),
      recruiting: value('recruiting'),
      active: value('active'),
      completed: value('completed'),
      draft: value('draft'),
      breakdown: rows,
    };

    try {
      await cacheService.set(cacheKey, stats, 300); // 5 min TTL
    } catch (err) {
      logger.warn(`Failed writing owner stats cache: ${err.message}`);
    }

    return stats;
  },

  // ─── PROGRESS ──────────────────────────────────────────────────────────────
  async updateProgress(projectId, userId, progress) {
    const project = await this._getOwnedProject(projectId, userId);
    project.progress = Math.min(100, Math.max(0, progress));
    await project.save();
    return project;
  },

  // ─── HELPERS ───────────────────────────────────────────────────────────────
  async _getOwnedProject(projectId, userId) {
    const project = await projectRepository.findById(projectId);
    if (!project) throw new NotFoundError('Project not found.');
    if (project.owner.toString() !== userId.toString()) {
      throw new ForbiddenError('Only the project owner can perform this action.');
    }
    return project;
  },

  async _getUserProfile(userId) {
    try {
      const Profile = require('../../../models/Profile');
      return await Profile.findOne({ userId }).select('researchAreas skills').lean();
    } catch {
      return null;
    }
  },
};

module.exports = ProjectService;

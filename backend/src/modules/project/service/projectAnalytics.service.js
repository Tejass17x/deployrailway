const Project = require('../../../models/Project');
const { ProjectMember } = require('../../../models/ProjectMember');
const { ProjectApplication } = require('../../../models/ProjectApplication');
const { ProjectTask } = require('../../../models/ProjectTask');
const ProjectMilestone = require('../../../models/ProjectMilestone');
const ProjectFile = require('../../../models/ProjectFile');
const ProjectMessage = require('../../../models/ProjectMessage');
const { cacheService } = require('../../../cache/cache.service');

const CACHE_TTL = 600; // 10 minutes for analytics

const ProjectAnalyticsService = {
  async getProjectDashboard(projectId) {
    const cacheKey = `analytics:project:${projectId}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const [
      taskStats, milestoneStats, memberStats, applicationStats, fileStats, messageCount,
    ] = await Promise.all([
      ProjectTask.aggregate([
        { $match: { projectId, isDeleted: { $ne: true } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      ProjectMilestone.aggregate([
        { $match: { projectId, isDeleted: { $ne: true } } },
        { $group: { _id: null, total: { $sum: 1 }, completed: { $sum: { $cond: ['$isCompleted', 1, 0] } } } },
      ]),
      ProjectMember.aggregate([
        { $match: { projectId, status: 'active', isDeleted: { $ne: true } } },
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
      ProjectApplication.aggregate([
        { $match: { projectId, isDeleted: { $ne: true } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      ProjectFile.aggregate([
        { $match: { projectId, isDeleted: { $ne: true } } },
        { $group: { _id: null, count: { $sum: 1 }, totalSize: { $sum: '$size' }, downloads: { $sum: '$downloadCount' } } },
      ]),
      ProjectMessage.countDocuments({ projectId, threadId: null, isDeleted: { $ne: true } }),
    ]);

    const taskBreakdown = taskStats.reduce((acc, r) => { acc[r._id] = r.count; return acc; }, {});
    const totalTasks = Object.values(taskBreakdown).reduce((n, v) => n + v, 0);
    const doneTasks = taskBreakdown.done || 0;

    const result = {
      tasks: {
        total: totalTasks,
        breakdown: taskBreakdown,
        completionRate: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
      },
      milestones: {
        total: milestoneStats[0]?.total || 0,
        completed: milestoneStats[0]?.completed || 0,
        completionRate: milestoneStats[0]?.total > 0
          ? Math.round((milestoneStats[0].completed / milestoneStats[0].total) * 100) : 0,
      },
      members: {
        total: memberStats.reduce((n, r) => n + r.count, 0),
        byRole: memberStats.reduce((acc, r) => { acc[r._id] = r.count; return acc; }, {}),
      },
      applications: {
        total: applicationStats.reduce((n, r) => n + r.count, 0),
        breakdown: applicationStats.reduce((acc, r) => { acc[r._id] = r.count; return acc; }, {}),
      },
      files: {
        count: fileStats[0]?.count || 0,
        totalSize: fileStats[0]?.totalSize || 0,
        totalSizeMB: fileStats[0]?.totalSize ? (fileStats[0].totalSize / 1024 / 1024).toFixed(2) : 0,
        downloads: fileStats[0]?.downloads || 0,
      },
      messages: {
        total: messageCount,
      },
      generatedAt: new Date().toISOString(),
    };

    await cacheService.set(cacheKey, result, CACHE_TTL);
    return result;
  },

  async getActivityTimeline(projectId, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { ProjectActivityLog } = require('../../../models/ProjectActivityLog');
    const logs = await ProjectActivityLog.find({
      projectId,
      createdAt: { $gte: since },
    })
      .populate('actorId', 'firstName lastName fullName profileImage username')
      .sort('-createdAt')
      .limit(100)
      .lean();

    return logs;
  },

  async getOwnerAnalytics(userId) {
    const projects = await Project.find({ owner: userId, isDeleted: { $ne: true } }).select('_id title status viewCount applicationCount memberCount starCount bookmarkCount progress createdAt').lean();
    const totalViews = projects.reduce((n, p) => n + (p.viewCount || 0), 0);
    const totalApplications = projects.reduce((n, p) => n + (p.applicationCount || 0), 0);
    const totalMembers = projects.reduce((n, p) => n + (p.memberCount || 0), 0);
    return {
      projectCount: projects.length,
      totalViews,
      totalApplications,
      totalMembers,
      projects: projects.map(p => ({
        id: p._id,
        title: p.title,
        status: p.status,
        views: p.viewCount,
        applications: p.applicationCount,
        members: p.memberCount,
        stars: p.starCount,
        bookmarks: p.bookmarkCount,
        progress: p.progress,
      })),
    };
  },
};

module.exports = ProjectAnalyticsService;

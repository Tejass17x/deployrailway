const BaseRepository = require('../../../common/repository/base.repository');
const ProjectFile = require('../../../models/ProjectFile');

class ProjectFileRepository extends BaseRepository {
  constructor() {
    super(ProjectFile);
  }

  async findByProject(projectId, { folder, fileType, page = 1, limit = 30 } = {}) {
    const filter = { projectId, isDeleted: { $ne: true } };
    if (folder) filter.folder = folder;
    if (fileType) filter.fileType = fileType;

    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      this.model
        .find(filter)
        .populate('uploadedBy', 'firstName lastName fullName profileImage username')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      this.model.countDocuments(filter),
    ]);
    return { docs, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) };
  }

  async getFolders(projectId) {
    return await this.model.distinct('folder', { projectId, isDeleted: { $ne: true } });
  }

  async addVersion(fileId, versionData) {
    return await this.model.findByIdAndUpdate(
      fileId,
      {
        $push: { versions: versionData },
        $inc: { version: 1 },
        $set: { key: versionData.key, url: versionData.url, size: versionData.size },
      },
      { new: true }
    );
  }

  async incrementDownload(fileId) {
    return await this.model.findByIdAndUpdate(
      fileId,
      { $inc: { downloadCount: 1 }, $set: { lastAccessedAt: new Date() } },
      { new: true, select: 'downloadCount' }
    );
  }

  async countByProject(projectId) {
    return await this.model.countDocuments({ projectId, isDeleted: { $ne: true } });
  }
}

module.exports = new ProjectFileRepository();

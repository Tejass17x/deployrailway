const projectFileRepository = require('../repository/projectFile.repository');
const projectRepository = require('../repository/project.repository');
const activityLogRepository = require('../repository/projectActivityLog.repository');
const r2Service = require('../../upload/service/r2.service');
const { NotFoundError, ForbiddenError, ValidationError } = require('../../../common/errors/AppError');

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain', 'text/csv', 'text/markdown',
  'application/json', 'application/zip',
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'video/mp4', 'video/webm',
  'audio/mpeg', 'audio/wav',
]);

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

const getFileType = (mimeType) => {
  if (!mimeType) return 'other';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(mimeType)) return 'document';
  if (['text/csv', 'application/json'].includes(mimeType)) return 'dataset';
  if (mimeType === 'application/zip') return 'archive';
  return 'document';
};

const ProjectFileService = {
  async uploadFile(projectId, uploadedBy, file, { folder = '/', description = '', accessLevel = 'all-members', newVersion = false, existingFileId } = {}) {
    if (!file) throw new ValidationError('No file provided.');
    if (file.size > MAX_FILE_SIZE) throw new ValidationError('File exceeds the maximum allowed size of 100 MB.');
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new ValidationError(`File type "${file.mimetype}" is not allowed.`);
    }

    const r2Result = await r2Service.uploadFileBuffer(
      file.buffer,
      file.originalname,
      uploadedBy.toString(),
      'project-file',
      projectId.toString(),
      file.mimetype
    );

    const fileType = getFileType(file.mimetype);

    if (newVersion && existingFileId) {
      // New version of existing file
      const versionData = {
        version: undefined, // will be set by repository
        key: r2Result.public_id,
        url: r2Result.secure_url,
        size: file.size,
        uploadedBy,
        uploadedAt: new Date(),
        note: description,
      };
      const updatedFile = await projectFileRepository.addVersion(existingFileId, versionData);
      await activityLogRepository.log({
        projectId, actorId: uploadedBy, type: 'file_uploaded',
        description: `New version of "${file.originalname}" uploaded`,
      });
      return updatedFile;
    }

    const projectFile = await projectFileRepository.create({
      projectId,
      uploadedBy,
      name: file.originalname,
      originalName: file.originalname,
      description,
      key: r2Result.public_id,
      url: r2Result.secure_url,
      mimeType: file.mimetype,
      size: file.size,
      format: r2Result.format,
      fileType,
      folder,
      accessLevel,
    });

    await projectRepository.incrementCounter(projectId, 'fileCount', 1);

    await activityLogRepository.log({
      projectId, actorId: uploadedBy, type: 'file_uploaded',
      description: `File "${file.originalname}" uploaded`,
      resourceType: 'file', resourceId: projectFile._id,
    });

    return projectFile;
  },

  async listFiles(projectId, query) {
    return await projectFileRepository.findByProject(projectId, query);
  },

  async getFolders(projectId) {
    return await projectFileRepository.getFolders(projectId);
  },

  async downloadFile(fileId, userId) {
    const file = await projectFileRepository.findById(fileId);
    if (!file) throw new NotFoundError('File not found.');
    await projectFileRepository.incrementDownload(fileId);
    await activityLogRepository.log({
      projectId: file.projectId, actorId: userId, type: 'file_downloaded',
      description: `File "${file.name}" downloaded`,
    });
    return file;
  },

  async deleteFile(fileId, userId, projectId) {
    const file = await projectFileRepository.findById(fileId);
    if (!file) throw new NotFoundError('File not found.');
    if (file.projectId.toString() !== projectId.toString()) throw new ForbiddenError('File does not belong to this project.');

    // Delete from R2
    await r2Service.deleteFile(file.key);

    await projectFileRepository.softDelete(fileId, userId);
    await projectRepository.incrementCounter(projectId, 'fileCount', -1);

    await activityLogRepository.log({
      projectId, actorId: userId, type: 'file_deleted',
      description: `File "${file.name}" deleted`,
    });

    return { deleted: true };
  },
};

module.exports = ProjectFileService;

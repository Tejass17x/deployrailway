const projectFileService = require('../service/projectFile.service');
const { successResponse } = require('../../../common/utils/response');
const asyncHandler = require('../../../common/middleware/asyncHandler');

const ProjectFileController = {
  upload: asyncHandler(async (req, res) => {
    const file = await projectFileService.uploadFile(
      req.params.projectId,
      req.user._id,
      req.file,
      {
        folder: req.body.folder,
        description: req.body.description,
        accessLevel: req.body.accessLevel,
      }
    );
    return successResponse(res, 201, 'File uploaded.', file);
  }),

  list: asyncHandler(async (req, res) => {
    const result = await projectFileService.listFiles(req.params.projectId, req.query);
    return successResponse(res, 200, 'Files fetched.', result);
  }),

  folders: asyncHandler(async (req, res) => {
    const folders = await projectFileService.getFolders(req.params.projectId);
    return successResponse(res, 200, 'Folders.', folders);
  }),

  download: asyncHandler(async (req, res) => {
    const file = await projectFileService.downloadFile(req.params.fileId, req.user._id);
    return successResponse(res, 200, 'File info.', file);
  }),

  delete: asyncHandler(async (req, res) => {
    const result = await projectFileService.deleteFile(
      req.params.fileId, req.user._id, req.params.projectId
    );
    return successResponse(res, 200, 'File deleted.', result);
  }),
};

module.exports = ProjectFileController;

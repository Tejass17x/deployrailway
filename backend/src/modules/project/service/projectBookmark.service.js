const projectBookmarkRepository = require('../repository/projectBookmark.repository');
const projectRepository = require('../repository/project.repository');
const { NotFoundError } = require('../../../common/errors/AppError');

const ProjectBookmarkService = {
  async toggle(projectId, userId, type = 'bookmark') {
    const project = await projectRepository.findById(projectId);
    if (!project) throw new NotFoundError('Project not found.');

    const result = await projectBookmarkRepository.toggle(projectId, userId, type);

    // Update project counter
    const field = type === 'star' ? 'starCount' : 'bookmarkCount';
    const delta = result.action === 'added' ? 1 : -1;
    await projectRepository.incrementCounter(projectId, field, delta);

    return result;
  },

  async myBookmarks(userId, type = 'bookmark', query = {}) {
    return await projectBookmarkRepository.findUserBookmarks(userId, type, query);
  },

  async checkStatus(projectId, userId) {
    const [isBookmarked, isStarred, isFollowing] = await Promise.all([
      projectBookmarkRepository.isBookmarked(projectId, userId, 'bookmark'),
      projectBookmarkRepository.isBookmarked(projectId, userId, 'star'),
      projectBookmarkRepository.isBookmarked(projectId, userId, 'follow'),
    ]);
    return { isBookmarked, isStarred, isFollowing };
  },
};

module.exports = ProjectBookmarkService;

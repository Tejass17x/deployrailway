const projectMemberRepository = require('../repository/projectMember.repository');
const projectRepository = require('../repository/project.repository');
const { ForbiddenError, NotFoundError, UnauthorizedError } = require('../../../common/errors/AppError');

/**
 * Factory: builds an Express middleware that checks for a specific project permission.
 *
 * Usage: router.delete('/:id', authenticate, requireProjectPermission('canDeleteProject'), controller.delete)
 */
const requireProjectPermission = (permission) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?._id || req.user?.id;
      if (!userId) throw new UnauthorizedError('Authentication required.');

      const projectId = req.params.projectId || req.params.id;
      if (!projectId) throw new NotFoundError('Project ID is required.');

      const project = await projectRepository.findById(projectId);
      if (!project) throw new NotFoundError('Project not found.');
      if (project.isDeleted) throw new NotFoundError('Project not found.');

      // Owner always has full access
      const isOwner = project.owner.toString() === userId.toString();
      if (isOwner) {
        req.project = project;
        req.projectMember = null;
        req.isProjectOwner = true;
        req.projectPermissions = Object.fromEntries(
          Object.keys({
            canEditProject: true, canManageMembers: true, canManageApplications: true,
            canManageTasks: true, canManageFiles: true, canManageMilestones: true,
            canManageAnnouncements: true, canManageMeetings: true, canSendMessages: true,
            canViewAnalytics: true, canDeleteProject: true, canTransferOwnership: true,
          }).map((k) => [k, true])
        );
        return next();
      }

      // Check membership
      const member = await projectMemberRepository.findByProjectAndUser(projectId, userId);
      if (!member || member.status !== 'active') {
        throw new ForbiddenError('You are not an active member of this project.');
      }

      const effectivePermissions = member.getEffectivePermissions();

      if (permission && !effectivePermissions[permission]) {
        throw new ForbiddenError(`You do not have the required permission: ${permission}.`);
      }

      req.project = project;
      req.projectMember = member;
      req.isProjectOwner = false;
      req.projectPermissions = effectivePermissions;

      next();
    } catch (err) {
      next(err);
    }
  };
};

/**
 * Checks if the user is an active project member (any role).
 * Attaches project and member info to req.
 */
const requireProjectMember = requireProjectPermission(null);

/**
 * Checks if the current user is the project owner.
 */
const requireProjectOwner = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) throw new UnauthorizedError('Authentication required.');

    const projectId = req.params.projectId || req.params.id;
    const project = await projectRepository.findById(projectId);
    if (!project) throw new NotFoundError('Project not found.');
    if (project.isDeleted) throw new NotFoundError('Project not found.');

    if (project.owner.toString() !== userId.toString()) {
      throw new ForbiddenError('Only the project owner can perform this action.');
    }

    req.project = project;
    req.isProjectOwner = true;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Checks if the project is publicly visible or the user is a member.
 * For public project detail pages — no hard block but attaches context.
 */
const allowPublicOrMember = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id;
    const project = await projectRepository.findByIdOrSlug(projectId);
    if (!project) throw new NotFoundError('Project not found.');
    if (project.isDeleted) throw new NotFoundError('Project not found.');

    req.project = project;

    const userId = req.user?._id || req.user?.id;

    if (project.visibility === 'public' || project.visibility === 'hidden') {
      req.isPublicAccess = true;
      req.projectPermissions = {};
      return next();
    }

    if (!userId) throw new ForbiddenError('This project is private. Please log in.');

    // Check membership for private projects
    const isOwner = project.owner.toString() === userId.toString();
    if (!isOwner) {
      const member = await projectMemberRepository.isMember(project._id, userId);
      if (!member) throw new ForbiddenError('This project is private.');
    }

    req.isPublicAccess = false;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  requireProjectPermission,
  requireProjectMember,
  requireProjectOwner,
  allowPublicOrMember,
};

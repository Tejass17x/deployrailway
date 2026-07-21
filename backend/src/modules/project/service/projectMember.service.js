const projectMemberRepository = require('../repository/projectMember.repository');
const projectRepository = require('../repository/project.repository');
const activityLogRepository = require('../repository/projectActivityLog.repository');
const projectNotification = require('../helper/projectNotification.helper');
const { NotFoundError, ForbiddenError, ConflictError } = require('../../../common/errors/AppError');

const ProjectMemberService = {
  async listMembers(projectId, query) {
    return await projectMemberRepository.findActiveMembers(projectId, query?.page, query?.limit);
  },

  async getMemberRole(projectId, userId) {
    return await projectMemberRepository.findMemberRole(projectId, userId);
  },

  async getMemberWithPermissions(projectId, userId) {
    const member = await projectMemberRepository.findByProjectAndUser(projectId, userId);
    if (!member) return null;
    return {
      ...member.toObject ? member.toObject() : member,
      effectivePermissions: member.getEffectivePermissions ? member.getEffectivePermissions() : {},
    };
  },

  async assignRole(projectId, adminId, targetUserId, newRole) {
    const member = await projectMemberRepository.findByProjectAndUser(projectId, targetUserId);
    if (!member) throw new NotFoundError('Member not found in this project.');
    if (member.role === 'principal-investigator') throw new ForbiddenError('Cannot change the role of the principal investigator.');

    await projectMemberRepository.updateMemberRole(projectId, targetUserId, newRole);

    await activityLogRepository.log({
      projectId,
      actorId: adminId,
      type: 'member_role_changed',
      description: `Member role updated to "${newRole}"`,
      resourceType: 'member',
      resourceId: member._id,
      metadata: { oldRole: member.role, newRole },
    });

    return { updated: true, newRole };
  },

  async updatePermissions(projectId, adminId, targetUserId, permissions) {
    const member = await projectMemberRepository.findByProjectAndUser(projectId, targetUserId);
    if (!member) throw new NotFoundError('Member not found in this project.');

    await projectMemberRepository.updatePermissions(projectId, targetUserId, permissions);
    return { updated: true };
  },

  async removeMember(projectId, adminId, targetUserId) {
    const project = await projectRepository.findById(projectId);
    if (!project) throw new NotFoundError('Project not found.');

    // Owner cannot be removed
    if (project.owner.toString() === targetUserId.toString()) {
      throw new ForbiddenError('The project owner cannot be removed. Transfer ownership first.');
    }

    const member = await projectMemberRepository.findByProjectAndUser(projectId, targetUserId);
    if (!member) throw new NotFoundError('Member not found in this project.');

    await projectMemberRepository.removeMember(projectId, targetUserId);
    await projectRepository.incrementCounter(projectId, 'memberCount', -1);

    await activityLogRepository.log({
      projectId,
      actorId: adminId,
      type: 'member_removed',
      description: 'Member removed from project',
      resourceType: 'member',
      resourceId: member._id,
    });

    await projectNotification.notifyUser(targetUserId, {
      type: 'member_removed',
      actorId: adminId,
      projectId,
      message: `You have been removed from the project "${project.title}".`,
    });

    return { removed: true };
  },

  async leaveProject(projectId, userId) {
    const project = await projectRepository.findById(projectId);
    if (!project) throw new NotFoundError('Project not found.');

    if (project.owner.toString() === userId.toString()) {
      throw new ForbiddenError('The project owner cannot leave. Transfer ownership first.');
    }

    const member = await projectMemberRepository.findByProjectAndUser(projectId, userId);
    if (!member) throw new NotFoundError('You are not a member of this project.');

    await projectMemberRepository.removeMember(projectId, userId);
    await projectRepository.incrementCounter(projectId, 'memberCount', -1);

    await activityLogRepository.log({
      projectId,
      actorId: userId,
      type: 'member_left',
      description: 'Left the project',
    });

    return { left: true };
  },

  async suspendMember(projectId, adminId, targetUserId, reason = '') {
    const member = await projectMemberRepository.findByProjectAndUser(projectId, targetUserId);
    if (!member) throw new NotFoundError('Member not found.');

    await projectMemberRepository.updateMemberStatus(projectId, targetUserId, {
      status: 'suspended',
      suspendedAt: new Date(),
      suspendedBy: adminId,
      suspendReason: reason,
    });

    await activityLogRepository.log({
      projectId,
      actorId: adminId,
      type: 'member_suspended',
      description: `Member suspended: ${reason}`,
    });

    return { suspended: true };
  },

  async reinstateMember(projectId, adminId, targetUserId) {
    await projectMemberRepository.updateMemberStatus(projectId, targetUserId, {
      status: 'active',
      suspendedAt: null,
      suspendedBy: null,
      suspendReason: null,
    });

    await activityLogRepository.log({
      projectId,
      actorId: adminId,
      type: 'member_reinstated',
      description: 'Member reinstated',
    });

    return { reinstated: true };
  },

  async transferOwnership(projectId, currentOwnerId, newOwnerId) {
    const project = await projectRepository.findById(projectId);
    if (!project) throw new NotFoundError('Project not found.');
    if (project.owner.toString() !== currentOwnerId.toString()) {
      throw new ForbiddenError('Only the current owner can transfer ownership.');
    }

    const newOwnerMember = await projectMemberRepository.findByProjectAndUser(projectId, newOwnerId);
    if (!newOwnerMember) throw new NotFoundError('The new owner must be an existing project member.');

    // Update project owner
    project.owner = newOwnerId;
    await project.save();

    // Update roles
    await projectMemberRepository.updateMemberRole(projectId, newOwnerId, 'principal-investigator');
    await projectMemberRepository.updateMemberRole(projectId, currentOwnerId, 'project-admin');

    await activityLogRepository.log({
      projectId,
      actorId: currentOwnerId,
      type: 'member_role_changed',
      description: 'Project ownership transferred',
      metadata: { from: currentOwnerId, to: newOwnerId },
    });

    return { transferred: true };
  },
};

module.exports = ProjectMemberService;

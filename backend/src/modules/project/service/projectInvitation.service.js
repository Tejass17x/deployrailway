const projectInvitationRepository = require('../repository/projectInvitation.repository');
const projectMemberRepository = require('../repository/projectMember.repository');
const projectRepository = require('../repository/project.repository');
const activityLogRepository = require('../repository/projectActivityLog.repository');
const projectNotification = require('../helper/projectNotification.helper');
const { NotFoundError, ForbiddenError, ConflictError } = require('../../../common/errors/AppError');

const ProjectInvitationService = {
  async sendInvitation(projectId, invitedBy, invitedUserId, { role = 'research-collaborator', message = '' } = {}) {
    const project = await projectRepository.findById(projectId);
    if (!project) throw new NotFoundError('Project not found.');

    // Cannot invite existing member
    const isMember = await projectMemberRepository.isMember(projectId, invitedUserId);
    if (isMember) throw new ConflictError('This user is already a project member.');

    // Cannot send duplicate pending invitation
    const existing = await projectInvitationRepository.findPending(projectId, invitedUserId);
    if (existing) throw new ConflictError('A pending invitation already exists for this user.');

    const invitation = await projectInvitationRepository.create({
      projectId,
      invitedBy,
      invitedUser: invitedUserId,
      role,
      message,
    });

    await activityLogRepository.log({
      projectId,
      actorId: invitedBy,
      type: 'invitation_sent',
      description: 'Invitation sent to a researcher',
      resourceType: 'invitation',
      resourceId: invitation._id,
    });

    await projectNotification.notifyUser(invitedUserId, {
      type: 'project_invitation',
      actorId: invitedBy,
      resourceId: invitation._id,
      projectId,
      message: `You have been invited to join the project "${project.title}".`,
    });

    return invitation;
  },

  async cancelInvitation(invitationId, cancelledBy) {
    const inv = await projectInvitationRepository.findById(invitationId);
    if (!inv) throw new NotFoundError('Invitation not found.');
    if (inv.status !== 'pending') throw new ForbiddenError('Only pending invitations can be cancelled.');

    return await projectInvitationRepository.cancel(invitationId, cancelledBy);
  },

  async acceptInvitation(invitationId, userId) {
    const inv = await projectInvitationRepository.findById(invitationId);
    if (!inv) throw new NotFoundError('Invitation not found.');
    if (inv.invitedUser.toString() !== userId.toString()) throw new ForbiddenError('This invitation is not for you.');
    if (inv.status !== 'pending') throw new ForbiddenError('This invitation is no longer pending.');
    if (inv.expiresAt < new Date()) throw new ForbiddenError('This invitation has expired.');

    await projectInvitationRepository.respond(invitationId, 'accepted');

    // Add as member
    const existing = await projectMemberRepository.findByProjectAndUser(inv.projectId, userId);
    if (!existing) {
      await projectMemberRepository.create({
        projectId: inv.projectId,
        userId,
        role: inv.role,
        status: 'active',
        joinedAt: new Date(),
        invitedBy: inv.invitedBy,
        invitationId,
        permissions: {},
      });
      await projectRepository.incrementCounter(inv.projectId, 'memberCount', 1);
    }

    await activityLogRepository.log({
      projectId: inv.projectId,
      actorId: userId,
      type: 'invitation_accepted',
      description: 'Accepted project invitation',
    });

    return { accepted: true, projectId: inv.projectId };
  },

  async rejectInvitation(invitationId, userId, reason = '') {
    const inv = await projectInvitationRepository.findById(invitationId);
    if (!inv) throw new NotFoundError('Invitation not found.');
    if (inv.invitedUser.toString() !== userId.toString()) throw new ForbiddenError('This invitation is not for you.');
    if (inv.status !== 'pending') throw new ForbiddenError('This invitation is no longer pending.');

    await projectInvitationRepository.respond(invitationId, 'rejected', reason);

    await activityLogRepository.log({
      projectId: inv.projectId,
      actorId: userId,
      type: 'invitation_rejected',
      description: 'Rejected project invitation',
    });

    return { rejected: true };
  },

  async listProjectInvitations(projectId, query) {
    return await projectInvitationRepository.findByProject(projectId, query);
  },

  async myInvitations(userId, query) {
    return await projectInvitationRepository.findForUser(userId, query);
  },
};

module.exports = ProjectInvitationService;

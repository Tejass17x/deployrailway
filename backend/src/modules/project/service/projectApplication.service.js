const projectApplicationRepository = require('../repository/projectApplication.repository');
const projectMemberRepository = require('../repository/projectMember.repository');
const projectRepository = require('../repository/project.repository');
const activityLogRepository = require('../repository/projectActivityLog.repository');
const projectNotification = require('../helper/projectNotification.helper');
const { NotFoundError, ForbiddenError, ConflictError, ValidationError } = require('../../../common/errors/AppError');

const ProjectApplicationService = {
  // ─── APPLY ─────────────────────────────────────────────────────────────────
  async apply(projectId, applicantId, data) {
    const project = await projectRepository.findById(projectId);
    if (!project) throw new NotFoundError('Project not found.');
    if (!project.allowApplications) throw new ForbiddenError('This project is not accepting applications.');
    if (project.status === 'completed' || project.status === 'archived' || project.status === 'cancelled') {
      throw new ForbiddenError('This project is not accepting applications.');
    }
    if (project.applicationDeadline && new Date() > project.applicationDeadline) {
      throw new ForbiddenError('The application deadline has passed.');
    }

    // Check if already a member
    const isMember = await projectMemberRepository.isMember(projectId, applicantId);
    if (isMember) throw new ConflictError('You are already a member of this project.');

    // Check for existing application
    const hasApplied = await projectApplicationRepository.hasApplied(projectId, applicantId);
    if (hasApplied) throw new ConflictError('You have already applied to this project.');

    const application = await projectApplicationRepository.create({
      projectId,
      applicantId,
      ...data,
      status: 'applied',
      statusHistory: [{ status: 'applied', changedBy: applicantId, changedAt: new Date() }],
    });

    // Increment application count
    await projectRepository.incrementCounter(projectId, 'applicationCount', 1);

    // Log activity
    await activityLogRepository.log({
      projectId,
      actorId: applicantId,
      type: 'application_submitted',
      description: 'Applied to join the project',
      resourceType: 'application',
      resourceId: application._id,
    });

    // Notify project owner and admins
    await projectNotification.notifyOwner(project, {
      type: 'application_received',
      actorId: applicantId,
      resourceId: application._id,
      message: 'A new researcher has applied to your project.',
    });

    return application;
  },

  // ─── WITHDRAW ──────────────────────────────────────────────────────────────
  async withdraw(projectId, applicantId) {
    const application = await projectApplicationRepository.findByProjectAndApplicant(projectId, applicantId);
    if (!application) throw new NotFoundError('Application not found.');
    if (['accepted', 'joined'].includes(application.status)) {
      throw new ForbiddenError('Cannot withdraw an accepted application. Please leave the project instead.');
    }

    const updated = await projectApplicationRepository.updateStatus(
      application._id, 'withdrawn', applicantId, 'Withdrawn by applicant'
    );
    updated.withdrawnAt = new Date();
    await updated.save();

    await projectRepository.incrementCounter(projectId, 'applicationCount', -1);

    await activityLogRepository.log({
      projectId,
      actorId: applicantId,
      type: 'application_withdrawn',
      description: 'Withdrew their application',
    });

    return updated;
  },

  // ─── LIST (for project owners) ─────────────────────────────────────────────
  async listApplications(projectId, query) {
    return await projectApplicationRepository.findByProject(projectId, query);
  },

  // ─── GET SINGLE ────────────────────────────────────────────────────────────
  async getApplication(applicationId) {
    const app = await projectApplicationRepository.findById(applicationId, 'applicantId projectId reviewedBy');
    if (!app) throw new NotFoundError('Application not found.');
    return app;
  },

  // ─── MY APPLICATIONS (for applicants) ─────────────────────────────────────
  async myApplications(applicantId, query) {
    return await projectApplicationRepository.findByApplicant(applicantId, query);
  },

  // ─── REVIEW (move to under-review) ────────────────────────────────────────
  async review(applicationId, reviewerId, note = '') {
    return await this._changeStatus(applicationId, reviewerId, 'under-review', note, 'application_reviewed');
  },

  // ─── SHORTLIST ─────────────────────────────────────────────────────────────
  async shortlist(applicationId, reviewerId, note = '') {
    return await this._changeStatus(applicationId, reviewerId, 'shortlisted', note, 'application_shortlisted');
  },

  // ─── SCHEDULE INTERVIEW ────────────────────────────────────────────────────
  async scheduleInterview(applicationId, reviewerId, interviewData) {
    const app = await projectApplicationRepository.findById(applicationId);
    if (!app) throw new NotFoundError('Application not found.');

    const updated = await projectApplicationRepository.updateStatus(applicationId, 'interview', reviewerId);
    Object.assign(updated, interviewData);
    await updated.save();

    await projectNotification.notifyApplicant(updated.projectId, updated.applicantId, {
      type: 'application_interview',
      actorId: reviewerId,
      resourceId: applicationId,
      message: 'You have been invited for an interview.',
    });

    return updated;
  },

  // ─── ACCEPT ────────────────────────────────────────────────────────────────
  async accept(applicationId, reviewerId, role = 'research-collaborator') {
    const app = await projectApplicationRepository.findById(applicationId);
    if (!app) throw new NotFoundError('Application not found.');

    const project = await projectRepository.findById(app.projectId);
    if (!project) throw new NotFoundError('Project not found.');

    // Check max member limit
    const currentCount = await projectMemberRepository.countActiveMembers(app.projectId);
    if (currentCount >= project.maxTeamMembers) {
      throw new ForbiddenError('The project team is already full.');
    }

    // Transition status
    await projectApplicationRepository.updateStatus(applicationId, 'accepted', reviewerId, 'Application accepted');
    const app2 = await projectApplicationRepository.findById(applicationId);
    app2.acceptedAt = new Date();
    app2.reviewedBy = reviewerId;
    app2.reviewedAt = new Date();
    await app2.save();

    // Add as member
    const existingMember = await projectMemberRepository.findByProjectAndUser(app.projectId, app.applicantId);
    if (!existingMember) {
      await projectMemberRepository.create({
        projectId: app.projectId,
        userId: app.applicantId,
        role,
        status: 'active',
        joinedAt: new Date(),
        invitedBy: reviewerId,
        applicationId,
        permissions: {},
      });
      await projectRepository.incrementCounter(app.projectId, 'memberCount', 1);
    }

    // Final status: joined
    await projectApplicationRepository.updateStatus(applicationId, 'joined', reviewerId);

    await activityLogRepository.log({
      projectId: app.projectId,
      actorId: reviewerId,
      type: 'application_accepted',
      description: 'Application accepted and member added',
      resourceType: 'application',
      resourceId: applicationId,
    });

    await projectNotification.notifyApplicant(app.projectId, app.applicantId, {
      type: 'application_accepted',
      actorId: reviewerId,
      resourceId: applicationId,
      message: `Your application to "${project.title}" has been accepted! Welcome to the team.`,
    });

    return app2;
  },

  // ─── REJECT ────────────────────────────────────────────────────────────────
  async reject(applicationId, reviewerId, reason = '') {
    const app = await projectApplicationRepository.findById(applicationId);
    if (!app) throw new NotFoundError('Application not found.');

    const updated = await projectApplicationRepository.updateStatus(
      applicationId, 'rejected', reviewerId, reason
    );
    updated.rejectionReason = reason;
    updated.reviewedBy = reviewerId;
    updated.reviewedAt = new Date();
    await updated.save();

    await activityLogRepository.log({
      projectId: app.projectId,
      actorId: reviewerId,
      type: 'application_rejected',
      description: 'Application rejected',
    });

    await projectNotification.notifyApplicant(app.projectId, app.applicantId, {
      type: 'application_rejected',
      actorId: reviewerId,
      resourceId: applicationId,
      message: 'Your application was not successful this time.',
    });

    return updated;
  },

  // ─── COUNTS ────────────────────────────────────────────────────────────────
  async getApplicationCounts(projectId) {
    const rows = await projectApplicationRepository.countByProject(projectId);
    return rows.reduce((acc, row) => { acc[row._id] = row.count; return acc; }, {});
  },

  // ─── PRIVATE ───────────────────────────────────────────────────────────────
  async _changeStatus(applicationId, reviewerId, status, note, logType) {
    const app = await projectApplicationRepository.findById(applicationId);
    if (!app) throw new NotFoundError('Application not found.');

    const updated = await projectApplicationRepository.updateStatus(applicationId, status, reviewerId, note);
    updated.reviewedBy = reviewerId;
    updated.reviewedAt = new Date();
    await updated.save();

    await activityLogRepository.log({
      projectId: app.projectId,
      actorId: reviewerId,
      type: logType,
      description: `Application moved to "${status}"`,
    });

    return updated;
  },
};

module.exports = ProjectApplicationService;

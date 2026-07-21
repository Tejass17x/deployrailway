const router = require('express').Router();
const multer = require('multer');

// Controllers
const ProjectCtrl = require('../controller/project.controller');
const ApplicationCtrl = require('../controller/projectApplication.controller');
const InvitationCtrl = require('../controller/projectInvitation.controller');
const MemberCtrl = require('../controller/projectMember.controller');
const TaskCtrl = require('../controller/projectTask.controller');
const MilestoneCtrl = require('../controller/projectMilestone.controller');
const FileCtrl = require('../controller/projectFile.controller');
const MessageCtrl = require('../controller/projectMessage.controller');
const AnnouncementCtrl = require('../controller/projectAnnouncement.controller');
const AnalyticsCtrl = require('../controller/projectAnalytics.controller');
const BookmarkCtrl = require('../controller/projectBookmark.controller');

// Middleware
const { authenticate } = require('../../../common/middleware/auth.middleware');
const {
  requireProjectPermission,
  requireProjectMember,
  requireProjectOwner,
  allowPublicOrMember,
} = require('../middleware/projectPermission.middleware');

// Validators
const {
  validate,
  createProjectRules,
  updateProjectRules,
  listProjectsRules,
} = require('../validator/project.validator');
const { applyApplicationRules, scheduleInterviewRules } = require('../validator/projectApplication.validator');
const { createTaskRules, updateTaskStatusRules, reorderTasksRules, addCommentRules } = require('../validator/projectTask.validator');

// Multer (memory storage for R2)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
});

// ═══════════════════════════════════════════════════════════════════
// PUBLIC / DISCOVERY
// ═══════════════════════════════════════════════════════════════════
router.get('/', listProjectsRules, validate, ProjectCtrl.list);
router.get('/trending', ProjectCtrl.trending);

// ═══════════════════════════════════════════════════════════════════
// AUTHENTICATED GENERAL
// ═══════════════════════════════════════════════════════════════════
router.get('/recommended', authenticate, ProjectCtrl.recommended);
router.get('/my', authenticate, ProjectCtrl.myProjects);
router.get('/stats/owner', authenticate, ProjectCtrl.ownerStats);
router.get('/analytics/owner', authenticate, AnalyticsCtrl.ownerAnalytics);
router.get('/bookmarks', authenticate, BookmarkCtrl.myBookmarks);

// My applications / invitations (global, not project-scoped)
router.get('/applications/mine', authenticate, ApplicationCtrl.myApplications);
router.get('/invitations/mine', authenticate, InvitationCtrl.myInvitations);
router.patch('/invitations/:invitationId/accept', authenticate, InvitationCtrl.accept);
router.patch('/invitations/:invitationId/reject', authenticate, InvitationCtrl.reject);

// ═══════════════════════════════════════════════════════════════════
// CREATE
// ═══════════════════════════════════════════════════════════════════
router.post('/', authenticate, createProjectRules, validate, ProjectCtrl.create);

// ═══════════════════════════════════════════════════════════════════
// SINGLE PROJECT — PUBLIC DETAIL
// ═══════════════════════════════════════════════════════════════════
router.get('/:id', allowPublicOrMember, ProjectCtrl.getOne);
router.patch('/:id/bookmark', authenticate, BookmarkCtrl.toggle);
router.get('/:id/bookmark-status', authenticate, BookmarkCtrl.checkStatus);

// ═══════════════════════════════════════════════════════════════════
// PROJECT MANAGEMENT — Owner/Admin only
// ═══════════════════════════════════════════════════════════════════
router.put('/:id', authenticate, requireProjectPermission('canEditProject'), updateProjectRules, validate, ProjectCtrl.update);
router.patch('/:id/status', authenticate, requireProjectOwner, ProjectCtrl.updateStatus);
router.patch('/:id/progress', authenticate, requireProjectPermission('canEditProject'), ProjectCtrl.updateProgress);
router.patch('/:id/archive', authenticate, requireProjectOwner, ProjectCtrl.archive);
router.delete('/:id', authenticate, requireProjectPermission('canDeleteProject'), ProjectCtrl.delete);

// ═══════════════════════════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════════════════════════
router.get('/:projectId/analytics', authenticate, requireProjectPermission('canViewAnalytics'), AnalyticsCtrl.dashboard);
router.get('/:projectId/analytics/activity', authenticate, requireProjectPermission('canViewAnalytics'), AnalyticsCtrl.activityTimeline);

// ═══════════════════════════════════════════════════════════════════
// MEMBERS
// ═══════════════════════════════════════════════════════════════════
router.get('/:projectId/members', authenticate, requireProjectMember, MemberCtrl.list);
router.get('/:projectId/members/my-permissions', authenticate, requireProjectMember, MemberCtrl.getMyPermissions);
router.patch('/:projectId/members/leave', authenticate, requireProjectMember, MemberCtrl.leave);
router.patch('/:projectId/members/role', authenticate, requireProjectPermission('canManageMembers'), MemberCtrl.assignRole);
router.patch('/:projectId/members/permissions', authenticate, requireProjectPermission('canManageMembers'), MemberCtrl.updatePermissions);
router.delete('/:projectId/members/:memberId', authenticate, requireProjectPermission('canManageMembers'), MemberCtrl.remove);
router.patch('/:projectId/members/suspend', authenticate, requireProjectPermission('canManageMembers'), MemberCtrl.suspend);
router.patch('/:projectId/members/reinstate', authenticate, requireProjectPermission('canManageMembers'), MemberCtrl.reinstate);
router.patch('/:projectId/members/transfer-ownership', authenticate, requireProjectOwner, MemberCtrl.transferOwnership);

// ═══════════════════════════════════════════════════════════════════
// APPLICATIONS
// ═══════════════════════════════════════════════════════════════════
router.post('/:projectId/applications', authenticate, applyApplicationRules, validate, ApplicationCtrl.apply);
router.get('/:projectId/applications', authenticate, requireProjectPermission('canManageApplications'), ApplicationCtrl.listApplications);
router.get('/:projectId/applications/counts', authenticate, requireProjectPermission('canManageApplications'), ApplicationCtrl.counts);
router.get('/:projectId/applications/:applicationId', authenticate, ApplicationCtrl.getApplication);
router.patch('/:projectId/applications/withdraw', authenticate, ApplicationCtrl.withdraw);
router.patch('/:projectId/applications/:applicationId/review', authenticate, requireProjectPermission('canManageApplications'), ApplicationCtrl.review);
router.patch('/:projectId/applications/:applicationId/shortlist', authenticate, requireProjectPermission('canManageApplications'), ApplicationCtrl.shortlist);
router.patch('/:projectId/applications/:applicationId/interview', authenticate, requireProjectPermission('canManageApplications'), scheduleInterviewRules, validate, ApplicationCtrl.scheduleInterview);
router.patch('/:projectId/applications/:applicationId/accept', authenticate, requireProjectPermission('canManageApplications'), ApplicationCtrl.accept);
router.patch('/:projectId/applications/:applicationId/reject', authenticate, requireProjectPermission('canManageApplications'), ApplicationCtrl.reject);

// ═══════════════════════════════════════════════════════════════════
// INVITATIONS
// ═══════════════════════════════════════════════════════════════════
router.post('/:projectId/invitations', authenticate, requireProjectPermission('canManageMembers'), InvitationCtrl.send);
router.get('/:projectId/invitations', authenticate, requireProjectPermission('canManageMembers'), InvitationCtrl.listInvitations);
router.patch('/:projectId/invitations/:invitationId/cancel', authenticate, requireProjectPermission('canManageMembers'), InvitationCtrl.cancel);

// ═══════════════════════════════════════════════════════════════════
// TASKS (Kanban)
// ═══════════════════════════════════════════════════════════════════
router.post('/:projectId/tasks', authenticate, requireProjectPermission('canManageTasks'), createTaskRules, validate, TaskCtrl.create);
router.get('/:projectId/tasks', authenticate, requireProjectMember, TaskCtrl.list);
router.get('/:projectId/tasks/kanban', authenticate, requireProjectMember, TaskCtrl.kanban);
router.get('/:projectId/tasks/counts', authenticate, requireProjectMember, TaskCtrl.counts);
router.patch('/:projectId/tasks/reorder', authenticate, requireProjectPermission('canManageTasks'), reorderTasksRules, validate, TaskCtrl.reorder);
router.get('/:projectId/tasks/:taskId', authenticate, requireProjectMember, TaskCtrl.getOne);
router.put('/:projectId/tasks/:taskId', authenticate, requireProjectPermission('canManageTasks'), TaskCtrl.update);
router.patch('/:projectId/tasks/:taskId/status', authenticate, requireProjectPermission('canManageTasks'), updateTaskStatusRules, validate, TaskCtrl.updateStatus);
router.post('/:projectId/tasks/:taskId/comments', authenticate, requireProjectMember, addCommentRules, validate, TaskCtrl.addComment);
router.delete('/:projectId/tasks/:taskId', authenticate, requireProjectPermission('canManageTasks'), TaskCtrl.delete);

// ═══════════════════════════════════════════════════════════════════
// MILESTONES
// ═══════════════════════════════════════════════════════════════════
router.post('/:projectId/milestones', authenticate, requireProjectPermission('canManageMilestones'), MilestoneCtrl.create);
router.get('/:projectId/milestones', authenticate, requireProjectMember, MilestoneCtrl.list);
router.put('/:projectId/milestones/:milestoneId', authenticate, requireProjectPermission('canManageMilestones'), MilestoneCtrl.update);
router.patch('/:projectId/milestones/:milestoneId/complete', authenticate, requireProjectPermission('canManageMilestones'), MilestoneCtrl.complete);
router.delete('/:projectId/milestones/:milestoneId', authenticate, requireProjectPermission('canManageMilestones'), MilestoneCtrl.delete);

// ═══════════════════════════════════════════════════════════════════
// FILES
// ═══════════════════════════════════════════════════════════════════
router.post('/:projectId/files', authenticate, requireProjectPermission('canManageFiles'), upload.single('file'), FileCtrl.upload);
router.get('/:projectId/files', authenticate, requireProjectMember, FileCtrl.list);
router.get('/:projectId/files/folders', authenticate, requireProjectMember, FileCtrl.folders);
router.get('/:projectId/files/:fileId/download', authenticate, requireProjectMember, FileCtrl.download);
router.delete('/:projectId/files/:fileId', authenticate, requireProjectPermission('canManageFiles'), FileCtrl.delete);

// ═══════════════════════════════════════════════════════════════════
// CHAT / MESSAGES
// ═══════════════════════════════════════════════════════════════════
router.post('/:projectId/messages', authenticate, requireProjectPermission('canSendMessages'), MessageCtrl.send);
router.get('/:projectId/messages', authenticate, requireProjectMember, MessageCtrl.list);
router.get('/:projectId/messages/pinned', authenticate, requireProjectMember, MessageCtrl.pinned);
router.get('/:projectId/messages/:messageId/thread', authenticate, requireProjectMember, MessageCtrl.getThread);
router.patch('/:projectId/messages/:messageId/pin', authenticate, requireProjectPermission('canManageAnnouncements'), MessageCtrl.togglePin);
router.patch('/:projectId/messages/:messageId/react', authenticate, requireProjectMember, MessageCtrl.react);
router.patch('/:projectId/messages/:messageId', authenticate, requireProjectMember, MessageCtrl.edit);
router.delete('/:projectId/messages/:messageId', authenticate, requireProjectMember, MessageCtrl.delete);
router.patch('/:projectId/messages/:messageId/read', authenticate, requireProjectMember, MessageCtrl.markRead);

// ═══════════════════════════════════════════════════════════════════
// ANNOUNCEMENTS
// ═══════════════════════════════════════════════════════════════════
router.post('/:projectId/announcements', authenticate, requireProjectPermission('canManageAnnouncements'), AnnouncementCtrl.create);
router.get('/:projectId/announcements', authenticate, requireProjectMember, AnnouncementCtrl.list);
router.patch('/:projectId/announcements/:announcementId/pin', authenticate, requireProjectPermission('canManageAnnouncements'), AnnouncementCtrl.togglePin);
router.patch('/:projectId/announcements/:announcementId/read', authenticate, requireProjectMember, AnnouncementCtrl.markRead);
router.delete('/:projectId/announcements/:announcementId', authenticate, requireProjectPermission('canManageAnnouncements'), AnnouncementCtrl.delete);

module.exports = router;

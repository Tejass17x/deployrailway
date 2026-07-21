const mongoose = require('mongoose');
const { Schema } = mongoose;

const PROJECT_ACTIVITY_TYPES = [
  'project_created', 'project_updated', 'project_archived', 'project_deleted',
  'project_status_changed', 'project_published',
  'member_joined', 'member_left', 'member_removed', 'member_role_changed',
  'member_suspended', 'member_reinstated',
  'application_submitted', 'application_reviewed', 'application_shortlisted',
  'application_accepted', 'application_rejected', 'application_withdrawn',
  'invitation_sent', 'invitation_accepted', 'invitation_rejected', 'invitation_cancelled',
  'task_created', 'task_updated', 'task_assigned', 'task_completed', 'task_deleted',
  'milestone_created', 'milestone_completed', 'milestone_updated', 'milestone_deleted',
  'file_uploaded', 'file_deleted', 'file_downloaded', 'folder_created',
  'message_sent', 'message_pinned', 'message_deleted',
  'announcement_created', 'announcement_deleted', 'announcement_pinned',
  'meeting_scheduled', 'meeting_cancelled', 'meeting_completed',
  'project_bookmarked', 'project_starred',
  'github_synced',
];

const ProjectActivityLogSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    type: { type: String, enum: PROJECT_ACTIVITY_TYPES, required: true, index: true },

    // Human-readable description
    description: { type: String, trim: true, maxlength: 500 },

    // Reference to the affected resource
    resourceType: {
      type: String,
      enum: ['project', 'member', 'application', 'invitation', 'task', 'milestone', 'file', 'message', 'announcement', 'meeting', 'bookmark'],
    },
    resourceId: { type: Schema.Types.ObjectId },

    // Additional metadata (flexible JSON)
    metadata: { type: Schema.Types.Mixed },

    // IP and device for security audit
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true, versionKey: false }
);

// Activity logs are immutable — no updates allowed
ProjectActivityLogSchema.index({ projectId: 1, createdAt: -1 });
ProjectActivityLogSchema.index({ projectId: 1, type: 1, createdAt: -1 });
ProjectActivityLogSchema.index({ projectId: 1, actorId: 1 });
ProjectActivityLogSchema.index({ actorId: 1, type: 1 });

// TTL: keep logs for 1 year
ProjectActivityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

module.exports = {
  ProjectActivityLog:
    mongoose.models.ProjectActivityLog ||
    mongoose.model('ProjectActivityLog', ProjectActivityLogSchema),
  PROJECT_ACTIVITY_TYPES,
};

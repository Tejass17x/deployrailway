const mongoose = require('mongoose');
const { Schema } = mongoose;

const PROJECT_ROLES = [
  'principal-investigator',
  'project-admin',
  'research-mentor',
  'research-collaborator',
  'research-assistant',
  'phd-scholar',
  'master-student',
  'undergraduate-student',
  'industry-expert',
  'reviewer',
  'read-only-member',
  'organization',
];

const DEFAULT_PERMISSIONS = {
  canEditProject: false,
  canManageMembers: false,
  canManageApplications: false,
  canManageTasks: false,
  canManageFiles: false,
  canManageMilestones: false,
  canManageAnnouncements: false,
  canManageMeetings: false,
  canSendMessages: true,
  canViewAnalytics: false,
  canDeleteProject: false,
  canTransferOwnership: false,
};

const ROLE_PERMISSION_PRESETS = {
  'principal-investigator': {
    canEditProject: true, canManageMembers: true, canManageApplications: true,
    canManageTasks: true, canManageFiles: true, canManageMilestones: true,
    canManageAnnouncements: true, canManageMeetings: true, canSendMessages: true,
    canViewAnalytics: true, canDeleteProject: true, canTransferOwnership: true,
  },
  'project-admin': {
    canEditProject: true, canManageMembers: true, canManageApplications: true,
    canManageTasks: true, canManageFiles: true, canManageMilestones: true,
    canManageAnnouncements: true, canManageMeetings: true, canSendMessages: true,
    canViewAnalytics: true, canDeleteProject: false, canTransferOwnership: false,
  },
  'research-mentor': {
    canEditProject: false, canManageMembers: false, canManageApplications: true,
    canManageTasks: true, canManageFiles: true, canManageMilestones: true,
    canManageAnnouncements: false, canManageMeetings: true, canSendMessages: true,
    canViewAnalytics: true, canDeleteProject: false, canTransferOwnership: false,
  },
  'research-collaborator': {
    canEditProject: false, canManageMembers: false, canManageApplications: false,
    canManageTasks: true, canManageFiles: true, canManageMilestones: false,
    canManageAnnouncements: false, canManageMeetings: false, canSendMessages: true,
    canViewAnalytics: false, canDeleteProject: false, canTransferOwnership: false,
  },
  'research-assistant': {
    canEditProject: false, canManageMembers: false, canManageApplications: false,
    canManageTasks: true, canManageFiles: true, canManageMilestones: false,
    canManageAnnouncements: false, canManageMeetings: false, canSendMessages: true,
    canViewAnalytics: false, canDeleteProject: false, canTransferOwnership: false,
  },
  'phd-scholar': {
    canEditProject: false, canManageMembers: false, canManageApplications: false,
    canManageTasks: true, canManageFiles: true, canManageMilestones: false,
    canManageAnnouncements: false, canManageMeetings: false, canSendMessages: true,
    canViewAnalytics: false, canDeleteProject: false, canTransferOwnership: false,
  },
  'master-student': {
    ...DEFAULT_PERMISSIONS, canManageTasks: true, canManageFiles: true,
  },
  'undergraduate-student': {
    ...DEFAULT_PERMISSIONS, canManageTasks: true,
  },
  'industry-expert': {
    ...DEFAULT_PERMISSIONS, canManageTasks: true, canManageFiles: true, canViewAnalytics: true,
  },
  'reviewer': {
    ...DEFAULT_PERMISSIONS, canManageTasks: false, canManageFiles: false, canSendMessages: true,
  },
  'read-only-member': {
    ...DEFAULT_PERMISSIONS, canSendMessages: false,
  },
  'organization': {
    ...DEFAULT_PERMISSIONS, canManageFiles: true, canViewAnalytics: true,
  },
};

const ProjectMemberSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    role: { type: String, enum: PROJECT_ROLES, required: true, default: 'research-collaborator' },

    status: {
      type: String,
      enum: ['active', 'suspended', 'banned', 'left'],
      default: 'active',
      index: true,
    },

    // Custom permission overrides (merged on top of role defaults)
    permissions: {
      canEditProject: { type: Boolean },
      canManageMembers: { type: Boolean },
      canManageApplications: { type: Boolean },
      canManageTasks: { type: Boolean },
      canManageFiles: { type: Boolean },
      canManageMilestones: { type: Boolean },
      canManageAnnouncements: { type: Boolean },
      canManageMeetings: { type: Boolean },
      canSendMessages: { type: Boolean },
      canViewAnalytics: { type: Boolean },
      canDeleteProject: { type: Boolean },
      canTransferOwnership: { type: Boolean },
    },

    joinedAt: { type: Date, default: Date.now },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    applicationId: { type: Schema.Types.ObjectId, ref: 'ProjectApplication' },
    invitationId: { type: Schema.Types.ObjectId, ref: 'ProjectInvitation' },
    note: { type: String, trim: true, maxlength: 500 },

    // Mute/suspend tracking
    suspendedAt: { type: Date },
    suspendedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    suspendReason: { type: String, trim: true },

    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

ProjectMemberSchema.index({ projectId: 1, userId: 1 }, { unique: true, sparse: true });
ProjectMemberSchema.index({ projectId: 1, role: 1, status: 1 });
ProjectMemberSchema.index({ userId: 1, status: 1 });

ProjectMemberSchema.methods.getEffectivePermissions = function () {
  const preset = ROLE_PERMISSION_PRESETS[this.role] || DEFAULT_PERMISSIONS;
  const overrides = this.permissions ? this.permissions.toObject() : {};
  // Merge: role preset + custom overrides (only defined overrides apply)
  const merged = { ...preset };
  Object.keys(overrides).forEach((key) => {
    if (overrides[key] !== undefined && overrides[key] !== null) {
      merged[key] = overrides[key];
    }
  });
  return merged;
};

module.exports = {
  ProjectMember: mongoose.models.ProjectMember || mongoose.model('ProjectMember', ProjectMemberSchema),
  PROJECT_ROLES,
  ROLE_PERMISSION_PRESETS,
};

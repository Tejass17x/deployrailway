const mongoose = require('mongoose');
const { Schema } = mongoose;

const ProjectInvitationSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    invitedUser: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    email: { type: String, trim: true, lowercase: true }, // for external invites

    role: { type: String, default: 'research-collaborator' },
    message: { type: String, trim: true, maxlength: 1000 },

    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled', 'expired'],
      default: 'pending',
      index: true,
    },

    expiresAt: { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }, // 7 days
    respondedAt: { type: Date },
    cancelledAt: { type: Date },
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String, trim: true },

    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ProjectInvitationSchema.index({ projectId: 1, invitedUser: 1 }, { unique: true, sparse: true });
ProjectInvitationSchema.index({ projectId: 1, status: 1 });
ProjectInvitationSchema.index({ invitedUser: 1, status: 1 });
ProjectInvitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL auto-expire

module.exports =
  mongoose.models.ProjectInvitation ||
  mongoose.model('ProjectInvitation', ProjectInvitationSchema);

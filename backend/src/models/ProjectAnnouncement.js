const mongoose = require('mongoose');
const { Schema } = mongoose;

const ProjectAnnouncementSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    title: { type: String, required: true, trim: true, maxlength: 300 },
    content: { type: String, required: true, trim: true, maxlength: 10000 },

    isPinned: { type: Boolean, default: false, index: true },
    pinnedAt: { type: Date },

    attachments: [
      {
        name: { type: String },
        url: { type: String },
        key: { type: String },
        mimeType: { type: String },
      },
    ],

    // Track who has read this
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    readCount: { type: Number, default: 0 },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

ProjectAnnouncementSchema.index({ projectId: 1, isPinned: 1, createdAt: -1 });

module.exports =
  mongoose.models.ProjectAnnouncement ||
  mongoose.model('ProjectAnnouncement', ProjectAnnouncementSchema);

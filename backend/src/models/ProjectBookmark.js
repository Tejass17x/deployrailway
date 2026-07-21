const mongoose = require('mongoose');
const { Schema } = mongoose;

const ProjectBookmarkSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    type: {
      type: String,
      enum: ['bookmark', 'star', 'follow', 'watch'],
      default: 'bookmark',
    },

    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ProjectBookmarkSchema.index({ projectId: 1, userId: 1, type: 1 }, { unique: true, sparse: true });
ProjectBookmarkSchema.index({ userId: 1, type: 1, createdAt: -1 });

module.exports =
  mongoose.models.ProjectBookmark ||
  mongoose.model('ProjectBookmark', ProjectBookmarkSchema);

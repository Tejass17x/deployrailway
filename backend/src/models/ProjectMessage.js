const mongoose = require('mongoose');
const { Schema } = mongoose;

const ProjectMessageSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // Thread support
    threadId: { type: Schema.Types.ObjectId, ref: 'ProjectMessage', default: null, index: true }, // null = top-level
    replyCount: { type: Number, default: 0 },

    // Content
    content: { type: String, trim: true, maxlength: 10000 },
    contentType: {
      type: String,
      enum: ['text', 'code', 'image', 'video', 'audio', 'file', 'announcement', 'system'],
      default: 'text',
    },
    codeLanguage: { type: String, trim: true }, // For code snippets

    // Attachments
    attachments: [
      {
        name: { type: String },
        url: { type: String },
        key: { type: String },
        mimeType: { type: String },
        size: { type: Number },
        fileType: { type: String },
      },
    ],

    // Mentions
    mentions: [{ type: Schema.Types.ObjectId, ref: 'User' }],

    // Reactions (emoji reactions)
    reactions: [
      {
        emoji: { type: String },
        count: { type: Number, default: 1 },
        users: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      },
    ],

    // Read receipts
    readBy: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now },
      },
    ],

    // Pinned messages
    isPinned: { type: Boolean, default: false, index: true },
    pinnedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    pinnedAt: { type: Date },

    // Edit history
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date },
    editHistory: [
      {
        content: { type: String },
        editedAt: { type: Date, default: Date.now },
      },
    ],

    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

ProjectMessageSchema.index({ projectId: 1, threadId: 1, createdAt: -1 });
ProjectMessageSchema.index({ projectId: 1, isPinned: 1 });
ProjectMessageSchema.index({ projectId: 1, senderId: 1 });
ProjectMessageSchema.index({ mentions: 1, projectId: 1 });

module.exports =
  mongoose.models.ProjectMessage ||
  mongoose.model('ProjectMessage', ProjectMessageSchema);

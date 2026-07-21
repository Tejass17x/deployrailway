const mongoose = require('mongoose');
const { Schema } = mongoose;

const ProjectFileSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    name: { type: String, required: true, trim: true },
    originalName: { type: String, trim: true },
    description: { type: String, trim: true, maxlength: 500 },

    // R2 storage
    key: { type: String, required: true },   // R2 object key
    url: { type: String, required: true },   // Public or signed URL
    mimeType: { type: String },
    size: { type: Number, default: 0 },      // bytes
    format: { type: String },                // pdf, docx, xlsx, png, mp4, csv ...

    // File type category
    fileType: {
      type: String,
      enum: ['document', 'image', 'video', 'audio', 'dataset', 'code', 'archive', 'other'],
      default: 'other',
    },

    // Folder organization
    folder: { type: String, trim: true, default: '/' },

    // Access control
    accessLevel: {
      type: String,
      enum: ['all-members', 'admins-only', 'owner-only'],
      default: 'all-members',
    },

    // Version history
    version: { type: Number, default: 1 },
    versions: [
      {
        version: { type: Number },
        key: { type: String },
        url: { type: String },
        size: { type: Number },
        uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        uploadedAt: { type: Date, default: Date.now },
        note: { type: String, trim: true },
      },
    ],

    downloadCount: { type: Number, default: 0 },
    lastAccessedAt: { type: Date },

    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

ProjectFileSchema.index({ projectId: 1, folder: 1, isDeleted: 1 });
ProjectFileSchema.index({ projectId: 1, fileType: 1 });
ProjectFileSchema.index({ projectId: 1, uploadedBy: 1 });

module.exports =
  mongoose.models.ProjectFile || mongoose.model('ProjectFile', ProjectFileSchema);

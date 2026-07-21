const mongoose = require('mongoose');

const messageAttachmentSchema = new mongoose.Schema(
  {
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      index: true
    },
    url: {
      type: String,
      required: true
    },
    fileUrl: {
      type: String
    },
    // objectKey is the Cloudflare R2 storage key (previously called publicId for Cloudinary).
    // Optional to maintain backwards compatibility and support multiple storage providers.
    objectKey: {
      type: String,
      default: null
    },
    storageProvider: {
      type: String,
      enum: ['r2', 'cloudinary', 'local'],
      default: 'r2'
    },
    filename: {
      type: String
    },
    fileName: {
      type: String
    },
    fileType: {
      type: String
    },
    mimeType: {
      type: String
    },
    fileSize: {
      type: Number
    },
    size: {
      type: Number
    },
    thumbnail: {
      type: String
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('MessageAttachment', messageAttachmentSchema);

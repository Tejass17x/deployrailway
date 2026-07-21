const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    type: {
      type: String,
      enum: [
        'text',
        'image',
        'pdf',
        'publication',
        'dataset',
        'project',
        'patent',
        'conference',
        'journal',
        'research_profile',
        'citation',
        'file',
        'system'
      ],
      default: 'text'
    },
    messageType: {
      type: String,
      enum: [
        'text',
        'image',
        'pdf',
        'publication',
        'dataset',
        'project',
        'patent',
        'conference',
        'journal',
        'research_profile',
        'citation',
        'file',
        'system'
      ],
      default: 'text'
    },
    text: {
      type: String
    },
    message: {
      type: String
    },
    attachment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MessageAttachment'
    },
    attachmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MessageAttachment'
    },
    status: {
      type: String,
      enum: ['sending', 'sent', 'delivered', 'read', 'seen', 'failed'],
      default: 'sent',
      index: true
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    edited: {
      type: Boolean,
      default: false
    },
    deleted: {
      type: Boolean,
      default: false
    },
    deletedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    reactions: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        reaction: String
      }
    ],
    readAt: {
      type: Date
    },
    deliveredAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, createdAt: -1 });
messageSchema.index({ conversationId: 1, senderId: 1, status: 1 });

module.exports = mongoose.model('Message', messageSchema);


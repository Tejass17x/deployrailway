const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      }
    ],
    isGroup: {
      type: Boolean,
      default: false
    },
    conversationType: {
      type: String,
      enum: ['Direct', 'Group'],
      default: 'Direct'
    },
    name: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    avatar: {
      type: String,
      default: ''
    },
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    lastMessage: {
      type: String,
      default: ''
    },
    lastMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    lastSender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    lastMessageTime: {
      type: Date,
      default: Date.now
    },
    unreadCounts: {
      type: Map,
      of: Number,
      default: {}
    },
    isArchived: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    isMuted: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    isPinned: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Compound index on participants to speed up user conversations lookup
conversationSchema.index({ participants: 1 });
conversationSchema.index({ participants: 1, lastMessageTime: -1 });
conversationSchema.index({ lastMessageTime: -1 });
conversationSchema.index({ 'unreadCounts.$*': 1 });
conversationSchema.index({ isPinned: 1 });
conversationSchema.index({ isArchived: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);


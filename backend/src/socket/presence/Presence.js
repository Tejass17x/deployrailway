const mongoose = require('mongoose');

const presenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    socketId: {
      type: String,
      index: true
    },
    status: {
      type: String,
      enum: ['online', 'offline', 'idle', 'busy', 'away', 'invisible'],
      default: 'offline',
      index: true
    },
    isOnline: {
      type: Boolean,
      default: false,
      index: true
    },
    lastSeen: {
      type: Date,
      default: Date.now
    },
    lastActive: {
      type: Date,
      default: Date.now
    },
    device: {
      type: String,
      default: 'desktop'
    },
    browser: {
      type: String,
      default: 'unknown'
    },
    platform: {
      type: String,
      default: 'unknown'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Presence', presenceSchema);

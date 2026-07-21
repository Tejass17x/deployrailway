const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CallHistorySchema = new Schema(
  {
    callId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    caller: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['missed', 'rejected', 'completed', 'cancelled', 'busy', 'failed'],
      required: true,
      index: true
    },
    startedAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    endedAt: {
      type: Date
    },
    duration: {
      type: Number, // duration in seconds
      default: 0
    },
    type: {
      type: String,
      enum: ['voice', 'video'],
      required: true,
      index: true
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      }
    ],
    iceState: {
      type: String
    },
    connectionState: {
      type: String
    },
    // Soft delete fields
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    },
    deletedAt: {
      type: Date
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

CallHistorySchema.index({ participants: 1 });
CallHistorySchema.index({ createdAt: -1 });

module.exports = mongoose.model('CallHistory', CallHistorySchema);

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CallSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      index: true
    },
    initiatorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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
    type: {
      type: String,
      enum: ['voice', 'video'],
      required: true
    },
    status: {
      type: String,
      enum: ['initiated', 'ringing', 'answered', 'rejected', 'missed', 'completed', 'failed'],
      default: 'initiated'
    },
    startTime: {
      type: Date,
      default: Date.now
    },
    endTime: {
      type: Date
    },
    duration: {
      type: Number, // duration in seconds
      default: 0
    }
  },
  {
    timestamps: true
  }
);

CallSchema.index({ participants: 1 });
CallSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Call', CallSchema);

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { FEEDBACK_CATEGORIES } = require('../help.constants');

const FeedbackSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      trim: true,
      default: ''
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: ''
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    category: {
      type: String,
      enum: FEEDBACK_CATEGORIES,
      required: true
    },
    comment: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

// Index definition for querying user feedback
FeedbackSchema.index({ userId: 1, createdAt: -1 });

const Feedback = mongoose.model('Feedback', FeedbackSchema);

module.exports = Feedback;

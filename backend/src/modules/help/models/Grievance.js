const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { GRIEVANCE_CATEGORIES } = require('../help.constants');

const GrievanceSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    category: {
      type: String,
      enum: GRIEVANCE_CATEGORIES,
      required: true
    },
    paperUrl: {
      type: String,
      default: null,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    attachment: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ['Pending', 'In Review', 'Resolved'],
      default: 'Pending'
    }
  },
  {
    timestamps: true
  }
);

// Index definition for querying user grievances
GrievanceSchema.index({ userId: 1, createdAt: -1 });

const Grievance = mongoose.model('Grievance', GrievanceSchema);

module.exports = Grievance;

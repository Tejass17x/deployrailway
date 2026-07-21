const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { CONTACT_CATEGORIES } = require('../help.constants');

const ContactRequestSchema = new Schema(
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
      enum: CONTACT_CATEGORIES,
      required: true
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    message: {
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
      enum: ['Pending', 'Resolved'],
      default: 'Pending'
    }
  },
  {
    timestamps: true
  }
);

// Index definition for querying user tickets
ContactRequestSchema.index({ userId: 1, createdAt: -1 });

const ContactRequest = mongoose.model('ContactRequest', ContactRequestSchema);

module.exports = ContactRequest;

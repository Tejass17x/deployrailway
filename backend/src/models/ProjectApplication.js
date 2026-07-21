const mongoose = require('mongoose');
const { Schema } = mongoose;

const APPLICATION_STATUSES = [
  'applied',
  'under-review',
  'shortlisted',
  'interview',
  'accepted',
  'joined',
  'rejected',
  'withdrawn',
];

const ProjectApplicationSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    applicantId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    status: { type: String, enum: APPLICATION_STATUSES, default: 'applied', index: true },

    // Document uploads (R2 keys)
    resume: { url: String, key: String, filename: String },
    cv: { url: String, key: String, filename: String },
    sop: { url: String, key: String, filename: String, name: { type: String, default: 'Statement of Purpose' } },
    coverLetter: { url: String, key: String, filename: String },
    portfolio: { url: String, key: String, filename: String },

    // Additional links
    githubProfile: { type: String, trim: true },
    linkedinProfile: { type: String, trim: true },
    researchProposal: { url: String, key: String, filename: String },
    publications: [{ title: String, url: String, doi: String }],

    // Screening question answers
    screeningAnswers: [
      {
        questionId: { type: String },
        question: { type: String, trim: true },
        answer: { type: String, trim: true, maxlength: 2000 },
      },
    ],

    // Cover message
    message: { type: String, trim: true, maxlength: 3000 },

    // Role applied for
    desiredRole: { type: String, trim: true },

    // Availability
    availability: {
      hoursPerWeek: { type: Number },
      startDate: { type: Date },
    },

    // Review tracking
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    reviewNote: { type: String, trim: true, maxlength: 1000 },

    // Interview
    interviewScheduledAt: { type: Date },
    interviewLink: { type: String, trim: true },
    interviewNote: { type: String, trim: true },

    // Rejection
    rejectionReason: { type: String, trim: true, maxlength: 1000 },

    // Status history for audit
    statusHistory: [
      {
        status: { type: String, enum: APPLICATION_STATUSES },
        changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        changedAt: { type: Date, default: Date.now },
        note: { type: String, trim: true },
      },
    ],

    isDeleted: { type: Boolean, default: false, index: true },
    withdrawnAt: { type: Date },
    acceptedAt: { type: Date },
    joinedAt: { type: Date },
  },
  { timestamps: true }
);

ProjectApplicationSchema.index({ projectId: 1, applicantId: 1 }, { unique: true, sparse: true });
ProjectApplicationSchema.index({ projectId: 1, status: 1, createdAt: -1 });
ProjectApplicationSchema.index({ applicantId: 1, status: 1 });

module.exports = {
  ProjectApplication:
    mongoose.models.ProjectApplication ||
    mongoose.model('ProjectApplication', ProjectApplicationSchema),
  APPLICATION_STATUSES,
};

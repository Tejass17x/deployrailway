const mongoose = require('mongoose');
const { Schema } = mongoose;

const ProjectMeetingSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    organizedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000 },
    agenda: [{ type: String, trim: true }],

    scheduledAt: { type: Date, required: true, index: true },
    duration: { type: Number, default: 60 }, // minutes
    timezone: { type: String, default: 'UTC' },

    type: {
      type: String,
      enum: ['sync', 'review', 'planning', 'retrospective', 'demo', 'kickoff', 'other'],
      default: 'sync',
    },

    platform: {
      type: String,
      enum: ['zoom', 'google-meet', 'teams', 'discord', 'other'],
      default: 'other',
    },
    meetingLink: { type: String, trim: true },
    password: { type: String, trim: true },

    participants: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        rsvp: { type: String, enum: ['accepted', 'declined', 'tentative', 'pending'], default: 'pending' },
        respondedAt: { type: Date },
      },
    ],

    status: {
      type: String,
      enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
      default: 'scheduled',
      index: true,
    },

    notes: { type: String, trim: true, maxlength: 10000 },
    recordingUrl: { type: String, trim: true },

    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ProjectMeetingSchema.index({ projectId: 1, scheduledAt: 1, status: 1 });

module.exports =
  mongoose.models.ProjectMeeting || mongoose.model('ProjectMeeting', ProjectMeetingSchema);

const mongoose = require('mongoose');
const { Schema } = mongoose;

const TASK_STATUSES = ['backlog', 'todo', 'in-progress', 'in-review', 'done', 'cancelled'];
const TASK_PRIORITIES = ['critical', 'high', 'medium', 'low'];

const ProjectTaskSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    milestoneId: { type: Schema.Types.ObjectId, ref: 'ProjectMilestone' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    title: { type: String, required: true, trim: true, maxlength: 300 },
    description: { type: String, trim: true, maxlength: 5000 },

    status: { type: String, enum: TASK_STATUSES, default: 'backlog', index: true },
    priority: { type: String, enum: TASK_PRIORITIES, default: 'medium' },

    assignees: [{ type: Schema.Types.ObjectId, ref: 'User' }],

    labels: [{ type: String, trim: true }],
    tags: [{ type: String, trim: true }],

    dueDate: { type: Date, index: true },
    startDate: { type: Date },
    completedAt: { type: Date },

    estimatedHours: { type: Number, min: 0 },
    loggedHours: { type: Number, default: 0, min: 0 },

    progress: { type: Number, min: 0, max: 100, default: 0 },

    // Checklist items
    checklist: [
      {
        text: { type: String, trim: true, maxlength: 300 },
        completed: { type: Boolean, default: false },
        completedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        completedAt: { type: Date },
      },
    ],

    // Task dependencies
    dependencies: [{ type: Schema.Types.ObjectId, ref: 'ProjectTask' }],
    blockedBy: [{ type: Schema.Types.ObjectId, ref: 'ProjectTask' }],

    // File attachments
    attachments: [
      {
        name: { type: String, trim: true },
        url: { type: String },
        key: { type: String },
        mimeType: { type: String },
        size: { type: Number },
        uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    // Embedded comments (lightweight)
    comments: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        content: { type: String, trim: true, maxlength: 2000 },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date },
      },
    ],

    commentCount: { type: Number, default: 0 },

    // Kanban position (for ordering within status column)
    order: { type: Number, default: 0 },

    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

ProjectTaskSchema.index({ projectId: 1, status: 1, order: 1 });
ProjectTaskSchema.index({ projectId: 1, assignees: 1, status: 1 });
ProjectTaskSchema.index({ projectId: 1, dueDate: 1 });
ProjectTaskSchema.index({ milestoneId: 1, status: 1 });

module.exports = {
  ProjectTask: mongoose.models.ProjectTask || mongoose.model('ProjectTask', ProjectTaskSchema),
  TASK_STATUSES,
  TASK_PRIORITIES,
};

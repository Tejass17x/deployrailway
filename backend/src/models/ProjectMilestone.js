const mongoose = require('mongoose');
const { Schema } = mongoose;

const ProjectMilestoneSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000 },
    targetDate: { type: Date, index: true },
    completedAt: { type: Date },

    isCompleted: { type: Boolean, default: false, index: true },
    progress: { type: Number, min: 0, max: 100, default: 0 },

    // Deliverables linked to this milestone
    deliverables: [
      {
        title: { type: String, trim: true },
        description: { type: String, trim: true },
        completed: { type: Boolean, default: false },
        completedAt: { type: Date },
      },
    ],

    // Tasks linked to this milestone (tracked in ProjectTask.milestoneId)
    taskCount: { type: Number, default: 0 },
    completedTaskCount: { type: Number, default: 0 },

    order: { type: Number, default: 0 },
    color: { type: String, default: '#6366f1' },

    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ProjectMilestoneSchema.index({ projectId: 1, targetDate: 1 });
ProjectMilestoneSchema.index({ projectId: 1, isCompleted: 1 });

module.exports =
  mongoose.models.ProjectMilestone ||
  mongoose.model('ProjectMilestone', ProjectMilestoneSchema);

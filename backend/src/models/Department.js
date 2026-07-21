const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DepartmentSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    institutionId: { type: Schema.Types.ObjectId, ref: 'Institution' },
    code: { type: String, trim: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Compound index to ensure uniqueness of department within an institution
DepartmentSchema.index({ name: 1, institutionId: 1 }, { unique: true });

module.exports = mongoose.model('Department', DepartmentSchema);

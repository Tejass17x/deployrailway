const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const InstitutionSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, trim: true },
    country: { type: String, trim: true },
    website: { type: String, trim: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Institution', InstitutionSchema);

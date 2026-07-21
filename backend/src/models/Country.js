const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CountrySchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, unique: true, trim: true }, // e.g. "US", "IN"
    phoneCode: { type: String, trim: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Country', CountrySchema);

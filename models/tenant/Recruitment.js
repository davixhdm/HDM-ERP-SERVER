const mongoose = require('mongoose');

const recruitmentSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  title: { type: String, required: true },
  department: { type: String, required: true },
  type: { type: String, enum: ['full_time', 'part_time', 'contract', 'intern'], default: 'full_time' },
  location: String,
  salary: String,
  description: String,
  duties: String,
  qualifications: String,
  requirements: String,
  applicationMethod: { type: String, enum: ['email', 'online', 'hand_delivery', 'both', ''], default: '' },
  applicationLink: String,
  startDate: Date,
  endDate: Date,
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Recruitment', recruitmentSchema);
const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  date: { type: Date, required: true },
  checkIn: String,
  checkOut: String,
  status: { type: String, enum: ['present', 'absent', 'late', 'half_day'], default: 'present' },
  notes: String
}, { timestamps: true });

attendanceSchema.index({ tenantId: 1, employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
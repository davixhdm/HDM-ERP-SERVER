const mongoose = require('mongoose');

// ── Sub-schemas for each communication type ──

const memoSchema = new mongoose.Schema({
  to: { type: String, required: true },
  from: { type: String },
  cc: { type: String, default: '' },
  subject: { type: String, required: true },
  body: { type: String, default: '' },
  classification: { type: String, enum: ['action-required', 'for-review', 'for-information'], default: 'for-information' },
  isConfidential: { type: Boolean, default: false },
  signature: { type: String },
  attachments: [{ type: String }]
}, { _id: false });

const letterSchema = new mongoose.Schema({
  recipientName: { type: String, required: true },
  recipientTitle: { type: String, default: '' },
  recipientCompany: { type: String, default: '' },
  recipientAddress: { type: String, default: '' },
  salutation: { type: String, required: true },
  subject: { type: String, required: true },
  body: { type: String, default: '' },
  closing: { type: String, default: 'Sincerely,' },
  senderName: { type: String },
  senderTitle: { type: String },
  senderDepartment: { type: String },
  reference: { type: String, default: '' },
  enclosures: { type: String, default: '' },
  attachments: [{ type: String }],
  letterhead: { type: Boolean, default: true }
}, { _id: false });

const noticeSchema = new mongoose.Schema({
  issuedBy: { type: String },
  issuedTo: { type: String, required: true },
  subject: { type: String, required: true },
  noticeDate: { type: Date, default: Date.now },
  effectiveDate: { type: Date },
  reference: { type: String, default: '' },
  body: { type: String, default: '' },
  action: { type: String, default: '' },
  deadline: { type: Date },
  attachments: [{ type: String }],
  distribution: { type: String, enum: ['all-staff', 'department', 'specific'], default: 'all-staff' }
}, { _id: false });

const circularSchema = new mongoose.Schema({
  circulatedBy: { type: String },
  audience: { type: String, enum: ['all-departments', 'all-staff', 'management', 'specific'], default: 'all-departments' },
  subject: { type: String, required: true },
  body: { type: String, default: '' },
  highlights: { type: String, default: '' },
  actionItems: { type: String, default: '' },
  contactPerson: { type: String, default: '' },
  contactEmail: { type: String, default: '' },
  expiryDate: { type: Date },
  attachments: [{ type: String }]
}, { _id: false });

const reportSchema = new mongoose.Schema({
  reportType: { type: String, enum: ['monthly', 'quarterly', 'annual', 'project', 'incident', 'audit'], default: 'project' },
  preparedBy: { type: String },
  reviewedBy: { type: String, default: '' },
  approvedBy: { type: String, default: '' },
  period: { type: String, default: '' },
  subject: { type: String, required: true },
  executiveSummary: { type: String, default: '' },
  methodology: { type: String, default: '' },
  findings: { type: String, default: '' },
  analysis: { type: String, default: '' },
  recommendations: { type: String, default: '' },
  conclusion: { type: String, default: '' },
  appendices: { type: String, default: '' },
  attachments: [{ type: String }],
  distribution: { type: String, enum: ['internal', 'client', 'board', 'public'], default: 'internal' }
}, { _id: false });

const proposalSchema = new mongoose.Schema({
  proposalType: { type: String, enum: ['project', 'budget', 'partnership', 'service', 'product'], default: 'project' },
  submittedTo: { type: String, required: true },
  submittedBy: { type: String },
  subject: { type: String, required: true },
  background: { type: String, default: '' },
  objective: { type: String, default: '' },
  scope: { type: String, default: '' },
  methodology: { type: String, default: '' },
  timeline: { type: String, default: '' },
  costEstimate: { type: String, default: '' },
  benefits: { type: String, default: '' },
  risks: { type: String, default: '' },
  conclusion: { type: String, default: '' },
  validUntil: { type: Date },
  attachments: [{ type: String }]
}, { _id: false });

const requisitionItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, default: 'pcs' },
  estimatedCost: { type: Number, default: 0 },
  totalCost: { type: Number, default: 0 }
}, { _id: false });

const requisitionSchema = new mongoose.Schema({
  requisitionType: { type: String, enum: ['purchase', 'stock', 'asset', 'service', 'travel'], default: 'purchase' },
  requestedBy: { type: String },
  department: { type: String },
  subject: { type: String, required: true },
  items: [requisitionItemSchema],
  justification: { type: String, default: '' },
  urgency: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
  requiredBy: { type: Date },
  budgetCode: { type: String, default: '' },
  approvalRoute: [{ type: String }],
  attachments: [{ type: String }]
}, { _id: false });

const minutesActionItemSchema = new mongoose.Schema({
  task: { type: String, required: true },
  responsible: { type: String, required: true },
  deadline: { type: Date }
}, { _id: false });

const minutesSchema = new mongoose.Schema({
  meetingType: { type: String, enum: ['board', 'management', 'department', 'committee', 'project', 'agm'], default: 'department' },
  meetingTitle: { type: String, required: true },
  date: { type: Date, default: Date.now },
  startTime: { type: String, default: '' },
  endTime: { type: String, default: '' },
  venue: { type: String, default: '' },
  chairperson: { type: String, default: '' },
  secretary: { type: String },
  attendees: { type: String, default: '' },
  apologies: { type: String, default: '' },
  agenda: { type: String, default: '' },
  discussions: { type: String, default: '' },
  decisions: { type: String, default: '' },
  actionItems: [minutesActionItemSchema],
  nextMeetingDate: { type: Date },
  nextMeetingAgenda: { type: String, default: '' },
  attachments: [{ type: String }],
  distribution: { type: String, enum: ['attendees', 'all-staff', 'board'], default: 'attendees' }
}, { _id: false });

// ── Main Communication Schema ──

const communicationSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  type: {
    type: String,
    enum: ['memo', 'requisition', 'circular', 'letter', 'notice', 'report', 'proposal', 'minutes'],
    required: true
  },
  referenceNumber: { type: String, required: true },
  title: { type: String, required: true },
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ['draft', 'sent', 'printed'], default: 'draft' },
  // Type-specific content
  content: {
    memo: memoSchema,
    letter: letterSchema,
    notice: noticeSchema,
    circular: circularSchema,
    report: reportSchema,
    proposal: proposalSchema,
    requisition: requisitionSchema,
    minutes: minutesSchema
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

communicationSchema.index({ tenantId: 1, type: 1 });
communicationSchema.index({ tenantId: 1, referenceNumber: 1 });

module.exports = mongoose.model('Communication', communicationSchema);
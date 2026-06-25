const Communication = require('../../models/tenant/Communication');
const sendEmail = require('../../utils/sendEmail');
const logger = require('../../utils/logger');

const typeLabels = {
  memo: 'Memo', requisition: 'Requisition', circular: 'Circular',
  letter: 'Letter', notice: 'Notice', report: 'Report',
  proposal: 'Proposal', minutes: 'Minutes'
};

const generateRef = (type) => {
  const prefixes = { memo: 'MEMO', requisition: 'REQ', circular: 'CIRC', letter: 'LTR', notice: 'NOT', report: 'RPT', proposal: 'PROP', minutes: 'MIN' };
  const prefix = prefixes[type] || 'COM';
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
};

// Default empty content per type
const defaultContent = {
  memo: { to: '', from: '', cc: '', subject: '', body: '', classification: 'for-information', isConfidential: false, signature: '', attachments: [] },
  letter: { recipientName: '', recipientTitle: '', recipientCompany: '', recipientAddress: '', salutation: '', subject: '', body: '', closing: 'Sincerely,', senderName: '', senderTitle: '', senderDepartment: '', reference: '', enclosures: '', attachments: [], letterhead: true },
  notice: { issuedBy: '', issuedTo: '', subject: '', noticeDate: new Date(), effectiveDate: null, reference: '', body: '', action: '', deadline: null, attachments: [], distribution: 'all-staff' },
  circular: { circulatedBy: '', audience: 'all-departments', subject: '', body: '', highlights: '', actionItems: '', contactPerson: '', contactEmail: '', expiryDate: null, attachments: [] },
  report: { reportType: 'project', preparedBy: '', reviewedBy: '', approvedBy: '', period: '', subject: '', executiveSummary: '', methodology: '', findings: '', analysis: '', recommendations: '', conclusion: '', appendices: '', attachments: [], distribution: 'internal' },
  proposal: { proposalType: 'project', submittedTo: '', submittedBy: '', subject: '', background: '', objective: '', scope: '', methodology: '', timeline: '', costEstimate: '', benefits: '', risks: '', conclusion: '', validUntil: null, attachments: [] },
  requisition: { requisitionType: 'purchase', requestedBy: '', department: '', subject: '', items: [], justification: '', urgency: 'normal', requiredBy: null, budgetCode: '', approvalRoute: [], attachments: [] },
  minutes: { meetingType: 'department', meetingTitle: '', date: new Date(), startTime: '', endTime: '', venue: '', chairperson: '', secretary: '', attendees: '', apologies: '', agenda: '', discussions: '', decisions: '', actionItems: [], nextMeetingDate: null, nextMeetingAgenda: '', attachments: [], distribution: 'attendees' }
};

/**
 * @desc    Get all communications
 * @route   GET /api/tenant/communications
 * @access  Private (Tenant)
 */
const getCommunications = async (req, res) => {
  try {
    const { type, status, search, page = 1, limit = 20 } = req.query;
    const filter = { tenantId: req.tenantId };
    if (type && type !== 'all') filter.type = type;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { referenceNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [comms, total] = await Promise.all([
      Communication.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Communication.countDocuments(filter)
    ]);

    res.json({ success: true, data: comms, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    logger.error('Get communications error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Create communication
 * @route   POST /api/tenant/communications
 * @access  Private (Tenant)
 */
const createCommunication = async (req, res) => {
  try {
    const { type, title, date, content: incomingContent } = req.body;
    if (!type || !title) return res.status(400).json({ success: false, message: 'Type and title required' });
    if (!typeLabels[type]) return res.status(400).json({ success: false, message: 'Invalid communication type' });

    // Merge incoming content with defaults
    const template = JSON.parse(JSON.stringify(defaultContent[type]));
    if (incomingContent) Object.assign(template, incomingContent);

    const content = {};
    content[type] = template;

    const comm = await Communication.create({
      tenantId: req.tenantId,
      type,
      referenceNumber: generateRef(type),
      title,
      date: date || new Date(),
      content,
      status: 'draft',
      createdBy: req.user._id
    });

    res.status(201).json({ success: true, data: comm });
  } catch (err) {
    logger.error('Create communication error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Update communication
 * @route   PUT /api/tenant/communications/:id
 * @access  Private (Tenant)
 */
const updateCommunication = async (req, res) => {
  try {
    const comm = await Communication.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!comm) return res.status(404).json({ success: false, message: 'Not found' });

    const { type, title, date, content: incomingContent, status } = req.body;

    if (title) comm.title = title;
    if (date) comm.date = date;
    if (status) comm.status = status;

    // Update type-specific content
    if (incomingContent && comm.type) {
      const currentContent = comm.content[comm.type] || {};
      comm.content[comm.type] = { ...currentContent, ...incomingContent };
      comm.markModified('content');
    }

    await comm.save();
    res.json({ success: true, data: comm });
  } catch (err) {
    logger.error('Update communication error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Delete communication
 * @route   DELETE /api/tenant/communications/:id
 * @access  Private (Tenant)
 */
const deleteCommunication = async (req, res) => {
  try {
    await Communication.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    logger.error('Delete communication error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Send communication via email
 * @route   POST /api/tenant/communications/:id/send
 * @access  Private (Tenant)
 */
const sendCommunication = async (req, res) => {
  try {
    const comm = await Communication.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!comm) return res.status(404).json({ success: false, message: 'Not found' });

    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Recipient email required' });

    const typeName = typeLabels[comm.type] || 'Document';
    const typeContent = comm.content[comm.type] || {};

    // Build email body based on type
    let htmlBody = buildEmailHTML(typeName, comm, typeContent);

    await sendEmail({
      to: email,
      toName: email,
      subject: `${typeName}: ${comm.title} (${comm.referenceNumber})`,
      htmlContent: htmlBody,
    });

    comm.status = 'sent';
    await comm.save();

    res.json({ success: true, message: 'Email sent', data: comm });
  } catch (err) {
    logger.error('Send communication error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Build HTML email per type
function buildEmailHTML(typeName, comm, c) {
  const companyName = 'HDM ENTERPRISE';
  const companyAddress = 'Nakuru, Kenya';
  const companyContact = '0768784909 • info@hdmenterprise.com';

  let html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
      <!-- Company Header -->
      <div style="background:#10B981;padding:20px;text-align:center;">
        <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:bold;">${companyName}</h1>
        <p style="color:#d1fae5;margin:4px 0 0 0;font-size:11px;">${companyAddress}</p>
        <p style="color:#d1fae5;margin:2px 0 0 0;font-size:11px;">${companyContact}</p>
      </div>
      
      <!-- Document Title -->
      <div style="padding:20px 20px 0 20px;">
        <h2 style="color:#10B981;margin:0;font-size:18px;">${typeName}: ${comm.title}</h2>
        <p style="color:#6b7280;font-size:12px;margin:4px 0 0 0;">Ref: ${comm.referenceNumber} &nbsp;|&nbsp; Date: ${new Date(comm.date).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
      </div>
      
      <hr style="border:0;border-top:1px solid #e5e7eb;margin:15px 20px 0 20px;">
      
      <!-- Body Content -->
      <div style="padding:15px 20px 20px 20px;">`;

  // Add type-specific content
  html += buildTypeEmailContent(typeName, comm, c);

  html += `
      </div>
      
      <!-- Footer -->
      <div style="background:#f9fafb;padding:12px 20px;text-align:center;border-top:1px solid #e5e7eb;">
        <p style="color:#9ca3af;font-size:10px;margin:0;">Sent from HDM ERP Communication Module</p>
        <p style="color:#9ca3af;font-size:10px;margin:2px 0 0 0;">© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
      </div>
    </div>`;

  return html;
}

function buildTypeEmailContent(typeName, comm, c) {
  const rowStyle = 'padding:5px 0;font-size:13px;';
  const labelStyle = 'color:#374151;font-weight:bold;';
  const valueStyle = 'color:#4b5563;';
  const sectionStyle = 'margin:10px 0;padding:12px;background:#f9fafb;border-left:3px solid #10B981;border-radius:4px;font-size:13px;line-height:1.6;color:#374151;';
  const tableStyle = 'width:100%;border-collapse:collapse;margin:10px 0;font-size:12px;';
  const thStyle = 'background:#f3f4f6;padding:8px;text-align:left;border:1px solid #e5e7eb;font-weight:bold;color:#374151;';
  const tdStyle = 'padding:8px;border:1px solid #e5e7eb;color:#4b5563;';

  let html = '';

  switch (comm.type) {
    case 'memo':
      html += `<table style="width:100%;margin-bottom:10px;"><tr><td style="width:80px;${rowStyle}${labelStyle}">TO:</td><td style="${rowStyle}${valueStyle}">${c.to || '—'}</td></tr>
        <tr><td style="${rowStyle}${labelStyle}">FROM:</td><td style="${rowStyle}${valueStyle}">${c.from || '—'}</td></tr>
        ${c.cc ? `<tr><td style="${rowStyle}${labelStyle}">CC:</td><td style="${rowStyle}${valueStyle}">${c.cc}</td></tr>` : ''}
        <tr><td style="${rowStyle}${labelStyle}">SUBJECT:</td><td style="${rowStyle}${valueStyle}">${c.subject || '—'}</td></tr></table>
        <hr style="border:0;border-top:1px solid #e5e7eb;">`;
      if (c.body) html += `<div style="${sectionStyle}">${c.body.replace(/\n/g, '<br>')}</div>`;
      html += `<p style="font-size:12px;color:#6b7280;margin-top:8px;">${c.signature || ''}</p>
        <p style="font-size:11px;color:#6b7280;"><strong>Classification:</strong> ${classificationLabel(c.classification)}${c.isConfidential ? ' | <span style="color:red;font-weight:bold;">CONFIDENTIAL</span>' : ''}</p>`;
      break;

    case 'letter':
      html += `<p style="font-size:13px;color:#374151;margin:0;">${c.recipientName || ''}${c.recipientTitle ? ', ' + c.recipientTitle : ''}</p>
        <p style="font-size:13px;color:#374151;margin:2px 0;">${c.recipientCompany || ''}</p>
        <p style="font-size:13px;color:#374151;margin:2px 0;white-space:pre-line;">${c.recipientAddress || ''}</p>
        <p style="font-size:12px;color:#6b7280;margin:10px 0;">${c.reference ? 'Your Ref: ' + c.reference + '<br>' : ''}${new Date().toLocaleDateString()}</p>
        <p style="font-size:13px;margin:8px 0;">${c.salutation || ''}</p>
        <p style="font-size:13px;font-weight:bold;margin:8px 0;">RE: ${c.subject || ''}</p>`;
      if (c.body) html += `<div style="${sectionStyle}">${c.body.replace(/\n/g, '<br>')}</div>`;
      html += `<p style="font-size:13px;margin:15px 0 5px 0;">${c.closing || ''}</p>
        <p style="font-size:13px;margin:25px 0 0 0;">${c.senderName || ''}</p>
        <p style="font-size:12px;color:#6b7280;margin:0;">${c.senderTitle || ''}</p>
        <p style="font-size:12px;color:#6b7280;margin:0;">${c.senderDepartment || ''}</p>
        ${c.enclosures ? `<p style="font-size:12px;color:#6b7280;margin-top:8px;">${c.enclosures}</p>` : ''}`;
      break;

    case 'notice':
      html += `<table style="width:100%;margin-bottom:10px;"><tr><td style="width:100px;${rowStyle}${labelStyle}">ISSUED BY:</td><td style="${rowStyle}${valueStyle}">${c.issuedBy || '—'}</td></tr>
        <tr><td style="${rowStyle}${labelStyle}">ISSUED TO:</td><td style="${rowStyle}${valueStyle}">${c.issuedTo || '—'}</td></tr>
        <tr><td style="${rowStyle}${labelStyle}">SUBJECT:</td><td style="${rowStyle}${valueStyle}">${c.subject || '—'}</td></tr>
        <tr><td style="${rowStyle}${labelStyle}">DATE:</td><td style="${rowStyle}${valueStyle}">${c.noticeDate || ''}</td></tr>
        ${c.effectiveDate ? `<tr><td style="${rowStyle}${labelStyle}">EFFECTIVE:</td><td style="${rowStyle}${valueStyle}">${c.effectiveDate}</td></tr>` : ''}</table>
        <hr style="border:0;border-top:1px solid #e5e7eb;">`;
      if (c.body) html += `<div style="${sectionStyle}">${c.body.replace(/\n/g, '<br>')}</div>`;
      if (c.action) html += `<div style="margin:10px 0;padding:12px;background:#fef3c7;border-left:3px solid #f59e0b;border-radius:4px;font-size:13px;"><strong>⚠ ACTION REQUIRED:</strong><br>${c.action}${c.deadline ? '<br><strong>Deadline:</strong> ' + c.deadline : ''}</div>`;
      html += `<p style="font-size:11px;color:#6b7280;">Distribution: ${distributionLabel(c.distribution)}</p>`;
      break;

    case 'circular':
      html += `<table style="width:100%;margin-bottom:10px;"><tr><td style="width:120px;${rowStyle}${labelStyle}">CIRCULATED BY:</td><td style="${rowStyle}${valueStyle}">${c.circulatedBy || '—'}</td></tr>
        <tr><td style="${rowStyle}${labelStyle}">TO:</td><td style="${rowStyle}${valueStyle}">${audienceLabel(c.audience)}</td></tr>
        <tr><td style="${rowStyle}${labelStyle}">SUBJECT:</td><td style="${rowStyle}${valueStyle}">${c.subject || '—'}</td></tr>
        ${c.expiryDate ? `<tr><td style="${rowStyle}${labelStyle}">VALID UNTIL:</td><td style="${rowStyle}${valueStyle}">${c.expiryDate}</td></tr>` : ''}</table>
        <hr style="border:0;border-top:1px solid #e5e7eb;">`;
      if (c.body) html += `<div style="${sectionStyle}">${c.body.replace(/\n/g, '<br>')}</div>`;
      if (c.highlights) html += `<div style="margin:10px 0;padding:12px;background:#f0fdf4;border-left:3px solid #10B981;border-radius:4px;font-size:13px;"><strong>📌 HIGHLIGHTS:</strong><br>${c.highlights.replace(/\n/g, '<br>')}</div>`;
      if (c.actionItems) html += `<div style="font-size:13px;margin:8px 0;"><strong>ACTION ITEMS:</strong><br>${c.actionItems.replace(/\n/g, '<br>')}</div>`;
      if (c.contactPerson) html += `<p style="font-size:11px;color:#6b7280;">For queries: ${c.contactPerson} ${c.contactEmail ? '— ' + c.contactEmail : ''}</p>`;
      break;

    case 'report':
      html += `<p style="font-size:13px;color:#374151;"><strong>Type:</strong> ${reportTypeLabel(c.reportType)} &nbsp;|&nbsp; <strong>Period:</strong> ${c.period || '—'}</p>
        <table style="width:100%;margin-bottom:10px;"><tr><td style="width:110px;${rowStyle}${labelStyle}">PREPARED BY:</td><td style="${rowStyle}${valueStyle}">${c.preparedBy || '—'}</td></tr>
        ${c.reviewedBy ? `<tr><td style="${rowStyle}${labelStyle}">REVIEWED BY:</td><td style="${rowStyle}${valueStyle}">${c.reviewedBy}</td></tr>` : ''}
        ${c.approvedBy ? `<tr><td style="${rowStyle}${labelStyle}">APPROVED BY:</td><td style="${rowStyle}${valueStyle}">${c.approvedBy}</td></tr>` : ''}</table>
        <hr style="border:0;border-top:1px solid #e5e7eb;">`;
      if (c.executiveSummary) html += `<h3 style="font-size:13px;color:#10B981;margin:10px 0 4px 0;">Executive Summary</h3><div style="${sectionStyle}">${c.executiveSummary.replace(/\n/g, '<br>')}</div>`;
      if (c.findings) html += `<h3 style="font-size:13px;color:#10B981;margin:10px 0 4px 0;">Findings</h3><div style="${sectionStyle}">${c.findings.replace(/\n/g, '<br>')}</div>`;
      if (c.recommendations) html += `<h3 style="font-size:13px;color:#10B981;margin:10px 0 4px 0;">Recommendations</h3><div style="${sectionStyle}">${c.recommendations.replace(/\n/g, '<br>')}</div>`;
      if (c.conclusion) html += `<h3 style="font-size:13px;color:#10B981;margin:10px 0 4px 0;">Conclusion</h3><div style="${sectionStyle}">${c.conclusion.replace(/\n/g, '<br>')}</div>`;
      html += `<p style="font-size:11px;color:#6b7280;">Distribution: ${distributionLabel(c.distribution)}</p>`;
      break;

    case 'proposal':
      html += `<p style="font-size:13px;color:#374151;"><strong>Type:</strong> ${proposalTypeLabel(c.proposalType)}</p>
        <table style="width:100%;margin-bottom:10px;"><tr><td style="width:110px;${rowStyle}${labelStyle}">SUBMITTED TO:</td><td style="${rowStyle}${valueStyle}">${c.submittedTo || '—'}</td></tr>
        <tr><td style="${rowStyle}${labelStyle}">SUBMITTED BY:</td><td style="${rowStyle}${valueStyle}">${c.submittedBy || '—'}</td></tr>
        ${c.validUntil ? `<tr><td style="${rowStyle}${labelStyle}">VALID UNTIL:</td><td style="${rowStyle}${valueStyle}">${c.validUntil}</td></tr>` : ''}</table>
        <hr style="border:0;border-top:1px solid #e5e7eb;">`;
      if (c.background) html += `<h3 style="font-size:13px;color:#10B981;margin:10px 0 4px 0;">Background</h3><div style="${sectionStyle}">${c.background.replace(/\n/g, '<br>')}</div>`;
      if (c.objective) html += `<h3 style="font-size:13px;color:#10B981;margin:10px 0 4px 0;">Objective</h3><div style="${sectionStyle}">${c.objective.replace(/\n/g, '<br>')}</div>`;
      if (c.scope) html += `<h3 style="font-size:13px;color:#10B981;margin:10px 0 4px 0;">Scope</h3><div style="${sectionStyle}">${c.scope.replace(/\n/g, '<br>')}</div>`;
      if (c.costEstimate) html += `<h3 style="font-size:13px;color:#10B981;margin:10px 0 4px 0;">Cost Estimate</h3><div style="${sectionStyle}">${c.costEstimate.replace(/\n/g, '<br>')}</div>`;
      if (c.conclusion) html += `<h3 style="font-size:13px;color:#10B981;margin:10px 0 4px 0;">Conclusion</h3><div style="${sectionStyle}">${c.conclusion.replace(/\n/g, '<br>')}</div>`;
      break;

    case 'requisition':
      html += `<p style="font-size:13px;color:#374151;"><strong>Type:</strong> ${requisitionTypeLabel(c.requisitionType)} &nbsp;|&nbsp; <strong>Urgency:</strong> <span style="color:${c.urgency === 'urgent' ? 'red' : c.urgency === 'high' ? '#f59e0b' : '#374151'};">${(c.urgency || 'normal').toUpperCase()}</span></p>
        <table style="width:100%;margin-bottom:10px;"><tr><td style="width:110px;${rowStyle}${labelStyle}">REQUESTED BY:</td><td style="${rowStyle}${valueStyle}">${c.requestedBy || '—'}</td></tr>
        <tr><td style="${rowStyle}${labelStyle}">DEPARTMENT:</td><td style="${rowStyle}${valueStyle}">${c.department || '—'}</td></tr>
        ${c.requiredBy ? `<tr><td style="${rowStyle}${labelStyle}">REQUIRED BY:</td><td style="${rowStyle}${valueStyle}">${c.requiredBy}</td></tr>` : ''}
        ${c.budgetCode ? `<tr><td style="${rowStyle}${labelStyle}">BUDGET CODE:</td><td style="${rowStyle}${valueStyle}">${c.budgetCode}</td></tr>` : ''}</table>
        <hr style="border:0;border-top:1px solid #e5e7eb;">`;
      if (c.items && c.items.length > 0) {
        html += `<table style="${tableStyle}"><thead><tr><th style="${thStyle}">#</th><th style="${thStyle}">Item</th><th style="${thStyle}">Qty</th><th style="${thStyle}">Unit</th><th style="${thStyle}">Total</th></tr></thead><tbody>`;
        c.items.forEach((item, i) => {
          html += `<tr><td style="${tdStyle}">${i + 1}</td><td style="${tdStyle}">${item.description}</td><td style="${tdStyle}">${item.quantity}</td><td style="${tdStyle}">${item.unit}</td><td style="${tdStyle}">${item.totalCost || ''}</td></tr>`;
        });
        html += `</tbody></table>`;
      }
      if (c.justification) html += `<h3 style="font-size:13px;color:#10B981;margin:10px 0 4px 0;">Justification</h3><div style="${sectionStyle}">${c.justification.replace(/\n/g, '<br>')}</div>`;
      break;

    case 'minutes':
      html += `<p style="font-size:13px;color:#374151;"><strong>Type:</strong> ${meetingTypeLabel(c.meetingType)}</p>
        <table style="width:100%;margin-bottom:10px;"><tr><td style="width:90px;${rowStyle}${labelStyle}">MEETING:</td><td style="${rowStyle}${valueStyle}">${c.meetingTitle || '—'}</td></tr>
        <tr><td style="${rowStyle}${labelStyle}">DATE:</td><td style="${rowStyle}${valueStyle}">${c.date || ''}</td></tr>
        <tr><td style="${rowStyle}${labelStyle}">TIME:</td><td style="${rowStyle}${valueStyle}">${c.startTime || ''} ${c.endTime ? '— ' + c.endTime : ''}</td></tr>
        <tr><td style="${rowStyle}${labelStyle}">VENUE:</td><td style="${rowStyle}${valueStyle}">${c.venue || '—'}</td></tr>
        <tr><td style="${rowStyle}${labelStyle}">CHAIR:</td><td style="${rowStyle}${valueStyle}">${c.chairperson || '—'}</td></tr></table>
        <p style="font-size:13px;"><strong>Attendees:</strong><br>${(c.attendees || '').replace(/\n/g, '<br>')}</p>
        ${c.apologies ? `<p style="font-size:13px;"><strong>Apologies:</strong><br>${c.apologies.replace(/\n/g, '<br>')}</p>` : ''}
        <hr style="border:0;border-top:1px solid #e5e7eb;">`;
      if (c.discussions) html += `<h3 style="font-size:13px;color:#10B981;margin:10px 0 4px 0;">Discussions</h3><div style="${sectionStyle}">${c.discussions.replace(/\n/g, '<br>')}</div>`;
      if (c.decisions) html += `<h3 style="font-size:13px;color:#10B981;margin:10px 0 4px 0;">Decisions</h3><div style="${sectionStyle}">${c.decisions.replace(/\n/g, '<br>')}</div>`;
      if (c.actionItems && c.actionItems.length > 0) {
        html += `<h3 style="font-size:13px;color:#10B981;margin:10px 0 4px 0;">Action Items</h3><table style="${tableStyle}"><thead><tr><th style="${thStyle}">#</th><th style="${thStyle}">Task</th><th style="${thStyle}">Responsible</th><th style="${thStyle}">Deadline</th></tr></thead><tbody>`;
        c.actionItems.forEach((ai, i) => {
          html += `<tr><td style="${tdStyle}">${i + 1}</td><td style="${tdStyle}">${ai.task}</td><td style="${tdStyle}">${ai.responsible}</td><td style="${tdStyle}">${ai.deadline || ''}</td></tr>`;
        });
        html += `</tbody></table>`;
      }
      break;

    default:
      html += `<p style="font-size:13px;color:#4b5563;">Content not available for preview.</p>`;
  }

  return html;
}

// ── Label helpers ──
const classificationLabel = (v) => ({ 'action-required': 'Action Required', 'for-review': 'For Review', 'for-information': 'For Information' }[v] || v);
const distributionLabel = (v) => ({ 'all-staff': 'All Staff', 'department': 'Department', 'specific': 'Specific', 'internal': 'Internal', 'client': 'Client', 'board': 'Board', 'public': 'Public', 'attendees': 'Attendees Only' }[v] || v);
const audienceLabel = (v) => ({ 'all-departments': 'All Departments', 'all-staff': 'All Staff', 'management': 'Management', 'specific': 'Specific' }[v] || v);
const reportTypeLabel = (v) => ({ monthly: 'Monthly', quarterly: 'Quarterly', annual: 'Annual', project: 'Project', incident: 'Incident', audit: 'Audit' }[v] || v);
const proposalTypeLabel = (v) => ({ project: 'Project', budget: 'Budget', partnership: 'Partnership', service: 'Service', product: 'Product' }[v] || v);
const requisitionTypeLabel = (v) => ({ purchase: 'Purchase', stock: 'Stock', asset: 'Asset', service: 'Service', travel: 'Travel' }[v] || v);
const meetingTypeLabel = (v) => ({ board: 'Board', management: 'Management', department: 'Department', committee: 'Committee', project: 'Project', agm: 'AGM' }[v] || v);

module.exports = { getCommunications, createCommunication, updateCommunication, deleteCommunication, sendCommunication };
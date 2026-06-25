const Asset = require('../../models/tenant/Asset');
const Maintenance = require('../../models/tenant/Maintenance');
const logger = require('../../utils/logger');

// ==================== ASSETS ====================

const getAssets = async (req, res) => {
  try {
    const { category, status, search, page = 1, limit = 50 } = req.query;
    const filter = { tenantId: req.tenantId };
    if (category && category !== 'all') filter.category = category;
    if (status && status !== 'all') filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [assets, total] = await Promise.all([
      Asset.find(filter)
        .populate('assignedTo', 'firstName lastName')
        .sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Asset.countDocuments(filter)
    ]);

    res.json({ success: true, data: assets, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    logger.error('Get assets error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getAsset = async (req, res) => {
  try {
    const asset = await Asset.findOne({ _id: req.params.id, tenantId: req.tenantId })
      .populate('assignedTo', 'firstName lastName email');
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });
    res.json({ success: true, data: asset });
  } catch (err) {
    logger.error('Get asset error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const createAsset = async (req, res) => {
  try {
    const { name, code, category, purchaseDate, purchaseCost, depreciationMethod, depreciationRate, usefulLifeYears, salvageValue, location, assignedTo, supplier, warrantyExpiry, notes } = req.body;
    if (!name || !code || !category) return res.status(400).json({ success: false, message: 'Name, code, and category required' });

    const existing = await Asset.findOne({ tenantId: req.tenantId, code });
    if (existing) return res.status(400).json({ success: false, message: 'Asset code already exists' });

    const currentValue = purchaseCost || 0;

    const asset = await Asset.create({
      tenantId: req.tenantId,
      name, code, category,
      purchaseDate, purchaseCost: purchaseCost || 0, currentValue,
      depreciationMethod: depreciationMethod || 'straight_line',
      depreciationRate: depreciationRate || 20,
      usefulLifeYears: usefulLifeYears || 5,
      salvageValue: salvageValue || 0,
      location, assignedTo, supplier, warrantyExpiry, notes,
      qrCode: `AST-${code}-${Date.now().toString(36)}`,
      createdBy: req.user._id
    });

    const populated = await Asset.findById(asset._id).populate('assignedTo', 'firstName lastName');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    logger.error('Create asset error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const updateAsset = async (req, res) => {
  try {
    const asset = await Asset.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      req.body,
      { new: true }
    ).populate('assignedTo', 'firstName lastName');
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });
    res.json({ success: true, data: asset });
  } catch (err) {
    logger.error('Update asset error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const deleteAsset = async (req, res) => {
  try {
    const asset = await Asset.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });
    await Maintenance.deleteMany({ assetId: asset._id });
    res.json({ success: true, message: 'Asset and maintenance records deleted' });
  } catch (err) {
    logger.error('Delete asset error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const depreciateAsset = async (req, res) => {
  try {
    const asset = await Asset.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });
    if (asset.depreciationMethod === 'none') return res.status(400).json({ success: false, message: 'Asset has no depreciation method' });

    let depreciation = 0;
    if (asset.depreciationMethod === 'straight_line') {
      depreciation = (asset.purchaseCost - asset.salvageValue) / asset.usefulLifeYears;
    } else if (asset.depreciationMethod === 'reducing_balance') {
      depreciation = asset.currentValue * (asset.depreciationRate / 100);
    }

    const newValue = Math.max(asset.salvageValue, asset.currentValue - depreciation);
    asset.currentValue = Math.round(newValue * 100) / 100;
    await asset.save();

    res.json({
      success: true,
      data: {
        asset,
        depreciation: Math.round(depreciation * 100) / 100,
        newValue: asset.currentValue
      }
    });
  } catch (err) {
    logger.error('Depreciate asset error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ==================== MAINTENANCE ====================

const getMaintenances = async (req, res) => {
  try {
    const filter = { tenantId: req.tenantId, assetId: req.params.assetId };
    const records = await Maintenance.find(filter)
      .populate('createdBy', 'firstName lastName')
      .sort({ scheduledDate: -1 });
    res.json({ success: true, data: records });
  } catch (err) {
    logger.error('Get maintenances error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const createMaintenance = async (req, res) => {
  try {
    const { type, description, status, scheduledDate, completedDate, cost, vendor, notes } = req.body;
    if (!type || !description || !scheduledDate) return res.status(400).json({ success: false, message: 'Type, description, and scheduled date required' });

    const asset = await Asset.findOne({ _id: req.params.assetId, tenantId: req.tenantId });
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });

    const record = await Maintenance.create({
      tenantId: req.tenantId,
      assetId: req.params.assetId,
      type, description, status: status || 'scheduled',
      scheduledDate, completedDate,
      cost: cost || 0, vendor, notes,
      createdBy: req.user._id
    });

    // Update asset status if needed
    if (status === 'in_progress') {
      asset.status = 'maintenance';
      await asset.save();
    }

    const populated = await Maintenance.findById(record._id).populate('createdBy', 'firstName lastName');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    logger.error('Create maintenance error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const updateMaintenance = async (req, res) => {
  try {
    const record = await Maintenance.findOneAndUpdate(
      { _id: req.params.maintId, tenantId: req.tenantId },
      req.body,
      { new: true }
    ).populate('createdBy', 'firstName lastName');
    if (!record) return res.status(404).json({ success: false, message: 'Maintenance record not found' });

    // Update asset status
    const asset = await Asset.findById(record.assetId);
    if (asset) {
      if (record.status === 'completed') {
        asset.status = 'active';
        await asset.save();
      }
    }

    res.json({ success: true, data: record });
  } catch (err) {
    logger.error('Update maintenance error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const deleteMaintenance = async (req, res) => {
  try {
    const record = await Maintenance.findOneAndDelete({ _id: req.params.maintId, tenantId: req.tenantId });
    if (!record) return res.status(404).json({ success: false, message: 'Maintenance record not found' });
    res.json({ success: true, message: 'Maintenance record deleted' });
  } catch (err) {
    logger.error('Delete maintenance error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ==================== STATS ====================

const getAssetStats = async (req, res) => {
  try {
    const assets = await Asset.find({ tenantId: req.tenantId });
    const maintenance = await Maintenance.find({ tenantId: req.tenantId, status: { $in: ['scheduled', 'in_progress'] } });

    const categoryCounts = {};
    const statusCounts = { active: 0, maintenance: 0, retired: 0, disposed: 0 };
    let totalValue = 0;

    assets.forEach(a => {
      categoryCounts[a.category] = (categoryCounts[a.category] || 0) + 1;
      statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
      totalValue += a.currentValue || 0;
    });

    res.json({
      success: true,
      data: {
        total: assets.length,
        categoryCounts,
        statusCounts,
        totalValue,
        totalPurchaseCost: assets.reduce((s, a) => s + (a.purchaseCost || 0), 0),
        pendingMaintenance: maintenance.length
      }
    });
  } catch (err) {
    logger.error('Get asset stats error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  getAssets, getAsset, createAsset, updateAsset, deleteAsset, depreciateAsset,
  getMaintenances, createMaintenance, updateMaintenance, deleteMaintenance,
  getAssetStats
};
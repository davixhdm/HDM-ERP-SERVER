const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  name: { type: String, required: true, trim: true },
  sku: { type: String, unique: true, sparse: true, trim: true },
  category: String,
  type: { type: String, enum: ['product', 'service', 'raw_material', 'finished_good'], default: 'product' },
  unit: { type: String, default: 'piece' },
  costPrice: { type: Number, default: 0 },
  sellingPrice: { type: Number, default: 0 },
  reorderLevel: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  description: String,
  barcode: String,
  isActive: { type: Boolean, default: true },
  image: String
}, { timestamps: true });

productSchema.index({ tenantId: 1, name: 1 });
productSchema.index({ tenantId: 1, category: 1 });

productSchema.pre('save', async function(next) {
  if (!this.sku || this.sku.trim() === '') {
    const count = await mongoose.model('Product').countDocuments({ tenantId: this.tenantId });
    this.sku = `SKU-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
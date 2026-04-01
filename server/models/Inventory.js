const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  batchNumber: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
  },
  manufactureDate: {
    type: Date,
    required: true,
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  storageLocationCode: {
    type: String,
    required: true,
  },
});

const inventorySchema = new mongoose.Schema({
  sku: {
    type: String,
    required: true,
    unique: true,
  },
  productName: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  reorderLevel: {
    type: Number,
    required: true,
    min: 0,
  },
  batches: [batchSchema],
}, {
  timestamps: true,
});

// Virtual for total quantity
inventorySchema.virtual('totalQuantity').get(function() {
  return this.batches.reduce((total, batch) => total + batch.quantity, 0);
});

// Ensure virtual fields are serialized
inventorySchema.set('toJSON', { virtuals: true });
inventorySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Inventory', inventorySchema);
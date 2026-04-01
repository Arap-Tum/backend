const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema({
  sku: {
    type: String,
    required: true,
  },
  movementType: {
    type: String,
    enum: ['RECEIVE', 'DISPATCH', 'TRANSFER'],
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  batchNumber: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('StockMovement', stockMovementSchema);
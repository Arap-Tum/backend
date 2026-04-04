const mongoose = require('mongoose');

const receivingSchema = new mongoose.Schema({
  receivingNumber: {
    type: String,
    required: true,
    unique: true,
  },
  supplier: {
    name: String,
    contact: String,
    email: String,
  },
  purchaseOrder: {
    type: String,
  },
  items: [
    {
      sku: String,
      productName: String,
      expectedQuantity: Number,
      receivedQuantity: Number,
      batchNumber: String,
      manufactureDate: Date,
      expiryDate: Date,
      storageLocationCode: String,
      status: {
        type: String,
        enum: ['pending', 'received', 'inspected', 'accepted', 'rejected'],
        default: 'pending',
      },
      notes: String,
    },
  ],
  receivingStatus: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'rejected'],
    default: 'pending',
  },
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  inspectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  receivedDate: {
    type: Date,
    default: Date.now,
  },
  inspectionDate: Date,
  approvalDate: Date,
  notes: String,
}, {
  timestamps: true,
});

module.exports = mongoose.model('Receiving', receivingSchema);

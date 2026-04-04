const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
  },
  customer: {
    name: String,
    email: String,
    phone: String,
    address: String,
  },
  items: [
    {
      sku: String,
      productName: String,
      quantity: Number,
      unitPrice: Number,
      status: {
        type: String,
        enum: ['pending', 'picked', 'packed', 'shipped', 'delivered'],
        default: 'pending',
      },
    },
  ],
  orderStatus: {
    type: String,
    enum: ['pending', 'picking', 'picked', 'packing', 'packed', 'ready_to_ship', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  pickingAssignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  packingAssignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  dispatchedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  notes: String,
  trackingNumber: String,
  picklistCreatedAt: Date,
  pickedAt: Date,
  packedAt: Date,
  shippedAt: Date,
  deliveredAt: Date,
}, {
  timestamps: true,
});

module.exports = mongoose.model('Order', orderSchema);

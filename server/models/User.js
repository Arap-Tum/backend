const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: [
      'Warehouse Manager',     // Full access, approves orders & shipments
      'Inventory Manager',     // Manages stock levels, conducts audits
      'Picker',                // Picks items from shelves
      'Packer',                // Packs picked items
      'Dispatch Officer',      // Handles delivery & shipment
      'Receiving Officer',     // Receives incoming goods
      'Sales Staff'            // Handles customer orders
    ],
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  department: {
    type: String,
    enum: ['Warehouse', 'Sales', 'Logistics'],
    required: true,
  },
  lastLogin: Date,
}, {
  timestamps: true,
});

module.exports = mongoose.model('User', userSchema);
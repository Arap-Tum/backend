const Order = require('../models/Order');
const User = require('../models/User');

// Get all orders
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('createdBy', 'name role')
      .populate('pickingAssignedTo', 'name')
      .populate('packingAssignedTo', 'name')
      .populate('dispatchedBy', 'name');
    res.json(orders);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get order by ID
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('createdBy', 'name role')
      .populate('pickingAssignedTo', 'name')
      .populate('packingAssignedTo', 'name')
      .populate('dispatchedBy', 'name');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new order (Sales Staff)
const createOrder = async (req, res) => {
  try {
    const { orderNumber, customer, items, totalAmount, notes } = req.body;

    // Validate required fields
    if (!orderNumber || !customer || !items || !totalAmount) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if order number is unique
    const existingOrder = await Order.findOne({ orderNumber });
    if (existingOrder) {
      return res.status(400).json({ message: 'Order number already exists' });
    }

    const order = new Order({
      orderNumber,
      customer,
      items,
      orderStatus: 'pending',
      totalAmount,
      createdBy: req.user.id,
      notes,
    });

    await order.save();

    // Populate references
    await order.populate('createdBy', 'name role');

    res.status(201).json({
      message: 'Order created successfully',
      order,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update order (Sales Staff, Admin)
const updateOrder = async (req, res) => {
  try {
    const { customer, items, totalAmount, notes } = req.body;

    let order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only allow update if order is still pending or picking
    if (!['pending', 'picking'].includes(order.orderStatus)) {
      return res.status(400).json({ message: 'Cannot update order in current status' });
    }

    if (customer) order.customer = customer;
    if (items) order.items = items;
    if (totalAmount) order.totalAmount = totalAmount;
    if (notes) order.notes = notes;

    await order.save();
    await order.populate('createdBy', 'name role');

    res.json({
      message: 'Order updated successfully',
      order,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Cancel order
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only allow cancellation if not already shipped
    if (['shipped', 'delivered'].includes(order.orderStatus)) {
      return res.status(400).json({ message: 'Cannot cancel order in current status' });
    }

    order.orderStatus = 'cancelled';
    await order.save();

    res.json({
      message: 'Order cancelled successfully',
      order,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get orders for sales staff dashboard
const getSalesStaffOrders = async (req, res) => {
  try {
    const orders = await Order.find({ createdBy: req.user.id })
      .populate('createdBy', 'name role')
      .populate('pickingAssignedTo', 'name')
      .populate('packingAssignedTo', 'name')
      .populate('dispatchedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  cancelOrder,
  getSalesStaffOrders,
};

const Order = require('../models/Order');
const StockMovement = require('../models/StockMovement');

// Get picklist (all pending orders for picking)
const getPicklist = async (req, res) => {
  try {
    const orders = await Order.find({ orderStatus: 'pending' })
      .populate('createdBy', 'name')
      .sort({ createdAt: 1 });

    const picklist = orders.map((order) => ({
      orderId: order._id,
      orderNumber: order.orderNumber,
      items: order.items,
      customer: order.customer,
      createdAt: order.createdAt,
    }));

    res.json(picklist);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get assigned picks for a picker
const getAssignedPicks = async (req, res) => {
  try {
    const orders = await Order.find({ pickingAssignedTo: req.user.id })
      .populate('createdBy', 'name')
      .sort({ createdAt: 1 });

    res.json(orders);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Assign order to picker
const assignOrderToPicker = async (req, res) => {
  try {
    const { orderId, pickerId } = req.body;

    if (!orderId || !pickerId) {
      return res.status(400).json({ message: 'Order ID and Picker ID required' });
    }

    let order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.pickingAssignedTo = pickerId;
    order.orderStatus = 'picking';
    await order.save();
    await order.populate('pickingAssignedTo', 'name');

    res.json({
      message: 'Order assigned to picker successfully',
      order,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark items as picked
const markItemsAsPicked = async (req, res) => {
  try {
    const { orderId, pickedItems } = req.body;

    if (!orderId || !pickedItems) {
      return res.status(400).json({ message: 'Order ID and picked items required' });
    }

    let order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update item statuses
    order.items.forEach((item) => {
      const pickedItem = pickedItems.find((pi) => pi.sku === item.sku);
      if (pickedItem) {
        item.status = 'picked';
      }
    });

    // Check if all items are picked
    const allPicked = order.items.every((item) => item.status === 'picked');
    if (allPicked) {
      order.orderStatus = 'picked';
      order.pickedAt = new Date();
    }

    await order.save();

    // Record stock movement
    for (const pickedItem of pickedItems) {
      const movement = new StockMovement({
        sku: pickedItem.sku,
        movementType: 'DISPATCH',
        quantity: pickedItem.quantity,
        user: req.user.id,
        batchNumber: pickedItem.batchNumber || '',
      });
      await movement.save();
    }

    res.json({
      message: 'Items marked as picked successfully',
      order,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update picking status
const updatePickingStatus = async (req, res) => {
  try {
    const { orderId, skus, pickingStatus } = req.body;

    if (!orderId || !skus || !pickingStatus) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    let order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update specific item statuses
    order.items.forEach((item) => {
      if (skus.includes(item.sku)) {
        item.status = pickingStatus;
      }
    });

    await order.save();

    res.json({
      message: 'Picking status updated',
      order,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getPicklist,
  getAssignedPicks,
  assignOrderToPicker,
  markItemsAsPicked,
  updatePickingStatus,
};

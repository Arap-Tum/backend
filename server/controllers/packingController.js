const Order = require('../models/Order');

// Get orders ready for packing
const getOrdersReadyForPacking = async (req, res) => {
  try {
    const orders = await Order.find({ orderStatus: 'picked' })
      .populate('createdBy', 'name')
      .populate('pickingAssignedTo', 'name')
      .sort({ pickedAt: 1 });

    const packingList = orders.map((order) => ({
      orderId: order._id,
      orderNumber: order.orderNumber,
      items: order.items,
      customer: order.customer,
      pickedAt: order.pickedAt,
    }));

    res.json(packingList);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get assigned packing orders for a packer
const getAssignedPackingOrders = async (req, res) => {
  try {
    const orders = await Order.find({ packingAssignedTo: req.user.id })
      .populate('createdBy', 'name')
      .populate('pickingAssignedTo', 'name')
      .sort({ createdAt: 1 });

    res.json(orders);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Assign order to packer
const assignOrderToPacker = async (req, res) => {
  try {
    const { orderId, packerId } = req.body;

    if (!orderId || !packerId) {
      return res.status(400).json({ message: 'Order ID and Packer ID required' });
    }

    let order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.orderStatus !== 'picked') {
      return res.status(400).json({ message: 'Order must be in picked status to assign to packer' });
    }

    order.packingAssignedTo = packerId;
    order.orderStatus = 'packing';
    await order.save();
    await order.populate('packingAssignedTo', 'name');

    res.json({
      message: 'Order assigned to packer successfully',
      order,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Confirm packing for items
const confirmPackedItems = async (req, res) => {
  try {
    const { orderId, packedItems } = req.body;

    if (!orderId || !packedItems) {
      return res.status(400).json({ message: 'Order ID and packed items required' });
    }

    let order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update item statuses
    order.items.forEach((item) => {
      const packedItem = packedItems.find((pi) => pi.sku === item.sku);
      if (packedItem) {
        item.status = 'packed';
      }
    });

    // Check if all items are packed
    const allPacked = order.items.every((item) => item.status === 'packed');
    if (allPacked) {
      order.orderStatus = 'packed';
      order.packedAt = new Date();
    }

    await order.save();

    res.json({
      message: 'Items confirmed as packed successfully',
      order,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update packing status for specific items
const updatePackingStatus = async (req, res) => {
  try {
    const { orderId, skus, packingStatus } = req.body;

    if (!orderId || !skus || !packingStatus) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    let order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update specific item statuses
    order.items.forEach((item) => {
      if (skus.includes(item.sku)) {
        item.status = packingStatus;
      }
    });

    await order.save();

    res.json({
      message: 'Packing status updated',
      order,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// View order details (what to pack)
const getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('pickingAssignedTo', 'name');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getOrdersReadyForPacking,
  getAssignedPackingOrders,
  assignOrderToPacker,
  confirmPackedItems,
  updatePackingStatus,
  getOrderDetails,
};

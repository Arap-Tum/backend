const Order = require('../models/Order');

// Get packed orders ready for shipment
const getPackedOrders = async (req, res) => {
  try {
    const orders = await Order.find({ orderStatus: 'packed' })
      .populate('createdBy', 'name')
      .populate('pickingAssignedTo', 'name')
      .populate('packingAssignedTo', 'name')
      .sort({ packedAt: 1 });

    const dispatchList = orders.map((order) => ({
      orderId: order._id,
      orderNumber: order.orderNumber,
      customer: order.customer,
      items: order.items,
      totalAmount: order.totalAmount,
      packedAt: order.packedAt,
    }));

    res.json(dispatchList);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get dispatched orders by current officer
const getDispatchedOrders = async (req, res) => {
  try {
    const orders = await Order.find({ dispatchedBy: req.user.id })
      .populate('createdBy', 'name')
      .populate('pickingAssignedTo', 'name')
      .populate('packingAssignedTo', 'name')
      .sort({ shippedAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Confirm shipment of orders
const confirmShipment = async (req, res) => {
  try {
    const { orderId, trackingNumber } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    let order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.orderStatus !== 'packed') {
      return res.status(400).json({ message: 'Order must be in packed status to ship' });
    }

    // Update order status
    order.orderStatus = 'shipped';
    order.shippedAt = new Date();
    order.dispatchedBy = req.user.id;
    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }

    await order.save();
    await order.populate('dispatchedBy', 'name');

    res.json({
      message: 'Order shipped successfully',
      order,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Approve and dispatch multiple orders
const approveAndDispatchOrders = async (req, res) => {
  try {
    const { orderIds, trackingNumbers } = req.body;

    if (!orderIds || !Array.isArray(orderIds)) {
      return res.status(400).json({ message: 'Order IDs array is required' });
    }

    const shippedOrders = [];

    for (let i = 0; i < orderIds.length; i++) {
      const orderId = orderIds[i];
      const trackingNumber = trackingNumbers && trackingNumbers[i];

      let order = await Order.findById(orderId);
      if (!order) {
        continue;
      }

      if (order.orderStatus !== 'packed') {
        continue;
      }

      order.orderStatus = 'shipped';
      order.shippedAt = new Date();
      order.dispatchedBy = req.user.id;
      if (trackingNumber) {
        order.trackingNumber = trackingNumber;
      }

      await order.save();
      shippedOrders.push(order);
    }

    res.json({
      message: `${shippedOrders.length} orders shipped successfully`,
      ordersShipped: shippedOrders.length,
      orders: shippedOrders,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get order dispatch details
const getOrderDispatchDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('createdBy', 'name')
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

// Update delivery status (mark as delivered)
const markAsDelivered = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    let order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.orderStatus !== 'shipped') {
      return res.status(400).json({ message: 'Order must be in shipped status' });
    }

    order.orderStatus = 'delivered';
    order.deliveredAt = new Date();

    await order.save();

    res.json({
      message: 'Order marked as delivered',
      order,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getPackedOrders,
  getDispatchedOrders,
  confirmShipment,
  approveAndDispatchOrders,
  getOrderDispatchDetails,
  markAsDelivered,
};

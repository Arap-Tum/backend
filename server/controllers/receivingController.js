const Receiving = require('../models/Receiving');
const Inventory = require('../models/Inventory');
const StockMovement = require('../models/StockMovement');

// Create receiving document
const createReceiving = async (req, res) => {
  try {
    const { receivingNumber, supplier, purchaseOrder, items } = req.body;

    if (!receivingNumber || !supplier || !items) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if receiving number is unique
    const existing = await Receiving.findOne({ receivingNumber });
    if (existing) {
      return res.status(400).json({ message: 'Receiving number already exists' });
    }

    const receiving = new Receiving({
      receivingNumber,
      supplier,
      purchaseOrder,
      items,
      receivedBy: req.user.id,
      receivingStatus: 'pending',
    });

    await receiving.save();
    await receiving.populate('receivedBy', 'name');

    res.status(201).json({
      message: 'Receiving document created',
      receiving,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all receiving documents
const getAllReceiving = async (req, res) => {
  try {
    const receivings = await Receiving.find()
      .populate('receivedBy', 'name')
      .populate('inspectedBy', 'name')
      .populate('approvedBy', 'name')
      .sort({ receivedDate: -1 });

    res.json(receivings);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get receiving document by ID
const getReceivingById = async (req, res) => {
  try {
    const receiving = await Receiving.findById(req.params.id)
      .populate('receivedBy', 'name')
      .populate('inspectedBy', 'name')
      .populate('approvedBy', 'name');

    if (!receiving) {
      return res.status(404).json({ message: 'Receiving document not found' });
    }

    res.json(receiving);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update received goods quantities
const updateReceivedQuantities = async (req, res) => {
  try {
    const  items  = req.body;

     const receivingId = req.params.id;

    if (!receivingId || !items) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    let receiving = await Receiving.findById(receivingId);
    if (!receiving) {
      return res.status(404).json({ message: 'Receiving document not found' });
    }

    // Update items with received quantities
    receiving.items.forEach((item) => {
      const updatedItem = items.find((i) => i.sku === item.sku);
      if (updatedItem) {
        item.receivedQuantity = updatedItem.receivedQuantity;
        item.status = 'received';
        item.notes = updatedItem.notes || item.notes;
      }
    });

    receiving.receivingStatus = 'in_progress';
    await receiving.save();

    res.json({
      message: 'Received quantities updated',
      receiving,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Inspect received goods
const inspectReceivedGoods = async (req, res) => {
  try {
    const inspectionNotes = req.body;

     const receivingId = req.params.id;
    if (!receivingId) {
      return res.status(400).json({ message: 'Receiving ID is required' });
    }

    let receiving = await Receiving.findById(receivingId);
    if (!receiving) {
      return res.status(404).json({ message: 'Receiving document not found' });
    }

    receiving.inspectedBy = req.user.id;
    receiving.inspectionDate = new Date();
    receiving.notes = inspectionNotes || '';
    receiving.items.forEach((item) => {
      if (item.receivedQuantity === item.expectedQuantity) {
        item.status = 'inspected';
      } else {
        item.status = 'rejected';
      }
    });

    await receiving.save();

    res.json({
      message: 'Goods inspected',
      receiving,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Accept receiving and update inventory

const acceptReceiving = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const receivingId = req.params.id;

    let receiving = await Receiving.findById(receivingId).session(session);

    if (!receiving) {
      throw new Error('Receiving document not found');
    }

    receiving.receivingStatus = 'completed';
    receiving.approvedBy = req.user.id;
    receiving.approvalDate = new Date();

    for (const item of receiving.items) {
      if (item.status === 'rejected') continue;

      let inventory = await Inventory.findOne({ sku: item.sku }).session(session);

      if (!inventory) {
        inventory = new Inventory({
          sku: item.sku,
          productName: item.productName || '',
          category: '',
          reorderLevel: 0,
          batches: [],
        });
      }

      // 🔥 IMPORTANT FIX HERE (NO DUPLICATE BATCHES)
      const existingBatch = inventory.batches.find(
        b => b.batchNumber === item.batchNumber
      );

      if (existingBatch) {
        existingBatch.quantity += item.receivedQuantity;
      } else {
        inventory.batches.push({
          batchNumber: item.batchNumber,
          quantity: item.receivedQuantity,
          manufactureDate: item.manufactureDate,
          expiryDate: item.expiryDate,
          storageLocationCode: item.storageLocationCode,
        });
      }

      await inventory.save({ session });

      await StockMovement.create([{
        sku: item.sku,
        movementType: 'RECEIVE',
        quantity: item.receivedQuantity,
        user: req.user.id,
        batchNumber: item.batchNumber,
      }], { session });

      item.status = 'accepted';
    }

    await receiving.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({
      message: 'Receiving accepted and inventory updated (atomic)',
      receiving,
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    console.error(err.message);
    res.status(500).json({ message: err.message });
  }
};

// Reject receiving
const rejectReceiving = async (req, res) => {
  try {
    const rejectionReason  = req.body;

    const receivingId = req.params.id

    if (!receivingId) {
      return res.status(400).json({ message: 'Receiving ID is required' });
    }

    let receiving = await Receiving.findById(receivingId);
    if (!receiving) {
      return res.status(404).json({ message: 'Receiving document not found' });
    }

    receiving.receivingStatus = 'rejected';
    receiving.notes = rejectionReason || 'Rejected by receiving officer';
    receiving.items.forEach((item) => {
      item.status = 'rejected';
    });

    await receiving.save();

    res.json({
      message: 'Receiving rejected',
      receiving,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createReceiving,
  getAllReceiving,
  getReceivingById,
  updateReceivedQuantities,
  inspectReceivedGoods,
  acceptReceiving,
  rejectReceiving,
};

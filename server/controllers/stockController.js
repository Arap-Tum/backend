const Inventory = require('../models/Inventory');
const StockMovement = require('../models/StockMovement');

const receiveStock = async (req, res) => {
  const { sku, batchNumber, quantity, manufactureDate, expiryDate, storageLocationCode } = req.body;
  const userId = req.user.id;

  try {
    let inventory = await Inventory.findOne({ sku });
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    // Check if batch exists
    let batch = inventory.batches.find(b => b.batchNumber === batchNumber);
    if (batch) {
      batch.quantity += quantity;
    } else {
      inventory.batches.push({
        batchNumber,
        quantity,
        manufactureDate,
        expiryDate,
        storageLocationCode,
      });
    }

    await inventory.save();

    // Log movement
    const movement = new StockMovement({
      sku,
      movementType: 'RECEIVE',
      quantity,
      user: userId,
      batchNumber,
    });
    await movement.save();

    res.json({ message: 'Stock received successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

const dispatchStock = async (req, res) => {
  const { sku, quantity } = req.body;
  const userId = req.user.id;

  try {
    const inventory = await Inventory.findOne({ sku });
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    // Sort batches by manufacture date (FIFO)
    inventory.batches.sort((a, b) => new Date(a.manufactureDate) - new Date(b.manufactureDate));

    let remainingQuantity = quantity;
    const dispatchedBatches = [];

    for (let batch of inventory.batches) {
      if (remainingQuantity <= 0) break;
      if (batch.quantity > 0) {
        const dispatchQty = Math.min(remainingQuantity, batch.quantity);
        batch.quantity -= dispatchQty;
        remainingQuantity -= dispatchQty;
        dispatchedBatches.push({ batchNumber: batch.batchNumber, quantity: dispatchQty });
      }
    }

    if (remainingQuantity > 0) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    await inventory.save();

    // Log movements
    for (let dispatch of dispatchedBatches) {
      const movement = new StockMovement({
        sku,
        movementType: 'DISPATCH',
        quantity: dispatch.quantity,
        user: userId,
        batchNumber: dispatch.batchNumber,
      });
      await movement.save();
    }

    res.json({ message: 'Stock dispatched successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

const transferStock = async (req, res) => {
  const { sku, sourceBatchNumber, destinationBatchNumber, quantity } = req.body;
  const userId = req.user.id;

  try {
    const inventory = await Inventory.findOne({ sku });
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    const sourceBatch = inventory.batches.find(batch => batch.batchNumber === sourceBatchNumber);
    if (!sourceBatch) {
      return res.status(404).json({ message: 'Source batch not found' });
    }

    if (sourceBatch.quantity < quantity) {
      return res.status(400).json({ message: 'Insufficient source batch quantity' });
    }

    let destinationBatch = inventory.batches.find(batch => batch.batchNumber === destinationBatchNumber);
    if (!destinationBatch) {
      destinationBatch = {
        batchNumber: destinationBatchNumber,
        quantity: 0,
        manufactureDate: sourceBatch.manufactureDate,
        expiryDate: sourceBatch.expiryDate,
        storageLocationCode: sourceBatch.storageLocationCode,
      };
      inventory.batches.push(destinationBatch);
    }

    sourceBatch.quantity -= quantity;
    destinationBatch.quantity += quantity;

    await inventory.save();

    const movement = new StockMovement({
      sku,
      movementType: 'TRANSFER',
      quantity,
      user: userId,
      batchNumber: sourceBatchNumber,
      sourceBatchNumber,
      destinationBatchNumber,
    });
    await movement.save();

    res.json({ message: 'Stock transferred successfully', sourceBatch, destinationBatch });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

const getStockHistory = async (req, res) => {
  try {
    const movements = await StockMovement.find().populate('user', 'name email');
    res.json(movements);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

module.exports = { receiveStock, dispatchStock, transferStock, getStockHistory };
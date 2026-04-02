const Inventory = require('../models/Inventory');
const StockMovement = require('../models/StockMovement');

const getInventory = async (req, res) => {
  try {
    const inventory = await Inventory.find();
    res.json(inventory);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

const getInventoryBySku = async (req, res) => {
  const { sku } = req.params;
  try {
    const inventory = await Inventory.findOne({ sku });
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    res.json(inventory);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

const createInventory = async (req, res) => {
  const { sku, productName, category, reorderLevel, batches } = req.body;

  try {
    let inventoryExist = await Inventory.findOne({ sku });
    if (inventoryExist) {
      return res.status(400).json({ message: 'SKU already exists' });
    }

    const inventory = new Inventory({
      sku,
      productName,
      category,
      reorderLevel,
      batches,
    });

    await inventory.save();
    res.json(inventory);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

const updateInventory = async (req, res) => {
  const { sku } = req.params;
  const updates = req.body;

  try {
    const inventory = await Inventory.findOneAndUpdate({ sku }, { $set: updates }, { new: true });
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    res.json(inventory);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

const deleteInventory = async (req, res) => {
  const { sku } = req.params;
  try {
    const inventory = await Inventory.findOneAndDelete({ sku });
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    res.json({ message: 'Inventory item deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

module.exports = { getInventory, getInventoryBySku, createInventory, updateInventory, deleteInventory };
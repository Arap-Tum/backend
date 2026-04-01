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

const createInventory = async (req, res) => {
  const { sku, productName, category, reorderLevel, batches } = req.body;

  try {
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
    const inventory = await Inventory.findOneAndUpdate({ sku }, updates, { new: true });
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    res.json(inventory);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

module.exports = { getInventory, createInventory, updateInventory };
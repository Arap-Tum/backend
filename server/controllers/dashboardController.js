const Inventory = require('../models/Inventory');
const StockMovement = require('../models/StockMovement');

const getDashboard = async (req, res) => {
  try {
    // Total stock value - assuming we need to calculate, but since no price, maybe just total quantity
    const inventory = await Inventory.find();
    const totalQuantity = inventory.reduce((total, item) => total + item.totalQuantity, 0);

    // Low stock items
    const lowStockItems = inventory.filter(item => item.totalQuantity <= item.reorderLevel);

    // Recent stock movements
    const recentMovements = await StockMovement.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'name');

    res.json({
      totalStockValue: totalQuantity, // Placeholder, since no price
      lowStockItems,
      recentMovements,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

module.exports = { getDashboard };
const StockMovement = require('../models/StockMovement');
const Inventory = require('../models/Inventory');
const User = require('../models/User');

// Get stock movement history
const getStockMovementHistory = async (req, res) => {
  try {
    const { sku, startDate, endDate, movementType, limit = 50, skip = 0 } = req.query;

    let query = {};

    if (sku) {
      query.sku = sku;
    }

    if (movementType) {
      query.movementType = movementType;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    const movements = await StockMovement.find(query)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await StockMovement.countDocuments(query);

    res.json({
      movements,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get stock movement by SKU
const getMovementBySku = async (req, res) => {
  try {
    const { sku } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    const movements = await StockMovement.find({ sku })
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await StockMovement.countDocuments({ sku });

    res.json({
      movements,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Conduct stock audit - compare physical count with system
const conductStockAudit = async (req, res) => {
  try {
    const { skus } = req.body;

    if (!skus || !Array.isArray(skus)) {
      return res.status(400).json({ message: 'SKUs array is required' });
    }

    const auditResults = [];

    for (const sku of skus) {
      const inventory = await Inventory.findOne({ sku });

      if (!inventory) {
        auditResults.push({
          sku,
          status: 'not_found',
          systemQuantity: 0,
          message: 'SKU not found in inventory',
        });
        continue;
      }

      // Calculate total quantity from batches
      const systemQuantity = inventory.batches.reduce((sum, batch) => sum + batch.quantity, 0);

      auditResults.push({
        sku,
        productName: inventory.productName,
        systemQuantity,
        batches: inventory.batches.map((batch) => ({
          batchNumber: batch.batchNumber,
          quantity: batch.quantity,
          expiryDate: batch.expiryDate,
          storageLocationCode: batch.storageLocationCode,
        })),
        status: 'awaiting_physical_count',
      });
    }

    res.json({
      message: 'Stock audit started',
      auditDate: new Date(),
      conductedBy: req.user.id,
      results: auditResults,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Submit physical count audit results
const submitAuditResults = async (req, res) => {
  try {
    const { auditResults } = req.body;

    if (!auditResults || !Array.isArray(auditResults)) {
      return res.status(400).json({ message: 'Audit results array is required' });
    }

    const discrepancies = [];

    for (const result of auditResults) {
      const inventory = await Inventory.findOne({ sku: result.sku });

      if (!inventory) {
        discrepancies.push({
          sku: result.sku,
          status: 'not_found',
          physicalCount: result.physicalCount,
          message: 'SKU not found in system',
        });
        continue;
      }

      const systemQuantity = inventory.batches.reduce((sum, batch) => sum + batch.quantity, 0);
      const difference = systemQuantity - result.physicalCount;

      if (difference !== 0) {
        discrepancies.push({
          sku: result.sku,
          productName: inventory.productName,
          systemQuantity,
          physicalCount: result.physicalCount,
          difference,
          discrepancyPercentage: ((Math.abs(difference) / systemQuantity) * 100).toFixed(2),
          notes: result.notes,
        });
      }
    }

    res.json({
      message: 'Audit results submitted',
      totalItems: auditResults.length,
      discrepanciesFound: discrepancies.length,
      discrepancies,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get inventory accuracy report
const getInventoryAccuracyReport = async (req, res) => {
  try {
    const inventories = await Inventory.find();

    let accurateCount = 0;
    let discrepancies = 0;
    const report = [];

    for (const inventory of inventories) {
      const systemQuantity = inventory.batches.reduce((sum, batch) => sum + batch.quantity, 0);

      // For now, we assume accuracy based on recent movements
      const recentMovements = await StockMovement.find({
        sku: inventory.sku,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }).sort({ createdAt: -1 });

      const hasRecentActivity = recentMovements.length > 0;

      report.push({
        sku: inventory.sku,
        productName: inventory.productName,
        systemQuantity,
        batchCount: inventory.batches.length,
        hasRecentActivity,
        recentMovementsCount: recentMovements.length,
      });
    }

    res.json({
      message: 'Inventory accuracy report',
      totalSkus: inventories.length,
      report,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get audit history
const getAuditHistory = async (req, res) => {
  try {
    const { limit = 20, skip = 0 } = req.query;

    // Group stock movements to find audit activities
    const auditHistory = await StockMovement.aggregate([
      {
        $group: {
          _id: '$user',
          totalMovements: { $sum: 1 },
          lastMovementDate: { $max: '$createdAt' },
          movementTypes: { $push: '$movementType' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userData',
        },
      },
      { $sort: { lastMovementDate: -1 } },
      { $limit: parseInt(limit) },
      { $skip: parseInt(skip) },
    ]);

    res.json({
      auditHistory,
      pagination: {
        limit: parseInt(limit),
        skip: parseInt(skip),
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Monitor low stock levels
const getExpiredAndLowStockItems = async (req, res) => {
  try {
    const inventories = await Inventory.find();
    const now = new Date();

    const lowStockItems = [];
    const expiredItems = [];
    const expiringItems = [];

    for (const inventory of inventories) {
      const totalQuantity = inventory.batches.reduce((sum, batch) => sum + batch.quantity, 0);

      if (totalQuantity <= inventory.reorderLevel) {
        lowStockItems.push({
          sku: inventory.sku,
          productName: inventory.productName,
          currentQuantity: totalQuantity,
          reorderLevel: inventory.reorderLevel,
        });
      }

      for (const batch of inventory.batches) {
        if (batch.expiryDate < now) {
          expiredItems.push({
            sku: inventory.sku,
            productName: inventory.productName,
            batchNumber: batch.batchNumber,
            expiryDate: batch.expiryDate,
            quantity: batch.quantity,
          });
        } else if (batch.expiryDate < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) {
          expiringItems.push({
            sku: inventory.sku,
            productName: inventory.productName,
            batchNumber: batch.batchNumber,
            expiryDate: batch.expiryDate,
            daysUntilExpiry: Math.ceil((batch.expiryDate - now) / (24 * 60 * 60 * 1000)),
            quantity: batch.quantity,
          });
        }
      }
    }

    res.json({
      lowStockItems,
      expiredItems,
      expiringItems,
      summary: {
        lowStockCount: lowStockItems.length,
        expiredCount: expiredItems.length,
        expiringIn30Days: expiringItems.length,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getStockMovementHistory,
  getMovementBySku,
  conductStockAudit,
  submitAuditResults,
  getInventoryAccuracyReport,
  getAuditHistory,
  getExpiredAndLowStockItems,
};

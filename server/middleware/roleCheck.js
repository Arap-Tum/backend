// Granular role check middleware
const roleCheck = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized - No user found' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Access denied - Insufficient permissions',
        userRole: req.user.role,
        allowedRoles,
      });
    }
    next();
  };
};

// Check if user is Warehouse Manager (has access to everything)
const isWarehouseManager = (req, res, next) => {
  if (req.user.role !== 'Warehouse Manager') {
    return res.status(403).json({ message: 'Access denied - Warehouse Manager only' });
  }
  next();
};

// Check if user can manage inventory
const canManageInventory = (req, res, next) => {
  const allowedRoles = ['Warehouse Manager', 'Inventory Manager'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied - Inventory Manager access required' });
  }
  next();
};

// Check if user can manage orders
const canManageOrders = (req, res, next) => {
  const allowedRoles = ['Warehouse Manager', 'Sales Staff'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied - Sales Staff access required' });
  }
  next();
};

// Check if user is in picking department
const isPicker = (req, res, next) => {
  const allowedRoles = ['Warehouse Manager', 'Picker'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied - Picker access required' });
  }
  next();
};

// Check if user is in packing department
const isPacker = (req, res, next) => {
  const allowedRoles = ['Warehouse Manager', 'Packer'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied - Packer access required' });
  }
  next();
};

// Check if user can dispatch
const canDispatch = (req, res, next) => {
  const allowedRoles = ['Warehouse Manager', 'Dispatch Officer'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied - Dispatch Officer access required' });
  }
  next();
};

// Check if user can receive
const canReceive = (req, res, next) => {
  const allowedRoles = ['Warehouse Manager', 'Receiving Officer'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied - Receiving Officer access required' });
  }
  next();
};

module.exports = {
  roleCheck,
  isWarehouseManager,
  canManageInventory,
  canManageOrders,
  isPicker,
  isPacker,
  canDispatch,
  canReceive,
};
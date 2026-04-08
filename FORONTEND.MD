# Backend Codebase Analysis

## 🔐 AUTHENTICATION SYSTEM

### Auth Endpoints

**1. Register User**
```
POST /api/auth/register
Content-Type: application/json

Request Body:
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "Picker",                    // Required
  "department": "Warehouse"             // Required
}

Response (201 Created):
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "Picker",
    "department": "Warehouse"
  }
}

Validation Rules:
- name: required, trimmed
- email: valid email format, unique
- password: minimum 6 characters
- role: must be one of 7 valid roles
- department: must be Warehouse, Sales, or Logistics
```

**2. Login User**
```
POST /api/auth/login
Content-Type: application/json

Request Body:
{
  "email": "john@example.com",
  "password": "password123"
}

Response (200 OK):
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "Picker",
    "department": "Warehouse"
  }
}

Error Cases:
- 400: "Invalid credentials" (wrong email/password)
- 403: "User account is inactive" (isActive = false)
```

**3. Get Current User Profile**
```
GET /api/auth/profile
Authorization: Bearer <token>

Response (200 OK):
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "Picker",
  "department": "Warehouse",
  "isActive": true,
  "lastLogin": "2026-04-04T10:30:00.000Z",
  "createdAt": "2026-01-15T08:20:00.000Z",
  "updatedAt": "2026-04-04T10:30:00.000Z"
}
```

**4. Logout**
```
POST /api/auth/logout
Authorization: Bearer <token>

Response (200 OK):
{
  "message": "Logged out successfully"
}

Note: Mainly for frontend cleanup (tokens don't have server-side blacklist)
```

---

## 🔑 TOKEN & HEADER REQUIREMENTS

### JWT Token Structure
```
Header: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Payload (decoded):
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "role": "Picker",
    "department": "Warehouse"
  },
  "iat": 1712225400,
  "exp": 1712311800  // Expires in 24 hours
}

Token Expiry: 24 hours
Secret: process.env.JWT_SECRET (configured in .env)
```

### Required Header Format
```
All protected endpoints require:
Header: Authorization: Bearer <jwt_token>

Without token: 401 Unauthorized { "message": "No token, authorization denied" }
Invalid token: 401 Unauthorized { "message": "Token is not valid" }
Expired token: 401 Unauthorized { "message": "Token is not valid" }
```

---

## 👥 ROLE-BASED ACCESS CONTROL (RBAC)

### 7 User Roles & Permissions

| Role | Department | Permissions |
|------|------------|-------------|
| **Warehouse Manager** | Warehouse | Full system access, approve orders, manage users |
| **Inventory Manager** | Warehouse | Manage inventory, conduct audits, view reports |
| **Picker** | Warehouse | View picklist, pick items, mark as picked |
| **Packer** | Warehouse | Pack items, confirm packing, view order details |
| **Dispatch Officer** | Logistics | Dispatch orders, confirm shipments, mark delivered |
| **Receiving Officer** | Warehouse | Receive goods, inspect, accept/reject shipments |
| **Sales Staff** | Sales | Create orders, view their orders, check inventory |

### Middleware Access Control
```javascript
// Role Check Middleware Pattern:
// GET /api/endpoint
// auth middleware → roleCheck(['Role1', 'Role2']) → controller

Example Middlewares Available:
- roleCheck(['Warehouse Manager', 'Sales Staff'])    // Custom roles
- isWarehouseManager()                                 // Warehouse Manager only
- canManageInventory()                                 // Inventory Manager + Warehouse Manager
- canManageOrders()                                    // Sales Staff + Warehouse Manager
- isPicker()                                           // Picker + Warehouse Manager
- isPacker()                                           // Packer + Warehouse Manager
- canDispatch()                                        // Dispatch Officer + Warehouse Manager
- canReceive()                                         // Receiving Officer + Warehouse Manager
```

**Access Denied Response:**
```json
{
  "message": "Access denied - Insufficient permissions",
  "userRole": "Picker",
  "allowedRoles": ["Warehouse Manager", "Sales Staff"]
}
Status: 403 Forbidden
```

---

## 🔄 AUTH FLOW (Step-by-Step)

```
1. USER REGISTRATION
   ↓
   POST /api/auth/register
   { name, email, password, role, department }
   ↓
   Backend: Hash password (bcrypt 10 rounds), create user
   ↓
   Response: JWT token + user data
   ↓
   Frontend: Store token in localStorage/sessionStorage

2. USER LOGIN
   ↓
   POST /api/auth/login
   { email, password }
   ↓
   Backend: Verify password, create JWT, update lastLogin
   ↓
   Response: JWT token + user data
   ↓
   Frontend: Store token in localStorage/sessionStorage

3. ACCESSING PROTECTED ROUTES
   ↓
   Request: GET /api/orders
            Header: Authorization: Bearer <token>
   ↓
   Backend: auth middleware extracts token
   ↓
   Verify JWT signature & expiry
   ↓
   Extract user data (id, email, role, department)
   ↓
   Check role permissions with roleCheck middleware
   ↓
   If ✓ Allowed: Pass to controller
   If ✗ Denied: Return 403 Forbidden

4. TOKEN EXPIRY (24 HOURS)
   ↓
   After 24 hours, token becomes invalid
   ↓
   Request fails with 401 Unauthorized
   ↓
   Frontend: Redirect to login, ask to login again
```

---

## 📋 BACKEND STRUCTURE OVERVIEW

### Project Layout
```
backend/
├── server/
│   ├── app.js                    # Main Express app, route mounting
│   ├── config/
│   │   └── database.js           # MongoDB connection
│   ├── models/                   # Database schemas
│   │   ├── User.js              # 7 roles, department, isActive, lastLogin
│   │   ├── Order.js             # Complete order lifecycle
│   │   ├── Receiving.js         # Goods receiving workflow
│   │   ├── Inventory.js         # Stock with batch tracking
│   │   └── StockMovement.js     # Audit trail
│   ├── controllers/              # Business logic for each route
│   │   ├── authController.js
│   │   ├── orderController.js
│   │   ├── pickingController.js
│   │   ├── packingController.js
│   │   ├── dispatchController.js
│   │   ├── receivingController.js
│   │   ├── auditController.js
│   │   ├── inventoryController.js
│   │   ├── stockController.js
│   │   ├── userController.js
│   │   └── dashboardController.js
│   ├── routes/                   # Endpoint definitions
│   │   ├── auth.js              # Auth endpoints
│   │   ├── orders.js            # Order CRUD
│   │   ├── picking.js           # Picking workflow
│   │   ├── packing.js           # Packing workflow
│   │   ├── dispatch.js          # Dispatch workflow
│   │   ├── receiving.js         # Receiving workflow
│   │   ├── audit.js             # Stock audit & reports
│   │   ├── inventory.js         # Inventory management
│   │   ├── stock.js             # Stock movements
│   │   ├── users.js             # User management
│   │   └── dashboard.js         # Dashboard data
│   └── middleware/
│       ├── auth.js              # JWT verification
│       └── roleCheck.js         # Role-based access control
├── package.json
└── .env                         # Environment variables

Key Files:
- API_DOCUMENTATION.md (95+ endpoints)
- SYSTEM_ARCHITECTURE.md (detailed workflows)
- QUICK_START.md (testing guide)
```

### Core Workflow Pipelines

**1. ORDER LIFECYCLE**
```
pending → picking → picked → packing → packed → ready_to_ship → shipped → delivered
```
- Created by Sales Staff
- Assigned to Picker → Packer → Dispatch Officer
- Each stage auto-tracked with timestamps

**2. RECEIVING WORKFLOW**
```
pending → in_progress → completed / rejected
```
- Receiving Officer creates receiving document
- Updates quantities, inspects goods
- Approves to update inventory + create batches

**3. STOCK MOVEMENTS**
```
Every action logged: RECEIVE, DISPATCH, TRANSFER
- User who performed action
- Quantity & batch number
- Timestamp
```

**4. INVENTORY MANAGEMENT**
```
- SKU-based organization
- Multiple batches with:
  * Batch number, quantity
  * Manufacture & expiry dates
  * Storage location codes
- FIFO dispatch (oldest first)
- Virtual totalQuantity field
```

---

## 📊 DATABASE MODELS SUMMARY

### User Schema
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: Enum [7 roles],
  department: Enum ['Warehouse', 'Sales', 'Logistics'],
  isActive: Boolean (default: true),
  lastLogin: Date,
  timestamps: true
}
```

### Order Schema
```javascript
{
  orderNumber: String (unique),
  customer: { name, email, phone, address },
  items: [{
    sku, productName, quantity, unitPrice,
    status: enum ['pending','picked','packed','shipped','delivered']
  }],
  orderStatus: enum [pending, picking, picked, packing, packed, ready_to_ship, shipped, delivered, cancelled],
  totalAmount: Number,
  pickingAssignedTo: User ref,
  packingAssignedTo: User ref,
  dispatchedBy: User ref,
  createdBy: User ref,
  trackingNumber: String,
  timestamps: {picklistCreatedAt, pickedAt, packedAt, shippedAt, deliveredAt},
  notes: String
}
```

### Receiving Schema
```javascript
{
  receivingNumber: String (unique),
  supplier: { name, contact, email },
  purchaseOrder: String,
  items: [{
    sku, productName, expectedQuantity, receivedQuantity,
    batchNumber, manufactureDate, expiryDate, storageLocationCode,
    status: enum ['pending','received','inspected','accepted','rejected'],
    notes: String
  }],
  receivingStatus: enum ['pending','in_progress','completed','rejected'],
  receivedBy: User ref (required),
  inspectedBy: User ref,
  approvedBy: User ref,
  timestamps: {receivedDate, inspectionDate, approvalDate}
}
```

### Inventory Schema
```javascript
{
  sku: String (unique),
  productName: String,
  category: String,
  reorderLevel: Number,
  batches: [{
    batchNumber, quantity, manufactureDate, expiryDate, storageLocationCode
  }],
  virtual totalQuantity: sum of all batch quantities
}
```

---

## ✅ AUTHENTICATION SECURITY

- **Password Hashing**: bcryptjs with 10 salt rounds
- **Token Encryption**: JWT with HS256 algorithm
- **Token Expiry**: 24 hours (manual re-login required)
- **No Token Blacklist**: Revocation not implemented (stateless design)
- **CORS**: Enabled globally
- **Header Validation**: Bearer token format enforced

**Production Recommendations:**
- Use HTTPS only
- Implement token refresh mechanism  
- Add rate limiting on auth endpoints
- Consider JWT blacklist/token rotation for logout

---

## 🚀 Quick Reference: How to Call Protected Endpoints

```javascript
// After login, frontend gets token:
const token = response.data.token;

// For all future requests:
const config = {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
};

// Example: Get all orders
fetch('https://muthokinju-warehouse-management-system.onrender.com/api/orders', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

This covers everything needed to understand and implement your frontend authentication! Let me know if you need details on any specific endpoints.





# ALL API ENDPOINTS - Complete Reference

**Base URL:** `https://muthokinju-warehouse-management-system.onrender.com/api`

---

## 🔐 AUTHENTICATION (4 endpoints)

### 1. Register User
```
POST /auth/register
Headers: Content-Type: application/json

Request Body:
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "Picker",
  "department": "Warehouse"
}

Response (201):
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "Picker",
    "department": "Warehouse"
  }
}
```

### 2. Login User
```
POST /auth/login
Headers: Content-Type: application/json

Request Body:
{
  "email": "john@example.com",
  "password": "password123"
}

Response (200):
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "Picker",
    "department": "Warehouse"
  }
}
```

### 3. Get Current User Profile
```
GET /auth/profile
Headers: Authorization: Bearer <token>

Response (200):
{
  "_id": "507f...",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "Picker",
  "department": "Warehouse",
  "isActive": true,
  "lastLogin": "2026-04-04T10:30:00Z",
  "createdAt": "2026-01-15T08:20:00Z"
}
```

### 4. Logout
```
POST /auth/logout
Headers: Authorization: Bearer <token>

Response (200):
{
  "message": "Logged out successfully"
}
```

---

## 📦 ORDERS (6 endpoints)

### 1. Get All Orders
```
GET /orders
Headers: Authorization: Bearer <token>
Access: Warehouse Manager, Sales Staff

Response (200):
[
  {
    "_id": "507f...",
    "orderNumber": "ORD-001",
    "customer": {
      "name": "Acme Corp",
      "email": "contact@acme.com",
      "phone": "254712345678",
      "address": "Nairobi, Kenya"
    },
    "items": [
      {
        "sku": "SKU-001",
        "productName": "Widget A",
        "quantity": 50,
        "unitPrice": 100,
        "status": "pending"
      }
    ],
    "orderStatus": "pending",
    "totalAmount": 5000,
    "createdBy": { "name": "John" },
    "pickingAssignedTo": null,
    "packingAssignedTo": null,
    "dispatchedBy": null,
    "createdAt": "2026-04-04T10:00:00Z"
  }
]
```

### 2. Get Sales Staff's Orders
```
GET /orders/my-orders
Headers: Authorization: Bearer <token>
Access: Sales Staff only

Response (200): [orders created by logged-in user]
```

### 3. Get Order by ID
```
GET /orders/:id
Headers: Authorization: Bearer <token>
Params: id = MongoDB ObjectId

Response (200): [single order object]
```

### 4. Create Order
```
POST /orders
Headers: Authorization: Bearer <token>
         Content-Type: application/json
Access: Warehouse Manager, Sales Staff

Request Body:
{
  "orderNumber": "ORD-001",
  "customer": {
    "name": "Acme Corp",
    "email": "contact@acme.com",
    "phone": "254712345678",
    "address": "Nairobi, Kenya"
  },
  "items": [
    {
      "sku": "SKU-001",
      "productName": "Widget A",
      "quantity": 50,
      "unitPrice": 100
    }
  ],
  "totalAmount": 5000,
  "notes": "Urgent delivery"
}

Response (201):
{
  "message": "Order created successfully",
  "order": { ...order object }
}
```

### 5. Update Order
```
PATCH /orders/:id
Headers: Authorization: Bearer <token>
         Content-Type: application/json
Access: Warehouse Manager, Sales Staff

Request Body (all optional):
{
  "customer": { ...updated customer details },
  "items": [ ...updated items ],
  "totalAmount": 5500,
  "notes": "Updated notes"
}

Response (200):
{
  "message": "Order updated successfully",
  "order": { ...updated order }
}
```

### 6. Cancel Order
```
DELETE /orders/:id
Headers: Authorization: Bearer <token>
Access: Warehouse Manager, Sales Staff
Restriction: Cannot cancel if shipped/delivered

Response (200):
{
  "message": "Order cancelled successfully",
  "order": { orderStatus: "cancelled" }
}
```

---

## 🎯 PICKING (5 endpoints)

### 1. Get Picklist (Pending Orders)
```
GET /picking/list/pending
Headers: Authorization: Bearer <token>
Access: Warehouse Manager, Picker

Response (200):
[
  {
    "orderId": "507f...",
    "orderNumber": "ORD-001",
    "items": [ ...items array ],
    "customer": { ...customer details },
    "createdAt": "2026-04-04T10:00:00Z"
  }
]
```

### 2. Get Assigned Picks (for current Picker)
```
GET /picking/assigned
Headers: Authorization: Bearer <token>
Access: Picker, Warehouse Manager

Response (200): [orders assigned to current picker]
```

### 3. Assign Order to Picker
```
POST /picking/assign
Headers: Authorization: Bearer <token>
         Content-Type: application/json
Access: Warehouse Manager only

Request Body:
{
  "orderId": "507f...",
  "pickerId": "507f..." // User ID of picker
}

Response (200):
{
  "message": "Order assigned to picker successfully",
  "order": { pickingAssignedTo: "507f..." }
}
```

### 4. Mark Items as Picked
```
PATCH /picking/:orderId/mark-picked
Headers: Authorization: Bearer <token>
         Content-Type: application/json
Access: Picker, Warehouse Manager

Request Body:
{
  "pickedItems": [
    {
      "sku": "SKU-001",
      "quantity": 50,
      "batchNumber": "BATCH-001"
    }
  ]
}

Response (200):
{
  "message": "Items marked as picked successfully",
  "order": { orderStatus: "picked" }
}
```

### 5. Update Picking Status
```
PATCH /picking/:orderId/status
Headers: Authorization: Bearer <token>
         Content-Type: application/json
Access: Picker, Warehouse Manager

Request Body:
{
  "skus": ["SKU-001", "SKU-002"],
  "pickingStatus": "picked"  // pending, picked, not_picked
}

Response (200):
{
  "message": "Picking status updated",
  "order": { ...updated }
}
```

---

## 📦 PACKING (6 endpoints)

### 1. Get Orders Ready for Packing
```
GET /packing/list/ready
Headers: Authorization: Bearer <token>
Access: Warehouse Manager, Packer

Response (200): [orders with orderStatus: "picked"]
```

### 2. Get Assigned Packing Orders
```
GET /packing/assigned
Headers: Authorization: Bearer <token>
Access: Packer, Warehouse Manager

Response (200): [orders assigned to current packer]
```

### 3. Get Order Details (for Packing)
```
GET /packing/:orderId/details
Headers: Authorization: Bearer <token>
Access: Warehouse Manager, Packer

Response (200): [single order with all details]
```

### 4. Assign Order to Packer
```
POST /packing/assign
Headers: Authorization: Bearer <token>
         Content-Type: application/json
Access: Warehouse Manager only

Request Body:
{
  "orderId": "507f...",
  "packerId": "507f..." // User ID of packer
}

Response (200):
{
  "message": "Order assigned to packer successfully",
  "order": { packingAssignedTo: "507f...", orderStatus: "packing" }
}
```

### 5. Confirm Items as Packed
```
PATCH /packing/:orderId/confirm-packed
Headers: Authorization: Bearer <token>
         Content-Type: application/json
Access: Packer, Warehouse Manager

Request Body:
{
  "packedItems": [
    { "sku": "SKU-001" },
    { "sku": "SKU-002" }
  ]
}

Response (200):
{
  "message": "Items confirmed as packed successfully",
  "order": { orderStatus: "packed", packedAt: "2026-04-04T11:00:00Z" }
}
```

### 6. Update Packing Status
```
PATCH /packing/:orderId/status
Headers: Authorization: Bearer <token>
         Content-Type: application/json
Access: Packer, Warehouse Manager

Request Body:
{
  "skus": ["SKU-001"],
  "packingStatus": "packed"  // pending, packed, not_packed
}

Response (200):
{
  "message": "Packing status updated",
  "order": { ...updated }
}
```

---

## 🚚 DISPATCH (6 endpoints)

### 1. Get Packed Orders Ready for Dispatch
```
GET /dispatch/list/ready
Headers: Authorization: Bearer <token>
Access: Dispatch Officer, Warehouse Manager

Response (200): [orders with orderStatus: "packed"]
```

### 2. Get Dispatched Orders (by current officer)
```
GET /dispatch/dispatched
Headers: Authorization: Bearer <token>
Access: Dispatch Officer, Warehouse Manager

Response (200): [orders dispatched by current user]
```

### 3. Get Order Dispatch Details
```
GET /dispatch/:orderId/details
Headers: Authorization: Bearer <token>
Access: Dispatch Officer, Warehouse Manager

Response (200): [complete order details]
```

### 4. Confirm Shipment (Single Order)
```
PATCH /dispatch/:orderId/confirm-shipment
Headers: Authorization: Bearer <token>
         Content-Type: application/json
Access: Dispatch Officer, Warehouse Manager

Request Body:
{
  "trackingNumber": "TRACK-123456"  // optional
}

Response (200):
{
  "message": "Order shipped successfully",
  "order": { 
    orderStatus: "shipped",
    shippedAt: "2026-04-04T11:00:00Z",
    trackingNumber: "TRACK-123456"
  }
}
```

### 5. Bulk Approve & Dispatch Orders
```
POST /dispatch/bulk/approve-dispatch
Headers: Authorization: Bearer <token>
         Content-Type: application/json
Access: Dispatch Officer, Warehouse Manager

Request Body:
{
  "orderIds": ["507f...", "507f..."],
  "trackingNumbers": ["TRACK-001", "TRACK-002"]  // optional
}

Response (200):
{
  "message": "3 orders shipped successfully",
  "ordersShipped": 3,
  "orders": [ ...shipped orders ]
}
```

### 6. Mark Order as Delivered
```
PATCH /dispatch/:orderId/mark-delivered
Headers: Authorization: Bearer <token>
Access: Dispatch Officer, Warehouse Manager

Request Body: {} (empty)

Response (200):
{
  "message": "Order marked as delivered",
  "order": {
    orderStatus: "delivered",
    deliveredAt: "2026-04-04T15:00:00Z"
  }
}
```

---

## 📥 RECEIVING (7 endpoints)

### 1. Get All Receiving Documents
```
GET /receiving/
Headers: Authorization: Bearer <token>
Access: Warehouse Manager, Receiving Officer, Inventory Manager

Response (200):
[
  {
    "_id": "507f...",
    "receivingNumber": "REC-001",
    "supplier": {
      "name": "Supplier A",
      "contact": "0712345678",
      "email": "supplier@a.com"
    },
    "purchaseOrder": "PO-001",
    "items": [
      {
        "sku": "SKU-001",
        "productName": "Widget A",
        "expectedQuantity": 100,
        "receivedQuantity": 95,
        "batchNumber": "BATCH-001",
        "status": "received"
      }
    ],
    "receivingStatus": "pending",
    "receivedBy": { "name": "Officer" },
    "receivedDate": "2026-04-04T09:00:00Z"
  }
]
```

### 2. Get Receiving Document by ID
```
GET /receiving/:id
Headers: Authorization: Bearer <token>
Access: Warehouse Manager, Receiving Officer, Inventory Manager

Response (200): [single receiving document]
```

### 3. Create Receiving Document
```
POST /receiving/
Headers: Authorization: Bearer <token>
         Content-Type: application/json
Access: Receiving Officer, Warehouse Manager

Request Body:
{
  "receivingNumber": "REC-001",
  "supplier": {
    "name": "Supplier A",
    "contact": "0712345678",
    "email": "supplier@a.com"
  },
  "purchaseOrder": "PO-001",
  "items": [
    {
      "sku": "SKU-001",
      "productName": "Widget A",
      "expectedQuantity": 100,
      "batchNumber": "BATCH-001",
      "manufactureDate": "2026-01-01T00:00:00Z",
      "expiryDate": "2027-01-01T00:00:00Z",
      "storageLocationCode": "SHELF-A1"
    }
  ]
}

Response (201):
{
  "message": "Receiving document created",
  "receiving": { ...receiving object }
}
```

### 4. Update Received Quantities
```
PATCH /receiving/:id/update-quantities
Headers: Authorization: Bearer <token>
         Content-Type: application/json
Access: Receiving Officer, Warehouse Manager

Request Body:
{
  "items": [
    {
      "sku": "SKU-001",
      "receivedQuantity": 95,
      "notes": "2 units damaged"
    }
  ]
}

Response (200):
{
  "message": "Received quantities updated",
  "receiving": { receivingStatus: "in_progress" }
}
```

### 5. Inspect Received Goods
```
PATCH /receiving/:id/inspect
Headers: Authorization: Bearer <token>
         Content-Type: application/json
Access: Receiving Officer, Warehouse Manager

Request Body:
{
  "inspectionNotes": "All items checked, some packaging damage"
}

Response (200):
{
  "message": "Goods inspected",
  "receiving": {
    "inspectedBy": "507f...",
    "inspectionDate": "2026-04-04T10:00:00Z"
  }
}
```

### 6. Accept Receiving (Update Inventory)
```
PATCH /receiving/:id/accept
Headers: Authorization: Bearer <token>
Access: Receiving Officer, Warehouse Manager

Response (200):
{
  "message": "Receiving accepted and inventory updated",
  "receiving": {
    "receivingStatus": "completed",
    "approvedBy": "507f...",
    "approvalDate": "2026-04-04T11:00:00Z"
  }
}
```

### 7. Reject Receiving
```
PATCH /receiving/:id/reject
Headers: Authorization: Bearer <token>
         Content-Type: application/json
Access: Receiving Officer, Warehouse Manager

Request Body:
{
  "rejectionReason": "Damaged goods, quality issues"
}

Response (200):
{
  "message": "Receiving rejected",
  "receiving": { receivingStatus: "rejected" }
}
```

---

## 📊 AUDIT & STOCK MOVEMENTS (7 endpoints)

### 1. Get Stock Movement History
```
GET /audit/history/movements
Headers: Authorization: Bearer <token>
Query Params:
  ?sku=SKU-001
  &startDate=2026-01-01T00:00:00Z
  &endDate=2026-04-04T23:59:59Z
  &movementType=RECEIVE (RECEIVE|DISPATCH|TRANSFER)
  &limit=50 (default)
  &skip=0 (default)
Access: Inventory Manager, Warehouse Manager

Response (200):
{
  "movements": [
    {
      "_id": "507f...",
      "sku": "SKU-001",
      "movementType": "RECEIVE",
      "quantity": 100,
      "user": { "name": "Officer" },
      "batchNumber": "BATCH-001",
      "createdAt": "2026-04-04T09:00:00Z"
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 50,
    "skip": 0
  }
}
```

### 2. Get Movement by SKU
```
GET /audit/history/:sku
Headers: Authorization: Bearer <token>
Query Params:
  ?limit=50
  &skip=0
Access: Inventory Manager, Warehouse Manager

Response (200): [stock movements for specific SKU]
```

### 3. Conduct Stock Audit
```
POST /audit/audit/conduct
Headers: Authorization: Bearer <token>
         Content-Type: application/json
Access: Inventory Manager, Warehouse Manager

Request Body:
{
  "skus": ["SKU-001", "SKU-002", "SKU-003"]
}

Response (200):
{
  "message": "Stock audit started",
  "auditDate": "2026-04-04T12:00:00Z",
  "results": [
    {
      "sku": "SKU-001",
      "productName": "Widget A",
      "systemQuantity": 150,
      "batches": [
        {
          "batchNumber": "BATCH-001",
          "quantity": 150,
          "expiryDate": "2027-01-01T00:00:00Z",
          "storageLocationCode": "SHELF-A1"
        }
      ],
      "status": "awaiting_physical_count"
    }
  ]
}
```

### 4. Submit Audit Results
```
POST /audit/audit/submit-results
Headers: Authorization: Bearer <token>
         Content-Type: application/json
Access: Inventory Manager, Warehouse Manager

Request Body:
{
  "auditResults": [
    {
      "sku": "SKU-001",
      "physicalCount": 145,
      "notes": "5 units missing"
    }
  ]
}

Response (200):
{
  "message": "Audit results submitted",
  "totalItems": 1,
  "discrepanciesFound": 1,
  "discrepancies": [
    {
      "sku": "SKU-001",
      "productName": "Widget A",
      "systemQuantity": 150,
      "physicalCount": 145,
      "difference": 5,
      "discrepancyPercentage": "3.33"
    }
  ]
}
```

### 5. Get Inventory Accuracy Report
```
GET /audit/reports/accuracy
Headers: Authorization: Bearer <token>
Access: Inventory Manager, Warehouse Manager

Response (200):
{
  "message": "Inventory accuracy report",
  "totalSkus": 5,
  "report": [
    {
      "sku": "SKU-001",
      "productName": "Widget A",
      "systemQuantity": 150,
      "batchCount": 2,
      "hasRecentActivity": true,
      "recentMovementsCount": 12
    }
  ]
}
```

### 6. Get Audit History
```
GET /audit/reports/audit-history
Headers: Authorization: Bearer <token>
Query Params:
  ?limit=20 (default)
  &skip=0 (default)
Access: Inventory Manager, Warehouse Manager

Response (200):
{
  "auditHistory": [
    {
      "_id": "507f...",
      "totalMovements": 45,
      "lastMovementDate": "2026-04-04T15:00:00Z",
      "movementTypes": ["RECEIVE", "DISPATCH", "TRANSFER"],
      "userData": [{ "name": "Officer A" }]
    }
  ],
  "pagination": { "limit": 20, "skip": 0 }
}
```

### 7. Get Expired & Low Stock Items
```
GET /audit/reports/critical-items
Headers: Authorization: Bearer <token>
Access: Inventory Manager, Warehouse Manager

Response (200):
{
  "lowStockItems": [
    {
      "sku": "SKU-001",
      "productName": "Widget A",
      "currentQuantity": 5,
      "reorderLevel": 20
    }
  ],
  "expiredItems": [
    {
      "sku": "SKU-002",
      "productName": "Widget B",
      "batchNumber": "BATCH-002",
      "expiryDate": "2026-03-01T00:00:00Z",
      "quantity": 30
    }
  ],
  "expiringItems": [
    {
      "sku": "SKU-003",
      "productName": "Widget C",
      "batchNumber": "BATCH-003",
      "expiryDate": "2026-05-01T00:00:00Z",
      "daysUntilExpiry": 27,
      "quantity": 50
    }
  ],
  "summary": {
    "lowStockCount": 3,
    "expiredCount": 2,
    "expiringIn30Days": 5
  }
}
```

---

**Part 2 follows below...**

# ALL API ENDPOINTS - Part 2/2

Continuing from Part 1 (Auth, Orders, Picking, Packing, Dispatch, Receiving, Audit)...

---

## 📦 INVENTORY MANAGEMENT (5 endpoints)

### 1. Get All Inventory
```
GET /inventory/
Headers: Authorization: Bearer <token>

Response (200):
[
  {
    "_id": "507f...",
    "sku": "SKU-001",
    "productName": "Widget A",
    "category": "Hardware",
    "reorderLevel": 20,
    "batches": [
      {
        "_id": "507f...",
        "batchNumber": "BATCH-001",
        "quantity": 150,
        "manufactureDate": "2026-01-01T00:00:00Z",
        "expiryDate": "2027-01-01T00:00:00Z",
        "storageLocationCode": "SHELF-A1"
      }
    ],
    "totalQuantity": 150,
    "createdAt": "2026-01-15T08:20:00Z",
    "updatedAt": "2026-04-04T10:30:00Z"
  }
]
```

### 2. Get Inventory by SKU
```
GET /inventory/:sku
Headers: Authorization: Bearer <token>
Params: sku = product SKU string

Response (200):
{
  "_id": "507f...",
  "sku": "SKU-001",
  "productName": "Widget A",
  "category": "Hardware",
  "reorderLevel": 20,
  "batches": [ ...batches array ],
  "totalQuantity": 150
}
```

### 3. Create Inventory
```
POST /inventory/
Headers: Authorization: Bearer <token>
         Content-Type: application/json
Access: Warehouse Manager only

Request Body:
{
  "sku": "SKU-001",
  "productName": "Widget A",
  "category": "Hardware",
  "reorderLevel": 20,
  "batches": [
    {
      "batchNumber": "BATCH-001",
      "quantity": 150,
      "manufactureDate": "2026-01-01T00:00:00Z",
      "expiryDate": "2027-01-01T00:00:00Z",
      "storageLocationCode": "SHELF-A1"
    }
  ]
}

Response (200):
{
  "_id": "507f...",
  "sku": "SKU-001",
  ...inventory object
}
```

### 4. Update Inventory
```
PATCH /inventory/:sku
Headers: Authorization: Bearer <token>
         Content-Type: application/json
Access: Inventory Manager, Warehouse Manager

Request Body (all optional):
{
  "productName": "Widget A Updated",
  "reorderLevel": 25,
  "batches": [ ...updated batches ]
}

Response (200):
{ ...updated inventory object }
```

### 5. Delete Inventory
```
DELETE /inventory/:sku
Headers: Authorization: Bearer <token>
Access: Warehouse Manager only

Response (200):
{
  "message": "Inventory item deleted successfully"
}
```

---

## 📤 STOCK MOVEMENTS (4 endpoints)

### 1. Receive Stock
```
POST /stock/receive
Headers: Authorization: Bearer <token>
         Content-Type: application/json
Access: Inventory Manager, Warehouse Manager

Request Body:
{
  "sku": "SKU-001",
  "batchNumber": "BATCH-001",
  "quantity": 100,
  "manufactureDate": "2026-01-01T00:00:00Z",
  "expiryDate": "2027-01-01T00:00:00Z",
  "storageLocationCode": "SHELF-A1"
}

Response (200):
{
  "message": "Stock received successfully"
}
```

### 2. Dispatch Stock (FIFO)
```
POST /stock/dispatch
Headers: Authorization: Bearer <token>
         Content-Type: application/json
Access: Inventory Manager, Warehouse Manager

Request Body:
{
  "sku": "SKU-001",
  "quantity": 50
}

Response (200):
{
  "message": "Stock dispatched successfully"
}
Note: Uses FIFO (oldest batch first)
```

### 3. Transfer Stock Between Batches
```
POST /stock/transfer
Headers: Authorization: Bearer <token>
         Content-Type: application/json
Access: Inventory Manager, Warehouse Manager

Request Body:
{
  "sku": "SKU-001",
  "sourceBatchNumber": "BATCH-001",
  "destinationBatchNumber": "BATCH-002",
  "quantity": 30
}

Response (200):
{
  "message": "Stock transferred successfully",
  "sourceBatch": { ...batch info },
  "destinationBatch": { ...batch info }
}
```

### 4. Get Stock History
```
GET /stock/history
Headers: Authorization: Bearer <token>

Response (200):
[
  {
    "_id": "507f...",
    "sku": "SKU-001",
    "movementType": "RECEIVE",
    "quantity": 100,
    "user": {
      "_id": "507f...",
      "name": "Officer A",
      "email": "officer@warehouse.com"
    },
    "batchNumber": "BATCH-001",
    "createdAt": "2026-04-04T09:00:00Z"
  }
]
```

---

## 👥 USER MANAGEMENT (2 endpoints)

### 1. Get All Users
```
GET /users/
Headers: Authorization: Bearer <token>
Access: Warehouse Manager only

Response (200):
[
  {
    "_id": "507f...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "Picker",
    "department": "Warehouse",
    "isActive": true,
    "lastLogin": "2026-04-04T10:30:00Z",
    "createdAt": "2026-01-15T08:20:00Z"
  }
]
Note: password field NOT included
```

### 2. Update User Role
```
PATCH /users/:id
Headers: Authorization: Bearer <token>
         Content-Type: application/json
Access: Warehouse Manager only

Request Body:
{
  "role": "Warehouse Manager"
}

Response (200):
{
  "_id": "507f...",
  "name": "John Doe",
  "role": "Warehouse Manager",
  ...user object
}
```

---

## 📊 DASHBOARD (1 endpoint)

### 1. Get Dashboard Data
```
GET /dashboard/
Headers: Authorization: Bearer <token>

Response (200):
{
  "totalStockValue": 15450,
  "lowStockItems": [
    {
      "sku": "SKU-001",
      "productName": "Widget A",
      "totalQuantity": 5,
      "reorderLevel": 20
    }
  ],
  "recentMovements": [
    {
      "_id": "507f...",
      "sku": "SKU-001",
      "movementType": "RECEIVE",
      "quantity": 100,
      "user": { "name": "Officer A" },
      "createdAt": "2026-04-04T15:00:00Z"
    }
  ]
}
```

---

## ❤️ HEALTH CHECK (1 endpoint)

### 1. Health Check
```
GET /health
Headers: None required
Access: Public (No authentication)

Response (200):
{
  "status": "Server is running",
  "timestamp": "2026-04-04T16:00:00.000Z"
}
```

---

## 📋 SUMMARY TABLE

| Category | Count | Endpoints |
|----------|-------|-----------|
| Auth | 4 | register, login, profile, logout |
| Orders | 6 | get-all, my-orders, get-by-id, create, update, cancel |
| Picking | 5 | list, assigned, mark-picked, assign, update-status |
| Packing | 6 | list-ready, assigned, details, assign, confirm-packed, update-status |
| Dispatch | 6 | list-ready, dispatched, details, confirm-shipment, bulk-dispatch, mark-delivered |
| Receiving | 7 | list, get-by-id, create, update-quantities, inspect, accept, reject |
| Audit | 7 | history, history-sku, conduct, submit-results, accuracy-report, audit-history, critical-items |
| Inventory | 5 | get-all, get-by-sku, create, update, delete |
| Stock | 4 | receive, dispatch, transfer, history |
| Users | 2 | get-all, update-role |
| Dashboard | 1 | get-dashboard |
| Health | 1 | health-check |
| **TOTAL** | **54** | **endpoints** |

---

## 🔐 Authentication Summary

**All endpoints except `/health` require:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json (for POST/PATCH)
```

**Token Format:**
- Obtained from: `POST /auth/register` or `POST /auth/login`
- Expires: 24 hours
- Must be refreshed by re-logging in

---

## ⚠️ Common Error Responses

### 400 Bad Request
```json
{
  "message": "Missing required fields",
  "errors": [ { "field": "email", "message": "Valid email is required" } ]
}
```

### 401 Unauthorized
```json
{
  "message": "No token, authorization denied"
}
// OR
{
  "message": "Token is not valid"
}
```

### 403 Forbidden
```json
{
  "message": "Access denied - Insufficient permissions",
  "userRole": "Picker",
  "allowedRoles": ["Warehouse Manager", "Sales Staff"]
}
```

### 404 Not Found
```json
{
  "message": "Order not found"
}
```

### 500 Server Error
```json
{
  "message": "Server error"
}
```

---

## 🚀 Quick Integration Guide

### Frontend Setup
```javascript
// Store token after login
const token = loginResponse.data.token;
localStorage.setItem('jwt_token', token);

// Create axios instance with auto-headers
const api = axios.create({
  baseURL: 'https://muthokinju-warehouse-management-system.onrender.com/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Clear token on 401
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('jwt_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

**That's all 54 API endpoints for your Warehouse Management System!** 🎉



# DATA MODELS ANALYSIS

## 1️⃣ USER MODEL

**File:** User.js

### Fields & Types
```javascript
{
  name: String                          // User's full name
  email: String (unique)                // Login email, must be unique
  password: String                      // Hashed (bcryptjs)
  role: Enum [7 options]                // User's job role
  department: Enum [3 options]          // Warehouse, Sales, or Logistics
  isActive: Boolean (default: true)     // Account status
  lastLogin: Date (nullable)            // Last login timestamp
  createdAt: Date (auto)                // Account creation date
  updatedAt: Date (auto)                // Last profile update
}
```

### Valid Roles (7 Total)
```
1. Warehouse Manager        → Full system access
2. Inventory Manager        → Stock management
3. Picker                   → Order picking
4. Packer                   → Order packing
5. Dispatch Officer         → Shipment handling
6. Receiving Officer        → Goods receiving
7. Sales Staff              → Create customer orders
```

### Departments
```
- Warehouse (WH staff)
- Sales (Sales staff)
- Logistics (Dispatch)
```

### Relationships
```
User → Orders (createdBy)
User → Orders (pickingAssignedTo)
User → Orders (packingAssignedTo)
User → Orders (dispatchedBy)
User → Receiving (receivedBy, inspectedBy, approvedBy)
User → StockMovement (user who performed action)
```

### Purpose
Central authentication & authorization. Every user has a role that determines what they can access.

### Frontend UI Representation

**User Profile Card:**
```
┌─────────────────────────────────┐
│  👤 John Doe                    │
│  📧 john@example.com            │
│  🎯 Role: Picker                │
│  🏢 Department: Warehouse       │
│  ✅ Status: Active              │
│  🕐 Last Login: 2026-04-04      │
└─────────────────────────────────┘
```

**User List Table:**
```
Name      | Email              | Role              | Department | Status | Last Login
----------|-------------------|-------------------|------------|--------|-----------
John Doe  | john@example.com   | Picker            | Warehouse  | Active | 2026-04-04
Jane Smith| jane@example.com   | Packer            | Warehouse  | Active | 2026-04-03
Mike K.   | mike@example.com   | Dispatch Officer  | Logistics  | Active | 2026-04-01
```

**Edit User Modal:**
```
Name: [John Doe]
Email: [john@example.com]
Role: [Dropdown: Warehouse Manager, Inventory Manager, Picker, ...]
Department: [Dropdown: Warehouse, Sales, Logistics]
[Disable Account]  [Update Role]  [Cancel]
```

---

## 2️⃣ ORDER MODEL

**File:** Order.js

### Fields & Types
```javascript
{
  orderNumber: String (unique)          // Unique order ID (e.g., ORD-001)
  customer: {
    name: String
    email: String
    phone: String
    address: String
  },
  items: [{
    sku: String                         // Product SKU
    productName: String
    quantity: Number
    unitPrice: Number
    status: Enum [5 stages]             // pending, picked, packed, shipped, delivered
  }],
  orderStatus: Enum [9 states]          // pending, picking, picked, packing, packed, 
                                        // ready_to_ship, shipped, delivered, cancelled
  totalAmount: Number                   // Order total price
  
  // Task Assignments
  pickingAssignedTo: User ref           // Assigned picker
  packingAssignedTo: User ref           // Assigned packer
  dispatchedBy: User ref                // Dispatch officer
  createdBy: User ref                   // Sales staff who created
  
  // Tracking
  trackingNumber: String                // Shipping tracking number
  notes: String
  
  // Timestamps
  picklistCreatedAt: Date
  pickedAt: Date
  packedAt: Date
  shippedAt: Date
  deliveredAt: Date
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

### Order Status Workflow
```
pending → picking → picked → packing → packed → ready_to_ship → shipped → delivered
                                                                    ↓
                                                              (cancelled)
```

### Relationships
```
Order ← User (createdBy: Sales Staff)
Order ← User (pickingAssignedTo: Picker)
Order ← User (packingAssignedTo: Packer)
Order ← User (dispatchedBy: Dispatch Officer)
Order → Items (contains multiple items with SKUs)
```

### Purpose
Complete order lifecycle from creation to delivery. Tracks which staff member performed each task and when.

### Frontend UI Representation

**Order List View:**
```
┌────────────────────────────────────────────────────────────────┐
│ Orders                                          [Create Order] │
│────────────────────────────────────────────────────────────────│
│ #     | Customer    | Status      | Items | Amount | Assigned │
│────────────────────────────────────────────────────────────────│
│ORD-1  | Acme Corp   | 🔄 Picking  | 5     | 5,000  | John D.  │
│ORD-2  | TechFlow    | ✅ Picked   | 3     | 3,500  | Jane S.  │
│ORD-3  | SafeBox Ltd | 📦 Packing  | 8     | 8,200  | Mike K.  │
│ORD-4  | RetailPro   | 🚚 Shipped  | 12    | 12,500 | Dispatch │
└────────────────────────────────────────────────────────────────┘
```

**Order Detail Card:**
```
╌──────────────────────────────────────╌
│ Order: ORD-001 | Status: 🔄 PICKING  │
╌──────────────────────────────────────╌
│ CUSTOMER INFO                        │
│ ├─ Name: Acme Corp                   │
│ ├─ Email: contact@acme.com           │
│ ├─ Phone: 0712345678                 │
│ └─ Address: Nairobi, Kenya           │
│                                      │
│ ORDER ITEMS                          │
│ ├─ SKU-001: Widget A × 50 @ 100      │
│ │  Status: ⏳ pending                │
│ ├─ SKU-002: Gadget B × 30 @ 150      │
│ │  Status: ✅ picked                 │
│ └─ SKU-003: Device C × 20 @ 200      │
│    Status: ⏳ pending                │
│                                      │
│ TOTALS                               │
│ └─ Total: 12,500 KES                 │
│                                      │
│ ASSIGNMENTS                          │
│ ├─ Picker: John Doe (Assigned)       │
│ ├─ Packer: [Unassigned]              │
│ └─ Dispatch: [Unassigned]            │
│                                      │
│ TIMELINE                             │
│ ├─ Created: 2026-04-04 10:00         │
│ ├─ Picking Started: 2026-04-04 10:15 │
│ ├─ Picked: -                         │
│ ├─ Packed: -                         │
│ └─ Shipped: -                        │
│                                      │
│ [Assign to Picker] [Assign to Packer]│
│ [Assign to Dispatch] [Cancel Order]  │
╌──────────────────────────────────────╌
```

**Order Creation Form:**
```
┌─────────────────────────────────────────┐
│ CREATE NEW ORDER                        │
├─────────────────────────────────────────┤
│                                         │
│ Order Number: [ORD-00?] (auto-incr)    │
│                                         │
│ CUSTOMER DETAILS                        │
│ Name: [_____________________]           │
│ Email: [____________________]           │
│ Phone: [____________________]           │
│ Address: [__________________]           │
│                                         │
│ ADD ITEMS                               │
│ ┌──────────────────────────────┐       │
│ │ SKU    | Product | Qty | Price│       │
│ ├──────────────────────────────┤       │
│ │SKU-001 | Widget A | 50  | 100 │       │
│ │SKU-002 | Gadget B | 30  | 150 │ [X]   │
│ │        |          |     |     │ [+]   │
│ └──────────────────────────────┘       │
│                                         │
│ Total Amount: 12,500 KES                │
│ Notes: [____________________________]   │
│                                         │
│ [Cancel] [Create Order]                 │
└─────────────────────────────────────────┘
```

---

## 3️⃣ RECEIVING MODEL

**File:** Receiving.js

### Fields & Types
```javascript
{
  receivingNumber: String (unique)       // Unique doc ID (e.g., REC-001)
  supplier: {
    name: String
    contact: String
    email: String
  },
  purchaseOrder: String                  // PO reference
  items: [{
    sku: String
    productName: String
    expectedQuantity: Number             // What we ordered
    receivedQuantity: Number             // What actually arrived
    batchNumber: String                  // Batch to store
    manufactureDate: Date
    expiryDate: Date
    storageLocationCode: String          // Shelf location
    status: Enum [5 states]              // pending, received, inspected, accepted, rejected
    notes: String
  }],
  receivingStatus: Enum [4 states]       // pending, in_progress, completed, rejected
  
  // Tracking
  receivedBy: User ref                   // Receiving officer
  inspectedBy: User ref                  // Inspector
  approvedBy: User ref                   // Approver
  
  // Timestamps
  receivedDate: Date (default: now)
  inspectionDate: Date
  approvalDate: Date
  notes: String
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

### Receiving Status Workflow
```
pending → in_progress → completed (updates inventory)
                    ↓
                  rejected
```

### Relationships
```
Receiving → User (receivedBy: Receiving Officer)
Receiving → User (inspectedBy: Inspector)
Receiving → User (approvedBy: Approver)
Receiving → Inventory (when completed, creates/updates batches)
Receiving → StockMovement (creates RECEIVE entries)
```

### Purpose
Track incoming goods from suppliers. Verify quantities, inspect quality, and update inventory.

### Frontend UI Representation

**Receiving List View:**
```
┌─────────────────────────────────────────────────────────────┐
│ Receiving Documents                  [Create Receiving] │
├─────────────────────────────────────────────────────────────┤
│ #     | Supplier     | Status       | Items | Received │
├─────────────────────────────────────────────────────────────┤
│REC-001| Supplier A   | ⏳ Pending    | 5     | 2026-04-04│
│REC-002| Supplier B   | 👁 Inspected | 8     | 2026-04-03│
│REC-003| Supplier C   | ✅ Completed | 12    | 2026-04-02│
│REC-004| Supplier D   | ❌ Rejected  | 3     | 2026-04-01│
└─────────────────────────────────────────────────────────────┘
```

**Receiving Detail View:**
```
╌──────────────────────────────────────╌
│ Receiving: REC-001                   │
│ Status: ⏳ IN PROGRESS               │
╌──────────────────────────────────────╌
│ SUPPLIER DETAILS                     │
│ ├─ Name: Supplier A                  │
│ ├─ Contact: 0700000000               │
│ └─ Email: supplier@a.com             │
│                                      │
│ PO Reference: PO-001                 │
│ Received Date: 2026-04-04 09:00      │
│                                      │
│ ITEMS RECEIVED                       │
│ ├─ SKU-001: Widget A                 │
│ │  Expected: 100 | Received: 95      │
│ │  Batch: BATCH-001                  │
│ │  Expiry: 2027-01-01                │
│ │  Location: SHELF-A1                │
│ │  Status: ✅ received               │
│ │                                    │
│ ├─ SKU-002: Widget B                 │
│ │  Expected: 50 | Received: 48       │
│ │  Batch: BATCH-002                  │
│ │  Status: ✅ received               │
│ │                                    │
│ INSPECTION                           │
│ Inspected By: [John Doe]             │
│ Inspection Notes: 2 units damaged    │
│ Inspection Date: 2026-04-04 10:30    │
│                                      │
│ APPROVAL                             │
│ Approved By: [Jane Smith]            │
│ Approval Date: 2026-04-04 11:00      │
│                                      │
│ [Inspect Goods] [Accept] [Reject]    │
╌──────────────────────────────────────╌
```

**Receiving Inspection Flow:**
```
STEP 1: Create Receiving
  ↓
STEP 2: Update Received Quantities
  ├─ Input actual quantities received
  ├─ Note discrepancies
  └─ Status → in_progress
  ↓
STEP 3: Inspect Goods
  ├─ Review quality
  ├─ Add inspection notes
  └─ Mark each item as inspected
  ↓
STEP 4: Accept or Reject
  ├─ ACCEPT → Creates/updates inventory batches
  │           Creates stock movement records
  │           Status → completed
  │
  └─ REJECT → Mark all items as rejected
              Status → rejected
```

---

## 4️⃣ INVENTORY MODEL

**File:** Inventory.js

### Fields & Types
```javascript
{
  sku: String (unique)                  // Stock Keeping Unit
  productName: String
  category: String                      // Product category
  reorderLevel: Number                  // Min qty before reorder
  batches: [{
    batchNumber: String                 // Batch identifier
    quantity: Number                    // Current stock in batch
    manufactureDate: Date
    expiryDate: Date
    storageLocationCode: String         // Shelf/bin location
  }],
  
  // Virtual field (calculated)
  totalQuantity: Number                 // Sum of all batch quantities
  
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

### Key Features
- **Multiple Batches:** One SKU can have multiple batches (FIFO dispatch)
- **Virtual totalQuantity:** Automatically calculated from batches
- **Batch Tracking:** Know exactly which batch is where & when expires
- **FIFO Dispatch:** Oldest batches dispatched first

### Relationships
```
Inventory ← Receiving (when receiving is accepted)
Inventory → StockMovement (every movement logged)
Inventory ← Order Items (picked from inventory)
```

### Purpose
Central stock database. Track what we have, where it is, when it expires, and how much to keep in stock.

### Frontend UI Representation

**Inventory List View:**
```
┌──────────────────────────────────────────────────────────────┐
│ Inventory                            [Add New Item]        │
├──────────────────────────────────────────────────────────────┤
│ SKU    | Product  | Category   | Stock | Reorder | Status    │
├──────────────────────────────────────────────────────────────┤
│SKU-001 │ Widget A │ Hardware   │ 150   │ 20      │ ✅ OK     │
│SKU-002 │ Widget B │ Hardware   │ 8     │ 20      │ ⚠️  LOW   │
│SKU-003 │ Gadget C │ Electronics│ 250   │ 50      │ ✅ OK     │
│SKU-004 │ Device D │ Electronics│ 5     │ 30      │ 🔴 CRITICAL│
└──────────────────────────────────────────────────────────────┘
```

**Inventory Detail Card:**
```
╌──────────────────────────────────────╌
│ SKU-001: Widget A                    │
╌──────────────────────────────────────╌
│ Category: Hardware                   │
│ Reorder Level: 20 units              │
│ TOTAL STOCK: 150 units               │
│                                      │
│ BATCHES (FIFO - Oldest First)        │
│ ┌──────────────────────────────────┐ │
│ │ Batch      │ Qty │ Location │ Exp │ │
│ ├──────────────────────────────────┤ │
│ │BATCH-001   │ 80  │ SHELF-A1 │ 2027│ │
│ │BATCH-002   │ 70  │ SHELF-A2 │ 2026│ │
│ └──────────────────────────────────┘ │
│                                      │
│ REORDER STATUS                       │
│ Current: 150 units                   │
│ Required: 20 units                   │
│ Status: ✅ SAFE                      │
│                                      │
│ [Edit] [Delete] [View History]       │
╌──────────────────────────────────────╌
```

**Inventory Matrix Dashboard:**
```
┌─────────────────────────────────────────────────────┐
│ INVENTORY AT A GLANCE                              │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Total Items: 45 SKUs                                │
│ ├─ ✅ Healthy Stock: 32 SKUs (71%)                 │
│ ├─ ⚠️  Low Stock: 10 SKUs (22%)                     │
│ └─ 🔴 Critical: 3 SKUs (7%)                        │
│                                                     │
│ Total Units in Warehouse: 8,450 units               │
│ Average Stock Value: $250 per SKU                   │
│                                                     │
│ EXPIRY ALERTS                                       │
│ ├─ Expired: 2 batches (50 units)                   │
│ ├─ Expiring in 30 days: 8 batches (450 units)      │
│ └─ Safe: 35 batches (7,950 units)                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 5️⃣ STOCK MOVEMENT MODEL

**File:** StockMovement.js

### Fields & Types
```javascript
{
  sku: String                           // Which product
  movementType: Enum [3 types]          // RECEIVE, DISPATCH, TRANSFER
  quantity: Number                      // How many units
  user: User ref                        // Who did it
  batchNumber: String                   // Which batch
  
  // For transfers only
  sourceBatchNumber: String
  destinationBatchNumber: String
  
  createdAt: Date (auto)                // When it happened
  updatedAt: Date (auto)
}
```

### Movement Types
```
RECEIVE    → Stock came in from supplier/receiving
DISPATCH   → Stock went out for orders (picking)
TRANSFER   → Stock moved between batches (internal)
```

### Relationships
```
StockMovement ← User (who performed action)
StockMovement → Inventory (references SKU)
StockMovement → Receiving (automatic when accepting)
StockMovement → Order (automatic when picking)
```

### Purpose
Complete audit trail. Answer: "What happened to item X?", "Who moved it?", "When?"

### Frontend UI Representation

**Stock Movement History:**
```
┌──────────────────────────────────────────────────────────────┐
│ Stock Movement History (SKU-001)     [Export CSV]          │
├──────────────────────────────────────────────────────────────┤
│ Date       │ Type      │ Qty │ User       │ Batch      │ Ref  │
├──────────────────────────────────────────────────────────────┤
│2026-04-04  │ RECEIVE   │ 100 │ John Doe   │BATCH-001   │REC-5 │
│2026-04-04  │ DISPATCH  │ 50  │ Jane Smith │BATCH-001   │ORD-1 │
│2026-04-03  │ TRANSFER  │ 30  │ Mike K.    │B-001→B-002 │ -    │
│2026-04-02  │ DISPATCH  │ 20  │ Jane Smith │BATCH-002   │ORD-2 │
│2026-04-01  │ RECEIVE   │ 80  │ John Doe   │BATCH-002   │REC-4 │
└──────────────────────────────────────────────────────────────┘
```

**Stock Audit Trail (Detailed):**
```
╌──────────────────────────────────────╌
│ AUDIT TRAIL: SKU-001 Widget A        │
╌──────────────────────────────────────╌
│                                      │
│ MOVEMENT 1                           │
│ ├─ Date: 2026-04-04 09:30            │
│ ├─ Type: 📥 RECEIVE                  │
│ ├─ Quantity: +100 units              │
│ ├─ Batch: BATCH-001                  │
│ ├─ Officer: John Doe                 │
│ └─ Source: REC-005 (From Supplier A) │
│                                      │
│ MOVEMENT 2                           │
│ ├─ Date: 2026-04-04 11:00            │
│ ├─ Type: 🚚 DISPATCH                 │
│ ├─ Quantity: -50 units               │
│ ├─ Batch: BATCH-001                  │
│ ├─ Officer: Jane Smith               │
│ └─ Ref: ORD-001 (Order Picking)      │
│                                      │
│ MOVEMENT 3                           │
│ ├─ Date: 2026-04-03 14:00            │
│ ├─ Type: 🔄 TRANSFER                 │
│ ├─ Quantity: 30 units                │
│ ├─ From: BATCH-001 (SHELF-A1)        │
│ ├─ To: BATCH-002 (SHELF-B2)          │
│ └─ Officer: Mike K.                  │
│                                      │
│ CURRENT STATUS                       │
│ ├─ BATCH-001: 20 units (SHELF-A1)    │
│ ├─ BATCH-002: 70 units (SHELF-B2)    │
│ └─ TOTAL: 150 units                  │
│                                      │
╌──────────────────────────────────────╌
```

---

## 📊 DATA MODEL RELATIONSHIPS DIAGRAM

```
                          ┌──────────┐
                          │  USER    │
                          └──────────┘
                          (7 roles)
                               │
                    ┌─────────┬┼┬─────────┐
                    │         │ │         │
                    ▼         ▼ ▼         ▼
              ┌─────────┐ ┌────────┐ ┌───────────┐
              │ ORDER   │ │RECEIVING│ │STOCK-MOVE │
              └─────────┘ └────────┘ └───────────┘
                    │         │           │
                    │         │           │
                    └──┬──────┴─────────┬─┘
                       │                │
                       ▼                ▼
                  ┌──────────────┐
                  │ INVENTORY    │
                  └──────────────┘
                  (with batches)
```

### Workflow
```
SALES STAFF creates ORDER
      ↓
ORDER → Picker (RECEIVE stock movement)
      ↓
ORDER → Packer (moves inventory)
      ↓
ORDER → Dispatch Officer (DISPATCH stock movement)
      ↓
Delivered

SEPARATELY:
Receiving Officer receives goods
      ↓
Creates RECEIVING doc
      ↓
Inspects & Accepts
      ↓
RECEIVE stock movement created
      ↓
INVENTORY updated with new batches
```
---
## 🎯 Summary: How Data Appears in Frontend

| Model | Main UI Component | Purpose |
|-------|-------------------|---------|
| **User** | User profiles, role assignment, login | Authentication, authorization |
| **Order** | Order dashboard, order cards, workflow status | Track orders through pipeline |
| **Receiving** | Receiving list, inspection forms | Manage incoming goods |
| **Inventory** | Stock grid, low-stock alerts, batch view | See what we have & where |
| **StockMovement** | Audit trail, history charts, reports | Answer "What happened?" questions |

---

This is everything about the data structure and how it should be visualized on the frontend! 🚀


# FRONTEND ARCHITECTURE DESIGN

Based on your 54-endpoint backend, here's a production-ready frontend structure.

---

## 📋 PAGE MAP (By Role)

### All Roles Have Access To:
```
1. Login / Register
2. Dashboard (role-specific)
3. Profile / Settings
```

### Warehouse Manager (Full Access)
```
✅ Dashboard (Executive)
✅ Orders (CRUD)
✅ Picking (Assign, Monitor)
✅ Packing (Assign, Monitor)
✅ Dispatch (Facilitate, Bulk Actions)
✅ Receiving (Manage, Approve)
✅ Inventory (Complete Management)
✅ Stock Audit (Reports)
✅ User Management
```

### Inventory Manager
```
✅ Dashboard (Inventory)
✅ Inventory (View, Edit)
✅ Stock Audit (Conduct Audits)
✅ Stock History (View)
✅ Reports (Accuracy, Critical Items)
```

### Picker
```
✅ Dashboard (Task List)
✅ Picklist (View Pending Orders)
✅ My Assignments (Assigned Orders)
✅ Mark Items Picked
✅ Pick History
```

### Packer
```
✅ Dashboard (Task List)
✅ Packing Ready (Orders to Pack)
✅ My Assignments (Assigned Orders)
✅ Confirm Packed Items
✅ Pack History
```

### Dispatch Officer
```
✅ Dashboard (Shipment Status)
✅ Ready for Dispatch (Packed Orders)
✅ My Dispatches (Shipped Orders)
✅ Confirm Shipment
✅ Mark Delivered
✅ Bulk Dispatch
```

### Receiving Officer
```
✅ Dashboard (Receiving Tasks)
✅ Receiving Documents (List)
✅ Create Receiving
✅ Update Quantities
✅ Inspect Goods
✅ Accept/Reject Shipments
```

### Sales Staff
```
✅ Dashboard (My Orders)
✅ Create Order
✅ View My Orders
✅ Track Order Status
✅ Check Inventory Availability
```

---

## 🏗️ FRONTEND FOLDER STRUCTURE

```
frontend/
│
├── public/
│   ├── index.html
│   └── favicon.ico
│
├── src/
│   ├── index.js
│   ├── App.jsx                          # Main router setup
│   │
│   ├── config/
│   │   └── api.js                       # Axios instance with interceptors
│   │
│   ├── context/
│   │   ├── AuthContext.js               # Auth state (token, user, login, logout)
│   │   └── NotificationContext.js       # Toast notifications (success, error, warning)
│   │
│   ├── hooks/
│   │   ├── useAuth.js                   # Access auth context
│   │   └── useApi.js                    # Reusable API call hook
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── Layout.jsx               # Main layout wrapper
│   │   │   ├── Sidebar.jsx              # Navigation sidebar
│   │   │   ├── Navbar.jsx               # Top navbar with user menu
│   │   │   ├── Button.jsx               # Reusable button
│   │   │   ├── Card.jsx                 # Reusable card component
│   │   │   ├── Modal.jsx                # Reusable modal
│   │   │   ├── Table.jsx                # Reusable data table
│   │   │   ├── Form.jsx                 # Reusable form wrapper
│   │   │   ├── Input.jsx                # Form inputs
│   │   │   ├── Select.jsx               # Dropdown
│   │   │   ├── LoadingSpinner.jsx       # Loading indicator
│   │   │   └── ErrorAlert.jsx           # Error display
│   │   │
│   │   ├── auth/
│   │   │   ├── LoginForm.jsx            # Login/Register form
│   │   │   └── RegisterModal.jsx        # New user registration
│   │   │
│   │   ├── dashboard/
│   │   │   ├── DashboardLayout.jsx
│   │   │   ├── WarehouseManagerDash.jsx # Executive overview
│   │   │   ├── InventoryManagerDash.jsx # Stock focus
│   │   │   ├── PickerDash.jsx           # Task list
│   │   │   ├── PackerDash.jsx           # Task list
│   │   │   ├── DispatchDash.jsx         # Shipment status
│   │   │   ├── ReceivingDash.jsx        # Receiving tasks
│   │   │   └── SalesStaffDash.jsx       # My orders
│   │   │
│   │   ├── orders/
│   │   │   ├── OrderList.jsx            # All orders (table)
│   │   │   ├── OrderDetail.jsx          # Single order detail
│   │   │   ├── OrderForm.jsx            # Create/Edit order form
│   │   │   ├── OrderFilters.jsx         # Filter & search
│   │   │   ├── MyOrders.jsx             # Sales staff orders
│   │   │   └── OrderTimeline.jsx        # Status timeline
│   │   │
│   │   ├── picking/
│   │   │   ├── PicklistView.jsx         # All pending orders
│   │   │   ├── PickingAssignment.jsx    # Assign pickers
│   │   │   ├── PickingForm.jsx          # Mark items picked
│   │   │   ├── MyPickingTasks.jsx       # Picker's assigned orders
│   │   │   └── PickingHistory.jsx       # Completed picks
│   │   │
│   │   ├── packing/
│   │   │   ├── PackingReady.jsx         # Orders ready for packing
│   │   │   ├── PackingAssignment.jsx    # Assign packers
│   │   │   ├── PackingForm.jsx          # Confirm packed items
│   │   │   ├── MyPackingTasks.jsx       # Packer's assigned orders
│   │   │   └── PackingHistory.jsx       # Completed packs
│   │   │
│   │   ├── dispatch/
│   │   │   ├── DispatchReady.jsx        # Packed orders ready
│   │   │   ├── ConfirmShipment.jsx      # Ship single order
│   │   │   ├── BulkDispatch.jsx         # Ship multiple orders
│   │   │   ├── MyDispatches.jsx         # Officer's shipped orders
│   │   │   ├── MarkDelivered.jsx        # Delivery confirmation
│   │   │   └── TrackingForm.jsx         # Add tracking number
│   │   │
│   │   ├── receiving/
│   │   │   ├── ReceivingList.jsx        # All receiving docs
│   │   │   ├── ReceivingForm.jsx        # Create receiving
│   │   │   ├── ReceivingDetail.jsx      # View/manage receiving
│   │   │   ├── UpdateQuantities.jsx     # Input received qtys
│   │   │   ├── InspectForm.jsx          # Inspection checklist
│   │   │   └── AcceptReject.jsx         # Approve/reject flow
│   │   │
│   │   ├── inventory/
│   │   │   ├── InventoryList.jsx        # Inventory grid
│   │   │   ├── InventoryDetail.jsx      # SKU detail view
│   │   │   ├── InventoryForm.jsx        # Create/edit inventory
│   │   │   ├── BatchList.jsx            # View batches
│   │   │   ├── LowStockAlert.jsx        # Low stock warnings
│   │   │   └── ExpiryAlert.jsx          # Expiry warnings
│   │   │
│   │   ├── audit/
│   │   │   ├── AuditList.jsx            # Stock movements history
│   │   │   ├── ConductAudit.jsx         # Start new audit
│   │   │   ├── SubmitAudit.jsx          # Input physical counts
│   │   │   ├── DiscrepancyReport.jsx    # Audit discrepancies
│   │   │   ├── AccuracyReport.jsx       # Accuracy metrics
│   │   │   └── CriticalItems.jsx        # Low stock & expiry
│   │   │
│   │   ├── users/
│   │   │   ├── UserList.jsx             # All users (admin only)
│   │   │   ├── UserForm.jsx             # Add/edit user
│   │   │   ├── RoleSelector.jsx         # Role selection
│   │   │   └── UserDetail.jsx           # User profile
│   │   │
│   │   └── profile/
│   │       ├── ProfileView.jsx          # User profile
│   │       ├── ChangePassword.jsx       # Password change
│   │       └── Settings.jsx             # User settings
│   │
│   ├── pages/
│   │   ├── LoginPage.jsx                # Login/register page
│   │   ├── DashboardPage.jsx            # Dashboard router
│   │   ├── OrdersPage.jsx               # Orders container
│   │   ├── PickingPage.jsx              # Picking container
│   │   ├── PackingPage.jsx              # Packing container
│   │   ├── DispatchPage.jsx             # Dispatch container
│   │   ├── ReceivingPage.jsx            # Receiving container
│   │   ├── InventoryPage.jsx            # Inventory container
│   │   ├── AuditPage.jsx                # Audit container
│   │   ├── UsersPage.jsx                # Users container (admin)
│   │   ├── ProfilePage.jsx              # Profile container
│   │   └── NotFoundPage.jsx             # 404 page
│   │
│   ├── services/
│   │   ├── authService.js               # Auth API calls
│   │   ├── orderService.js              # Order API calls
│   │   ├── pickingService.js            # Picking API calls
│   │   ├── packingService.js            # Packing API calls
│   │   ├── dispatchService.js           # Dispatch API calls
│   │   ├── receivingService.js          # Receiving API calls
│   │   ├── inventoryService.js          # Inventory API calls
│   │   ├── auditService.js              # Audit API calls
│   │   └── userService.js               # User API calls
│   │
│   ├── utils/
│   │   ├── formatters.js                # Date, currency, status formatting
│   │   ├── validators.js                # Form validation rules
│   │   └── constants.js                 # Enums, labels, messages
│   │
│   ├── styles/
│   │   ├── index.css                    # Global styles
│   │   ├── variables.css                # CSS variables (colors, sizes)
│   │   └── responsive.css               # Mobile responsive
│   │
│   └── App.css

└── package.json
```

---

## 🎨 UI LAYOUT & NAVIGATION

### 1. LOGIN PAGE (Public)

```
┌─────────────────────────────────────────┐
│                                         │
│     MUTHOKINJU WAREHOUSE SYSTEM         │
│                                         │
│     ┌──────────────────────────────┐   │
│     │ LOGIN                        │   │
│     ├──────────────────────────────┤   │
│     │ Email: [_______________]     │   │
│     │ Password: [_______________]  │   │
│     │ [Remember Me]               │   │
│     │ [Login] [Register]          │   │
│     │ Forgot Password?            │   │
│     └──────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

**Component Structure:**
```jsx
LoginPage/
├── LoginForm
│   ├── EmailInput
│   ├── PasswordInput
│   ├── RememberMe (checkbox)
│   └── LoginButton
└── RegisterModal
    ├── NameInput
    ├── EmailInput
    ├── PasswordInput
    ├── RoleSelect
    ├── DepartmentSelect
    └── RegisterButton
```

**API Endpoints Used:**
```
POST /auth/login
POST /auth/register
```

---

### 2. MAIN LAYOUT (Authenticated)

```
┌──────────────────────────────────────────────────────────────┐
│ Muthokinju Warehouse    🔍 Search    👤 John Doe  🔔 🚪 Logout│
├──────────────┬───────────────────────────────────────────────┤
│              │                                               │
│ 📊 Dashboard │               MAIN CONTENT AREA               │
│              │                                               │
│ 📦 Orders    │  ┌─────────────────────────────────────────┐│
│              │  │  Page Title                             ││
│ 🎯 Picking   │  ├─────────────────────────────────────────┤│
│              │  │                                         ││
│ 📦 Packing   │  │  Filters, Data, Forms                   ││
│              │  │                                         ││
│ 🚚 Dispatch  │  │                                         ││
│              │  └─────────────────────────────────────────┘│
│ 📥 Receiving │                                               │
│              │                                               │
│ 📊 Inventory │                                               │
│              │                                               │
│ 📋 Audit     │                                               │
│              │                                               │
│ 👥 Users*    │  (* Warehouse Manager only)                  │
│              │                                               │
│ ⚙️ Settings  │                                               │
│              │                                               │
└──────────────┴───────────────────────────────────────────────┘
```

**Sidebar Component** (Dynamic based on role):
```jsx
<Sidebar>
  <NavItem href="/dashboard" icon={<DashboardIcon />} label="Dashboard" />
  
  {hasOrderAccess && (
    <NavItem href="/orders" icon={<OrderIcon />} label="Orders" />
  )}
  
  {hasPicking && (
    <NavItem href="/picking" icon={<PickIcon />} label="Picking" />
  )}
  
  {(isWarehouseManager || isInventoryManager) && (
    <NavItem href="/inventory" icon={<BoxIcon />} label="Inventory" />
  )}
  
  {isWarehouseManager && (
    <NavItem href="/users" icon={<UsersIcon />} label="Users" />
  )}
  
  <NavDivider />
  <NavItem href="/profile" icon={<ProfileIcon />} label="Profile" />
  <NavItem onClick={logout} icon={<LogoutIcon />} label="Logout" />
</Sidebar>
```

---

## 📊 PAGE DESIGNS BY FEATURE

### 3. ORDERS PAGE

**List View (Warehouse Manager & Sales Staff):**
```
┌─────────────────────────────────────────────────────────────┐
│ Orders                                   [Create Order]    │
├─────────────────────────────────────────────────────────────┤
│ Filters:                                                    │
│ [Status ▼] [Date Range] [Search] [Customer Name]           │
├─────────────────────────────────────────────────────────────┤
│ #     │ Customer   │ Items │ Status    │ Assigned │ Amount  │
├─────────────────────────────────────────────────────────────┤
│ORD-1  │ Acme Corp  │ 5     │ 🔄 Picking│ John D.   │ 5,000  │
│ORD-2  │ TechFlow   │ 3     │ ✅ Picked │ Jane S.   │ 3,500  │
│ORD-3  │ SafeBox    │ 8     │ 📦 Packing│ Mike K.   │ 8,200  │
│ORD-4  │ RetailPro  │ 12    │ 🚚 Shipped│ Dispatch  │ 12,500 │
│ORD-5  │ OfficeMax  │ 7     │ ✔️ Deliver│ Dispatch  │ 7,200  │
└─────────────────────────────────────────────────────────────┘
```

**API Endpoints Used:**
```
GET /orders
GET /orders/my-orders (Sales Staff only)
POST /orders (Create)
PATCH /orders/:id (Update)
DELETE /orders/:id (Cancel)
```

**Component Hierarchy:**
```jsx
OrdersPage
├── OrderFilters
│   ├── StatusFilter
│   ├── DateRangeFilter
│   ├── SearchInput
│   └── ApplyButton
├── OrderList
│   ├── Table
│   │   └── OrderRow (clickable)
│   │       ├── OrderNumber
│   │       ├── Customer
│   │       ├── Status Badge
│   │       └── Actions
│   └── Pagination
├── CreateOrderButton
└── OrderDetailModal
    ├── OrderInfo
    ├── ItemsList
    ├── AssignStaff (if permissions)
    └── ActionButtons
```

---

### 4. PICKING PAGE

**Picklist View (Picker & Warehouse Manager):**
```
┌─────────────────────────────────────────────────────────────┐
│ Picklist (Pending Orders)                                  │
├─────────────────────────────────────────────────────────────┤
│ Total Pending: 15 orders │ My Assigned: 3 orders           │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Order: ORD-001 | Customer: Acme Corp                   ││
│ ├─────────────────────────────────────────────────────────┤│
│ │ Items to Pick:                                          ││
│ │ ┌─────────────────────────────────────────────────────┐││
│ │ │ ☐ SKU-001 × 50 [Widget A]      Status: ⏳ Pending   │││
│ │ | └─ Location: SHELF-A1, Batch: BATCH-001             │││
│ │ │ ☐ SKU-002 × 30 [Gadget B]      Status: ⏳ Pending   │││
│ │ | └─ Location: SHELF-B2, Batch: BATCH-002             │││
│ │ └─────────────────────────────────────────────────────┘││
│ │ [Assign to Me] [View Details] [Mark as Picked]        ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Order: ORD-002 | Customer: TechFlow                    ││
│ │ ...                                                     ││
│ └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**API Endpoints Used:**
```
GET /picking/list/pending
GET /picking/assigned
POST /picking/assign
PATCH /picking/:orderId/mark-picked
PATCH /picking/:orderId/status
```

**Component Hierarchy:**
```jsx
PickingPage
├── PicklistTabs
│   ├── AllPending (all orders)
│   └── MyAssigned (current picker's)
├── OrderCardList
│   └── OrderCard
│       ├── OrderHeader
│       ├── ItemsList
│       │   └── ItemRow (with location & batch)
│       └── ActionButtons
│           ├── AssignToMe (show if unassigned)
│           ├── MarkPicked
│           └── ViewDetails
└── PickingModal
    ├── ItemCheckboxes
    ├── NotesField
    └── ConfirmButton
```

---

### 5. PACKING PAGE

**Similar to Picking but for Packing:**
```
┌─────────────────────────────────────────────────────────────┐
│ Packing (Orders Ready for Packing)                         │
├─────────────────────────────────────────────────────────────┤
│ Ready to Pack: 8 orders │ My Assignments: 2 orders         │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Order: ORD-002 | Status: ✅ PICKED | Picked At: 10:30 ││
│ ├─────────────────────────────────────────────────────────┤│
│ │ Items to Pack:                                          ││
│ │ ┌─────────────────────────────────────────────────────┐││
│ │ │ ☐ SKU-001 × 50 [Widget A]      Status: ✅ Picked    │││
│ │ │ ☐ SKU-002 × 30 [Gadget B]      Status: ✅ Picked    │││
│ │ └─────────────────────────────────────────────────────┘││
│ │ [Assign to Me] [Confirm Packed] [View Details]        ││
│ └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**API Endpoints Used:**
```
GET /packing/list/ready
GET /packing/assigned
POST /packing/assign
PATCH /packing/:orderId/confirm-packed
PATCH /packing/:orderId/status
GET /packing/:orderId/details
```

---

### 6. DISPATCH PAGE

**Dispatch Dashboard:**
```
┌─────────────────────────────────────────────────────────────┐
│ Dispatch                                                    │
├─────────────────────────────────────────────────────────────┤
│ Ready: 5 | This Month: 124 | Delivered: 118                │
├─────────────────────────────────────────────────────────────┤
│ [Single Dispatch] [Bulk Dispatch] [View Dispatched]        │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Order: ORD-003 | Status: 📦 PACKED | Packed At: 14:00 ││
│ │ Customer: SafeBox Ltd | Total: 8,200 KES              ││
│ ├─────────────────────────────────────────────────────────┤│
│ │ [Confirm Shipment]                                      ││
│ │ └─ Tracking Number: [TRACK-_______]                    ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ BULK DISPATCH (Select multiple):                           │
│ ☐ ORD-004  ☐ ORD-005  ☐ ORD-006                           │
│ [Approve & Dispatch All] [Add Tracking Numbers]            │
└─────────────────────────────────────────────────────────────┘
```

**API Endpoints Used:**
```
GET /dispatch/list/ready
GET /dispatch/dispatched
PATCH /dispatch/:orderId/confirm-shipment
POST /dispatch/bulk/approve-dispatch
PATCH /dispatch/:orderId/mark-delivered
GET /dispatch/:orderId/details
```

---

### 7. RECEIVING PAGE

**Receiving Workflow:**
```
STEP 1: List Receiving Documents
┌─────────────────────────────────┐
│ Receiving Documents             │
│ [Create New Receiving]          │
├─────────────────────────────────┤
│ REC-001 | Supplier A | ⏳ In Progress
│ REC-002 | Supplier B | ✅ Completed
│ REC-003 | Supplier C | 👁 Inspected
└─────────────────────────────────┘

STEP 2: Create/Detail View
┌──────────────────────────────────┐
│ Receiving: REC-001               │
│ Supplier: Supplier A             │
│ PO: PO-001                       │
├──────────────────────────────────┤
│ ITEMS RECEIVED                   │
│ ┌────────────────────────────────┤
│ │ ☐ SKU-001: Expected 100       │
│ │   Received: [95]              │
│ │   Batch: [BATCH-001]          │
│ │   Expiry: [2027-01-01]        │
│ │   Location: [SHELF-A1]        │
│ │   Notes: [2 units damaged]    │
│ └────────────────────────────────┘
├──────────────────────────────────┤
│ [Save Quantities] [Inspect] or   │
│ [Accept] [Reject]               │
└──────────────────────────────────┘
```

**API Endpoints Used:**
```
GET /receiving/
GET /receiving/:id
POST /receiving/
PATCH /receiving/:id/update-quantities
PATCH /receiving/:id/inspect
PATCH /receiving/:id/accept
PATCH /receiving/:id/reject
```

---

### 8. INVENTORY PAGE

**Inventory Grid:**
```
┌──────────────────────────────────────────────────────────────┐
│ Inventory                            [Add New Item]        │
├──────────────────────────────────────────────────────────────┤
│ Filters: [Category ▼] [Status ▼] [Search SKU]              │
├──────────────────────────────────────────────────────────────┤
│ SKU    │ Product  │ Category   │ Stock │ Reorder │ Status   │
├──────────────────────────────────────────────────────────────┤
│SKU-001 │Widget A  │ Hardware   │ 150   │ 20      │ ✅ OK    │
│SKU-002 │Widget B  │ Hardware   │ 8     │ 20      │ ⚠️ LOW   │
│SKU-003 │Gadget C  │ Electronics│ 250   │ 50      │ ✅ OK    │
│SKU-004 │Device D  │ Electronics│ 5     │ 30      │ 🔴 CRIT  │
└──────────────────────────────────────────────────────────────┘

Click SKU-001 → Inventory Detail:
┌──────────────────────────────────┐
│ SKU-001: Widget A                │
│ Category: Hardware               │
│ Reorder Level: 20 units          │
├──────────────────────────────────┤
│ TOTAL STOCK: 150 units           │
│                                  │
│ BATCHES (Oldest → Newest)        │
│ ┌────────────────────────────────┤
│ │ BATCH-001 │ 80 │ SHELF-A1     │
│ │ BATCH-002 │ 70 │ SHELF-A2     │
│ └────────────────────────────────┘
│                                  │
│ [Edit] [View History] [Delete]   │
└──────────────────────────────────┘
```

**API Endpoints Used:**
```
GET /inventory/
GET /inventory/:sku
POST /inventory/
PATCH /inventory/:sku
DELETE /inventory/:sku
POST /stock/receive
POST /stock/dispatch
POST /stock/transfer
GET /stock/history
```

---

### 9. AUDIT & REPORTS PAGE

**Stock Audit Interface:**
```
┌────────────────────────────────────────────────────┐
│ Stock Audit & Reports                             │
├────────────────────────────────────────────────────┤
│ [Conduct Audit] [View Accuracy Report] [Critical] │
├────────────────────────────────────────────────────┤

CONDUCT AUDIT:
┌────────────────────────────────────┐
│ Select SKUs to Audit               │
│ ☐ SKU-001 | 150 units (System)    │
│ ☐ SKU-002 | 8 units (System)      │
│ ☐ SKU-003 | 250 units (System)    │
│ [Start Audit]                      │
└────────────────────────────────────┘

AUDIT RESULTS (Input Physical Count):
┌────────────────────────────────────┐
│ SKU-001: System = 150              │
│ Physical Count: [145] units        │
│ Variance: -5 units (-3.3%)         │
│ Notes: [5 units missing]           │
│                                    │
│ SKU-002: System = 8                │
│ Physical Count: [8] units          │
│ Variance: 0 units (0%)             │
│                                    │
│ [Submit Results]                   │
└────────────────────────────────────┘

DISCREPANCY REPORT:
┌────────────────────────────────────┐
│ SKU    │ System │ Physical │ Var   │
├────────────────────────────────────┤
│SKU-001 │ 150    │ 145      │ -5    │
│SKU-003 │ 250    │ 253      │ +3    │
└────────────────────────────────────┘
```

**API Endpoints Used:**
```
POST /audit/audit/conduct
POST /audit/audit/submit-results
GET /audit/history/movements
GET /audit/history/:sku
GET /audit/reports/accuracy
GET /audit/reports/audit-history
GET /audit/reports/critical-items
```

---

## 🧩 REACT COMPONENT ARCHITECTURE

### Global Context (State Management)

```jsx
// AuthContext - Handle login/logout/user state
export const AuthContext = createContext();

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('jwt_token'));
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('jwt_token', data.token);
      return data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('jwt_token');
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Usage in components
const { user, logout } = useAuth();
if (user?.role === 'Warehouse Manager') { /* show admin UI */ }
```

### Service Layer (API Abstraction)

```jsx
// authService.js
export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
  logout: () => api.post('/auth/logout'),
};

// orderService.js
export const orderService = {
  getAll: () => api.get('/orders'),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  update: (id, data) => api.patch(`/orders/${id}`, data),
  cancel: (id) => api.delete(`/orders/${id}`),
  getMy: () => api.get('/orders/my-orders'),
};

// Usage in components
const [orders, setOrders] = useState([]);
useEffect(() => {
  orderService.getAll().then(res => setOrders(res.data));
}, []);
```

### Reusable Hook Pattern

```jsx
// useApi.js - For loading, error handling
export const useApi = (apiCall, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await apiCall();
        setData(result.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, dependencies);

  return { data, loading, error };
};

// Usage
function OrdersList() {
  const { data: orders, loading, error } = useApi(() => orderService.getAll());
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;
  
  return <Table data={orders} />;
}
```

---

## 🔐 ROUTING & PROTECTION

```jsx
// App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

function ProtectedRoute({ children, requiredRole }) {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" />;
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout><DashboardPage /></Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/orders" element={
            <ProtectedRoute requiredRole={['Warehouse Manager', 'Sales Staff']}>
              <Layout><OrdersPage /></Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/picking" element={
            <ProtectedRoute requiredRole={['Picker', 'Warehouse Manager']}>
              <Layout><PickingPage /></Layout>
            </ProtectedRoute>
          } />
          
          {/* More routes... */}
          
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

---

## 📊 DATA FLOW DIAGRAM

```
USER LOGIN
    ↓
[LoginForm] → POST /auth/login
    ↓
[AuthContext] stores token + user
    ↓
localStorage saves token
    ↓
Redirect to /dashboard
    ↓

PROTECTED REQUEST
    ↓
[Component] calls orderService.getAll()
    ↓
[api.js interceptor] adds "Authorization: Bearer <token>"
    ↓
GET /orders
    ↓
[Server] verifies token
    ↓
Response 200 with data
    ↓
[useApi hook] updates local state
    ↓
[Component] renders with data
    ↓

IF 401 UNAUTHORIZED
    ↓
[axios interceptor] catches it
    ↓
Clear token & redirect to /login
```

---

## 🎯 TECH STACK RECOMMENDATION

### Frontend (Production-Ready)

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "axios": "^1.3.0",
    "react-query": "^3.39.0",
    "zustand": "^4.3.0",
    "date-fns": "^2.29.0",
    "react-hook-form": "^7.40.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^3.1.0",
    "vite": "^4.1.0",
    "tailwindcss": "^3.2.0",
    "postcss": "^8.4.0"
  }
}
```

### UI Library Options
- **Tailwind CSS + Radix UI** (Headless, flexible)
- **Material-UI (MUI)** (Complete component library)
- **Shadcn/ui** (Copy-paste components)
- **Ant Design** (Enterprise-grade)

### Recommended Setup:
```
✅ Vite (Fast build)
✅ React Router v6 (Routing)
✅ Axios (HTTP client)
✅ React Query (Data fetching)
✅ Tailwind CSS (Styling)
✅ React Hook Form (Forms)
✅ date-fns (Date handling)
✅ Vitest + React Testing Library (Testing)
```

---

## ✅ IMPLEMENTATION ROADMAP

```
Phase 1: Foundation (Week 1)
├─ Setup Vite + React project
├─ Create API service layer
├─ Implement Auth/Login
├─ Setup routing & protected routes
└─ Create base Layout & Sidebar

Phase 2: Core Features (Weeks 2-3)
├─ Orders (CRUD)
├─ Picking workflow
├─ Packing workflow
├─ Dispatch workflow
└─ Basic styling (Tailwind)

Phase 3: Secondary Features (Weeks 4-5)
├─ Receiving workflow
├─ Inventory management
├─ Stock audit
├─ Reports & analytics
└─ User management

Phase 4: Polish (Week 6)
├─ Error handling
├─ Loading states
├─ Form validation
├─ Responsive design
├─ Testing
└─ Deployment
```

---

## 🚀 Quick Start Command

```bash
npm create vite@latest warehouse-frontend -- --template react
cd warehouse-frontend
npm install axios react-router-dom react-query date-fns react-hook-form
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm run dev
```

This frontend architecture is **production-ready**, **scalable**, and **matches your 54-endpoint backend perfectly**! 🎉

Similar code found with 1 license type
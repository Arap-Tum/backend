# Muthokinju Warehouse Management System - API Documentation

## System Overview

The Warehouse Management System has been designed with role-based access control (RBAC) and JWT authentication. The system supports 7 different user roles with specialized functionalities.

---

## User Roles & Permissions

### 1. **Warehouse Manager** (Admin)
- Full system access
- Approves and manages all operations
- Can assign tasks to other staff
- Can view all reports and analytics
- Can manage user accounts

### 2. **Inventory Manager**
- View and edit inventory data
- Conduct stock counts & audits
- Track stock movement history
- View expired and low stock alerts
- Generate accuracy reports

### 3. **Picker**
- View picklist (pending orders)
- Update picking status (picked/not picked)
- Mark items as picked
- View assigned orders

### 4. **Packer**
- View orders ready for packing
- Confirm packed items (packed/not packed)
- Update packing status
- View order details

### 5. **Dispatch Officer**
- View packed orders
- Confirm shipment of orders
- Generate tracking numbers
- Mark deliveries as complete
- Bulk dispatch operations

### 6. **Receiving Officer**
- Receive incoming goods (goods, quantity, date & time)
- Update inventory quantities
- Inspect received goods
- Accept or reject shipments

### 7. **Sales Staff**
- Create and track customer orders
- View order status (dashboard)
- Check inventory availability
- View their own created orders

---

## Authentication

### Base URL
```
https://muthokinju-warehouse-management-system.onrender.com/api
```

### JWT Token
- Tokens are sent in the `Authorization` header as: `Bearer <token>`
- Token expires in 24 hours
- Login again to get a new token

---

## API Endpoints

### 📋 Authentication Routes (`/auth`)

#### 1. Register User
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "Picker",
  "department": "Warehouse"
}

Valid Roles:
- Warehouse Manager
- Inventory Manager
- Picker
- Packer
- Dispatch Officer
- Receiving Officer
- Sales Staff

Valid Departments:
- Warehouse
- Sales
- Logistics

Response: {token, user}
```

#### 2. Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response: {token, user}
```

#### 3. Get Current User Profile
```
GET /api/auth/profile
Header: Authorization: Bearer <token>

Response: {user profile}
```

#### 4. Logout
```
POST /api/auth/logout
Header: Authorization: Bearer <token>

Response: {message: "Logged out successfully"}
```

---

### 📦 Orders Routes (`/orders`)
*Accessible by: Warehouse Manager, Sales Staff*

#### 1. Get All Orders
```
GET /api/orders
Header: Authorization: Bearer <token>

Response: [orders array]
```

#### 2. Get My Orders (Sales Staff Only)
```
GET /api/orders/my-orders
Header: Authorization: Bearer <token>

Response: [user's orders]
```

#### 3. Get Order by ID
```
GET /api/orders/{orderId}
Header: Authorization: Bearer <token>

Response: {order details}
```

#### 4. Create New Order (Sales Staff)
```
POST /api/orders
Header: Authorization: Bearer <token>
Content-Type: application/json

{
  "orderNumber": "ORD-001",
  "customer": {
    "name": "Jane Customer",
    "email": "jane@example.com",
    "phone": "0712345678",
    "address": "123 Main St"
  },
  "items": [
    {
      "sku": "SKU-001",
      "productName": "Product 1",
      "quantity": 5,
      "unitPrice": 100
    }
  ],
  "totalAmount": 500,
  "notes": "Rush order"
}

Response: {order created}
```

#### 5. Update Order
```
PATCH /api/orders/{orderId}
Header: Authorization: Bearer <token>
Content-Type: application/json

{
  "customer": {...},
  "items": [...],
  "totalAmount": 500
}

Response: {updated order}
```

#### 6. Cancel Order
```
DELETE /api/orders/{orderId}
Header: Authorization: Bearer <token>

Response: {cancelled order}
```

---

### 🎯 Picking Routes (`/picking`)
*Accessible by: Warehouse Manager, Picker*

#### 1. Get Picklist (All Pending Orders)
```
GET /api/picking/list/pending
Header: Authorization: Bearer <token>

Response: [picklist items]
```

#### 2. Get Assigned Picks (Current Picker)
```
GET /api/picking/assigned
Header: Authorization: Bearer <token>

Response: [assigned orders for picker]
```

#### 3. Assign Order to Picker (Warehouse Manager Only)
```
POST /api/picking/assign
Header: Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "64xxx",
  "pickerId": "64xxx"
}

Response: {assigned order}
```

#### 4. Mark Items as Picked
```
PATCH /api/picking/{orderId}/mark-picked
Header: Authorization: Bearer <token>
Content-Type: application/json

{
  "pickedItems": [
    {
      "sku": "SKU-001",
      "quantity": 5,
      "batchNumber": "BATCH-001"
    }
  ]
}

Response: {order with picked status}
```

#### 5. Update Picking Status
```
PATCH /api/picking/{orderId}/status
Header: Authorization: Bearer <token>
Content-Type: application/json

{
  "skus": ["SKU-001", "SKU-002"],
  "pickingStatus": "picked"
}

Valid Status: pending, picked, not_picked
Response: {updated order}
```

---

### 📮 Packing Routes (`/packing`)
*Accessible by: Warehouse Manager, Packer*

#### 1. Get Orders Ready for Packing
```
GET /api/packing/list/ready
Header: Authorization: Bearer <token>

Response: [packing list items]
```

#### 2. Get Assigned Packing Orders
```
GET /api/packing/assigned
Header: Authorization: Bearer <token>

Response: [assigned orders for packer]
```

#### 3. Get Order Details
```
GET /api/packing/{orderId}/details
Header: Authorization: Bearer <token>

Response: {order with all details}
```

#### 4. Assign Order to Packer (Warehouse Manager Only)
```
POST /api/packing/assign
Header: Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "64xxx",
  "packerId": "64xxx"
}

Response: {assigned order}
```

#### 5. Confirm Packed Items
```
PATCH /api/packing/{orderId}/confirm-packed
Header: Authorization: Bearer <token>
Content-Type: application/json

{
  "packedItems": [
    {
      "sku": "SKU-001"
    }
  ]
}

Response: {order with packed status}
```

#### 6. Update Packing Status
```
PATCH /api/packing/{orderId}/status
Header: Authorization: Bearer <token>
Content-Type: application/json

{
  "skus": ["SKU-001"],
  "packingStatus": "packed"
}

Valid Status: pending, packed, not_packed
Response: {updated order}
```

---

### 🚚 Dispatch Routes (`/dispatch`)
*Accessible by: Warehouse Manager, Dispatch Officer*

#### 1. Get Packed Orders Ready for Dispatch
```
GET /api/dispatch/list/ready
Header: Authorization: Bearer <token>

Response: [dispatch list items]
```

#### 2. Get Orders Dispatched by Current Officer
```
GET /api/dispatch/dispatched
Header: Authorization: Bearer <token>

Response: [dispatched orders]
```

#### 3. Get Order Dispatch Details
```
GET /api/dispatch/{orderId}/details
Header: Authorization: Bearer <token>

Response: {order details}
```

#### 4. Confirm Shipment (Single Order)
```
PATCH /api/dispatch/{orderId}/confirm-shipment
Header: Authorization: Bearer <token>
Content-Type: application/json

{
  "trackingNumber": "TRK-12345"
}

Response: {shipped order}
```

#### 5. Approve & Dispatch Multiple Orders
```
POST /api/dispatch/bulk/approve-dispatch
Header: Authorization: Bearer <token>
Content-Type: application/json

{
  "orderIds": ["64xxx", "64xxx"],
  "trackingNumbers": ["TRK-001", "TRK-002"]
}

Response: {shipment summary}
```

#### 6. Mark Order as Delivered
```
PATCH /api/dispatch/{orderId}/mark-delivered
Header: Authorization: Bearer <token>

Response: {delivered order}
```

---

### 📥 Receiving Routes (`/receiving`)
*Accessible by: Warehouse Manager, Receiving Officer, Inventory Manager*

#### 1. Get All Receiving Documents
```
GET /api/receiving
Header: Authorization: Bearer <token>

Response: [receiving documents]
```

#### 2. Get Receiving Document by ID
```
GET /api/receiving/{id}
Header: Authorization: Bearer <token>

Response: {receiving document}
```

#### 3. Create New Receiving Document
```
POST /api/receiving
Header: Authorization: Bearer <token>
Content-Type: application/json

{
  "receivingNumber": "RCV-001",
  "supplier": {
    "name": "Supplier Name",
    "contact": "0700000000",
    "email": "supplier@example.com"
  },
  "purchaseOrder": "PO-001",
  "items": [
    {
      "sku": "SKU-001",
      "productName": "Product 1",
      "expectedQuantity": 100,
      "batchNumber": "BATCH-001",
      "manufactureDate": "2024-01-01",
      "expiryDate": "2025-01-01",
      "storageLocationCode": "LOC-001"
    }
  ]
}

Response: {receiving document created}
```

#### 4. Update Received Quantities
```
PATCH /api/receiving/{id}/update-quantities
Header: Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "sku": "SKU-001",
      "receivedQuantity": 95,
      "notes": "2 damaged"
    }
  ]
}

Response: {updated receiving document}
```

#### 5. Inspect Received Goods
```
PATCH /api/receiving/{id}/inspect
Header: Authorization: Bearer <token>
Content-Type: application/json

{
  "inspectionNotes": "All items inspected and verified"
}

Response: {inspected receiving document}
```

#### 6. Accept Receiving (Update Inventory)
```
PATCH /api/receiving/{id}/accept
Header: Authorization: Bearer <token>

Response: {accepted receiving, inventory updated}
```

#### 7. Reject Receiving
```
PATCH /api/receiving/{id}/reject
Header: Authorization: Bearer <token>
Content-Type: application/json

{
  "rejectionReason": "Damaged goods"
}

Response: {rejected receiving}
```

---

### 📊 Audit & Stock Movement Routes (`/audit`)
*Accessible by: Warehouse Manager, Inventory Manager*

#### 1. Get Stock Movement History
```
GET /api/audit/history/movements
Header: Authorization: Bearer <token>
Query Parameters:
  - sku: (optional) specific SKU
  - startDate: (optional) ISO date
  - endDate: (optional) ISO date
  - movementType: (optional) RECEIVE, DISPATCH, TRANSFER
  - limit: (optional) 1-500, default 50
  - skip: (optional) pagination offset

Response: {movements array with pagination}
```

#### 2. Get Stock Movement for Specific SKU
```
GET /api/audit/history/{sku}
Header: Authorization: Bearer <token>
Query Parameters:
  - limit: (optional) 1-500
  - skip: (optional) offset

Response: {movements for SKU}
```

#### 3. Conduct Stock Audit
```
POST /api/audit/audit/conduct
Header: Authorization: Bearer <token>
Content-Type: application/json

{
  "skus": ["SKU-001", "SKU-002"]
}

Response: {audit initiated with system quantities}
```

#### 4. Submit Audit Results
```
POST /api/audit/audit/submit-results
Header: Authorization: Bearer <token>
Content-Type: application/json

{
  "auditResults": [
    {
      "sku": "SKU-001",
      "physicalCount": 95,
      "notes": "2 missing"
    }
  ]
}

Response: {audit results with discrepancies}
```

#### 5. Get Inventory Accuracy Report
```
GET /api/audit/reports/accuracy
Header: Authorization: Bearer <token>

Response: {accuracy report for all items}
```

#### 6. Get Audit History
```
GET /api/audit/reports/audit-history
Header: Authorization: Bearer <token>
Query Parameters:
  - limit: (optional)
  - skip: (optional)

Response: {audit activities}
```

#### 7. Get Expired & Low Stock Items
```
GET /api/audit/reports/critical-items
Header: Authorization: Bearer <token>

Response: {
  "lowStockItems": [],
  "expiredItems": [],
  "expiringItems": [],
  "summary": {}
}
```

---

### 📈 Existing Routes (Already Configured)

#### Inventory Routes (`/inventory`)
```
GET /api/inventory - Get all inventory
GET /api/inventory/{sku} - Get inventory by SKU
POST /api/inventory - Create inventory (Admin/Warehouse Manager)
PATCH /api/inventory/{sku} - Update inventory
DELETE /api/inventory/{sku} - Delete inventory (Admin)
```

#### Stock Routes (`/stock`)
```
GET /api/stock - Get stock data
```

#### Dashboard Routes (`/dashboard`)
```
GET /api/dashboard - Get dashboard data
```

#### Users Routes (`/users`)
```
GET /api/users - Get all users
GET /api/users/{id} - Get user
POST /api/users - Create user
PATCH /api/users/{id} - Update user
DELETE /api/users/{id} - Delete user
```

---

## Request/Response Examples

### Example: Complete Order Flow

**1. Sales Staff Creates Order**
```
POST /api/orders
{
  "orderNumber": "ORD-20260404-001",
  "customer": {
    "name": "John Customer",
    "email": "john@customer.com",
    "phone": "0712345678",
    "address": "123 Main Street, Nairobi"
  },
  "items": [
    {
      "sku": "PROD-001",
      "productName": "Laptop",
      "quantity": 2,
      "unitPrice": 50000
    }
  ],
  "totalAmount": 100000
}
```

**2. Warehouse Manager Assigns to Picker**
```
POST /api/picking/assign
{
  "orderId": "64xxx",
  "pickerId": "64yyy"
}
```

**3. Picker Marks Items as Picked**
```
PATCH /api/picking/64xxx/mark-picked
{
  "pickedItems": [
    {
      "sku": "PROD-001",
      "quantity": 2,
      "batchNumber": "BATCH-001"
    }
  ]
}
```

**4. Warehouse Manager Assigns to Packer**
```
POST /api/packing/assign
{
  "orderId": "64xxx",
  "packerId": "64zzz"
}
```

**5. Packer Confirms Items as Packed**
```
PATCH /api/packing/64xxx/confirm-packed
{
  "packedItems": [
    {"sku": "PROD-001"}
  ]
}
```

**6. Dispatch Officer Ships Order**
```
PATCH /api/dispatch/64xxx/confirm-shipment
{
  "trackingNumber": "TRK-20260404-001"
}
```

**7. Mark as Delivered**
```
PATCH /api/dispatch/64xxx/mark-delivered
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "message": "No token, authorization denied"
}
```

### 403 Forbidden
```json
{
  "message": "Access denied - Insufficient permissions",
  "userRole": "Picker",
  "allowedRoles": ["Warehouse Manager", "Packer"]
}
```

### 400 Bad Request
```json
{
  "errors": [
    {
      "param": "email",
      "msg": "Valid email is required"
    }
  ]
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

## Data Models

### User Model
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String (hashed),
  role: String (enum),
  department: String,
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Order Model
```javascript
{
  _id: ObjectId,
  orderNumber: String,
  customer: {
    name: String,
    email: String,
    phone: String,
    address: String
  },
  items: [
    {
      sku: String,
      productName: String,
      quantity: Number,
      unitPrice: Number,
      status: String
    }
  ],
  orderStatus: String,
  totalAmount: Number,
  pickingAssignedTo: ObjectId (User),
  packingAssignedTo: ObjectId (User),
  dispatchedBy: ObjectId (User),
  createdBy: ObjectId (User),
  trackingNumber: String,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Receiving Model
```javascript
{
  _id: ObjectId,
  receivingNumber: String,
  supplier: {
    name: String,
    contact: String,
    email: String
  },
  items: [
    {
      sku: String,
      expectedQuantity: Number,
      receivedQuantity: Number,
      batchNumber: String,
      manufactureDate: Date,
      expiryDate: Date,
      storageLocationCode: String,
      status: String
    }
  ],
  receivingStatus: String,
  receivedBy: ObjectId (User),
  inspectedBy: ObjectId (User),
  approvedBy: ObjectId (User),
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

### StockMovement Model
```javascript
{
  _id: ObjectId,
  sku: String,
  movementType: String (RECEIVE, DISPATCH, TRANSFER),
  quantity: Number,
  user: ObjectId (User),
  batchNumber: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Frontend Structure Recommendation

```
Frontend (React/Vue/Angular)
├── Pages
│   ├── Auth
│   │   ├── Login
│   │   ├── Register
│   │   └── Profile
│   ├── Dashboard
│   │   ├── Overview
│   │   ├── Inventory Manager Dashboard
│   │   ├── Picker Dashboard
│   │   ├── Packer Dashboard
│   │   ├── Dispatch Dashboard
│   │   ├── Receiving Dashboard
│   │   └── Sales Dashboard
│   ├── Orders
│   │   ├── Create Order
│   │   ├── View Orders
│   │   ├── Order Details
│   │   └── Order Tracking
│   ├── Warehouse Operations
│   │   ├── Picking
│   │   │   ├── Picklist
│   │   │   └── Mark Picked
│   │   ├── Packing
│   │   │   ├── Ready to Pack
│   │   │   └── Confirm Packed
│   │   ├── Dispatch
│   │   │   ├── Ready for Dispatch
│   │   │   └── Confirm Shipment
│   │   └── Receiving
│   │       ├── New Receiving
│   │       ├── Inspect Goods
│   │       └── Accept/Reject
│   └── Reports
│       ├── Audit Reports
│       ├── Stock Movement History
│       ├── Inventory Accuracy
│       ├── Low Stock Alerts
│       └── Expired Items
└── Services
    ├── authService
    ├── orderService
    ├── pickingService
    ├── packingService
    ├── dispatchService
    ├── receivingService
    └── auditService
```

---

## Environment Variables (.env)

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/warehouse_db
JWT_SECRET=your_secret_key_here
NODE_ENV=development
```

---

## Notes

- All endpoints require JWT authentication (except register and login)
- Role-based access control is enforced on all protected routes
- Validation is performed on all input data
- Stock movements are automatically tracked when items are picked, packed, or received
- The system maintains a complete audit trail of all activities
- Token expires after 24 hours - users must login again for a new token

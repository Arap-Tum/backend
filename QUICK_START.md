# QUICK START GUIDE

## 🚀 Getting Your Backend Running

### Prerequisites
- Node.js (v14+)
- MongoDB (local or MongoDB Atlas)
- Postman or similar API testing tool

### 1. Install Dependencies
```bash
npm install
```

### 2. Create .env File
In the root `backend` folder, create a `.env` file:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/warehouse_db
JWT_SECRET=your_super_secret_key_here_change_this_in_production
NODE_ENV=development
```

### 3. Start the Server
```bash
npm run dev
```

You should see:
```
Server running on port 5000
```

### 4. Test Health Check
```bash
curl http://localhost:5000/api/health
```

---

## 👥 Create Test Users

### 1. Create Warehouse Manager (Admin)
```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "John Manager",
  "email": "manager@warehouse.com",
  "password": "password123",
  "role": "Warehouse Manager",
  "department": "Warehouse"
}
```

Save the token from response.

### 2. Create Other Users
Repeat the register endpoint for each role:

**Inventory Manager**
```json
{
  "name": "Sarah Inventory",
  "email": "inventory@warehouse.com",
  "password": "password123",
  "role": "Inventory Manager",
  "department": "Warehouse"
}
```

**Picker**
```json
{
  "name": "Peter Picker",
  "email": "picker@warehouse.com",
  "password": "password123",
  "role": "Picker",
  "department": "Warehouse"
}
```

**Packer**
```json
{
  "name": "Pam Packer",
  "email": "packer@warehouse.com",
  "password": "password123",
  "role": "Packer",
  "department": "Warehouse"
}
```

**Dispatch Officer**
```json
{
  "name": "Dave Dispatch",
  "email": "dispatch@warehouse.com",
  "password": "password123",
  "role": "Dispatch Officer",
  "department": "Logistics"
}
```

**Receiving Officer**
```json
{
  "name": "Rachel Receiving",
  "email": "receiving@warehouse.com",
  "password": "password123",
  "role": "Receiving Officer",
  "department": "Warehouse"
}
```

**Sales Staff**
```json
{
  "name": "Sally Sales",
  "email": "sales@warehouse.com",
  "password": "password123",
  "role": "Sales Staff",
  "department": "Sales"
}
```

---

## 📝 Test Order Workflow

### Step 1: Sales Staff Creates Order
```bash
POST http://localhost:5000/api/orders
Authorization: Bearer <sales_token>
Content-Type: application/json

{
  "orderNumber": "ORD-20260404-001",
  "customer": {
    "name": "JOMO Kenyatta",
    "email": "jomo@example.com",
    "phone": "0712345678",
    "address": "123 Main St, Nairobi"
  },
  "items": [
    {
      "sku": "LAPTOP-001",
      "productName": "Dell Laptop",
      "quantity": 2,
      "unitPrice": 50000
    },
    {
      "sku": "MOUSE-001",
      "productName": "Wireless Mouse",
      "quantity": 5,
      "unitPrice": 2000
    }
  ],
  "totalAmount": 110000
}
```

Save the `_id` from response as `{ORDER_ID}`.

### Step 2: Warehouse Manager Assigns to Picker
```bash
POST http://localhost:5000/api/picking/assign
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "orderId": "{ORDER_ID}",
  "pickerId": "{PICKER_USER_ID}"
}
```

### Step 3: Picker Marks Items as Picked
```bash
PATCH http://localhost:5000/api/picking/{ORDER_ID}/mark-picked
Authorization: Bearer <picker_token>
Content-Type: application/json

{
  "pickedItems": [
    {
      "sku": "LAPTOP-001",
      "quantity": 2,
      "batchNumber": "BATCH-LAP-001"
    },
    {
      "sku": "MOUSE-001",
      "quantity": 5,
      "batchNumber": "BATCH-MSE-001"
    }
  ]
}
```

### Step 4: Warehouse Manager Assigns to Packer
```bash
POST http://localhost:5000/api/packing/assign
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "orderId": "{ORDER_ID}",
  "packerId": "{PACKER_USER_ID}"
}
```

### Step 5: Packer Confirms Items as Packed
```bash
PATCH http://localhost:5000/api/packing/{ORDER_ID}/confirm-packed
Authorization: Bearer <packer_token>
Content-Type: application/json

{
  "packedItems": [
    {"sku": "LAPTOP-001"},
    {"sku": "MOUSE-001"}
  ]
}
```

### Step 6: Dispatch Officer Confirms Shipment
```bash
PATCH http://localhost:5000/api/dispatch/{ORDER_ID}/confirm-shipment
Authorization: Bearer <dispatch_token>
Content-Type: application/json

{
  "trackingNumber": "TRK-20260404-001-AIRWAY"
}
```

### Step 7: Dispatch Officer Marks as Delivered
```bash
PATCH http://localhost:5000/api/dispatch/{ORDER_ID}/mark-delivered
Authorization: Bearer <dispatch_token>
Content-Type: application/json
```

---

## 📥 Test Receiving Workflow

### Step 1: Create Receiving Document
```bash
POST http://localhost:5000/api/receiving
Authorization: Bearer <receiving_officer_token>
Content-Type: application/json

{
  "receivingNumber": "RCV-20260404-001",
  "supplier": {
    "name": "Tech Suppliers Ltd",
    "contact": "0700111111",
    "email": "supplier@tech.com"
  },
  "purchaseOrder": "PO-2024-001",
  "items": [
    {
      "sku": "LAPTOP-001",
      "productName": "Dell Laptop",
      "expectedQuantity": 10,
      "batchNumber": "BATCH-LAP-002",
      "manufactureDate": "2024-01-01",
      "expiryDate": "2026-01-01",
      "storageLocationCode": "SHELF-A1"
    }
  ]
}
```

Save the `_id` as `{RECEIVING_ID}`.

### Step 2: Update Received Quantities
```bash
PATCH http://localhost:5000/api/receiving/{RECEIVING_ID}/update-quantities
Authorization: Bearer <receiving_officer_token>
Content-Type: application/json

{
  "items": [
    {
      "sku": "LAPTOP-001",
      "receivedQuantity": 10,
      "notes": "All items received in good condition"
    }
  ]
}
```

### Step 3: Inspect Goods
```bash
PATCH http://localhost:5000/api/receiving/{RECEIVING_ID}/inspect
Authorization: Bearer <receiving_officer_token>
Content-Type: application/json

{
  "inspectionNotes": "Quantity verified, all items match expected batch"
}
```

### Step 4: Accept Receiving
```bash
PATCH http://localhost:5000/api/receiving/{RECEIVING_ID}/accept
Authorization: Bearer <receiving_officer_token>
Content-Type: application/json
```

---

## 📊 Test Audit & Reports

### Conduct Stock Audit
```bash
POST http://localhost:5000/api/audit/audit/conduct
Authorization: Bearer <inventory_manager_token>
Content-Type: application/json

{
  "skus": ["LAPTOP-001", "MOUSE-001"]
}
```

### Submit Audit Results (with physical count)
```bash
POST http://localhost:5000/api/audit/audit/submit-results
Authorization: Bearer <inventory_manager_token>
Content-Type: application/json

{
  "auditResults": [
    {
      "sku": "LAPTOP-001",
      "physicalCount": 8,
      "notes": "2 units missing from location"
    },
    {
      "sku": "MOUSE-001",
      "physicalCount": 5,
      "notes": "Count matches system"
    }
  ]
}
```

### Get Stock Movement History
```bash
GET http://localhost:5000/api/audit/history/movements
Authorization: Bearer <inventory_manager_token>
```

### Get Critical Items (Low Stock & Expired)
```bash
GET http://localhost:5000/api/audit/reports/critical-items
Authorization: Bearer <inventory_manager_token>
```

### Get Inventory Accuracy Report
```bash
GET http://localhost:5000/api/audit/reports/accuracy
Authorization: Bearer <inventory_manager_token>
```

---

## ✅ Useful Queries

### Get All Orders
```bash
GET http://localhost:5000/api/orders
Authorization: Bearer <token>
```

### Get Picklist (Pending Orders)
```bash
GET http://localhost:5000/api/picking/list/pending
Authorization: Bearer <token>
```

### Get Orders Ready for Packing
```bash
GET http://localhost:5000/api/packing/list/ready
Authorization: Bearer <token>
```

### Get Packed Orders for Dispatch
```bash
GET http://localhost:5000/api/dispatch/list/ready
Authorization: Bearer <token>
```

### Get All Receiving Documents
```bash
GET http://localhost:5000/api/receiving
Authorization: Bearer <token>
```

### Get Movement History for SKU
```bash
GET http://localhost:5000/api/audit/history/LAPTOP-001
Authorization: Bearer <token>
```

---

## 🔐 Important Notes

1. **Tokens Expire in 24 Hours**: Login again to get a new token
2. **Role-Based Access**: Each endpoint checks user role
3. **Orders Must Follow Workflow**: Can't skip picking → packing → dispatch
4. **All Quantities Tracked**: Stock movements are automatically logged
5. **Inventory Auto-Updates**: When receiving is accepted, inventory is updated

---

## 🐛 Troubleshooting

### "No token, authorization denied"
- Make sure you're including `Authorization: Bearer <token>` header
- Make sure token is valid and not expired

### "Access denied - Insufficient permissions"
- Your role doesn't have access to this endpoint
- Check API_DOCUMENTATION.md for role requirements

### "Order not found"
- Make sure you're using correct OrderId
- Check that order exists before performing operations

### MongoDB Connection Error
- Check MONGODB_URI in .env
- Make sure MongoDB is running

### Port Already in Use
- Change PORT in .env or kill process using port 5000

---

## 📚 Next Steps for Frontend

1. Create login form → /api/auth/login
2. Store token in localStorage
3. Create dashboard for each role
4. Create forms for each operation
5. Display data from endpoints with proper filtering
6. Show real-time status updates on orders
7. Create reports dashboards

---

## 🎯 Testing Checklist

- [ ] Register all 7 user roles
- [ ] Test complete order workflow (Order → Pick → Pack → Dispatch)
- [ ] Test receiving workflow (Create → Inspect → Accept)
- [ ] Test role-based access (try accessing endpoints with wrong role)
- [ ] Test stock audit (Conduct → Submit → View Results)
- [ ] Test picklist functionality
- [ ] Verify stock movements are logged
- [ ] Check inventory updates after receiving
- [ ] View reports and analytics
- [ ] Test pagination on large datasets

---

For detailed API documentation, see **API_DOCUMENTATION.md**
For system architecture details, see **SYSTEM_ARCHITECTURE.md**

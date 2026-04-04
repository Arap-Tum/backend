# System Architecture & Implementation Guide

## Backend Architecture Overview

```
Muthokinju Warehouse Management System Backend
│
├── 📁 server/
│   ├── 📁 config/
│   │   └── database.js (MongoDB connection)
│   │
│   ├── 📁 models/
│   │   ├── User.js (User with 7 roles)
│   │   ├── Order.js (Customer orders workflow)
│   │   ├── Receiving.js (Incoming goods workflow)
│   │   ├── Inventory.js (Stock management)
│   │   └── StockMovement.js (Audit trail)
│   │
│   ├── 📁 controllers/
│   │   ├── authController.js (Auth Logic)
│   │   ├── orderController.js (Order CRUD)
│   │   ├── pickingController.js (Picking operations)
│   │   ├── packingController.js (Packing operations)
│   │   ├── dispatchController.js (Dispatch operations)
│   │   ├── receivingController.js (Receiving operations)
│   │   └── auditController.js (Stock audit & history)
│   │
│   ├── 📁 routes/
│   │   ├── auth.js (Auth endpoints)
│   │   ├── orders.js (Order endpoints)
│   │   ├── picking.js (Picking endpoints)
│   │   ├── packing.js (Packing endpoints)
│   │   ├── dispatch.js (Dispatch endpoints)
│   │   ├── receiving.js (Receiving endpoints)
│   │   ├── audit.js (Audit endpoints)
│   │   ├── inventory.js (Inventory endpoints)
│   │   ├── stock.js (Stock endpoints)
│   │   ├── dashboard.js (Dashboard endpoints)
│   │   └── users.js (User management)
│   │
│   ├── 📁 middleware/
│   │   ├── auth.js (JWT verification)
│   │   └── roleCheck.js (Role-based access control)
│   │
│   └── app.js (Express app setup & routing)
│
├── package.json (Dependencies)
├── .env (Environment variables)
└── API_DOCUMENTATION.md (This file)
```

---

## User Roles & Access Control

### Role Hierarchy & Permissions

| Feature | Warehouse Manager | Inventory Manager | Picker | Packer | Dispatch Officer | Receiving Officer | Sales Staff |
|---------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Create Orders | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |
| View Orders | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓* |
| Assign Tasks | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Pick Items | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Pack Items | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| Dispatch Orders | ✓ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| Receive Goods | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✗ |
| View Inventory | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Edit Inventory | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Conduct Audits | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| View Reports | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Manage Users | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

*Sales Staff can only view their own orders

---

## Workflow Flows

### Order Processing Workflow

```
┌─────────────────────────────────────────────────────────┐
│ 1. CREATE ORDER (Sales Staff)                            │
│    POST /api/orders                                      │
│    Status: pending                                       │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│ 2. ASSIGN TO PICKER (Warehouse Manager)                  │
│    POST /api/picking/assign                              │
│    Status: picking                                       │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│ 3. PICK ITEMS (Picker)                                   │
│    PATCH /api/picking/{id}/mark-picked                   │
│    Status: picked                                        │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│ 4. ASSIGN TO PACKER (Warehouse Manager)                  │
│    POST /api/packing/assign                              │
│    Status: packing                                       │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│ 5. PACK ITEMS (Packer)                                   │
│    PATCH /api/packing/{id}/confirm-packed               │
│    Status: packed                                        │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│ 6. DISPATCH ORDER (Dispatch Officer)                     │
│    PATCH /api/dispatch/{id}/confirm-shipment            │
│    Status: shipped                                       │
│    Generate Tracking Number                              │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│ 7. MARK DELIVERED (Dispatch Officer)                     │
│    PATCH /api/dispatch/{id}/mark-delivered              │
│    Status: delivered                                     │
└─────────────────────────────────────────────────────────┘
```

### Receiving Workflow

```
┌────────────────────────────────────────────────────────┐
│ 1. CREATE RECEIVING (Receiving Officer)                │
│    POST /api/receiving                                 │
│    Status: pending                                     │
└──────────────────┬─────────────────────────────────────┘
                   │
┌──────────────────▼─────────────────────────────────────┐
│ 2. UPDATE QUANTITIES (Receiving Officer)               │
│    PATCH /api/receiving/{id}/update-quantities        │
│    Status: in_progress                                │
└──────────────────┬─────────────────────────────────────┘
                   │
┌──────────────────▼─────────────────────────────────────┐
│ 3. INSPECT GOODS (Receiving Officer)                   │
│    PATCH /api/receiving/{id}/inspect                  │
│    Verify quantities match                             │
└──────────────────┬─────────────────────────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
    ┌────▼─────┐        ┌────▼─────┐
    │ ACCEPT   │        │ REJECT   │
    │ Update   │        │ Return   │
    │ Inventory│        │ to       │
    │ Status:  │        │ Supplier │
    │ completed│        │ Status:  │
    └──────────┘        │ rejected │
                        └──────────┘
```

### Audit & Stock Tracking Workflow

```
┌────────────────────────────────────────────────────────┐
│ 1. STOCK MOVEMENTS AUTOMATICALLY TRACKED                │
│    - On picking: DISPATCH movement                      │
│    - On packing: Event logged                           │
│    - On receiving: RECEIVE movement                     │
└────────────────────┬───────────────────────────────────┘
                     │
┌────────────────────▼───────────────────────────────────┐
│ 2. INVENTORY MANAGER CONDUCTS AUDIT                     │
│    POST /api/audit/audit/conduct                        │
│    Get system quantities for selected SKUs              │
└────────────────────┬───────────────────────────────────┘
                     │
┌────────────────────▼───────────────────────────────────┐
│ 3. PHYSICAL COUNT & SUBMIT RESULTS                      │
│    POST /api/audit/audit/submit-results                │
│    Identifies discrepancies                             │
└────────────────────┬───────────────────────────────────┘
                     │
┌────────────────────▼───────────────────────────────────┐
│ 4. VIEW REPORTS                                         │
│    GET /api/audit/reports/accuracy                      │
│    GET /api/audit/history/{sku}                         │
│    GET /api/audit/reports/critical-items               │
└────────────────────────────────────────────────────────┘
```

---

## Database Models Relationships

```
┌──────────────┐
│ User Model   │
├──────────────┤
│ _id          │ (Primary Key)
│ name         │
│ email        │
│ role         │ (7 types)
│ department   │
│ isActive     │
│ lastLogin    │
└──────────────┘
       ▲
       │ (Referenced By)
       │
   ┌───┴────┬────────┬─────────────┐
   │        │        │             │
┌──┴────┐ ┌─┴──┐ ┌──┴─┐  ┌────────┴─┐
│ Order│ │ Rec │ │ Stk│  │ StockMov  │
└──────┘ └─────┘ └────┘  └───────────┘
  (createdBy, pickingAssignedTo, packingAssignedTo, dispatchedBy)
  (receivedBy, inspectedBy, approvedBy)
  (user)
```

---

## Getting Started

### 1. Installation
```bash
npm install
```

### 2. Environment Setup
Create `.env` file:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/warehouse_db
JWT_SECRET=your_super_secret_key_change_this
NODE_ENV=development
```

### 3. Start Server
```bash
npm start          # Production
npm run dev        # Development with nodemon
```

### 4. Create Admin User
```bash
POST /api/auth/register
{
  "name": "Admin User",
  "email": "admin@warehouse.com",
  "password": "admin123",
  "role": "Warehouse Manager",
  "department": "Warehouse"
}
```

---

## Common API Patterns

### Authentication Pattern
```javascript
// Every protected endpoint requires:
Authorization: Bearer <jwt_token>

// Get token from login
POST /api/auth/login
Response: { token: "eyJhbGc..." }
```

### Error Handling Pattern
```javascript
// All endpoints return consistent error format
{
  "message": "Error description",
  "errors": [ // Optional, validation errors
    {
      "param": "field_name",
      "msg": "Error message"
    }
  ]
}
```

### Pagination Pattern
```javascript
GET /api/audit/history/movements?limit=20&skip=0

Response: {
  "movements": [...],
  "pagination": {
    "total": 100,
    "limit": 20,
    "skip": 0
  }
}
```

---

## Key Features Implemented

### ✅ Role-Based Access Control
- 7 distinct user roles with specific permissions
- Granular middleware for access validation
- Warehouse Manager can override most restrictions

### ✅ Complete Order Lifecycle
- Create → Pick → Pack → Dispatch → Deliver
- Status tracking at each stage
- Assignment of human resources

### ✅ Receiving & Inventory Management
- Incoming goods workflow
- Batch tracking with expiry dates
- Automatic inventory updates

### ✅ Stock Audit & History
- Complete stock movement logging
- Physical count audits with discrepancy reporting
- Expired and low-stock alerts

### ✅ Security
- JWT authentication (24h token expiry)
- Password hashing with bcryptjs
- Request validation with express-validator
- Role-based endpoint protection

### ✅ Data Integrity
- MongoDB transactions (via Mongoose)
- Referential integrity through ObjectIds
- Automatic timestamp tracking

---

## Frontend Integration Checklist

Your frontend should implement:

- [ ] Login/Register pages
- [ ] Role-based dashboard for each user type
- [ ] Order creation form (Sales Staff)
- [ ] Picklist view & picking interface (Picker)
- [ ] Packing confirmation interface (Packer)
- [ ] Dispatch & shipment interface (Dispatch Officer)
- [ ] Receiving management interface (Receiving Officer)
- [ ] Inventory management (Inventory Manager)
- [ ] Stock audit interface (Inventory Manager)
- [ ] Reports dashboard (Warehouse Manager, Inventory Manager)
- [ ] User management (Warehouse Manager)
- [ ] Real-time status tracking

---

## Performance Optimization Tips

1. **Indexing**: Add indexes on frequently queried fields (sku, orderNumber, email)
2. **Pagination**: Use skip/limit for large datasets
3. **Caching**: Cache role definitions and frequently accessed inventory data
4. **Batch Operations**: Use bulk APIs for multiple operations
5. **Lazy Loading**: Only load related data when needed

---

## Testing Recommendations

1. **Unit Tests**: Test each controller function
2. **Integration Tests**: Test complete workflows
3. **Authorization Tests**: Test role-based access
4. **Validation Tests**: Test input validation

```bash
# Test a successful order creation
POST /api/orders
Content-Type: application/json
Authorization: Bearer <valid_sales_staff_token>

{
  "orderNumber": "TEST-001",
  "customer": {
    "name": "Test Customer",
    "email": "test@example.com",
    "phone": "0700000000",
    "address": "Test Address"
  },
  "items": [
    {
      "sku": "TEST-SKU-001",
      "productName": "Test Product",
      "quantity": 5,
      "unitPrice": 1000
    }
  ],
  "totalAmount": 5000
}
```

---

## Future Enhancements

1. Real-time notifications via WebSocket
2. Barcode/QR code scanning for picking & packing
3. Mobile app for warehouse staff
4. Advanced analytics & reporting
5. Integration with accounting software
6. SMS/Email notifications
7. API rate limiting
8. Advanced search and filtering
9. Inventory forecasting
10. Multi-warehouse support

---

## Support & Maintenance

- Regular database backups
- Monitor API performance
- Keep dependencies updated
- Review logs regularly
- Test new deployments

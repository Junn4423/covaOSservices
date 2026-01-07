# ServiceOS E2E Test Suite Documentation

## Tổng Quan

Comprehensive E2E Test Suite cho ServiceOS - Multi-Tenant SaaS Backend được xây dựng với NestJS + Prisma + MySQL.

### Stack Kỹ Thuật
- **Testing Framework:** Jest 29.x
- **HTTP Testing:** Supertest
- **Database ORM:** Prisma 5.x
- **Language:** TypeScript (tiếng Việt có dấu)

---

## Cấu Trúc Test

```
test/
├── config/
│   ├── test.config.ts      # Cấu hình timeout, tenant, grades
│   ├── test.reporter.ts    # Custom reporter với grading system
│   └── test.helpers.ts     # Utilities, data generators, API wrapper
├── phases/
│   ├── phase1-2-core-auth.e2e-spec.ts       # Core & Authentication
│   ├── phase3-6-sales-crm.e2e-spec.ts       # Sales & CRM Flow
│   ├── phase7-14-finance-billing.e2e-spec.ts # Finance & Billing
│   ├── phase8-11-12-operations-hr.e2e-spec.ts # Operations & HR
│   ├── phase9-10-supply-chain.e2e-spec.ts   # Supply Chain & Inventory
│   └── phase13-customer-portal.e2e-spec.ts  # Customer Portal
├── app.e2e-spec.ts         # Main orchestrator
└── jest-e2e.json           # Jest configuration
```

---

## Các Phase Được Test

### Phase 1-2: Core & Authentication
- Tenant Registration (Multi-tenant)
- User Authentication (JWT)
- RBAC (Role-Based Access Control)
- Token Refresh Flow
- Multi-tenant Isolation
- SQL Injection Prevention

### Phase 3-6: Sales & CRM Flow
- Nhóm Sản Phẩm / Sản Phẩm CRUD
- Khách Hàng Management
- Báo Giá với Chi Tiết
- Quote-to-Contract Conversion
- Decimal Precision Validation

### Phase 7, 14: Finance & Billing
- Phiếu Thu Chi (Revenue/Expense)
- CashFlow Calculation
- SaaS Subscription Management
- Tenant Locking on Expiry
- Negative Amount Rejection

### Phase 8, 11, 12: Operations & HR
- Ca Làm Việc (Shifts)
- Chấm Công với Tọa Độ GPS
- Công Việc / Phân Công
- Tài Sản Management
- Nghiệm Thu Hình Ảnh

### Phase 9-10: Supply Chain & Inventory
- Kho (Warehouse) Management
- Nhà Cung Cấp CRUD
- Đơn Đặt Hàng NCC
- Tồn Kho với Stock Validation
- Lịch Sử Kho Audit
- Negative Inventory Prevention

### Phase 13: Customer Portal
- Đăng Ký Tài Khoản Khách Hàng
- Login Cổng Khách Hàng
- Xem Báo Giá của Tôi
- Gửi Đánh Giá
- Customer Data Isolation

---

## Cách Chạy Test

### Chạy Toàn Bộ Suite
```bash
npm run test:e2e
```

### Chạy Từng Phase
```bash
# Phase 1-2: Core & Auth
npm run test:e2e -- --testPathPattern="phase1-2"

# Phase 3-6: Sales & CRM
npm run test:e2e -- --testPathPattern="phase3-6"

# Phase 7, 14: Finance
npm run test:e2e -- --testPathPattern="phase7-14"

# Phase 8, 11, 12: Operations
npm run test:e2e -- --testPathPattern="phase8-11-12"

# Phase 9-10: Supply Chain
npm run test:e2e -- --testPathPattern="phase9-10"

# Phase 13: Customer Portal
npm run test:e2e -- --testPathPattern="phase13"
```

### Chạy với Coverage
```bash
npm run test:e2e -- --coverage
```

### Chạy với Verbose Output
```bash
npm run test:e2e -- --verbose
```

---

## Hệ Thống Grading

| Grade | Pass Rate | Description |
|-------|-----------|-------------|
| S | ≥ 95% | Xuất sắc |
| A | ≥ 85% | Tốt |
| B | ≥ 70% | Khá |
| C | ≥ 50% | Trung bình |
| F | < 50% | Cần cải thiện |

---

## Utilities

### TestDataStore
Lưu trữ data xuyên suốt các test:
```typescript
testData.tenantA      // Tenant A info
testData.tenantB      // Tenant B info (for isolation tests)
testData.adminToken   // JWT token
testData.khachHangId  // Customer ID
// ...
```

### DataGenerator
```typescript
DataGenerator.generateEmail()           // Random email
DataGenerator.generatePhone()           // VN phone format
DataGenerator.generateCode('PREFIX')    // Unique code
DataGenerator.generateDecimal(1000, 5000) // Random decimal
```

### ApiTestHelper
```typescript
const api = new ApiTestHelper(app);

await api.get('/endpoint', token);
await api.post('/endpoint', data, token);
await api.put('/endpoint', data, token);
await api.patch('/endpoint', data, token);
await api.delete('/endpoint', token);
```

---

## Lưu Ý Quan Trọng

### Database Cleanup
Tests tự động cleanup database trước và sau khi chạy. Thứ tự xóa tuân thủ FK constraints:
1. Các bảng con (LichSuKho, ChiTietBaoGia, ...)
2. Các bảng chính (CongViec, BaoGia, ...)
3. Các bảng master (KhachHang, SanPham, ...)
4. Cuối cùng: DoanhNghiep (Tenant)

### Multi-tenant Isolation
- Mỗi tenant có dữ liệu riêng biệt
- Tenant A KHÔNG thể access data của Tenant B
- Test luôn filter theo `id_doanh_nghiep`

### Soft Delete Pattern
- Các entity sử dụng soft delete với field `ngay_xoa`
- Query luôn thêm `ngay_xoa: null` để filter

---

## Troubleshooting

### Test Timeout
Tăng timeout trong `jest-e2e.json`:
```json
{
  "testTimeout": 120000
}
```

### Database Connection Issues
Kiểm tra `.env` file có đúng DATABASE_URL

### FK Constraint Errors
Cleanup function đã handle bằng `SET FOREIGN_KEY_CHECKS = 0/1`

---

## Contributing

1. Tạo test file mới trong `test/phases/`
2. Follow naming convention: `phase{X}-{feature}.e2e-spec.ts`
3. Sử dụng tiếng Việt có dấu cho tất cả comments và test names
4. Register results với `testReporter.ghiNhanKetQua()`

---

## Support

Liên hệ: ServiceOS Development Team

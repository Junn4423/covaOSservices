# Phase 6: Contract Management (HopDong) - Implementation Guide

## 📋 Tổng quan

Phase 6 đã được implement thành công với các files sau:

### Files được tạo mới:
1. `libs/modules/src/quotemaster/dto/hop-dong.dto.ts` - DTOs & Enums
2. `libs/modules/src/quotemaster/services/hop-dong.service.ts` - Business Logic
3. `libs/modules/src/quotemaster/controllers/hop-dong.controller.ts` - API Endpoints

### Files được cập nhật:
1. `libs/modules/src/quotemaster/quotemaster.module.ts` - Register controller & service
2. `libs/modules/src/quotemaster/controllers/index.ts` - Export controller
3. `libs/modules/src/quotemaster/services/index.ts` - Export service
4. `libs/modules/src/quotemaster/dto/index.ts` - Export DTOs

---

##  Core Features

### 1. Convert Quote to Contract (Tính năng chính)

**Endpoint:** `POST /hop-dong/from-quote/{quoteId}`

**Flow:**
1. Kiểm tra báo giá tồn tại và chưa bị xóa
2. Kiểm tra trạng thái báo giá phải là `ACCEPTED` hoặc `SENT`
3. Kiểm tra báo giá này chưa có hợp đồng (tránh tạo đúp)
4. Copy dữ liệu từ báo giá sang hợp đồng:
   - `id_khach_hang` = `bao_gia.id_khach_hang`
   - `gia_tri_hop_dong` = `bao_gia.tong_tien_sau_thue`
   - `id_bao_gia` = `bao_gia.id`
5. Set `ngay_ky` = `now()`
6. Tạo hợp đồng với trạng thái `DRAFT`

**Cách gọi API trong Swagger:**
1. Mở Swagger UI tại `http://localhost:3001/docs`
2. Expand section "QuoteMaster - Hợp Đồng"
3. Tìm endpoint `POST /hop-dong/from-quote/{quoteId}`
4. Click "Try it out"
5. Nhập `quoteId` (UUID của báo giá đã ACCEPTED/SENT)
6. Click "Execute"

### 2. Tạo hợp đồng thủ công

**Endpoint:** `POST /hop-dong`

```json
{
  "id_khach_hang": "550e8400-e29b-41d4-a716-446655440000",
  "ten_hop_dong": "Hợp đồng bảo trì 2026",
  "gia_tri_hop_dong": 50000000,
  "ngay_ky": "2026-01-07",
  "ngay_het_han": "2026-12-31",
  "ghi_chu": "Hợp đồng bảo trì định kỳ"
}
```

### 3. Danh sách hợp đồng

**Endpoint:** `GET /hop-dong`

**Query params:**
- `page`: Số trang (mặc định: 1)
- `limit`: Số items/trang (mặc định: 20)
- `trang_thai`: Filter theo trạng thái (0-4)
- `id_khach_hang`: Filter theo khách hàng
- `sap_het_han`: `true` = Lấy các hợp đồng sắp hết hạn trong 30 ngày
- `search`: Tìm theo mã hoặc tên hợp đồng

### 4. Danh sách sắp hết hạn

**Endpoint:** `GET /hop-dong/expiring?days=30`

Trả về danh sách hợp đồng ACTIVE sắp hết hạn trong X ngày (mặc định 30).

### 5. Cập nhật hợp đồng

**Endpoint:** `PATCH /hop-dong/{id}`

```json
{
  "file_pdf_url": "https://storage.example.com/contracts/HD-xxx.pdf",
  "chu_ky_so_url": "https://storage.example.com/signatures/sig.png"
}
```

### 6. Cập nhật trạng thái

**Endpoint:** `PATCH /hop-dong/{id}/status`

```json
{
  "trang_thai": 1
}
```

**Trạng thái:**
- `0` - DRAFT (Nháp)
- `1` - ACTIVE (Đang hiệu lực)
- `2` - EXPIRED (Đã hết hạn)
- `3` - LIQUIDATED (Đã thanh lý)
- `4` - CANCELLED (Đã hủy)

---

## 🛡️ Enum TrangThaiHopDong

```typescript
enum TrangThaiHopDong {
    DRAFT = 0,      // Nháp
    ACTIVE = 1,     // Đang hiệu lực
    EXPIRED = 2,    // Đã hết hạn
    LIQUIDATED = 3, // Đã thanh lý
    CANCELLED = 4,  // Đã hủy
}
```

---

## 🔄 Khởi động lại server

Sau khi thêm code mới, cần restart dev server:

```bash
# 1. Dừng server hiện tại (Ctrl+C)
# 2. Regenerate Prisma Client
npx prisma generate

# 3. Khởi động lại
npm run start:dev
```

---

## 📝 Ghi chú quan trọng

1. **Decimal handling**: Sử dụng `decimalToNumberHopDong()` để convert Prisma.Decimal sang number cho response.

2. **Soft delete**: Hợp đồng sử dụng soft delete (field `ngay_xoa`). Chỉ có thể xóa hợp đồng ở trạng thái DRAFT.

3. **Mã hợp đồng**: Tự động sinh với format `HD-{timestamp}`.

4. **Validation**:
   - Không thể convert báo giá không phải ACCEPTED/SENT
   - Không thể convert cùng một báo giá 2 lần
   - Không thể xóa hợp đồng đã ACTIVE

5. **Type casting**: Một số type đã được cast `as any` do Prisma client types. Sau khi chạy `npx prisma generate`, có thể bỏ các cast này.

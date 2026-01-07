# Phase 3: TechMate CRM - API Test Guide
# ServiceOS - Khách Hàng Management Module
# ============================================================

## 🔧 Setup Commands

### 1. Generate Prisma Client (bắt buộc)
```bash
cd serviceos-backend
npx prisma generate
```

### 2. Push schema changes to database
```bash
npx prisma db push
```

### 3. Start development server
```bash
npm run start:dev
```

---

## 🧪 API Testing with cURL

### Prerequisites
Cần có access token. Lấy token bằng endpoint login:

```bash
# Login để lấy access token
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your_password"
  }'
```

Lưu token vào biến môi trường:
```bash
export TOKEN="your_access_token_here"
```

---

## 📝 Test Cases

### 1. CREATE - Tạo khách hàng mới

**Request (với mã KH tự generate):**
```bash
curl -X POST http://localhost:3000/api/v1/khach-hang \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "ho_ten": "Nguyễn Văn A",
    "so_dien_thoai": "0901234567",
    "email": "nguyenvana@gmail.com",
    "dia_chi": "123 Đường ABC, Phường XYZ, Quận 1, TP.HCM",
    "thanh_pho": "TP. Hồ Chí Minh",
    "quan_huyen": "Quận 1",
    "nguon_khach": "FACEBOOK",
    "loai_khach": "ca_nhan",
    "ghi_chu": "Khách hàng tiềm năng từ quảng cáo Facebook"
  }'
```

**Request (với mã KH custom):**
```bash
curl -X POST http://localhost:3000/api/v1/khach-hang \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "ma_khach_hang": "KH-001",
    "ho_ten": "Trần Thị B",
    "so_dien_thoai": "0912345678",
    "email": "tranthib@gmail.com",
    "nguon_khach": "WEBSITE"
  }'
```

**Expected Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "id_doanh_nghiep": "...",
  "ma_khach_hang": "KH-1704585600000",
  "ho_ten": "Nguyễn Văn A",
  "so_dien_thoai": "0901234567",
  "email": "nguyenvana@gmail.com",
  "dia_chi": "123 Đường ABC, Phường XYZ, Quận 1, TP.HCM",
  "nguon_khach": "FACEBOOK",
  "loai_khach": "ca_nhan",
  "ngay_tao": "2026-01-07T00:00:00.000Z",
  "ngay_cap_nhat": "2026-01-07T00:00:00.000Z"
}
```

---

### 2. GET ALL - Danh sách khách hàng (có phân trang)

**Basic request:**
```bash
curl -X GET "http://localhost:3000/api/v1/khach-hang" \
  -H "Authorization: Bearer $TOKEN"
```

**Với phân trang:**
```bash
curl -X GET "http://localhost:3000/api/v1/khach-hang?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

**Với tìm kiếm:**
```bash
curl -X GET "http://localhost:3000/api/v1/khach-hang?search=Nguyễn&page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

**Với filter nguồn khách:**
```bash
curl -X GET "http://localhost:3000/api/v1/khach-hang?nguon_khach=FACEBOOK" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "data": [
    {
      "id": "...",
      "ma_khach_hang": "KH-001",
      "ho_ten": "Nguyễn Văn A",
      "so_dien_thoai": "0901234567",
      "email": "nguyenvana@gmail.com",
      "nguon_khach": "FACEBOOK",
      "ngay_tao": "2026-01-07T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### 3. GET ONE - Chi tiết khách hàng

```bash
curl -X GET "http://localhost:3000/api/v1/khach-hang/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

---

### 4. UPDATE - Cập nhật thông tin

```bash
curl -X PUT "http://localhost:3000/api/v1/khach-hang/{id}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "so_dien_thoai": "0987654321",
    "nguon_khach": "REFERRAL",
    "ghi_chu": "Đã cập nhật thông tin liên hệ"
  }'
```

---

### 5. DELETE - Xóa mềm

```bash
curl -X DELETE "http://localhost:3000/api/v1/khach-hang/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

---

### 6. RESTORE - Khôi phục khách hàng đã xóa

```bash
curl -X PATCH "http://localhost:3000/api/v1/khach-hang/{id}/restore" \
  -H "Authorization: Bearer $TOKEN"
```

---

### 7. STATS - Thống kê theo nguồn khách

```bash
curl -X GET "http://localhost:3000/api/v1/khach-hang/stats" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
[
  { "nguon_khach": "FACEBOOK", "count": 45 },
  { "nguon_khach": "WEBSITE", "count": 30 },
  { "nguon_khach": "REFERRAL", "count": 15 },
  { "nguon_khach": "KHAC", "count": 10 }
]
```

---

### 8. COUNT - Đếm tổng số khách hàng

```bash
curl -X GET "http://localhost:3000/api/v1/khach-hang/count" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "count": 100
}
```

---

## Multi-tenant Notes

- Tất cả API tự động filter theo `id_doanh_nghiep` của user đang đăng nhập
- Không thể truy cập dữ liệu của tenant khác
- `nguoi_tao_id` và `nguoi_cap_nhat_id` tự động được gán

---

## 📚 Swagger Documentation

Truy cập Swagger UI tại: `http://localhost:3000/api/docs`
Tag: **TechMate - Khách Hàng**

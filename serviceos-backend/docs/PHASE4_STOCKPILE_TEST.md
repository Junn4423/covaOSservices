# Phase 4: StockPile - Product Catalog API Test Guide
# ServiceOS - Quản lý Sản phẩm & Nhóm Sản phẩm
# ============================================================

## 🔧 Setup Commands

### 1. Generate Prisma Client & Push Schema
```bash
cd serviceos-backend
npx prisma generate
npx prisma db push
```

### 2. Seed Data (Tạo dữ liệu mẫu)
```bash
npx ts-node --transpile-only prisma/seed.ts
```

### 3. Start Server
```bash
npm run start:dev
```

---

## 🧪 API Testing with cURL

### Prerequisites
Lấy token đăng nhập (User Admin từ seed data):

```bash
# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@techmaster.vn",
    "password": "123456"
  }'
```

Lưu token:
```bash
export TOKEN="your_access_token_here"
```

---

##  Nhóm Sản Phẩm (Product Categories)

### 1. Tạo nhóm mới
```bash
curl -X POST http://localhost:3000/api/v1/nhom-san-pham \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "ten_nhom": "Dịch vụ Tủ lạnh",
    "mo_ta": "Sửa chữa, vệ sinh tủ lạnh",
    "thu_tu": 4
  }'
```

### 2. Lấy danh sách nhóm
```bash
curl -X GET "http://localhost:3000/api/v1/nhom-san-pham" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🛒 Sản Phẩm (Products)

### 1. Tạo sản phẩm mới
```bash
# Lấy ID nhóm sản phẩm trước
export GROUP_ID="id_nhom_san_pham_tu_buoc_tren"

curl -X POST http://localhost:3000/api/v1/san-pham \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "ten_san_pham": "Vệ sinh tủ lạnh Side-by-Side",
    "loai_san_pham": "DICH_VU",
    "gia_ban": 450000,
    "gia_von": 50000,
    "don_vi_tinh": "Lần",
    "id_nhom_san_pham": "'$GROUP_ID'"
  }'
```

### 2. Lấy danh sách sản phẩm (có filter)
```bash
# Tất cả sản phẩm
curl -X GET "http://localhost:3000/api/v1/san-pham" \
  -H "Authorization: Bearer $TOKEN"

# Filter theo nhóm
curl -X GET "http://localhost:3000/api/v1/san-pham?id_nhom_san_pham=$GROUP_ID" \
  -H "Authorization: Bearer $TOKEN"

# Tìm kiếm
curl -X GET "http://localhost:3000/api/v1/san-pham?search=Vệ sinh" \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Thống kê
```bash
# Theo loại sản phẩm
curl -X GET "http://localhost:3000/api/v1/san-pham/stats/loai" \
  -H "Authorization: Bearer $TOKEN"

# Theo nhóm sản phẩm
curl -X GET "http://localhost:3000/api/v1/san-pham/stats/nhom" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📚 Swagger Documentation

Truy cập: `http://localhost:3000/docs`
Tags:
- **StockPile - Nhóm Sản Phẩm**
- **StockPile - Sản Phẩm**

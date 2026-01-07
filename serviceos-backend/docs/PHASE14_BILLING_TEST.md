# PHASE 14: BILLING - QUẢN LÝ GÓI CƯỚC SAAS

## Tổng Quan

Phase 14 triển khai hệ thống quản lý gói cước SaaS cho ServiceOS, bao gồm:
- Quản lý gói cước (TRIAL, BASIC, PRO, ENTERPRISE)
- Nâng cấp và gia hạn gói cước
- Lịch sử thanh toán
- Khóa tenant hết hạn tự động

## Cấu Trúc Module

```
libs/modules/src/billing/
├── billing.module.ts           # Module chính
├── index.ts                    # Exports
├── controllers/
│   ├── billing.controller.ts   # REST API endpoints
│   └── index.ts
├── services/
│   ├── billing.service.ts      # Business logic
│   └── index.ts
└── dto/
    ├── billing.dto.ts          # DTOs và Enums
    └── index.ts
```

## API Endpoints

### 1. Thông Tin Gói Cước

**GET** `/api/billing/subscription`

Trả về thông tin gói cước hiện tại của doanh nghiệp.

**Response:**
```json
{
  "id_doanh_nghiep": "uuid",
  "ten_doanh_nghiep": "Công ty ABC",
  "goi_cuoc": "pro",
  "trang_thai": 1,
  "ngay_het_han_goi": "2026-12-31",
  "so_ngay_con_lai": 358,
  "da_het_han": false
}
```

### 2. Nâng Cấp Gói Cước

**POST** `/api/billing/subscription/upgrade`

Nâng cấp gói cước lên gói mới.

**Request Body:**
```json
{
  "goi_cuoc_moi": "pro",
  "chu_ky": "nam"
}
```

**Response:**
```json
{
  "message": "Đã nâng cấp gói cước thành công",
  "data": {
    "goi_cuoc_cu": "basic",
    "goi_cuoc_moi": "pro",
    "chu_ky": "nam",
    "so_tien": 15000000,
    "tu_ngay": "2026-01-07",
    "den_ngay": "2027-01-07",
    "ma_hoa_don": "INV-2026-0001"
  }
}
```

### 3. Hủy Tự Động Gia Hạn

**POST** `/api/billing/subscription/cancel`

Hủy tự động gia hạn gói cước.

**Request Body:**
```json
{
  "ly_do": "Không còn nhu cầu sử dụng"
}
```

### 4. Lịch Sử Thanh Toán

**GET** `/api/billing/history`

Lấy danh sách lịch sử thanh toán.

**Query Parameters:**
| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| tu_ngay | string | Lọc từ ngày (YYYY-MM-DD) |
| den_ngay | string | Lọc đến ngày (YYYY-MM-DD) |
| trang_thai | number | 0=Chờ xử lý, 1=Thành công, 2=Thất bại, 3=Hủy |
| page | number | Số trang (mặc định: 1) |
| limit | number | Số bản ghi/trang (mặc định: 20) |

### 5. Bảng Giá Gói Cước

**GET** `/api/billing/pricing`

Lấy bảng giá các gói cước.

**Response:**
```json
{
  "message": "Bảng giá gói cước ServiceOS",
  "data": [
    {
      "goi_cuoc": "trial",
      "gia_thang": 0,
      "gia_nam": 0,
      "tiet_kiem_nam": 0
    },
    {
      "goi_cuoc": "basic",
      "gia_thang": 500000,
      "gia_nam": 5000000,
      "tiet_kiem_nam": 1000000
    },
    {
      "goi_cuoc": "pro",
      "gia_thang": 1500000,
      "gia_nam": 15000000,
      "tiet_kiem_nam": 3000000
    },
    {
      "goi_cuoc": "enterprise",
      "gia_thang": 5000000,
      "gia_nam": 50000000,
      "tiet_kiem_nam": 10000000
    }
  ]
}
```

## Admin Endpoints

### 6. Tạo Thanh Toán Thủ Công

**POST** `/api/billing/admin/manual-payment`

Tạo thanh toán thủ công cho B2B chuyển khoản ngân hàng.

**Request Body:**
```json
{
  "id_doanh_nghiep": "uuid",
  "so_tien": 15000000,
  "loai_tien": "VND",
  "phuong_thuc": "chuyen_khoan",
  "ma_giao_dich": "FT24010100001",
  "ghi_chu": "Thanh toán gia hạn gói Pro 12 tháng",
  "goi_cuoc": "pro",
  "chu_ky": "nam"
}
```

### 7. Kiểm Tra Và Khóa Tenant Hết Hạn

**POST** `/api/billing/admin/check-expired`

Kiểm tra và khóa tất cả tenant hết hạn gói cước.

**Response:**
```json
{
  "message": "Đã khóa 3 doanh nghiệp hết hạn gói cước",
  "so_tenant_bi_khoa": 3,
  "danh_sach": [
    {
      "id": "uuid1",
      "ten": "Công ty A",
      "ngay_het_han": "2026-01-05"
    }
  ]
}
```

## Enums

### GoiCuocEnum
- `trial` - Dùng thử
- `basic` - Cơ bản
- `pro` - Chuyên nghiệp
- `enterprise` - Doanh nghiệp

### ChuKyThanhToanEnum
- `thang` - Hàng tháng
- `nam` - Hàng năm

### LoaiTienEnum
- `VND` - Việt Nam Đồng
- `USD` - US Dollar

### PhuongThucThanhToan
- `chuyen_khoan` - Chuyển khoản ngân hàng
- `the` - Thẻ tín dụng/ghi nợ
- `tien_mat` - Tiền mặt
- `gateway` - Cổng thanh toán

### TrangThaiThanhToan
- `0` - Chờ xử lý
- `1` - Thành công
- `2` - Thất bại
- `3` - Hủy

## Logic Nghiệp Vụ

### Nâng Cấp Gói Cước
1. Kiểm tra doanh nghiệp tồn tại
2. Tính giá tiền dựa trên gói cước và chu kỳ
3. Mô phỏng thanh toán cổng (thành công)
4. Tính ngày hết hạn mới:
   - Nếu gói hiện tại còn hạn: cộng dồn thời gian
   - Nếu hết hạn: bắt đầu từ hôm nay
5. Cập nhật gói cước và ngày hết hạn cho doanh nghiệp
6. Tạo bản ghi trong ThanhToanSaas

### Khóa Tenant Hết Hạn
1. Tìm tất cả doanh nghiệp có:
   - ngay_het_han_goi < NOW()
   - trang_thai = 1 (đang hoạt động)
2. Cập nhật trang_thai = 2 (LOCKED/SUSPENDED)
3. Ghi log danh sách tenant bị khóa

## Cron Job (Đề Xuất)

Để tự động khóa tenant hết hạn, nên cài đặt Cron Job gọi endpoint:
```
POST /api/billing/admin/check-expired
```

Tần suất: Hàng ngày lúc 00:00

## Test Cases

### Test 1: Lấy Thông Tin Gói Cước
```bash
curl -X GET http://localhost:3000/api/billing/subscription \
  -H "Authorization: Bearer {token}"
```

### Test 2: Nâng Cấp Gói Cước
```bash
curl -X POST http://localhost:3000/api/billing/subscription/upgrade \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"goi_cuoc_moi": "pro", "chu_ky": "nam"}'
```

### Test 3: Lịch Sử Thanh Toán
```bash
curl -X GET "http://localhost:3000/api/billing/history?page=1&limit=10&trang_thai=1" \
  -H "Authorization: Bearer {token}"
```

### Test 4: Tạo Thanh Toán Thủ Công (Admin)
```bash
curl -X POST http://localhost:3000/api/billing/admin/manual-payment \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "id_doanh_nghiep": "uuid",
    "so_tien": 15000000,
    "loai_tien": "VND",
    "phuong_thuc": "chuyen_khoan",
    "ma_giao_dich": "FT24010100001",
    "goi_cuoc": "pro",
    "chu_ky": "nam"
  }'
```

### Test 5: Khóa Tenant Hết Hạn (Admin)
```bash
curl -X POST http://localhost:3000/api/billing/admin/check-expired \
  -H "Authorization: Bearer {admin_token}"
```

## Ghi Chú

1. Hiện tại chưa tích hợp Stripe - đang mô phỏng thanh toán thành công
2. Giá gói cước có thể cấu hình trong database sau này
3. Endpoint `check-expired` nên được bảo vệ và chỉ cho phép gọi từ Cron Job hoặc Admin
4. Cần thêm rate limiting cho endpoint nâng cấp để tránh spam

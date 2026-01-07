# Phase 9: StockPile Advanced - Warehouse & Inventory API Test

## Tổng quan

Module này quản lý:
- **Kho hàng (Warehouse)**: CRUD kho với loại CO_DINH hoặc XE (kho di động)
- **Tồn kho (Inventory)**: Quản lý số lượng sản phẩm trong từng kho
- **Lịch sử kho (Audit Trail)**: Ghi nhận mọi biến động nhập/xuất/chuyển kho

## Authentication

Tất cả API yêu cầu JWT Bearer Token:
```
Authorization: Bearer {access_token}
```

---

## PHẦN 1: WAREHOUSE MANAGEMENT (KHO)

### 1.1 Tạo kho mới

```http
POST /api/kho
Content-Type: application/json
Authorization: Bearer {token}

{
  "ten_kho": "Kho chính - Văn phòng HCM",
  "loai_kho": "co_dinh",
  "dia_chi": "123 Nguyễn Huệ, Q1, TP.HCM",
  "id_nguoi_phu_trach": "uuid-nguoi-dung"  // optional
}
```

**Loại kho:**
- `co_dinh`: Kho cố định (văn phòng, nhà xưởng)
- `xe`: Kho di động trên xe nhân viên

**Response 201:**
```json
{
  "id": "uuid-kho",
  "ten_kho": "Kho chính - Văn phòng HCM",
  "loai_kho": "co_dinh",
  "dia_chi": "123 Nguyễn Huệ, Q1, TP.HCM",
  "nguoi_phu_trach": {
    "id": "uuid",
    "ho_ten": "Nguyễn Văn A",
    "email": "nguyenvana@example.com"
  },
  "trang_thai": 1,
  "ngay_tao": "2026-01-07T10:00:00.000Z",
  "ngay_cap_nhat": "2026-01-07T10:00:00.000Z"
}
```

### 1.2 Danh sách kho (phân trang)

```http
GET /api/kho?page=1&limit=20&search=kho%20chính&loai_kho=co_dinh
Authorization: Bearer {token}
```

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "ten_kho": "Kho chính",
      "loai_kho": "co_dinh",
      "dia_chi": "...",
      "nguoi_phu_trach": null,
      "trang_thai": 1
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

### 1.3 Danh sách kho đang hoạt động (dropdown)

```http
GET /api/kho/active
Authorization: Bearer {token}
```

**Response 200:**
```json
[
  {
    "id": "uuid-1",
    "ten_kho": "Kho chính",
    "loai_kho": "co_dinh",
    "dia_chi": "..."
  },
  {
    "id": "uuid-2",
    "ten_kho": "Kho xe - Nguyễn Văn A",
    "loai_kho": "xe",
    "dia_chi": null
  }
]
```

### 1.4 Chi tiết kho

```http
GET /api/kho/{id}
Authorization: Bearer {token}
```

### 1.5 Cập nhật kho

```http
PUT /api/kho/{id}
Content-Type: application/json
Authorization: Bearer {token}

{
  "ten_kho": "Kho chính - Updated",
  "id_nguoi_phu_trach": "uuid-moi"
}
```

### 1.6 Xóa kho (soft delete)

```http
DELETE /api/kho/{id}
Authorization: Bearer {token}
```

** Lưu ý:** Không thể xóa kho nếu còn tồn kho sản phẩm.

**Response 400 (nếu còn tồn kho):**
```json
{
  "statusCode": 400,
  "message": "Không thể xóa kho \"Kho chính\" vì vẫn còn 5 sản phẩm tồn kho"
}
```

### 1.7 Khôi phục kho đã xóa

```http
PATCH /api/kho/{id}/restore
Authorization: Bearer {token}
```

### 1.8 Đếm tổng số kho

```http
GET /api/kho/count
Authorization: Bearer {token}
```

**Response 200:**
```json
5
```

---

## PHẦN 2: INVENTORY MANAGEMENT (TỒN KHO)

### 2.1 Nhập kho

```http
POST /api/ton-kho/nhap
Content-Type: application/json
Authorization: Bearer {token}

{
  "kho_id": "uuid-kho",
  "items": [
    {
      "san_pham_id": "uuid-sp-1",
      "so_luong": 100,
      "don_gia": 50000
    },
    {
      "san_pham_id": "uuid-sp-2",
      "so_luong": 50,
      "don_gia": 120000
    }
  ],
  "ly_do": "Nhập hàng từ NCC ABC",
  "nguon_nhap": "NHA_CUNG_CAP"
}
```

**Nguồn nhập:**
- `NHA_CUNG_CAP`: Nhập từ nhà cung cấp
- `CHUYEN_KHO`: Chuyển từ kho khác
- `TRA_HANG`: Hàng trả lại
- `KHAC`: Nguồn khác

**Response 201:**
```json
{
  "ma_phieu": "NK-1704585600000",
  "loai_phieu": "nhap",
  "so_items": 2,
  "tong_so_luong": 150,
  "ly_do": "Nhập hàng từ NCC ABC",
  "ngay_tao": "2026-01-07T10:00:00.000Z",
  "chi_tiet": [
    {
      "id": "uuid",
      "ma_phieu": "NK-1704585600000",
      "loai_phieu": "nhap",
      "so_luong": 100,
      "don_gia": 50000,
      "san_pham": {
        "id": "uuid",
        "ma_san_pham": "SP-001",
        "ten_san_pham": "Bộ vệ sinh máy lạnh",
        "don_vi_tinh": "Bộ"
      }
    }
  ]
}
```

### 2.2 Xuất kho

```http
POST /api/ton-kho/xuat
Content-Type: application/json
Authorization: Bearer {token}

{
  "kho_id": "uuid-kho",
  "cong_viec_id": "uuid-cong-viec",  // optional - liên kết TechMate
  "items": [
    {
      "san_pham_id": "uuid-sp-1",
      "so_luong": 5
    }
  ],
  "ly_do": "Xuất vật tư phục vụ công việc CV-001"
}
```

**⚠️ Validation:** Kiểm tra tồn kho trước khi xuất

**Response 400 (không đủ tồn kho):**
```json
{
  "statusCode": 400,
  "message": "Không đủ tồn kho để xuất",
  "errors": [
    "\"Bộ vệ sinh máy lạnh\": Yêu cầu 10, chỉ có 5 (tồn: 5, đặt trước: 0)"
  ]
}
```

### 2.3 Chuyển kho

```http
POST /api/ton-kho/chuyen
Content-Type: application/json
Authorization: Bearer {token}

{
  "tu_kho_id": "uuid-kho-nguon",
  "den_kho_id": "uuid-kho-dich",
  "items": [
    {
      "san_pham_id": "uuid-sp-1",
      "so_luong": 20
    }
  ],
  "ly_do": "Bổ sung hàng cho kho xe"
}
```

**Response 201:**
```json
{
  "ma_phieu": "CK-1704585600000",
  "loai_phieu": "chuyen",
  "so_items": 1,
  "tong_so_luong": 20,
  "ly_do": "Bổ sung hàng cho kho xe",
  "tu_kho": {
    "id": "uuid",
    "ten_kho": "Kho chính"
  },
  "den_kho": {
    "id": "uuid",
    "ten_kho": "Kho xe - Nguyễn Văn A"
  },
  "ngay_tao": "2026-01-07T10:00:00.000Z",
  "chi_tiet": [...]
}
```

### 2.4 Danh sách tồn kho theo kho

```http
GET /api/ton-kho?kho_id={uuid}&page=1&limit=20&search=máy%20lạnh&sap_het_hang=true
Authorization: Bearer {token}
```

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "id_kho": "uuid",
      "id_san_pham": "uuid",
      "so_luong": 50,
      "so_luong_dat_truoc": 5,
      "so_luong_kha_dung": 45,
      "san_pham": {
        "id": "uuid",
        "ma_san_pham": "SP-001",
        "ten_san_pham": "Bộ vệ sinh máy lạnh",
        "don_vi_tinh": "Bộ"
      },
      "ngay_cap_nhat": "2026-01-07T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 10,
    "totalPages": 1
  }
}
```

### 2.5 Thẻ kho (Stock Card / Lịch sử biến động)

```http
GET /api/ton-kho/the-kho?kho_id={uuid}&san_pham_id={uuid}&tu_ngay=2026-01-01&den_ngay=2026-12-31&loai_phieu=nhap
Authorization: Bearer {token}
```

**Response 200:**
```json
{
  "san_pham": {
    "id": "uuid",
    "ma_san_pham": "SP-001",
    "ten_san_pham": "Bộ vệ sinh máy lạnh",
    "don_vi_tinh": "Bộ"
  },
  "ton_kho_hien_tai": 50,
  "data": [
    {
      "id": "uuid",
      "ma_phieu": "NK-1704585600000",
      "loai_phieu": "nhap",
      "so_luong": 100,
      "don_gia": 50000,
      "ly_do": "Nhập hàng từ NCC ABC",
      "ngay_tao": "2026-01-07T10:00:00.000Z"
    },
    {
      "id": "uuid",
      "ma_phieu": "XK-1704585700000",
      "loai_phieu": "xuat",
      "so_luong": 50,
      "ly_do": "Xuất cho công việc CV-001",
      "cong_viec": {
        "id": "uuid",
        "ma_cong_viec": "CV-001",
        "tieu_de": "Vệ sinh máy lạnh"
      },
      "ngay_tao": "2026-01-07T11:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 2,
    "totalPages": 1
  }
}
```

### 2.6 Tồn kho theo sản phẩm (tất cả các kho)

```http
GET /api/ton-kho/san-pham/{san_pham_id}
Authorization: Bearer {token}
```

**Response 200:**
```json
{
  "san_pham": {
    "id": "uuid",
    "ma_san_pham": "SP-001",
    "ten_san_pham": "Bộ vệ sinh máy lạnh",
    "don_vi_tinh": "Bộ"
  },
  "tong_ton_kho": 150,
  "chi_tiet": [
    {
      "id": "uuid",
      "kho": {
        "id": "uuid",
        "ten_kho": "Kho chính",
        "loai_kho": "co_dinh"
      },
      "so_luong": 100,
      "so_luong_dat_truoc": 10,
      "so_luong_kha_dung": 90
    },
    {
      "id": "uuid",
      "kho": {
        "id": "uuid",
        "ten_kho": "Kho xe - Nguyễn Văn A",
        "loai_kho": "xe"
      },
      "so_luong": 50,
      "so_luong_dat_truoc": 0,
      "so_luong_kha_dung": 50
    }
  ]
}
```

### 2.7 Thống kê tồn kho

```http
GET /api/ton-kho/stats?kho_id={uuid}  // kho_id optional
Authorization: Bearer {token}
```

**Response 200:**
```json
{
  "tong_san_pham": 100,
  "tong_so_luong": 5000,
  "sap_het_hang": 5,
  "so_kho": 3,
  "muc_canh_bao": 10
}
```

---

## INTEGRATION HINTS

### TechMate Integration

Khi nhân viên báo cáo sử dụng vật tư cho công việc, module TechMate có thể gọi API xuất kho:

```typescript
// Trong TechMate Service
async reportMaterialUsage(congViecId: string, items: MaterialItem[]) {
  // Lấy kho xe của nhân viên
  const khoXe = await this.getKhoXeNhanVien(nhanVienId);
  
  // Gọi API xuất kho
  await this.tonKhoService.xuatKho(idDoanhNghiep, {
    kho_id: khoXe.id,
    cong_viec_id: congViecId,
    items: items.map(item => ({
      san_pham_id: item.san_pham_id,
      so_luong: item.so_luong
    })),
    ly_do: `Xuất vật tư cho công việc ${congViecId}`
  }, nhanVienId);
}
```

---

## ENUMS

### LoaiKho (Warehouse Type)
| Value | Description |
|-------|-------------|
| `co_dinh` | Kho cố định (văn phòng, nhà xưởng) |
| `xe` | Kho di động trên xe nhân viên |

### LoaiPhieuKho (Inventory Voucher Type)
| Value | Description |
|-------|-------------|
| `nhap` | Phiếu nhập kho |
| `xuat` | Phiếu xuất kho |
| `chuyen` | Phiếu chuyển kho |
| `kiem_ke` | Phiếu kiểm kê |

### NguonNhap (Import Source)
| Value | Description |
|-------|-------------|
| `NHA_CUNG_CAP` | Nhập từ nhà cung cấp |
| `CHUYEN_KHO` | Chuyển từ kho khác |
| `TRA_HANG` | Hàng trả lại |
| `KHAC` | Nguồn khác |

---

## VALIDATION RULES

### Kho (Warehouse)
- `ten_kho`: Bắt buộc, tối đa 255 ký tự
- `loai_kho`: Optional, mặc định `co_dinh`
- `id_nguoi_phu_trach`: Optional, phải là UUID hợp lệ và thuộc cùng doanh nghiệp

### Nhập/Xuất kho
- `kho_id`: Bắt buộc, UUID hợp lệ
- `items`: Bắt buộc, ít nhất 1 item
- `items[].san_pham_id`: Bắt buộc, UUID hợp lệ
- `items[].so_luong`: Bắt buộc, số nguyên > 0
- `items[].don_gia`: Optional (chỉ cho nhập kho), >= 0

### Chuyển kho
- `tu_kho_id` và `den_kho_id` không được trùng nhau
- Validate tồn kho đủ ở kho nguồn

---

## AUDIT TRAIL

Mọi thao tác Nhập/Xuất/Chuyển kho đều:
1. Sử dụng `prisma.$transaction` để đảm bảo toàn vẹn dữ liệu
2. Tự động tạo bản ghi `LichSuKho` với:
   - Mã phiếu tự sinh (NK-xxx, XK-xxx, CK-xxx)
   - Thông tin người thực hiện
   - Thời gian
   - Lý do
   - Liên kết công việc (nếu có)

---

## Ghi chú

- Tất cả API đều có Multi-tenant support (filter theo `id_doanh_nghiep` từ JWT)
- Soft delete cho tất cả entities
- Pagination mặc định: page=1, limit=20
- Mức cảnh báo sắp hết hàng mặc định: 10 đơn vị

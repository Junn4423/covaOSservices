# ServiceOS Backend

## Hệ sinh thái SaaS Multi-tenant cho Doanh nghiệp Dịch vụ

### Cấu trúc Monorepo

```
serviceos-backend/
├── src/                          # API Gateway Application
│   ├── main.ts                   # Bootstrap với Swagger
│   └── app.module.ts             # Main module - import 12 modules
│
├── libs/
│   ├── database/                 # Database Library
│   │   └── src/
│   │       ├── prisma.service.ts # Multi-tenant Middleware
│   │       └── database.module.ts
│   │
│   ├── common/                   # Shared Utilities
│   │   └── src/
│   │       ├── guards/           # JwtAuthGuard, RolesGuard
│   │       ├── decorators/       # @ActiveUser, @TenantId, @Public
│   │       ├── interceptors/     # ResponseInterceptor
│   │       ├── filters/          # AllExceptionsFilter
│   │       └── strategies/       # JwtStrategy
│   │
│   └── modules/                  # 12 Business Modules
│       ├── core/                 # Auth, User, Tenant
│       ├── techmate/             # Jobs, Assignments, Customers
│       ├── stockpile/            # Inventory, Products
│       ├── shiftsquad/           # Attendance, Shifts
│       ├── assettrack/           # Assets
│       ├── routeoptima/          # Routes
│       ├── quotemaster/          # Quotes, Contracts
│       ├── cashflow/             # Income/Expense
│       ├── customerportal/       # Customer Portal
│       ├── procurepool/          # Suppliers, PO
│       ├── notification/         # Notifications
│       └── billing/              # SaaS Billing
│
├── prisma/
│   └── schema.prisma             # 28 Models với Vietnamese naming
│
└── package.json
```

---

### Multi-tenant Architecture

#### Cách hoạt động:

1. **JWT Token** chứa `tenantId` (id_doanh_nghiep)
2. **JwtAuthGuard** extract và lưu vào **CLS (Continuation Local Storage)**
3. **PrismaService Middleware** tự động inject:
   - `WHERE id_doanh_nghiep = tenantId` vào mọi query READ
   - `SET id_doanh_nghiep = tenantId` vào mọi query CREATE
   - Convert DELETE thành soft delete (set `ngay_xoa`)

---

### Quick Start

```bash
# 1. Cài dependencies
npm install

# 2. Cấu hình database
cp .env.example .env
# Sửa DATABASE_URL trong .env

# 3. Generate Prisma Client
npm run db:generate

# 4. Push schema lên MySQL (DEV)
npm run db:push

# 5. Chạy dev server
npm run start:dev
```

---

### API Documentation

Sau khi chạy server, truy cập:
- **Swagger UI**: http://localhost:3001/docs
- **API Base**: http://localhost:3001/api/v1

---

### 🏗️ Tech Stack

- **Framework**: NestJS 10
- **ORM**: Prisma 5
- **Database**: MySQL 8.0
- **Auth**: JWT + Passport
- **Docs**: Swagger/OpenAPI
- **Context**: nestjs-cls (Request-scoped tenant)

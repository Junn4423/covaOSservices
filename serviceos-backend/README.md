# ServiceOS Backend

## Hệ sinh thái SaaS Multi-tenant cho Doanh nghiệp Dịch vụ

### Cấu trúc Monorepo

```
serviceos-backend/
├── src/                          # API Gateway Application
│   ├── main.ts                   # Bootstrap với Swagger + WebSocket
│   └── app.module.ts             # Main module - import all modules
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
│   └── modules/                  # Business Modules (Phases 1-16)
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
│       ├── billing/              # SaaS Billing
│       ├── analytics/            # Dashboard Analytics
│       ├── storage/              # Phase 16: MinIO/S3 File Storage
│       └── realtime/             # Phase 16: WebSocket Gateway
│
├── prisma/
│   └── schema.prisma             # Database models (Vietnamese naming)
│
└── package.json
```

---

### Multi-tenant Architecture

#### Cach hoat dong:

1. **JWT Token** chua `tenantId` (id_doanh_nghiep)
2. **JwtAuthGuard** extract va luu vao **CLS (Continuation Local Storage)**
3. **PrismaService Middleware** tu dong inject:
   - `WHERE id_doanh_nghiep = tenantId` vao moi query READ
   - `SET id_doanh_nghiep = tenantId` vao moi query CREATE
   - Convert DELETE thanh soft delete (set `ngay_xoa`)

---

### Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit DATABASE_URL in .env

# 3. Generate Prisma Client
npm run db:generate

# 4. Push schema to MySQL (DEV)
npm run db:push

# 5. (Optional) Seed demo data
npm run db:seed

# 6. Start development server
npm run start:dev
```

---

### API Documentation

After starting the server:
- **Swagger UI**: http://localhost:3001/docs
- **API Base**: http://localhost:3001/api/v1
- **WebSocket**: ws://localhost:3001

---

### Phase 16: Infrastructure Features

#### File Storage (MinIO/S3)

```bash
# Configure in .env:
STORAGE_ENDPOINT=http://localhost:9000
STORAGE_BUCKET=serviceos
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin
```

**Endpoints:**
- `POST /storage/upload` - Upload any file
- `POST /storage/upload/image` - Upload image (5MB max)
- `POST /storage/upload/document` - Upload PDF/Word/Excel (20MB max)
- `GET /storage` - List files
- `DELETE /storage/:fileId` - Delete file

#### Real-time WebSocket

**Connection:**
```javascript
const socket = io('http://localhost:3001', {
  auth: { token: 'your-jwt-token' }
});
```

**Events:**
- `connected` - Authentication successful
- `notification` - New notification received
- `notification:count` - Unread count update
- `alert` - System alert
- `broadcast` - Tenant-wide broadcast

---

### Tech Stack

- **Framework**: NestJS 10
- **ORM**: Prisma 5
- **Database**: MySQL 8.0
- **Auth**: JWT + Passport
- **Docs**: Swagger/OpenAPI
- **Context**: nestjs-cls (Request-scoped tenant)
- **Storage**: AWS S3 SDK (MinIO compatible)
- **Real-time**: Socket.io

---

### Frontend Portal

See `apps/portal/README.md` for the Next.js frontend application.

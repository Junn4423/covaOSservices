# ServiceOS - Multi-tenant SaaS Platform

A comprehensive SaaS platform for service businesses, featuring a NestJS backend and Next.js frontend.

## Project Structure

```
covaOSservices/
├── serviceos-backend/            # NestJS Backend API
│   ├── src/                      # Main application
│   ├── libs/                     # Shared libraries
│   │   ├── common/               # Guards, decorators, filters
│   │   ├── database/             # Prisma service
│   │   └── modules/              # Business modules (Phases 1-16)
│   └── prisma/                   # Database schema
│
├── apps/
│   └── portal/                   # Next.js Frontend
│       └── src/                  # React components & pages
│
└── database/
    └── covaosservices.sql        # Database dump
```

## Quick Start

### Prerequisites

- Node.js 18+
- MySQL 8.0+
- (Optional) MinIO for file storage

### Backend Setup

```bash
cd serviceos-backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit DATABASE_URL and other settings

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# (Optional) Seed demo data
npm run db:seed

# Start development server
npm run start:dev
```

Backend runs at: http://localhost:3001
- API Docs: http://localhost:3001/docs
- WebSocket: ws://localhost:3001

### Frontend Setup

```bash
cd apps/portal

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs at: http://localhost:3000

### (Optional) MinIO Setup for Storage

```bash
# Using Docker
docker run -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  minio/minio server /data --console-address ":9001"
```

MinIO Console: http://localhost:9001
- Create bucket named `serviceos`
- Set bucket policy to public (for demo)

## Environment Configuration

### Backend (.env)

```env
PORT=3001
DATABASE_URL="mysql://root:@localhost:3306/covaOSservices"
JWT_SECRET=your-secret-key
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Storage (MinIO/S3)
STORAGE_ENDPOINT=http://localhost:9000
STORAGE_BUCKET=serviceos
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

## Features by Phase

| Phase | Module | Description |
|-------|--------|-------------|
| 1-2 | Core | Authentication, Users, Tenants |
| 3-4 | TechMate | Jobs, Assignments, Customers |
| 5 | QuoteMaster | Quotes, Contracts |
| 6-7 | CashFlow | Income/Expense tracking |
| 8-9 | StockPile | Inventory, Products, Warehouses |
| 10 | ProcurePool | Suppliers, Purchase Orders |
| 11 | ShiftSquad | Attendance, Shifts, HR |
| 12 | AssetTrack + RouteOptima | Assets, Route Management |
| 13 | CustomerPortal | Customer self-service |
| 14 | Billing | SaaS subscription management |
| 15 | Analytics | Dashboard, Reports |
| 16 | Infrastructure | File Storage, WebSocket Gateway |

## API Overview

### Authentication
```
POST /api/v1/auth/login          # Login
POST /api/v1/auth/register       # Register tenant
GET  /api/v1/auth/me             # Current user
```

### Storage (Phase 16)
```
POST /api/v1/storage/upload       # Upload file
POST /api/v1/storage/upload/image # Upload image
GET  /api/v1/storage              # List files
DELETE /api/v1/storage/:id        # Delete file
```

### WebSocket Events (Phase 16)
```
notification        # New notification
notification:count  # Unread count
alert              # System alert
broadcast          # Tenant broadcast
```

## Tech Stack

### Backend
- NestJS 10
- Prisma 5 (MySQL)
- JWT + Passport
- Socket.io
- AWS S3 SDK (MinIO compatible)

### Frontend
- Next.js 14 (App Router)
- TailwindCSS + Shadcn/ui
- Zustand
- Axios + Socket.io Client

## Development

### Run Both Services

Terminal 1 (Backend):
```bash
cd serviceos-backend && npm run start:dev
```

Terminal 2 (Frontend):
```bash
cd apps/portal && npm run dev
```

### Database Commands

```bash
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema changes
npm run db:migrate    # Create migration
npm run db:studio     # Open Prisma Studio
npm run db:seed       # Seed demo data
```

## Testing

```bash
# Backend unit tests
cd serviceos-backend && npm run test

# Backend e2e tests
cd serviceos-backend && npm run test:e2e

# Frontend type check
cd apps/portal && npm run type-check
```

## License

UNLICENSED - Private project

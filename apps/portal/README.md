# ServiceOS Portal

Next.js 14 Frontend for ServiceOS - Multi-tenant SaaS Platform

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI**: TailwindCSS + Shadcn/ui components
- **State**: Zustand
- **HTTP Client**: Axios with interceptors
- **Real-time**: Socket.io Client

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit API URLs if needed

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Create `.env.local` file:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# App Configuration
NEXT_PUBLIC_APP_NAME=ServiceOS
NEXT_PUBLIC_APP_VERSION=1.0.0
```

## Project Structure

```
apps/portal/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Redirect to login
│   │   ├── globals.css           # Global styles + Tailwind
│   │   ├── login/
│   │   │   └── page.tsx          # Login page
│   │   └── dashboard/
│   │       ├── layout.tsx        # Dashboard layout (auth protected)
│   │       ├── page.tsx          # Dashboard home
│   │       ├── storage/
│   │       │   └── page.tsx      # File upload demo
│   │       ├── realtime/
│   │       │   └── page.tsx      # WebSocket demo
│   │       └── profile/
│   │           └── page.tsx      # User profile
│   │
│   ├── components/
│   │   ├── ui/                   # Shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...
│   │   └── layout/
│   │       ├── sidebar.tsx       # Dashboard sidebar
│   │       └── header.tsx        # Dashboard header
│   │
│   ├── lib/
│   │   ├── api.ts                # Axios instance + endpoints
│   │   ├── socket.ts             # Socket.io client
│   │   └── utils.ts              # Utility functions
│   │
│   ├── store/
│   │   ├── auth.store.ts         # Authentication state
│   │   ├── socket.store.ts       # WebSocket state
│   │   └── index.ts              # Store exports
│   │
│   ├── hooks/
│   │   └── use-toast.ts          # Toast hook
│   │
│   └── types/
│       └── index.ts              # TypeScript types
│
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── next.config.js
└── package.json
```

## Features

### Authentication
- Login with email, password, and optional tenant code
- JWT token stored in localStorage
- Auto-redirect when not authenticated
- Persistent auth state with Zustand

### Storage Demo
- Upload images (JPEG, PNG, WebP, SVG - 5MB max)
- Upload documents (PDF, Word, Excel - 20MB max)
- View uploaded files with public URLs
- Delete files from storage

### Real-time Demo
- WebSocket connection status indicator
- Send test notifications
- Real-time notification feed
- Notification count badge

### Profile
- View user information
- Upload and change avatar
- View tenant/organization info

## API Integration

The frontend expects the backend to be running at `http://localhost:3001`:

```bash
# Start backend first
cd serviceos-backend
npm run start:dev

# Then start frontend
cd apps/portal
npm run dev
```

## Authentication Flow

1. User enters credentials on `/login`
2. Frontend calls `POST /api/v1/auth/login`
3. Backend returns JWT token and user data
4. Token stored in localStorage and Zustand state
5. Axios interceptor attaches `Authorization: Bearer <token>` to all requests
6. WebSocket connects with token in handshake

## WebSocket Events

The frontend listens for these events:
- `connected` - Authentication success
- `notification` - New notification
- `notification:count` - Unread count update
- `alert` - System alerts
- `broadcast` - Tenant-wide messages

## Development

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Type check
npm run type-check

# Lint
npm run lint
```

## Demo Credentials

After seeding the backend database:
```
Email: admin@serviceos-demo.vn
Password: Admin@123
Tenant Code: DEMO (optional)
```

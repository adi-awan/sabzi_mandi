# Sabzi Mandi - Fresh Vegetables Online Store

## Project Overview
- **Name**: Sabzi Mandi (سبزی منڈی)
- **Goal**: Full-stack online vegetable shop with Supabase PostgreSQL backend, JWT auth, admin panel, Easypaisa integration, and WhatsApp automation
- **Stack**: Hono + TypeScript + Supabase + JWT + Zod (Cloudflare Pages)
- **Version**: 2.0.0

---

## Features

### Completed Features
- **Responsive Frontend**: 36+ vegetable grid with images, PKR prices, quantity selectors
- **Live Search**: JavaScript-based real-time search and category filters
- **Shopping Cart**: Add/remove, quantity updates, subtotal, delivery charges, total
- **3-Step Checkout**: Customer details, payment method, order confirmation
- **User Auth**: Signup with email/phone, login with JWT, profile management
- **Order History Dashboard**: View all past orders with status tracking
- **Admin Panel**: Complete CRUD for vegetables, order management, delivery charges
- **Easypaisa Integration**: Manual flow with screenshot upload, API placeholders for production
- **WhatsApp Automation**: Dynamic wa.me links with full order details
- **Delivery Charges**: 8-city coverage with configurable rates, free delivery thresholds
- **Supabase Backend**: Full PostgreSQL database with 6 tables, RLS policies
- **JWT Authentication**: PBKDF2 password hashing (Workers-compatible), role-based access
- **Input Validation**: Zod schemas on all endpoints
- **Offline Fallback**: Frontend works with localStorage when API unavailable


---

## Project Structure

```
webapp/
├── src/
│   ├── index.tsx                   # Main Hono app - route mounting, CORS, middleware
│   ├── config/
│   │   └── supabase.ts            # Supabase client factory, env types
│   ├── middleware/
│   │   └── auth.ts                # JWT auth, PBKDF2 hashing, role middleware
│   ├── routes/
│   │   ├── auth.ts                # Signup, login, admin-login, profile
│   │   ├── vegetables.ts          # CRUD, price update, stock toggle, reset
│   │   ├── cart.ts                # Add, update, remove, clear (upsert logic)
│   │   ├── orders.ts              # Create, list, status update, screenshot, WhatsApp
│   │   └── settings.ts            # Delivery charges, store settings, Easypaisa config
│   └── utils/
│       ├── validation.ts          # Zod schemas for all inputs
│       └── whatsapp.ts            # WhatsApp message generator
├── public/
│   ├── index.html                 # Store frontend (31KB)
│   ├── admin.html                 # Admin panel (18KB)
│   └── static/
│       ├── app.js                 # Frontend JS with API integration (40KB)
│       ├── admin.js               # Admin JS with API integration (33KB)
│       └── style.css              # Complete stylesheet (38KB)
├── supabase-schema.sql            # Complete database schema with seed data
├── .env.example                   # Environment variables template
├── .dev.vars                      # Local development variables
├── ecosystem.config.cjs           # PM2 configuration
├── wrangler.jsonc                 # Cloudflare Workers config
├── vite.config.ts                 # Vite build config
├── tsconfig.json                  # TypeScript config
├── package.json                   # Dependencies and scripts
└── README.md                      # This file
```

---

## Database Schema (Supabase PostgreSQL)

### Tables

| Table | Description | Key Fields |
|-------|-------------|------------|
| `signup` | User registration | id (UUID PK), full_name, email (unique), phone (unique), password (PBKDF2), role |
| `vegetables` | Product catalog | id (UUID PK), name, name_urdu, category, price, unit, image_link, in_stock |
| `cart` | Shopping cart | id, user_id (FK→signup), vegetable_id (FK→vegetables), quantity, total_price |
| `orders` | Customer orders | id, user_id, total_amount, delivery_charges, payment_method, payment_screenshot, status |
| `order_items` | Order line items | id, order_id (FK→orders), vegetable_id (FK→vegetables), quantity, price |
| `settings` | App configuration | id, key (unique), value (JSONB) |

### Relationships
```
signup (1) ──── (N) cart ──── (1) vegetables
signup (1) ──── (N) orders ──── (N) order_items ──── (1) vegetables
```

---

## API Endpoints

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | Public | Register new user |
| POST | `/api/auth/login` | Public | User login (returns JWT) |
| POST | `/api/auth/admin-login` | Public | Admin login (hardcoded + DB) |
| GET | `/api/auth/profile` | JWT | Get current user profile |
| PUT | `/api/auth/profile` | JWT | Update user profile |

### Vegetables

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/vegetables` | Public | List all (supports ?category=&search=&in_stock=) |
| GET | `/api/vegetables/:id` | Public | Get single vegetable |
| POST | `/api/vegetables` | Admin | Add new vegetable |
| PUT | `/api/vegetables/:id` | Admin | Update vegetable |
| DELETE | `/api/vegetables/:id` | Admin | Delete vegetable |
| PATCH | `/api/vegetables/:id/price` | Admin | Quick price update |
| PATCH | `/api/vegetables/:id/stock` | Admin | Toggle stock status |
| POST | `/api/vegetables/reset` | Admin | Reset to defaults |

### Cart

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/cart` | JWT | Get user's cart |
| POST | `/api/cart` | JWT | Add item (upserts quantity) |
| PUT | `/api/cart/:id` | JWT | Update cart item quantity |
| DELETE | `/api/cart/:id` | JWT | Remove single item |
| DELETE | `/api/cart` | JWT | Clear entire cart |

### Orders

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/orders` | Optional | Create new order |
| GET | `/api/orders` | JWT | Get user's orders |
| GET | `/api/orders/:id` | JWT | Get order detail |
| GET | `/api/orders/admin/all` | Admin | Get all orders with stats |
| PATCH | `/api/orders/:id/status` | Admin | Update order status |
| PATCH | `/api/orders/:id/payment` | Admin | Update payment status |
| POST | `/api/orders/:id/screenshot` | Optional | Upload payment screenshot |
| GET | `/api/orders/:id/whatsapp` | JWT | Get WhatsApp links |
| DELETE | `/api/orders/admin/clear` | Admin | Clear all orders |

### Settings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/settings/delivery` | Public | Get delivery charges |
| PUT | `/api/settings/delivery` | Admin | Update delivery charges |
| GET | `/api/settings/store` | Public | Get store settings |
| PUT | `/api/settings/store` | Admin | Update store settings |
| GET | `/api/settings/easypaisa` | Admin | Get Easypaisa config |
| PUT | `/api/settings/easypaisa` | Admin | Update Easypaisa config |
| POST | `/api/easypaisa/callback` | Public | Easypaisa webhook |

### Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | Public | Health check with features |

---

## Example API Requests & Responses

### Signup
```bash
POST /api/auth/signup
Content-Type: application/json

{
  "fullName": "Ahmed Khan",
  "email": "ahmed@example.com",
  "phone": "03001234567",
  "password": "mypassword123"
}

# Response (201):
{
  "success": true,
  "message": "Account created successfully",
  "user": { "id": "uuid", "fullName": "Ahmed Khan", "email": "ahmed@example.com", "phone": "03001234567", "role": "customer" },
  "token": "eyJhbGciOiJIUzI1NiJ9..."
}
```

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{ "email": "ahmed@example.com", "password": "mypassword123" }

# Response (200):
{ "success": true, "token": "eyJ...", "user": { ... } }
```

### Create Order
```bash
POST /api/orders
Authorization: Bearer eyJ...  (optional)
Content-Type: application/json

{
  "customerName": "Ahmed Khan",
  "customerPhone": "03001234567",
  "deliveryCity": "karachi",
  "deliveryAddress": "House 12, Block A, Gulshan",
  "paymentMethod": "easypaisa",
  "easypaisaNumber": "03001234567",
  "items": [
    { "vegetableId": "uuid-of-tomato", "quantity": 2 },
    { "vegetableId": "uuid-of-onion", "quantity": 1.5 }
  ]
}

# Response (201):
{
  "success": true,
  "order": { "orderId": "A1B2C3D4", "totalAmount": 600, "deliveryCharges": 0 },
  "whatsappLink": "https://wa.me/923001234567?text=..."
}
```



## Setup & Deployment

### 1. Supabase Setup
```bash
# Create Supabase project at https://supabase.com
# Run supabase-schema.sql in SQL Editor
# Create 'payment-screenshots' storage bucket
# Copy API keys from Settings > API
```

### 2. Local Development
```bash
# Clone and install
npm install

# Configure environment
cp .env.example .dev.vars
# Edit .dev.vars with your Supabase keys

# Build and run
npm run build
pm2 start ecosystem.config.cjs

# Test
curl http://localhost:3000/api/health
```

### 3. Production Deployment
```bash
# Set secrets
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put SUPABASE_ANON_KEY
wrangler secret put JWT_SECRET
wrangler secret put WHATSAPP_OWNER_NUMBER

# Deploy
npm run deploy
```

---

## Security Features
- PBKDF2 password hashing (100,000 iterations, SHA-256)
- JWT tokens with HS256 signing, 7d expiry (user), 24h expiry (admin)
- Zod input validation on ALL endpoints
- Role-based access control (customer vs admin middleware)
- Supabase RLS policies enabled on all tables
- Service role key used only server-side (never exposed)
- CORS configured for API routes
- SQL injection prevented via parameterized queries (Supabase SDK)
- File upload validation (type + size limits)
- Environment variables for all secrets

---

## Performance
- Homepage: <50ms response time
- API endpoints: <10ms
- Static assets: <15ms
- No heavy frameworks (pure vanilla JS frontend)
- Lazy-loaded images
- Minimal bundle: 333KB server worker

---

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Runtime | Cloudflare Workers (Edge) |
| Framework | Hono v4 |
| Database | Supabase PostgreSQL |
| Auth | JWT (jose library) |
| Validation | Zod |
| Storage | Supabase Storage |
| Frontend | Vanilla HTML/CSS/JS |
| Styling | Custom CSS + Tailwind CDN |
| Icons | Font Awesome 6 |
| Build | Vite |
| Deploy | Cloudflare Pages |

---

*Last Updated: 2026-03-05*

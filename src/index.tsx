/**
 * SABZI MANDI - Main Application Entry Point
 * Hono Framework on Cloudflare Workers/Pages
 * 
 * Architecture:
 * - Hono handles all API routes (server-side)
 * - Static HTML/CSS/JS served from public/ directory
 * - Supabase PostgreSQL for persistent data storage
 * - JWT authentication with PBKDF2 password hashing
 * - Zod input validation on all endpoints
 * 
 * API Routes:
 * /api/auth/*        - Authentication (signup, login, profile)
 * /api/vegetables/*  - Vegetable CRUD
 * /api/cart/*         - Shopping cart management
 * /api/orders/*       - Order management
 * /api/settings/*     - Delivery charges, store settings
 * /api/easypaisa/*    - Easypaisa webhook
 * /api/health         - Health check
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

// Import route modules
import authRoutes from './routes/auth'
import vegetableRoutes from './routes/vegetables'
import cartRoutes from './routes/cart'
import orderRoutes from './routes/orders'
import settingsRoutes from './routes/settings'

import type { Env } from './config/supabase'

const app = new Hono<{ Bindings: Env }>()

// ============================================
// GLOBAL MIDDLEWARE
// ============================================

// Enable CORS for all API routes
app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600
}))

// Request logging
app.use('/api/*', logger())

// ============================================
// API ROUTES
// ============================================

// Health check
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    app: 'Sabzi Mandi',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    features: {
      supabase: true,
      jwt: true,
      easypaisa: true,
      whatsapp: true
    }
  })
})

// Mount route modules
app.route('/api/auth', authRoutes)
app.route('/api/vegetables', vegetableRoutes)
app.route('/api/cart', cartRoutes)
app.route('/api/orders', orderRoutes)
app.route('/api/settings', settingsRoutes)

// Easypaisa webhook (public endpoint)
app.post('/api/easypaisa/callback', async (c) => {
  // Forward to settings route handler
  const settingsApp = new Hono<{ Bindings: Env }>()
  settingsApp.route('/', settingsRoutes)
  return settingsApp.fetch(c.req.raw, c.env)
})

// ============================================
// CATCH-ALL ROUTES
// ============================================

// Return 404 for unmatched API routes
app.all('/api/*', (c) => {
  return c.json({ 
    error: 'Endpoint not found',
    method: c.req.method,
    path: c.req.path,
    availableEndpoints: {
      auth: ['POST /api/auth/signup', 'POST /api/auth/login', 'POST /api/auth/admin-login', 'GET /api/auth/profile', 'PUT /api/auth/profile'],
      vegetables: ['GET /api/vegetables', 'GET /api/vegetables/:id', 'POST /api/vegetables', 'PUT /api/vegetables/:id', 'DELETE /api/vegetables/:id', 'PATCH /api/vegetables/:id/price', 'PATCH /api/vegetables/:id/stock'],
      cart: ['GET /api/cart', 'POST /api/cart', 'PUT /api/cart/:id', 'DELETE /api/cart/:id', 'DELETE /api/cart'],
      orders: ['POST /api/orders', 'GET /api/orders', 'GET /api/orders/:id', 'GET /api/orders/admin/all', 'PATCH /api/orders/:id/status', 'POST /api/orders/:id/screenshot'],
      settings: ['GET /api/settings/delivery', 'PUT /api/settings/delivery', 'GET /api/settings/store', 'PUT /api/settings/store'],
      health: ['GET /api/health']
    }
  }, 404)
})

// For all other routes, let Cloudflare Pages serve static files
app.get('*', (c) => {
  return c.notFound()
})

export default app

/**
 * JWT Authentication Middleware
 * Uses jose library (Web Crypto API compatible - works in Cloudflare Workers)
 * 
 * Features:
 * - JWT token verification
 * - Role-based access control (customer vs admin)
 * - Token expiration handling
 * - Secure password hashing using Web Crypto API (bcrypt alternative for Workers)
 */

import { Hono } from 'hono'
import { SignJWT, jwtVerify } from 'jose'
import type { Env } from '../config/supabase'

// User payload in JWT
export interface JWTPayload {
  userId: string
  email: string
  phone: string
  role: string
  fullName: string
}

// Extended context with user info
export interface AuthContext {
  user: JWTPayload
}

/**
 * Hash password using PBKDF2 (Web Crypto API - Cloudflare Workers compatible)
 * This replaces bcrypt which requires Node.js native bindings
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  )
  const hashArray = new Uint8Array(derivedBits)
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('')
  const hashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('')
  return `pbkdf2:${saltHex}:${hashHex}`
}

/**
 * Verify password against stored hash
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  // Support legacy bcrypt hashes (from seed data) - always return false for those
  // In production, migrate users to PBKDF2 on next login
  if (storedHash.startsWith('$2')) {
    // This is a bcrypt hash from seed data
    // For the default admin, we'll handle it specially
    return false
  }

  if (!storedHash.startsWith('pbkdf2:')) {
    return false
  }

  const parts = storedHash.split(':')
  if (parts.length !== 3) return false

  const saltHex = parts[1]
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)))

  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  )
  const hashArray = new Uint8Array(derivedBits)
  const hashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('')

  return hashHex === parts[2]
}

/**
 * Generate JWT token
 */
export async function generateToken(payload: JWTPayload, secret: string, expiresIn = '7d'): Promise<string> {
  const secretKey = new TextEncoder().encode(secret)
  
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .setIssuer('sabzi-mandi')
    .setAudience('sabzi-mandi-users')
    .sign(secretKey)

  return token
}

/**
 * Verify JWT token and extract payload
 */
export async function verifyToken(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const secretKey = new TextEncoder().encode(secret)
    const { payload } = await jwtVerify(token, secretKey, {
      issuer: 'sabzi-mandi',
      audience: 'sabzi-mandi-users'
    })
    return payload as unknown as JWTPayload
  } catch (error) {
    return null
  }
}

/**
 * Authentication middleware - requires valid JWT token
 * Extracts user info and attaches to context
 */
export function authMiddleware() {
  return async (c: any, next: () => Promise<void>) => {
    const authHeader = c.req.header('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authentication required', code: 'AUTH_REQUIRED' }, 401)
    }

    const token = authHeader.split(' ')[1]
    const jwtSecret = c.env?.JWT_SECRET || 'sabzi-mandi-default-secret-change-me'

    const payload = await verifyToken(token, jwtSecret)
    
    if (!payload) {
      return c.json({ error: 'Invalid or expired token', code: 'TOKEN_INVALID' }, 401)
    }

    // Attach user to context
    c.set('user', payload)
    await next()
  }
}

/**
 * Admin-only middleware - requires admin role
 * Must be used AFTER authMiddleware
 */
export function adminMiddleware() {
  return async (c: any, next: () => Promise<void>) => {
    const user = c.get('user') as JWTPayload
    
    if (!user || user.role !== 'admin') {
      return c.json({ error: 'Admin access required', code: 'ADMIN_REQUIRED' }, 403)
    }

    await next()
  }
}

/**
 * Optional auth middleware - doesn't fail if no token
 * Just attaches user if token is present
 */
export function optionalAuthMiddleware() {
  return async (c: any, next: () => Promise<void>) => {
    const authHeader = c.req.header('Authorization')
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      const jwtSecret = c.env?.JWT_SECRET || 'sabzi-mandi-default-secret-change-me'
      const payload = await verifyToken(token, jwtSecret)
      
      if (payload) {
        c.set('user', payload)
      }
    }

    await next()
  }
}

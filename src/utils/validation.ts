/**
 * Input Validation Schemas using Zod
 * Prevents SQL injection and ensures data integrity
 */

import { z } from 'zod'

// Pakistan phone number pattern
const pkPhoneRegex = /^03\d{9}$/

// ============================================
// AUTH SCHEMAS
// ============================================
export const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(pkPhoneRegex, 'Invalid Pakistani phone number (03XX XXXXXXX)'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100)
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
})

export const adminLoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
})

export const profileUpdateSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  phone: z.string().regex(pkPhoneRegex).optional(),
  email: z.string().email().optional()
})

// ============================================
// VEGETABLE SCHEMAS
// ============================================
export const vegetableSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  nameUrdu: z.string().max(200).optional().default(''),
  category: z.enum(['leafy', 'root', 'fruit', 'exotic', 'herbs', 'seasonal']),
  price: z.number().positive('Price must be positive'),
  unit: z.enum(['kg', 'bunch', 'piece', '250g', '500g']).default('kg'),
  imageLink: z.string().url().optional().or(z.literal('')).default(''),
  inStock: z.boolean().default(true)
})

export const vegetableUpdateSchema = vegetableSchema.partial()

export const priceUpdateSchema = z.object({
  price: z.number().positive('Price must be positive')
})

export const stockToggleSchema = z.object({
  inStock: z.boolean()
})

// ============================================
// CART SCHEMAS
// ============================================
export const addToCartSchema = z.object({
  vegetableId: z.string().uuid('Invalid vegetable ID'),
  quantity: z.number().positive('Quantity must be positive').default(1)
})

export const updateCartSchema = z.object({
  quantity: z.number().positive('Quantity must be positive')
})

// ============================================
// ORDER SCHEMAS
// ============================================
export const createOrderSchema = z.object({
  customerName: z.string().min(2, 'Name is required').max(100),
  customerPhone: z.string().regex(pkPhoneRegex, 'Invalid phone number'),
  customerEmail: z.string().email().optional().or(z.literal('')),
  deliveryAddress: z.string().min(5, 'Address is required').max(500),
  deliveryCity: z.string().min(1, 'City is required'),
  orderNotes: z.string().max(500).optional().default(''),
  paymentMethod: z.enum(['cod', 'easypaisa']),
  easypaisaNumber: z.string().regex(pkPhoneRegex).optional(),
  items: z.array(z.object({
    vegetableId: z.string().uuid(),
    quantity: z.number().positive()
  })).min(1, 'At least one item is required')
})

export const orderStatusUpdateSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'processing', 'out_for_delivery', 'completed', 'cancelled'])
})

export const paymentStatusUpdateSchema = z.object({
  paymentStatus: z.enum(['pending', 'processing', 'paid', 'failed', 'refunded'])
})

// ============================================
// SETTINGS SCHEMAS
// ============================================
export const deliveryChargesSchema = z.record(z.string(), z.object({
  charge: z.number().min(0),
  freeAbove: z.number().min(0),
  time: z.string()
}))

export const storeSettingsSchema = z.object({
  storeName: z.string().min(1).optional(),
  whatsappNumber: z.string().optional(),
  email: z.string().email().optional(),
  ownerAccountName: z.string().optional(),
  ownerAccountNumber: z.string().optional()
})

// ============================================
// HELPER: Validate and return parsed data or error
// ============================================
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return {
    success: false,
    errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
  }
}

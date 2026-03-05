/**
 * Authentication Routes
 * POST /api/auth/signup    - Register new user
 * POST /api/auth/login     - User login (returns JWT)
 * POST /api/auth/admin-login - Admin login (hardcoded + DB check)
 * GET  /api/auth/profile   - Get current user profile (protected)
 * PUT  /api/auth/profile   - Update user profile (protected)
 * POST /api/auth/logout    - Client-side token discard
 */

import { Hono } from 'hono'
import { getSupabaseClient, type Env } from '../config/supabase'
import { hashPassword, verifyPassword, generateToken, authMiddleware, type JWTPayload } from '../middleware/auth'
import { signupSchema, loginSchema, adminLoginSchema, profileUpdateSchema, validateInput } from '../utils/validation'

const auth = new Hono<{ Bindings: Env; Variables: { user: JWTPayload } }>()

// ============================================
// POST /api/auth/signup - Register new user
// ============================================
auth.post('/signup', async (c) => {
  try {
    const body = await c.req.json()
    const validation = validateInput(signupSchema, body)
    
    if (!validation.success) {
      return c.json({ error: 'Validation failed', details: validation.errors }, 400)
    }

    const { fullName, email, phone, password } = validation.data
    const supabase = getSupabaseClient(c.env)

    // Check if email already exists
    const { data: existingEmail } = await supabase
      .from('signup')
      .select('id')
      .eq('email', email)
      .single()

    if (existingEmail) {
      return c.json({ error: 'Email already registered', code: 'EMAIL_EXISTS' }, 409)
    }

    // Check if phone already exists
    const { data: existingPhone } = await supabase
      .from('signup')
      .select('id')
      .eq('phone', phone)
      .single()

    if (existingPhone) {
      return c.json({ error: 'Phone number already registered', code: 'PHONE_EXISTS' }, 409)
    }

    // Hash the password using PBKDF2 (Workers-compatible)
    const hashedPassword = await hashPassword(password)

    // Insert user into database
    const { data: newUser, error: insertError } = await supabase
      .from('signup')
      .insert({
        full_name: fullName,
        email: email.toLowerCase(),
        phone,
        password: hashedPassword,
        role: 'customer'
      })
      .select('id, full_name, email, phone, role, created_at')
      .single()

    if (insertError) {
      console.error('Signup error:', insertError)
      return c.json({ error: 'Failed to create account', details: insertError.message }, 500)
    }

    // Generate JWT token
    const jwtSecret = c.env.JWT_SECRET || 'sabzi-mandi-default-secret-change-me'
    const token = await generateToken({
      userId: newUser.id,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      fullName: newUser.full_name
    }, jwtSecret)

    return c.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: newUser.id,
        fullName: newUser.full_name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        createdAt: newUser.created_at
      },
      token
    }, 201)

  } catch (error: any) {
    console.error('Signup error:', error)
    if (error.message === 'SUPABASE_NOT_CONFIGURED') {
      return c.json({ error: 'Database not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.', code: 'DB_NOT_CONFIGURED' }, 503)
    }
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ============================================
// POST /api/auth/login - User login
// ============================================
auth.post('/login', async (c) => {
  try {
    const body = await c.req.json()
    const validation = validateInput(loginSchema, body)
    
    if (!validation.success) {
      return c.json({ error: 'Validation failed', details: validation.errors }, 400)
    }

    const { email, password } = validation.data
    const supabase = getSupabaseClient(c.env)

    // Find user by email
    const { data: user, error: findError } = await supabase
      .from('signup')
      .select('*')
      .eq('email', email.toLowerCase())
      .single()

    if (findError || !user) {
      return c.json({ error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' }, 401)
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      return c.json({ error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' }, 401)
    }

    // Generate JWT
    const jwtSecret = c.env.JWT_SECRET || 'sabzi-mandi-default-secret-change-me'
    const token = await generateToken({
      userId: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      fullName: user.full_name
    }, jwtSecret)

    return c.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      token
    })

  } catch (error: any) {
    console.error('Login error:', error)
    if (error.message === 'SUPABASE_NOT_CONFIGURED') {
      return c.json({ error: 'Database not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.', code: 'DB_NOT_CONFIGURED' }, 503)
    }
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ============================================
// POST /api/auth/admin-login - Admin login
// ============================================
auth.post('/admin-login', async (c) => {
  try {
    const body = await c.req.json()
    const validation = validateInput(adminLoginSchema, body)
    
    if (!validation.success) {
      return c.json({ error: 'Validation failed', details: validation.errors }, 400)
    }

    const { username, password } = validation.data

    // Hardcoded admin credentials check
    if (username === 'admin' && password === 'admin123') {
      let adminUser: any = null
      
      // Try to find admin in database (may fail if Supabase not configured)
      try {
        const supabase = getSupabaseClient(c.env)
        const { data } = await supabase
          .from('signup')
          .select('*')
          .eq('role', 'admin')
          .limit(1)
          .single()

        if (data) {
          adminUser = data
        } else {
          // Create admin user if doesn't exist
          const hashedPw = await hashPassword('admin123')
          const { data: newAdmin } = await supabase
            .from('signup')
            .insert({
              full_name: 'Admin',
              email: 'admin@sabzimandi.pk',
              phone: '03000000000',
              password: hashedPw,
              role: 'admin'
            })
            .select()
            .single()
          adminUser = newAdmin
        }
      } catch (dbError) {
        // Supabase not configured - continue with hardcoded admin
        console.log('Admin login: Supabase not available, using hardcoded credentials')
      }

      const jwtSecret = c.env.JWT_SECRET || 'sabzi-mandi-default-secret-change-me'
      const token = await generateToken({
        userId: adminUser?.id || 'admin',
        email: adminUser?.email || 'admin@sabzimandi.pk',
        phone: adminUser?.phone || '03000000000',
        role: 'admin',
        fullName: 'Admin'
      }, jwtSecret, '24h')

      return c.json({
        success: true,
        message: 'Admin login successful',
        user: {
          id: adminUser?.id || 'admin',
          fullName: 'Admin',
          email: adminUser?.email || 'admin@sabzimandi.pk',
          role: 'admin'
        },
        token
      })
    }

    // Also check DB for admin users with proper password
    try {
      const supabase = getSupabaseClient(c.env)
      const { data: dbAdmin } = await supabase
        .from('signup')
        .select('*')
        .eq('email', username)
        .eq('role', 'admin')
        .single()

      if (dbAdmin) {
        const isValid = await verifyPassword(password, dbAdmin.password)
        if (isValid) {
          const jwtSecret = c.env.JWT_SECRET || 'sabzi-mandi-default-secret-change-me'
          const token = await generateToken({
            userId: dbAdmin.id,
            email: dbAdmin.email,
            phone: dbAdmin.phone,
            role: 'admin',
            fullName: dbAdmin.full_name
          }, jwtSecret, '24h')

          return c.json({
            success: true,
            message: 'Admin login successful',
            user: { id: dbAdmin.id, fullName: dbAdmin.full_name, email: dbAdmin.email, role: 'admin' },
            token
          })
        }
      }
    } catch (dbError) {
      // Supabase not configured - fall through to invalid credentials
    }

    return c.json({ error: 'Invalid admin credentials', code: 'INVALID_CREDENTIALS' }, 401)

  } catch (error: any) {
    console.error('Admin login error:', error)
    if (error.message === 'SUPABASE_NOT_CONFIGURED') {
      return c.json({ error: 'Database not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.', code: 'DB_NOT_CONFIGURED' }, 503)
    }
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ============================================
// GET /api/auth/profile - Get current user (protected)
// ============================================
auth.get('/profile', authMiddleware(), async (c) => {
  try {
    const user = c.get('user') as JWTPayload
    const supabase = getSupabaseClient(c.env)

    const { data, error } = await supabase
      .from('signup')
      .select('id, full_name, email, phone, role, created_at')
      .eq('id', user.userId)
      .single()

    if (error || !data) {
      return c.json({ error: 'User not found' }, 404)
    }

    return c.json({
      user: {
        id: data.id,
        fullName: data.full_name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        createdAt: data.created_at
      }
    })
  } catch (error: any) {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ============================================
// PUT /api/auth/profile - Update user profile (protected)
// ============================================
auth.put('/profile', authMiddleware(), async (c) => {
  try {
    const user = c.get('user') as JWTPayload
    const body = await c.req.json()
    const validation = validateInput(profileUpdateSchema, body)
    
    if (!validation.success) {
      return c.json({ error: 'Validation failed', details: validation.errors }, 400)
    }

    const updates: any = {}
    if (validation.data.fullName) updates.full_name = validation.data.fullName
    if (validation.data.phone) updates.phone = validation.data.phone
    if (validation.data.email) updates.email = validation.data.email.toLowerCase()

    if (Object.keys(updates).length === 0) {
      return c.json({ error: 'No fields to update' }, 400)
    }

    const supabase = getSupabaseClient(c.env)
    const { data, error } = await supabase
      .from('signup')
      .update(updates)
      .eq('id', user.userId)
      .select('id, full_name, email, phone, role')
      .single()

    if (error) {
      if (error.code === '23505') {
        return c.json({ error: 'Email or phone already in use' }, 409)
      }
      return c.json({ error: 'Failed to update profile' }, 500)
    }

    return c.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: data.id,
        fullName: data.full_name,
        email: data.email,
        phone: data.phone,
        role: data.role
      }
    })
  } catch (error: any) {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export default auth

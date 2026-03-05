/**
 * Vegetables Routes
 * GET    /api/vegetables           - List all vegetables (public)
 * GET    /api/vegetables/:id       - Get single vegetable (public)
 * POST   /api/vegetables           - Add new vegetable (admin)
 * PUT    /api/vegetables/:id       - Update vegetable (admin)
 * DELETE /api/vegetables/:id       - Delete vegetable (admin)
 * PATCH  /api/vegetables/:id/price - Quick price update (admin)
 * PATCH  /api/vegetables/:id/stock - Toggle stock status (admin)
 * POST   /api/vegetables/reset     - Reset to defaults (admin)
 */

import { Hono } from 'hono'
import { getSupabaseClient, type Env } from '../config/supabase'
import { authMiddleware, adminMiddleware, type JWTPayload } from '../middleware/auth'
import { vegetableSchema, vegetableUpdateSchema, priceUpdateSchema, stockToggleSchema, validateInput } from '../utils/validation'

const vegetables = new Hono<{ Bindings: Env; Variables: { user: JWTPayload } }>()

// ============================================
// GET /api/vegetables - List all (public)
// ============================================
vegetables.get('/', async (c) => {
  try {
    const supabase = getSupabaseClient(c.env)
    const category = c.req.query('category')
    const search = c.req.query('search')
    const inStock = c.req.query('in_stock')

    let query = supabase
      .from('vegetables')
      .select('*')
      .order('created_at', { ascending: true })

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,name_urdu.ilike.%${search}%,category.ilike.%${search}%`)
    }

    if (inStock === 'true') {
      query = query.eq('in_stock', true)
    }

    const { data, error } = await query

    if (error) {
      console.error('Fetch vegetables error:', error)
      return c.json({ error: 'Failed to fetch vegetables' }, 500)
    }

    // Map to frontend-compatible format
    const mapped = (data || []).map(v => ({
      id: v.id,
      name: v.name,
      nameUrdu: v.name_urdu,
      category: v.category,
      price: Number(v.price),
      unit: v.unit,
      image: v.image_link,
      inStock: v.in_stock,
      createdAt: v.created_at,
      updatedAt: v.updated_at
    }))

    return c.json({ vegetables: mapped, count: mapped.length })

  } catch (error: any) {
    console.error('Vegetables error:', error)
    if (error.message === 'SUPABASE_NOT_CONFIGURED') {
      return c.json({ error: 'Database not configured. Frontend will use local defaults.', code: 'DB_NOT_CONFIGURED' }, 503)
    }
    return c.json({ error: 'Failed to fetch vegetables' }, 500)
  }
})

// ============================================
// GET /api/vegetables/:id - Get single (public)
// ============================================
vegetables.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const supabase = getSupabaseClient(c.env)

    const { data, error } = await supabase
      .from('vegetables')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return c.json({ error: 'Vegetable not found' }, 404)
    }

    return c.json({
      vegetable: {
        id: data.id,
        name: data.name,
        nameUrdu: data.name_urdu,
        category: data.category,
        price: Number(data.price),
        unit: data.unit,
        image: data.image_link,
        inStock: data.in_stock,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    })
  } catch (error: any) {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ============================================
// POST /api/vegetables - Add new (admin only)
// ============================================
vegetables.post('/', authMiddleware(), adminMiddleware(), async (c) => {
  try {
    const body = await c.req.json()
    const validation = validateInput(vegetableSchema, body)
    
    if (!validation.success) {
      return c.json({ error: 'Validation failed', details: validation.errors }, 400)
    }

    const { name, nameUrdu, category, price, unit, imageLink, inStock } = validation.data
    const supabase = getSupabaseClient(c.env)

    const { data, error } = await supabase
      .from('vegetables')
      .insert({
        name,
        name_urdu: nameUrdu || '',
        category,
        price,
        unit,
        image_link: imageLink || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=400&fit=crop',
        in_stock: inStock
      })
      .select()
      .single()

    if (error) {
      console.error('Add vegetable error:', error)
      return c.json({ error: 'Failed to add vegetable' }, 500)
    }

    return c.json({
      success: true,
      message: 'Vegetable added successfully',
      vegetable: {
        id: data.id,
        name: data.name,
        nameUrdu: data.name_urdu,
        category: data.category,
        price: Number(data.price),
        unit: data.unit,
        image: data.image_link,
        inStock: data.in_stock
      }
    }, 201)
  } catch (error: any) {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ============================================
// PUT /api/vegetables/:id - Update (admin only)
// ============================================
vegetables.put('/:id', authMiddleware(), adminMiddleware(), async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const validation = validateInput(vegetableUpdateSchema, body)
    
    if (!validation.success) {
      return c.json({ error: 'Validation failed', details: validation.errors }, 400)
    }

    const updates: any = {}
    if (validation.data.name !== undefined) updates.name = validation.data.name
    if (validation.data.nameUrdu !== undefined) updates.name_urdu = validation.data.nameUrdu
    if (validation.data.category !== undefined) updates.category = validation.data.category
    if (validation.data.price !== undefined) updates.price = validation.data.price
    if (validation.data.unit !== undefined) updates.unit = validation.data.unit
    if (validation.data.imageLink !== undefined) updates.image_link = validation.data.imageLink
    if (validation.data.inStock !== undefined) updates.in_stock = validation.data.inStock

    const supabase = getSupabaseClient(c.env)
    const { data, error } = await supabase
      .from('vegetables')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return c.json({ error: 'Failed to update vegetable' }, 500)
    }

    if (!data) {
      return c.json({ error: 'Vegetable not found' }, 404)
    }

    return c.json({
      success: true,
      message: 'Vegetable updated successfully',
      vegetable: {
        id: data.id,
        name: data.name,
        nameUrdu: data.name_urdu,
        category: data.category,
        price: Number(data.price),
        unit: data.unit,
        image: data.image_link,
        inStock: data.in_stock
      }
    })
  } catch (error: any) {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ============================================
// DELETE /api/vegetables/:id - Delete (admin only)
// ============================================
vegetables.delete('/:id', authMiddleware(), adminMiddleware(), async (c) => {
  try {
    const id = c.req.param('id')
    const supabase = getSupabaseClient(c.env)

    const { error } = await supabase
      .from('vegetables')
      .delete()
      .eq('id', id)

    if (error) {
      return c.json({ error: 'Failed to delete vegetable' }, 500)
    }

    return c.json({ success: true, message: 'Vegetable deleted successfully' })
  } catch (error: any) {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ============================================
// PATCH /api/vegetables/:id/price - Quick price update (admin)
// ============================================
vegetables.patch('/:id/price', authMiddleware(), adminMiddleware(), async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const validation = validateInput(priceUpdateSchema, body)
    
    if (!validation.success) {
      return c.json({ error: 'Validation failed', details: validation.errors }, 400)
    }

    const supabase = getSupabaseClient(c.env)
    const { data, error } = await supabase
      .from('vegetables')
      .update({ price: validation.data.price })
      .eq('id', id)
      .select('id, name, price')
      .single()

    if (error || !data) {
      return c.json({ error: 'Failed to update price' }, 500)
    }

    return c.json({
      success: true,
      message: `${data.name} price updated to Rs. ${data.price}`,
      vegetable: { id: data.id, name: data.name, price: Number(data.price) }
    })
  } catch (error: any) {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ============================================
// PATCH /api/vegetables/:id/stock - Toggle stock (admin)
// ============================================
vegetables.patch('/:id/stock', authMiddleware(), adminMiddleware(), async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const validation = validateInput(stockToggleSchema, body)
    
    if (!validation.success) {
      return c.json({ error: 'Validation failed', details: validation.errors }, 400)
    }

    const supabase = getSupabaseClient(c.env)
    const { data, error } = await supabase
      .from('vegetables')
      .update({ in_stock: validation.data.inStock })
      .eq('id', id)
      .select('id, name, in_stock')
      .single()

    if (error || !data) {
      return c.json({ error: 'Failed to toggle stock' }, 500)
    }

    return c.json({
      success: true,
      message: `${data.name} ${data.in_stock ? 'is now in stock' : 'marked as out of stock'}`,
      vegetable: { id: data.id, name: data.name, inStock: data.in_stock }
    })
  } catch (error: any) {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ============================================
// POST /api/vegetables/reset - Reset to defaults (admin)
// ============================================
vegetables.post('/reset', authMiddleware(), adminMiddleware(), async (c) => {
  try {
    const supabase = getSupabaseClient(c.env)

    // Delete all existing vegetables
    await supabase.from('vegetables').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // Re-insert defaults
    const defaults = [
      { name: 'Tamatar (Tomato)', name_urdu: 'ٹماٹر', category: 'fruit', price: 180, unit: 'kg', image_link: 'https://images.unsplash.com/photo-1546470427-0d4db154ceb8?w=400&h=400&fit=crop', in_stock: true },
      { name: 'Pyaz (Onion)', name_urdu: 'پیاز', category: 'root', price: 160, unit: 'kg', image_link: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&h=400&fit=crop', in_stock: true },
      { name: 'Aloo (Potato)', name_urdu: 'آلو', category: 'root', price: 120, unit: 'kg', image_link: 'https://images.unsplash.com/photo-1518977676601-b53f82ber40?w=400&h=400&fit=crop', in_stock: true },
      { name: 'Hari Mirch (Green Chilli)', name_urdu: 'ہری مرچ', category: 'fruit', price: 220, unit: 'kg', image_link: 'https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?w=400&h=400&fit=crop', in_stock: true },
      { name: 'Adrak (Ginger)', name_urdu: 'ادرک', category: 'root', price: 450, unit: 'kg', image_link: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&h=400&fit=crop', in_stock: true },
      { name: 'Lehsun (Garlic)', name_urdu: 'لہسن', category: 'root', price: 380, unit: 'kg', image_link: 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2571?w=400&h=400&fit=crop', in_stock: true },
      { name: 'Palak (Spinach)', name_urdu: 'پالک', category: 'leafy', price: 60, unit: 'bunch', image_link: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&h=400&fit=crop', in_stock: true },
      { name: 'Gobhi (Cauliflower)', name_urdu: 'گوبھی', category: 'fruit', price: 140, unit: 'kg', image_link: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&h=400&fit=crop', in_stock: true },
      { name: 'Band Gobhi (Cabbage)', name_urdu: 'بند گوبھی', category: 'leafy', price: 80, unit: 'kg', image_link: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=400&h=400&fit=crop', in_stock: true },
      { name: 'Gajar (Carrot)', name_urdu: 'گاجر', category: 'root', price: 100, unit: 'kg', image_link: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&h=400&fit=crop', in_stock: true },
      { name: 'Mooli (Radish)', name_urdu: 'مولی', category: 'root', price: 60, unit: 'kg', image_link: 'https://images.unsplash.com/photo-1447175008436-054170c2e979?w=400&h=400&fit=crop', in_stock: true },
      { name: 'Kheeray (Cucumber)', name_urdu: 'کھیرا', category: 'fruit', price: 120, unit: 'kg', image_link: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=400&h=400&fit=crop', in_stock: true },
      { name: 'Shimla Mirch (Capsicum)', name_urdu: 'شملہ مرچ', category: 'fruit', price: 250, unit: 'kg', image_link: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400&h=400&fit=crop', in_stock: true },
      { name: 'Baingan (Eggplant)', name_urdu: 'بینگن', category: 'fruit', price: 130, unit: 'kg', image_link: 'https://images.unsplash.com/photo-1615484477778-ca3b77940c25?w=400&h=400&fit=crop', in_stock: true },
      { name: 'Bhindi (Okra/Lady Finger)', name_urdu: 'بھنڈی', category: 'fruit', price: 200, unit: 'kg', image_link: 'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=400&h=400&fit=crop', in_stock: true },
      { name: 'Pudina (Mint)', name_urdu: 'پودینہ', category: 'herbs', price: 40, unit: 'bunch', image_link: 'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=400&h=400&fit=crop', in_stock: true },
      { name: 'Dhaniya (Coriander)', name_urdu: 'دھنیا', category: 'herbs', price: 40, unit: 'bunch', image_link: 'https://images.unsplash.com/photo-1595855759920-86582396756a?w=400&h=400&fit=crop', in_stock: true },
      { name: 'Matar (Green Peas)', name_urdu: 'مٹر', category: 'seasonal', price: 280, unit: 'kg', image_link: 'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=400&h=400&fit=crop', in_stock: true },
    ]

    const { error } = await supabase.from('vegetables').insert(defaults)

    if (error) {
      return c.json({ error: 'Failed to reset vegetables' }, 500)
    }

    return c.json({ success: true, message: 'Vegetables reset to defaults', count: defaults.length })
  } catch (error: any) {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export default vegetables

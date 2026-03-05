/**
 * Cart Routes
 * GET    /api/cart           - Get user's cart (protected)
 * POST   /api/cart           - Add item to cart / upsert quantity (protected)
 * PUT    /api/cart/:id       - Update cart item quantity (protected)
 * DELETE /api/cart/:id       - Remove item from cart (protected)
 * DELETE /api/cart           - Clear entire cart (protected)
 */

import { Hono } from 'hono'
import { getSupabaseClient, type Env } from '../config/supabase'
import { authMiddleware, type JWTPayload } from '../middleware/auth'
import { addToCartSchema, updateCartSchema, validateInput } from '../utils/validation'

const cart = new Hono<{ Bindings: Env; Variables: { user: JWTPayload } }>()

// All cart routes require authentication
cart.use('*', authMiddleware())

// ============================================
// GET /api/cart - Get user's cart
// ============================================
cart.get('/', async (c) => {
  try {
    const user = c.get('user') as JWTPayload
    const supabase = getSupabaseClient(c.env)

    const { data, error } = await supabase
      .from('cart')
      .select(`
        id,
        quantity,
        total_price,
        vegetable_id,
        vegetables (
          id,
          name,
          name_urdu,
          category,
          price,
          unit,
          image_link,
          in_stock
        )
      `)
      .eq('user_id', user.userId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Cart fetch error:', error)
      return c.json({ error: 'Failed to fetch cart' }, 500)
    }

    const items = (data || []).map((item: any) => ({
      cartItemId: item.id,
      vegetableId: item.vegetable_id,
      quantity: Number(item.quantity),
      totalPrice: Number(item.total_price),
      vegetable: item.vegetables ? {
        id: item.vegetables.id,
        name: item.vegetables.name,
        nameUrdu: item.vegetables.name_urdu,
        category: item.vegetables.category,
        price: Number(item.vegetables.price),
        unit: item.vegetables.unit,
        image: item.vegetables.image_link,
        inStock: item.vegetables.in_stock
      } : null
    }))

    const subtotal = items.reduce((sum: number, item: any) => {
      const price = item.vegetable ? item.vegetable.price : 0
      return sum + (price * item.quantity)
    }, 0)

    return c.json({
      items,
      count: items.length,
      subtotal
    })

  } catch (error: any) {
    console.error('Cart error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ============================================
// POST /api/cart - Add item (upserts quantity)
// ============================================
cart.post('/', async (c) => {
  try {
    const user = c.get('user') as JWTPayload
    const body = await c.req.json()
    const validation = validateInput(addToCartSchema, body)
    
    if (!validation.success) {
      return c.json({ error: 'Validation failed', details: validation.errors }, 400)
    }

    const { vegetableId, quantity } = validation.data
    const supabase = getSupabaseClient(c.env)

    // Verify vegetable exists and is in stock
    const { data: veg, error: vegError } = await supabase
      .from('vegetables')
      .select('id, name, price, in_stock')
      .eq('id', vegetableId)
      .single()

    if (vegError || !veg) {
      return c.json({ error: 'Vegetable not found' }, 404)
    }

    if (!veg.in_stock) {
      return c.json({ error: 'This vegetable is currently out of stock' }, 400)
    }

    const totalPrice = Number(veg.price) * quantity

    // Upsert: if exists, update quantity; otherwise insert
    const { data: existing } = await supabase
      .from('cart')
      .select('id, quantity')
      .eq('user_id', user.userId)
      .eq('vegetable_id', vegetableId)
      .single()

    let result
    if (existing) {
      // Update existing cart item
      result = await supabase
        .from('cart')
        .update({
          quantity,
          total_price: totalPrice
        })
        .eq('id', existing.id)
        .select()
        .single()
    } else {
      // Insert new cart item
      result = await supabase
        .from('cart')
        .insert({
          user_id: user.userId,
          vegetable_id: vegetableId,
          quantity,
          total_price: totalPrice
        })
        .select()
        .single()
    }

    if (result.error) {
      console.error('Cart upsert error:', result.error)
      return c.json({ error: 'Failed to update cart' }, 500)
    }

    return c.json({
      success: true,
      message: existing ? `${veg.name} quantity updated` : `${veg.name} added to cart`,
      item: {
        cartItemId: result.data.id,
        vegetableId,
        quantity,
        totalPrice
      }
    }, existing ? 200 : 201)

  } catch (error: any) {
    console.error('Cart add error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ============================================
// PUT /api/cart/:id - Update quantity
// ============================================
cart.put('/:id', async (c) => {
  try {
    const user = c.get('user') as JWTPayload
    const cartItemId = c.req.param('id')
    const body = await c.req.json()
    const validation = validateInput(updateCartSchema, body)
    
    if (!validation.success) {
      return c.json({ error: 'Validation failed', details: validation.errors }, 400)
    }

    const { quantity } = validation.data
    const supabase = getSupabaseClient(c.env)

    // Get cart item with vegetable price
    const { data: cartItem } = await supabase
      .from('cart')
      .select('id, vegetable_id, vegetables(price)')
      .eq('id', cartItemId)
      .eq('user_id', user.userId)
      .single()

    if (!cartItem) {
      return c.json({ error: 'Cart item not found' }, 404)
    }

    const vegPrice = Number((cartItem as any).vegetables?.price || 0)
    const totalPrice = vegPrice * quantity

    const { data, error } = await supabase
      .from('cart')
      .update({ quantity, total_price: totalPrice })
      .eq('id', cartItemId)
      .eq('user_id', user.userId)
      .select()
      .single()

    if (error || !data) {
      return c.json({ error: 'Failed to update cart item' }, 500)
    }

    return c.json({
      success: true,
      message: 'Cart item updated',
      item: {
        cartItemId: data.id,
        quantity: Number(data.quantity),
        totalPrice: Number(data.total_price)
      }
    })
  } catch (error: any) {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ============================================
// DELETE /api/cart/:id - Remove single item
// ============================================
cart.delete('/:id', async (c) => {
  try {
    const user = c.get('user') as JWTPayload
    const cartItemId = c.req.param('id')
    const supabase = getSupabaseClient(c.env)

    const { error } = await supabase
      .from('cart')
      .delete()
      .eq('id', cartItemId)
      .eq('user_id', user.userId)

    if (error) {
      return c.json({ error: 'Failed to remove item' }, 500)
    }

    return c.json({ success: true, message: 'Item removed from cart' })
  } catch (error: any) {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ============================================
// DELETE /api/cart - Clear entire cart
// ============================================
cart.delete('/', async (c) => {
  try {
    const user = c.get('user') as JWTPayload
    const supabase = getSupabaseClient(c.env)

    const { error } = await supabase
      .from('cart')
      .delete()
      .eq('user_id', user.userId)

    if (error) {
      return c.json({ error: 'Failed to clear cart' }, 500)
    }

    return c.json({ success: true, message: 'Cart cleared' })
  } catch (error: any) {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export default cart

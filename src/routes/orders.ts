/**
 * Order Routes
 * POST   /api/orders                  - Create new order (optional auth)
 * GET    /api/orders                  - Get user's orders (protected)
 * GET    /api/orders/:id              - Get order detail (protected)
 * GET    /api/orders/admin/all        - Get all orders (admin)
 * PATCH  /api/orders/:id/status       - Update order status (admin)
 * PATCH  /api/orders/:id/payment      - Update payment status (admin)
 * POST   /api/orders/:id/screenshot   - Upload payment screenshot
 * GET    /api/orders/:id/whatsapp     - Get WhatsApp link for order
 * DELETE /api/orders/admin/clear      - Clear all orders (admin)
 */

import { Hono } from 'hono'
import { getSupabaseClient, type Env } from '../config/supabase'
import { authMiddleware, adminMiddleware, optionalAuthMiddleware, type JWTPayload } from '../middleware/auth'
import { createOrderSchema, orderStatusUpdateSchema, paymentStatusUpdateSchema, validateInput } from '../utils/validation'
import { generateWhatsAppOrderLink, generateCustomerWhatsAppLink, type WhatsAppOrderData } from '../utils/whatsapp'

const orders = new Hono<{ Bindings: Env; Variables: { user: JWTPayload } }>()

// ============================================
// POST /api/orders - Create new order
// ============================================
orders.post('/', optionalAuthMiddleware(), async (c) => {
  try {
    const body = await c.req.json()
    const validation = validateInput(createOrderSchema, body)
    
    if (!validation.success) {
      return c.json({ error: 'Validation failed', details: validation.errors }, 400)
    }

    const data = validation.data
    const supabase = getSupabaseClient(c.env)
    const user = c.get('user') as JWTPayload | undefined

    // Validate easypaisa number if payment method is easypaisa
    if (data.paymentMethod === 'easypaisa' && !data.easypaisaNumber) {
      return c.json({ error: 'Easypaisa number is required for Easypaisa payment' }, 400)
    }

    // Fetch vegetable details and calculate totals
    const vegIds = data.items.map(item => item.vegetableId)
    const { data: vegetables, error: vegError } = await supabase
      .from('vegetables')
      .select('id, name, name_urdu, price, unit, in_stock')
      .in('id', vegIds)

    if (vegError || !vegetables) {
      return c.json({ error: 'Failed to fetch vegetable details' }, 500)
    }

    // Validate all vegetables exist and are in stock
    const vegMap = new Map(vegetables.map(v => [v.id, v]))
    for (const item of data.items) {
      const veg = vegMap.get(item.vegetableId)
      if (!veg) {
        return c.json({ error: `Vegetable not found: ${item.vegetableId}` }, 400)
      }
      if (!veg.in_stock) {
        return c.json({ error: `${veg.name} is currently out of stock` }, 400)
      }
    }

    // Calculate subtotal
    let subtotal = 0
    const orderItemsData = data.items.map(item => {
      const veg = vegMap.get(item.vegetableId)!
      const price = Number(veg.price)
      const itemTotal = price * item.quantity
      subtotal += itemTotal
      return {
        vegetable_id: veg.id,
        vegetable_name: veg.name,
        quantity: item.quantity,
        price: price,
        unit: veg.unit
      }
    })

    // Get delivery charges
    let deliveryCharges = 0
    const { data: settingsData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'delivery_charges')
      .single()

    if (settingsData) {
      const charges = settingsData.value as Record<string, any>
      const cityCharges = charges[data.deliveryCity.toLowerCase()]
      if (cityCharges) {
        deliveryCharges = subtotal >= cityCharges.freeAbove ? 0 : cityCharges.charge
      }
    }

    const totalAmount = subtotal + deliveryCharges

    // Create order
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user?.userId || null,
        customer_name: data.customerName,
        customer_phone: data.customerPhone,
        customer_email: data.customerEmail || null,
        delivery_address: data.deliveryAddress,
        delivery_city: data.deliveryCity,
        order_notes: data.orderNotes || '',
        total_amount: totalAmount,
        delivery_charges: deliveryCharges,
        payment_method: data.paymentMethod,
        easypaisa_number: data.easypaisaNumber || null,
        payment_status: data.paymentMethod === 'cod' ? 'pending' : 'processing',
        status: 'pending'
      })
      .select()
      .single()

    if (orderError || !newOrder) {
      console.error('Order creation error:', orderError)
      return c.json({ error: 'Failed to create order' }, 500)
    }

    // Create order items
    const itemsWithOrderId = orderItemsData.map(item => ({
      ...item,
      order_id: newOrder.id
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsWithOrderId)

    if (itemsError) {
      console.error('Order items error:', itemsError)
      // Clean up order if items fail
      await supabase.from('orders').delete().eq('id', newOrder.id)
      return c.json({ error: 'Failed to create order items' }, 500)
    }

    // Clear user's cart after successful order
    if (user) {
      await supabase.from('cart').delete().eq('user_id', user.userId)
    }

    // Generate WhatsApp link
    const ownerNumber = c.env.WHATSAPP_OWNER_NUMBER || '923001234567'
    const whatsappData: WhatsAppOrderData = {
      orderId: newOrder.id.substring(0, 8).toUpperCase(),
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      deliveryAddress: data.deliveryAddress,
      deliveryCity: data.deliveryCity,
      items: orderItemsData.map(item => ({
        name: item.vegetable_name,
        quantity: item.quantity,
        unit: item.unit,
        price: item.price
      })),
      totalAmount,
      deliveryCharges,
      paymentMethod: data.paymentMethod
    }

    const whatsappLink = generateWhatsAppOrderLink(whatsappData, ownerNumber)

    // Handle Easypaisa payment
    let easypaisaResponse = null
    if (data.paymentMethod === 'easypaisa') {
      easypaisaResponse = await processEasypaisaPayment(c.env, {
        orderId: newOrder.id,
        amount: totalAmount,
        mobileNo: data.easypaisaNumber!
      })
    }

    return c.json({
      success: true,
      message: 'Order placed successfully!',
      order: {
        id: newOrder.id,
        orderId: newOrder.id.substring(0, 8).toUpperCase(),
        totalAmount,
        deliveryCharges,
        subtotal,
        status: newOrder.status,
        paymentMethod: data.paymentMethod,
        paymentStatus: newOrder.payment_status,
        createdAt: newOrder.created_at,
        itemCount: data.items.length
      },
      whatsappLink,
      easypaisaResponse
    }, 201)

  } catch (error: any) {
    console.error('Order creation error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ============================================
// GET /api/orders - Get user's orders
// ============================================
orders.get('/', authMiddleware(), async (c) => {
  try {
    const user = c.get('user') as JWTPayload
    const supabase = getSupabaseClient(c.env)

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          vegetable_name,
          quantity,
          price,
          unit
        )
      `)
      .eq('user_id', user.userId)
      .order('created_at', { ascending: false })

    if (error) {
      return c.json({ error: 'Failed to fetch orders' }, 500)
    }

    const mapped = (data || []).map(o => ({
      id: o.id,
      orderId: o.id.substring(0, 8).toUpperCase(),
      customerName: o.customer_name,
      customerPhone: o.customer_phone,
      deliveryCity: o.delivery_city,
      deliveryAddress: o.delivery_address,
      totalAmount: Number(o.total_amount),
      deliveryCharges: Number(o.delivery_charges),
      paymentMethod: o.payment_method,
      paymentStatus: o.payment_status,
      status: o.status,
      createdAt: o.created_at,
      items: (o.order_items || []).map((i: any) => ({
        name: i.vegetable_name,
        quantity: Number(i.quantity),
        price: Number(i.price),
        unit: i.unit
      }))
    }))

    return c.json({ orders: mapped, count: mapped.length })
  } catch (error: any) {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ============================================
// GET /api/orders/admin/all - All orders (admin)
// ============================================
orders.get('/admin/all', authMiddleware(), adminMiddleware(), async (c) => {
  try {
    const supabase = getSupabaseClient(c.env)
    const status = c.req.query('status')

    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          vegetable_name,
          quantity,
          price,
          unit
        )
      `)
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      return c.json({ error: 'Failed to fetch orders' }, 500)
    }

    const mapped = (data || []).map(o => ({
      id: o.id,
      orderId: o.id.substring(0, 8).toUpperCase(),
      customerName: o.customer_name,
      customerPhone: o.customer_phone,
      customerEmail: o.customer_email,
      deliveryCity: o.delivery_city,
      deliveryAddress: o.delivery_address,
      orderNotes: o.order_notes,
      totalAmount: Number(o.total_amount),
      deliveryCharges: Number(o.delivery_charges),
      paymentMethod: o.payment_method,
      easypaisaNumber: o.easypaisa_number,
      paymentScreenshot: o.payment_screenshot,
      paymentStatus: o.payment_status,
      status: o.status,
      createdAt: o.created_at,
      items: (o.order_items || []).map((i: any) => ({
        id: i.id,
        name: i.vegetable_name,
        quantity: Number(i.quantity),
        price: Number(i.price),
        unit: i.unit
      }))
    }))

    // Stats
    const totalOrders = mapped.length
    const totalRevenue = mapped.reduce((sum, o) => sum + o.totalAmount, 0)
    const pendingOrders = mapped.filter(o => o.status === 'pending').length
    const completedOrders = mapped.filter(o => o.status === 'completed').length

    return c.json({
      orders: mapped,
      count: totalOrders,
      stats: {
        totalOrders,
        totalRevenue,
        pendingOrders,
        completedOrders
      }
    })
  } catch (error: any) {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ============================================
// GET /api/orders/:id - Get order detail
// ============================================
orders.get('/:id', authMiddleware(), async (c) => {
  try {
    const orderId = c.req.param('id')
    const user = c.get('user') as JWTPayload
    const supabase = getSupabaseClient(c.env)

    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          vegetable_name,
          quantity,
          price,
          unit,
          vegetable_id
        )
      `)
      .eq('id', orderId)

    // Non-admin users can only see their own orders
    if (user.role !== 'admin') {
      query = query.eq('user_id', user.userId)
    }

    const { data, error } = await query.single()

    if (error || !data) {
      return c.json({ error: 'Order not found' }, 404)
    }

    return c.json({
      order: {
        id: data.id,
        orderId: data.id.substring(0, 8).toUpperCase(),
        customerName: data.customer_name,
        customerPhone: data.customer_phone,
        customerEmail: data.customer_email,
        deliveryCity: data.delivery_city,
        deliveryAddress: data.delivery_address,
        orderNotes: data.order_notes,
        totalAmount: Number(data.total_amount),
        deliveryCharges: Number(data.delivery_charges),
        paymentMethod: data.payment_method,
        easypaisaNumber: data.easypaisa_number,
        paymentScreenshot: data.payment_screenshot,
        paymentStatus: data.payment_status,
        status: data.status,
        createdAt: data.created_at,
        items: (data.order_items || []).map((i: any) => ({
          id: i.id,
          vegetableId: i.vegetable_id,
          name: i.vegetable_name,
          quantity: Number(i.quantity),
          price: Number(i.price),
          unit: i.unit
        }))
      }
    })
  } catch (error: any) {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ============================================
// PATCH /api/orders/:id/status - Update status (admin)
// ============================================
orders.patch('/:id/status', authMiddleware(), adminMiddleware(), async (c) => {
  try {
    const orderId = c.req.param('id')
    const body = await c.req.json()
    const validation = validateInput(orderStatusUpdateSchema, body)
    
    if (!validation.success) {
      return c.json({ error: 'Validation failed', details: validation.errors }, 400)
    }

    const supabase = getSupabaseClient(c.env)
    const { data, error } = await supabase
      .from('orders')
      .update({ status: validation.data.status })
      .eq('id', orderId)
      .select('id, status, customer_name')
      .single()

    if (error || !data) {
      return c.json({ error: 'Failed to update order status' }, 500)
    }

    return c.json({
      success: true,
      message: `Order ${data.id.substring(0, 8).toUpperCase()} marked as ${data.status}`,
      order: { id: data.id, status: data.status }
    })
  } catch (error: any) {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ============================================
// PATCH /api/orders/:id/payment - Update payment status (admin)
// ============================================
orders.patch('/:id/payment', authMiddleware(), adminMiddleware(), async (c) => {
  try {
    const orderId = c.req.param('id')
    const body = await c.req.json()
    const validation = validateInput(paymentStatusUpdateSchema, body)
    
    if (!validation.success) {
      return c.json({ error: 'Validation failed', details: validation.errors }, 400)
    }

    const supabase = getSupabaseClient(c.env)
    const { data, error } = await supabase
      .from('orders')
      .update({ payment_status: validation.data.paymentStatus })
      .eq('id', orderId)
      .select('id, payment_status')
      .single()

    if (error || !data) {
      return c.json({ error: 'Failed to update payment status' }, 500)
    }

    return c.json({
      success: true,
      message: `Payment status updated to ${data.payment_status}`,
      order: { id: data.id, paymentStatus: data.payment_status }
    })
  } catch (error: any) {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ============================================
// POST /api/orders/:id/screenshot - Upload payment screenshot
// ============================================
orders.post('/:id/screenshot', optionalAuthMiddleware(), async (c) => {
  try {
    const orderId = c.req.param('id')
    const supabase = getSupabaseClient(c.env)

    // Parse multipart form data
    const formData = await c.req.formData()
    const file = formData.get('screenshot') as File | null

    if (!file) {
      return c.json({ error: 'No screenshot file provided' }, 400)
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' }, 400)
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return c.json({ error: 'File too large. Maximum 5MB allowed.' }, 400)
    }

    // Upload to Supabase Storage
    const fileExt = file.name.split('.').pop() || 'jpg'
    const fileName = `${orderId}-${Date.now()}.${fileExt}`
    const filePath = `screenshots/${fileName}`

    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('payment-screenshots')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: true
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return c.json({ error: 'Failed to upload screenshot' }, 500)
    }

    // Get public URL
    const { data: urlData } = supabase
      .storage
      .from('payment-screenshots')
      .getPublicUrl(filePath)

    const screenshotUrl = urlData.publicUrl

    // Update order with screenshot URL
    await supabase
      .from('orders')
      .update({ payment_screenshot: screenshotUrl })
      .eq('id', orderId)

    return c.json({
      success: true,
      message: 'Payment screenshot uploaded successfully',
      screenshotUrl
    })

  } catch (error: any) {
    console.error('Screenshot upload error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ============================================
// GET /api/orders/:id/whatsapp - Get WhatsApp link
// ============================================
orders.get('/:id/whatsapp', authMiddleware(), async (c) => {
  try {
    const orderId = c.req.param('id')
    const supabase = getSupabaseClient(c.env)

    const { data: order } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (vegetable_name, quantity, price, unit)
      `)
      .eq('id', orderId)
      .single()

    if (!order) {
      return c.json({ error: 'Order not found' }, 404)
    }

    const ownerNumber = c.env.WHATSAPP_OWNER_NUMBER || '923001234567'
    
    const whatsappData: WhatsAppOrderData = {
      orderId: order.id.substring(0, 8).toUpperCase(),
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      deliveryAddress: order.delivery_address,
      deliveryCity: order.delivery_city,
      items: (order.order_items || []).map((i: any) => ({
        name: i.vegetable_name,
        quantity: Number(i.quantity),
        unit: i.unit,
        price: Number(i.price)
      })),
      totalAmount: Number(order.total_amount),
      deliveryCharges: Number(order.delivery_charges),
      paymentMethod: order.payment_method,
      screenshotUrl: order.payment_screenshot
    }

    const ownerLink = generateWhatsAppOrderLink(whatsappData, ownerNumber)
    const customerLink = generateCustomerWhatsAppLink(
      order.customer_phone,
      order.id.substring(0, 8).toUpperCase(),
      Number(order.total_amount),
      '2-4 hours'
    )

    return c.json({
      ownerWhatsAppLink: ownerLink,
      customerWhatsAppLink: customerLink
    })
  } catch (error: any) {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ============================================
// DELETE /api/orders/admin/clear - Clear all orders (admin)
// ============================================
orders.delete('/admin/clear', authMiddleware(), adminMiddleware(), async (c) => {
  try {
    const supabase = getSupabaseClient(c.env)

    // Delete order items first (FK constraint)
    await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    return c.json({ success: true, message: 'All orders cleared' })
  } catch (error: any) {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ============================================
// EASYPAISA PAYMENT PROCESSING
// ============================================
/**
 * Easypaisa Payment Integration
 * 
 * PRODUCTION SETUP:
 * 1. Register at https://developer.easypaisa.com.pk
 * 2. Get merchant credentials
 * 3. Store as Cloudflare secrets:
 *    wrangler secret put EASYPAISA_STORE_ID
 *    wrangler secret put EASYPAISA_USERNAME
 *    wrangler secret put EASYPAISA_PASSWORD
 *    wrangler secret put EASYPAISA_HASH_KEY
 * 
 * API ENDPOINTS:
 * - Sandbox: https://easypay.easypaisa.com.pk/easypay-service/rest/v4/initiate-ma-transaction
 * - Production: https://easypay.easypaisa.com.pk/easypay-service/rest/v4/initiate-ma-transaction
 */
async function processEasypaisaPayment(env: Env, params: {
  orderId: string
  amount: number
  mobileNo: string
}): Promise<any> {
  const storeId = env.EASYPAISA_STORE_ID
  const hashKey = env.EASYPAISA_HASH_KEY

  // If credentials not configured, return demo response
  if (!storeId || storeId === 'YOUR_EASYPAISA_STORE_ID') {
    return {
      demo: true,
      message: 'Easypaisa integration in demo mode. Configure EASYPAISA_* secrets for production.',
      request: {
        orderId: params.orderId,
        storeId: 'YOUR_STORE_ID',
        transactionAmount: params.amount.toFixed(2),
        transactionType: 'MA',
        mobileAccountNo: params.mobileNo
      }
    }
  }

  try {
    // Generate HMAC hash for security
    const hashString = `amount=${params.amount.toFixed(2)}&orderRefNum=${params.orderId}&storeId=${storeId}`
    const encoder = new TextEncoder()
    const keyData = encoder.encode(hashKey)
    const msgData = encoder.encode(hashString)
    
    const key = await crypto.subtle.importKey(
      'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    )
    const signature = await crypto.subtle.sign('HMAC', key, msgData)
    const hashHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0')).join('')

    // Make API call
    const apiUrl = 'https://easypay.easypaisa.com.pk/easypay-service/rest/v4/initiate-ma-transaction'
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: params.orderId,
        storeId: storeId,
        transactionAmount: params.amount.toFixed(2),
        transactionType: 'MA',
        mobileAccountNo: params.mobileNo,
        encryptedHashRequest: hashHex
      })
    })

    const result = await response.json()
    
    /**
     * Success Response:
     * { "responseCode": "0000", "responseDesc": "SUCCESS", "transactionId": "TXN123" }
     * 
     * Failure Response:
     * { "responseCode": "0001", "responseDesc": "FAILED" }
     */

    return result

  } catch (error: any) {
    console.error('Easypaisa API error:', error)
    return {
      error: true,
      message: 'Easypaisa payment processing failed',
      details: error.message
    }
  }
}

export default orders

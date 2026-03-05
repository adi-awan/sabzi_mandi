/**
 * Settings Routes
 * GET    /api/settings/delivery     - Get delivery charges (public)
 * PUT    /api/settings/delivery     - Update delivery charges (admin)
 * GET    /api/settings/store        - Get store settings (public)
 * PUT    /api/settings/store        - Update store settings (admin)
 * GET    /api/settings/easypaisa    - Get easypaisa config (admin)
 * PUT    /api/settings/easypaisa    - Update easypaisa config (admin)
 */

import { Hono } from 'hono'
import { getSupabaseClient, type Env } from '../config/supabase'
import { authMiddleware, adminMiddleware, type JWTPayload } from '../middleware/auth'
import { deliveryChargesSchema, storeSettingsSchema, validateInput } from '../utils/validation'

const settings = new Hono<{ Bindings: Env; Variables: { user: JWTPayload } }>()

// ============================================
// GET /api/settings/delivery - Get delivery charges (public)
// ============================================
settings.get('/delivery', async (c) => {
  try {
    const supabase = getSupabaseClient(c.env)

    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'delivery_charges')
      .single()

    if (error || !data) {
      // Return default charges if not in DB
      return c.json({
        deliveryCharges: {
          karachi: { charge: 150, freeAbove: 2000, time: "2-4 hours" },
          lahore: { charge: 200, freeAbove: 2500, time: "4-6 hours" },
          islamabad: { charge: 200, freeAbove: 2500, time: "4-6 hours" },
          rawalpindi: { charge: 200, freeAbove: 2500, time: "4-6 hours" },
          peshawar: { charge: 250, freeAbove: 3000, time: "1-2 days" },
          quetta: { charge: 300, freeAbove: 3500, time: "2-3 days" },
          multan: { charge: 200, freeAbove: 2500, time: "1-2 days" },
          faisalabad: { charge: 200, freeAbove: 2500, time: "1-2 days" }
        }
      })
    }

    return c.json({ deliveryCharges: data.value })
  } catch (error: any) {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ============================================
// PUT /api/settings/delivery - Update delivery charges (admin)
// ============================================
settings.put('/delivery', authMiddleware(), adminMiddleware(), async (c) => {
  try {
    const body = await c.req.json()
    const validation = validateInput(deliveryChargesSchema, body)
    
    if (!validation.success) {
      return c.json({ error: 'Validation failed', details: validation.errors }, 400)
    }

    const supabase = getSupabaseClient(c.env)

    const { error } = await supabase
      .from('settings')
      .upsert({
        key: 'delivery_charges',
        value: validation.data
      }, { onConflict: 'key' })

    if (error) {
      return c.json({ error: 'Failed to update delivery charges' }, 500)
    }

    return c.json({
      success: true,
      message: 'Delivery charges updated! Changes will reflect on the store instantly.',
      deliveryCharges: validation.data
    })
  } catch (error: any) {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ============================================
// GET /api/settings/store - Get store settings (public)
// ============================================
settings.get('/store', async (c) => {
  try {
    const supabase = getSupabaseClient(c.env)

    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'store_settings')
      .single()

    if (error || !data) {
      return c.json({
        settings: {
          storeName: 'Sabzi Mandi',
          whatsappNumber: '+923001234567',
          email: 'order@sabzimandi.pk',
          ownerAccountName: 'Sabzi Mandi Official',
          ownerAccountNumber: '03001234567'
        }
      })
    }

    return c.json({ settings: data.value })
  } catch (error: any) {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ============================================
// PUT /api/settings/store - Update store settings (admin)
// ============================================
settings.put('/store', authMiddleware(), adminMiddleware(), async (c) => {
  try {
    const body = await c.req.json()
    const validation = validateInput(storeSettingsSchema, body)
    
    if (!validation.success) {
      return c.json({ error: 'Validation failed', details: validation.errors }, 400)
    }

    const supabase = getSupabaseClient(c.env)

    // Merge with existing settings
    const { data: existing } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'store_settings')
      .single()

    const merged = { ...(existing?.value || {}), ...validation.data }

    const { error } = await supabase
      .from('settings')
      .upsert({
        key: 'store_settings',
        value: merged
      }, { onConflict: 'key' })

    if (error) {
      return c.json({ error: 'Failed to update store settings' }, 500)
    }

    return c.json({
      success: true,
      message: 'Store settings saved!',
      settings: merged
    })
  } catch (error: any) {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ============================================
// GET /api/settings/easypaisa - Get easypaisa config (admin)
// ============================================
settings.get('/easypaisa', authMiddleware(), adminMiddleware(), async (c) => {
  try {
    const supabase = getSupabaseClient(c.env)

    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'easypaisa_config')
      .single()

    return c.json({
      config: data?.value || {
        storeId: 'YOUR_EASYPAISA_STORE_ID',
        mode: 'sandbox'
      }
    })
  } catch (error: any) {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ============================================
// PUT /api/settings/easypaisa - Update easypaisa config (admin)
// ============================================
settings.put('/easypaisa', authMiddleware(), adminMiddleware(), async (c) => {
  try {
    const body = await c.req.json()
    const supabase = getSupabaseClient(c.env)

    const { error } = await supabase
      .from('settings')
      .upsert({
        key: 'easypaisa_config',
        value: body
      }, { onConflict: 'key' })

    if (error) {
      return c.json({ error: 'Failed to update Easypaisa config' }, 500)
    }

    return c.json({
      success: true,
      message: 'Easypaisa configuration saved!'
    })
  } catch (error: any) {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ============================================
// Easypaisa Webhook Handler (public)
// POST /api/easypaisa/callback
// ============================================
settings.post('/easypaisa/callback', async (c) => {
  try {
    const body = await c.req.json()
    const supabase = getSupabaseClient(c.env)

    /**
     * Easypaisa Webhook Payload:
     * {
     *   "orderId": "order-uuid",
     *   "transactionId": "TXN123456789",
     *   "responseCode": "0000",
     *   "responseDesc": "SUCCESS",
     *   "transactionAmount": "1500.00",
     *   "transactionDateTime": "20260303 143000",
     *   "encryptedHashResponse": "HMAC_HASH"
     * }
     */

    const { orderId, responseCode, transactionId } = body

    if (!orderId) {
      return c.json({ error: 'Missing orderId' }, 400)
    }

    // Verify HMAC hash if hash key is configured
    const hashKey = c.env.EASYPAISA_HASH_KEY
    if (hashKey && body.encryptedHashResponse) {
      // TODO: Verify HMAC signature
      // const isValid = await verifyEasypaisaHash(body, hashKey)
      // if (!isValid) return c.json({ error: 'Invalid signature' }, 403)
    }

    // Update order payment status
    const paymentStatus = responseCode === '0000' ? 'paid' : 'failed'
    
    await supabase
      .from('orders')
      .update({ 
        payment_status: paymentStatus,
        status: paymentStatus === 'paid' ? 'confirmed' : 'pending'
      })
      .eq('id', orderId)

    console.log(`Easypaisa callback: Order ${orderId} - ${responseCode} (${paymentStatus}) - TXN: ${transactionId}`)

    // Return 200 to acknowledge receipt
    return c.json({ status: 'ok', received: true })
  } catch (error: any) {
    console.error('Easypaisa webhook error:', error)
    return c.json({ status: 'error' }, 500)
  }
})

export default settings

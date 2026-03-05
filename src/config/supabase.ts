/**
 * Supabase Connection Configuration
 * Uses environment variables for secure connection
 * 
 * SETUP:
 * 1. Create a Supabase project at https://supabase.com
 * 2. Go to Settings > API to get your URL and keys
 * 3. Set environment variables:
 *    - SUPABASE_URL: Your project URL (e.g., https://xxxxx.supabase.co)
 *    - SUPABASE_SERVICE_ROLE_KEY: Service role key (has full access, keep secret!)
 *    - SUPABASE_ANON_KEY: Anonymous key (for public access)
 * 
 * For Cloudflare Workers:
 *   wrangler secret put SUPABASE_URL
 *   wrangler secret put SUPABASE_SERVICE_ROLE_KEY
 *   wrangler secret put SUPABASE_ANON_KEY
 * 
 * For local development:
 *   Add to .dev.vars file in project root
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Type definitions for Cloudflare Workers environment bindings
export interface Env {
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
  SUPABASE_ANON_KEY: string
  JWT_SECRET: string
  EASYPAISA_STORE_ID?: string
  EASYPAISA_USERNAME?: string
  EASYPAISA_PASSWORD?: string
  EASYPAISA_HASH_KEY?: string
  WHATSAPP_OWNER_NUMBER?: string
}

/**
 * Creates a Supabase client using service role key (full access)
 * Use this for all backend operations
 */
export function getSupabaseClient(env: Env): SupabaseClient {
  if (!env.SUPABASE_URL || env.SUPABASE_URL === 'https://your-project.supabase.co' || !env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY === 'your-service-role-key') {
    throw new Error('SUPABASE_NOT_CONFIGURED')
  }

  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

/**
 * Creates a Supabase client using anon key (limited access)
 * Use this for public-facing operations with RLS
 */
export function getSupabaseAnonClient(env: Env): SupabaseClient {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_ANON_KEY.')
  }

  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

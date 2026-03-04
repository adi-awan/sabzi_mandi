-- ============================================================
-- SABZI MANDI - Complete Supabase PostgreSQL Schema
-- Run this in Supabase SQL Editor to set up the database
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. SIGNUP TABLE (User Registration)
-- ============================================================
CREATE TABLE IF NOT EXISTS signup (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,  -- bcrypt hashed
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast login lookups
CREATE INDEX IF NOT EXISTS idx_signup_email ON signup(email);
CREATE INDEX IF NOT EXISTS idx_signup_phone ON signup(phone);

-- ============================================================
-- 2. VEGETABLES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS vegetables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_urdu TEXT,
  category TEXT NOT NULL CHECK (category IN ('leafy', 'root', 'fruit', 'exotic', 'herbs', 'seasonal')),
  price NUMERIC(10,2) NOT NULL CHECK (price > 0),
  unit TEXT DEFAULT 'kg' CHECK (unit IN ('kg', 'bunch', 'piece', '250g', '500g')),
  image_link TEXT DEFAULT '',
  in_stock BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vegetables_category ON vegetables(category);
CREATE INDEX IF NOT EXISTS idx_vegetables_in_stock ON vegetables(in_stock);

-- ============================================================
-- 3. CART TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS cart (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES signup(id) ON DELETE CASCADE,
  vegetable_id UUID NOT NULL REFERENCES vegetables(id) ON DELETE CASCADE,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  total_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, vegetable_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_user_id ON cart(user_id);

-- ============================================================
-- 4. ORDERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES signup(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  delivery_address TEXT NOT NULL,
  delivery_city TEXT NOT NULL,
  order_notes TEXT,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_charges NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cod', 'easypaisa')),
  easypaisa_number TEXT,
  payment_screenshot TEXT,  -- URL to uploaded screenshot
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'paid', 'failed', 'refunded')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'out_for_delivery', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- ============================================================
-- 5. ORDER_ITEMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  vegetable_id UUID REFERENCES vegetables(id) ON DELETE SET NULL,
  vegetable_name TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL CHECK (quantity > 0),
  price NUMERIC(10,2) NOT NULL CHECK (price > 0),
  unit TEXT DEFAULT 'kg',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- ============================================================
-- 6. SETTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to vegetables table
DROP TRIGGER IF EXISTS update_vegetables_updated_at ON vegetables;
CREATE TRIGGER update_vegetables_updated_at
  BEFORE UPDATE ON vegetables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to cart table
DROP TRIGGER IF EXISTS update_cart_updated_at ON cart;
CREATE TRIGGER update_cart_updated_at
  BEFORE UPDATE ON cart
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to settings table
DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 8. SEED DATA: Default Delivery Charges
-- ============================================================
INSERT INTO settings (key, value) VALUES (
  'delivery_charges',
  '{
    "karachi": {"charge": 150, "freeAbove": 2000, "time": "2-4 hours"},
    "lahore": {"charge": 200, "freeAbove": 2500, "time": "4-6 hours"},
    "islamabad": {"charge": 200, "freeAbove": 2500, "time": "4-6 hours"},
    "rawalpindi": {"charge": 200, "freeAbove": 2500, "time": "4-6 hours"},
    "peshawar": {"charge": 250, "freeAbove": 3000, "time": "1-2 days"},
    "quetta": {"charge": 300, "freeAbove": 3500, "time": "2-3 days"},
    "multan": {"charge": 200, "freeAbove": 2500, "time": "1-2 days"},
    "faisalabad": {"charge": 200, "freeAbove": 2500, "time": "1-2 days"}
  }'::jsonb
) ON CONFLICT (key) DO NOTHING;

-- Store settings
INSERT INTO settings (key, value) VALUES (
  'store_settings',
  '{
    "storeName": "Sabzi Mandi",
    "whatsappNumber": "+923001234567",
    "email": "order@sabzimandi.pk",
    "ownerAccountName": "Sabzi Mandi Official",
    "ownerAccountNumber": "03001234567"
  }'::jsonb
) ON CONFLICT (key) DO NOTHING;

-- Easypaisa config placeholder
INSERT INTO settings (key, value) VALUES (
  'easypaisa_config',
  '{
    "storeId": "YOUR_EASYPAISA_STORE_ID",
    "mode": "sandbox"
  }'::jsonb
) ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 9. SEED DATA: Default Vegetables
-- ============================================================
INSERT INTO vegetables (name, name_urdu, category, price, unit, image_link, in_stock) VALUES
  ('Tamatar (Tomato)', 'ٹماٹر', 'fruit', 180, 'kg', 'https://images.unsplash.com/photo-1546470427-0d4db154ceb8?w=400&h=400&fit=crop', true),
  ('Pyaz (Onion)', 'پیاز', 'root', 160, 'kg', 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&h=400&fit=crop', true),
  ('Aloo (Potato)', 'آلو', 'root', 120, 'kg', 'https://images.unsplash.com/photo-1518977676601-b53f82ber40?w=400&h=400&fit=crop', true),
  ('Hari Mirch (Green Chilli)', 'ہری مرچ', 'fruit', 220, 'kg', 'https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?w=400&h=400&fit=crop', true),
  ('Adrak (Ginger)', 'ادرک', 'root', 450, 'kg', 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&h=400&fit=crop', true),
  ('Lehsun (Garlic)', 'لہسن', 'root', 380, 'kg', 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2571?w=400&h=400&fit=crop', true),
  ('Palak (Spinach)', 'پالک', 'leafy', 60, 'bunch', 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&h=400&fit=crop', true),
  ('Gobhi (Cauliflower)', 'گوبھی', 'fruit', 140, 'kg', 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&h=400&fit=crop', true),
  ('Band Gobhi (Cabbage)', 'بند گوبھی', 'leafy', 80, 'kg', 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=400&h=400&fit=crop', true),
  ('Gajar (Carrot)', 'گاجر', 'root', 100, 'kg', 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&h=400&fit=crop', true),
  ('Mooli (Radish)', 'مولی', 'root', 60, 'kg', 'https://images.unsplash.com/photo-1447175008436-054170c2e979?w=400&h=400&fit=crop', true),
  ('Kheeray (Cucumber)', 'کھیرا', 'fruit', 120, 'kg', 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=400&h=400&fit=crop', true),
  ('Shimla Mirch (Capsicum)', 'شملہ مرچ', 'fruit', 250, 'kg', 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400&h=400&fit=crop', true),
  ('Baingan (Eggplant)', 'بینگن', 'fruit', 130, 'kg', 'https://images.unsplash.com/photo-1615484477778-ca3b77940c25?w=400&h=400&fit=crop', true),
  ('Bhindi (Okra/Lady Finger)', 'بھنڈی', 'fruit', 200, 'kg', 'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=400&h=400&fit=crop', true),
  ('Tori (Ridge Gourd)', 'توری', 'fruit', 110, 'kg', 'https://images.unsplash.com/photo-1622205313162-be1d5712a43f?w=400&h=400&fit=crop', true),
  ('Karela (Bitter Gourd)', 'کریلا', 'fruit', 180, 'kg', 'https://images.unsplash.com/photo-1598511726623-d2e9996892f0?w=400&h=400&fit=crop', true),
  ('Lauki (Bottle Gourd)', 'لوکی', 'fruit', 90, 'kg', 'https://images.unsplash.com/photo-1563252722-3286735b1aba?w=400&h=400&fit=crop', true),
  ('Pudina (Mint)', 'پودینہ', 'herbs', 40, 'bunch', 'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=400&h=400&fit=crop', true),
  ('Dhaniya (Coriander)', 'دھنیا', 'herbs', 40, 'bunch', 'https://images.unsplash.com/photo-1595855759920-86582396756a?w=400&h=400&fit=crop', true),
  ('Matar (Green Peas)', 'مٹر', 'seasonal', 280, 'kg', 'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=400&h=400&fit=crop', true),
  ('Saag (Mustard Greens)', 'ساگ', 'leafy', 80, 'bunch', 'https://images.unsplash.com/photo-1591261730799-ee4e6c2d16d7?w=400&h=400&fit=crop', true),
  ('Methi (Fenugreek)', 'میتھی', 'leafy', 50, 'bunch', 'https://images.unsplash.com/photo-1600626336426-bf35a1595b83?w=400&h=400&fit=crop', true),
  ('Shaljam (Turnip)', 'شلجم', 'root', 80, 'kg', 'https://images.unsplash.com/photo-1594282486756-07be49256629?w=400&h=400&fit=crop', true),
  ('Arvi (Taro Root)', 'اروی', 'root', 200, 'kg', 'https://images.unsplash.com/photo-1590165482129-1b8b27698780?w=400&h=400&fit=crop', true),
  ('Kaddu (Pumpkin)', 'کدو', 'seasonal', 100, 'kg', 'https://images.unsplash.com/photo-1570586437263-ab629fccc818?w=400&h=400&fit=crop', true),
  ('Zucchini', 'زکینی', 'exotic', 280, 'kg', 'https://images.unsplash.com/photo-1563252722-3286735b1aba?w=400&h=400&fit=crop', true),
  ('Broccoli', 'بروکلی', 'exotic', 350, 'kg', 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400&h=400&fit=crop', true),
  ('Baby Corn', 'بیبی کارن', 'exotic', 300, '250g', 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&h=400&fit=crop', true),
  ('Mushroom', 'مشروم', 'exotic', 320, '250g', 'https://images.unsplash.com/photo-1504545102780-26774c1bb073?w=400&h=400&fit=crop', true),
  ('Cherry Tomato', 'چیری ٹماٹر', 'exotic', 350, '250g', 'https://images.unsplash.com/photo-1546470427-0d4db154ceb8?w=400&h=400&fit=crop', true),
  ('Makkai (Corn)', 'مکئی', 'seasonal', 60, 'piece', 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&h=400&fit=crop', true),
  ('Hara Pyaz (Spring Onion)', 'ہرا پیاز', 'herbs', 50, 'bunch', 'https://images.unsplash.com/photo-1587049352851-8d4e89133924?w=400&h=400&fit=crop', true),
  ('Lal Mirch (Red Chilli)', 'لال مرچ', 'seasonal', 400, 'kg', 'https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?w=400&h=400&fit=crop', true),
  ('Kachnar (Lotus Stem)', 'کمل ککڑی', 'seasonal', 220, 'kg', 'https://images.unsplash.com/photo-1590165482129-1b8b27698780?w=400&h=400&fit=crop', true),
  ('Ajwain Patta (Thyme)', 'اجوائن پتہ', 'herbs', 60, 'bunch', 'https://images.unsplash.com/photo-1600626336426-bf35a1595b83?w=400&h=400&fit=crop', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 10. SEED DATA: Default Admin User
-- Password is 'admin123' bcrypt hashed
-- ============================================================
INSERT INTO signup (full_name, email, phone, password, role) VALUES
  ('Admin', 'admin@sabzimandi.pk', '03000000000', '$2a$10$xJvQ3eG1F4jPv8z7Q2RZa.GHUdP8K0dR4nXKqzG8kj5sO5YqYv8r2', 'admin')
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- 11. ROW LEVEL SECURITY (RLS) Policies
-- ============================================================
-- Enable RLS on all tables
ALTER TABLE signup ENABLE ROW LEVEL SECURITY;
ALTER TABLE vegetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (our backend uses service role key)
CREATE POLICY "Service role full access on signup" ON signup FOR ALL USING (true);
CREATE POLICY "Service role full access on vegetables" ON vegetables FOR ALL USING (true);
CREATE POLICY "Service role full access on cart" ON cart FOR ALL USING (true);
CREATE POLICY "Service role full access on orders" ON orders FOR ALL USING (true);
CREATE POLICY "Service role full access on order_items" ON order_items FOR ALL USING (true);
CREATE POLICY "Service role full access on settings" ON settings FOR ALL USING (true);

-- ============================================================
-- 12. CREATE STORAGE BUCKET FOR PAYMENT SCREENSHOTS
-- Run this separately in Supabase Dashboard > Storage
-- ============================================================
-- CREATE BUCKET: payment-screenshots (Public: No)
-- Policy: Allow authenticated uploads
-- Max file size: 5MB
-- Allowed types: image/jpeg, image/png, image/webp

-- NOTE: Storage bucket creation is done via Supabase Dashboard:
-- 1. Go to Storage tab
-- 2. Click "New bucket"
-- 3. Name: "payment-screenshots"
-- 4. Public: unchecked
-- 5. File size limit: 5MB
-- 6. Allowed MIME types: image/jpeg, image/png, image/webp

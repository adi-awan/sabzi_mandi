/* ============================================
   SABZI MANDI - Main Application JavaScript
   v2.0 - Supabase Backend Integration
   
   Features:
   - Fetches data from /api/ endpoints (Supabase backend)
   - Falls back to localStorage if API unavailable
   - JWT authentication with token storage
   - Real-time price/stock sync from database
   - Cart synced to server for logged-in users
   - Order creation via API
   - Easypaisa payment with screenshot upload
   ============================================ */

// ============================================
// API CONFIGURATION
// ============================================
const API_BASE = '/api';
const TOKEN_KEY = 'sabzi_token';
const USER_KEY = 'sabzi_currentUser';

function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setAuthToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function getAuthHeaders() {
  const token = getAuthToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function apiCall(endpoint, options = {}) {
  try {
    const url = `${API_BASE}${endpoint}`;
    const config = {
      headers: getAuthHeaders(),
      ...options
    };
    // Don't override Content-Type for FormData
    if (options.body instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    const response = await fetch(url, config);
    const data = await response.json();
    if (!response.ok) {
      throw { status: response.status, ...data };
    }
    return data;
  } catch (error) {
    if (error.status) throw error;
    console.warn('API call failed:', endpoint, error);
    throw { status: 0, error: 'Network error', offline: true };
  }
}

// ============================================
// FALLBACK DATA (used when API unavailable)
// ============================================
const DEFAULT_VEGETABLES = [
  { id: 1, name: "Tamatar (Tomato)", nameUrdu: "ٹماٹر", category: "fruit", price: 180, unit: "kg", image: "https://images.unsplash.com/photo-1546470427-0d4db154ceb8?w=400&h=400&fit=crop", inStock: true },
  { id: 2, name: "Pyaz (Onion)", nameUrdu: "پیاز", category: "root", price: 160, unit: "kg", image: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&h=400&fit=crop", inStock: true },
  { id: 3, name: "Aloo (Potato)", nameUrdu: "آلو", category: "root", price: 120, unit: "kg", image: "https://images.unsplash.com/photo-1518977676601-b53f82ber40?w=400&h=400&fit=crop", inStock: true },
  { id: 4, name: "Hari Mirch (Green Chilli)", nameUrdu: "ہری مرچ", category: "fruit", price: 220, unit: "kg", image: "https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?w=400&h=400&fit=crop", inStock: true },
  { id: 5, name: "Adrak (Ginger)", nameUrdu: "ادرک", category: "root", price: 450, unit: "kg", image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&h=400&fit=crop", inStock: true },
  { id: 6, name: "Lehsun (Garlic)", nameUrdu: "لہسن", category: "root", price: 380, unit: "kg", image: "https://images.unsplash.com/photo-1540148426945-6cf22a6b2571?w=400&h=400&fit=crop", inStock: true },
  { id: 7, name: "Palak (Spinach)", nameUrdu: "پالک", category: "leafy", price: 60, unit: "bunch", image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&h=400&fit=crop", inStock: true },
  { id: 8, name: "Gobhi (Cauliflower)", nameUrdu: "گوبھی", category: "fruit", price: 140, unit: "kg", image: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&h=400&fit=crop", inStock: true },
  { id: 9, name: "Band Gobhi (Cabbage)", nameUrdu: "بند گوبھی", category: "leafy", price: 80, unit: "kg", image: "https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=400&h=400&fit=crop", inStock: true },
  { id: 10, name: "Gajar (Carrot)", nameUrdu: "گاجر", category: "root", price: 100, unit: "kg", image: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&h=400&fit=crop", inStock: true },
  { id: 11, name: "Mooli (Radish)", nameUrdu: "مولی", category: "root", price: 60, unit: "kg", image: "https://images.unsplash.com/photo-1447175008436-054170c2e979?w=400&h=400&fit=crop", inStock: true },
  { id: 12, name: "Kheeray (Cucumber)", nameUrdu: "کھیرا", category: "fruit", price: 120, unit: "kg", image: "https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=400&h=400&fit=crop", inStock: true },
  { id: 13, name: "Shimla Mirch (Capsicum)", nameUrdu: "شملہ مرچ", category: "fruit", price: 250, unit: "kg", image: "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400&h=400&fit=crop", inStock: true },
  { id: 14, name: "Baingan (Eggplant)", nameUrdu: "بینگن", category: "fruit", price: 130, unit: "kg", image: "https://images.unsplash.com/photo-1615484477778-ca3b77940c25?w=400&h=400&fit=crop", inStock: true },
  { id: 15, name: "Bhindi (Okra/Lady Finger)", nameUrdu: "بھنڈی", category: "fruit", price: 200, unit: "kg", image: "https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=400&h=400&fit=crop", inStock: true },
  { id: 16, name: "Tori (Ridge Gourd)", nameUrdu: "توری", category: "fruit", price: 110, unit: "kg", image: "https://images.unsplash.com/photo-1622205313162-be1d5712a43f?w=400&h=400&fit=crop", inStock: true },
  { id: 17, name: "Karela (Bitter Gourd)", nameUrdu: "کریلا", category: "fruit", price: 180, unit: "kg", image: "https://images.unsplash.com/photo-1598511726623-d2e9996892f0?w=400&h=400&fit=crop", inStock: true },
  { id: 18, name: "Lauki (Bottle Gourd)", nameUrdu: "لوکی", category: "fruit", price: 90, unit: "kg", image: "https://images.unsplash.com/photo-1563252722-3286735b1aba?w=400&h=400&fit=crop", inStock: true },
  { id: 19, name: "Pudina (Mint)", nameUrdu: "پودینہ", category: "herbs", price: 40, unit: "bunch", image: "https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=400&h=400&fit=crop", inStock: true },
  { id: 20, name: "Dhaniya (Coriander)", nameUrdu: "دھنیا", category: "herbs", price: 40, unit: "bunch", image: "https://images.unsplash.com/photo-1595855759920-86582396756a?w=400&h=400&fit=crop", inStock: true },
  { id: 21, name: "Matar (Green Peas)", nameUrdu: "مٹر", category: "seasonal", price: 280, unit: "kg", image: "https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=400&h=400&fit=crop", inStock: true },
  { id: 22, name: "Saag (Mustard Greens)", nameUrdu: "ساگ", category: "leafy", price: 80, unit: "bunch", image: "https://images.unsplash.com/photo-1591261730799-ee4e6c2d16d7?w=400&h=400&fit=crop", inStock: true },
  { id: 23, name: "Methi (Fenugreek)", nameUrdu: "میتھی", category: "leafy", price: 50, unit: "bunch", image: "https://images.unsplash.com/photo-1600626336426-bf35a1595b83?w=400&h=400&fit=crop", inStock: true },
  { id: 24, name: "Shaljam (Turnip)", nameUrdu: "شلجم", category: "root", price: 80, unit: "kg", image: "https://images.unsplash.com/photo-1594282486756-07be49256629?w=400&h=400&fit=crop", inStock: true },
  { id: 25, name: "Arvi (Taro Root)", nameUrdu: "اروی", category: "root", price: 200, unit: "kg", image: "https://images.unsplash.com/photo-1590165482129-1b8b27698780?w=400&h=400&fit=crop", inStock: true },
  { id: 26, name: "Kaddu (Pumpkin)", nameUrdu: "کدو", category: "seasonal", price: 100, unit: "kg", image: "https://images.unsplash.com/photo-1570586437263-ab629fccc818?w=400&h=400&fit=crop", inStock: true },
  { id: 27, name: "Zucchini", nameUrdu: "زکینی", category: "exotic", price: 280, unit: "kg", image: "https://images.unsplash.com/photo-1563252722-3286735b1aba?w=400&h=400&fit=crop", inStock: true },
  { id: 28, name: "Broccoli", nameUrdu: "بروکلی", category: "exotic", price: 350, unit: "kg", image: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400&h=400&fit=crop", inStock: true },
  { id: 29, name: "Baby Corn", nameUrdu: "بیبی کارن", category: "exotic", price: 300, unit: "250g", image: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&h=400&fit=crop", inStock: true },
  { id: 30, name: "Mushroom", nameUrdu: "مشروم", category: "exotic", price: 320, unit: "250g", image: "https://images.unsplash.com/photo-1504545102780-26774c1bb073?w=400&h=400&fit=crop", inStock: true },
  { id: 31, name: "Cherry Tomato", nameUrdu: "چیری ٹماٹر", category: "exotic", price: 350, unit: "250g", image: "https://images.unsplash.com/photo-1546470427-0d4db154ceb8?w=400&h=400&fit=crop", inStock: true },
  { id: 32, name: "Makkai (Corn)", nameUrdu: "مکئی", category: "seasonal", price: 60, unit: "piece", image: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&h=400&fit=crop", inStock: true },
  { id: 33, name: "Hara Pyaz (Spring Onion)", nameUrdu: "ہرا پیاز", category: "herbs", price: 50, unit: "bunch", image: "https://images.unsplash.com/photo-1587049352851-8d4e89133924?w=400&h=400&fit=crop", inStock: true },
  { id: 34, name: "Lal Mirch (Red Chilli)", nameUrdu: "لال مرچ", category: "seasonal", price: 400, unit: "kg", image: "https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?w=400&h=400&fit=crop", inStock: true },
  { id: 35, name: "Kachnar (Lotus Stem)", nameUrdu: "کمل ککڑی", category: "seasonal", price: 220, unit: "kg", image: "https://images.unsplash.com/photo-1590165482129-1b8b27698780?w=400&h=400&fit=crop", inStock: true },
  { id: 36, name: "Ajwain Patta (Thyme)", nameUrdu: "اجوائن پتہ", category: "herbs", price: 60, unit: "bunch", image: "https://images.unsplash.com/photo-1600626336426-bf35a1595b83?w=400&h=400&fit=crop", inStock: true }
];

const DEFAULT_DELIVERY = {
  karachi: { charge: 150, freeAbove: 2000, time: "2-4 hours" },
  lahore: { charge: 200, freeAbove: 2500, time: "4-6 hours" },
  islamabad: { charge: 200, freeAbove: 2500, time: "4-6 hours" },
  rawalpindi: { charge: 200, freeAbove: 2500, time: "4-6 hours" },
  peshawar: { charge: 250, freeAbove: 3000, time: "1-2 days" },
  quetta: { charge: 300, freeAbove: 3500, time: "2-3 days" },
  multan: { charge: 200, freeAbove: 2500, time: "1-2 days" },
  faisalabad: { charge: 200, freeAbove: 2500, time: "1-2 days" }
};

// ============================================
// STATE MANAGEMENT
// ============================================
let state = {
  vegetables: [],
  cart: [],
  currentUser: null,
  selectedCategory: 'all',
  searchQuery: '',
  selectedLocation: '',
  deliveryCharges: {},
  orders: [],
  selectedPayment: 'cod',
  apiAvailable: false
};

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

async function initApp() {
  // Check if user token exists
  const savedUser = localStorage.getItem(USER_KEY);
  if (savedUser) {
    try { state.currentUser = JSON.parse(savedUser); } catch(e) {}
  }

  // Load data - try API first, fall back to localStorage
  await loadVegetables();
  await loadDeliveryCharges();
  loadLocalCart();

  // Render everything
  renderProducts();
  updateCartUI();
  updateAuthUI();
  renderDeliveryTable();

  // If logged in, verify token is still valid
  if (state.currentUser && getAuthToken()) {
    verifyToken();
  }

  // Refresh vegetables every 30 seconds for real-time prices
  setInterval(loadVegetables, 30000);
}

// ============================================
// DATA LOADING
// ============================================
async function loadVegetables() {
  try {
    const data = await apiCall('/vegetables');
    state.vegetables = data.vegetables;
    state.apiAvailable = true;
    // Cache in localStorage
    localStorage.setItem('sabzi_vegetables', JSON.stringify(state.vegetables));
    renderProducts();
  } catch (e) {
    // Fall back to localStorage / defaults
    const cached = localStorage.getItem('sabzi_vegetables');
    if (cached) {
      try { state.vegetables = JSON.parse(cached); } catch(e2) { state.vegetables = [...DEFAULT_VEGETABLES]; }
    } else {
      state.vegetables = [...DEFAULT_VEGETABLES];
    }
    state.apiAvailable = false;
  }
}

async function loadDeliveryCharges() {
  try {
    const data = await apiCall('/settings/delivery');
    state.deliveryCharges = data.deliveryCharges;
    localStorage.setItem('sabzi_delivery', JSON.stringify(state.deliveryCharges));
    renderDeliveryTable();
  } catch (e) {
    const cached = localStorage.getItem('sabzi_delivery');
    if (cached) {
      try { state.deliveryCharges = JSON.parse(cached); } catch(e2) { state.deliveryCharges = { ...DEFAULT_DELIVERY }; }
    } else {
      state.deliveryCharges = { ...DEFAULT_DELIVERY };
    }
  }
}

function loadLocalCart() {
  const cached = localStorage.getItem('sabzi_cart');
  if (cached) {
    try { state.cart = JSON.parse(cached); } catch(e) { state.cart = []; }
  }
}

async function verifyToken() {
  try {
    const data = await apiCall('/auth/profile');
    state.currentUser = data.user;
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    updateAuthUI();

    // Sync cart from server
    await syncCartFromServer();
  } catch (e) {
    if (e.status === 401) {
      // Token expired
      clearAuthToken();
      state.currentUser = null;
      localStorage.removeItem(USER_KEY);
      updateAuthUI();
    }
  }
}

async function syncCartFromServer() {
  if (!state.currentUser || !getAuthToken()) return;
  try {
    const data = await apiCall('/cart');
    if (data.items && data.items.length > 0) {
      state.cart = data.items.map(item => ({
        id: item.vegetableId,
        cartItemId: item.cartItemId,
        name: item.vegetable?.name || 'Unknown',
        price: item.vegetable?.price || 0,
        unit: item.vegetable?.unit || 'kg',
        image: item.vegetable?.image || '',
        qty: item.quantity
      }));
      localStorage.setItem('sabzi_cart', JSON.stringify(state.cart));
      updateCartUI();
    }
  } catch (e) {
    // Use local cart
  }
}

// ============================================
// VIEW MANAGEMENT
// ============================================
function showView(view) {
  document.querySelectorAll('.page-view').forEach(v => v.classList.remove('active'));
  const el = document.getElementById('view-' + view);
  if (el) el.classList.add('active');
  
  if (view === 'dashboard' && state.currentUser) {
    renderDashboard();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showDashTab(tab) {
  document.querySelectorAll('.dashboard-content > div').forEach(d => d.style.display = 'none');
  const el = document.getElementById('dashTab-' + tab);
  if (el) el.style.display = 'block';

  document.querySelectorAll('.dashboard-nav a').forEach(a => a.classList.remove('active'));
  if (event && event.target) event.target.closest('a')?.classList.add('active');
}

// ============================================
// PRODUCT RENDERING
// ============================================
function renderProducts() {
  const grid = document.getElementById('productGrid');
  const noResults = document.getElementById('noResults');
  const countEl = document.getElementById('productCount');
  if (!grid) return;

  let filtered = state.vegetables;

  // Category filter
  if (state.selectedCategory !== 'all') {
    filtered = filtered.filter(v => v.category === state.selectedCategory);
  }

  // Search filter
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    filtered = filtered.filter(v =>
      v.name.toLowerCase().includes(q) ||
      (v.nameUrdu && v.nameUrdu.includes(q)) ||
      v.category.toLowerCase().includes(q)
    );
  }

  countEl.textContent = filtered.length + ' items';

  if (filtered.length === 0) {
    grid.innerHTML = '';
    noResults.classList.remove('hidden');
    return;
  }

  noResults.classList.add('hidden');

  grid.innerHTML = filtered.map(veg => {
    const cartItem = state.cart.find(c => c.id === veg.id);
    const qty = cartItem ? cartItem.qty : 1;

    return `
      <div class="product-card fade-in" data-id="${veg.id}">
        <span class="stock-badge ${veg.inStock ? 'in-stock' : 'out-of-stock'}">
          ${veg.inStock ? 'In Stock' : 'Out of Stock'}
        </span>
        <div class="product-img">
          <img src="${veg.image}" alt="${veg.name}" loading="lazy" 
               onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
          <div class="placeholder-icon" style="display:none;width:100%;height:100%;align-items:center;justify-content:center;">
            <i class="fas fa-leaf" style="font-size:48px;color:var(--gray-300);"></i>
          </div>
        </div>
        <div class="product-info">
          <div class="product-name">${veg.name}</div>
          <div class="product-unit">Per ${veg.unit}</div>
          <div class="product-price">
            <span class="currency">Rs.</span> ${veg.price.toLocaleString()}
          </div>
          <div class="qty-selector">
            <button onclick="changeQty('${veg.id}', -0.5, event)">&#8722;</button>
            <input type="number" id="qty-${veg.id}" value="${qty}" min="0.5" step="0.5" 
                   onchange="setQty('${veg.id}', this.value)">
            <span class="unit-label">${veg.unit}</span>
            <button onclick="changeQty('${veg.id}', 0.5, event)">+</button>
          </div>
          <button class="btn-add-cart ${cartItem ? 'added' : ''}" 
                  onclick="addToCart('${veg.id}')" 
                  ${!veg.inStock ? 'disabled' : ''}>
            <i class="fas ${cartItem ? 'fa-check' : 'fa-cart-plus'}"></i>
            ${cartItem ? 'In Cart' : 'Add to Cart'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// ============================================
// SEARCH & FILTER
// ============================================
function handleSearch(query) {
  state.searchQuery = query.trim();
  renderProducts();
}

function filterCategory(cat) {
  state.selectedCategory = cat;
  document.querySelectorAll('.category-nav a').forEach(a => a.classList.remove('active'));
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));

  document.querySelectorAll('.category-nav a').forEach(a => {
    if (a.textContent.toLowerCase().includes(cat === 'all' ? 'all' : cat)) a.classList.add('active');
  });
  document.querySelectorAll('.filter-tab').forEach(t => {
    const text = t.textContent.toLowerCase();
    if (cat === 'all' && text === 'all') t.classList.add('active');
    else if (text.includes(cat)) t.classList.add('active');
  });

  showView('home');
  renderProducts();
}

// ============================================
// QUANTITY MANAGEMENT
// ============================================
function changeQty(id, delta, e) {
  if (e) e.stopPropagation();
  const input = document.getElementById('qty-' + id);
  if (!input) return;
  let val = parseFloat(input.value) + delta;
  if (val < 0.5) val = 0.5;
  input.value = val;
}

function setQty(id, val) {
  val = parseFloat(val);
  if (isNaN(val) || val < 0.5) val = 0.5;
  const input = document.getElementById('qty-' + id);
  if (input) input.value = val;
}

// ============================================
// CART SYSTEM
// ============================================
async function addToCart(vegId) {
  const veg = state.vegetables.find(v => v.id === vegId || v.id == vegId);
  if (!veg || !veg.inStock) return;

  const qtyInput = document.getElementById('qty-' + vegId);
  const qty = qtyInput ? parseFloat(qtyInput.value) || 1 : 1;

  // Add to local cart
  const existing = state.cart.find(c => c.id === vegId || c.id == vegId);
  if (existing) {
    existing.qty = qty;
    showToast(`${veg.name} quantity updated!`, 'success');
  } else {
    state.cart.push({
      id: veg.id,
      name: veg.name,
      price: veg.price,
      unit: veg.unit,
      image: veg.image,
      qty: qty
    });
    showToast(`${veg.name} added to cart!`, 'success');
  }

  localStorage.setItem('sabzi_cart', JSON.stringify(state.cart));
  updateCartUI();
  renderProducts();

  // Sync to server if logged in
  if (state.currentUser && getAuthToken() && state.apiAvailable) {
    try {
      await apiCall('/cart', {
        method: 'POST',
        body: JSON.stringify({ vegetableId: veg.id, quantity: qty })
      });
    } catch (e) {
      // Local cart is already updated, server sync can happen later
    }
  }
}

async function removeFromCart(vegId) {
  const item = state.cart.find(c => c.id === vegId || c.id == vegId);
  state.cart = state.cart.filter(c => c.id !== vegId && c.id != vegId);
  localStorage.setItem('sabzi_cart', JSON.stringify(state.cart));
  updateCartUI();
  renderProducts();
  showToast('Item removed from cart', 'warning');

  // Sync to server
  if (state.currentUser && getAuthToken() && item?.cartItemId && state.apiAvailable) {
    try { await apiCall(`/cart/${item.cartItemId}`, { method: 'DELETE' }); } catch(e) {}
  }
}

function updateCartQty(vegId, delta) {
  const item = state.cart.find(c => c.id === vegId || c.id == vegId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) { removeFromCart(vegId); return; }
  localStorage.setItem('sabzi_cart', JSON.stringify(state.cart));
  updateCartUI();
}

function getCartSubtotal() {
  return state.cart.reduce((sum, item) => {
    const veg = state.vegetables.find(v => v.id === item.id || v.id == item.id);
    const price = veg ? veg.price : item.price;
    return sum + (price * item.qty);
  }, 0);
}

function getDeliveryCharge() {
  const loc = state.selectedLocation || document.getElementById('locationSelect')?.value || '';
  if (!loc) return 0;
  const sub = getCartSubtotal();
  const info = state.deliveryCharges[loc];
  if (!info) return 0;
  return sub >= info.freeAbove ? 0 : info.charge;
}

function updateCartUI() {
  const count = state.cart.length;
  const subtotal = getCartSubtotal();
  const delivery = getDeliveryCharge();
  const total = subtotal + delivery;

  document.getElementById('cartCount').textContent = count;
  document.getElementById('cartTotalHeader').textContent = 'Rs. ' + subtotal.toLocaleString();
  document.getElementById('cartItemCount').textContent = count;

  const cartItemsEl = document.getElementById('cartItems');
  const cartEmpty = document.getElementById('cartEmpty');
  const cartFooter = document.getElementById('cartFooter');

  if (count === 0) {
    cartItemsEl.innerHTML = '';
    cartItemsEl.appendChild(cartEmpty);
    cartEmpty.style.display = 'block';
    cartFooter.style.display = 'none';
    return;
  }

  cartEmpty.style.display = 'none';
  cartFooter.style.display = 'block';

  cartItemsEl.innerHTML = state.cart.map(item => {
    const veg = state.vegetables.find(v => v.id === item.id || v.id == item.id);
    const currentPrice = veg ? veg.price : item.price;
    return `
      <div class="cart-item">
        <div class="cart-item-img">
          <img src="${item.image}" alt="${item.name}" loading="lazy"
               onerror="this.parentElement.innerHTML='<div style=\\'display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:var(--gray-300);\\'><i class=\\'fas fa-leaf\\' style=\\'font-size:24px;\\'></i></div>'">
        </div>
        <div class="cart-item-info">
          <h4>${item.name}</h4>
          <div class="item-price">Rs. ${(currentPrice * item.qty).toLocaleString()}</div>
          <div class="item-qty">Rs. ${currentPrice}/${item.unit}</div>
          <div class="cart-item-qty">
            <button onclick="updateCartQty('${item.id}', -0.5)">&#8722;</button>
            <span>${item.qty} ${item.unit}</span>
            <button onclick="updateCartQty('${item.id}', 0.5)">+</button>
          </div>
        </div>
        <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
  }).join('');

  document.getElementById('cartSubtotal').textContent = 'Rs. ' + subtotal.toLocaleString();
  document.getElementById('cartDelivery').textContent = delivery === 0 ? 'FREE' : 'Rs. ' + delivery.toLocaleString();
  document.getElementById('cartTotal').textContent = 'Rs. ' + total.toLocaleString();
  const loc = state.selectedLocation || document.getElementById('locationSelect')?.value || '';
  document.getElementById('deliveryLocation').textContent = loc ? `(${loc})` : '';
}

function toggleCart() {
  document.getElementById('cartOverlay').classList.toggle('open');
  document.getElementById('cartSidebar').classList.toggle('open');
  document.body.style.overflow = document.getElementById('cartSidebar').classList.contains('open') ? 'hidden' : '';
}

// ============================================
// DELIVERY
// ============================================
function updateDeliveryCharges() {
  state.selectedLocation = document.getElementById('locationSelect').value;
  updateCartUI();
}

function renderDeliveryTable() {
  const tbody = document.getElementById('deliveryTableBody');
  if (!tbody) return;
  const cities = state.deliveryCharges;
  tbody.innerHTML = Object.entries(cities).map(([city, info]) => `
    <tr>
      <td style="font-weight:600;text-transform:capitalize;">${city}</td>
      <td>Rs. ${info.charge.toLocaleString()}</td>
      <td>Rs. ${info.freeAbove.toLocaleString()}</td>
      <td>${info.time}</td>
    </tr>
  `).join('');
}

// ============================================
// AUTHENTICATION SYSTEM (API-backed)
// ============================================
function handleAuthClick() {
  if (state.currentUser) {
    showView('dashboard');
  } else {
    openModal('authModal');
  }
}

function toggleAuthForm(type) {
  if (type === 'signup') {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'block';
    document.getElementById('authModalTitle').innerHTML = '<i class="fas fa-user-plus text-primary"></i> Sign Up';
  } else {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('signupForm').style.display = 'none';
    document.getElementById('authModalTitle').innerHTML = '<i class="fas fa-user-circle text-primary"></i> Login';
  }
}

async function handleSignup() {
  const name = document.getElementById('signupName').value.trim();
  const phone = document.getElementById('signupPhone').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;

  if (!name || !phone || !password) {
    showToast('Please fill all required fields', 'error');
    return;
  }
  if (password.length < 6) {
    showToast('Password must be at least 6 characters', 'error');
    return;
  }
  if (!email) {
    showToast('Email is required for account creation', 'error');
    return;
  }

  try {
    const data = await apiCall('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ fullName: name, email, phone, password })
    });

    setAuthToken(data.token);
    state.currentUser = data.user;
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));

    updateAuthUI();
    closeModal('authModal');
    showToast(`Welcome to Sabzi Mandi, ${name}!`, 'success');

    // Sync local cart to server
    await syncLocalCartToServer();
  } catch (e) {
    showToast(e.error || 'Signup failed. Please try again.', 'error');
  }
}

async function handleLogin() {
  const phone = document.getElementById('loginPhone').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!phone || !password) {
    showToast('Please enter phone/email and password', 'error');
    return;
  }

  try {
    // Try as email first
    const emailOrPhone = phone.includes('@') ? phone : phone;
    const data = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: emailOrPhone, password })
    });

    setAuthToken(data.token);
    state.currentUser = data.user;
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));

    updateAuthUI();
    closeModal('authModal');
    showToast(`Welcome back, ${data.user.fullName}!`, 'success');

    await syncCartFromServer();
  } catch (e) {
    showToast(e.error || 'Invalid credentials. Please try again.', 'error');
  }
}

function handleLogout() {
  clearAuthToken();
  state.currentUser = null;
  localStorage.removeItem(USER_KEY);
  updateAuthUI();
  showView('home');
  showToast('Logged out successfully', 'success');
}

function updateAuthUI() {
  const btn = document.getElementById('authBtn');
  const text = document.getElementById('authBtnText');
  if (state.currentUser) {
    text.textContent = state.currentUser.fullName ? state.currentUser.fullName.split(' ')[0] : 'Account';
    btn.querySelector('i').className = 'fas fa-user-check';
  } else {
    text.textContent = 'Login';
    btn.querySelector('i').className = 'fas fa-user-circle';
  }
}

async function updateProfile() {
  const name = document.getElementById('profileName').value.trim();
  const phone = document.getElementById('profilePhone').value.trim();
  const email = document.getElementById('profileEmail').value.trim();

  if (!name || !phone) {
    showToast('Name and phone are required', 'error');
    return;
  }

  try {
    const data = await apiCall('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ fullName: name, phone, email })
    });
    state.currentUser = data.user;
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    updateAuthUI();
    showToast('Profile updated!', 'success');
  } catch (e) {
    showToast(e.error || 'Failed to update profile', 'error');
  }
}

async function syncLocalCartToServer() {
  if (!state.currentUser || !getAuthToken() || !state.apiAvailable) return;
  for (const item of state.cart) {
    try {
      await apiCall('/cart', {
        method: 'POST',
        body: JSON.stringify({ vegetableId: item.id, quantity: item.qty })
      });
    } catch(e) {}
  }
}

// ============================================
// DASHBOARD
// ============================================
async function renderDashboard() {
  if (!state.currentUser) return;

  document.getElementById('dashAvatar').textContent = (state.currentUser.fullName || 'U').charAt(0).toUpperCase();
  document.getElementById('dashName').textContent = state.currentUser.fullName || 'User';
  document.getElementById('dashEmail').textContent = state.currentUser.email || state.currentUser.phone || '';

  document.getElementById('profileName').value = state.currentUser.fullName || '';
  document.getElementById('profilePhone').value = state.currentUser.phone || '';
  document.getElementById('profileEmail').value = state.currentUser.email || '';

  // Fetch orders from API
  const ordersEl = document.getElementById('userOrdersList');
  try {
    const data = await apiCall('/orders');
    const orders = data.orders || [];

    if (orders.length === 0) {
      ordersEl.innerHTML = '<p style="color:var(--gray-500);text-align:center;padding:40px;">No orders yet. Start shopping!</p>';
      return;
    }

    ordersEl.innerHTML = `
      <div style="overflow-x:auto;">
        <table class="orders-table">
          <thead><tr><th>Order ID</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th></tr></thead>
          <tbody>
            ${orders.map(o => `
              <tr>
                <td><strong>#${o.orderId}</strong></td>
                <td>${new Date(o.createdAt).toLocaleDateString('en-PK')}</td>
                <td>${o.items.length} items</td>
                <td style="font-weight:700;color:var(--primary);">Rs. ${o.totalAmount.toLocaleString()}</td>
                <td><span class="status-badge status-${o.status}">${o.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (e) {
    ordersEl.innerHTML = '<p style="color:var(--gray-500);text-align:center;padding:40px;">Unable to load orders. Please try again.</p>';
  }
}

// ============================================
// CHECKOUT SYSTEM (API-backed)
// ============================================
function openCheckout() {
  if (state.cart.length === 0) {
    showToast('Your cart is empty!', 'error');
    return;
  }

  if (state.currentUser) {
    document.getElementById('checkName').value = state.currentUser.fullName || '';
    document.getElementById('checkPhone').value = state.currentUser.phone || '';
  }

  const loc = state.selectedLocation || document.getElementById('locationSelect')?.value || '';
  if (loc) document.getElementById('checkCity').value = loc;

  goToStep(1);
  toggleCart();
  openModal('checkoutModal');
}

function goToStep(step) {
  document.getElementById('checkoutStep1').style.display = step === 1 ? 'block' : 'none';
  document.getElementById('checkoutStep2').style.display = step === 2 ? 'block' : 'none';
  document.getElementById('checkoutStep3').style.display = step === 3 ? 'block' : 'none';
  document.getElementById('checkoutSuccess').style.display = 'none';

  for (let i = 1; i <= 3; i++) {
    const el = document.getElementById('step' + i);
    el.classList.remove('active', 'done');
    if (i < step) el.classList.add('done');
    if (i === step) el.classList.add('active');
  }
  for (let i = 1; i <= 2; i++) {
    const line = document.getElementById('stepLine' + i);
    line.classList.remove('done');
    if (i < step) line.classList.add('done');
  }
}

function goToPaymentStep() {
  const name = document.getElementById('checkName').value.trim();
  const phone = document.getElementById('checkPhone').value.trim();
  const city = document.getElementById('checkCity').value;
  const address = document.getElementById('checkAddress').value.trim();

  if (!name || !phone || !city || !address) {
    showToast('Please fill all required fields', 'error');
    return;
  }
  if (!/^03\d{9}$/.test(phone)) {
    showToast('Please enter a valid phone number (03XX XXXXXXX)', 'error');
    return;
  }
  goToStep(2);
}

function selectPayment(method) {
  state.selectedPayment = method;
  document.querySelectorAll('.payment-option').forEach(el => el.classList.remove('selected'));
  event.target.closest('.payment-option').classList.add('selected');
  event.target.closest('.payment-option').querySelector('input').checked = true;
  document.getElementById('easypaisaForm').style.display = method === 'easypaisa' ? 'block' : 'none';
}

function goToConfirmStep() {
  if (state.selectedPayment === 'easypaisa') {
    const epNum = document.getElementById('easypaisaNumber').value.trim();
    if (!epNum || !/^03\d{9}$/.test(epNum)) {
      showToast('Please enter a valid Easypaisa number', 'error');
      return;
    }
  }

  const summaryItems = document.getElementById('orderSummaryItems');
  summaryItems.innerHTML = state.cart.map(item => {
    const veg = state.vegetables.find(v => v.id === item.id || v.id == item.id);
    const price = veg ? veg.price : item.price;
    return `
      <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px;">
        <span>${item.name} x ${item.qty} ${item.unit}</span>
        <span style="font-weight:600;">Rs. ${(price * item.qty).toLocaleString()}</span>
      </div>
    `;
  }).join('');

  const sub = getCartSubtotal();
  const city = document.getElementById('checkCity').value;
  state.selectedLocation = city;
  const del = getDeliveryCharge();

  document.getElementById('summarySubtotal').textContent = 'Rs. ' + sub.toLocaleString();
  document.getElementById('summaryDelivery').textContent = del === 0 ? 'FREE' : 'Rs. ' + del.toLocaleString();
  document.getElementById('summaryTotal').textContent = 'Rs. ' + (sub + del).toLocaleString();

  document.getElementById('summaryCustomer').textContent = 
    document.getElementById('checkName').value + ' | ' + document.getElementById('checkPhone').value;
  document.getElementById('summaryAddress').textContent = 
    document.getElementById('checkAddress').value + ', ' + city;
  document.getElementById('summaryPayment').textContent = 
    'Payment: ' + (state.selectedPayment === 'cod' ? 'Cash on Delivery' : 'Easypaisa');

  goToStep(3);
}

async function placeOrder() {
  const btn = document.getElementById('placeOrderBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

  try {
    const orderData = {
      customerName: document.getElementById('checkName').value.trim(),
      customerPhone: document.getElementById('checkPhone').value.trim(),
      customerEmail: state.currentUser?.email || '',
      deliveryCity: document.getElementById('checkCity').value,
      deliveryAddress: document.getElementById('checkAddress').value.trim(),
      orderNotes: document.getElementById('checkNotes').value.trim(),
      paymentMethod: state.selectedPayment,
      easypaisaNumber: state.selectedPayment === 'easypaisa' ? document.getElementById('easypaisaNumber').value : undefined,
      items: state.cart.map(item => ({
        vegetableId: item.id,
        quantity: item.qty
      }))
    };

    let result;
    if (state.apiAvailable) {
      result = await apiCall('/orders', {
        method: 'POST',
        body: JSON.stringify(orderData)
      });
    } else {
      // Fallback to local storage
      const orderId = 'SM' + Date.now().toString().slice(-8);
      result = { success: true, order: { orderId } };
      const orders = JSON.parse(localStorage.getItem('sabzi_orders') || '[]');
      orders.push({ ...orderData, orderId, total: getCartSubtotal() + getDeliveryCharge(), status: 'pending', date: new Date().toISOString() });
      localStorage.setItem('sabzi_orders', JSON.stringify(orders));
    }

    // Clear cart
    state.cart = [];
    localStorage.setItem('sabzi_cart', JSON.stringify([]));
    updateCartUI();
    renderProducts();

    // Show success
    document.getElementById('successOrderId').textContent = result.order?.orderId || 'Confirmed';
    document.getElementById('checkoutStep1').style.display = 'none';
    document.getElementById('checkoutStep2').style.display = 'none';
    document.getElementById('checkoutStep3').style.display = 'none';
    document.getElementById('checkoutSuccess').style.display = 'block';
    document.querySelectorAll('.checkout-step').forEach(s => s.classList.add('done'));

    showToast('Order placed successfully!', 'success');

  } catch (e) {
    showToast(e.error || 'Failed to place order. Please try again.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-check-circle"></i> Place Order';
  }
}

// ============================================
// MODALS
// ============================================
function openModal(id) {
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
    document.getElementById('cartOverlay').classList.remove('open');
    document.getElementById('cartSidebar').classList.remove('open');
    document.body.style.overflow = '';
  }
});

// ============================================
// TOAST NOTIFICATIONS
// ============================================
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fas ${icons[type]||icons.info}"></i><span>${message}</span><button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ============================================
// MOBILE MENU
// ============================================
function toggleMobileMenu() {
  const nav = document.querySelector('.category-nav');
  nav.style.display = nav.style.display === 'none' ? 'block' : 'none';
}

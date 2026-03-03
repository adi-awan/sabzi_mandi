/* ============================================
   SABZI MANDI - Main Application JavaScript
   Pure vanilla JS, no frameworks
   Uses localStorage for data persistence
   ============================================ */

// ============================================
// DATA: Default Vegetables Catalog
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

// Default delivery charges (admin can update)
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
  selectedPayment: 'cod'
};

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  // Load vegetables from localStorage (admin may have modified)
  state.vegetables = loadData('sabzi_vegetables') || [...DEFAULT_VEGETABLES];
  
  // Load other state
  state.cart = loadData('sabzi_cart') || [];
  state.currentUser = loadData('sabzi_currentUser') || null;
  state.deliveryCharges = loadData('sabzi_delivery') || { ...DEFAULT_DELIVERY };
  state.orders = loadData('sabzi_orders') || [];

  // Render everything
  renderProducts();
  updateCartUI();
  updateAuthUI();
  renderDeliveryTable();

  // Listen for storage events (admin changes in another tab)
  window.addEventListener('storage', handleStorageChange);
  
  // Poll for admin changes every 2 seconds
  setInterval(syncWithAdmin, 2000);
}

// ============================================
// LOCAL STORAGE HELPERS
// ============================================
function saveData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('localStorage save failed:', e);
  }
}

function loadData(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

// Sync with admin panel changes (real-time price updates)
function handleStorageChange(e) {
  if (e.key === 'sabzi_vegetables') {
    state.vegetables = JSON.parse(e.newValue) || state.vegetables;
    renderProducts();
  }
  if (e.key === 'sabzi_delivery') {
    state.deliveryCharges = JSON.parse(e.newValue) || state.deliveryCharges;
    renderDeliveryTable();
    updateCartUI();
  }
}

function syncWithAdmin() {
  const vegs = loadData('sabzi_vegetables');
  const delivery = loadData('sabzi_delivery');
  if (vegs && JSON.stringify(vegs) !== JSON.stringify(state.vegetables)) {
    state.vegetables = vegs;
    renderProducts();
  }
  if (delivery && JSON.stringify(delivery) !== JSON.stringify(state.deliveryCharges)) {
    state.deliveryCharges = delivery;
    renderDeliveryTable();
    updateCartUI();
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
  event.target.closest('a').classList.add('active');
}

// ============================================
// PRODUCT RENDERING
// ============================================
function renderProducts() {
  const grid = document.getElementById('productGrid');
  const noResults = document.getElementById('noResults');
  const countEl = document.getElementById('productCount');

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
            <button onclick="changeQty(${veg.id}, -0.5, event)">−</button>
            <input type="number" id="qty-${veg.id}" value="${qty}" min="0.5" step="0.5" 
                   onchange="setQty(${veg.id}, this.value)">
            <span class="unit-label">${veg.unit}</span>
            <button onclick="changeQty(${veg.id}, 0.5, event)">+</button>
          </div>
          <button class="btn-add-cart ${cartItem ? 'added' : ''}" 
                  onclick="addToCart(${veg.id})" 
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
// SEARCH
// ============================================
function handleSearch(query) {
  state.searchQuery = query.trim();
  renderProducts();
}

// ============================================
// CATEGORY FILTER
// ============================================
function filterCategory(cat) {
  state.selectedCategory = cat;

  // Update active states
  document.querySelectorAll('.category-nav a').forEach(a => a.classList.remove('active'));
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));

  // Set active on nav
  document.querySelectorAll('.category-nav a').forEach(a => {
    if (a.textContent.toLowerCase().includes(cat === 'all' ? 'all' : cat)) {
      a.classList.add('active');
    }
  });

  // Set active on filter tabs
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
function addToCart(vegId) {
  const veg = state.vegetables.find(v => v.id === vegId);
  if (!veg || !veg.inStock) return;

  const qtyInput = document.getElementById('qty-' + vegId);
  const qty = qtyInput ? parseFloat(qtyInput.value) || 1 : 1;

  const existing = state.cart.find(c => c.id === vegId);
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

  saveData('sabzi_cart', state.cart);
  updateCartUI();
  renderProducts();
}

function removeFromCart(vegId) {
  state.cart = state.cart.filter(c => c.id !== vegId);
  saveData('sabzi_cart', state.cart);
  updateCartUI();
  renderProducts();
  showToast('Item removed from cart', 'warning');
}

function updateCartQty(vegId, delta) {
  const item = state.cart.find(c => c.id === vegId);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    removeFromCart(vegId);
    return;
  }

  saveData('sabzi_cart', state.cart);
  updateCartUI();
}

function getCartSubtotal() {
  // Re-calculate prices from current vegetable data (reflects admin changes)
  return state.cart.reduce((sum, item) => {
    const veg = state.vegetables.find(v => v.id === item.id);
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

  // Header
  document.getElementById('cartCount').textContent = count;
  document.getElementById('cartTotalHeader').textContent = 'Rs. ' + subtotal.toLocaleString();
  document.getElementById('cartItemCount').textContent = count;

  // Cart items
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
    const veg = state.vegetables.find(v => v.id === item.id);
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
            <button onclick="updateCartQty(${item.id}, -0.5)">−</button>
            <span>${item.qty} ${item.unit}</span>
            <button onclick="updateCartQty(${item.id}, 0.5)">+</button>
          </div>
        </div>
        <button class="cart-item-remove" onclick="removeFromCart(${item.id})">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
  }).join('');

  // Summary
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
// AUTHENTICATION SYSTEM
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

function handleSignup() {
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

  // Check if phone already exists
  const users = loadData('sabzi_users') || [];
  if (users.find(u => u.phone === phone)) {
    showToast('Phone number already registered', 'error');
    return;
  }

  const user = {
    id: Date.now(),
    name,
    phone,
    email,
    password, // In production, hash this!
    createdAt: new Date().toISOString()
  };

  users.push(user);
  saveData('sabzi_users', users);

  // Auto login
  state.currentUser = { id: user.id, name: user.name, phone: user.phone, email: user.email };
  saveData('sabzi_currentUser', state.currentUser);

  updateAuthUI();
  closeModal('authModal');
  showToast(`Welcome to Sabzi Mandi, ${name}!`, 'success');
}

function handleLogin() {
  const phone = document.getElementById('loginPhone').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!phone || !password) {
    showToast('Please enter phone and password', 'error');
    return;
  }

  const users = loadData('sabzi_users') || [];
  const user = users.find(u => u.phone === phone && u.password === password);

  if (!user) {
    showToast('Invalid phone number or password', 'error');
    return;
  }

  state.currentUser = { id: user.id, name: user.name, phone: user.phone, email: user.email };
  saveData('sabzi_currentUser', state.currentUser);

  updateAuthUI();
  closeModal('authModal');
  showToast(`Welcome back, ${user.name}!`, 'success');
}

function handleLogout() {
  state.currentUser = null;
  saveData('sabzi_currentUser', null);
  updateAuthUI();
  showView('home');
  showToast('Logged out successfully', 'success');
}

function updateAuthUI() {
  const btn = document.getElementById('authBtn');
  const text = document.getElementById('authBtnText');

  if (state.currentUser) {
    text.textContent = state.currentUser.name.split(' ')[0];
    btn.querySelector('i').className = 'fas fa-user-check';
  } else {
    text.textContent = 'Login';
    btn.querySelector('i').className = 'fas fa-user-circle';
  }
}

function updateProfile() {
  const name = document.getElementById('profileName').value.trim();
  const phone = document.getElementById('profilePhone').value.trim();
  const email = document.getElementById('profileEmail').value.trim();

  if (!name || !phone) {
    showToast('Name and phone are required', 'error');
    return;
  }

  state.currentUser.name = name;
  state.currentUser.phone = phone;
  state.currentUser.email = email;
  saveData('sabzi_currentUser', state.currentUser);

  // Also update in users list
  const users = loadData('sabzi_users') || [];
  const idx = users.findIndex(u => u.id === state.currentUser.id);
  if (idx >= 0) {
    users[idx].name = name;
    users[idx].phone = phone;
    users[idx].email = email;
    saveData('sabzi_users', users);
  }

  updateAuthUI();
  showToast('Profile updated!', 'success');
}

// ============================================
// DASHBOARD
// ============================================
function renderDashboard() {
  if (!state.currentUser) return;

  document.getElementById('dashAvatar').textContent = state.currentUser.name.charAt(0).toUpperCase();
  document.getElementById('dashName').textContent = state.currentUser.name;
  document.getElementById('dashEmail').textContent = state.currentUser.email || state.currentUser.phone;

  // Profile
  document.getElementById('profileName').value = state.currentUser.name;
  document.getElementById('profilePhone').value = state.currentUser.phone;
  document.getElementById('profileEmail').value = state.currentUser.email || '';

  // Orders
  const orders = (loadData('sabzi_orders') || []).filter(o => o.userId === state.currentUser.id);
  const ordersEl = document.getElementById('userOrdersList');

  if (orders.length === 0) {
    ordersEl.innerHTML = '<p style="color:var(--gray-500);text-align:center;padding:40px;">No orders yet. Start shopping!</p>';
    return;
  }

  ordersEl.innerHTML = `
    <div style="overflow-x:auto;">
      <table class="orders-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Date</th>
            <th>Items</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${orders.reverse().map(o => `
            <tr>
              <td><strong>#${o.orderId}</strong></td>
              <td>${new Date(o.date).toLocaleDateString('en-PK')}</td>
              <td>${o.items.length} items</td>
              <td style="font-weight:700;color:var(--primary);">Rs. ${o.total.toLocaleString()}</td>
              <td><span class="status-badge status-${o.status}">${o.status}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ============================================
// CHECKOUT SYSTEM
// ============================================
function openCheckout() {
  if (state.cart.length === 0) {
    showToast('Your cart is empty!', 'error');
    return;
  }

  // Pre-fill if logged in
  if (state.currentUser) {
    document.getElementById('checkName').value = state.currentUser.name;
    document.getElementById('checkPhone').value = state.currentUser.phone;
  }

  const loc = state.selectedLocation || document.getElementById('locationSelect')?.value || '';
  if (loc) document.getElementById('checkCity').value = loc;

  // Reset to step 1
  goToStep(1);
  toggleCart();
  openModal('checkoutModal');
}

function goToStep(step) {
  document.getElementById('checkoutStep1').style.display = step === 1 ? 'block' : 'none';
  document.getElementById('checkoutStep2').style.display = step === 2 ? 'block' : 'none';
  document.getElementById('checkoutStep3').style.display = step === 3 ? 'block' : 'none';
  document.getElementById('checkoutSuccess').style.display = 'none';

  // Update step indicators
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

  // Populate order summary
  const summaryItems = document.getElementById('orderSummaryItems');
  summaryItems.innerHTML = state.cart.map(item => {
    const veg = state.vegetables.find(v => v.id === item.id);
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

function placeOrder() {
  const btn = document.getElementById('placeOrderBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

  // Simulate processing delay
  setTimeout(() => {
    const orderId = 'SM' + Date.now().toString().slice(-8);
    const subtotal = getCartSubtotal();
    const delivery = getDeliveryCharge();

    const order = {
      orderId,
      userId: state.currentUser ? state.currentUser.id : null,
      customerName: document.getElementById('checkName').value.trim(),
      customerPhone: document.getElementById('checkPhone').value.trim(),
      city: document.getElementById('checkCity').value,
      address: document.getElementById('checkAddress').value.trim(),
      notes: document.getElementById('checkNotes').value.trim(),
      paymentMethod: state.selectedPayment,
      easypaisaNumber: state.selectedPayment === 'easypaisa' ? document.getElementById('easypaisaNumber').value : null,
      items: state.cart.map(item => {
        const veg = state.vegetables.find(v => v.id === item.id);
        return { ...item, price: veg ? veg.price : item.price };
      }),
      subtotal,
      delivery,
      total: subtotal + delivery,
      status: 'pending',
      date: new Date().toISOString(),
      paymentStatus: state.selectedPayment === 'cod' ? 'pending' : 'processing'
    };

    // Handle Easypaisa payment
    if (state.selectedPayment === 'easypaisa') {
      processEasypaisaPayment(order);
    }

    // Save order
    const orders = loadData('sabzi_orders') || [];
    orders.push(order);
    saveData('sabzi_orders', orders);

    // Clear cart
    state.cart = [];
    saveData('sabzi_cart', []);
    updateCartUI();
    renderProducts();

    // Show success
    document.getElementById('successOrderId').textContent = orderId;
    document.getElementById('checkoutStep1').style.display = 'none';
    document.getElementById('checkoutStep2').style.display = 'none';
    document.getElementById('checkoutStep3').style.display = 'none';
    document.getElementById('checkoutSuccess').style.display = 'block';

    // Update step indicators
    document.querySelectorAll('.checkout-step').forEach(s => s.classList.add('done'));

    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-check-circle"></i> Place Order';

    showToast('Order placed successfully!', 'success');
  }, 1500);
}

// ============================================
// EASYPAISA INTEGRATION
// ============================================

/**
 * Easypaisa Payment Integration
 * 
 * PRODUCTION SETUP INSTRUCTIONS:
 * 1. Register as a merchant at https://developer.easypaisa.com.pk
 * 2. Get your Merchant credentials: storeId, orderId 
 * 3. Replace EASYPAISA_CONFIG values below
 * 4. For production, API calls MUST be made from your backend server
 *    to avoid exposing credentials in frontend code
 * 
 * API ENDPOINTS:
 * - Sandbox: https://easypay.easypaisa.com.pk/easypay-service/rest/v4/initiate-ma-transaction
 * - Production: https://easypay.easypaisa.com.pk/easypay-service/rest/v4/initiate-ma-transaction
 * 
 * WEBHOOK:
 * - Configure your callback URL in Easypaisa merchant dashboard
 * - Easypaisa will POST transaction status to your webhook
 */

const EASYPAISA_CONFIG = {
  // Replace these with your actual merchant credentials
  storeId: 'YOUR_STORE_ID',          // From Easypaisa merchant portal
  merchantUsername: 'YOUR_USERNAME',   // Merchant API username
  merchantPassword: 'YOUR_PASSWORD',  // Merchant API password
  hashKey: 'YOUR_HASH_KEY',          // For HMAC signature
  sandboxMode: true,                  // Set false for production
  callbackUrl: 'https://your-domain.com/api/easypaisa/callback',
  
  get baseUrl() {
    return this.sandboxMode 
      ? 'https://easypaisa.com.pk/easypay-service/rest/v4'
      : 'https://easypaisa.com.pk/easypay-service/rest/v4';
  }
};

function processEasypaisaPayment(order) {
  /**
   * SAMPLE EASYPAISA API REQUEST FORMAT
   * In production, send this from your backend server:
   * 
   * POST /easypay-service/rest/v4/initiate-ma-transaction
   * Content-Type: application/json
   * 
   * Request Body:
   * {
   *   "orderId": "SM12345678",
   *   "storeId": "YOUR_STORE_ID",
   *   "transactionAmount": "1500.00",
   *   "transactionType": "MA",           // Mobile Account
   *   "mobileAccountNo": "03001234567",
   *   "emailAddress": "customer@email.com",
   *   "tokenExpiry": "",                  // Optional
   *   "bankIdentificationNumber": "",     // Optional
   *   "encryptedHashRequest": "HMAC_SHA256_HASH"
   * }
   * 
   * Success Response:
   * {
   *   "responseCode": "0000",
   *   "responseDesc": "SUCCESS",
   *   "transactionId": "TXN123456789",
   *   "storeId": "YOUR_STORE_ID",
   *   "orderId": "SM12345678",
   *   "transactionAmount": "1500.00",
   *   "paymentToken": "TOKEN_STRING",
   *   "tokenExpiryDateTime": "20260303 235959"
   * }
   * 
   * Failure Response:
   * {
   *   "responseCode": "0001",
   *   "responseDesc": "FAILED",
   *   "orderId": "SM12345678"
   * }
   * 
   * WEBHOOK CALLBACK (POST to your server):
   * {
   *   "orderId": "SM12345678",
   *   "transactionId": "TXN123456789",
   *   "responseCode": "0000",
   *   "responseDesc": "SUCCESS",
   *   "transactionAmount": "1500.00",
   *   "transactionDateTime": "20260303 143000",
   *   "encryptedHashResponse": "HMAC_HASH"
   * }
   * 
   * WEBHOOK HANDLING (on your backend):
   * 1. Verify the HMAC hash
   * 2. Update order payment status
   * 3. Return HTTP 200 to Easypaisa
   */

  console.log('=== EASYPAISA PAYMENT REQUEST ===');
  console.log('Order ID:', order.orderId);
  console.log('Amount:', order.total);
  console.log('Mobile:', order.easypaisaNumber);
  console.log('Store ID:', EASYPAISA_CONFIG.storeId);
  console.log('================================');
  
  // In demo mode, simulate success
  console.log('[DEMO] Easypaisa payment simulated successfully.');
  console.log('[PRODUCTION] Replace this with actual API call from your backend.');
  
  /**
   * PRODUCTION CODE (Backend - Node.js/Hono):
   * 
   * app.post('/api/easypaisa/initiate', async (c) => {
   *   const { orderId, amount, mobileNo } = await c.req.json();
   *   
   *   // Generate HMAC hash
   *   const hashString = `amount=${amount}&orderRefNum=${orderId}&...`;
   *   const hash = crypto.createHmac('sha256', HASH_KEY).update(hashString).digest('hex');
   *   
   *   const response = await fetch(EASYPAISA_API_URL, {
   *     method: 'POST',
   *     headers: { 'Content-Type': 'application/json' },
   *     body: JSON.stringify({
   *       orderId,
   *       storeId: process.env.EASYPAISA_STORE_ID,
   *       transactionAmount: amount.toFixed(2),
   *       transactionType: 'MA',
   *       mobileAccountNo: mobileNo,
   *       encryptedHashRequest: hash
   *     })
   *   });
   *   
   *   return c.json(await response.json());
   * });
   * 
   * // Webhook handler
   * app.post('/api/easypaisa/callback', async (c) => {
   *   const data = await c.req.json();
   *   
   *   // Verify HMAC
   *   // Update order status
   *   // Send confirmation to customer
   *   
   *   return c.json({ status: 'ok' });
   * });
   */
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

// Close on ESC key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => {
      m.classList.remove('open');
    });
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
  const icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="fas ${icons[type] || icons.info}"></i>
    <span>${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
  `;

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

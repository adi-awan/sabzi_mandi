/* ============================================
   SABZI MANDI - Admin Panel JavaScript
   v2.0 - Supabase Backend Integration
   
   Features:
   - API-backed admin operations
   - JWT authentication for admin
   - Vegetable CRUD via API
   - Order management via API
   - Delivery charges management via API
   - Falls back to localStorage when offline
   ============================================ */

// ============================================
// API CONFIGURATION
// ============================================
const API_BASE = '/api';
const ADMIN_TOKEN_KEY = 'sabzi_admin_token';

function getAdminToken() { return localStorage.getItem(ADMIN_TOKEN_KEY); }
function setAdminToken(token) { localStorage.setItem(ADMIN_TOKEN_KEY, token); }
function clearAdminToken() { localStorage.removeItem(ADMIN_TOKEN_KEY); }

function getAdminHeaders() {
  const token = getAdminToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function adminApiCall(endpoint, options = {}) {
  try {
    const url = `${API_BASE}${endpoint}`;
    const config = { headers: getAdminHeaders(), ...options };
    if (options.body instanceof FormData) delete config.headers['Content-Type'];
    const response = await fetch(url, config);
    const data = await response.json();
    if (!response.ok) throw { status: response.status, ...data };
    return data;
  } catch (error) {
    if (error.status) throw error;
    console.warn('Admin API call failed:', endpoint, error);
    throw { status: 0, error: 'Network error', offline: true };
  }
}

// ============================================
// FALLBACK DATA
// ============================================
const DEFAULT_VEGETABLES = [
  { id: 1, name: "Tamatar (Tomato)", nameUrdu: "ٹماٹر", category: "fruit", price: 180, unit: "kg", image: "https://images.unsplash.com/photo-1546470427-0d4db154ceb8?w=400&h=400&fit=crop", inStock: true },
  { id: 2, name: "Pyaz (Onion)", nameUrdu: "پیاز", category: "root", price: 160, unit: "kg", image: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&h=400&fit=crop", inStock: true },
  { id: 3, name: "Aloo (Potato)", nameUrdu: "آلو", category: "root", price: 120, unit: "kg", image: "https://images.unsplash.com/photo-1518977676601-b53f82ber40?w=400&h=400&fit=crop", inStock: true },
  { id: 4, name: "Hari Mirch (Green Chilli)", nameUrdu: "ہری مرچ", category: "fruit", price: 220, unit: "kg", image: "https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?w=400&h=400&fit=crop", inStock: true },
  { id: 5, name: "Adrak (Ginger)", nameUrdu: "ادرک", category: "root", price: 450, unit: "kg", image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&h=400&fit=crop", inStock: true },
  { id: 6, name: "Lehsun (Garlic)", nameUrdu: "لہسن", category: "root", price: 380, unit: "kg", image: "https://images.unsplash.com/photo-1540148426945-6cf22a6b2571?w=400&h=400&fit=crop", inStock: true }
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
// STATE
// ============================================
let vegetables = [];
let orders = [];
let deliveryCharges = {};
let orderStats = {};
let isLoggedIn = false;
let apiAvailable = false;

// ============================================
// STORAGE HELPERS
// ============================================
function saveData(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) { console.warn(e); }
}
function loadData(key) {
  try { const d = localStorage.getItem(key); return d ? JSON.parse(d) : null; } catch (e) { return null; }
}

// ============================================
// TOAST
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
// ADMIN AUTH (API-backed)
// ============================================
async function adminLogin() {
  const u = document.getElementById('adminUsername').value.trim();
  const p = document.getElementById('adminPassword').value;

  if (!u || !p) {
    showToast('Please enter username and password', 'error');
    return;
  }

  try {
    const data = await adminApiCall('/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify({ username: u, password: p })
    });

    setAdminToken(data.token);
    isLoggedIn = true;
    apiAvailable = true;
    sessionStorage.setItem('adminLoggedIn', 'true');
    document.getElementById('adminLoginPage').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'grid';
    await loadAdminData();
    showToast('Welcome to Admin Panel!', 'success');
  } catch (e) {
    // Fallback to hardcoded credentials for offline mode
    if (u === 'admin' && p === 'admin123') {
      isLoggedIn = true;
      apiAvailable = false;
      sessionStorage.setItem('adminLoggedIn', 'true');
      document.getElementById('adminLoginPage').style.display = 'none';
      document.getElementById('adminDashboard').style.display = 'grid';
      loadAdminDataOffline();
      showToast('Welcome to Admin Panel! (Offline Mode)', 'warning');
    } else {
      showToast(e.error || 'Invalid credentials!', 'error');
    }
  }
}

function adminLogout() {
  isLoggedIn = false;
  clearAdminToken();
  sessionStorage.removeItem('adminLoggedIn');
  document.getElementById('adminLoginPage').style.display = 'flex';
  document.getElementById('adminDashboard').style.display = 'none';
  showToast('Logged out successfully', 'success');
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem('adminLoggedIn') === 'true') {
    isLoggedIn = true;
    document.getElementById('adminLoginPage').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'grid';
    loadAdminData();
  }
  checkMobileToggle();
  window.addEventListener('resize', checkMobileToggle);
});

function checkMobileToggle() {
  const toggle = document.getElementById('adminMobileToggle');
  if (window.innerWidth <= 1024) toggle.style.display = 'inline-flex';
  else { toggle.style.display = 'none'; document.getElementById('adminSidebar').classList.remove('open'); }
}

function toggleAdminSidebar() {
  document.getElementById('adminSidebar').classList.toggle('open');
}

async function loadAdminData() {
  try {
    // Load vegetables from API
    const vegData = await adminApiCall('/vegetables');
    vegetables = vegData.vegetables;
    apiAvailable = true;
  } catch (e) {
    loadAdminDataOffline();
    return;
  }

  try {
    // Load orders from API
    const ordData = await adminApiCall('/orders/admin/all');
    orders = ordData.orders;
    orderStats = ordData.stats || {};
  } catch (e) {
    orders = loadData('sabzi_orders') || [];
    orderStats = {};
  }

  try {
    // Load delivery charges from API
    const delData = await adminApiCall('/settings/delivery');
    deliveryCharges = delData.deliveryCharges;
  } catch (e) {
    deliveryCharges = loadData('sabzi_delivery') || { ...DEFAULT_DELIVERY };
  }

  renderAll();
}

function loadAdminDataOffline() {
  vegetables = loadData('sabzi_vegetables') || [...DEFAULT_VEGETABLES];
  orders = loadData('sabzi_orders') || [];
  deliveryCharges = loadData('sabzi_delivery') || { ...DEFAULT_DELIVERY };
  orderStats = {};
  renderAll();
}

function renderAll() {
  renderDashboardStats();
  renderAdminVegetables();
  renderAdminOrders();
  renderDeliverySettings();
  renderRecentOrders();
  document.getElementById('adminDate').textContent = new Date().toLocaleDateString('en-PK', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

// ============================================
// NAVIGATION
// ============================================
function showAdminSection(section) {
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('section-' + section);
  if (el) el.classList.add('active');

  document.querySelectorAll('.admin-nav a').forEach(a => a.classList.remove('active'));
  if (event && event.target) event.target.closest('a')?.classList.add('active');

  if (section === 'dashboard') { loadDashboardData(); }
  if (section === 'vegetables') loadVegetablesData();
  if (section === 'orders') loadOrdersData();
  if (section === 'delivery') loadDeliveryData();

  document.getElementById('adminSidebar').classList.remove('open');
}

async function loadDashboardData() {
  try {
    const ordData = await adminApiCall('/orders/admin/all');
    orders = ordData.orders;
    orderStats = ordData.stats || {};
    const vegData = await adminApiCall('/vegetables');
    vegetables = vegData.vegetables;
  } catch(e) {}
  renderDashboardStats();
  renderRecentOrders();
}

async function loadVegetablesData() {
  try {
    const data = await adminApiCall('/vegetables');
    vegetables = data.vegetables;
  } catch(e) {}
  renderAdminVegetables();
}

async function loadOrdersData() {
  try {
    const data = await adminApiCall('/orders/admin/all');
    orders = data.orders;
    orderStats = data.stats || {};
  } catch(e) {}
  renderAdminOrders();
}

async function loadDeliveryData() {
  try {
    const data = await adminApiCall('/settings/delivery');
    deliveryCharges = data.deliveryCharges;
  } catch(e) {}
  renderDeliverySettings();
}

// ============================================
// DASHBOARD STATS
// ============================================
function renderDashboardStats() {
  if (orderStats.totalOrders !== undefined) {
    document.getElementById('statVegetables').textContent = vegetables.length;
    document.getElementById('statOrders').textContent = orderStats.totalOrders;
    document.getElementById('statRevenue').textContent = 'Rs. ' + (orderStats.totalRevenue || 0).toLocaleString();
    document.getElementById('statPending').textContent = orderStats.pendingOrders || 0;
  } else {
    document.getElementById('statVegetables').textContent = vegetables.length;
    document.getElementById('statOrders').textContent = orders.length;
    document.getElementById('statRevenue').textContent = 'Rs. ' + orders.reduce((s, o) => s + (o.totalAmount || o.total || 0), 0).toLocaleString();
    document.getElementById('statPending').textContent = orders.filter(o => o.status === 'pending').length;
  }
}

function renderRecentOrders() {
  const tbody = document.getElementById('recentOrdersBody');
  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--gray-500);">No orders yet</td></tr>';
    return;
  }
  const recent = orders.slice(0, 5);
  tbody.innerHTML = recent.map(o => `
    <tr>
      <td><strong>#${o.orderId || o.id?.substring(0, 8).toUpperCase()}</strong></td>
      <td>${o.customerName}</td>
      <td>${(o.items || []).length} items</td>
      <td style="font-weight:700;">Rs. ${(o.totalAmount || o.total || 0).toLocaleString()}</td>
      <td><span style="text-transform:capitalize;">${o.paymentMethod === 'cod' ? 'Cash' : 'Easypaisa'}</span></td>
      <td><span class="status-badge status-${o.status}">${o.status}</span></td>
    </tr>
  `).join('');
}

// ============================================
// VEGETABLE MANAGEMENT (API-backed)
// ============================================
function renderAdminVegetables() {
  const search = (document.getElementById('adminVegSearch')?.value || '').toLowerCase();
  const filter = document.getElementById('adminVegFilter')?.value || 'all';

  let filtered = vegetables;
  if (filter !== 'all') filtered = filtered.filter(v => v.category === filter);
  if (search) filtered = filtered.filter(v => v.name.toLowerCase().includes(search));

  const tbody = document.getElementById('adminVegTable');
  if (!tbody) return;

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--gray-500);">No vegetables found</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(v => `
    <tr>
      <td>
        <div class="product-cell">
          <img src="${v.image || v.imageLink || ''}" alt="${v.name}" loading="lazy"
               onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22><rect fill=%22%23e0e0e0%22 width=%2240%22 height=%2240%22/><text x=%2220%22 y=%2224%22 font-size=%2216%22 text-anchor=%22middle%22>🥬</text></svg>'">
          <div>
            <strong style="font-size:13px;">${v.name}</strong>
            ${v.nameUrdu ? `<br><small style="color:var(--gray-500);">${v.nameUrdu}</small>` : ''}
          </div>
        </div>
      </td>
      <td><span style="text-transform:capitalize;font-size:12px;background:var(--gray-100);padding:3px 8px;border-radius:4px;">${v.category}</span></td>
      <td>
        <input type="number" value="${v.price}" min="1"
               style="width:80px;padding:4px 8px;border:1px solid var(--gray-300);border-radius:4px;font-size:13px;font-weight:600;"
               onchange="quickUpdatePrice('${v.id}', this.value)">
      </td>
      <td style="font-size:13px;">${v.unit}</td>
      <td>
        <label class="toggle-switch">
          <input type="checkbox" ${v.inStock ? 'checked' : ''} onchange="toggleStock('${v.id}', this.checked)">
          <span class="toggle-slider"></span>
        </label>
      </td>
      <td>
        <div style="display:flex;gap:4px;">
          <button class="btn btn-sm btn-outline" onclick="editVegetable('${v.id}')" title="Edit"><i class="fas fa-edit"></i></button>
          <button class="btn btn-sm btn-danger" onclick="deleteVegetable('${v.id}')" title="Delete"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openVegModal() {
  document.getElementById('vegEditId').value = '';
  document.getElementById('vegName').value = '';
  document.getElementById('vegNameUrdu').value = '';
  document.getElementById('vegCategory').value = 'fruit';
  document.getElementById('vegUnit').value = 'kg';
  document.getElementById('vegPrice').value = '';
  document.getElementById('vegImage').value = '';
  document.getElementById('vegInStock').checked = true;
  document.getElementById('vegModalTitle').innerHTML = '<i class="fas fa-plus-circle text-primary"></i> Add Vegetable';
  document.getElementById('vegSaveBtn').textContent = 'Add Vegetable';
  document.getElementById('vegModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeVegModal() {
  document.getElementById('vegModal').classList.remove('open');
  document.body.style.overflow = '';
}

function editVegetable(id) {
  const veg = vegetables.find(v => v.id === id || v.id == id);
  if (!veg) return;

  document.getElementById('vegEditId').value = id;
  document.getElementById('vegName').value = veg.name;
  document.getElementById('vegNameUrdu').value = veg.nameUrdu || '';
  document.getElementById('vegCategory').value = veg.category;
  document.getElementById('vegUnit').value = veg.unit;
  document.getElementById('vegPrice').value = veg.price;
  document.getElementById('vegImage').value = veg.image || veg.imageLink || '';
  document.getElementById('vegInStock').checked = veg.inStock;
  document.getElementById('vegModalTitle').innerHTML = '<i class="fas fa-edit text-primary"></i> Edit Vegetable';
  document.getElementById('vegSaveBtn').textContent = 'Save Changes';
  document.getElementById('vegModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

async function saveVegetable() {
  const editId = document.getElementById('vegEditId').value;
  const name = document.getElementById('vegName').value.trim();
  const nameUrdu = document.getElementById('vegNameUrdu').value.trim();
  const category = document.getElementById('vegCategory').value;
  const unit = document.getElementById('vegUnit').value;
  const price = parseInt(document.getElementById('vegPrice').value);
  const imageLink = document.getElementById('vegImage').value.trim();
  const inStock = document.getElementById('vegInStock').checked;

  if (!name || !price || price < 1) {
    showToast('Please fill name and valid price', 'error');
    return;
  }

  const vegData = { name, nameUrdu, category, unit, price, imageLink, inStock };

  if (apiAvailable) {
    try {
      if (editId) {
        await adminApiCall(`/vegetables/${editId}`, { method: 'PUT', body: JSON.stringify(vegData) });
        showToast('Vegetable updated successfully!', 'success');
      } else {
        await adminApiCall('/vegetables', { method: 'POST', body: JSON.stringify(vegData) });
        showToast('Vegetable added successfully!', 'success');
      }
      closeVegModal();
      await loadVegetablesData();
      renderDashboardStats();
      return;
    } catch (e) {
      showToast(e.error || 'API error, saving locally', 'warning');
    }
  }

  // Fallback to localStorage
  if (editId) {
    const idx = vegetables.findIndex(v => v.id === editId || v.id == editId);
    if (idx >= 0) {
      vegetables[idx] = { ...vegetables[idx], name, nameUrdu, category, unit, price, image: imageLink, inStock };
      showToast('Vegetable updated (local)', 'success');
    }
  } else {
    vegetables.push({ id: Date.now(), name, nameUrdu, category, unit, price, image: imageLink || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=400&fit=crop', inStock });
    showToast('Vegetable added (local)', 'success');
  }
  saveData('sabzi_vegetables', vegetables);
  closeVegModal();
  renderAdminVegetables();
  renderDashboardStats();
}

async function deleteVegetable(id) {
  if (!confirm('Are you sure you want to delete this vegetable?')) return;

  if (apiAvailable) {
    try {
      await adminApiCall(`/vegetables/${id}`, { method: 'DELETE' });
      showToast('Vegetable deleted', 'warning');
      await loadVegetablesData();
      renderDashboardStats();
      return;
    } catch (e) {
      showToast(e.error || 'API error', 'error');
    }
  }

  vegetables = vegetables.filter(v => v.id !== id && v.id != id);
  saveData('sabzi_vegetables', vegetables);
  renderAdminVegetables();
  renderDashboardStats();
  showToast('Vegetable deleted (local)', 'warning');
}

async function quickUpdatePrice(id, newPrice) {
  const price = parseInt(newPrice);
  if (!price || price < 1) return;

  if (apiAvailable) {
    try {
      const data = await adminApiCall(`/vegetables/${id}/price`, {
        method: 'PATCH',
        body: JSON.stringify({ price })
      });
      showToast(data.message || `Price updated to Rs. ${price}`, 'success');
      return;
    } catch (e) {}
  }

  const veg = vegetables.find(v => v.id === id || v.id == id);
  if (veg) {
    veg.price = price;
    saveData('sabzi_vegetables', vegetables);
    showToast(`${veg.name} price updated to Rs. ${price}`, 'success');
  }
}

async function toggleStock(id, inStock) {
  if (apiAvailable) {
    try {
      const data = await adminApiCall(`/vegetables/${id}/stock`, {
        method: 'PATCH',
        body: JSON.stringify({ inStock })
      });
      showToast(data.message || `Stock updated`, inStock ? 'success' : 'warning');
      return;
    } catch (e) {}
  }

  const veg = vegetables.find(v => v.id === id || v.id == id);
  if (veg) {
    veg.inStock = inStock;
    saveData('sabzi_vegetables', vegetables);
    showToast(`${veg.name} ${inStock ? 'is now in stock' : 'marked as out of stock'}`, inStock ? 'success' : 'warning');
  }
}

async function resetVegetables() {
  if (!confirm('Reset all vegetables to default? This will remove any custom vegetables.')) return;

  if (apiAvailable) {
    try {
      await adminApiCall('/vegetables/reset', { method: 'POST' });
      showToast('Vegetables reset to default', 'success');
      await loadVegetablesData();
      renderDashboardStats();
      return;
    } catch (e) {}
  }

  vegetables = [...DEFAULT_VEGETABLES];
  saveData('sabzi_vegetables', vegetables);
  renderAdminVegetables();
  renderDashboardStats();
  showToast('Vegetables reset to default (local)', 'success');
}

// ============================================
// ORDER MANAGEMENT (API-backed)
// ============================================
function renderAdminOrders() {
  const filter = document.getElementById('orderStatusFilter')?.value || 'all';
  let filtered = orders;
  if (filter !== 'all') filtered = filtered.filter(o => o.status === filter);

  const tbody = document.getElementById('adminOrdersBody');
  if (!tbody) return;

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--gray-500);">No orders found</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(o => `
    <tr>
      <td>
        <strong style="color:var(--primary);cursor:pointer;" onclick="viewOrderDetail('${o.id}')">#${o.orderId || o.id?.substring(0, 8).toUpperCase()}</strong>
        <br><small style="color:var(--gray-500);">${new Date(o.createdAt || o.date).toLocaleDateString('en-PK')}</small>
      </td>
      <td>${o.customerName}</td>
      <td>${o.customerPhone}</td>
      <td style="text-transform:capitalize;">${o.deliveryCity || o.city || ''}</td>
      <td>${(o.items || []).length} items</td>
      <td style="font-weight:700;">Rs. ${(o.totalAmount || o.total || 0).toLocaleString()}</td>
      <td>
        <span style="font-size:12px;">
          ${o.paymentMethod === 'cod' 
            ? '<i class="fas fa-money-bill-wave" style="color:var(--accent);"></i> COD' 
            : '<i class="fas fa-mobile-alt" style="color:var(--primary);"></i> Easypaisa'}
        </span>
      </td>
      <td>
        <select class="form-input" style="width:auto;padding:4px 28px 4px 8px;font-size:12px;" 
                onchange="updateOrderStatus('${o.id}', this.value)">
          <option value="pending" ${o.status==='pending'?'selected':''}>Pending</option>
          <option value="confirmed" ${o.status==='confirmed'?'selected':''}>Confirmed</option>
          <option value="processing" ${o.status==='processing'?'selected':''}>Processing</option>
          <option value="out_for_delivery" ${o.status==='out_for_delivery'?'selected':''}>Out for Delivery</option>
          <option value="completed" ${o.status==='completed'?'selected':''}>Completed</option>
          <option value="cancelled" ${o.status==='cancelled'?'selected':''}>Cancelled</option>
        </select>
      </td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="viewOrderDetail('${o.id}')" title="View Details">
          <i class="fas fa-eye"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

async function updateOrderStatus(orderId, newStatus) {
  if (apiAvailable) {
    try {
      const data = await adminApiCall(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      showToast(data.message || `Order marked as ${newStatus}`, newStatus === 'completed' ? 'success' : 'warning');
      await loadDashboardData();
      return;
    } catch (e) {}
  }

  const order = orders.find(o => o.id === orderId);
  if (order) {
    order.status = newStatus;
    saveData('sabzi_orders', orders);
    renderDashboardStats();
    showToast(`Order marked as ${newStatus}`, newStatus === 'completed' ? 'success' : 'warning');
  }
}

async function viewOrderDetail(orderId) {
  let order = orders.find(o => o.id === orderId);

  if (apiAvailable && !order?.items?.length) {
    try {
      const data = await adminApiCall(`/orders/${orderId}`);
      order = data.order;
    } catch(e) {}
  }

  if (!order) return;

  const content = document.getElementById('orderDetailContent');
  const items = order.items || [];
  const subtotal = items.reduce((s, i) => s + (i.price * i.quantity), 0);

  content.innerHTML = `
    <div style="margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <h4 style="color:var(--primary);">Order #${order.orderId || order.id?.substring(0, 8).toUpperCase()}</h4>
        <span class="status-badge status-${order.status}">${order.status}</span>
      </div>
      <p style="font-size:13px;color:var(--gray-500);">${new Date(order.createdAt || order.date).toLocaleString('en-PK')}</p>
    </div>

    <div style="background:var(--gray-50);border-radius:var(--radius-sm);padding:16px;margin-bottom:16px;">
      <h4 style="font-size:13px;color:var(--gray-600);margin-bottom:8px;text-transform:uppercase;">Customer Info</h4>
      <p style="font-size:14px;"><strong>${order.customerName}</strong></p>
      <p style="font-size:13px;color:var(--gray-600);"><i class="fas fa-phone" style="width:16px;"></i> ${order.customerPhone}</p>
      <p style="font-size:13px;color:var(--gray-600);"><i class="fas fa-map-marker-alt" style="width:16px;"></i> ${order.deliveryAddress || order.address || ''}, ${order.deliveryCity || order.city || ''}</p>
      ${order.orderNotes || order.notes ? `<p style="font-size:13px;color:var(--gray-600);"><i class="fas fa-sticky-note" style="width:16px;"></i> ${order.orderNotes || order.notes}</p>` : ''}
    </div>

    <div style="background:var(--gray-50);border-radius:var(--radius-sm);padding:16px;margin-bottom:16px;">
      <h4 style="font-size:13px;color:var(--gray-600);margin-bottom:8px;text-transform:uppercase;">Payment</h4>
      <p style="font-size:14px;font-weight:600;">
        ${order.paymentMethod === 'cod' ? '<i class="fas fa-money-bill-wave text-accent"></i> Cash on Delivery' : '<i class="fas fa-mobile-alt text-primary"></i> Easypaisa'}
      </p>
      ${order.easypaisaNumber ? `<p style="font-size:13px;color:var(--gray-600);">Account: ${order.easypaisaNumber}</p>` : ''}
      ${order.paymentScreenshot ? `<p style="font-size:13px;margin-top:8px;"><a href="${order.paymentScreenshot}" target="_blank" style="color:var(--primary);"><i class="fas fa-image"></i> View Payment Screenshot</a></p>` : ''}
      <p style="font-size:12px;color:var(--gray-500);margin-top:4px;">Payment Status: <span class="status-badge status-${order.paymentStatus || 'pending'}">${order.paymentStatus || 'pending'}</span></p>
    </div>

    <div style="background:var(--gray-50);border-radius:var(--radius-sm);padding:16px;margin-bottom:16px;">
      <h4 style="font-size:13px;color:var(--gray-600);margin-bottom:8px;text-transform:uppercase;">Order Items</h4>
      ${items.map(item => `
        <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;border-bottom:1px solid var(--gray-200);">
          <span>${item.name || item.vegetable_name} x ${item.quantity || item.qty} ${item.unit}</span>
          <span style="font-weight:600;">Rs. ${((item.price) * (item.quantity || item.qty)).toLocaleString()}</span>
        </div>
      `).join('')}
      <div style="border-top:2px solid var(--gray-300);margin-top:8px;padding-top:8px;">
        <div style="display:flex;justify-content:space-between;font-size:13px;"><span>Subtotal</span><span>Rs. ${subtotal.toLocaleString()}</span></div>
        <div style="display:flex;justify-content:space-between;font-size:13px;"><span>Delivery</span><span>${(order.deliveryCharges || order.delivery) === 0 ? 'FREE' : 'Rs. ' + (order.deliveryCharges || order.delivery || 0).toLocaleString()}</span></div>
        <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:800;color:var(--primary);margin-top:4px;">
          <span>Total</span><span>Rs. ${(order.totalAmount || order.total || 0).toLocaleString()}</span>
        </div>
      </div>
    </div>

    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      ${order.status === 'pending' ? `
        <button class="btn btn-primary btn-sm" onclick="updateOrderStatus('${order.id}','completed');closeOrderModal();renderAdminOrders();">
          <i class="fas fa-check"></i> Mark Completed
        </button>
        <button class="btn btn-danger btn-sm" onclick="updateOrderStatus('${order.id}','cancelled');closeOrderModal();renderAdminOrders();">
          <i class="fas fa-times"></i> Cancel Order
        </button>
      ` : ''}
      <a href="https://wa.me/${(order.customerPhone || '').replace(/[^0-9]/g, '')}?text=Hello ${encodeURIComponent(order.customerName)}, regarding your Sabzi Mandi order %23${order.orderId || order.id?.substring(0, 8).toUpperCase()}"
         target="_blank" class="btn btn-sm" style="background:#25d366;color:white;">
        <i class="fab fa-whatsapp"></i> WhatsApp
      </a>
    </div>
  `;

  document.getElementById('orderModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeOrderModal() {
  document.getElementById('orderModal').classList.remove('open');
  document.body.style.overflow = '';
}

async function clearAllOrders() {
  if (!confirm('Are you sure you want to clear ALL orders? This cannot be undone.')) return;

  if (apiAvailable) {
    try {
      await adminApiCall('/orders/admin/clear', { method: 'DELETE' });
      showToast('All orders cleared', 'warning');
      await loadDashboardData();
      renderAdminOrders();
      return;
    } catch(e) {}
  }

  orders = [];
  saveData('sabzi_orders', orders);
  renderAdminOrders();
  renderDashboardStats();
  renderRecentOrders();
  showToast('All orders cleared (local)', 'warning');
}

// ============================================
// DELIVERY CHARGES MANAGEMENT (API-backed)
// ============================================
function renderDeliverySettings() {
  const tbody = document.getElementById('adminDeliveryTable');
  if (!tbody) return;

  tbody.innerHTML = Object.entries(deliveryCharges).map(([city, info]) => `
    <tr>
      <td style="font-weight:600;text-transform:capitalize;">${city}</td>
      <td><input type="number" value="${info.charge}" min="0" data-city="${city}" data-field="charge"
               style="width:100px;padding:4px 8px;border:1px solid var(--gray-300);border-radius:4px;font-size:13px;"></td>
      <td><input type="number" value="${info.freeAbove}" min="0" data-city="${city}" data-field="freeAbove"
               style="width:100px;padding:4px 8px;border:1px solid var(--gray-300);border-radius:4px;font-size:13px;"></td>
      <td><input type="text" value="${info.time}" data-city="${city}" data-field="time"
               style="width:120px;padding:4px 8px;border:1px solid var(--gray-300);border-radius:4px;font-size:13px;"></td>
    </tr>
  `).join('');
}

async function saveDeliveryCharges() {
  const inputs = document.querySelectorAll('#adminDeliveryTable input');
  const updated = {};

  inputs.forEach(input => {
    const city = input.dataset.city;
    const field = input.dataset.field;
    if (!updated[city]) updated[city] = { ...deliveryCharges[city] };
    if (field === 'charge' || field === 'freeAbove') {
      updated[city][field] = parseInt(input.value) || 0;
    } else {
      updated[city][field] = input.value;
    }
  });

  if (apiAvailable) {
    try {
      await adminApiCall('/settings/delivery', {
        method: 'PUT',
        body: JSON.stringify(updated)
      });
      deliveryCharges = updated;
      showToast('Delivery charges updated! Changes will reflect on the store instantly.', 'success');
      return;
    } catch(e) {}
  }

  deliveryCharges = updated;
  saveData('sabzi_delivery', deliveryCharges);
  showToast('Delivery charges updated (local)!', 'success');
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeVegModal(); closeOrderModal(); }
});

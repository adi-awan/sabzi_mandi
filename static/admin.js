/* ============================================
   SABZI MANDI - Admin Panel JavaScript
   Handles vegetable, order, and delivery management
   Syncs with frontend via localStorage
   ============================================ */

// ============================================
// ADMIN CREDENTIALS (hardcoded for demo)
// ============================================
const ADMIN_CREDS = {
  username: 'admin',
  password: 'admin123'
};

// Default vegetables (same as in app.js for reset functionality)
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
// STATE
// ============================================
let vegetables = [];
let orders = [];
let deliveryCharges = {};
let isLoggedIn = false;

// ============================================
// STORAGE HELPERS
// ============================================
function saveData(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) { console.warn(e); }
}

function loadData(key) {
  try {
    const d = localStorage.getItem(key);
    return d ? JSON.parse(d) : null;
  } catch (e) { return null; }
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
// ADMIN AUTH
// ============================================
function adminLogin() {
  const u = document.getElementById('adminUsername').value.trim();
  const p = document.getElementById('adminPassword').value;

  if (u === ADMIN_CREDS.username && p === ADMIN_CREDS.password) {
    isLoggedIn = true;
    sessionStorage.setItem('adminLoggedIn', 'true');
    document.getElementById('adminLoginPage').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'grid';
    loadAdminData();
    showToast('Welcome to Admin Panel!', 'success');
  } else {
    showToast('Invalid credentials!', 'error');
  }
}

function adminLogout() {
  isLoggedIn = false;
  sessionStorage.removeItem('adminLoggedIn');
  document.getElementById('adminLoginPage').style.display = 'flex';
  document.getElementById('adminDashboard').style.display = 'none';
  showToast('Logged out successfully', 'success');
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  // Check if already logged in
  if (sessionStorage.getItem('adminLoggedIn') === 'true') {
    isLoggedIn = true;
    document.getElementById('adminLoginPage').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'grid';
    loadAdminData();
  }

  // Handle responsive sidebar
  checkMobileToggle();
  window.addEventListener('resize', checkMobileToggle);
});

function checkMobileToggle() {
  const toggle = document.getElementById('adminMobileToggle');
  if (window.innerWidth <= 1024) {
    toggle.style.display = 'inline-flex';
  } else {
    toggle.style.display = 'none';
    document.getElementById('adminSidebar').classList.remove('open');
  }
}

function toggleAdminSidebar() {
  document.getElementById('adminSidebar').classList.toggle('open');
}

function loadAdminData() {
  vegetables = loadData('sabzi_vegetables') || [...DEFAULT_VEGETABLES];
  orders = loadData('sabzi_orders') || [];
  deliveryCharges = loadData('sabzi_delivery') || { ...DEFAULT_DELIVERY };

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
  event.target.closest('a').classList.add('active');

  // Refresh data for the section
  if (section === 'dashboard') { renderDashboardStats(); renderRecentOrders(); }
  if (section === 'vegetables') renderAdminVegetables();
  if (section === 'orders') renderAdminOrders();
  if (section === 'delivery') renderDeliverySettings();

  // Close mobile sidebar
  document.getElementById('adminSidebar').classList.remove('open');
}

// ============================================
// DASHBOARD STATS
// ============================================
function renderDashboardStats() {
  orders = loadData('sabzi_orders') || [];
  
  const totalVeg = vegetables.length;
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  document.getElementById('statVegetables').textContent = totalVeg;
  document.getElementById('statOrders').textContent = totalOrders;
  document.getElementById('statRevenue').textContent = 'Rs. ' + totalRevenue.toLocaleString();
  document.getElementById('statPending').textContent = pendingOrders;
}

function renderRecentOrders() {
  orders = loadData('sabzi_orders') || [];
  const tbody = document.getElementById('recentOrdersBody');
  
  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--gray-500);">No orders yet</td></tr>';
    return;
  }

  const recent = [...orders].reverse().slice(0, 5);
  tbody.innerHTML = recent.map(o => `
    <tr>
      <td><strong>#${o.orderId}</strong></td>
      <td>${o.customerName}</td>
      <td>${o.items.length} items</td>
      <td style="font-weight:700;">Rs. ${o.total.toLocaleString()}</td>
      <td><span style="text-transform:capitalize;">${o.paymentMethod === 'cod' ? 'Cash' : 'Easypaisa'}</span></td>
      <td><span class="status-badge status-${o.status}">${o.status}</span></td>
    </tr>
  `).join('');
}

// ============================================
// VEGETABLE MANAGEMENT
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
          <img src="${v.image}" alt="${v.name}" loading="lazy" 
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
               onchange="quickUpdatePrice(${v.id}, this.value)">
      </td>
      <td style="font-size:13px;">${v.unit}</td>
      <td>
        <label class="toggle-switch">
          <input type="checkbox" ${v.inStock ? 'checked' : ''} onchange="toggleStock(${v.id}, this.checked)">
          <span class="toggle-slider"></span>
        </label>
      </td>
      <td>
        <div style="display:flex;gap:4px;">
          <button class="btn btn-sm btn-outline" onclick="editVegetable(${v.id})" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-danger" onclick="deleteVegetable(${v.id})" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openVegModal(editId) {
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
  const veg = vegetables.find(v => v.id === id);
  if (!veg) return;

  document.getElementById('vegEditId').value = id;
  document.getElementById('vegName').value = veg.name;
  document.getElementById('vegNameUrdu').value = veg.nameUrdu || '';
  document.getElementById('vegCategory').value = veg.category;
  document.getElementById('vegUnit').value = veg.unit;
  document.getElementById('vegPrice').value = veg.price;
  document.getElementById('vegImage').value = veg.image || '';
  document.getElementById('vegInStock').checked = veg.inStock;
  document.getElementById('vegModalTitle').innerHTML = '<i class="fas fa-edit text-primary"></i> Edit Vegetable';
  document.getElementById('vegSaveBtn').textContent = 'Save Changes';

  document.getElementById('vegModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function saveVegetable() {
  const editId = document.getElementById('vegEditId').value;
  const name = document.getElementById('vegName').value.trim();
  const nameUrdu = document.getElementById('vegNameUrdu').value.trim();
  const category = document.getElementById('vegCategory').value;
  const unit = document.getElementById('vegUnit').value;
  const price = parseInt(document.getElementById('vegPrice').value);
  const image = document.getElementById('vegImage').value.trim();
  const inStock = document.getElementById('vegInStock').checked;

  if (!name || !price || price < 1) {
    showToast('Please fill name and valid price', 'error');
    return;
  }

  if (editId) {
    // Update existing
    const idx = vegetables.findIndex(v => v.id === parseInt(editId));
    if (idx >= 0) {
      vegetables[idx] = { ...vegetables[idx], name, nameUrdu, category, unit, price, image, inStock };
      showToast('Vegetable updated successfully!', 'success');
    }
  } else {
    // Add new
    const newVeg = {
      id: Date.now(),
      name, nameUrdu, category, unit, price,
      image: image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=400&fit=crop',
      inStock
    };
    vegetables.push(newVeg);
    showToast('Vegetable added successfully!', 'success');
  }

  saveData('sabzi_vegetables', vegetables);
  closeVegModal();
  renderAdminVegetables();
  renderDashboardStats();
}

function deleteVegetable(id) {
  if (!confirm('Are you sure you want to delete this vegetable?')) return;
  
  vegetables = vegetables.filter(v => v.id !== id);
  saveData('sabzi_vegetables', vegetables);
  renderAdminVegetables();
  renderDashboardStats();
  showToast('Vegetable deleted', 'warning');
}

function quickUpdatePrice(id, newPrice) {
  const price = parseInt(newPrice);
  if (!price || price < 1) return;

  const veg = vegetables.find(v => v.id === id);
  if (veg) {
    veg.price = price;
    saveData('sabzi_vegetables', vegetables);
    showToast(`${veg.name} price updated to Rs. ${price}`, 'success');
  }
}

function toggleStock(id, inStock) {
  const veg = vegetables.find(v => v.id === id);
  if (veg) {
    veg.inStock = inStock;
    saveData('sabzi_vegetables', vegetables);
    showToast(`${veg.name} ${inStock ? 'is now in stock' : 'marked as out of stock'}`, inStock ? 'success' : 'warning');
  }
}

function resetVegetables() {
  if (!confirm('Reset all vegetables to default? This will remove any custom vegetables.')) return;
  
  vegetables = [...DEFAULT_VEGETABLES];
  saveData('sabzi_vegetables', vegetables);
  renderAdminVegetables();
  renderDashboardStats();
  showToast('Vegetables reset to default', 'success');
}

// ============================================
// ORDER MANAGEMENT
// ============================================
function renderAdminOrders() {
  orders = loadData('sabzi_orders') || [];
  const filter = document.getElementById('orderStatusFilter')?.value || 'all';
  
  let filtered = orders;
  if (filter !== 'all') filtered = filtered.filter(o => o.status === filter);

  const tbody = document.getElementById('adminOrdersBody');
  if (!tbody) return;

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--gray-500);">No orders found</td></tr>';
    return;
  }

  tbody.innerHTML = [...filtered].reverse().map(o => `
    <tr>
      <td>
        <strong style="color:var(--primary);cursor:pointer;" onclick="viewOrderDetail('${o.orderId}')">#${o.orderId}</strong>
        <br><small style="color:var(--gray-500);">${new Date(o.date).toLocaleDateString('en-PK')}</small>
      </td>
      <td>${o.customerName}</td>
      <td>${o.customerPhone}</td>
      <td style="text-transform:capitalize;">${o.city}</td>
      <td>${o.items.length} items</td>
      <td style="font-weight:700;">Rs. ${o.total.toLocaleString()}</td>
      <td>
        <span style="font-size:12px;">
          ${o.paymentMethod === 'cod' 
            ? '<i class="fas fa-money-bill-wave" style="color:var(--accent);"></i> COD' 
            : '<i class="fas fa-mobile-alt" style="color:var(--primary);"></i> Easypaisa'}
        </span>
      </td>
      <td>
        <select class="form-input" style="width:auto;padding:4px 28px 4px 8px;font-size:12px;" 
                onchange="updateOrderStatus('${o.orderId}', this.value)" value="${o.status}">
          <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>Pending</option>
          <option value="completed" ${o.status === 'completed' ? 'selected' : ''}>Completed</option>
          <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>
      </td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="viewOrderDetail('${o.orderId}')" title="View Details">
          <i class="fas fa-eye"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function updateOrderStatus(orderId, newStatus) {
  orders = loadData('sabzi_orders') || [];
  const order = orders.find(o => o.orderId === orderId);
  if (order) {
    order.status = newStatus;
    saveData('sabzi_orders', orders);
    renderDashboardStats();
    showToast(`Order #${orderId} marked as ${newStatus}`, newStatus === 'completed' ? 'success' : 'warning');
  }
}

function viewOrderDetail(orderId) {
  orders = loadData('sabzi_orders') || [];
  const order = orders.find(o => o.orderId === orderId);
  if (!order) return;

  const content = document.getElementById('orderDetailContent');
  content.innerHTML = `
    <div style="margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <h4 style="color:var(--primary);">Order #${order.orderId}</h4>
        <span class="status-badge status-${order.status}">${order.status}</span>
      </div>
      <p style="font-size:13px;color:var(--gray-500);">${new Date(order.date).toLocaleString('en-PK')}</p>
    </div>

    <div style="background:var(--gray-50);border-radius:var(--radius-sm);padding:16px;margin-bottom:16px;">
      <h4 style="font-size:13px;color:var(--gray-600);margin-bottom:8px;text-transform:uppercase;">Customer Info</h4>
      <p style="font-size:14px;"><strong>${order.customerName}</strong></p>
      <p style="font-size:13px;color:var(--gray-600);"><i class="fas fa-phone" style="width:16px;"></i> ${order.customerPhone}</p>
      <p style="font-size:13px;color:var(--gray-600);"><i class="fas fa-map-marker-alt" style="width:16px;"></i> ${order.address}, ${order.city}</p>
      ${order.notes ? `<p style="font-size:13px;color:var(--gray-600);"><i class="fas fa-sticky-note" style="width:16px;"></i> ${order.notes}</p>` : ''}
    </div>

    <div style="background:var(--gray-50);border-radius:var(--radius-sm);padding:16px;margin-bottom:16px;">
      <h4 style="font-size:13px;color:var(--gray-600);margin-bottom:8px;text-transform:uppercase;">Payment</h4>
      <p style="font-size:14px;font-weight:600;">
        ${order.paymentMethod === 'cod' ? '<i class="fas fa-money-bill-wave text-accent"></i> Cash on Delivery' : '<i class="fas fa-mobile-alt text-primary"></i> Easypaisa'}
      </p>
      ${order.easypaisaNumber ? `<p style="font-size:13px;color:var(--gray-600);">Account: ${order.easypaisaNumber}</p>` : ''}
    </div>

    <div style="background:var(--gray-50);border-radius:var(--radius-sm);padding:16px;margin-bottom:16px;">
      <h4 style="font-size:13px;color:var(--gray-600);margin-bottom:8px;text-transform:uppercase;">Order Items</h4>
      ${order.items.map(item => `
        <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;border-bottom:1px solid var(--gray-200);">
          <span>${item.name} x ${item.qty} ${item.unit}</span>
          <span style="font-weight:600;">Rs. ${(item.price * item.qty).toLocaleString()}</span>
        </div>
      `).join('')}
      <div style="border-top:2px solid var(--gray-300);margin-top:8px;padding-top:8px;">
        <div style="display:flex;justify-content:space-between;font-size:13px;"><span>Subtotal</span><span>Rs. ${order.subtotal.toLocaleString()}</span></div>
        <div style="display:flex;justify-content:space-between;font-size:13px;"><span>Delivery</span><span>${order.delivery === 0 ? 'FREE' : 'Rs. ' + order.delivery.toLocaleString()}</span></div>
        <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:800;color:var(--primary);margin-top:4px;">
          <span>Total</span><span>Rs. ${order.total.toLocaleString()}</span>
        </div>
      </div>
    </div>

    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      ${order.status === 'pending' ? `
        <button class="btn btn-primary btn-sm" onclick="updateOrderStatus('${order.orderId}','completed');closeOrderModal();renderAdminOrders();">
          <i class="fas fa-check"></i> Mark Completed
        </button>
        <button class="btn btn-danger btn-sm" onclick="updateOrderStatus('${order.orderId}','cancelled');closeOrderModal();renderAdminOrders();">
          <i class="fas fa-times"></i> Cancel Order
        </button>
      ` : ''}
      <a href="https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}?text=Hello ${encodeURIComponent(order.customerName)}, regarding your Sabzi Mandi order %23${order.orderId}" 
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

function clearAllOrders() {
  if (!confirm('Are you sure you want to clear ALL orders? This cannot be undone.')) return;
  
  orders = [];
  saveData('sabzi_orders', orders);
  renderAdminOrders();
  renderDashboardStats();
  renderRecentOrders();
  showToast('All orders cleared', 'warning');
}

// ============================================
// DELIVERY CHARGES MANAGEMENT
// ============================================
function renderDeliverySettings() {
  const tbody = document.getElementById('adminDeliveryTable');
  if (!tbody) return;

  tbody.innerHTML = Object.entries(deliveryCharges).map(([city, info]) => `
    <tr>
      <td style="font-weight:600;text-transform:capitalize;">${city}</td>
      <td>
        <input type="number" value="${info.charge}" min="0" data-city="${city}" data-field="charge"
               style="width:100px;padding:4px 8px;border:1px solid var(--gray-300);border-radius:4px;font-size:13px;">
      </td>
      <td>
        <input type="number" value="${info.freeAbove}" min="0" data-city="${city}" data-field="freeAbove"
               style="width:100px;padding:4px 8px;border:1px solid var(--gray-300);border-radius:4px;font-size:13px;">
      </td>
      <td>
        <input type="text" value="${info.time}" data-city="${city}" data-field="time"
               style="width:120px;padding:4px 8px;border:1px solid var(--gray-300);border-radius:4px;font-size:13px;">
      </td>
    </tr>
  `).join('');
}

function saveDeliveryCharges() {
  const inputs = document.querySelectorAll('#adminDeliveryTable input');
  
  inputs.forEach(input => {
    const city = input.dataset.city;
    const field = input.dataset.field;
    
    if (!deliveryCharges[city]) deliveryCharges[city] = {};
    
    if (field === 'charge' || field === 'freeAbove') {
      deliveryCharges[city][field] = parseInt(input.value) || 0;
    } else {
      deliveryCharges[city][field] = input.value;
    }
  });

  saveData('sabzi_delivery', deliveryCharges);
  showToast('Delivery charges updated! Changes will reflect on the store instantly.', 'success');
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeVegModal();
    closeOrderModal();
  }
});

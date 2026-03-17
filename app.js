/* ============================================================
   DELIVERY TRACKER — Core App Logic
   app.js — State management, data loading, utilities
   ============================================================ */

'use strict';

// ── App State ────────────────────────────────────────────────
const App = {
  deliveries: [],
  filteredDeliveries: [],
  settings: {
    depotName:    'Mosquée Assalam',
    depotAddress: '138 Avenue de la Liberté',
    depotCity:    'Maisons-Alfort',
    depotPostcode:'94700',
    driverName:   '',
    vehiclePlate: '',
    hapticEnabled: true,
    notificationsEnabled: false,
  },
  currentFilter: 'all',
  searchQuery: '',
  currentPage: 'dashboard',

  // Load state from localStorage
  init() {
    const saved = localStorage.getItem('delivery_app_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.deliveries = parsed.deliveries || [];
        if (parsed.settings) Object.assign(this.settings, parsed.settings);
      } catch(e) { console.warn('Could not parse saved data, loading demo data.'); }
    }

    const savedSettings = localStorage.getItem('delivery_app_settings');
    if (savedSettings) {
      try { Object.assign(this.settings, JSON.parse(savedSettings)); }
      catch(e) { /* ignore */ }
    }

    if (!this.deliveries.length) {
      this.loadDemoData();
    } else {
      this.applyFilter();
      this.render();
    }
  },

  // Load demo JSON
  async loadDemoData() {
    try {
      const res = await fetch('./data/deliveries.json');
      const json = await res.json();
      this.deliveries = json.deliveries || [];
      if (json.meta?.depot) {
        Object.assign(this.settings, {
          depotName:     json.meta.depot.name,
          depotAddress:  json.meta.depot.address,
          depotCity:     json.meta.depot.city,
          depotPostcode: json.meta.depot.postcode,
        });
      }
      if (json.meta?.driver) {
        Object.assign(this.settings, {
          driverName:   json.meta.driver.name,
          vehiclePlate: json.meta.driver.plate,
        });
      }
      this.save();
      this.applyFilter();
      this.render();
    } catch(e) {
      console.error('Failed to load demo data:', e);
      Toast.show('Impossible de charger les données', 'error');
    }
  },

  // Persist to localStorage
  save() {
    localStorage.setItem('delivery_app_data', JSON.stringify({ deliveries: this.deliveries }));
    localStorage.setItem('delivery_app_settings', JSON.stringify(this.settings));
  },

  applyFilter() {
    let list = [...this.deliveries];
    if (this.currentFilter !== 'all') {
      list = list.filter(d => d.status === this.currentFilter);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(d =>
        d.recipient.toLowerCase().includes(q) ||
        d.address.toLowerCase().includes(q) ||
        d.city.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => a.stop_order - b.stop_order);
    this.filteredDeliveries = list;
  },

  // Full re-render of current page
  render() {
    switch (this.currentPage) {
      case 'dashboard': Dashboard.render(); break;
      case 'deliveries': DeliveryList.render(); break;
      case 'roadmap': Roadmap.render(); break;
      case 'settings': Settings.render(); break;
    }
    this.updateNavBadge();
  },

  updateNavBadge() {
    const pending = this.deliveries.filter(d => d.status === 'pending' || d.status === 'in_transit').length;
    const badge = document.getElementById('deliveries-badge');
    if (badge) {
      badge.textContent = pending;
      badge.style.display = pending > 0 ? 'flex' : 'none';
    }
  },

  // Navigate to a page
  navigate(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const pageEl = document.getElementById(`page-${page}`);
    const navEl  = document.querySelector(`[data-nav="${page}"]`);
    if (pageEl) pageEl.classList.add('active');
    if (navEl)  navEl.classList.add('active');

    this.currentPage = page;
    this.render();

    // Hide FAB on settings page
    const fab = document.getElementById('fab-container');
    if (fab) fab.style.display = page === 'settings' ? 'none' : 'flex';
  },

  // Status helpers
  getStats() {
    return {
      total:      this.deliveries.length,
      delivered:  this.deliveries.filter(d => d.status === 'delivered').length,
      in_transit: this.deliveries.filter(d => d.status === 'in_transit').length,
      pending:    this.deliveries.filter(d => d.status === 'pending').length,
      failed:     this.deliveries.filter(d => d.status === 'failed').length,
    };
  },

  markDelivered(id) {
    const d = this.deliveries.find(d => d.id === id);
    if (!d) return;
    d.status = 'delivered';
    d.delivered_at = new Date().toISOString();
    this.save();
    this.applyFilter();
    this.render();
    if (this.settings.hapticEnabled) Haptic.trigger('success');
    Toast.show(`✓ ${d.recipient} — Livraison confirmée`, 'success');
  },

  markFailed(id) {
    const d = this.deliveries.find(d => d.id === id);
    if (!d) return;
    d.status = 'failed';
    this.save();
    this.applyFilter();
    this.render();
    Toast.show(`Livraison échouée — ${d.recipient}`, 'error');
  },

  markInTransit(id) {
    const d = this.deliveries.find(d => d.id === id);
    if (!d) return;
    d.status = 'in_transit';
    this.save();
    this.applyFilter();
    this.render();
    Toast.show(`En route vers ${d.recipient}`, 'info');
  },

  deleteDelivery(id) {
    this.deliveries = this.deliveries.filter(d => d.id !== id);
    this.save();
    this.applyFilter();
    this.render();
    Toast.show('Livraison supprimée', 'info');
  },

  addDelivery(data) {
    const maxOrder = this.deliveries.reduce((m, d) => Math.max(m, d.stop_order || 0), 0);
    const id = 'LIV-' + String(this.deliveries.length + 1).padStart(3, '0');
    const delivery = {
      id,
      recipient: data.recipient,
      phone: data.phone || '',
      address: data.address,
      city: data.city,
      postcode: data.postcode || '',
      lat: null, lng: null,
      status: 'pending',
      priority: data.priority || 'normal',
      items: data.items || '',
      notes: data.notes || '',
      scheduled: data.scheduled || new Date().toISOString(),
      delivered_at: null,
      stop_order: maxOrder + 1,
    };
    this.deliveries.push(delivery);
    this.save();
    this.applyFilter();
    this.render();
    Toast.show(`Livraison ajoutée — ${delivery.recipient}`, 'success');
    return delivery;
  },

  updateDelivery(id, data) {
    const idx = this.deliveries.findIndex(d => d.id === id);
    if (idx === -1) return;
    Object.assign(this.deliveries[idx], data);
    this.save();
    this.applyFilter();
    this.render();
    Toast.show('Livraison mise à jour', 'success');
  },

  exportJSON() {
    const blob = new Blob([JSON.stringify({ deliveries: this.deliveries, settings: this.settings }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `livraisons_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    Toast.show('Export JSON téléchargé', 'success');
  },

  importJSON(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        if (json.deliveries) {
          this.deliveries = json.deliveries;
          if (json.settings) Object.assign(this.settings, json.settings);
          this.save();
          this.applyFilter();
          this.render();
          Toast.show(`${json.deliveries.length} livraisons importées`, 'success');
        } else { throw new Error('Format invalide'); }
      } catch(err) {
        Toast.show('Erreur: fichier JSON invalide', 'error');
      }
    };
    reader.readAsText(file);
  },

  resetToDemo() {
    localStorage.removeItem('delivery_app_data');
    localStorage.removeItem('delivery_app_settings');
    this.deliveries = [];
    this.loadDemoData();
  }
};

// ── Haptic Feedback ──────────────────────────────────────────
const Haptic = {
  trigger(type = 'light') {
    if (!App.settings.hapticEnabled) return;
    if (!navigator.vibrate) return;
    const patterns = {
      light:   [30],
      medium:  [50],
      heavy:   [80],
      success: [40, 60, 40],
      error:   [80, 30, 80],
      double:  [30, 30, 30],
    };
    navigator.vibrate(patterns[type] || patterns.light);
  }
};

// ── Toast Notifications ──────────────────────────────────────
const Toast = {
  show(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
      <span class="toast-msg">${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
};

// ── Modal Manager ────────────────────────────────────────────
const Modal = {
  open(id) {
    const el = document.getElementById(id);
    if (el) { el.classList.add('open'); document.body.style.overflow = 'hidden'; }
  },
  close(id) {
    const el = document.getElementById(id);
    if (el) { el.classList.remove('open'); document.body.style.overflow = ''; }
  },
  closeAll() {
    document.querySelectorAll('.modal-overlay.open').forEach(m => {
      m.classList.remove('open');
    });
    document.body.style.overflow = '';
  }
};

// ── Utilities ────────────────────────────────────────────────
const Utils = {
  statusLabel(status) {
    const labels = {
      pending:    'En attente',
      in_transit: 'En route',
      delivered:  'Livré',
      failed:     'Échoué',
    };
    return labels[status] || status;
  },

  priorityLabel(priority) {
    const labels = { urgent: '🔴 Urgent', normal: '🟡 Normal', low: '🔵 Faible' };
    return labels[priority] || priority;
  },

  formatTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  },

  formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  },

  formatDateTime(iso) {
    if (!iso) return '—';
    return `${this.formatDate(iso)} ${this.formatTime(iso)}`;
  },

  getFullAddress(d) {
    return `${d.address}, ${d.postcode} ${d.city}`;
  },

  getMapsUrl(delivery) {
    const addr = encodeURIComponent(`${delivery.address}, ${delivery.postcode} ${delivery.city}`);
    return `https://maps.google.com/maps?q=${addr}`;
  },

  getNavUrl(delivery) {
    const addr = encodeURIComponent(`${delivery.address}, ${delivery.postcode} ${delivery.city}`);
    return `https://www.google.com/maps/dir/?api=1&destination=${addr}&travelmode=driving`;
  }
};

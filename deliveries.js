/* ============================================================
   DELIVERY TRACKER — Deliveries List Page
   js/deliveries.js
   ============================================================ */

const DeliveryList = {
  editingId: null,

  render() {
    const container = document.getElementById('page-deliveries');
    if (!container) return;

    const stats = App.getStats();

    container.innerHTML = `
      <div class="app-header">
        <div class="logo">
          <div class="logo-icon">📦</div>
          <div class="logo-text">Livraisons</div>
        </div>
        <div class="header-actions">
          <button class="header-btn" onclick="Modal.open('modal-add-delivery')" title="Ajouter">＋</button>
        </div>
      </div>

      <!-- Search -->
      <div style="padding:16px 20px 0">
        <div class="search-bar">
          <span class="search-icon">🔍</span>
          <input
            type="search"
            placeholder="Rechercher un destinataire, adresse..."
            value="${App.searchQuery}"
            oninput="DeliveryList.onSearch(this.value)"
          >
          ${App.searchQuery ? `<button onclick="DeliveryList.clearSearch()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:16px">✕</button>` : ''}
        </div>
      </div>

      <!-- Filter Chips -->
      <div class="filter-row">
        <div class="filter-chip ${App.currentFilter === 'all' ? 'active' : ''}" onclick="DeliveryList.setFilter('all')">
          Tous (${stats.total})
        </div>
        <div class="filter-chip ${App.currentFilter === 'pending' ? 'active' : ''}" onclick="DeliveryList.setFilter('pending')">
          ⏳ En attente (${stats.pending})
        </div>
        <div class="filter-chip ${App.currentFilter === 'in_transit' ? 'active' : ''}" onclick="DeliveryList.setFilter('in_transit')">
          🚐 En route (${stats.in_transit})
        </div>
        <div class="filter-chip ${App.currentFilter === 'delivered' ? 'active' : ''}" onclick="DeliveryList.setFilter('delivered')">
          ✅ Livrés (${stats.delivered})
        </div>
        <div class="filter-chip ${App.currentFilter === 'failed' ? 'active' : ''}" onclick="DeliveryList.setFilter('failed')">
          ❌ Échoués (${stats.failed})
        </div>
      </div>

      <!-- List -->
      <div class="section" style="padding-top:0">
        ${App.filteredDeliveries.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">📭</div>
            <h3>Aucune livraison</h3>
            <p>${App.searchQuery ? 'Aucun résultat pour cette recherche' : 'Aucune livraison dans cette catégorie'}</p>
          </div>
        ` : App.filteredDeliveries.map(d => this.renderCard(d)).join('')}
      </div>
    `;
  },

  renderCard(d) {
    const isUrgent = d.priority === 'urgent';
    return `
      <div class="delivery-card status-${d.status}" id="card-${d.id}">
        <div class="delivery-card-header">
          <div style="flex:1">
            <div class="delivery-id">
              ${d.id} · #${d.stop_order}
              ${isUrgent ? '<span style="color:var(--red);font-size:10px;margin-left:4px">● URGENT</span>' : ''}
            </div>
            <div class="delivery-title">${d.recipient}</div>
            <div class="delivery-address">
              <span class="icon">📍</span>
              <span>${d.address}<br>${d.postcode} ${d.city}</span>
            </div>
          </div>
          <div style="text-align:right;flex-shrink:0;margin-left:12px">
            <span class="meta-chip chip-${d.status}">${Utils.statusLabel(d.status)}</span>
          </div>
        </div>

        <!-- Items & Notes -->
        ${d.items ? `
          <div style="display:flex;align-items:center;gap:6px;margin-top:8px;font-size:12px;color:var(--text-secondary)">
            <span>📋</span> ${d.items}
          </div>
        ` : ''}
        ${d.notes ? `
          <div style="display:flex;align-items:flex-start;gap:6px;margin-top:4px;font-size:12px;color:var(--text-muted);font-style:italic">
            <span>💬</span> ${d.notes}
          </div>
        ` : ''}

        <!-- Meta -->
        <div class="delivery-meta">
          ${d.scheduled ? `<span class="delivery-time">🕐 ${Utils.formatTime(d.scheduled)}</span>` : ''}
          ${d.phone ? `
            <span class="meta-dot"></span>
            <a href="tel:${d.phone}" onclick="event.stopPropagation()" style="font-size:11px;font-family:var(--font-mono);color:var(--blue);text-decoration:none">📞 ${d.phone}</a>
          ` : ''}
          ${d.delivered_at ? `<span class="meta-dot"></span><span class="delivery-time" style="color:var(--green)">✓ ${Utils.formatTime(d.delivered_at)}</span>` : ''}
        </div>

        <!-- Actions -->
        <div class="delivery-actions">
          ${d.status === 'pending' ? `
            <button class="btn btn-ghost btn-sm" onclick="App.markInTransit('${d.id}')">🚐 Démarrer</button>
          ` : ''}
          ${d.status === 'in_transit' ? `
            <button class="btn btn-success btn-sm" onclick="DeliveryList.confirmDelivered('${d.id}')">✓ Livré</button>
            <button class="btn btn-danger btn-sm"  onclick="DeliveryList.confirmFailed('${d.id}')">✕ Échoué</button>
          ` : ''}
          ${d.status === 'failed' ? `
            <button class="btn btn-ghost btn-sm" onclick="App.markInTransit('${d.id}')">↺ Retenter</button>
          ` : ''}
          <a class="btn btn-ghost btn-sm" href="${Utils.getNavUrl(d)}" target="_blank">🗺️ GPS</a>
          <button class="btn btn-ghost btn-sm" onclick="DeliveryList.openDetail('${d.id}')">✎ Détails</button>
          <button class="btn btn-danger btn-sm" onclick="DeliveryList.confirmDelete('${d.id}')">🗑</button>
        </div>
      </div>
    `;
  },

  onSearch(q) {
    App.searchQuery = q;
    App.applyFilter();
    this.render();
  },

  clearSearch() {
    App.searchQuery = '';
    App.applyFilter();
    this.render();
  },

  setFilter(filter) {
    App.currentFilter = filter;
    App.applyFilter();
    this.render();
    Haptic.trigger('light');
  },

  // ── Confirm: Delivered ──
  confirmDelivered(id) {
    const d = App.deliveries.find(d => d.id === id);
    if (!d) return;

    const overlay = document.getElementById('modal-confirm');
    const modal   = overlay.querySelector('.modal');
    modal.innerHTML = `
      <div class="modal-handle"></div>
      <div class="modal-title">✅ Confirmer la livraison</div>
      <div class="modal-subtitle">Marquer la livraison de <strong>${d.recipient}</strong> comme effectuée?</div>
      <div style="background:var(--bg-card);border-radius:var(--radius-md);padding:14px;margin-bottom:8px">
        <div style="font-size:13px;color:var(--text-secondary)">${d.address}, ${d.postcode} ${d.city}</div>
        ${d.items ? `<div style="font-size:12px;color:var(--text-muted);margin-top:4px">📋 ${d.items}</div>` : ''}
      </div>
      <div class="confirm-actions">
        <button class="btn btn-ghost" onclick="Modal.close('modal-confirm')">Annuler</button>
        <button class="btn btn-success" onclick="App.markDelivered('${id}');Modal.close('modal-confirm');DeliveryList.flashCard('${id}')">
          ✓ Confirmer
        </button>
      </div>
    `;
    Modal.open('modal-confirm');
  },

  // ── Confirm: Failed ──
  confirmFailed(id) {
    const d = App.deliveries.find(d => d.id === id);
    if (!d) return;

    const overlay = document.getElementById('modal-confirm');
    const modal   = overlay.querySelector('.modal');
    modal.innerHTML = `
      <div class="modal-handle"></div>
      <div class="modal-title" style="color:var(--red)">❌ Livraison échouée</div>
      <div class="modal-subtitle">Signaler la livraison de <strong>${d.recipient}</strong> comme échouée?</div>
      <div class="confirm-actions">
        <button class="btn btn-ghost" onclick="Modal.close('modal-confirm')">Annuler</button>
        <button class="btn btn-danger" onclick="App.markFailed('${id}');Modal.close('modal-confirm')">
          Confirmer l'échec
        </button>
      </div>
    `;
    Modal.open('modal-confirm');
  },

  // ── Confirm: Delete ──
  confirmDelete(id) {
    const d = App.deliveries.find(d => d.id === id);
    if (!d) return;

    const overlay = document.getElementById('modal-confirm');
    const modal   = overlay.querySelector('.modal');
    modal.innerHTML = `
      <div class="modal-handle"></div>
      <div class="modal-title" style="color:var(--red)">🗑️ Supprimer</div>
      <div class="modal-subtitle">
        Cette action est <strong>irréversible</strong>. Supprimer la livraison de <strong>${d.recipient}</strong>?
      </div>
      <div class="confirm-actions">
        <button class="btn btn-ghost" onclick="Modal.close('modal-confirm')">Annuler</button>
        <button class="btn btn-danger" onclick="App.deleteDelivery('${id}');Modal.close('modal-confirm')">
          Supprimer définitivement
        </button>
      </div>
    `;
    Modal.open('modal-confirm');
    Haptic.trigger('heavy');
  },

  // ── Flash animation after mark ──
  flashCard(id) {
    setTimeout(() => {
      const card = document.getElementById(`card-${id}`);
      if (card) {
        card.classList.add('haptic-flash');
        setTimeout(() => card.classList.remove('haptic-flash'), 400);
      }
    }, 100);
  },

  // ── Open Detail / Edit Modal ──
  openDetail(id) {
    const d = App.deliveries.find(d => d.id === id);
    if (!d) return;
    this.editingId = id;
    this.populateForm(d);
    document.getElementById('modal-add-title').textContent = `Modifier ${d.id}`;
    document.getElementById('modal-add-submit').textContent = '💾 Enregistrer';
    Modal.open('modal-add-delivery');
  },

  // ── Populate add/edit form ──
  populateForm(d) {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    set('form-recipient', d.recipient);
    set('form-phone', d.phone);
    set('form-address', d.address);
    set('form-city', d.city);
    set('form-postcode', d.postcode);
    set('form-items', d.items);
    set('form-notes', d.notes);
    set('form-priority', d.priority);
    if (d.scheduled) {
      const el = document.getElementById('form-scheduled');
      if (el) el.value = d.scheduled.slice(0, 16);
    }
  },

  // ── Submit add/edit form ──
  submitForm() {
    const get = (id) => document.getElementById(id)?.value.trim() || '';
    const data = {
      recipient: get('form-recipient'),
      phone:     get('form-phone'),
      address:   get('form-address'),
      city:      get('form-city'),
      postcode:  get('form-postcode'),
      items:     get('form-items'),
      notes:     get('form-notes'),
      priority:  get('form-priority'),
      scheduled: get('form-scheduled') ? new Date(get('form-scheduled')).toISOString() : null,
    };

    if (!data.recipient || !data.address || !data.city) {
      Toast.show('Veuillez remplir les champs obligatoires', 'error');
      return;
    }

    if (this.editingId) {
      App.updateDelivery(this.editingId, data);
      this.editingId = null;
    } else {
      App.addDelivery(data);
    }

    Modal.close('modal-add-delivery');
    document.getElementById('modal-add-title').textContent = 'Nouvelle livraison';
    document.getElementById('modal-add-submit').textContent = '➕ Ajouter';
    this.resetForm();
    Haptic.trigger('success');
  },

  resetForm() {
    const ids = ['form-recipient','form-phone','form-address','form-city','form-postcode','form-items','form-notes','form-scheduled'];
    ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    const p = document.getElementById('form-priority'); if (p) p.value = 'normal';
    this.editingId = null;
  }
};

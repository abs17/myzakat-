/* ============================================================
   DELIVERY TRACKER — Dashboard Page
   js/dashboard.js
   ============================================================ */

const Dashboard = {
  render() {
    const stats = App.getStats();
    const rate  = stats.total ? Math.round((stats.delivered / stats.total) * 100) : 0;

    const recentDeliveries = [...App.deliveries]
      .sort((a, b) => a.stop_order - b.stop_order)
      .filter(d => d.status !== 'delivered')
      .slice(0, 3);

    const container = document.getElementById('page-dashboard');
    if (!container) return;

    container.innerHTML = `
      <div class="app-header">
        <div class="logo">
          <div class="logo-icon">🚐</div>
          <div class="logo-text">Livr<span>AI</span>son</div>
        </div>
        <div class="header-actions">
          <button class="header-btn" onclick="Dashboard.refreshData()" title="Actualiser">↺</button>
          <button class="header-btn" onclick="App.exportJSON()" title="Exporter">⬇</button>
        </div>
      </div>

      <!-- Date & Driver Banner -->
      <div class="section" style="padding-bottom:0">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
          <div style="font-family:var(--font-mono);font-size:12px;color:var(--text-muted)">
            ${new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'2-digit', month:'long', year:'numeric' })}
          </div>
          ${App.settings.vehiclePlate ? `<div style="font-family:var(--font-mono);font-size:11px;color:var(--accent);background:var(--accent-dim);padding:2px 8px;border-radius:4px;border:1px solid var(--border-accent)">${App.settings.vehiclePlate}</div>` : ''}
        </div>
        <div style="font-family:var(--font-display);font-weight:800;font-size:24px;line-height:1.2;margin-bottom:4px">
          ${App.settings.driverName ? `Bonjour, ${App.settings.driverName.split(' ')[0]} 👋` : 'Tableau de bord 📊'}
        </div>
        <div style="font-size:13px;color:var(--text-secondary)">
          ${stats.in_transit > 0 ? `<span style="color:var(--blue)">● En livraison</span>` : stats.pending > 0 ? `<span style="color:var(--accent)">● Prêt à démarrer</span>` : `<span style="color:var(--green)">● Tournée terminée</span>`}
          &nbsp;·&nbsp; ${stats.total} livraisons aujourd'hui
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="section">
        <div class="stats-grid">
          <div class="stat-card" data-icon="📦">
            <div class="stat-value" style="color:var(--text-primary)">${stats.total}</div>
            <div class="stat-label">Total</div>
          </div>
          <div class="stat-card" data-icon="✅">
            <div class="stat-value" style="color:var(--green)">${stats.delivered}</div>
            <div class="stat-label">Livrés</div>
            <div class="progress-bar"><div class="progress-fill green" style="width:${rate}%"></div></div>
            <div class="stat-delta up" style="margin-top:4px">${rate}% taux de réussite</div>
          </div>
          <div class="stat-card" data-icon="🚐">
            <div class="stat-value" style="color:var(--blue)">${stats.in_transit}</div>
            <div class="stat-label">En route</div>
          </div>
          <div class="stat-card" data-icon="⏳">
            <div class="stat-value" style="color:var(--accent)">${stats.pending}</div>
            <div class="stat-label">En attente</div>
            ${stats.failed > 0 ? `<div class="stat-delta down">${stats.failed} échoué${stats.failed > 1 ? 's' : ''}</div>` : ''}
          </div>
        </div>
      </div>

      <!-- Depot Info -->
      <div class="section" style="padding-top:0">
        <div class="section-title">Point de départ</div>
        <div class="route-origin" style="cursor:pointer" onclick="App.navigate('roadmap')">
          <div class="origin-icon">🕌</div>
          <div>
            <div class="origin-label">${App.settings.depotName}</div>
            <div class="origin-address">${App.settings.depotAddress}, ${App.settings.depotPostcode} ${App.settings.depotCity}</div>
          </div>
          <div style="margin-left:auto;color:var(--text-muted);font-size:16px">→</div>
        </div>
      </div>

      <!-- Next Stops -->
      ${recentDeliveries.length > 0 ? `
      <div class="section" style="padding-top:0">
        <div class="section-title">
          Prochains arrêts
          <span class="count">${recentDeliveries.length}</span>
        </div>
        ${recentDeliveries.map(d => this.renderMiniCard(d)).join('')}
        ${stats.pending + stats.in_transit > 3 ? `
          <div style="text-align:center;margin-top:8px">
            <button class="btn btn-ghost" onclick="App.navigate('deliveries')" style="font-size:13px">
              Voir toutes les livraisons →
            </button>
          </div>
        ` : ''}
      </div>
      ` : `
      <div class="empty-state">
        <div class="empty-icon">🎉</div>
        <h3>Tournée complète!</h3>
        <p>Toutes les livraisons ont été traitées.</p>
      </div>
      `}

      <!-- Quick Actions -->
      <div class="section" style="padding-top:0">
        <div class="section-title">Actions rapides</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <button class="card" style="text-align:center;cursor:pointer;border:none;background:var(--bg-card)" onclick="Modal.open('modal-add-delivery')">
            <div style="font-size:24px;margin-bottom:6px">➕</div>
            <div style="font-size:13px;font-weight:600">Nouvelle livraison</div>
          </button>
          <button class="card" style="text-align:center;cursor:pointer;border:none;background:var(--bg-card)" onclick="App.navigate('roadmap')">
            <div style="font-size:24px;margin-bottom:6px">🗺️</div>
            <div style="font-size:13px;font-weight:600">Voir l'itinéraire</div>
          </button>
          <button class="card" style="text-align:center;cursor:pointer;border:none;background:var(--bg-card)" onclick="App.exportJSON()">
            <div style="font-size:24px;margin-bottom:6px">📤</div>
            <div style="font-size:13px;font-weight:600">Exporter données</div>
          </button>
          <button class="card" style="text-align:center;cursor:pointer;border:none;background:var(--bg-card)" onclick="App.navigate('settings')">
            <div style="font-size:24px;margin-bottom:6px">⚙️</div>
            <div style="font-size:13px;font-weight:600">Paramètres</div>
          </button>
        </div>
      </div>
    `;
  },

  renderMiniCard(d) {
    return `
      <div class="delivery-card status-${d.status}" onclick="DeliveryList.openDetail('${d.id}')">
        <div class="delivery-card-header">
          <div>
            <div class="delivery-id">${d.id} · Arrêt #${d.stop_order}</div>
            <div class="delivery-title">${d.recipient}</div>
            <div class="delivery-address">
              <span class="icon">📍</span>
              <span>${d.address}, ${d.city}</span>
            </div>
          </div>
          <div style="text-align:right;flex-shrink:0;margin-left:10px">
            <span class="meta-chip chip-${d.status}">${Utils.statusLabel(d.status)}</span>
            ${d.scheduled ? `<div style="font-size:11px;font-family:var(--font-mono);color:var(--text-muted);margin-top:4px">${Utils.formatTime(d.scheduled)}</div>` : ''}
          </div>
        </div>
        <div style="display:flex;gap:8px">
          ${d.status === 'pending' ? `
            <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();App.markInTransit('${d.id}')">🚐 Démarrer</button>
          ` : ''}
          ${d.status === 'in_transit' ? `
            <button class="btn btn-success btn-sm" onclick="event.stopPropagation();DeliveryList.confirmDelivered('${d.id}')">✓ Livré</button>
            <button class="btn btn-danger btn-sm" onclick="event.stopPropagation();DeliveryList.confirmFailed('${d.id}')">✕ Échoué</button>
          ` : ''}
          <a class="btn btn-ghost btn-sm" href="${Utils.getNavUrl(d)}" target="_blank" onclick="event.stopPropagation()">🗺️ Naviguer</a>
        </div>
      </div>
    `;
  },

  refreshData() {
    Haptic.trigger('light');
    Toast.show('Données actualisées', 'info', 1500);
    App.applyFilter();
    App.render();
  }
};

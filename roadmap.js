/* ============================================================
   DELIVERY TRACKER — Roadmap Page
   js/roadmap.js
   ============================================================ */

const Roadmap = {
  render() {
    const container = document.getElementById('page-roadmap');
    if (!container) return;

    const stops = [...App.deliveries].sort((a, b) => a.stop_order - b.stop_order);
    const stats = App.getStats();
    const done  = stats.delivered;
    const total = stats.total;

    const depotFull = `${App.settings.depotAddress}, ${App.settings.depotPostcode} ${App.settings.depotCity}`;
    const depotMapsUrl = `https://maps.google.com/maps?q=${encodeURIComponent(depotFull)}`;
    const fullRouteUrl = this.buildRouteUrl(stops);

    // Estimated remaining
    const remaining = stops.filter(d => d.status === 'pending' || d.status === 'in_transit').length;
    const estMin    = remaining * 12; // rough 12 min per stop
    const estKm     = remaining * 3;

    container.innerHTML = `
      <div class="app-header">
        <div class="logo">
          <div class="logo-icon">🗺️</div>
          <div class="logo-text">Itinéraire</div>
        </div>
        <div class="header-actions">
          <a class="header-btn" href="${fullRouteUrl}" target="_blank" title="Ouvrir dans Google Maps">🗺</a>
        </div>
      </div>

      <div class="section">
        <!-- Depot Origin -->
        <div class="route-header">
          <div class="route-origin" onclick="window.open('${depotMapsUrl}','_blank')">
            <div class="origin-icon">🕌</div>
            <div>
              <div class="origin-label">${App.settings.depotName} — Départ</div>
              <div class="origin-address">${depotFull}</div>
            </div>
            <div style="margin-left:auto;color:var(--text-muted)">↗</div>
          </div>

          <div class="route-stats">
            <div class="route-stat">
              <div class="rs-val">${total}</div>
              <div class="rs-lbl">Arrêts</div>
            </div>
            <div class="route-stat">
              <div class="rs-val">${done}</div>
              <div class="rs-lbl">Livrés</div>
            </div>
            <div class="route-stat">
              <div class="rs-val">${remaining}</div>
              <div class="rs-lbl">Restants</div>
            </div>
            <div class="route-stat">
              <div class="rs-val">~${estMin}min</div>
              <div class="rs-lbl">Durée est.</div>
            </div>
          </div>

          <!-- Progress -->
          <div style="margin-top:12px">
            <div style="display:flex;justify-content:space-between;font-size:11px;font-family:var(--font-mono);color:var(--text-muted);margin-bottom:4px">
              <span>Progression</span>
              <span style="color:var(--accent)">${total ? Math.round((done/total)*100) : 0}%</span>
            </div>
            <div class="progress-bar" style="height:6px">
              <div class="progress-fill green" style="width:${total ? (done/total)*100 : 0}%"></div>
            </div>
          </div>
        </div>

        <!-- Open Full Route Button -->
        <a href="${fullRouteUrl}" target="_blank" class="btn btn-primary" style="width:100%;justify-content:center;margin-bottom:16px;text-decoration:none;display:flex">
          🗺️ Ouvrir la tournée complète dans Google Maps
        </a>

        <!-- Stop Timeline -->
        <div class="section-title" style="margin-bottom:16px">
          Arrêts de la tournée
          <span class="count">${total}</span>
        </div>

        <div class="stop-list">
          <!-- Origin node -->
          <div class="stop-item">
            <div class="stop-line">
              <div class="stop-dot done">🕌</div>
              <div class="stop-connector done"></div>
            </div>
            <div class="stop-content">
              <div class="stop-name">Départ — ${App.settings.depotName}</div>
              <div class="stop-addr">${depotFull}</div>
            </div>
          </div>

          ${stops.map((d, idx) => this.renderStop(d, idx, stops)).join('')}

          <!-- Return node -->
          <div class="stop-item">
            <div class="stop-line">
              <div class="stop-dot ${done === total ? 'done' : 'upcoming'}" style="font-size:16px">🏁</div>
            </div>
            <div class="stop-content">
              <div class="stop-name">Retour au dépôt</div>
              <div class="stop-addr">${depotFull}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderStop(d, idx, stops) {
    const dotClass = d.status === 'delivered' ? 'done'
                   : d.status === 'in_transit' ? 'current'
                   : d.status === 'failed'     ? 'failed'
                   : 'upcoming';

    const isLast = idx === stops.length - 1;
    const connectorClass = d.status === 'delivered' ? 'done' : '';

    const navUrl = Utils.getNavUrl(d);

    return `
      <div class="stop-item" id="stop-${d.id}">
        <div class="stop-line">
          <div class="stop-dot ${dotClass}">${d.status === 'delivered' ? '✓' : d.status === 'failed' ? '✕' : d.stop_order}</div>
          ${!isLast ? `<div class="stop-connector ${connectorClass}"></div>` : ''}
        </div>
        <div class="stop-content">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
            <div style="flex:1">
              <div class="stop-name">${d.recipient}</div>
              <div class="stop-addr">${d.address}, ${d.postcode} ${d.city}</div>
              ${d.items ? `<div style="font-size:11px;color:var(--text-muted);margin-top:2px">📋 ${d.items}</div>` : ''}
              ${d.notes ? `<div style="font-size:11px;color:var(--text-muted);font-style:italic;margin-top:2px">💬 ${d.notes}</div>` : ''}
            </div>
            <div style="text-align:right;flex-shrink:0">
              <span class="meta-chip chip-${d.status}">${Utils.statusLabel(d.status)}</span>
              ${d.scheduled ? `<div class="stop-eta" style="margin-top:4px">🕐 ${Utils.formatTime(d.scheduled)}</div>` : ''}
              ${d.delivered_at ? `<div style="font-size:11px;font-family:var(--font-mono);color:var(--green);margin-top:2px">✓ ${Utils.formatTime(d.delivered_at)}</div>` : ''}
            </div>
          </div>

          <!-- Actions -->
          <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
            <a href="${navUrl}" target="_blank" class="btn btn-ghost btn-sm">🗺️ GPS</a>
            ${d.phone ? `<a href="tel:${d.phone}" class="btn btn-ghost btn-sm">📞 Appeler</a>` : ''}
            ${d.status === 'pending' ? `
              <button class="btn btn-ghost btn-sm" onclick="App.markInTransit('${d.id}')">🚐 Démarrer</button>
            ` : ''}
            ${d.status === 'in_transit' ? `
              <button class="btn btn-success btn-sm" onclick="DeliveryList.confirmDelivered('${d.id}')">✓ Livré</button>
              <button class="btn btn-danger btn-sm" onclick="DeliveryList.confirmFailed('${d.id}')">✕ Échoué</button>
            ` : ''}
            ${d.status === 'failed' ? `
              <button class="btn btn-ghost btn-sm" onclick="App.markInTransit('${d.id}')">↺ Retenter</button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  },

  // Build a multi-stop Google Maps directions URL
  buildRouteUrl(stops) {
    const depot = encodeURIComponent(`${App.settings.depotAddress}, ${App.settings.depotPostcode} ${App.settings.depotCity}`);

    // Only include non-delivered stops for active route, max 10 waypoints (Google limit)
    const active = stops.filter(d => d.status !== 'delivered').slice(0, 10);

    if (!active.length) {
      return `https://www.google.com/maps/dir/?api=1&origin=${depot}&destination=${depot}&travelmode=driving`;
    }

    const waypoints = active.slice(0, -1).map(d =>
      encodeURIComponent(`${d.address}, ${d.postcode} ${d.city}`)
    ).join('|');

    const last = active[active.length - 1];
    const destination = encodeURIComponent(`${last.address}, ${last.postcode} ${last.city}`);

    let url = `https://www.google.com/maps/dir/?api=1&origin=${depot}&destination=${destination}&travelmode=driving`;
    if (waypoints) url += `&waypoints=${waypoints}`;

    return url;
  }
};

/* ============================================================
   DELIVERY TRACKER — Settings Page
   js/settings.js
   ============================================================ */

const Settings = {
  render() {
    const container = document.getElementById('page-settings');
    if (!container) return;

    const s = App.settings;

    container.innerHTML = `
      <div class="app-header">
        <div class="logo">
          <div class="logo-icon">⚙️</div>
          <div class="logo-text">Paramètres</div>
        </div>
      </div>

      <div class="section">

        <!-- Depot Config -->
        <div class="section-title">📍 Point de départ</div>
        <div class="settings-group">
          <div class="settings-item" onclick="Settings.editDepot()">
            <div class="si-left">
              <span class="si-icon">🕌</span>
              <div>
                <div class="si-title">${s.depotName || 'Configurer le dépôt'}</div>
                <div class="si-sub">${s.depotAddress}, ${s.depotPostcode} ${s.depotCity}</div>
              </div>
            </div>
            <div class="si-right">Modifier →</div>
          </div>
        </div>

        <!-- Driver Info -->
        <div class="section-title">👤 Chauffeur</div>
        <div class="settings-group">
          <div class="settings-item" onclick="Settings.editDriver()">
            <div class="si-left">
              <span class="si-icon">🚐</span>
              <div>
                <div class="si-title">${s.driverName || 'Nom du chauffeur'}</div>
                <div class="si-sub">Véhicule: ${s.vehiclePlate || 'Non renseigné'}</div>
              </div>
            </div>
            <div class="si-right">Modifier →</div>
          </div>
        </div>

        <!-- Preferences -->
        <div class="section-title">⚙️ Préférences</div>
        <div class="settings-group">
          <div class="settings-item">
            <div class="si-left">
              <span class="si-icon">📳</span>
              <div>
                <div class="si-title">Vibration (haptic)</div>
                <div class="si-sub">Retour tactile à la confirmation de livraison</div>
              </div>
            </div>
            <div class="toggle ${s.hapticEnabled ? 'on' : ''}" id="toggle-haptic"
              onclick="Settings.toggleSetting('hapticEnabled', 'toggle-haptic')"></div>
          </div>
        </div>

        <!-- Data Management -->
        <div class="section-title">💾 Données</div>
        <div class="settings-group">
          <div class="settings-item" onclick="App.exportJSON()">
            <div class="si-left">
              <span class="si-icon">📤</span>
              <div>
                <div class="si-title">Exporter (JSON)</div>
                <div class="si-sub">Télécharger toutes les livraisons</div>
              </div>
            </div>
            <div class="si-right">→</div>
          </div>
          <div class="settings-item" onclick="document.getElementById('import-file').click()">
            <div class="si-left">
              <span class="si-icon">📥</span>
              <div>
                <div class="si-title">Importer (JSON)</div>
                <div class="si-sub">Charger un fichier de livraisons</div>
              </div>
            </div>
            <div class="si-right">→</div>
          </div>
          <input type="file" id="import-file" accept=".json" style="display:none" onchange="Settings.handleImport(this)">
          <div class="settings-item" onclick="Settings.confirmReset()">
            <div class="si-left">
              <span class="si-icon">🔄</span>
              <div>
                <div class="si-title">Réinitialiser (données démo)</div>
                <div class="si-sub">Recharge les données de démonstration</div>
              </div>
            </div>
            <div class="si-right" style="color:var(--red)">Reset</div>
          </div>
        </div>

        <!-- About -->
        <div class="section-title">ℹ️ À propos</div>
        <div class="settings-group">
          <div class="settings-item">
            <div class="si-left">
              <span class="si-icon">🚐</span>
              <div>
                <div class="si-title">LivrAIson</div>
                <div class="si-sub">v1.0 — Gestionnaire de tournées de livraison</div>
              </div>
            </div>
          </div>
          <div class="settings-item">
            <div class="si-left">
              <span class="si-icon">📦</span>
              <div>
                <div class="si-title">Livraisons en base</div>
                <div class="si-sub">${App.deliveries.length} livraison${App.deliveries.length !== 1 ? 's' : ''} enregistrée${App.deliveries.length !== 1 ? 's' : ''}</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    `;
  },

  toggleSetting(key, toggleId) {
    App.settings[key] = !App.settings[key];
    const el = document.getElementById(toggleId);
    if (el) el.classList.toggle('on', App.settings[key]);
    App.save();
    if (key === 'hapticEnabled' && App.settings[key]) Haptic.trigger('medium');
  },

  editDepot() {
    const s = App.settings;
    const overlay = document.getElementById('modal-confirm');
    overlay.querySelector('.modal').innerHTML = `
      <div class="modal-handle"></div>
      <div class="modal-title">📍 Point de départ</div>
      <div class="modal-subtitle">Configurer l'adresse de départ de votre tournée</div>

      <div class="form-group">
        <label class="form-label">Nom du lieu</label>
        <input class="form-input" id="depot-name" value="${s.depotName}" placeholder="ex: Mosquée Assalam">
      </div>
      <div class="form-group">
        <label class="form-label">Adresse *</label>
        <input class="form-input" id="depot-address" value="${s.depotAddress}" placeholder="138 Avenue de la Liberté">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Code postal</label>
          <input class="form-input" id="depot-postcode" value="${s.depotPostcode}" placeholder="94700">
        </div>
        <div class="form-group">
          <label class="form-label">Ville *</label>
          <input class="form-input" id="depot-city" value="${s.depotCity}" placeholder="Maisons-Alfort">
        </div>
      </div>

      <div class="confirm-actions">
        <button class="btn btn-ghost" onclick="Modal.close('modal-confirm')">Annuler</button>
        <button class="btn btn-primary" onclick="Settings.saveDepot()">💾 Enregistrer</button>
      </div>
    `;
    Modal.open('modal-confirm');
  },

  saveDepot() {
    const get = (id) => document.getElementById(id)?.value.trim() || '';
    App.settings.depotName     = get('depot-name');
    App.settings.depotAddress  = get('depot-address');
    App.settings.depotPostcode = get('depot-postcode');
    App.settings.depotCity     = get('depot-city');
    App.save();
    Modal.close('modal-confirm');
    this.render();
    Toast.show('Point de départ mis à jour', 'success');
  },

  editDriver() {
    const s = App.settings;
    const overlay = document.getElementById('modal-confirm');
    overlay.querySelector('.modal').innerHTML = `
      <div class="modal-handle"></div>
      <div class="modal-title">👤 Informations chauffeur</div>
      <div class="modal-subtitle">Optionnel — affiché sur le tableau de bord</div>

      <div class="form-group">
        <label class="form-label">Nom du chauffeur</label>
        <input class="form-input" id="driver-name" value="${s.driverName}" placeholder="Omar B.">
      </div>
      <div class="form-group">
        <label class="form-label">Immatriculation</label>
        <input class="form-input" id="driver-plate" value="${s.vehiclePlate}" placeholder="DF-741-GK">
      </div>

      <div class="confirm-actions">
        <button class="btn btn-ghost" onclick="Modal.close('modal-confirm')">Annuler</button>
        <button class="btn btn-primary" onclick="Settings.saveDriver()">💾 Enregistrer</button>
      </div>
    `;
    Modal.open('modal-confirm');
  },

  saveDriver() {
    const get = (id) => document.getElementById(id)?.value.trim() || '';
    App.settings.driverName   = get('driver-name');
    App.settings.vehiclePlate = get('driver-plate');
    App.save();
    Modal.close('modal-confirm');
    this.render();
    Toast.show('Informations chauffeur enregistrées', 'success');
  },

  handleImport(input) {
    if (input.files && input.files[0]) {
      App.importJSON(input.files[0]);
    }
  },

  confirmReset() {
    const overlay = document.getElementById('modal-confirm');
    overlay.querySelector('.modal').innerHTML = `
      <div class="modal-handle"></div>
      <div class="modal-title" style="color:var(--red)">⚠️ Réinitialiser</div>
      <div class="modal-subtitle">
        Toutes les livraisons actuelles seront <strong>supprimées</strong> et remplacées par les données de démonstration.
      </div>
      <div class="confirm-actions">
        <button class="btn btn-ghost" onclick="Modal.close('modal-confirm')">Annuler</button>
        <button class="btn btn-danger" onclick="App.resetToDemo();Modal.close('modal-confirm')">
          Réinitialiser
        </button>
      </div>
    `;
    Modal.open('modal-confirm');
    Haptic.trigger('heavy');
  }
};

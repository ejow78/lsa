export const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>LATAM SimRacing Alliance — Portal & Live Timing</title>
  <style>
    :root {
      --bg-main: #0b0e14;
      --bg-card: #131822;
      --bg-card-alt: #1a2130;
      --border: #263044;
      --text-main: #f0f4f8;
      --text-muted: #94a3b8;
      --accent: #00f5d4;
      --accent-blue: #3a86ff;
      --accent-red: #ef4444;
      --accent-amber: #f59e0b;
      --accent-green: #10b981;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      background: var(--bg-main);
      color: var(--text-main);
      line-height: 1.5;
      min-height: 100vh;
    }
    header {
      background: rgba(19, 24, 34, 0.95);
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 100;
      backdrop-filter: blur(10px);
    }
    .nav-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0.9rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-weight: 800;
      font-size: 1.2rem;
      letter-spacing: 0.5px;
      color: #fff;
    }
    .brand-badge {
      background: linear-gradient(135deg, var(--accent), var(--accent-blue));
      color: #050811;
      padding: 0.2rem 0.55rem;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 900;
    }
    .nav-tabs {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .tab-btn {
      background: transparent;
      color: var(--text-muted);
      border: 1px solid transparent;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.92rem;
    }
    .tab-btn:hover {
      color: #fff;
      background: var(--bg-card-alt);
    }
    .tab-btn.active {
      color: #050811;
      background: var(--accent);
      border-color: var(--accent);
    }
    main {
      max-width: 1400px;
      margin: 0 auto;
      padding: 1.5rem;
    }
    .section { display: none; }
    .section.active { display: block; }

    /* Cards & Layout */
    .grid-2 {
      display: grid;
      grid-template-columns: 1.1fr 1.4fr;
      gap: 1.5rem;
    }
    @media (max-width: 1024px) {
      .grid-2 { grid-template-columns: 1fr; }
    }
    .card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.25rem;
      margin-bottom: 1.5rem;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border);
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .card-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: #fff;
    }
    .status-bar {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 0.85rem;
      margin-bottom: 1.5rem;
    }
    .stat-box {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 0.9rem 1.1rem;
    }
    .stat-label {
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: var(--text-muted);
      margin-bottom: 0.25rem;
    }
    .stat-value {
      font-size: 1.15rem;
      font-weight: 700;
      color: #fff;
    }
    .badge {
      display: inline-block;
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
      font-size: 0.78rem;
      font-weight: 700;
    }
    .badge-green { background: rgba(16, 185, 129, 0.18); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); }
    .badge-amber { background: rgba(245, 158, 11, 0.18); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); }
    .badge-blue { background: rgba(58, 134, 255, 0.18); color: #60a5fa; border: 1px solid rgba(58, 134, 255, 0.4); }
    .badge-red { background: rgba(239, 68, 68, 0.18); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); }

    /* Live Map Container */
    .map-wrapper {
      position: relative;
      background: radial-gradient(circle at center, #161f30 0%, #0d111a 100%);
      border-radius: 10px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 460px;
      border: 1px solid var(--border);
      padding: 1rem;
    }
    .map-stage {
      position: relative;
      display: inline-block;
      max-width: 100%;
    }
    .map-stage img {
      display: block;
      max-width: 100%;
      max-height: 520px;
      width: auto;
      height: auto;
      filter: drop-shadow(0 0 8px rgba(0, 245, 212, 0.2));
    }
    .car-dot {
      position: absolute;
      transform: translate(-50%, -50%);
      transition: left 780ms linear, top 780ms linear;
      z-index: 10;
      display: flex;
      align-items: center;
      gap: 4px;
      pointer-events: none;
    }
    .car-dot-circle {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 2px solid #fff;
      box-shadow: 0 0 10px rgba(0,0,0,0.8);
    }
    .car-dot-label {
      background: rgba(11, 14, 20, 0.88);
      color: #fff;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 4px;
      border: 1px solid rgba(255,255,255,0.2);
      white-space: nowrap;
    }

    /* Tables */
    .table-responsive {
      width: 100%;
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.92rem;
    }
    th, td {
      padding: 0.75rem 0.9rem;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }
    th {
      color: var(--text-muted);
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: rgba(26, 33, 48, 0.6);
    }
    tr:hover td {
      background: rgba(255, 255, 255, 0.02);
    }
    .pos-cell {
      font-weight: 800;
      color: var(--accent);
      width: 50px;
    }
    .points-cell {
      font-weight: 800;
      font-size: 1rem;
      color: #fff;
    }

    /* Buttons & Forms */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.55rem 1.1rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9rem;
      border: 1px solid transparent;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s;
    }
    .btn-primary {
      background: var(--accent);
      color: #050811;
    }
    .btn-primary:hover { opacity: 0.9; }
    .btn-secondary {
      background: var(--bg-card-alt);
      color: #fff;
      border-color: var(--border);
    }
    .btn-secondary:hover { border-color: var(--text-muted); }
    .btn-danger {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border-color: rgba(239, 68, 68, 0.4);
    }
    input, select {
      background: var(--bg-main);
      color: #fff;
      border: 1px solid var(--border);
      padding: 0.55rem 0.8rem;
      border-radius: 6px;
      font-size: 0.9rem;
      width: 100%;
    }
    input:focus, select:focus {
      outline: none;
      border-color: var(--accent);
    }
    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 0.8rem;
      margin-bottom: 1rem;
    }
    .toast {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: var(--bg-card-alt);
      border: 1px solid var(--accent);
      color: #fff;
      padding: 0.85rem 1.25rem;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      display: none;
      z-index: 999;
    }
  </style>
</head>
<body>
  <header>
    <div class="nav-container">
      <div class="brand">
        <span class="brand-badge">LSA</span>
        <span>LATAM SimRacing Alliance</span>
      </div>
      <div class="nav-tabs">
        <button class="tab-btn active" onclick="switchTab('live')">Live Timing & Mapa</button>
        <button class="tab-btn" onclick="switchTab('ac')">Assetto Corsa</button>
        <button class="tab-btn" onclick="switchTab('acc')">Assetto Corsa Competizione</button>
        <button class="tab-btn" onclick="switchTab('admin')">Panel Admin</button>
      </div>
    </div>
  </header>

  <main>
    <!-- SECCIÓN 1: LIVE TIMING & MAPA -->
    <section id="tab-live" class="section active">
      <div class="status-bar">
        <div class="stat-box">
          <div class="stat-label">Servidor</div>
          <div class="stat-value" id="live-server-name">Cargando...</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Circuito</div>
          <div class="stat-value" id="live-track-name">-</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Sesión Actual</div>
          <div class="stat-value"><span class="badge badge-green" id="live-session-type">-</span></div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Clima / Pista</div>
          <div class="stat-value" id="live-temps">-</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Contraseña / Acceso</div>
          <div style="display:flex; align-items:center; justify-content:space-between; gap:0.5rem;">
            <code id="live-password" style="color:var(--accent); font-weight:700;">-</code>
            <a id="live-join-btn" href="#" target="_blank" class="btn btn-primary" style="padding:0.3rem 0.7rem; font-size:0.8rem;">Entrar a Pista</a>
          </div>
        </div>
      </div>

      <div class="grid-2">
        <!-- MAPA EN VIVO -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">Mapa de Pista en Tiempo Real</span>
            <span class="badge badge-blue" id="live-ws-badge">Conectando telemetría...</span>
          </div>
          <div class="map-wrapper">
            <div class="map-stage" id="map-stage">
              <img id="track-map-img" src="" alt="Mapa del Circuito" onload="renderMapDots()" />
              <div id="map-dots-layer"></div>
            </div>
          </div>
        </div>

        <!-- TABLA DE TIEMPOS EN VIVO -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">Pilotos Conectados en Sesión</span>
            <span id="live-drivers-count" class="badge badge-green">0 en pista</span>
          </div>
          <div class="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Posición</th>
                  <th>Piloto</th>
                  <th>Auto</th>
                  <th>Estado</th>
                  <th>Velocidad</th>
                  <th>Vueltas</th>
                  <th>Mejor Vuelta</th>
                  <th>Última Vuelta</th>
                </tr>
              </thead>
              <tbody id="live-drivers-tbody">
                <tr><td colspan="8" style="color:var(--text-muted); text-align:center;">No hay pilotos conectados en este momento.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>

    <!-- SECCIÓN 2: ASSETTO CORSA -->
    <section id="tab-ac" class="section">
      <div id="ac-custom-tables-container"></div>

      <div class="grid-2">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Ranking de Hotlaps — Circuito Actual</span>
          </div>
          <div class="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Posición</th>
                  <th>Piloto</th>
                  <th>Auto</th>
                  <th>Mejor Vuelta</th>
                  <th>Diferencia</th>
                  <th>Vueltas</th>
                </tr>
              </thead>
              <tbody id="ac-hotlaps-tbody">
                <tr><td colspan="6">Cargando tiempos...</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <span class="card-title">Campeonatos en Emperor Server</span>
          </div>
          <div id="ac-emperor-championships">Cargando campeonatos...</div>
        </div>
      </div>
    </section>

    <!-- SECCIÓN 3: ASSETTO CORSA COMPETIZIONE -->
    <section id="tab-acc" class="section">
      <div id="acc-custom-tables-container"></div>
    </section>

    <!-- SECCIÓN 4: PANEL DE ADMINISTRACIÓN -->
    <section id="tab-admin" class="section">
      <div class="card">
        <div class="card-header">
          <span class="card-title">Editor de Tablas de Campeonatos (AC & ACC) + Sincronización con Discord</span>
          <div style="display:flex; gap:0.5rem;">
            <button class="btn btn-secondary" onclick="createNewTable('ac')">+ Nueva Tabla AC</button>
            <button class="btn btn-secondary" onclick="createNewTable('acc')">+ Nueva Tabla ACC</button>
          </div>
        </div>

        <div class="form-row">
          <div>
            <label class="stat-label">Seleccionar Tabla para Editar</label>
            <select id="admin-table-select" onchange="onSelectAdminTable()"></select>
          </div>
          <div>
            <label class="stat-label">Simulador</label>
            <select id="admin-table-sim">
              <option value="ac">Assetto Corsa (AC)</option>
              <option value="acc">Assetto Corsa Competizione (ACC)</option>
            </select>
          </div>
          <div>
            <label class="stat-label">Título de la Tabla</label>
            <input type="text" id="admin-table-title" placeholder="Ej: Campeonato GT3 2026" />
          </div>
          <div>
            <label class="stat-label">Subtítulo / Torneo</label>
            <input type="text" id="admin-table-subtitle" placeholder="Ej: Temporada Apertura" />
          </div>
          <div>
            <label class="stat-label">Contraseña de Admin</label>
            <input type="password" id="admin-password" placeholder="Contraseña del servidor/admin" />
          </div>
        </div>

        <div class="table-responsive" style="margin-bottom: 1rem;">
          <table>
            <thead>
              <tr>
                <th>Piloto</th>
                <th>País (ARG, CHL, etc.)</th>
                <th>Equipo</th>
                <th>Auto</th>
                <th>Victorias</th>
                <th>Podios</th>
                <th>Puntos</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody id="admin-rows-tbody"></tbody>
          </table>
        </div>

        <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:0.75rem;">
          <button class="btn btn-secondary" onclick="addAdminRow()">+ Agregar Piloto a la Tabla</button>
          <div style="display:flex; gap:0.75rem; flex-wrap:wrap;">
            <button class="btn btn-danger" onclick="deleteCurrentTable()">Eliminar Tabla</button>
            <button class="btn btn-secondary" onclick="publishCurrentTableToDiscord()">Publicar Tabla en Discord</button>
            <button class="btn btn-primary" onclick="saveCurrentTable()">Guardar Cambios</button>
          </div>
        </div>
      </div>
    </section>
  </main>

  <div id="toast" class="toast"></div>

  <script>
    let currentLiveState = null;
    let allTables = [];
    let editingTable = null;

    function showToast(msg) {
      const el = document.getElementById('toast');
      el.textContent = msg;
      el.style.display = 'block';
      setTimeout(() => { el.style.display = 'none'; }, 3500);
    }

    function switchTab(tab) {
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.getElementById('tab-' + tab).classList.add('active');
      const btns = document.querySelectorAll('.tab-btn');
      const mapIdx = { live: 0, ac: 1, acc: 2, admin: 3 };
      if (btns[mapIdx[tab]]) btns[mapIdx[tab]].classList.add('active');
    }

    async function fetchLiveState() {
      try {
        const res = await fetch('/api/live');
        const data = await res.json();
        currentLiveState = data;

        document.getElementById('live-server-name').textContent = data.serverName;
        document.getElementById('live-track-name').textContent = data.trackTitle;
        document.getElementById('live-session-type').textContent = data.sessionType;
        document.getElementById('live-temps').textContent = data.ambientTemp + '°C Ambiente / ' + data.roadTemp + '°C Pista';
        document.getElementById('live-password').textContent = data.password || 'Libre';
        document.getElementById('live-join-btn').href = data.joinUrl;

        const wsBadge = document.getElementById('live-ws-badge');
        wsBadge.textContent = data.connectedToWs ? 'Telemetría en Vivo Activa' : 'Sincronizando...';
        wsBadge.className = 'badge ' + (data.connectedToWs ? 'badge-green' : 'badge-amber');

        const mapImg = document.getElementById('track-map-img');
        if (mapImg.getAttribute('src') !== data.mapImageUrl) {
          mapImg.setAttribute('src', data.mapImageUrl);
        }

        renderMapDots();
        renderLiveDriversTable(data.drivers);
      } catch (e) {
        console.error(e);
      }
    }

    function renderMapDots() {
      if (!currentLiveState) return;
      const mapImg = document.getElementById('track-map-img');
      const layer = document.getElementById('map-dots-layer');
      const natW = currentLiveState.mapData.width || mapImg.naturalWidth || 1680;
      const natH = currentLiveState.mapData.height || mapImg.naturalHeight || 2606;
      const dispW = mapImg.clientWidth;
      const dispH = mapImg.clientHeight;
      if (!dispW || !dispH) return;

      const scaleX = dispW / natW;
      const scaleY = dispH / natH;

      const activeGuids = new Set();
      currentLiveState.drivers.forEach(d => {
        activeGuids.add(d.guid);
        let dot = document.getElementById('dot-' + d.guid);
        if (!dot) {
          dot = document.createElement('div');
          dot.id = 'dot-' + d.guid;
          dot.className = 'car-dot';
          dot.innerHTML = '<div class="car-dot-circle"></div><div class="car-dot-label"></div>';
          layer.appendChild(dot);
        }
        dot.style.left = (d.mapPixelX * scaleX) + 'px';
        dot.style.top = (d.mapPixelY * scaleY) + 'px';
        dot.querySelector('.car-dot-circle').style.background = d.color;
        const numPrefix = d.raceNumber > 0 ? '#' + d.raceNumber + ' ' : '';
        dot.querySelector('.car-dot-label').textContent = numPrefix + d.initials + (d.isInPits ? ' [BOX]' : '');
      });

      Array.from(layer.children).forEach(child => {
        const g = child.id.replace('dot-', '');
        if (!activeGuids.has(g)) child.remove();
      });
    }

    function renderLiveDriversTable(drivers) {
      document.getElementById('live-drivers-count').textContent = drivers.length + (drivers.length === 1 ? ' piloto conectado' : ' pilotos conectados');
      const tbody = document.getElementById('live-drivers-tbody');
      if (!drivers || drivers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="color:var(--text-muted); text-align:center;">No hay pilotos conectados en este momento.</td></tr>';
        return;
      }
      tbody.innerHTML = drivers.map((d, i) => {
        const stateBadge = d.isInPits
          ? '<span class="badge badge-amber">En Box</span>'
          : '<span class="badge badge-green">En Pista</span>';
        const lapsWord = d.numLaps === 1 ? 'vuelta' : 'vueltas';
        return '<tr>' +
          '<td class="pos-cell">' + (i + 1) + '</td>' +
          '<td><strong>' + d.name + '</strong></td>' +
          '<td>' + d.carModel + ' <span style="color:var(--text-muted);">(' + d.tyres + ')</span></td>' +
          '<td>' + stateBadge + '</td>' +
          '<td>' + d.speedKmh + ' km/h</td>' +
          '<td>' + d.numLaps + ' ' + lapsWord + '</td>' +
          '<td><code>' + d.bestLapFormatted + '</code></td>' +
          '<td><code>' + d.lastLapFormatted + '</code></td>' +
        '</tr>';
      }).join('');
    }

    async function fetchOverviewAndTables() {
      try {
        const [tablesRes, acRes] = await Promise.all([
          fetch('/api/tables'),
          fetch('/api/ac/overview')
        ]);
        allTables = await tablesRes.json();
        const acData = await acRes.json();

        renderCustomTables('ac', 'ac-custom-tables-container');
        renderCustomTables('acc', 'acc-custom-tables-container');
        populateAdminSelect();

        // Hotlaps
        const hlBody = document.getElementById('ac-hotlaps-tbody');
        if (acData.hotlaps && acData.hotlaps.entries && acData.hotlaps.entries.length > 0) {
          hlBody.innerHTML = acData.hotlaps.entries.map(e => {
            const lapsWord = e.lapsCount === 1 ? 'vuelta' : 'vueltas';
            return '<tr>' +
              '<td class="pos-cell">' + e.rank + '</td>' +
              '<td><strong>' + e.driverName + '</strong></td>' +
              '<td>' + e.carModel + '</td>' +
              '<td><code>' + e.bestLapFormatted + '</code></td>' +
              '<td>' + e.gapFormatted + '</td>' +
              '<td>' + e.lapsCount + ' ' + lapsWord + '</td>' +
            '</tr>';
          }).join('');
        } else {
          hlBody.innerHTML = '<tr><td colspan="6">Sin vueltas registradas aún.</td></tr>';
        }

        // Campeonatos Emperor
        const chContainer = document.getElementById('ac-emperor-championships');
        if (acData.championships && acData.championships.length > 0) {
          chContainer.innerHTML = acData.championships.map(c => {
            const evList = c.events.map(ev => '<li>Fecha ' + ev.index + ': <strong>' + ev.trackName + '</strong> (' + (ev.completed ? 'Completada' : 'Pendiente') + ')</li>').join('');
            return '<div style="margin-bottom:1.25rem; padding-bottom:1rem; border-bottom:1px solid var(--border);">' +
              '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">' +
                '<strong style="font-size:1.05rem;">' + c.name + '</strong>' +
                '<a href="' + c.url + '" target="_blank" class="btn btn-secondary" style="padding:0.25rem 0.65rem; font-size:0.8rem;">Abrir en Emperor</a>' +
              '</div>' +
              '<div style="color:var(--text-muted); font-size:0.88rem; margin-bottom:0.5rem;">' + c.numEvents + ' fechas • ' + c.numEntrants + ' cupos</div>' +
              '<ul style="padding-left:1.2rem; font-size:0.88rem;">' + evList + '</ul>' +
            '</div>';
          }).join('');
        } else {
          chContainer.innerHTML = '<p style="color:var(--text-muted);">No hay campeonatos activos en Emperor.</p>';
        }
      } catch (e) {
        console.error(e);
      }
    }

    function renderCustomTables(sim, containerId) {
      const container = document.getElementById(containerId);
      const filtered = allTables.filter(t => t.sim === sim);
      if (filtered.length === 0) {
        container.innerHTML = '<div class="card"><p style="color:var(--text-muted);">No hay tablas creadas para esta sección todavía. Créalas desde el Panel Admin.</p></div>';
        return;
      }
      container.innerHTML = filtered.map(t => {
        const rowsHtml = t.rows.map(r => {
          const winsWord = r.wins === 1 ? 'victoria' : 'victorias';
          const podWord = r.podiums === 1 ? 'podio' : 'podios';
          return '<tr>' +
            '<td class="pos-cell">' + r.position + '</td>' +
            '<td><strong>' + r.driverName + '</strong> <span style="color:var(--text-muted); font-size:0.8rem;">[' + (r.nation || '-') + ']</span></td>' +
            '<td>' + (r.team || '-') + '</td>' +
            '<td>' + (r.carModel || '-') + '</td>' +
            '<td>' + r.wins + ' ' + winsWord + '</td>' +
            '<td>' + r.podiums + ' ' + podWord + '</td>' +
            '<td class="points-cell">' + r.points + ' puntos</td>' +
          '</tr>';
        }).join('');

        return '<div class="card">' +
          '<div class="card-header">' +
            '<div>' +
              '<div class="card-title">' + t.title + '</div>' +
              '<div style="color:var(--text-muted); font-size:0.85rem;">' + (t.subtitle || '') + '</div>' +
            '</div>' +
            '<span class="badge ' + (sim === 'acc' ? 'badge-red' : 'badge-blue') + '">' + (sim === 'acc' ? 'Assetto Corsa Competizione' : 'Assetto Corsa') + '</span>' +
          '</div>' +
          '<div class="table-responsive">' +
            '<table>' +
              '<thead><tr><th>Posición</th><th>Piloto</th><th>Equipo</th><th>Auto</th><th>Victorias</th><th>Podios</th><th>Puntos</th></tr></thead>' +
              '<tbody>' + (rowsHtml || '<tr><td colspan="7">Sin pilotos cargados.</td></tr>') + '</tbody>' +
            '</table>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    function populateAdminSelect() {
      const sel = document.getElementById('admin-table-select');
      const currentId = editingTable ? editingTable.id : (allTables[0] && allTables[0].id);
      sel.innerHTML = allTables.map(t => '<option value="' + t.id + '">' + '[' + t.sim.toUpperCase() + '] ' + t.title + '</option>').join('');
      if (currentId) sel.value = currentId;
      onSelectAdminTable();
    }

    function onSelectAdminTable() {
      const id = document.getElementById('admin-table-select').value;
      const found = allTables.find(t => t.id === id);
      if (found) {
        editingTable = JSON.parse(JSON.stringify(found));
        renderAdminEditor();
      }
    }

    function createNewTable(sim) {
      editingTable = {
        id: sim + '-' + Date.now().toString(36),
        sim: sim,
        title: 'Nuevo Campeonato ' + (sim === 'acc' ? 'ACC' : 'Assetto Corsa'),
        subtitle: 'Temporada 2026',
        rows: [
          { position: 1, driverName: 'Nuevo Piloto', nation: 'ARG', team: 'Equipo', carModel: 'GT3', wins: 0, podiums: 0, points: 25 }
        ]
      };
      renderAdminEditor();
      showToast('Nueva tabla preparada. Edítala y presiona Guardar Cambios.');
    }

    function renderAdminEditor() {
      if (!editingTable) return;
      document.getElementById('admin-table-sim').value = editingTable.sim;
      document.getElementById('admin-table-title').value = editingTable.title;
      document.getElementById('admin-table-subtitle').value = editingTable.subtitle || '';

      const tbody = document.getElementById('admin-rows-tbody');
      tbody.innerHTML = editingTable.rows.map((r, idx) => {
        return '<tr>' +
          '<td><input type="text" value="' + (r.driverName || '') + '" onchange="updateRow(' + idx + ', \\'driverName\\', this.value)" /></td>' +
          '<td><input type="text" value="' + (r.nation || '') + '" onchange="updateRow(' + idx + ', \\'nation\\', this.value)" /></td>' +
          '<td><input type="text" value="' + (r.team || '') + '" onchange="updateRow(' + idx + ', \\'team\\', this.value)" /></td>' +
          '<td><input type="text" value="' + (r.carModel || '') + '" onchange="updateRow(' + idx + ', \\'carModel\\', this.value)" /></td>' +
          '<td><input type="number" value="' + (r.wins || 0) + '" onchange="updateRow(' + idx + ', \\'wins\\', Number(this.value))" /></td>' +
          '<td><input type="number" value="' + (r.podiums || 0) + '" onchange="updateRow(' + idx + ', \\'podiums\\', Number(this.value))" /></td>' +
          '<td><input type="number" value="' + (r.points || 0) + '" onchange="updateRow(' + idx + ', \\'points\\', Number(this.value))" /></td>' +
          '<td><button class="btn btn-danger" onclick="removeAdminRow(' + idx + ')">Quitar</button></td>' +
        '</tr>';
      }).join('');
    }

    function updateRow(idx, field, val) {
      if (!editingTable || !editingTable.rows[idx]) return;
      editingTable.rows[idx][field] = val;
    }

    function addAdminRow() {
      if (!editingTable) return;
      editingTable.rows.push({
        position: editingTable.rows.length + 1,
        driverName: '',
        nation: 'ARG',
        team: '',
        carModel: '',
        wins: 0,
        podiums: 0,
        points: 0
      });
      renderAdminEditor();
    }

    function removeAdminRow(idx) {
      if (!editingTable) return;
      editingTable.rows.splice(idx, 1);
      renderAdminEditor();
    }

    async function saveCurrentTable() {
      if (!editingTable) return;
      const password = document.getElementById('admin-password').value;
      editingTable.sim = document.getElementById('admin-table-sim').value;
      editingTable.title = document.getElementById('admin-table-title').value;
      editingTable.subtitle = document.getElementById('admin-table-subtitle').value;

      const res = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify(editingTable)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Error: Verifica la contraseña de Admin');
        return;
      }

      showToast('Tabla guardada y ordenada por puntos correctamente.');
      await fetchOverviewAndTables();
    }

    async function deleteCurrentTable() {
      if (!editingTable) return;
      const password = document.getElementById('admin-password').value;
      const res = await fetch('/api/tables/' + encodeURIComponent(editingTable.id), {
        method: 'DELETE',
        headers: { 'x-admin-password': password }
      });

      if (!res.ok) {
        showToast('Error al eliminar: Verifica la contraseña de Admin');
        return;
      }

      editingTable = null;
      showToast('Tabla eliminada.');
      await fetchOverviewAndTables();
    }

    async function publishCurrentTableToDiscord() {
      if (!editingTable) return;
      const password = document.getElementById('admin-password').value;
      const res = await fetch('/api/tables/' + encodeURIComponent(editingTable.id) + '/publish-discord', {
        method: 'POST',
        headers: { 'x-admin-password': password }
      });

      if (!res.ok) {
        showToast('Error al publicar en Discord: Verifica la contraseña de Admin');
        return;
      }

      showToast('¡Tabla enviada en vivo a tu canal de Discord!');
    }

    window.addEventListener('resize', renderMapDots);
    fetchLiveState();
    fetchOverviewAndTables();
    setInterval(fetchLiveState, 1000);
  </script>
</body>
</html>`;

export const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="es" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>LATAM SimRacing Alliance — Live Timing & Telemetría</title>
  <link rel="icon" type="image/png" href="/logo.png" />
  <!-- Google Fonts: Chakra Petch (Display), Saira (Body), JetBrains Mono (Telemetry) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:ital,wght@0,500;0,600;0,700;1,600;1,700&family=JetBrains+Mono:wght@400;500;600;700&family=Saira:wght@400;500;600;700&display=swap" rel="stylesheet">
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            display: ['"Chakra Petch"', 'Arial Narrow', 'sans-serif'],
            sans: ['Saira', 'Segoe UI', 'Roboto', 'sans-serif'],
            mono: ['"JetBrains Mono"', 'monospace'],
          },
          colors: {
            lsa: {
              bg: '#060A13',
              panel: '#0C1322',
              card: '#0C1322',
              card2: '#111A2D',
              border: '#1D2940',
              cyan: '#23B6E0',
              red: '#E3261B',
              gold: '#F2B92B',
              violet: '#A24BFF',
              ink: '#E8EEF7',
              mute: '#8D9AB0',
              emerald: '#10b981',
              blue: '#23B6E0'
            }
          }
        }
      }
    };
  </script>
  <style>
    body {
      background-color: #060A13;
      background-image:
        radial-gradient(60% 70% at 78% 30%, rgba(35, 182, 224, 0.08), transparent 60%),
        radial-gradient(50% 60% at 15% 80%, rgba(227, 38, 27, 0.07), transparent 60%),
        linear-gradient(to bottom, #060A13, #090E1A);
      color: #E8EEF7;
      font-family: 'Saira', sans-serif;
      overflow-x: hidden;
    }

    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #060A13; }
    ::-webkit-scrollbar-thumb { background: #1D2940; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #2B3B5C; }

    /* Telemetry Map Viewport & Smooth Markers */
    .map-viewport {
      position: relative;
      width: 100%;
      height: 600px;
      background: radial-gradient(circle at center, #0F172A 0%, #060A13 100%);
      border-radius: 0.75rem;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      user-select: none;
    }
    .map-grid-overlay {
      position: absolute;
      inset: 0;
      background-size: 32px 32px;
      background-image:
        linear-gradient(to right, rgba(35, 182, 224, 0.03) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(35, 182, 224, 0.03) 1px, transparent 1px);
      pointer-events: none;
    }
    #map-zoom-layer {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    #map-wrapper {
      position: relative;
      display: inline-block;
      line-height: 0;
    }
    #map-img {
      display: block;
      max-width: 100%;
      max-height: 570px;
      width: auto;
      height: auto;
      object-fit: contain;
    }
    #map-markers-overlay {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    /* Fluid Car Marker using hardware-accelerated persistent transition */
    .car-marker {
      position: absolute;
      width: 0;
      height: 0;
      transition: left 780ms linear, top 780ms linear;
      will-change: left, top;
      z-index: 20;
      pointer-events: none;
    }
    .car-marker-dot {
      position: absolute;
      width: 13px;
      height: 13px;
      border-radius: 9999px;
      border: 2px solid #060A13;
      transform: translate(-50%, -50%);
      box-shadow: 0 0 6px currentColor;
    }
    .car-marker-tag {
      position: absolute;
      left: 10px;
      top: 0;
      transform: translateY(-50%);
      background: rgba(12, 19, 34, 0.95);
      border: 1px solid #1D2940;
      border-radius: 5px;
      padding: 1px 6px;
      display: flex;
      align-items: center;
      gap: 5px;
      white-space: nowrap;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
    }

    /* Glass card utility */
    .glass-card {
      background: rgba(12, 19, 34, 0.88);
      backdrop-filter: blur(12px);
      border: 1px solid #1D2940;
    }

    /* Crash pulse ring */
    .crash-marker {
      position: absolute;
      width: 0;
      height: 0;
      z-index: 30;
      pointer-events: none;
    }
    .crash-marker-ring {
      position: absolute;
      width: 38px;
      height: 38px;
      border-radius: 9999px;
      border: 2px solid #E3261B;
      background: rgba(227, 38, 27, 0.25);
      transform: translate(-50%, -50%);
      animation: pingSlow 1.1s infinite;
    }
    .crash-marker-label {
      position: absolute;
      left: 0;
      top: -18px;
      transform: translate(-50%, -50%);
      background: #E3261B;
      color: #fff;
      font-size: 10px;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 4px;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(227, 38, 27, 0.6);
    }
  </style>
</head>
<body class="min-h-screen flex flex-col selection:bg-lsa-cyan selection:text-slate-950">

  <!-- TOP TELEMETRY STATUS BAR -->
  <div class="bg-lsa-bg/95 border-b border-lsa-border text-xs py-1.5 px-4 text-lsa-mute">
    <div class="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <span id="ws-indicator" class="inline-flex items-center" title="Stream en vivo">
          <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
        </span>
        <span>Servidor: <strong id="top-server-name" class="text-lsa-ink">Cargando...</strong></span>
        <span class="hidden md:inline text-lsa-border">|</span>
        <span class="hidden md:inline">Circuito: <strong id="top-track-name" class="text-lsa-cyan">—</strong></span>
      </div>
      <div class="flex items-center gap-4 font-mono">
        <span>Ambiente: <strong id="top-ambient" class="text-lsa-gold">--°C</strong></span>
        <span>Asfalto: <strong id="top-road" class="text-lsa-gold">--°C</strong></span>
        <span>Clave Servidor: <button onclick="copyServerPassword()" class="text-lsa-cyan hover:underline font-bold" id="top-pass" title="Click para copiar contraseña">LaTaM2026</button></span>
      </div>
    </div>
  </div>

  <!-- MAIN HEADER -->
  <header class="sticky top-0 z-40 bg-lsa-panel/95 backdrop-blur-md border-b border-lsa-border shadow-md">
    <div class="max-w-[1720px] mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <img src="/logo.png" alt="LSA SimRacing Alliance" class="h-9 w-auto object-contain" onerror="this.style.display='none'" />
        <h1 class="font-display italic font-bold text-xl sm:text-2xl tracking-wider text-white uppercase leading-none">
          LATAM SIMRACING <span class="text-lsa-cyan">ALLIANCE</span>
        </h1>
      </div>

      <div class="flex items-center gap-3">
        <a href="https://latamsimracing.com/" target="_blank" rel="noopener" class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-display italic font-bold uppercase tracking-wider text-lsa-mute hover:text-white border border-lsa-border hover:border-lsa-cyan transition-colors">
          <i data-lucide="globe" class="w-3.5 h-3.5 text-lsa-cyan"></i>
          Web Oficial
        </a>
        <a href="https://discord.gg/V9hq2EBSA" target="_blank" rel="noopener" class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-display italic font-bold uppercase tracking-wider text-lsa-mute hover:text-white border border-lsa-border hover:border-[#5865F2] transition-colors">
          <i data-lucide="message-square" class="w-3.5 h-3.5 text-[#5865F2]"></i>
          Discord
        </a>
        <!-- LIVE TRACK FLAG BANNER IN HEADER -->
        <div id="header-flag-banner" class="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 transition-all">
          <span id="header-flag-dot" class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          <div>
            <div id="header-flag-title" class="font-display italic font-bold text-xs uppercase tracking-wider leading-tight">PISTA LIBRE</div>
          </div>
        </div>
      </div>
    </div>
  </header>

  <!-- MAIN CONTENT CONTAINER -->
  <main class="flex-1 max-w-[1720px] w-full mx-auto px-4 sm:px-6 py-4 space-y-5">

    <!-- HERO CIRCUIT & SESSION BANNER -->
    <div class="relative rounded-2xl overflow-hidden border border-lsa-border bg-lsa-card shadow-xl">
      <div id="hero-bg" class="absolute inset-0 bg-cover bg-center opacity-15 transition-all duration-700" style="background-image: url('');"></div>
      <div class="absolute inset-0 bg-gradient-to-r from-lsa-bg via-lsa-bg/95 to-lsa-bg/80"></div>

      <div class="relative z-10 p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div class="space-y-2">
          <div class="flex flex-wrap items-center gap-2">
            <span id="live-session-badge" class="px-3 py-0.5 rounded-full text-xs font-display italic font-bold uppercase tracking-wider bg-lsa-cyan/15 text-lsa-cyan border border-lsa-cyan/40">
              PRÁCTICA
            </span>
            <span id="live-location-badge" class="px-2.5 py-0.5 rounded-md text-xs font-medium bg-lsa-card2 text-lsa-mute border border-lsa-border">
              Cargando ubicación...
            </span>
            <span id="live-length-badge" class="px-2.5 py-0.5 rounded-md text-xs font-mono bg-lsa-card2 text-lsa-mute border border-lsa-border">
              -- m
            </span>
          </div>
          <h2 id="live-track-title" class="font-display italic font-bold text-2xl sm:text-3xl text-white tracking-wide uppercase">
            Conectando con el servidor...
          </h2>
          <div class="flex flex-wrap items-center gap-5 text-xs text-lsa-mute pt-1">
            <span class="flex items-center gap-1.5">
              <i data-lucide="clock" class="w-4 h-4 text-lsa-cyan"></i>
              Tiempo Restante: <strong id="live-remaining" class="font-mono text-white text-base font-bold">--:--</strong>
            </span>
            <span class="flex items-center gap-1.5">
              <i data-lucide="users" class="w-4 h-4 text-lsa-cyan"></i>
              Pilotos Conectados: <strong id="live-drivers-count" class="font-mono text-white text-sm">0</strong>
            </span>
            <span class="flex items-center gap-1.5">
              <i data-lucide="flame" class="w-4 h-4 text-lsa-gold"></i>
              Vuelta Rápida: <strong id="live-fastest-session" class="font-mono text-emerald-400 text-sm">—</strong>
            </span>
            <span class="flex items-center gap-1.5">
              <i data-lucide="alert-triangle" class="w-4 h-4 text-lsa-red"></i>
              Incidentes: <strong id="live-incidents-total" class="font-mono text-lsa-gold text-sm">0</strong>
            </span>
          </div>
        </div>

        <!-- Session Status -->
        <div class="flex items-center gap-2 self-start lg:self-center font-mono text-xs text-lsa-mute">
          <div class="bg-lsa-panel/90 border border-lsa-border rounded-xl px-3.5 py-2">
            <span>Hora: <strong id="live-updated-clock" class="text-lsa-ink">--:--:--</strong></span>
          </div>
        </div>
      </div>
    </div>

    <!-- MAIN TWO-COLUMN LAYOUT -->
    <div class="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">

      <!-- LEFT COLUMN: LIVE CIRCUIT MAP + IN-GAME CHAT & SERVER LOGS -->
      <div class="xl:col-span-5 flex flex-col gap-5">

        <!-- MAP VIEWPORT (Clean, fluid and high precision) -->
        <div class="glass-card rounded-2xl p-4 flex flex-col">
          <div class="map-viewport border border-slate-800/90">
            <div class="map-grid-overlay"></div>

            <!-- Floating Zoom Controls -->
            <div class="absolute top-3 right-3 z-30 flex items-center gap-1 bg-slate-950/85 backdrop-blur border border-slate-800 rounded-lg p-1">
              <button onclick="adjustMapZoom(-0.2)" class="px-2 py-1 text-xs font-mono text-slate-300 hover:text-white hover:bg-slate-800 rounded" title="Alejar">-</button>
              <button onclick="resetMapZoom()" id="map-zoom-label" class="px-2 py-1 text-xs font-mono text-lsa-cyan hover:bg-slate-800 rounded" title="Restaurar Zoom">100%</button>
              <button onclick="adjustMapZoom(0.2)" class="px-2 py-1 text-xs font-mono text-slate-300 hover:text-white hover:bg-slate-800 rounded" title="Acercar">+</button>
            </div>

            <!-- Floating Flag & Sector Status Pill -->
            <div id="map-flag-pill" class="absolute top-3 left-3 z-30 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-950/85 backdrop-blur border border-emerald-500/40 text-emerald-400">
              <span id="map-flag-dot" class="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span id="map-flag-text">PISTA LIBRE</span>
            </div>

            <!-- Zoom & Pan Layer -->
            <div id="map-zoom-layer">
              <div id="map-wrapper">
                <img id="map-img" src="" alt="Trazado del circuito" />
                <div id="map-markers-overlay"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- TABS: CHAT DEL JUEGO / LOG DEL SERVIDOR -->
        <div class="glass-card rounded-2xl p-4 flex flex-col">
          <div class="flex items-center justify-between border-b border-lsa-border pb-3 mb-3">
            <div class="flex items-center gap-2">
              <button id="tab-btn-chat" onclick="switchLeftTab('chat')" class="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-lsa-cyan/15 text-lsa-cyan border border-lsa-cyan/30 flex items-center gap-1.5">
                <i data-lucide="message-square" class="w-3.5 h-3.5"></i>
                CHAT DEL JUEGO
              </button>
              <button id="tab-btn-logs" onclick="switchLeftTab('logs')" class="px-3 py-1 rounded-lg text-xs font-mono font-bold text-lsa-mute hover:text-white border border-transparent flex items-center gap-1.5">
                <i data-lucide="terminal" class="w-3.5 h-3.5"></i>
                LOGS DEL SERVIDOR / SANCIONES
              </button>
            </div>
            <span id="chat-count-badge" class="text-[11px] font-mono text-lsa-mute">0 msgs</span>
          </div>

          <!-- CHAT PANE -->
          <div id="tab-content-chat" class="flex flex-col">
            <div id="chat-messages-container" class="h-64 overflow-y-auto space-y-2 pr-1 font-mono text-xs">
              <div class="text-slate-500 italic py-8 text-center">Esperando mensajes en el chat del juego...</div>
            </div>
          </div>

          <!-- LOGS PANE -->
          <div id="tab-content-logs" class="hidden flex flex-col">
            <div id="server-logs-container" class="h-64 overflow-y-auto space-y-2 pr-1 font-mono text-xs">
              <div class="text-slate-500 italic py-8 text-center">No hay eventos ni sanciones registradas aún.</div>
            </div>
          </div>
        </div>

      </div>

      <!-- RIGHT COLUMN: CLASSIFICATION TABLE + STORED TIMES -->
      <div class="xl:col-span-7 flex flex-col gap-5">

        <!-- 1. LIVE CLASSIFICATION TABLE -->
        <div class="glass-card rounded-2xl p-4 sm:p-5">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <h3 class="font-display italic font-bold text-lg text-white uppercase flex items-center gap-2">
                <i data-lucide="timer" class="w-5 h-5 text-lsa-cyan"></i>
                <span>CLASIFICACIÓN EN VIVO</span>
              </h3>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-lsa-border text-[11px] font-mono uppercase text-lsa-mute">
                  <th class="py-2.5 px-2">Pos</th>
                  <th class="py-2.5 px-2">Piloto</th>
                  <th class="py-2.5 px-2 text-center">Marcha</th>
                  <th class="py-2.5 px-2">Auto</th>
                  <th class="py-2.5 px-2">Neumáticos</th>
                  <th class="py-2.5 px-2">Mejor Vuelta</th>
                  <th class="py-2.5 px-2">Delta</th>
                  <th class="py-2.5 px-2">Última Vuelta</th>
                  <th class="py-2.5 px-2 text-center">Vtas</th>
                  <th class="py-2.5 px-2">Velocidad</th>
                  <th class="py-2.5 px-2 text-center">Estado</th>
                </tr>
              </thead>
              <tbody id="live-drivers-tbody" class="divide-y divide-lsa-border/60 text-sm">
                <tr>
                  <td colspan="11" class="py-10 text-center text-lsa-mute">
                    No hay pilotos en pista en este momento.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 2. STORED SESSION TIMES TABLE -->
        <div class="glass-card rounded-2xl p-4 sm:p-5">
          <div class="flex items-center justify-between gap-2 mb-3">
            <div>
              <h3 class="font-display italic font-bold text-base text-white uppercase flex items-center gap-2">
                <i data-lucide="trophy" class="w-4 h-4 text-lsa-gold"></i>
                <span>TIEMPOS REGISTRADOS EN LA SESIÓN</span>
              </h3>
              <p class="text-xs text-lsa-mute">Mejores tiempos acumulados de todos los pilotos (dentro y fuera de pista)</p>
            </div>
            <span id="stored-times-count" class="text-xs font-mono text-lsa-mute bg-lsa-panel border border-lsa-border px-2.5 py-1 rounded-lg">
              0 tiempos
            </span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-lsa-border text-[11px] font-mono uppercase text-lsa-mute">
                  <th class="py-2.5 px-2">#</th>
                  <th class="py-2.5 px-2">Piloto</th>
                  <th class="py-2.5 px-2">Auto</th>
                  <th class="py-2.5 px-2">Compuesto</th>
                  <th class="py-2.5 px-2">Mejor Tiempo</th>
                  <th class="py-2.5 px-2">Última Vuelta</th>
                  <th class="py-2.5 px-2 text-center">Vueltas</th>
                  <th class="py-2.5 px-2">Velocidad Punta</th>
                  <th class="py-2.5 px-2 text-center">Estado</th>
                </tr>
              </thead>
              <tbody id="stored-times-tbody" class="divide-y divide-lsa-border/60 text-sm">
                <tr>
                  <td colspan="9" class="py-6 text-center text-slate-500 font-mono text-xs">
                    No hay tiempos registrados en esta sesión aún.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>

  </main>

  <!-- JAVASCRIPT APPLICATION -->
  <script>
    let currentState = null;
    let currentMapZoom = 1;
    let displayedMarkersMap = new Map(); // guid -> DOM Element

    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function formatGear(rawGear) {
      if (rawGear === 0) return 'R';
      if (rawGear === 1) return 'N';
      if (rawGear > 1) return String(rawGear - 1);
      return 'N';
    }

    function gearBadgeClass(g) {
      if (g === 'R') return 'bg-[#E3261B] text-white';
      if (g === 'N') return 'bg-[#F2B92B] text-slate-950';
      return 'bg-lsa-cyan text-slate-950 font-black';
    }

    function copyServerPassword() {
      const pass = (currentState && currentState.password) || 'LaTaM2026';
      navigator.clipboard.writeText(pass).then(() => {
        const topPass = document.getElementById('top-pass');
        if (topPass) {
          const prev = topPass.textContent;
          topPass.textContent = '¡Copiada!';
          setTimeout(() => { topPass.textContent = prev; }, 1500);
        }
      });
    }

    function adjustMapZoom(delta) {
      currentMapZoom = Math.max(0.6, Math.min(2.5, currentMapZoom + delta));
      applyMapZoom();
    }

    function resetMapZoom() {
      currentMapZoom = 1;
      applyMapZoom();
    }

    function applyMapZoom() {
      const layer = document.getElementById('map-zoom-layer');
      const label = document.getElementById('map-zoom-label');
      if (layer) layer.style.transform = 'scale(' + currentMapZoom + ')';
      if (label) label.textContent = Math.round(currentMapZoom * 100) + '%';
    }

    function switchLeftTab(tab) {
      const chatBtn = document.getElementById('tab-btn-chat');
      const logsBtn = document.getElementById('tab-btn-logs');
      const chatContent = document.getElementById('tab-content-chat');
      const logsContent = document.getElementById('tab-content-logs');

      if (tab === 'chat') {
        chatBtn.className = 'px-3 py-1 rounded-lg text-xs font-mono font-bold bg-lsa-cyan/15 text-lsa-cyan border border-lsa-cyan/30 flex items-center gap-1.5';
        logsBtn.className = 'px-3 py-1 rounded-lg text-xs font-mono font-bold text-lsa-mute hover:text-white border border-transparent flex items-center gap-1.5';
        chatContent.classList.remove('hidden');
        logsContent.classList.add('hidden');
      } else {
        logsBtn.className = 'px-3 py-1 rounded-lg text-xs font-mono font-bold bg-lsa-gold/15 text-lsa-gold border border-lsa-gold/30 flex items-center gap-1.5';
        chatBtn.className = 'px-3 py-1 rounded-lg text-xs font-mono font-bold text-lsa-mute hover:text-white border border-transparent flex items-center gap-1.5';
        logsContent.classList.remove('hidden');
        chatContent.classList.add('hidden');
      }
    }

    // Countdown Timer ticking every second synchronized with Emperor
    setInterval(() => {
      if (!currentState) return;
      const timerEl = document.getElementById('live-remaining');
      const startMs = currentState.sessionStartTime ? new Date(currentState.sessionStartTime).getTime() : Date.now();
      const nowMs = Date.now();
      const elapsedMs = Math.max(0, nowMs - startMs);
      const waitMs = (currentState.sessionWaitTimeSeconds || 0) * 1000;

      if (elapsedMs < waitMs) {
        const waitSec = Math.ceil((waitMs - elapsedMs) / 1000);
        const m = Math.floor(waitSec / 60);
        const s = waitSec % 60;
        timerEl.textContent = 'Inicio en: ' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
      } else if (currentState.sessionDurationMinutes > 0) {
        const totalMs = currentState.sessionDurationMinutes * 60 * 1000 + waitMs;
        const remainMs = totalMs - elapsedMs;
        if (remainMs <= 0) {
          timerEl.textContent = 'Tiempo Cumplido';
        } else {
          const remainSec = Math.floor(remainMs / 1000);
          const m = Math.floor(remainSec / 60);
          const s = remainSec % 60;
          timerEl.textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
        }
      } else if (currentState.sessionLaps > 0) {
        const leaderLaps = currentState.drivers && currentState.drivers[0] ? currentState.drivers[0].numLaps : 0;
        const remainLaps = Math.max(0, currentState.sessionLaps - leaderLaps);
        timerEl.textContent = remainLaps + ' vtas restantes';
      }
    }, 1000);

    function updateLiveDashboard(state) {
      if (!state) return;
      currentState = state;

      // Header & top telemetry
      document.getElementById('top-server-name').textContent = state.serverName || 'Servidor Oficial';
      document.getElementById('top-track-name').textContent = (state.trackTitle || state.trackId || 'Circuito') + (state.trackLayout ? ' (' + state.trackLayout + ')' : '');
      document.getElementById('top-ambient').textContent = (state.ambientTemp || 20) + '°C';
      document.getElementById('top-road').textContent = (state.roadTemp || 26) + '°C';

      // Hero banner
      document.getElementById('live-session-badge').textContent = state.sessionType || 'Práctica';
      document.getElementById('live-location-badge').textContent = [state.trackCity, state.trackCountry].filter(Boolean).join(', ') || 'En línea';
      document.getElementById('live-length-badge').textContent = state.trackLength || '-- m';
      document.getElementById('live-track-title').textContent = state.trackTitle || state.trackId || 'Circuito en vivo';
      document.getElementById('live-drivers-count').textContent = state.drivers ? state.drivers.length : 0;
      document.getElementById('live-incidents-total').textContent = state.collisions ? state.collisions.length : 0;
      document.getElementById('live-updated-clock').textContent = new Date().toLocaleTimeString();

      const mapImg = document.getElementById('map-img');
      if (state.mapImageUrl && mapImg.src !== state.mapImageUrl) {
        mapImg.src = state.mapImageUrl;
      }
      const heroBg = document.getElementById('hero-bg');
      if (state.previewImageUrl && heroBg) {
        heroBg.style.backgroundImage = 'url("' + state.previewImageUrl + '")';
      }

      // Fastest Lap in session
      const validLaps = (state.storedTimes || [])
        .filter(t => t.bestLapMs > 0)
        .sort((a, b) => a.bestLapMs - b.bestLapMs);
      const fastestLap = validLaps[0];
      document.getElementById('live-fastest-session').textContent = fastestLap
        ? (fastestLap.bestLapFormatted + ' (' + fastestLap.name + ')')
        : '—';

      // Flags
      try { updateFlagBanners(state); } catch (e) { console.error('Error in updateFlagBanners:', e); }

      // Render smooth persistent map markers
      try { renderSmoothMapMarkers(state.drivers || [], state.collisions || []); } catch (e) { console.error('Error in renderSmoothMapMarkers:', e); }

      // Render standings table
      try { renderClassificationTable(state.drivers || []); } catch (e) { console.error('Error in renderClassificationTable:', e); }

      // Render stored times
      try { renderStoredTimesTable(state.storedTimes || []); } catch (e) { console.error('Error in renderStoredTimesTable:', e); }

      // Render in-game chat and server logs
      try { renderChat(state.chat || []); } catch (e) { console.error('Error in renderChat:', e); }
      try { renderServerLogs(state.serverLogs || []); } catch (e) { console.error('Error in renderServerLogs:', e); }

      try { if (window.lucide) lucide.createIcons(); } catch (e) {}
    }

    function updateFlagBanners(state) {
      const banner = document.getElementById('header-flag-banner');
      const dot = document.getElementById('header-flag-dot');
      const title = document.getElementById('header-flag-title');
      const sub = document.getElementById('header-flag-sub');
      const pill = document.getElementById('map-flag-pill');
      const pillDot = document.getElementById('map-flag-dot');
      const pillText = document.getElementById('map-flag-text');

      if (title) title.textContent = state.trackFlagTitle || 'PISTA LIBRE';
      if (sub) sub.textContent = state.trackFlagSubtitle || 'Pista libre en todos los sectores';

      if (state.trackFlag === 'yellow') {
        if (banner) banner.className = 'flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border bg-amber-500/15 border-amber-500/40 text-amber-300 transition-all';
        if (dot) dot.className = 'w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping';
        if (pill) pill.className = 'absolute top-3 left-3 z-30 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-display italic font-bold bg-[#060A13]/90 backdrop-blur border border-amber-500/40 text-amber-400';
        if (pillDot) pillDot.className = 'w-2 h-2 rounded-full bg-amber-400 animate-ping';
        if (pillText) pillText.textContent = 'AMARILLA S' + (state.yellowSectors || []).join(',');
      } else if (state.trackFlag === 'checkered') {
        if (banner) banner.className = 'flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border bg-purple-500/15 border-purple-500/40 text-purple-300 transition-all';
        if (dot) dot.className = 'w-2.5 h-2.5 rounded-full bg-purple-400';
        if (pill) pill.className = 'absolute top-3 left-3 z-30 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-display italic font-bold bg-[#060A13]/90 backdrop-blur border border-purple-500/40 text-purple-400';
        if (pillDot) pillDot.className = 'w-2 h-2 rounded-full bg-purple-400';
        if (pillText) pillText.textContent = 'BANDERA A CUADROS';
      } else {
        if (banner) banner.className = 'flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 transition-all';
        if (dot) dot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-400';
        if (pill) pill.className = 'absolute top-3 left-3 z-30 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-display italic font-bold bg-[#060A13]/90 backdrop-blur border border-emerald-500/30 text-emerald-400';
        if (pillDot) pillDot.className = 'w-2 h-2 rounded-full bg-emerald-400';
        if (pillText) pillText.textContent = 'PISTA LIBRE';
      }
    }

    // PERSISTENT DOM MARKERS FOR SILKY SMOOTH 60FPS TRACKING
    function renderSmoothMapMarkers(drivers, collisions) {
      const overlay = document.getElementById('map-markers-overlay');
      if (!overlay) return;

      const activeGuids = new Set();

      for (const d of drivers) {
        if (!d.hasPosition) continue;
        activeGuids.add(d.guid);

        const pctX = Math.max(0, Math.min(100, d.mapPercentX || 0));
        const pctY = Math.max(0, Math.min(100, d.mapPercentY || 0));
        const dotColor = d.yellowFlag ? '#F2B92B' : d.blueFlag ? '#23B6E0' : d.isInPits ? '#F2B92B' : (d.color || '#23B6E0');
        const gDisplay = d.gearDisplay || formatGear(d.gear);
        const speedOrBox = d.isInPits ? 'BOX' : (d.speedKmh + ' km/h');

        let markerEl = displayedMarkersMap.get(d.guid);

        if (!markerEl) {
          // Create marker DOM element once
          markerEl = document.createElement('div');
          markerEl.className = 'car-marker';
          markerEl.id = 'car-marker-' + d.guid;
          markerEl.innerHTML = \`
            <div class="car-marker-dot" style="background: \${dotColor}; color: \${dotColor};"></div>
            <div class="car-marker-tag">
              <span class="marker-pos font-mono font-bold text-[11px]" style="color: \${dotColor};">P\${d.position}</span>
              <span class="marker-gear px-1 py-0.2 rounded text-[10px] font-mono font-bold bg-amber-400 text-slate-950">M\${gDisplay}</span>
              <span class="marker-name font-semibold text-xs text-white">\${escapeHtml(d.initials || d.name)}</span>
              <span class="marker-speed font-mono text-[10px] text-slate-300">\${speedOrBox}</span>
            </div>
          \`;
          overlay.appendChild(markerEl);
          displayedMarkersMap.set(d.guid, markerEl);
        } else {
          // Update tag labels without destroying DOM node so CSS transition glides smoothly!
          const posEl = markerEl.querySelector('.marker-pos');
          const gearEl = markerEl.querySelector('.marker-gear');
          const nameEl = markerEl.querySelector('.marker-name');
          const speedEl = markerEl.querySelector('.marker-speed');
          const dotEl = markerEl.querySelector('.car-marker-dot');

          if (posEl) posEl.textContent = 'P' + d.position;
          if (gearEl) {
            gearEl.textContent = 'M' + gDisplay;
            gearEl.className = 'marker-gear px-1 py-0.2 rounded text-[10px] font-mono font-bold ' + gearBadgeClass(gDisplay);
          }
          if (nameEl) nameEl.textContent = d.initials || d.name;
          if (speedEl) speedEl.textContent = speedOrBox;
          if (dotEl) {
            dotEl.style.backgroundColor = dotColor;
            dotEl.style.color = dotColor;
          }
        }

        // Hardware accelerated glide
        markerEl.style.left = pctX.toFixed(3) + '%';
        markerEl.style.top = pctY.toFixed(3) + '%';
      }

      // Remove disconnected drivers
      for (const [guid, el] of displayedMarkersMap.entries()) {
        if (!activeGuids.has(guid)) {
          el.remove();
          displayedMarkersMap.delete(guid);
        }
      }
    }

    function renderClassificationTable(drivers) {
      const tbody = document.getElementById('live-drivers-tbody');
      if (!tbody) return;

      if (!drivers || drivers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" class="py-10 text-center text-slate-400">No hay pilotos en pista en este momento.</td></tr>';
        return;
      }

      let html = '';
      drivers.forEach(d => {
        const isPits = d.isInPits;
        const gDisplay = d.gearDisplay || formatGear(d.gear);
        const gearColor = gearBadgeClass(gDisplay);

        const driverColor = d.color || '#23B6E0';

        html += \`
          <tr class="hover:bg-[#111A2D]/70 transition-colors">
            <td class="py-2.5 px-2 font-mono font-bold text-center">
              <span class="inline-flex items-center justify-center w-6 h-6 rounded-md text-xs" style="background:\${driverColor}22; color:\${driverColor}; border:1px solid \${driverColor}66;">
                \${d.position ?? '-'}
              </span>
            </td>
            <td class="py-2.5 px-2">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full" style="background:\${driverColor};"></span>
                <span class="font-bold text-white">\${escapeHtml(d.name)}</span>
                <span class="text-xs text-lsa-mute font-mono">#\${d.raceNumber ?? '0'}</span>
              </div>
            </td>
            <td class="py-2.5 px-2 text-center">
              <span class="px-2 py-0.5 rounded text-xs font-mono font-bold \${gearColor}">
                \${gDisplay}
              </span>
            </td>
            <td class="py-2.5 px-2 text-xs text-slate-300 max-w-[140px] truncate" title="\${escapeHtml(d.carName)}">
              \${escapeHtml(d.carName)}
            </td>
            <td class="py-2.5 px-2 text-xs font-mono text-lsa-mute">
              \${escapeHtml(d.tyres || '—')}
            </td>
            <td class="py-2.5 px-2 font-mono text-xs font-bold \${d.bestLapMs > 0 ? 'text-emerald-400' : 'text-slate-500'}">
              \${escapeHtml(d.bestLapFormatted)}
            </td>
            <td class="py-2.5 px-2 font-mono text-xs text-lsa-mute">
              \${escapeHtml(d.deltaToBestFormatted || '0.000s')}
            </td>
            <td class="py-2.5 px-2 font-mono text-xs text-slate-300">
              \${escapeHtml(d.lastLapFormatted)}
            </td>
            <td class="py-2.5 px-2 font-mono text-xs text-center text-slate-300">
              \${d.numLaps || 0}
            </td>
            <td class="py-2.5 px-2 font-mono text-xs text-white">
              \${d.speedKmh} <span class="text-[10px] text-slate-500">km/h</span>
            </td>
            <td class="py-2.5 px-2 text-center">
              \${isPits
                ? '<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#F2B92B]/15 text-[#F2B92B] border border-[#F2B92B]/30">EN BOXES</span>'
                : '<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">EN PISTA</span>'
              }
            </td>
          </tr>
        \`;
      });

      tbody.innerHTML = html;
    }

    function renderStoredTimesTable(storedTimes) {
      const tbody = document.getElementById('stored-times-tbody');
      const countEl = document.getElementById('stored-times-count');
      if (!tbody) return;

      if (countEl) countEl.textContent = (storedTimes ? storedTimes.length : 0) + ' tiempos';

      if (!storedTimes || storedTimes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="py-6 text-center text-slate-500 font-mono text-xs">No hay tiempos registrados en esta sesión aún.</td></tr>';
        return;
      }

      let html = '';
      storedTimes.slice(0, 20).forEach((t, idx) => {
        html += \`
          <tr class="hover:bg-[#111A2D]/70 font-mono text-xs transition-colors">
            <td class="py-2 px-2 text-slate-500">#\${idx + 1}</td>
            <td class="py-2 px-2 font-bold text-white">\${escapeHtml(t.name)}</td>
            <td class="py-2 px-2 text-slate-300">\${escapeHtml(t.carName)}</td>
            <td class="py-2 px-2 text-slate-400">\${escapeHtml(t.tyres)}</td>
            <td class="py-2 px-2 font-bold text-emerald-400">\${escapeHtml(t.bestLapFormatted)}</td>
            <td class="py-2 px-2 text-slate-300">\${escapeHtml(t.lastLapFormatted)}</td>
            <td class="py-2 px-2 text-center text-slate-300">\${t.numLaps}</td>
            <td class="py-2 px-2 text-slate-300">\${t.topSpeedKmh} km/h</td>
            <td class="py-2 px-2 text-center">
              \${t.isOnline
                ? '<span class="w-2 h-2 inline-block rounded-full bg-emerald-400" title="En línea"></span>'
                : '<span class="w-2 h-2 inline-block rounded-full bg-slate-600" title="Desconectado"></span>'
              }
            </td>
          </tr>
        \`;
      });
      tbody.innerHTML = html;
    }

    function renderChat(chatList) {
      const container = document.getElementById('chat-messages-container');
      const badge = document.getElementById('chat-count-badge');
      if (!container) return;

      if (badge) badge.textContent = chatList.length + ' msgs';

      if (!chatList || chatList.length === 0) {
        container.innerHTML = '<div class="text-slate-500 italic py-8 text-center">Esperando mensajes en el chat del juego...</div>';
        return;
      }

      let html = '';
      chatList.forEach(c => {
        html += \`
          <div class="bg-[#111A2D]/80 border border-lsa-border rounded-lg p-2.5">
            <div class="flex items-center justify-between text-[11px] text-lsa-mute mb-0.5">
              <span class="font-bold text-lsa-cyan">\${escapeHtml(c.driverName)}</span>
              <span class="text-slate-500">\${escapeHtml(c.timeFormatted)}</span>
            </div>
            <div class="text-slate-200 text-xs break-words">\${escapeHtml(c.message)}</div>
          </div>
        \`;
      });
      container.innerHTML = html;
    }

    function renderServerLogs(serverLogs) {
      const container = document.getElementById('server-logs-container');
      if (!container) return;

      if (!serverLogs || serverLogs.length === 0) {
        container.innerHTML = '<div class="text-slate-500 italic py-8 text-center">No hay eventos ni sanciones registradas aún.</div>';
        return;
      }

      let html = '';
      serverLogs.forEach(l => {
        const isImpact = l.type === 'Incidente';
        const isPenalty = l.type === 'Sanción';
        const isConn = l.type === 'Conexión' || l.type === 'Desconexión';
        const badgeColor = isImpact ? 'text-[#E3261B] bg-[#E3261B]/10 border-[#E3261B]/30' : isPenalty ? 'text-[#F2B92B] bg-[#F2B92B]/10 border-[#F2B92B]/30' : 'text-[#23B6E0] bg-[#23B6E0]/10 border-[#23B6E0]/30';

        html += \`
          <div class="bg-[#111A2D]/80 border border-lsa-border rounded-lg p-2.5">
            <div class="flex items-center justify-between text-[11px] mb-1">
              <span class="px-1.5 py-0.2 rounded border text-[10px] font-bold \${badgeColor}">\${escapeHtml(l.type)}</span>
              <span class="text-slate-500 text-[10px]">\${escapeHtml(l.timeFormatted)}</span>
            </div>
            <div class="text-white font-semibold text-xs">\${escapeHtml(l.driverName ? (l.driverName + ' — ' + l.name) : l.name)}</div>
            \${l.context ? \`<div class="text-[11px] text-lsa-mute mt-0.5">\${escapeHtml(l.context)}</div>\` : ''}
          </div>
        \`;
      });
      container.innerHTML = html;
    }

    // Connect via SSE Stream with Instant Realtime Fallback
    function connectSse() {
      const indicator = document.getElementById('ws-indicator');
      const eventSource = new EventSource('/api/live/stream');

      eventSource.onmessage = (event) => {
        try {
          const state = JSON.parse(event.data);
          updateLiveDashboard(state);
          if (indicator) {
            indicator.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-400" title="En vivo"></span>';
            indicator.className = 'inline-flex items-center';
          }
        } catch (e) {
          console.error('Error parsing SSE telemetry:', e);
        }
      };

      eventSource.onerror = () => {
        if (indicator) {
          indicator.innerHTML = '<span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Reconectando stream..."></span>';
          indicator.className = 'inline-flex items-center';
        }
        eventSource.close();
        setTimeout(connectSse, 2500);
      };
    }

    // Initial fetch snapshot + SSE connect
    fetch('/api/live')
      .then(r => r.json())
      .then(state => updateLiveDashboard(state))
      .catch(e => console.warn('Snapshot fetch error:', e))
      .finally(() => {
        connectSse();
      });

  </script>
</body>
</html>
`;
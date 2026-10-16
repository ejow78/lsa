export const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="es" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>LATAM SimRacing Alliance — Race Control & Telemetry Hub</title>
  <!-- Google Fonts: Rajdhani (Display), Inter (UI), JetBrains Mono (Telemetry) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600;700&family=Rajdhani:wght@600;700;800&display=swap" rel="stylesheet">
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest"></script>
  <!-- Chart.js -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            display: ['Rajdhani', 'sans-serif'],
            sans: ['Inter', 'sans-serif'],
            mono: ['JetBrains Mono', 'monospace'],
          },
          colors: {
            lsa: {
              bg: '#070a0f',
              panel: '#0e131d',
              card: '#131a27',
              border: '#1f2b3e',
              cyan: '#00f5d4',
              blue: '#3b82f6',
              amber: '#f59e0b',
              red: '#ef4444',
              emerald: '#10b981',
              purple: '#a855f7'
            }
          }
        }
      }
    };
  </script>
  <style>
    body {
      background-color: #070a0f;
      background-image:
        radial-gradient(circle at 15% 10%, rgba(0, 245, 212, 0.06), transparent 35%),
        radial-gradient(circle at 85% 20%, rgba(59, 130, 246, 0.06), transparent 35%),
        linear-gradient(to bottom, #070a0f, #0a0f18);
      color: #f1f5f9;
      font-family: 'Inter', sans-serif;
      overflow-x: hidden;
    }

    /* Custom Scrollbar */
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: #090d14; }
    ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #334155; }

    /* Telemetry Map Container & Exact Percentage Pinning */
    .map-viewport {
      position: relative;
      width: 100%;
      height: 580px;
      background:
        radial-gradient(circle at center, #111927 0%, #070a10 100%);
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
        linear-gradient(to right, rgba(255, 255, 255, 0.025) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.025) 1px, transparent 1px);
      pointer-events: none;
    }
    #map-zoom-layer {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      transition: transform 0.2s ease-out;
    }
    /* Wrapper tightly wraps the map image so percentage coordinates (0-100%) match map.png pixels 1:1 */
    #map-wrapper {
      position: relative;
      display: inline-block;
      line-height: 0;
    }
    #map-img {
      display: block;
      max-width: 100%;
      max-height: 530px;
      width: auto;
      height: auto;
      filter: drop-shadow(0 0 18px rgba(0, 245, 212, 0.18)) contrast(1.15);
      pointer-events: none;
    }
    #map-overlay {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    /* Zero-size anchor at exact (mapPercentX%, mapPercentY%) so label never shifts dot center */
    .car-marker {
      position: absolute;
      width: 0;
      height: 0;
      transition: left 0.45s linear, top 0.45s linear;
      z-index: 20;
      pointer-events: auto;
      cursor: pointer;
    }
    .car-marker:hover {
      z-index: 50;
    }
    .car-marker-dot {
      position: absolute;
      left: 0;
      top: 0;
      width: 14px;
      height: 14px;
      border-radius: 9999px;
      border: 2.5px solid #070a0f;
      transform: translate(-50%, -50%);
      box-shadow: 0 0 12px currentColor;
    }
    .car-marker-pulse {
      position: absolute;
      left: 0;
      top: 0;
      width: 26px;
      height: 26px;
      border-radius: 9999px;
      transform: translate(-50%, -50%);
      opacity: 0.35;
      animation: pingSlow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
    }
    @keyframes pingSlow {
      75%, 100% {
        transform: translate(-50%, -50%) scale(1.9);
        opacity: 0;
      }
    }
    .car-marker-tag {
      position: absolute;
      left: 11px;
      top: 0;
      transform: translateY(-50%);
      background: rgba(9, 13, 22, 0.92);
      border: 1px solid rgba(255, 255, 255, 0.16);
      backdrop-filter: blur(6px);
      padding: 2px 7px;
      border-radius: 6px;
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.65);
      line-height: 1.2;
    }

    .glass-card {
      background: rgba(19, 26, 39, 0.85);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(31, 43, 62, 0.9);
    }

    .tab-section { display: none; }
    .tab-section.active { display: block; animation: fadeIn 0.2s ease-out; }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  </style>
</head>
<body class="min-h-screen flex flex-col selection:bg-lsa-cyan selection:text-slate-950">

  <!-- TOP TELEMETRY STATUS BAR -->
  <div class="bg-slate-950/90 border-b border-slate-800/80 text-xs py-1.5 px-4">
    <div class="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-4">
        <span id="ws-indicator" class="inline-flex items-center gap-1.5 font-mono font-semibold text-emerald-400">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          TELEMETRÍA EN VIVO
        </span>
        <span class="text-slate-600">|</span>
        <span class="text-slate-400">Servidor: <strong id="top-server-name" class="text-slate-200">Cargando...</strong></span>
        <span class="hidden md:inline text-slate-600">|</span>
        <span class="hidden md:inline text-slate-400">Circuito: <strong id="top-track-name" class="text-lsa-cyan">—</strong></span>
      </div>
      <div class="flex items-center gap-4 font-mono">
        <span class="text-slate-400">Ambiente: <strong id="top-ambient" class="text-amber-400">--°C</strong></span>
        <span class="text-slate-400">Asfalto: <strong id="top-road" class="text-orange-400">--°C</strong></span>
        <span class="text-slate-400">Clave Servidor: <button onclick="copyServerPassword()" class="text-lsa-cyan hover:underline font-bold" id="top-pass" title="Click para copiar contraseña">LaTaM2026</button></span>
      </div>
    </div>
  </div>

  <!-- MAIN NAVIGATION HEADER -->
  <header class="sticky top-0 z-50 bg-lsa-panel/95 backdrop-blur-md border-b border-lsa-border shadow-xl">
    <div class="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
      <!-- Brand -->
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-lsa-cyan to-blue-600 flex items-center justify-center shadow-lg shadow-lsa-cyan/20">
          <span class="font-display font-extrabold text-xl text-slate-950 tracking-tighter">LSA</span>
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="font-display font-bold text-xl sm:text-2xl tracking-wide text-white leading-none">
              LATAM SIMRACING ALLIANCE
            </h1>
            <span class="hidden sm:inline-block text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-lsa-cyan/10 text-lsa-cyan border border-lsa-cyan/30">
              RACE CONTROL
            </span>
          </div>
          <p class="text-xs text-slate-400">Live Timing GPS, Campeonatos Oficiales y Telemetría Assetto Corsa & ACC</p>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <nav class="flex items-center gap-1.5 flex-wrap bg-slate-950/70 p-1.5 rounded-xl border border-slate-800/80">
        <button onclick="switchTab('live', this)" class="nav-btn active flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all bg-lsa-cyan text-slate-950 shadow-md shadow-lsa-cyan/20">
          <i data-lucide="radar" class="w-4 h-4"></i>
          <span>Live Timing & Mapa</span>
          <span id="nav-drivers-badge" class="ml-1 px-1.5 py-0.2 rounded-full text-xs font-mono font-bold bg-slate-950/20 text-slate-950">0</span>
        </button>
        <button onclick="switchTab('ac', this)" class="nav-btn flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all">
          <i data-lucide="gauge" class="w-4 h-4"></i>
          <span>Assetto Corsa</span>
        </button>
        <button onclick="switchTab('acc', this)" class="nav-btn flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all">
          <i data-lucide="trophy" class="w-4 h-4"></i>
          <span>ACC Competizione</span>
        </button>
        <button onclick="switchTab('telemetry', this)" class="nav-btn flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all">
          <i data-lucide="activity" class="w-4 h-4"></i>
          <span>Telemetría Pilotos</span>
        </button>
        <button onclick="switchTab('admin', this)" class="nav-btn flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all">
          <i data-lucide="sliders" class="w-4 h-4"></i>
          <span>Panel Admin</span>
        </button>
      </nav>
    </div>
  </header>

  <!-- MAIN CONTENT CONTAINER -->
  <main class="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">

    <!-- =================================================================== -->
    <!-- TAB 1: LIVE TIMING & GPS TRACK MAP                                  -->
    <!-- =================================================================== -->
    <section id="tab-live" class="tab-section active space-y-6">

      <!-- HERO CIRCUIT & SESSION BANNER -->
      <div class="relative rounded-2xl overflow-hidden border border-lsa-border bg-lsa-card shadow-2xl">
        <div id="hero-bg" class="absolute inset-0 bg-cover bg-center opacity-20 transition-all duration-700" style="background-image: url('');"></div>
        <div class="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/60"></div>

        <div class="relative z-10 p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div class="space-y-2">
            <div class="flex flex-wrap items-center gap-2.5">
              <span id="live-session-badge" class="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-lsa-cyan/15 text-lsa-cyan border border-lsa-cyan/40">
                PRÁCTICA
              </span>
              <span id="live-location-badge" class="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800/80 text-slate-300">
                Cargando ubicación...
              </span>
              <span id="live-length-badge" class="px-2.5 py-1 rounded-md text-xs font-mono bg-slate-800/80 text-slate-400">
                -- m
              </span>
            </div>
            <h2 id="live-track-title" class="font-display font-extrabold text-2xl sm:text-4xl text-white tracking-tight">
              Conectando con el servidor...
            </h2>
            <div class="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
              <span class="flex items-center gap-1.5">
                <i data-lucide="clock" class="w-4 h-4 text-lsa-cyan"></i>
                Tiempo Restante: <strong id="live-remaining" class="font-mono text-white text-sm">-- min</strong>
              </span>
              <span class="flex items-center gap-1.5">
                <i data-lucide="users" class="w-4 h-4 text-blue-400"></i>
                Pilotos Conectados: <strong id="live-drivers-count" class="font-mono text-white text-sm">0</strong>
              </span>
              <span class="flex items-center gap-1.5">
                <i data-lucide="flame" class="w-4 h-4 text-amber-400"></i>
                Vuelta Rápida Sesión: <strong id="live-fastest-session" class="font-mono text-emerald-400 text-sm">—</strong>
              </span>
            </div>
          </div>

          <!-- Session Progress & Join CTA -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div class="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3 min-w-[210px]">
              <div class="flex justify-between text-xs text-slate-400 mb-1.5">
                <span>Progreso de Sesión</span>
                <span id="live-progress-label" class="font-mono text-lsa-cyan">0%</span>
              </div>
              <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div id="live-progress-bar" class="h-full bg-gradient-to-r from-lsa-cyan to-blue-500 transition-all duration-500" style="width: 0%"></div>
              </div>
              <div class="mt-2 flex justify-between text-[11px] font-mono text-slate-400">
                <span>Clave: <strong id="hero-password" class="text-slate-200">LaTaM2026</strong></span>
                <button onclick="copyServerPassword()" class="text-lsa-cyan hover:underline">Copiar</button>
              </div>
            </div>

            <a id="join-btn" href="#" target="_blank" rel="noopener"
               class="inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl font-display font-bold text-base tracking-wide bg-gradient-to-r from-lsa-cyan to-blue-500 text-slate-950 hover:brightness-110 shadow-lg shadow-lsa-cyan/20 transition-all">
              <i data-lucide="play" class="w-5 h-5 fill-current"></i>
              <span>ENTRAR A PISTA</span>
            </a>
          </div>
        </div>
      </div>

      <!-- MAIN LIVE GRID: LEFT = GPS CIRCUIT MAP + TELEMETRY COCKPIT | RIGHT = LIVE STANDINGS -->
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">

        <!-- GPS CIRCUIT MAP COLUMN (5 cols on XL) -->
        <div class="xl:col-span-5 flex flex-col gap-6">
          <div class="glass-card rounded-2xl p-4 sm:p-5 flex flex-col">
            <div class="flex items-center justify-between gap-2 mb-3">
              <div>
                <h3 class="font-display font-bold text-lg text-white flex items-center gap-2">
                  <i data-lucide="map-pin" class="w-5 h-5 text-lsa-cyan"></i>
                  <span>MAPA GPS EN TIEMPO REAL</span>
                </h3>
                <p class="text-xs text-slate-400">Coordenadas sincronizadas 1:1 con telemetría oficial del servidor</p>
              </div>
              <!-- Map Zoom Controls -->
              <div class="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
                <button onclick="adjustMapZoom(-0.2)" class="px-2 py-1 text-xs font-mono text-slate-300 hover:text-white hover:bg-slate-800 rounded" title="Alejar">-</button>
                <button onclick="resetMapZoom()" id="map-zoom-label" class="px-2 py-1 text-xs font-mono text-lsa-cyan hover:bg-slate-800 rounded" title="Restaurar Zoom">100%</button>
                <button onclick="adjustMapZoom(0.2)" class="px-2 py-1 text-xs font-mono text-slate-300 hover:text-white hover:bg-slate-800 rounded" title="Acercar">+</button>
              </div>
            </div>

            <!-- Map Viewport -->
            <div class="map-viewport border border-slate-800/90">
              <div class="map-grid-overlay"></div>
              <div id="map-zoom-layer">
                <div id="map-wrapper">
                  <img id="map-img" src="" alt="Mapa del Circuito" />
                  <div id="map-overlay"></div>
                </div>
              </div>

              <!-- Legend overlay -->
              <div class="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none text-[11px] font-mono text-slate-400 bg-slate-950/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-800/80">
                <span>🟢 En Pista (GPS Activo)</span>
                <span>🟠 En Boxes (PIT)</span>
                <span id="map-coords-status">Actualización: 800ms</span>
              </div>
            </div>

            <!-- SELECTED DRIVER LIVE COCKPIT TELEMETRY -->
            <div class="mt-4 bg-slate-950/90 border border-slate-800/90 rounded-xl p-4">
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <i data-lucide="cpu" class="w-4 h-4 text-lsa-cyan"></i>
                  Telemetría en Vivo del Piloto Seleccionado
                </span>
                <span id="cockpit-driver-status" class="text-xs font-mono text-slate-400">Selección automática</span>
              </div>

              <div id="cockpit-content" class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div class="bg-slate-900/90 border border-slate-800/80 rounded-lg p-3">
                  <div class="text-[11px] text-slate-400">Piloto / Auto</div>
                  <div id="cockpit-name" class="font-bold text-sm text-white truncate mt-0.5">Sin pilotos en pista</div>
                  <div id="cockpit-car" class="text-xs text-slate-400 truncate">—</div>
                </div>
                <div class="bg-slate-900/90 border border-slate-800/80 rounded-lg p-3">
                  <div class="text-[11px] text-slate-400">Velocidad / Punta</div>
                  <div id="cockpit-speed" class="font-mono font-bold text-lg text-lsa-cyan mt-0.5">0 km/h</div>
                  <div id="cockpit-topspeed" class="text-[11px] font-mono text-slate-400">Máxima: 0 km/h</div>
                </div>
                <div class="bg-slate-900/90 border border-slate-800/80 rounded-lg p-3">
                  <div class="text-[11px] text-slate-400">Marcha & Motor</div>
                  <div class="flex items-baseline gap-2 mt-0.5">
                    <span id="cockpit-gear" class="font-display font-extrabold text-2xl text-amber-400">N</span>
                    <span id="cockpit-rpm" class="font-mono text-xs text-slate-300">0 RPM</span>
                  </div>
                  <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1.5">
                    <div id="cockpit-rpm-bar" class="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-red-500 transition-all duration-300" style="width: 0%"></div>
                  </div>
                </div>
                <div class="bg-slate-900/90 border border-slate-800/80 rounded-lg p-3">
                  <div class="text-[11px] text-slate-400">Mejor Vuelta / Goma</div>
                  <div id="cockpit-best" class="font-mono font-bold text-sm text-emerald-400 mt-0.5">Sin tiempo</div>
                  <div id="cockpit-tyre" class="text-xs font-mono text-slate-400 mt-0.5">Compuesto: —</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- LIVE TIMING CLASSIFICATION COLUMN (7 cols on XL) -->
        <div class="xl:col-span-7 flex flex-col gap-6">
          <!-- Connected Drivers Table -->
          <div class="glass-card rounded-2xl p-4 sm:p-5">
            <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h3 class="font-display font-bold text-lg text-white flex items-center gap-2">
                  <i data-lucide="timer" class="w-5 h-5 text-lsa-cyan"></i>
                  <span>CLASIFICACIÓN EN VIVO — PILOTOS CONECTADOS</span>
                </h3>
                <p class="text-xs text-slate-400">Haz clic sobre cualquier piloto para fijar su telemetría en el monitor inferior</p>
              </div>
              <span id="live-updated-clock" class="text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
                Sincronizado
              </span>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                    <th class="py-3 px-2.5">Posición</th>
                    <th class="py-3 px-2.5">Piloto</th>
                    <th class="py-3 px-2.5">Auto</th>
                    <th class="py-3 px-2.5">Estado</th>
                    <th class="py-3 px-2.5">Mejor Vuelta</th>
                    <th class="py-3 px-2.5">Diferencia</th>
                    <th class="py-3 px-2.5">Última Vuelta</th>
                    <th class="py-3 px-2.5">Velocidad</th>
                    <th class="py-3 px-2.5">Vueltas</th>
                  </tr>
                </thead>
                <tbody id="live-drivers-tbody" class="divide-y divide-slate-800/60 text-sm">
                  <tr>
                    <td colspan="9" class="py-10 text-center text-slate-400">
                      No hay pilotos conectados en este instante. ¡Usa el botón <strong>Entrar a Pista</strong> para inaugurar la sesión!
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Stored Session Times (Drivers from current session including disconnected) -->
          <div class="glass-card rounded-2xl p-4 sm:p-5">
            <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h3 class="font-display font-bold text-lg text-white flex items-center gap-2">
                  <i data-lucide="history" class="w-5 h-5 text-blue-400"></i>
                  <span>TIEMPOS REGISTRADOS EN LA SESIÓN ACTUAL</span>
                </h3>
                <p class="text-xs text-slate-400">Historial completo de vueltas marcadas durante la sesión activa (conectados y desconectados)</p>
              </div>
              <span id="stored-count-badge" class="text-xs font-mono px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/30">
                0 registros
              </span>
            </div>

            <div class="overflow-x-auto max-h-[340px]">
              <table class="w-full text-left border-collapse">
                <thead class="sticky top-0 bg-lsa-card z-10">
                  <tr class="border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                    <th class="py-2.5 px-2.5">Posición</th>
                    <th class="py-2.5 px-2.5">Piloto</th>
                    <th class="py-2.5 px-2.5">Auto</th>
                    <th class="py-2.5 px-2.5">Mejor Vuelta</th>
                    <th class="py-2.5 px-2.5">Última Vuelta</th>
                    <th class="py-2.5 px-2.5">Compuesto</th>
                    <th class="py-2.5 px-2.5">Velocidad Punta</th>
                    <th class="py-2.5 px-2.5">Vueltas</th>
                  </tr>
                </thead>
                <tbody id="stored-times-tbody" class="divide-y divide-slate-800/60 text-sm">
                  <tr>
                    <td colspan="8" class="py-8 text-center text-slate-400">Sin tiempos registrados todavía en esta sesión.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- =================================================================== -->
    <!-- TAB 2: ASSETTO CORSA (HOTLAPS, CHAMPIONSHIPS, SESSIONS, ENTRY LIST) -->
    <!-- =================================================================== -->
    <section id="tab-ac" class="tab-section space-y-6">

      <!-- Sub-navigation & Actions -->
      <div class="flex flex-wrap items-center justify-between gap-4 glass-card rounded-2xl p-4">
        <div>
          <h2 class="font-display font-bold text-2xl text-white">HUB OFICIAL ASSETTO CORSA</h2>
          <p class="text-xs text-slate-400">Récords del circuito con sectores, campeonatos sincronizados con Emperor, última sesión y Entry List</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button onclick="loadAcOverview()" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all">
            <i data-lucide="refresh-cw" class="w-4 h-4"></i>
            <span>Actualizar Datos AC</span>
          </button>
        </div>
      </div>

      <!-- HOTLAPS + CHART GRID -->
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <!-- Hotlaps Leaderboard (8 cols) -->
        <div class="xl:col-span-8 glass-card rounded-2xl p-5">
          <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 class="font-display font-bold text-xl text-white flex items-center gap-2">
                <i data-lucide="zap" class="w-5 h-5 text-lsa-cyan"></i>
                <span id="ac-hotlaps-title">RÉCORDS DEL CIRCUITO</span>
              </h3>
              <p class="text-xs text-slate-400">Tiempos calculados sobre las sesiones oficiales registradas en Emperor</p>
            </div>
            <div class="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button id="btn-hotlap-driver" onclick="switchHotlapMode('driver')" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-lsa-cyan text-slate-950">
                Por Piloto
              </button>
              <button id="btn-hotlap-car" onclick="switchHotlapMode('car')" class="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white">
                Por Auto
              </button>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                  <th class="py-3 px-2.5">Posición</th>
                  <th class="py-3 px-2.5">Piloto</th>
                  <th class="py-3 px-2.5">Auto</th>
                  <th class="py-3 px-2.5">Mejor Vuelta</th>
                  <th class="py-3 px-2.5">Vuelta Óptima</th>
                  <th class="py-3 px-2.5">Sector 1</th>
                  <th class="py-3 px-2.5">Sector 2</th>
                  <th class="py-3 px-2.5">Sector 3</th>
                  <th class="py-3 px-2.5">Goma</th>
                  <th class="py-3 px-2.5">Vueltas</th>
                </tr>
              </thead>
              <tbody id="ac-hotlaps-tbody" class="divide-y divide-slate-800/60 text-sm">
                <tr><td colspan="10" class="py-8 text-center text-slate-400">Cargando récords del circuito...</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Lap Comparison Chart (4 cols) -->
        <div class="xl:col-span-4 glass-card rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h3 class="font-display font-bold text-xl text-white flex items-center gap-2 mb-1">
              <i data-lucide="bar-chart-3" class="w-5 h-5 text-blue-400"></i>
              <span>COMPARATIVA DE TIEMPOS (TOP 8)</span>
            </h3>
            <p class="text-xs text-slate-400 mb-4">Diferencia en segundos entre mejor vuelta real y vuelta óptima teórica</p>
            <div class="relative h-[320px] w-full">
              <canvas id="acHotlapsChart"></canvas>
            </div>
          </div>
          <div class="mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
            <span>Haz clic en un piloto de la tabla para abrir su telemetría detallada</span>
            <span class="font-mono text-lsa-cyan">AC Telemetry</span>
          </div>
        </div>
      </div>

      <!-- CHAMPIONSHIPS (EMPEROR + CUSTOM AC TABLES) -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="glass-card rounded-2xl p-5">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="font-display font-bold text-xl text-white">CAMPEONATOS OFICIALES EMPEROR (AC)</h3>
              <p class="text-xs text-slate-400">Sincronizados directamente desde el servidor de Assetto Corsa</p>
            </div>
          </div>
          <div id="ac-emperor-champs" class="space-y-4">
            <p class="text-sm text-slate-400">Cargando campeonatos...</p>
          </div>
        </div>

        <div class="glass-card rounded-2xl p-5">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="font-display font-bold text-xl text-white">TABLAS DE CAMPEONATO PERSONALIZADAS (AC)</h3>
              <p class="text-xs text-slate-400">Gestionadas desde el Panel Admin y conectadas con Discord (`/tabla`)</p>
            </div>
          </div>
          <div id="ac-custom-tables" class="space-y-4">
            <p class="text-sm text-slate-400">Cargando tablas...</p>
          </div>
        </div>
      </div>

      <!-- LATEST SESSION RESULTS & ENTRY LIST -->
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <!-- Latest Session Result (7 cols) -->
        <div class="xl:col-span-7 glass-card rounded-2xl p-5">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h3 class="font-display font-bold text-xl text-white">ÚLTIMA SESIÓN REGISTRADA</h3>
              <p id="ac-latest-meta" class="text-xs text-slate-400">Cargando resultados recientes...</p>
            </div>
            <span id="ac-latest-fastest" class="text-xs font-mono px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Vuelta Rápida: —
            </span>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                  <th class="py-2.5 px-2.5">Posición</th>
                  <th class="py-2.5 px-2.5">Piloto</th>
                  <th class="py-2.5 px-2.5">Auto</th>
                  <th class="py-2.5 px-2.5">Mejor Vuelta</th>
                  <th class="py-2.5 px-2.5">Vueltas</th>
                  <th class="py-2.5 px-2.5">Incidentes</th>
                </tr>
              </thead>
              <tbody id="ac-latest-tbody" class="divide-y divide-slate-800/60 text-sm">
                <tr><td colspan="6" class="py-6 text-center text-slate-400">Cargando...</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Entry List (5 cols) -->
        <div class="xl:col-span-5 glass-card rounded-2xl p-5">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h3 class="font-display font-bold text-xl text-white">ENTRY LIST DEL SERVIDOR</h3>
              <p class="text-xs text-slate-400">Pilotos asignados y slots disponibles</p>
            </div>
            <input id="entrylist-filter" type="text" oninput="filterEntryList()" placeholder="Buscar piloto o auto..."
                   class="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-lsa-cyan" />
          </div>
          <div class="overflow-y-auto max-h-[380px]">
            <table class="w-full text-left border-collapse">
              <thead class="sticky top-0 bg-lsa-card">
                <tr class="border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                  <th class="py-2.5 px-2.5">Slot</th>
                  <th class="py-2.5 px-2.5">Piloto</th>
                  <th class="py-2.5 px-2.5">Auto</th>
                  <th class="py-2.5 px-2.5">Estado</th>
                </tr>
              </thead>
              <tbody id="ac-entrylist-tbody" class="divide-y divide-slate-800/60 text-sm">
                <tr><td colspan="4" class="py-6 text-center text-slate-400">Cargando...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>

    <!-- =================================================================== -->
    <!-- TAB 3: ASSETTO CORSA COMPETIZIONE (ACC)                             -->
    <!-- =================================================================== -->
    <section id="tab-acc" class="tab-section space-y-6">
      <div class="glass-card rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 border-l-4 border-l-amber-500">
        <div>
          <span class="text-xs font-mono uppercase tracking-widest text-amber-400">GT World Challenge & Endurance</span>
          <h2 class="font-display font-extrabold text-3xl text-white mt-0.5">ASSETTO CORSA COMPETIZIONE (ACC)</h2>
          <p class="text-xs text-slate-400 mt-1">Clasificación general de campeonatos GT3 / GT4, podios y estadísticas conectadas con Discord</p>
        </div>
        <button onclick="switchTab('admin', document.querySelectorAll('.nav-btn')[4]); createNewTablePreset('acc');"
                class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all">
          <i data-lucide="plus-circle" class="w-4 h-4"></i>
          <span>Crear / Editar Tabla ACC</span>
        </button>
      </div>

      <!-- ACC Podium + Chart Grid -->
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div class="xl:col-span-8 space-y-6" id="acc-custom-tables">
          <div class="glass-card rounded-2xl p-6 text-center text-slate-400">Cargando tablas de Assetto Corsa Competizione...</div>
        </div>
        <div class="xl:col-span-4 glass-card rounded-2xl p-5">
          <h3 class="font-display font-bold text-xl text-white mb-1">DISTRIBUCIÓN DE PUNTOS ACC</h3>
          <p class="text-xs text-slate-400 mb-4">Comparativa de puntos del campeonato principal ACC</p>
          <div class="relative h-[320px] w-full">
            <canvas id="accPointsChart"></canvas>
          </div>
        </div>
      </div>
    </section>

    <!-- =================================================================== -->
    <!-- TAB 4: TELEMETRÍA PILOTOS (DETAILED DRIVER INSPECTOR)               -->
    <!-- =================================================================== -->
    <section id="tab-telemetry" class="tab-section space-y-6">
      <div class="glass-card rounded-2xl p-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 class="font-display font-bold text-2xl text-white flex items-center gap-2">
              <i data-lucide="activity" class="w-6 h-6 text-lsa-cyan"></i>
              <span>INSPECTOR DE TELEMETRÍA Y CONSISTENCIA POR PILOTO</span>
            </h2>
            <p class="text-xs text-slate-400 mt-1">
              Analiza mejor vuelta, vuelta óptima teórica, sectores 1-2-3, ritmo vuelta a vuelta, consistencia e incidentes
            </p>
          </div>
          <div class="flex items-center gap-2">
            <input id="telemetry-search-input" type="text" placeholder="Nombre del piloto (ej: Javi)..."
                   onkeydown="if(event.key==='Enter') searchDriverTelemetry()"
                   class="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white min-w-[240px] focus:outline-none focus:border-lsa-cyan" />
            <button onclick="searchDriverTelemetry()"
                    class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-display font-bold text-sm bg-lsa-cyan text-slate-950 hover:brightness-110 transition-all">
              <i data-lucide="search" class="w-4 h-4"></i>
              <span>Analizar</span>
            </button>
          </div>
        </div>

        <!-- Quick Driver Pills from Hotlaps -->
        <div id="telemetry-driver-pills" class="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-800/80">
          <span class="text-xs text-slate-400">Pilotos con tiempos recientes:</span>
        </div>
      </div>

      <!-- Telemetry Results Container -->
      <div id="telemetry-result-container" class="space-y-6">
        <div class="glass-card rounded-2xl p-10 text-center text-slate-400">
          Selecciona un piloto de la barra superior o escribe su nombre para inspeccionar su telemetría completa.
        </div>
      </div>
    </section>

    <!-- =================================================================== -->
    <!-- TAB 5: PANEL ADMIN (CREATE, EDIT & PUBLISH TABLES TO DISCORD)       -->
    <!-- =================================================================== -->
    <section id="tab-admin" class="tab-section space-y-6">
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">

        <!-- Left Column: Saved Tables & Auth (4 cols) -->
        <div class="xl:col-span-4 space-y-6">
          <div class="glass-card rounded-2xl p-5">
            <h3 class="font-display font-bold text-xl text-white mb-1">CREDENCIAL DE ADMINISTRADOR</h3>
            <p class="text-xs text-slate-400 mb-3">Contraseña configurada en <code class="text-lsa-cyan">WEB_ADMIN_PASSWORD</code> (por defecto <code class="text-slate-200">LaTaM2026</code>)</p>
            <input type="password" id="admin-pass" value="LaTaM2026"
                   class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-lsa-cyan" />
          </div>

          <div class="glass-card rounded-2xl p-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-display font-bold text-xl text-white">TABLAS GUARDADAS</h3>
              <button onclick="resetForm()" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-lsa-cyan/15 text-lsa-cyan border border-lsa-cyan/30 hover:bg-lsa-cyan hover:text-slate-950 transition-all">
                + Nueva Tabla
              </button>
            </div>
            <div id="admin-tables-list" class="space-y-2.5"></div>
          </div>
        </div>

        <!-- Right Column: Visual Table Editor (8 cols) -->
        <div class="xl:col-span-8 glass-card rounded-2xl p-5 sm:p-6">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-5 pb-4 border-b border-slate-800">
            <div>
              <h3 id="form-heading" class="font-display font-bold text-2xl text-white">CREAR / EDITAR TABLA DE CAMPEONATO</h3>
              <p class="text-xs text-slate-400">Los cambios se reflejan al instante en la web y en el comando <code class="text-lsa-cyan">/tabla</code> del bot de Discord</p>
            </div>
            <div class="flex flex-wrap gap-2">
              <button onclick="importFromEntryList()" class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700">
                <span>📥 Importar Entry List AC</span>
              </button>
              <button onclick="sortRowsByPoints()" class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700">
                <span>🔢 Ordenar por Puntos</span>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <div>
              <label class="block text-xs text-slate-400 mb-1">ID Único (ej: gt3-apertura)</label>
              <input type="text" id="tbl-id" placeholder="gt3-apertura"
                     class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-lsa-cyan" />
            </div>
            <div>
              <label class="block text-xs text-slate-400 mb-1">Título del Campeonato</label>
              <input type="text" id="tbl-title" placeholder="Copa GT3 LATAM"
                     class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-lsa-cyan" />
            </div>
            <div>
              <label class="block text-xs text-slate-400 mb-1">Simulador</label>
              <select id="tbl-sim" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-lsa-cyan">
                <option value="ac">Assetto Corsa (AC)</option>
                <option value="acc">Assetto Corsa Competizione (ACC)</option>
              </select>
            </div>
          </div>

          <div class="mb-5">
            <label class="block text-xs text-slate-400 mb-1">Subtítulo / Fase / Ronda</label>
            <input type="text" id="tbl-subtitle" placeholder="Temporada 2026 — Ronda 1"
                   class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-lsa-cyan" />
          </div>

          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-mono uppercase tracking-wider text-slate-400">Filas de Pilotos</span>
            <button onclick="addRow()" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-lsa-cyan border border-slate-700">
              + Agregar Piloto
            </button>
          </div>

          <div class="overflow-x-auto mb-6 border border-slate-800 rounded-xl">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-slate-950 border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                  <th class="py-2.5 px-2 w-12">#</th>
                  <th class="py-2.5 px-2">Piloto</th>
                  <th class="py-2.5 px-2">Auto / Equipo</th>
                  <th class="py-2.5 px-2 w-24">Victorias</th>
                  <th class="py-2.5 px-2 w-24">Podios</th>
                  <th class="py-2.5 px-2 w-24">Puntos</th>
                  <th class="py-2.5 px-2 w-20">Lastre</th>
                  <th class="py-2.5 px-2 w-12"></th>
                </tr>
              </thead>
              <tbody id="editor-rows" class="divide-y divide-slate-800/60 text-sm"></tbody>
            </table>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <button onclick="saveTable()" class="px-5 py-2.5 rounded-xl font-display font-bold text-sm bg-lsa-cyan text-slate-950 hover:brightness-110 transition-all">
              💾 Guardar Tabla
            </button>
            <button onclick="publishCurrentTableToDiscord()" class="px-5 py-2.5 rounded-xl font-display font-bold text-sm bg-blue-600 text-white hover:bg-blue-500 transition-all">
              📢 Publicar en Discord
            </button>
            <button onclick="deleteCurrentTable()" class="px-4 py-2.5 rounded-xl font-display font-bold text-sm bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white transition-all ml-auto">
              🗑️ Eliminar
            </button>
          </div>
          <p id="admin-status" class="mt-3 text-xs font-mono text-lsa-cyan"></p>
        </div>

      </div>
    </section>

  </main>

  <script>
    let currentTables = [];
    let cachedEntryList = [];
    let cachedHotlapsDriver = [];
    let cachedHotlapsCar = [];
    let currentHotlapMode = 'driver';
    let lastMapImageUrl = '';
    let selectedDriverGuid = null;
    let currentMapZoom = 1;
    let acChartInstance = null;
    let accChartInstance = null;
    let driverTelemetryChartInstance = null;

    function escapeHtml(str) {
      return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function copyServerPassword() {
      const pass = document.getElementById('top-pass')?.textContent || 'LaTaM2026';
      navigator.clipboard?.writeText(pass);
      alert('Contraseña copiada al portapapeles: ' + pass);
    }

    // Map Zoom Controls
    function adjustMapZoom(delta) {
      currentMapZoom = Math.min(2.4, Math.max(0.6, +(currentMapZoom + delta).toFixed(2)));
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

    // Navigation
    function switchTab(tabId, btn) {
      document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
      document.getElementById('tab-' + tabId)?.classList.add('active');

      document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.remove('bg-lsa-cyan', 'text-slate-950', 'shadow-md', 'shadow-lsa-cyan/20');
        b.classList.add('text-slate-300');
      });
      if (btn) {
        btn.classList.remove('text-slate-300');
        btn.classList.add('bg-lsa-cyan', 'text-slate-950', 'shadow-md', 'shadow-lsa-cyan/20');
      }
    }

    function selectDriverForCockpit(guid) {
      selectedDriverGuid = guid;
      fetchLiveState();
    }

    function gearLabel(gear) {
      if (gear === 0) return 'R';
      if (gear === 1) return 'N';
      if (typeof gear === 'number' && gear > 1) return String(gear - 1);
      return 'N';
    }

    // =====================================================================
    // 1. LIVE TIMING & GPS MAP POLLING (800ms)
    // =====================================================================
    async function fetchLiveState() {
      try {
        const res = await fetch('/api/live');
        const state = await res.json();

        // Top Bar & Hero Banner
        document.getElementById('top-server-name').textContent = state.serverName || 'LATAM SimRacing Alliance';
        document.getElementById('top-track-name').textContent = state.trackTitle || state.trackId || '—';
        document.getElementById('top-ambient').textContent = (state.ambientTemp ?? 0) + '°C';
        document.getElementById('top-road').textContent = (state.roadTemp ?? 0) + '°C';
        document.getElementById('top-pass').textContent = state.password || 'LaTaM2026';
        document.getElementById('hero-password').textContent = state.password || 'LaTaM2026';

        document.getElementById('live-track-title').textContent = state.trackTitle || state.trackId || 'Circuito Activo';
        document.getElementById('live-session-badge').textContent = (state.sessionType || 'Sesión').toUpperCase();
        const locParts = [state.trackCity, state.trackCountry].filter(Boolean);
        document.getElementById('live-location-badge').textContent = locParts.length ? locParts.join(', ') : (state.trackId || 'Circuito');
        document.getElementById('live-length-badge').textContent = state.trackLength || '—';

        const joinBtn = document.getElementById('join-btn');
        if (state.joinUrl) joinBtn.href = state.joinUrl;

        const heroBg = document.getElementById('hero-bg');
        if (state.previewImageUrl && heroBg) {
          heroBg.style.backgroundImage = "url('" + state.previewImageUrl + "')";
        }

        // Session Remaining & Progress Bar
        const totalSec = (state.sessionDurationMinutes || 0) * 60;
        const elapsedSec = state.elapsedSeconds || 0;
        const remMin = Math.max(0, Math.ceil((totalSec - elapsedSec) / 60));
        document.getElementById('live-remaining').textContent = remMin + ' minutos';
        const pct = totalSec > 0 ? Math.min(100, Math.max(0, Math.round((elapsedSec / totalSec) * 100))) : 0;
        document.getElementById('live-progress-label').textContent = pct + '%';
        document.getElementById('live-progress-bar').style.width = pct + '%';

        const drivers = Array.isArray(state.drivers) ? state.drivers : [];
        const storedTimes = Array.isArray(state.storedTimes) ? state.storedTimes : [];

        document.getElementById('live-drivers-count').textContent = String(drivers.length);
        document.getElementById('nav-drivers-badge').textContent = String(drivers.length);
        document.getElementById('live-updated-clock').textContent = 'Actualizado ' + new Date().toLocaleTimeString();

        // Fastest session lap across connected + stored
        const allValidTimes = [
          ...drivers.filter(d => d.bestLapMs > 0),
          ...storedTimes.filter(s => s.bestLapMs > 0)
        ].sort((a, b) => a.bestLapMs - b.bestLapMs);

        document.getElementById('live-fastest-session').textContent =
          allValidTimes.length > 0
            ? (allValidTimes[0].bestLapFormatted + ' (' + allValidTimes[0].name + ')')
            : 'Sin tiempos';

        // Map Image
        const mapImg = document.getElementById('map-img');
        if (state.mapImageUrl && state.mapImageUrl !== lastMapImageUrl) {
          lastMapImageUrl = state.mapImageUrl;
          mapImg.src = state.mapImageUrl;
        }

        // Render Car Markers using 1:1 Percentage Coordinates (mapPercentX, mapPercentY)
        const overlay = document.getElementById('map-overlay');
        let markersHtml = '';
        for (const d of drivers) {
          // Only draw on map if driver has sent valid world position coordinates
          if (!d.hasPosition) continue;
          const pctX = Math.max(0, Math.min(100, d.mapPercentX || 0));
          const pctY = Math.max(0, Math.min(100, d.mapPercentY || 0));
          const isSelected = selectedDriverGuid === d.guid;
          const dotColor = d.isInPits ? '#f59e0b' : (d.color || '#00f5d4');

          markersHtml += \`
            <div class="car-marker" onclick="selectDriverForCockpit('\${escapeHtml(d.guid)}')" style="left: \${pctX.toFixed(3)}%; top: \${pctY.toFixed(3)}%;">
              \${!d.isInPits ? \`<div class="car-marker-pulse" style="background: \${dotColor};"></div>\` : ''}
              <div class="car-marker-dot" style="background: \${dotColor}; color: \${dotColor}; \${isSelected ? 'transform: translate(-50%, -50%) scale(1.35); border-color: #ffffff;' : ''}"></div>
              <div class="car-marker-tag">
                <span class="font-mono font-bold text-[11px]" style="color: \${dotColor};">P\${d.position}</span>
                <span class="font-semibold text-xs text-white">\${escapeHtml(d.name)}</span>
                <span class="font-mono text-[10px] text-slate-300">\${d.isInPits ? 'BOX' : (d.speedKmh + ' km/h')}</span>
              </div>
            </div>
          \`;
        }
        overlay.innerHTML = markersHtml;

        // Update Selected Driver Cockpit
        const activeDriver =
          drivers.find(d => d.guid === selectedDriverGuid) ||
          drivers.find(d => !d.isInPits) ||
          drivers[0] ||
          null;

        if (activeDriver) {
          document.getElementById('cockpit-driver-status').textContent =
            activeDriver.isInPits ? '🟠 En Boxes (PIT)' : '🟢 En Pista Activo';
          document.getElementById('cockpit-name').textContent = activeDriver.name;
          document.getElementById('cockpit-car').textContent = activeDriver.carName;
          document.getElementById('cockpit-speed').textContent = activeDriver.speedKmh + ' km/h';
          document.getElementById('cockpit-topspeed').textContent = 'Máxima: ' + (activeDriver.topSpeedKmh || 0) + ' km/h';
          document.getElementById('cockpit-gear').textContent = gearLabel(activeDriver.gear);
          document.getElementById('cockpit-rpm').textContent = (activeDriver.rpm || 0) + ' RPM';
          const rpmPct = Math.min(100, Math.round(((activeDriver.rpm || 0) / 9000) * 100));
          document.getElementById('cockpit-rpm-bar').style.width = rpmPct + '%';
          document.getElementById('cockpit-best').textContent = activeDriver.bestLapFormatted || 'Sin tiempo';
          document.getElementById('cockpit-tyre').textContent = 'Compuesto: ' + (activeDriver.tyres || '—');
        } else {
          document.getElementById('cockpit-driver-status').textContent = 'Esperando pilotos en pista';
          document.getElementById('cockpit-name').textContent = 'Sin pilotos conectados';
          document.getElementById('cockpit-car').textContent = '—';
          document.getElementById('cockpit-speed').textContent = '0 km/h';
          document.getElementById('cockpit-topspeed').textContent = 'Máxima: 0 km/h';
          document.getElementById('cockpit-gear').textContent = 'N';
          document.getElementById('cockpit-rpm').textContent = '0 RPM';
          document.getElementById('cockpit-rpm-bar').style.width = '0%';
          document.getElementById('cockpit-best').textContent = 'Sin tiempo';
          document.getElementById('cockpit-tyre').textContent = 'Compuesto: —';
        }

        // Connected Drivers Table
        const tbody = document.getElementById('live-drivers-tbody');
        if (drivers.length === 0) {
          tbody.innerHTML = '<tr><td colspan="9" class="py-10 text-center text-slate-400">No hay pilotos conectados en este momento.</td></tr>';
        } else {
          tbody.innerHTML = drivers.map(d => {
            const isSel = activeDriver && activeDriver.guid === d.guid;
            return \`
              <tr onclick="selectDriverForCockpit('\${escapeHtml(d.guid)}')"
                  class="cursor-pointer transition-colors \${isSel ? 'bg-lsa-cyan/10' : 'hover:bg-slate-800/50'}">
                <td class="py-3 px-2.5 font-mono font-bold">
                  <span class="inline-flex items-center justify-center w-6 h-6 rounded-md text-xs" style="background:\${d.color}22; color:\${d.color}; border:1px solid \${d.color}66;">
                    \${d.position}
                  </span>
                </td>
                <td class="py-3 px-2.5 font-semibold text-white">\${escapeHtml(d.name)}</td>
                <td class="py-3 px-2.5 text-xs text-slate-300">\${escapeHtml(d.carName)}</td>
                <td class="py-3 px-2.5">
                  \${d.isInPits
                    ? '<span class="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30">BOX</span>'
                    : '<span class="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">PISTA</span>'}
                </td>
                <td class="py-3 px-2.5 font-mono font-semibold text-emerald-400">\${escapeHtml(d.bestLapFormatted)} <span class="text-[11px] text-slate-400">(\${escapeHtml(d.tyres)})</span></td>
                <td class="py-3 px-2.5 font-mono text-xs text-slate-400">\${escapeHtml(d.gap)}</td>
                <td class="py-3 px-2.5 font-mono text-xs text-slate-300">\${escapeHtml(d.lastLapFormatted)}</td>
                <td class="py-3 px-2.5 font-mono text-xs text-lsa-cyan">\${d.speedKmh} km/h</td>
                <td class="py-3 px-2.5 font-mono text-xs text-slate-300">\${d.numLaps} vueltas</td>
              </tr>
            \`;
          }).join('');
        }

        // Stored Session Times Table
        const storedTbody = document.getElementById('stored-times-tbody');
        document.getElementById('stored-count-badge').textContent = storedTimes.length + ' registros';
        if (storedTimes.length === 0) {
          storedTbody.innerHTML = '<tr><td colspan="8" class="py-8 text-center text-slate-400">Sin tiempos guardados todavía en esta sesión.</td></tr>';
        } else {
          storedTbody.innerHTML = storedTimes.map((s, idx) => \`
            <tr class="hover:bg-slate-800/40">
              <td class="py-2.5 px-2.5 font-mono font-bold text-slate-300">#\${idx + 1}</td>
              <td class="py-2.5 px-2.5 font-semibold text-white">
                \${escapeHtml(s.name)}
                \${s.isOnline ? '<span class="ml-1.5 inline-block w-2 h-2 rounded-full bg-emerald-400" title="Conectado"></span>' : ''}
              </td>
              <td class="py-2.5 px-2.5 text-xs text-slate-300">\${escapeHtml(s.carName)}</td>
              <td class="py-2.5 px-2.5 font-mono font-semibold text-emerald-400">\${escapeHtml(s.bestLapFormatted)}</td>
              <td class="py-2.5 px-2.5 font-mono text-xs text-slate-300">\${escapeHtml(s.lastLapFormatted)}</td>
              <td class="py-2.5 px-2.5 font-mono text-xs text-slate-400">\${escapeHtml(s.tyres)}</td>
              <td class="py-2.5 px-2.5 font-mono text-xs text-lsa-cyan">\${s.topSpeedKmh ? (s.topSpeedKmh + ' km/h') : '—'}</td>
              <td class="py-2.5 px-2.5 font-mono text-xs text-slate-300">\${s.numLaps} vueltas</td>
            </tr>
          \`).join('');
        }
      } catch (err) {
        console.error('Error actualizando Live Timing:', err);
      }
    }

    // =====================================================================
    // 2. ASSETTO CORSA OVERVIEW (HOTLAPS, CHARTS, RESULTS, ENTRY LIST)
    // =====================================================================
    function switchHotlapMode(mode) {
      currentHotlapMode = mode;
      const btnDriver = document.getElementById('btn-hotlap-driver');
      const btnCar = document.getElementById('btn-hotlap-car');
      if (mode === 'driver') {
        btnDriver.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-lsa-cyan text-slate-950';
        btnCar.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white';
      } else {
        btnCar.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-lsa-cyan text-slate-950';
        btnDriver.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white';
      }
      renderHotlapsTableAndChart();
    }

    function renderHotlapsTableAndChart() {
      const records = currentHotlapMode === 'driver' ? cachedHotlapsDriver : cachedHotlapsCar;
      const tbody = document.getElementById('ac-hotlaps-tbody');

      if (!records || records.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="py-8 text-center text-slate-400">No hay récords registrados para este circuito.</td></tr>';
        return;
      }

      const leaderMs = records[0].bestLapMs;
      tbody.innerHTML = records.slice(0, 20).map((r, i) => {
        const delta = i === 0 ? 'Líder' : ('+' + ((r.bestLapMs - leaderMs) / 1000).toFixed(3) + 's');
        const sectors = Array.isArray(r.bestSectorsFormatted) ? r.bestSectorsFormatted : [];
        return \`
          <tr onclick="openDriverFromHotlap('\${escapeHtml(r.driverName)}')" class="cursor-pointer hover:bg-slate-800/50 transition-colors">
            <td class="py-3 px-2.5 font-mono font-bold text-lsa-cyan">#\${i + 1}</td>
            <td class="py-3 px-2.5 font-semibold text-white">\${escapeHtml(r.driverName)}</td>
            <td class="py-3 px-2.5 text-xs text-slate-300">\${escapeHtml(r.carModel)}</td>
            <td class="py-3 px-2.5 font-mono font-bold text-emerald-400">
              \${escapeHtml(r.bestLapFormatted)}
              <span class="block text-[10px] font-normal text-slate-400">\${delta}</span>
            </td>
            <td class="py-3 px-2.5 font-mono text-xs text-blue-400">\${escapeHtml(r.theoreticalBestFormatted || '—')}</td>
            <td class="py-3 px-2.5 font-mono text-xs text-slate-300">\${escapeHtml(sectors[0] || '—')}</td>
            <td class="py-3 px-2.5 font-mono text-xs text-slate-300">\${escapeHtml(sectors[1] || '—')}</td>
            <td class="py-3 px-2.5 font-mono text-xs text-slate-300">\${escapeHtml(sectors[2] || '—')}</td>
            <td class="py-3 px-2.5 font-mono text-xs text-amber-400">\${escapeHtml(r.tyre)}</td>
            <td class="py-3 px-2.5 font-mono text-xs text-slate-300">\${r.lapsCount} vueltas</td>
          </tr>
        \`;
      }).join('');

      // Render Chart.js Top 8 comparison
      const top8 = records.slice(0, 8);
      const ctx = document.getElementById('acHotlapsChart');
      if (ctx && window.Chart) {
        if (acChartInstance) acChartInstance.destroy();
        const baseMs = top8[0]?.theoreticalBestMs || top8[0]?.bestLapMs || 0;
        acChartInstance = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: top8.map(r => r.driverName),
            datasets: [
              {
                label: 'Mejor Vuelta (segundos)',
                data: top8.map(r => +(r.bestLapMs / 1000).toFixed(3)),
                backgroundColor: 'rgba(0, 245, 212, 0.75)',
                borderColor: '#00f5d4',
                borderWidth: 1,
                borderRadius: 6,
              },
              {
                label: 'Vuelta Óptima (segundos)',
                data: top8.map(r => +((r.theoreticalBestMs || r.bestLapMs) / 1000).toFixed(3)),
                backgroundColor: 'rgba(59, 130, 246, 0.65)',
                borderColor: '#3b82f6',
                borderWidth: 1,
                borderRadius: 6,
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                min: Math.max(0, Math.floor(baseMs / 1000) - 1),
                ticks: { color: '#94a3b8', font: { family: 'JetBrains Mono' } },
                grid: { color: 'rgba(148, 163, 184, 0.1)' }
              },
              x: {
                ticks: { color: '#cbd5e1', font: { size: 11 } },
                grid: { display: false }
              }
            },
            plugins: {
              legend: { labels: { color: '#e2e8f0', font: { size: 11 } } }
            }
          }
        });
      }
    }

    function openDriverFromHotlap(driverName) {
      const navBtns = document.querySelectorAll('.nav-btn');
      switchTab('telemetry', navBtns[3]);
      document.getElementById('telemetry-search-input').value = driverName;
      searchDriverTelemetry(driverName);
    }

    function filterEntryList() {
      const q = (document.getElementById('entrylist-filter')?.value || '').toLowerCase().trim();
      const tbody = document.getElementById('ac-entrylist-tbody');
      const filtered = cachedEntryList.filter(e =>
        e.driverName.toLowerCase().includes(q) ||
        e.carModel.toLowerCase().includes(q)
      );
      if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="py-6 text-center text-slate-400">Sin coincidencias.</td></tr>';
        return;
      }
      tbody.innerHTML = filtered.map(e => \`
        <tr class="hover:bg-slate-800/40">
          <td class="py-2.5 px-2.5 font-mono text-xs text-slate-400">#\${e.slot}</td>
          <td class="py-2.5 px-2.5 font-semibold text-white">\${escapeHtml(e.driverName)}</td>
          <td class="py-2.5 px-2.5 text-xs text-slate-300">\${escapeHtml(e.carModel)}</td>
          <td class="py-2.5 px-2.5">
            \${e.isOnline
              ? '<span class="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/15 text-emerald-400">En Pista</span>'
              : '<span class="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-400">Asignado</span>'}
          </td>
        </tr>
      \`).join('');
    }

    async function loadAcOverview() {
      try {
        const res = await fetch('/api/ac/overview');
        const data = await res.json();

        cachedHotlapsDriver = data.hotlaps?.records || [];
        cachedHotlapsCar = data.hotlapsByCar?.records || [];
        document.getElementById('ac-hotlaps-title').textContent =
          'RÉCORDS DEL CIRCUITO — ' + (data.hotlaps?.track || 'SERVIDOR').toUpperCase();

        renderHotlapsTableAndChart();

        // Populate quick driver pills in Telemetry tab
        const pillsContainer = document.getElementById('telemetry-driver-pills');
        if (pillsContainer && cachedHotlapsDriver.length > 0) {
          pillsContainer.innerHTML =
            '<span class="text-xs text-slate-400 mr-1">Pilotos recientes:</span>' +
            cachedHotlapsDriver.slice(0, 12).map(r => \`
              <button onclick="openDriverFromHotlap('\${escapeHtml(r.driverName)}')"
                      class="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-900 hover:bg-lsa-cyan hover:text-slate-950 text-slate-300 border border-slate-800 transition-all">
                \${escapeHtml(r.driverName)}
              </button>
            \`).join('');
        }

        // Emperor Championships
        const champDiv = document.getElementById('ac-emperor-champs');
        const champs = data.championships || [];
        if (champs.length === 0) {
          champDiv.innerHTML = '<p class="text-sm text-slate-400">No hay campeonatos activos en Emperor.</p>';
        } else {
          champDiv.innerHTML = champs.map(c => \`
            <div class="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
              <div class="flex items-center justify-between mb-3">
                <h4 class="font-display font-bold text-lg text-lsa-cyan">\${escapeHtml(c.name)}</h4>
                <span class="text-xs font-mono text-slate-400">\${c.standings.length} pilotos</span>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr class="border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                      <th class="py-2 px-2">Posición</th>
                      <th class="py-2 px-2">Piloto</th>
                      <th class="py-2 px-2">Auto</th>
                      <th class="py-2 px-2">Puntos</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-800/50">
                    \${c.standings.slice(0, 15).map((s, idx) => \`
                      <tr>
                        <td class="py-2 px-2 font-mono font-bold text-slate-300">#\${idx + 1}</td>
                        <td class="py-2 px-2 font-semibold text-white">\${escapeHtml(s.driverName)}</td>
                        <td class="py-2 px-2 text-xs text-slate-400">\${escapeHtml(s.carModel)}</td>
                        <td class="py-2 px-2 font-mono font-bold text-amber-400">\${s.points} Puntos</td>
                      </tr>
                    \`).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          \`).join('');
        }

        // Latest Session Result
        const latest = data.latestResult;
        const latestTbody = document.getElementById('ac-latest-tbody');
        if (!latest) {
          document.getElementById('ac-latest-meta').textContent = 'Sin sesiones registradas.';
          latestTbody.innerHTML = '<tr><td colspan="6" class="py-6 text-center text-slate-400">Sin datos.</td></tr>';
        } else {
          document.getElementById('ac-latest-meta').textContent =
            latest.sessionType + ' en ' + latest.track + ' • ' + latest.date;
          document.getElementById('ac-latest-fastest').textContent =
            latest.fastestLap
              ? ('Vuelta Rápida: ' + latest.fastestLap.timeFormatted + ' (' + latest.fastestLap.driverName + ')')
              : 'Vuelta Rápida: —';

          latestTbody.innerHTML = (latest.results || []).slice(0, 15).map(r => \`
            <tr class="hover:bg-slate-800/40">
              <td class="py-2.5 px-2.5 font-mono font-bold text-lsa-cyan">#\${r.position}</td>
              <td class="py-2.5 px-2.5 font-semibold text-white">\${escapeHtml(r.driverName)}</td>
              <td class="py-2.5 px-2.5 text-xs text-slate-300">\${escapeHtml(r.carModel)}</td>
              <td class="py-2.5 px-2.5 font-mono text-emerald-400">\${escapeHtml(r.bestLapFormatted)}</td>
              <td class="py-2.5 px-2.5 font-mono text-xs text-slate-300">\${r.numLaps} vueltas</td>
              <td class="py-2.5 px-2.5 font-mono text-xs \${r.incidents > 0 ? 'text-amber-400' : 'text-emerald-400'}">\${r.incidents} incidentes</td>
            </tr>
          \`).join('');
        }

        // Entry List
        cachedEntryList = data.entryList || [];
        filterEntryList();
      } catch (err) {
        console.error('Error cargando resumen AC:', err);
      }
    }

    // =====================================================================
    // 3. TELEMETRÍA PILOTOS (SEARCH & LAP-BY-LAP CHART)
    // =====================================================================
    async function searchDriverTelemetry(overrideName) {
      const input = document.getElementById('telemetry-search-input');
      const query = (overrideName || input?.value || '').trim();
      const container = document.getElementById('telemetry-result-container');
      if (!query) return;

      container.innerHTML = '<div class="glass-card rounded-2xl p-10 text-center text-slate-300">Analizando telemetría de <strong>' + escapeHtml(query) + '</strong>...</div>';

      try {
        const res = await fetch('/api/ac/driver?name=' + encodeURIComponent(query));
        if (!res.ok) {
          container.innerHTML = '<div class="glass-card rounded-2xl p-10 text-center text-red-400">No se encontraron registros recientes para <strong>' + escapeHtml(query) + '</strong>.</div>';
          return;
        }
        const profile = await res.json();
        const sectors = Array.isArray(profile.bestSectorsFormatted) ? profile.bestSectorsFormatted : [];
        const potentialDelta =
          profile.bestLapMs > 0 && profile.theoreticalBestMs > 0
            ? ((profile.bestLapMs - profile.theoreticalBestMs) / 1000).toFixed(3)
            : '0.000';

        container.innerHTML = \`
          <div class="glass-card rounded-2xl p-6 space-y-6">
            <div class="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <span class="text-xs font-mono uppercase tracking-wider text-lsa-cyan">Reporte Oficial de Telemetría</span>
                <h3 class="font-display font-extrabold text-3xl text-white">\${escapeHtml(profile.driverName)}</h3>
                <p class="text-xs text-slate-400 mt-0.5">Auto: <strong class="text-slate-200">\${escapeHtml(profile.carModel)}</strong> • Circuito: <strong class="text-slate-200">\${escapeHtml(profile.track)}</strong></p>
              </div>
              <div class="flex items-center gap-3">
                <div class="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-right">
                  <div class="text-[11px] text-slate-400">Mejor Vuelta</div>
                  <div class="font-mono font-bold text-xl text-emerald-400">\${escapeHtml(profile.bestLapFormatted)} <span class="text-xs text-slate-400">(\${escapeHtml(profile.bestLapTyre)})</span></div>
                </div>
                <div class="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-right">
                  <div class="text-[11px] text-slate-400">Vuelta Óptima Teórica</div>
                  <div class="font-mono font-bold text-xl text-lsa-cyan">\${escapeHtml(profile.theoreticalBestFormatted)}</div>
                </div>
              </div>
            </div>

            <!-- KPI Cards -->
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div class="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5">
                <div class="text-[11px] text-slate-400">Sector 1 Óptimo</div>
                <div class="font-mono font-bold text-base text-white mt-1">\${escapeHtml(sectors[0] || 'No disponible')}</div>
              </div>
              <div class="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5">
                <div class="text-[11px] text-slate-400">Sector 2 Óptimo</div>
                <div class="font-mono font-bold text-base text-white mt-1">\${escapeHtml(sectors[1] || 'No disponible')}</div>
              </div>
              <div class="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5">
                <div class="text-[11px] text-slate-400">Sector 3 Óptimo</div>
                <div class="font-mono font-bold text-base text-white mt-1">\${escapeHtml(sectors[2] || 'No disponible')}</div>
              </div>
              <div class="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5">
                <div class="text-[11px] text-slate-400">Margen de Mejora</div>
                <div class="font-mono font-bold text-base text-amber-400 mt-1">-\${potentialDelta} segundos</div>
              </div>
              <div class="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5">
                <div class="text-[11px] text-slate-400">Consistencia</div>
                <div class="font-mono font-bold text-base text-lsa-cyan mt-1">\${escapeHtml(profile.consistencyScore)}</div>
              </div>
              <div class="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5">
                <div class="text-[11px] text-slate-400">Vueltas e Incidentes</div>
                <div class="font-mono font-bold text-sm text-white mt-1">\${profile.validLaps}/\${profile.totalLaps} vueltas • \${profile.incidents} incidentes</div>
              </div>
            </div>

            <!-- Lap History Chart & Recent Laps Table -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div class="lg:col-span-6 bg-slate-950/80 border border-slate-800 rounded-xl p-4">
                <h4 class="font-display font-bold text-base text-white mb-2">EVOLUCIÓN DE RITMO (ÚLTIMAS VUELTAS)</h4>
                <div class="relative h-[260px] w-full">
                  <canvas id="driverTelemetryChart"></canvas>
                </div>
              </div>
              <div class="lg:col-span-6 bg-slate-950/80 border border-slate-800 rounded-xl p-4 overflow-x-auto">
                <h4 class="font-display font-bold text-base text-white mb-2">HISTORIAL DE VUELTAS RECIENTES</h4>
                <table class="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr class="border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                      <th class="py-2 px-2">Vuelta</th>
                      <th class="py-2 px-2">Tiempo</th>
                      <th class="py-2 px-2">Compuesto</th>
                      <th class="py-2 px-2">Validez</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-800/50">
                    \${(profile.recentLaps || []).map(l => \`
                      <tr>
                        <td class="py-2 px-2 font-mono text-xs text-slate-400">Vuelta \${l.lapNumber}</td>
                        <td class="py-2 px-2 font-mono font-semibold text-white">\${escapeHtml(l.timeFormatted)}</td>
                        <td class="py-2 px-2 font-mono text-xs text-amber-400">\${escapeHtml(l.tyre)}</td>
                        <td class="py-2 px-2 text-xs">
                          \${l.cuts === 0
                            ? '<span class="text-emerald-400 font-semibold">Válida</span>'
                            : ('<span class="text-red-400 font-semibold">' + l.cuts + ' corte(s)</span>')}
                        </td>
                      </tr>
                    \`).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        \`;

        const laps = (profile.recentLaps || []).filter(l => l.timeMs > 0);
        const chartCanvas = document.getElementById('driverTelemetryChart');
        if (chartCanvas && window.Chart && laps.length > 0) {
          if (driverTelemetryChartInstance) driverTelemetryChartInstance.destroy();
          driverTelemetryChartInstance = new Chart(chartCanvas, {
            type: 'line',
            data: {
              labels: laps.map(l => 'Vuelta ' + l.lapNumber),
              datasets: [{
                label: 'Tiempo de Vuelta (segundos)',
                data: laps.map(l => +(l.timeMs / 1000).toFixed(3)),
                borderColor: '#00f5d4',
                backgroundColor: 'rgba(0, 245, 212, 0.15)',
                tension: 0.25,
                fill: true,
                pointRadius: 4,
                pointBackgroundColor: laps.map(l => l.cuts === 0 ? '#10b981' : '#ef4444')
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: { ticks: { color: '#94a3b8', font: { family: 'JetBrains Mono' } }, grid: { color: 'rgba(148,163,184,0.1)' } },
                x: { ticks: { color: '#94a3b8' }, grid: { display: false } }
              },
              plugins: { legend: { labels: { color: '#e2e8f0' } } }
            }
          });
        }
      } catch (err) {
        console.error('Error buscando piloto:', err);
      }
    }

    // =====================================================================
    // 4. CUSTOM CHAMPIONSHIP TABLES (AC & ACC) + ADMIN PANEL
    // =====================================================================
    function renderTableCard(t) {
      const top3 = (t.rows || []).slice(0, 3);
      return \`
        <div class="glass-card rounded-2xl p-5 space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span class="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-lsa-cyan/10 text-lsa-cyan border border-lsa-cyan/30">
                \${t.sim === 'acc' ? 'ASSETTO CORSA COMPETIZIONE' : 'ASSETTO CORSA'}
              </span>
              <h4 class="font-display font-bold text-2xl text-white mt-1">\${escapeHtml(t.title)}</h4>
              <p class="text-xs text-slate-400">\${escapeHtml(t.subtitle)} • ID: <code class="text-slate-300">\${escapeHtml(t.id)}</code></p>
            </div>
            <button onclick="editTable('\${escapeHtml(t.id)}')" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700">
              ✏️ Editar Tabla
            </button>
          </div>

          \${top3.length > 0 ? \`
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              \${top3.map((r, idx) => {
                const colors = [
                  'border-amber-400/50 bg-amber-500/10 text-amber-300',
                  'border-slate-300/40 bg-slate-400/10 text-slate-200',
                  'border-orange-500/40 bg-orange-500/10 text-orange-300'
                ];
                return \`
                  <div class="rounded-xl border p-3 \${colors[idx] || ''}">
                    <div class="flex items-center justify-between text-xs font-mono">
                      <span>PUESTO #\${idx + 1}</span>
                      <span class="font-bold">\${r.points} Puntos</span>
                    </div>
                    <div class="font-display font-bold text-lg text-white truncate mt-1">\${escapeHtml(r.driverName)}</div>
                    <div class="text-xs text-slate-300 truncate">\${escapeHtml(r.carOrTeam)}</div>
                  </div>
                \`;
              }).join('')}
            </div>
          \` : ''}

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-sm">
              <thead>
                <tr class="border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                  <th class="py-2.5 px-2.5">Posición</th>
                  <th class="py-2.5 px-2.5">Piloto</th>
                  <th class="py-2.5 px-2.5">Auto / Equipo</th>
                  <th class="py-2.5 px-2.5">Victorias</th>
                  <th class="py-2.5 px-2.5">Podios</th>
                  <th class="py-2.5 px-2.5">Puntos</th>
                  <th class="py-2.5 px-2.5">Lastre</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/50">
                \${(t.rows || []).map(r => \`
                  <tr class="hover:bg-slate-800/40">
                    <td class="py-2.5 px-2.5 font-mono font-bold text-lsa-cyan">#\${r.position}</td>
                    <td class="py-2.5 px-2.5 font-semibold text-white">\${escapeHtml(r.driverName)}</td>
                    <td class="py-2.5 px-2.5 text-xs text-slate-300">\${escapeHtml(r.carOrTeam)}</td>
                    <td class="py-2.5 px-2.5 font-mono text-xs text-slate-300">\${r.wins}</td>
                    <td class="py-2.5 px-2.5 font-mono text-xs text-slate-300">\${r.podiums}</td>
                    <td class="py-2.5 px-2.5 font-mono font-bold text-amber-400">\${r.points} Puntos</td>
                    <td class="py-2.5 px-2.5 font-mono text-xs text-slate-400">\${escapeHtml(r.ballast || '-')}</td>
                  </tr>
                \`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      \`;
    }

    async function loadCustomTables() {
      try {
        const res = await fetch('/api/tables');
        currentTables = await res.json();

        const acTables = currentTables.filter(t => t.sim === 'ac');
        const accTables = currentTables.filter(t => t.sim === 'acc');

        document.getElementById('ac-custom-tables').innerHTML =
          acTables.length ? acTables.map(renderTableCard).join('') : '<p class="text-sm text-slate-400">Sin tablas AC creadas.</p>';

        document.getElementById('acc-custom-tables').innerHTML =
          accTables.length ? accTables.map(renderTableCard).join('') : '<p class="text-sm text-slate-400">Sin tablas ACC creadas.</p>';

        // Render ACC Points Chart
        const mainAcc = accTables[0];
        const accCanvas = document.getElementById('accPointsChart');
        if (accCanvas && window.Chart && mainAcc && mainAcc.rows.length > 0) {
          if (accChartInstance) accChartInstance.destroy();
          accChartInstance = new Chart(accCanvas, {
            type: 'bar',
            data: {
              labels: mainAcc.rows.map(r => r.driverName),
              datasets: [{
                label: 'Puntos Campeonato ACC',
                data: mainAcc.rows.map(r => r.points),
                backgroundColor: 'rgba(245, 158, 11, 0.8)',
                borderColor: '#f59e0b',
                borderWidth: 1,
                borderRadius: 6
              }]
            },
            options: {
              indexAxis: 'y',
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.1)' } },
                y: { ticks: { color: '#f8fafc' }, grid: { display: false } }
              },
              plugins: { legend: { display: false } }
            }
          });
        }

        // Admin List
        const adminList = document.getElementById('admin-tables-list');
        adminList.innerHTML = currentTables.map(t => \`
          <div class="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <div>
              <div class="font-semibold text-sm text-white">\${escapeHtml(t.title)}</div>
              <div class="text-xs font-mono text-slate-400">\${t.sim.toUpperCase()} • ID: \${escapeHtml(t.id)}</div>
            </div>
            <button onclick="editTable('\${escapeHtml(t.id)}')" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-lsa-cyan hover:text-slate-950 text-slate-200 transition-all">
              Editar
            </button>
          </div>
        \`).join('');
      } catch (err) {
        console.error('Error cargando tablas:', err);
      }
    }

    // Admin Editor Helpers
    function addRow(row = { position: 1, driverName: '', carOrTeam: '', wins: 0, podiums: 0, points: 0, ballast: '' }) {
      const tbody = document.getElementById('editor-rows');
      const tr = document.createElement('tr');
      const idx = tbody.children.length + 1;
      tr.innerHTML = \`
        <td class="py-2 px-2 font-mono text-xs text-slate-400 row-pos">\${row.position || idx}</td>
        <td class="py-2 px-2"><input type="text" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white row-name" value="\${escapeHtml(row.driverName)}" placeholder="Nombre Piloto" /></td>
        <td class="py-2 px-2"><input type="text" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white row-car" value="\${escapeHtml(row.carOrTeam)}" placeholder="Auto o Equipo" /></td>
        <td class="py-2 px-2"><input type="number" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white font-mono row-wins" value="\${row.wins ?? 0}" /></td>
        <td class="py-2 px-2"><input type="number" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white font-mono row-podiums" value="\${row.podiums ?? 0}" /></td>
        <td class="py-2 px-2"><input type="number" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-amber-400 font-mono font-bold row-points" value="\${row.points ?? 0}" /></td>
        <td class="py-2 px-2"><input type="text" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white font-mono row-ballast" value="\${escapeHtml(row.ballast || '')}" placeholder="0kg" /></td>
        <td class="py-2 px-2 text-center"><button onclick="this.closest('tr').remove(); renumberRows();" class="text-red-400 hover:text-red-300 font-bold">✕</button></td>
      \`;
      tbody.appendChild(tr);
    }

    function renumberRows() {
      document.querySelectorAll('#editor-rows tr').forEach((tr, i) => {
        tr.querySelector('.row-pos').textContent = String(i + 1);
      });
    }

    function collectEditorRows() {
      const rows = [];
      document.querySelectorAll('#editor-rows tr').forEach((tr, i) => {
        const driverName = tr.querySelector('.row-name').value.trim();
        if (!driverName) return;
        rows.push({
          position: i + 1,
          driverName,
          carOrTeam: tr.querySelector('.row-car').value.trim() || 'Por definir',
          wins: Number(tr.querySelector('.row-wins').value) || 0,
          podiums: Number(tr.querySelector('.row-podiums').value) || 0,
          points: Number(tr.querySelector('.row-points').value) || 0,
          ballast: tr.querySelector('.row-ballast').value.trim(),
        });
      });
      return rows;
    }

    function sortRowsByPoints() {
      const rows = collectEditorRows().sort((a, b) => b.points - a.points || b.wins - a.wins);
      const tbody = document.getElementById('editor-rows');
      tbody.innerHTML = '';
      rows.forEach((r, i) => addRow({ ...r, position: i + 1 }));
    }

    function resetForm() {
      document.getElementById('tbl-id').value = '';
      document.getElementById('tbl-title').value = '';
      document.getElementById('tbl-sim').value = 'ac';
      document.getElementById('tbl-subtitle').value = 'Temporada 2026';
      document.getElementById('editor-rows').innerHTML = '';
      addRow({ position: 1, driverName: '', carOrTeam: '', wins: 0, podiums: 0, points: 25, ballast: '' });
    }

    function createNewTablePreset(sim) {
      resetForm();
      document.getElementById('tbl-sim').value = sim;
    }

    function editTable(id) {
      const t = currentTables.find(item => item.id === id);
      if (!t) return;
      const navBtns = document.querySelectorAll('.nav-btn');
      switchTab('admin', navBtns[4]);
      document.getElementById('tbl-id').value = t.id;
      document.getElementById('tbl-title').value = t.title;
      document.getElementById('tbl-sim').value = t.sim;
      document.getElementById('tbl-subtitle').value = t.subtitle;
      const tbody = document.getElementById('editor-rows');
      tbody.innerHTML = '';
      (t.rows || []).forEach(r => addRow(r));
    }

    function importFromEntryList() {
      if (!cachedEntryList.length) {
        alert('Primero espera a que cargue la Entry List de Assetto Corsa.');
        return;
      }
      const existingNames = new Set(collectEditorRows().map(r => r.driverName.toLowerCase()));
      for (const item of cachedEntryList) {
        if (item.driverName && item.driverName !== 'Slot Libre' && !existingNames.has(item.driverName.toLowerCase())) {
          addRow({
            position: 1,
            driverName: item.driverName,
            carOrTeam: item.carModel,
            wins: 0,
            podiums: 0,
            points: 0,
            ballast: ''
          });
          existingNames.add(item.driverName.toLowerCase());
        }
      }
      renumberRows();
    }

    async function saveTable() {
      const pass = document.getElementById('admin-pass').value;
      const status = document.getElementById('admin-status');
      const payload = {
        id: document.getElementById('tbl-id').value.trim(),
        title: document.getElementById('tbl-title').value.trim(),
        sim: document.getElementById('tbl-sim').value,
        subtitle: document.getElementById('tbl-subtitle').value.trim(),
        rows: collectEditorRows(),
      };
      if (!payload.title) {
        status.textContent = '⚠️ Ingresa un título para la tabla.';
        return;
      }
      const res = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': pass },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        status.textContent = '❌ Error: ' + (data.error || 'No autorizado');
        return;
      }
      document.getElementById('tbl-id').value = data.id;
      status.textContent = '✅ Tabla guardada correctamente (' + data.id + ').';
      await loadCustomTables();
    }

    async function deleteCurrentTable() {
      const id = document.getElementById('tbl-id').value.trim();
      if (!id || !confirm('¿Eliminar la tabla ' + id + '?')) return;
      const pass = document.getElementById('admin-pass').value;
      const res = await fetch('/api/tables?id=' + encodeURIComponent(id), {
        method: 'DELETE',
        headers: { 'x-admin-password': pass },
      });
      if (res.ok) {
        document.getElementById('admin-status').textContent = '🗑️ Tabla eliminada.';
        resetForm();
        await loadCustomTables();
      }
    }

    async function publishCurrentTableToDiscord() {
      await saveTable();
      const id = document.getElementById('tbl-id').value.trim();
      if (!id) return;
      const pass = document.getElementById('admin-pass').value;
      const status = document.getElementById('admin-status');
      status.textContent = 'Enviando tabla al canal de Discord...';
      const res = await fetch('/api/tables/publish-discord', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': pass },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) {
        status.textContent = '❌ ' + (data.error || 'Error al publicar en Discord');
      } else {
        status.textContent = '📢 ¡Tabla publicada exitosamente en Discord!';
      }
    }

    // Boot
    window.addEventListener('DOMContentLoaded', () => {
      if (window.lucide) lucide.createIcons();
      resetForm();
      fetchLiveState();
      loadAcOverview();
      loadCustomTables();
      setInterval(fetchLiveState, 800);
      setInterval(loadAcOverview, 30000);
    });
  </script>
</body>
</html>`;

export const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="es" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>LATAM SimRacing Alliance — Live Timing & Telemetría</title>
  <!-- Google Fonts: Rajdhani (Display), Inter (UI), JetBrains Mono (Telemetry) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600;700&family=Rajdhani:wght@600;700;800&display=swap" rel="stylesheet">
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
    :root {
      --pos-interval: 450ms;
    }
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

    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: #090d14; }
    ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #334155; }

    /* Telemetry Map Viewport & 1:1 Percentage Pinning */
    .map-viewport {
      position: relative;
      width: 100%;
      height: 590px;
      background: radial-gradient(circle at center, #111927 0%, #070a10 100%);
      border-radius: 0.85rem;
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
      transition: transform 0.18s ease-out;
    }
    #map-wrapper {
      position: relative;
      display: inline-block;
      line-height: 0;
    }
    #map-img {
      display: block;
      max-width: 100%;
      max-height: 550px;
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
      transition: left var(--pos-interval) linear, top var(--pos-interval) linear;
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
      animation: pingSlow 1.6s cubic-bezier(0, 0, 0.2, 1) infinite;
    }
    @keyframes pingSlow {
      75%, 100% {
        transform: translate(-50%, -50%) scale(2.1);
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

    /* Crash marker on map */
    .crash-marker {
      position: absolute;
      width: 0;
      height: 0;
      z-index: 40;
      pointer-events: none;
    }
    .crash-marker-ring {
      position: absolute;
      left: 0;
      top: 0;
      width: 34px;
      height: 34px;
      border-radius: 9999px;
      border: 2px solid #ef4444;
      background: rgba(239, 68, 68, 0.25);
      transform: translate(-50%, -50%);
      animation: pingSlow 1.1s infinite;
    }
    .crash-marker-label {
      position: absolute;
      left: 0;
      top: -18px;
      transform: translate(-50%, -50%);
      background: #ef4444;
      color: #fff;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 4px;
      white-space: nowrap;
      box-shadow: 0 2px 10px rgba(239, 68, 68, 0.6);
    }

    .glass-card {
      background: rgba(19, 26, 39, 0.85);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(31, 43, 62, 0.9);
    }

    #steering-wheel-svg {
      transition: transform 180ms linear;
    }
  </style>
</head>
<body class="min-h-screen flex flex-col selection:bg-lsa-cyan selection:text-slate-950">

  <!-- FLOATING COLLISION TOAST CONTAINER -->
  <div id="collision-toast-container" class="fixed top-16 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"></div>

  <!-- TOP TELEMETRY STATUS BAR -->
  <div class="bg-slate-950/90 border-b border-slate-800/80 text-xs py-1.5 px-4">
    <div class="max-w-[1650px] mx-auto flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-4">
        <span id="ws-indicator" class="inline-flex items-center gap-1.5 font-mono font-semibold text-emerald-400">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          STREAM EN TIEMPO REAL ACTIVO
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

  <!-- MAIN HEADER (FOCUSED ON LIVE TIMING & RACE CONTROL) -->
  <header class="sticky top-0 z-40 bg-lsa-panel/95 backdrop-blur-md border-b border-lsa-border shadow-xl">
    <div class="max-w-[1650px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-lsa-cyan to-blue-600 flex items-center justify-center shadow-lg shadow-lsa-cyan/20">
          <span class="font-display font-extrabold text-xl text-slate-950 tracking-tighter">LSA</span>
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="font-display font-bold text-xl sm:text-2xl tracking-wide text-white leading-none">
              LATAM SIMRACING ALLIANCE
            </h1>
            <span class="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-lsa-cyan/10 text-lsa-cyan border border-lsa-cyan/30">
              LIVE TIMING & TELEMETRÍA
            </span>
          </div>
          <p class="text-xs text-slate-400">Monitoreo en tiempo real de posiciones, inputs de conducción, banderas e incidentes en pista</p>
        </div>
      </div>

      <!-- LIVE TRACK FLAG BANNER IN HEADER -->
      <div id="header-flag-banner" class="flex items-center gap-3 px-4 py-2 rounded-xl border bg-emerald-500/10 border-emerald-500/40 text-emerald-300 transition-all">
        <span id="header-flag-dot" class="w-3 h-3 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50"></span>
        <div>
          <div id="header-flag-title" class="font-display font-extrabold text-sm tracking-wider uppercase leading-none">BANDERA VERDE</div>
          <div id="header-flag-sub" class="text-[11px] opacity-85">Pista libre en todos los sectores</div>
        </div>
      </div>
    </div>
  </header>

  <!-- MAIN CONTENT CONTAINER -->
  <main class="flex-1 max-w-[1650px] w-full mx-auto px-4 sm:px-6 py-5 space-y-6">

    <!-- HERO CIRCUIT & SESSION BANNER (WITHOUT 'ENTRAR A PISTA' BUTTON) -->
    <div class="relative rounded-2xl overflow-hidden border border-lsa-border bg-lsa-card shadow-2xl">
      <div id="hero-bg" class="absolute inset-0 bg-cover bg-center opacity-20 transition-all duration-700" style="background-image: url('');"></div>
      <div class="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/65"></div>

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
          <div class="flex flex-wrap items-center gap-5 text-xs text-slate-400 pt-1">
            <span class="flex items-center gap-1.5">
              <i data-lucide="clock" class="w-4 h-4 text-lsa-cyan"></i>
              Tiempo Restante: <strong id="live-remaining" class="font-mono text-white text-sm">-- minutos</strong>
            </span>
            <span class="flex items-center gap-1.5">
              <i data-lucide="users" class="w-4 h-4 text-blue-400"></i>
              Pilotos Conectados: <strong id="live-drivers-count" class="font-mono text-white text-sm">0</strong>
            </span>
            <span class="flex items-center gap-1.5">
              <i data-lucide="flame" class="w-4 h-4 text-amber-400"></i>
              Vuelta Rápida Sesión: <strong id="live-fastest-session" class="font-mono text-emerald-400 text-sm">—</strong>
            </span>
            <span class="flex items-center gap-1.5">
              <i data-lucide="alert-triangle" class="w-4 h-4 text-red-400"></i>
              Incidentes Sesión: <strong id="live-incidents-total" class="font-mono text-amber-400 text-sm">0</strong>
            </span>
          </div>
        </div>

        <!-- Session Progress Card -->
        <div class="flex items-center gap-3">
          <div class="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3 min-w-[240px]">
            <div class="flex justify-between text-xs text-slate-400 mb-1.5">
              <span>Progreso de Sesión</span>
              <span id="live-progress-label" class="font-mono text-lsa-cyan">0%</span>
            </div>
            <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div id="live-progress-bar" class="h-full bg-gradient-to-r from-lsa-cyan to-blue-500 transition-all duration-500" style="width: 0%"></div>
            </div>
            <div class="mt-2 flex justify-between text-[11px] font-mono text-slate-400">
              <span>Frecuencia GPS: <strong id="live-freq-label" class="text-emerald-400">Tiempo Real</strong></span>
              <span id="live-updated-clock" class="text-slate-400">--:--:--</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MAIN LIVE GRID: LEFT = TRACK MAP + LIVE INPUTS COCKPIT | RIGHT = STANDINGS + COLLISIONS + STORED TIMES -->
    <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">

      <!-- LEFT COLUMN (5 cols on XL): MAP + TELEMETRY INPUTS HUD -->
      <div class="xl:col-span-5 flex flex-col gap-6">
        <div class="glass-card rounded-2xl p-4 sm:p-5 flex flex-col">

          <!-- Map Viewport (Clean, without the 'MAPA GPS EN TIEMPO REAL' header or icon) -->
          <div class="map-viewport border border-slate-800/90">
            <div class="map-grid-overlay"></div>

            <!-- Floating Zoom Controls inside top-right of map -->
            <div class="absolute top-3 right-3 z-30 flex items-center gap-1 bg-slate-950/85 backdrop-blur border border-slate-800 rounded-lg p-1">
              <button onclick="adjustMapZoom(-0.2)" class="px-2 py-1 text-xs font-mono text-slate-300 hover:text-white hover:bg-slate-800 rounded" title="Alejar">-</button>
              <button onclick="resetMapZoom()" id="map-zoom-label" class="px-2 py-1 text-xs font-mono text-lsa-cyan hover:bg-slate-800 rounded" title="Restaurar Zoom">100%</button>
              <button onclick="adjustMapZoom(0.2)" class="px-2 py-1 text-xs font-mono text-slate-300 hover:text-white hover:bg-slate-800 rounded" title="Acercar">+</button>
            </div>

            <!-- Floating Flag & Sector Status Pill inside top-left of map -->
            <div id="map-flag-pill" class="absolute top-3 left-3 z-30 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-950/85 backdrop-blur border border-emerald-500/40 text-emerald-400">
              <span id="map-flag-dot" class="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span id="map-flag-text">PISTA LIBRE</span>
            </div>

            <div id="map-zoom-layer">
              <div id="map-wrapper">
                <img id="map-img" src="" alt="Trazado del Circuito" />
                <div id="map-overlay"></div>
              </div>
            </div>

            <!-- Bottom Legend Overlay -->
            <div class="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none text-[11px] font-mono text-slate-400 bg-slate-950/85 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-800/80">
              <span>🟢 En Pista</span>
              <span>🟠 Boxes</span>
              <span>🟡 Bandera Amarilla</span>
              <span>🔵 Bandera Azul</span>
              <span>💥 Choque Reciente</span>
            </div>
          </div>

          <!-- LIVE INPUTS & TELEMETRY COCKPIT HUD -->
          <div class="mt-4 bg-slate-950/95 border border-slate-800/90 rounded-xl p-4 space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
              <div>
                <div class="text-[11px] font-mono uppercase tracking-wider text-lsa-cyan">Telemetría & Inputs en Tiempo Real</div>
                <div class="flex items-center gap-2 mt-0.5">
                  <span id="cockpit-name" class="font-display font-bold text-xl text-white">Sin pilotos en pista</span>
                  <span id="cockpit-flag-badge" class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    BANDERA VERDE
                  </span>
                </div>
                <div id="cockpit-car" class="text-xs text-slate-400">—</div>
              </div>
              <div class="text-right font-mono">
                <div id="cockpit-sector" class="text-xs text-lsa-cyan font-bold">Sector 1 • 0.0%</div>
                <div id="cockpit-delta" class="text-xs text-slate-400">Delta: 0.000s</div>
              </div>
            </div>

            <!-- INPUTS GRID: STEERING WHEEL | PEDALS (THROTTLE & BRAKE) | GEAR & RPM | SPEED & TYRES -->
            <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-stretch">

              <!-- 1. Live Steering Wheel SVG (3 cols) -->
              <div class="sm:col-span-3 bg-slate-900/90 border border-slate-800/80 rounded-xl p-3 flex flex-col items-center justify-between">
                <div class="text-[11px] font-mono text-slate-400 uppercase">Volante</div>
                <div class="my-1 relative flex items-center justify-center">
                  <svg id="steering-wheel-svg" class="w-16 h-16 text-lsa-cyan" viewBox="0 0 100 100" fill="none">
                    <circle cx="50" cy="50" r="42" stroke="currentColor" stroke-width="8" class="opacity-80" />
                    <!-- Top center red stripe marker -->
                    <rect x="47" y="4" width="6" height="9" rx="2" fill="#ef4444" />
                    <!-- Spokes -->
                    <path d="M12 50 H38 M62 50 H88 M50 62 V90" stroke="currentColor" stroke-width="7" stroke-linecap="round" />
                    <circle cx="50" cy="50" r="13" fill="#0e131d" stroke="currentColor" stroke-width="4" />
                  </svg>
                </div>
                <div id="cockpit-steer-deg" class="font-mono font-bold text-xs text-white">0°</div>
              </div>

              <!-- 2. Pedals: Throttle (Green) & Brake (Red) + G-Force (4 cols) -->
              <div class="sm:col-span-4 bg-slate-900/90 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between">
                <div class="flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase mb-1">
                  <span>Inputs Pedales</span>
                  <span id="cockpit-gforce" class="text-slate-300">0.00 G</span>
                </div>

                <!-- Throttle Bar -->
                <div class="space-y-1 my-1">
                  <div class="flex justify-between text-xs font-mono">
                    <span class="text-emerald-400 font-semibold">Acelerador</span>
                    <span id="cockpit-throttle-label" class="text-emerald-400 font-bold">0%</span>
                  </div>
                  <div class="w-full h-3 bg-slate-950 rounded-md overflow-hidden border border-slate-800">
                    <div id="cockpit-throttle-bar" class="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-150" style="width: 0%"></div>
                  </div>
                </div>

                <!-- Brake Bar -->
                <div class="space-y-1 my-1">
                  <div class="flex justify-between text-xs font-mono">
                    <span class="text-red-400 font-semibold">Freno</span>
                    <span id="cockpit-brake-label" class="text-red-400 font-bold">0%</span>
                  </div>
                  <div class="w-full h-3 bg-slate-950 rounded-md overflow-hidden border border-slate-800">
                    <div id="cockpit-brake-bar" class="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-150" style="width: 0%"></div>
                  </div>
                </div>
              </div>

              <!-- 3. Gear, RPM & DRS (5 cols) -->
              <div class="sm:col-span-5 bg-slate-900/90 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="text-[11px] font-mono text-slate-400 uppercase">Velocidad</div>
                    <div id="cockpit-speed" class="font-mono font-extrabold text-2xl text-lsa-cyan leading-tight">0 km/h</div>
                    <div id="cockpit-topspeed" class="text-[11px] font-mono text-slate-400">Punta: 0 km/h</div>
                  </div>
                  <div class="text-center px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 min-w-[64px]">
                    <div class="text-[10px] font-mono text-slate-400 uppercase">Marcha</div>
                    <div id="cockpit-gear" class="font-display font-extrabold text-3xl text-amber-400 leading-none">N</div>
                  </div>
                </div>

                <!-- RPM Shift Bar -->
                <div class="mt-2">
                  <div class="flex justify-between text-[11px] font-mono mb-1">
                    <span id="cockpit-rpm" class="text-slate-200 font-semibold">0 RPM</span>
                    <span id="cockpit-drs" class="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-400">DRS OFF</span>
                  </div>
                  <div class="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div id="cockpit-rpm-bar" class="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-red-500 transition-all duration-150" style="width: 0%"></div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      <!-- RIGHT COLUMN (7 cols on XL): LIVE TIMING TABLE + COLLISIONS FEED + STORED TIMES -->
      <div class="xl:col-span-7 flex flex-col gap-6">

        <!-- 1. Connected Drivers Live Classification Table -->
        <div class="glass-card rounded-2xl p-4 sm:p-5">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h3 class="font-display font-bold text-lg text-white flex items-center gap-2">
                <i data-lucide="timer" class="w-5 h-5 text-lsa-cyan"></i>
                <span>CLASIFICACIÓN EN VIVO — PILOTOS EN PISTA</span>
              </h3>
              <p class="text-xs text-slate-400">Haz clic sobre cualquier piloto para inspeccionar su volante, pedales y telemetría</p>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                  <th class="py-3 px-2">Posición</th>
                  <th class="py-3 px-2">Piloto / Bandera</th>
                  <th class="py-3 px-2">Auto</th>
                  <th class="py-3 px-2">Sector</th>
                  <th class="py-3 px-2">Inputs (Acel / Freno / Volante)</th>
                  <th class="py-3 px-2">Velocidad</th>
                  <th class="py-3 px-2">Mejor Vuelta</th>
                  <th class="py-3 px-2">Delta</th>
                  <th class="py-3 px-2">Última Vuelta</th>
                  <th class="py-3 px-2">Vueltas</th>
                </tr>
              </thead>
              <tbody id="live-drivers-tbody" class="divide-y divide-slate-800/60 text-sm">
                <tr>
                  <td colspan="10" class="py-10 text-center text-slate-400">
                    No hay pilotos conectados en este instante.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 2. Real-Time Collisions & Incidents Feed -->
        <div class="glass-card rounded-2xl p-4 sm:p-5">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <h3 class="font-display font-bold text-lg text-white flex items-center gap-2">
                <i data-lucide="shield-alert" class="w-5 h-5 text-red-400"></i>
                <span>REGISTRO DE CHOQUES E INCIDENTES EN VIVO</span>
              </h3>
              <p class="text-xs text-slate-400">Impactos detectados por telemetría del servidor con velocidad de impacto y zonas de daño</p>
            </div>
            <span id="collisions-count-badge" class="text-xs font-mono px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 border border-red-500/30">
              0 incidentes
            </span>
          </div>

          <div id="collisions-feed" class="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
            <div class="py-6 text-center text-sm text-slate-400 bg-slate-950/50 rounded-xl border border-slate-800/60">
              Sin choques ni incidentes registrados en esta sesión.
            </div>
          </div>
        </div>

        <!-- 3. Stored Session Times -->
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

          <div class="overflow-x-auto max-h-[320px]">
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
  </main>

  <script>
    let lastMapImageUrl = '';
    let selectedDriverGuid = null;
    let currentMapZoom = 1;
    let seenCollisionIds = new Set();
    let isFirstCollisionLoad = true;

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

    function selectDriverForCockpit(guid) {
      selectedDriverGuid = guid;
    }

    function gearLabel(gear) {
      if (gear === 0) return 'R';
      if (gear === 1) return 'N';
      if (typeof gear === 'number' && gear > 1) return String(gear - 1);
      return 'N';
    }

    function driverFlagHtml(d) {
      if (d.hasCompletedSession) {
        return '<span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 text-slate-950">🏁 CUADROS</span>';
      }
      if (d.blueFlag) {
        return '<span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/40">🔵 AZUL</span>';
      }
      if (d.yellowFlag) {
        return '<span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">🟡 AMARILLA</span>';
      }
      if (d.isInPits) {
        return '<span class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-amber-400 border border-amber-500/30">BOX</span>';
      }
      return '<span class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">🟢 VERDE</span>';
    }

    function showCollisionToast(c) {
      const container = document.getElementById('collision-toast-container');
      if (!container) return;
      const el = document.createElement('div');
      el.className = 'pointer-events-auto bg-slate-950/95 border-2 border-red-500 rounded-xl p-3.5 shadow-2xl shadow-red-500/20 transition-all';
      el.innerHTML = \`
        <div class="flex items-center justify-between text-xs font-mono text-red-400 font-bold mb-1">
          <span>💥 ¡IMPACTO DETECTADO EN SECTOR \${c.sector}!</span>
          <span>\${escapeHtml(c.timeFormatted)}</span>
        </div>
        <div class="font-display font-bold text-base text-white">\${escapeHtml(c.driverName)}</div>
        <div class="text-xs text-slate-300">\${escapeHtml(c.typeLabel)} — <strong class="text-amber-400 font-mono">\${c.speedKmh} km/h</strong></div>
      \`;
      container.prepend(el);
      setTimeout(() => {
        el.remove();
      }, 9000);
    }

    function renderLiveState(state) {
      if (!state) return;

      // Update CSS position transition interval to match Emperor's realtime interval
      const intervalMs = state.realtimePosIntervalMs || 450;
      document.documentElement.style.setProperty('--pos-interval', intervalMs + 'ms');
      document.getElementById('live-freq-label').textContent = intervalMs + 'ms (Directo)';

      // Top Bar & Hero Banner
      document.getElementById('top-server-name').textContent = state.serverName || 'LATAM SimRacing Alliance';
      document.getElementById('top-track-name').textContent = state.trackTitle || state.trackId || '—';
      document.getElementById('top-ambient').textContent = (state.ambientTemp ?? 0) + '°C';
      document.getElementById('top-road').textContent = (state.roadTemp ?? 0) + '°C';
      document.getElementById('top-pass').textContent = state.password || 'LaTaM2026';

      document.getElementById('live-track-title').textContent = state.trackTitle || state.trackId || 'Circuito Activo';
      document.getElementById('live-session-badge').textContent = (state.sessionType || 'Sesión').toUpperCase();
      const locParts = [state.trackCity, state.trackCountry].filter(Boolean);
      document.getElementById('live-location-badge').textContent = locParts.length ? locParts.join(', ') : (state.trackId || 'Circuito');
      document.getElementById('live-length-badge').textContent = state.trackLength || '—';

      const heroBg = document.getElementById('hero-bg');
      if (state.previewImageUrl && heroBg) {
        heroBg.style.backgroundImage = "url('" + state.previewImageUrl + "')";
      }

      // Track Flag Banner (Header + Map Pill)
      const headerFlagBanner = document.getElementById('header-flag-banner');
      const headerFlagDot = document.getElementById('header-flag-dot');
      const headerFlagTitle = document.getElementById('header-flag-title');
      const headerFlagSub = document.getElementById('header-flag-sub');
      const mapFlagPill = document.getElementById('map-flag-pill');
      const mapFlagDot = document.getElementById('map-flag-dot');
      const mapFlagText = document.getElementById('map-flag-text');

      headerFlagTitle.textContent = state.trackFlagTitle || 'BANDERA VERDE';
      headerFlagSub.textContent = state.trackFlagSubtitle || 'Pista libre';
      mapFlagText.textContent = state.trackFlagTitle || 'BANDERA VERDE';

      if (state.trackFlag === 'yellow') {
        headerFlagBanner.className = 'flex items-center gap-3 px-4 py-2 rounded-xl border bg-amber-500/15 border-amber-400/60 text-amber-300 animate-pulse';
        headerFlagDot.className = 'w-3 h-3 rounded-full bg-amber-400 shadow-lg shadow-amber-400/60';
        mapFlagPill.className = 'absolute top-3 left-3 z-30 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-950/90 border border-amber-400/60 text-amber-300 animate-pulse';
        mapFlagDot.className = 'w-2 h-2 rounded-full bg-amber-400';
      } else if (state.trackFlag === 'blue') {
        headerFlagBanner.className = 'flex items-center gap-3 px-4 py-2 rounded-xl border bg-blue-500/15 border-blue-400/60 text-blue-300';
        headerFlagDot.className = 'w-3 h-3 rounded-full bg-blue-400 shadow-lg shadow-blue-400/60';
        mapFlagPill.className = 'absolute top-3 left-3 z-30 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-950/90 border border-blue-400/60 text-blue-300';
        mapFlagDot.className = 'w-2 h-2 rounded-full bg-blue-400';
      } else if (state.trackFlag === 'checkered') {
        headerFlagBanner.className = 'flex items-center gap-3 px-4 py-2 rounded-xl border bg-slate-100/15 border-slate-200/60 text-white';
        headerFlagDot.className = 'w-3 h-3 rounded-full bg-white';
        mapFlagPill.className = 'absolute top-3 left-3 z-30 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-950/90 border border-slate-300 text-white';
        mapFlagDot.className = 'w-2 h-2 rounded-full bg-white';
      } else {
        headerFlagBanner.className = 'flex items-center gap-3 px-4 py-2 rounded-xl border bg-emerald-500/10 border-emerald-500/40 text-emerald-300';
        headerFlagDot.className = 'w-3 h-3 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50';
        mapFlagPill.className = 'absolute top-3 left-3 z-30 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-950/85 border border-emerald-500/40 text-emerald-400';
        mapFlagDot.className = 'w-2 h-2 rounded-full bg-emerald-400';
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
      const collisions = Array.isArray(state.collisions) ? state.collisions : [];

      document.getElementById('live-drivers-count').textContent = String(drivers.length);
      document.getElementById('live-incidents-total').textContent = String(collisions.length);
      document.getElementById('live-updated-clock').textContent = new Date().toLocaleTimeString();

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

      // Render Car Markers + Recent Crash Markers on Map
      const overlay = document.getElementById('map-overlay');
      const nowMs = Date.now();
      let markersHtml = '';

      // 1. Recent crash markers (within last 25 seconds)
      for (const c of collisions) {
        if (nowMs - (c.epochMs || 0) <= 25000 && (c.worldX !== 0 || c.worldZ !== 0)) {
          markersHtml += \`
            <div class="crash-marker" style="left: \${c.mapPercentX.toFixed(3)}%; top: \${c.mapPercentY.toFixed(3)}%;">
              <div class="crash-marker-ring"></div>
              <div class="crash-marker-label">💥 \${escapeHtml(c.driverName)} (\${c.speedKmh} km/h)</div>
            </div>
          \`;
        }
      }

      // 2. Driver markers
      for (const d of drivers) {
        if (!d.hasPosition) continue;
        const pctX = Math.max(0, Math.min(100, d.mapPercentX || 0));
        const pctY = Math.max(0, Math.min(100, d.mapPercentY || 0));
        const isSelected = selectedDriverGuid === d.guid;
        const dotColor = d.yellowFlag
          ? '#f59e0b'
          : d.blueFlag
          ? '#3b82f6'
          : d.isInPits
          ? '#f59e0b'
          : (d.color || '#00f5d4');

        const flagIcon = d.blueFlag ? '🔵 ' : d.yellowFlag ? '🟡 ' : d.hasCompletedSession ? '🏁 ' : '';

        markersHtml += \`
          <div class="car-marker" onclick="selectDriverForCockpit('\${escapeHtml(d.guid)}')" style="left: \${pctX.toFixed(3)}%; top: \${pctY.toFixed(3)}%;">
            \${!d.isInPits ? \`<div class="car-marker-pulse" style="background: \${dotColor};"></div>\` : ''}
            <div class="car-marker-dot" style="background: \${dotColor}; color: \${dotColor}; \${isSelected ? 'transform: translate(-50%, -50%) scale(1.35); border-color: #ffffff;' : ''}"></div>
            <div class="car-marker-tag">
              <span class="font-mono font-bold text-[11px]" style="color: \${dotColor};">P\${d.position}</span>
              <span class="font-semibold text-xs text-white">\${flagIcon}\${escapeHtml(d.name)}</span>
              <span class="font-mono text-[10px] text-amber-400 font-bold">M\${gearLabel(d.gear)}</span>
              <span class="font-mono text-[10px] text-slate-300">\${d.isInPits ? 'BOX' : (d.speedKmh + ' km/h')}</span>
            </div>
          </div>
        \`;
      }
      overlay.innerHTML = markersHtml;

      // Update Selected Driver Cockpit & Inputs
      const activeDriver =
        drivers.find(d => d.guid === selectedDriverGuid) ||
        drivers.find(d => !d.isInPits) ||
        drivers[0] ||
        null;

      const wheelSvg = document.getElementById('steering-wheel-svg');

      if (activeDriver) {
        document.getElementById('cockpit-name').textContent = activeDriver.name;
        document.getElementById('cockpit-car').textContent = activeDriver.carName + ' • Compuesto: ' + (activeDriver.tyres || '—');
        document.getElementById('cockpit-sector').textContent =
          'Sector ' + (activeDriver.currentSector || 1) + ' • ' + (activeDriver.splinePct || 0).toFixed(1) + '% del trazado';
        document.getElementById('cockpit-delta').textContent =
          'Delta Propio: ' + (activeDriver.deltaToSelfFormatted || '0.000s') + ' | Delta Líder: ' + (activeDriver.deltaToBestFormatted || '0.000s');

        const flagBadge = document.getElementById('cockpit-flag-badge');
        if (activeDriver.blueFlag) {
          flagBadge.className = 'px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/40';
          flagBadge.textContent = '🔵 BANDERA AZUL';
        } else if (activeDriver.yellowFlag) {
          flagBadge.className = 'px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse';
          flagBadge.textContent = '🟡 BANDERA AMARILLA';
        } else if (activeDriver.isInPits) {
          flagBadge.className = 'px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-amber-400 border border-amber-500/30';
          flagBadge.textContent = 'EN BOXES (PIT)';
        } else {
          flagBadge.className = 'px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
          flagBadge.textContent = '🟢 BANDERA VERDE';
        }

        // Steering wheel rotation & angle
        const steerDeg = activeDriver.steerDeg || 0;
        if (wheelSvg) wheelSvg.style.transform = 'rotate(' + steerDeg + 'deg)';
        document.getElementById('cockpit-steer-deg').textContent = (steerDeg > 0 ? '+' : '') + steerDeg + '°';

        // Pedals & G-Force
        const thr = activeDriver.throttlePct || 0;
        const brk = activeDriver.brakePct || 0;
        document.getElementById('cockpit-throttle-label').textContent = thr + '%';
        document.getElementById('cockpit-throttle-bar').style.width = thr + '%';
        document.getElementById('cockpit-brake-label').textContent = brk + '%';
        document.getElementById('cockpit-brake-bar').style.width = brk + '%';
        const gVal = activeDriver.longitudinalG || 0;
        document.getElementById('cockpit-gforce').textContent = (gVal > 0 ? '+' : '') + gVal.toFixed(2) + ' G';

        // Speed, Gear, RPM, DRS
        document.getElementById('cockpit-speed').textContent = activeDriver.speedKmh + ' km/h';
        document.getElementById('cockpit-topspeed').textContent = 'Punta: ' + (activeDriver.topSpeedKmh || 0) + ' km/h';
        document.getElementById('cockpit-gear').textContent = gearLabel(activeDriver.gear);
        document.getElementById('cockpit-rpm').textContent = (activeDriver.rpm || 0) + ' RPM';
        document.getElementById('cockpit-rpm-bar').style.width = (activeDriver.rpmPct || 0) + '%';

        const drsEl = document.getElementById('cockpit-drs');
        if (activeDriver.drsActive) {
          drsEl.className = 'px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40';
          drsEl.textContent = 'DRS ACTIVO';
        } else {
          drsEl.className = 'px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-400';
          drsEl.textContent = 'DRS OFF';
        }
      } else {
        document.getElementById('cockpit-name').textContent = 'Sin pilotos conectados';
        document.getElementById('cockpit-car').textContent = '—';
        document.getElementById('cockpit-sector').textContent = 'Sector —';
        document.getElementById('cockpit-delta').textContent = 'Delta: —';
        if (wheelSvg) wheelSvg.style.transform = 'rotate(0deg)';
        document.getElementById('cockpit-steer-deg').textContent = '0°';
        document.getElementById('cockpit-throttle-label').textContent = '0%';
        document.getElementById('cockpit-throttle-bar').style.width = '0%';
        document.getElementById('cockpit-brake-label').textContent = '0%';
        document.getElementById('cockpit-brake-bar').style.width = '0%';
        document.getElementById('cockpit-gforce').textContent = '0.00 G';
        document.getElementById('cockpit-speed').textContent = '0 km/h';
        document.getElementById('cockpit-topspeed').textContent = 'Punta: 0 km/h';
        document.getElementById('cockpit-gear').textContent = 'N';
        document.getElementById('cockpit-rpm').textContent = '0 RPM';
        document.getElementById('cockpit-rpm-bar').style.width = '0%';
      }

      // Connected Drivers Table (with inline live inputs & flags)
      const tbody = document.getElementById('live-drivers-tbody');
      if (drivers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="py-10 text-center text-slate-400">No hay pilotos conectados en este momento.</td></tr>';
      } else {
        tbody.innerHTML = drivers.map(d => {
          const isSel = activeDriver && activeDriver.guid === d.guid;
          const deltaColor = d.deltaToSelfMs < 0 ? 'text-emerald-400' : d.deltaToSelfMs > 0 ? 'text-amber-400' : 'text-slate-400';
          return \`
            <tr onclick="selectDriverForCockpit('\${escapeHtml(d.guid)}')"
                class="cursor-pointer transition-colors \${isSel ? 'bg-lsa-cyan/10' : 'hover:bg-slate-800/50'}">
              <td class="py-3 px-2 font-mono font-bold">
                <span class="inline-flex items-center justify-center w-6 h-6 rounded-md text-xs" style="background:\${d.color}22; color:\${d.color}; border:1px solid \${d.color}66;">
                  \${d.position}
                </span>
              </td>
              <td class="py-3 px-2">
                <div class="font-semibold text-white">\${escapeHtml(d.name)}</div>
                <div class="mt-0.5">\${driverFlagHtml(d)}</div>
              </td>
              <td class="py-3 px-2 text-xs text-slate-300">\${escapeHtml(d.carName)}</td>
              <td class="py-3 px-2 font-mono text-xs">
                \${d.isInPits
                  ? '<span class="text-amber-400 font-bold">BOX</span>'
                  : ('<span class="text-slate-200 font-semibold">Sector ' + d.currentSector + '</span><span class="block text-[10px] text-slate-400">' + d.splinePct.toFixed(0) + '%</span>')}
              </td>
              <td class="py-3 px-2 min-w-[145px]">
                <div class="flex items-center gap-1.5 text-[10px] font-mono mb-1">
                  <span class="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-amber-400 font-bold">M:\${gearLabel(d.gear)}</span>
                  <span class="text-slate-300">Vol:\${(d.steerDeg > 0 ? '+' : '') + d.steerDeg}°</span>
                </div>
                <div class="space-y-1">
                  <div class="w-full h-1.5 bg-slate-950 rounded overflow-hidden" title="Acelerador \${d.throttlePct}%">
                    <div class="h-full bg-emerald-400" style="width: \${d.throttlePct}%"></div>
                  </div>
                  <div class="w-full h-1.5 bg-slate-950 rounded overflow-hidden" title="Freno \${d.brakePct}%">
                    <div class="h-full bg-red-500" style="width: \${d.brakePct}%"></div>
                  </div>
                </div>
              </td>
              <td class="py-3 px-2 font-mono text-xs">
                <span class="text-lsa-cyan font-bold">\${d.speedKmh} km/h</span>
                <span class="block text-[10px] text-slate-400">Máx: \${d.topSpeedKmh} km/h</span>
              </td>
              <td class="py-3 px-2 font-mono font-semibold text-emerald-400">
                \${escapeHtml(d.bestLapFormatted)}
                <span class="block text-[10px] font-normal text-slate-400">Compuesto: \${escapeHtml(d.tyres)}</span>
              </td>
              <td class="py-3 px-2 font-mono text-xs \${deltaColor}">
                \${escapeHtml(d.deltaToSelfFormatted)}
              </td>
              <td class="py-3 px-2 font-mono text-xs text-slate-300">\${escapeHtml(d.lastLapFormatted)}</td>
              <td class="py-3 px-2 font-mono text-xs text-slate-300">
                \${d.numLaps} vueltas
                \${d.incidentsCount > 0 ? \`<span class="block text-[10px] text-red-400">\${d.incidentsCount} incidente(s)</span>\` : ''}
              </td>
            </tr>
          \`;
        }).join('');
      }

      // Collisions Feed + Toast Notifications
      document.getElementById('collisions-count-badge').textContent = collisions.length + ' incidentes';
      const collisionsFeed = document.getElementById('collisions-feed');

      if (!isFirstCollisionLoad) {
        for (const c of collisions) {
          if (!seenCollisionIds.has(c.id)) {
            seenCollisionIds.add(c.id);
            showCollisionToast(c);
          }
        }
      } else {
        collisions.forEach(c => seenCollisionIds.add(c.id));
        isFirstCollisionLoad = false;
      }

      if (collisions.length === 0) {
        collisionsFeed.innerHTML = \`
          <div class="py-6 text-center text-sm text-slate-400 bg-slate-950/50 rounded-xl border border-slate-800/60">
            Sin choques ni incidentes registrados en esta sesión.
          </div>
        \`;
      } else {
        collisionsFeed.innerHTML = collisions.map(c => {
          const z = Array.isArray(c.damageZones) ? c.damageZones : [0, 0, 0, 0];
          return \`
            <div class="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/85 border border-red-500/30">
              <div class="space-y-0.5">
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/40">
                    SECTOR \${c.sector}
                  </span>
                  <span class="font-bold text-sm text-white">\${escapeHtml(c.driverName)}</span>
                  <span class="text-xs text-slate-400">(\${escapeHtml(c.carName)})</span>
                </div>
                <div class="text-xs text-slate-300">
                  \${escapeHtml(c.typeLabel)} • Velocidad de impacto: <strong class="font-mono text-amber-400">\${c.speedKmh} km/h</strong>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <div class="grid grid-cols-2 gap-1 text-[10px] font-mono">
                  <span class="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 \${z[0] > 0 ? 'text-red-400' : 'text-slate-500'}">Frente: \${Math.round(z[0])}</span>
                  <span class="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 \${z[1] > 0 ? 'text-red-400' : 'text-slate-500'}">Atrás: \${Math.round(z[1])}</span>
                  <span class="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 \${z[2] > 0 ? 'text-amber-400' : 'text-slate-500'}">Izq: \${Math.round(z[2])}</span>
                  <span class="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 \${z[3] > 0 ? 'text-amber-400' : 'text-slate-500'}">Der: \${Math.round(z[3])}</span>
                </div>
                <span class="text-xs font-mono text-slate-400">\${escapeHtml(c.timeFormatted)}</span>
              </div>
            </div>
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
    }

    function connectRealtimeStream() {
      const es = new EventSource('/api/live/stream');
      es.onmessage = (event) => {
        try {
          const state = JSON.parse(event.data);
          renderLiveState(state);
        } catch (err) {
          console.error('Error parseando stream SSE:', err);
        }
      };
      es.onerror = () => {
        // EventSource reconecta automáticamente
      };
    }

    async function fetchLiveSnapshotFallback() {
      try {
        const res = await fetch('/api/live');
        const state = await res.json();
        renderLiveState(state);
      } catch {
        // Ignorar si reconectando
      }
    }

    window.addEventListener('DOMContentLoaded', () => {
      if (window.lucide) lucide.createIcons();
      fetchLiveSnapshotFallback();
      connectRealtimeStream();
    });
  </script>
</body>
</html>`;

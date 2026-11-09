export const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="es" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>LATAM SimRacing Alliance — Live Timing Oficial</title>
  <link rel="icon" type="image/png" href="/logo.png" />

  <!-- Google Fonts: Chakra Petch (Display), Saira (Body), JetBrains Mono (Telemetría) -->
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
            display: ['"Chakra Petch"', '"Arial Narrow"', 'sans-serif'],
            sans: ['Saira', '"Segoe UI"', 'Roboto', 'sans-serif'],
            mono: ['"JetBrains Mono"', 'monospace'],
          },
          colors: {
            lsa: {
              night: '#060A13',
              deck: '#0C1322',
              deck2: '#111A2D',
              wire: '#1D2940',
              ink: '#E8EEF7',
              mute: '#8D9AB0',
              cyan: '#23B6E0',
              gold: '#F2B92B',
              red: '#E3261B',
              violet: '#A24BFF',
            }
          }
        }
      }
    };
  </script>

  <style>
    :root {
      --night: #060A13;
      --deck: #0C1322;
      --deck2: #111A2D;
      --wire: #1D2940;
      --ink: #E8EEF7;
      --mute: #8D9AB0;
      --cyan: #23B6E0;
      --gold: #F2B92B;
      --red: #E3261B;
      --violet: #A24BFF;
      --display: "Chakra Petch", "Arial Narrow", Arial, sans-serif;
      --body: "Saira", "Segoe UI", Roboto, Arial, sans-serif;
      --cut: 16px;
    }

    body {
      background-color: var(--night);
      background-image:
        radial-gradient(60% 70% at 78% 30%, rgba(35, 182, 224, 0.12), transparent 60%),
        radial-gradient(50% 60% at 15% 80%, rgba(227, 38, 27, 0.10), transparent 60%),
        linear-gradient(to bottom, #060A13, #090E1A);
      color: var(--ink);
      font-family: var(--body);
      overflow-x: clip;
      margin: 0;
      -webkit-font-smoothing: antialiased;
    }

    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: var(--night); }
    ::-webkit-scrollbar-thumb { background: var(--wire); border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #2A4A7A; }

    /* Franja Tricolor Oficial LSA (Celeste - Dorado - Rojo) */
    .tri {
      height: 4px;
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      width: 100%;
    }
    .tri i:nth-child(1) { background: var(--cyan); }
    .tri i:nth-child(2) { background: var(--gold); }
    .tri i:nth-child(3) { background: var(--red); }

    /* Corte diagonal de carreras (16px) */
    .cut {
      clip-path: polygon(0 0, 100% 0, 100% calc(100% - var(--cut)), calc(100% - var(--cut)) 100%, 0 100%);
    }

    /* Palabra Tricolor en títulos */
    .tri-word {
      background: linear-gradient(90deg, #23B6E0 0 33%, #F2B92B 33% 66%, #E3261B 66%);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      font-style: italic;
    }

    /* Botón redondo oficial LSA (.pill) */
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      font: 700 13px var(--display);
      text-transform: uppercase;
      letter-spacing: .08em;
      padding: 9px 18px;
      border-radius: 999px;
      background: linear-gradient(180deg, #2a8fd8, #155fb0);
      color: #fff;
      box-shadow: 0 0 0 1px rgba(120, 190, 255, .35) inset, 0 8px 30px rgba(35, 140, 230, .35);
      transition: all 0.2s ease;
      cursor: pointer;
      white-space: nowrap;
    }
    .pill:hover {
      box-shadow: 0 0 0 1px rgba(160, 210, 255, .6) inset, 0 8px 40px rgba(35, 140, 230, .55);
      transform: translateY(-1px);
    }
    .pill.red {
      background: linear-gradient(180deg, #f0402f, #b5150c);
      box-shadow: 0 0 0 1px rgba(255, 150, 130, .35) inset, 0 8px 30px rgba(227, 38, 27, .35);
    }
    .pill.ghost {
      background: transparent;
      box-shadow: 0 0 0 1px var(--wire) inset;
      color: var(--ink);
    }
    .pill.ghost:hover {
      box-shadow: 0 0 0 1px var(--cyan) inset;
      color: #fff;
    }

    /* Etiqueta Kick con línea delante */
    .kick {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      font: 600 12px var(--display);
      letter-spacing: .24em;
      text-transform: uppercase;
      color: var(--cyan);
    }
    .kick::before {
      content: "";
      width: 28px;
      height: 1px;
      background: var(--cyan);
    }

    /* Cabecera y Menús */
    .site-nav-menu a, .site-nav-menu button {
      font: 600 13.5px var(--display);
      letter-spacing: .08em;
      text-transform: uppercase;
      color: var(--mute);
      padding: 10px 14px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: color 0.15s;
    }
    .site-nav-menu a:hover, .site-nav-menu button:hover {
      color: #fff;
    }
    .site-nav-menu .cur-page {
      color: #fff !important;
      box-shadow: inset 0 -2px 0 var(--red) !important;
    }

    /* Dropdown de Campeonatos */
    .nav-drop {
      display: none;
      position: absolute;
      left: 0;
      top: 100%;
      min-width: 280px;
      background: var(--deck);
      border: 1px solid var(--wire);
      padding: 8px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
      z-index: 50;
    }
    .nav-has-drop:hover .nav-drop, .nav-has-drop:focus-within .nav-drop {
      display: block;
    }
    .nav-drop a {
      display: grid !important;
      grid-template-columns: auto 1fr;
      gap: 2px 12px;
      padding: 12px !important;
      color: var(--ink) !important;
      text-transform: none !important;
      letter-spacing: 0 !important;
      border-radius: 4px;
    }
    .nav-drop a:hover {
      background: rgba(35, 182, 224, 0.08);
    }
    .nav-drop a b {
      font: 700 italic 16px var(--display);
      text-transform: uppercase;
      grid-row: span 2;
      align-self: center;
      color: #fff;
    }
    .nav-drop a span {
      font-size: 13px;
      color: var(--mute);
    }
    .nav-drop a i {
      font-style: normal;
      font-size: 11.5px;
      color: var(--cyan);
    }

    /* Social circle buttons */
    .soc-btn {
      display: grid;
      place-items: center;
      width: 36px;
      height: 36px;
      border: 1px solid var(--wire);
      border-radius: 999px;
      color: var(--mute);
      transition: all 0.2s;
    }
    .soc-btn:hover {
      color: #fff;
      border-color: var(--cyan);
      box-shadow: 0 0 16px rgba(35, 182, 224, 0.35);
    }

    /* Tarjetas y Paneles Oficiales */
    .lsa-panel {
      background: var(--deck);
      border: 1px solid var(--wire);
    }
    .lsa-panel2 {
      background: var(--deck2);
      border: 1px solid var(--wire);
    }

    /* Telemetry Map Viewport & Smooth Markers */
    .map-viewport {
      position: relative;
      width: 100%;
      height: 620px;
      background: radial-gradient(circle at center, #0F172A 0%, #060A13 100%);
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
      max-height: 580px;
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
      border: 1px solid var(--wire);
      border-radius: 5px;
      padding: 1px 6px;
      display: flex;
      align-items: center;
      gap: 5px;
      white-space: nowrap;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
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
      border: 2px solid var(--red);
      background: rgba(227, 38, 27, 0.25);
      transform: translate(-50%, -50%);
      animation: pingSlow 1.1s infinite;
    }
    @keyframes pingSlow {
      0% { transform: translate(-50%, -50%) scale(0.8); opacity: 1; }
      100% { transform: translate(-50%, -50%) scale(2.2); opacity: 0; }
    }
  </style>
</head>
<body class="min-h-screen flex flex-col selection:bg-lsa-cyan selection:text-slate-950">

  <!-- FRANJA TRICOLOR SUPERIOR (LSA) -->
  <div class="tri"><i></i><i></i><i></i></div>

  <!-- BARRA DE ESTADO TÉCNICO & TELEMETRÍA SUPERIOR -->
  <div class="bg-[#060A13]/95 border-b border-lsa-wire text-xs py-1.5 px-4 text-lsa-mute">
    <div class="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <span id="ws-indicator" class="inline-flex items-center" title="Stream de telemetría en vivo">
          <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
        </span>
        <span>Servidor: <strong id="top-server-name" class="text-white">Cargando servidor...</strong></span>
        <span class="hidden md:inline text-lsa-wire">|</span>
        <span class="hidden md:inline">Circuito: <strong id="top-track-name" class="text-lsa-cyan">—</strong></span>
      </div>
      <div class="flex items-center gap-4 font-mono text-[11.5px]">
        <span>Ambiente: <strong id="top-ambient" class="text-lsa-gold">--°C</strong></span>
        <span>Pista: <strong id="top-road" class="text-lsa-gold">--°C</strong></span>
        <span>Contraseña: <button onclick="copyServerPassword()" class="text-lsa-cyan hover:underline font-bold" id="top-pass" title="Click para copiar contraseña">LaTaM2026</button></span>
      </div>
    </div>
  </div>

  <!-- CABECERA PRINCIPAL (header.site LSA Style) -->
  <header class="sticky top-0 z-40 bg-[#060A13]/95 backdrop-blur-md border-b border-lsa-wire shadow-2xl">
    <div class="max-w-[1720px] mx-auto px-4 sm:px-6 h-[66px] flex items-center justify-between gap-4">
      
      <!-- LOGO LSA HORIZONTAL CON MIX-BLEND-MODE -->
      <div class="flex items-center gap-4">
        <a href="https://latamsimracing.com/" class="block">
          <img
            src="https://latamsimracing.com/wp-content/uploads/2026/10/lsa-logo-horizontal.jpg"
            alt="Latam Simracing Alliance"
            class="h-[44px] w-auto mix-blend-lighten object-contain"
            onerror="this.src='/logo.png'"
          />
        </a>
      </div>

      <!-- MENÚ DE NAVEGACIÓN PRINCIPAL (Alineado con latamsimracing.com) -->
      <nav class="hidden lg:flex items-center gap-1 site-nav-menu">
        <a href="https://latamsimracing.com/">Inicio</a>
        
        <!-- Desplegable Campeonatos -->
        <div class="relative nav-has-drop">
          <button type="button">
            Campeonatos <i data-lucide="chevron-down" class="w-3.5 h-3.5 opacity-70"></i>
          </button>
          <div class="nav-drop cut">
            <a href="https://latamsimracing.com/campeonato-gt3-2026/">
              <b>GT3</b>
              <span>Campeonato GT3 2026</span>
              <i>Assetto Corsa Competizione ›</i>
            </a>
            <a href="https://latamsimracing.com/campeonato-ginetta-gt4/">
              <b>GT4</b>
              <span>Ginetta GT4 Cup</span>
              <i>Assetto Corsa ›</i>
            </a>
          </div>
        </div>

        <!-- Live Timing (Página actual activa con punto rojo pulsante) -->
        <a href="/" class="cur-page" aria-current="page">
          <span class="relative flex h-2 w-2 mr-1">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-lsa-red"></span>
          </span>
          Live Timing
        </a>

        <a href="https://latamsimracing.com/reglamento/">Reglamento</a>
      </nav>

      <!-- ACCIONES: BOTÓN 1-CLICK Y REDES SOCIALES -->
      <div class="flex items-center gap-3">
        <!-- Botón Entrar a Pista (Content Manager) -->
        <a id="btn-join-cm" href="https://acstuff.club/s/q:race/online/join?ip=24.152.39.252&httpPort=8520&password=flV6UHgAHgEP" class="pill" title="Entrar a Pista directamente con Content Manager">
          <i data-lucide="zap" class="w-4 h-4 text-amber-300"></i>
          <span>Entrar a Pista</span>
        </a>

        <!-- Redes Sociales -->
        <div class="hidden sm:flex items-center gap-1.5 pl-2 border-l border-lsa-wire">
          <a href="https://discord.gg/V9hq2EBSA" target="_blank" rel="noopener" class="soc-btn" title="Discord Oficial LSA">
            <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
          </a>
          <a href="https://www.instagram.com/latam_simracing_alliance/" target="_blank" rel="noopener" class="soc-btn" title="Instagram Oficial LSA">
            <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
          </a>
        </div>
      </div>
    </div>
  </header>

  <!-- CONTENIDO PRINCIPAL -->
  <main class="flex-1 max-w-[1720px] w-full mx-auto px-4 sm:px-6 py-5 space-y-6">

    <!-- HERO CIRCUIT & SESSION BANNER (.cut) -->
    <div class="relative lsa-panel2 cut overflow-hidden shadow-2xl">
      <div id="hero-bg" class="absolute inset-0 bg-cover bg-center opacity-15 transition-all duration-700"></div>
      <div class="absolute inset-0 bg-gradient-to-r from-lsa-night via-lsa-night/95 to-lsa-night/75"></div>

      <div class="relative z-10 p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div class="space-y-2.5">
          <div class="flex flex-wrap items-center gap-2.5">
            <span class="kick">TELEMETRÍA OFICIAL</span>
            <span id="live-session-badge" class="px-3 py-0.5 rounded-full text-xs font-display italic font-bold uppercase tracking-wider bg-lsa-cyan/15 text-lsa-cyan border border-lsa-cyan/40">
              PRÁCTICA
            </span>
            <span id="live-location-badge" class="px-2.5 py-0.5 text-xs font-medium bg-lsa-deck text-lsa-mute border border-lsa-wire">
              Cargando ubicación...
            </span>
            <span id="live-length-badge" class="px-2.5 py-0.5 text-xs font-mono bg-lsa-deck text-lsa-mute border border-lsa-wire">
              -- m
            </span>
          </div>

          <h1 id="live-track-title" class="font-display italic font-bold text-3xl sm:text-4xl text-white tracking-wide uppercase leading-tight">
            Conectando con el <span class="tri-word">SERVIDOR</span>
          </h1>

          <div class="flex flex-wrap items-center gap-6 text-xs text-lsa-mute pt-1">
            <span class="flex items-center gap-2">
              <i data-lucide="clock" class="w-4 h-4 text-lsa-cyan"></i>
              Tiempo Restante: <strong id="live-remaining" class="font-mono text-white text-base font-bold">--:--</strong>
            </span>
            <span class="flex items-center gap-2">
              <i data-lucide="users" class="w-4 h-4 text-lsa-cyan"></i>
              Pilotos en Pista: <strong id="live-drivers-count" class="font-mono text-white text-sm">0</strong>
            </span>
            <span class="flex items-center gap-2">
              <i data-lucide="zap" class="w-4 h-4 text-lsa-violet"></i>
              Vuelta Rápida: <strong id="live-fastest-session" class="font-mono text-lsa-violet text-sm">—</strong>
            </span>
            <span class="flex items-center gap-2">
              <i data-lucide="alert-triangle" class="w-4 h-4 text-lsa-red"></i>
              Incidentes: <strong id="live-incidents-total" class="font-mono text-lsa-gold text-sm">0</strong>
            </span>
          </div>
        </div>

        <!-- Session Status Pill & Clock -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3 font-mono text-xs text-lsa-mute">
          <!-- LIVE TRACK FLAG BANNER -->
          <div id="header-flag-banner" class="flex items-center gap-2.5 px-4 py-2 border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 transition-all">
            <span id="header-flag-dot" class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <div>
              <div id="header-flag-title" class="font-display italic font-bold text-xs uppercase tracking-wider leading-tight">PISTA LIBRE</div>
            </div>
          </div>
          <div class="bg-lsa-deck/90 border border-lsa-wire px-3.5 py-2">
            <span>Hora: <strong id="live-updated-clock" class="text-white">--:--:--</strong></span>
          </div>
        </div>
      </div>
    </div>

    <!-- MAIN TWO-COLUMN LAYOUT -->
    <div class="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

      <!-- COLUMNA IZQUIERDA: MAPA GPS EN VIVO + CHAT DEL JUEGO / LOGS -->
      <div class="xl:col-span-5 flex flex-col gap-6">

        <!-- MAPA GPS EN VIVO -->
        <div class="lsa-panel cut p-4 flex flex-col">
          <div class="flex items-center justify-between pb-3 mb-2 border-b border-lsa-wire">
            <div class="kick">RADAR GPS EN TIEMPO REAL</div>
            <span class="text-xs font-mono text-lsa-mute">Assetto Corsa</span>
          </div>

          <div class="map-viewport border border-lsa-wire">
            <div class="map-grid-overlay"></div>

            <!-- Controles flotantes de Zoom -->
            <div class="absolute top-3 right-3 z-30 flex items-center gap-1 bg-black/85 backdrop-blur border border-lsa-wire p-1">
              <button onclick="adjustMapZoom(-0.2)" class="px-2 py-1 text-xs font-mono text-slate-300 hover:text-white hover:bg-lsa-deck2 rounded" title="Alejar">-</button>
              <button onclick="resetMapZoom()" id="map-zoom-label" class="px-2 py-1 text-xs font-mono text-lsa-cyan hover:bg-lsa-deck2 rounded" title="Restaurar Zoom">100%</button>
              <button onclick="adjustMapZoom(0.2)" class="px-2 py-1 text-xs font-mono text-slate-300 hover:text-white hover:bg-lsa-deck2 rounded" title="Acercar">+</button>
            </div>

            <!-- Bandera Flotante en el Mapa -->
            <div id="map-flag-pill" class="absolute top-3 left-3 z-30 flex items-center gap-2 px-3 py-1.5 text-xs font-mono font-bold bg-black/85 backdrop-blur border border-emerald-500/40 text-emerald-400">
              <span id="map-flag-dot" class="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span id="map-flag-text">PISTA LIBRE</span>
            </div>

            <!-- Capa de Zoom y Trazado -->
            <div id="map-zoom-layer">
              <div id="map-wrapper">
                <img id="map-img" src="" alt="Trazado del circuito" />
                <div id="map-markers-overlay"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- TABS: CHAT DEL JUEGO / LOGS DEL SERVIDOR -->
        <div class="lsa-panel cut p-4 flex flex-col">
          <div class="flex items-center justify-between border-b border-lsa-wire pb-3 mb-3">
            <div class="flex items-center gap-2">
              <button id="tab-btn-chat" onclick="switchLeftTab('chat')" class="px-3 py-1 text-xs font-display italic font-bold uppercase tracking-wider bg-lsa-cyan/15 text-lsa-cyan border border-lsa-cyan/40 flex items-center gap-1.5">
                <i data-lucide="message-square" class="w-3.5 h-3.5"></i>
                CHAT EN PISTA
              </button>
              <button id="tab-btn-logs" onclick="switchLeftTab('logs')" class="px-3 py-1 text-xs font-display italic font-bold uppercase tracking-wider text-lsa-mute hover:text-white border border-transparent flex items-center gap-1.5">
                <i data-lucide="terminal" class="w-3.5 h-3.5"></i>
                EVENTOS / SANCIONES
              </button>
            </div>
            <span id="chat-count-badge" class="text-[11px] font-mono text-lsa-mute">0 msgs</span>
          </div>

          <!-- PANE DE CHAT -->
          <div id="tab-content-chat" class="flex flex-col">
            <div id="chat-messages-container" class="h-64 overflow-y-auto space-y-2 pr-1 font-mono text-xs">
              <div class="text-lsa-mute italic py-8 text-center">Esperando mensajes en el chat del juego...</div>
            </div>
          </div>

          <!-- PANE DE LOGS -->
          <div id="tab-content-logs" class="hidden flex flex-col">
            <div id="server-logs-container" class="h-64 overflow-y-auto space-y-2 pr-1 font-mono text-xs">
              <div class="text-lsa-mute italic py-8 text-center">No hay eventos ni incidentes registrados en esta sesión.</div>
            </div>
          </div>
        </div>

      </div>

      <!-- COLUMNA DERECHA: CLASIFICACIÓN EN VIVO + TIEMPOS ACUMULADOS -->
      <div class="xl:col-span-7 flex flex-col gap-6">

        <!-- 1. TABLA DE CLASIFICACIÓN EN VIVO -->
        <div class="lsa-panel cut p-5">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-lsa-wire">
            <div>
              <div class="kick">TABLA DE POSICIONES</div>
              <h2 class="font-display italic font-bold text-xl sm:text-2xl text-white uppercase flex items-center gap-2">
                <span class="text-lsa-red">›</span> CLASIFICACIÓN <span class="tri-word">EN VIVO</span>
              </h2>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-lsa-wire text-[11px] font-display font-semibold uppercase tracking-wider text-lsa-mute">
                  <th class="py-2.5 px-2 text-center">Pos</th>
                  <th class="py-2.5 px-2">Piloto</th>
                  <th class="py-2.5 px-2 text-center">Marcha</th>
                  <th class="py-2.5 px-2">Vehículo</th>
                  <th class="py-2.5 px-2">Compuesto</th>
                  <th class="py-2.5 px-2">Mejor Vuelta</th>
                  <th class="py-2.5 px-2">Delta</th>
                  <th class="py-2.5 px-2">Última</th>
                  <th class="py-2.5 px-2 text-center">Vtas</th>
                  <th class="py-2.5 px-2">Velocidad</th>
                  <th class="py-2.5 px-2 text-center">Estado</th>
                </tr>
              </thead>
              <tbody id="live-drivers-tbody" class="divide-y divide-lsa-wire/70 text-sm">
                <tr>
                  <td colspan="11" class="py-10 text-center text-lsa-mute font-mono">
                    No hay pilotos en pista en este momento.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 2. TIEMPOS ACUMULADOS DE LA SESIÓN -->
        <div class="lsa-panel cut p-5">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-lsa-wire">
            <div>
              <div class="kick">TELEMETRÍA ACUMULADA</div>
              <h2 class="font-display italic font-bold text-lg sm:text-xl text-white uppercase flex items-center gap-2">
                <span class="text-lsa-red">›</span> MEJORES TIEMPOS DE LA <span class="tri-word">SESIÓN</span>
              </h2>
              <p class="text-xs text-lsa-mute mt-0.5">Ranking de vueltas rápidas de todos los pilotos que han rodado</p>
            </div>
            <span id="stored-times-count" class="text-xs font-mono text-lsa-mute bg-lsa-deck2 border border-lsa-wire px-3 py-1">
              0 tiempos
            </span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-lsa-wire text-[11px] font-display font-semibold uppercase tracking-wider text-lsa-mute">
                  <th class="py-2.5 px-2 text-center">#</th>
                  <th class="py-2.5 px-2">Piloto</th>
                  <th class="py-2.5 px-2">Vehículo</th>
                  <th class="py-2.5 px-2">Compuesto</th>
                  <th class="py-2.5 px-2">Mejor Tiempo</th>
                  <th class="py-2.5 px-2">Última Vuelta</th>
                  <th class="py-2.5 px-2 text-center">Vueltas</th>
                  <th class="py-2.5 px-2">Vel. Punta</th>
                  <th class="py-2.5 px-2 text-center">Estado</th>
                </tr>
              </thead>
              <tbody id="stored-times-tbody" class="divide-y divide-lsa-wire/70 text-sm">
                <tr>
                  <td colspan="9" class="py-6 text-center text-lsa-mute font-mono text-xs">
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

  <!-- FRANJA TRICOLOR INFERIOR -->
  <div class="tri mt-8"><i></i><i></i><i></i></div>

  <!-- PIE DE PÁGINA OFICIAL (.lsfoot) -->
  <footer class="bg-[#060A13] border-t border-lsa-wire py-8 text-lsa-mute text-xs">
    <div class="max-w-[1720px] mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <img
          src="https://latamsimracing.com/wp-content/uploads/2026/10/lsa-logo-horizontal.jpg"
          alt="LSA"
          class="h-[34px] w-auto mix-blend-lighten object-contain"
          onerror="this.src='/logo.png'"
        />
        <span>© 2026 LATAM SimRacing Alliance · Telemetría Oficial y Live Timing</span>
      </div>
      <div class="flex flex-wrap items-center gap-5 font-display uppercase tracking-wider text-[12px]">
        <a href="https://latamsimracing.com/" class="hover:text-white transition-colors">Web Oficial</a>
        <a href="https://discord.gg/V9hq2EBSA" target="_blank" rel="noopener" class="hover:text-white transition-colors">Discord</a>
        <a href="https://www.instagram.com/latam_simracing_alliance/" target="_blank" rel="noopener" class="hover:text-white transition-colors">Instagram</a>
        <a href="https://latamsimracing.com/reglamento/" class="hover:text-white transition-colors">Reglamento Deportivo</a>
      </div>
    </div>
  </footer>

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
      if (g === 'N') return 'bg-[#F2B92B] text-slate-950 font-bold';
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
        chatBtn.className = 'px-3 py-1 text-xs font-display italic font-bold uppercase tracking-wider bg-lsa-cyan/15 text-lsa-cyan border border-lsa-cyan/40 flex items-center gap-1.5';
        logsBtn.className = 'px-3 py-1 text-xs font-display italic font-bold uppercase tracking-wider text-lsa-mute hover:text-white border border-transparent flex items-center gap-1.5';
        chatContent.classList.remove('hidden');
        logsContent.classList.add('hidden');
      } else {
        logsBtn.className = 'px-3 py-1 text-xs font-display italic font-bold uppercase tracking-wider bg-lsa-gold/15 text-lsa-gold border border-lsa-gold/40 flex items-center gap-1.5';
        chatBtn.className = 'px-3 py-1 text-xs font-display italic font-bold uppercase tracking-wider text-lsa-mute hover:text-white border border-transparent flex items-center gap-1.5';
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

      // Join button URL
      const joinBtn = document.getElementById('btn-join-cm');
      if (joinBtn && state.joinUrl) {
        joinBtn.href = state.joinUrl;
      }

      // Hero banner
      document.getElementById('live-session-badge').textContent = state.sessionType || 'Práctica';
      document.getElementById('live-location-badge').textContent = [state.trackCity, state.trackCountry].filter(Boolean).join(', ') || 'En línea';
      document.getElementById('live-length-badge').textContent = state.trackLength || '-- m';
      
      const trackTitleEl = document.getElementById('live-track-title');
      if (trackTitleEl) {
        const titleText = (state.trackTitle || state.trackId || 'Circuito en vivo').toUpperCase();
        trackTitleEl.innerHTML = escapeHtml(titleText);
      }

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
      try { renderClassificationTable(state.drivers || [], fastestLap); } catch (e) { console.error('Error in renderClassificationTable:', e); }

      // Render stored times
      try { renderStoredTimesTable(state.storedTimes || [], fastestLap); } catch (e) { console.error('Error in renderStoredTimesTable:', e); }

      // Render in-game chat and server logs
      try { renderChat(state.chat || []); } catch (e) { console.error('Error in renderChat:', e); }
      try { renderServerLogs(state.serverLogs || []); } catch (e) { console.error('Error in renderServerLogs:', e); }

      try { if (window.lucide) lucide.createIcons(); } catch (e) {}
    }

    function updateFlagBanners(state) {
      const banner = document.getElementById('header-flag-banner');
      const dot = document.getElementById('header-flag-dot');
      const title = document.getElementById('header-flag-title');
      const pill = document.getElementById('map-flag-pill');
      const pillDot = document.getElementById('map-flag-dot');
      const pillText = document.getElementById('map-flag-text');

      if (title) title.textContent = state.trackFlagTitle || 'PISTA LIBRE';

      if (state.trackFlag === 'yellow') {
        if (banner) banner.className = 'flex items-center gap-2.5 px-4 py-2 border bg-amber-500/15 border-amber-500/40 text-amber-300 transition-all';
        if (dot) dot.className = 'w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping';
        if (pill) pill.className = 'absolute top-3 left-3 z-30 flex items-center gap-2 px-3 py-1.5 text-xs font-display italic font-bold bg-[#060A13]/90 backdrop-blur border border-amber-500/40 text-amber-400';
        if (pillDot) pillDot.className = 'w-2 h-2 rounded-full bg-amber-400 animate-ping';
        if (pillText) pillText.textContent = 'AMARILLA S' + (state.yellowSectors || []).join(',');
      } else if (state.trackFlag === 'checkered') {
        if (banner) banner.className = 'flex items-center gap-2.5 px-4 py-2 border bg-purple-500/15 border-purple-500/40 text-purple-300 transition-all';
        if (dot) dot.className = 'w-2.5 h-2.5 rounded-full bg-purple-400';
        if (pill) pill.className = 'absolute top-3 left-3 z-30 flex items-center gap-2 px-3 py-1.5 text-xs font-display italic font-bold bg-[#060A13]/90 backdrop-blur border border-purple-500/40 text-purple-400';
        if (pillDot) pillDot.className = 'w-2 h-2 rounded-full bg-purple-400';
        if (pillText) pillText.textContent = 'BANDERA A CUADROS';
      } else {
        if (banner) banner.className = 'flex items-center gap-2.5 px-4 py-2 border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 transition-all';
        if (dot) dot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-400';
        if (pill) pill.className = 'absolute top-3 left-3 z-30 flex items-center gap-2 px-3 py-1.5 text-xs font-display italic font-bold bg-[#060A13]/90 backdrop-blur border border-emerald-500/30 text-emerald-400';
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

    function renderClassificationTable(drivers, fastestLap) {
      const tbody = document.getElementById('live-drivers-tbody');
      if (!tbody) return;

      if (!drivers || drivers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" class="py-10 text-center text-lsa-mute font-mono">No hay pilotos en pista en este momento.</td></tr>';
        return;
      }

      let html = '';
      drivers.forEach(d => {
        const isPits = d.isInPits;
        const gDisplay = d.gearDisplay || formatGear(d.gear);
        const gearColor = gearBadgeClass(gDisplay);
        const isFastestInSession = fastestLap && d.bestLapMs > 0 && d.bestLapMs === fastestLap.bestLapMs;

        // Podio colors
        let posBadge = \`<span class="font-display italic font-bold text-base">\${d.position ?? '-'}</span>\`;
        if (d.position === 1) {
          posBadge = \`<span class="font-display italic font-bold text-lg text-[#F2B92B]">1</span>\`;
        } else if (d.position === 2) {
          posBadge = \`<span class="font-display italic font-bold text-lg text-[#C9D3DF]">2</span>\`;
        } else if (d.position === 3) {
          posBadge = \`<span class="font-display italic font-bold text-lg text-[#D9863F]">3</span>\`;
        }

        const driverColor = d.color || '#23B6E0';

        html += \`
          <tr class="hover:bg-white/[0.03] transition-colors">
            <td class="py-2.5 px-2 text-center">
              \${posBadge}
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
            <td class="py-2.5 px-2 font-mono text-xs font-bold \${isFastestInSession ? 'text-lsa-violet' : (d.bestLapMs > 0 ? 'text-emerald-400' : 'text-slate-500')}">
              \${escapeHtml(d.bestLapFormatted)}
              \${isFastestInSession ? '<span class="ml-1 text-[10px] px-1 py-0.2 rounded bg-purple-500/20 text-lsa-violet uppercase">VR</span>' : ''}
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
                ? '<span class="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#F2B92B]/15 text-[#F2B92B] border border-[#F2B92B]/30">EN BOXES</span>'
                : '<span class="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">EN PISTA</span>'
              }
            </td>
          </tr>
        \`;
      });

      tbody.innerHTML = html;
    }

    function renderStoredTimesTable(storedTimes, fastestLap) {
      const tbody = document.getElementById('stored-times-tbody');
      const countEl = document.getElementById('stored-times-count');
      if (!tbody) return;

      if (countEl) countEl.textContent = (storedTimes ? storedTimes.length : 0) + ' tiempos';

      if (!storedTimes || storedTimes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="py-6 text-center text-lsa-mute font-mono text-xs">No hay tiempos registrados en esta sesión aún.</td></tr>';
        return;
      }

      let html = '';
      storedTimes.slice(0, 25).forEach((t, idx) => {
        const isFastestInSession = fastestLap && t.bestLapMs > 0 && t.bestLapMs === fastestLap.bestLapMs;
        let posHtml = \`<span class="text-lsa-mute">#\${idx + 1}</span>\`;
        if (idx === 0) posHtml = \`<span class="text-[#F2B92B] font-bold">1.º</span>\`;
        else if (idx === 1) posHtml = \`<span class="text-[#C9D3DF] font-bold">2.º</span>\`;
        else if (idx === 2) posHtml = \`<span class="text-[#D9863F] font-bold">3.º</span>\`;

        html += \`
          <tr class="hover:bg-white/[0.03] font-mono text-xs transition-colors">
            <td class="py-2 px-2 text-center">\${posHtml}</td>
            <td class="py-2 px-2 font-bold text-white">\${escapeHtml(t.name)}</td>
            <td class="py-2 px-2 text-slate-300">\${escapeHtml(t.carName)}</td>
            <td class="py-2 px-2 text-lsa-mute">\${escapeHtml(t.tyres)}</td>
            <td class="py-2 px-2 font-bold \${isFastestInSession ? 'text-lsa-violet' : 'text-emerald-400'}">
              \${escapeHtml(t.bestLapFormatted)}
              \${isFastestInSession ? '<span class="ml-1 text-[10px] px-1 py-0.2 rounded bg-purple-500/20 text-lsa-violet uppercase">VR</span>' : ''}
            </td>
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
        container.innerHTML = '<div class="text-lsa-mute italic py-8 text-center">Esperando mensajes en el chat del juego...</div>';
        return;
      }

      let html = '';
      chatList.forEach(c => {
        html += \`
          <div class="bg-lsa-deck border border-lsa-wire p-2.5">
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
        container.innerHTML = '<div class="text-lsa-mute italic py-8 text-center">No hay eventos ni incidentes registrados en esta sesión.</div>';
        return;
      }

      let html = '';
      serverLogs.forEach(l => {
        const isImpact = l.type === 'Incidente';
        const isPenalty = l.type === 'Sanción';
        const badgeColor = isImpact ? 'text-[#E3261B] bg-[#E3261B]/10 border-[#E3261B]/30' : isPenalty ? 'text-[#F2B92B] bg-[#F2B92B]/10 border-[#F2B92B]/30' : 'text-[#23B6E0] bg-[#23B6E0]/10 border-[#23B6E0]/30';

        html += \`
          <div class="bg-lsa-deck border border-lsa-wire p-2.5">
            <div class="flex items-center justify-between text-[11px] mb-1">
              <span class="px-1.5 py-0.2 border text-[10px] font-bold font-display uppercase tracking-wider \${badgeColor}">\${escapeHtml(l.type)}</span>
              <span class="text-slate-500 text-[10px] font-mono">\${escapeHtml(l.timeFormatted)}</span>
            </div>
            <div class="text-white font-semibold text-xs">\${escapeHtml(l.driverName ? (l.driverName + ' — ' + l.name) : l.name)}</div>
            \${l.context ? \`<div class="text-[11px] text-lsa-mute mt-0.5 font-mono">\${escapeHtml(l.context)}</div>\` : ''}
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

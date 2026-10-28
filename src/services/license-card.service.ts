import { createCanvas, loadImage } from '@napi-rs/canvas';
import type { DriverProfileSummary } from './emperor.service.js';

export async function generateDriverLicenseCard(
  profile: DriverProfileSummary,
  avatarUrl?: string
): Promise<Buffer> {
  const width = 850;
  const height = 480;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Fondo con degradado moderno oscuro estilo Motorsport
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#0c1017');
  bgGrad.addColorStop(0.5, '#131b26');
  bgGrad.addColorStop(1, '#090d13');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Decoración de líneas de velocidad en el fondo
  ctx.save();
  ctx.strokeStyle = 'rgba(46, 204, 113, 0.08)';
  ctx.lineWidth = 2;
  for (let x = -200; x < width + 200; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 180, height);
    ctx.stroke();
  }
  ctx.restore();

  // Borde exterior neon con esquinas redondeadas
  ctx.save();
  ctx.lineWidth = 3;
  const borderGrad = ctx.createLinearGradient(0, 0, width, 0);
  borderGrad.addColorStop(0, '#00f2fe');
  borderGrad.addColorStop(0.5, '#4facfe');
  borderGrad.addColorStop(1, '#00f2fe');
  ctx.strokeStyle = borderGrad;
  ctx.strokeRect(10, 10, width - 20, height - 20);
  ctx.restore();

  // Barra superior de encabezado
  ctx.fillStyle = '#0a192f';
  ctx.fillRect(15, 15, width - 30, 65);
  ctx.fillStyle = '#4facfe';
  ctx.fillRect(15, 78, width - 30, 3);

  // Texto Encabezado
  ctx.font = 'bold 22px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('SUPERLICENCIA OFICIAL DE SIM RACING', 35, 52);

  ctx.font = 'bold 13px sans-serif';
  ctx.fillStyle = '#00f2fe';
  ctx.fillText('LATAM SIMRACING ALLIANCE • ASSETTO CORSA', width - 370, 52);

  // Cargar Avatar o placeholder
  const avatarX = 40;
  const avatarY = 110;
  const avatarSize = 130;

  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  let avatarLoaded = false;
  if (avatarUrl) {
    try {
      const img = await loadImage(avatarUrl);
      ctx.drawImage(img, avatarX, avatarY, avatarSize, avatarSize);
      avatarLoaded = true;
    } catch {
      avatarLoaded = false;
    }
  }

  if (!avatarLoaded) {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
    ctx.font = 'bold 45px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.fillText(profile.driverName.charAt(0).toUpperCase() || 'P', avatarX + avatarSize / 2, avatarY + avatarSize / 2 + 16);
    ctx.textAlign = 'start';
  }
  ctx.restore();

  // Borde circular del avatar
  ctx.save();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#00f2fe';
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Datos del Piloto al lado del avatar
  ctx.font = 'bold 32px sans-serif';
  ctx.fillStyle = '#ffffff';
  const displayName = profile.driverName.length > 18
    ? profile.driverName.substring(0, 18) + '...'
    : profile.driverName;
  ctx.fillText(displayName, 195, 150);

  ctx.font = 'bold 15px sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`CIRCUITO HABITUAL: ${profile.trackName.toUpperCase()}`, 195, 180);

  // Rating / Insignia de Categoría
  const cleanRate = profile.totalLaps > 0
    ? Math.round((profile.cleanLaps / profile.totalLaps) * 100)
    : 100;

  let badgeColor = '#22c55e';
  let badgeTitle = 'PILOTO PRO';
  if (cleanRate < 75 || profile.totalLaps < 15) {
    badgeColor = '#f59e0b';
    badgeTitle = 'PILOTO CLUB';
  }
  if (cleanRate < 55) {
    badgeColor = '#ef4444';
    badgeTitle = 'PILOTO ROOKIE';
  }

  ctx.fillStyle = badgeColor;
  ctx.fillRect(195, 200, 190, 30);
  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = '#000000';
  ctx.fillText(badgeTitle, 215, 221);

  // Panel de Estadísticas (Cajas derecha e inferior)
  const drawStatBox = (
    title: string,
    value: string,
    subValue: string,
    x: number,
    y: number,
    w: number,
    h: number,
    accentColor: string
  ) => {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(x, y, w, h);

    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.strokeRect(x, y, w, h);

    // Barra de color lateral
    ctx.fillStyle = accentColor;
    ctx.fillRect(x, y, 4, h);

    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(title.toUpperCase(), x + 15, y + 24);

    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(value, x + 15, y + 54);

    ctx.font = '11px sans-serif';
    ctx.fillStyle = accentColor;
    ctx.fillText(subValue, x + 15, y + 74);
  };

  // 4 Cajas de Estadísticas
  drawStatBox(
    'Mejor Vuelta',
    profile.bestLapFormatted,
    profile.bestLapCar.length > 22 ? profile.bestLapCar.substring(0, 20) + '..' : profile.bestLapCar,
    420,
    110,
    390,
    88,
    '#38bdf8'
  );

  drawStatBox(
    'Vueltas Completadas',
    `${profile.totalLaps} vueltas`,
    `${profile.cleanLaps} limpias (${cleanRate}%)`,
    420,
    215,
    390,
    88,
    '#4ade80'
  );

  drawStatBox(
    'Vuelta Óptima',
    profile.optimalLapFormatted || profile.bestLapFormatted,
    'Suma de mejores parciales S1+S2+S3',
    40,
    270,
    360,
    88,
    '#a855f7'
  );

  drawStatBox(
    'Incidentes / Contactos',
    `${profile.totalIncidents} incidentes`,
    profile.totalIncidents === 0 ? 'Conducción impecable' : 'Registrados en servidor',
    40,
    370,
    360,
    80,
    profile.totalIncidents === 0 ? '#4ade80' : '#fb923c'
  );

  // Auto Favorito abajo a la derecha
  const topCar = profile.carsUsed[0]?.carModel || profile.bestLapCar || 'Assetto Corsa GT3';
  drawStatBox(
    'Auto Principal',
    topCar.length > 20 ? topCar.substring(0, 18) + '...' : topCar,
    'Más vueltas registradas en pista',
    420,
    320,
    390,
    80,
    '#f43f5e'
  );

  // Pie de la licencia
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(15, 420, width - 30, 45);
  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('EMPEROR SERVERS VERIFIED TELEMETRY • LSA SIMRACING SYSTEM', 35, 447);

  ctx.font = 'bold 12px sans-serif';
  ctx.fillStyle = '#38bdf8';
  ctx.textAlign = 'right';
  ctx.fillText(`ID: LSA-LIC-${Math.abs(profile.driverName.split('').reduce((a, b) => a + b.charCodeAt(0), 1000))}`, width - 35, 447);

  return canvas.toBuffer('image/png');
}

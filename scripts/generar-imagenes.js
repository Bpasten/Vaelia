/**
 * Genera las ilustraciones SVG de cada producto y color:
 *   public/img/productos/<slug>-<color>-frente.svg   (prenda en percha)
 *   public/img/productos/<slug>-<color>-detalle.svg  (acercamiento)
 *   public/img/productos/<slug>-<color>-textura.svg  (tela)
 *
 * Son imágenes de demostración: cuando Vaelia tenga fotografías reales,
 * basta con reemplazar las URLs en la tabla producto_imagenes.
 *
 * Uso: node scripts/generar-imagenes.js
 */
const fs = require('fs');
const path = require('path');
const { productos, colores } = require('../database/catalogo');

const OUT = path.join(__dirname, '..', 'public', 'img', 'productos');
fs.mkdirSync(OUT, { recursive: true });

// ---------- utilidades de color ----------
const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const rgbToHex = (r) => '#' + r.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => rgbToHex(hexToRgb(a).map((v, i) => v + (hexToRgb(b)[i] - v) * t));
const darken = (h, t) => mix(h, '#000000', t);
const lighten = (h, t) => mix(h, '#ffffff', t);
const luminance = (h) => {
  const [r, g, b] = hexToRgb(h).map((v) => v / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const mirror = (d) => d.replace(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g, (_, x, y) => `${800 - Number(x)} ${y}`);

// ---------- piezas comunes ----------
function defs(id, c, claro) {
  const bgTop = claro ? '#DCCFBC' : '#F1EADF';
  const bgBot = claro ? '#CBBCA6' : '#E4D7C4';
  return `
  <defs>
    <linearGradient id="${id}bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${bgTop}"/><stop offset="1" stop-color="${bgBot}"/>
    </linearGradient>
    <radialGradient id="${id}vig" cx="0.5" cy="0.42" r="0.75">
      <stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#3a2a1a" stop-opacity="0.16"/>
    </radialGradient>
    <linearGradient id="${id}vol" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#000" stop-opacity="0.26"/>
      <stop offset="0.28" stop-color="#000" stop-opacity="0.02"/>
      <stop offset="0.5" stop-color="#fff" stop-opacity="0.06"/>
      <stop offset="0.72" stop-color="#000" stop-opacity="0.02"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.3"/>
    </linearGradient>
    <linearGradient id="${id}alt" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="0.07"/>
      <stop offset="0.6" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.16"/>
    </linearGradient>
    <linearGradient id="${id}wood" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#7c5a3c"/><stop offset="0.5" stop-color="#a47b55"/><stop offset="1" stop-color="#7c5a3c"/>
    </linearGradient>
    <filter id="${id}grano" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" result="n"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="table" tableValues="0 0.07"/></feComponentTransfer>
      <feComposite in2="SourceGraphic" operator="in"/>
    </filter>
    <filter id="${id}sombra" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="14"/>
      <feOffset dx="0" dy="16" result="b"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.28"/></feComponentTransfer>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <pattern id="${id}punto" width="16" height="14" patternUnits="userSpaceOnUse">
      <path d="M0 2 L8 9 L16 2" fill="none" stroke="#000" stroke-opacity="0.16" stroke-width="2"/>
      <path d="M0 4 L8 11 L16 4" fill="none" stroke="#fff" stroke-opacity="0.07" stroke-width="1.4"/>
    </pattern>
    <pattern id="${id}rib" width="9" height="10" patternUnits="userSpaceOnUse">
      <rect width="4" height="10" fill="#000" fill-opacity="0.16"/>
    </pattern>
  </defs>`;
}

function fondo(id) {
  return `
  <rect width="800" height="1000" fill="url(#${id}bg)"/>
  <rect width="800" height="1000" fill="#000" filter="url(#${id}grano)"/>
  <rect width="800" height="1000" fill="url(#${id}vig)"/>`;
}

const gancho = (id) => `
  <path d="M400 214 L400 168 C400 140 432 136 434 110 C436 86 410 76 394 88" fill="none" stroke="#9c8250" stroke-width="7" stroke-linecap="round"/>
  <path d="M400 214 L400 168 C400 140 432 136 434 110" fill="none" stroke="#e4cf9f" stroke-opacity="0.5" stroke-width="2" stroke-linecap="round"/>`;

const percha = (id) => `
  ${gancho(id)}
  <path d="M248 254 C300 226 360 210 400 207 C440 210 500 226 552 254" fill="none" stroke="url(#${id}wood)" stroke-width="13" stroke-linecap="round"/>`;

const perchaPinzas = (id) => `
  ${gancho(id)}
  <rect x="262" y="203" width="276" height="12" rx="6" fill="url(#${id}wood)"/>
  <rect x="292" y="210" width="22" height="34" rx="3" fill="#b9a27a"/><rect x="486" y="210" width="22" height="34" rx="3" fill="#b9a27a"/>
  <rect x="292" y="210" width="22" height="7" rx="2" fill="#8d7652"/><rect x="486" y="210" width="22" height="7" rx="2" fill="#8d7652"/>`;

// Pinta una forma con color base + volumen + contorno
function pieza(id, d, c, { extra = '', stroke = true } = {}) {
  return `
    <path d="${d}" fill="${c}"/>
    <path d="${d}" fill="url(#${id}vol)"/>
    <path d="${d}" fill="url(#${id}alt)"/>
    ${extra}
    ${stroke ? `<path d="${d}" fill="none" stroke="${darken(c, 0.35)}" stroke-opacity="0.55" stroke-width="2" stroke-linejoin="round"/>` : ''}`;
}

const pliegues = (lines, c, op = 0.32, w = 2.4) =>
  lines.map((d) => `<path d="${d}" fill="none" stroke="${darken(c, 0.45)}" stroke-opacity="${op}" stroke-width="${w}" stroke-linecap="round"/>`).join('');
const brillos = (lines, op = 0.14, w = 3) =>
  lines.map((d) => `<path d="${d}" fill="none" stroke="#fff" stroke-opacity="${op}" stroke-width="${w}" stroke-linecap="round"/>`).join('');

const boton = (x, y, r, c) => `
  <circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>
  <circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#000" stroke-opacity="0.25" stroke-width="1.2"/>
  <circle cx="${x - r * 0.3}" cy="${y - r * 0.3}" r="${r * 0.35}" fill="#fff" fill-opacity="0.25"/>`;

// ---------- prendas ----------
function blazer(id, c, { largo = false, cruzado = false, cinturon = false } = {}) {
  const hem = largo ? 900 : 772;
  const cuff = largo ? 730 : 708;
  const cuerpo = `M350 212 L268 238 C252 244 246 258 248 276 L282 345 C300 420 302 470 296 530 C ${largo ? '284 650 276 780 270' : '290 620 286 700 284'} ${hem} L392 ${hem + 10} L408 ${hem + 10} L ${largo ? 530 : 516} ${hem} C ${largo ? '524 780 516 650 504' : '514 700 510 620 504'} 530 C498 470 500 420 518 345 L552 276 C554 258 548 244 532 238 L450 212 C430 222 370 222 350 212 Z`;
  const manga = `M268 238 C240 246 222 268 218 300 L200 520 C196 590 194 650 196 ${cuff} L252 ${cuff + 6} C254 650 258 590 262 520 L282 345 C276 300 274 262 268 238 Z`;
  const interior = mix(c, luminance(c) > 0.6 ? '#8a7a66' : '#E5D8C5', luminance(c) > 0.6 ? 0.35 : 0.85);
  const quiebre = cruzado ? 470 : 540;
  const vCuello = `M350 213 C370 224 430 224 450 213 L404 ${quiebre} L396 ${quiebre} Z`;
  const solapaL = cruzado
    ? `M350 212 C334 232 318 252 304 274 L330 286 L300 300 C326 360 362 420 398 ${quiebre + 2} C388 430 372 330 366 240 C362 228 356 218 350 212 Z`
    : `M350 212 C336 230 322 250 312 268 L334 286 L322 300 C340 360 368 450 398 ${quiebre + 2} C388 460 372 340 366 240 C362 228 356 218 350 212 Z`;
  const botones = cruzado
    ? [480, 560, 640].map((y) => boton(368, y, 9, darken(c, 0.25)) + boton(432, y, 9, darken(c, 0.25))).join('')
    : boton(400, 562, 9, darken(c, 0.3)) + (largo ? boton(400, 650, 9, darken(c, 0.3)) : '');
  const yBolsillo = largo ? 660 : 620;
  return `
  <g filter="url(#${id}sombra)">
    ${pieza(id, cuerpo, c)}
    <path d="${vCuello}" fill="${interior}"/>
    <path d="${vCuello}" fill="url(#${id}vol)" opacity="0.6"/>
    ${pliegues([`M400 ${quiebre + 14} C399 ${quiebre + 120} 397 ${hem - 90} 395 ${hem + 8}`], c, 0.55, 2.4)}
    ${pliegues([`M300 ${yBolsillo} L362 ${yBolsillo - 4}`, `M500 ${yBolsillo} L438 ${yBolsillo - 4}`, 'M318 382 L356 378', `M${largo ? 300 : 304} ${hem - 160} C330 ${hem - 120} 336 ${hem - 70} 330 ${hem}`, `M${largo ? 500 : 496} ${hem - 160} C470 ${hem - 120} 464 ${hem - 70} 470 ${hem}`], c, 0.3)}
    <path d="M300 ${yBolsillo} L362 ${yBolsillo - 4} L362 ${yBolsillo + 14} L301 ${yBolsillo + 18} Z" fill="${darken(c, 0.12)}" stroke="${darken(c, 0.4)}" stroke-opacity="0.5" stroke-width="1.5"/>
    <path d="M500 ${yBolsillo} L438 ${yBolsillo - 4} L438 ${yBolsillo + 14} L499 ${yBolsillo + 18} Z" fill="${darken(c, 0.12)}" stroke="${darken(c, 0.4)}" stroke-opacity="0.5" stroke-width="1.5"/>
    ${pieza(id, solapaL, lighten(c, 0.05))}
    ${pieza(id, mirror(solapaL), lighten(c, 0.05))}
    ${cinturon ? `
      <path d="M294 520 C340 532 460 532 506 520 L506 552 C460 564 340 564 294 552 Z" fill="${darken(c, 0.08)}" stroke="${darken(c, 0.4)}" stroke-opacity="0.5" stroke-width="1.5"/>
      <rect x="380" y="522" width="40" height="36" rx="4" fill="none" stroke="#9c8250" stroke-width="4"/>
      <path d="M420 552 C440 600 446 640 440 700" fill="none" stroke="${darken(c, 0.08)}" stroke-width="22" stroke-linecap="round"/>
      <path d="M440 556 C460 600 466 640 460 690" fill="none" stroke="${darken(c, 0.12)}" stroke-width="20" stroke-linecap="round"/>` : ''}
    ${botones}
    ${pieza(id, manga, c)}
    ${pieza(id, mirror(manga), c)}
    ${pliegues(['M212 420 C224 430 238 432 252 426', `M204 600 C218 612 234 614 248 606`, 'M588 420 C576 430 562 432 548 426', 'M596 600 C582 612 566 614 552 606'], c, 0.3)}
    ${pliegues([`M198 ${cuff - 26} L252 ${cuff - 20}`, `M602 ${cuff - 26} L548 ${cuff - 20}`], c, 0.35, 1.8)}
    ${brillos(['M232 300 C226 380 222 460 216 540', 'M560 300 C566 380 570 460 576 540'], 0.08, 5)}
  </g>`;
}

function blusa(id, c, { camisa = false } = {}) {
  const cuerpo = `M352 214 L270 240 C254 246 248 262 250 280 L280 350 C288 440 286 520 282 600 C280 650 282 680 290 705 C330 722 370 728 400 728 C430 728 470 722 510 705 C518 680 520 650 518 600 C514 520 512 440 520 350 L550 280 C552 262 546 246 530 240 L448 214 C430 224 370 224 352 214 Z`;
  const manga = `M270 240 C236 250 214 276 208 312 L186 560 C182 600 184 630 192 650 L250 656 C252 630 254 600 258 560 L282 352 C278 300 276 262 270 240 Z`;
  const puno = 'M190 626 L253 632 L251 662 L188 656 Z';
  const vFondo = camisa ? '' : `<path d="M352 214 C370 226 430 226 448 214 L400 336 Z" fill="${darken(c, 0.22)}"/>`;
  const cuello = camisa
    ? `${pieza(id, 'M352 212 L334 226 L376 272 L400 240 C380 232 364 224 352 212 Z', lighten(c, 0.04))}
       ${pieza(id, mirror('M352 212 L334 226 L376 272 L400 240 C380 232 364 224 352 212 Z'), lighten(c, 0.04))}`
    : `<path d="M352 214 L400 336 L448 214" fill="none" stroke="${darken(c, 0.35)}" stroke-opacity="0.45" stroke-width="2.4"/>`;
  const inicio = camisa ? 248 : 344;
  const botones = [];
  for (let y = inicio + 26; y < 712; y += 66) botones.push(boton(400, y, 5.5, lighten(c, luminance(c) > 0.6 ? 0 : 0.2)));
  return `
  <g filter="url(#${id}sombra)">
    ${pieza(id, cuerpo, c)}
    ${vFondo}
    ${pliegues([`M400 ${inicio} L400 727`], c, 0.38, 2)}
    ${pliegues([`M408 ${inicio} L408 727`], c, 0.16, 1.4)}
    ${camisa ? pieza(id, 'M312 378 L360 376 L360 426 L336 434 L312 426 Z', c) : ''}
    ${pliegues(['M300 260 C318 320 322 380 312 440', 'M500 260 C482 320 478 380 488 440', 'M330 480 C340 560 338 640 326 712', 'M470 480 C460 560 462 640 474 712', 'M366 360 C372 460 370 600 362 724'], c, 0.22)}
    ${cuello}
    ${botones.join('')}
    ${pieza(id, manga, c)}
    ${pieza(id, mirror(manga), c)}
    ${pieza(id, puno, darken(c, 0.04))}
    ${pieza(id, mirror(puno), darken(c, 0.04))}
    ${pliegues(['M206 360 C222 372 240 372 256 362', 'M198 470 C214 484 232 486 250 476', 'M192 560 C208 574 226 576 246 566', 'M594 360 C578 372 560 372 544 362', 'M602 470 C586 484 568 486 550 476', 'M608 560 C592 574 574 576 554 566'], c, 0.26)}
    ${brillos(['M228 320 C222 400 216 480 210 560', 'M572 320 C578 400 584 480 590 560', 'M384 380 C388 480 386 600 382 700'], 0.09, 6)}
  </g>`;
}

function vestido(id, c, { largo = false } = {}) {
  const hemY = largo ? 960 : 900;
  const cuerpo = `M336 214 L360 214 C372 270 386 320 400 360 C414 320 428 270 440 214 L464 214 C470 240 486 268 500 290 C512 330 506 380 486 430 C480 450 478 465 480 480 C540 600 ${largo ? '580 800 600' : '590 760 610'} ${hemY} C520 ${hemY + 25} 470 ${hemY + 30} 400 ${hemY + 30} C330 ${hemY + 30} 280 ${hemY + 25} ${largo ? 200 : 190} ${hemY} C${largo ? '220 800 260' : '210 760 260'} 600 320 480 C322 465 320 450 314 430 C294 380 288 330 300 290 C314 268 330 240 336 214 Z`;
  const vFondo = `M360 214 C372 270 386 320 400 360 C414 320 428 270 440 214 Z`;
  return `
  <g filter="url(#${id}sombra)">
    ${pieza(id, cuerpo, c)}
    <path d="${vFondo}" fill="${darken(c, 0.28)}"/>
    ${pliegues(['M440 216 C424 300 384 410 326 480', 'M320 480 C360 494 440 494 480 480'], c, 0.42, 2.4)}
    ${pliegues([`M352 494 C342 650 312 800 286 ${hemY + 18}`, `M392 498 C394 650 388 800 380 ${hemY + 28}`, `M432 496 C446 650 470 800 486 ${hemY + 22}`, `M468 490 C500 640 540 790 560 ${hemY + 4}`, `M330 490 C300 640 260 790 240 ${hemY + 4}`], c, 0.3, 2.6)}
    ${brillos([`M372 500 C366 650 348 800 334 ${hemY + 20}`, `M452 500 C466 650 490 800 512 ${hemY + 12}`, 'M330 300 C320 350 322 400 332 440'], 0.12, 7)}
    ${largo ? `<path d="M470 482 C500 520 520 560 512 620" fill="none" stroke="${darken(c, 0.1)}" stroke-width="14" stroke-linecap="round"/>
               <path d="M486 484 C530 510 552 540 552 590" fill="none" stroke="${darken(c, 0.15)}" stroke-width="12" stroke-linecap="round"/>` : ''}
  </g>`;
}

function pantalon(id, c, { recto = false } = {}) {
  const hl = recto ? [270, 386] : [248, 390];
  const hr = recto ? [414, 530] : [410, 552];
  const cuerpo = `M290 238 L510 238 L516 272 C524 310 530 350 532 390 L${hr[1]} 930 L${hr[0]} 932 L402 490 L398 490 L${hl[1]} 932 L${hl[0]} 930 L268 390 C270 350 276 310 284 272 Z`;
  return `
  <g filter="url(#${id}sombra)">
    ${pieza(id, cuerpo, c)}
    ${pieza(id, 'M290 238 L510 238 L514 274 L286 274 Z', darken(c, 0.06))}
    ${[318, 400, 482].map((x) => `<rect x="${x - 5}" y="236" width="10" height="40" rx="2" fill="${darken(c, 0.1)}" stroke="${darken(c, 0.4)}" stroke-opacity="0.4"/>`).join('')}
    ${boton(400, 256, 6, darken(c, 0.25))}
    ${pliegues(['M400 276 C402 340 404 400 399 486', 'M340 276 C342 330 340 380 334 430', 'M460 276 C458 330 460 380 466 430', 'M300 300 L308 360'], c, 0.36)}
    ${pliegues([`M${(hl[0] + hl[1]) / 2 + 6} 420 L${(hl[0] + hl[1]) / 2} 928`, `M${(hr[0] + hr[1]) / 2 - 6} 420 L${(hr[0] + hr[1]) / 2} 928`], c, 0.24, 2)}
    ${brillos([`M${(hl[0] + hl[1]) / 2 - 4} 430 L${(hl[0] + hl[1]) / 2 - 12} 920`, `M${(hr[0] + hr[1]) / 2 + 4} 430 L${(hr[0] + hr[1]) / 2 + 12} 920`], 0.12, 6)}
    ${pliegues(['M300 700 C330 712 356 712 378 702', 'M424 700 C450 712 476 712 504 702', 'M290 820 C324 834 352 834 382 822', 'M420 822 C452 834 480 834 512 820'], c, 0.2)}
  </g>`;
}

function falda(id, c, { plisada = false } = {}) {
  const cuerpo = 'M300 238 L500 238 L504 274 C540 450 580 650 600 862 C520 882 460 888 400 888 C340 888 280 882 200 862 C220 650 260 450 296 274 Z';
  let pl = '';
  if (plisada) {
    const lines = [];
    for (let i = 0; i <= 18; i++) {
      const t = i / 18;
      const xt = 300 + t * 200;
      const xb = 204 + t * 392;
      lines.push(`<path d="M${xt} 276 L${xb} ${876 + Math.sin(t * Math.PI) * 10}" fill="none" stroke="${i % 2 ? '#fff' : darken(c, 0.5)}" stroke-opacity="${i % 2 ? 0.12 : 0.28}" stroke-width="${i % 2 ? 4 : 2.2}"/>`);
    }
    pl = lines.join('');
  }
  return `
  <g filter="url(#${id}sombra)">
    ${pieza(id, cuerpo, c)}
    ${pieza(id, 'M300 238 L500 238 L504 276 L296 276 Z', darken(c, 0.06))}
    ${plisada ? pl : `
      ${pliegues(['M340 280 C326 450 290 650 262 874', 'M396 280 C394 450 386 650 380 886', 'M452 280 C470 450 500 650 530 878', 'M318 300 C290 480 250 680 226 866', 'M478 300 C510 480 548 680 574 866'], c, 0.28, 2.6)}
      ${brillos(['M370 290 C362 460 344 660 330 880', 'M428 290 C438 460 456 660 470 882'], 0.12, 8)}`}
  </g>`;
}

function top(id, c) {
  const cuerpo = 'M330 300 C360 330 440 330 470 300 C490 360 500 440 498 520 C500 560 504 600 510 642 C470 662 430 666 400 666 C370 666 330 662 290 642 C296 600 300 560 302 520 C300 440 310 360 330 300 Z';
  return `
  <g filter="url(#${id}sombra)">
    <path d="M338 222 L332 304" stroke="${darken(c, 0.1)}" stroke-width="6" stroke-linecap="round"/>
    <path d="M462 222 L468 304" stroke="${darken(c, 0.1)}" stroke-width="6" stroke-linecap="round"/>
    ${pieza(id, cuerpo, c)}
    ${pliegues(['M338 314 C370 352 430 352 462 314', 'M346 336 C378 380 422 380 454 336', 'M356 362 C384 400 416 400 444 362'], c, 0.36, 2.6)}
    ${brillos(['M342 324 C372 364 428 364 458 324', 'M352 350 C382 390 418 390 448 350', 'M344 440 C340 520 344 590 352 650', 'M452 440 C458 520 456 590 450 650'], 0.2, 5)}
    ${pliegues(['M380 420 C376 500 378 580 384 660', 'M424 420 C428 500 426 580 420 660'], c, 0.2)}
  </g>`;
}

function cardigan(id, c) {
  const cuerpo = 'M352 214 L268 240 C252 246 246 262 248 280 L278 350 C286 440 284 520 282 620 L282 728 L398 734 L402 734 L518 728 L518 620 C516 520 514 440 522 350 L552 280 C554 262 548 246 532 240 L448 214 C430 224 370 224 352 214 Z';
  const manga = 'M268 240 C232 252 210 280 206 316 L190 600 C188 630 190 660 196 690 L254 694 C254 664 256 634 258 604 L280 352 C276 300 274 262 268 240 Z';
  return `
  <g filter="url(#${id}sombra)">
    ${pieza(id, cuerpo, c, { extra: `<path d="${cuerpo}" fill="url(#${id}punto)"/>` })}
    <path d="M352 214 C370 226 430 226 448 214 L404 450 L396 450 Z" fill="${luminance(c) > 0.6 ? '#b6a58e' : '#E5D8C5'}"/>
    <path d="M352 214 C370 226 430 226 448 214 L404 450 L396 450 Z" fill="url(#${id}vol)" opacity="0.5"/>
    <path d="M352 214 L398 452 L398 734 M448 214 L402 452 L402 734" fill="none" stroke="${darken(c, 0.15)}" stroke-width="20" stroke-opacity="0.5"/>
    <path d="M352 214 L398 452 L398 734 M448 214 L402 452 L402 734" fill="none" stroke="url(#${id}rib)" stroke-width="20"/>
    <path d="M282 690 L518 690 L518 728 L282 728 Z" fill="${darken(c, 0.12)}"/>
    <path d="M282 690 L518 690 L518 728 L282 728 Z" fill="url(#${id}rib)"/>
    ${[490, 560, 630].map((y) => boton(400, y, 8, '#8b6a4a')).join('')}
    ${pieza(id, manga, c, { extra: `<path d="${manga}" fill="url(#${id}punto)"/>` })}
    ${pieza(id, mirror(manga), c, { extra: `<path d="${mirror(manga)}" fill="url(#${id}punto)"/>` })}
    <path d="M192 654 L256 658 L254 694 L196 690 Z" fill="${darken(c, 0.12)}"/><path d="M192 654 L256 658 L254 694 L196 690 Z" fill="url(#${id}rib)"/>
    <path d="${mirror('M192 654 L256 658 L254 694 L196 690 Z')}" fill="${darken(c, 0.12)}"/><path d="${mirror('M192 654 L256 658 L254 694 L196 690 Z')}" fill="url(#${id}rib)"/>
  </g>`;
}

// Vista principal de cada tipo y zona del acercamiento (viewBox 4:5)
const TIPOS = {
  blazer:   { dibujo: (id, c) => percha(id) + blazer(id, c),                         detalle: '262 220 280 350' },
  abrigo:   { dibujo: (id, c, p) => percha(id) + blazer(id, c, { largo: true, cruzado: !p.cinturon, cinturon: p.cinturon }), detalle: '262 220 280 350' },
  blusa:    { dibujo: (id, c) => percha(id) + blusa(id, c),                          detalle: '272 196 256 320' },
  camisa:   { dibujo: (id, c) => percha(id) + blusa(id, c, { camisa: true }),        detalle: '272 196 256 320' },
  vestido:  { dibujo: (id, c, p) => percha(id) + vestido(id, c, { largo: p.largo }), detalle: '280 200 240 300' },
  pantalon: { dibujo: (id, c, p) => perchaPinzas(id) + pantalon(id, c, { recto: p.recto }), detalle: '268 214 264 330' },
  falda:    { dibujo: (id, c, p) => perchaPinzas(id) + falda(id, c, { plisada: p.plisada }), detalle: '268 214 264 330' },
  top:      { dibujo: (id, c) => percha(id) + top(id, c),                            detalle: '300 240 200 250' },
  cardigan: { dibujo: (id, c) => percha(id) + cardigan(id, c),                       detalle: '284 300 232 290' },
};

const PARAMS = {
  'trench-lino': { cinturon: true },
  'pantalon-recto-bosque': { recto: true },
  'vestido-musgo': { largo: true },
  'falda-plisada-salvia': { plisada: true },
};

function svgFrente(p, col, vb = '0 0 800 1000') {
  const id = 'v';
  const claro = luminance(col.hex) > 0.6;
  const t = TIPOS[p.tipo];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="800" height="1000" preserveAspectRatio="xMidYMid slice">
  ${defs(id, col.hex, claro)}${fondo(id)}${t.dibujo(id, col.hex, PARAMS[p.slug] || {})}
</svg>`;
}

function svgTextura(p, col) {
  const c = col.hex;
  const id = 't';
  const lino = /lino|algod/i.test(p.materiales);
  const punto = p.tipo === 'cardigan';
  const satin = /satin|viscosa|lyocell/i.test(p.materiales) && !lino;
  const freq = lino ? '0.012 0.9' : satin ? '0.004 0.02' : '0.6';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000">
  <defs>
    <linearGradient id="${id}a" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${lighten(c, 0.1)}"/><stop offset="0.35" stop-color="${c}"/><stop offset="0.6" stop-color="${darken(c, 0.22)}"/><stop offset="1" stop-color="${darken(c, 0.08)}"/>
    </linearGradient>
    <linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="0.3" stop-color="#000" stop-opacity="0.22"/><stop offset="0.5" stop-color="#fff" stop-opacity="${satin ? 0.2 : 0.09}"/><stop offset="0.72" stop-color="#000" stop-opacity="0.16"/><stop offset="1" stop-color="#000" stop-opacity="0"/>
    </linearGradient>
    <filter id="${id}blur" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="22"/></filter>
    <filter id="${id}n" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="3" seed="3"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="table" tableValues="0 ${satin ? 0.1 : 0.22}"/></feComponentTransfer>
      <feComposite in2="SourceGraphic" operator="in"/>
    </filter>
    <pattern id="${id}p" width="22" height="20" patternUnits="userSpaceOnUse">
      <path d="M0 3 L11 13 L22 3" fill="none" stroke="#000" stroke-opacity="0.2" stroke-width="3"/>
      <path d="M0 6 L11 16 L22 6" fill="none" stroke="#fff" stroke-opacity="0.08" stroke-width="2"/>
    </pattern>
  </defs>
  <rect width="800" height="1000" fill="url(#${id}a)"/>
  ${punto ? `<rect width="800" height="1000" fill="url(#${id}p)"/>` : ''}
  <g filter="url(#${id}blur)">
    <path d="M-80 200 C180 120 420 360 880 220 L880 520 C440 640 200 400 -80 500 Z" fill="url(#${id}b)"/>
    <path d="M-80 600 C220 520 500 740 880 640 L880 880 C480 960 240 780 -80 860 Z" fill="url(#${id}b)" opacity="0.8"/>
    <path d="M-80 -40 C260 -60 500 100 880 20 L880 160 C500 230 260 90 -80 140 Z" fill="url(#${id}b)" opacity="0.6"/>
  </g>
  <rect width="800" height="1000" fill="#000" filter="url(#${id}n)"/>
</svg>`;
}

// ---------- generación ----------
let n = 0;
for (const p of productos) {
  for (const slugColor of p.colores) {
    const col = colores.find((c) => c.slug === slugColor);
    const base = `${p.slug}-${slugColor}`;
    fs.writeFileSync(path.join(OUT, `${base}-frente.svg`), svgFrente(p, col));
    fs.writeFileSync(path.join(OUT, `${base}-detalle.svg`), svgFrente(p, col, TIPOS[p.tipo].detalle));
    fs.writeFileSync(path.join(OUT, `${base}-textura.svg`), svgTextura(p, col));
    n += 3;
  }
}
console.log(`✓ ${n} ilustraciones generadas en public/img/productos`);

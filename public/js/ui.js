/**
 * Interfaz común a todas las páginas: cabecera con navegación e ícono de cuenta,
 * buscador, menú móvil, carrito lateral, avisos (toasts) y pie de página.
 */
import { api, clp, esc, icono } from './api.js';
import * as carrito from './carrito.js';

let sesionPromesa = null;
let configPromesa = null;

/** Sesión actual (se consulta una sola vez por página). */
export function obtenerSesion(refrescar = false) {
  if (!sesionPromesa || refrescar) {
    sesionPromesa = api('/auth/yo').then((r) => r.usuario).catch(() => null);
  }
  return sesionPromesa;
}

export function obtenerConfig() {
  configPromesa ||= api('/checkout/config').catch(() => ({ envio: { gratisDesde: 60000, rm: 3990 } }));
  return configPromesa;
}

// ---------- Toasts ----------
export function toast(mensaje, tipo = 'ok') {
  let cont = document.querySelector('.toasts');
  if (!cont) {
    cont = document.createElement('div');
    cont.className = 'toasts';
    cont.setAttribute('role', 'status');
    cont.setAttribute('aria-live', 'polite');
    document.body.append(cont);
  }
  const el = document.createElement('div');
  el.className = `toast${tipo === 'error' ? ' toast--error' : ''}`;
  el.innerHTML = `${icono(tipo === 'error' ? 'alerta' : 'check')}<span>${esc(mensaje)}</span>`;
  cont.append(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; }, 3200);
  setTimeout(() => el.remove(), 3600);
}

// ---------- Paneles laterales ----------
let velo;
let panelAbierto = null;
let ultimoFoco = null;

function abrirPanel(panel) {
  if (panelAbierto) cerrarPanel(panelAbierto, false);
  ultimoFoco = document.activeElement;
  velo ||= Object.assign(document.createElement('div'), { className: 'velo' });
  velo.hidden = false;
  velo.onclick = () => cerrarPanel(panel);
  document.body.append(velo);
  panel.hidden = false;
  requestAnimationFrame(() => { velo.classList.add('abierto'); panel.classList.add('abierto'); });
  document.body.style.overflow = 'hidden';
  panelAbierto = panel;
  setTimeout(() => panel.querySelector('[data-cerrar]')?.focus(), 60);
}

function cerrarPanel(panel, devolverFoco = true) {
  panel.classList.remove('abierto');
  velo?.classList.remove('abierto');
  document.body.style.overflow = '';
  panelAbierto = null;
  setTimeout(() => { panel.hidden = true; if (velo && !panelAbierto) velo.hidden = true; }, 320);
  if (devolverFoco) ultimoFoco?.focus?.();
}

document.addEventListener('keydown', (e) => {
  if (!panelAbierto) return;
  if (e.key === 'Escape') cerrarPanel(panelAbierto);
  if (e.key === 'Tab') {
    const focos = [...panelAbierto.querySelectorAll('a[href], button:not([disabled]), input, select')].filter((el) => el.offsetParent !== null);
    if (!focos.length) return;
    const [primero, ultimo] = [focos[0], focos[focos.length - 1]];
    if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
  }
});

// ---------- Cabecera ----------
const ENLACES = [
  { id: 'inicio', texto: 'Inicio', href: '/' },
  { id: 'coleccion', texto: 'Colección', href: '/coleccion' },
  { id: 'nosotras', texto: 'Nosotras', href: '/#nosotras' },
  { id: 'contacto', texto: 'Contacto', href: '#contacto' },
];

const logo = (version = 'verde') => `<a class="logo" href="/" aria-label="Vaelia, ir al inicio"><img class="logo__imagen" src="/img/marca/logo-vaelia-${version}.png" alt="Vaelia" width="203" height="245"></a>`;

function htmlCabecera(activo) {
  return `
  <a class="saltar" href="#contenido">Saltar al contenido</a>
  <div class="contenedor cabecera__barra">
    <button class="icono-btn solo-movil" type="button" data-abrir-menu aria-label="Abrir menú">${icono('menu')}</button>
    ${logo()}
    <nav class="nav" aria-label="Principal">
      ${ENLACES.map((l) => `<a href="${l.href}"${l.id === activo ? ' aria-current="page"' : ''}>${l.texto}</a>`).join('')}
    </nav>
    <div class="acciones">
      <button class="icono-btn solo-escritorio" type="button" data-buscar aria-label="Buscar" aria-expanded="false" aria-controls="buscador">${icono('buscar')}</button>
      <div class="menu-cuenta">
        <a class="icono-btn" href="/cuenta" data-cuenta aria-label="Iniciar sesión o crear cuenta">${icono('usuario')}<span class="punto-sesion" hidden></span></a>
        <div class="menu-cuenta__panel" id="menu-cuenta" hidden></div>
      </div>
      <button class="icono-btn" type="button" data-abrir-carrito aria-label="Abrir carrito">${icono('bolsa')}<span class="burbuja" data-contador></span></button>
    </div>
  </div>
  <div class="buscador" id="buscador" hidden>
    <form class="contenedor" action="/coleccion" method="get" role="search">
      ${icono('buscar')}
      <input type="search" name="q" placeholder="Busca blazers, vestidos, lino…" aria-label="Buscar productos" autocomplete="off" maxlength="60">
      <button class="icono-btn" type="button" data-cerrar-buscador aria-label="Cerrar búsqueda">${icono('cerrar')}</button>
    </form>
  </div>`;
}

function htmlMenuMovil() {
  return `
  <aside class="panel panel--izq menu-movil" id="menu-movil" role="dialog" aria-modal="true" aria-label="Menú" hidden>
    <div class="panel__cabecera">${logo('dorado')}<button class="icono-btn" type="button" data-cerrar aria-label="Cerrar menú">${icono('cerrar')}</button></div>
    <form class="menu-movil__buscar" action="/coleccion" method="get" role="search">
      ${icono('buscar')}<input class="control" type="search" name="q" placeholder="Buscar en la colección" aria-label="Buscar productos" maxlength="60">
    </form>
    <nav aria-label="Menú móvil">
      ${ENLACES.map((l) => `<a href="${l.href}" data-cerrar-al-ir>${l.texto}${icono('chevron-der')}</a>`).join('')}
    </nav>
    <div class="menu-movil__extra">
      <a href="/cuenta" data-enlace-cuenta-movil>${icono('usuario')}<span>Mi cuenta</span></a>
      <a href="#" data-abrir-carrito-movil>${icono('bolsa')}<span>Carrito (<span data-contador-num>0</span>)</span></a>
    </div>
  </aside>`;
}

function htmlCarrito() {
  return `
  <aside class="panel panel--der" id="panel-carrito" role="dialog" aria-modal="true" aria-labelledby="titulo-carrito" hidden>
    <div class="panel__cabecera">
      <h2 class="panel__titulo" id="titulo-carrito">Tu carrito (<span data-contador-num>0</span>)</h2>
      <button class="icono-btn" type="button" data-cerrar aria-label="Cerrar carrito">${icono('cerrar')}</button>
    </div>
    <div class="panel__cuerpo" data-items></div>
    <div class="panel__pie" data-pie></div>
  </aside>`;
}

function htmlPie() {
  const anio = new Date().getFullYear();
  return `
  <div class="contenedor">
    <div class="pie__grid">
      <div>
        ${logo('dorado')}
        <p class="pie__lema">Vístete para ti.</p>
        <p class="pie__texto">Prendas versátiles para mujeres que se eligen a sí mismas. Diseñadas en Chile para acompañarte de la oficina al evento.</p>
      </div>
      <div>
        <h3>Explora</h3>
        <ul>
          <li><a href="/coleccion">Colección</a></li>
          <li><a href="/coleccion?ocasion=oficina">Oficina</a></li>
          <li><a href="/coleccion?ocasion=evento">Evento</a></li>
          <li><a href="/#nosotras">Nosotras</a></li>
        </ul>
      </div>
      <div>
        <h3>Síguenos</h3>
        <ul>
          <li><a href="#" aria-label="Instagram de Vaelia (enlace por configurar)">Instagram</a></li>
          <li><a href="#" aria-label="TikTok de Vaelia (enlace por configurar)">TikTok</a></li>
          <li><a href="#" aria-label="Pinterest de Vaelia (enlace por configurar)">Pinterest</a></li>
        </ul>
      </div>
      <div id="contacto">
        <h3>Contacto</h3>
        <ul class="pie__contacto">
          <li>${icono('correo')}<a href="mailto:hola@vaelia.cl">hola@vaelia.cl</a></li>
          <li>${icono('pin')}<span>Showroom en Providencia, Santiago</span></li>
          <li>${icono('camion')}<span>Envíos a todo Chile</span></li>
        </ul>
      </div>
    </div>
    <div class="pie__base">
      <span>© ${anio} VAELIA. Todos los derechos reservados.</span>
      <span>${icono('candado')} Pago seguro con Webpay Plus · Transbank</span>
    </div>
  </div>`;
}

// ---------- Carrito lateral ----------
async function pintarCarrito() {
  const panel = document.getElementById('panel-carrito');
  if (!panel) return;
  const items = carrito.obtener();
  const cuerpo = panel.querySelector('[data-items]');
  const pie = panel.querySelector('[data-pie]');

  if (!items.length) {
    cuerpo.innerHTML = `
      <div class="carrito-vacio">
        ${icono('bolsa')}
        <h3>Tu carrito está vacío</h3>
        <p>Descubre prendas versátiles pensadas para cada momento de tu día.</p>
        <a class="btn btn-primario" href="/coleccion">Ver colección ${icono('flecha', 'i i-flecha')}</a>
      </div>`;
    pie.hidden = true;
    return;
  }

  cuerpo.innerHTML = items.map((it) => `
    <div class="carrito-item">
      <a href="/producto?p=${encodeURIComponent(it.slug)}&color=${encodeURIComponent(it.color_slug || '')}"><img class="carrito-item__img" src="${esc(it.imagen)}" alt="" width="84" height="105"></a>
      <div>
        <h3 class="carrito-item__nombre"><a href="/producto?p=${encodeURIComponent(it.slug)}&color=${encodeURIComponent(it.color_slug || '')}">${esc(it.nombre)}</a></h3>
        <p class="carrito-item__variante">${esc(it.color)} · Talla ${esc(it.talla)}</p>
        <div class="cantidad" role="group" aria-label="Cantidad de ${esc(it.nombre)}">
          <button type="button" data-menos="${it.variante_id}" aria-label="Quitar una unidad">${icono('menos')}</button>
          <output aria-live="polite">${it.cantidad}</output>
          <button type="button" data-mas="${it.variante_id}" aria-label="Agregar una unidad" ${it.cantidad >= Math.min(10, it.stock || 10) ? 'disabled' : ''}>${icono('mas')}</button>
        </div>
      </div>
      <div>
        <p class="carrito-item__precio">${clp(it.precio * it.cantidad)}</p>
        <button class="carrito-item__quitar" type="button" data-quitar="${it.variante_id}" aria-label="Eliminar ${esc(it.nombre)} del carrito">${icono('basura')}</button>
      </div>
    </div>`).join('');

  const sub = carrito.subtotal();
  const { envio } = await obtenerConfig();
  const falta = Math.max(0, envio.gratisDesde - sub);
  pie.hidden = false;
  pie.innerHTML = `
    <div class="fila-total"><span>Subtotal</span><span>${clp(sub)}</span></div>
    <div class="fila-total"><span>Envío</span><span>${falta > 0 ? `Desde ${clp(envio.rm)}` : 'Gratis'}</span></div>
    <div class="fila-total fila-total--grande"><span>Total estimado</span><strong>${clp(sub + (falta > 0 ? envio.rm : 0))}</strong></div>
    <a class="btn btn-primario btn-bloque" href="/checkout" style="margin-top:18px">Ir a pagar ${icono('flecha', 'i i-flecha')}</a>
    <p class="nota-segura">${icono('candado')} Compra segura con Webpay · Transbank</p>`;
}

function actualizarContadores() {
  const n = carrito.unidades();
  document.querySelectorAll('[data-contador]').forEach((el) => { el.textContent = n > 0 ? String(n) : ''; });
  document.querySelectorAll('[data-contador-num]').forEach((el) => { el.textContent = String(n); });
  document.querySelectorAll('[data-abrir-carrito]').forEach((el) => el.setAttribute('aria-label', `Abrir carrito, ${n} ${n === 1 ? 'producto' : 'productos'}`));
}

export function abrirCarrito() {
  const panel = document.getElementById('panel-carrito');
  if (!panel) return;
  pintarCarrito();
  abrirPanel(panel);
}

// ---------- Cuenta en la cabecera ----------
async function pintarSesion() {
  const usuario = await obtenerSesion();
  const enlace = document.querySelector('[data-cuenta]');
  const panel = document.getElementById('menu-cuenta');
  if (!enlace || !panel) return;
  const movil = document.querySelector('[data-enlace-cuenta-movil]');

  if (!usuario) {
    const volver = location.pathname === '/cuenta' ? '' : `?volver=${encodeURIComponent(location.pathname + location.search)}`;
    enlace.href = `/cuenta${volver}`;
    if (movil) movil.href = `/cuenta${volver}`;
    return;
  }
  enlace.querySelector('.punto-sesion').hidden = false;
  enlace.setAttribute('aria-label', `Mi cuenta, ${usuario.nombre}`);
  enlace.setAttribute('aria-haspopup', 'true');
  enlace.setAttribute('aria-expanded', 'false');
  if (movil) { movil.href = '/mi-cuenta'; movil.querySelector('span').textContent = `Mi cuenta · ${usuario.nombre}`; }
  panel.innerHTML = `
    <div class="menu-cuenta__hola"><strong>Hola, ${esc(usuario.nombre)}</strong><span>${esc(usuario.email)}</span></div>
    <a href="/mi-cuenta#pedidos">${icono('paquete')} Mis pedidos</a>
    <a href="/mi-cuenta#datos">${icono('usuario')} Mis datos</a>
    <a href="/mi-cuenta#direccion">${icono('pin')} Mi dirección</a>
    <button type="button" data-salir>${icono('salir')} Cerrar sesión</button>`;

  const alternar = (abrir) => {
    panel.hidden = !abrir;
    enlace.setAttribute('aria-expanded', String(abrir));
  };
  enlace.addEventListener('click', (e) => { e.preventDefault(); alternar(panel.hidden); });
  document.addEventListener('click', (e) => { if (!e.target.closest('.menu-cuenta')) alternar(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') alternar(false); });
  panel.querySelector('[data-salir]').addEventListener('click', cerrarSesion);
}

export async function cerrarSesion() {
  try { await api('/auth/logout', { metodo: 'POST' }); } catch { /* igual se redirige */ }
  location.href = '/';
}

// ---------- Tarjeta de producto (catálogo, inicio, relacionados) ----------
export function tarjetaProducto(p) {
  const url = `/producto?p=${encodeURIComponent(p.slug)}`;
  return `
  <article class="tarjeta${p.agotado ? ' tarjeta--agotada' : ''}">
    <a class="tarjeta__img" href="${url}" tabindex="-1" aria-hidden="true">
      <img src="${esc(p.imagen)}" alt="" loading="lazy" width="800" height="1000">
      ${p.agotado ? '<span class="tarjeta__sello">Agotado</span>' : ''}
    </a>
    <div class="tarjeta__info">
      <h3 class="tarjeta__nombre"><a href="${url}">${esc(p.nombre)}</a></h3>
      <p class="tarjeta__precio">${clp(p.precio)}</p>
      <div class="muestras">
        ${p.colores.map((c, i) => `<a class="muestra${i === 0 ? ' activa' : ''}" href="${url}&color=${encodeURIComponent(c.slug)}" style="--c:${esc(c.hex)}" data-img="${esc(c.imagen)}" title="${esc(c.nombre)}" aria-label="${esc(p.nombre)} en ${esc(c.nombre)}"></a>`).join('')}
      </div>
    </div>
  </article>`;
}

export const tarjetasEsqueleto = (n) => Array.from({ length: n }, () => `
  <div class="tarjeta esqueleto-tarjeta" aria-hidden="true">
    <div class="tarjeta__img esqueleto"></div>
    <div class="esqueleto esqueleto-linea"></div>
    <div class="esqueleto esqueleto-linea" style="width:35%"></div>
  </div>`).join('');

// Cambiar la foto de la tarjeta al pasar por un color
function cambiarMuestra(e) {
  const m = e.target.closest?.('.muestra[data-img]');
  if (!m) return;
  const tarjeta = m.closest('.tarjeta');
  const img = tarjeta?.querySelector('.tarjeta__img img');
  if (img && img.getAttribute('src') !== m.dataset.img) img.src = m.dataset.img;
  tarjeta.querySelectorAll('.muestra').forEach((x) => x.classList.toggle('activa', x === m));
}

// ---------- Inicialización ----------
/**
 * @param {{ activo?: string, cabecera?: 'completa' | 'ninguna' }} opciones
 */
export function iniciarPagina({ activo = '', cabecera = 'completa' } = {}) {
  const cab = document.getElementById('cabecera');
  if (cab && cabecera === 'completa') {
    cab.className = 'cabecera';
    cab.innerHTML = htmlCabecera(activo);
    document.body.insertAdjacentHTML('beforeend', htmlMenuMovil());
  }
  const pie = document.getElementById('pie');
  if (pie) { pie.className = 'pie'; pie.innerHTML = htmlPie(); }
  document.body.insertAdjacentHTML('beforeend', htmlCarrito());

  // Buscador
  const btnBuscar = document.querySelector('[data-buscar]');
  const buscador = document.getElementById('buscador');
  btnBuscar?.addEventListener('click', () => {
    const abrir = buscador.hidden;
    buscador.hidden = !abrir;
    btnBuscar.setAttribute('aria-expanded', String(abrir));
    if (abrir) buscador.querySelector('input').focus();
  });
  document.querySelector('[data-cerrar-buscador]')?.addEventListener('click', () => {
    buscador.hidden = true;
    btnBuscar.setAttribute('aria-expanded', 'false');
    btnBuscar.focus();
  });

  // Menú móvil
  const menu = document.getElementById('menu-movil');
  document.querySelector('[data-abrir-menu]')?.addEventListener('click', () => abrirPanel(menu));
  menu?.querySelector('[data-cerrar]').addEventListener('click', () => cerrarPanel(menu));
  menu?.querySelectorAll('[data-cerrar-al-ir]').forEach((a) => a.addEventListener('click', () => cerrarPanel(menu, false)));
  menu?.querySelector('[data-abrir-carrito-movil]')?.addEventListener('click', (e) => { e.preventDefault(); abrirCarrito(); });

  // Carrito
  const panel = document.getElementById('panel-carrito');
  document.querySelectorAll('[data-abrir-carrito]').forEach((b) => b.addEventListener('click', abrirCarrito));
  panel.querySelector('[data-cerrar]').addEventListener('click', () => cerrarPanel(panel));
  panel.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const items = carrito.obtener();
    if (b.dataset.mas) {
      const it = items.find((i) => i.variante_id === Number(b.dataset.mas));
      if (it) carrito.cambiarCantidad(it.variante_id, it.cantidad + 1);
    } else if (b.dataset.menos) {
      const it = items.find((i) => i.variante_id === Number(b.dataset.menos));
      if (it) carrito.cambiarCantidad(it.variante_id, it.cantidad - 1);
    } else if (b.dataset.quitar) {
      carrito.quitar(Number(b.dataset.quitar));
      toast('Producto eliminado del carrito.');
    }
  });
  window.addEventListener('carrito:cambio', () => {
    actualizarContadores();
    if (!panel.hidden) pintarCarrito();
  });
  actualizarContadores();

  // Muestras de color en tarjetas
  document.addEventListener('mouseover', cambiarMuestra);
  document.addEventListener('focusin', cambiarMuestra);

  if (cabecera === 'completa') pintarSesion();
}

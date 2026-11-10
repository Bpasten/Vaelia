/**
 * Checkout en 3 pasos (HU12, HU13) + inicio del pago con Webpay Plus (HU14).
 * Compra como invitada o con sesión (se precargan los datos guardados).
 */
import { api, clp, esc, marcarErrores } from '../api.js';
import { iniciarPagina, obtenerSesion } from '../ui.js';
import * as carrito from '../carrito.js';

iniciarPagina({ cabecera: 'ninguna' });

const form = document.querySelector('[data-checkout]');
const vacio = document.querySelector('[data-vacio]');
const pasos = [...form.querySelectorAll('[data-paso]')];
const indicadores = [...document.querySelectorAll('[data-paso-ind]')];
const alertaGeneral = form.querySelector('[data-alerta-general]');
const CONTACTO = ['nombre', 'apellido', 'email', 'telefono', 'rut'];
const DIRECCION = ['region', 'comuna', 'calle', 'depto', 'referencia'];

let config = { envio: { rm: 3990, regiones: 5990, gratisDesde: 60000 }, regiones: [] };
let cotizacion = null;
let pasoActual = 1;
let usuario = null;

const campo = (nombre) => form.elements[nombre];
const valor = (nombre) => (campo(nombre)?.value || '').trim();

// ---------- Validaciones del navegador (el servidor vuelve a validar todo) ----------
function rutValido(rut) {
  const limpio = rut.replace(/[.\-\s]/g, '').toUpperCase();
  if (!/^\d{7,8}[\dK]$/.test(limpio)) return false;
  let suma = 0;
  let mult = 2;
  for (let i = limpio.length - 2; i >= 0; i--) { suma += Number(limpio[i]) * mult; mult = mult === 7 ? 2 : mult + 1; }
  const r = 11 - (suma % 11);
  return (r === 11 ? '0' : r === 10 ? 'K' : String(r)) === limpio.slice(-1);
}

function validarContacto() {
  const e = {};
  if (valor('contacto.nombre').length < 2) e['contacto.nombre'] = 'Ingresa tu nombre.';
  if (valor('contacto.apellido').length < 2) e['contacto.apellido'] = 'Ingresa tu apellido.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor('contacto.email'))) e['contacto.email'] = 'Ingresa un correo válido.';
  if (!/^(\+?56)?9\d{8}$/.test(valor('contacto.telefono').replace(/[^\d+]/g, ''))) e['contacto.telefono'] = 'Ingresa un celular válido (9 dígitos).';
  if (valor('contacto.rut') && !rutValido(valor('contacto.rut'))) e['contacto.rut'] = 'El RUT no es válido.';
  return e;
}

function validarDespacho() {
  const e = {};
  if (!valor('despacho.region')) e['despacho.region'] = 'Selecciona una región.';
  if (valor('despacho.comuna').length < 2) e['despacho.comuna'] = 'Ingresa la comuna.';
  if (valor('despacho.calle').length < 4 || !/\d/.test(valor('despacho.calle'))) e['despacho.calle'] = 'Ingresa calle y número.';
  return e;
}

// ---------- Pasos ----------
function irAPaso(n, desplazar = true) {
  pasoActual = n;
  pasos.forEach((bloque) => {
    const i = Number(bloque.dataset.paso);
    const cuerpo = bloque.querySelector('[data-cuerpo]');
    const resumen = bloque.querySelector('[data-resumen]');
    const editar = bloque.querySelector('[data-editar]');
    cuerpo.hidden = i !== n;
    if (resumen) resumen.hidden = !(i < n);
    if (editar) editar.hidden = !(i < n);
    bloque.classList.toggle('bloque--bloqueado', i > n);
    bloque.classList.toggle('bloque--cerrado', i !== n);
  });
  indicadores.forEach((el) => {
    const i = Number(el.dataset.pasoInd);
    el.classList.toggle('activo', i === n);
    el.classList.toggle('hecho', i < n);
    if (i === n) el.setAttribute('aria-current', 'step'); else el.removeAttribute('aria-current');
  });
  const bloque = pasos[n - 1];
  if (!desplazar) return;
  bloque.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(() => bloque.querySelector('[data-cuerpo] input:not([type="hidden"]):not([disabled]), [data-cuerpo] select')?.focus({ preventScroll: true }), 250);
}

function resumirContacto() {
  pasos[0].querySelector('[data-resumen]').innerHTML = `${esc(valor('contacto.nombre'))} ${esc(valor('contacto.apellido'))}<br>${esc(valor('contacto.email'))} · ${esc(valor('contacto.telefono'))}`;
}

function resumirDespacho() {
  const r = pasos[1].querySelector('[data-resumen]');
  r.innerHTML = `Despacho a domicilio<br>${esc(valor('despacho.calle'))}${valor('despacho.depto') ? ', ' + esc(valor('despacho.depto')) : ''}, ${esc(valor('despacho.comuna'))}, ${esc(valor('despacho.region'))}`;
}

form.addEventListener('click', (e) => {
  const cont = e.target.closest('[data-continuar]');
  if (cont) {
    const n = Number(cont.dataset.continuar);
    const errores = n === 1 ? validarContacto() : validarDespacho();
    if (marcarErrores(form, errores)) return;
    if (n === 1) resumirContacto(); else resumirDespacho();
    irAPaso(n + 1);
  }
  const ed = e.target.closest('[data-editar]');
  if (ed) irAPaso(Number(ed.dataset.editar));
});

// ---------- Resumen y cotización ----------
function pintarResumen() {
  const items = form.querySelector('[data-items]');
  if (!cotizacion) return;
  items.innerHTML = cotizacion.lineas.map((l) => `
    <div class="resumen-item">
      <div class="resumen-item__img"><img src="${esc(l.imagen)}" alt="" width="64" height="80"><span>${l.cantidad}</span></div>
      <div><strong>${esc(l.nombre)}</strong><small>${esc(l.color)} · Talla ${esc(l.talla)}</small></div>
      <span class="resumen-item__precio">${clp(l.subtotal)}</span>
    </div>`).join('');
  form.querySelector('[data-subtotal]').textContent = clp(cotizacion.subtotal);
  const sinRegion = !valor('despacho.region') && cotizacion.envio > 0;
  form.querySelector('[data-envio]').textContent = cotizacion.envio === 0 ? 'Gratis' : `${sinRegion ? 'Desde ' : ''}${clp(cotizacion.envio)}`;
  form.querySelector('[data-total]').textContent = clp(cotizacion.total);

}

function pintarAvisos(problemas) {
  const caja = form.querySelector('[data-avisos]');
  caja.hidden = !problemas.length;
  caja.innerHTML = problemas.length ? `<span>${problemas.map((p) => esc(p.mensaje)).join('<br>')} Ajustamos tu carrito.</span>` : '';
}

async function cotizar() {
  const items = carrito.obtener();
  if (!items.length) {
    form.hidden = true;
    vacio.hidden = false;
    return;
  }
  form.hidden = false;
  vacio.hidden = true;
  try {
    cotizacion = await api('/checkout/cotizar', {
      metodo: 'POST',
      cuerpo: {
        items: items.map((i) => ({ variante_id: i.variante_id, cantidad: i.cantidad })),
        despacho: { region: valor('despacho.region') || null },
      },
    });
    if (cotizacion.problemas.length) {
      pintarAvisos(cotizacion.problemas);
      carrito.sincronizar(cotizacion.lineas, cotizacion.problemas); // dispara una nueva cotización
      return;
    }
    pintarResumen();
  } catch (err) {
    alertaGeneral.hidden = false;
    alertaGeneral.textContent = err.message;
  }
}

form.addEventListener('change', (e) => {
  if (e.target.name === 'despacho.region') cotizar();
});
window.addEventListener('carrito:cambio', cotizar);

// ---------- Pagar ----------
function mapearCampos(campos = {}) {
  const r = {};
  for (const [k, v] of Object.entries(campos)) {
    if (CONTACTO.includes(k)) r[`contacto.${k}`] = v;
    else if (DIRECCION.includes(k)) r[`despacho.${k}`] = v;
    else r[k] = v;
  }
  return r;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (pasoActual !== 3) return;
  alertaGeneral.hidden = true;

  const errC = validarContacto();
  if (Object.keys(errC).length) { irAPaso(1); setTimeout(() => marcarErrores(form, errC), 300); return; }
  const errD = validarDespacho();
  if (Object.keys(errD).length) { irAPaso(2); setTimeout(() => marcarErrores(form, errD), 300); return; }
  if (!campo('acepta_terminos').checked) { marcarErrores(form, { terminos: 'Debes aceptar los términos y condiciones.' }); campo('acepta_terminos').focus(); return; }
  marcarErrores(form, {});

  const cuerpo = {
    contacto: Object.fromEntries(CONTACTO.map((k) => [k, valor(`contacto.${k}`)])),
    despacho: { ...Object.fromEntries(DIRECCION.map((k) => [k, valor(`despacho.${k}`)])) },
    items: carrito.obtener().map((i) => ({ variante_id: i.variante_id, cantidad: i.cantidad })),
    acepta_terminos: true,
    guardar_direccion: Boolean(usuario && campo('guardar_direccion')?.checked),
  };

  const btn = form.querySelector('[data-pagar]');
  btn.setAttribute('aria-busy', 'true');
  btn.disabled = true;
  btn.firstChild.textContent = 'Conectando con Webpay ';
  try {
    const r = await api('/checkout', { metodo: 'POST', cuerpo });
    // Webpay Plus: se envía token_ws por POST a la URL que entregó Transbank
    const enviar = document.createElement('form');
    enviar.method = 'POST';
    enviar.action = r.url;
    const token = document.createElement('input');
    token.type = 'hidden';
    token.name = 'token_ws';
    token.value = r.token;
    enviar.append(token);
    document.body.append(enviar);
    enviar.submit();
  } catch (err) {
    btn.removeAttribute('aria-busy');
    btn.disabled = false;
    btn.firstChild.textContent = 'Pagar ahora ';
    if (err.status === 422 && err.campos) {
      const campos = mapearCampos(err.campos);
      const enContacto = Object.keys(campos).some((k) => k.startsWith('contacto.'));
      const enDespacho = Object.keys(campos).some((k) => k.startsWith('despacho.'));
      if (enContacto) irAPaso(1); else if (enDespacho) irAPaso(2);
      setTimeout(() => marcarErrores(form, campos), 300);
      return;
    }
    alertaGeneral.hidden = false;
    alertaGeneral.textContent = err.message;
    alertaGeneral.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (err.status === 409) cotizar(); // stock cambió: refrescar el resumen
  }
});

// ---------- Inicio ----------
async function iniciar() {
  try { config = await api('/checkout/config'); } catch { /* valores por defecto */ }
  const sel = campo('despacho.region');
  sel.insertAdjacentHTML('beforeend', config.regiones.map((r) => `<option value="${esc(r)}">${esc(r)}</option>`).join(''));

  usuario = await obtenerSesion();
  if (usuario) {
    form.querySelector('[data-sesion-aviso]').hidden = true;
    form.querySelector('[data-guardar-direccion]').hidden = false;
    try {
      const { usuario: u, direccion } = await api('/cuenta');
      const poner = (n, v) => { if (v && !valor(n)) campo(n).value = v; };
      poner('contacto.nombre', u.nombre); poner('contacto.apellido', u.apellido); poner('contacto.email', u.email);
      poner('contacto.telefono', u.telefono); poner('contacto.rut', u.rut);
      if (direccion) {
        poner('despacho.region', direccion.region); poner('despacho.comuna', direccion.comuna); poner('despacho.calle', direccion.calle);
        poner('despacho.depto', direccion.depto); poner('despacho.referencia', direccion.referencia);
      }
    } catch { /* se completa a mano */ }
  }
  await cotizar();
  irAPaso(1, false);
}

iniciar();

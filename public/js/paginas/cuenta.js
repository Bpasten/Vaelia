/** Mi cuenta: pedidos con seguimiento (HU20, HU21), datos (HU19) y dirección. */
import { api, clp, esc, fecha, dia, icono, marcarErrores } from '../api.js';
import { iniciarPagina, cerrarSesion, obtenerSesion, toast } from '../ui.js';

iniciarPagina();

const app = document.querySelector('[data-cuenta-app]');
const tabs = [...document.querySelectorAll('[data-tab]')];
const paneles = [...document.querySelectorAll('[data-panel]')];
const cargados = new Set();

function mostrar(nombre) {
  if (!paneles.some((p) => p.dataset.panel === nombre)) nombre = 'pedidos';
  tabs.forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === nombre)));
  paneles.forEach((p) => { p.hidden = p.dataset.panel !== nombre; });
  if (location.hash !== `#${nombre}`) history.replaceState(null, '', `#${nombre}`);
  if (nombre === 'pedidos' && !cargados.has('pedidos')) cargarPedidos();
}

tabs.forEach((t) => t.addEventListener('click', () => mostrar(t.dataset.tab)));
window.addEventListener('hashchange', () => mostrar(location.hash.slice(1)));
document.querySelector('[data-salir]').addEventListener('click', (e) => { e.preventDefault(); cerrarSesion(); });

function alerta(form, mensaje, tipo = '') {
  const el = form.querySelector('[data-alerta]');
  el.className = `alerta${tipo ? ' alerta--' + tipo : ''}`;
  el.innerHTML = mensaje ? `${icono(tipo === 'exito' ? 'check' : 'alerta')}<span>${esc(mensaje)}</span>` : '';
  el.hidden = !mensaje;
}

// ---------- Pedidos ----------
const estadoHtml = (estado, nombre) => `<span class="estado estado--${esc(estado)}">${esc(nombre)}</span>`;

async function cargarPedidos() {
  cargados.add('pedidos');
  const caja = document.querySelector('[data-pedidos]');
  caja.innerHTML = '<p class="resultado">Cargando tus pedidos…</p>';
  try {
    const { pedidos } = await api('/cuenta/pedidos');
    if (!pedidos.length) {
      caja.innerHTML = `
        <div class="vacio">
          ${icono('paquete')}
          <h2>Aún no tienes pedidos</h2>
          <p>Cuando compres, aquí podrás seguir el estado de cada uno.</p>
          <a class="btn btn-primario" href="/coleccion">Ver colección ${icono('flecha', 'i i-flecha')}</a>
        </div>`;
      return;
    }
    caja.innerHTML = pedidos.map((p) => `
      <details class="pedido-fila" data-codigo="${esc(p.codigo)}">
        <summary>
          <img src="${esc(p.imagen || '/img/favicon.svg')}" alt="" width="56" height="70">
          <span><strong>#${esc(p.codigo)}</strong><small>${esc(dia(p.created_at))} · ${p.unidades} ${p.unidades === 1 ? 'prenda' : 'prendas'}</small></span>
          ${estadoHtml(p.estado, p.estado_nombre)}
          <span class="pedido-total">${clp(p.total)}</span>
          ${icono('chevron')}
        </summary>
        <div class="pedido-fila__detalle" data-detalle><p class="resultado">Cargando detalle…</p></div>
      </details>`).join('');
  } catch (err) {
    caja.innerHTML = `<p class="resultado">${esc(err.message)}</p>`;
  }
}

document.querySelector('[data-pedidos]').addEventListener('toggle', async (e) => {
  const fila = e.target;
  if (!fila.open || fila.dataset.cargado) return;
  fila.dataset.cargado = '1';
  const det = fila.querySelector('[data-detalle]');
  try {
    const { pedido: p } = await api(`/cuenta/pedidos/${encodeURIComponent(fila.dataset.codigo)}`);
    det.innerHTML = `
      <div>
        <h3 class="subtitulo">Productos</h3>
        ${p.items.map((it) => `
          <div class="resumen-item">
            <div class="resumen-item__img"><img src="${esc(it.imagen)}" alt="" width="64" height="80"><span>${it.cantidad}</span></div>
            <div><strong>${esc(it.producto_nombre)}</strong><small>${esc(it.color_nombre)} · Talla ${esc(it.talla)}</small></div>
            <span class="resumen-item__precio">${clp(it.subtotal)}</span>
          </div>`).join('')}
        <div class="fila-total"><span>Subtotal</span><span>${clp(p.subtotal)}</span></div>
        <div class="fila-total"><span>Envío</span><span>${p.costo_envio ? clp(p.costo_envio) : 'Gratis'}</span></div>
        <div class="fila-total fila-total--grande"><span>Total</span><strong>${clp(p.total)}</strong></div>
      </div>
      <div>
        <h3 class="subtitulo">Seguimiento</h3>
        <p class="resumen-paso">Estado actual: ${estadoHtml(p.estado, p.estado_nombre)}<br>Última actualización: ${esc(fecha(p.updated_at))}</p>
        <ol class="linea-tiempo">
          ${p.historial.slice().reverse().map((h) => `<li><strong>${esc(h.estado_nombre)}</strong>${h.nota ? esc(h.nota) + '<br>' : ''}<time datetime="${esc(h.created_at)}">${esc(fecha(h.created_at))}</time></li>`).join('')}
        </ol>
        <h3 class="subtitulo">Entrega</h3>
        <p class="resumen-paso">${p.tipo_despacho === 'retiro' ? 'Retiro en showroom' : `${esc(p.calle)}${p.depto ? ', ' + esc(p.depto) : ''}<br>${esc(p.comuna)}, ${esc(p.region)}`}</p>
        ${p.pago?.estado === 'autorizado' ? `<h3 class="subtitulo">Pago</h3><p class="resumen-paso">Webpay · ${esc(p.pago.tipo_pago || '')} ${p.pago.card_last4 ? `**** ${esc(p.pago.card_last4)}` : ''}<br>Autorización ${esc(p.pago.authorization_code)}</p>` : ''}
      </div>`;
  } catch (err) {
    det.innerHTML = `<p class="resultado">${esc(err.message)}</p>`;
    delete fila.dataset.cargado;
  }
}, true);

// ---------- Datos personales ----------
const formDatos = document.querySelector('[data-form-datos]');
formDatos.addEventListener('submit', async (e) => {
  e.preventDefault();
  alerta(formDatos, '');
  marcarErrores(formDatos, {});
  const cuerpo = Object.fromEntries(['nombre', 'apellido', 'email', 'telefono', 'rut'].map((k) => [k, formDatos[k].value.trim()]));
  const btn = formDatos.querySelector('[type="submit"]');
  btn.setAttribute('aria-busy', 'true');
  try {
    const { usuario } = await api('/cuenta', { metodo: 'PUT', cuerpo });
    pintarUsuario(usuario);
    alerta(formDatos, 'Tus datos se guardaron correctamente.', 'exito');
    toast('Datos actualizados.');
  } catch (err) {
    alerta(formDatos, err.message);
    if (err.campos) marcarErrores(formDatos, err.campos);
  } finally {
    btn.removeAttribute('aria-busy');
  }
});

// ---------- Dirección ----------
const formDir = document.querySelector('[data-form-direccion]');
formDir.addEventListener('submit', async (e) => {
  e.preventDefault();
  alerta(formDir, '');
  marcarErrores(formDir, {});
  const cuerpo = Object.fromEntries(['region', 'comuna', 'calle', 'depto', 'referencia'].map((k) => [k, formDir[k].value.trim()]));
  const btn = formDir.querySelector('[type="submit"]');
  btn.setAttribute('aria-busy', 'true');
  try {
    await api('/cuenta/direccion', { metodo: 'PUT', cuerpo });
    alerta(formDir, 'Dirección guardada. La usaremos en tu próximo despacho.', 'exito');
    toast('Dirección guardada.');
  } catch (err) {
    alerta(formDir, err.message);
    if (err.campos) marcarErrores(formDir, err.campos);
  } finally {
    btn.removeAttribute('aria-busy');
  }
});

function pintarUsuario(u) {
  document.querySelector('[data-hola]').textContent = `Hola, ${u.nombre}`;
  document.querySelector('[data-email]').textContent = u.email;
  for (const k of ['nombre', 'apellido', 'email', 'telefono', 'rut']) formDatos[k].value = u[k] || '';
}

// ---------- Inicio ----------
(async () => {
  const sesion = await obtenerSesion();
  if (!sesion) {
    location.replace(`/cuenta?volver=${encodeURIComponent('/mi-cuenta' + location.hash)}`);
    return;
  }
  try {
    const [{ usuario, direccion }, { regiones }] = await Promise.all([api('/cuenta'), api('/checkout/config')]);
    pintarUsuario(usuario);
    formDir.region.insertAdjacentHTML('beforeend', regiones.map((r) => `<option value="${esc(r)}">${esc(r)}</option>`).join(''));
    if (direccion) for (const k of ['region', 'comuna', 'calle', 'depto', 'referencia']) formDir[k].value = direccion[k] || '';
    app.hidden = false;
    mostrar(location.hash.slice(1) || 'pedidos');
  } catch (err) {
    if (err.status === 401) location.replace('/cuenta?volver=/mi-cuenta');
    else toast(err.message, 'error');
  }
})();

/**
 * Resultado del pago (HU14). Muestra la confirmación con los datos que exige
 * Transbank en el comprobante, o el motivo por el que el pago no se completó.
 */
import { api, clp, esc, fecha, icono } from '../api.js';
import { iniciarPagina } from '../ui.js';
import * as carrito from '../carrito.js';

iniciarPagina({ cabecera: 'ninguna' });

const caja = document.querySelector('[data-resultado]');
const params = new URLSearchParams(location.search);
const publicId = params.get('pedido');

const MOTIVOS = {
  rechazado: ['El pago fue rechazado', 'Tu banco o Webpay no autorizó la transacción. No se realizó ningún cargo. Puedes intentarlo con otra tarjeta.'],
  anulado: ['Pago anulado', 'Cancelaste el pago en Webpay, así que no se realizó ningún cargo.'],
  timeout: ['Se agotó el tiempo', 'El tiempo para completar el pago en Webpay expiró y no se realizó ningún cargo.'],
  error: ['No pudimos completar el pago', 'Hubo un problema al confirmar la transacción con Webpay. No se realizó ningún cargo.'],
};

function vistaFallida(motivo, codigo) {
  const [titulo, texto] = MOTIVOS[motivo] || MOTIVOS.error;
  document.title = `${titulo} · Vaelia`;
  caja.innerHTML = `
    <div class="confirmacion confirmacion--simple">
      <div class="confirmacion__estado">
        ${icono('x-circulo', 'confirmacion__icono confirmacion__icono--error')}
        <h1>${esc(titulo)}</h1>
        <p class="confirmacion__texto">${esc(texto)} Tu carrito sigue guardado.</p>
        ${codigo ? `<p class="confirmacion__numero">Orden de compra: <strong>${esc(codigo)}</strong></p>` : ''}
        <div class="confirmacion__acciones">
          <a class="btn btn-primario" href="/checkout">Volver a intentar ${icono('flecha', 'i i-flecha')}</a>
          <a class="btn btn-borde" href="/coleccion">Seguir comprando</a>
        </div>
      </div>
    </div>`;
}

function vistaExitosa({ pedido, pago }) {
  carrito.vaciar(); // el pedido ya quedó registrado en MySQL
  document.title = '¡Gracias por tu compra! · Vaelia';
  const despacho = pedido.tipo_despacho === 'retiro'
    ? 'Retiro en showroom (te avisaremos cuando esté listo)'
    : `Despacho a domicilio · ${esc(pedido.comuna)}, ${esc(pedido.region)}`;

  caja.innerHTML = `
    <div class="confirmacion">
      <div class="confirmacion__estado">
        ${icono('check-circulo', 'confirmacion__icono')}
        <h1>¡Gracias por tu compra!</h1>
        <p class="confirmacion__texto">${esc(pedido.nombre)}, tu pago fue aprobado y ya estamos preparando tu pedido.</p>
        <p class="confirmacion__numero">N° de pedido: <strong>#${esc(pedido.codigo)}</strong></p>
        <div class="confirmacion__acciones">
          ${pedido.con_cuenta
            ? `<a class="btn btn-primario" href="/mi-cuenta#pedidos">Ver detalle del pedido ${icono('flecha', 'i i-flecha')}</a>`
            : `<a class="btn btn-primario" href="/coleccion">Seguir comprando ${icono('flecha', 'i i-flecha')}</a>`}
        </div>
        <img class="confirmacion__bolsa" src="/img/marca/bolsa.jpg" alt="Bolsa Vaelia" width="660" height="580">
        <p class="confirmacion__despedida">Nos vemos pronto.</p>
      </div>

      <div>
        <section class="comprobante" aria-labelledby="comprobante-titulo">
          <h2 id="comprobante-titulo">Comprobante de pago</h2>
          <dl>
            <dt>Comercio</dt><dd>${esc(pago.comercio)}</dd>
            <dt>Orden de compra</dt><dd>${esc(pago.orden_compra)}</dd>
            <dt>Monto</dt><dd>${clp(pago.monto)} ${esc(pago.moneda)}</dd>
            <dt>Código de autorización</dt><dd>${esc(pago.codigo_autorizacion)}</dd>
            <dt>Fecha</dt><dd>${esc(fecha(pago.fecha || pedido.creado))}</dd>
            <dt>Tipo de pago</dt><dd>${esc(pago.tipo_pago || '—')}</dd>
            <dt>Cuotas</dt><dd>${pago.cuotas > 0 ? `${pago.cuotas} · ${esc(pago.tipo_cuotas)}` : 'Sin cuotas'}</dd>
            <dt>Tarjeta</dt><dd>${esc(pago.tarjeta || '—')}</dd>
          </dl>

          <h3 class="subtitulo">Productos</h3>
          <div class="resumen__items">
            ${pedido.items.map((it) => `
              <div class="resumen-item">
                <div class="resumen-item__img"><img src="${esc(it.imagen)}" alt="" width="64" height="80"><span>${it.cantidad}</span></div>
                <div><strong>${esc(it.producto_nombre)}</strong><small>${esc(it.color_nombre)} · Talla ${esc(it.talla)}</small></div>
                <span class="resumen-item__precio">${clp(it.subtotal)}</span>
              </div>`).join('')}
          </div>
          <div class="fila-total"><span>Subtotal</span><span>${clp(pedido.subtotal)}</span></div>
          <div class="fila-total"><span>Envío</span><span>${pedido.costo_envio ? clp(pedido.costo_envio) : 'Gratis'}</span></div>
          <div class="fila-total fila-total--grande"><span>Total pagado</span><strong>${clp(pedido.total)}</strong></div>
          <p class="resumen-paso">${despacho}<br>Contacto: ${esc(pedido.email)}</p>
        </section>
      </div>
    </div>`;
}

function vistaPendiente(pedido) {
  caja.innerHTML = `
    <div class="confirmacion confirmacion--simple">
      <div class="confirmacion__estado">
        ${icono('reloj', 'confirmacion__icono confirmacion__icono--aviso')}
        <h1>Pago en proceso</h1>
        <p class="confirmacion__texto">Aún no recibimos la confirmación de Webpay para el pedido <strong>#${esc(pedido.codigo)}</strong>. Si cerraste la ventana de pago, puedes volver a intentarlo.</p>
        <div class="confirmacion__acciones">
          <button class="btn btn-primario" type="button" data-recargar>Actualizar estado</button>
          <a class="btn btn-borde" href="/checkout">Volver al pago</a>
        </div>
      </div>
    </div>`;
  caja.querySelector('[data-recargar]').addEventListener('click', () => location.reload());
}

async function iniciar() {
  if (!publicId) return vistaFallida(params.get('estado') || 'error');
  try {
    const datos = await api(`/pedidos/${encodeURIComponent(publicId)}`);
    const { pedido, pago } = datos;
    if (['pagado', 'en_preparacion', 'despachado', 'entregado'].includes(pedido.estado) && pago?.estado === 'autorizado') {
      return vistaExitosa(datos);
    }
    if (pedido.estado === 'pendiente_pago') return vistaPendiente(pedido);
    const motivo = { rechazado: 'rechazado', anulado: 'anulado', timeout: 'timeout' }[pago?.estado] || 'error';
    return vistaFallida(motivo, pedido.codigo);
  } catch {
    vistaFallida('error');
  }
}

iniciar();

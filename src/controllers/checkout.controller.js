/**
 * Checkout (HU12, HU13) e inicio del pago con Webpay Plus.
 * Flujo: validar datos → crear pedido reservando stock → crear transacción en
 * Webpay → el navegador envía token_ws al formulario de Transbank.
 */
const crypto = require('crypto');
const { query } = require('../config/db');
const HttpError = require('../utils/http-error');
const v = require('../utils/validar');
const pedidos = require('../services/pedidos.service');
const { resumenReglas } = require('../services/envio.service');
const { webpay, urlRetorno } = require('../config/transbank');
const { guardarDireccionPrincipal } = require('./cuenta.controller');

function leerDespacho(body) {
  return { tipo: 'domicilio', ...v.direccion(body.despacho || {}) };
}

/** GET /api/checkout/config — reglas de envío y regiones para el formulario */
function configuracion(_req, res) {
  res.json({ envio: resumenReglas(), regiones: v.REGIONES });
}

/** POST /api/checkout/cotizar — revalida el carrito y calcula envío y total */
async function cotizar(req, res) {
  const region = v.REGIONES.includes(req.body?.despacho?.region) ? req.body.despacho.region : null;
  const cot = await pedidos.cotizar(req.body?.items, { region });
  res.json(cot);
}

/** POST /api/checkout — crea el pedido e inicia la transacción Webpay */
async function iniciarPago(req, res) {
  const body = req.body || {};
  const errores = {};
  let contacto;
  let despacho;
  try { contacto = v.contacto(body.contacto || {}); } catch (e) { if (e.detalles) Object.assign(errores, e.detalles); else throw e; }
  try { despacho = leerDespacho(body); } catch (e) { if (e.detalles) Object.assign(errores, e.detalles); else throw e; }
  if (body.acepta_terminos !== true) errores.terminos = 'Debes aceptar los términos y condiciones.';
  v.exigir(errores);

  const usuarioId = req.usuario?.id || null;
  const pedido = await pedidos.crearPedido({ usuarioId, contacto, despacho, items: body.items });

  // Datos de una clienta con cuenta: se guardan para su próxima compra
  if (usuarioId) {
    await query('UPDATE usuarios SET telefono = COALESCE(telefono, ?), rut = COALESCE(rut, ?) WHERE id = ?', [contacto.telefono, contacto.rut, usuarioId]);
    if (body.guardar_direccion && despacho.tipo === 'domicilio') await guardarDireccionPrincipal(usuarioId, despacho);
  }

  const sessionId = `S${pedido.id}-${crypto.randomBytes(6).toString('hex')}`;
  let respuesta;
  try {
    respuesta = await webpay.create(pedido.codigo, sessionId, pedido.total, urlRetorno);
  } catch (err) {
    console.error('[webpay.create]', err.message);
    await pedidos.liberarPedido(pedido.id, 'cancelado', 'No fue posible conectar con Webpay.');
    throw new HttpError(502, 'No pudimos conectar con Webpay. Tu carrito sigue guardado, intenta nuevamente en unos minutos.');
  }

  await query(
    'INSERT INTO pagos (pedido_id, token, buy_order, session_id, monto) VALUES (?, ?, ?, ?, ?)',
    [pedido.id, respuesta.token, pedido.codigo, sessionId, pedido.total],
  );

  res.status(201).json({ url: respuesta.url, token: respuesta.token, codigo: pedido.codigo });
}

module.exports = { configuracion, cotizar, iniciarPago };

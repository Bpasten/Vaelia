/**
 * Resultado de un pedido para la página de confirmación.
 * Se accede con el public_id (32 caracteres aleatorios) que solo conoce quien compró.
 * Incluye los datos que Transbank exige mostrar en el comprobante.
 */
const { query } = require('../config/db');
const HttpError = require('../utils/http-error');
const { ESTADOS, TIPOS_PAGO } = require('../utils/estados');

const ocultarEmail = (e) => e.replace(/^(.{1,2})[^@]*(@.*)$/, (_, a, b) => `${a}•••${b}`);

async function publico(req, res) {
  const id = String(req.params.publicId || '');
  if (!/^[a-f0-9]{32}$/.test(id)) throw new HttpError(404, 'Pedido no encontrado.');

  const [p] = await query('SELECT * FROM pedidos WHERE public_id = ?', [id]);
  if (!p) throw new HttpError(404, 'Pedido no encontrado.');

  const items = await query('SELECT producto_nombre, color_nombre, talla, imagen, precio_unitario, cantidad, subtotal FROM pedido_items WHERE pedido_id = ?', [p.id]);
  const [pago] = await query('SELECT * FROM pagos WHERE pedido_id = ? ORDER BY id DESC LIMIT 1', [p.id]);

  res.json({
    pedido: {
      codigo: p.codigo,
      estado: p.estado,
      estado_nombre: ESTADOS[p.estado],
      creado: p.created_at,
      nombre: p.nombre,
      email: ocultarEmail(p.email),
      tipo_despacho: p.tipo_despacho,
      comuna: p.comuna,
      region: p.region,
      subtotal: p.subtotal,
      costo_envio: p.costo_envio,
      total: p.total,
      con_cuenta: Boolean(p.usuario_id),
      items,
    },
    pago: pago ? {
      estado: pago.estado,
      comercio: 'Vaelia',
      orden_compra: pago.buy_order,
      monto: pago.monto,
      moneda: 'CLP',
      codigo_autorizacion: pago.authorization_code,
      fecha: pago.transaction_date,
      tipo_pago: TIPOS_PAGO[pago.payment_type_code] || null,
      tipo_cuotas: pago.payment_type_code === 'VC' || ['SI', 'S2', 'NC'].includes(pago.payment_type_code) ? TIPOS_PAGO[pago.payment_type_code] : 'Sin cuotas',
      cuotas: pago.installments_number || 0,
      tarjeta: pago.card_last4 ? `**** ${pago.card_last4}` : null,
      codigo_respuesta: pago.response_code,
    } : null,
  });
}

module.exports = { publico };

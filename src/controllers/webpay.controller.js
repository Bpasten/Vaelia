const { query } = require('../config/db');
const { webpay } = require('../config/transbank');
const pedidos = require('../services/pedidos.service');

const destino = (publicId) => `/confirmacion?pedido=${encodeURIComponent(publicId)}`;

/** Toma el pago para procesarlo solo una vez (evita doble commit si se recarga la página). */
async function tomarPago(pagoId, nuevoEstado) {
  const r = await query('UPDATE pagos SET estado = ? WHERE id = ? AND estado = ?', [nuevoEstado, pagoId, 'iniciado']);
  return r.affectedRows === 1;
}

async function buscarPago(campo, valor) {
  const [pago] = await query(
    `SELECT pg.*, p.public_id, p.estado AS estado_pedido FROM pagos pg
     JOIN pedidos p ON p.id = pg.pedido_id WHERE pg.${campo} = ? ORDER BY pg.id DESC LIMIT 1`,
    [valor],
  );
  return pago;
}

async function retorno(req, res) {
  const datos = { ...req.query, ...(req.body || {}) };
  const tokenWs = typeof datos.token_ws === 'string' ? datos.token_ws : null;
  const tbkToken = typeof datos.TBK_TOKEN === 'string' ? datos.TBK_TOKEN : null;
  const ordenTbk = typeof datos.TBK_ORDEN_COMPRA === 'string' ? datos.TBK_ORDEN_COMPRA : null;

  // 1) Flujo normal: la persona terminó en el formulario de Webpay
  if (tokenWs && !tbkToken) {
    const pago = await buscarPago('token', tokenWs);
    if (!pago) return res.redirect(303, '/confirmacion?estado=error');
    if (!(await tomarPago(pago.id, 'confirmando'))) return res.redirect(303, destino(pago.public_id)); // ya procesado

    let commit;
    try {
      commit = await webpay.commit(tokenWs);
    } catch (err) {
      console.error('[webpay.commit]', err.message);
      await query("UPDATE pagos SET estado = 'error', respuesta = ? WHERE id = ?", [JSON.stringify({ error: err.message }), pago.id]);
      await pedidos.liberarPedido(pago.pedido_id, 'pago_rechazado', 'Webpay no confirmó la transacción.');
      return res.redirect(303, destino(pago.public_id));
    }

    const aprobado = commit?.status === 'AUTHORIZED'
      && Number(commit.response_code) === 0
      && Number(commit.amount) === Number(pago.monto)
      && commit.buy_order === pago.buy_order;

    await query(
      `UPDATE pagos SET estado = ?, response_code = ?, authorization_code = ?, payment_type_code = ?,
         installments_number = ?, card_last4 = ?, transaction_date = ?, respuesta = ? WHERE id = ?`,
      [
        aprobado ? 'autorizado' : 'rechazado',
        Number.isFinite(Number(commit?.response_code)) ? Number(commit.response_code) : null,
        commit?.authorization_code || null,
        commit?.payment_type_code || null,
        Number.isFinite(Number(commit?.installments_number)) ? Number(commit.installments_number) : null,
        commit?.card_detail?.card_number ? String(commit.card_detail.card_number).slice(-4) : null,
        commit?.transaction_date ? new Date(commit.transaction_date) : null,
        JSON.stringify(commit),
        pago.id,
      ],
    );

    if (aprobado) {
      await pedidos.marcarPagado(pago.pedido_id, `Pago aprobado por Webpay. Código de autorización ${commit.authorization_code}.`);
    } else {
      await pedidos.liberarPedido(pago.pedido_id, 'pago_rechazado', `Pago rechazado por Webpay (código ${commit?.response_code}).`);
    }
    return res.redirect(303, destino(pago.public_id));
  }

  // 2) Anulación por la persona o error en el formulario de pago
  if (tbkToken) {
    const pago = await buscarPago('token', tbkToken);
    if (!pago) return res.redirect(303, '/confirmacion?estado=anulado');
    if (await tomarPago(pago.id, 'anulado')) {
      await pedidos.liberarPedido(pago.pedido_id, 'cancelado', 'Pago anulado en Webpay.');
    }
    return res.redirect(303, destino(pago.public_id));
  }

  // 3) Tiempo agotado en el formulario de Webpay
  if (ordenTbk) {
    const pago = await buscarPago('buy_order', ordenTbk);
    if (!pago) return res.redirect(303, '/confirmacion?estado=timeout');
    if (await tomarPago(pago.id, 'timeout')) {
      await pedidos.liberarPedido(pago.pedido_id, 'cancelado', 'Se agotó el tiempo para pagar en Webpay.');
    }
    return res.redirect(303, destino(pago.public_id));
  }

  return res.redirect(303, '/confirmacion?estado=error');
}

module.exports = { retorno };

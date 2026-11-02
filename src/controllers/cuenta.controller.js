/** Área de cliente: datos personales (HU19), dirección e historial de pedidos (HU20, HU21). */
const { query } = require('../config/db');
const HttpError = require('../utils/http-error');
const v = require('../utils/validar');
const { publico } = require('./auth.controller');
const { ESTADOS, TIPOS_PAGO } = require('../utils/estados');

async function obtenerDireccion(usuarioId) {
  const [d] = await query(
    'SELECT region, comuna, calle, depto, referencia FROM direcciones WHERE usuario_id = ? ORDER BY es_principal DESC, id DESC LIMIT 1',
    [usuarioId],
  );
  return d || null;
}

/** Inserta o actualiza la dirección principal de la usuaria. */
async function guardarDireccionPrincipal(usuarioId, d) {
  const [actual] = await query('SELECT id FROM direcciones WHERE usuario_id = ? AND es_principal = 1 LIMIT 1', [usuarioId]);
  if (actual) {
    await query('UPDATE direcciones SET region = ?, comuna = ?, calle = ?, depto = ?, referencia = ? WHERE id = ?',
      [d.region, d.comuna, d.calle, d.depto, d.referencia, actual.id]);
  } else {
    await query('INSERT INTO direcciones (usuario_id, region, comuna, calle, depto, referencia, es_principal) VALUES (?, ?, ?, ?, ?, ?, 1)',
      [usuarioId, d.region, d.comuna, d.calle, d.depto, d.referencia]);
  }
}

/** GET /api/cuenta */
async function perfil(req, res) {
  const [u] = await query('SELECT * FROM usuarios WHERE id = ?', [req.usuario.id]);
  if (!u) throw new HttpError(401, 'Tu sesión expiró. Inicia sesión nuevamente.');
  res.json({ usuario: publico(u), direccion: await obtenerDireccion(u.id) });
}

/** PUT /api/cuenta — actualizar datos personales */
async function actualizarPerfil(req, res) {
  const datos = v.contacto(req.body || {}, { telefonoObligatorio: false });
  const otro = await query('SELECT id FROM usuarios WHERE email = ? AND id <> ?', [datos.email, req.usuario.id]);
  if (otro.length) throw new HttpError(409, 'Ese correo ya está en uso por otra cuenta.', { email: 'Correo en uso.' });
  await query('UPDATE usuarios SET nombre = ?, apellido = ?, email = ?, telefono = ?, rut = ? WHERE id = ?',
    [datos.nombre, datos.apellido, datos.email, datos.telefono || null, datos.rut, req.usuario.id]);
  const [u] = await query('SELECT * FROM usuarios WHERE id = ?', [req.usuario.id]);
  res.json({ usuario: publico(u) });
}

/** PUT /api/cuenta/direccion */
async function actualizarDireccion(req, res) {
  const d = v.direccion(req.body || {});
  await guardarDireccionPrincipal(req.usuario.id, d);
  res.json({ direccion: await obtenerDireccion(req.usuario.id) });
}

/** GET /api/cuenta/pedidos — historial (HU20) */
async function misPedidos(req, res) {
  const pedidos = await query(
    `SELECT p.id, p.codigo, p.estado, p.total, p.tipo_despacho, p.created_at, p.updated_at,
            (SELECT COALESCE(SUM(cantidad), 0) FROM pedido_items WHERE pedido_id = p.id) AS unidades,
            (SELECT imagen FROM pedido_items WHERE pedido_id = p.id ORDER BY id LIMIT 1) AS imagen
     FROM pedidos p WHERE p.usuario_id = ? ORDER BY p.created_at DESC, p.id DESC LIMIT 50`,
    [req.usuario.id],
  );
  res.json({
    pedidos: pedidos.map(({ id, ...p }) => ({ ...p, unidades: Number(p.unidades), estado_nombre: ESTADOS[p.estado] })),
  });
}

/** GET /api/cuenta/pedidos/:codigo — detalle y seguimiento (HU21) */
async function detallePedido(req, res) {
  const [p] = await query('SELECT * FROM pedidos WHERE codigo = ? AND usuario_id = ?', [v.texto(req.params.codigo), req.usuario.id]);
  if (!p) throw new HttpError(404, 'No encontramos este pedido en tu cuenta.');
  const items = await query('SELECT producto_nombre, color_nombre, talla, imagen, precio_unitario, cantidad, subtotal FROM pedido_items WHERE pedido_id = ?', [p.id]);
  const historial = await query('SELECT estado, nota, created_at FROM pedido_historial WHERE pedido_id = ? ORDER BY created_at, id', [p.id]);
  const [pago] = await query(
    "SELECT estado, authorization_code, card_last4, payment_type_code, installments_number, transaction_date FROM pagos WHERE pedido_id = ? ORDER BY id DESC LIMIT 1",
    [p.id],
  );
  res.json({
    pedido: {
      codigo: p.codigo, estado: p.estado, estado_nombre: ESTADOS[p.estado], created_at: p.created_at, updated_at: p.updated_at,
      tipo_despacho: p.tipo_despacho, region: p.region, comuna: p.comuna, calle: p.calle, depto: p.depto,
      subtotal: p.subtotal, costo_envio: p.costo_envio, total: p.total,
      items,
      historial: historial.map((h) => ({ ...h, estado_nombre: ESTADOS[h.estado] || h.estado })),
      pago: pago ? { ...pago, tipo_pago: TIPOS_PAGO[pago.payment_type_code] || null } : null,
    },
  });
}

module.exports = { perfil, actualizarPerfil, actualizarDireccion, misPedidos, detallePedido, obtenerDireccion, guardarDireccionPrincipal };

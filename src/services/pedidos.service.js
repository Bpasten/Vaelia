/**
 * Lógica de negocio de pedidos y stock.
 *
 * Regla clave (HU06): el stock se RESERVA al crear el pedido, dentro de una
 * transacción con bloqueo de filas, así dos personas no pueden comprar la
 * última unidad al mismo tiempo. Si el pago no se concreta (rechazo, anulación
 * o expiración) el stock se devuelve una sola vez.
 */
const crypto = require('crypto');
const { query, transaccion } = require('../config/db');
const HttpError = require('../utils/http-error');
const { costoEnvio } = require('./envio.service');
const config = require('../config/env');

const MAX_LINEAS = 20;
const MAX_POR_LINEA = 10;

/** Normaliza el carrito recibido: [{ variante_id, cantidad }] sin duplicados. */
function normalizarItems(items) {
  if (!Array.isArray(items) || items.length === 0) throw new HttpError(422, 'Tu carrito está vacío.');
  const mapa = new Map();
  for (const it of items) {
    const id = Number(it?.variante_id);
    const cant = Number(it?.cantidad);
    if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(cant) || cant <= 0) {
      throw new HttpError(422, 'El carrito contiene un producto inválido.');
    }
    mapa.set(id, (mapa.get(id) || 0) + cant);
  }
  if (mapa.size > MAX_LINEAS) throw new HttpError(422, `Puedes comprar hasta ${MAX_LINEAS} productos distintos por pedido.`);
  for (const [, cant] of mapa) {
    if (cant > MAX_POR_LINEA) throw new HttpError(422, `Máximo ${MAX_POR_LINEA} unidades por producto.`);
  }
  return [...mapa].map(([variante_id, cantidad]) => ({ variante_id, cantidad }));
}

const SQL_VARIANTES = `
  SELECT v.id AS variante_id, v.stock, v.talla, p.id AS producto_id, p.nombre, p.slug, p.precio, p.activo,
         co.nombre AS color, co.slug AS color_slug, co.hex AS color_hex,
         (SELECT pi.url FROM producto_imagenes pi
           WHERE pi.producto_id = p.id AND pi.color_id = co.id ORDER BY pi.orden LIMIT 1) AS imagen
  FROM variantes v
  JOIN productos p ON p.id = v.producto_id
  JOIN colores co ON co.id = v.color_id
  WHERE v.id IN (?)`;

/**
 * Valida el carrito contra la base de datos y calcula totales.
 * Los precios SIEMPRE salen de MySQL, nunca del navegador.
 */
async function cotizar(itemsEntrada, { region = null } = {}, conn = null) {
  const items = normalizarItems(itemsEntrada);
  const ids = items.map((i) => i.variante_id);
  const sql = conn ? SQL_VARIANTES + ' FOR UPDATE' : SQL_VARIANTES;
  const filas = conn ? (await conn.query(sql, [ids]))[0] : await query(sql, [ids]);
  const porId = new Map(filas.map((f) => [f.variante_id, f]));

  const lineas = [];
  const problemas = [];
  for (const it of items) {
    const v = porId.get(it.variante_id);
    if (!v || !v.activo) {
      problemas.push({ variante_id: it.variante_id, mensaje: 'Este producto ya no está disponible.' });
      continue;
    }
    if (v.stock < it.cantidad) {
      problemas.push({
        variante_id: it.variante_id,
        disponible: v.stock,
        mensaje: v.stock === 0
          ? `${v.nombre} (${v.color}, ${v.talla}) se agotó.`
          : `Solo quedan ${v.stock} unidades de ${v.nombre} (${v.color}, ${v.talla}).`,
      });
    }
    lineas.push({
      variante_id: v.variante_id, producto_id: v.producto_id, slug: v.slug, nombre: v.nombre,
      color: v.color, color_slug: v.color_slug, color_hex: v.color_hex, talla: v.talla,
      imagen: v.imagen, precio: v.precio, cantidad: it.cantidad, stock: v.stock,
      subtotal: v.precio * it.cantidad,
    });
  }
  const subtotal = lineas.reduce((s, l) => s + l.subtotal, 0);
  const envio = costoEnvio(subtotal, region);
  return { lineas, problemas, subtotal, envio, total: subtotal + envio };
}

const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function nuevoCodigo() {
  const d = new Date();
  const fecha = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
  const sufijo = Array.from(crypto.randomBytes(5), (b) => ALFABETO[b % ALFABETO.length]).join('');
  return `VAE-${fecha}-${sufijo}`; // 16 caracteres (Webpay admite hasta 26)
}

/** Crea el pedido reservando stock. Devuelve { id, codigo, public_id, total }. */
async function crearPedido({ usuarioId, contacto, despacho, items }) {
  return transaccion(async (conn) => {
    const cot = await cotizar(items, despacho, conn);
    if (cot.problemas.length) {
      throw new HttpError(409, cot.problemas[0].mensaje, { problemas: cot.problemas });
    }

    for (const l of cot.lineas) {
      const [r] = await conn.query('UPDATE variantes SET stock = stock - ? WHERE id = ? AND stock >= ?', [l.cantidad, l.variante_id, l.cantidad]);
      if (r.affectedRows !== 1) throw new HttpError(409, `${l.nombre} (${l.color}, ${l.talla}) ya no tiene stock suficiente.`);
    }

    const publicId = crypto.randomBytes(16).toString('hex');
    let codigo;
    let pedidoId;
    for (let intento = 0; intento < 5 && !pedidoId; intento++) {
      codigo = nuevoCodigo();
      try {
        const [r] = await conn.query(
          `INSERT INTO pedidos (codigo, public_id, usuario_id, nombre, apellido, email, telefono, rut,
             tipo_despacho, region, comuna, calle, depto, referencia, subtotal, costo_envio, total)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [codigo, publicId, usuarioId || null, contacto.nombre, contacto.apellido, contacto.email, contacto.telefono, contacto.rut,
            despacho.tipo, despacho.region || null, despacho.comuna || null, despacho.calle || null, despacho.depto || null,
            despacho.referencia || null, cot.subtotal, cot.envio, cot.total],
        );
        pedidoId = r.insertId;
      } catch (err) {
        if (err.code !== 'ER_DUP_ENTRY') throw err; // código repetido: se reintenta
      }
    }
    if (!pedidoId) throw new Error('No se pudo generar un código de pedido único.');

    const valores = cot.lineas.map((l) => [pedidoId, l.variante_id, l.nombre, l.color, l.talla, l.imagen, l.precio, l.cantidad, l.subtotal]);
    await conn.query(
      'INSERT INTO pedido_items (pedido_id, variante_id, producto_nombre, color_nombre, talla, imagen, precio_unitario, cantidad, subtotal) VALUES ?',
      [valores],
    );
    await conn.query('INSERT INTO pedido_historial (pedido_id, estado, nota) VALUES (?, ?, ?)', [pedidoId, 'pendiente_pago', 'Pedido creado, esperando pago en Webpay.']);

    return { id: pedidoId, codigo, public_id: publicId, total: cot.total };
  });
}

/**
 * Cierra un pedido que no se pagó y devuelve su stock.
 * Solo actúa si el pedido sigue "pendiente_pago" → nunca devuelve stock dos veces.
 */
async function liberarPedido(pedidoId, estado, nota) {
  return transaccion(async (conn) => {
    const [r] = await conn.query("UPDATE pedidos SET estado = ? WHERE id = ? AND estado = 'pendiente_pago'", [estado, pedidoId]);
    if (r.affectedRows !== 1) return false;
    const [items] = await conn.query('SELECT variante_id, cantidad FROM pedido_items WHERE pedido_id = ?', [pedidoId]);
    for (const it of items) {
      await conn.query('UPDATE variantes SET stock = stock + ? WHERE id = ?', [it.cantidad, it.variante_id]);
    }
    await conn.query('INSERT INTO pedido_historial (pedido_id, estado, nota) VALUES (?, ?, ?)', [pedidoId, estado, nota]);
    return true;
  });
}

/** Marca el pedido como pagado (el stock ya estaba reservado). */
async function marcarPagado(pedidoId, nota) {
  return transaccion(async (conn) => {
    const [r] = await conn.query("UPDATE pedidos SET estado = 'pagado' WHERE id = ? AND estado = 'pendiente_pago'", [pedidoId]);
    if (r.affectedRows === 1) {
      await conn.query('INSERT INTO pedido_historial (pedido_id, estado, nota) VALUES (?, ?, ?)', [pedidoId, 'pagado', nota]);
    }
    return r.affectedRows === 1;
  });
}

/**
 * Libera pedidos cuyo pago quedó abandonado (la persona cerró la pestaña de Webpay).
 * Si después Transbank devuelve a la persona, ese pago ya no se confirma (commit)
 * y Transbank lo reversa automáticamente.
 */
async function expirarPendientes() {
  const vencidos = await query(
    `SELECT pg.id AS pago_id, pg.pedido_id FROM pagos pg
     JOIN pedidos p ON p.id = pg.pedido_id
     WHERE pg.estado = 'iniciado' AND p.estado = 'pendiente_pago'
       AND pg.created_at < (UTC_TIMESTAMP() - INTERVAL ? MINUTE)`,
    [config.minutosExpiracionPago],
  );
  let liberados = 0;
  for (const v of vencidos) {
    const r = await query("UPDATE pagos SET estado = 'timeout' WHERE id = ? AND estado = 'iniciado'", [v.pago_id]);
    if (r.affectedRows === 1 && (await liberarPedido(v.pedido_id, 'cancelado', 'El tiempo para pagar expiró. Stock liberado.'))) liberados++;
  }
  // Pedidos que nunca llegaron a tener un pago registrado (falló la conexión con Webpay)
  const huerfanos = await query(
    `SELECT p.id FROM pedidos p LEFT JOIN pagos pg ON pg.pedido_id = p.id
     WHERE p.estado = 'pendiente_pago' AND pg.id IS NULL AND p.created_at < (UTC_TIMESTAMP() - INTERVAL ? MINUTE)`,
    [config.minutosExpiracionPago],
  );
  for (const h of huerfanos) {
    if (await liberarPedido(h.id, 'cancelado', 'El pago no se inició. Stock liberado.')) liberados++;
  }
  return liberados;
}

module.exports = { cotizar, crearPedido, liberarPedido, marcarPagado, expirarPendientes, normalizarItems };

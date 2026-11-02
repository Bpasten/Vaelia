/** Catálogo público: listado con filtros, filtros disponibles y ficha de producto. */
const { query } = require('../config/db');
const HttpError = require('../utils/http-error');
const { texto } = require('../utils/validar');

const TALLAS = ['XS', 'S', 'M', 'L', 'XL'];
const OCASIONES = { oficina: 'Oficina', reunion: 'Reunión', evento: 'Evento' };
const ORDENES = {
  destacados: 'p.destacado DESC, p.id ASC',
  recientes: 'p.created_at DESC, p.id DESC',
  precio_asc: 'p.precio ASC, p.id ASC',
  precio_desc: 'p.precio DESC, p.id ASC',
  nombre: 'p.nombre ASC',
};

/** Completa colores, imagen principal y tallas disponibles para una lista de productos. */
async function enriquecer(filas) {
  if (!filas.length) return [];
  const ids = filas.map((f) => f.id);
  const colores = await query(
    `SELECT v.producto_id, co.id AS color_id, co.slug, co.nombre, co.hex, SUM(v.stock) AS stock, MIN(v.id) AS orden,
            (SELECT pi.url FROM producto_imagenes pi WHERE pi.producto_id = v.producto_id AND pi.color_id = co.id ORDER BY pi.orden LIMIT 1) AS imagen
     FROM variantes v JOIN colores co ON co.id = v.color_id
     WHERE v.producto_id IN (?)
     GROUP BY v.producto_id, co.id, co.slug, co.nombre, co.hex
     ORDER BY orden`,
    [ids],
  );
  const tallas = await query(
    'SELECT producto_id, talla FROM variantes WHERE producto_id IN (?) AND stock > 0 GROUP BY producto_id, talla',
    [ids],
  );
  return filas.map((p) => {
    const cols = colores.filter((c) => c.producto_id === p.id).map((c) => ({
      slug: c.slug, nombre: c.nombre, hex: c.hex, imagen: c.imagen, stock: Number(c.stock),
    }));
    const tallasDisp = TALLAS.filter((t) => tallas.some((x) => x.producto_id === p.id && x.talla === t));
    return {
      id: p.id,
      slug: p.slug,
      nombre: p.nombre,
      precio: p.precio,
      categoria: { slug: p.categoria_slug, nombre: p.categoria_nombre },
      ocasion: p.ocasion,
      imagen: cols[0]?.imagen || null,
      colores: cols,
      tallas: tallasDisp,
      agotado: cols.every((c) => c.stock === 0),
    };
  });
}

const SELECT_BASE = `
  SELECT p.id, p.slug, p.nombre, p.precio, p.ocasion, p.created_at, c.slug AS categoria_slug, c.nombre AS categoria_nombre
  FROM productos p JOIN categorias c ON c.id = p.categoria_id`;

/** GET /api/productos?categoria=&color=&talla=&ocasion=&q=&orden=&pagina=&por_pagina= */
async function listar(req, res) {
  const q = req.query;
  const donde = ['p.activo = 1'];
  const params = [];

  const categoria = texto(q.categoria);
  if (categoria) { donde.push('c.slug = ?'); params.push(categoria); }

  const ocasion = texto(q.ocasion);
  if (ocasion && OCASIONES[ocasion]) { donde.push('p.ocasion = ?'); params.push(ocasion); }

  const busqueda = texto(q.q).slice(0, 60);
  if (busqueda) {
    const like = `%${busqueda.replace(/[%_\\]/g, (m) => '\\' + m)}%`;
    donde.push('(p.nombre LIKE ? OR p.descripcion LIKE ? OR c.nombre LIKE ?)');
    params.push(like, like, like);
  }

  const color = texto(q.color);
  const talla = TALLAS.includes(texto(q.talla).toUpperCase()) ? texto(q.talla).toUpperCase() : '';
  if (color || talla) {
    const sub = ['v.producto_id = p.id'];
    if (color) { sub.push('co.slug = ?'); params.push(color); }
    if (talla) { sub.push('v.talla = ? AND v.stock > 0'); params.push(talla); }
    donde.push(`EXISTS (SELECT 1 FROM variantes v JOIN colores co ON co.id = v.color_id WHERE ${sub.join(' AND ')})`);
  }

  const orden = ORDENES[q.orden] ? q.orden : 'destacados';
  const porPagina = Math.min(Math.max(parseInt(q.por_pagina, 10) || 9, 1), 24);
  const pagina = Math.max(parseInt(q.pagina, 10) || 1, 1);

  const where = 'WHERE ' + donde.join(' AND ');
  const [{ total }] = await query(`SELECT COUNT(*) AS total FROM productos p JOIN categorias c ON c.id = p.categoria_id ${where}`, params);
  const filas = await query(`${SELECT_BASE} ${where} ORDER BY ${ORDENES[orden]} LIMIT ? OFFSET ?`, [...params, porPagina, (pagina - 1) * porPagina]);

  res.json({
    productos: await enriquecer(filas),
    total: Number(total),
    pagina,
    paginas: Math.max(1, Math.ceil(Number(total) / porPagina)),
    orden,
  });
}

/** GET /api/productos/destacados */
async function destacados(_req, res) {
  const filas = await query(`${SELECT_BASE} WHERE p.activo = 1 ORDER BY p.destacado DESC, p.id ASC LIMIT 4`);
  res.json({ productos: await enriquecer(filas) });
}

/** GET /api/productos/filtros — opciones para los selectores del catálogo */
async function filtros(_req, res) {
  const categorias = await query(
    `SELECT c.slug, c.nombre, COUNT(p.id) AS cantidad FROM categorias c
     LEFT JOIN productos p ON p.categoria_id = c.id AND p.activo = 1
     GROUP BY c.id, c.slug, c.nombre, c.orden ORDER BY c.orden`,
  );
  const colores = await query(
    `SELECT co.slug, co.nombre, co.hex FROM colores co
     WHERE EXISTS (SELECT 1 FROM variantes v JOIN productos p ON p.id = v.producto_id WHERE v.color_id = co.id AND p.activo = 1)
     ORDER BY co.id`,
  );
  res.json({
    categorias: categorias.map((c) => ({ ...c, cantidad: Number(c.cantidad) })),
    colores,
    tallas: TALLAS,
    ocasiones: Object.entries(OCASIONES).map(([slug, nombre]) => ({ slug, nombre })),
  });
}

/** GET /api/productos/:slug — ficha completa (HU08) */
async function detalle(req, res) {
  const [p] = await query(
    `SELECT p.*, c.slug AS categoria_slug, c.nombre AS categoria_nombre
     FROM productos p JOIN categorias c ON c.id = p.categoria_id
     WHERE p.slug = ? AND p.activo = 1`,
    [texto(req.params.slug)],
  );
  if (!p) throw new HttpError(404, 'No encontramos este producto.');

  const variantes = await query(
    `SELECT v.id, v.talla, v.stock, v.sku, co.slug AS color FROM variantes v
     JOIN colores co ON co.id = v.color_id WHERE v.producto_id = ?
     ORDER BY v.id`,
    [p.id],
  );
  const imagenes = await query(
    `SELECT pi.url, pi.alt, co.slug AS color FROM producto_imagenes pi
     LEFT JOIN colores co ON co.id = pi.color_id WHERE pi.producto_id = ? ORDER BY pi.orden, pi.id`,
    [p.id],
  );
  const [base] = await enriquecer([p]);

  const relacionadas = await query(
    `${SELECT_BASE} WHERE p.activo = 1 AND p.id <> ? ORDER BY (p.categoria_id = ?) DESC, (p.ocasion = ?) DESC, p.destacado DESC, p.id LIMIT 4`,
    [p.id, p.categoria_id, p.ocasion],
  );

  res.json({
    producto: {
      ...base,
      descripcion: p.descripcion,
      materiales: p.materiales,
      cuidados: p.cuidados,
      ocasion_nombre: OCASIONES[p.ocasion],
      colores: base.colores.map((c) => ({
        ...c,
        imagenes: imagenes.filter((i) => i.color === c.slug).map(({ url, alt }) => ({ url, alt })),
      })),
      variantes: variantes.map((v) => ({
        id: v.id, color: v.color, talla: v.talla, sku: v.sku,
        stock: Math.min(v.stock, 10), // no se expone el inventario exacto sobre 10
      })),
    },
    relacionados: await enriquecer(relacionadas),
  });
}

module.exports = { listar, destacados, filtros, detalle };

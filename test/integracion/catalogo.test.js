const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const h = require('../helpers');

const TALLAS = ['S', 'M', 'L', 'XL', 'XXL'];
const SLUG_OCULTO = 'prueba-producto-oculto';

before(async () => {
  await h.iniciar();
  // Producto inactivo temporal: debe ser invisible para la clienta
  const [{ id: categoria }] = await h.query("SELECT id FROM categorias WHERE slug = 'faldas'");
  await h.query(
    `INSERT INTO productos (categoria_id, nombre, slug, descripcion, materiales, cuidados, precio, ocasion, destacado, activo)
     VALUES (?, 'Oculto de prueba', ?, 'x', 'x', 'x', 20000, 'reunion', 0, 0)`,
    [categoria, SLUG_OCULTO],
  );
});

after(async () => {
  await h.query('DELETE FROM productos WHERE slug = ?', [SLUG_OCULTO]);
  await h.cerrar();
});

describe('catálogo público desde la base', () => {
  test('el listado solo muestra productos activos, igual que la base', async () => {
    const [{ total }] = await h.query('SELECT COUNT(*) AS total FROM productos WHERE activo = 1');
    const r = await h.api('/productos?por_pagina=24');
    assert.equal(r.status, 200);
    assert.equal(r.datos.total, Number(total));
    assert.ok(!r.datos.productos.some((p) => p.slug === SLUG_OCULTO), 'el producto inactivo no aparece');
  });

  test('un producto inactivo responde 404 en su ficha', async () => {
    const r = await h.api(`/productos/${SLUG_OCULTO}`);
    assert.equal(r.status, 404);
  });

  test('la ficha de un producto activo trae todas las tallas S a XXL', async () => {
    const [p] = await h.query("SELECT slug FROM productos WHERE activo = 1 ORDER BY id LIMIT 1");
    const r = await h.api(`/productos/${p.slug}`);
    assert.equal(r.status, 200);
    const tallas = [...new Set(r.datos.producto.variantes.map((v) => v.talla))].sort((a, b) => TALLAS.indexOf(a) - TALLAS.indexOf(b));
    assert.deepEqual(tallas, TALLAS);
  });

  test('el filtro de filtros expone las tallas S a XXL', async () => {
    const r = await h.api('/productos/filtros');
    assert.deepEqual(r.datos.tallas, TALLAS);
  });

  test('filtrar por talla XXL solo muestra productos con esa talla disponible', async () => {
    const r = await h.api('/productos?talla=XXL&por_pagina=24');
    assert.equal(r.status, 200);
    assert.ok(r.datos.productos.length > 0);
    for (const p of r.datos.productos) assert.ok(p.tallas.includes('XXL'), `${p.slug} debe tener XXL`);
  });

  test('ordenar por precio ascendente entrega precios de menor a mayor', async () => {
    const r = await h.api('/productos?orden=precio_asc&por_pagina=24');
    const precios = r.datos.productos.map((p) => p.precio);
    assert.deepEqual(precios, [...precios].sort((a, b) => a - b));
  });

  test('los precios de la tienda están entre $15.000 y $40.000 CLP', async () => {
    const r = await h.api('/productos?por_pagina=24');
    for (const p of r.datos.productos) {
      assert.ok(p.precio >= 15000 && p.precio <= 40000, `${p.nombre}: ${p.precio}`);
    }
  });

  test('un código de talla inválido se ignora (no rompe la consulta)', async () => {
    const r = await h.api("/productos?talla=XS' OR 1=1 --");
    assert.equal(r.status, 200);
  });
});

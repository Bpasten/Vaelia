/**
 * Genera database/seed.sql a partir de database/catalogo.js
 * (así el seed se puede importar también desde MySQL Workbench o phpMyAdmin).
 *
 * Uso: node scripts/generar-seed.js
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { categorias, colores, productos, TALLAS } = require('../database/catalogo');

const esc = (v) => (v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`);
const fila = (vals) => `(${vals.map(esc).join(', ')})`;

// Stock determinístico (siempre el mismo seed) con algunas tallas agotadas
function stockPara(sku, talla) {
  const h = crypto.createHash('md5').update(sku).digest()[0];
  const base = { S: [3, 5, 6, 8], M: [4, 6, 8, 10], L: [2, 4, 6, 7], XL: [0, 1, 2, 3], XXL: [1, 2, 3, 4] }[talla];
  return base[h % base.length];
}

const lineas = [];
lineas.push('-- Datos iniciales de Vaelia (generado por scripts/generar-seed.js)');
lineas.push('USE vaelia;');
lineas.push('SET NAMES utf8mb4;');
lineas.push('');

lineas.push('INSERT INTO categorias (id, nombre, slug, orden) VALUES');
lineas.push(categorias.map((c, i) => fila([i + 1, c.nombre, c.slug, i + 1])).join(',\n') + ';\n');

lineas.push('INSERT INTO colores (id, nombre, slug, hex) VALUES');
lineas.push(colores.map((c, i) => fila([i + 1, c.nombre, c.slug, c.hex])).join(',\n') + ';\n');

const prodFilas = [];
const imgFilas = [];
const varFilas = [];
let varId = 1;
productos.forEach((p, i) => {
  const id = i + 1;
  const catId = categorias.findIndex((c) => c.slug === p.categoria) + 1;
  // created_at escalonado para que "Más recientes" tenga sentido
  const creado = new Date(Date.UTC(2026, 8, 1 + i, 12)).toISOString().slice(0, 19).replace('T', ' ');
  prodFilas.push(fila([id, catId, p.nombre, p.slug, p.descripcion, p.materiales, p.cuidados, p.precio, p.ocasion, p.destacado, 1, creado]));
  p.colores.forEach((slugColor) => {
    const colId = colores.findIndex((c) => c.slug === slugColor) + 1;
    const nombreColor = colores[colId - 1].nombre;
    imgFilas.push(fila([id, colId, `/img/fotos/${p.imagen}.webp`, `${p.nombre} en ${nombreColor.toLowerCase()}`, 0]));
    imgFilas.push(fila([id, colId, `/img/fotos/${p.imagen}-512.webp`, `Vista reducida de ${p.nombre}`, 1]));
    TALLAS.forEach((t) => {
      const sku = `VAE-${String(id).padStart(3, '0')}-${slugColor.split('-').map((s) => s[0]).join('').toUpperCase()}-${t}`;
      varFilas.push(fila([varId++, id, colId, t, sku, stockPara(sku, t)]));
    });
  });
});

lineas.push('INSERT INTO productos (id, categoria_id, nombre, slug, descripcion, materiales, cuidados, precio, ocasion, destacado, activo, created_at) VALUES');
lineas.push(prodFilas.join(',\n') + ';\n');
lineas.push('INSERT INTO producto_imagenes (producto_id, color_id, url, alt, orden) VALUES');
lineas.push(imgFilas.join(',\n') + ';\n');
lineas.push('INSERT INTO variantes (id, producto_id, color_id, talla, sku, stock) VALUES');
lineas.push(varFilas.join(',\n') + ';\n');

// Cuenta de demostración (la del diseño de inicio de sesión)
const hash = bcrypt.hashSync('Vaelia2026', 12);
lineas.push('-- Cuenta de prueba: camila@test.cl / Vaelia2026');
lineas.push('INSERT INTO usuarios (id, nombre, apellido, email, password_hash, telefono, rut, rol) VALUES');
lineas.push(fila([1, 'Camila', 'Rojas', 'camila@test.cl', hash, '+56912345678', null, 'cliente']) + ';');
lineas.push('INSERT INTO direcciones (usuario_id, region, comuna, calle, depto, referencia, es_principal) VALUES');
lineas.push(fila([1, 'Metropolitana de Santiago', 'Providencia', 'Av. Nueva Providencia 1881', 'Depto 504', 'Conserjería 24 h', 1]) + ';\n');

fs.writeFileSync(path.join(__dirname, '..', 'database', 'seed.sql'), lineas.join('\n') + '\n');
console.log(`✓ database/seed.sql: ${productos.length} productos, ${imgFilas.length} imágenes, ${varFilas.length} variantes`);

/**
 * Crea la base de datos y carga los datos iniciales.
 * Lee las credenciales de .env. ¡Borra y recrea las tablas!
 *
 * Uso: npm run db:setup
 */
require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

(async () => {
  const nombreBD = process.env.DB_NAME || 'vaelia';
  if (!/^[A-Za-z0-9_]+$/.test(nombreBD)) throw new Error('DB_NAME solo puede tener letras, números y guion bajo.');

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true' ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined,
    multipleStatements: true,
    charset: 'utf8mb4',
  });

  const leer = (archivo) => fs.readFileSync(path.join(__dirname, '..', 'database', archivo), 'utf8')
    .replace(/CREATE DATABASE IF NOT EXISTS vaelia/g, `CREATE DATABASE IF NOT EXISTS \`${nombreBD}\``)
    .replace(/USE vaelia;/g, `USE \`${nombreBD}\`;`);

  await conn.query("SET time_zone = '+00:00'");
  console.log(`→ Creando esquema en "${nombreBD}"…`);
  await conn.query(leer('schema.sql'));
  console.log('→ Cargando catálogo y cuenta de prueba…');
  await conn.query(leer('seed.sql'));

  const [[{ productos }]] = await conn.query(`SELECT COUNT(*) AS productos FROM \`${nombreBD}\`.productos`);
  const [[{ variantes }]] = await conn.query(`SELECT COUNT(*) AS variantes FROM \`${nombreBD}\`.variantes`);
  console.log(`✓ Listo: ${productos} productos y ${variantes} variantes con stock.`);
  console.log('  Cuenta de prueba: camila@test.cl / Vaelia2026');
  await conn.end();
})().catch((err) => {
  console.error('✗ Error al preparar la base de datos:', err.message);
  process.exit(1);
});

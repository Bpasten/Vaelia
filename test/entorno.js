/**
 * Prepara el entorno de pruebas.
 * Lee .env.test (NUNCA el .env de producción) y exige que la base se llame *_test,
 * así una prueba no puede escribir en la base real por accidente.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.test'), quiet: true });

const nombre = process.env.TEST_DB_NAME || '';
if (!/^[A-Za-z0-9_]+_test$/.test(nombre)) {
  throw new Error('Falta .env.test con TEST_DB_NAME terminado en _test (por ejemplo vaelia_test). Las pruebas no se ejecutan contra la base de producción.');
}

Object.assign(process.env, {
  NODE_ENV: 'test',
  PORT: '0',
  APP_URL: 'http://localhost:3000',
  DB_HOST: process.env.TEST_DB_HOST || 'localhost',
  DB_PORT: process.env.TEST_DB_PORT || '3306',
  DB_USER: process.env.TEST_DB_USER || 'root',
  DB_PASSWORD: process.env.TEST_DB_PASSWORD || '',
  DB_SSL: process.env.TEST_DB_SSL || 'false',
  DB_NAME: nombre,
  JWT_SECRET: 'secreto-solo-para-pruebas-vaelia-64-caracteres-o-mas-xxxxxxxxxxxxxxxx',
  TBK_ENV: 'integration',
});

module.exports = { nombreBD: nombre };

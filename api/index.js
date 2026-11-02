/**
 * Punto de entrada para Vercel (serverless). Vercel invoca la app de Express
 * para cada petición; el frontend estático se sirve desde public/.
 * En local sigue funcionando "npm run dev" (server.js).
 */
const app = require('../src/app');

module.exports = app;

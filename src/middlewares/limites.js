/** Limitación de solicitudes en endpoints sensibles (express-rate-limit). */
const rateLimit = require('express-rate-limit');

const base = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  // En las pruebas automáticas (NODE_ENV=test) no se limita, para poder crear muchas cuentas
  skip: () => process.env.NODE_ENV === 'test',
  handler: (_req, res, _next, opciones) => res.status(opciones.statusCode).json({ error: opciones.message }),
};

// Intentos fallidos de inicio de sesión: 10 cada 15 minutos por IP
const limiteLogin = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  message: 'Demasiados intentos. Espera unos minutos antes de volver a intentar.',
});

// Creación de cuentas: 5 por hora por IP
const limiteRegistro = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: 'Se crearon demasiadas cuentas desde esta conexión. Intenta más tarde.',
});

// Inicio de pagos: 15 cada 15 minutos por IP
const limiteCheckout = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 15,
  message: 'Demasiados intentos de pago seguidos. Espera unos minutos.',
});

// Límite general de la API
const limiteApi = rateLimit({
  ...base,
  windowMs: 60 * 1000,
  limit: 300,
  message: 'Demasiadas solicitudes. Intenta nuevamente en un momento.',
});

module.exports = { limiteLogin, limiteRegistro, limiteCheckout, limiteApi };

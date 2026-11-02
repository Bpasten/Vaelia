/**
 * Manejo centralizado de errores: la usuaria ve un mensaje claro,
 * nunca el stack, consultas SQL ni credenciales (informe 5.5 · Errores).
 */
const path = require('path');
const HttpError = require('../utils/http-error');

function noEncontrado(req, res, next) {
  if (req.path.startsWith('/api/')) return next(new HttpError(404, 'Recurso no encontrado.'));
  res.status(404).sendFile(path.join(__dirname, '..', '..', 'public', '404.html'));
}

// eslint-disable-next-line no-unused-vars
function manejarErrores(err, req, res, _next) {
  // JSON mal formado enviado por el cliente
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'La solicitud no tiene un formato válido.' });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, ...(err.detalles ? { campos: err.detalles } : {}) });
  }
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, err);
  res.status(500).json({ error: 'Ocurrió un problema inesperado. Intenta nuevamente en unos minutos.' });
}

module.exports = { noEncontrado, manejarErrores };

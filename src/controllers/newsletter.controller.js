/** Suscripción a novedades ("Mantente cerca"). */
const { query } = require('../config/db');
const HttpError = require('../utils/http-error');
const v = require('../utils/validar');

async function suscribir(req, res) {
  const email = v.texto(req.body?.email).toLowerCase();
  if (!v.esEmail(email)) throw new HttpError(422, 'Ingresa un correo válido.');
  await query('INSERT IGNORE INTO suscriptores (email) VALUES (?)', [email]);
  // Misma respuesta exista o no el correo (no revela quién está suscrito)
  res.status(201).json({ mensaje: '¡Listo! Te escribiremos con novedades y lanzamientos.' });
}

module.exports = { suscribir };

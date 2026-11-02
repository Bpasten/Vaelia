/**
 * Autenticación con JWT guardado en una cookie httpOnly
 * (el JavaScript del navegador no puede leerla → menos riesgo ante XSS).
 */
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const HttpError = require('../utils/http-error');

const COOKIE = 'vaelia_sesion';

const opcionesCookie = () => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: config.produccion,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

function firmarSesion(res, usuario) {
  const token = jwt.sign({ sub: usuario.id, rol: usuario.rol }, config.jwt.secreto, {
    expiresIn: config.jwt.expira,
    algorithm: 'HS256',
  });
  res.cookie(COOKIE, token, opcionesCookie());
}

function cerrarSesion(res) {
  const { maxAge, ...resto } = opcionesCookie();
  res.clearCookie(COOKIE, resto);
}

/** Si hay una sesión válida, deja req.usuario = { id, rol }. Nunca bloquea. */
function sesionOpcional(req, _res, next) {
  const token = req.cookies?.[COOKIE];
  if (token) {
    try {
      const datos = jwt.verify(token, config.jwt.secreto, { algorithms: ['HS256'] });
      req.usuario = { id: Number(datos.sub), rol: datos.rol };
    } catch {
      req.usuario = null; // token vencido o alterado: se ignora
    }
  }
  next();
}

/** Exige sesión iniciada. */
function requiereSesion(req, _res, next) {
  if (!req.usuario) return next(new HttpError(401, 'Debes iniciar sesión para continuar.'));
  next();
}

/** Exige rol de administradora (para el panel de gestión). */
function requiereAdmin(req, _res, next) {
  if (!req.usuario) return next(new HttpError(401, 'Debes iniciar sesión para continuar.'));
  if (req.usuario.rol !== 'admin') return next(new HttpError(403, 'No tienes permisos para esta acción.'));
  next();
}

module.exports = { firmarSesion, cerrarSesion, sesionOpcional, requiereSesion, requiereAdmin };

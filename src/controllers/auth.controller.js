/** Registro opcional (HU17) e inicio de sesión de clientes (HU18). */
const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const config = require('../config/env');
const HttpError = require('../utils/http-error');
const { firmarSesion, cerrarSesion } = require('../middlewares/auth');
const v = require('../utils/validar');

const COSTO_BCRYPT = 12;
// Hash ficticio: se compara igual cuando el correo no existe, para que el tiempo
// de respuesta no revele qué correos están registrados.
const HASH_FICTICIO = bcrypt.hashSync('contraseña-inexistente-vaelia', COSTO_BCRYPT);

const publico = (u) => ({
  id: u.id, nombre: u.nombre, apellido: u.apellido, email: u.email,
  telefono: u.telefono, rut: u.rut, rol: u.rol,
});

/** POST /api/auth/registro */
async function registro(req, res) {
  const b = req.body || {};
  const nombre = v.texto(b.nombre);
  const apellido = v.texto(b.apellido);
  const email = v.texto(b.email).toLowerCase();
  const password = typeof b.password === 'string' ? b.password : '';

  v.exigir({
    nombre: nombre.length < 2 || nombre.length > 60 ? 'Ingresa tu nombre.' : null,
    apellido: apellido.length < 2 || apellido.length > 60 ? 'Ingresa tu apellido.' : null,
    email: !v.esEmail(email) ? 'Ingresa un correo válido.' : null,
    password: !v.esPasswordSegura(password) ? 'Usa al menos 8 caracteres, con letras y números.' : null,
    confirmar: b.confirmar !== undefined && b.confirmar !== password ? 'Las contraseñas no coinciden.' : null,
  });

  const existe = await query('SELECT id FROM usuarios WHERE email = ?', [email]);
  if (existe.length) {
    throw new HttpError(409, 'Ya existe una cuenta con este correo. Inicia sesión o usa otro correo.', { email: 'Este correo ya está registrado.' });
  }

  const hash = await bcrypt.hash(password, COSTO_BCRYPT);
  let r;
  try {
    r = await query('INSERT INTO usuarios (nombre, apellido, email, password_hash) VALUES (?, ?, ?, ?)', [nombre, apellido, email, hash]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') throw new HttpError(409, 'Ya existe una cuenta con este correo.', { email: 'Este correo ya está registrado.' });
    throw err;
  }
  const usuario = { id: r.insertId, nombre, apellido, email, telefono: null, rut: null, rol: 'cliente' };
  firmarSesion(res, usuario);
  res.status(201).json({ usuario: publico(usuario) });
}

/** POST /api/auth/login */
async function login(req, res) {
  const email = v.texto(req.body?.email).toLowerCase();
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!email || !password) throw new HttpError(422, 'Ingresa tu correo y contraseña.');

  const [u] = await query('SELECT * FROM usuarios WHERE email = ?', [email]);
  const ok = await bcrypt.compare(password, u && u.password_hash ? u.password_hash : HASH_FICTICIO);
  if (!u || !u.password_hash || !ok) throw new HttpError(401, 'Correo o contraseña incorrectos.');

  firmarSesion(res, u);
  res.json({ usuario: publico(u) });
}

/** POST /api/auth/logout */
function logout(_req, res) {
  cerrarSesion(res);
  res.json({ ok: true });
}

/** GET /api/auth/yo — sesión actual (o null) */
async function yo(req, res) {
  if (!req.usuario) return res.json({ usuario: null });
  const [u] = await query('SELECT * FROM usuarios WHERE id = ?', [req.usuario.id]);
  if (!u) {
    cerrarSesion(res);
    return res.json({ usuario: null });
  }
  res.json({ usuario: publico(u) });
}

module.exports = {
  registro, login, logout, yo, publico };

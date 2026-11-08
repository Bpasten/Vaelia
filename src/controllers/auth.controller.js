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

/** GET /api/auth/proveedores — métodos de acceso disponibles (sin datos de configuración) */
function proveedores(_req, res) {
  res.json({ google: Boolean(config.supabase.url && config.supabase.clave) });
}

/** GET /api/auth/google — redirige a Google vía Supabase; la URL de Supabase nunca llega al navegador */
function iniciarGoogle(req, res) {
  if (!config.supabase.url || !config.supabase.clave) throw new HttpError(404, 'Inicio con Google no disponible.');
  // Se usa APP_URL si está definido; si no, el host de la petición (evita redirecciones a otros dominios)
  const origen = process.env.APP_URL ? config.appUrl : `${req.protocol}://${req.get('host')}`;
  const destino = `${config.supabase.url}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(`${origen}/cuenta`)}`;
  res.redirect(302, destino);
}

/**
 * POST /api/auth/google — recibe el access_token que Supabase entrega tras el
 * inicio de sesión con Google. Lo verifica en Supabase y crea o vincula la cuenta.
 */
async function google(req, res) {
  const { url, clave } = config.supabase;
  if (!url || !clave) throw new HttpError(503, 'El inicio de sesión con Google no está disponible.');
  const token = typeof req.body?.access_token === 'string' ? req.body.access_token : '';
  if (!token || token.length > 4096) throw new HttpError(422, 'Falta el token de acceso.');

  let su;
  try {
    const r = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: clave, Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) throw new Error('rechazado');
    su = await r.json();
  } catch {
    throw new HttpError(401, 'No pudimos verificar tu cuenta de Google. Intenta de nuevo.');
  }

  const email = v.texto(su.email).toLowerCase();
  if (!v.esEmail(email) || !su.email_confirmed_at) {
    throw new HttpError(401, 'Tu correo de Google debe estar verificado.');
  }

  let [u] = await query('SELECT * FROM usuarios WHERE email = ?', [email]);
  if (!u) {
    const meta = su.user_metadata || {};
    const partes = v.texto(meta.full_name || meta.name || '').split(' ').filter(Boolean);
    const nombre = v.texto(meta.given_name || partes[0] || 'Clienta').slice(0, 60);
    const apellido = v.texto(meta.family_name || partes.slice(1).join(' ') || 'Vaelia').slice(0, 60);
    const r = await query('INSERT INTO usuarios (nombre, apellido, email, password_hash) VALUES (?, ?, ?, NULL)', [nombre, apellido, email]);
    u = { id: r.insertId, nombre, apellido, email, telefono: null, rut: null, rol: 'cliente' };
  }

  firmarSesion(res, u);
  res.json({ usuario: publico(u) });
}

module.exports = {
  proveedores, iniciarGoogle, google, registro, login, logout, yo, publico };

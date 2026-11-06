/** Utilidades compartidas: servidor de pruebas, llamadas a la API y consultas a la base de pruebas. */
require('./entorno');
const app = require('../src/app');
const { pool, query } = require('../src/config/db');

let servidor = null;
let base = '';

async function iniciar() {
  if (!servidor) {
    servidor = app.listen(0, '127.0.0.1');
    await new Promise((r) => servidor.once('listening', r));
    base = `http://127.0.0.1:${servidor.address().port}`;
  }
  return base;
}

async function cerrar() {
  if (servidor) {
    await new Promise((r) => servidor.close(r));
    servidor = null;
  }
  await pool.end();
}

/** Llama a /api/... y devuelve { status, datos, cookie } (cookie = "vaelia_sesion=..." o null). */
async function api(ruta, { metodo = 'GET', cuerpo, cookie } = {}) {
  const r = await fetch(`${base}/api${ruta}`, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    redirect: 'manual',
  });
  const texto = await r.text();
  let datos = null;
  try { datos = JSON.parse(texto); } catch { datos = texto; }
  const cookies = r.headers.getSetCookie ? r.headers.getSetCookie() : [];
  const sesion = cookies.find((c) => c.startsWith('vaelia_sesion='));
  return { status: r.status, datos, cookie: sesion ? sesion.split(';')[0] : null, cookies };
}

/** Correo único para cada prueba, así las pruebas no chocan entre sí. */
let contador = 0;
const unico = (prefijo = 'clienta') => `${prefijo}.${Date.now()}.${++contador}@prueba.cl`;

const CLAVE_VALIDA = 'Vaelia2026';

/** Crea una cuenta por la API y devuelve { id, email, cookie }. */
async function crearCuenta(extra = {}) {
  const email = extra.email || unico();
  const r = await api('/auth/registro', {
    metodo: 'POST',
    cuerpo: { nombre: 'Lucía', apellido: 'Soto', email, password: CLAVE_VALIDA, confirmar: CLAVE_VALIDA, ...extra },
  });
  if (r.status !== 201) throw new Error(`No se pudo crear la cuenta de prueba: ${JSON.stringify(r.datos)}`);
  return { id: r.datos.usuario.id, email, cookie: r.cookie };
}

/** Stock y datos de una variante desde la base (para comprobar cambios reales). */
async function variante(id) {
  const [fila] = await query('SELECT id, stock, talla, producto_id FROM variantes WHERE id = ?', [id]);
  return fila;
}

module.exports = { iniciar, cerrar, api, unico, crearCuenta, variante, query, CLAVE_VALIDA };

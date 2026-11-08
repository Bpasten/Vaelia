const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const h = require('../helpers');

// Supabase se simula: cada prueba decide qué responde la verificación del token
let respuestaSupabase = null;
const fetchReal = globalThis.fetch;

before(async () => {
  globalThis.fetch = async (url, opciones) => {
    if (String(url).startsWith(process.env.SUPABASE_URL)) return respuestaSupabase(url, opciones);
    return fetchReal(url, opciones);
  };
  await h.iniciar();
});

after(async () => {
  globalThis.fetch = fetchReal;
  await h.cerrar();
});

const usuarioSupabase = (email, extra = {}) => ({
  email,
  email_confirmed_at: '2026-10-01T10:00:00Z',
  user_metadata: { given_name: 'Lucía', family_name: 'Soto' },
  ...extra,
});

describe('inicio de sesión con Google (Supabase)', () => {
  test('expone Google como método disponible', async () => {
    const r = await h.api('/auth/proveedores');
    assert.equal(r.datos.google, true);
  });

  test('no expone la URL de Supabase al navegador', async () => {
    const r = await h.api('/auth/proveedores');
    assert.equal(r.datos.supabaseUrl, undefined);
    assert.equal(JSON.stringify(r.datos).includes(process.env.SUPABASE_URL), false);
  });

  test('/auth/google redirige a Supabase sin mostrar la URL en el frontend', async () => {
    const r = await fetch(`${h.base()}/api/auth/google`, { redirect: 'manual' });
    assert.equal(r.status, 302);
    const destino = new URL(r.headers.get('location'));
    assert.equal(destino.origin, process.env.SUPABASE_URL);
    assert.equal(destino.searchParams.get('provider'), 'google');
  });

  test('un token válido crea la cuenta en la base con contraseña NULL', async () => {
    const email = h.unico('google');
    respuestaSupabase = () => new Response(JSON.stringify(usuarioSupabase(email)), { status: 200 });
    const r = await h.api('/auth/google', { metodo: 'POST', cuerpo: { access_token: 'token-valido' } });
    assert.equal(r.status, 200);
    assert.ok(r.cookie, 'entrega sesión');
    assert.equal(r.datos.usuario.nombre, 'Lucía');

    const [fila] = await h.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    assert.ok(fila, 'la cuenta quedó guardada');
    assert.equal(fila.password_hash, null, 'las cuentas de Google no tienen contraseña local');
  });

  test('volver a entrar con el mismo correo usa la misma cuenta (no duplica)', async () => {
    const email = h.unico('google-repite');
    respuestaSupabase = () => new Response(JSON.stringify(usuarioSupabase(email)), { status: 200 });
    const primera = await h.api('/auth/google', { metodo: 'POST', cuerpo: { access_token: 'a' } });
    const segunda = await h.api('/auth/google', { metodo: 'POST', cuerpo: { access_token: 'b' } });
    assert.equal(primera.datos.usuario.id, segunda.datos.usuario.id);
    const [{ total }] = await h.query('SELECT COUNT(*) AS total FROM usuarios WHERE email = ?', [email]);
    assert.equal(total, 1);
  });

  test('un correo de Google ya registrado con clave se vincula a esa misma cuenta', async () => {
    const cuenta = await h.crearCuenta();
    respuestaSupabase = () => new Response(JSON.stringify(usuarioSupabase(cuenta.email)), { status: 200 });
    const r = await h.api('/auth/google', { metodo: 'POST', cuerpo: { access_token: 'token' } });
    assert.equal(r.datos.usuario.id, cuenta.id);
  });

  test('un token rechazado por Supabase responde 401 y no crea nada', async () => {
    const email = h.unico('rechazado');
    respuestaSupabase = () => new Response('{}', { status: 401 });
    const r = await h.api('/auth/google', { metodo: 'POST', cuerpo: { access_token: 'vencido' } });
    assert.equal(r.status, 401);
    const [{ total }] = await h.query('SELECT COUNT(*) AS total FROM usuarios WHERE email = ?', [email]);
    assert.equal(total, 0);
  });

  test('un correo de Google no verificado se rechaza', async () => {
    const email = h.unico('sinverificar');
    respuestaSupabase = () => new Response(JSON.stringify(usuarioSupabase(email, { email_confirmed_at: null })), { status: 200 });
    const r = await h.api('/auth/google', { metodo: 'POST', cuerpo: { access_token: 'token' } });
    assert.equal(r.status, 401);
    const [{ total }] = await h.query('SELECT COUNT(*) AS total FROM usuarios WHERE email = ?', [email]);
    assert.equal(total, 0);
  });

  test('sin token responde 422', async () => {
    const r = await h.api('/auth/google', { metodo: 'POST', cuerpo: {} });
    assert.equal(r.status, 422);
  });
});

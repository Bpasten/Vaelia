const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
require('../entorno');
const { firmarSesion, sesionOpcional, requiereSesion } = require('../../src/middlewares/auth');

// Respuesta falsa que guarda la cookie para poder leerla
const resFalsa = () => {
  const r = { cookies: {}, cookie(nombre, valor) { this.cookies[nombre] = valor; return this; } };
  return r;
};

describe('sesión con JWT en cookie', () => {
  test('firmarSesion guarda una cookie que sesionOpcional lee', () => {
    const res = resFalsa();
    firmarSesion(res, { id: 7, rol: 'cliente' });
    const req = { cookies: { vaelia_sesion: res.cookies.vaelia_sesion } };
    sesionOpcional(req, {}, () => {});
    assert.deepEqual(req.usuario, { id: 7, rol: 'cliente' });
  });

  test('un token alterado se ignora sin romper la petición', () => {
    const res = resFalsa();
    firmarSesion(res, { id: 7, rol: 'cliente' });
    const alterado = res.cookies.vaelia_sesion.slice(0, -2) + 'xx';
    const req = { cookies: { vaelia_sesion: alterado } };
    let llamado = false;
    sesionOpcional(req, {}, () => { llamado = true; });
    assert.equal(req.usuario, null);
    assert.equal(llamado, true);
  });

  test('requiereSesion bloquea sin sesión con 401', () => {
    let error;
    requiereSesion({ usuario: null }, {}, (e) => { error = e; });
    assert.equal(error.status, 401);
  });
});

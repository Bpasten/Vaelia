const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
require('../entorno');
const v = require('../../src/utils/validar');
const HttpError = require('../../src/utils/http-error');

describe('RUT chileno', () => {
  test('acepta un RUT válido y lo normaliza', () => {
    assert.equal(v.normalizarRut('11.111.111-1'), '11111111-1');
    assert.equal(v.normalizarRut('11111111-1'), '11111111-1');
  });
  test('acepta dígito verificador K', () => {
    assert.equal(v.normalizarRut('10.000.013-K'), '10000013-K');
  });
  test('rechaza dígito verificador incorrecto', () => {
    assert.equal(v.normalizarRut('11.111.111-2'), null);
  });
  test('rechaza formatos que no son RUT', () => {
    assert.equal(v.normalizarRut('abc'), null);
    assert.equal(v.normalizarRut(''), null);
  });
});

describe('correo y contraseña', () => {
  test('esEmail acepta correos normales y rechaza los incompletos', () => {
    assert.equal(v.esEmail('ana@correo.cl'), true);
    assert.equal(v.esEmail('ana@correo'), false);
    assert.equal(v.esEmail('ana con espacios@correo.cl'), false);
  });
  test('esPasswordSegura exige 8+ caracteres con letras y números', () => {
    assert.equal(v.esPasswordSegura('Vaelia2026'), true);
    assert.equal(v.esPasswordSegura('corta1'), false);
    assert.equal(v.esPasswordSegura('solamente-letras'), false);
    assert.equal(v.esPasswordSegura('12345678'), false);
    assert.equal(v.esPasswordSegura('a'.repeat(73) + '1'), false);
  });
});

describe('teléfono y texto', () => {
  test('esTelefono acepta celulares chilenos con o sin +56', () => {
    assert.equal(v.esTelefono('+56 9 1234 5678'), true);
    assert.equal(v.esTelefono('912345678'), true);
    assert.equal(v.esTelefono('12345'), false);
    assert.equal(v.esTelefono('+56 2 2345 6789'), false); // fijo, no celular
  });
  test('texto recorta y colapsa espacios', () => {
    assert.equal(v.texto('  Ana   María  '), 'Ana María');
    assert.equal(v.texto(42), '');
  });
});

describe('contacto del checkout', () => {
  test('devuelve el contacto limpio, con RUT y teléfono normalizados', () => {
    const c = v.contacto({ nombre: 'Ana', apellido: 'Pérez', email: 'ANA@correo.cl', telefono: '9 1234 5678', rut: '11.111.111-1' });
    assert.equal(c.email, 'ana@correo.cl');
    assert.equal(c.telefono, '+56912345678');
    assert.equal(c.rut, '11111111-1');
  });
  test('lanza 422 con el detalle de cada campo inválido', () => {
    try {
      v.contacto({ nombre: 'A', apellido: '', email: 'mal', telefono: '1', rut: '' });
      assert.fail('debió lanzar');
    } catch (err) {
      assert.ok(err instanceof HttpError);
      assert.equal(err.status, 422);
      assert.ok(err.detalles.nombre && err.detalles.email && err.detalles.telefono);
    }
  });
});

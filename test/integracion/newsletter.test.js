const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const h = require('../helpers');

before(() => h.iniciar());
after(() => h.cerrar());

describe('newsletter "Mantente cerca"', () => {
  test('suscribirse guarda el correo una sola vez aunque se repita', async () => {
    const email = h.unico('news');
    const a = await h.api('/newsletter', { metodo: 'POST', cuerpo: { email } });
    const b = await h.api('/newsletter', { metodo: 'POST', cuerpo: { email } });
    assert.equal(a.status, 201);
    assert.equal(b.status, 201, 'la respuesta no revela si ya estaba suscrito');
    const [{ total }] = await h.query('SELECT COUNT(*) AS total FROM suscriptores WHERE email = ?', [email]);
    assert.equal(total, 1);
  });

  test('un correo inválido responde 422 y no se guarda', async () => {
    const r = await h.api('/newsletter', { metodo: 'POST', cuerpo: { email: 'no-es-correo' } });
    assert.equal(r.status, 422);
  });
});

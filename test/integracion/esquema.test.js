const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const h = require('../helpers');

before(() => h.iniciar());
after(() => h.cerrar());

describe('esquema de la base de datos', () => {
  test('la columna talla acepta S, M, L, XL y XXL', async () => {
    const [col] = await h.query("SHOW COLUMNS FROM variantes LIKE 'talla'");
    for (const t of ['S', 'M', 'L', 'XL', 'XXL']) assert.ok(col.Type.includes(`'${t}'`), `falta ${t}`);
  });

  test('password_hash admite NULL', async () => {
    const [col] = await h.query("SHOW COLUMNS FROM usuarios LIKE 'password_hash'");
    assert.equal(col.Null, 'YES');
  });

  test('el correo de usuarios es único en la base', async () => {
    const indices = await h.query("SHOW INDEX FROM usuarios WHERE Column_name = 'email' AND Non_unique = 0");
    assert.ok(indices.length > 0);
  });
});

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const h = require('../helpers');

before(() => h.iniciar());
after(() => h.cerrar());

describe('registro: la cuenta se guarda en la base de datos', () => {
  test('crear cuenta guarda la fila con la contraseña cifrada y deja la sesión iniciada', async () => {
    const email = h.unico('registro');
    const r = await h.api('/auth/registro', {
      metodo: 'POST',
      cuerpo: { nombre: 'Camila', apellido: 'Rojas', email: email.toUpperCase(), password: h.CLAVE_VALIDA, confirmar: h.CLAVE_VALIDA },
    });
    assert.equal(r.status, 201);
    assert.ok(r.cookie?.startsWith('vaelia_sesion='), 'debe entregar cookie de sesión');
    assert.equal(r.datos.usuario.email, email, 'el correo se guarda en minúscula');

    const [fila] = await h.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    assert.ok(fila, 'la cuenta existe en la base');
    assert.equal(fila.nombre, 'Camila');
    assert.equal(fila.rol, 'cliente');
    assert.match(fila.password_hash, /^\$2[aby]\$12\$/, 'bcrypt con costo 12');
    assert.notEqual(fila.password_hash, h.CLAVE_VALIDA, 'nunca se guarda la clave en texto plano');
  });

  test('un correo repetido responde 409 y no crea una segunda fila', async () => {
    const email = h.unico('repetido');
    const cuerpo = { nombre: 'Ana', apellido: 'Pérez', email, password: h.CLAVE_VALIDA, confirmar: h.CLAVE_VALIDA };
    assert.equal((await h.api('/auth/registro', { metodo: 'POST', cuerpo })).status, 201);
    const segundo = await h.api('/auth/registro', { metodo: 'POST', cuerpo });
    assert.equal(segundo.status, 409);
    assert.ok(segundo.datos.campos.email);
    const [{ total }] = await h.query('SELECT COUNT(*) AS total FROM usuarios WHERE email = ?', [email]);
    assert.equal(total, 1);
  });

  test('contraseña débil o que no coincide responde 422 y no guarda nada', async () => {
    const email = h.unico('debil');
    const debil = await h.api('/auth/registro', { metodo: 'POST', cuerpo: { nombre: 'Ana', apellido: 'Pérez', email, password: 'solodeletras', confirmar: 'solodeletras' } });
    assert.equal(debil.status, 422);
    const distinta = await h.api('/auth/registro', { metodo: 'POST', cuerpo: { nombre: 'Ana', apellido: 'Pérez', email, password: h.CLAVE_VALIDA, confirmar: 'Otra12345' } });
    assert.equal(distinta.status, 422);
    const [{ total }] = await h.query('SELECT COUNT(*) AS total FROM usuarios WHERE email = ?', [email]);
    assert.equal(total, 0);
  });
});

describe('inicio de sesión: lee la cuenta guardada', () => {
  test('con la clave correcta entrega sesión y el mismo usuario de la base', async () => {
    const cuenta = await h.crearCuenta();
    const r = await h.api('/auth/login', { metodo: 'POST', cuerpo: { email: cuenta.email, password: h.CLAVE_VALIDA } });
    assert.equal(r.status, 200);
    assert.equal(r.datos.usuario.id, cuenta.id);
    assert.ok(r.cookie);
    const yo = await h.api('/auth/yo', { cookie: r.cookie });
    assert.equal(yo.datos.usuario.email, cuenta.email);
  });

  test('con clave incorrecta responde 401 y no entrega cookie', async () => {
    const cuenta = await h.crearCuenta();
    const r = await h.api('/auth/login', { metodo: 'POST', cuerpo: { email: cuenta.email, password: 'ClaveMala999' } });
    assert.equal(r.status, 401);
    assert.equal(r.cookie, null);
  });

  test('con un correo que no existe responde 401 con el mismo mensaje', async () => {
    const r = await h.api('/auth/login', { metodo: 'POST', cuerpo: { email: h.unico('fantasma'), password: h.CLAVE_VALIDA } });
    assert.equal(r.status, 401);
    assert.equal(r.datos.error, 'Correo o contraseña incorrectos.');
  });

});

describe('sesión', () => {
  test('cerrar sesión responde borrando la cookie y la sesión deja de valer', async () => {
    const cuenta = await h.crearCuenta();
    const antes = await h.api('/auth/yo', { cookie: cuenta.cookie });
    assert.equal(antes.datos.usuario.email, cuenta.email);

    const salida = await h.api('/auth/logout', { metodo: 'POST', cookie: cuenta.cookie });
    assert.equal(salida.status, 200);
    assert.ok(salida.cookies.some((c) => c.startsWith('vaelia_sesion=;') || /Expires=Thu, 01 Jan 1970/.test(c)), 'el servidor debe borrar la cookie');

    const despues = await h.api('/auth/yo');
    assert.equal(despues.datos.usuario, null);
  });

  test('una cookie falsificada no da acceso a Mi cuenta', async () => {
    const r = await h.api('/cuenta', { cookie: 'vaelia_sesion=eyJhbGciOiJIUzI1NiJ9.e30.firma-falsa' });
    assert.equal(r.status, 401);
  });

  test('Mi cuenta muestra los datos de la base cuando hay sesión', async () => {
    const cuenta = await h.crearCuenta({ nombre: 'Valentina', apellido: 'Díaz' });
    const r = await h.api('/cuenta', { cookie: cuenta.cookie });
    assert.equal(r.status, 200);
    assert.equal(r.datos.usuario.nombre, 'Valentina');
  });
});

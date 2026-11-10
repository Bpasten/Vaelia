const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const h = require('../helpers');
const { webpay } = require('../../src/config/transbank');

// Webpay se simula: el SDK no debe llamar a Transbank desde las pruebas
const createOriginal = webpay.create;
let webpayFalla = false;

const RUT = '11.111.111-1';
const contacto = (email) => ({ nombre: 'Ana', apellido: 'Pérez', email, telefono: '+56 9 1234 5678', rut: RUT });
const domicilio = { region: 'Metropolitana de Santiago', comuna: 'Providencia', calle: 'Av. Providencia 1234' };

let variante;

before(async () => {
  webpay.create = async (ordenCompra, sesion, monto, retorno) => {
    if (webpayFalla) throw new Error('Webpay no disponible (simulado)');
    return { token: `tok-${ordenCompra}`, url: 'https://webpay3gint.transbank.cl/formulario' };
  };
  await h.iniciar();
  // Variante con stock conocido para no depender de corridas anteriores
  const [v] = await h.query(
    `SELECT v.id FROM variantes v JOIN productos p ON p.id = v.producto_id
     JOIN colores co ON co.id = v.color_id WHERE p.activo = 1 AND co.slug = 'marino' AND v.talla = 'S' LIMIT 1`,
  );
  variante = v.id;
});

after(async () => {
  webpay.create = createOriginal;
  await h.cerrar();
});

beforeEach(async () => {
  webpayFalla = false;
  await h.query('UPDATE variantes SET stock = 50 WHERE id = ?', [variante]);
});

const pedidoDe = async (codigo) => {
  const [p] = await h.query('SELECT * FROM pedidos WHERE codigo = ?', [codigo]);
  return p;
};

describe('compra como invitada', () => {
  test('crea el pedido, el pago y descuenta el stock en la base', async () => {
    const email = h.unico('invitada');
    const antes = (await h.variante(variante)).stock;
    const r = await h.api('/checkout', {
      metodo: 'POST',
      cuerpo: { contacto: contacto(email), despacho: domicilio, acepta_terminos: true, items: [{ variante_id: variante, cantidad: 2 }] },
    });
    assert.equal(r.status, 201, JSON.stringify(r.datos));
    assert.match(r.datos.url, /webpay/);

    const pedido = await pedidoDe(r.datos.codigo);
    assert.ok(pedido, 'el pedido quedó en la base');
    assert.equal(pedido.usuario_id, null, 'es compra de invitada');
    assert.equal(pedido.estado, 'pendiente_pago');
    assert.equal(pedido.email, email);

    const [pago] = await h.query('SELECT * FROM pagos WHERE pedido_id = ?', [pedido.id]);
    assert.equal(pago.token, `tok-${r.datos.codigo}`);
    assert.equal(pago.estado, 'iniciado');

    assert.equal((await h.variante(variante)).stock, antes - 2, 'el stock se reserva al crear el pedido');
  });

  test('sin aceptar términos responde 422 y no crea pedido', async () => {
    const email = h.unico('sinterminos');
    const r = await h.api('/checkout', {
      metodo: 'POST',
      cuerpo: { contacto: contacto(email), despacho: domicilio, acepta_terminos: false, items: [{ variante_id: variante, cantidad: 1 }] },
    });
    assert.equal(r.status, 422);
    const [{ total }] = await h.query('SELECT COUNT(*) AS total FROM pedidos WHERE email = ?', [email]);
    assert.equal(total, 0);
  });

  test('pedir más stock del disponible responde 409 y no toca el stock', async () => {
    await h.query('UPDATE variantes SET stock = 1 WHERE id = ?', [variante]);
    const email = h.unico('sinstock');
    const r = await h.api('/checkout', {
      metodo: 'POST',
      cuerpo: { contacto: contacto(email), despacho: domicilio, acepta_terminos: true, items: [{ variante_id: variante, cantidad: 3 }] },
    });
    assert.equal(r.status, 409);
    assert.equal((await h.variante(variante)).stock, 1);
    const [{ total }] = await h.query('SELECT COUNT(*) AS total FROM pedidos WHERE email = ?', [email]);
    assert.equal(total, 0);
  });

  test('si Webpay no responde, el pedido se cancela y el stock vuelve', async () => {
    webpayFalla = true;
    const email = h.unico('webpaycaido');
    const antes = (await h.variante(variante)).stock;
    const r = await h.api('/checkout', {
      metodo: 'POST',
      cuerpo: { contacto: contacto(email), despacho: domicilio, acepta_terminos: true, items: [{ variante_id: variante, cantidad: 1 }] },
    });
    assert.equal(r.status, 502);
    const [pedido] = await h.query('SELECT estado FROM pedidos WHERE email = ?', [email]);
    assert.equal(pedido.estado, 'cancelado');
    assert.equal((await h.variante(variante)).stock, antes, 'el stock se devuelve');
  });

  test('el carrito vacío se rechaza', async () => {
    const r = await h.api('/checkout', {
      metodo: 'POST',
      cuerpo: { contacto: contacto(h.unico('vacio')), despacho: domicilio, acepta_terminos: true, items: [] },
    });
    assert.equal(r.status, 422);
  });
});

describe('compra con cuenta', () => {
  test('el pedido queda asociado a la cuenta y aparece en su historial', async () => {
    const cuenta = await h.crearCuenta();
    const r = await h.api('/checkout', {
      metodo: 'POST',
      cookie: cuenta.cookie,
      cuerpo: { contacto: contacto(cuenta.email), despacho: domicilio, acepta_terminos: true, items: [{ variante_id: variante, cantidad: 1 }] },
    });
    assert.equal(r.status, 201);
    const pedido = await pedidoDe(r.datos.codigo);
    assert.equal(pedido.usuario_id, cuenta.id);

    const historial = await h.api('/cuenta/pedidos', { cookie: cuenta.cookie });
    assert.ok(historial.datos.pedidos.some((p) => p.codigo === r.datos.codigo), 'el pedido aparece en Mi cuenta');
  });

  test('el teléfono y RUT ingresados en la compra se guardan en la cuenta', async () => {
    const cuenta = await h.crearCuenta();
    await h.api('/checkout', {
      metodo: 'POST',
      cookie: cuenta.cookie,
      cuerpo: { contacto: contacto(cuenta.email), despacho: domicilio, acepta_terminos: true, items: [{ variante_id: variante, cantidad: 1 }] },
    });
    const [u] = await h.query('SELECT telefono, rut FROM usuarios WHERE id = ?', [cuenta.id]);
    assert.equal(u.telefono, '+56912345678');
    assert.equal(u.rut, '11111111-1');
  });
});

describe('cotización', () => {
  test('calcula el total desde los precios de la base, no desde el navegador', async () => {
    const [{ precio }] = await h.query('SELECT p.precio FROM variantes v JOIN productos p ON p.id = v.producto_id WHERE v.id = ?', [variante]);
    const r = await h.api('/checkout/cotizar', {
      metodo: 'POST',
      cuerpo: { items: [{ variante_id: variante, cantidad: 2 }], despacho: domicilio },
    });
    assert.equal(r.status, 200);
    assert.equal(r.datos.subtotal, precio * 2);
    assert.equal(r.datos.envio, precio * 2 >= 60000 ? 0 : 3990, 'envío a la RM según el umbral');
    assert.equal(r.datos.total, precio * 2 + r.datos.envio);
  });
});

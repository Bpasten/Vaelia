/** Rutas de la API REST (todas responden JSON, salvo el retorno de Webpay que redirige). */
const { Router } = require('express');
const { requiereSesion } = require('../middlewares/auth');
const { limiteLogin, limiteRegistro, limiteCheckout } = require('../middlewares/limites');
const { verificarConexion } = require('../config/db');

const productos = require('../controllers/productos.controller');
const auth = require('../controllers/auth.controller');
const cuenta = require('../controllers/cuenta.controller');
const checkout = require('../controllers/checkout.controller');
const webpay = require('../controllers/webpay.controller');
const pedidos = require('../controllers/pedidos.controller');
const newsletter = require('../controllers/newsletter.controller');

const r = Router();

r.get('/salud', async (_req, res) => {
  await verificarConexion();
  res.json({ ok: true, servicio: 'vaelia-api', fecha: new Date().toISOString() });
});

// Catálogo
r.get('/productos', productos.listar);
r.get('/productos/destacados', productos.destacados);
r.get('/productos/filtros', productos.filtros);
r.get('/productos/:slug', productos.detalle);

// Autenticación
r.post('/auth/registro', limiteRegistro, auth.registro);
r.post('/auth/login', limiteLogin, auth.login);
r.post('/auth/logout', auth.logout);
r.get('/auth/yo', auth.yo);
r.get('/auth/proveedores', auth.proveedores);
r.get('/auth/google', auth.iniciarGoogle);
r.post('/auth/google', limiteLogin, auth.google);

// Mi cuenta
r.get('/cuenta', requiereSesion, cuenta.perfil);
r.put('/cuenta', requiereSesion, cuenta.actualizarPerfil);
r.put('/cuenta/direccion', requiereSesion, cuenta.actualizarDireccion);
r.get('/cuenta/pedidos', requiereSesion, cuenta.misPedidos);
r.get('/cuenta/pedidos/:codigo', requiereSesion, cuenta.detallePedido);

// Carrito y checkout
r.get('/checkout/config', checkout.configuracion);
r.post('/checkout/cotizar', checkout.cotizar);
r.post('/checkout', limiteCheckout, checkout.iniciarPago);

// Webpay Plus redirige aquí al terminar (GET o POST)
r.all('/webpay/retorno', webpay.retorno);

// Confirmación
r.get('/pedidos/:publicId', pedidos.publico);

// Newsletter
r.post('/newsletter', newsletter.suscribir);

module.exports = r;

/**
 * Aplicación Express: seguridad, API REST y archivos del frontend.
 */
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const config = require('./config/env');
const rutas = require('./routes');
const { sesionOpcional } = require('./middlewares/auth');
const { limiteApi } = require('./middlewares/limites');
const { noEncontrado, manejarErrores } = require('./middlewares/errores');

const app = express();
const PUBLICO = path.join(__dirname, '..', 'public');

if (config.trustProxy) app.set('trust proxy', 1); // detrás del proxy HTTPS del hosting
app.disable('x-powered-by');

// Cabeceras de seguridad (helmet). form-action permite enviar el token a Webpay.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
      formAction: ["'self'", 'https://webpay3gint.transbank.cl', 'https://webpay3g.transbank.cl'],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: config.produccion ? [] : null,
    },
  },
  strictTransportSecurity: config.produccion,
}));

if (config.corsOrigin) {
  app.use('/api', cors({ origin: config.corsOrigin.split(',').map((s) => s.trim()), credentials: true }));
}

app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' })); // retorno de Webpay
app.use(cookieParser());
app.use(sesionOpcional);

app.use('/api', limiteApi, rutas);

// Frontend (HTML, CSS, JS). /coleccion sirve coleccion.html, etc.
app.use(express.static(PUBLICO, {
  extensions: ['html'],
  maxAge: config.produccion ? '1d' : 0,
  setHeaders(res, ruta) {
    if (ruta.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
  },
}));

app.use(noEncontrado);
app.use(manejarErrores);

module.exports = app;

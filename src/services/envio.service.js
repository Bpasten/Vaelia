/** Reglas de costo de despacho (configurables en .env). */
const config = require('../config/env');

const RM = 'Metropolitana de Santiago';

function costoEnvio(subtotal, tipo, region) {
  if (tipo === 'retiro') return 0;
  if (subtotal >= config.envio.gratisDesde) return 0;
  if (!region) return config.envio.rm; // estimación antes de elegir región
  return region === RM ? config.envio.rm : config.envio.regiones;
}

function resumenReglas() {
  return {
    rm: config.envio.rm,
    regiones: config.envio.regiones,
    gratisDesde: config.envio.gratisDesde,
    retiro: 'Showroom Vaelia · Providencia, Región Metropolitana',
  };
}

module.exports = { costoEnvio, resumenReglas };

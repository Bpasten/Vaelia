const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
require('../entorno');
const { costoEnvio } = require('../../src/services/envio.service');

describe('costo de despacho', () => {
  test('envío a la RM cuesta la tarifa RM', () => {
    assert.equal(costoEnvio(10000, 'Metropolitana de Santiago'), 3990);
  });
  test('envío a regiones cuesta la tarifa regional', () => {
    assert.equal(costoEnvio(10000, 'Biobío'), 5990);
  });
  test('sobre el mínimo el envío es gratis', () => {
    assert.equal(costoEnvio(60000, 'Biobío'), 0);
  });
  test('sin región elegida se estima con la tarifa RM', () => {
    assert.equal(costoEnvio(10000, null), 3990);
  });
});

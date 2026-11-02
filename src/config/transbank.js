/**
 * Cliente de Webpay Plus con el SDK oficial (transbank-sdk).
 * En integración se usan las credenciales públicas de prueba de Transbank,
 * de modo que el proyecto funciona sin pedir nada a Transbank.
 */
const { WebpayPlus, IntegrationApiKeys, IntegrationCommerceCodes } = require('transbank-sdk');
const config = require('./env');

const { ambiente, codigoComercio, apiKey } = config.transbank;

const transaccion = ambiente === 'production'
  ? WebpayPlus.Transaction.buildForProduction(codigoComercio, apiKey)
  : WebpayPlus.Transaction.buildForIntegration(
      codigoComercio || IntegrationCommerceCodes.WEBPAY_PLUS,
      apiKey || IntegrationApiKeys.WEBPAY,
    );

module.exports = {
  webpay: transaccion,
  ambiente,
  esIntegracion: ambiente !== 'production',
  urlRetorno: `${config.appUrl}/api/webpay/retorno`,
};

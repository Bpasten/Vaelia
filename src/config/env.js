/**
 * Configuración central. Toda credencial vive en variables de entorno (.env),
 * nunca en el código fuente (buenas prácticas 5.3 del informe).
 */
require('dotenv').config({ quiet: true });

const env = process.env;
const produccion = env.NODE_ENV === 'production';

const config = {
  produccion,
  puerto: Number(env.PORT) || 3000,
  appUrl: (env.APP_URL || `http://localhost:${Number(env.PORT) || 3000}`).replace(/\/$/, ''),
  corsOrigin: env.CORS_ORIGIN || null,
  trustProxy: env.TRUST_PROXY === '1',

  db: {
    host: env.DB_HOST || 'localhost',
    port: Number(env.DB_PORT) || 3306,
    user: env.DB_USER || 'root',
    password: env.DB_PASSWORD || '',
    database: env.DB_NAME || 'vaelia',
    // TiDB Cloud y otros MySQL en la nube exigen TLS: DB_SSL=true
    ssl: env.DB_SSL === 'true' ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined,
  },

  jwt: {
    secreto: env.JWT_SECRET || '',
    expira: env.JWT_EXPIRES || '7d',
  },

  transbank: {
    ambiente: env.TBK_ENV === 'production' ? 'production' : 'integration',
    codigoComercio: env.TBK_COMMERCE_CODE || '',
    apiKey: env.TBK_API_KEY || '',
  },

  supabase: {
    url: (env.SUPABASE_URL || '').replace(/\/$/, ''),
    clave: env.SUPABASE_PUBLISHABLE_KEY || '',
  },

  envio: {
    rm: Number(env.ENVIO_RM) || 3990,
    regiones: Number(env.ENVIO_REGIONES) || 5990,
    gratisDesde: Number(env.ENVIO_GRATIS_DESDE) || 60000,
  },

  // Minutos que un pedido puede esperar el pago antes de liberar el stock reservado
  minutosExpiracionPago: Number(env.MINUTOS_EXPIRACION_PAGO) || 30,
};

// Validaciones mínimas al arrancar: fallar temprano y con un mensaje claro
const errores = [];
if (!config.jwt.secreto || config.jwt.secreto.length < 32) {
  errores.push('JWT_SECRET debe existir y tener al menos 32 caracteres.');
}
if (config.transbank.ambiente === 'production' && (!config.transbank.codigoComercio || !config.transbank.apiKey)) {
  errores.push('En producción, TBK_COMMERCE_CODE y TBK_API_KEY son obligatorios.');
}
if (produccion && !config.appUrl.startsWith('https://')) {
  errores.push('En producción APP_URL debe usar https:// (requisito para Webpay).');
}
if (errores.length) {
  console.error('\n✗ Configuración inválida:\n  - ' + errores.join('\n  - ') + '\n  Revisa tu archivo .env (usa .env.example como guía).\n');
  process.exit(1);
}

module.exports = config;

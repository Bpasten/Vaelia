const config = require('./src/config/env');
const app = require('./src/app');
const { verificarConexion, pool } = require('./src/config/db');
const { expirarPendientes } = require('./src/services/pedidos.service');
const { ambiente } = require('./src/config/transbank');

async function iniciar() {
  try {
    await verificarConexion();
  } catch (err) {
    console.error(`\n✗ No se pudo conectar a MySQL (${config.db.user}@${config.db.host}:${config.db.port}/${config.db.database}).`);
    console.error(`  ${err.code || ''} ${err.message}`);
    console.error('  Revisa las variables DB_* del archivo .env y ejecuta "npm run db:setup".\n');
    process.exit(1);
  }

  const servidor = app.listen(config.puerto, () => {
    console.log(`\n  VAELIA · Vístete para ti.`);
    console.log(`  → Tienda:   ${config.appUrl}`);
    console.log(`  → API:      ${config.appUrl}/api/salud`);
    console.log(`  → Webpay:   ambiente de ${ambiente === 'production' ? 'PRODUCCIÓN' : 'integración (pruebas)'}\n`);
  });


  const tarea = setInterval(() => {
    expirarPendientes()
      .then((n) => n && console.log(`[stock] ${n} pedido(s) sin pago liberado(s).`))
      .catch((err) => console.error('[stock] Error al liberar pedidos:', err.message));
  }, 5 * 60 * 1000);
  tarea.unref();

  const cerrar = () => {
    servidor.close(() => pool.end().finally(() => process.exit(0)));
  };
  process.on('SIGINT', cerrar);
  process.on('SIGTERM', cerrar);
}

iniciar();

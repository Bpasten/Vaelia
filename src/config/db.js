/**
 * Pool de conexiones MySQL (mysql2/promise).
 * Todas las consultas usan parámetros (?) para evitar inyección SQL.
 */
const mysql = require('mysql2/promise');
const config = require('./env');

const pool = mysql.createPool({
  ...config.db,
  ssl: config.db.ssl,
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
  timezone: 'Z',
  dateStrings: false,
  decimalNumbers: true,
});

// Todas las fechas se guardan en UTC; el navegador las muestra en hora de Chile
pool.on('connection', (conn) => {
  conn.query("SET time_zone = '+00:00'");
});

/**
 * Ejecuta una consulta parametrizada y devuelve solo las filas.
 * Se usa pool.query (escape seguro de cada ?) en vez de execute porque
 * MySQL 8.0.22+ rechaza parámetros numéricos en LIMIT con sentencias preparadas.
 */
async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

/**
 * Ejecuta `fn(conn)` dentro de una transacción.
 * Si fn lanza un error, se hace ROLLBACK y el error se propaga.
 */
async function transaccion(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const resultado = await fn(conn);
    await conn.commit();
    return resultado;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function verificarConexion() {
  const conn = await pool.getConnection();
  await conn.ping();
  conn.release();
}

module.exports = { pool, query, transaccion, verificarConexion };

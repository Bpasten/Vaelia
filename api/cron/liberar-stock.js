/**
 * Libera el stock de pedidos con pago abandonado.
 * Lo llama el cron de Vercel (vercel.json) con "Authorization: Bearer CRON_SECRET".
 */
const crypto = require('crypto');
const { expirarPendientes } = require('../../src/services/pedidos.service');

function autorizado(req) {
  const secreto = process.env.CRON_SECRET || '';
  const enviado = req.headers.authorization || '';
  if (!secreto) return false;
  const a = Buffer.from(enviado);
  const b = Buffer.from(`Bearer ${secreto}`);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = async (req, res) => {
  if (!autorizado(req)) return res.status(401).json({ error: 'No autorizado' });
  try {
    const liberados = await expirarPendientes();
    res.json({ liberados });
  } catch (err) {
    console.error('[cron] Error al liberar pedidos:', err.message);
    res.status(500).json({ error: 'Error al liberar pedidos' });
  }
};

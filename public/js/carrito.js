/**
 * Carrito de compras (HU10, HU11): se conserva en el navegador con localStorage.
 * Guarda producto, variante (color + talla), cantidad y precio de referencia.
 * El precio y el stock definitivos siempre los confirma el servidor en el checkout.
 */
const CLAVE = 'vaelia_carrito_v1';
const MAX_POR_LINEA = 10;
let memoria = []; // respaldo si el navegador bloquea localStorage

function leer() {
  try {
    const crudo = localStorage.getItem(CLAVE);
    const datos = crudo ? JSON.parse(crudo) : [];
    return Array.isArray(datos) ? datos.filter((i) => i && Number.isInteger(i.variante_id) && i.cantidad > 0) : [];
  } catch {
    return memoria;
  }
}

function guardar(items) {
  memoria = items;
  try { localStorage.setItem(CLAVE, JSON.stringify(items)); } catch { /* modo privado */ }
  window.dispatchEvent(new CustomEvent('carrito:cambio', { detail: { items } }));
}

export const obtener = () => leer();
export const unidades = () => leer().reduce((s, i) => s + i.cantidad, 0);
export const subtotal = () => leer().reduce((s, i) => s + i.precio * i.cantidad, 0);

const tope = (item) => Math.max(0, Math.min(MAX_POR_LINEA, Number(item.stock) || MAX_POR_LINEA));

/** Agrega una variante (o suma cantidad si ya estaba). Devuelve la cantidad final. */
export function agregar(item, cantidad = 1) {
  const items = leer();
  const existente = items.find((i) => i.variante_id === item.variante_id);
  if (existente) {
    Object.assign(existente, { ...item, cantidad: existente.cantidad });
    existente.cantidad = Math.min(tope(existente), existente.cantidad + cantidad);
  } else {
    items.unshift({ ...item, cantidad: Math.min(tope(item), cantidad) });
  }
  guardar(items);
  return (existente || items[0]).cantidad;
}

export function cambiarCantidad(varianteId, cantidad) {
  const items = leer();
  const it = items.find((i) => i.variante_id === varianteId);
  if (!it) return;
  if (cantidad <= 0) return quitar(varianteId);
  it.cantidad = Math.min(tope(it), cantidad);
  guardar(items);
}

export function quitar(varianteId) {
  guardar(leer().filter((i) => i.variante_id !== varianteId));
}

export function vaciar() {
  guardar([]);
}

/** Sincroniza el carrito con la cotización del servidor (precios y stock reales). */
export function sincronizar(lineas, problemas = []) {
  const items = leer();
  const porId = new Map(lineas.map((l) => [l.variante_id, l]));
  const sinDisponible = new Set(problemas.filter((p) => !p.disponible).map((p) => p.variante_id));
  const nuevos = [];
  for (const it of items) {
    const l = porId.get(it.variante_id);
    if (!l || sinDisponible.has(it.variante_id)) continue;
    const disponible = problemas.find((p) => p.variante_id === it.variante_id)?.disponible;
    nuevos.push({
      ...it,
      precio: l.precio,
      stock: Math.min(l.stock, MAX_POR_LINEA),
      imagen: l.imagen || it.imagen,
      cantidad: disponible ? Math.min(it.cantidad, disponible) : it.cantidad,
    });
  }
  guardar(nuevos);
  return nuevos;
}

// Mantener el contador al día entre pestañas
window.addEventListener('storage', (e) => {
  if (e.key === CLAVE) window.dispatchEvent(new CustomEvent('carrito:cambio', { detail: { items: leer() } }));
});

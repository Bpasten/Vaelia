/**
 * Capa de comunicación con la API REST de Vaelia y utilidades compartidas.
 */

export async function api(ruta, { metodo = 'GET', cuerpo } = {}) {
  let res;
  try {
    res = await fetch('/api' + ruta, {
      method: metodo,
      headers: cuerpo !== undefined ? { 'Content-Type': 'application/json' } : {},
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
      credentials: 'same-origin',
    });
  } catch {
    const err = new Error('No pudimos conectarnos. Revisa tu conexión e intenta nuevamente.');
    err.status = 0;
    throw err;
  }
  let datos = null;
  try { datos = await res.json(); } catch { /* respuesta sin cuerpo */ }
  if (!res.ok) {
    const err = new Error(datos?.error || 'Ocurrió un problema. Intenta nuevamente.');
    err.status = res.status;
    err.campos = datos?.campos || null;
    throw err;
  }
  return datos;
}

const formatoClp = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
export const clp = (n) => formatoClp.format(Number(n) || 0);

const formatoFecha = new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Santiago' });
const formatoDia = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Santiago' });
export const fecha = (d) => (d ? formatoFecha.format(new Date(d)) : '');
export const dia = (d) => (d ? formatoDia.format(new Date(d)) : '');

const ENTIDADES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ENTIDADES[c]);

export const icono = (id, clase = 'i') => `<svg class="${clase}" aria-hidden="true" focusable="false"><use href="/img/icons.svg#i-${id}"></use></svg>`;

/** Solo permite volver a rutas internas (evita redirecciones abiertas). */
export function rutaSegura(valor, porDefecto = '/') {
  return typeof valor === 'string' && valor.startsWith('/') && !valor.startsWith('//') && !valor.startsWith('/\\') ? valor : porDefecto;
}

/** Muestra los errores por campo que devuelve la API (422) en un formulario. */
export function marcarErrores(form, campos = {}, prefijo = '') {
  form.querySelectorAll('[aria-invalid="true"]').forEach((el) => el.removeAttribute('aria-invalid'));
  form.querySelectorAll('.error-campo[data-para]').forEach((el) => { el.textContent = ''; el.hidden = true; });
  let primero = null;
  for (const [campo, mensaje] of Object.entries(campos || {})) {
    const input = form.querySelector(`[name="${prefijo}${campo}"]`);
    const caja = form.querySelector(`.error-campo[data-para="${prefijo}${campo}"]`);
    if (input) { input.setAttribute('aria-invalid', 'true'); primero ||= input; }
    if (caja) { caja.textContent = mensaje; caja.hidden = false; }
  }
  primero?.focus();
  return Boolean(primero);
}

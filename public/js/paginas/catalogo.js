/** Catálogo con filtros (HU07, HU09): categoría, color, talla, ocasión, búsqueda y orden. */
import { api, esc, icono } from '../api.js';
import { iniciarPagina, tarjetaProducto, tarjetasEsqueleto } from '../ui.js';

iniciarPagina({ activo: 'coleccion' });

const form = document.querySelector('[data-filtros]');
const grilla = document.querySelector('[data-grilla]');
const resultado = document.querySelector('[data-resultado]');
const paginacion = document.querySelector('[data-paginacion]');
const chips = document.querySelector('[data-chips]');
const CAMPOS = ['q', 'categoria', 'color', 'talla', 'ocasion', 'orden'];
let opciones = { categorias: [], colores: [], tallas: [], ocasiones: [] };
let pedidoActual = 0;

function estadoDesdeUrl() {
  const p = new URLSearchParams(location.search);
  const e = Object.fromEntries(CAMPOS.map((c) => [c, p.get(c) || '']));
  e.pagina = Math.max(1, parseInt(p.get('pagina'), 10) || 1);
  return e;
}

function escribirUrl(estado, reemplazar = false) {
  const p = new URLSearchParams();
  for (const c of CAMPOS) if (estado[c] && !(c === 'orden' && estado[c] === 'destacados')) p.set(c, estado[c]);
  if (estado.pagina > 1) p.set('pagina', estado.pagina);
  const url = `${location.pathname}${p.toString() ? '?' + p : ''}`;
  history[reemplazar ? 'replaceState' : 'pushState'](null, '', url);
}

function llenarSelect(nombre, items, etiqueta) {
  const sel = form.elements[nombre];
  sel.innerHTML = `<option value="">${etiqueta}</option>` + items.map((i) => `<option value="${esc(i.slug ?? i)}">${esc(i.nombre ?? i)}${i.cantidad !== undefined ? ` (${i.cantidad})` : ''}</option>`).join('');
}

function sincronizarFormulario(estado) {
  for (const c of CAMPOS) if (form.elements[c]) form.elements[c].value = estado[c] || (c === 'orden' ? 'destacados' : '');
}

function nombreDe(campo, valor) {
  const listas = { categoria: opciones.categorias, color: opciones.colores, ocasion: opciones.ocasiones };
  if (campo === 'talla') return `Talla ${valor}`;
  if (campo === 'q') return `“${valor}”`;
  return listas[campo]?.find((i) => i.slug === valor)?.nombre || valor;
}

function pintarChips(estado) {
  const activos = ['q', 'categoria', 'color', 'talla', 'ocasion'].filter((c) => estado[c]);
  chips.innerHTML = activos.map((c) => `<button class="chip" type="button" data-quitar="${c}" aria-label="Quitar filtro ${esc(nombreDe(c, estado[c]))}">${esc(nombreDe(c, estado[c]))}${icono('cerrar')}</button>`).join('')
    + (activos.length > 1 ? '<button class="chip-limpiar" type="button" data-limpiar>Limpiar filtros</button>' : '');
}

function pintarPaginacion(pagina, paginas) {
  if (paginas <= 1) { paginacion.innerHTML = ''; return; }
  let html = `<button type="button" data-pagina="${pagina - 1}" ${pagina === 1 ? 'disabled' : ''} aria-label="Página anterior">${icono('chevron-izq', 'i i-sm')}</button>`;
  for (let i = 1; i <= paginas; i++) {
    html += `<button type="button" data-pagina="${i}" ${i === pagina ? 'aria-current="page"' : ''} aria-label="Página ${i}">${i}</button>`;
  }
  html += `<button type="button" data-pagina="${pagina + 1}" ${pagina === paginas ? 'disabled' : ''} aria-label="Página siguiente">${icono('chevron-der', 'i i-sm')}</button>`;
  paginacion.innerHTML = html;
}

async function cargar(estado) {
  const id = ++pedidoActual;
  sincronizarFormulario(estado);
  pintarChips(estado);
  grilla.innerHTML = tarjetasEsqueleto(6);
  grilla.setAttribute('aria-busy', 'true');

  const tituloOcasion = opciones.ocasiones.find((o) => o.slug === estado.ocasion);
  const tituloCat = opciones.categorias.find((o) => o.slug === estado.categoria);
  document.title = `${tituloCat?.nombre || tituloOcasion?.nombre || 'Colección'} · Vaelia`;

  const p = new URLSearchParams({ pagina: estado.pagina, por_pagina: 9 });
  for (const c of CAMPOS) if (estado[c]) p.set(c, estado[c]);
  try {
    const r = await api(`/productos?${p}`);
    if (id !== pedidoActual) return; // llegó una respuesta más nueva
    grilla.removeAttribute('aria-busy');
    if (!r.productos.length) {
      resultado.textContent = 'Sin resultados';
      grilla.innerHTML = `
        <div class="vacio vacio--grilla">
          ${icono('buscar')}
          <h2>No encontramos prendas</h2>
          <p>Prueba con otros filtros o explora toda la colección.</p>
          <button class="btn btn-borde" type="button" data-limpiar>Ver toda la colección</button>
        </div>`;
      paginacion.innerHTML = '';
      return;
    }
    const desde = (r.pagina - 1) * 9 + 1;
    const hasta = desde + r.productos.length - 1;
    resultado.textContent = `Mostrando ${desde}–${hasta} de ${r.total} ${r.total === 1 ? 'prenda' : 'prendas'}`;
    grilla.innerHTML = r.productos.map(tarjetaProducto).join('');
    pintarPaginacion(r.pagina, r.paginas);
  } catch (err) {
    if (id !== pedidoActual) return;
    grilla.removeAttribute('aria-busy');
    grilla.innerHTML = '';
    resultado.textContent = err.message;
  }
}

function aplicar(cambios, { reemplazar = false } = {}) {
  const estado = { ...estadoDesdeUrl(), ...cambios };
  if (!('pagina' in cambios)) estado.pagina = 1;
  escribirUrl(estado, reemplazar);
  cargar(estado);
}

// Eventos
form.addEventListener('change', (e) => {
  if (e.target.name && e.target.name !== 'q') aplicar({ [e.target.name]: e.target.value });
});
let espera;
form.elements.q.addEventListener('input', () => {
  clearTimeout(espera);
  espera = setTimeout(() => aplicar({ q: form.elements.q.value.trim() }, { reemplazar: true }), 350);
});
form.addEventListener('submit', (e) => { e.preventDefault(); clearTimeout(espera); aplicar({ q: form.elements.q.value.trim() }); });
document.addEventListener('click', (e) => {
  const quitar = e.target.closest('[data-quitar]');
  if (quitar) return aplicar({ [quitar.dataset.quitar]: '' });
  if (e.target.closest('[data-limpiar]')) return aplicar({ q: '', categoria: '', color: '', talla: '', ocasion: '' });
  const pag = e.target.closest('[data-pagina]');
  if (pag && !pag.disabled) {
    aplicar({ pagina: Number(pag.dataset.pagina) });
    document.querySelector('.filtros').scrollIntoView({ behavior: 'smooth' });
  }
});
window.addEventListener('popstate', () => cargar(estadoDesdeUrl()));

// Inicio: primero las opciones de filtros, luego los productos
api('/productos/filtros')
  .then((o) => {
    opciones = o;
    llenarSelect('categoria', o.categorias, 'Categoría');
    llenarSelect('color', o.colores, 'Color');
    llenarSelect('talla', o.tallas.map((t) => ({ slug: t, nombre: t })), 'Talla');
    llenarSelect('ocasion', o.ocasiones, 'Ocasión');
  })
  .catch(() => { /* los selectores quedan con su opción por defecto */ })
  .finally(() => cargar(estadoDesdeUrl()));

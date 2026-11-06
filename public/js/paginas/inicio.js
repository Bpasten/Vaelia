import { api, clp, esc } from '../api.js';
import { iniciarPagina, tarjetaProducto, tarjetasEsqueleto } from '../ui.js';

iniciarPagina({ activo: 'inicio' });

// Productos destacados desde MySQL
const grilla = document.querySelector('[data-destacados]');
grilla.innerHTML = tarjetasEsqueleto(4);
api('/productos/destacados')
  .then(({ productos }) => {
    grilla.innerHTML = productos.map(tarjetaProducto).join('');
  })
  .catch((err) => {
    grilla.innerHTML = `<p class="resultado">${esc(err.message)}</p>`;
  });

// Carrusel de portada: todas las prendas activas, con desvanecido entre ellas
const contenedorCarrusel = document.querySelector('[data-hero-slides]');
const etiquetaHero = document.querySelector('[data-hero-enlace]');
api('/productos?por_pagina=24')
  .then(({ productos }) => {
    const piezas = productos.filter((p) => p.imagen);
    if (!piezas.length) return;
    iniciarCarrusel(piezas);
  })
  .catch(() => {});

function iniciarCarrusel(piezas) {
  contenedorCarrusel.innerHTML = piezas.map((p, i) => `
    <a class="hero__slide${i === 0 ? ' is-activa' : ''}" href="/producto?p=${encodeURIComponent(p.slug)}" aria-label="${esc(p.nombre)}, ${clp(p.precio)}" data-slide="${i}">
      <img src="${esc(p.imagen)}" alt="${esc(p.nombre)}" width="800" height="1000" ${i === 0 ? '' : 'loading="lazy"'}>
    </a>`).join('');
  const arco = contenedorCarrusel.parentElement;
  arco.insertAdjacentHTML('beforeend', `
    <div class="hero__puntos" role="group" aria-label="Elegir prenda">
      ${piezas.map((p, i) => `<button type="button" aria-label="Ver ${esc(p.nombre)}" aria-pressed="${i === 0}" data-punto="${i}"></button>`).join('')}
    </div>`);

  let actual = 0;
  let timer = null;
  const pintarEtiqueta = (p) => {
    etiquetaHero.href = `/producto?p=${encodeURIComponent(p.slug)}`;
    etiquetaHero.querySelector('[data-hero-nombre]').textContent = p.nombre;
    etiquetaHero.querySelector('[data-hero-precio]').textContent = clp(p.precio);
  };
  const mostrar = (i) => {
    actual = (i + piezas.length) % piezas.length;
    contenedorCarrusel.querySelectorAll('.hero__slide').forEach((s, j) => s.classList.toggle('is-activa', j === actual));
    arco.querySelectorAll('[data-punto]').forEach((b, j) => b.setAttribute('aria-pressed', String(j === actual)));
    pintarEtiqueta(piezas[actual]);
  };
  const girar = () => { if (piezas.length > 1) timer = setInterval(() => mostrar(actual + 1), 4500); };
  const detener = () => { clearInterval(timer); timer = null; };

  arco.addEventListener('click', (e) => {
    const punto = e.target.closest('[data-punto]');
    if (!punto) return;
    mostrar(Number(punto.dataset.punto));
    detener(); girar();
  });
  arco.addEventListener('pointerenter', detener);
  arco.addEventListener('pointerleave', () => { if (!timer) girar(); });
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) girar();
  pintarEtiqueta(piezas[0]);
}

// Newsletter "Mantente cerca"
const form = document.querySelector('[data-newsletter]');
const msg = document.querySelector('[data-newsletter-msg]');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = form.email.value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    msg.textContent = 'Ingresa un correo válido.';
    form.email.focus();
    return;
  }
  const btn = form.querySelector('button');
  btn.setAttribute('aria-busy', 'true');
  try {
    const r = await api('/newsletter', { metodo: 'POST', cuerpo: { email } });
    msg.textContent = r.mensaje;
    form.reset();
  } catch (err) {
    msg.textContent = err.message;
  } finally {
    btn.removeAttribute('aria-busy');
  }
});

import { api, clp, esc } from '../api.js';
import { iniciarPagina, tarjetaProducto, tarjetasEsqueleto } from '../ui.js';

iniciarPagina({ activo: 'inicio' });

// Productos destacados desde MySQL
const grilla = document.querySelector('[data-destacados]');
grilla.innerHTML = tarjetasEsqueleto(4);
api('/productos/destacados')
  .then(({ productos }) => {
    grilla.innerHTML = productos.map(tarjetaProducto).join('');
    const pieza = productos[0];
    if (pieza) {
      document.querySelector('[data-hero-nombre]').textContent = pieza.nombre;
      document.querySelector('[data-hero-precio]').textContent = clp(pieza.precio);
      document.querySelector('[data-hero-enlace]').href = `/producto?p=${encodeURIComponent(pieza.slug)}`;
      const img = document.querySelector('[data-hero-img]');
      img.src = pieza.imagen;
      img.alt = `${pieza.nombre} en ${pieza.colores[0]?.nombre.toLowerCase() || ''}`;
    }
  })
  .catch((err) => {
    grilla.innerHTML = `<p class="resultado">${esc(err.message)}</p>`;
  });

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

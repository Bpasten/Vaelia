/** Ficha de producto (HU08): imágenes por color, tallas con stock, cantidad y carrito. */
import { api, clp, esc, icono } from '../api.js';
import { iniciarPagina, tarjetaProducto, abrirCarrito, toast, obtenerConfig } from '../ui.js';
import * as carrito from '../carrito.js';

iniciarPagina({ activo: 'coleccion' });

const params = new URLSearchParams(location.search);
const slug = params.get('p');
const contenedor = document.querySelector('[data-ficha]');
const TALLAS = ['S', 'M', 'L', 'XL', 'XXL'];

let producto;
let reglasEnvio = { gratisDesde: 60000, rm: 3990 };
const estado = { color: null, talla: null, cantidad: 1, imagen: 0 };

const variante = () => producto.variantes.find((v) => v.color === estado.color && v.talla === estado.talla);
const colorActual = () => producto.colores.find((c) => c.slug === estado.color);

function noEncontrado(mensaje) {
  contenedor.innerHTML = `
    <div class="vacio">
      ${icono('buscar')}
      <h2>${esc(mensaje)}</h2>
      <p>Puede que el producto ya no esté disponible. Revisa el resto de la colección.</p>
      <a class="btn btn-primario" href="/coleccion">Ver colección ${icono('flecha', 'i i-flecha')}</a>
    </div>`;
}

function pintar() {
  const c = colorActual();
  const imagenes = c.imagenes.length ? c.imagenes : [{ url: producto.imagen, alt: producto.nombre }];
  estado.imagen = Math.min(estado.imagen, imagenes.length - 1);
  const v = variante();
  const maxCant = v ? Math.min(v.stock, 10) : 10;
  estado.cantidad = Math.min(estado.cantidad, Math.max(1, maxCant));

  let nota = '';
  let claseNota = 'stock-nota';
  if (v) {
    if (v.stock === 0) { nota = 'Talla agotada en este color'; claseNota += ' stock-nota--sin'; }
    else if (v.stock <= 3) { nota = `¡Últimas ${v.stock} unidades!`; claseNota += ' stock-nota--poco'; }
    else nota = 'Disponible · despacho en 2 a 5 días hábiles';
  }

  contenedor.innerHTML = `
    <div class="ficha">
      <div class="galeria">
        <div class="galeria__miniaturas" role="group" aria-label="Imágenes del producto">
          ${imagenes.map((img, i) => `
            <button type="button" data-img="${i}" aria-label="Ver imagen ${i + 1}: ${esc(img.alt)}" aria-current="${i === estado.imagen}">
              <img src="${esc(img.url)}" alt="" width="84" height="105">
            </button>`).join('')}
        </div>
        <div class="galeria__principal">
          <img src="${esc(imagenes[estado.imagen].url)}" alt="${esc(imagenes[estado.imagen].alt)}" width="800" height="1000">
        </div>
      </div>

      <div class="ficha__info">
        <div>
          <p class="eyebrow ficha__categoria">${esc(producto.categoria.nombre)} · ${esc(producto.ocasion_nombre)}</p>
          <h1>${esc(producto.nombre)}</h1>
        </div>
        <p class="ficha__precio">${clp(producto.precio)}</p>
        <p class="ficha__bajada">${esc(producto.descripcion)}</p>

        <div>
          <p class="opcion__titulo"><strong>Color:</strong> <span>${esc(c.nombre)}</span></p>
          <div class="colores" role="radiogroup" aria-label="Color">
            ${producto.colores.map((col) => `
              <button type="button" class="color-btn" role="radio" style="--c:${esc(col.hex)}" data-color="${esc(col.slug)}"
                aria-checked="${col.slug === estado.color}" aria-label="${esc(col.nombre)}${col.stock === 0 ? ' (agotado)' : ''}" title="${esc(col.nombre)}"></button>`).join('')}
          </div>
        </div>

        <div>
          <p class="opcion__titulo"><strong>Talla:</strong> <span>${estado.talla ? esc(estado.talla) : 'Selecciona una talla'}</span></p>
          <div class="tallas" role="radiogroup" aria-label="Talla">
            ${TALLAS.map((t) => {
              const vt = producto.variantes.find((x) => x.color === estado.color && x.talla === t);
              const agotada = !vt || vt.stock === 0;
              return `<button type="button" class="talla-btn" role="radio" data-talla="${t}" aria-checked="${t === estado.talla}" ${agotada ? 'disabled aria-disabled="true"' : ''}
                aria-label="Talla ${t}${agotada ? ', agotada' : ''}">${t}</button>`;
            }).join('')}
          </div>
          <p class="error-campo" data-error-talla hidden>Selecciona una talla para continuar.</p>
          <button type="button" class="guia-btn" data-abrir-guia>${icono('regla')} Guía de tallas</button>
        </div>

        <p class="${claseNota}" aria-live="polite">${esc(nota)}</p>

        <div class="comprar">
          <div class="cantidad" role="group" aria-label="Cantidad">
            <button type="button" data-cant="-1" aria-label="Disminuir cantidad" ${estado.cantidad <= 1 ? 'disabled' : ''}>${icono('menos')}</button>
            <output aria-live="polite">${estado.cantidad}</output>
            <button type="button" data-cant="1" aria-label="Aumentar cantidad" ${estado.cantidad >= maxCant ? 'disabled' : ''}>${icono('mas')}</button>
          </div>
          <button class="btn btn-primario" type="button" data-agregar ${v && v.stock === 0 ? 'disabled' : ''}>
            ${v && v.stock === 0 ? 'Agotado' : 'Agregar al carrito'}
          </button>
        </div>

        <div class="confianza">
          <div>${icono('escudo')}<span>Compra segura con Webpay</span></div>
        </div>

        <div class="acordeon">
          <details open>
            <summary>Descripción ${icono('chevron')}</summary>
            <div class="contenido"><p>${esc(producto.descripcion)}</p></div>
          </details>
          <details>
            <summary>Materiales y cuidados ${icono('chevron')}</summary>
            <div class="contenido"><p><strong>Composición:</strong> ${esc(producto.materiales)}</p><p><strong>Cuidados:</strong> ${esc(producto.cuidados)}</p></div>
          </details>
        </div>
      </div>
    </div>`;
}

function pintarMigas() {
  const migas = document.querySelector('[data-migas]');
  migas.insertAdjacentHTML('beforeend', `
    <li><a href="/coleccion?categoria=${encodeURIComponent(producto.categoria.slug)}">${esc(producto.categoria.nombre)}</a></li>
    <li aria-current="page">${esc(producto.nombre)}</li>`);
}

// Zoom al pasar el cursor sobre la foto principal (estilo tienda de moda)
const ZOOM = 2.2;
contenedor.addEventListener('pointermove', (e) => {
  const zona = e.target.closest?.('.galeria__principal');
  if (!zona) return;
  const img = zona.querySelector('img');
  const r = zona.getBoundingClientRect();
  const x = Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100));
  const y = Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100));
  img.style.transformOrigin = `${x}% ${y}%`;
  img.style.transform = `scale(${ZOOM})`;
  zona.classList.add('galeria__principal--zoom');
});
contenedor.addEventListener('pointerout', (e) => {
  const zona = e.target.closest?.('.galeria__principal');
  if (!zona || zona.contains(e.relatedTarget)) return;
  const img = zona.querySelector('img');
  img.style.transform = '';
  img.style.transformOrigin = 'center';
  zona.classList.remove('galeria__principal--zoom');
});

contenedor.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b || b.disabled) return;
  if (b.dataset.img) { estado.imagen = Number(b.dataset.img); pintar(); return; }
  if (b.dataset.color) {
    estado.color = b.dataset.color;
    estado.imagen = 0;
    const vt = variante();
    if (vt && vt.stock === 0) estado.talla = null;
    const u = new URL(location.href); u.searchParams.set('color', estado.color); history.replaceState(null, '', u);
    pintar();
    contenedor.querySelector(`[data-color="${estado.color}"]`)?.focus();
    return;
  }
  if (b.dataset.talla) {
    estado.talla = b.dataset.talla;
    pintar();
    contenedor.querySelector(`[data-talla="${estado.talla}"]`)?.focus();
    return;
  }
  if (b.dataset.cant) {
    estado.cantidad = Math.max(1, estado.cantidad + Number(b.dataset.cant));
    pintar();
    contenedor.querySelector(`[data-cant="${b.dataset.cant}"]`)?.focus();
    return;
  }
  if (b.hasAttribute('data-abrir-guia')) { document.getElementById('guia-tallas').showModal(); return; }
  if (b.hasAttribute('data-agregar')) agregarAlCarrito();
});

function agregarAlCarrito() {
  const v = variante();
  if (!v) {
    const err = contenedor.querySelector('[data-error-talla]');
    err.hidden = false;
    contenedor.querySelector('.talla-btn:not([disabled])')?.focus();
    return;
  }
  const c = colorActual();
  const antes = carrito.obtener().find((i) => i.variante_id === v.id)?.cantidad || 0;
  const final = carrito.agregar({
    variante_id: v.id,
    producto_id: producto.id,
    slug: producto.slug,
    nombre: producto.nombre,
    color: c.nombre,
    color_slug: c.slug,
    color_hex: c.hex,
    talla: v.talla,
    precio: producto.precio,
    imagen: c.imagenes[0]?.url || producto.imagen,
    stock: v.stock,
  }, estado.cantidad);
  if (final === antes) {
    toast(`Ya tienes en el carrito todas las unidades disponibles de esta talla.`, 'error');
    return;
  }
  abrirCarrito();
}

const guia = document.getElementById('guia-tallas');
guia.querySelector('[data-cerrar-guia]').addEventListener('click', () => guia.close());
guia.addEventListener('click', (e) => { if (e.target === guia) guia.close(); });

// Carga inicial
if (!slug) {
  noEncontrado('No encontramos este producto');
} else {
  obtenerConfig().then((c) => { if (c?.envio) reglasEnvio = c.envio; });
  api(`/productos/${encodeURIComponent(slug)}`)
    .then(({ producto: p, relacionados }) => {
      producto = p;
      document.title = `${p.nombre} · Vaelia`;
      document.querySelector('meta[name="description"]').content = p.descripcion.slice(0, 155);
      const pedido = params.get('color');
      estado.color = p.colores.some((c) => c.slug === pedido) ? pedido : (p.colores.find((c) => c.stock > 0) || p.colores[0]).slug;
      pintarMigas();
      pintar();
      if (relacionados.length) {
        document.querySelector('[data-grilla-relacionados]').innerHTML = relacionados.map(tarjetaProducto).join('');
        document.querySelector('[data-relacionados]').hidden = false;
      }
    })
    .catch((err) => noEncontrado(err.status === 404 ? 'No encontramos este producto' : err.message));
}

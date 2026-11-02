/** Inicio de sesión (HU18) y registro opcional (HU17). */
import { api, esc, marcarErrores, rutaSegura, icono } from '../api.js';
import { iniciarPagina, obtenerSesion } from '../ui.js';
import * as carrito from '../carrito.js';

iniciarPagina({ cabecera: 'ninguna' });

const params = new URLSearchParams(location.search);
const volver = rutaSegura(params.get('volver'), '/mi-cuenta');

// Retorno desde Google: Supabase entrega el access_token en el hash de la URL
const tokenGoogle = new URLSearchParams(location.hash.slice(1)).get('access_token');
if (tokenGoogle) {
  history.replaceState(null, '', location.pathname + location.search);
  api('/auth/google', { metodo: 'POST', cuerpo: { access_token: tokenGoogle } })
    .then(() => location.replace(volver))
    .catch((err) => {
      const el = document.querySelector('#panel-ingresar [data-alerta]');
      el.className = 'alerta alerta--error';
      el.innerHTML = `${icono('alerta')}<span>${esc(err.message)}</span>`;
      el.hidden = false;
    });
}

// Botón de Google: solo aparece si el servidor tiene Supabase configurado
api('/auth/proveedores').then((p) => {
  if (!p.google) return;
  const boton = document.querySelector('[data-google]');
  boton.href = `${p.supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(`${location.origin}/cuenta`)}`;
  boton.hidden = false;
  document.querySelector('[data-google-sep]').hidden = false;
}).catch(() => {});
const tabs = { ingresar: document.getElementById('tab-ingresar'), crear: document.getElementById('tab-crear') };
const paneles = { ingresar: document.getElementById('panel-ingresar'), crear: document.getElementById('panel-crear') };

// Si ya hay sesión, no tiene sentido mostrar el formulario
obtenerSesion().then((u) => { if (u) location.replace(volver); });

// "Volver a la tienda" y "Compra como invitada" respetan de dónde venía
if (params.get('volver')) document.querySelector('[data-volver-tienda]').href = rutaSegura(params.get('volver'), '/');
document.querySelector('[data-invitada]').href = carrito.unidades() > 0 ? '/checkout' : '/coleccion';

function mostrar(cual, enfocar = true) {
  for (const k of Object.keys(tabs)) {
    const activo = k === cual;
    tabs[k].setAttribute('aria-selected', String(activo));
    tabs[k].tabIndex = activo ? 0 : -1;
    paneles[k].hidden = !activo;
  }
  document.title = `${cual === 'crear' ? 'Crear cuenta' : 'Iniciar sesión'} · Vaelia`;
  history.replaceState(null, '', `${location.pathname}${location.search}${cual === 'crear' ? '#crear' : ''}`);
  if (enfocar) paneles[cual].querySelector('input')?.focus();
}

tabs.ingresar.addEventListener('click', () => mostrar('ingresar'));
tabs.crear.addEventListener('click', () => mostrar('crear'));
document.querySelectorAll('[data-ir]').forEach((b) => b.addEventListener('click', () => { mostrar(b.dataset.ir); tabs[b.dataset.ir].focus(); }));
document.querySelector('[role="tablist"]').addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
  const sig = tabs.ingresar.getAttribute('aria-selected') === 'true' ? 'crear' : 'ingresar';
  mostrar(sig, false);
  tabs[sig].focus();
});
mostrar(location.hash === '#crear' ? 'crear' : 'ingresar', false);

// Botón "VER" de contraseña
document.querySelectorAll('[data-ver]').forEach((b) => b.addEventListener('click', () => {
  const input = document.getElementById(b.dataset.ver);
  const ver = input.type === 'password';
  input.type = ver ? 'text' : 'password';
  b.textContent = ver ? 'Ocultar' : 'Ver';
  b.setAttribute('aria-pressed', String(ver));
  b.setAttribute('aria-label', ver ? 'Ocultar contraseña' : 'Mostrar contraseña');
}));

function alerta(panel, mensaje, tipo = '') {
  const el = panel.querySelector('[data-alerta]');
  el.className = `alerta${tipo ? ' alerta--' + tipo : ''}`;
  el.innerHTML = mensaje ? `${icono(tipo === 'exito' ? 'check' : 'alerta')}<span>${esc(mensaje)}</span>` : '';
  el.hidden = !mensaje;
}

// ---- Iniciar sesión ----
const formLogin = document.querySelector('[data-form-login]');
formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = formLogin.email.value.trim();
  const password = formLogin.password.value;
  formLogin.querySelectorAll('[aria-invalid]').forEach((i) => i.removeAttribute('aria-invalid'));
  if (!email || !password) {
    alerta(paneles.ingresar, 'Ingresa tu correo y contraseña.');
    (email ? formLogin.password : formLogin.email).setAttribute('aria-invalid', 'true');
    (email ? formLogin.password : formLogin.email).focus();
    return;
  }
  const btn = formLogin.querySelector('[type="submit"]');
  btn.setAttribute('aria-busy', 'true');
  btn.disabled = true;
  try {
    await api('/auth/login', { metodo: 'POST', cuerpo: { email, password } });
    location.replace(volver);
  } catch (err) {
    alerta(paneles.ingresar, err.message);
    if (err.status === 401) {
      formLogin.password.value = '';
      formLogin.password.setAttribute('aria-invalid', 'true');
      formLogin.password.focus();
    }
  } finally {
    btn.removeAttribute('aria-busy');
    btn.disabled = false;
  }
});

// ---- Crear cuenta ----
const formReg = document.querySelector('[data-form-registro]');
const barra = document.querySelector('[data-fuerza]');
const textoFuerza = document.querySelector('[data-fuerza-texto]');
formReg.password.addEventListener('input', () => {
  const v = formReg.password.value;
  let puntos = 0;
  if (v.length >= 8) puntos++;
  if (/[a-zñ]/i.test(v) && /\d/.test(v)) puntos++;
  if (v.length >= 12) puntos++;
  if (/[^A-Za-z0-9ÑñÁÉÍÓÚáéíóú]/.test(v) || (/[a-z]/.test(v) && /[A-Z]/.test(v))) puntos++;
  const niveles = [['0%', ''], ['25%', '#9A2E2E', 'Muy débil'], ['50%', '#B49A6A', 'Aceptable'], ['75%', '#788875', 'Buena'], ['100%', '#243C32', 'Muy segura']];
  const [ancho, color, texto] = v ? niveles[Math.max(1, puntos)] : niveles[0];
  barra.style.width = ancho;
  barra.style.background = color;
  textoFuerza.textContent = texto ? `Seguridad: ${texto}` : '';
});

function validarRegistro(d) {
  const e = {};
  if (d.nombre.length < 2) e.nombre = 'Ingresa tu nombre.';
  if (d.apellido.length < 2) e.apellido = 'Ingresa tu apellido.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) e.email = 'Ingresa un correo válido.';
  if (d.password.length < 8 || !/[A-Za-zÑñ]/.test(d.password) || !/\d/.test(d.password)) e.password = 'Usa al menos 8 caracteres, con letras y números.';
  if (d.confirmar !== d.password) e.confirmar = 'Las contraseñas no coinciden.';
  return e;
}

formReg.addEventListener('submit', async (e) => {
  e.preventDefault();
  const d = {
    nombre: formReg.nombre.value.trim(),
    apellido: formReg.apellido.value.trim(),
    email: formReg.email.value.trim(),
    password: formReg.password.value,
    confirmar: formReg.confirmar.value,
  };
  const errores = validarRegistro(d);
  alerta(paneles.crear, '');
  if (marcarErrores(formReg, errores)) return;

  const btn = formReg.querySelector('[type="submit"]');
  btn.setAttribute('aria-busy', 'true');
  btn.disabled = true;
  try {
    await api('/auth/registro', { metodo: 'POST', cuerpo: d });
    location.replace(volver);
  } catch (err) {
    alerta(paneles.crear, err.message);
    if (err.campos) marcarErrores(formReg, err.campos);
  } finally {
    btn.removeAttribute('aria-busy');
    btn.disabled = false;
  }
});

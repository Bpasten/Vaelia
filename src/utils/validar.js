/**
 * Validaciones del lado del servidor. Las del navegador ayudan a la usuaria,
 * pero estas son las que realmente protegen la aplicación.
 */
const HttpError = require('./http-error');

const REGIONES = [
  'Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo', 'Valparaíso',
  'Metropolitana de Santiago', "Libertador General Bernardo O'Higgins", 'Maule', 'Ñuble',
  'Biobío', 'La Araucanía', 'Los Ríos', 'Los Lagos', 'Aysén del General Carlos Ibáñez del Campo',
  'Magallanes y de la Antártica Chilena',
];

const texto = (v) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : '');

const esEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) && v.length <= 120;

const limpiarTelefono = (v) => texto(v).replace(/[^\d+]/g, '');
const esTelefono = (v) => /^(\+?56)?9\d{8}$/.test(limpiarTelefono(v));

/** Valida RUT chileno con dígito verificador (módulo 11). */
function normalizarRut(v) {
  const limpio = texto(v).replace(/[.\-\s]/g, '').toUpperCase();
  if (!/^\d{7,8}[\dK]$/.test(limpio)) return null;
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  let suma = 0;
  let mult = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * mult;
    mult = mult === 7 ? 2 : mult + 1;
  }
  const esperado = 11 - (suma % 11);
  const dvCalc = esperado === 11 ? '0' : esperado === 10 ? 'K' : String(esperado);
  return dvCalc === dv ? `${cuerpo}-${dv}` : null;
}

const esPasswordSegura = (v) => typeof v === 'string' && v.length >= 8 && v.length <= 72 && /[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(v) && /\d/.test(v);

/** Lanza 422 con los errores por campo si hay alguno. */
function exigir(errores) {
  const campos = Object.keys(errores).filter((k) => errores[k]);
  if (campos.length) {
    const limpios = Object.fromEntries(campos.map((k) => [k, errores[k]]));
    throw new HttpError(422, 'Revisa los campos marcados.', limpios);
  }
}

/** Datos de contacto (checkout y perfil). */
function contacto(body, { telefonoObligatorio = true } = {}) {
  const datos = {
    nombre: texto(body.nombre),
    apellido: texto(body.apellido),
    email: texto(body.email).toLowerCase(),
    telefono: limpiarTelefono(body.telefono),
    rut: texto(body.rut),
  };
  const rutNormalizado = datos.rut ? normalizarRut(datos.rut) : null;
  exigir({
    nombre: datos.nombre.length < 2 || datos.nombre.length > 60 ? 'Ingresa tu nombre.' : null,
    apellido: datos.apellido.length < 2 || datos.apellido.length > 60 ? 'Ingresa tu apellido.' : null,
    email: !esEmail(datos.email) ? 'Ingresa un correo válido.' : null,
    telefono: (telefonoObligatorio || datos.telefono) && !esTelefono(datos.telefono) ? 'Ingresa un celular válido (9 dígitos).' : null,
    rut: datos.rut && !rutNormalizado ? 'El RUT no es válido.' : null,
  });
  datos.rut = rutNormalizado;
  if (datos.telefono && !datos.telefono.startsWith('+')) {
    datos.telefono = '+56' + datos.telefono.replace(/^56/, '');
  }
  return datos;
}

/** Dirección de despacho. */
function direccion(body) {
  const d = {
    region: texto(body.region),
    comuna: texto(body.comuna),
    calle: texto(body.calle),
    depto: texto(body.depto) || null,
    referencia: texto(body.referencia) || null,
  };
  exigir({
    region: !REGIONES.includes(d.region) ? 'Selecciona una región.' : null,
    comuna: d.comuna.length < 2 || d.comuna.length > 60 ? 'Ingresa la comuna.' : null,
    calle: d.calle.length < 4 || d.calle.length > 120 || !/\d/.test(d.calle) ? 'Ingresa calle y número.' : null,
    depto: d.depto && d.depto.length > 40 ? 'Máximo 40 caracteres.' : null,
    referencia: d.referencia && d.referencia.length > 160 ? 'Máximo 160 caracteres.' : null,
  });
  return d;
}

module.exports = {
  REGIONES, texto, esEmail, esTelefono, normalizarRut, esPasswordSegura, exigir, contacto, direccion,
};

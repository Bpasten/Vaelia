/**
 * Datos iniciales del catálogo de Vaelia.
 * Lo usan scripts/generar-seed.js (crea database/seed.sql).
 *
 * Cada producto es un look completo con su foto en public/img/fotos/.
 * Los datos marcados como "Por confirmar" se completan con la marca antes de publicar.
 */

const categorias = [
  { slug: 'blazers-y-abrigos', nombre: 'Blazers y abrigos' },
  { slug: 'blusas-y-camisas',  nombre: 'Blusas y camisas' },
  { slug: 'vestidos',          nombre: 'Vestidos' },
  { slug: 'pantalones',        nombre: 'Pantalones' },
  { slug: 'faldas',            nombre: 'Faldas' },
  { slug: 'tejidos',           nombre: 'Tejidos' },
];

// Paleta oficial de la marca + colores de las nuevas piezas (hex aproximados)
const colores = [
  { slug: 'verde-bosque', nombre: 'Verde bosque', hex: '#243C32' },
  { slug: 'negro',        nombre: 'Negro',        hex: '#1F1F1D' },
  { slug: 'cafe-corteza', nombre: 'Café corteza', hex: '#604A3A' },
  { slug: 'verde-salvia', nombre: 'Verde salvia', hex: '#788875' },
  { slug: 'taupe',        nombre: 'Taupe',        hex: '#9A8978' },
  { slug: 'beige-lino',   nombre: 'Beige lino',   hex: '#E5D8C5' },
  { slug: 'marfil',       nombre: 'Marfil',       hex: '#F6F1E8' },
  { slug: 'marino',       nombre: 'Azul marino',  hex: '#1E2A44' },
  { slug: 'azul',         nombre: 'Azul',         hex: '#4A6E94' },
  { slug: 'rosa',         nombre: 'Rosa',         hex: '#E9B8BF' },
  { slug: 'burdeos',      nombre: 'Burdeos',      hex: '#6B1E2E' },
];

const TALLAS = ['S', 'M', 'L', 'XL', 'XXL'];

const POR_CONFIRMAR = 'Por confirmar';

const productos = [
  {
    slug: 'falda-floral-marino', nombre: 'Falda Floral Marino', tipo: 'falda',
    categoria: 'faldas', precio: 27990, ocasion: 'reunion', destacado: 1,
    colores: ['marino'], imagen: 'falda-floral-marino',
    descripcion: 'Falda de estampado floral sobre fondo azul marino. Combina con blusas lisas para un look femenino para el día o una reunión.',
    materiales: POR_CONFIRMAR,
    cuidados: POR_CONFIRMAR,
  },
  {
    slug: 'vestido-floral-azul', nombre: 'Vestido Floral Azul', tipo: 'vestido',
    categoria: 'vestidos', precio: 36990, ocasion: 'evento', destacado: 1,
    colores: ['azul'], imagen: 'vestido-floral-azul',
    descripcion: 'Vestido de estampado floral en tonos azules. Una pieza luminosa para celebraciones y eventos de día o de tarde.',
    materiales: POR_CONFIRMAR,
    cuidados: POR_CONFIRMAR,
  },
  {
    slug: 'blusa-rosa-pantalon-negro', nombre: 'Blusa Rosa y Pantalón Negro', tipo: 'conjunto',
    categoria: 'blusas-y-camisas', precio: 34990, ocasion: 'oficina', destacado: 1,
    colores: ['rosa'], imagen: 'blusa-rosa-pantalon-negro',
    descripcion: 'Look de blusa rosa con pantalón negro. Una combinación de contrastes pensada para la oficina y para salir después del trabajo.',
    materiales: POR_CONFIRMAR,
    cuidados: POR_CONFIRMAR,
  },
  {
    slug: 'conjunto-floral-burdeos', nombre: 'Conjunto Floral Burdeos', tipo: 'conjunto',
    categoria: 'blusas-y-camisas', precio: 38990, ocasion: 'reunion', destacado: 0,
    colores: ['burdeos'], imagen: 'blusa-floral-burdeos-falda-burdeos',
    descripcion: 'Conjunto de blusa y falda en burdeos con estampado floral. Dos piezas que se combinan entre sí para una tenida de reunión completa.',
    materiales: POR_CONFIRMAR,
    cuidados: POR_CONFIRMAR,
  },
  {
    slug: 'conjunto-blazer-pantalon-salvia', nombre: 'Conjunto Blazer y Pantalón Salvia', tipo: 'conjunto',
    categoria: 'blazers-y-abrigos', precio: 39990, ocasion: 'oficina', destacado: 1,
    colores: ['verde-salvia'], imagen: 'conjunto-blazer-pantalon-salvia',
    descripcion: 'Conjunto de blazer y pantalón en verde salvia. Un set de oficina que también se puede usar por separado.',
    materiales: POR_CONFIRMAR,
    cuidados: POR_CONFIRMAR,
  },
];

module.exports = { categorias, colores, productos, TALLAS };

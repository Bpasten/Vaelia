/**
 * Datos iniciales del catálogo de Vaelia.
 * Lo usan scripts/generar-seed.js (crea database/seed.sql)
 * y scripts/generar-imagenes.js (crea las ilustraciones de producto).
 */

const categorias = [
  { slug: 'blazers-y-abrigos', nombre: 'Blazers y abrigos' },
  { slug: 'blusas-y-camisas',  nombre: 'Blusas y camisas' },
  { slug: 'vestidos',          nombre: 'Vestidos' },
  { slug: 'pantalones',        nombre: 'Pantalones' },
  { slug: 'faldas',            nombre: 'Faldas' },
  { slug: 'tejidos',           nombre: 'Tejidos' },
];

// Paleta oficial de la marca
const colores = [
  { slug: 'verde-bosque', nombre: 'Verde bosque', hex: '#243C32' },
  { slug: 'negro',        nombre: 'Negro',        hex: '#1F1F1D' },
  { slug: 'cafe-corteza', nombre: 'Café corteza', hex: '#604A3A' },
  { slug: 'verde-salvia', nombre: 'Verde salvia', hex: '#788875' },
  { slug: 'taupe',        nombre: 'Taupe',        hex: '#9A8978' },
  { slug: 'beige-lino',   nombre: 'Beige lino',   hex: '#E5D8C5' },
  { slug: 'marfil',       nombre: 'Marfil',       hex: '#F6F1E8' },
];

const TALLAS = ['XS', 'S', 'M', 'L', 'XL'];

const productos = [
  {
    slug: 'blazer-esencial', nombre: 'Blazer Esencial', tipo: 'blazer',
    categoria: 'blazers-y-abrigos', precio: 69990, ocasion: 'oficina', destacado: 1,
    colores: ['verde-bosque', 'negro', 'cafe-corteza'],
    descripcion: 'Un clásico atemporal. Confeccionado en una mezcla de lino y viscosa, su diseño estructurado realza la figura y se adapta a múltiples ocasiones: de la oficina a una cena sin cambiarte.',
    materiales: '55% lino, 45% viscosa. Forro 100% viscosa.',
    cuidados: 'Lavado en seco o a mano en agua fría. Planchar a temperatura media por el revés.',
  },
  {
    slug: 'blusa-serena', nombre: 'Blusa Serena', tipo: 'blusa',
    categoria: 'blusas-y-camisas', precio: 39990, ocasion: 'reunion', destacado: 1,
    colores: ['marfil', 'beige-lino', 'verde-salvia'],
    descripcion: 'Blusa fluida de cuello en V con botones forrados. Cae suave sobre el cuerpo y se lleva igual de bien por dentro de un pantalón de tiro alto que suelta sobre una falda.',
    materiales: '100% viscosa de origen certificado.',
    cuidados: 'Lavar a mano en agua fría. Secar a la sombra. Planchar a baja temperatura.',
  },
  {
    slug: 'vestido-alma', nombre: 'Vestido Alma', tipo: 'vestido',
    categoria: 'vestidos', precio: 59990, ocasion: 'evento', destacado: 1,
    colores: ['verde-bosque', 'negro', 'cafe-corteza'],
    descripcion: 'Vestido midi de escote en V con cintura marcada y falda con caída. Pensado para eventos, ceremonias y esas noches en que quieres sentirte tú misma.',
    materiales: '95% poliéster reciclado, 5% elastano.',
    cuidados: 'Lavar a máquina en ciclo delicado, agua fría. No usar secadora.',
  },
  {
    slug: 'pantalon-lino', nombre: 'Pantalón Lino', tipo: 'pantalon',
    categoria: 'pantalones', precio: 49990, ocasion: 'oficina', destacado: 1,
    colores: ['beige-lino', 'marfil', 'cafe-corteza'],
    descripcion: 'Pantalón de pierna ancha y tiro alto con pinzas delanteras. Fresco, liviano y elegante: el básico que resuelve la semana completa.',
    materiales: '100% lino europeo.',
    cuidados: 'Lavar a máquina en agua fría. Planchar húmedo a temperatura media.',
  },
  {
    slug: 'falda-midi', nombre: 'Falda Midi', tipo: 'falda',
    categoria: 'faldas', precio: 44990, ocasion: 'reunion', destacado: 0,
    colores: ['negro', 'verde-bosque', 'cafe-corteza'],
    descripcion: 'Falda midi de corte A con pretina ancha y cierre invisible. Se mueve contigo y combina con todo, desde una blusa hasta un tejido grueso.',
    materiales: '70% viscosa, 30% lino.',
    cuidados: 'Lavar a mano o en ciclo delicado. Secar en percha.',
  },
  {
    slug: 'abrigo-clasico', nombre: 'Abrigo Clásico', tipo: 'abrigo',
    categoria: 'blazers-y-abrigos', precio: 79990, ocasion: 'oficina', destacado: 0,
    colores: ['negro', 'cafe-corteza', 'taupe'],
    descripcion: 'Abrigo largo cruzado con solapas amplias y botones en tono madera. Abriga sin pesar y eleva cualquier tenida de invierno.',
    materiales: '60% lana, 40% poliéster reciclado.',
    cuidados: 'Solo lavado en seco. Guardar en percha ancha.',
  },
  {
    slug: 'camisa-bruma', nombre: 'Camisa Bruma', tipo: 'camisa',
    categoria: 'blusas-y-camisas', precio: 36990, ocasion: 'oficina', destacado: 0,
    colores: ['marfil', 'verde-salvia'],
    descripcion: 'Camisa de popelina con cuello clásico y puños con botón. Su corte levemente holgado la hace ideal para usar sola o bajo un blazer.',
    materiales: '100% algodón orgánico.',
    cuidados: 'Lavar a máquina a 30 °C. Planchar a temperatura media.',
  },
  {
    slug: 'top-raiz', nombre: 'Top Raíz', tipo: 'top',
    categoria: 'blusas-y-camisas', precio: 27990, ocasion: 'evento', destacado: 0,
    colores: ['marfil', 'verde-bosque', 'negro'],
    descripcion: 'Top de tiras finas con escote drapeado y brillo satinado. Se lleva solo para una noche o bajo un blazer para el día.',
    materiales: '100% viscosa satinada.',
    cuidados: 'Lavar a mano en agua fría. Planchar por el revés a baja temperatura.',
  },
  {
    slug: 'pantalon-recto-bosque', nombre: 'Pantalón Recto Bosque', tipo: 'pantalon',
    categoria: 'pantalones', precio: 52990, ocasion: 'oficina', destacado: 0,
    colores: ['verde-bosque', 'negro'],
    descripcion: 'Pantalón de sastrería de pierna recta con pliegue marcado. Estructura de oficina con la comodidad de un tejido con leve elasticidad.',
    materiales: '64% poliéster reciclado, 33% viscosa, 3% elastano.',
    cuidados: 'Lavar a máquina en ciclo delicado. Planchar a temperatura media.',
  },
  {
    slug: 'vestido-musgo', nombre: 'Vestido Musgo', tipo: 'vestido',
    categoria: 'vestidos', precio: 64990, ocasion: 'evento', destacado: 0,
    colores: ['verde-salvia', 'taupe'],
    descripcion: 'Vestido largo cruzado de tela fluida, con lazo a la cintura. Suave, ligero y con la caída justa para celebrar al aire libre.',
    materiales: '100% lyocell.',
    cuidados: 'Lavar a mano en agua fría. Secar extendido a la sombra.',
  },
  {
    slug: 'cardigan-corteza', nombre: 'Cárdigan Corteza', tipo: 'cardigan',
    categoria: 'tejidos', precio: 54990, ocasion: 'reunion', destacado: 0,
    colores: ['cafe-corteza', 'beige-lino', 'verde-salvia'],
    descripcion: 'Cárdigan de punto grueso con escote en V y botones de madera. Abrigado y suave, para las mañanas frías y las tardes de reunión.',
    materiales: '50% lana merino, 50% algodón.',
    cuidados: 'Lavar a mano en agua fría. Secar en horizontal.',
  },
  {
    slug: 'falda-plisada-salvia', nombre: 'Falda Plisada', tipo: 'falda',
    categoria: 'faldas', precio: 42990, ocasion: 'evento', destacado: 0,
    colores: ['verde-salvia', 'beige-lino'],
    descripcion: 'Falda midi plisada con pretina elástica oculta. Ligera y con movimiento, ilumina cualquier look de evento.',
    materiales: '100% poliéster reciclado.',
    cuidados: 'Lavar a mano. No planchar los pliegues directamente.',
  },
  {
    slug: 'trench-lino', nombre: 'Trench Lino', tipo: 'abrigo',
    categoria: 'blazers-y-abrigos', precio: 89990, ocasion: 'oficina', destacado: 0,
    colores: ['beige-lino', 'taupe'],
    descripcion: 'Gabardina cruzada de entretiempo con cinturón y botones a tono. La pieza que acompaña de la primavera al otoño.',
    materiales: '55% lino, 45% algodón.',
    cuidados: 'Lavado en seco recomendado. Planchar a temperatura media.',
  },
];

module.exports = { categorias, colores, productos, TALLAS };

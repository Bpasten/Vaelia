-- =====================================================================
-- VAELIA · Carga completa del catálogo (TiDB Cloud)
-- Crea las tablas del catálogo si no existen y carga los 5 looks nuevos.
-- No borra pedidos, usuarios ni pagos. Ejecutar UNA vez.
-- =====================================================================

-- 1) Tablas del catálogo
CREATE TABLE IF NOT EXISTS categorias (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(60)  NOT NULL,
  slug            VARCHAR(60)  NOT NULL,
  orden           SMALLINT     NOT NULL DEFAULT 0,
  UNIQUE KEY uq_categorias_slug (slug)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS colores (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(40)  NOT NULL,
  slug            VARCHAR(40)  NOT NULL,
  hex             CHAR(7)      NOT NULL,
  UNIQUE KEY uq_colores_slug (slug)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS productos (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  categoria_id    INT UNSIGNED NOT NULL,
  nombre          VARCHAR(80)  NOT NULL,
  slug            VARCHAR(90)  NOT NULL,
  descripcion     TEXT         NOT NULL,
  materiales      VARCHAR(255) NOT NULL,
  cuidados        VARCHAR(255) NOT NULL,
  precio          INT UNSIGNED NOT NULL,            -- CLP, sin decimales
  ocasion         ENUM('oficina','reunion','evento') NOT NULL,
  destacado       TINYINT(1)   NOT NULL DEFAULT 0,
  activo          TINYINT(1)   NOT NULL DEFAULT 1,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_productos_slug (slug),
  KEY idx_productos_categoria (categoria_id),
  KEY idx_productos_activo (activo, destacado),
  CONSTRAINT fk_productos_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS producto_imagenes (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  producto_id     INT UNSIGNED NOT NULL,
  color_id        INT UNSIGNED NULL,                -- imagen específica de un color
  url             VARCHAR(255) NOT NULL,
  alt             VARCHAR(160) NOT NULL,
  orden           SMALLINT     NOT NULL DEFAULT 0,
  CONSTRAINT fk_imagenes_producto FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
  CONSTRAINT fk_imagenes_color FOREIGN KEY (color_id) REFERENCES colores(id),
  KEY idx_imagenes_producto (producto_id, color_id, orden)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS variantes (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  producto_id     INT UNSIGNED NOT NULL,
  color_id        INT UNSIGNED NOT NULL,
  talla           ENUM('S','M','L','XL','XXL') NOT NULL,
  sku             VARCHAR(40)  NOT NULL,
  stock           INT UNSIGNED NOT NULL DEFAULT 0,
  UNIQUE KEY uq_variantes_sku (sku),
  UNIQUE KEY uq_variantes_combo (producto_id, color_id, talla),
  CONSTRAINT fk_variantes_producto FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
  CONSTRAINT fk_variantes_color FOREIGN KEY (color_id) REFERENCES colores(id)
) ENGINE=InnoDB;

-- 2) Categorías
INSERT IGNORE INTO categorias (nombre, slug, orden) VALUES
('Blazers y abrigos', 'blazers-y-abrigos', 1),
('Blusas y camisas', 'blusas-y-camisas', 2),
('Vestidos', 'vestidos', 3),
('Pantalones', 'pantalones', 4),
('Faldas', 'faldas', 5),
('Tejidos', 'tejidos', 6);

-- 3) Colores (paleta de marca + colores de las piezas nuevas)
INSERT IGNORE INTO colores (nombre, slug, hex) VALUES
('Verde bosque', 'verde-bosque', '#243C32'),
('Negro', 'negro', '#1F1F1D'),
('Café corteza', 'cafe-corteza', '#604A3A'),
('Verde salvia', 'verde-salvia', '#788875'),
('Taupe', 'taupe', '#9A8978'),
('Beige lino', 'beige-lino', '#E5D8C5'),
('Marfil', 'marfil', '#F6F1E8'),
('Azul marino', 'marino', '#1E2A44'),
('Azul', 'azul', '#4A6E94'),
('Rosa', 'rosa', '#E9B8BF'),
('Burdeos', 'burdeos', '#6B1E2E');

-- 4) Ocultar cualquier producto que no sea de la nueva colección
UPDATE productos SET activo = 0 WHERE slug NOT IN ('falda-floral-marino', 'vestido-floral-azul', 'blusa-rosa-pantalon-negro', 'conjunto-floral-burdeos', 'conjunto-blazer-pantalon-salvia');

-- 5) Productos, imágenes y variantes (stock por talla)
INSERT IGNORE INTO productos (categoria_id, nombre, slug, descripcion, materiales, cuidados, precio, ocasion, destacado, activo) SELECT c.id, 'Falda Floral Marino', 'falda-floral-marino', 'Falda de estampado floral sobre fondo azul marino. Combina con blusas lisas para un look femenino para el día o una reunión.', 'Por confirmar', 'Por confirmar', 27990, 'reunion', 1, 1 FROM categorias c WHERE c.slug = 'faldas';
INSERT INTO producto_imagenes (producto_id, color_id, url, alt, orden) SELECT p.id, co.id, '/img/fotos/falda-floral-marino.webp', 'Falda Floral Marino en azul marino', 0 FROM productos p, colores co WHERE p.slug = 'falda-floral-marino' AND co.slug = 'marino' AND NOT EXISTS (SELECT 1 FROM producto_imagenes x WHERE x.producto_id = p.id AND x.color_id = co.id AND x.orden = 0);
INSERT INTO producto_imagenes (producto_id, color_id, url, alt, orden) SELECT p.id, co.id, '/img/fotos/falda-floral-marino-512.webp', 'Vista reducida de Falda Floral Marino', 1 FROM productos p, colores co WHERE p.slug = 'falda-floral-marino' AND co.slug = 'marino' AND NOT EXISTS (SELECT 1 FROM producto_imagenes x WHERE x.producto_id = p.id AND x.color_id = co.id AND x.orden = 1);
INSERT IGNORE INTO variantes (producto_id, color_id, talla, sku, stock) SELECT p.id, co.id, 'S', 'VAE-L01-M-S', 5 FROM productos p, colores co WHERE p.slug = 'falda-floral-marino' AND co.slug = 'marino';
INSERT IGNORE INTO variantes (producto_id, color_id, talla, sku, stock) SELECT p.id, co.id, 'M', 'VAE-L01-M-M', 8 FROM productos p, colores co WHERE p.slug = 'falda-floral-marino' AND co.slug = 'marino';
INSERT IGNORE INTO variantes (producto_id, color_id, talla, sku, stock) SELECT p.id, co.id, 'L', 'VAE-L01-M-L', 2 FROM productos p, colores co WHERE p.slug = 'falda-floral-marino' AND co.slug = 'marino';
INSERT IGNORE INTO variantes (producto_id, color_id, talla, sku, stock) SELECT p.id, co.id, 'XL', 'VAE-L01-M-XL', 3 FROM productos p, colores co WHERE p.slug = 'falda-floral-marino' AND co.slug = 'marino';
INSERT IGNORE INTO variantes (producto_id, color_id, talla, sku, stock) SELECT p.id, co.id, 'XXL', 'VAE-L01-M-XXL', 3 FROM productos p, colores co WHERE p.slug = 'falda-floral-marino' AND co.slug = 'marino';
INSERT IGNORE INTO productos (categoria_id, nombre, slug, descripcion, materiales, cuidados, precio, ocasion, destacado, activo) SELECT c.id, 'Vestido Floral Azul', 'vestido-floral-azul', 'Vestido de estampado floral en tonos azules. Una pieza luminosa para celebraciones y eventos de día o de tarde.', 'Por confirmar', 'Por confirmar', 36990, 'evento', 1, 1 FROM categorias c WHERE c.slug = 'vestidos';
INSERT INTO producto_imagenes (producto_id, color_id, url, alt, orden) SELECT p.id, co.id, '/img/fotos/vestido-floral-azul.webp', 'Vestido Floral Azul en azul', 0 FROM productos p, colores co WHERE p.slug = 'vestido-floral-azul' AND co.slug = 'azul' AND NOT EXISTS (SELECT 1 FROM producto_imagenes x WHERE x.producto_id = p.id AND x.color_id = co.id AND x.orden = 0);
INSERT INTO producto_imagenes (producto_id, color_id, url, alt, orden) SELECT p.id, co.id, '/img/fotos/vestido-floral-azul-512.webp', 'Vista reducida de Vestido Floral Azul', 1 FROM productos p, colores co WHERE p.slug = 'vestido-floral-azul' AND co.slug = 'azul' AND NOT EXISTS (SELECT 1 FROM producto_imagenes x WHERE x.producto_id = p.id AND x.color_id = co.id AND x.orden = 1);
INSERT IGNORE INTO variantes (producto_id, color_id, talla, sku, stock) SELECT p.id, co.id, 'S', 'VAE-L02-A-S', 5 FROM productos p, colores co WHERE p.slug = 'vestido-floral-azul' AND co.slug = 'azul';
INSERT IGNORE INTO variantes (producto_id, color_id, talla, sku, stock) SELECT p.id, co.id, 'M', 'VAE-L02-A-M', 10 FROM productos p, colores co WHERE p.slug = 'vestido-floral-azul' AND co.slug = 'azul';
INSERT IGNORE INTO variantes (producto_id, color_id, talla, sku, stock) SELECT p.id, co.id, 'L', 'VAE-L02-A-L', 2 FROM productos p, colores co WHERE p.slug = 'vestido-floral-azul' AND co.slug = 'azul';
INSERT IGNORE INTO variantes (producto_id, color_id, talla, sku, stock) SELECT p.id, co.id, 'XL', 'VAE-L02-A-XL', 3 FROM productos p, colores co WHERE p.slug = 'vestido-floral-azul' AND co.slug = 'azul';
INSERT IGNORE INTO variantes (producto_id, color_id, talla, sku, stock) SELECT p.id, co.id, 'XXL', 'VAE-L02-A-XXL', 3 FROM productos p, colores co WHERE p.slug = 'vestido-floral-azul' AND co.slug = 'azul';
INSERT IGNORE INTO productos (categoria_id, nombre, slug, descripcion, materiales, cuidados, precio, ocasion, destacado, activo) SELECT c.id, 'Blusa Rosa y Pantalón Negro', 'blusa-rosa-pantalon-negro', 'Look de blusa rosa con pantalón negro. Una combinación de contrastes pensada para la oficina y para salir después del trabajo.', 'Por confirmar', 'Por confirmar', 34990, 'oficina', 1, 1 FROM categorias c WHERE c.slug = 'blusas-y-camisas';
INSERT INTO producto_imagenes (producto_id, color_id, url, alt, orden) SELECT p.id, co.id, '/img/fotos/blusa-rosa-pantalon-negro.webp', 'Blusa Rosa y Pantalón Negro en rosa', 0 FROM productos p, colores co WHERE p.slug = 'blusa-rosa-pantalon-negro' AND co.slug = 'rosa' AND NOT EXISTS (SELECT 1 FROM producto_imagenes x WHERE x.producto_id = p.id AND x.color_id = co.id AND x.orden = 0);
INSERT INTO producto_imagenes (producto_id, color_id, url, alt, orden) SELECT p.id, co.id, '/img/fotos/blusa-rosa-pantalon-negro-512.webp', 'Vista reducida de Blusa Rosa y Pantalón Negro', 1 FROM productos p, colores co WHERE p.slug = 'blusa-rosa-pantalon-negro' AND co.slug = 'rosa' AND NOT EXISTS (SELECT 1 FROM producto_imagenes x WHERE x.producto_id = p.id AND x.color_id = co.id AND x.orden = 1);
INSERT IGNORE INTO variantes (producto_id, color_id, talla, sku, stock) SELECT p.id, co.id, 'S', 'VAE-L03-R-S', 8 FROM productos p, colores co WHERE p.slug = 'blusa-rosa-pantalon-negro' AND co.slug = 'rosa';
INSERT IGNORE INTO variantes (producto_id, color_id, talla, sku, stock) SELECT p.id, co.id, 'M', 'VAE-L03-R-M', 10 FROM productos p, colores co WHERE p.slug = 'blusa-rosa-pantalon-negro' AND co.slug = 'rosa';
INSERT IGNORE INTO variantes (producto_id, color_id, talla, sku, stock) SELECT p.id, co.id, 'L', 'VAE-L03-R-L', 4 FROM productos p, colores co WHERE p.slug = 'blusa-rosa-pantalon-negro' AND co.slug = 'rosa';
INSERT IGNORE INTO variantes (producto_id, color_id, talla, sku, stock) SELECT p.id, co.id, 'XL', 'VAE-L03-R-XL', 2 FROM productos p, colores co WHERE p.slug = 'blusa-rosa-pantalon-negro' AND co.slug = 'rosa';
INSERT IGNORE INTO variantes (producto_id, color_id, talla, sku, stock) SELECT p.id, co.id, 'XXL', 'VAE-L03-R-XXL', 4 FROM productos p, colores co WHERE p.slug = 'blusa-rosa-pantalon-negro' AND co.slug = 'rosa';
INSERT IGNORE INTO productos (categoria_id, nombre, slug, descripcion, materiales, cuidados, precio, ocasion, destacado, activo) SELECT c.id, 'Conjunto Floral Burdeos', 'conjunto-floral-burdeos', 'Conjunto de blusa y falda en burdeos con estampado floral. Dos piezas que se combinan entre sí para una tenida de reunión completa.', 'Por confirmar', 'Por confirmar', 38990, 'reunion', 0, 1 FROM categorias c WHERE c.slug = 'blusas-y-camisas';
INSERT INTO producto_imagenes (producto_id, color_id, url, alt, orden) SELECT p.id, co.id, '/img/fotos/blusa-floral-burdeos-falda-burdeos.webp', 'Conjunto Floral Burdeos en burdeos', 0 FROM productos p, colores co WHERE p.slug = 'conjunto-floral-burdeos' AND co.slug = 'burdeos' AND NOT EXISTS (SELECT 1 FROM producto_imagenes x WHERE x.producto_id = p.id AND x.color_id = co.id AND x.orden = 0);
INSERT INTO producto_imagenes (producto_id, color_id, url, alt, orden) SELECT p.id, co.id, '/img/fotos/blusa-floral-burdeos-falda-burdeos-512.webp', 'Vista reducida de Conjunto Floral Burdeos', 1 FROM productos p, colores co WHERE p.slug = 'conjunto-floral-burdeos' AND co.slug = 'burdeos' AND NOT EXISTS (SELECT 1 FROM producto_imagenes x WHERE x.producto_id = p.id AND x.color_id = co.id AND x.orden = 1);
INSERT IGNORE INTO variantes (producto_id, color_id, talla, sku, stock) SELECT p.id, co.id, 'S', 'VAE-L04-B-S', 6 FROM productos p, colores co WHERE p.slug = 'conjunto-floral-burdeos' AND co.slug = 'burdeos';
INSERT IGNORE INTO variantes (producto_id, color_id, talla, sku, stock) SELECT p.id, co.id, 'M', 'VAE-L04-B-M', 4 FROM productos p, colores co WHERE p.slug = 'conjunto-floral-burdeos' AND co.slug = 'burdeos';
INSERT IGNORE INTO variantes (producto_id, color_id, talla, sku, stock) SELECT p.id, co.id, 'L', 'VAE-L04-B-L', 4 FROM productos p, colores co WHERE p.slug = 'conjunto-floral-burdeos' AND co.slug = 'burdeos';
INSERT IGNORE INTO variantes (producto_id, color_id, talla, sku, stock) SELECT p.id, co.id, 'XL', 'VAE-L04-B-XL', 0 FROM productos p, colores co WHERE p.slug = 'conjunto-floral-burdeos' AND co.slug = 'burdeos';
INSERT IGNORE INTO variantes (producto_id, color_id, talla, sku, stock) SELECT p.id, co.id, 'XXL', 'VAE-L04-B-XXL', 2 FROM productos p, colores co WHERE p.slug = 'conjunto-floral-burdeos' AND co.slug = 'burdeos';
INSERT IGNORE INTO productos (categoria_id, nombre, slug, descripcion, materiales, cuidados, precio, ocasion, destacado, activo) SELECT c.id, 'Conjunto Blazer y Pantalón Salvia', 'conjunto-blazer-pantalon-salvia', 'Conjunto de blazer y pantalón en verde salvia. Un set de oficina que también se puede usar por separado.', 'Por confirmar', 'Por confirmar', 39990, 'oficina', 1, 1 FROM categorias c WHERE c.slug = 'blazers-y-abrigos';
INSERT INTO producto_imagenes (producto_id, color_id, url, alt, orden) SELECT p.id, co.id, '/img/fotos/conjunto-blazer-pantalon-salvia.webp', 'Conjunto Blazer y Pantalón Salvia en verde salvia', 0 FROM productos p, colores co WHERE p.slug = 'conjunto-blazer-pantalon-salvia' AND co.slug = 'verde-salvia' AND NOT EXISTS (SELECT 1 FROM producto_imagenes x WHERE x.producto_id = p.id AND x.color_id = co.id AND x.orden = 0);
INSERT INTO producto_imagenes (producto_id, color_id, url, alt, orden) SELECT p.id, co.id, '/img/fotos/conjunto-blazer-pantalon-salvia-512.webp', 'Vista reducida de Conjunto Blazer y Pantalón Salvia', 1 FROM productos p, colores co WHERE p.slug = 'conjunto-blazer-pantalon-salvia' AND co.slug = 'verde-salvia' AND NOT EXISTS (SELECT 1 FROM producto_imagenes x WHERE x.producto_id = p.id AND x.color_id = co.id AND x.orden = 1);
INSERT IGNORE INTO variantes (producto_id, color_id, talla, sku, stock) SELECT p.id, co.id, 'S', 'VAE-L05-VS-S', 3 FROM productos p, colores co WHERE p.slug = 'conjunto-blazer-pantalon-salvia' AND co.slug = 'verde-salvia';
INSERT IGNORE INTO variantes (producto_id, color_id, talla, sku, stock) SELECT p.id, co.id, 'M', 'VAE-L05-VS-M', 10 FROM productos p, colores co WHERE p.slug = 'conjunto-blazer-pantalon-salvia' AND co.slug = 'verde-salvia';
INSERT IGNORE INTO variantes (producto_id, color_id, talla, sku, stock) SELECT p.id, co.id, 'L', 'VAE-L05-VS-L', 4 FROM productos p, colores co WHERE p.slug = 'conjunto-blazer-pantalon-salvia' AND co.slug = 'verde-salvia';
INSERT IGNORE INTO variantes (producto_id, color_id, talla, sku, stock) SELECT p.id, co.id, 'XL', 'VAE-L05-VS-XL', 2 FROM productos p, colores co WHERE p.slug = 'conjunto-blazer-pantalon-salvia' AND co.slug = 'verde-salvia';
INSERT IGNORE INTO variantes (producto_id, color_id, talla, sku, stock) SELECT p.id, co.id, 'XXL', 'VAE-L05-VS-XXL', 1 FROM productos p, colores co WHERE p.slug = 'conjunto-blazer-pantalon-salvia' AND co.slug = 'verde-salvia';

-- 6) Verificación: deben aparecer 6 categorías, 11 colores, 5 productos activos y 25 variantes por producto/color
SELECT (SELECT COUNT(*) FROM categorias) AS categorias, (SELECT COUNT(*) FROM colores) AS colores, (SELECT COUNT(*) FROM productos WHERE activo = 1) AS productos_activos, (SELECT COUNT(*) FROM variantes) AS variantes;

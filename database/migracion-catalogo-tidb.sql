-- =====================================================================
-- VAELIA · Actualización del catálogo para TiDB Cloud
-- Ejecutar UNA sola vez en la base seleccionada (branch vaelia_ensayo o producción).
-- No borra pedidos, usuarios ni pagos.
-- =====================================================================

-- 1) Agregar la talla XXL (se conserva XS para no romper datos antiguos)
ALTER TABLE variantes MODIFY talla ENUM('XS','S','M','L','XL','XXL') NOT NULL;

-- 2) Ocultar los 13 productos de demostración
UPDATE productos SET activo = 0 WHERE activo = 1;

-- 3) Colores nuevos
INSERT IGNORE INTO colores (nombre, slug, hex) VALUES
('Azul marino', 'marino', '#1E2A44'),
('Azul', 'azul', '#4A6E94'),
('Rosa', 'rosa', '#E9B8BF'),
('Burdeos', 'burdeos', '#6B1E2E');

-- 4) Productos nuevos, imágenes y variantes (stock por talla)
INSERT INTO productos (categoria_id, nombre, slug, descripcion, materiales, cuidados, precio, ocasion, destacado, activo) SELECT c.id, 'Falda Floral Marino', 'falda-floral-marino', 'Falda de estampado floral sobre fondo azul marino. Combina con blusas lisas para un look femenino para el día o una reunión.', 'Por confirmar', 'Por confirmar', 27990, 'reunion', 1, 1 FROM categorias c WHERE c.slug = 'faldas';
INSERT INTO producto_imagenes (producto_id, color_id, url, alt, orden) SELECT p.id, co.id, '/img/fotos/falda-floral-marino.webp', 'Falda Floral Marino en azul marino', 0 FROM productos p, colores co WHERE p.slug = 'falda-floral-marino' AND co.slug = 'marino';
INSERT INTO producto_imagenes (producto_id, color_id, url, alt, orden) SELECT p.id, co.id, '/img/fotos/falda-floral-marino-512.webp', 'Vista reducida de Falda Floral Marino', 1 FROM productos p, colores co WHERE p.slug = 'falda-floral-marino' AND co.slug = 'marino';
INSERT INTO variantes (producto_id, color_id, talla, sku, stock) SELECT p.id, co.id, 'S', 'VAE-L01-M-S', 5 FROM productos p, colores co WHERE p.slug = 'falda-floral-marino' AND co.slug = 'marino';
INSERT INTO variantes (producto_id, color_id, talla, sku, stock) SELECT p.id, co.id, 'M', 'VAE-L01-M-M', 8 FROM productos p, colores co WHERE p.slug = 'falda-floral-marino' AND co.slug = 'marino';
INSERT INTO variantes (producto_id, color_id, talla, sku, stock) SELECT p.id, co.id, 'L', 'VAE-L01-M-L', 2 FROM productos p, colores co WHERE p.slug = 'falda-floral-marino' AND co.slug = 'marino';
INSERT INTO variantes (producto_id, color_id, talla, sku, stock) SELECT p.id, co.id, 'XL', 'VAE-L01-M-XL', 3 FROM productos p, colores co WHERE p.slug = 'falda-floral-marino' AND co.slug = 'marino';
INSERT INTO variantes (producto_id, color_id, talla, sku, stock) SELECT p.id, co.id, 'XXL', 'VAE-L01-M-XXL', 3 FROM productos p, colores co WHERE p.slug = 'falda-floral-marino' AND co.slug = 'marino';

INSERT INTO productos (categoria_id, nombre, slug, descripcion, materiales, cuidados, precio, ocasion, destacado, activo) SELECT c.id, 'Vestido Floral Azul', 'vestido-floral-azul', 'Vestido de estampado floral en tonos azules. Una pieza luminosa para celebraciones y eventos de día o de tarde.', 'Por confirmar', 'Por confirmar', 36990, 'evento', 1, 1 FROM categorias c WHERE c.slug = 'vestidos';
INSERT INTO producto_imagenes (producto_id, color_id, url, alt, orden) SELECT p.id, co.id, '/img/fotos/vestido-floral-azul.webp', 'Vestido Floral Azul en azul', 0 FROM productos p, colores co WHERE p.slug = 'vestido-floral-azul' AND co.slug = 'azul';
INSERT INTO producto_imagenes (producto_id, color_id, url, alt, orden) SELECT p.id, co.id, '/img/fotos/vestido-floral-azul-512.webp', 'Vista reducida de Vestido Floral Azul', 1 FROM productos p, colores co WHERE p.slug = 'vestido-floral-azul' AND co.slug = 'azul';
INSERT INTO variantes (producto_id, color_id, talla, sku, stock) SELECT p.id, co.id, 'S', 'VAE-L02-A-S', 5 FROM productos p, colores co WHERE p.slug = 'vestido-floral-azul' AND co.slug = 'azul';
INSERT INTO variantes (producto_id, color_id, talla, sku, stock) SELECT p.id, co.id, 'M', 'VAE-L02-A-M', 10 FROM productos p, colores co WHERE p.slug = 'vestido-floral-azul' AND co.slug = 'azul';
INSERT INTO variantes (producto_id, color_id, talla, sku, stock) SELECT p.id, co.id, 'L', 'VAE-L02-A-L', 2 FROM productos p, colores co WHERE p.slug = 'vestido-floral-azul' AND co.slug = 'azul';
INSERT INTO variantes (producto_id, color_id, talla, sku, stock) SELECT p.id, co.id, 'XL', 'VAE-L02-A-XL', 3 FROM productos p, colores co WHERE p.slug = 'vestido-floral-azul' AND co.slug = 'azul';
INSERT INTO variantes (producto_id, color_id, talla, sku, stock) SELECT p.id, co.id, 'XXL', 'VAE-L02-A-XXL', 3 FROM productos p, colores co WHERE p.slug = 'vestido-floral-azul' AND co.slug = 'azul';

INSERT INTO productos (categoria_id, nombre, slug, descripcion, materiales, cuidados, precio, ocasion, destacado, activo) SELECT c.id, 'Blusa Rosa y Pantalón Negro', 'blusa-rosa-pantalon-negro', 'Look de blusa rosa con pantalón negro. Una combinación de contrastes pensada para la oficina y para salir después del trabajo.', 'Por confirmar', 'Por confirmar', 34990, 'oficina', 1, 1 FROM categorias c WHERE c.slug = 'blusas-y-camisas';
INSERT INTO producto_imagenes (producto_id, color_id, url, alt, orden) SELECT p.id, co.id, '/img/fotos/blusa-rosa-pantalon-negro.webp', 'Blusa Rosa y Pantalón Negro en rosa', 0 FROM productos p, colores co WHERE p.slug = 'blusa-rosa-pantalon-negro' AND co.slug = 'rosa';
INSERT INTO producto_imagenes (producto_id, color_id, url, alt, orden) SELECT p.id, co.id, '/img/fotos/blusa-rosa-pantalon-negro-512.webp', 'Vista reducida de Blusa Rosa y Pantalón Negro', 1 FROM productos p, colores co WHERE p.slug = 'blusa-rosa-pantalon-negro' AND co.slug = 'rosa';
INSERT INTO variantes (producto_id, color_id, talla, sku, stock) SELECT p.id, co.id, 'S', 'VAE-L03-R-S', 8 FROM productos p, colores co WHERE p.slug = 'blusa-rosa-pantalon-negro' AND co.slug = 'rosa';
INSERT INTO variantes (producto_id, color_id, talla, sku, stock) SELECT p.id, co.id, 'M', 'VAE-L03-R-M', 10 FROM productos p, colores co WHERE p.slug = 'blusa-rosa-pantalon-negro' AND co.slug = 'rosa';
INSERT INTO variantes (producto_id, color_id, talla, sku, stock) SELECT p.id, co.id, 'L', 'VAE-L03-R-L', 4 FROM productos p, colores co WHERE p.slug = 'blusa-rosa-pantalon-negro' AND co.slug = 'rosa';
INSERT INTO variantes (producto_id, color_id, talla, sku, stock) SELECT p.id, co.id, 'XL', 'VAE-L03-R-XL', 2 FROM productos p, colores co WHERE p.slug = 'blusa-rosa-pantalon-negro' AND co.slug = 'rosa';
INSERT INTO variantes (producto_id, color_id, talla, sku, stock) SELECT p.id, co.id, 'XXL', 'VAE-L03-R-XXL', 4 FROM productos p, colores co WHERE p.slug = 'blusa-rosa-pantalon-negro' AND co.slug = 'rosa';

INSERT INTO productos (categoria_id, nombre, slug, descripcion, materiales, cuidados, precio, ocasion, destacado, activo) SELECT c.id, 'Conjunto Floral Burdeos', 'conjunto-floral-burdeos', 'Conjunto de blusa y falda en burdeos con estampado floral. Dos piezas que se combinan entre sí para una tenida de reunión completa.', 'Por confirmar', 'Por confirmar', 38990, 'reunion', 0, 1 FROM categorias c WHERE c.slug = 'blusas-y-camisas';
INSERT INTO producto_imagenes (producto_id, color_id, url, alt, orden) SELECT p.id, co.id, '/img/fotos/blusa-floral-burdeos-falda-burdeos.webp', 'Conjunto Floral Burdeos en burdeos', 0 FROM productos p, colores co WHERE p.slug = 'conjunto-floral-burdeos' AND co.slug = 'burdeos';
INSERT INTO producto_imagenes (producto_id, color_id, url, alt, orden) SELECT p.id, co.id, '/img/fotos/blusa-floral-burdeos-falda-burdeos-512.webp', 'Vista reducida de Conjunto Floral Burdeos', 1 FROM productos p, colores co WHERE p.slug = 'conjunto-floral-burdeos' AND co.slug = 'burdeos';
INSERT INTO variantes (producto_id, color_id, talla, sku, stock) SELECT p.id, co.id, 'S', 'VAE-L04-B-S', 6 FROM productos p, colores co WHERE p.slug = 'conjunto-floral-burdeos' AND co.slug = 'burdeos';
INSERT INTO variantes (producto_id, color_id, talla, sku, stock) SELECT p.id, co.id, 'M', 'VAE-L04-B-M', 4 FROM productos p, colores co WHERE p.slug = 'conjunto-floral-burdeos' AND co.slug = 'burdeos';
INSERT INTO variantes (producto_id, color_id, talla, sku, stock) SELECT p.id, co.id, 'L', 'VAE-L04-B-L', 4 FROM productos p, colores co WHERE p.slug = 'conjunto-floral-burdeos' AND co.slug = 'burdeos';
INSERT INTO variantes (producto_id, color_id, talla, sku, stock) SELECT p.id, co.id, 'XL', 'VAE-L04-B-XL', 0 FROM productos p, colores co WHERE p.slug = 'conjunto-floral-burdeos' AND co.slug = 'burdeos';
INSERT INTO variantes (producto_id, color_id, talla, sku, stock) SELECT p.id, co.id, 'XXL', 'VAE-L04-B-XXL', 2 FROM productos p, colores co WHERE p.slug = 'conjunto-floral-burdeos' AND co.slug = 'burdeos';

INSERT INTO productos (categoria_id, nombre, slug, descripcion, materiales, cuidados, precio, ocasion, destacado, activo) SELECT c.id, 'Conjunto Blazer y Pantalón Salvia', 'conjunto-blazer-pantalon-salvia', 'Conjunto de blazer y pantalón en verde salvia. Un set de oficina que también se puede usar por separado.', 'Por confirmar', 'Por confirmar', 39990, 'oficina', 1, 1 FROM categorias c WHERE c.slug = 'blazers-y-abrigos';
INSERT INTO producto_imagenes (producto_id, color_id, url, alt, orden) SELECT p.id, co.id, '/img/fotos/conjunto-blazer-pantalon-salvia.webp', 'Conjunto Blazer y Pantalón Salvia en verde salvia', 0 FROM productos p, colores co WHERE p.slug = 'conjunto-blazer-pantalon-salvia' AND co.slug = 'verde-salvia';
INSERT INTO producto_imagenes (producto_id, color_id, url, alt, orden) SELECT p.id, co.id, '/img/fotos/conjunto-blazer-pantalon-salvia-512.webp', 'Vista reducida de Conjunto Blazer y Pantalón Salvia', 1 FROM productos p, colores co WHERE p.slug = 'conjunto-blazer-pantalon-salvia' AND co.slug = 'verde-salvia';
INSERT INTO variantes (producto_id, color_id, talla, sku, stock) SELECT p.id, co.id, 'S', 'VAE-L05-VS-S', 3 FROM productos p, colores co WHERE p.slug = 'conjunto-blazer-pantalon-salvia' AND co.slug = 'verde-salvia';
INSERT INTO variantes (producto_id, color_id, talla, sku, stock) SELECT p.id, co.id, 'M', 'VAE-L05-VS-M', 10 FROM productos p, colores co WHERE p.slug = 'conjunto-blazer-pantalon-salvia' AND co.slug = 'verde-salvia';
INSERT INTO variantes (producto_id, color_id, talla, sku, stock) SELECT p.id, co.id, 'L', 'VAE-L05-VS-L', 4 FROM productos p, colores co WHERE p.slug = 'conjunto-blazer-pantalon-salvia' AND co.slug = 'verde-salvia';
INSERT INTO variantes (producto_id, color_id, talla, sku, stock) SELECT p.id, co.id, 'XL', 'VAE-L05-VS-XL', 2 FROM productos p, colores co WHERE p.slug = 'conjunto-blazer-pantalon-salvia' AND co.slug = 'verde-salvia';
INSERT INTO variantes (producto_id, color_id, talla, sku, stock) SELECT p.id, co.id, 'XXL', 'VAE-L05-VS-XXL', 1 FROM productos p, colores co WHERE p.slug = 'conjunto-blazer-pantalon-salvia' AND co.slug = 'verde-salvia';

-- 5) Verificación: debe mostrar 5 productos activos
SELECT COUNT(*) AS productos_activos FROM productos WHERE activo = 1;

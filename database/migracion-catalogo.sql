-- Migración del catálogo: desactiva los productos de demostración y carga los 5 looks nuevos.
-- No borra pedidos, usuarios ni pagos. Ejecutar UNA vez sobre la base de TiDB (USE vaelia;).
USE vaelia;

-- 1) Tallas: agrega XXL y conserva XS para no romper filas antiguas
ALTER TABLE variantes MODIFY talla ENUM('XS','S','M','L','XL','XXL') NOT NULL;

-- 2) Desactivar productos de demostración (quedan en la base, ocultos)
UPDATE productos SET activo = 0 WHERE activo = 1;

-- 3) Colores nuevos (los existentes no se tocan)
INSERT IGNORE INTO colores (nombre, slug, hex) VALUES
('Azul marino', 'marino', '#1E2A44'),
('Azul', 'azul', '#4A6E94'),
('Rosa', 'rosa', '#E9B8BF'),
('Burdeos', 'burdeos', '#6B1E2E');

-- 4) Productos nuevos (categoría y color se buscan por slug)
INSERT INTO productos (categoria_id, nombre, slug, descripcion, materiales, cuidados, precio, ocasion, destacado, activo) VALUES ((SELECT id FROM categorias WHERE slug='faldas'), 'Falda Floral Marino', 'falda-floral-marino', 'Falda de estampado floral sobre fondo azul marino. Combina con blusas lisas para un look femenino para el día o una reunión.', 'Por confirmar', 'Por confirmar', 27990, 'reunion', 1, 1);
INSERT INTO producto_imagenes (producto_id, color_id, url, alt, orden) VALUES ((SELECT id FROM productos WHERE slug='falda-floral-marino'), (SELECT id FROM colores WHERE slug='marino'), '/img/fotos/falda-floral-marino.webp', 'Falda Floral Marino en azul marino', 0), ((SELECT id FROM productos WHERE slug='falda-floral-marino'), (SELECT id FROM colores WHERE slug='marino'), '/img/fotos/falda-floral-marino-512.webp', 'Vista reducida de Falda Floral Marino', 1);
INSERT INTO variantes (producto_id, color_id, talla, sku, stock) VALUES ((SELECT id FROM productos WHERE slug='falda-floral-marino'), (SELECT id FROM colores WHERE slug='marino'), 'S', 'VAE-L01-M-S', 5);
INSERT INTO variantes (producto_id, color_id, talla, sku, stock) VALUES ((SELECT id FROM productos WHERE slug='falda-floral-marino'), (SELECT id FROM colores WHERE slug='marino'), 'M', 'VAE-L01-M-M', 8);
INSERT INTO variantes (producto_id, color_id, talla, sku, stock) VALUES ((SELECT id FROM productos WHERE slug='falda-floral-marino'), (SELECT id FROM colores WHERE slug='marino'), 'L', 'VAE-L01-M-L', 2);
INSERT INTO variantes (producto_id, color_id, talla, sku, stock) VALUES ((SELECT id FROM productos WHERE slug='falda-floral-marino'), (SELECT id FROM colores WHERE slug='marino'), 'XL', 'VAE-L01-M-XL', 3);
INSERT INTO variantes (producto_id, color_id, talla, sku, stock) VALUES ((SELECT id FROM productos WHERE slug='falda-floral-marino'), (SELECT id FROM colores WHERE slug='marino'), 'XXL', 'VAE-L01-M-XXL', 3);

INSERT INTO productos (categoria_id, nombre, slug, descripcion, materiales, cuidados, precio, ocasion, destacado, activo) VALUES ((SELECT id FROM categorias WHERE slug='vestidos'), 'Vestido Floral Azul', 'vestido-floral-azul', 'Vestido de estampado floral en tonos azules. Una pieza luminosa para celebraciones y eventos de día o de tarde.', 'Por confirmar', 'Por confirmar', 36990, 'evento', 1, 1);
INSERT INTO producto_imagenes (producto_id, color_id, url, alt, orden) VALUES ((SELECT id FROM productos WHERE slug='vestido-floral-azul'), (SELECT id FROM colores WHERE slug='azul'), '/img/fotos/vestido-floral-azul.webp', 'Vestido Floral Azul en azul', 0), ((SELECT id FROM productos WHERE slug='vestido-floral-azul'), (SELECT id FROM colores WHERE slug='azul'), '/img/fotos/vestido-floral-azul-512.webp', 'Vista reducida de Vestido Floral Azul', 1);
INSERT INTO variantes (producto_id, color_id, talla, sku, stock) VALUES ((SELECT id FROM productos WHERE slug='vestido-floral-azul'), (SELECT id FROM colores WHERE slug='azul'), 'S', 'VAE-L02-A-S', 5);
INSERT INTO variantes (producto_id, color_id, talla, sku, stock) VALUES ((SELECT id FROM productos WHERE slug='vestido-floral-azul'), (SELECT id FROM colores WHERE slug='azul'), 'M', 'VAE-L02-A-M', 10);
INSERT INTO variantes (producto_id, color_id, talla, sku, stock) VALUES ((SELECT id FROM productos WHERE slug='vestido-floral-azul'), (SELECT id FROM colores WHERE slug='azul'), 'L', 'VAE-L02-A-L', 2);
INSERT INTO variantes (producto_id, color_id, talla, sku, stock) VALUES ((SELECT id FROM productos WHERE slug='vestido-floral-azul'), (SELECT id FROM colores WHERE slug='azul'), 'XL', 'VAE-L02-A-XL', 3);
INSERT INTO variantes (producto_id, color_id, talla, sku, stock) VALUES ((SELECT id FROM productos WHERE slug='vestido-floral-azul'), (SELECT id FROM colores WHERE slug='azul'), 'XXL', 'VAE-L02-A-XXL', 3);

INSERT INTO productos (categoria_id, nombre, slug, descripcion, materiales, cuidados, precio, ocasion, destacado, activo) VALUES ((SELECT id FROM categorias WHERE slug='blusas-y-camisas'), 'Blusa Rosa y Pantalón Negro', 'blusa-rosa-pantalon-negro', 'Look de blusa rosa con pantalón negro. Una combinación de contrastes pensada para la oficina y para salir después del trabajo.', 'Por confirmar', 'Por confirmar', 34990, 'oficina', 1, 1);
INSERT INTO producto_imagenes (producto_id, color_id, url, alt, orden) VALUES ((SELECT id FROM productos WHERE slug='blusa-rosa-pantalon-negro'), (SELECT id FROM colores WHERE slug='rosa'), '/img/fotos/blusa-rosa-pantalon-negro.webp', 'Blusa Rosa y Pantalón Negro en rosa', 0), ((SELECT id FROM productos WHERE slug='blusa-rosa-pantalon-negro'), (SELECT id FROM colores WHERE slug='rosa'), '/img/fotos/blusa-rosa-pantalon-negro-512.webp', 'Vista reducida de Blusa Rosa y Pantalón Negro', 1);
INSERT INTO variantes (producto_id, color_id, talla, sku, stock) VALUES ((SELECT id FROM productos WHERE slug='blusa-rosa-pantalon-negro'), (SELECT id FROM colores WHERE slug='rosa'), 'S', 'VAE-L03-R-S', 8);
INSERT INTO variantes (producto_id, color_id, talla, sku, stock) VALUES ((SELECT id FROM productos WHERE slug='blusa-rosa-pantalon-negro'), (SELECT id FROM colores WHERE slug='rosa'), 'M', 'VAE-L03-R-M', 10);
INSERT INTO variantes (producto_id, color_id, talla, sku, stock) VALUES ((SELECT id FROM productos WHERE slug='blusa-rosa-pantalon-negro'), (SELECT id FROM colores WHERE slug='rosa'), 'L', 'VAE-L03-R-L', 4);
INSERT INTO variantes (producto_id, color_id, talla, sku, stock) VALUES ((SELECT id FROM productos WHERE slug='blusa-rosa-pantalon-negro'), (SELECT id FROM colores WHERE slug='rosa'), 'XL', 'VAE-L03-R-XL', 2);
INSERT INTO variantes (producto_id, color_id, talla, sku, stock) VALUES ((SELECT id FROM productos WHERE slug='blusa-rosa-pantalon-negro'), (SELECT id FROM colores WHERE slug='rosa'), 'XXL', 'VAE-L03-R-XXL', 4);

INSERT INTO productos (categoria_id, nombre, slug, descripcion, materiales, cuidados, precio, ocasion, destacado, activo) VALUES ((SELECT id FROM categorias WHERE slug='blusas-y-camisas'), 'Conjunto Floral Burdeos', 'conjunto-floral-burdeos', 'Conjunto de blusa y falda en burdeos con estampado floral. Dos piezas que se combinan entre sí para una tenida de reunión completa.', 'Por confirmar', 'Por confirmar', 38990, 'reunion', 0, 1);
INSERT INTO producto_imagenes (producto_id, color_id, url, alt, orden) VALUES ((SELECT id FROM productos WHERE slug='conjunto-floral-burdeos'), (SELECT id FROM colores WHERE slug='burdeos'), '/img/fotos/blusa-floral-burdeos-falda-burdeos.webp', 'Conjunto Floral Burdeos en burdeos', 0), ((SELECT id FROM productos WHERE slug='conjunto-floral-burdeos'), (SELECT id FROM colores WHERE slug='burdeos'), '/img/fotos/blusa-floral-burdeos-falda-burdeos-512.webp', 'Vista reducida de Conjunto Floral Burdeos', 1);
INSERT INTO variantes (producto_id, color_id, talla, sku, stock) VALUES ((SELECT id FROM productos WHERE slug='conjunto-floral-burdeos'), (SELECT id FROM colores WHERE slug='burdeos'), 'S', 'VAE-L04-B-S', 6);
INSERT INTO variantes (producto_id, color_id, talla, sku, stock) VALUES ((SELECT id FROM productos WHERE slug='conjunto-floral-burdeos'), (SELECT id FROM colores WHERE slug='burdeos'), 'M', 'VAE-L04-B-M', 4);
INSERT INTO variantes (producto_id, color_id, talla, sku, stock) VALUES ((SELECT id FROM productos WHERE slug='conjunto-floral-burdeos'), (SELECT id FROM colores WHERE slug='burdeos'), 'L', 'VAE-L04-B-L', 4);
INSERT INTO variantes (producto_id, color_id, talla, sku, stock) VALUES ((SELECT id FROM productos WHERE slug='conjunto-floral-burdeos'), (SELECT id FROM colores WHERE slug='burdeos'), 'XL', 'VAE-L04-B-XL', 0);
INSERT INTO variantes (producto_id, color_id, talla, sku, stock) VALUES ((SELECT id FROM productos WHERE slug='conjunto-floral-burdeos'), (SELECT id FROM colores WHERE slug='burdeos'), 'XXL', 'VAE-L04-B-XXL', 2);

INSERT INTO productos (categoria_id, nombre, slug, descripcion, materiales, cuidados, precio, ocasion, destacado, activo) VALUES ((SELECT id FROM categorias WHERE slug='blazers-y-abrigos'), 'Conjunto Blazer y Pantalón Salvia', 'conjunto-blazer-pantalon-salvia', 'Conjunto de blazer y pantalón en verde salvia. Un set de oficina que también se puede usar por separado.', 'Por confirmar', 'Por confirmar', 39990, 'oficina', 1, 1);
INSERT INTO producto_imagenes (producto_id, color_id, url, alt, orden) VALUES ((SELECT id FROM productos WHERE slug='conjunto-blazer-pantalon-salvia'), (SELECT id FROM colores WHERE slug='verde-salvia'), '/img/fotos/conjunto-blazer-pantalon-salvia.webp', 'Conjunto Blazer y Pantalón Salvia en verde salvia', 0), ((SELECT id FROM productos WHERE slug='conjunto-blazer-pantalon-salvia'), (SELECT id FROM colores WHERE slug='verde-salvia'), '/img/fotos/conjunto-blazer-pantalon-salvia-512.webp', 'Vista reducida de Conjunto Blazer y Pantalón Salvia', 1);
INSERT INTO variantes (producto_id, color_id, talla, sku, stock) VALUES ((SELECT id FROM productos WHERE slug='conjunto-blazer-pantalon-salvia'), (SELECT id FROM colores WHERE slug='verde-salvia'), 'S', 'VAE-L05-VS-S', 3);
INSERT INTO variantes (producto_id, color_id, talla, sku, stock) VALUES ((SELECT id FROM productos WHERE slug='conjunto-blazer-pantalon-salvia'), (SELECT id FROM colores WHERE slug='verde-salvia'), 'M', 'VAE-L05-VS-M', 10);
INSERT INTO variantes (producto_id, color_id, talla, sku, stock) VALUES ((SELECT id FROM productos WHERE slug='conjunto-blazer-pantalon-salvia'), (SELECT id FROM colores WHERE slug='verde-salvia'), 'L', 'VAE-L05-VS-L', 4);
INSERT INTO variantes (producto_id, color_id, talla, sku, stock) VALUES ((SELECT id FROM productos WHERE slug='conjunto-blazer-pantalon-salvia'), (SELECT id FROM colores WHERE slug='verde-salvia'), 'XL', 'VAE-L05-VS-XL', 2);
INSERT INTO variantes (producto_id, color_id, talla, sku, stock) VALUES ((SELECT id FROM productos WHERE slug='conjunto-blazer-pantalon-salvia'), (SELECT id FROM colores WHERE slug='verde-salvia'), 'XXL', 'VAE-L05-VS-XXL', 1);


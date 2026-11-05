-- Datos iniciales de Vaelia (generado por scripts/generar-seed.js)
USE vaelia;
SET NAMES utf8mb4;

INSERT INTO categorias (id, nombre, slug, orden) VALUES
(1, 'Blazers y abrigos', 'blazers-y-abrigos', 1),
(2, 'Blusas y camisas', 'blusas-y-camisas', 2),
(3, 'Vestidos', 'vestidos', 3),
(4, 'Pantalones', 'pantalones', 4),
(5, 'Faldas', 'faldas', 5),
(6, 'Tejidos', 'tejidos', 6);

INSERT INTO colores (id, nombre, slug, hex) VALUES
(1, 'Verde bosque', 'verde-bosque', '#243C32'),
(2, 'Negro', 'negro', '#1F1F1D'),
(3, 'Café corteza', 'cafe-corteza', '#604A3A'),
(4, 'Verde salvia', 'verde-salvia', '#788875'),
(5, 'Taupe', 'taupe', '#9A8978'),
(6, 'Beige lino', 'beige-lino', '#E5D8C5'),
(7, 'Marfil', 'marfil', '#F6F1E8'),
(8, 'Azul marino', 'marino', '#1E2A44'),
(9, 'Azul', 'azul', '#4A6E94'),
(10, 'Rosa', 'rosa', '#E9B8BF'),
(11, 'Burdeos', 'burdeos', '#6B1E2E');

INSERT INTO productos (id, categoria_id, nombre, slug, descripcion, materiales, cuidados, precio, ocasion, destacado, activo, created_at) VALUES
(1, 5, 'Falda Floral Marino', 'falda-floral-marino', 'Falda de estampado floral sobre fondo azul marino. Combina con blusas lisas para un look femenino para el día o una reunión.', 'Por confirmar', 'Por confirmar', 27990, 'reunion', 1, 1, '2026-09-01 12:00:00'),
(2, 3, 'Vestido Floral Azul', 'vestido-floral-azul', 'Vestido de estampado floral en tonos azules. Una pieza luminosa para celebraciones y eventos de día o de tarde.', 'Por confirmar', 'Por confirmar', 36990, 'evento', 1, 1, '2026-09-02 12:00:00'),
(3, 2, 'Blusa Rosa y Pantalón Negro', 'blusa-rosa-pantalon-negro', 'Look de blusa rosa con pantalón negro. Una combinación de contrastes pensada para la oficina y para salir después del trabajo.', 'Por confirmar', 'Por confirmar', 34990, 'oficina', 1, 1, '2026-09-03 12:00:00'),
(4, 2, 'Conjunto Floral Burdeos', 'conjunto-floral-burdeos', 'Conjunto de blusa y falda en burdeos con estampado floral. Dos piezas que se combinan entre sí para una tenida de reunión completa.', 'Por confirmar', 'Por confirmar', 38990, 'reunion', 0, 1, '2026-09-04 12:00:00'),
(5, 1, 'Conjunto Blazer y Pantalón Salvia', 'conjunto-blazer-pantalon-salvia', 'Conjunto de blazer y pantalón en verde salvia. Un set de oficina que también se puede usar por separado.', 'Por confirmar', 'Por confirmar', 39990, 'oficina', 1, 1, '2026-09-05 12:00:00');

INSERT INTO producto_imagenes (producto_id, color_id, url, alt, orden) VALUES
(1, 8, '/img/fotos/falda-floral-marino.webp', 'Falda Floral Marino en azul marino', 0),
(1, 8, '/img/fotos/falda-floral-marino-512.webp', 'Vista reducida de Falda Floral Marino', 1),
(2, 9, '/img/fotos/vestido-floral-azul.webp', 'Vestido Floral Azul en azul', 0),
(2, 9, '/img/fotos/vestido-floral-azul-512.webp', 'Vista reducida de Vestido Floral Azul', 1),
(3, 10, '/img/fotos/blusa-rosa-pantalon-negro.webp', 'Blusa Rosa y Pantalón Negro en rosa', 0),
(3, 10, '/img/fotos/blusa-rosa-pantalon-negro-512.webp', 'Vista reducida de Blusa Rosa y Pantalón Negro', 1),
(4, 11, '/img/fotos/blusa-floral-burdeos-falda-burdeos.webp', 'Conjunto Floral Burdeos en burdeos', 0),
(4, 11, '/img/fotos/blusa-floral-burdeos-falda-burdeos-512.webp', 'Vista reducida de Conjunto Floral Burdeos', 1),
(5, 4, '/img/fotos/conjunto-blazer-pantalon-salvia.webp', 'Conjunto Blazer y Pantalón Salvia en verde salvia', 0),
(5, 4, '/img/fotos/conjunto-blazer-pantalon-salvia-512.webp', 'Vista reducida de Conjunto Blazer y Pantalón Salvia', 1);

INSERT INTO variantes (id, producto_id, color_id, talla, sku, stock) VALUES
(1, 1, 8, 'S', 'VAE-001-M-S', 6),
(2, 1, 8, 'M', 'VAE-001-M-M', 6),
(3, 1, 8, 'L', 'VAE-001-M-L', 4),
(4, 1, 8, 'XL', 'VAE-001-M-XL', 1),
(5, 1, 8, 'XXL', 'VAE-001-M-XXL', 1),
(6, 2, 9, 'S', 'VAE-002-A-S', 8),
(7, 2, 9, 'M', 'VAE-002-A-M', 4),
(8, 2, 9, 'L', 'VAE-002-A-L', 6),
(9, 2, 9, 'XL', 'VAE-002-A-XL', 0),
(10, 2, 9, 'XXL', 'VAE-002-A-XXL', 1),
(11, 3, 10, 'S', 'VAE-003-R-S', 6),
(12, 3, 10, 'M', 'VAE-003-R-M', 8),
(13, 3, 10, 'L', 'VAE-003-R-L', 2),
(14, 3, 10, 'XL', 'VAE-003-R-XL', 3),
(15, 3, 10, 'XXL', 'VAE-003-R-XXL', 4),
(16, 4, 11, 'S', 'VAE-004-B-S', 8),
(17, 4, 11, 'M', 'VAE-004-B-M', 8),
(18, 4, 11, 'L', 'VAE-004-B-L', 6),
(19, 4, 11, 'XL', 'VAE-004-B-XL', 0),
(20, 4, 11, 'XXL', 'VAE-004-B-XXL', 3),
(21, 5, 4, 'S', 'VAE-005-VS-S', 6),
(22, 5, 4, 'M', 'VAE-005-VS-M', 10),
(23, 5, 4, 'L', 'VAE-005-VS-L', 7),
(24, 5, 4, 'XL', 'VAE-005-VS-XL', 1),
(25, 5, 4, 'XXL', 'VAE-005-VS-XXL', 4);

-- Cuenta de prueba: camila@test.cl / Vaelia2026
INSERT INTO usuarios (id, nombre, apellido, email, password_hash, telefono, rut, rol) VALUES
(1, 'Camila', 'Rojas', 'camila@test.cl', '$2b$12$9AfEB9kizPhaiz9pYtKbUumllSAjuEHEveUvR7C47do2KiYzLFt/y', '+56912345678', NULL, 'cliente');
INSERT INTO direcciones (usuario_id, region, comuna, calle, depto, referencia, es_principal) VALUES
(1, 'Metropolitana de Santiago', 'Providencia', 'Av. Nueva Providencia 1881', 'Depto 504', 'Conserjería 24 h', 1);


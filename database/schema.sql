-- =============================================================
--  VAELIA · Esquema de base de datos (MySQL 8 / MariaDB 10.6+)
--  Capa de datos de la arquitectura de tres capas.
-- =============================================================

CREATE DATABASE IF NOT EXISTS vaelia
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE vaelia;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS pedido_historial;
DROP TABLE IF EXISTS pagos;
DROP TABLE IF EXISTS pedido_items;
DROP TABLE IF EXISTS pedidos;
DROP TABLE IF EXISTS variantes;
DROP TABLE IF EXISTS producto_imagenes;
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS colores;
DROP TABLE IF EXISTS categorias;
DROP TABLE IF EXISTS direcciones;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS suscriptores;
SET FOREIGN_KEY_CHECKS = 1;

-- -------------------------------------------------------------
--  Clientes y administradoras
-- -------------------------------------------------------------
CREATE TABLE usuarios (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(60)  NOT NULL,
  apellido        VARCHAR(60)  NOT NULL,
  email           VARCHAR(120) NOT NULL,
  password_hash   CHAR(60)     NULL,               -- bcrypt; NULL en cuentas creadas con Google
  telefono        VARCHAR(20)  NULL,
  rut             VARCHAR(12)  NULL,
  rol             ENUM('cliente','admin') NOT NULL DEFAULT 'cliente',
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_usuarios_email (email)
) ENGINE=InnoDB;

CREATE TABLE direcciones (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id      INT UNSIGNED NOT NULL,
  region          VARCHAR(60)  NOT NULL,
  comuna          VARCHAR(60)  NOT NULL,
  calle           VARCHAR(120) NOT NULL,
  depto           VARCHAR(40)  NULL,
  referencia      VARCHAR(160) NULL,
  es_principal    TINYINT(1)   NOT NULL DEFAULT 1,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_direcciones_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  KEY idx_direcciones_usuario (usuario_id)
) ENGINE=InnoDB;

-- -------------------------------------------------------------
--  Catálogo: categorías, colores, productos, imágenes, variantes
-- -------------------------------------------------------------
CREATE TABLE categorias (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(60)  NOT NULL,
  slug            VARCHAR(60)  NOT NULL,
  orden           SMALLINT     NOT NULL DEFAULT 0,
  UNIQUE KEY uq_categorias_slug (slug)
) ENGINE=InnoDB;

CREATE TABLE colores (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(40)  NOT NULL,
  slug            VARCHAR(40)  NOT NULL,
  hex             CHAR(7)      NOT NULL,
  UNIQUE KEY uq_colores_slug (slug)
) ENGINE=InnoDB;

CREATE TABLE productos (
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

CREATE TABLE producto_imagenes (
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

-- Una variante = producto + color + talla, con su propio stock (HU05, HU06)
CREATE TABLE variantes (
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

-- -------------------------------------------------------------
--  Pedidos, ítems, historial de estados y pagos
-- -------------------------------------------------------------
CREATE TABLE pedidos (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo          VARCHAR(26)  NOT NULL,            -- también es el buy_order de Webpay
  public_id       CHAR(32)     NOT NULL,            -- identificador no adivinable para la confirmación
  usuario_id      INT UNSIGNED NULL,                -- NULL = compra como invitada
  nombre          VARCHAR(60)  NOT NULL,
  apellido        VARCHAR(60)  NOT NULL,
  email           VARCHAR(120) NOT NULL,
  telefono        VARCHAR(20)  NOT NULL,
  rut             VARCHAR(12)  NULL,
  tipo_despacho   ENUM('domicilio','retiro') NOT NULL,
  region          VARCHAR(60)  NULL,
  comuna          VARCHAR(60)  NULL,
  calle           VARCHAR(120) NULL,
  depto           VARCHAR(40)  NULL,
  referencia      VARCHAR(160) NULL,
  subtotal        INT UNSIGNED NOT NULL,
  costo_envio     INT UNSIGNED NOT NULL,
  total           INT UNSIGNED NOT NULL,
  estado          ENUM('pendiente_pago','pagado','en_preparacion','despachado','entregado','pago_rechazado','cancelado')
                  NOT NULL DEFAULT 'pendiente_pago',
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pedidos_codigo (codigo),
  UNIQUE KEY uq_pedidos_public (public_id),
  KEY idx_pedidos_usuario (usuario_id, created_at),
  KEY idx_pedidos_estado (estado, created_at),
  CONSTRAINT fk_pedidos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Los ítems guardan una "foto" del producto al momento de la compra
CREATE TABLE pedido_items (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pedido_id       INT UNSIGNED NOT NULL,
  variante_id     INT UNSIGNED NOT NULL,
  producto_nombre VARCHAR(80)  NOT NULL,
  color_nombre    VARCHAR(40)  NOT NULL,
  talla           VARCHAR(4)   NOT NULL,
  imagen          VARCHAR(255) NULL,
  precio_unitario INT UNSIGNED NOT NULL,
  cantidad        SMALLINT UNSIGNED NOT NULL,
  subtotal        INT UNSIGNED NOT NULL,
  CONSTRAINT fk_items_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
  CONSTRAINT fk_items_variante FOREIGN KEY (variante_id) REFERENCES variantes(id),
  KEY idx_items_pedido (pedido_id)
) ENGINE=InnoDB;

CREATE TABLE pedido_historial (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pedido_id       INT UNSIGNED NOT NULL,
  estado          VARCHAR(30)  NOT NULL,
  nota            VARCHAR(255) NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_historial_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
  KEY idx_historial_pedido (pedido_id, created_at)
) ENGINE=InnoDB;

-- Registro de cada intento de pago con Webpay Plus (HU14)
CREATE TABLE pagos (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pedido_id           INT UNSIGNED NOT NULL,
  proveedor           VARCHAR(20)  NOT NULL DEFAULT 'webpay_plus',
  token               VARCHAR(64)  NULL,
  buy_order           VARCHAR(26)  NOT NULL,
  session_id          VARCHAR(61)  NOT NULL,
  monto               INT UNSIGNED NOT NULL,
  estado              ENUM('iniciado','confirmando','autorizado','rechazado','anulado','timeout','error')
                      NOT NULL DEFAULT 'iniciado',
  response_code       SMALLINT     NULL,
  authorization_code  VARCHAR(6)   NULL,
  payment_type_code   VARCHAR(4)   NULL,
  installments_number SMALLINT     NULL,
  card_last4          CHAR(4)      NULL,
  transaction_date    DATETIME     NULL,
  respuesta           TEXT         NULL,            -- respuesta completa del commit (JSON)
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pagos_token (token),
  KEY idx_pagos_buy_order (buy_order),
  KEY idx_pagos_estado (estado, created_at),
  CONSTRAINT fk_pagos_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Newsletter "Mantente cerca"
CREATE TABLE suscriptores (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email           VARCHAR(120) NOT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_suscriptores_email (email)
) ENGINE=InnoDB;

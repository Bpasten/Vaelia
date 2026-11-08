# VAELIA · Vístete para ti.

Tienda en línea de vestuario para mujeres. Frontend en HTML, CSS y JavaScript sin frameworks; backend en Node.js con Express 5; base de datos compatible con MySQL; pagos con Webpay Plus (Transbank).

```
Navegador (HTML · CSS · JS)  ──HTTPS / JSON──▶  Node.js + Express (API REST)  ──▶  MySQL / TiDB
                                                          │
                                                          └──▶  Webpay Plus · Transbank (transbank-sdk)
```

## 1. Requisitos

- Node.js 26 (versión fijada en `package.json`)
- MySQL 8 o TiDB Cloud (compatible con el protocolo MySQL)

## 2. Instalación y ejecución local

```bash
npm install
cp .env.example .env     # completa las variables
npm run db:setup         # crea las tablas y carga datos de ejemplo (borra y recrea las tablas)
npm run dev              # servidor con recarga automática
```

Abre **http://localhost:3000**. Para producción usa `npm start`.

## 3. Pagos con Webpay (ambiente de integración)

Mientras `TBK_ENV=integration` (valor por defecto) no se cobra dinero real. El checkout usa las credenciales públicas de prueba de Transbank.

| Caso | Tarjeta | CVV | Resultado |
|---|---|---|---|
| Aprobado | VISA `4051 8856 0044 6623` | `123` | Aprobada |
| Rechazado | Mastercard `5186 0595 5959 0568` | `123` | Rechazada |

Fecha de expiración: cualquiera futura. Si pide autenticación: RUT `11.111.111-1`, clave `123`.

Retorno desde Transbank (`/api/webpay/retorno`, acepta GET y POST):

| Lo que pasó en Webpay | Llega | Resultado en Vaelia |
|---|---|---|
| Pagó | `token_ws` | `commit()`; si `AUTHORIZED`, `response_code = 0` y monto y orden coinciden → pedido **pagado** |
| Anuló o hubo error en el formulario | `TBK_TOKEN` | Pedido cancelado, stock devuelto, sin commit |
| Se le acabó el tiempo | `TBK_ORDEN_COMPRA` | Pedido cancelado, stock devuelto |
| Cerró la pestaña | — | A los 30 min el servidor libera el stock; si vuelve tarde, no se confirma y Transbank reversa |

Recargar la página de retorno no genera un segundo commit.

## 4. Flujo de compra

1. **Catálogo:** elige color y talla. Las tallas sin stock aparecen tachadas.
2. **Carrito:** aumentar, disminuir o eliminar productos. El navegador solo guarda referencias.
3. **Checkout** en 3 pasos: Datos → Envío (domicilio o retiro) → Pago. Se puede comprar como invitada; con sesión se precargan los datos y la dirección.
4. El servidor **recalcula precios desde la base**, **reserva el stock** en una transacción con bloqueo de filas y crea la transacción en Webpay.
5. **Confirmación** con el comprobante de Transbank: comercio, orden, monto, código de autorización, fecha, tipo de pago, cuotas y últimos 4 dígitos.
6. **Mi cuenta:** historial de pedidos y seguimiento con la fecha de cada cambio de estado.

Reglas de despacho (configurables en `.env`): RM, regiones y umbral de envío gratis; retiro en showroom sin costo.

## 5. Estructura

```
server.js                     Arranque, verificación de la base y liberación de pagos abandonados
src/
  app.js                      Express: helmet, CORS, cookies, API y archivos estáticos
  config/   env.js · db.js · transbank.js
  routes/   index.js          Todas las rutas de la API
  controllers/                productos · auth · cuenta · checkout · webpay · pedidos · newsletter
  services/                   pedidos.service.js (stock y estados) · envio.service.js
  middlewares/                auth (JWT en cookie httpOnly) · limites (rate limit) · errores
  utils/                      validar · estados · http-error
api/index.js                  Punto de entrada para Vercel (serverless)
database/
  schema.sql                  Esquema de tablas
  seed.sql                    Datos de ejemplo
  catalogo.js                 Fuente del catálogo
  migracion-*.sql · carga-*.sql   Migraciones y carga del catálogo (TiDB y MySQL)
scripts/
  db-setup.js                 npm run db:setup
  generar-seed.js             npm run seed:generar
test/                         Pruebas unitarias e de integración
public/
  *.html                      Páginas (inicio, colección, producto, cuenta, checkout, confirmación, mi cuenta, 404)
  css/styles.css
  js/api.js · carrito.js · ui.js · paginas/*.js
  img/marca/ · img/fotos/ · img/productos/ · img/icons.svg
  fonts/                      Cormorant Garamond y Montserrat (locales)
```

## 6. API REST

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/productos` | Listado con filtros: `categoria`, `color`, `talla`, `ocasion`, `q`, `orden`, `pagina`, `por_pagina` |
| GET | `/api/productos/destacados` | Productos destacados para la portada |
| GET | `/api/productos/filtros` | Categorías, colores, tallas y ocasiones |
| GET | `/api/productos/:slug` | Ficha con variantes, stock e imágenes por color |
| POST | `/api/auth/registro` · `/api/auth/login` · `/api/auth/logout` | Sesión con JWT en cookie httpOnly |
| GET | `/api/auth/yo` | Sesión actual |
| GET/PUT | `/api/cuenta` · PUT `/api/cuenta/direccion` | Datos y dirección (requiere sesión) |
| GET | `/api/cuenta/pedidos` · `/api/cuenta/pedidos/:codigo` | Historial y seguimiento |
| GET | `/api/checkout/config` | Regiones y reglas de envío |
| POST | `/api/checkout/cotizar` | Revalida el carrito y calcula envío y total |
| POST | `/api/checkout` | Crea el pedido y la transacción Webpay → `{ url, token }` |
| GET/POST | `/api/webpay/retorno` | Retorno de Transbank (commit) |
| GET | `/api/pedidos/:publicId` | Resultado para la página de confirmación |
| POST | `/api/newsletter` | Suscripción al boletín |
| GET | `/api/salud` | Estado del servidor y de la base |
| GET | `/api/cron/liberar-stock` | Libera stock de pedidos abandonados (requiere `CRON_SECRET`) |

## 7. Seguridad

| Control | Implementación |
|---|---|
| Contraseñas | `bcryptjs` (costo 12). Mismo tiempo de respuesta si el correo no existe |
| Sesión | JWT en cookie `httpOnly`, `SameSite=Lax`, `Secure` en producción |
| Cabeceras | `helmet` con CSP estricta (`form-action` solo permite enviar a Webpay) |
| Abuso | `express-rate-limit` en login, registro y checkout |
| Secretos | Variables de entorno (`dotenv`). `.env` está en `.gitignore`. El servidor no arranca sin `JWT_SECRET` |
| Validación | En el navegador y de nuevo en el servidor (RUT con dígito verificador, celular, correo, dirección) |
| SQL | Consultas parametrizadas |
| Precios y stock | Siempre desde la base de datos |
| Pago | Pedido pagado solo con respuesta `AUTHORIZED`, `response_code 0`, monto y orden iguales |
| Errores | Mensajes sin stack trace, SQL ni credenciales |

## 8. Paso a producción

1. Obtén el **código de comercio** y la **API Key** de producción de Transbank.
2. Configura las variables en el hosting (en Vercel: *Settings → Environment Variables*):
   ```
   NODE_ENV=production
   APP_URL=https://tu-dominio
   TBK_ENV=production
   TBK_COMMERCE_CODE=...
   TBK_API_KEY=...
   JWT_SECRET=...            # mínimo 32 caracteres
   CRON_SECRET=...
   DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_SSL=true
   ```
3. HTTPS es obligatorio: el servidor no arranca en producción con `APP_URL` sin `https://`.
4. Configura respaldos de la base y restringe su acceso solo a la aplicación.

## 9. Imágenes

- `public/img/fotos/`: fotografías de producto en formato WebP (versión completa y versión de 512 px para tarjetas).
- `public/img/marca/`: logo y fotos de marca (bolsa, etiqueta, tarjeta de agradecimiento, sello y papel de seda).
- Para cambiar una foto, reemplaza el archivo con el mismo nombre; no hace falta tocar el código.

## 10. Pruebas

Las pruebas usan una **base separada** cuyo nombre termina en `_test`. Nunca usan el `.env` de producción.

1. Crea una base de pruebas (en TiDB, en un cluster o branch aparte) y un usuario con permisos sobre ella.
2. Copia `.env.test.example` como `.env.test` y completa `TEST_DB_*`.
3. Carga el esquema y los datos: `DB_NAME=<nombre>_test npm run db:setup` (con `DB_USER`, `DB_PASSWORD` y `DB_HOST` apuntando a la base de pruebas).
4. Ejecuta:
   - `npm run test:unitarias`: validaciones, envíos y sesiones (no necesita base).
   - `npm run test:integracion`: registro, login, catálogo, carrito, compra con Webpay simulado y newsletter.
   - `npm test`: todo.

Webpay se simula dentro de las pruebas: no se llama a Transbank.

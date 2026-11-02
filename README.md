# VAELIA · Vístete para ti.

```
Navegador (HTML · CSS · JS)  ──HTTPS / JSON──▶  Node.js + Express (API REST)  ──▶  MySQL
                                                          │
                                                          └──▶  Webpay Plus · Transbank (transbank-sdk)
```

| Instrucción | Dónde está |
|---|---|
| 1. Landing con colores y tipografía de la marca | `public/index.html`, `public/css/styles.css` (verde bosque, salvia, café corteza, taupe, beige lino, marfil, dorado viejo · Cormorant Garamond + Montserrat) |
| 2. Catálogo integrado | `public/coleccion.html`, `public/producto.html` ← `GET /api/productos` desde MySQL, con filtros por categoría, color, talla, ocasión, búsqueda, orden y paginación |
| 3. Carrito de compras | Carrito lateral en todas las páginas (`public/js/carrito.js`, `public/js/ui.js`). El servidor revalida precios y stock antes de pagar |
| 4. Webpay Plus (SDK) | `transbank-sdk` en ambiente de **integración** (`src/config/transbank.js`, `src/controllers/checkout.controller.js`, `src/controllers/webpay.controller.js`) |
| 5. HTML, CSS, JS, Node, Express, MySQL | Sin frameworks de frontend; backend Express 5 + mysql2 |
| Login y registro | `public/cuenta.html` (diseño entregado), accesible desde el **ícono de cuenta del navbar**. Con sesión, el ícono abre un menú: Mis pedidos, Mis datos, Mi dirección, Cerrar sesión |

---

## 1. Requisitos

- Node.js 18 o superior
- MySQL 8 

## 2. Instalación

```bash
npm install
```

> También puedes importar `database/schema.sql` y luego `database/seed.sql` desde MySQL Workbench.
> `db:setup` **borra y recrea** las tablas.

Levanta el servidor:

```bash
npm run dev        # con recarga automática
# o
npm start
```

Abre **http://localhost:3000**

**Cuenta de prueba:** `camila@test.cl` / `Vaelia2026`

## 3. Probar el pago con Webpay (ambiente de integración)

No se cobra dinero real. Al pagar, la tienda te lleva al formulario de prueba de Transbank:

| Caso | Tarjeta | CVV | Resultado |
|---|---|---|---|
| Aprobado | VISA `4051 8856 0044 6623` | `123` | Aprobada |
| Rechazado | Mastercard `5186 0595 5959 0568` | `123` | Rechazada |

Fecha de expiración: cualquiera futura. Si pide autenticación: RUT `11.111.111-1`, clave `123`.
(Estos datos también aparecen en el paso 3 del checkout mientras `TBK_ENV=integration`.)

Casos que maneja el retorno (`/api/webpay/retorno`, acepta GET y POST):

| Lo que pasó en Webpay | Llega | Resultado en Vaelia |
|---|---|---|
| Pagó | `token_ws` | `commit()` → si `AUTHORIZED`, `response_code = 0` y el monto y la orden coinciden → pedido **pagado** |
| Anuló o hubo error en el formulario | `TBK_TOKEN` | Pedido cancelado, stock devuelto, **sin commit** |
| Se le acabó el tiempo | `TBK_ORDEN_COMPRA` | Pedido cancelado, stock devuelto |
| Cerró la pestaña | — | A los 30 min el servidor libera el stock (si vuelve tarde, no se confirma y Transbank reversa) |

Además se evita el doble commit si alguien recarga la página de retorno.

## 4. Flujo de compra

1. **Catálogo** → elige color y talla (las tallas sin stock aparecen tachadas).
2. **Carrito** → aumentar, disminuir o eliminar; barra de "te faltan $X para envío gratis".
3. **Checkout** en 3 pasos: Datos → Envío (domicilio o retiro) → Pago. Se puede comprar **como invitada**; con sesión se precargan los datos y la dirección.
4. El servidor **recalcula precios desde MySQL**, **reserva el stock** en una transacción con bloqueo de filas y crea la transacción en Webpay.
5. **Confirmación** con el comprobante que pide Transbank: comercio, orden de compra, monto, código de autorización, fecha, tipo de pago, cuotas y últimos 4 dígitos.
6. **Mi cuenta** → historial de pedidos y seguimiento con fecha de cada cambio de estado.

Reglas de despacho (configurables en `.env`): RM $3.990 · regiones $5.990 · gratis desde $60.000 · retiro en showroom gratis.

## 5. Estructura

```
server.js                     Arranque, verificación de MySQL y liberación de pagos abandonados
src/
  app.js                      Express: helmet, CORS, cookies, API y archivos estáticos
  config/  env.js · db.js · transbank.js
  routes/  index.js           Todas las rutas de la API
  controllers/                productos · auth · cuenta · checkout · webpay · pedidos · newsletter
  services/                   pedidos.service.js (stock y estados) · envio.service.js
  middlewares/                auth (JWT en cookie httpOnly) · limites (rate limit) · errores
  utils/                      validar (RUT, correo, celular, dirección) · estados · http-error
database/
  schema.sql                  Tablas: usuarios, direcciones, categorias, colores, productos,
                              producto_imagenes, variantes, pedidos, pedido_items,
                              pedido_historial, pagos, suscriptores
  seed.sql                    Datos iniciales (generado desde catalogo.js)
  catalogo.js                 Fuente del catálogo
scripts/
  db-setup.js                 npm run db:setup
  generar-seed.js             npm run seed:generar
  generar-imagenes.js         npm run imagenes:generar
public/
  index.html · coleccion.html · producto.html · cuenta.html · checkout.html
  confirmacion.html · mi-cuenta.html · 404.html
  css/styles.css
  js/api.js · carrito.js · ui.js · paginas/*.js
  img/icons.svg (incluye la rama de la marca) · img/marca/ · img/productos/
  fonts/                      Cormorant Garamond y Montserrat locales (sin depender de Google)
```

## 6. API REST

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/productos` | Listado (`categoria`, `color`, `talla`, `ocasion`, `q`, `orden`, `pagina`, `por_pagina`) |
| GET | `/api/productos/destacados` | 4 destacados para la landing |
| GET | `/api/productos/filtros` | Categorías, colores, tallas y ocasiones |
| GET | `/api/productos/:slug` | Ficha con variantes, stock e imágenes por color |
| POST | `/api/auth/registro` · `/api/auth/login` · `/api/auth/logout` | Sesión con JWT en cookie httpOnly |
| GET | `/api/auth/yo` | Sesión actual |
| GET/PUT | `/api/cuenta` · PUT `/api/cuenta/direccion` | Datos y dirección (requiere sesión) |
| GET | `/api/cuenta/pedidos` · `/api/cuenta/pedidos/:codigo` | Historial y seguimiento |
| GET | `/api/checkout/config` | Regiones, reglas de envío, ambiente Webpay |
| POST | `/api/checkout/cotizar` | Revalida el carrito y calcula envío y total |
| POST | `/api/checkout` | Crea el pedido y la transacción Webpay → `{ url, token }` |
| GET/POST | `/api/webpay/retorno` | Retorno de Transbank (commit) |
| GET | `/api/pedidos/:publicId` | Resultado para la página de confirmación |
| POST | `/api/newsletter` | "Mantente cerca" |
| GET | `/api/salud` | Estado del servidor y MySQL |

## 7. Seguridad (informe 3.2 y 5.5)

| Control | Implementación |
|---|---|
| Contraseñas | `bcryptjs` (costo 12). Mismo tiempo de respuesta si el correo no existe |
| Sesión | `jsonwebtoken` en cookie `httpOnly`, `SameSite=Lax`, `Secure` en producción |
| Cabeceras | `helmet` con CSP estricta (`form-action` solo permite enviar a Webpay) |
| Abuso | `express-rate-limit`: login 10 fallidos / 15 min, registro 5 / hora, checkout 15 / 15 min |
| Secretos | `dotenv`; `.env` está en `.gitignore`. El servidor no arranca sin `JWT_SECRET` |
| Validación | En navegador y de nuevo en servidor (RUT con dígito verificador, celular, correo, dirección) |
| SQL | Consultas parametrizadas (`?`) con `mysql2` |
| Precios y stock | Siempre desde MySQL; el carrito del navegador solo es referencia |
| Pago | Pedido pagado solo con respuesta `AUTHORIZED`, `response_code 0`, monto y orden iguales |
| Errores | Mensajes claros sin stack, SQL ni credenciales |

## 8. Trazabilidad con las historias de usuario

| HU | Estado |
|---|---|
| HU07 Catálogo con disponibilidad | ✔ Datos desde MySQL |
| HU08 Ficha con imágenes, precio, tallas y stock | ✔ |
| HU09 Buscar y filtrar | ✔ Búsqueda, categoría, color, talla, ocasión y orden |
| HU10 · HU11 Carrito | ✔ Persistente; aumentar, disminuir, eliminar |
| HU12 Compra sin cuenta / reutilizar datos con sesión | ✔ |
| HU13 Validar contacto y despacho | ✔ Domicilio o retiro |
| HU14 Registrar pago y mostrar confirmación o error | ✔ Webpay Plus, tabla `pagos` |
| HU06 Bloquear compras sobre el stock | ✔ Reserva con bloqueo de filas |
| HU17 Registro opcional, correo no duplicado | ✔ |
| HU18 Login con credenciales válidas e inválidas | ✔ |
| HU19 Actualizar datos personales | ✔ Mi cuenta |
| HU20 Historial de pedidos | ✔ |
| HU21 Estado vigente y última actualización | ✔ `pedido_historial` |
| HU01–HU05, HU15, HU16 Panel administrativo | Pendiente. Ya existen el rol `admin` en `usuarios` y el middleware `requiereAdmin` |

## 9. Paso a producción

1. Pide a Transbank tu **código de comercio** y **API Key** de producción (se entregan después de su proceso de validación de la integración).
2. En `.env`:
   ```
   NODE_ENV=production
   APP_URL=https://www.vaelia.cl
   TRUST_PROXY=1            # si el hosting usa proxy HTTPS
   TBK_ENV=production
   TBK_COMMERCE_CODE=...
   TBK_API_KEY=...
   ```
3. HTTPS es obligatorio (el servidor se niega a arrancar en producción con `APP_URL` sin https).
4. Configura respaldos de MySQL y restringe su acceso solo desde la aplicación.

## 10. Imágenes

Las fotos de marca (bosque, bolsa, etiqueta, tarjeta, sello y papel de seda) salen del brand board de Vaelia.
Las prendas son **ilustraciones SVG de demostración** generadas por `scripts/generar-imagenes.js` (una por color, con vista frontal, detalle y textura).
Cuando tengan fotografías reales, súbanlas a `public/img/productos/` y actualicen las URLs en la tabla `producto_imagenes`; no hay que tocar el código.

Tipografías Cormorant Garamond y Montserrat: licencia SIL Open Font License.

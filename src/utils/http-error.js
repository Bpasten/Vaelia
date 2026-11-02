/** Error con código HTTP y mensaje seguro para mostrar al usuario. */
class HttpError extends Error {
  constructor(status, mensaje, detalles) {
    super(mensaje);
    this.status = status;
    this.detalles = detalles; // p. ej. { campo: 'mensaje' } para validaciones
  }
}

module.exports = HttpError;

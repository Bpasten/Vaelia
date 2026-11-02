/** Nombres legibles de estados de pedido y tipos de pago de Webpay. */
const ESTADOS = {
  pendiente_pago: 'Pendiente de pago',
  pagado: 'Pagado',
  en_preparacion: 'En preparación',
  despachado: 'Despachado',
  entregado: 'Entregado',
  pago_rechazado: 'Pago rechazado',
  cancelado: 'Cancelado',
};

// payment_type_code que devuelve Webpay Plus en el commit
const TIPOS_PAGO = {
  VD: 'Débito',
  VP: 'Prepago',
  VN: 'Crédito sin cuotas',
  VC: 'Crédito en cuotas',
  SI: '3 cuotas sin interés',
  S2: '2 cuotas sin interés',
  NC: 'Cuotas sin interés',
};

module.exports = { ESTADOS, TIPOS_PAGO };

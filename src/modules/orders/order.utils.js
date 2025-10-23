const crypto = require('crypto');

const ORDER_ID_RE = /ORD-\d{4}-\d{2}-\d{2}-[A-Z0-9]{5}/i;

function normalizeOrderId(orderId) {
  if (!orderId) return '';
  return String(orderId).trim().toUpperCase();
}

function generateOrderId(referenceDate = new Date()) {
  const date = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const randomBytes = crypto.randomBytes(3).toString('hex').toUpperCase();
  const suffix = randomBytes.slice(0, 5);

  return `ORD-${year}-${month}-${day}-${suffix}`;
}

module.exports = {
  ORDER_ID_RE,
  generateOrderId,
  normalizeOrderId
};

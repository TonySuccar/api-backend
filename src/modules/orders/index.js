const routes = require('./orders.routes');
const controller = require('./orders.controller');
const service = require('./orders.service');
const model = require('./order.model');
const { ORDER_ID_RE, generateOrderId, normalizeOrderId } = require('./order.utils');

module.exports = {
  routes,
  controller,
  service,
  model,
  ORDER_ID_RE,
  generateOrderId,
  normalizeOrderId
};
const routes = require('./customers.routes');
const controller = require('./customers.controller');
const service = require('./customers.service');
const model = require('./customers.model');

module.exports = {
  routes,
  controller,
  service,
  model
};
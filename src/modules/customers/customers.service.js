const Customer = require('./customers.model');

class CustomersService {
  async getCustomerByEmail(email) {
    return await Customer.findOne({ email });
  }

  async getCustomerById(id) {
    return await Customer.findById(id);
  }
}

module.exports = new CustomersService();

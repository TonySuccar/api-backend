const customersService = require('./customers.service');

class CustomersController {
  async getCustomers(req, res) {
    try {
      const rawEmail = req.query?.email;
      const email = rawEmail ? String(rawEmail).trim().toLowerCase() : '';

      if (!email) {
        return res.status(400).json({ error: 'Email query parameter is required' });
      }

      const customer = await customersService.getCustomerByEmail(email);
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      res.json(customer);
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to fetch customer', 
        message: error.message 
      });
    }
  }

  async getCustomerById(req, res) {
    try {
      const customer = await customersService.getCustomerById(req.params.id);
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      res.json(customer);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch customer',
        message: error.message
      });
    }
  }

}

module.exports = new CustomersController();

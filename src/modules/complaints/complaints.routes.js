const express = require('express');
const router = express.Router();
const complaintsController = require('./complaints.controller');

// POST /api/complaints - Create new complaint
router.post('/', complaintsController.createComplaint.bind(complaintsController));

// GET /api/complaints/stats - Get complaint statistics
router.get('/stats', complaintsController.getComplaintStats.bind(complaintsController));

// GET /api/complaints/user/:userId - Get complaints by user
router.get('/user/:userId', complaintsController.getComplaintsByUser.bind(complaintsController));

// GET /api/complaints/:id - Get complaint by ID
router.get('/:id', complaintsController.getComplaintById.bind(complaintsController));

// PATCH /api/complaints/:id - Update complaint status
router.patch('/:id', complaintsController.updateComplaintStatus.bind(complaintsController));

// GET /api/complaints - Get all complaints (admin)
router.get('/', complaintsController.getAllComplaints.bind(complaintsController));

module.exports = router;

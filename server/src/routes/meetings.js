const express = require('express');
const router = express.Router();
const meetingsController = require('../controllers/meetings');

// Get all meetings for a user
router.get('/', meetingsController.getMeetings);

// Get available time slots
router.get('/availability', meetingsController.getAvailability);

// Create a new meeting
router.post('/', meetingsController.createMeeting);

// Update a meeting
router.put('/:id', meetingsController.updateMeeting);

// Delete a meeting
router.delete('/:id', meetingsController.deleteMeeting);

module.exports = router;

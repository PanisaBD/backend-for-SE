const express = require('express');
const { getBookings, 
    getBooking, 
    addBooking, 
    updateBooking, 
    deleteBooking } = require('../controllers/bookings');
const router = express.Router({ mergeParams: true });
const { protect, authorize } = require('../middleware/auth');

// Route for getting all bookings under a specific campground
router.route('/').get(protect,authorize('admin', 'user'), getBookings);

// Route for adding a booking under a specific campground
router.route('/:campgroundId')
    .post(protect, authorize('admin', 'user'), addBooking);

// Route for getting, updating, and deleting a specific booking by ID
router.route('/:id')
    .get(protect,authorize('admin', 'user'), getBooking)
    .put(protect, authorize('admin', 'user'), updateBooking)
    .delete(protect, authorize('admin', 'user'), deleteBooking);

module.exports = router;

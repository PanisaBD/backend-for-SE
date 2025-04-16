const express = require('express');
const {
  getReviews,
  getReview,
  addReview,
  updateReview,
  deleteReview,
} = require('../controllers/reviews');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

// Route to get all reviews or reviews under a specific campground
router
  .route('/')
  .get(getReviews)
  .post(protect, authorize('admin', 'user'), addReview);

// Route to get, update, or delete a specific review by ID
router
  .route('/:id')
  .get(getReview)
  .put(protect, authorize('admin', 'user'), updateReview)
  .delete(protect, authorize('admin', 'user'), deleteReview);

module.exports = router;

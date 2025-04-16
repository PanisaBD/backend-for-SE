const Review = require("../models/Review");
const Campground = require("../models/Campground");

// @desc    Get all reviews or reviews for a specific campground
// @route   GET /api/v1/reviews
// @route   GET /api/v1/campgrounds/:campgroundId/reviews
// @access  Public
exports.getReviews = async (req, res, next) => {
  try {
    let query;

    if (req.params.campgroundId) {
      query = Review.find({ campground: req.params.campgroundId }).populate("user");
    } else {
      query = Review.find().populate("campground user");
    }

    const reviews = await query;

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, message: "Error fetching reviews" });
  }
};

// @desc    Get single review
// @route   GET /api/v1/reviews/:id
// @access  Public
exports.getReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id).populate("campground user");

    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    res.status(200).json({
      success: true,
      data: review,
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false });
  }
};

// @desc    Add a review
// @route   POST /api/v1/campgrounds/:campgroundId/reviews
// @access  Private
exports.addReview = async (req, res, next) => {
  try {
    const campground = await Campground.findById(req.params.campgroundId);

    if (!campground) {
      return res.status(404).json({ success: false, message: "Campground not found" });
    }

    req.body.campground = req.params.campgroundId;
    req.body.user = req.user.id;

    const review = await Review.create(req.body);

    res.status(201).json({
      success: true,
      data: review,
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, message: "Error creating review" });
  }
};

// @desc    Update a review
// @route   PUT /api/v1/reviews/:id
// @access  Private (only owner or admin)
exports.updateReview = async (req, res, next) => {
  try {
    let review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // Check if the user is the owner or an admin
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this review",
      });
    }

    // Update the review
    review = await Review.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("campground user");

    res.status(200).json({
      success: true,
      message: "Review updated",
      data: review,
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({
      success: false,
      message: "Error updating review",
    });
  }
};


// @desc    Delete a review
// @route   DELETE /api/v1/reviews/:id
// @access  Private (only owner or admin)
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    // Check if the user is the owner or an admin
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this review",
      });
    }

    await review.deleteOne();

    res.status(200).json({
      success: true,
      message: "Review deleted",
      data: {},
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false });
  }
};

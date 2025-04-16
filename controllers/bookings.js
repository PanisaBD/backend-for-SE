const Booking = require('../models/Booking');
const Campground = require('../models/Campground');

exports.getBookings = async (req, res, next) => {
  try {
    let query;

    // General users can see only their bookings
    if (req.user.role !== "admin") {
      query = Booking.find({ user: req.user.id });
    } else {
      // Admins can see all bookings, or filter by campground if provided
      if (req.params.campgroundId) {
        query = Booking.find({ campground: req.params.campgroundId });
      } else {
        query = Booking.find();
      }
    }

    // Copy request query parameters
    const reqQuery = { ...req.query };

    // Fields to exclude from filtering
    const removeFields = ["select", "sort", "page", "limit"];
    removeFields.forEach((param) => delete reqQuery[param]);

    // Convert query object to string
    let queryStr = JSON.stringify(reqQuery);

    // Convert operators to MongoDB format (e.g., gt -> $gt)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, (match) => `$${match}`);

    // Apply filtering
    query = query.find(JSON.parse(queryStr));

    // Populate campground details
    query = query.populate({
      path: "campground",
      select: "name province tel",
    });

    // Select specific fields
    if (req.query.select) {
      const fields = req.query.select.split(",").join(" ");
      query = query.select(fields);
    }

    // Sort results (default is check-in date)
    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      // Default sorting by check-in date
      query = query.sort("checkInDate"); 
    }

    // Pagination setup
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Booking.countDocuments();

    query = query.skip(startIndex).limit(limit);

    // Execute query
    const bookings = await query;

    // Pagination response
    const pagination = {};
    if (endIndex < total) {
      pagination.next = { page: page + 1, limit };
    }
    if (startIndex > 0) {
      pagination.prev = { page: page - 1, limit };
    }

    // Send response
    res.status(200).json({
      success: true,
      count: bookings.length,
      pagination,
      data: bookings,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Cannot find bookings" });
  }
};

exports.getBooking = async (req, res, next) => {
    try {
      const booking = await Booking.findById(req.params.id).populate({
        path: 'campground',
        select: 'name description tel'
      });
  
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: `No booking with the id of ${req.params.id}`
        });
      }
  
      res.status(200).json({
        success: true,
        data: booking
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, message: "Cannot find Booking" });
    }
  };
  exports.addBooking = async (req, res, next) => {
    try {
        req.body.campground = req.params.campgroundId;

        const campground = await Campground.findById(req.params.campgroundId);
        if (!campground) {
            return res.status(404).json({
                success: false,
                message: `No campground with the id of ${req.params.campgroundId}`
            });
        }

        // Add user ID to req.body
        req.body.user = req.user.id;

        // Check for existing bookings
        const existedBooking = await Booking.find({ user: req.user.id });

        // If the user is not an admin, they can only create 3 bookings
        if (existedBooking.length >= 3 && req.user.role !== 'admin') {
            return res.status(400).json({
                success: false,
                message: `The user with ID ${req.user.id} has already made 3 bookings`
            });
        }

        // Check if the user wants breakfast
        if (req.body.breakfast) {
            if (!campground.breakfast || campground.breakfast==null) {
                req.body.breakfast = false; // Automatically set to false
                var warningMessage = "This campground has no breakfast service. Breakfast has been set to false.";
            }
        }

        // Create booking
        const booking = await Booking.create(req.body);

        res.status(200).json({
            success: true,
            data: booking,
            message: warningMessage || "Booking created successfully"
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Cannot create Booking"
        });
    }
};

exports.updateBooking = async (req, res, next) => {
  try {
      let booking = await Booking.findById(req.params.id);
      if (!booking) {
          return res.status(404).json({ success: false, message: `No Booking with the id of ${req.params.id}` });
      }
      
      // Make sure user is the booking owner or an admin
      if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
          return res.status(401).json({ success: false, message: `User ${req.user.id} is not authorized to update this booking` });
      }

      // Check if the user wants breakfast
      if (req.body.breakfast) {
          const campground = await Campground.findById(booking.campground);
          if (!campground || !campground.breakfast) {
              req.body.breakfast = false; // Automatically set to false
              var warningMessage = "This campground has no breakfast service. Breakfast has been set to false.";
          }
      }

      // Update booking
      booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
          new: true,
          runValidators: true
      });

      res.status(200).json({
          success: true,
          data: booking,
          warning: warningMessage || null
      });
  } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, message: "Cannot update Booking" });
  }
};

// controllers/appointments.js

// @desc    Delete appointment
// @route   DELETE /api/v1/appointments/:id
// @access  Private
exports.deleteBooking = async (req, res, next) => {
    try {
      const booking = await Booking.findById(req.params.id);
  
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: `No booking found with id of ${req.params.id}`,
        });
      }
      //Make sure user is the appointment owner
      if(booking.user.toString()!== req.user.id && req.user.role !== 'admin'){
        return res.status(401).json({success:false,message:`User ${req.user.id} is not authorized to delete this booking`});
        }
      await booking.deleteOne();
  
      res.status(200).json({
        success: true,
        data: {},
      });
    } catch (error) {
      console.error(error);
       return res.status(500).json({
        success: false,
        message: "Cannot delete booking"
      });
    }
  };
  
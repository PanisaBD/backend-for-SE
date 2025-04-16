const mongoose = require('mongoose');
const BookingSchema = new mongoose.Schema({
    CheckInDate: {
        type: Date,
        required: true
    },    
    CheckOutDate: {
        type: Date,
        required: true
    },    
    duration: {
        // Store "day(s)" format
        type: String 
    },
    breakfast:{
        type: Boolean,
        defalt:false
    },
    status: {
        type: String,
        enum: ["pending", "confirmed", "checked-in", "checked-out", "cancelled"],
        default: "pending"
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true 
    },
    campground: {
        type: mongoose.Schema.ObjectId,
        ref: 'Campground',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Function to calculate duration
const calculateDuration = (checkIn, checkOut) => {
    const days = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
    return `${days} day${days > 1 ? 's' : ''}`; // Add "s" for plural days
};

// Auto-calculate duration before saving
BookingSchema.pre('save', function (next) {
    if (this.CheckInDate && this.CheckOutDate) {
        this.duration = calculateDuration(this.CheckInDate, this.CheckOutDate);
    }
    next();
});

// Auto-update duration when check-in or check-out date is modified
BookingSchema.pre('findOneAndUpdate', async function (next) {
    const update = this.getUpdate();

    if (update.CheckInDate || update.CheckOutDate) {
        const booking = await this.model.findOne(this.getQuery());
        const checkIn = update.CheckInDate || booking.CheckInDate;
        const checkOut = update.CheckOutDate || booking.CheckOutDate;

        this.set({ duration: calculateDuration(checkIn, checkOut) });
    }

    next();
});


module.exports = mongoose.model('Booking', BookingSchema);

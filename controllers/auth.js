
const User = require('../models/User');
const Booking = require('../models/Booking') ;

//@desc Register user
//@route POST /api/v1/auth/register
//@access Public
// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
   // Create token
   const token = user.getSignedJwtToken();

   // Cookie options
   const options = {
       expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
       httpOnly: true
   };
  
   // Enable secure cookies in production
   if (process.env.NODE_ENV === 'production') {
       options.secure = true;
   }

   // Send response with cookie
   res.status(statusCode)
       .cookie('token', token, options)
       .json({
           success: true,
           token
       });
};

exports.register=async (req,res,next)=>{
     try{
    const {username,name,telephone, email, password, role}=req.body;
    //Create user
    const user=await User.create({
    username,name,telephone,email,password, role
    });
    //Create token
    //const token=user.getSignedJwtToken();
    //res.status(200).json({success:true,token});
    sendTokenResponse (user, 200, res);

    } catch(err){
       res.status(400).json({success:false}); 
       console.log(err.stack);
}
};

//login 
exports.login = async (req, res, next) => {
    const { email, username, password } = req.body;
 
    // Validate email/username & password
    if (!email && !username || !password) {
        return res.status(400).json({ success: false, msg: 'Please provide an email/username and password' });
    }
 
    // Check for user based on email or username
    let user;
    if (email) {
        user = await User.findOne({ email }).select('+password');
    } else if (username) {
        user = await User.findOne({ username }).select('+password');
    }
 
    if (!user) {
        return res.status(400).json({ success: false, msg: 'Invalid credentials' });
    }
 
    // Check if password matches
    const isMatch = await user.matchPassword(password);
 
    if (!isMatch) {
        return res.status(401).json({ success: false, msg: 'Invalid credentials' });
    }
 
    // Send token response
    sendTokenResponse(user, 200, res);
 };
 

// @desc Get current logged-in user
// @route POST /api/v1/auth/me
// @access Private
exports.getMe = async (req, res, next) => {
    
    const user = await User.findById(req.user.id) ;
    res.status(200).json({
        success: true,
        data: user
    });
 };

//@desc Log user out / clear cookie
//@route GET /api/v1/auth/logout
//@access Private
exports.logout = async (req, res, next) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });

    res.status(200).json({
        success: true,
        data: {}
    });
};

// @desc Update logged-in user details
// @route PUT /api/v1/auth/update
// @access Private
exports.updateUser = async (req, res, next) => {
    try {
        const fieldsToUpdate = {
            username: req.body.username,
            name: req.body.name,
            telephone: req.body.telephone,
            email: req.body.email
        };

        // Remove undefined fields
        Object.keys(fieldsToUpdate).forEach(key => fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]);

        const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
            new: true,
            runValidators: true
        });

        if (!user) {
            return res.status(404).json({ success: false, msg: 'User not found' });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc Delete user and cascade delete their bookings
// @route DELETE /api/v1/auth/delete/:id
// @access Private (Owner or Admin)
exports.deleteUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ success: false, msg: 'User not found' });
        }

        // Check if the requesting user is the owner or an admin
        if (req.user.id !== user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, msg: 'Not authorized' });
        }

        // Delete user bookings
        await Booking.deleteMany({ user: user.id });

        // Delete user
        await user.deleteOne();

        res.status(200).json({ success: true, msg: 'User and related bookings deleted' });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};
// @desc Get all users (Admin only)
// @route GET /api/v1/auth/users
// @access Private (Admin only)
exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find();
        res.status(200).json({ success: true, data: users });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

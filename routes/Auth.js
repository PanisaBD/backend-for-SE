// routes/auth.js
const express= require('express');
const {register, login ,getMe ,logout,updateUser,deleteUser,getAllUsers}=require('../controllers/auth');

const router=express.Router();

const {protect,authorize}= require('../middleware/auth');

router.post('/register', register);
router.post('/login',login);
router.get('/me',protect,getMe);
router.get('/logout',logout);
router.put('/update', protect, updateUser);
router.delete('/delete/:id', protect, authorize('admin', 'user'), deleteUser);
router.get('/users',protect, authorize('admin'),getAllUsers);

module.exports=router;
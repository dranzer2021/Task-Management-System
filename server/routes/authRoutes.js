import express from 'express';
import { register, login, getMe, updateProfile, deleteProfile } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);
router.put('/me', protect, updateProfile);
router.delete('/me', protect, deleteProfile);

export default router; 
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from './auth.controller';
import { authenticate } from '../../shared/middleware/auth';

const router = Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: 'Too many authentication attempts',
    message: 'Please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const verificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 verification attempts per windowMs
  message: {
    success: false,
    error: 'Too many verification attempts',
    message: 'Please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes
router.post('/register', authLimiter, AuthController.register);
router.post('/login', authLimiter, AuthController.login);
router.post('/refresh', AuthController.refreshToken);
router.post('/logout', AuthController.logout);
router.post('/verify-email', verificationLimiter, AuthController.verifyEmail);
router.post('/resend-verification', verificationLimiter, AuthController.resendVerificationCode);

// Protected routes
router.get('/profile', authenticate, AuthController.getProfile);

export { router as authRoutes };
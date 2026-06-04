import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import {
  registerSchema, loginSchema, refreshSchema, forgotPasswordSchema,
  verifyResetOtpSchema, resetPasswordSchema, logoutSchema,
} from '../validators/auth.validator';
import * as authController from '../controllers/auth.controller';

const router = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     security: []
 *     responses:
 *       201:
 *         description: User registered
 */
router.post('/register', validateBody(registerSchema), authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login and receive JWT tokens
 *     security: []
 */
router.post('/login', validateBody(loginSchema), authController.login);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout and invalidate refresh token
 *     security:
 *       - bearerAuth: []
 */
router.post('/logout', authenticate, validateBody(logoutSchema), authController.logout);
router.post('/refresh', validateBody(refreshSchema), authController.refresh);
router.get('/me', authenticate, authController.me);
router.post('/forgot-password', validateBody(forgotPasswordSchema), authController.forgotPassword);
router.post('/verify-reset-otp', validateBody(verifyResetOtpSchema), authController.verifyResetOtp);
router.post('/reset-password', validateBody(resetPasswordSchema), authController.resetPassword);

export default router;

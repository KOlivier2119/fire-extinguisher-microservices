import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { updateProfileSchema, changePasswordSchema, updateRoleSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators/auth.validator';
import * as userController from '../controllers/user.controller';
import * as authController from '../controllers/auth.controller';
import { Role } from '../generated/prisma/client';

const router = Router();

router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, validateBody(updateProfileSchema), userController.updateProfile);
router.put('/change-password', authenticate, validateBody(changePasswordSchema), userController.changePassword);
router.post('/forgot-password', validateBody(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validateBody(resetPasswordSchema), authController.resetPassword);
router.get('/', authenticate, requireRole(Role.ADMIN), userController.listUsers);
router.get('/inspectors', authenticate, userController.listInspectors);
router.get('/:id', authenticate, requireRole(Role.ADMIN), userController.getUser);
router.put('/:id/role', authenticate, requireRole(Role.ADMIN), validateBody(updateRoleSchema), userController.updateRole);
router.delete('/:id', authenticate, requireRole(Role.ADMIN), userController.deleteUser);

export default router;

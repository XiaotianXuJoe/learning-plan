/**
 * 认证路由
 * 管理员登录、学员登录、获取当前用户
 */

import { Router } from 'express';
import { adminLogin, studentLogin, getMe } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// POST /api/v1/auth/admin/login - 管理员登录
router.post('/admin/login', adminLogin);

// POST /api/v1/auth/student/login - 学员登录
router.post('/student/login', studentLogin);

// GET /api/v1/auth/me - 获取当前登录用户信息
router.get('/me', authenticate, getMe);

export default router;

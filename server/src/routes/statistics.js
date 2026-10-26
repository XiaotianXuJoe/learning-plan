/**
 * 统计路由
 * 提供全局概览和学员个人进度统计
 */

import { Router } from 'express';
import { getOverview, getStudentProgress } from '../controllers/statisticsController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// GET /api/statistics/overview - 全局概览统计
router.get('/overview', authenticate, getOverview);

// GET /api/statistics/student/:studentId - 学员个人进度
router.get('/student/:studentId', authenticate, getStudentProgress);

export default router;

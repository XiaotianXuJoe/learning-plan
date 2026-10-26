/**
 * 学员管理路由
 * 仅管理员可操作
 */

import { Router } from 'express';
import { list, add, remove } from '../controllers/studentController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/students - 学员列表
router.get('/', requireAdmin, list);

// POST /api/students - 添加学员
router.post('/', requireAdmin, add);

// DELETE /api/students/:id - 删除学员
router.delete('/:id', requireAdmin, remove);

export default router;

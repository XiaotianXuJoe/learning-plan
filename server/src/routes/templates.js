/**
 * 模板管理路由
 * 仅管理员可操作
 */

import { Router } from 'express';
import { list, getDetail, create, update, remove, updateDay, addDay, deleteDay, reorderDays, cloneTemplate, updateName } from '../controllers/templateController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/templates - 模板列表
router.get('/', requireAdmin, list);

// GET /api/templates/:id - 模板详情
router.get('/:id', requireAdmin, getDetail);

// POST /api/templates - 创建模板
router.post('/', requireAdmin, create);

// PUT /api/templates/:id - 更新模板
router.put('/:id', requireAdmin, update);

// DELETE /api/templates/:id - 删除模板
router.delete('/:id', requireAdmin, remove);

// POST /api/templates/:id/days - 增加一天
router.post('/:id/days', requireAdmin, addDay);

// DELETE /api/templates/:id/days/:dayNumber - 删除指定天数
router.delete('/:id/days/:dayNumber', requireAdmin, deleteDay);

// PUT /api/templates/:id/days/:dayNumber - 更新某天内容（主题、视频、题目）
router.put('/:id/days/:dayNumber', requireAdmin, updateDay);

// POST /api/templates/:id/reorder-days - 重排天数
router.post('/:id/reorder-days', requireAdmin, reorderDays);

// PATCH /api/templates/:id/name - 更新模板名称
router.patch('/:id/name', requireAdmin, updateName);

// POST /api/templates/:id/clone - 复制模板
router.post('/:id/clone', requireAdmin, cloneTemplate);

export default router;

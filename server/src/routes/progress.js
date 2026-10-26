/**
 * 进度管理路由
 * 管理员和学员均可操作（学员只能操作自己的数据）
 */

import { Router } from 'express';
import {
  getDayDetail,
  updateProblemStatus,
  markVideoWatched,
  markDayComplete,
  saveNote,
} from '../controllers/progressController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// GET /api/progress/day/:dayId - 获取某天详情
router.get('/day/:dayId', authenticate, getDayDetail);

// PUT /api/progress/problem/:progressId - 更新题目状态
router.put('/problem/:progressId', authenticate, updateProblemStatus);

// PUT /api/progress/video/:progressId/watch - 标记视频已观看
router.put('/video/:progressId/watch', authenticate, markVideoWatched);

// POST /api/progress/day/:dayId/complete - 标记学习日完成
router.post('/day/:dayId/complete', authenticate, markDayComplete);

// POST /api/progress/day/:dayId/note - 保存笔记
router.post('/day/:dayId/note', authenticate, saveNote);

export default router;

/**
 * 学习计划路由
 * 管理员可操作所有计划，学员只能操作自己的计划
 */

import { Router } from 'express';
import { assign, list, getDetail, getCalendar, remove, getCalendarFull, updateStudentPlanDay, updateVideoWatchStatus, getProblemStats, reorderPlanDays, addPlanDay, deletePlanDay, updatePlanName } from '../controllers/planController.js';
import { authenticate } from '../middleware/auth.js';
import db from '../config/database.js';

const router = Router();

// POST /api/plans/assign - 分配学习计划（管理员）
router.post('/assign', authenticate, assign);

// GET /api/plans - 学习计划列表
router.get('/', authenticate, list);

// GET /api/plans/:id - 学习计划详情
router.get('/:id', authenticate, getDetail);

// GET /api/plans/:id/calendar - 学习日历（简版）
router.get('/:id/calendar', authenticate, getCalendar);

// GET /api/plans/:id/calendar-full - 学习日历完整版（含视频/题目详情）
router.get('/:id/calendar-full', authenticate, getCalendarFull);

// DELETE /api/plans/:id - 删除学习计划
router.delete('/:id', authenticate, remove);

// PUT /api/plans/:planId/days/:dayNumber - 修改学员计划某天内容
router.put('/:planId/days/:dayNumber', authenticate, updateStudentPlanDay);

// PATCH /api/plans/:planId/days/:dayNumber/videos/:videoId - 更新视频观看状态
router.patch('/:planId/days/:dayNumber/videos/:videoId', authenticate, updateVideoWatchStatus);

// GET /api/plans/:planId/problem-stats - 题目统计
router.get('/:planId/problem-stats', authenticate, getProblemStats);

// ============================================
// 题目状态更新、标记完成、撤销完成路由
// 使用 plan_problems 表（学员独立题目副本）
// ============================================

/**
 * 辅助函数：获取 plan_day_id
 */
function getPlanDayId(planId, dayNumber) {
  return db.prepare(
    'SELECT id FROM plan_days WHERE student_plan_id = ? AND day_number = ?'
  ).get(planId, dayNumber);
}

/**
 * 辅助函数：检查学员计划权限
 */
function checkPlanPermission(planId, userId, userRole) {
  const plan = db.prepare('SELECT student_id FROM student_plans WHERE id = ?').get(planId);
  if (!plan) return { ok: false, code: 404, message: '计划不存在' };
  if (userRole === 'student' && plan.student_id !== userId) {
    return { ok: false, code: 403, message: '无权操作此计划' };
  }
  return { ok: true, plan };
}

/**
 * 辅助函数：状态字符串/数字转整数
 */
function toStatusInt(status) {
  const statusMap = { 'uncompleted': 0, 'completed': 1, 'need_review': 2, 0: 0, 1: 1, 2: 2 };
  return statusMap[status] ?? 0;
}

// PATCH /api/v1/plans/:planId/name - 更新学员计划显示名称
router.patch('/:planId/name', authenticate, updatePlanName)

// PATCH /api/v1/plans/:planId/days/:dayNumber/questions/:questionId - 更新题目状态
router.patch('/:planId/days/:dayNumber/questions/:questionId', authenticate, (req, res) => {
  try {
    const { planId, dayNumber, questionId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // 权限检查
    const perm = checkPlanPermission(planId, userId, userRole);
    if (!perm.ok) {
      return res.status(perm.code).json({ code: perm.code === 404 ? 1404 : 1403, message: perm.message });
    }

    // 获取 plan_day_id
    const planDay = getPlanDayId(planId, dayNumber);
    if (!planDay) {
      return res.status(404).json({ code: 1404, message: '日期不存在' });
    }

    // 验证题目属于该 plan_day（questionId 是 plan_problems.id）
    const problem = db.prepare(
      'SELECT id FROM plan_problems WHERE plan_day_id = ? AND id = ?'
    ).get(planDay.id, questionId);

    if (!problem) {
      return res.status(404).json({ code: 1404, message: '题目不存在或不属于该日期' });
    }

    const intStatus = toStatusInt(status);

    // 直接更新 plan_problems 表
    db.prepare(
      'UPDATE plan_problems SET status = ? WHERE id = ? AND plan_day_id = ?'
    ).run(intStatus, questionId, planDay.id);

    res.json({ code: 0, message: '题目状态更新成功' });
  } catch (error) {
    console.error('更新题目状态失败:', error);
    res.status(500).json({ code: 1500, message: error.message });
  }
});

// POST /api/v1/plans/:planId/days/:dayNumber/complete - 标记一天完成
router.post('/:planId/days/:dayNumber/complete', authenticate, (req, res) => {
  try {
    const { planId, dayNumber } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // 权限检查
    const perm = checkPlanPermission(planId, userId, userRole);
    if (!perm.ok) {
      return res.status(perm.code).json({ code: perm.code === 404 ? 1404 : 1403, message: perm.message });
    }

    // 获取 plan_day_id
    const planDay = getPlanDayId(planId, dayNumber);
    if (!planDay) {
      return res.status(404).json({ code: 1404, message: '日期不存在' });
    }

    // 确保plan_days表有completed_at字段
    try {
      const planDayCols = db.prepare('PRAGMA table_info(plan_days)').all();
      if (!planDayCols.some((c) => c.name === 'completed_at')) {
        db.prepare('ALTER TABLE plan_days ADD COLUMN completed_at INTEGER DEFAULT NULL').run();
      }
    } catch (e) {
      console.error('[Migration] plan_days.completed_at 迁移失败:', e.message);
    }

    // 获取该天的所有题目（从 plan_problems 表）
    const problems = db.prepare(
      'SELECT id FROM plan_problems WHERE plan_day_id = ?'
    ).all(planDay.id);

    // 为每道题更新完成状态（status=1）
    for (const problem of problems) {
      db.prepare(
        'UPDATE plan_problems SET status = 1 WHERE id = ?'
      ).run(problem.id);
    }

    // 设置 plan_days 的 completed_at 字段
    db.prepare(
      'UPDATE plan_days SET completed_at = unixepoch() WHERE id = ?'
    ).run(planDay.id);

    res.json({ code: 0, message: '今日任务已标记为完成' });
  } catch (error) {
    console.error('标记完成失败:', error);
    res.status(500).json({ code: 1500, message: error.message });
  }
});

// POST /api/plans/:planId/reorder-days - 重排学员计划天数
router.post('/:planId/reorder-days', authenticate, reorderPlanDays);

// POST /api/plans/:planId/days/add - 学员计划增加一天
router.post('/:planId/days/add', authenticate, addPlanDay);

// DELETE /api/plans/:planId/days/:dayNumber - 学员计划删除指定天数
router.delete('/:planId/days/:dayNumber', authenticate, deletePlanDay);

// POST /api/v1/plans/:planId/days/:dayNumber/uncomplete - 撤销一天完成状态
router.post('/:planId/days/:dayNumber/uncomplete', authenticate, (req, res) => {
  try {
    const { planId, dayNumber } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // 权限检查
    const perm = checkPlanPermission(planId, userId, userRole);
    if (!perm.ok) {
      return res.status(perm.code).json({ code: perm.code === 404 ? 1404 : 1403, message: perm.message });
    }

    // 获取 plan_day_id
    const planDay = getPlanDayId(planId, dayNumber);
    if (!planDay) {
      return res.status(404).json({ code: 1404, message: '日期不存在' });
    }

    // 1. 清除 completed_at 字段
    db.prepare(
      'UPDATE plan_days SET completed_at = NULL WHERE id = ?'
    ).run(planDay.id);

    // 2. 将该天所有题目的状态恢复为 0（未完成）- 通过 plan_problems 表
    db.prepare(
      'UPDATE plan_problems SET status = 0 WHERE plan_day_id = ?'
    ).run(planDay.id);

    res.json({ code: 0, message: '已撤销完成状态' });
  } catch (error) {
    console.error('撤销完成失败:', error);
    res.status(500).json({ code: 1500, message: error.message });
  }
});
export default router;

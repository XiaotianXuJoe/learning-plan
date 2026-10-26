/**
 * 进度管理控制器
 * 处理每日详情查看、题目状态更新、视频观看标记、每日完成标记、笔记保存
 * 学员只能操作自己的数据
 */

import { query, queryOne, run } from '../models/db.js';
import { success, error, ErrorCodes } from '../utils/response.js';

/**
 * 检查学员是否有权限操作指定 plan_day
 * @param {number} planDayId - plan_day ID
 * @param {number} studentId - 学员 ID
 * @returns {boolean} 是否有权限
 */
function checkPlanDayOwnership(planDayId, studentId) {
  const result = queryOne(
    `SELECT 1 FROM plan_days pd
     JOIN student_plans sp ON pd.student_plan_id = sp.id
     WHERE pd.id = ? AND sp.student_id = ?`,
    [planDayId, studentId]
  );
  return !!result;
}

/**
 * 获取某天详情（含题目按知识点分组）
 * GET /api/progress/day/:dayId
 */
export function getDayDetail(req, res, next) {
  try {
    const { dayId } = req.params;

    // 验证权限
    if (req.user.role === 'student' && !checkPlanDayOwnership(dayId, req.user.id)) {
      return res.status(403).json(error(ErrorCodes.FORBIDDEN, '无权查看此学习日'));
    }

    // 获取当天基本信息
    const dayInfo = queryOne(
      `SELECT 
        pd.id, pd.day_number, pd.date, pd.theme, pd.is_rest_day,
        sp.student_id, sp.id as student_plan_id
       FROM plan_days pd
       JOIN student_plans sp ON pd.student_plan_id = sp.id
       WHERE pd.id = ?`,
      [dayId]
    );

    if (!dayInfo) {
      return res.status(404).json(error(ErrorCodes.NOT_FOUND, '学习日不存在'));
    }

    // 管理员查看时不需要所有权检查
    if (req.user.role === 'student' && dayInfo.student_id !== req.user.id) {
      return res.status(403).json(error(ErrorCodes.FORBIDDEN, '无权查看此学习日'));
    }

    // 获取题目列表及进度状态（按知识点分组）
    const problems = query(
      `SELECT 
        p.id,
        p.title,
        p.description,
        p.difficulty,
        p.knowledge_tag,
        p.sort_order,
        pp.id as progress_id,
        pp.status
       FROM problems p
       JOIN problem_progress pp ON pp.problem_id = p.id
       WHERE pp.plan_day_id = ?
       ORDER BY p.sort_order`,
      [dayId]
    );

    // 按知识点分组
    const problemsByTag = {};
    for (const problem of problems) {
      const tag = problem.knowledge_tag || '未分类';
      if (!problemsByTag[tag]) {
        problemsByTag[tag] = [];
      }
      problemsByTag[tag].push(problem);
    }

    // 获取视频列表及观看状态
    const videos = query(
      `SELECT 
        v.id,
        v.title,
        v.url,
        v.description,
        v.duration,
        vp.id as progress_id,
        vp.is_watched
       FROM videos v
       JOIN video_progress vp ON vp.video_id = v.id
       WHERE vp.plan_day_id = ?`,
      [dayId]
    );

    // 获取当日笔记
    const note = queryOne(
      `SELECT id, content, created_at, updated_at FROM day_notes WHERE plan_day_id = ?`,
      [dayId]
    );

    // 计算完成进度
    const completedProblems = problems.filter((p) => p.status === 1).length;
    const completedVideos = videos.filter((v) => v.is_watched === 1).length;

    return res.json(
      success({
        day: dayInfo,
        problems_by_tag: problemsByTag,
        problems,
        videos,
        note: note || null,
        progress: {
          total_problems: problems.length,
          completed_problems: completedProblems,
          total_videos: videos.length,
          completed_videos: completedVideos,
          all_completed: completedProblems === problems.length && completedVideos === videos.length,
        },
      })
    );
  } catch (err) {
    next(err);
  }
}

/**
 * 更新题目完成状态
 * PUT /api/progress/problem/:progressId
 * status: 0=未完成, 1=已完成, 2=需复习
 */
export function updateProblemStatus(req, res, next) {
  try {
    const { progressId } = req.params;
    const { status } = req.body;

    if (status === undefined || ![0, 1, 2].includes(Number(status))) {
      return res.status(400).json(error(ErrorCodes.PARAM_ERROR, '状态值无效 (0=未完成, 1=已完成, 2=需复习)'));
    }

    // 验证权限
    const progress = queryOne(
      `SELECT pp.plan_day_id, sp.student_id 
       FROM problem_progress pp
       JOIN plan_days pd ON pp.plan_day_id = pd.id
       JOIN student_plans sp ON pd.student_plan_id = sp.id
       WHERE pp.id = ?`,
      [progressId]
    );

    if (!progress) {
      return res.status(404).json(error(ErrorCodes.NOT_FOUND, '进度记录不存在'));
    }

    if (req.user.role === 'student' && progress.student_id !== req.user.id) {
      return res.status(403).json(error(ErrorCodes.FORBIDDEN, '无权更新此进度'));
    }

    run(
      `UPDATE problem_progress SET status = ?, updated_at = unixepoch() WHERE id = ?`,
      [status, progressId]
    );

    return res.json(success(null, '题目状态已更新'));
  } catch (err) {
    next(err);
  }
}

/**
 * 标记视频为已观看
 * PUT /api/progress/video/:progressId/watch
 */
export function markVideoWatched(req, res, next) {
  try {
    const { progressId } = req.params;

    // 验证权限
    const progress = queryOne(
      `SELECT vp.plan_day_id, sp.student_id 
       FROM video_progress vp
       JOIN plan_days pd ON vp.plan_day_id = pd.id
       JOIN student_plans sp ON pd.student_plan_id = sp.id
       WHERE vp.id = ?`,
      [progressId]
    );

    if (!progress) {
      return res.status(404).json(error(ErrorCodes.NOT_FOUND, '视频进度记录不存在'));
    }

    if (req.user.role === 'student' && progress.student_id !== req.user.id) {
      return res.status(403).json(error(ErrorCodes.FORBIDDEN, '无权更新此视频状态'));
    }

    run(
      `UPDATE video_progress SET is_watched = 1, updated_at = unixepoch() WHERE id = ?`,
      [progressId]
    );

    return res.json(success(null, '视频已标记为已观看'));
  } catch (err) {
    next(err);
  }
}

/**
 * 标记学习日为已完成
 * POST /api/progress/day/:dayId/complete
 */
export function markDayComplete(req, res, next) {
  try {
    const { dayId } = req.params;

    // 验证权限
    if (req.user.role === 'student' && !checkPlanDayOwnership(dayId, req.user.id)) {
      return res.status(403).json(error(ErrorCodes.FORBIDDEN, '无权操作此学习日'));
    }

    // 将所有未完成题目标记为已完成
    run(
      `UPDATE problem_progress 
       SET status = 1, updated_at = unixepoch() 
       WHERE plan_day_id = ? AND status = 0`,
      [dayId]
    );

    // 将所有未观看视频标记为已观看
    run(
      `UPDATE video_progress 
       SET is_watched = 1, updated_at = unixepoch() 
       WHERE plan_day_id = ? AND is_watched = 0`,
      [dayId]
    );

    return res.json(success(null, '学习日已标记为完成'));
  } catch (err) {
    next(err);
  }
}

/**
 * 保存或更新每日笔记
 * POST /api/progress/day/:dayId/note
 */
export function saveNote(req, res, next) {
  try {
    const { dayId } = req.params;
    const { content } = req.body;

    // 验证权限
    if (req.user.role === 'student' && !checkPlanDayOwnership(dayId, req.user.id)) {
      return res.status(403).json(error(ErrorCodes.FORBIDDEN, '无权操作此学习日'));
    }

    // 检查是否已有笔记
    const existingNote = queryOne('SELECT id FROM day_notes WHERE plan_day_id = ?', [dayId]);

    if (existingNote) {
      // 更新笔记
      run(
        `UPDATE day_notes SET content = ?, updated_at = unixepoch() WHERE plan_day_id = ?`,
        [content || '', dayId]
      );
      return res.json(success(null, '笔记已更新'));
    } else {
      // 新建笔记
      const result = run(
        `INSERT INTO day_notes (plan_day_id, content) VALUES (?, ?)`,
        [dayId, content || '']
      );
      return res.json(success({ id: result.lastInsertRowid }, '笔记已保存'));
    }
  } catch (err) {
    next(err);
  }
}

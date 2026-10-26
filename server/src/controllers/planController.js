/**
 * 学习计划控制器
 * 处理学习计划的分配、列表查询、详情查看、日历视图、删除
 * assign 逻辑最关键：读取模板 → 创建 student_plan → 复制模板天数 → 创建进度记录
 */

import { query, queryOne, run, transaction, getDb } from '../models/db.js';
import { success, error, ErrorCodes } from '../utils/response.js';
import { formatDate, addDays } from '../utils/helpers.js';

/**
 * 从模板分配学习计划给学员
 * POST /api/plans/assign
 * 使用事务保证原子性
 */
export function assign(req, res, next) {
  try {
    const { student_id, template_id, start_date } = req.body;

    if (!student_id || !template_id || !start_date) {
      return res.status(400).json(error(ErrorCodes.PARAM_ERROR, '请提供学员ID、模板ID和开始日期'));
    }

    // 验证学员是否存在
    const student = queryOne('SELECT id FROM users WHERE id = ? AND role = ?', [student_id, 'student']);
    if (!student) {
      return res.status(404).json(error(ErrorCodes.NOT_FOUND, '学员不存在'));
    }

    // 验证模板是否存在
    const template = queryOne('SELECT id, days_count FROM plan_templates WHERE id = ?', [template_id]);
    if (!template) {
      return res.status(404).json(error(ErrorCodes.NOT_FOUND, '模板不存在'));
    }

    // 获取模板天数详情（包含题目ID和视频ID）
    const templateDays = query(
      `SELECT id, day_number, theme, is_rest_day FROM template_days WHERE template_id = ? ORDER BY day_number`,
      [template_id]
    );

    if (templateDays.length === 0) {
      return res.status(400).json(error(ErrorCodes.PARAM_ERROR, '模板内容为空，无法分配'));
    }

    // 使用事务保证原子性
    const result = transaction(() => {
      // 1. 创建学员学习计划
      const planResult = run(
        `INSERT INTO student_plans (student_id, template_id, start_date, status) VALUES (?, ?, ?, ?)`,
        [student_id, template_id, start_date, 'active']
      );
      const studentPlanId = planResult.lastInsertRowid;

      // 2. 为每一天创建 plan_days 记录
      for (const day of templateDays) {
        const dayDate = addDays(start_date, day.day_number - 1);
        const planDayResult = run(
          `INSERT INTO plan_days (student_plan_id, day_number, date, theme, is_rest_day) VALUES (?, ?, ?, ?, ?)`,
          [studentPlanId, day.day_number, dayDate, day.theme, day.is_rest_day]
        );
        const planDayId = planDayResult.lastInsertRowid;

        // 跳过休息天创建进度记录
        if (day.is_rest_day) continue;

        // 3. 获取当天的所有题目，创建 problem_progress 记录（初始状态为未完成）
        const problems = query(
          `SELECT id, title, description, difficulty, knowledge_tag, sort_order FROM problems WHERE template_day_id = ? ORDER BY sort_order`,
          [day.id]
        );
        for (const problem of problems) {
          run(
            `INSERT INTO problem_progress (plan_day_id, problem_id, status) VALUES (?, ?, ?)`,
            [planDayId, problem.id, 0]
          );
        }

        // 4. 获取当天的所有视频，创建 video_progress 记录
        const videos = query(
          `SELECT id, title, url, description, duration FROM videos WHERE template_day_id = ?`,
          [day.id]
        );
        for (const video of videos) {
          run(
            `INSERT INTO video_progress (plan_day_id, video_id, is_watched) VALUES (?, ?, ?)`,
            [planDayId, video.id, 0]
          );
        }

        // 5. 复制视频内容到 plan_videos（独立于模板）
        for (const video of videos) {
          run(
            `INSERT INTO plan_videos (plan_day_id, title, url, description, duration, is_watched) VALUES (?, ?, ?, ?, ?, ?)`,
            [planDayId, video.title || '', video.url || '', video.description || '', video.duration || '', 0]
          );
        }

        // 6. 复制题目内容到 plan_problems（独立于模板）
        for (const problem of problems) {
          run(
            `INSERT INTO plan_problems (plan_day_id, title, description, difficulty, knowledge_tag, sort_order, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [planDayId, problem.title || '', problem.description || '', problem.difficulty || 'medium', problem.knowledge_tag || '', problem.sort_order || 0, 0]
          );
        }
      }

      return { studentPlanId };
    });

    return res.json(
      success(
        {
          plan_id: result.studentPlanId,
          student_id,
          template_id,
          start_date,
          days_count: template.days_count,
        },
        '学习计划分配成功'
      )
    );
  } catch (err) {
    next(err);
  }
}

/**
 * 获取学习计划列表
 * GET /api/plans
 * 管理员：查看所有计划；学员：只看自己的
 */
export function list(req, res, next) {
  try {
    let sql = `
      SELECT 
        sp.id,
        sp.student_id,
        u.username as student_username,
        u.display_name as student_name,
        sp.display_name as plan_display_name,
        sp.template_id,
        pt.name as template_name,
        sp.start_date,
        sp.status,
        sp.created_at,
        COUNT(DISTINCT pd.id) as total_days,
        COUNT(DISTINCT CASE WHEN pd.is_rest_day = 1 THEN pd.id END) as rest_days,
        COUNT(DISTINCT CASE WHEN pd.completed_at IS NOT NULL AND pd.is_rest_day = 0 THEN pd.id END) as completed_days
      FROM student_plans sp
      JOIN users u ON sp.student_id = u.id
      JOIN plan_templates pt ON sp.template_id = pt.id
      LEFT JOIN plan_days pd ON pd.student_plan_id = sp.id
    `;

    const params = [];

    // 学员只能查看自己的计划
    if (req.user.role === 'student') {
      sql += ' WHERE sp.student_id = ?';
      params.push(req.user.id);
    }

    sql += ' GROUP BY sp.id ORDER BY sp.created_at DESC';

    const plans = query(sql, params);
    return res.json(success(plans));
  } catch (err) {
    next(err);
  }
}

/**
 * 获取学习计划详情
 * GET /api/plans/:id
 */
export function getDetail(req, res, next) {
  try {
    const { id } = req.params;

    // 根据角色过滤
    const plan = queryOne(
      `SELECT 
        sp.id, sp.student_id, u.username as student_username, u.display_name as student_name,
        sp.template_id, pt.name as template_name, pt.description as template_description,
        sp.start_date, sp.status, sp.created_at
       FROM student_plans sp
       JOIN users u ON sp.student_id = u.id
       JOIN plan_templates pt ON sp.template_id = pt.id
       WHERE sp.id = ?`,
      [id]
    );

    if (!plan) {
      return res.status(404).json(error(ErrorCodes.NOT_FOUND, '学习计划不存在'));
    }

    // 权限检查：学员只能查看自己的计划
    if (req.user.role === 'student' && plan.student_id !== req.user.id) {
      return res.status(403).json(error(ErrorCodes.FORBIDDEN, '无权查看此学习计划'));
    }

    // 获取计划天数列表（含完成统计）
    const days = query(
      `SELECT 
        pd.id, pd.day_number, pd.date, pd.theme, pd.is_rest_day,
        (SELECT COUNT(*) FROM problem_progress WHERE plan_day_id = pd.id AND status = 1) as completed_problems,
        (SELECT COUNT(*) FROM problem_progress WHERE plan_day_id = pd.id) as total_problems,
        (SELECT COUNT(*) FROM video_progress WHERE plan_day_id = pd.id AND is_watched = 1) as watched_videos,
        (SELECT COUNT(*) FROM video_progress WHERE plan_day_id = pd.id) as total_videos
       FROM plan_days pd
       WHERE pd.student_plan_id = ?
       ORDER BY pd.day_number`,
      [id]
    );

    return res.json(
      success({
        ...plan,
        days,
      })
    );
  } catch (err) {
    next(err);
  }
}

/**
 * 获取学习日历视图
 * GET /api/plans/:id/calendar
 */
export function getCalendar(req, res, next) {
  try {
    const { id } = req.params;

    const plan = queryOne('SELECT student_id FROM student_plans WHERE id = ?', [id]);
    if (!plan) {
      return res.status(404).json(error(ErrorCodes.NOT_FOUND, '学习计划不存在'));
    }

    // 权限检查
    if (req.user.role === 'student' && plan.student_id !== req.user.id) {
      return res.status(403).json(error(ErrorCodes.FORBIDDEN, '无权查看此学习计划'));
    }

    // 获取每天的详细进度（用于日历展示）
    const calendar = query(
      `SELECT 
        pd.id,
        pd.day_number,
        pd.date,
        pd.theme,
        pd.is_rest_day,
        CASE 
          WHEN pd.is_rest_day = 1 THEN 'rest'
          WHEN (SELECT COUNT(*) FROM problem_progress WHERE plan_day_id = pd.id AND status != 1) = 0
           AND (SELECT COUNT(*) FROM problem_progress WHERE plan_day_id = pd.id) > 0
           AND (SELECT COUNT(*) FROM video_progress WHERE plan_day_id = pd.id AND is_watched = 0) = 0
           AND (SELECT COUNT(*) FROM video_progress WHERE plan_day_id = pd.id) > 0
          THEN 'completed'
          WHEN (SELECT COUNT(*) FROM problem_progress WHERE plan_day_id = pd.id AND status = 1) > 0
            OR (SELECT COUNT(*) FROM video_progress WHERE plan_day_id = pd.id AND is_watched = 1) > 0
          THEN 'partial'
          ELSE 'pending'
        END as day_status
       FROM plan_days pd
       WHERE pd.student_plan_id = ?
       ORDER BY pd.day_number`,
      [id]
    );

    return res.json(success(calendar));
  } catch (err) {
    next(err);
  }
}

/**
 * 删除学习计划
 * DELETE /api/plans/:id
 */
export function remove(req, res, next) {
  try {
    const { id } = req.params;

    const plan = queryOne('SELECT student_id FROM student_plans WHERE id = ?', [id]);
    if (!plan) {
      return res.status(404).json(error(ErrorCodes.NOT_FOUND, '学习计划不存在'));
    }

    // 权限检查：学员只能删除自己的计划
    if (req.user.role === 'student' && plan.student_id !== req.user.id) {
      return res.status(403).json(error(ErrorCodes.FORBIDDEN, '无权删除此学习计划'));
    }

    run('DELETE FROM student_plans WHERE id = ?', [id]);

    return res.json(success(null, '学习计划已删除'));
  } catch (err) {
    next(err);
  }
}


// ============================================
// 学员计划日历与编辑
// ============================================

/**
 * 工具函数：安全转换 is_rest_day
 */
function toDbBool(val) {
  if (val === true || val === 1 || val === '1') return 1;
  if (val === false || val === 0 || val === '0') return 0;
  return 0;
}

function toInt(val, fallback = 0) {
  const n = parseInt(val, 10);
  return isNaN(n) ? fallback : n;
}

function toStr(val, fallback = '') {
  if (val === null || val === undefined) return fallback;
  return String(val);
}

/**
 * GET /plans/:id/calendar-full — 返回完整日历（含视频列表、题目列表及进度状态）
 * 管理员可查看任何计划，学员只能查看自己的
 */
export function getCalendarFull(req, res, next) {
  try {
    // 确保plan_days表有completed_at字段（兼容性处理）
    try {
      const planDayCols = query(`PRAGMA table_info(plan_days)`);
      if (!planDayCols.some((c) => c.name === 'completed_at')) {
        run(`ALTER TABLE plan_days ADD COLUMN completed_at INTEGER DEFAULT NULL`);
      }
    } catch (e) {
      console.error('[Migration] plan_days.completed_at 迁移失败:', e.message);
    }

    const { id } = req.params;

    // 验证计划存在并获取基本信息
    const plan = queryOne(
      `SELECT sp.id, sp.student_id, sp.template_id, pt.days_count
       FROM student_plans sp
       JOIN plan_templates pt ON sp.template_id = pt.id
       WHERE sp.id = ?`,
      [id]
    );
    if (!plan) {
      return res.status(404).json(error(ErrorCodes.NOT_FOUND, '学习计划不存在'));
    }

    // 权限检查
    if (req.user.role === 'student' && plan.student_id !== req.user.id) {
      return res.status(403).json(error(ErrorCodes.FORBIDDEN, '无权查看此学习计划'));
    }

    // 1. 获取所有 plan_days
    const planDays = query(
      `SELECT id, day_number, date, theme, is_rest_day FROM plan_days WHERE student_plan_id = ? ORDER BY day_number`,
      [id]
    );

    const planDayIds = planDays.map(d => d.id);

    // 2. 获取视频（从 plan_videos 独立表）
    let dayVideosRaw = [];
    if (planDayIds.length > 0) {
      const placeholders = planDayIds.map(() => '?').join(',');
      dayVideosRaw = query(
        `SELECT id, plan_day_id, title, url, description, duration, is_watched FROM plan_videos WHERE plan_day_id IN (${placeholders})`,
        planDayIds
      );
    }

    // 3. 获取题目（从 plan_problems 独立表）
    let dayProblemsRaw = [];
    if (planDayIds.length > 0) {
      const placeholders = planDayIds.map(() => '?').join(',');
      dayProblemsRaw = query(
        `SELECT id, plan_day_id, title, description, difficulty, knowledge_tag, sort_order, status FROM plan_problems WHERE plan_day_id IN (${placeholders})`,
        planDayIds
      );
    }

    // 4. 按天组装完整数据
    const calendarData = planDays.map(day => {
      const dayVideos = dayVideosRaw
        .filter(v => v.plan_day_id === day.id)
        .map(v => ({
          id: v.id,
          title: v.title,
          url: v.url,
          description: v.description,
          duration: v.duration,
          is_watched: !!v.is_watched,
        }));

      const dayProblems = dayProblemsRaw
        .filter(p => p.plan_day_id === day.id)
        .map(p => ({
          id: p.id,
          title: p.title,
          description: p.description,
          difficulty: p.difficulty,
          knowledge_tag: p.knowledge_tag,
          sort_order: p.sort_order,
          status: p.status === 0 ? 'uncompleted' : p.status === 1 ? 'completed' : p.status === 2 ? 'need_review' : 'uncompleted',
        }));

      // 计算完成状态
      const totalProblems = dayProblems.length;
      const completedProblems = dayProblems.filter(p => p.status === 'completed').length;
      const reviewProblems = dayProblems.filter(p => p.status === 'need_review').length;
      const totalVideos = dayVideos.length;
      const watchedVideos = dayVideos.filter(v => v.is_watched).length;

      // 检查是否手动标记过完成
      const isManuallyCompleted = queryOne(
        `SELECT completed_at FROM plan_days WHERE id = ? AND completed_at IS NOT NULL`,
        [day.id]
      );

      let dayStatus = 'pending';
      if (day.is_rest_day) {
        dayStatus = 'rest';
      } else if (isManuallyCompleted) {
        dayStatus = 'completed';
      } else if (completedProblems > 0 || watchedVideos > 0 || reviewProblems > 0) {
        dayStatus = 'partial';
      }

      return {
        planDayId: day.id,
        dayNumber: day.day_number,
        date: day.date,
        theme: day.theme,
        isRestDay: !!day.is_rest_day,
        status: dayStatus,
        videos: dayVideos,
        problems: dayProblems,
        completedProblems,
        totalProblems,
        watchedVideos,
        totalVideos,
      };
    });

    const studyDaysCount = planDays.filter(d => !d.is_rest_day).length;
    return res.json(success({
      planId: plan.id,
      templateId: plan.template_id,
      daysCount: plan.days_count,
      studyDaysCount,
      days: calendarData,
    }));
  } catch (err) {
    console.error('获取完整日历失败:', err);
    next(err);
  }
}

export function updateStudentPlanDay(req, res, next) {
  try {
    const { planId, dayNumber } = req.params;
    const { theme, is_rest_day, videos = [], problems = [] } = req.body;
    const dn = toInt(dayNumber);

    const plan = queryOne(
      `SELECT sp.id, sp.student_id FROM student_plans sp WHERE sp.id = ?`, [planId]
    );
    if (!plan) {
      return res.status(404).json(error(ErrorCodes.NOT_FOUND, '学习计划不存在'));
    }
    if (req.user.role === 'student' && plan.student_id !== req.user.id) {
      return res.status(403).json(error(ErrorCodes.FORBIDDEN, '无权修改此学习计划'));
    }

    const planDay = queryOne(
      `SELECT id, day_number, theme, is_rest_day FROM plan_days WHERE student_plan_id = ? AND day_number = ?`,
      [planId, dn]
    );
    if (!planDay) {
      return res.status(404).json(error(ErrorCodes.NOT_FOUND, '该天数不存在'));
    }

    const isRestDayNum = toDbBool(is_rest_day);

    const updatedDay = transaction(() => {
      // 1. 更新plan_days
      run(
        `UPDATE plan_days SET theme = ?, is_rest_day = ? WHERE id = ?`,
        [toStr(theme, planDay.theme), isRestDayNum, planDay.id]
      );

      // 2. 删除旧的plan_videos
      run(`DELETE FROM plan_videos WHERE plan_day_id = ?`, [planDay.id]);

      // 3. 删除旧的plan_problems
      run(`DELETE FROM plan_problems WHERE plan_day_id = ?`, [planDay.id]);

      // 4. 插入新的plan_videos
      const insertedVideos = [];
      if (Array.isArray(videos) && videos.length > 0) {
        videos.forEach((video) => {
          const result = run(
            `INSERT INTO plan_videos (plan_day_id, title, url, description, duration, is_watched) VALUES (?, ?, ?, ?, ?, ?)`,
            [planDay.id, toStr(video.title), toStr(video.url), toStr(video.description), toStr(video.duration), video.is_watched ? 1 : 0]
          );
          insertedVideos.push({
            id: result.lastInsertRowid,
            title: toStr(video.title),
            url: toStr(video.url),
            description: toStr(video.description),
            duration: toStr(video.duration),
            is_watched: !!video.is_watched,
          });
        });
      }

      // 5. 插入新的plan_problems
      const insertedProblems = [];
      if (Array.isArray(problems) && problems.length > 0) {
        problems.forEach((problem, index) => {
          const result = run(
            `INSERT INTO plan_problems (plan_day_id, title, description, difficulty, knowledge_tag, sort_order, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [planDay.id, toStr(problem.title), toStr(problem.description), toStr(problem.difficulty, 'medium'), toStr(problem.knowledge_tag), toInt(problem.sort_order, index + 1), toInt(problem.status, 0)]
          );
          insertedProblems.push({
            id: result.lastInsertRowid,
            title: toStr(problem.title),
            description: toStr(problem.description),
            difficulty: toStr(problem.difficulty, 'medium'),
            knowledge_tag: toStr(problem.knowledge_tag),
            sort_order: toInt(problem.sort_order, index + 1),
            status: toInt(problem.status, 0),
          });
        });
      }

      return {
        planDayId: planDay.id,
        dayNumber: dn,
        theme: toStr(theme, planDay.theme),
        is_rest_day: isRestDayNum === 1,
        videos: insertedVideos,
        problems: insertedProblems,
      };
    });

    return res.json(success(updatedDay, '学员计划天数更新成功'));
  } catch (err) {
    console.error('更新学员计划天数失败:', err);
    next(err);
  }
}

/**
 * PATCH /plans/:planId/days/:dayNumber/videos/:videoId - 更新视频观看状态
 * 学员可标记自己的视频为已观看/未观看
 */
export function updateVideoWatchStatus(req, res, next) {
  try {
    const { planId, dayNumber, videoId } = req.params;
    const { is_watched } = req.body;
    const dn = toInt(dayNumber);

    const plan = queryOne(
      `SELECT sp.id, sp.student_id FROM student_plans sp WHERE sp.id = ?`, [planId]
    );
    if (!plan) {
      return res.status(404).json(error(ErrorCodes.NOT_FOUND, '学习计划不存在'));
    }
    if (req.user.role === 'student' && plan.student_id !== req.user.id) {
      return res.status(403).json(error(ErrorCodes.FORBIDDEN, '无权修改此学习计划'));
    }

    const planDay = queryOne(
      `SELECT id FROM plan_days WHERE student_plan_id = ? AND day_number = ?`,
      [planId, dn]
    );
    if (!planDay) {
      return res.status(404).json(error(ErrorCodes.NOT_FOUND, '该天数不存在'));
    }

    // 验证视频是否属于该天
    const video = queryOne(
      `SELECT id FROM plan_videos WHERE id = ? AND plan_day_id = ?`,
      [videoId, planDay.id]
    );
    if (!video) {
      return res.status(404).json(error(ErrorCodes.NOT_FOUND, '视频不存在'));
    }

    run(
      `UPDATE plan_videos SET is_watched = ? WHERE id = ?`,
      [is_watched ? 1 : 0, videoId]
    );

    return res.json(success({ videoId, is_watched: !!is_watched }, '视频观看状态更新成功'));
  } catch (err) {
    console.error('更新视频观看状态失败:', err);
    next(err);
  }
}

/**
 * GET /plans/:planId/problem-stats - 获取学员计划的题目统计
 * 用于统计界面：未完成和需复习的题目列表
 */
export function getProblemStats(req, res, next) {
  try {
    const { planId } = req.params;

    const plan = queryOne(
      `SELECT sp.id, sp.student_id FROM student_plans sp WHERE sp.id = ?`, [planId]
    );
    if (!plan) {
      return res.status(404).json(error(ErrorCodes.NOT_FOUND, '学习计划不存在'));
    }
    if (req.user.role === 'student' && plan.student_id !== req.user.id) {
      return res.status(403).json(error(ErrorCodes.FORBIDDEN, '无权查看此学习计划'));
    }

    // 获取所有题目统计（直接从 plan_problems 表读取状态）
    const totalProblems = query(
      `SELECT 
         pprob.id, pprob.plan_day_id, pprob.title, pprob.description, 
         pprob.difficulty, pprob.knowledge_tag, pprob.sort_order, pprob.status,
         pd.day_number, pd.date
       FROM plan_problems pprob
       JOIN plan_days pd ON pprob.plan_day_id = pd.id
       WHERE pd.student_plan_id = ?
       ORDER BY pd.day_number, pprob.sort_order`,
      [planId]
    );

    // 按状态分组
    const reviewProblems = totalProblems.filter(p => p.status === 2);
    const uncompletedProblems = totalProblems.filter(p => p.status === 0 || p.status === null);
    const completedProblems = totalProblems.filter(p => p.status === 1);

    // 获取视频统计
    const totalVideos = query(
      `SELECT pv.id, pv.plan_day_id, pv.title, pv.is_watched, pd.day_number
       FROM plan_videos pv
       JOIN plan_days pd ON pv.plan_day_id = pd.id
       WHERE pd.student_plan_id = ?
       ORDER BY pd.day_number`,
      [planId]
    );
    const watchedVideos = totalVideos.filter(v => v.is_watched);

    // 获取天数统计
    const totalDays = query(
      `SELECT day_number, is_rest_day, completed_at IS NOT NULL as is_completed FROM plan_days WHERE student_plan_id = ?`,
      [planId]
    );
    const studyDays = totalDays.filter(d => !d.is_rest_day);
    const completedDays = studyDays.filter(d => d.is_completed);

    return res.json(success({
      // 题目统计
      totalProblemCount: totalProblems.length,
      completedProblemCount: completedProblems.length,
      uncompletedCount: uncompletedProblems.length,
      reviewCount: reviewProblems.length,
      completedProblems: completedProblems.map(p => ({ ...p, status: 'completed' })),
      reviewProblems: reviewProblems.map(p => ({ ...p, status: 'need_review' })),
      uncompletedProblems: uncompletedProblems.map(p => ({ ...p, status: 'uncompleted' })),
      // 视频统计
      totalVideoCount: totalVideos.length,
      watchedVideoCount: watchedVideos.length,
      unwatchedVideoCount: totalVideos.length - watchedVideos.length,
      videos: totalVideos,
      videoList: totalVideos,
      // 天数统计
      totalDayCount: totalDays.length,
      studyDayCount: studyDays.length,
      completedDayCount: completedDays.length,
      overallProgress: studyDays.length > 0 ? Math.round((completedDays.length / studyDays.length) * 100) : 0,
    }));
  } catch (err) {
    console.error('获取题目统计失败:', err);
    next(err);
  }
}

export function reorderPlanDays(req, res, next) {
  try {
    const { planId } = req.params;
    const { fromDay, toDay } = req.body;
    const from = toInt(fromDay);
    const to = toInt(toDay);

    if (from < 1 || to < 1 || from === to) {
      return res.status(400).json(error(ErrorCodes.PARAM_INVALID, '参数无效'));
    }

    // 验证计划存在（同时获取 start_date）
    const plan = queryOne(
      `SELECT sp.id, sp.student_id, sp.start_date, COUNT(pd.id) as days_count 
       FROM student_plans sp 
       LEFT JOIN plan_days pd ON pd.student_plan_id = sp.id 
       WHERE sp.id = ?`,
      [planId]
    );
    if (!plan) {
      return res.status(404).json(error(ErrorCodes.NOT_FOUND, '学习计划不存在'));
    }
    if (from > plan.days_count || to > plan.days_count) {
      return res.status(400).json(error(ErrorCodes.PARAM_INVALID, '天数编号超出范围'));
    }

    // 权限检查
    if (req.user.role === 'student' && plan.student_id !== req.user.id) {
      return res.status(403).json(error(ErrorCodes.FORBIDDEN, '无权修改此学习计划'));
    }

    const startDate = plan.start_date;

    transaction(() => {
      if (from < to) {
        // 向前移动
        run(
          `UPDATE plan_days SET day_number = ? WHERE student_plan_id = ? AND day_number = ?`,
          [-from, planId, from]
        );
        run(
          `UPDATE plan_days SET day_number = day_number - 1 WHERE student_plan_id = ? AND day_number > ? AND day_number <= ?`,
          [planId, from, to]
        );
        run(
          `UPDATE plan_days SET day_number = ? WHERE student_plan_id = ? AND day_number = ?`,
          [to, planId, -from]
        );
      } else {
        // 向后移动
        run(
          `UPDATE plan_days SET day_number = ? WHERE student_plan_id = ? AND day_number = ?`,
          [-from, planId, from]
        );
        run(
          `UPDATE plan_days SET day_number = day_number + 1 WHERE student_plan_id = ? AND day_number >= ? AND day_number < ?`,
          [planId, to, from]
        );
        run(
          `UPDATE plan_days SET day_number = ? WHERE student_plan_id = ? AND day_number = ?`,
          [to, planId, -from]
        );
      }

      // ===== 关键修复：拖拽后重新计算所有 plan_days 的 date =====
      const allDays = query(
        `SELECT id, day_number FROM plan_days WHERE student_plan_id = ? ORDER BY day_number`,
        [planId]
      );
      for (const day of allDays) {
        const newDate = startDate ? addDays(startDate, day.day_number - 1) : null;
        run(`UPDATE plan_days SET date = ? WHERE id = ?`, [newDate, day.id]);
      }
    });

    return res.json(success({ fromDay: from, toDay: to }, '计划天数重排成功'));
  } catch (err) {
    console.error('重排学员计划天数失败:', err);
    next(err);
  }
}


// ============================================
// 学员计划天数增删
// ============================================

/**
 * POST /plans/:planId/days/add - 在学员计划末尾增加一天
 * 新增一天（默认休息日），并返回完整日历
 */
export function addPlanDay(req, res, next) {
  try {
    const { planId } = req.params;

    // 验证计划存在并获取start_date
    const plan = queryOne(
      `SELECT sp.id, sp.student_id, sp.template_id, sp.start_date FROM student_plans sp WHERE sp.id = ?`,
      [planId]
    );
    if (!plan) {
      return res.status(404).json(error(ErrorCodes.NOT_FOUND, '学习计划不存在'));
    }

    // 权限检查
    if (req.user.role === 'student' && plan.student_id !== req.user.id) {
      return res.status(403).json(error(ErrorCodes.FORBIDDEN, '无权修改此学习计划'));
    }

    // 找到当前最大day_number
    const maxDay = queryOne(
      `SELECT MAX(day_number) as max_day FROM plan_days WHERE student_plan_id = ?`,
      [planId]
    );
    const newDayNumber = (maxDay?.max_day || 0) + 1;

    // 根据start_date计算新天数的date: date = start_date + (day_number - 1)
    const startDate = plan.start_date;
    const newDate = addDays(startDate, newDayNumber - 1);

    // 使用事务
    const result = transaction(() => {
      // 1. 插入新的plan_day（带正确date）
      const dayResult = run(
        `INSERT INTO plan_days (student_plan_id, day_number, date, theme, is_rest_day) VALUES (?, ?, ?, ?, ?)`,
        [planId, newDayNumber, newDate, `Day ${newDayNumber}`, 1]
      );
      const newDayId = dayResult.lastInsertRowid;

      // 2. 返回新天数数据
      const newDay = queryOne(
        `SELECT id, day_number, date, theme, is_rest_day FROM plan_days WHERE id = ?`,
        [newDayId]
      );

      return {
        id: newDay.id,
        planDayId: newDay.id,
        dayNumber: newDay.day_number,
        date: newDay.date,
        theme: newDay.theme,
        isRestDay: !!newDay.is_rest_day,
        is_rest_day: !!newDay.is_rest_day,
        status: 'rest',
        type: 'rest',
        videos: [],
        problems: [],
        totalVideos: 0,
        totalProblems: 0,
        completedProblems: 0,
        watchedVideos: 0,
      };
    });

    return res.json(success(result, '新增天数成功'));
  } catch (err) {
    console.error('新增天数失败:', err);
    next(err);
  }
}

/**
 * DELETE /plans/:planId/days/:dayNumber - 删除学员计划指定天数
 * 删除该天及其内容，后续天数前移
 */
export function deletePlanDay(req, res, next) {
  try {
    const { planId, dayNumber } = req.params;
    const dn = toInt(dayNumber);

    if (dn < 1) {
      return res.status(400).json(error(ErrorCodes.PARAM_INVALID, '天数编号必须大于0'));
    }

    // 验证计划存在
    const plan = queryOne(
      `SELECT sp.id, sp.student_id FROM student_plans sp WHERE sp.id = ?`,
      [planId]
    );
    if (!plan) {
      return res.status(404).json(error(ErrorCodes.NOT_FOUND, '学习计划不存在'));
    }

    // 权限检查
    if (req.user.role === 'student' && plan.student_id !== req.user.id) {
      return res.status(403).json(error(ErrorCodes.FORBIDDEN, '无权修改此学习计划'));
    }

    // 查找要删除的plan_day
    const planDay = queryOne(
      `SELECT id FROM plan_days WHERE student_plan_id = ? AND day_number = ?`,
      [planId, dn]
    );
    if (!planDay) {
      return res.status(404).json(error(ErrorCodes.NOT_FOUND, '该天数不存在'));
    }

    // 获取计划的start_date用于重新计算日期
    const planInfo = queryOne(
      `SELECT start_date FROM student_plans WHERE id = ?`,
      [planId]
    );
    const startDate = planInfo?.start_date;

    transaction(() => {
      // 1. 删除该天的plan_videos
      run(`DELETE FROM plan_videos WHERE plan_day_id = ?`, [planDay.id]);

      // 2. 删除该天的plan_problems
      run(`DELETE FROM plan_problems WHERE plan_day_id = ?`, [planDay.id]);

      // 3. 删除plan_day
      run(`DELETE FROM plan_days WHERE id = ?`, [planDay.id]);

      // 4. 后续天数前移，并重新计算date
      const daysToShift = query(
        `SELECT id, day_number FROM plan_days WHERE student_plan_id = ? AND day_number > ? ORDER BY day_number`,
        [planId, dn]
      );
      for (const day of daysToShift) {
        const newDayNumber = day.day_number - 1;
        const newDate = startDate ? addDays(startDate, newDayNumber - 1) : null;
        run(
          `UPDATE plan_days SET day_number = ?, date = ? WHERE id = ?`,
          [newDayNumber, newDate, day.id]
        );
      }
    });

    return res.json(success({ deletedDay: dn }, '删除天数成功'));
  } catch (err) {
    console.error('删除天数失败:', err);
    next(err);
  }
}


/**
 * 更新学员计划显示名称
 * PATCH /api/v1/plans/:planId/name
 */
export function updatePlanName(req, res, next) {
  try {
    const { planId } = req.params;
    const { name } = req.body;
    if (name !== undefined && name.trim && name.trim().length > 100) {
      return res.status(400).json(error(ErrorCodes.BAD_REQUEST, '计划名称不能超过100个字符'));
    }
    // 检查计划存在
    const existing = queryOne('SELECT id FROM student_plans WHERE id = ?', [planId]);
    if (!existing) {
      return res.status(404).json(error(ErrorCodes.NOT_FOUND, '学习计划不存在'));
    }
    const displayName = name && name.trim() ? name.trim() : null;
    run('UPDATE student_plans SET display_name = ? WHERE id = ?', [displayName, planId]);
    return res.json(success({ id: planId, display_name: displayName }, '计划名称更新成功'));
  } catch (err) {
    next(err);
  }
}

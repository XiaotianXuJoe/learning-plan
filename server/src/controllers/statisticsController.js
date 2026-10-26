/**
 * 统计控制器
 * 提供全局概览统计和学员个人进度统计
 */

import { query, queryOne } from '../models/db.js';
import { success, error, ErrorCodes } from '../utils/response.js';

/**
 * 获取全局概览统计
 * GET /api/statistics/overview
 */
export function getOverview(req, res, next) {
  try {
    // 获取筛选参数（最近N天注册的学员）
    const days = req.query.days ? parseInt(req.query.days, 10) : null;
    const timeFilter = days && days > 0 ? Math.floor(Date.now() / 1000) - days * 86400 : null;

    // 学员总数（可选按注册时间筛选）
    const studentCount = timeFilter
      ? queryOne(`SELECT COUNT(*) as count FROM users WHERE role = 'student' AND created_at >= ?`, [timeFilter])
      : queryOne(`SELECT COUNT(*) as count FROM users WHERE role = 'student'`);

    // 模板总数
    const templateCount = queryOne(`SELECT COUNT(*) as count FROM plan_templates`);

    // 学习计划总数
    const planCount = timeFilter
      ? queryOne(
          `SELECT COUNT(*) as count FROM student_plans sp JOIN users u ON sp.student_id = u.id WHERE u.role = 'student' AND u.created_at >= ?`,
          [timeFilter]
        )
      : queryOne(`SELECT COUNT(*) as count FROM student_plans`);

    // 活跃计划数
    const activePlanCount = timeFilter
      ? queryOne(
          `SELECT COUNT(*) as count FROM student_plans sp JOIN users u ON sp.student_id = u.id WHERE sp.status = 'active' AND u.role = 'student' AND u.created_at >= ?`,
          [timeFilter]
        )
      : queryOne(`SELECT COUNT(*) as count FROM student_plans WHERE status = 'active'`);

    // 题目完成统计（限定在筛选的学员范围内）
    const problemStats = timeFilter
      ? queryOne(
          `SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN pp.status = 1 THEN 1 END) as completed,
            COUNT(CASE WHEN pp.status = 2 THEN 1 END) as need_review
           FROM problem_progress pp
           JOIN plan_days pd ON pp.plan_day_id = pd.id
           JOIN student_plans sp ON pd.student_plan_id = sp.id
           JOIN users u ON sp.student_id = u.id
           WHERE u.role = 'student' AND u.created_at >= ?`,
          [timeFilter]
        )
      : queryOne(
          `SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN status = 1 THEN 1 END) as completed,
            COUNT(CASE WHEN status = 2 THEN 1 END) as need_review
           FROM problem_progress`
        );

    // 视频观看统计
    const videoStats = timeFilter
      ? queryOne(
          `SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN vp.is_watched = 1 THEN 1 END) as watched
           FROM video_progress vp
           JOIN plan_days pd ON vp.plan_day_id = pd.id
           JOIN student_plans sp ON pd.student_plan_id = sp.id
           JOIN users u ON sp.student_id = u.id
           WHERE u.role = 'student' AND u.created_at >= ?`,
          [timeFilter]
        )
      : queryOne(
          `SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN is_watched = 1 THEN 1 END) as watched
           FROM video_progress`
        );

    // 按知识点统计题目完成情况
    const knowledgeStats = timeFilter
      ? query(
          `SELECT 
            p.knowledge_tag,
            COUNT(*) as total_count,
            COUNT(CASE WHEN pp.status = 1 THEN 1 END) as completed_count
           FROM problems p
           JOIN problem_progress pp ON pp.problem_id = p.id
           JOIN plan_days pd ON pp.plan_day_id = pd.id
           JOIN student_plans sp ON pd.student_plan_id = sp.id
           JOIN users u ON sp.student_id = u.id
           WHERE p.knowledge_tag IS NOT NULL AND u.role = 'student' AND u.created_at >= ?
           GROUP BY p.knowledge_tag
           ORDER BY total_count DESC`,
          [timeFilter]
        )
      : query(
          `SELECT 
            p.knowledge_tag,
            COUNT(*) as total_count,
            COUNT(CASE WHEN pp.status = 1 THEN 1 END) as completed_count
           FROM problems p
           JOIN problem_progress pp ON pp.problem_id = p.id
           WHERE p.knowledge_tag IS NOT NULL
           GROUP BY p.knowledge_tag
           ORDER BY total_count DESC`
        );

    // 学员进度排行（按题目完成率排序，可选按注册时间筛选）
    const studentProgress = timeFilter
      ? query(
          `SELECT 
            u.id,
            u.username,
            u.display_name as name,
            COUNT(CASE WHEN pp.status = 1 THEN 1 END) as completed,
            COUNT(*) as total,
            CASE 
              WHEN COUNT(*) > 0 THEN ROUND(COUNT(CASE WHEN pp.status = 1 THEN 1 END) * 100.0 / COUNT(*), 0)
              ELSE 0
            END as percent
           FROM users u
           JOIN student_plans sp ON sp.student_id = u.id
           JOIN plan_days pd ON pd.student_plan_id = sp.id
           LEFT JOIN problem_progress pp ON pp.plan_day_id = pd.id
           WHERE u.role = 'student' AND u.created_at >= ?
           GROUP BY u.id
           ORDER BY percent DESC, completed DESC
           LIMIT 20`,
          [timeFilter]
        )
      : query(
          `SELECT 
            u.id,
            u.username,
            u.display_name as name,
            COUNT(CASE WHEN pp.status = 1 THEN 1 END) as completed,
            COUNT(*) as total,
            CASE 
              WHEN COUNT(*) > 0 THEN ROUND(COUNT(CASE WHEN pp.status = 1 THEN 1 END) * 100.0 / COUNT(*), 0)
              ELSE 0
            END as percent
           FROM users u
           JOIN student_plans sp ON sp.student_id = u.id
           JOIN plan_days pd ON pd.student_plan_id = sp.id
           LEFT JOIN problem_progress pp ON pp.plan_day_id = pd.id
           WHERE u.role = 'student'
           GROUP BY u.id
           ORDER BY percent DESC, completed DESC
           LIMIT 20`
        );

    return res.json(
      success({
        students: studentCount.count,
        templates: templateCount.count,
        plans: planCount.count,
        active_plans: activePlanCount.count,
        problems: {
          total: problemStats.total,
          completed: problemStats.completed,
          need_review: problemStats.need_review,
          completion_rate: problemStats.total > 0
            ? Math.round((problemStats.completed / problemStats.total) * 100)
            : 0,
        },
        videos: {
          total: videoStats.total,
          watched: videoStats.watched,
          watch_rate: videoStats.total > 0
            ? Math.round((videoStats.watched / videoStats.total) * 100)
            : 0,
        },
        by_knowledge: knowledgeStats,
        leaderboard: studentProgress,
        filter_days: days,
      })
    );
  } catch (err) {
    next(err);
  }
}

/**
 * 获取学员个人进度统计
 * GET /api/statistics/student/:studentId
 */
export function getStudentProgress(req, res, next) {
  try {
    const { studentId } = req.params;

    // 权限检查
    if (req.user.role === 'student' && Number(studentId) !== req.user.id) {
      return res.status(403).json(error(ErrorCodes.FORBIDDEN, '无权查看此学员的统计数据'));
    }

    // 验证学员
    const student = queryOne(
      `SELECT id, username, display_name FROM users WHERE id = ? AND role = 'student'`,
      [studentId]
    );
    if (!student) {
      return res.status(404).json(error(ErrorCodes.NOT_FOUND, '学员不存在'));
    }

    // 学员的学习计划列表
    const plans = query(
      `SELECT 
        sp.id, sp.start_date, sp.status,
        pt.name as template_name, pt.days_count
       FROM student_plans sp
       JOIN plan_templates pt ON sp.template_id = pt.id
       WHERE sp.student_id = ?
       ORDER BY sp.created_at DESC`,
      [studentId]
    );

    // 每个计划的进度详情
    const planProgress = [];
    for (const plan of plans) {
      const dayStats = queryOne(
        `SELECT 
          COUNT(*) as total_days,
          COUNT(CASE WHEN is_rest_day = 1 THEN 1 END) as rest_days
         FROM plan_days WHERE student_plan_id = ?`,
        [plan.id]
      );

      const problemStats = queryOne(
        `SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 1 THEN 1 END) as completed
         FROM problem_progress pp
         JOIN plan_days pd ON pp.plan_day_id = pd.id
         WHERE pd.student_plan_id = ?`,
        [plan.id]
      );

      const videoStats = queryOne(
        `SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN is_watched = 1 THEN 1 END) as watched
         FROM video_progress vp
         JOIN plan_days pd ON vp.plan_day_id = pd.id
         WHERE pd.student_plan_id = ?`,
        [plan.id]
      );

      planProgress.push({
        ...plan,
        days: dayStats,
        problems: problemStats,
        videos: videoStats,
        problem_completion_rate: problemStats.total > 0
          ? Math.round((problemStats.completed / problemStats.total) * 100)
          : 0,
        video_completion_rate: videoStats.total > 0
          ? Math.round((videoStats.watched / videoStats.total) * 100)
          : 0,
      });
    }

    // 按知识点统计该学员的题目完成情况
    const knowledgeStats = query(
      `SELECT 
        p.knowledge_tag,
        COUNT(*) as total,
        COUNT(CASE WHEN pp.status = 1 THEN 1 END) as completed
       FROM problems p
       JOIN problem_progress pp ON pp.problem_id = p.id
       JOIN plan_days pd ON pp.plan_day_id = pd.id
       JOIN student_plans sp ON pd.student_plan_id = sp.id
       WHERE sp.student_id = ? AND p.knowledge_tag IS NOT NULL
       GROUP BY p.knowledge_tag
       ORDER BY total DESC`,
      [studentId]
    );

    return res.json(
      success({
        student,
        plans: planProgress,
        knowledge_breakdown: knowledgeStats,
        total_plans: plans.length,
      })
    );
  } catch (err) {
    next(err);
  }
}

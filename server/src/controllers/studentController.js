/**
 * 学员管理控制器
 * 仅管理员可操作：列表查询、添加学员、删除学员
 */

import bcrypt from 'bcryptjs';
import { query, queryOne, run } from '../models/db.js';
import { success, error, ErrorCodes } from '../utils/response.js';

/**
 * 获取学员列表
 * GET /api/students
 */
export function list(req, res, next) {
  try {
    const students = query(
      `SELECT 
        u.id, u.username, u.display_name, u.created_at,
        COUNT(DISTINCT sp.id) as plan_count
       FROM users u
       LEFT JOIN student_plans sp ON sp.student_id = u.id
       WHERE u.role = 'student'
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    );

    return res.json(success(students));
  } catch (err) {
    next(err);
  }
}

/**
 * 添加学员
 * POST /api/students
 */
export function add(req, res, next) {
  try {
    const { username, display_name, password } = req.body;

    if (!username) {
      return res.status(400).json(error(ErrorCodes.PARAM_ERROR, '请输入用户名'));
    }

    // 验证用户名格式：支持中文、字母、数字、下划线，长度2-20
    if (!/^[一-龥a-zA-Z0-9_]{2,20}$/.test(username)) {
      return res.status(400).json(error(ErrorCodes.PARAM_ERROR, '用户名只能包含中文、字母、数字和下划线，长度2-20'));
    }

    // 检查用户名是否已存在
    const existing = queryOne('SELECT id FROM users WHERE username = ?', [username]);
    if (existing) {
      return res.status(409).json(error(ErrorCodes.ALREADY_EXISTS, '用户名已存在'));
    }

    // 生成密码哈希（默认密码 123456，或用户指定）
    const pwd = password || '123456';
    const passwordHash = bcrypt.hashSync(pwd, 10);

    const result = run(
      `INSERT INTO users (username, password_hash, role, display_name, created_at) VALUES (?, ?, ?, ?, ?)`,
      [username, passwordHash, 'student', display_name || username, Math.floor(Date.now() / 1000)]
    );

    return res.json(
      success(
        {
          id: result.lastInsertRowid,
          username,
          display_name: display_name || username,
        },
        '学员添加成功'
      )
    );
  } catch (err) {
    next(err);
  }
}

/**
 * 删除学员
 * DELETE /api/students/:id
 */
export function remove(req, res, next) {
  try {
    const { id } = req.params;

    // 检查学员是否存在
    const student = queryOne('SELECT id FROM users WHERE id = ? AND role = ?', [id, 'student']);
    if (!student) {
      return res.status(404).json(error(ErrorCodes.NOT_FOUND, '学员不存在'));
    }

    run('DELETE FROM users WHERE id = ?', [id]);

    return res.json(success(null, '学员删除成功'));
  } catch (err) {
    next(err);
  }
}

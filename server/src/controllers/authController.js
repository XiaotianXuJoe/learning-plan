/**
 * 认证控制器
 * 处理管理员登录、学员登录、获取当前用户信息
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config/auth.js';
import { queryOne } from '../models/db.js';
import { success, error, ErrorCodes } from '../utils/response.js';

/**
 * 管理员登录
 * 验证用户名密码，返回 JWT Token
 * POST /api/auth/admin-login
 */
export function adminLogin(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json(error(ErrorCodes.PARAM_ERROR, '请输入用户名和密码'));
    }

    // 查询管理员账户
    const user = queryOne(
      'SELECT id, username, password_hash, role, display_name FROM users WHERE username = ? AND role = ?',
      [username, 'admin']
    );

    if (!user) {
      return res.status(401).json(error(ErrorCodes.UNAUTHORIZED, '管理员账户不存在'));
    }

    // 验证密码
    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      return res.status(401).json(error(ErrorCodes.UNAUTHORIZED, '密码错误'));
    }

    // 生成 JWT Token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        displayName: user.display_name,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json(
      success(
        {
          token,
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
            displayName: user.display_name,
          },
        },
        '登录成功'
      )
    );
  } catch (err) {
    next(err);
  }
}

/**
 * 学员登录
 * 验证学员用户名是否存在，返回 JWT Token
 * POST /api/auth/student-login
 */
export function studentLogin(req, res, next) {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json(error(ErrorCodes.PARAM_ERROR, '请输入用户名'));
    }

    // 查询学员账户
    const user = queryOne(
      'SELECT id, username, password_hash, role, display_name FROM users WHERE username = ? AND role = ?',
      [username, 'student']
    );

    if (!user) {
      return res.status(401).json(error(ErrorCodes.UNAUTHORIZED, '学员账户不存在'));
    }

    // 生成 JWT Token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        displayName: user.display_name,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json(
      success(
        {
          token,
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
            displayName: user.display_name,
          },
        },
        '登录成功'
      )
    );
  } catch (err) {
    next(err);
  }
}

/**
 * 获取当前登录用户信息
 * GET /api/auth/me
 */
export function getMe(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json(error(ErrorCodes.UNAUTHORIZED, '未登录'));
    }

    return res.json(
      success({
        id: req.user.id,
        username: req.user.username,
        role: req.user.role,
        displayName: req.user.displayName,
      })
    );
  } catch (err) {
    next(err);
  }
}

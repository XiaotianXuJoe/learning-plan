/**
 * JWT 认证中间件
 * 验证请求中的 Bearer Token，并将解码后的用户信息附加到请求对象
 * 包含角色检查中间件：requireAdmin、requireStudent
 */

import jwt from 'jsonwebtoken';
import { JWT_SECRET, PUBLIC_ROUTES } from '../config/auth.js';
import { error, ErrorCodes } from '../utils/response.js';

/**
 * JWT 认证中间件
 * 从请求头中提取 Bearer Token 并验证
 */
export function authenticate(req, res, next) {
  // 检查是否为公开路由
  const path = req.path;
  if (PUBLIC_ROUTES.some((route) => path === route)) {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json(error(ErrorCodes.UNAUTHORIZED, '请先登录'));
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json(error(ErrorCodes.UNAUTHORIZED, '登录已过期，请重新登录'));
  }
}

/**
 * 管理员角色检查中间件
 * 确保当前用户为管理员
 */
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json(error(ErrorCodes.UNAUTHORIZED, '请先登录'));
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json(error(ErrorCodes.FORBIDDEN, '需要管理员权限'));
  }

  next();
}

/**
 * 学员角色检查中间件
 * 确保当前用户为学员
 */
export function requireStudent(req, res, next) {
  if (!req.user) {
    return res.status(401).json(error(ErrorCodes.UNAUTHORIZED, '请先登录'));
  }

  if (req.user.role !== 'student') {
    return res.status(403).json(error(ErrorCodes.FORBIDDEN, '需要学员权限'));
  }

  next();
}

/**
 * 可选认证中间件
 * 有 Token 则解析，没有也不阻止请求
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch {
      // Token 无效，但不阻止请求
    }
  }

  next();
}

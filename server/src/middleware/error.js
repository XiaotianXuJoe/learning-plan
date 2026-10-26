/**
 * 全局错误处理中间件
 * 捕获所有未被处理的异常，返回标准化的错误响应
 */

import { error, ErrorCodes } from '../utils/response.js';

/**
 * 全局错误处理中间件
 * @param {Error} err - 错误对象
 * @param {Request} req - Express 请求对象
 * @param {Response} res - Express 响应对象
 * @param {Function} next - 下一个中间件
 */
export function globalErrorHandler(err, req, res, next) {
  // 记录错误日志
  console.error(`[Error] ${req.method} ${req.path}`);
  console.error(`[Error] Message: ${err.message}`);
  console.error(`[Error] Stack: ${err.stack}`);

  // 处理特定类型的错误

  // JWT 验证错误
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(error(ErrorCodes.UNAUTHORIZED, '无效的认证令牌'));
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(error(ErrorCodes.UNAUTHORIZED, '认证令牌已过期'));
  }

  // SQLite 唯一约束冲突
  if (err.message && err.message.includes('UNIQUE constraint failed')) {
    return res.status(409).json(error(ErrorCodes.ALREADY_EXISTS, '数据已存在'));
  }

  // SQLite 外键约束冲突
  if (err.message && err.message.includes('FOREIGN KEY constraint failed')) {
    return res.status(400).json(error(ErrorCodes.PARAM_ERROR, '关联数据不存在'));
  }

  // 开发环境返回详细错误信息
  const isDev = process.env.NODE_ENV === 'development';
  const message = isDev ? err.message : '服务器内部错误';

  // 通用错误响应
  res.status(err.status || 500).json(error(ErrorCodes.UNKNOWN_ERROR, message));
}

/**
 * 处理 404 路由
 */
export function notFoundHandler(req, res) {
  res.status(404).json(error(ErrorCodes.NOT_FOUND, `路由不存在: ${req.method} ${req.path}`));
}

/**
 * 统一响应工具函数
 * 规范 API 返回格式：{ code, message, data }
 */

/**
 * 成功响应
 * @param {any} data - 返回数据
 * @param {string} message - 成功消息
 * @returns {object} 标准化响应对象
 */
export function success(data = null, message = 'success') {
  return {
    code: 0,
    message,
    data,
  };
}

/**
 * 错误响应
 * @param {number} code - 错误码
 * @param {string} message - 错误描述
 * @returns {object} 标准化错误响应对象
 */
export function error(code = 1001, message = '操作失败') {
  return {
    code,
    message,
    data: null,
  };
}

/**
 * 常用错误码定义
 */
export const ErrorCodes = {
  SUCCESS: 0,
  UNKNOWN_ERROR: 1001,
  PARAM_ERROR: 1002,
  UNAUTHORIZED: 1003,
  FORBIDDEN: 1004,
  NOT_FOUND: 1005,
  DB_ERROR: 1006,
  ALREADY_EXISTS: 1007,
};

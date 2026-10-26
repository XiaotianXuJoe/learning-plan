/**
 * JWT 认证配置模块
 * 从环境变量读取密钥，配置令牌过期时间为 24 小时
 */

export const JWT_SECRET = process.env.JWT_SECRET || 'learning-plan-secret-key-2024';
export const JWT_EXPIRES_IN = '24h';

// 公开路由，不需要 JWT 认证
// authenticate中间件注册在app.js的/api路径下，req.path不包含/api前缀
export const PUBLIC_ROUTES = [
  '/v1/auth/admin/login',
  '/v1/auth/student/login',
];

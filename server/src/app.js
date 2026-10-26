/**
 * Express 应用配置
 * 注册中间件、路由、全局错误处理
 */

import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { authenticate } from './middleware/auth.js';
import { globalErrorHandler, notFoundHandler } from './middleware/error.js';

const app = express();

// 1. CORS 跨域支持
app.use(cors());

// 2. 请求体解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 3. 请求日志中间件
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// 4. JWT 认证中间件（除公开路由外）
app.use('/api', authenticate);

// 5. 注册 API 路由
app.use('/api', routes);

// 6. 根路由
app.get('/', (req, res) => {
  res.json({
    code: 0,
    message: '学习计划管理系统 API 服务运行中',
    version: '1.0.0',
    docs: '所有 API 以 /api 为前缀',
  });
});

// 7. 404 路由处理
app.use(notFoundHandler);

// 8. 全局错误处理中间件（必须放在最后）
app.use(globalErrorHandler);

export default app;

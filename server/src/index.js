/**
 * 服务器入口文件
 * 加载环境变量、启动 Express 服务
 * 启动命令: node src/index.js
 */

import './config/env.js';
import app from './app.js';

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

app.listen(PORT, () => {
  console.log('========================================');
  console.log('  学习计划管理系统 API 服务已启动');
  console.log('========================================');
  console.log(`  环境: ${NODE_ENV}`);
  console.log(`  端口: ${PORT}`);
  console.log(`  地址: http://localhost:${PORT}`);
  console.log('========================================');
  console.log('  可用接口:');
  console.log(`  GET  http://localhost:${PORT}/`);
  console.log(`  POST http://localhost:${PORT}/api/auth/admin-login`);
  console.log(`  POST http://localhost:${PORT}/api/auth/student-login`);
  console.log(`  GET  http://localhost:${PORT}/api/auth/me`);
  console.log(`  GET  http://localhost:${PORT}/api/students`);
  console.log(`  GET  http://localhost:${PORT}/api/templates`);
  console.log(`  GET  http://localhost:${PORT}/api/plans`);
  console.log(`  GET  http://localhost:${PORT}/api/statistics/overview`);
  console.log('========================================');
});

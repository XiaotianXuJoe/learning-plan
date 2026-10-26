/**
 * 路由汇聚模块
 * 将所有子路由注册到主路由上
 */

import { Router } from 'express';
import authRoutes from './auth.js';
import studentRoutes from './students.js';
import templateRoutes from './templates.js';
import planRoutes from './plans.js';
import progressRoutes from './progress.js';
import statisticsRoutes from './statistics.js';

const router = Router();

// v1 API 路由
const v1Router = Router();

// 认证路由
v1Router.use('/auth', authRoutes);

// 学员管理路由（管理员）
v1Router.use('/students', studentRoutes);

// 模板管理路由（管理员）
v1Router.use('/templates', templateRoutes);

// 学习计划路由
v1Router.use('/plans', planRoutes);

// 进度管理路由
v1Router.use('/progress', progressRoutes);

// 统计路由
v1Router.use('/statistics', statisticsRoutes);

// 注册 v1 前缀
router.use('/v1', v1Router);

export default router;

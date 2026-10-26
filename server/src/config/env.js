/**
 * 环境变量加载模块
 * 确保在所有其他模块之前加载 .env 配置
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 从项目根目录加载 .env 文件
dotenv.config({ path: path.join(__dirname, '../../.env') });

console.log(`[Env] 环境变量已加载, NODE_ENV=${process.env.NODE_ENV || 'development'}`);

/**
 * 数据库配置模块
 * 使用 better-sqlite3 连接 SQLite 数据库
 * 自动创建 database 目录，启用 WAL 模式提升并发性能
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 数据库文件路径（从项目根目录计算）
const dbPath = process.env.DB_PATH || './database/data.sqlite';
const resolvedDbPath = path.isAbsolute(dbPath)
  ? dbPath
  : path.resolve(path.join(__dirname, '../../'), dbPath);

// 确保数据库目录存在
const dbDir = path.dirname(resolvedDbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// 创建数据库连接
const db = new Database(resolvedDbPath);

// 启用 WAL 模式，提升读写并发性能
db.pragma('journal_mode = WAL');

// 启用外键约束
db.pragma('foreign_keys = ON');

// 设置 busy timeout，避免并发冲突
db.pragma('busy_timeout = 5000');

console.log(`[Database] SQLite 数据库已连接: ${resolvedDbPath}`);

export default db;

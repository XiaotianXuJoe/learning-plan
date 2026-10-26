/**
 * 数据库操作封装模块
 * 对 better-sqlite3 进行封装，提供 query、run、transaction 等方法
 * 使用 ES Module 导入数据库连接
 */

import db from '../config/database.js';

/**
 * 执行查询语句（SELECT），返回所有结果
 * @param {string} sql - SQL 语句
 * @param {any[]} params - 查询参数
 * @returns {any[]} 查询结果数组
 */
export function query(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    return stmt.all(...params);
  } catch (error) {
    console.error('[DB Query Error]', error.message);
    console.error('[SQL]', sql);
    console.error('[Params]', params);
    throw error;
  }
}

/**
 * 执行查询语句（SELECT），返回单条结果
 * @param {string} sql - SQL 语句
 * @param {any[]} params - 查询参数
 * @returns {any|undefined} 单条查询结果
 */
export function queryOne(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    return stmt.get(...params);
  } catch (error) {
    console.error('[DB QueryOne Error]', error.message);
    console.error('[SQL]', sql);
    console.error('[Params]', params);
    throw error;
  }
}

/**
 * 执行非查询语句（INSERT/UPDATE/DELETE）
 * @param {string} sql - SQL 语句
 * @param {any[]} params - 执行参数
 * @returns {object} 执行结果信息 { changes, lastInsertRowid }
 */
export function run(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    const result = stmt.run(...params);
    return {
      changes: result.changes,
      lastInsertRowid: result.lastInsertRowid,
    };
  } catch (error) {
    console.error('[DB Run Error]', error.message);
    console.error('[SQL]', sql);
    console.error('[Params]', params);
    throw error;
  }
}

/**
 * 在事务中执行多个数据库操作
 * @param {Function} callback - 事务回调函数，接收 db 实例作为参数
 * @returns {any} 回调函数的返回值
 */
export function transaction(callback) {
  const tx = db.transaction((...args) => {
    return callback(...args);
  });
  return tx();
}

/**
 * 执行原始 SQL（用于批量操作）
 * @param {string} sql - SQL 语句
 */
export function exec(sql) {
  try {
    db.exec(sql);
  } catch (error) {
    console.error('[DB Exec Error]', error.message);
    throw error;
  }
}

/**
 * 获取数据库实例（用于需要直接操作的高级场景）
 * @returns {Database} better-sqlite3 数据库实例
 */
export function getDb() {
  return db;
}

/**
 * 关闭数据库连接
 */
export function close() {
  db.close();
  console.log('[Database] 数据库连接已关闭');
}

export default {
  query,
  queryOne,
  run,
  transaction,
  exec,
  getDb,
  close,
};

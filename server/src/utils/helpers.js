/**
 * 辅助工具函数集合
 * 包含日期格式化、唯一ID生成等通用功能
 */

/**
 * 生成唯一ID（基于时间戳 + 随机数）
 * @returns {string} 唯一标识符
 */
export function generateUniqueId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
}

/**
 * 格式化日期为 YYYY-MM-DD 字符串
 * @param {Date|string|number} date - 日期对象或时间戳
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date = new Date()) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 格式化日期时间为 YYYY-MM-DD HH:mm:ss 字符串
 * @param {Date|string|number} date - 日期对象或时间戳
 * @returns {string} 格式化后的日期时间字符串
 */
export function formatDateTime(date = new Date()) {
  const d = new Date(date);
  const dateStr = formatDate(d);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${dateStr} ${hours}:${minutes}:${seconds}`;
}

/**
 * 计算日期偏移后的新日期
 * @param {string} baseDate - 基础日期 (YYYY-MM-DD)
 * @param {number} offsetDays - 偏移天数
 * @returns {string} 偏移后的日期 (YYYY-MM-DD)
 */
export function addDays(baseDate, offsetDays) {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + offsetDays);
  return formatDate(d);
}

/**
 * 生成日期范围内的所有日期
 * @param {string} startDate - 开始日期 (YYYY-MM-DD)
 * @param {number} count - 天数
 * @returns {string[]} 日期数组
 */
export function generateDateRange(startDate, count) {
  const dates = [];
  for (let i = 0; i < count; i++) {
    dates.push(addDays(startDate, i));
  }
  return dates;
}

/**
 * 获取当前时间戳（秒级）
 * @returns {number} 当前 Unix 时间戳
 */
export function now() {
  return Math.floor(Date.now() / 1000);
}

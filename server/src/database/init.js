/**
 * 数据库初始化脚本
 * 执行建表 SQL + 插入种子数据
 * 运行命令: npm run init-db
 */

import '../config/env.js'; // 确保先加载环境变量
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 数据库文件路径
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
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log('[InitDB] 开始初始化数据库...');

// 读取并执行建表 SQL
const sqlPath = path.join(__dirname, 'init.sql');
const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

// 拆分并执行每条 SQL 语句
const statements = sqlContent
  .split(';')
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

for (const stmt of statements) {
  db.exec(stmt + ';');
}

console.log('[InitDB] 数据表创建完成');

// ============================================
// 插入种子数据
// ============================================

// 1. 插入管理员账户
const adminHash = bcrypt.hashSync('123456', 10);
const adminExists = db.prepare("SELECT id FROM users WHERE username = 'admin'").get();
if (!adminExists) {
  db.prepare(
    `INSERT INTO users (username, password_hash, role, display_name) VALUES (?, ?, ?, ?)`
  ).run('admin', adminHash, 'admin', '管理员');
  console.log('[InitDB] 管理员账户已创建 (admin / 123456)');
}

// 2. 插入知识点标签
const tags = [
  { name: '数组', color: '#3B82F6' },
  { name: '链表', color: '#10B981' },
  { name: '二叉树', color: '#F59E0B' },
  { name: '动态规划', color: '#EF4444' },
  { name: '贪心', color: '#8B5CF6' },
  { name: '回溯', color: '#EC4899' },
  { name: 'DFS/BFS', color: '#06B6D4' },
  { name: '排序', color: '#F97316' },
  { name: '字符串', color: '#14B8A6' },
  { name: '栈与队列', color: '#6366F1' },
  { name: '哈希表', color: '#84CC16' },
  { name: '图论', color: '#D946EF' },
];

const tagStmt = db.prepare(`INSERT OR IGNORE INTO knowledge_tags (name, color) VALUES (?, ?)`);
for (const tag of tags) {
  tagStmt.run(tag.name, tag.color);
}
console.log('[InitDB] 知识点标签已插入');

// 3. 插入示例学员
const studentPasswordHash = bcrypt.hashSync('123456', 10);

const students = [
  { username: 'zhangsan', display_name: '张三' },
  { username: 'lisi', display_name: '李四' },
];

for (const student of students) {
  const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(student.username);
  if (!exists) {
    db.prepare(
      `INSERT INTO users (username, password_hash, role, display_name) VALUES (?, ?, ?, ?)`
    ).run(student.username, studentPasswordHash, 'student', student.display_name);
  }
}
console.log('[InitDB] 示例学员已插入');

// 4. 插入示例模板：5天算法学习计划
const templateExists = db.prepare("SELECT id FROM plan_templates WHERE name = '5天算法学习计划'").get();
if (!templateExists) {
  const templateResult = db.prepare(
    `INSERT INTO plan_templates (name, description, days_count) VALUES (?, ?, ?)`
  ).run(
    '5天算法学习计划',
    '从零开始系统学习基础数据结构，涵盖数组、链表、栈、队列、二叉树等核心知识点。',
    5
  );
  const templateId = templateResult.lastInsertRowid;

  // 模板天数详情
  const dayThemes = [
    { day: 1, theme: '数组基础与双指针', rest: 0 },
    { day: 2, theme: '链表操作', rest: 0 },
    { day: 3, theme: '栈与队列', rest: 0 },
    { day: 4, theme: '二叉树遍历', rest: 0 },
    { day: 5, theme: '综合复习与测验', rest: 0 },
  ];

  for (const dt of dayThemes) {
    const dayResult = db.prepare(
      `INSERT INTO template_days (template_id, day_number, theme, is_rest_day) VALUES (?, ?, ?, ?)`
    ).run(templateId, dt.day, dt.theme, dt.rest);
    const dayId = dayResult.lastInsertRowid;

    // 为每天插入视频和题目
    switch (dt.day) {
      case 1: {
        db.prepare(
          `INSERT INTO videos (template_day_id, title, url, description, duration) VALUES (?, ?, ?, ?, ?)`
        ).run(
          dayId,
          '数组基础与双指针技巧',
          'https://example.com/videos/array-two-pointers',
          '讲解数组基本概念和双指针算法的核心思想',
          25
        );
        const problems = [
          { title: '两数之和', desc: '给定一个整数数组和一个目标值，找出数组中和为目标值的两个数。', diff: 'easy', tag: '数组', order: 1 },
          { title: '移除元素', desc: '给你一个数组和一个值，原地移除所有数值等于该值的元素。', diff: 'easy', tag: '数组', order: 2 },
          { title: '有序数组的平方', desc: '给你一个按非递减顺序排序的整数数组，返回每个数字的平方组成的新数组。', diff: 'easy', tag: '数组', order: 3 },
          { title: '长度最小的子数组', desc: '给定一个含有 n 个正整数的数组和一个正整数 target，找出该数组中满足其和 ≥ target 的长度最小的连续子数组。', diff: 'medium', tag: '数组', order: 4 },
          { title: '螺旋矩阵 II', desc: '给你一个正整数 n，生成一个包含 1 到 n² 所有元素，且元素按顺时针顺序螺旋排列的 n x n 正方形矩阵。', diff: 'medium', tag: '数组', order: 5 },
        ];
        const pStmt = db.prepare(
          `INSERT INTO problems (template_day_id, title, description, difficulty, knowledge_tag, sort_order) VALUES (?, ?, ?, ?, ?, ?)`
        );
        for (const p of problems) pStmt.run(dayId, p.title, p.desc, p.diff, p.tag, p.order);
        break;
      }
      case 2: {
        db.prepare(
          `INSERT INTO videos (template_day_id, title, url, description, duration) VALUES (?, ?, ?, ?, ?)`
        ).run(
          dayId,
          '链表基础操作详解',
          'https://example.com/videos/linked-list',
          '讲解单链表、双链表的基本结构和常用操作',
          30
        );
        const problems = [
          { title: '移除链表元素', desc: '给你一个链表的头节点和一个整数 val，删除链表中所有满足值为 val 的节点。', diff: 'easy', tag: '链表', order: 1 },
          { title: '设计链表', desc: '设计一个链表类，支持在头部、尾部、指定索引处插入和删除节点。', diff: 'medium', tag: '链表', order: 2 },
          { title: '反转链表', desc: '给你单链表的头节点，请你反转链表，并返回反转后的链表。', diff: 'easy', tag: '链表', order: 3 },
          { title: '两两交换链表中的节点', desc: '给你一个链表，两两交换其中相邻的节点，并返回交换后链表的头节点。', diff: 'medium', tag: '链表', order: 4 },
          { title: '删除链表的倒数第 N 个结点', desc: '给你一个链表，删除链表的倒数第 n 个结点，并且返回链表的头结点。', diff: 'medium', tag: '链表', order: 5 },
        ];
        const pStmt = db.prepare(
          `INSERT INTO problems (template_day_id, title, description, difficulty, knowledge_tag, sort_order) VALUES (?, ?, ?, ?, ?, ?)`
        );
        for (const p of problems) pStmt.run(dayId, p.title, p.desc, p.diff, p.tag, p.order);
        break;
      }
      case 3: {
        db.prepare(
          `INSERT INTO videos (template_day_id, title, url, description, duration) VALUES (?, ?, ?, ?, ?)`
        ).run(
          dayId,
          '栈与队列的原理与应用',
          'https://example.com/videos/stack-queue',
          '讲解栈和队列的数据结构特点及在实际编程中的应用',
          28
        );
        const problems = [
          { title: '用栈实现队列', desc: '请你仅使用两个栈实现先入先出队列。', diff: 'easy', tag: '栈与队列', order: 1 },
          { title: '用队列实现栈', desc: '请你仅使用两个队列实现一个后入先出（LIFO）的栈。', diff: 'easy', tag: '栈与队列', order: 2 },
          { title: '有效的括号', desc: `给定一个只包括 '('，')'，'{'，'}'，'['，']' 的字符串 s ，判断字符串是否有效。`, diff: 'easy', tag: '栈与队列', order: 3 },
          { title: '删除字符串中的所有相邻重复项', desc: '给出由小写字母组成的字符串 S，重复项删除操作会选择两个相邻且相同的字母，并删除它们。', diff: 'easy', tag: '栈与队列', order: 4 },
          { title: '逆波兰表达式求值', desc: '给你一个字符串数组 tokens，表示一个逆波兰表达式，请你计算该表达式的值。', diff: 'medium', tag: '栈与队列', order: 5 },
        ];
        const pStmt = db.prepare(
          `INSERT INTO problems (template_day_id, title, description, difficulty, knowledge_tag, sort_order) VALUES (?, ?, ?, ?, ?, ?)`
        );
        for (const p of problems) pStmt.run(dayId, p.title, p.desc, p.diff, p.tag, p.order);
        break;
      }
      case 4: {
        db.prepare(
          `INSERT INTO videos (template_day_id, title, url, description, duration) VALUES (?, ?, ?, ?, ?)`
        ).run(
          dayId,
          '二叉树遍历方法',
          'https://example.com/videos/binary-tree',
          '讲解二叉树的前序、中序、后序遍历以及层次遍历',
          35
        );
        const problems = [
          { title: '二叉树的前序遍历', desc: '给你二叉树的根节点，返回该二叉树的前序遍历结果。', diff: 'easy', tag: '二叉树', order: 1 },
          { title: '二叉树的中序遍历', desc: '给你二叉树的根节点，返回该二叉树的中序遍历结果。', diff: 'easy', tag: '二叉树', order: 2 },
          { title: '二叉树的后序遍历', desc: '给你二叉树的根节点，返回该二叉树的后序遍历结果。', diff: 'easy', tag: '二叉树', order: 3 },
          { title: '二叉树的层次遍历', desc: '给你二叉树的根节点，返回其节点值的层次遍历结果。', diff: 'medium', tag: '二叉树', order: 4 },
          { title: '对称二叉树', desc: '给你一个二叉树的根节点，检查它是否轴对称。', diff: 'easy', tag: '二叉树', order: 5 },
        ];
        const pStmt = db.prepare(
          `INSERT INTO problems (template_day_id, title, description, difficulty, knowledge_tag, sort_order) VALUES (?, ?, ?, ?, ?, ?)`
        );
        for (const p of problems) pStmt.run(dayId, p.title, p.desc, p.diff, p.tag, p.order);
        break;
      }
      case 5: {
        db.prepare(
          `INSERT INTO videos (template_day_id, title, url, description, duration) VALUES (?, ?, ?, ?, ?)`
        ).run(
          dayId,
          '算法综合复习',
          'https://example.com/videos/review',
          '回顾本周学习的关键知识点，解答常见疑惑',
          40
        );
        const problems = [
          { title: '每日温度', desc: '给定一个整数数组 temperatures，表示每天的温度，返回一个数组 answer，其中 answer[i] 是指对于第 i 天，下一个更高温度出现在几天后。', diff: 'medium', tag: '栈与队列', order: 1 },
          { title: '二叉树的最大深度', desc: '给定一个二叉树，找出其最大深度。', diff: 'easy', tag: '二叉树', order: 2 },
          { title: '合并两个有序数组', desc: '给你两个按非递减顺序排列的整数数组，请你合并第二个数组到第一个数组中。', diff: 'easy', tag: '数组', order: 3 },
        ];
        const pStmt = db.prepare(
          `INSERT INTO problems (template_day_id, title, description, difficulty, knowledge_tag, sort_order) VALUES (?, ?, ?, ?, ?, ?)`
        );
        for (const p of problems) pStmt.run(dayId, p.title, p.desc, p.diff, p.tag, p.order);
        break;
      }
    }
  }

  console.log('[InitDB] 示例模板「5天算法学习计划」已插入');
}

console.log('[InitDB] 数据库初始化完成！');
db.close();

/**
 * 模板控制器
 * 处理模板 CRUD、天数内容编辑
 */

import db from '../config/database.js';
import { ErrorCodes, success, error } from '../utils/response.js';

/**
 * 工具函数：执行查询返回单行
 */
function queryOne(sql, params) {
  return db.prepare(sql).get(...params);
}

/**
 * 工具函数：执行更新/插入
 */
function run(sql, params) {
  return db.prepare(sql).run(...params);
}

/**
 * 工具函数：执行事务
 */
function transaction(fn) {
  return db.transaction(fn)();
}

/**
 * 工具函数：安全转换 is_rest_day
 * SQLite 只接受 number (0/1)，不接受 boolean
 */
function toDbBool(val) {
  if (val === true || val === 1 || val === '1') return 1;
  if (val === false || val === 0 || val === '0') return 0;
  return 0;
}

/**
 * 工具函数：安全转换为整数
 */
function toInt(val, fallback = 0) {
  const n = parseInt(val, 10);
  return isNaN(n) ? fallback : n;
}

/**
 * 工具函数：安全转换为字符串
 */
function toStr(val, fallback = '') {
  if (val === null || val === undefined) return fallback;
  return String(val);
}

// ============================================
// CRUD
// ============================================

/**
 * GET /templates — 列表
 */
export function list(req, res, next) {
  try {
    const rows = db
      .prepare(
        `SELECT
           t.id, t.name, t.description, t.days_count,
           (SELECT COUNT(*) FROM student_plans WHERE template_id = t.id) AS usage_count,
           (SELECT COUNT(*) FROM template_days td JOIN problems p ON p.template_day_id = td.id WHERE td.template_id = t.id) AS total_problems,
           (SELECT COUNT(*) FROM template_days td JOIN videos v ON v.template_day_id = td.id WHERE td.template_id = t.id) AS total_videos
         FROM plan_templates t
         ORDER BY t.created_at DESC`
      )
      .all();
    return res.json(success({ templates: rows }));
  } catch (err) {
    next(err);
  }
}

/**
 * GET /templates/:id — 详情（含嵌套天数、视频、题目）
 */
export function getDetail(req, res, next) {
  try {
    const { id } = req.params;
    const template = queryOne(
      `SELECT id, name, description, days_count, created_at FROM plan_templates WHERE id = ?`,
      [id]
    );
    if (!template) {
      return res.status(404).json(error(ErrorCodes.NOT_FOUND, '模板不存在'));
    }

    // 查询所有天数
    const days = db
      .prepare(
        `SELECT id, day_number, theme, is_rest_day FROM template_days WHERE template_id = ? ORDER BY day_number`
      )
      .all(id);

    // 查询视频和题目
    const dayIds = days.map((d) => d.id);
    let videos = [];
    let problems = [];
    if (dayIds.length > 0) {
      const placeholders = dayIds.map(() => '?').join(',');
      videos = db
        .prepare(`SELECT id, template_day_id, title, url, description, duration FROM videos WHERE template_day_id IN (${placeholders})`)
        .all(...dayIds);
      problems = db
        .prepare(`SELECT id, template_day_id, title, description, difficulty, knowledge_tag, sort_order FROM problems WHERE template_day_id IN (${placeholders})`)
        .all(...dayIds);
    }

    // 按天数组装
    const daysWithContent = days.map((day) => ({
      ...day,
      is_rest_day: !!day.is_rest_day,
      videos: videos
        .filter((v) => v.template_day_id === day.id)
        .map(({ id, title, url, description, duration }) => ({ id, title, url, description, duration })),
      problems: problems
        .filter((p) => p.template_day_id === day.id)
        .map(({ id, title, description, difficulty, knowledge_tag, sort_order }) => ({
          id, title, description, difficulty, knowledge_tag, sort_order,
        })),
    }));

    return res.json(
      success({ ...template, days: daysWithContent })
    );
  } catch (err) {
    next(err);
  }
}

/**
 * POST /templates — 创建（同时自动创建空的 template_days）
 */
export function create(req, res, next) {
  try {
    const { name, description, days_count } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json(error(ErrorCodes.PARAM_INVALID, '模板名称不能为空'));
    }
    const dc = toInt(days_count, 30);
    if (dc < 1 || dc > 365) {
      return res.status(400).json(error(ErrorCodes.PARAM_INVALID, '天数范围 1~365'));
    }

    // 创建模板
    const result = run(
      `INSERT INTO plan_templates (name, description, days_count) VALUES (?, ?, ?)`,
      [name.trim(), toStr(description), dc]
    );
    const templateId = result.lastInsertRowid;

    // 自动创建空的 template_days 记录
    const insertDayStmt = db.prepare(
      `INSERT INTO template_days (template_id, day_number, theme, is_rest_day) VALUES (?, ?, ?, ?)`
    );
    const insertDays = db.transaction((tid, count) => {
      for (let i = 1; i <= count; i++) {
        insertDayStmt.run(tid, i, `第${i}天`, 0);
      }
    });
    insertDays(templateId, dc);

    return res.json(
      success({ id: templateId, name: name.trim(), days_count: dc }, '模板创建成功')
    );
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /templates/:id — 更新基本信息
 */
export function update(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description, days_count } = req.body;
    const existing = queryOne(`SELECT id FROM plan_templates WHERE id = ?`, [id]);
    if (!existing) {
      return res.status(404).json(error(ErrorCodes.NOT_FOUND, '模板不存在'));
    }
    run(
      `UPDATE plan_templates SET name = ?, description = ?, days_count = ? WHERE id = ?`,
      [toStr(name), toStr(description), toInt(days_count), id]
    );
    return res.json(success(null, '模板更新成功'));
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /templates/:id — 删除
 */
export function remove(req, res, next) {
  try {
    const { id } = req.params;
    const existing = queryOne(`SELECT id FROM plan_templates WHERE id = ?`, [id]);
    if (!existing) {
      return res.status(404).json(error(ErrorCodes.NOT_FOUND, '模板不存在'));
    }
    // 级联删除：先删 videos → problems → template_days → plan_template
    // 由于外键约束（ON DELETE CASCADE），只需删除 plan_templates 即可
    run(`DELETE FROM plan_templates WHERE id = ?`, [id]);
    return res.json(success(null, '模板删除成功'));
  } catch (err) {
    next(err);
  }
}

// ============================================
// 天数内容编辑
// ============================================

/**
 * PUT /templates/:id/days/:dayNumber — 更新某天内容
 *
 * 请求体:
 * {
 *   theme: string,
 *   is_rest_day: number (0/1),
 *   videos: [{ title, url, description, duration }],
 *   problems: [{ title, description, difficulty, knowledge_tag }]
 * }
 */
export function updateDay(req, res, next) {
  try {
    const { id, dayNumber } = req.params;
    const { theme, is_rest_day, videos = [], problems = [] } = req.body;

    // 校验模板是否存在
    const template = queryOne('SELECT id FROM plan_templates WHERE id = ?', [id]);
    if (!template) {
      return res.status(404).json(error(ErrorCodes.NOT_FOUND, '模板不存在'));
    }

    // 安全转换 is_rest_day: boolean/undefined → number (0/1)
    const isRestDayNum = toDbBool(is_rest_day);

    // 查找对应的 template_day 记录，如果不存在则自动创建
    let day = queryOne(
      `SELECT id, day_number, theme, is_rest_day FROM template_days WHERE template_id = ? AND day_number = ?`,
      [id, dayNumber]
    );

    let templateDayId;
    if (!day) {
      // 自动创建缺失的 template_day 记录
      const createResult = run(
        `INSERT INTO template_days (template_id, day_number, theme, is_rest_day) VALUES (?, ?, ?, ?)`,
        [id, dayNumber, toStr(theme, `第${dayNumber}天`), isRestDayNum]
      );
      templateDayId = createResult.lastInsertRowid;
    } else {
      templateDayId = day.id;
    }

    // 使用事务保证原子性：删除旧数据 -> 更新天数 -> 插入新数据
    const updatedDay = transaction(() => {
      // 1. 删除该天的旧 videos
      run(`DELETE FROM videos WHERE template_day_id = ?`, [templateDayId]);

      // 2. 删除该天的旧 problems
      run(`DELETE FROM problems WHERE template_day_id = ?`, [templateDayId]);

      // 3. 更新 template_days 的 theme 和 is_rest_day
      run(
        `UPDATE template_days SET theme = ?, is_rest_day = ? WHERE id = ?`,
        [toStr(theme, day?.theme), isRestDayNum, templateDayId]
      );

      // 4. 插入新的 videos
      const insertedVideos = [];
      if (Array.isArray(videos) && videos.length > 0) {
        const insertVideo = db.prepare(
          `INSERT INTO videos (template_day_id, title, url, description, duration) VALUES (?, ?, ?, ?, ?)`
        );
        videos.forEach((video) => {
          // 安全转换所有字段
          const vTitle = toStr(video.title);
          const vUrl = toStr(video.url);
          const vDesc = toStr(video.description);
          const vDuration = toInt(video.duration);

          const result = insertVideo.run(
            templateDayId, vTitle, vUrl, vDesc, vDuration
          );
          insertedVideos.push({
            id: result.lastInsertRowid,
            title: vTitle,
            url: vUrl,
            description: vDesc,
            duration: vDuration,
          });
        });
      }

      // 5. 插入新的 problems
      const insertedProblems = [];
      if (Array.isArray(problems) && problems.length > 0) {
        const insertProblem = db.prepare(
          `INSERT INTO problems (template_day_id, title, description, difficulty, knowledge_tag, sort_order) VALUES (?, ?, ?, ?, ?, ?)`
        );
        problems.forEach((problem, index) => {
          // 安全转换所有字段（knowledge_tag 兼容 topic 字段名）
          const pTitle = toStr(problem.title);
          const pDesc = toStr(problem.description);
          const pDiff = toStr(problem.difficulty, 'easy');
          const pTag = toStr(problem.knowledge_tag || problem.topic || problem.knowledgeTag);
          const pOrder = toInt(problem.sort_order, index + 1);

          const result = insertProblem.run(
            templateDayId, pTitle, pDesc, pDiff, pTag, pOrder
          );
          insertedProblems.push({
            id: result.lastInsertRowid,
            title: pTitle,
            description: pDesc,
            difficulty: pDiff,
            knowledge_tag: pTag,
            sort_order: pOrder,
          });
        });
      }

      // 6. 查询更新后的天数基本信息
      const dayInfo = queryOne(
        `SELECT id, day_number, theme, is_rest_day FROM template_days WHERE id = ?`,
        [templateDayId]
      );

      // 7. 返回更新后的完整天数数据
      return {
        ...dayInfo,
        is_rest_day: !!dayInfo.is_rest_day,
        videos: insertedVideos,
        problems: insertedProblems,
      };
    });

    return res.json(success(updatedDay, '更新成功'));
  } catch (err) {
    console.error('[updateDay Error]', err.message);
    next(err);
  }
}


// ============================================
// 增加/删除天数
// ============================================

/**
 * POST /templates/:id/days — 在模板末尾增加一天
 * 新增一天（默认设为休息日），并更新days_count
 */
export function addDay(req, res, next) {
  try {
    const { id } = req.params;

    // 校验模板是否存在
    const template = queryOne('SELECT id, days_count FROM plan_templates WHERE id = ?', [id]);
    if (!template) {
      return res.status(404).json(error(ErrorCodes.NOT_FOUND, '模板不存在'));
    }

    const newDayNumber = template.days_count + 1;

    // 使用事务：插入新天数 + 更新days_count
    const result = transaction(() => {
      // 1. 插入新的 template_day 记录（默认休息日）
      const dayResult = run(
        `INSERT INTO template_days (template_id, day_number, theme, is_rest_day) VALUES (?, ?, ?, ?)`,
        [id, newDayNumber, '休息日', 1]
      );
      const newDayId = dayResult.lastInsertRowid;

      // 2. 更新 plan_templates 的 days_count
      run(
        `UPDATE plan_templates SET days_count = ? WHERE id = ?`,
        [newDayNumber, id]
      );

      // 3. 返回新增天数数据
      const newDay = queryOne(
        `SELECT id, day_number, theme, is_rest_day FROM template_days WHERE id = ?`,
        [newDayId]
      );

      return {
        ...newDay,
        is_rest_day: !!newDay.is_rest_day,
        videos: [],
        problems: [],
      };
    });

    return res.json(success(result, '新增天数成功'));
  } catch (err) {
    console.error('新增天数失败:', err);
    next(err);
  }
}

/**
 * DELETE /templates/:id/days/:dayNumber — 删除指定天数
 * 删除该天及其内容，后续天数前移，days_count减1
 */
export function deleteDay(req, res, next) {
  try {
    const { id, dayNumber } = req.params;
    const dn = toInt(dayNumber);

    if (dn < 1) {
      return res.status(400).json(error(ErrorCodes.PARAM_INVALID, '天数编号必须大于0'));
    }

    // 校验模板是否存在
    const template = queryOne('SELECT id, days_count FROM plan_templates WHERE id = ?', [id]);
    if (!template) {
      return res.status(404).json(error(ErrorCodes.NOT_FOUND, '模板不存在'));
    }

    // 校验要删除的天数是否存在
    const dayToDelete = queryOne(
      `SELECT id FROM template_days WHERE template_id = ? AND day_number = ?`,
      [id, dn]
    );
    if (!dayToDelete) {
      return res.status(404).json(error(ErrorCodes.NOT_FOUND, '该天数不存在'));
    }

    // 使用事务保证原子性
    transaction(() => {
      // 1. 删除该天的 videos
      run(`DELETE FROM videos WHERE template_day_id = ?`, [dayToDelete.id]);

      // 2. 删除该天的 problems
      run(`DELETE FROM problems WHERE template_day_id = ?`, [dayToDelete.id]);

      // 3. 删除 template_day 记录
      run(`DELETE FROM template_days WHERE id = ?`, [dayToDelete.id]);

      // 4. 将该天之后的所有天数前移（day_number - 1）
      const daysToShift = db.prepare(
        `SELECT id, day_number FROM template_days WHERE template_id = ? AND day_number > ? ORDER BY day_number`
      ).all(id, dn);
      for (const day of daysToShift) {
        run(
          `UPDATE template_days SET day_number = ? WHERE id = ?`,
          [day.day_number - 1, day.id]
        );
      }

      // 5. 更新 plan_templates 的 days_count
      const newCount = Math.max(0, template.days_count - 1);
      run(
        `UPDATE plan_templates SET days_count = ? WHERE id = ?`,
        [newCount, id]
      );
    });

    return res.json(success({ deletedDay: dn, newDaysCount: Math.max(0, template.days_count - 1) }, '删除天数成功'));
  } catch (err) {
    console.error('删除天数失败:', err);
    next(err);
  }
}

// ============================================
// 天数重排（拖拽）
// ============================================

/**
 * POST /templates/:id/reorder-days - 重排模板天数
 * 请求体: { fromDay: number, toDay: number }
 * 将fromDay位置的天数移动到toDay位置，中间天数顺延
 */
export function reorderDays(req, res, next) {
  try {
    const { id } = req.params;
    const { fromDay, toDay } = req.body;
    const from = toInt(fromDay);
    const to = toInt(toDay);

    if (from < 1 || to < 1 || from === to) {
      return res.status(400).json(error(ErrorCodes.PARAM_INVALID, '参数无效'));
    }

    // 验证模板存在
    const template = queryOne('SELECT id, days_count FROM plan_templates WHERE id = ?', [id]);
    if (!template) {
      return res.status(404).json(error(ErrorCodes.NOT_FOUND, '模板不存在'));
    }
    if (from > template.days_count || to > template.days_count) {
      return res.status(400).json(error(ErrorCodes.PARAM_INVALID, '天数编号超出范围'));
    }

    transaction(() => {
      if (from < to) {
        // 向前移动: from → to
        // 1. 将from的day_number设为临时负值
        run(
          `UPDATE template_days SET day_number = ? WHERE template_id = ? AND day_number = ?`,
          [-from, id, from]
        );
        // 2. from+1 到 to 的所有天数前移1
        run(
          `UPDATE template_days SET day_number = day_number - 1 WHERE template_id = ? AND day_number > ? AND day_number <= ?`,
          [id, from, to]
        );
        // 3. 将临时值设为to
        run(
          `UPDATE template_days SET day_number = ? WHERE template_id = ? AND day_number = ?`,
          [to, id, -from]
        );
      } else {
        // 向后移动: from → to
        // 1. 将from的day_number设为临时负值
        run(
          `UPDATE template_days SET day_number = ? WHERE template_id = ? AND day_number = ?`,
          [-from, id, from]
        );
        // 2. to 到 from-1 的所有天数后移1
        run(
          `UPDATE template_days SET day_number = day_number + 1 WHERE template_id = ? AND day_number >= ? AND day_number < ?`,
          [id, to, from]
        );
        // 3. 将临时值设为to
        run(
          `UPDATE template_days SET day_number = ? WHERE template_id = ? AND day_number = ?`,
          [to, id, -from]
        );
      }
    });

    return res.json(success({ fromDay: from, toDay: to }, '天数重排成功'));
  } catch (err) {
    console.error('重排模板天数失败:', err);
    next(err);
  }
}

/**
 * POST /templates/:id/clone — 复制模板
 * 深拷贝：创建新模板，复制所有天数、视频、题目数据
 */
export function cloneTemplate(req, res, next) {
  try {
    const { id } = req.params;

    // 1. 获取原模板基本信息
    const sourceTemplate = queryOne(
      `SELECT id, name, description, days_count FROM plan_templates WHERE id = ?`,
      [id]
    );
    if (!sourceTemplate) {
      return res.status(404).json(error(ErrorCodes.NOT_FOUND, '模板不存在'));
    }

    // 2. 创建新模板
    const newName = `${sourceTemplate.name}（副本）`;
    const result = run(
      `INSERT INTO plan_templates (name, description, days_count) VALUES (?, ?, ?)`,
      [newName, sourceTemplate.description, sourceTemplate.days_count]
    );
    const newTemplateId = result.lastInsertRowid;

    // 3. 获取原模板的所有天数
    const sourceDays = db
      .prepare(`SELECT id, day_number, theme, is_rest_day FROM template_days WHERE template_id = ? ORDER BY day_number`)
      .all(id);

    // 4. 逐天复制：template_days -> videos -> problems
    const dayIdMap = {}; // source_day_id -> new_day_id

    for (const day of sourceDays) {
      // 复制 template_days
      const dayResult = run(
        `INSERT INTO template_days (template_id, day_number, theme, is_rest_day) VALUES (?, ?, ?, ?)`,
        [newTemplateId, day.day_number, day.theme, day.is_rest_day]
      );
      const newDayId = dayResult.lastInsertRowid;
      dayIdMap[day.id] = newDayId;

      // 复制 videos
      const sourceVideos = db
        .prepare(`SELECT title, url, description, duration FROM videos WHERE template_day_id = ?`)
        .all(day.id);
      for (const v of sourceVideos) {
        run(
          `INSERT INTO videos (template_day_id, title, url, description, duration) VALUES (?, ?, ?, ?, ?)`,
          [newDayId, v.title, v.url, v.description, v.duration]
        );
      }

      // 复制 problems
      const sourceProblems = db
        .prepare(`SELECT title, description, difficulty, knowledge_tag, sort_order FROM problems WHERE template_day_id = ?`)
        .all(day.id);
      for (const p of sourceProblems) {
        run(
          `INSERT INTO problems (template_day_id, title, description, difficulty, knowledge_tag, sort_order) VALUES (?, ?, ?, ?, ?, ?)`,
          [newDayId, p.title, p.description, p.difficulty, p.knowledge_tag, p.sort_order]
        );
      }
    }

    return res.json(success({ 
      id: newTemplateId, 
      name: newName, 
      days_count: sourceTemplate.days_count 
    }, '模板复制成功'));
  } catch (err) {
    console.error('复制模板失败:', err);
    next(err);
  }
}



/**
 * 更新模板名称
 * PATCH /api/v1/templates/:id/name
 */
export function updateName(req, res, next) {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json(error(ErrorCodes.BAD_REQUEST, '模板名称不能为空'));
    }
    const trimmed = name.trim();
    if (trimmed.length > 100) {
      return res.status(400).json(error(ErrorCodes.BAD_REQUEST, '模板名称不能超过100个字符'));
    }
    // 检查模板存在
    const existing = queryOne('SELECT id FROM plan_templates WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json(error(ErrorCodes.NOT_FOUND, '模板不存在'));
    }
    // 检查名称重复（排除自己）
    const dup = queryOne('SELECT id FROM plan_templates WHERE name = ? AND id != ?', [trimmed, id]);
    if (dup) {
      return res.status(400).json(error(ErrorCodes.BAD_REQUEST, '模板名称已存在'));
    }
    run('UPDATE plan_templates SET name = ? WHERE id = ?', [trimmed, id]);
    return res.json(success({ id, name: trimmed }, '模板名称更新成功'));
  } catch (err) {
    next(err);
  }
}

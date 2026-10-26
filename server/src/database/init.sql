-- ============================================
-- 学习计划管理系统 - 数据库初始化脚本
-- 共 13 张表
-- ============================================

-- 1. 用户表（管理员 + 学员）
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'student')),
  display_name TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

-- 2. 计划模板表
CREATE TABLE IF NOT EXISTS plan_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  days_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch())
);

-- 3. 模板天数表
CREATE TABLE IF NOT EXISTS template_days (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL,
  day_number INTEGER NOT NULL,
  theme TEXT,
  is_rest_day INTEGER NOT NULL DEFAULT 0 CHECK(is_rest_day IN (0, 1)),
  completed_at INTEGER DEFAULT NULL,
  FOREIGN KEY (template_id) REFERENCES plan_templates(id) ON DELETE CASCADE
);

-- 4. 视频表
CREATE TABLE IF NOT EXISTS videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_day_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  url TEXT,
  description TEXT,
  duration INTEGER DEFAULT 0,
  FOREIGN KEY (template_day_id) REFERENCES template_days(id) ON DELETE CASCADE
);

-- 5. 题目表
CREATE TABLE IF NOT EXISTS problems (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_day_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  difficulty TEXT CHECK(difficulty IN ('easy', 'medium', 'hard')),
  knowledge_tag TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (template_day_id) REFERENCES template_days(id) ON DELETE CASCADE
);

-- 6. 学员学习计划表
CREATE TABLE IF NOT EXISTS student_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  template_id INTEGER,
  start_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed', 'paused')),
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES plan_templates(id) ON DELETE SET NULL
);

-- 7. 计划天数表（学员学习计划的每日记录）
CREATE TABLE IF NOT EXISTS plan_days (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_plan_id INTEGER NOT NULL,
  day_number INTEGER NOT NULL,
  date TEXT NOT NULL,
  theme TEXT,
  is_rest_day INTEGER NOT NULL DEFAULT 0 CHECK(is_rest_day IN (0, 1)),
  completed_at INTEGER DEFAULT NULL,
  FOREIGN KEY (student_plan_id) REFERENCES student_plans(id) ON DELETE CASCADE
);

-- 8. 题目进度表
-- status: 0=未完成, 1=已完成, 2=需复习
CREATE TABLE IF NOT EXISTS problem_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_day_id INTEGER NOT NULL,
  problem_id INTEGER NOT NULL,
  status INTEGER NOT NULL DEFAULT 0 CHECK(status IN (0, 1, 2)),
  updated_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (plan_day_id) REFERENCES plan_days(id) ON DELETE CASCADE,
  FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
);

-- 9. 视频进度表
CREATE TABLE IF NOT EXISTS video_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_day_id INTEGER NOT NULL,
  video_id INTEGER NOT NULL,
  is_watched INTEGER NOT NULL DEFAULT 0 CHECK(is_watched IN (0, 1)),
  updated_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (plan_day_id) REFERENCES plan_days(id) ON DELETE CASCADE,
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
);

-- 10. 每日笔记表
CREATE TABLE IF NOT EXISTS day_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_day_id INTEGER NOT NULL,
  content TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (plan_day_id) REFERENCES plan_days(id) ON DELETE CASCADE
);

-- 11. 知识点标签表
CREATE TABLE IF NOT EXISTS knowledge_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#3B82F6'
);

-- ============================================
-- 索引优化
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_template_days_template_id ON template_days(template_id);
CREATE INDEX IF NOT EXISTS idx_videos_template_day_id ON videos(template_day_id);
CREATE INDEX IF NOT EXISTS idx_problems_template_day_id ON problems(template_day_id);
CREATE INDEX IF NOT EXISTS idx_problems_knowledge_tag ON problems(knowledge_tag);
CREATE INDEX IF NOT EXISTS idx_student_plans_student_id ON student_plans(student_id);
CREATE INDEX IF NOT EXISTS idx_plan_days_student_plan_id ON plan_days(student_plan_id);
CREATE INDEX IF NOT EXISTS idx_problem_progress_plan_day_id ON problem_progress(plan_day_id);
CREATE INDEX IF NOT EXISTS idx_video_progress_plan_day_id ON video_progress(plan_day_id);
CREATE INDEX IF NOT EXISTS idx_day_notes_plan_day_id ON day_notes(plan_day_id);


-- 12. 学员计划视频表（独立于模板）
CREATE TABLE IF NOT EXISTS plan_videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_day_id INTEGER NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  url TEXT DEFAULT '',
  description TEXT DEFAULT '',
  duration TEXT DEFAULT '',
  is_watched INTEGER NOT NULL DEFAULT 0 CHECK(is_watched IN (0, 1)),
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (plan_day_id) REFERENCES plan_days(id) ON DELETE CASCADE
);

-- 13. 学员计划题目表（独立于模板）
CREATE TABLE IF NOT EXISTS plan_problems (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_day_id INTEGER NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  difficulty TEXT DEFAULT 'medium' CHECK(difficulty IN ('easy', 'medium', 'hard')),
  knowledge_tag TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  status INTEGER NOT NULL DEFAULT 0 CHECK(status IN (0, 1, 2)),
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (plan_day_id) REFERENCES plan_days(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_plan_videos_plan_day_id ON plan_videos(plan_day_id);
CREATE INDEX IF NOT EXISTS idx_plan_problems_plan_day_id ON plan_problems(plan_day_id);

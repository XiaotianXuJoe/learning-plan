/**
 * 常量定义文件
 * 集中管理应用中的所有常量
 */

// 星期名称
export const WEEK_DAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

// 题目状态枚举
export const QUESTION_STATUS = {
  UNCOMPLETED: 'uncompleted',   // 未完成
  COMPLETED: 'completed',       // 已完成
  NEED_REVIEW: 'need_review',   // 需复习
}

// 题目状态配置（用于UI展示）
export const QUESTION_STATUS_CONFIG = {
  [QUESTION_STATUS.UNCOMPLETED]: {
    label: '未完成',
    color: 'bg-gray-100 text-gray-500 border-gray-200',
    dotColor: 'bg-gray-300',
  },
  [QUESTION_STATUS.COMPLETED]: {
    label: '已完成',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    dotColor: 'bg-emerald-500',
  },
  [QUESTION_STATUS.NEED_REVIEW]: {
    label: '需复习',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    dotColor: 'bg-amber-500',
  },
}

// 状态选项（用于下拉选择）
export const STATUS_OPTIONS = [
  { value: QUESTION_STATUS.UNCOMPLETED, label: '未完成', color: 'bg-gray-400' },
  { value: QUESTION_STATUS.COMPLETED, label: '已完成', color: 'bg-emerald-500' },
  { value: QUESTION_STATUS.NEED_REVIEW, label: '需复习', color: 'bg-amber-500' },
]

// 路由路径
export const ROUTES = {
  HOME: '/',
  ADMIN_LOGIN: '/admin/login',
  STUDENT_LOGIN: '/student/login',
  ADMIN_DASHBOARD: '/admin',
  STUDENT_CALENDAR: '/student',
}

// 存储键名
export const STORAGE_KEYS = {
  TOKEN: 'learning_plan_token',
  USER: 'learning_plan_user',
}

// HTTP状态码
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
}

// 日期卡片类型
export const DAY_CARD_TYPE = {
  NORMAL: 'normal',       // 正常学习日
  REST: 'rest',           // 休息日
  COMPLETED: 'completed', // 已完成
  IN_PROGRESS: 'in_progress', // 进行中
  NEED_REVIEW: 'need_review', // 需复习
}

// API基础路径
export const API_BASE = '/api/v1'

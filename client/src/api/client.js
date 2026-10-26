import { STORAGE_KEYS } from '../utils/constants'

/**
 * API 基础URL
 * 开发环境下通过Vite代理转发到 localhost:3001
 */
const BASE_URL = '/api/v1'

/**
 * 获取认证Token
 */
function getToken() {
  return localStorage.getItem(STORAGE_KEYS.TOKEN)
}

/**
 * 构建请求配置
 */
function buildConfig(options = {}) {
  const token = getToken()
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  }
  return config
}

/**
 * 统一请求处理
 */
async function request(url, options = {}) {
  const config = buildConfig(options)
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`

  try {
    const response = await fetch(fullUrl, config)

    // 处理401未授权 - token过期或无效
    if (response.status === 401) {
      localStorage.removeItem(STORAGE_KEYS.TOKEN)
      localStorage.removeItem(STORAGE_KEYS.USER)
      window.location.href = '/student/login'
      throw new Error('登录已过期，请重新登录')
    }

    // 解析响应数据
    let data
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      data = await response.json()
    } else {
      data = await response.text()
    }

    // 处理非2xx状态码
    if (!response.ok) {
      const errorMessage = data?.message || data?.error || `请求失败: ${response.status}`
      throw new Error(errorMessage)
    }

    return data
  } catch (error) {
    // 网络错误处理
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('网络连接失败，请检查网络设置')
    }
    throw error
  }
}

/**
 * API 客户端方法
 */
export const apiClient = {
  /**
   * GET 请求
   */
  get(url, params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const fullUrl = queryString ? `${url}?${queryString}` : url
    return request(fullUrl, { method: 'GET' })
  },

  /**
   * POST 请求
   */
  post(url, body = {}) {
    return request(url, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  /**
   * PUT 请求
   */
  put(url, body = {}) {
    return request(url, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  },

  /**
   * PATCH 请求
   */
  patch(url, body = {}) {
    return request(url, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },

  /**
   * DELETE 请求
   */
  delete(url) {
    return request(url, { method: 'DELETE' })
  },
}

/**
 * 认证相关API
 */
export const authApi = {
  /**
   * 管理员登录
   */
  adminLogin(username, password) {
    return apiClient.post('/auth/admin/login', { username, password })
  },

  /**
   * 学员登录
   */
  studentLogin(username) {
    return apiClient.post('/auth/student/login', { username })
  },

  /**
   * 获取当前用户信息
   */
  getCurrentUser() {
    return apiClient.get('/auth/me')
  },
}

/**
 * 模板相关API
 */
export const templateApi = {
  /**
   * 获取模板列表
   */
  getTemplates() {
    return apiClient.get('/templates')
  },

  /**
   * 获取模板详情
   */
  getTemplateById(id) {
    return apiClient.get(`/templates/${id}`)
  },

  /**
   * 创建模板
   */
  createTemplate(data) {
    return apiClient.post('/templates', data)
  },

  /**
   * 更新模板
   */
  updateTemplate(id, data) {
    return apiClient.put(`/templates/${id}`, data)
  },

  /**
   * 更新某天配置
   */
  updateDay(templateId, dayNumber, data) {
    return apiClient.put(`/templates/${templateId}/days/${dayNumber}`, data)
  },

  /**
   * 更新模板名称
   */
  updateName(templateId, name) {
    return apiClient.patch(`/templates/${templateId}/name`, { name })
  },

  /**
   * 删除模板
   */
  deleteTemplate(id) {
    return apiClient.delete(`/templates/${id}`)
  },

  /**
   * 增加一天
   */
  addDay(templateId) {
    return apiClient.post(`/templates/${templateId}/days`)
  },

  /**
   * 删除指定天数
   */
  deleteDay(templateId, dayNumber) {
    return apiClient.delete(`/templates/${templateId}/days/${dayNumber}`)
  },

  /**
   * 重排模板天数（拖拽）
   */
  reorderDays(templateId, fromDay, toDay) {
    return apiClient.post(`/templates/${templateId}/reorder-days`, { fromDay, toDay })
  },

  /**
   * 复制模板
   */
  cloneTemplate(id) {
    return apiClient.post(`/templates/${id}/clone`)
  },
}

/**
 * 学习计划相关API
 */
export const planApi = {
  /**
   * 获取所有学习计划
   */
  getPlans() {
    return apiClient.get('/plans')
  },

  /**
   * 更新学员计划显示名称
   */
  updateName(planId, name) {
    return apiClient.patch(`/plans/${planId}/name`, { name })
  },

  /**
   * 获取计划详情
   */
  getPlanById(planId) {
    return apiClient.get(`/plans/${planId}`)
  },

  /**
   * 获取日历数据
   */
  getCalendarData(planId, params = {}) {
    return apiClient.get(`/plans/${planId}/calendar`, params)
  },

  /**
   * 获取某天的详细数据
   */
  getDayDetail(planId, dayNumber) {
    return apiClient.get(`/plans/${planId}/days/${dayNumber}`)
  },

  /**
   * 更新题目状态
   */
  updateQuestionStatus(planId, dayNumber, questionId, status) {
    return apiClient.patch(`/plans/${planId}/days/${dayNumber}/questions/${questionId}`, {
      status,
    })
  },

  /**
   * 批量更新题目状态
   */
  batchUpdateStatus(planId, dayNumber, updates) {
    return apiClient.put(`/plans/${planId}/days/${dayNumber}/questions`, {
      updates,
    })
  },

  /**
   * 标记一天为完成
   */
  markDayComplete(planId, dayNumber) {
    return apiClient.post(`/plans/${planId}/days/${dayNumber}/complete`)
  },

  /**
   * 获取学习统计
   */
  getStatistics(planId) {
    return apiClient.get(`/plans/${planId}/statistics`)
  },

  /**
   * 分配学习计划给学员（管理员）
   */
  assignPlan(studentId, templateId, startDate) {
    return apiClient.post('/plans/assign', { student_id: studentId, template_id: templateId, start_date: startDate })
  },

  /**
   * 获取学员自己的学习计划列表
   */
  getStudentPlans() {
    return apiClient.get('/plans')
  },

  /**
   * 获取完整日历（含视频/题目详情及进度）
   */
  getCalendarFull(planId) {
    return apiClient.get(`/plans/${planId}/calendar-full`)
  },

  /**
   * 修改学员计划某天内容（管理员和学员均可）
   */
  updateStudentPlanDay(planId, dayNumber, data) {
    return apiClient.put(`/plans/${planId}/days/${dayNumber}`, data)
  },

  /**
   * 更新视频观看状态
   */
  updateVideoWatchStatus(planId, dayNumber, videoId, isWatched) {
    return apiClient.patch(`/plans/${planId}/days/${dayNumber}/videos/${videoId}`, { is_watched: isWatched })
  },

  /**
   * 获取题目统计（未完成和需复习）
   */
  getProblemStats(planId) {
    return apiClient.get(`/plans/${planId}/problem-stats`)
  },

  /**
   * 撤销一天完成状态
   */
  unmarkDayComplete(planId, dayNumber) {
    return apiClient.post(`/plans/${planId}/days/${dayNumber}/uncomplete`)
  },

  /**
   * 重排学员计划天数（拖拽）
   */
  reorderDays(planId, fromDay, toDay) {
    return apiClient.post(`/plans/${planId}/reorder-days`, { fromDay, toDay })
  },

  /**
   * 学员计划增加一天
   */
  addPlanDay(planId) {
    return apiClient.post(`/plans/${planId}/days/add`)
  },

  /**
   * 学员计划删除指定天数
   */
  deletePlanDay(planId, dayNumber) {
    return apiClient.delete(`/plans/${planId}/days/${dayNumber}`)
  },

  /**
   * 删除学员学习计划
   */
  deletePlan(planId) {
    return apiClient.delete(`/plans/${planId}`)
  },
}

/**
 * 学员相关API
 */
export const studentApi = {
  /**
   * 获取学员列表
   */
  getStudents() {
    return apiClient.get('/students')
  },

  /**
   * 添加学员
   * @param {string} username - 学员用户名
   */
  createStudent(username) {
    return apiClient.post('/students', { username })
  },

  /**
   * 删除学员
   * @param {number} id - 学员ID
   */
  deleteStudent(id) {
    return apiClient.delete(`/students/${id}`)
  },

  /**
   * 获取学员学习进度
   */
  getStudentProgress(studentId) {
    return apiClient.get(`/students/${studentId}/progress`)
  },
}

/**
 * 统计数据API
 */
export const statisticsApi = {
  /**
   * 获取全局概览统计
   * @param {number} days - 筛选最近N天注册的学员（可选）
   */
  getOverview(days) {
    const params = days ? { days } : {}
    return apiClient.get('/statistics/overview', params)
  },

  /**
   * 获取学员个人进度统计
   */
  getStudentProgress(studentId) {
    return apiClient.get(`/statistics/student/${studentId}`)
  },
}

export default apiClient

import { create } from 'zustand'
import { planApi } from '../api/client'

/**
 * 学习计划状态管理 Store
 * 管理学习计划、日历数据、题目状态等
 */
export const usePlanStore = create((set, get) => ({
  // ====== 状态 ======
  plans: [],                          // 所有学习计划
  currentPlan: null,                  // 当前选中的计划
  calendarData: [],                   // 日历数据（按天分组）
  currentStage: null,                 // 当前选中的阶段
  stages: [],                         // 所有阶段列表
  selectedDay: null,                  // 当前选中的日期
  isModalOpen: false,                 // 详情弹窗是否打开
  isLoading: false,                   // 全局加载状态
  error: null,                        // 错误信息
  statistics: {                       // 学习统计
    totalDays: 0,
    completedDays: 0,
    totalQuestions: 0,
    completedQuestions: 0,
    remainingDays: 0,
    progressPercent: 0,
  },

  // ====== 操作方法 ======
  /**
   * 设置加载状态
   */
  setLoading: (loading) => set({ isLoading: loading }),

  /**
   * 设置错误信息
   */
  setError: (error) => set({ error }),

  /**
   * 清除错误
   */
  clearError: () => set({ error: null }),

  /**
   * 获取所有学习计划
   */
  fetchPlans: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await planApi.getPlans()
      const plans = data.plans || data || []
      set({ plans, isLoading: false })
      return plans
    } catch (error) {
      set({ error: error.message, isLoading: false })
      return []
    }
  },

  /**
   * 设置当前计划
   */
  setCurrentPlan: (plan) => {
    set({ currentPlan: plan })
    // 提取阶段列表
    if (plan && plan.stages) {
      set({ stages: plan.stages, currentStage: plan.stages[0] || null })
    }
  },

  /**
   * 获取日历数据
   */
  fetchCalendar: async (planId) => {
    if (!planId) return
    set({ isLoading: true, error: null })
    try {
      const data = await planApi.getCalendarData(planId)
      const calendarData = data.calendar || data.days || data || []
      const stages = data.stages || get().stages || []
      set({
        calendarData,
        stages,
        currentStage: stages[0] || get().currentStage,
        isLoading: false,
      })
      return calendarData
    } catch (error) {
      console.error('获取学员计划列表失败:', error)
      set({ error: error.message, isLoading: false })
      return []
    }
  },

  /**
   * 切换当前阶段
   */
  setCurrentStage: (stage) => {
    set({ currentStage: stage })
  },

  /**
   * 打开日期详情弹窗
   */
  openDayModal: (dayData) => {
    set({ selectedDay: dayData, isModalOpen: true })
  },

  /**
   * 关闭日期详情弹窗
   */
  closeDayModal: () => {
    set({ selectedDay: null, isModalOpen: false })
  },

  /**
   * 更新题目状态
   */
  updateQuestionStatus: async (planId, dayNumber, questionId, status) => {
    // 1. 先调用API保存到后端
    await planApi.updateQuestionStatus(planId, dayNumber, questionId, status)

    // 2. API成功后，更新本地状态（确保UI与后端一致）
    const { selectedDay, calendarData } = get()
    // 兼容 questions 和 problems 两种字段名
    const questionsField = selectedDay?.questions ? 'questions' : selectedDay?.problems ? 'problems' : null
    if (selectedDay && questionsField) {
      const updatedQuestions = selectedDay[questionsField].map(q =>
        q.id === questionId ? { ...q, status } : q
      )
      set({
        selectedDay: { ...selectedDay, [questionsField]: updatedQuestions },
      })
    }
    // 更新日历数据中对应题目的状态
    const updatedCalendar = calendarData.map(day => {
      const dayField = day.questions ? 'questions' : day.problems ? 'problems' : null
      if (day.dayNumber === dayNumber && dayField) {
        return {
          ...day,
          [dayField]: day[dayField].map(q =>
            q.id === questionId ? { ...q, status } : q
          ),
        }
      }
      return day
    })
    set({ calendarData: updatedCalendar })
    // 重新计算统计
    get().calculateLocalStats()
  },

  /**
   * 标记一天为完成
   */
  // 标记/撤销一天完成（toggle）
  markDayComplete: async (planId, dayNumber) => {
    if (!planId || !dayNumber) return false
    const { selectedDay, calendarData } = get()
    const isCurrentlyCompleted = selectedDay?.status === 'completed' || selectedDay?.isCompleted
    try {
      if (isCurrentlyCompleted) {
        // 撤销完成
        await planApi.unmarkDayComplete(planId, dayNumber)
        if (selectedDay) {
          set({
            selectedDay: {
              ...selectedDay,
              isCompleted: false,
              status: 'partial',
            },
          })
        }
        const updatedCalendar = calendarData.map(day =>
          day.dayNumber === dayNumber
            ? { ...day, isCompleted: false, status: 'partial', type: 'in_progress' }
            : day
        )
        set({ calendarData: updatedCalendar })
      } else {
        // 标记完成
        await planApi.markDayComplete(planId, dayNumber)
        if (selectedDay) {
          set({
            selectedDay: {
              ...selectedDay,
              isCompleted: true,
              status: 'completed',
            },
          })
        }
        const updatedCalendar = calendarData.map(day =>
          day.dayNumber === dayNumber
            ? { ...day, isCompleted: true, status: 'completed', type: 'completed' }
            : day
        )
        set({ calendarData: updatedCalendar })
      }
      get().calculateLocalStats()
      return true
    } catch (error) {
      console.error('标记/撤销完成失败:', error)
      return false
    }
  },

  /**
   * 获取学习统计
   */
  fetchStatistics: async (planId) => {
    if (!planId) return
    try {
      const data = await planApi.getStatistics(planId)
      set({ statistics: data })
    } catch (error) {
      // 使用本地数据计算统计
      get().calculateLocalStats()
    }
  },

  // 更新视频观看状态
  updateVideoWatchStatus: async (planId, dayNumber, videoId, isWatched) => {
    try {
      await planApi.updateVideoWatchStatus(planId, dayNumber, videoId, isWatched)
      // 更新本地状态
      const { selectedDay, calendarData } = get()
      if (selectedDay && selectedDay.videos) {
        const updatedVideos = selectedDay.videos.map(v =>
          v.id === videoId ? { ...v, is_watched: isWatched } : v
        )
        set({ selectedDay: { ...selectedDay, videos: updatedVideos } })
      }
      // 更新calendarData
      if (selectedDay) {
        const updatedCalendar = calendarData.map(day => {
          if (day.dayNumber === dayNumber && day.videos) {
            return {
              ...day,
              videos: day.videos.map(v => v.id === videoId ? { ...v, is_watched: isWatched } : v)
            }
          }
          return day
        })
        set({ calendarData: updatedCalendar })
      }
      get().calculateLocalStats()
      return true
    } catch (error) {
      console.error('更新视频状态失败:', error)
      return false
    }
  },

  // 获取题目统计
  fetchProblemStats: async (planId) => {
    try {
      const res = await planApi.getProblemStats(planId)
      return res.data || res
    } catch (error) {
      console.error('获取题目统计失败:', error)
      return { reviewProblems: [], uncompletedProblems: [] }
    }
  },

  /**
   * 新增一天到学员计划末尾
   */
  addPlanDay: async (planId) => {
    try {
      const res = await planApi.addPlanDay(planId)
      return res.data || res
    } catch (error) {
      console.error('新增一天失败:', error)
      throw error
    }
  },

  /**
   * 删除学员计划指定天数
   */
  deletePlanDay: async (planId, dayNumber) => {
    try {
      const res = await planApi.deletePlanDay(planId, dayNumber)
      return res.data || res
    } catch (error) {
      console.error('删除天数失败:', error)
      throw error
    }
  },

  /**
   * 使用本地数据计算统计
   */
  calculateLocalStats: () => {
    const { calendarData } = get()
    // 排除休息日计算进度
    const studyDays = calendarData.filter(d => !d.isRestDay)
    const totalStudyDays = studyDays.length
    const completedDays = studyDays.filter(d => d.isCompleted || d.status === 'completed').length
    const totalQuestions = calendarData.reduce((sum, d) => sum + (d.questionCount || 0), 0)
    const completedQuestions = calendarData.reduce((sum, d) => {
      const field = d.questions ? 'questions' : d.problems ? 'problems' : null
      if (!field) return sum
      return sum + d[field].filter(q => q.status === 'completed' || q.status === 1).length
    }, 0)
    const remainingDays = totalStudyDays - completedDays
    const progressPercent = totalStudyDays > 0 ? Math.round((completedDays / totalStudyDays) * 100) : 0

    set({
      statistics: {
        totalDays: totalStudyDays,
        completedDays,
        totalQuestions,
        completedQuestions,
        remainingDays,
        progressPercent,
      },
    })
  },


  /**
   * 获取学员自己的学习计划列表
   */
  fetchStudentPlans: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await planApi.getStudentPlans()
      const plans = data.data || data.plans || data || []
      set({ plans, isLoading: false })
      // 始终选择最新创建的计划作为当前计划（plans 按 created_at DESC 排序）
      if (plans.length > 0) {
        set({ currentPlan: plans[0] })
      }
      return plans
    } catch (error) {
      set({ error: error.message, isLoading: false })
      return []
    }
  },

  /**
   * 获取学员计划的完整日历（含视频/题目详情）
   */
  fetchStudentCalendarFull: async (planId) => {
    if (!planId) return
    set({ isLoading: true, error: null })
    try {
      const data = await planApi.getCalendarFull(planId)
      const result = data.data || data
      const days = result.days || []
      // 转换数据格式以适配现有CalendarGrid组件
      const calendarData = days.map(day => ({
        dayNumber: day.dayNumber,
        date: day.date,
        dateDisplay: day.date ? new Date(day.date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }) : `Day ${day.dayNumber}`,
        isRestDay: day.isRestDay,
        isCompleted: day.status === 'completed',
        status: day.status,
        theme: day.theme,
        topic: day.theme,
        stageId: 1,
        stageName: '学习计划',
        type: day.status === 'rest' ? 'rest' : day.status === 'completed' ? 'completed' : day.status === 'partial' ? 'in_progress' : 'normal',
        questionCount: day.totalProblems || 0,
        completedProblems: day.completedProblems || 0,
        watchedVideos: day.watchedVideos || 0,
        totalVideos: day.totalVideos || 0,
        duration: 60,
        videos: day.videos || [],
        problems: (day.problems || []).map(p => ({
          id: p.id,
          title: p.title,
          description: p.description,
          difficulty: p.difficulty,
          topic: p.knowledge_tag || '未分类',
          knowledge_tag: p.knowledge_tag,
          status: p.status || 'uncompleted',
          sort_order: p.sort_order,
        })),
      }))
      // 同步更新 selectedDay（如果弹窗打开），实现编辑后立即刷新
      const { selectedDay } = get()
      const updatedSelectedDay = selectedDay
        ? calendarData.find(d => d.dayNumber === selectedDay.dayNumber)
        : null

      set({
        calendarData,
        isLoading: false,
        ...(updatedSelectedDay && { selectedDay: updatedSelectedDay }),
      })
      // 重新计算统计
      get().calculateLocalStats()
      return calendarData
    } catch (error) {
      console.error('获取学员日历失败:', error)
      set({ error: error.message, isLoading: false })
      return []
    }
  },

  /**
   * 保存学员计划某天内容
   */
  saveStudentPlanDay: async (planId, dayNumber, dayData) => {
    try {
      const res = await planApi.updateStudentPlanDay(planId, dayNumber, dayData)
      if (res.code === 0) {
        // 刷新日历数据
        await get().fetchStudentCalendarFull(planId)
        return true
      }
      return false
    } catch (error) {
      console.error('保存学员计划天数失败:', error)
      return false
    }
  },

  /**
   * 加载演示数据（当API不可用时）
   */
  loadDemoData: () => {
    const demoData = generateDemoData()
    set({
      calendarData: demoData.calendarData,
      stages: demoData.stages,
      currentStage: demoData.stages[0],
      currentPlan: demoData.plan,
      statistics: demoData.statistics,
    })
  },
}))

/**
 * 生成演示数据
 */
function generateDemoData() {
  const stages = [
    { id: 1, name: '第一阶段', description: '基础入门' },
    { id: 2, name: '第二阶段', description: '核心进阶' },
    { id: 3, name: '第三阶段', description: '高级应用' },
  ]

  const topics = ['数组与字符串', '链表', '栈与队列', '树与二叉树', '动态规划', '贪心算法', '回溯算法', '图论']
  const calendarData = []

  const startDate = new Date(2024, 0, 1) // 2024年1月1日

  for (let i = 1; i <= 84; i++) {
    const isRestDay = i % 7 === 0
    const currentDate = new Date(startDate)
    currentDate.setDate(startDate.getDate() + (i - 1))

    const stageIndex = i <= 28 ? 0 : i <= 56 ? 1 : 2

    if (isRestDay) {
      calendarData.push({
        dayNumber: i,
        date: currentDate.toISOString().split('T')[0],
        dateDisplay: `${currentDate.getMonth() + 1}/${currentDate.getDate()}`,
        isRestDay: true,
        isCompleted: false,
        stageId: stages[stageIndex].id,
        stageName: stages[stageIndex].name,
        type: 'rest',
      })
    } else {
      const questionCount = 2 + Math.floor(Math.random() * 4)
      const topic = topics[Math.floor(Math.random() * topics.length)]
      const isCompleted = i <= 15
      const questions = []

      for (let q = 1; q <= questionCount; q++) {
        questions.push({
          id: `q-${i}-${q}`,
          title: `题目 ${i}-${q}: ${topic}相关练习`,
          status: isCompleted ? 'completed' : Math.random() > 0.7 ? 'need_review' : 'uncompleted',
          topic,
          difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)],
        })
      }

      calendarData.push({
        dayNumber: i,
        date: currentDate.toISOString().split('T')[0],
        dateDisplay: `${currentDate.getMonth() + 1}/${currentDate.getDate()}`,
        isRestDay: false,
        isCompleted,
        stageId: stages[stageIndex].id,
        stageName: stages[stageIndex].name,
        type: isCompleted ? 'completed' : i === 16 ? 'in_progress' : 'normal',
        duration: 60 + Math.floor(Math.random() * 120),
        questionCount,
        topic,
        questions,
      })
    }
  }

  const plan = {
    id: 1,
    name: '算法学习计划',
    description: '系统学习数据结构与算法',
    totalDays: 84,
    stages,
  }

  const totalDays = calendarData.length
  const completedDays = calendarData.filter(d => d.isCompleted).length
  const totalQuestions = calendarData.reduce((sum, d) => sum + (d.questionCount || 0), 0)
  const remainingDays = totalDays - completedDays
  const progressPercent = Math.round((completedDays / totalDays) * 100)

  return {
    plan,
    stages,
    calendarData,
    statistics: {
      totalDays,
      completedDays,
      totalQuestions,
      remainingDays,
      progressPercent,
    },
  }
}

export default usePlanStore

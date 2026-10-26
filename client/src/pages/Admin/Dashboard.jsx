import React, { useEffect, useState } from 'react'
import {
  Users, BookOpen, TrendingUp, Calendar, CheckCircle2,
  AlertCircle, ArrowUpRight, Loader2, Video, FileText,
  Coffee, ChevronRight, BarChart3, Clock,
  Pencil, Check, Plus, Trash2, GripVertical
} from 'lucide-react'
import { usePlanStore } from '../../stores/planStore'
import { planApi, studentApi } from '../../api/client'
import AdminPlanDayEditor from '../../components/Calendar/AdminPlanDayEditor'
import DraggableCalendarGrid from '../../components/Calendar/DraggableCalendarGrid'

/**
 * 管理员仪表盘
 * 展示学员学习进度概览、统计数据、日历视图
 */
const AdminDashboard = () => {
  const { loadDemoData, calendarData } = usePlanStore()
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [plans, setPlans] = useState([])
  const [loadingPlans, setLoadingPlans] = useState(false)
  const [studentCalendar, setStudentCalendar] = useState([])
  const [loadingCalendar, setLoadingCalendar] = useState(false)
  const [students, setStudents] = useState([])
  const [loadingStats, setLoadingStats] = useState(false)

  // 计划编辑器状态
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorDayNumber, setEditorDayNumber] = useState(null)

  // 编辑模式状态
  const [isEditing, setIsEditing] = useState(false)
  const [selectedDayNumber, setSelectedDayNumber] = useState(null)
  const [addingDay, setAddingDay] = useState(false)
  const [deletingDay, setDeletingDay] = useState(false)
  const [toast, setToast] = useState(null)
  const [editingPlanName, setEditingPlanName] = useState(null)

  // 加载真实数据
  useEffect(() => {
    loadPlans()
    loadStudents()
    if (calendarData.length === 0) {
      loadDemoData()
    }

    // 页面可见性变化时刷新
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadPlans()
        loadStudents()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // 定时刷新（60秒）
    const intervalId = setInterval(() => {
      loadPlans()
      loadStudents()
    }, 60000)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearInterval(intervalId)
    }
  }, [])

  // Toast 自动消失
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  // 加载学员计划列表
  const loadPlans = async () => {
    if (loadingPlans) return
    setLoadingPlans(true)
    try {
      const res = await planApi.getPlans()
      setPlans(res.data || res || [])
    } catch (err) {
      console.error('加载计划列表失败:', err)
    } finally {
      setLoadingPlans(false)
    }
  }

  // 加载学员列表（用于统计）
  const loadStudents = async () => {
    if (loadingStats) return
    setLoadingStats(true)
    try {
      const res = await studentApi.getStudents()
      setStudents(res.data || res || [])
    } catch (err) {
      console.error('加载学员列表失败:', err)
    } finally {
      setLoadingStats(false)
    }
  }

  // 打开计划编辑器
  const openPlanEditor = (dayNumber) => {
    setEditorDayNumber(dayNumber)
    setEditorOpen(true)
  }

  // 点击学员行，加载该学员的真实学习日历
  const handleSelectStudent = async (plan) => {
    setSelectedStudent(plan)
    if (plan?.id) {
      setLoadingCalendar(true)
      try {
        const res = await planApi.getCalendarFull(plan.id)
        const result = res.data || res
        const days = result.days || []
        setStudentCalendar(days)
      } catch (err) {
        console.error('加载学员日历失败:', err)
        setStudentCalendar([])
      } finally {
        setLoadingCalendar(false)
      }
    }
  }

  // ====== 动态统计数据 ======
  const totalStudents = students.length
  const activePlans = plans.filter(p => p.status === 'active').length
  const totalStudyDays = plans.reduce((sum, p) => sum + (p.total_days || 0) - (p.rest_days || 0), 0)
  const totalCompletedDays = plans.reduce((sum, p) => sum + (p.completed_days || 0), 0)
  const overallProgress = totalStudyDays > 0 ? Math.round((totalCompletedDays / totalStudyDays) * 100) : 0

  // 统计卡片数据
  const statCards = [
    {
      title: '学员总数',
      value: totalStudents,
      icon: Users,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: '活跃计划',
      value: activePlans,
      icon: BookOpen,
      color: 'bg-emerald-500',
      lightColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
    },
    {
      title: '总体完成率',
      value: `${overallProgress}%`,
      subtitle: `${totalCompletedDays}/${totalStudyDays}天`,
      icon: TrendingUp,
      color: 'bg-purple-500',
      lightColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      title: '已完成天数',
      value: totalCompletedDays,
      subtitle: '累计完成',
      icon: CheckCircle2,
      color: 'bg-amber-500',
      lightColor: 'bg-amber-50',
      textColor: 'text-amber-600',
    },
  ]

  // 天数状态颜色
  const getDayStatusColor = (day) => {
    if (day.isRestDay) return 'from-gray-100 to-gray-200 border-gray-200'
    if (day.status === 'completed') return 'from-emerald-400 to-emerald-500 border-emerald-300 text-white'
    if (day.status === 'partial') return 'from-amber-300 to-amber-400 border-amber-300 text-white'
    return 'from-white to-gray-50 border-gray-200 text-gray-700'
  }

  const getDayStatusLabel = (day) => {
    if (day.isRestDay) return '休息日'
    if (day.status === 'completed') return '已完成'
    if (day.status === 'partial') return '进行中'
    return '待学习'
  }

  const getDayStatusBadge = (day) => {
    if (day.isRestDay) return 'bg-gray-500/20 text-gray-600'
    if (day.status === 'completed') return 'bg-white/30 text-white'
    if (day.status === 'partial') return 'bg-white/30 text-white'
    return 'bg-emerald-500/10 text-emerald-600'
  }

  // ===== 编辑模式相关函数 =====

  const handleToggleEdit = () => {
    setIsEditing((prev) => {
      const next = !prev
      if (!next) {
        setSelectedDayNumber(null)
      }
      return next
    })
  }

  const handleAddDay = async () => {
    if (!selectedStudent?.id) {
      setToast({ type: 'error', message: '请先选择一个学员计划' })
      return
    }
    setAddingDay(true)
    try {
      await planApi.addPlanDay(selectedStudent.id)
      await handleSelectStudent(selectedStudent)
      setToast({ type: 'success', message: '新增一天成功' })
    } catch (err) {
      console.error('新增一天失败:', err)
      setToast({ type: 'error', message: err?.message || '新增一天失败' })
    } finally {
      setAddingDay(false)
    }
  }

  // 更新学员计划名称
  const handleUpdatePlanName = async (planId, newName) => {
    if (!newName || !newName.trim()) return
    try {
      await planApi.updateName(planId, newName.trim())
      // 立即更新本地 plans 状态中对应 plan 的显示名称
      setPlans(prevPlans =>
        prevPlans.map(p =>
          p.id === planId ? { ...p, plan_display_name: newName.trim() } : p
        )
      )
      // 如果当前选中了该学员，同时刷新日历数据
      if (selectedStudent && selectedStudent.id === planId) {
        await handleSelectStudent(selectedStudent)
      }
      setEditingPlanName(null)
    } catch (err) {
      console.error('更新计划名称失败:', err)
      alert(err.message || '更新失败')
    }
  }

  const handleDeleteDay = async () => {
    if (!selectedStudent?.id || !selectedDayNumber) {
      setToast({ type: 'error', message: '请先选择要删除的天数' })
      return
    }
    setDeletingDay(true)
    try {
      await planApi.deletePlanDay(selectedStudent.id, selectedDayNumber)
      await handleSelectStudent(selectedStudent)
      setSelectedDayNumber(null)
      setToast({ type: 'success', message: `Day ${selectedDayNumber} 已删除` })
    } catch (err) {
      console.error('删除天数失败:', err)
      setToast({ type: 'error', message: err?.message || '删除天数失败' })
    } finally {
      setDeletingDay(false)
    }
  }

  const handleDayClick = (day) => {
    if (isEditing) {
      if (day?.dayNumber) {
        setSelectedDayNumber((prev) =>
          prev === day.dayNumber ? null : day.dayNumber
        )
      }
    } else {
      if (day) {
        openPlanEditor(day.dayNumber)
      }
    }
  }

  const handleReorder = async (fromDay, toDay) => {
    if (!selectedStudent?.id || !isEditing) return
    try {
      await planApi.reorderDays(selectedStudent.id, fromDay, toDay)
      await handleSelectStudent(selectedStudent)
      setToast({ type: 'success', message: `Day ${fromDay} 已移动到 Day ${toDay}` })
    } catch (err) {
      console.error('重排天数失败:', err)
      setToast({ type: 'error', message: '重排失败' })
    }
  }


  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">仪表盘</h2>
        <p className="text-sm text-gray-500 mt-1">查看学员学习进度和系统概况</p>
      </div>

      {/* ====== 统计卡片（动态数据） ====== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loadingStats ? (
          <div className="col-span-full flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
          </div>
        ) : (
          statCards.map((card) => (
            <div
              key={card.title}
              className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 ${card.lightColor} rounded-lg flex items-center justify-center`}>
                  <card.icon className={`w-5 h-5 ${card.textColor}`} />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-sm text-gray-500 mt-0.5">{card.title}</p>
                {card.subtitle && (
                  <p className="text-xs text-gray-400 mt-0.5">{card.subtitle}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ====== 学员进度表格 ====== */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="text-base font-semibold text-gray-900">学员学习进度</h3>
            <p className="text-sm text-gray-500 mt-0.5">各学员的学习完成情况</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">学员</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">计划名称</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">完成进度</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">完成率</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loadingPlans ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                    加载中...
                  </td>
                </tr>
              ) : plans.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-400 text-sm">暂无学员计划数据</td>
                </tr>
              ) : (
                plans.map((plan) => {
                  const studyDays = (plan.total_days || 0) - (plan.rest_days || 0)
                  const completed = plan.completed_days || 0
                  const percent = studyDays > 0 ? Math.round((completed / studyDays) * 100) : 0
                  return (
                    <tr
                      key={plan.id}
                      className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                        selectedStudent?.id === plan.id ? 'bg-emerald-50 ring-1 ring-emerald-200' : ''
                      }`}
                      onClick={() => handleSelectStudent(plan)}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-emerald-700">
                              {(plan.student_name || plan.student_username || '?')[0]}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{plan.student_name || plan.student_username}</p>
                            <p className="text-xs text-gray-500">@{plan.student_username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {editingPlanName?.planId === plan.id ? (
                          <input
                            type="text"
                            defaultValue={plan.plan_display_name || plan.template_name || ''}
                            autoFocus
                            onBlur={(e) => handleUpdatePlanName(plan.id, e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleUpdatePlanName(plan.id, e.target.value); if (e.key === 'Escape') setEditingPlanName(null) }}
                            className="w-full text-sm text-gray-700 border border-emerald-300 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        ) : (
                          <span className="text-sm text-gray-700 cursor-pointer group inline-flex items-center gap-1" onClick={() => setEditingPlanName({ planId: plan.id })} title="点击修改计划名称">
                            {plan.plan_display_name || plan.template_name || '未命名计划'}
                            <Pencil className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-gray-700 font-medium">
                          {completed} / {studyDays} 天
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                percent >= 60 ? 'bg-emerald-500' : percent >= 30 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600 font-medium w-8">{percent}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          plan.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                          plan.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {plan.status === 'active' ? <CheckCircle2 className="w-3 h-3" /> :
                           plan.status === 'completed' ? <CheckCircle2 className="w-3 h-3" /> :
                           <AlertCircle className="w-3 h-3" />}
                          {plan.status === 'active' ? '进行中' : plan.status === 'completed' ? '已完成' : '已暂停'}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ====== 日历概览 - 卡片式布局 ====== */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="mb-5">
          <h3 className="text-base font-semibold text-gray-900">
            {selectedStudent
              ? `${selectedStudent.student_name || selectedStudent.student_username} 的学习日历`
              : '学习日历'}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {selectedStudent
              ? `${selectedStudent.template_name || ''} · ${studentCalendar.length}天 · 点击卡片查看详情`
              : '点击上方学员查看学习日程'}
          </p>
        </div>

        {loadingCalendar ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            <span className="ml-2 text-sm text-gray-500">加载日历中...</span>
          </div>
        ) : selectedStudent && studentCalendar.length > 0 ? (
          <div>
            {/* 编辑模式工具栏 */}
            {selectedStudent && (
              <div className="flex items-center justify-between mb-3">
                <div>
                  {isEditing && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                      <GripVertical className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>拖拽天数可调整顺序，点击天数可选中/取消选中（用于删除）</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleToggleEdit}
                  className={
                    'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ' +
                    (isEditing
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm')
                  }
                >
                  {isEditing ? (
                    <>
                      <Check className="w-4 h-4" />
                      完成
                    </>
                  ) : (
                    <>
                      <Pencil className="w-3.5 h-3.5" />
                      编辑计划
                    </>
                  )}
                </button>
              </div>
            )}

            {/* 可拖拽日历网格 */}
            <DraggableCalendarGrid
              days={studentCalendar}
              onDayClick={handleDayClick}
              onReorder={handleReorder}
              isEditing={isEditing}
              loading={loadingCalendar}
            />

            {/* 编辑模式底部操作按钮 */}
            {isEditing && selectedStudent && (
              <div className="fixed bottom-6 left-0 right-0 z-40 px-4">
                <div className="max-w-lg mx-auto flex items-center gap-3">
                  <button
                    onClick={handleAddDay}
                    disabled={addingDay}
                    className={'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold shadow-lg transition-all bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100'}
                  >
                    {addingDay ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    新增一天
                  </button>
                  <button
                    onClick={handleDeleteDay}
                    disabled={deletingDay || !selectedDayNumber}
                    className={
                      'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold shadow-lg transition-all ' +
                      (selectedDayNumber
                        ? 'bg-red-600 text-white hover:bg-red-700 active:scale-[0.98] '
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed ') +
                      'disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100'
                    }
                  >
                    {deletingDay ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    删除{selectedDayNumber ? ` Day ${selectedDayNumber}` : '选中天'}
                  </button>
                </div>
              </div>
            )}

            {/* 图例 */}
            <div className="flex flex-wrap items-center gap-4 mt-5 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-gradient-to-br from-emerald-400 to-emerald-500" />
                <span className="text-xs text-gray-500">已完成</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-gradient-to-br from-amber-300 to-amber-400" />
                <span className="text-xs text-gray-500">进行中</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-white border border-gray-200" />
                <span className="text-xs text-gray-500">待学习</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-gradient-to-br from-gray-100 to-gray-200" />
                <span className="text-xs text-gray-500">休息日</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Calendar className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">{selectedStudent ? '该学员暂无日历数据' : '点击上方学员查看学习日历'}</p>
          </div>
        )}
      </div>

      {/* 计划编辑器弹窗 */}
      {editorOpen && selectedStudent && (
        <AdminPlanDayEditor
          planId={selectedStudent.id}
          dayNumber={editorDayNumber}
          templateName={selectedStudent.template_name || ''}
          studentName={selectedStudent.student_name || selectedStudent.student_username || ''}
          onClose={() => {
            setEditorOpen(false)
            setEditorDayNumber(null)
          }}
          onSave={() => {
            handleSelectStudent(selectedStudent)
            loadPlans()
          }}
        />
      )}

      {/* Toast 提示 */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100]">
          <div
            className={
              'flex items-center gap-2 px-5 py-3 rounded-xl shadow-lg text-sm font-medium border transition-all duration-300 ' +
              (toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-red-50 border-red-200 text-red-700')
            }
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard

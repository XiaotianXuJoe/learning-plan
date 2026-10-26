import React, { useState, useEffect } from 'react'
import { Users, Plus, Trash2, Search, GraduationCap, Loader2, CheckCircle2, XCircle, BookOpen, Calendar, X, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react'
import { studentApi, planApi, templateApi } from '../../api/client'
import AdminPlanDayEditor from '../../components/Calendar/AdminPlanDayEditor'

/**
 * 学员管理页面
 * 管理员可查看、添加、删除学员（前后端联动）
 */
const StudentManagement = () => {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [toast, setToast] = useState(null) // { type: 'success'|'error', message: string }

  // 学员进度查看对话框状态
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [progressStudent, setProgressStudent] = useState(null)
  const [progressCalendar, setProgressCalendar] = useState([])
  const [progressLoading, setProgressLoading] = useState(false)
  const [progressError, setProgressError] = useState(null)
  const [progressPlans, setProgressPlans] = useState([])          // 学员的所有计划
  const [progressActivePlanId, setProgressActivePlanId] = useState(null)  // 当前选中的计划ID

  // 删除计划相关状态
  const [deletingPlanId, setDeletingPlanId] = useState(null)  // 正在删除的计划ID
  const [showDeletePlanDropdown, setShowDeletePlanDropdown] = useState(false)  // 删除计划下拉列表
  const [planToDelete, setPlanToDelete] = useState(null)  // 待删除的计划（二次确认）

  // 分配计划对话框状态
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [assigningStudent, setAssigningStudent] = useState(null)

  // 计划编辑器状态
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorDayNumber, setEditorDayNumber] = useState(null)
  const [editorPlanId, setEditorPlanId] = useState(null) // { id, username }
  const [templates, setTemplates] = useState([]) // 模板列表
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [assigning, setAssigning] = useState(false)

  // 加载学员列表（从后端API）
  useEffect(() => {
    loadStudents()
  }, [])

  // Toast 自动消失
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const loadStudents = async () => {
    setLoading(true)
    try {
      const res = await studentApi.getStudents()
      // 后端返回 { code, message, data: [...] }
      const list = res.data || res || []
      setStudents(list)
    } catch (err) {
      console.error('加载学员失败:', err)
      setToast({ type: 'error', message: '加载学员列表失败' })
    } finally {
      setLoading(false)
    }
  }

  // 添加学员 —— 调用后端API
  const handleAdd = async () => {
    const username = newUsername.trim()
    if (!username) {
      setToast({ type: 'error', message: '请输入学员用户名' })
      return
    }
    if (!/^[\u4e00-\u9fa5a-zA-Z0-9_]{2,20}$/.test(username)) {
      setToast({ type: 'error', message: '用户名需3-20位字母/数字/下划线' })
      return
    }

    setAdding(true)
    try {
      const res = await studentApi.createStudent(username)
      if (res.code === 0) {
        setToast({ type: 'success', message: `学员 "${username}" 添加成功` })
        setNewUsername('')
        setShowAddForm(false)
        // 重新加载列表
        await loadStudents()
      } else {
        setToast({ type: 'error', message: res.message || '添加失败' })
      }
    } catch (err) {
      console.error('添加学员失败:', err)
      setToast({ type: 'error', message: err.message || '添加失败，请重试' })
    } finally {
      setAdding(false)
    }
  }

  // 删除学员 —— 调用后端API
  const handleDelete = async (id, username) => {
    if (!confirm(`确定删除学员 "${username}" 吗？此操作不可撤销。`)) return
    setDeletingId(id)
    try {
      const res = await studentApi.deleteStudent(id)
      if (res.code === 0) {
        setToast({ type: 'success', message: '删除成功' })
        await loadStudents()
      } else {
        setToast({ type: 'error', message: res.message || '删除失败' })
      }
    } catch (err) {
      console.error('删除学员失败:', err)
      setToast({ type: 'error', message: err.message || '删除失败' })
    } finally {
      setDeletingId(null)
    }
  }

  // 打开分配计划对话框
  const openAssignModal = async (student) => {
    setAssigningStudent(student)
    setAssignModalOpen(true)
    setSelectedTemplate('')
    setStartDate(new Date().toISOString().split('T')[0])

    // 加载模板列表
    try {
      const res = await templateApi.getTemplates()
      const list = res.data?.templates || res.data || []
      setTemplates(list)
      if (list.length > 0) setSelectedTemplate(String(list[0].id))
    } catch (err) {
      console.error('加载模板失败:', err)
      setToast({ type: 'error', message: '加载模板列表失败' })
    }
  }

  // 关闭分配计划对话框
  const closeAssignModal = () => {
    setAssignModalOpen(false)
    setAssigningStudent(null)
    setTemplates([])
    setSelectedTemplate('')
  }

  // 执行分配计划
  const handleAssign = async () => {
    if (!selectedTemplate) {
      setToast({ type: 'error', message: '请选择学习计划模板' })
      return
    }
    if (!startDate) {
      setToast({ type: 'error', message: '请选择开始日期' })
      return
    }

    setAssigning(true)
    try {
      const res = await planApi.assignPlan(assigningStudent.id, selectedTemplate, startDate)
      if (res.code === 0) {
        setToast({ type: 'success', message: `计划分配成功！已为 "${assigningStudent.username}" 分配学习计划` })
        closeAssignModal()
      } else {
        setToast({ type: 'error', message: res.message || '分配失败' })
      }
    } catch (err) {
      console.error('分配计划失败:', err)
      setToast({ type: 'error', message: err.message || '分配失败' })
    } finally {
      setAssigning(false)
    }
  }

  // 查看学员学习进度
  const openProgressModal = async (student) => {
    setProgressStudent(student)
    setShowProgressModal(true)
    setProgressCalendar([])
    setProgressError(null)
    setProgressLoading(true)
    setProgressPlans([])
    setProgressActivePlanId(null)

    try {
      // 1. 获取该学员的所有计划
      const plansRes = await planApi.getPlans()
      const allPlans = plansRes.data || plansRes || []
      const studentPlans = allPlans.filter(p => p.student_id === student.id)

      if (studentPlans.length === 0) {
        setProgressError('该学员尚未分配学习计划')
        setProgressLoading(false)
        return
      }

      setProgressPlans(studentPlans)
      const firstPlan = studentPlans[0]
      setProgressActivePlanId(firstPlan.id)
      await loadPlanCalendar(firstPlan.id, student, studentPlans)
    } catch (err) {
      console.error('加载学员进度失败:', err)
      setProgressError(err.message || '加载失败')
    } finally {
      setProgressLoading(false)
    }
  }

  // 加载指定计划的日历
  const loadPlanCalendar = async (planId, student, studentPlans) => {
    setProgressLoading(true)
    try {
      const calRes = await planApi.getCalendarFull(planId)
      const result = calRes.data || calRes
      const days = result.days || []

      const formattedDays = days.map(day => ({
        dayNumber: day.dayNumber,
        isRestDay: day.isRestDay,
        isCompleted: day.status === 'completed',
        status: day.status,
        theme: day.theme,
      }))

      setProgressCalendar(formattedDays)
      const activePlan = (studentPlans || progressPlans).find(p => p.id === planId)
      setProgressStudent({
        ...student,
        planId: planId,
        templateName: activePlan?.template_name,
        totalDays: activePlan?.total_days || formattedDays.length,
      })
    } catch (err) {
      console.error('加载计划日历失败:', err)
      setProgressError('加载日历失败')
    } finally {
      setProgressLoading(false)
    }
  }

  // 切换进度查看的计划
  const handleProgressPlanSwitch = async (planId) => {
    if (planId === progressActivePlanId) return
    setProgressActivePlanId(planId)
    await loadPlanCalendar(planId, progressStudent, progressPlans)
  }

  // 删除学员计划
  const handleDeletePlan = async (planId) => {
    if (!window.confirm('确定要删除该学习计划吗？此操作不可恢复！')) return
    setDeletingPlanId(planId)
    try {
      await planApi.deletePlan(planId)
      // 从列表中移除已删除的计划
      const updatedPlans = progressPlans.filter(p => p.id !== planId)
      setProgressPlans(updatedPlans)
      setPlanToDelete(null)
      setShowDeletePlanDropdown(false)
      setToast({ type: 'success', message: '学习计划删除成功' })
      // 如果删除的是当前展示的计划，切换到其他计划
      if (planId === progressActivePlanId && updatedPlans.length > 0) {
        setProgressActivePlanId(updatedPlans[0].id)
        await loadPlanCalendar(updatedPlans[0].id, progressStudent, updatedPlans)
      } else if (updatedPlans.length === 0) {
        // 没有计划了，关闭弹窗
        setShowProgressModal(false)
        setProgressStudent(null)
        setProgressCalendar([])
      }
    } catch (err) {
      console.error('删除计划失败:', err)
      setToast({ type: 'error', message: err.message || '删除计划失败' })
    } finally {
      setDeletingPlanId(null)
    }
  }

  const closeProgressModal = () => {
    setShowProgressModal(false)
    setProgressStudent(null)
    setProgressCalendar([])
    setProgressError(null)
    setProgressPlans([])
    setProgressActivePlanId(null)
  }

  // 过滤学员
  const filtered = students.filter(s =>
    (s.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.display_name || s.displayName || '').includes(searchTerm)
  )

  return (
    <div className="space-y-6 p-2 relative">
      {/* Toast 提示 */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
          toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">学员管理</h2>
          <p className="text-sm text-gray-500 mt-1">
            共 {students.length} 名学员 · 默认密码：123456
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          添加学员
        </button>
      </div>

      {/* 添加学员表单 */}
      {showAddForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">添加新学员</h3>
          <div className="flex gap-3">
            <input
              value={newUsername}
              onChange={e => setNewUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="输入学员用户名（如：张三）"
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              disabled={adding}
            />
            <button
              onClick={handleAdd}
              disabled={adding}
              className="px-5 py-2.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {adding && <Loader2 className="w-4 h-4 animate-spin" />}
              {adding ? '添加中...' : '确认添加'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">用户名可包含中文、字母、数字和下划线，长度2-20位</p>
        </div>
      )}

      {/* 搜索栏 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="搜索学员用户名或姓名..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* 学员列表 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">学员</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">用户名</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">注册时间</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="4" className="px-5 py-10 text-center text-gray-400">
                  <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" />
                  <p className="text-sm">加载中...</p>
                </td>
              </tr>
            ) : filtered.length > 0 ? (
              filtered.map(s => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center">
                        <GraduationCap className="w-4 h-4 text-emerald-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{s.display_name || s.displayName || s.username}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">@{s.username}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">
                    {s.created_at ? new Date(s.created_at * 1000).toLocaleDateString('zh-CN') : '-'}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        openProgressModal(s)
                      }}
                      className="text-blue-500 hover:text-blue-600 transition-colors mr-2"
                      title="查看学习进度"
                    >
                      <Calendar className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        openAssignModal(s)
                      }}
                      className="text-emerald-500 hover:text-emerald-600 transition-colors mr-2"
                      title="分配学习计划"
                    >
                      <BookOpen className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id, s.username)}
                      disabled={deletingId === s.id}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1 disabled:opacity-50"
                    >
                      {deletingId === s.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-5 py-10 text-center text-gray-400">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">{searchTerm ? '未找到匹配的学员' : '暂无学员'}</p>
                  {!searchTerm && (
                    <p className="text-xs mt-1">点击右上角「添加学员」创建第一个学员</p>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 分配计划对话框 */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">分配学习计划</h3>
              <button onClick={closeAssignModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {/* 学员信息 */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <span className="text-emerald-600 font-bold text-sm">{(assigningStudent?.username || '')[0]?.toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{assigningStudent?.username}</p>
                  <p className="text-xs text-gray-500">学员ID: {assigningStudent?.id}</p>
                </div>
              </div>

              {/* 模板选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  选择计划模板 <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">请选择模板</option>
                  {templates.map(t => (
                    <option key={t.id} value={String(t.id)}>
                      {t.name} ({t.days_count}天)
                    </option>
                  ))}
                </select>
              </div>

              {/* 开始日期 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  开始日期 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={closeAssignModal} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
                取消
              </button>
              <button
                onClick={handleAssign}
                disabled={assigning || !selectedTemplate}
                className="px-5 py-2.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2"
              >
                {assigning && <Loader2 className="w-4 h-4 animate-spin" />}
                {assigning ? '分配中...' : '确认分配'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 查看学员进度对话框 */}
      {showProgressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {progressStudent?.username || '学员'} 的学习进度
                </h3>
                {progressStudent?.templateName && (
                  <p className="text-sm text-gray-500 mt-0.5">
                    {progressStudent.templateName} · 共 {progressStudent.totalDays} 天
                  </p>
                )}
              </div>
              <button
                onClick={closeProgressModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 计划切换与删除 */}
            {progressPlans.length >= 1 && (
              <div className="px-6 pt-4 border-b border-gray-100">
                <div className="flex items-center justify-between pb-1">
                  {/* 计划下拉选择器 */}
                  <div className="relative flex-1 mr-3">
                    <button
                      onClick={() => setShowDeletePlanDropdown(!showDeletePlanDropdown)}
                      className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <BookOpen className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span className="font-medium text-gray-700 truncate">
                          {(progressPlans.find(p => p.id === progressActivePlanId)?.template_name || `计划 ${progressActivePlanId}`)}
                        </span>
                        <span className="text-xs text-gray-400">
                          ({progressPlans.find(p => p.id === progressActivePlanId)?.total_days || 0}天)
                        </span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showDeletePlanDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {/* 下拉列表 */}
                    {showDeletePlanDropdown && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                        <div className="max-h-48 overflow-y-auto py-1">
                          {progressPlans.map(plan => (
                            <div key={plan.id} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 transition-colors">
                              <button
                                onClick={() => {
                                  handleProgressPlanSwitch(plan.id)
                                  setShowDeletePlanDropdown(false)
                                }}
                                className={`flex-1 text-left text-sm truncate ${
                                  plan.id === progressActivePlanId ? 'font-semibold text-emerald-700' : 'text-gray-700'
                                }`}
                              >
                                {plan.template_name || `计划 ${plan.id}`}
                                <span className="text-xs text-gray-400 ml-1">({plan.total_days || 0}天)</span>
                              </button>
                              <button
                                onClick={() => setPlanToDelete(plan)}
                                disabled={deletingPlanId === plan.id}
                                className="ml-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 flex-shrink-0"
                                title="删除此计划"
                              >
                                {deletingPlanId === plan.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {/* 删除按钮 */}
                  {progressPlans.length > 0 && (
                    <button
                      onClick={() => {
                        const activePlan = progressPlans.find(p => p.id === progressActivePlanId)
                        if (activePlan) setPlanToDelete(activePlan)
                      }}
                      disabled={!!deletingPlanId}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 flex-shrink-0"
                    >
                      {deletingPlanId === progressActivePlanId ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      删除计划
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Body */}
            <div className="px-6 py-5">
              {progressLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mb-2" />
                  <span className="text-sm text-gray-500">加载中...</span>
                </div>
              ) : progressError ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <AlertCircle className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm">{progressError}</p>
                </div>
              ) : progressCalendar.length > 0 ? (
                <>
                  {/* 日历网格 */}
                  <div className="grid grid-cols-7 gap-2">
                    {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
                      <div
                        key={day}
                        className="text-center text-xs font-medium text-gray-400 py-2"
                      >
                        {day}
                      </div>
                    ))}
                    {progressCalendar.map((day) => (
                      <div
                        key={day.dayNumber}
                        className={`
                          aspect-square rounded-lg flex items-center justify-center text-xs font-medium
                          ${day.isRestDay
                            ? 'bg-gray-100 text-gray-400'
                            : day.isCompleted
                            ? 'bg-emerald-100 text-emerald-700'
                            : day.status === 'partial'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-white border border-gray-200 text-gray-600'
                          }
                        `}
                        title={day.theme || `Day ${day.dayNumber}`}
                      >
                        {day.dayNumber}
                      </div>
                    ))}
                  </div>

                  {/* 图例 */}
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200" />
                      <span className="text-xs text-gray-500">已完成</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-amber-100 border border-amber-200" />
                      <span className="text-xs text-gray-500">进行中</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-white border border-gray-200" />
                      <span className="text-xs text-gray-500">待完成</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-gray-100" />
                      <span className="text-xs text-gray-500">休息日</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Calendar className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm">暂无日历数据</p>
                </div>
              )}
            </div>

            {/* 删除计划二次确认对话框 */}
            {planToDelete && (
              <div className="px-6 py-4 border-t border-red-100 bg-red-50">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">
                      确认删除计划「{planToDelete.template_name || `计划 ${planToDelete.id}`}」？
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                      该计划的 {planToDelete.total_days || 0} 天学习数据、题目进度和视频观看记录将全部被删除，此操作不可恢复。
                    </p>
                    <div className="flex items-center gap-3 mt-3">
                      <button
                        onClick={() => setPlanToDelete(null)}
                        className="px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50"
                      >
                        取消
                      </button>
                      <button
                        onClick={() => handleDeletePlan(planToDelete.id)}
                        disabled={deletingPlanId === planToDelete.id}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {deletingPlanId === planToDelete.id && <Loader2 className="w-3 h-3 animate-spin" />}
                        {deletingPlanId === planToDelete.id ? '删除中...' : '确认删除'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={closeProgressModal}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentManagement
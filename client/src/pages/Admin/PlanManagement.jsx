import React, { useState, useEffect, useCallback } from 'react'
import {
  BookOpen,
  Plus,
  Trash2,
  Pencil,
  Calendar,
  ChevronRight,
  X,
  Loader2,
  CheckCircle2,
  XCircle,
  FileText,
  Video,
  HelpCircle,
  ArrowLeft,
  Eye,
  Copy,
} from 'lucide-react'
import { templateApi } from '../../api/client'
import AdminTemplateCalendar from '../../components/Calendar/AdminTemplateCalendar'
import AdminDayEditor from '../../components/Calendar/AdminDayEditor'

/**
 * 计划管理页面（重写版）
 * 支持日历化的创建和查看/编辑功能
 *
 * 核心流程：
 * 1. 列表页面：展示所有模板卡片
 * 2. 创建流程：基本信息Modal → 创建 → 进入日历编辑界面 → 逐天配置
 * 3. 查看详情：日历Modal展示所有天数 → 可切换编辑模式
 */
const PlanManagement = () => {
  // ====== 页面级状态 ======
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [cloningId, setCloningId] = useState(null)
  const [toast, setToast] = useState(null)
  const [editingId, setEditingId] = useState(null)

  // 当前主视图：'list' 列表页 | 'calendar' 日历编辑全页面
  const [view, setView] = useState('list')

  // 当前激活的模板（用于日历编辑全页面视图）
  const [activeTemplate, setActiveTemplate] = useState(null)
  const [activeDays, setActiveDays] = useState([])

  // 创建计划Modal
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newPlan, setNewPlan] = useState({
    name: '',
    description: '',
    days_count: 30,
  })

  // 查看详情Modal
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailTemplate, setDetailTemplate] = useState(null)
  const [detailDays, setDetailDays] = useState([])
  const [isDetailEditing, setIsDetailEditing] = useState(false)

  // AdminDayEditor弹窗
  const [dayEditorOpen, setDayEditorOpen] = useState(false)
  const [editingContext, setEditingContext] = useState(null) // { templateId, dayNumber, dayData }

  // ====== 工具函数 ======

  // Toast自动消失
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  // 加载模板列表
  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const res = await templateApi.getTemplates()
      // 后端返回 { code, message, data: { templates: [...] } }
      const list = res.data?.templates || res.data || res || []
      setTemplates(list)
    } catch (err) {
      console.error('加载模板失败:', err)
      setToast({ type: 'error', message: '加载计划列表失败' })
    } finally {
      setLoading(false)
    }
  }

  // ====== 创建计划流程 ======

  const handleOpenCreate = () => {
    setNewPlan({ name: '', description: '', days_count: 30 })
    setCreateModalOpen(true)
  }

  const handleCreate = async () => {
    const { name, description, days_count } = newPlan
    if (!name.trim()) {
      setToast({ type: 'error', message: '请输入计划名称' })
      return
    }
    if (!days_count || days_count < 1) {
      setToast({ type: 'error', message: '天数至少为1天' })
      return
    }

    setCreating(true)
    try {
      const res = await templateApi.createTemplate({
        name: name.trim(),
        description: description.trim(),
        days_count: parseInt(days_count),
      })
      if (res.code === 0 || res.success) {
        const createdTemplate = res.data
        setToast({
          type: 'success',
          message: `计划 "${name}" 创建成功，进入日历编辑`,
        })
        setCreateModalOpen(false)

        // 进入日历编辑全页面视图
        setActiveTemplate(createdTemplate)
        setActiveDays(createdTemplate?.days || [])
        setView('calendar')

        // 刷新列表
        await loadTemplates()
      } else {
        setToast({ type: 'error', message: res.message || '创建失败' })
      }
    } catch (err) {
      console.error('创建计划失败:', err)
      setToast({ type: 'error', message: err.message || '创建失败' })
    } finally {
      setCreating(false)
    }
  }

  // ====== 查看详情流程 ======

  const handleViewDetail = async (template) => {
    setDetailModalOpen(true)
    setDetailTemplate(template)
    setIsDetailEditing(false)
    setDetailLoading(true)
    try {
      const res = await templateApi.getTemplateById(template.id)
      if (res.code === 0 || res.success) {
        const fullTemplate = res.data
        setDetailTemplate(fullTemplate)
        setDetailDays(fullTemplate?.days || [])
      } else {
        setToast({ type: 'error', message: res.message || '获取详情失败' })
      }
    } catch (err) {
      console.error('获取详情失败:', err)
      setToast({ type: 'error', message: '获取详情失败' })
    } finally {
      setDetailLoading(false)
    }
  }

  // ====== 更新模板名称 ======
  const renameTemplate = async (planId, newName) => {
    if (!newName || !newName.trim()) return
    try {
      await templateApi.updateName(planId, newName.trim())
      loadTemplates()
      setEditingId(null)
    } catch (err) {
      console.error('更新模板名称失败:', err)
      alert(err.message || '更新失败')
    }
  }

  // ====== 复制模板 ======

  const handleClone = async (id, name) => {
    if (!window.confirm(`确定要复制模板「${name}」吗？`)) return
    setCloningId(id)
    try {
      const res = await templateApi.cloneTemplate(id)
      await loadTemplates()
      setToast({ type: 'success', message: `模板「${name}」复制成功` })
    } catch (err) {
      console.error('复制模板失败:', err)
      setToast({ type: 'error', message: err.message || '复制失败' })
    } finally {
      setCloningId(null)
    }
  }

  // ====== 删除计划 ======

  const handleDelete = async (id, name) => {
    if (!confirm(`确定删除计划 "${name}" 吗？此操作不可撤销。`)) return
    setDeletingId(id)
    try {
      const res = await templateApi.deleteTemplate(id)
      if (res.code === 0 || res.success) {
        setToast({ type: 'success', message: '删除成功' })
        await loadTemplates()
      } else {
        setToast({ type: 'error', message: res.message || '删除失败' })
      }
    } catch (err) {
      console.error('删除计划失败:', err)
      setToast({ type: 'error', message: err.message || '删除失败' })
    } finally {
      setDeletingId(null)
    }
  }

  // ====== AdminDayEditor 交互 ======

  const openDayEditor = (day, contextType) => {
    const templateId =
      contextType === 'active' ? activeTemplate?.id : detailTemplate?.id
    setEditingContext({
      templateId,
      dayNumber: day.day_number,
      dayData: day,
    })
    setDayEditorOpen(true)
  }

  const closeDayEditor = () => {
    setDayEditorOpen(false)
    setEditingContext(null)
  }

  // 保存某天成功后的回调
  const handleDaySaveSuccess = useCallback(
    (updatedDay) => {
      // 更新函数：替换或追加
      const updateDays = (prevDays) => {
        const exists = prevDays.some(
          (d) => d.day_number === updatedDay.day_number
        )
        if (exists) {
          return prevDays.map((d) =>
            d.day_number === updatedDay.day_number
              ? { ...d, ...updatedDay }
              : d
          )
        }
        return [...prevDays, updatedDay]
      }

      setActiveDays((prev) => updateDays(prev))
      setDetailDays((prev) => updateDays(prev))
      setToast({
        type: 'success',
        message: `Day ${updatedDay.day_number} 保存成功`,
      })
    },
    []
  )

  // ====== 增加/删除天数 ======

  // 在日历编辑全页面视图中增加一天
  const handleAddDay = async () => {
    if (!activeTemplate?.id) return
    try {
      const res = await templateApi.addDay(activeTemplate.id)
      if (res.code === 0 || res.success) {
        const newDay = res.data
        // 追加新天数到activeDays
        setActiveDays(prev => [...prev, newDay])
        // 更新activeTemplate的days_count
        setActiveTemplate(prev => prev ? { ...prev, days_count: (prev.days_count || 0) + 1 } : prev)
        setToast({ type: 'success', message: `Day ${newDay.day_number} 新增成功` })
      } else {
        setToast({ type: 'error', message: res.message || '新增失败' })
      }
    } catch (err) {
      console.error('新增天数失败:', err)
      setToast({ type: 'error', message: err.message || '新增失败' })
    }
  }

  // 在详情Modal编辑模式中增加一天
  const handleDetailAddDay = async () => {
    if (!detailTemplate?.id) return
    try {
      const res = await templateApi.addDay(detailTemplate.id)
      if (res.code === 0 || res.success) {
        const newDay = res.data
        setDetailDays(prev => [...prev, newDay])
        setDetailTemplate(prev => prev ? { ...prev, days_count: (prev.days_count || 0) + 1 } : prev)
        setToast({ type: 'success', message: `Day ${newDay.day_number} 新增成功` })
      } else {
        setToast({ type: 'error', message: res.message || '新增失败' })
      }
    } catch (err) {
      console.error('新增天数失败:', err)
      setToast({ type: 'error', message: err.message || '新增失败' })
    }
  }

  // 删除指定天数
  const handleDeleteDay = async (templateId, _dayNum, dayNumberToDelete) => {
    if (!templateId || !dayNumberToDelete) return
    try {
      const res = await templateApi.deleteDay(templateId, dayNumberToDelete)
      if (res.code === 0 || res.success) {
        const deletedDay = res.data?.deletedDay || dayNumberToDelete
        const newCount = res.data?.newDaysCount

        // 更新activeDays（日历编辑视图）
        if (activeTemplate?.id === templateId) {
          setActiveDays(prev => {
            // 删除该天，后续天数前移
            const filtered = prev.filter(d => d.day_number !== deletedDay)
            return filtered.map(d =>
              d.day_number > deletedDay
                ? { ...d, day_number: d.day_number - 1 }
                : d
            )
          })
          if (newCount !== undefined) {
            setActiveTemplate(prev => prev ? { ...prev, days_count: newCount } : prev)
          }
        }

        // 更新detailDays（详情Modal）
        if (detailTemplate?.id === templateId) {
          setDetailDays(prev => {
            const filtered = prev.filter(d => d.day_number !== deletedDay)
            return filtered.map(d =>
              d.day_number > deletedDay
                ? { ...d, day_number: d.day_number - 1 }
                : d
            )
          })
          if (newCount !== undefined) {
            setDetailTemplate(prev => prev ? { ...prev, days_count: newCount } : prev)
          }
        }

        // 关闭DayEditor弹窗
        closeDayEditor()

        setToast({ type: 'success', message: `Day ${deletedDay} 已删除，后续天数已自动前移` })

        // 刷新模板列表
        await loadTemplates()
      } else {
        setToast({ type: 'error', message: res.message || '删除失败' })
      }
    } catch (err) {
      console.error('删除天数失败:', err)
      setToast({ type: 'error', message: err.message || '删除失败' })
    }
  }

  // ====== 渲染 ======

  // ---------- Toast 组件 ----------
  const renderToast = () =>
    toast && (
      <div
        className={`fixed top-4 right-4 z-[60] flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
          toast.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}
      >
        {toast.type === 'success' ? (
          <CheckCircle2 className="w-4 h-4" />
        ) : (
          <XCircle className="w-4 h-4" />
        )}
        {toast.message}
      </div>
    )

  // ---------- 列表视图 ----------
  const renderListView = () => (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">计划管理</h2>
          <p className="text-sm text-gray-500 mt-1">
            共 {templates.length} 个学习计划模板
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          创建计划
        </button>
      </div>

      {/* 模板列表 */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">
          <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
          <p className="text-sm">加载中...</p>
        </div>
      ) : templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((plan) => {
            const totalVideos = plan.total_videos || plan.totalVideos || 0
            const totalProblems = plan.total_problems || plan.totalProblems || 0

            return (
              <div
                key={plan.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleClone(plan.id, plan.name)}
                      disabled={cloningId === plan.id}
                      className="text-gray-400 hover:text-blue-500 transition-colors disabled:opacity-50 p-1"
                      title="复制模板"
                    >
                      {cloningId === plan.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(plan.id, plan.name)}
                      disabled={deletingId === plan.id}
                      className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 p-1"
                      title="删除模板"
                    >
                      {deletingId === plan.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-1">
                  <div className={"flex-1 " + (editingId === plan.id ? "" : "hidden")}>
                    <input
                      type="text"
                      defaultValue={plan.name}
                      autoFocus
                      onBlur={(e) => renameTemplate(plan.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') renameTemplate(plan.id, e.target.value)
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      className="w-full text-base font-semibold text-gray-900 border border-emerald-300 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className={"flex-1 " + (editingId === plan.id ? "hidden" : "")}>
                    <h3 className="text-base font-semibold text-gray-900">{plan.name}</h3>
                  </div>
                  {editingId !== plan.id && (
                    <button
                      onClick={() => setEditingId(plan.id)}
                      className="text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors px-2 py-1 rounded border border-emerald-200 shrink-0 flex items-center gap-1"
                      title="点击修改计划模板名称"
                      type="button"
                    >
                      <Pencil className="w-3 h-3" />
                      重命名
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                  {plan.description || '暂无描述'}
                </p>

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {plan.days_count || 0} 天
                  </span>
                  <span className="flex items-center gap-1">
                    <Video className="w-4 h-4" />
                    {totalVideos} 视频
                  </span>
                  <span className="flex items-center gap-1">
                    <HelpCircle className="w-4 h-4" />
                    {totalProblems} 题目
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewDetail(plan)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    查看详情
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">暂无学习计划模板</p>
          <p className="text-xs mt-1">点击右上角创建第一个计划</p>
        </div>
      )}
    </div>
  )

  // ---------- 日历编辑全页面视图 ----------
  const renderCalendarView = () => {
    const template = activeTemplate
    if (!template) return null

    return (
      <div className="space-y-4">
        {/* 顶部导航栏 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={async () => {
                // 返回列表前刷新数据，确保最新内容已保存
                await loadTemplates()
                setView('list')
                setActiveTemplate(null)
                setActiveDays([])
                setToast({ type: 'success', message: '计划已保存' })
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              保存并完成
            </button>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {template.name}
              </h2>
              <p className="text-sm text-gray-500">
                {template.description || '暂无描述'} · {template.days_count}天
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Video className="w-4 h-4 text-purple-500" />
              {activeDays.reduce(
                (sum, d) => sum + (d.videos?.length || 0),
                0
              )}{' '}
              视频
            </span>
            <span className="flex items-center gap-1">
              <HelpCircle className="w-4 h-4 text-blue-500" />
              {activeDays.reduce(
                (sum, d) => sum + (d.problems?.length || 0),
                0
              )}{' '}
              题目
            </span>
          </div>
        </div>

        {/* 提示条 */}
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
          <Pencil className="w-4 h-4" />
          编辑模式：点击任意天即可配置该天的主题、视频和题目
        </div>

        {/* 日历网格 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <AdminTemplateCalendar
            days={activeDays}
            daysCount={template.days_count}
            onDayClick={(day) => openDayEditor(day, 'active')}
            onAddDay={handleAddDay}
            isEditing={true}
            onReorder={async (fromDay, toDay) => {
              if (!activeTemplate?.id) return
              try {
                await templateApi.reorderDays(activeTemplate.id, fromDay, toDay)
                // 刷新模板详情
                const res = await templateApi.getTemplateById(activeTemplate.id)
                const templateData = res.data?.data || res.data
                if (templateData) {
                  setActiveDays(templateData.days || [])
                }
                setToast({ type: 'success', message: `Day ${fromDay} 已移动到 Day ${toDay}` })
              } catch (err) {
                console.error('重排天数失败:', err)
                setToast({ type: 'error', message: err.message || '重排失败' })
              }
            }}
          />
        </div>

        {/* 底部保存栏 */}
        <div className="flex justify-center pt-2 pb-4">
          <button
            onClick={async () => {
              await loadTemplates()
              setView('list')
              setActiveTemplate(null)
              setActiveDays([])
              setToast({ type: 'success', message: '计划已保存' })
            }}
            className="flex items-center gap-2 px-8 py-3 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl transition-colors shadow-sm"
          >
            <CheckCircle2 className="w-5 h-5" />
            保存计划并完成编辑
          </button>
        </div>
      </div>
    )
  }

  // ---------- 创建计划Modal ----------
  const renderCreateModal = () =>
    createModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">创建学习计划</h3>
            <button
              onClick={() => setCreateModalOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                计划名称 <span className="text-red-500">*</span>
              </label>
              <input
                value={newPlan.name}
                onChange={(e) =>
                  setNewPlan({ ...newPlan, name: e.target.value })
                }
                placeholder="例如：算法基础学习计划"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                计划描述
              </label>
              <textarea
                value={newPlan.description}
                onChange={(e) =>
                  setNewPlan({ ...newPlan, description: e.target.value })
                }
                placeholder="简要描述该计划的学习目标和内容..."
                rows={3}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                学习天数 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={365}
                value={newPlan.days_count}
                onChange={(e) =>
                  setNewPlan({
                    ...newPlan,
                    days_count: parseInt(e.target.value) || 1,
                  })
                }
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-xs text-gray-400 mt-1">建议范围：7~90天</p>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="px-5 py-2.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {creating && <Loader2 className="w-4 h-4 animate-spin" />}
              {creating ? '创建中...' : '创建'}
            </button>
          </div>
        </div>
      </div>
    )

  // ---------- 查看详情Modal ----------
  const renderDetailModal = () =>
    detailModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {detailTemplate?.name}
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {detailTemplate?.description || '暂无描述'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* 编辑/只读切换 */}
              <button
                onClick={() => setIsDetailEditing((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDetailEditing
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isDetailEditing ? (
                  <>
                    <Pencil className="w-4 h-4" />
                    编辑中
                  </>
                ) : (
                  <>
                    <Pencil className="w-4 h-4" />
                    编辑
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setDetailModalOpen(false)
                  setIsDetailEditing(false)
                  setDetailTemplate(null)
                  setDetailDays([])
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {detailLoading ? (
              <div className="text-center py-10 text-gray-400">
                <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" />
                <p className="text-sm">加载详情中...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 统计信息 */}
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-emerald-500" />
                    共 {detailTemplate?.days_count || detailDays.length || 0} 天
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="w-4 h-4 text-blue-500" />
                    题目:{' '}
                    {detailDays.reduce(
                      (sum, d) => sum + (d.problems?.length || 0),
                      0
                    )}{' '}
                    道
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Video className="w-4 h-4 text-purple-500" />
                    视频:{' '}
                    {detailDays.reduce(
                      (sum, d) => sum + (d.videos?.length || 0),
                      0
                    )}{' '}
                    个
                  </div>
                </div>

                {/* 编辑模式提示 */}
                {isDetailEditing && (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
                    <Pencil className="w-4 h-4" />
                    编辑模式已开启，点击任意天即可编辑
                  </div>
                )}

                {/* 日历网格 */}
                <AdminTemplateCalendar
                  days={detailDays}
                  daysCount={detailTemplate?.days_count}
                  onDayClick={(day) => {
                    openDayEditor(day, 'detail')
                  }}
                  onAddDay={isDetailEditing ? handleDetailAddDay : undefined}
                  isEditing={isDetailEditing}
                  onReorder={isDetailEditing ? async (fromDay, toDay) => {
                    if (!detailTemplate?.id) return
                    try {
                      await templateApi.reorderDays(detailTemplate.id, fromDay, toDay)
                      const res = await templateApi.getTemplateById(detailTemplate.id)
                      const detailData = res.data?.data || res.data
                      if (detailData) {
                        setDetailDays(detailData.days || [])
                      }
                      setToast({ type: 'success', message: `Day ${fromDay} 已移动到 Day ${toDay}` })
                    } catch (err) {
                      console.error('重排天数失败:', err)
                      setToast({ type: 'error', message: err.message || '重排失败' })
                    }
                  } : undefined}
                />
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {isDetailEditing
                ? '点击任意天即可编辑内容'
                : '点击右上角"编辑"按钮可进入编辑模式'}
            </div>
            <button
              onClick={() => {
                setDetailModalOpen(false)
                setIsDetailEditing(false)
                setDetailTemplate(null)
                setDetailDays([])
              }}
              className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    )

  // ---------- AdminDayEditor ----------
  const renderDayEditor = () =>
    dayEditorOpen &&
    editingContext && (
      <AdminDayEditor
        templateId={editingContext.templateId}
        dayNumber={editingContext.dayNumber}
        dayData={editingContext.dayData}
        onClose={closeDayEditor}
        onSaveSuccess={handleDaySaveSuccess}
        onDeleteDay={() => handleDeleteDay(editingContext.templateId, editingContext.dayNumber, editingContext.dayData?.day_number)}
      />
    )

  // ====== 主渲染 ======
  return (
    <div className="space-y-6 p-2 relative">
      {renderToast()}

      {view === 'list' && renderListView()}
      {view === 'calendar' && renderCalendarView()}

      {/* 弹窗层 */}
      {renderCreateModal()}
      {renderDetailModal()}
      {renderDayEditor()}
    </div>
  )
}

export default PlanManagement

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { usePlanStore } from '../../stores/planStore'
import { planApi } from '../../api/client'
import {
  Pencil,
  Plus,
  Trash2,
  GripVertical,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import TopBanner from '../../components/Calendar/TopBanner'
import MonthNavigator from '../../components/Calendar/MonthNavigator'
import MonthCalendarGrid from '../../components/Calendar/MonthCalendarGrid'
import DayDetailModal from '../../components/Calendar/DayDetailModal'
import BottomStatsBar from '../../components/Calendar/BottomStatsBar'
import PlanSwitcher from '../../components/Plan/PlanSwitcher'

// ------------------------------------------------------------------
// 辅助函数
// ------------------------------------------------------------------

function extractMonths(calendarData) {
  const monthSet = new Set()
  calendarData.forEach((day) => {
    if (day.date) {
      const [year, month] = day.date.split('-')
      monthSet.add(`${year}-${month}`)
    }
  })
  return Array.from(monthSet).sort()
}

function getMonthLabel(monthKey) {
  if (!monthKey) return ''
  const [year, month] = monthKey.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })
}

// ------------------------------------------------------------------
// Toast 组件
// ------------------------------------------------------------------

const Toast = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [toast, onClose])

  if (!toast) return null

  const isSuccess = toast.type === 'success'
  return (
    <div
      className={
        'fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-5 py-3 rounded-xl shadow-lg text-sm font-medium border backdrop-blur-sm transition-all duration-300 ' +
        (isSuccess
          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
          : 'bg-red-50 border-red-200 text-red-700')
      }
    >
      {isSuccess ? (
        <Check className="w-4 h-4 text-emerald-500" />
      ) : (
        <X className="w-4 h-4 text-red-500" />
      )}
      {toast.message}
    </div>
  )
}

// ------------------------------------------------------------------
// 主组件
// ------------------------------------------------------------------

const StudentCalendarView = () => {
  // ---------- Store ----------
  const {
    calendarData,
    currentPlan,
    plans,
    fetchStudentCalendarFull,
    fetchStudentPlans,
    fetchStatistics,
    setCurrentPlan,
    loadDemoData,
    addPlanDay,
    deletePlanDay,
    openDayModal,
    selectedDay,
  } = usePlanStore()

  // ---------- Local State ----------
  const [isEditing, setIsEditing] = useState(false)
  const [addingDay, setAddingDay] = useState(false)
  const [deletingDay, setDeletingDay] = useState(false)
  const [selectedDayNumber, setSelectedDayNumber] = useState(null)
  const [toast, setToast] = useState(null)
  const [currentMonth, setCurrentMonth] = useState('') // "YYYY-MM"
  const [initialized, setInitialized] = useState(false)

  // ---------- Computed ----------
  const months = useMemo(() => extractMonths(calendarData), [calendarData])

  const currentMonthData = useMemo(() => {
    if (!currentMonth || calendarData.length === 0) return []
    return calendarData.filter((day) => {
      if (!day.date) return false
      return day.date.startsWith(currentMonth)
    })
  }, [currentMonth, calendarData])

  const currentMonthLabel = useMemo(
    () => getMonthLabel(currentMonth),
    [currentMonth]
  )

  // ---------- Effects ----------

  // 初始化：获取学员计划列表
  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        // 先尝试获取真实数据
        const plansList = await fetchStudentPlans()

        if (!mounted) return

        if (plansList && plansList.length > 0) {
          // 如果已有 currentPlan，优先使用当前选中的计划
          const existingCurrentPlan = usePlanStore.getState().currentPlan
          const activePlan = existingCurrentPlan || plansList[0]
          if (!existingCurrentPlan) {
            setCurrentPlan(activePlan)
          }
          await fetchStudentCalendarFull(activePlan.id)
          await fetchStatistics(activePlan.id)
        } else {
          // 无计划则加载演示数据
          loadDemoData()
        }
      } catch (err) {
        console.error('初始化日历数据失败:', err)
        // 降级到演示数据
        if (mounted) loadDemoData()
      } finally {
        if (mounted) setInitialized(true)
      }
    }

    init()
    return () => {
      mounted = false
    }
  }, [
    fetchStudentPlans,
    fetchStudentCalendarFull,
    fetchStatistics,
    setCurrentPlan,
    loadDemoData,
  ])

  // 当月历数据变化时，设置默认月份
  useEffect(() => {
    if (months.length > 0 && !currentMonth) {
      setCurrentMonth(months[0])
    }
  }, [months, currentMonth])

  // ---------- Handlers ----------

  const handlePlanChange = useCallback(async (plan) => {
    if (!plan || plan.id === currentPlan?.id) return
    setCurrentPlan(plan)
    setCurrentMonth('')
    setIsEditing(false)
    setSelectedDayNumber(null)
    try {
      await fetchStudentCalendarFull(plan.id)
      await fetchStatistics(plan.id)
    } catch (err) {
      console.error('切换计划失败:', err)
      showToast('error', '切换计划失败')
    }
  }, [currentPlan, setCurrentPlan, fetchStudentCalendarFull, fetchStatistics])

  const showToast = useCallback((type, message) => {
    setToast({ type, message })
  }, [])

  const dismissToast = useCallback(() => {
    setToast(null)
  }, [])

  const handleToggleEdit = useCallback(() => {
    setIsEditing((prev) => {
      const next = !prev
      if (!next) {
        setSelectedDayNumber(null) // 退出编辑时清除选中
      }
      return next
    })
  }, [])

  const handleAddDay = useCallback(async () => {
    if (!currentPlan?.id) {
      showToast('error', '请先选择一个学习计划')
      return
    }
    setAddingDay(true)
    try {
      await addPlanDay(currentPlan.id)
      // 重新拉取日历数据
      await fetchStudentCalendarFull(currentPlan.id)
      showToast('success', '新增一天成功')
    } catch (err) {
      console.error('新增一天失败:', err)
      showToast('error', err?.message || '新增一天失败')
    } finally {
      setAddingDay(false)
    }
  }, [currentPlan, addPlanDay, fetchStudentCalendarFull, showToast])

  const handleDeleteDay = useCallback(async () => {
    if (!currentPlan?.id || !selectedDayNumber) {
      showToast('error', '请先选择要删除的天数')
      return
    }
    setDeletingDay(true)
    try {
      await deletePlanDay(currentPlan.id, selectedDayNumber)
      await fetchStudentCalendarFull(currentPlan.id)
      setSelectedDayNumber(null)
      showToast('success', `Day ${selectedDayNumber} 已删除`)
    } catch (err) {
      console.error('删除天数失败:', err)
      showToast('error', err?.message || '删除天数失败')
    } finally {
      setDeletingDay(false)
    }
  }, [
    currentPlan,
    selectedDayNumber,
    deletePlanDay,
    fetchStudentCalendarFull,
    showToast,
  ])

  const handleDayClick = useCallback(
    (day) => {
      if (isEditing) {
        // 编辑模式下：点击选中/取消选中（用于删除）
        if (day?.dayNumber) {
          setSelectedDayNumber((prev) =>
            prev === day.dayNumber ? null : day.dayNumber
          )
        }
      } else {
        // 非编辑模式下：打开详情弹窗
        if (day) {
          openDayModal(day)
        }
      }
    },
    [isEditing, openDayModal]
  )

  const handleReorder = useCallback(
    async (fromDay, toDay) => {
      if (!currentPlan?.id || !isEditing) return
      try {
        await planApi.reorderDays(currentPlan.id, fromDay, toDay)
        await fetchStudentCalendarFull(currentPlan.id)
        showToast('success', `Day ${fromDay} 已移动到 Day ${toDay}`)
      } catch (err) {
        console.error('重排天数失败:', err)
        showToast('error', '重排失败')
      }
    },
    [currentPlan, isEditing, fetchStudentCalendarFull, showToast]
  )

  const handleMonthChange = useCallback(
    (newMonth) => {
      setCurrentMonth(newMonth)
      // 切换月份时清除选中状态
      if (isEditing) {
        setSelectedDayNumber(null)
      }
    },
    [isEditing]
  )

  // ---------- Loading ----------
  if (!initialized) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm">加载日历数据中...</p>
      </div>
    )
  }

  // ---------- Render ----------
  return (
    <div className="pb-[80px] relative min-h-screen bg-slate-50">
      {/* 顶部横幅 */}
      <TopBanner />

      {/* 计划切换 */}
      {plans.length > 1 && (
        <div className="px-4 pt-3 pb-1">
          <PlanSwitcher
            plans={plans}
            currentPlan={currentPlan}
            onPlanChange={handlePlanChange}
            loading={!initialized}
          />
        </div>
      )}

      {/* 月份导航（替换原来的 StageTabs） */}
      <MonthNavigator
        months={months}
        currentMonth={currentMonth}
        onMonthChange={handleMonthChange}
        planStartMonth={months[0] || ''}
        planEndMonth={months[months.length - 1] || ''}
      />

      {/* 编辑模式工具栏 */}
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between mb-3">
          {/* 当前月份标题 */}
          <h2 className="text-lg font-bold text-slate-800">
            {currentMonthLabel}
            <span className="ml-2 text-sm font-normal text-slate-500">
              ({currentMonthData.length} 天)
            </span>
          </h2>

          {/* 编辑/完成按钮 */}
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

        {/* 编辑模式提示 */}
        {isEditing && (
          <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
            <GripVertical className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              拖拽天数可调整顺序，点击天数可选中/取消选中（用于删除）
            </span>
          </div>
        )}
      </div>

      {/* 月份日历网格 */}
      <div className="px-4 pt-2">
        <MonthCalendarGrid
          month={currentMonth}
          calendarData={calendarData}
          onDayClick={handleDayClick}
          onReorder={handleReorder}
          isEditing={isEditing}
          selectedDayNumber={selectedDayNumber}
        />
      </div>

      {/* 编辑模式底部操作按钮 */}
      {isEditing && (
        <div className="fixed bottom-[72px] left-0 right-0 z-40 px-4">
          <div className="max-w-lg mx-auto flex items-center gap-3">
            {/* 新增一天 */}
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

            {/* 删除选中天 */}
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

      {/* 日期详情弹窗 */}
      <DayDetailModal isEditing={isEditing} />

      {/* 底部统计栏 */}
      <BottomStatsBar />

      {/* Toast 提示 */}
      <Toast toast={toast} onClose={dismissToast} />
    </div>
  )
}

export default StudentCalendarView

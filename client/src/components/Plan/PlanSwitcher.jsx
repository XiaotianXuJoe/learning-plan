import { useState, useRef, useEffect } from 'react'
import { ChevronDown, BookOpen } from 'lucide-react'

/**
 * PlanSwitcher - 计划切换下拉选择器
 * 用于学员端切换查看不同学习计划
 */
export default function PlanSwitcher({
  plans = [],
  currentPlan,
  onPlanChange,
  loading = false,
}) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (plans.length <= 1) return null // 只有一个计划时不显示切换器

  const currentName = currentPlan?.template_name || currentPlan?.name || '学习计划'

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-emerald-300 hover:shadow-sm transition-all"
      >
        <BookOpen className="w-4 h-4 text-emerald-500" />
        <span className="max-w-[180px] truncate">{currentName}</span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50">
          <div className="px-3 py-1.5 text-xs font-medium text-slate-400 uppercase tracking-wider">
            选择学习计划
          </div>
          {plans.map((plan, index) => {
            const isActive = currentPlan?.id === plan.id
            const planName = plan.template_name || plan.name || `计划 ${index + 1}`
            const totalDays = plan.total_days || plan.days_count || 0
            return (
              <button
                key={plan.id}
                onClick={() => {
                  onPlanChange(plan)
                  setOpen(false)
                }}
                className={`w-full text-left px-3 py-2.5 mx-1 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    isActive ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="truncate">{planName}</div>
                  {totalDays > 0 && (
                    <div className="text-xs text-slate-400 mt-0.5">
                      共 {totalDays} 天
                    </div>
                  )}
                </div>
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

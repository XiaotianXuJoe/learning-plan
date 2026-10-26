import React from 'react'
import { CheckCircle2, BookOpen, Calendar, Flame } from 'lucide-react'
import { usePlanStore } from '../../stores/planStore'

/**
 * 底部固定统计栏
 * 展示三项核心统计信息
 */
const BottomStatsBar = () => {
  const { statistics } = usePlanStore()

  const stats = [
    {
      label: '已完成天数',
      value: statistics.completedDays,
      total: statistics.totalDays,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
    {
      label: '总题目数',
      value: statistics.totalQuestions,
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: '剩余天数',
      value: statistics.remainingDays,
      icon: Calendar,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-around h-[60px]">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-2.5">
              {/* 图标 */}
              <div className={`w-9 h-9 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`w-4.5 h-4.5 ${stat.color}`} />
              </div>

              {/* 数值和标签 */}
              <div className="flex flex-col">
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-gray-800">
                    {stat.value}
                  </span>
                  {stat.total !== undefined && (
                    <span className="text-xs text-gray-400">
                      / {stat.total}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500 hidden sm:block">
                  {stat.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default BottomStatsBar

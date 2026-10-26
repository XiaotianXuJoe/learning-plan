import React from 'react'
import { CheckCircle2, BookOpen, Calendar, TrendingUp } from 'lucide-react'
import { usePlanStore } from '../../stores/planStore'

/**
 * 顶部绿色横幅统计区
 * 展示标题、已完成天数、总题目数、剩余天数、进度条
 */
const TopBanner = () => {
  const { currentPlan, statistics } = usePlanStore()

  const stats = [
    {
      label: '已完成',
      value: statistics.completedDays,
      unit: '天',
      icon: CheckCircle2,
      iconColor: 'text-emerald-200',
    },
    {
      label: '总题目',
      value: statistics.totalQuestions,
      unit: '题',
      icon: BookOpen,
      iconColor: 'text-emerald-200',
    },
    {
      label: '剩余',
      value: statistics.remainingDays,
      unit: '天',
      icon: Calendar,
      iconColor: 'text-emerald-200',
    },
  ]

  return (
    <div className="relative bg-emerald-500 min-h-[140px] h-[18vh] overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />

      {/* 内容区域 */}
      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 flex flex-col justify-center">
        {/* 标题行 */}
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-6 h-6 text-white/90" />
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            {currentPlan?.name || '算法学习计划'}
          </h2>
          <span className="px-2.5 py-0.5 bg-white/20 text-white text-xs font-medium rounded-full backdrop-blur-sm">
            进行中
          </span>
        </div>

        {/* 统计数据行 */}
        <div className="flex items-center gap-6 sm:gap-10 mb-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-2.5">
              <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-bold text-white">
                  {stat.value}
                </span>
                <span className="text-xs sm:text-sm text-emerald-100">
                  {stat.unit}
                </span>
              </div>
              <span className="text-xs text-emerald-200 hidden sm:inline">
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* 进度条 */}
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-emerald-100">总体进度</span>
            <span className="text-xs font-semibold text-white">
              {statistics.progressPercent}%
            </span>
          </div>
          <div className="w-full h-2.5 bg-black/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-700 ease-out"
              style={{ width: `${statistics.progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default TopBanner

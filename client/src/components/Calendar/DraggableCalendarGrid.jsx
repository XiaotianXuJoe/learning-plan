import React, { useState } from 'react'
import DraggableDayCard from './DraggableDayCard'
import { Loader2 } from 'lucide-react'

/**
 * DraggableCalendarGrid - 可拖拽的日历网格
 * 每行7列，支持拖拽重排天数
 */
const DraggableCalendarGrid = ({
  days = [],
  onDayClick,
  onReorder,
  loading = false,
  isEditing = false,
}) => {
  const [reordering, setReordering] = useState(false)

  // 处理重排
  const handleReorder = async (fromDay, toDay) => {
    if (reordering) return
    setReordering(true)
    try {
      await onReorder(fromDay, toDay)
    } finally {
      setReordering(false)
    }
  }

  // 按7天一组分组
  const groupByWeek = (items) => {
    const weeks = []
    for (let i = 0; i < items.length; i += 7) {
      weeks.push(items.slice(i, i + 7))
    }
    return weeks
  }

  const weeks = groupByWeek(days)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
        <span className="ml-2 text-sm text-gray-500">加载中...</span>
      </div>
    )
  }

  if (days.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <p className="text-sm">暂无日历数据</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {reordering && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 rounded-xl">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
        </div>
      )}
      <div className="space-y-3">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-3">
            {week.map((day, dayIndex) => (
              <DraggableDayCard
                key={day ? `day-${day.dayNumber}` : `empty-${weekIndex}-${dayIndex}`}
                dayData={day}
                onDayClick={onDayClick}
                onReorder={handleReorder}
                isEditing={isEditing}
              />
            ))}
            {/* 补充空位到7列 */}
            {week.length < 7 && Array(7 - week.length).fill(null).map((_, i) => (
              <div key={`pad-${weekIndex}-${i}`} className="h-[150px]" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default DraggableCalendarGrid

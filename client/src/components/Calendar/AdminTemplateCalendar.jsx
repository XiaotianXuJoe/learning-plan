import React from 'react'
import {
  Plus,
} from 'lucide-react'
import DraggableCalendarGrid from './DraggableCalendarGrid'

/**
 * 管理员模板日历展示组件
 * 支持拖拽重排天数，点击某天触发 onDayClick(day)
 */
const AdminTemplateCalendar = ({ days = [], daysCount = 0, onDayClick, onAddDay, onReorder, isEditing = false }) => {
  // 按 day_number 排序
  const sortedDays = [...days].sort((a, b) => a.day_number - b.day_number)

  // 如果传了 daysCount，补齐缺失的天数（用空数据占位）
  const fullDays = []
  if (daysCount > 0) {
    for (let i = 1; i <= daysCount; i++) {
      const found = sortedDays.find((d) => d.day_number === i)
      if (found) {
        fullDays.push(found)
      } else {
        fullDays.push({
          day_number: i,
          theme: '休息日',
          is_rest_day: true,
          videos: [],
          problems: [],
        })
      }
    }
  } else {
    fullDays.push(...sortedDays)
  }

  // 转换为 DraggableCalendarGrid 期望的 camelCase 格式
  const gridDays = fullDays.map((d) => ({
    dayNumber: d.day_number,
    theme: d.theme,
    isRestDay: d.is_rest_day,
    status: d.is_rest_day ? 'rest' : (d.videos?.length > 0 || d.problems?.length > 0 ? 'pending' : null),
    totalVideos: d.videos?.length || 0,
    watchedVideos: 0,
    totalProblems: d.problems?.length || 0,
    completedProblems: 0,
  }))

  // 点击某天时，传递原始数据
  const handleDayClick = (dayData) => {
    if (!onDayClick) return
    // 找到对应的原始数据
    const originalDay = fullDays.find((d) => d.day_number === dayData.dayNumber)
    if (originalDay) {
      onDayClick(originalDay)
    }
  }

  return (
    <div className="space-y-3">
      <DraggableCalendarGrid
        days={gridDays}
        onDayClick={handleDayClick}
        onReorder={(fromDay, toDay) => {
          if (onReorder) onReorder(fromDay, toDay)
        }}
        isEditing={isEditing}
      />

      {/* 增加一天按钮 */}
      {onAddDay && (
        <div className="grid grid-cols-7 gap-3 mt-3">
          <div
            onClick={onAddDay}
            className="col-span-7 min-h-[80px] rounded-xl border-2 border-dashed border-emerald-200
                       flex items-center justify-center gap-2 cursor-pointer
                       text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50
                       transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm font-medium">增加一天</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminTemplateCalendar

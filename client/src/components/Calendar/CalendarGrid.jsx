import React from 'react'
import MonthCalendarGrid from './MonthCalendarGrid'

/**
 * CalendarGrid —— MonthCalendarGrid 的适配层
 *
 * 原有代码通过 StageTabs + DraggableCalendarGrid 实现日历展示。
 * 现在改为月份视图后，CalendarGrid 退化为 MonthCalendarGrid 的薄透传层，
 * 保持相同的 export 接口，避免影响其他引用方。
 *
 * Props:
 *   - month: string            当前月份 "YYYY-MM"
 *   - calendarData: Array      完整的日历数据
 *   - onDayClick: (day) => void  日期点击回调
 *   - onReorder: (fromDay, toDay) => void  拖拽重排回调
 *   - isEditing: boolean       是否处于编辑模式
 *   - selectedDayNumber: number|null  当前选中的天数编号（编辑模式下）
 */
const CalendarGrid = ({
  month = '',
  calendarData = [],
  onDayClick,
  onReorder,
  isEditing = false,
  selectedDayNumber = null,
}) => {
  return (
    <MonthCalendarGrid
      month={month}
      calendarData={calendarData}
      onDayClick={onDayClick}
      onReorder={onReorder}
      isEditing={isEditing}
      selectedDayNumber={selectedDayNumber}
    />
  )
}

export default CalendarGrid

import React, { useState } from 'react'
import { GripVertical, Video, FileText, Coffee } from 'lucide-react'

/**
 * DraggableDayCard - 可拖拽的天数卡片
 * 支持HTML5拖拽API，可拖拽到目标位置重排天数
 */
const DraggableDayCard = ({
  dayData,
  onDayClick,
  onReorder,
  isAdmin = false,
  isEditing = false,
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  if (!dayData) {
    return <div className="aspect-square" /> // 空占位
  }

  const { dayNumber, theme, isRestDay, status, totalVideos = 0, watchedVideos = 0, totalProblems = 0, completedProblems = 0 } = dayData

  // 拖拽开始
  const handleDragStart = (e) => {
    setIsDragging(true)
    e.dataTransfer.setData('text/plain', String(dayNumber))
    e.dataTransfer.effectAllowed = 'move'
    // 设置拖拽时的半透明效果
    if (e.target.style) {
      e.target.style.opacity = '0.5'
    }
  }

  // 拖拽结束
  const handleDragEnd = (e) => {
    setIsDragging(false)
    if (e.target.style) {
      e.target.style.opacity = '1'
    }
  }

  // 拖拽经过
  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
  }

  // 拖拽离开
  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  // 放置
  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const fromDay = parseInt(e.dataTransfer.getData('text/plain'), 10)
    const toDay = dayNumber
    if (fromDay && toDay && fromDay !== toDay && onReorder) {
      onReorder(fromDay, toDay)
    }
  }

  // 状态颜色
  const getCardClass = () => {
    if (isDragOver) return 'ring-2 ring-blue-400 ring-offset-2 scale-105'
    if (isDragging) return 'opacity-50'
    return ''
  }

  const getBgClass = () => {
    if (isRestDay) return 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-200'
    if (status === 'completed' || status === 1) return 'bg-gradient-to-br from-emerald-400 to-emerald-500 border-emerald-300'
    if (status === 'partial') return 'bg-gradient-to-br from-amber-300 to-amber-400 border-amber-300'
    return 'bg-white border-gray-200 hover:border-emerald-300'
  }

  const getTextClass = () => {
    if (isRestDay) return 'text-gray-400'
    if (status === 'completed' || status === 1 || status === 'partial') return 'text-white'
    return 'text-gray-700'
  }

  return (
    <div
      className={`relative h-[150px] rounded-xl border p-3 flex flex-col transition-all duration-200 ${getBgClass()} ${getCardClass()} ${isEditing ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
      draggable={isEditing}
      onDragStart={isEditing ? handleDragStart : undefined}
      onDragEnd={isEditing ? handleDragEnd : undefined}
      onDragOver={isEditing ? handleDragOver : undefined}
      onDragLeave={isEditing ? handleDragLeave : undefined}
      onDrop={isEditing ? handleDrop : undefined}
      onClick={() => onDayClick && onDayClick(dayData)}
      title={`Day ${dayNumber}${theme ? ' · ' + theme : ''} (拖拽可重排)`}
    >
      {/* ===== 顶部行：拖拽手柄 + 状态标签 (h-5 固定高度) ===== */}
      <div className="flex items-center justify-between h-5 shrink-0">
        {isEditing ? (
          <GripVertical className={`w-3 h-3 ${isRestDay ? 'text-gray-300' : status === 'completed' || status === 'partial' ? 'text-white/60' : 'text-gray-300'}`} />
        ) : (
          <div className="w-3" />
        )}
        <span className={`text-[10px] font-medium leading-5 px-1.5 rounded-full ${
          isRestDay ? 'bg-gray-500/10 text-gray-500' :
          status === 'completed' || status === 1 ? 'bg-white/20 text-white' :
          status === 'partial' ? 'bg-white/20 text-white' :
          'bg-emerald-500/10 text-emerald-600'
        }`}>
          {isRestDay ? '休息' : status === 'completed' || status === 1 ? '完成' : status === 'partial' ? '进行' : '待学'}
        </span>
      </div>

      {/* ===== 中间主内容区 (flex-1 占满剩余空间，内容垂直居中) ===== */}
      <div className="flex-1 flex flex-col justify-center min-h-0">
        {/* Day编号：统一行高 */}
        <p className={`text-lg font-bold leading-7 ${getTextClass()}`}>Day {dayNumber}</p>
        {/* 主题/日期：统一行高和高度，无内容时占位 */}
        <p className={`text-[11px] leading-4 truncate h-4 ${isRestDay ? 'text-gray-400' : status === 'completed' || status === 'partial' || status === 1 ? 'text-white/80' : 'text-gray-500'}`}>
          {theme || ''}
        </p>
      </div>

      {/* ===== 底部统计行 (h-5 固定高度，无统计时空位) ===== */}
      <div className={`flex items-center gap-2 h-5 shrink-0 text-[10px] leading-5 ${status === 'completed' || status === 'partial' || status === 1 ? 'text-white/70' : 'text-gray-400'}`}>
        {!isRestDay && totalVideos > 0 && (
          <span className="flex items-center gap-0.5">
            <Video className="w-2.5 h-2.5" />
            {watchedVideos}/{totalVideos}
          </span>
        )}
        {!isRestDay && totalProblems > 0 && (
          <span className="flex items-center gap-0.5">
            <FileText className="w-2.5 h-2.5" />
            {completedProblems}/{totalProblems}
          </span>
        )}
      </div>
    </div>
  )
}

export default DraggableDayCard

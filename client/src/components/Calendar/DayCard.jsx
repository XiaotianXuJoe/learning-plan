import React from 'react'
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  Coffee,
  Clock,
  BookOpen,
  Tag,
  PlayCircle,
} from 'lucide-react'
import { usePlanStore } from '../../stores/planStore'

/**
 * 日期卡片组件
 * 5种状态：正常学习日、休息日、已完成、进行中、需复习
 * 包含：Day编号、日期、学习时长、题目数量、知识点标签、完成图标
 */
const DayCard = ({ dayData }) => {
  const { openDayModal } = usePlanStore()

  // 处理点击 - 打开详情弹窗
  const handleClick = () => {
    openDayModal(dayData)
  }

  // 如果没有数据，渲染空占位
  if (!dayData) {
    return (
      <div className="min-h-[140px] rounded-xl bg-transparent" />
    )
  }

  // ====== 休息日卡片 ======
  if (dayData.isRestDay) {
    return (
      <div
        onClick={handleClick}
        className="day-card min-h-[140px] rounded-xl bg-gray-100 border-2 border-dashed border-gray-200 p-4 flex flex-col items-center justify-center cursor-pointer"
      >
        <Coffee className="w-8 h-8 text-gray-400 mb-2" />
        <span className="text-sm font-medium text-gray-500">休息日</span>
        <span className="text-xs text-gray-400 mt-1">
          Day {dayData.dayNumber}
        </span>
        {dayData.dateDisplay && (
          <span className="text-xs text-gray-400">{dayData.dateDisplay}</span>
        )}
      </div>
    )
  }

  // ====== 判断卡片类型和样式 ======
  const isCompleted = dayData.isCompleted || dayData.type === 'completed'
  const isInProgress = dayData.type === 'in_progress'
  const needsReview = dayData.type === 'need_review'

  // 卡片背景样式
  const cardStyles = isCompleted
    ? 'bg-emerald-50 border-2 border-emerald-200'
    : isInProgress
    ? 'bg-white border-2 border-blue-300 shadow-md shadow-blue-100/50'
    : needsReview
    ? 'bg-amber-50 border-2 border-amber-200'
    : 'bg-white border border-gray-200'

  // Day编号颜色
  const dayNumberStyles = isCompleted
    ? 'text-emerald-700'
    : isInProgress
    ? 'text-blue-600'
    : needsReview
    ? 'text-amber-700'
    : 'text-gray-700'

  // 状态图标
  const StatusIcon = isCompleted
    ? CheckCircle2
    : isInProgress
    ? PlayCircle
    : needsReview
    ? AlertCircle
    : Circle

  const statusIconColor = isCompleted
    ? 'text-emerald-500'
    : isInProgress
    ? 'text-blue-500'
    : needsReview
    ? 'text-amber-500'
    : 'text-gray-300'

  return (
    <div
      onClick={handleClick}
      className={`day-card ${cardStyles} min-h-[140px] rounded-xl p-3 flex flex-col cursor-pointer relative overflow-hidden`}
    >
      {/* 顶部：Day编号和状态图标 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className={`text-lg font-bold ${dayNumberStyles}`}>
            Day {dayData.dayNumber}
          </span>
          {dayData.dateDisplay && (
            <span className="text-xs text-gray-400">{dayData.dateDisplay}</span>
          )}
        </div>
        <StatusIcon className={`w-5 h-5 ${statusIconColor} flex-shrink-0`} />
      </div>

      {/* 学习时长和题目数量 */}
      <div className="flex items-center gap-3 mb-2">
        {dayData.duration && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3.5 h-3.5" />
            <span>{dayData.duration}分钟</span>
          </div>
        )}
        {dayData.questionCount !== undefined && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <BookOpen className="w-3.5 h-3.5" />
            <span>{dayData.questionCount}题</span>
          </div>
        )}
      </div>

      {/* 知识点标签 */}
      {dayData.topic && (
        <div className="mt-auto">
          <div className="flex items-center gap-1">
            <Tag className="w-3 h-3 text-gray-400 flex-shrink-0" />
            <span
              className={`text-xs font-medium truncate ${
                isCompleted
                  ? 'text-emerald-600'
                  : needsReview
                  ? 'text-amber-600'
                  : 'text-gray-600'
              }`}
            >
              {dayData.topic}
            </span>
          </div>
        </div>
      )}

      {/* 完成标记 - 左上角装饰 */}
      {isCompleted && (
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-4 h-4 text-white" />
        </div>
      )}

      {/* 进行中标记 - 脉冲动画 */}
      {isInProgress && (
        <div className="absolute top-2 right-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500" />
          </span>
        </div>
      )}
    </div>
  )
}

export default DayCard

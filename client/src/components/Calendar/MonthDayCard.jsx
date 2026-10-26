import React from "react";
import {
  Coffee,
  CheckCircle2,
  Circle,
  Clock,
  PlayCircle,
  BookOpen,
  Video,
} from "lucide-react";

/**
 * MonthDayCard - 单日卡片组件
 *
 * Props:
 *   date: string              - 日期 "YYYY-MM-DD"
 *   dayOfMonth: number        - 月份中的第几天 1-31
 *   isCurrentMonth: boolean   - 是否属于当前展示的月份
 *   planDay: object | null    - 对应计划数据，null表示该日无计划
 *   onDayClick: (planDay) => void
 *   isEditing: boolean
 */
export default function MonthDayCard({
  date,
  dayOfMonth,
  isCurrentMonth,
  planDay,
  onDayClick,
  isEditing,
  selectedDayNumber,
}) {
  // ── 非当前月的日期：灰色淡化背景，只显示日期数字 ──
  if (!isCurrentMonth) {
    return (
      <div
        className="min-h-[100px] rounded-xl bg-gray-100/60 border border-gray-100/80 p-2 flex flex-col items-start justify-start opacity-50"
      >
        <span className="text-sm text-gray-400 font-medium">{dayOfMonth}</span>
      </div>
    );
  }

  // ── 当前月的日期，无计划：白色背景 + 细边框 ──
  if (!planDay) {
    return (
      <div className="min-h-[100px] rounded-xl bg-white border border-gray-100 p-2 flex flex-col items-start justify-start transition-all duration-200 hover:shadow-md hover:border-gray-200">
        <span className="text-sm text-gray-500 font-medium">{dayOfMonth}</span>
      </div>
    );
  }

  // ── 当前月有计划的日期 ──

  // 判断状态
  const isRest = planDay.isRestDay || planDay.status === "rest";
  const isCompleted = planDay.status === "completed" || planDay.type === "completed";
  const isInProgress =
    planDay.status === "partial" || planDay.type === "in_progress";
  const isSelected = isEditing && selectedDayNumber === planDay.dayNumber;

  // 卡片样式
  let cardClasses =
    "min-h-[100px] rounded-xl p-2 flex flex-col relative cursor-pointer select-none transition-all duration-200 hover:shadow-md ";

  if (isRest) {
    cardClasses += "bg-gray-50 border border-gray-200 text-gray-500";
  } else if (isCompleted) {
    cardClasses += isSelected
      ? "bg-emerald-500 border-[3px] border-indigo-500 text-white shadow-lg"
      : "bg-emerald-500 border border-emerald-500 text-white";
  } else if (isInProgress) {
    cardClasses += isSelected
      ? "bg-white border-[3px] border-indigo-500 text-gray-800 shadow-lg"
      : "bg-white border-2 border-emerald-300 text-gray-800";
  } else {
    cardClasses += isSelected
      ? "bg-white border-[3px] border-indigo-500 text-gray-800 shadow-lg"
      : "bg-white border border-gray-200 text-gray-800";
  }

  // 编辑模式拖拽（仅当有 planDay 时）
  const dragAttrs = isEditing && planDay
    ? {
        draggable: true,
        onDragStart: (e) => {
          e.dataTransfer.setData("text/plain", date);
          e.dataTransfer.effectAllowed = "move";
        },
      }
    : {};

  // 状态标签配置
  const statusConfig = {
    rest: {
      label: "休息",
      icon: Coffee,
      className: isRest
        ? "bg-gray-200 text-gray-600"
        : "bg-gray-100 text-gray-500",
    },
    completed: {
      label: "完成",
      icon: CheckCircle2,
      className: isCompleted
        ? "bg-emerald-400/30 text-white"
        : "bg-emerald-100 text-emerald-600",
    },
    in_progress: {
      label: "进行中",
      icon: Clock,
      className: "bg-amber-100 text-amber-600",
    },
    normal: {
      label: "待学",
      icon: Circle,
      className: "bg-gray-100 text-gray-500",
    },
  };

  const currentStatus = isRest
    ? "rest"
    : isCompleted
    ? "completed"
    : isInProgress
    ? "in_progress"
    : "normal";

  const { label, icon: StatusIcon, className: statusClass } =
    statusConfig[currentStatus];

  // 统计颜色
  const statTextClass =
    isCompleted && !isRest ? "text-emerald-100" : "text-gray-400";
  const statIconClass =
    isCompleted && !isRest ? "text-emerald-200" : "text-gray-400";

  return (
    <div
      className={cardClasses}
      onClick={() => onDayClick && onDayClick(planDay)}
      {...dragAttrs}
    >
      {/* 顶部行：日期号 + 状态标签 */}
      <div className="flex items-start justify-between w-full mb-1">
        {/* 日期号 */}
        <span
          className={`text-sm font-bold ${
            isCompleted && !isRest ? "text-white" : "text-gray-700"
          }`}
        >
          {dayOfMonth}
        </span>

        {/* 状态标签 */}
        <span
          className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusClass}`}
        >
          <StatusIcon size={10} />
          {label}
        </span>
      </div>

      {/* 休息日：显示 "休息" + Day N */}
      {isRest && (
        <div className="flex-1 flex flex-col items-center justify-center gap-0.5">
          <Coffee size={20} className="text-gray-400 mb-0.5" />
          <span className="text-xs text-gray-400">休息</span>
          {planDay.dayNumber && (
            <span className="text-[10px] text-gray-400 mt-0.5">
              Day {planDay.dayNumber}
            </span>
          )}
        </div>
      )}

      {/* 非休息日：显示 Day N + 主题 + 迷你统计 */}
      {!isRest && (
        <>
          {/* Day N + 主题 */}
          <div className="flex-1 flex flex-col gap-0.5 mt-0.5">
            {planDay.dayNumber && (
              <span
                className={`text-[10px] font-semibold uppercase tracking-wide ${
                  isCompleted ? "text-emerald-100" : "text-emerald-600"
                }`}
              >
                Day {planDay.dayNumber}
              </span>
            )}
            {(planDay.theme || planDay.topic) && (
              <span
                className={`text-xs font-medium leading-tight line-clamp-2 ${
                  isCompleted ? "text-white" : "text-gray-700"
                }`}
              >
                {planDay.theme || planDay.topic}
              </span>
            )}
          </div>

          {/* 迷你统计：题目 + 视频 */}
          <div className="flex items-center gap-2 mt-1.5 pt-1 border-t border-opacity-20 border-current">
            {/* 题目统计 */}
            {typeof planDay.questionCount === "number" && (
              <div className={`flex items-center gap-0.5 ${statTextClass}`}>
                <BookOpen size={10} className={statIconClass} />
                <span className="text-[10px]">
                  {planDay.completedProblems ?? 0}/{planDay.questionCount}
                </span>
              </div>
            )}

            {/* 视频统计 */}
            {typeof planDay.totalVideos === "number" && (
              <div className={`flex items-center gap-0.5 ${statTextClass}`}>
                <Video size={10} className={statIconClass} />
                <span className="text-[10px]">
                  {planDay.watchedVideos ?? 0}/{planDay.totalVideos}
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

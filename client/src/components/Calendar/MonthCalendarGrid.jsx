import React, { useState, useMemo, useEffect } from "react";
import {
  CalendarDays,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CalendarOff,
} from "lucide-react";
import MonthDayCard from "./MonthDayCard";

// ── 辅助函数 ──────────────────────────────────────────

/** 获取某月第一天是星期几 (0=周日, 1=周一, ..., 6=周六) */
function getFirstDayOfMonth(year, month) {
  return new Date(year, month - 1, 1).getDay();
}

/** 获取某月有多少天 */
function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

/** 格式化日期为 YYYY-MM-DD */
function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** 生成日历格子数组（6行 x 7列 = 42个格子） */
function generateCalendarGrid(year, month, planDayMap) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfWeek = getFirstDayOfMonth(year, month); // 0=周日

  const cells = [];

  // ── 前月补位 ──
  if (firstDayOfWeek > 0) {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);

    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const date = new Date(prevYear, prevMonth - 1, dayNum);
      const dateKey = formatDateKey(date);
      cells.push({
        date: dateKey,
        dayOfMonth: dayNum,
        isCurrentMonth: false,
        planDay: planDayMap.get(dateKey) || null,
      });
    }
  }

  // ── 当月所有天 ──
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dateKey = formatDateKey(date);
    cells.push({
      date: dateKey,
      dayOfMonth: day,
      isCurrentMonth: true,
      planDay: planDayMap.get(dateKey) || null,
    });
  }

  // ── 后月补位，填充到42个格子 ──
  const remaining = 42 - cells.length;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  for (let day = 1; day <= remaining; day++) {
    const date = new Date(nextYear, nextMonth - 1, day);
    const dateKey = formatDateKey(date);
    cells.push({
      date: dateKey,
      dayOfMonth: day,
      isCurrentMonth: false,
      planDay: planDayMap.get(dateKey) || null,
    });
  }

  return cells;
}

/** 月份名称 */
const MONTH_NAMES = [
  "一月", "二月", "三月", "四月", "五月", "六月",
  "七月", "八月", "九月", "十月", "十一月", "十二月",
];

/** 星期标题（周日开头） */
const WEEKDAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

// ── 主组件 ────────────────────────────────────────────

/**
 * MonthCalendarGrid - 标准自然月日历网格组件
 *
 * Props:
 *   month: string            - 当前展示的月份 "YYYY-MM-DD"（取年月部分）
 *   calendarData: array      - 计划数据数组（来自store），每项有 .date 字段
 *   onDayClick: (day) => void
 *   isEditing: boolean
 *   onReorder: (sourceDate, targetDate) => void   - 拖拽重排回调（可选）
 *   loading: boolean         - 加载状态（可选）
 */
export default function MonthCalendarGrid({
  month,
  calendarData,
  onDayClick,
  isEditing,
  onReorder,
  loading: externalLoading,
  selectedDayNumber,
}) {
  // 内部 loading 状态（模拟数据加载）
  const [internalLoading, setInternalLoading] = useState(false);
  const [dragSourceDate, setDragSourceDate] = useState(null);
  const [dragOverDate, setDragOverDate] = useState(null);

  const loading = externalLoading !== undefined ? externalLoading : internalLoading;

  // 解析年月 "YYYY-MM" → {year, monthNum}
  const { year, monthNum } = useMemo(() => {
    if (!month) return { year: new Date().getFullYear(), monthNum: new Date().getMonth() + 1 };
    const [y, m] = month.split('-').map(Number);
    return { year: y, monthNum: m };
  }, [month]);

  // 将 calendarData 按 date 建立 Map
  const planDayMap = useMemo(() => {
    const map = new Map();
    if (Array.isArray(calendarData)) {
      calendarData.forEach((item) => {
        if (item && item.date) {
          map.set(item.date, item);
        }
      });
    }
    return map;
  }, [calendarData]);

  // 生成42个日历格子
  const calendarCells = useMemo(
    () => generateCalendarGrid(year, monthNum, planDayMap),
    [year, monthNum, planDayMap]
  );

  // 模拟数据加载效果
  useEffect(() => {
    if (externalLoading === undefined) {
      setInternalLoading(true);
      const timer = setTimeout(() => setInternalLoading(false), 300);
      return () => clearTimeout(timer);
    }
  }, [month, externalLoading]);

  // ── 拖拽处理 ──

  const handleDragStart = (e, sourceDate) => {
    setDragSourceDate(sourceDate);
    e.dataTransfer.setData("text/plain", sourceDate);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, targetDate) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverDate(targetDate);
  };

  const handleDragLeave = () => {
    setDragOverDate(null);
  };

  const handleDrop = (e, targetCell) => {
    e.preventDefault();
    const sourceDate = e.dataTransfer.getData("text/plain") || dragSourceDate;
    setDragSourceDate(null);
    setDragOverDate(null);

    if (sourceDate && sourceDate !== targetCell.date && onReorder) {
      const sourceCell = calendarCells.find(c => c.date === sourceDate);
      const fromDay = sourceCell?.planDay?.dayNumber;

      // 优先从 targetCell.planDay 获取 toDay（当前月或其他月份的 planDay）
      let toDay = targetCell?.planDay?.dayNumber;

      // 如果目标格子没有直接的 planDay，尝试通过 date 查找
      // 这在跨月拖拽时特别有用：目标可能是前月/后月补位格子
      if (!toDay && targetCell?.date) {
        const targetPlanDay = calendarDataByDate[targetCell.date];
        toDay = targetPlanDay?.dayNumber;
      }

      if (fromDay && toDay && fromDay !== toDay) {
        onReorder(fromDay, toDay);
      }
    }
  };

  // ── 空状态 ──

  if (!loading && (!calendarData || calendarData.length === 0)) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <CalendarDays className="text-emerald-500" size={24} />
            <h2 className="text-xl font-bold text-gray-800">
              {year}年 {MONTH_NAMES[monthNum - 1]}
            </h2>
          </div>
        </div>

        {/* 星期标题 */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="text-center text-xs font-semibold text-gray-500 py-2"
            >
              {label}
            </div>
          ))}
        </div>

        {/* 空状态提示 */}
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <CalendarOff size={28} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">
            暂无学习计划
          </h3>
          <p className="text-sm text-gray-500 text-center max-w-sm">
            该月份还没有安排学习计划，创建一个新计划后日历将在此显示。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      {/* 星期标题行 */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-center text-xs font-semibold text-gray-500 py-2 bg-gray-50 rounded-lg"
          >
            周{label}
          </div>
        ))}
      </div>

      {/* 加载状态 */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 size={32} className="text-emerald-500 animate-spin mb-3" />
          <p className="text-sm text-gray-500">加载日历数据中...</p>
        </div>
      )}

      {/* 日历网格：42个格子 */}
      {!loading && (
        <div className="grid grid-cols-7 gap-2">
          {calendarCells.map((cell) => {
            const isDragOver = dragOverDate === cell.date;
            const dragOverClass = isDragOver
              ? "ring-2 ring-emerald-400 ring-offset-1 rounded-xl"
              : "";

            return (
              <div
                key={cell.date}
                className={dragOverClass}
                onDragOver={
                  isEditing
                    ? (e) => handleDragOver(e, cell.date)
                    : undefined
                }
                onDragLeave={
                  isEditing ? handleDragLeave : undefined
                }
                onDrop={
                  isEditing
                    ? (e) => handleDrop(e, cell)
                    : undefined
                }
              >
                <MonthDayCard
                  date={cell.date}
                  dayOfMonth={cell.dayOfMonth}
                  isCurrentMonth={cell.isCurrentMonth}
                  planDay={cell.planDay}
                  onDayClick={onDayClick}
                  isEditing={isEditing}
                  selectedDayNumber={selectedDayNumber}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

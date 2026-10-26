import { useState, useRef, useEffect } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

/**
 * formatMonthLabel - 将 "2026-05" 格式化为 "2026年 5月"
 * @param {string} month - 月份字符串，如 "2026-05"
 * @returns {string} 格式化后的字符串，如 "2026年 5月"
 */
function formatMonthLabel(month) {
  if (!month) return "";
  const [year, mon] = month.split("-");
  const monthNum = parseInt(mon, 10);
  if (isNaN(monthNum)) return month;
  return `${year}年 ${monthNum}月`;
}

/**
 * MonthNavigator - 月份导航组件
 *
 * @param {Object} props
 * @param {string[]} props.months - 月份列表，如 ["2026-04", "2026-05", "2026-06"]
 * @param {string} props.currentMonth - 当前选中的月份，如 "2026-05"
 * @param {(month: string) => void} props.onMonthChange - 切换月份回调
 * @param {string} props.planStartMonth - 计划开始月份
 * @param {string} props.planEndMonth - 计划结束月份
 */
export default function MonthNavigator({
  months = [],
  currentMonth,
  onMonthChange,
  planStartMonth,
  planEndMonth,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // 当前月份在列表中的索引
  const currentIndex = months.indexOf(currentMonth);

  // 是否允许向左/向右切换
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex >= 0 && currentIndex < months.length - 1;

  // 总月数
  const totalMonths = months.length;

  // 切换到上一个月
  const handlePrev = () => {
    if (canGoPrev && onMonthChange) {
      onMonthChange(months[currentIndex - 1]);
    }
  };

  // 切换到下一个月
  const handleNext = () => {
    if (canGoNext && onMonthChange) {
      onMonthChange(months[currentIndex + 1]);
    }
  };

  // 从下拉菜单选择月份
  const handleSelectMonth = (month) => {
    if (onMonthChange) {
      onMonthChange(month);
    }
    setDropdownOpen(false);
  };

  // 点击外部关闭下拉菜单
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav
      className="
        sticky top-0 z-20
        h-14
        bg-gray-50/95 backdrop-blur-sm
        border-b border-gray-200
        flex items-center justify-between
        px-4
      "
    >
      {/* 左侧区域：日历图标 + 月份切换 */}
      <div className="flex items-center gap-3">
        {/* 日历图标 */}
        <div
          className="
            w-8 h-8
            bg-emerald-100
            rounded-lg
            flex items-center justify-center
            flex-shrink-0
          "
          title="月份导航"
        >
          <Calendar className="w-4 h-4 text-emerald-600" />
        </div>

        {/* 月份切换区 */}
        <div className="flex items-center gap-1">
          {/* 左箭头 */}
          <button
            onClick={handlePrev}
            disabled={!canGoPrev}
            className={`
              w-8 h-8 rounded-lg
              flex items-center justify-center
              bg-white border border-gray-200
              text-gray-600
              transition-colors
              ${
                canGoPrev
                  ? "hover:bg-gray-100 hover:border-gray-300 cursor-pointer"
                  : "opacity-50 cursor-not-allowed"
              }
            `}
            title="上一个月"
            aria-label="上一个月"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* 当前年月显示 + 下拉 */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="
                flex items-center gap-1 px-2 py-1
                rounded-lg
                hover:bg-gray-100
                transition-colors
                cursor-pointer
              "
              aria-haspopup="listbox"
              aria-expanded={dropdownOpen}
            >
              <span className="text-base font-bold text-gray-900 whitespace-nowrap">
                {formatMonthLabel(currentMonth)}
              </span>
              <ChevronDown
                className={`
                  w-3.5 h-3.5 text-gray-400
                  transition-transform duration-200
                  ${dropdownOpen ? "rotate-180" : ""}
                `}
              />
            </button>

            {/* 下拉菜单 */}
            {dropdownOpen && (
              <div
                className="
                  absolute top-full left-0 mt-1
                  min-w-[160px]
                  bg-white
                  rounded-xl
                  shadow-lg
                  border border-gray-100
                  py-1
                  z-50
                  max-h-64 overflow-y-auto
                "
                role="listbox"
              >
                {months.map((month) => {
                  const isActive = month === currentMonth;
                  return (
                    <button
                      key={month}
                      onClick={() => handleSelectMonth(month)}
                      role="option"
                      aria-selected={isActive}
                      className={`
                        w-full text-left px-3 py-2
                        text-sm
                        transition-colors
                        cursor-pointer
                        ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700 font-semibold"
                            : "text-gray-700 hover:bg-gray-50"
                        }
                      `}
                    >
                      {formatMonthLabel(month)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 右箭头 */}
          <button
            onClick={handleNext}
            disabled={!canGoNext}
            className={`
              w-8 h-8 rounded-lg
              flex items-center justify-center
              bg-white border border-gray-200
              text-gray-600
              transition-colors
              ${
                canGoNext
                  ? "hover:bg-gray-100 hover:border-gray-300 cursor-pointer"
                  : "opacity-50 cursor-not-allowed"
              }
            `}
            title="下一个月"
            aria-label="下一个月"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 右侧信息：总月数 */}
      <div className="flex items-center">
        <span className="text-xs text-gray-400 font-medium">
          {totalMonths > 0 ? `${totalMonths} 个月` : ""}
        </span>
      </div>
    </nav>
  );
}

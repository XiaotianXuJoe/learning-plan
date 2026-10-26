import React from 'react'
import { WEEK_DAYS } from '../../utils/constants'

/**
 * 星期标题行
 * 展示周日到周六的标题
 */
const WeekHeader = () => {
  return (
    <div className="sticky z-10 bg-gray-50/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-7 gap-3 h-11 items-center">
          {WEEK_DAYS.map((day, index) => {
            // 周末使用不同的颜色
            const isWeekend = index === 0 || index === 6
            return (
              <div
                key={day}
                className={`
                  flex items-center justify-center
                  text-sm font-semibold
                  ${isWeekend ? 'text-red-400' : 'text-gray-500'}
                `}
              >
                {day}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default WeekHeader

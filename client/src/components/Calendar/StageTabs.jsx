import React from 'react'
import { Layers } from 'lucide-react'
import { usePlanStore } from '../../stores/planStore'

/**
 * 阶段/月份标签切换栏
 * 支持横向滚动，绿色选中样式
 */
const StageTabs = () => {
  const { stages, currentStage, setCurrentStage } = usePlanStore()

  // 如果没有阶段数据，使用默认阶段
  const displayStages = stages.length > 0
    ? stages
    : [
        { id: 1, name: '第一阶段', description: '基础入门' },
        { id: 2, name: '第二阶段', description: '核心进阶' },
        { id: 3, name: '第三阶段', description: '高级应用' },
      ]

  const activeStage = currentStage || displayStages[0]

  return (
    <div className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-2 h-14">
          {/* 阶段图标 */}
          <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mr-1">
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>

          {/* 阶段标签列表 - 可横向滚动 */}
          <div className="flex-1 flex items-center gap-2 overflow-x-auto hide-scrollbar">
            {displayStages.map((stage) => {
              const isActive = activeStage?.id === stage.id
              return (
                <button
                  key={stage.id}
                  onClick={() => setCurrentStage(stage)}
                  className={`
                    relative flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                    transition-all duration-200 whitespace-nowrap
                    ${isActive
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <span>{stage.name}</span>
                  {/* 阶段描述 */}
                  <span
                    className={`text-xs ${
                      isActive ? 'text-emerald-100' : 'text-gray-400'
                    }`}
                  >
                    {stage.description}
                  </span>
                  {/* 选中指示器 */}
                  {isActive && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-white rounded-full" />
                  )}
                </button>
              )
            })}
          </div>

          {/* 阶段信息 */}
          <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-gray-400">
              {displayStages.length} 个阶段
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StageTabs

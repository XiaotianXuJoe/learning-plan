import React from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { BookOpen, LogOut, User, CalendarDays, BarChart3 } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import Button from '../Common/Button'

/**
 * 学员布局组件
 * 包含顶部导航栏和主内容区域
 */
const StudentLayout = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  // 处理登出
  const handleLogout = () => {
    logout()
    navigate('/student/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo和标题 */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-base font-bold text-gray-900 hidden sm:block">
                学习计划管理系统
              </h1>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                学员
              </span>
            </div>

            {/* 中间：导航菜单 */}
            <nav className="flex items-center gap-1">
              <button
                onClick={() => navigate('/student')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  window.location.pathname === '/student'
                    ? 'bg-emerald-50 text-emerald-700 font-medium'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <CalendarDays className="w-4 h-4" />
                <span>学习日历</span>
              </button>
              <button
                onClick={() => navigate('/student/statistics')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  window.location.pathname === '/student/statistics'
                    ? 'bg-emerald-50 text-emerald-700 font-medium'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>统计</span>
              </button>
            </nav>

            {/* 右侧：用户信息和登出 */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                  {user?.username || '学员'}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="!p-2"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区域 */}
      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default StudentLayout

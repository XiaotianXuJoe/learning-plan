import React from 'react'
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, LogOut, BookOpen, BarChart3 } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import Button from '../Common/Button'

/**
 * 管理员布局组件
 * 包含顶部导航栏和主内容区域
 */
const AdminLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()

  // 处理登出
  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  // 导航项配置
  const navItems = [
    { path: '/admin', label: '仪表盘', icon: LayoutDashboard },
    { path: '/admin/students', label: '学员管理', icon: Users },
    { path: '/admin/plans', label: '计划管理', icon: BookOpen },
    { path: '/admin/statistics', label: '数据统计', icon: BarChart3 },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo和标题 */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-500 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-bold text-gray-900 hidden sm:block">
                学习计划管理系统
              </h1>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                管理员
              </span>
            </div>

            {/* 导航链接 - 桌面端 */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${isActive
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            {/* 右侧：用户信息和登出 */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-gray-500" />
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                  {user?.username || '管理员'}
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

        {/* 移动端导航 */}
        <nav className="md:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto hide-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors
                  ${isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </header>

      {/* 主内容区域 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout

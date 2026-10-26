import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import Login from './pages/Login'
import AdminLayout from './components/Layout/AdminLayout'
import StudentLayout from './components/Layout/StudentLayout'
import AdminDashboard from './pages/Admin/Dashboard'
import StudentManagement from './pages/Admin/StudentManagement'
import PlanManagement from './pages/Admin/PlanManagement'
import StatisticsPage from './pages/Admin/StatisticsPage'
import StudentCalendarView from './pages/Student/CalendarView'
import StudentStatistics from './pages/Student/Statistics'

/**
 * 受保护路由组件 - 根据角色和认证状态控制访问
 */
function ProtectedRoute({ children, allowedRole }) {
  const { user, token } = useAuthStore()

  // 未登录，重定向到对应登录页
  if (!token || !user) {
    return <Navigate to={`/${allowedRole}/login`} replace />
  }

  // 已登录但角色不匹配
  if (user.role !== allowedRole) {
    // 管理员访问学员路由，或学员访问管理路由，重定向到对应首页
    return <Navigate to={user.role === 'admin' ? '/admin' : '/student'} replace />
  }

  return children
}

/**
 * 根路由重定向组件
 */
function RootRedirect() {
  const { user, token } = useAuthStore()

  if (!token || !user) {
    return <Navigate to="/student/login" replace />
  }

  if (user.role === 'admin') {
    return <Navigate to="/admin" replace />
  }

  return <Navigate to="/student" replace />
}

/**
 * 应用主组件 - 路由配置中心
 */
function App() {
  return (
    <Routes>
      {/* 根路由 - 根据角色重定向 */}
      <Route path="/" element={<RootRedirect />} />

      {/* 登录页面 */}
      <Route path="/admin/login" element={<Login role="admin" />} />
      <Route path="/student/login" element={<Login role="student" />} />

      {/* 管理员路由 - 受保护 */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="students" element={<StudentManagement />} />
        <Route path="plans" element={<PlanManagement />} />
        <Route path="statistics" element={<StatisticsPage />} />
      </Route>

      {/* 学员路由 - 受保护 */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRole="student">
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentCalendarView />} />
        <Route path="statistics" element={<StudentStatistics />} />
      </Route>

      {/* 404 - 重定向到首页 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App

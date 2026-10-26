import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, User, Lock, ArrowRight, GraduationCap, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { authApi } from '../api/client'
import Button from '../components/Common/Button'

/**
 * 登录页面
 * 支持管理员登录（用户名+密码）和学员登录（仅用户名）两种模式
 */
const Login = ({ role = 'student' }) => {
  const navigate = useNavigate()
  const { login, setLoading, setError, error, clearError } = useAuthStore()

  // 表单状态
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localError, setLocalError] = useState('')

  const isAdmin = role === 'admin'

  // 处理登录
  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()
    setLocalError('')

    // 表单验证
    if (!username.trim()) {
      setLocalError('请输入用户名')
      return
    }
    if (isAdmin && !password.trim()) {
      setLocalError('请输入密码')
      return
    }

    setIsSubmitting(true)

    try {
      let response

      if (isAdmin) {
        // 管理员登录
        response = await authApi.adminLogin(username.trim(), password)
      } else {
        // 学员登录
        response = await authApi.studentLogin(username.trim())
      }

      // 登录成功 - 后端返回 {code, message, data: {token, user}}
      const result = response.data || response
      if (result.token && result.user) {
        login(result.user, result.token)
        // 跳转到对应首页
        const redirectPath = isAdmin ? '/admin' : '/student'
        navigate(redirectPath, { replace: true })
      } else if (response.code !== 0) {
        throw new Error(response.message || '登录失败')
      } else {
        throw new Error('登录响应格式错误')
      }
    } catch (err) {
      const errorMsg = err.message || '登录失败，请重试'
      setLocalError(errorMsg)

      // 如果API不可用，使用模拟登录（开发模式）
      if (errorMsg.includes('网络') || errorMsg.includes('fetch')) {
        handleDemoLogin()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // 演示登录（开发模式，当API不可用时使用）
  const handleDemoLogin = () => {
    const demoUser = isAdmin
      ? { id: 1, username: username || 'admin', role: 'admin', name: '管理员' }
      : { id: 2, username: username || 'student', role: 'student', name: '学员' }

    login(demoUser, 'demo_token_' + Date.now())
    const redirectPath = isAdmin ? '/admin' : '/student'
    navigate(redirectPath, { replace: true })
  }

  // 切换登录模式
  const toggleRole = () => {
    clearError()
    setLocalError('')
    const newRole = isAdmin ? 'student' : 'admin'
    navigate(`/${newRole}/login`, { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-100 rounded-full opacity-30 -translate-y-1/2" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-teal-100 rounded-full opacity-30 translate-y-1/2" />
      </div>

      {/* 登录卡片 */}
      <div className="relative w-full max-w-md">
        {/* Logo区域 */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/25">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            学习计划管理系统
          </h1>
          <p className="text-sm text-gray-500">
            {isAdmin ? '管理员登录' : '学员登录'}
          </p>
        </div>

        {/* 登录表单 */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
          {/* 角色切换标签 */}
          <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl mb-6">
            <button
              onClick={() => isAdmin && toggleRole()}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                !isAdmin
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              学员
            </button>
            <button
              onClick={() => !isAdmin && toggleRole()}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isAdmin
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              管理员
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 用户名输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                用户名
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value)
                    setLocalError('')
                  }}
                  placeholder={isAdmin ? '请输入管理员用户名' : '请输入学员用户名'}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder:text-gray-400"
                  autoFocus
                />
              </div>
            </div>

            {/* 密码输入 - 仅管理员 */}
            {isAdmin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  密码
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setLocalError('')
                    }}
                    placeholder="请输入密码"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder:text-gray-400"
                  />
                </div>
              </div>
            )}

            {/* 错误提示 */}
            {(localError || error) && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                <span className="text-red-500">⚠</span>
                <span>{localError || error}</span>
              </div>
            )}

            {/* 登录按钮 */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isSubmitting}
            >
              登录
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {/* 演示提示 */}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              {isAdmin
                ? '管理员账号：admin / 密码：任意'
                : '学员账号：任意用户名即可登录'}
            </p>
          </div>
        </div>

        {/* 底部版权 */}
        <p className="text-center text-xs text-gray-400 mt-6">
          学习计划管理系统
        </p>
      </div>
    </div>
  )
}

export default Login

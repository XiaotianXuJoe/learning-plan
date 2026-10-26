import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_KEYS } from '../utils/constants'

/**
 * 认证状态管理 Store
 * 使用 Zustand + persist 中间件实现状态持久化
 */
export const useAuthStore = create(
  persist(
    (set, get) => ({
      // ====== 状态 ======
      user: null,
      token: null,
      isLoading: false,
      error: null,

      // ====== 计算属性 ======
      /**
       * 是否已认证
       */
      isAuthenticated: () => !!get().token && !!get().user,

      /**
       * 是否为管理员
       */
      isAdmin: () => get().user?.role === 'admin',

      /**
       * 是否为学员
       */
      isStudent: () => get().user?.role === 'student',

      // ====== 操作方法 ======
      /**
       * 设置加载状态
       */
      setLoading: (loading) => set({ isLoading: loading }),

      /**
       * 设置错误信息
       */
      setError: (error) => set({ error }),

      /**
       * 清除错误
       */
      clearError: () => set({ error: null }),

      /**
       * 登录成功 - 设置用户和token
       */
      login: (userData, token) => {
        localStorage.setItem(STORAGE_KEYS.TOKEN, token)
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData))
        set({ user: userData, token, error: null })
      },

      /**
       * 登出 - 清除所有认证信息
       */
      logout: () => {
        localStorage.removeItem(STORAGE_KEYS.TOKEN)
        localStorage.removeItem(STORAGE_KEYS.USER)
        set({ user: null, token: null, error: null })
      },

      /**
       * 更新用户信息
       */
      updateUser: (userData) => {
        const newUser = { ...get().user, ...userData }
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser))
        set({ user: newUser })
      },

      /**
       * 从localStorage恢复认证状态（页面刷新时使用）
       */
      restoreAuth: () => {
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
        const userStr = localStorage.getItem(STORAGE_KEYS.USER)
        if (token && userStr) {
          try {
            const user = JSON.parse(userStr)
            set({ token, user })
            return true
          } catch {
            // 解析失败，清除过期数据
            get().logout()
            return false
          }
        }
        return false
      },
    }),
    {
      name: 'auth-storage', // localStorage中的key
      partialize: (state) => ({ user: state.user, token: state.token }), // 只持久化user和token
    }
  )
)

export default useAuthStore

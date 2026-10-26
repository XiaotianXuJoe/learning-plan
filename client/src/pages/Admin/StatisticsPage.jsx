import React, { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Users, BookOpen, CheckCircle2, AlertCircle, Loader2, Calendar } from 'lucide-react'
import { statisticsApi } from '../../api/client'

const FILTER_OPTIONS = [
  { label: '全部学员', value: '' },
  { label: '最近30天', value: '30' },
  { label: '最近60天', value: '60' },
  { label: '最近90天', value: '90' },
  { label: '最近120天', value: '120' },
  { label: '最近365天', value: '365' },
]

/**
 * 数据统计页面 - 支持按注册时间筛选学员
 */
const StatisticsPage = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filterDays, setFilterDays] = useState('')

  useEffect(() => {
    loadStats()
  }, [filterDays])

  const loadStats = async () => {
    setLoading(true)
    try {
      const days = filterDays ? parseInt(filterDays, 10) : null
      const res = await statisticsApi.getOverview(days)
      setStats(res.data || res)
    } catch (err) {
      console.error('加载统计数据失败:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <AlertCircle className="w-5 h-5 mr-2" />
        加载失败，请刷新重试
      </div>
    )
  }

  const currentFilter = FILTER_OPTIONS.find(o => o.value === filterDays) || FILTER_OPTIONS[0]

  const statCards = [
    { title: '学员总数', value: stats.students || 0, icon: Users, color: 'bg-blue-500', lightColor: 'bg-blue-50', textColor: 'text-blue-600' },
    { title: '活跃计划', value: stats.active_plans || 0, icon: BookOpen, color: 'bg-emerald-500', lightColor: 'bg-emerald-50', textColor: 'text-emerald-600' },
    { title: '总题目数', value: stats.problems?.total || 0, icon: BookOpen, color: 'bg-purple-500', lightColor: 'bg-purple-50', textColor: 'text-purple-600' },
    { title: '已完成题目', value: stats.problems?.completed || 0, icon: CheckCircle2, color: 'bg-amber-500', lightColor: 'bg-amber-50', textColor: 'text-amber-600' },
  ]

  const averageProgress = stats.problems?.completion_rate || 0
  const leaderboard = stats.leaderboard || []

  return (
    <div className="space-y-6 p-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">数据统计</h2>
          <p className="text-sm text-gray-500 mt-1">
            {filterDays ? `显示${currentFilter.label}注册的学员统计` : '全局学习数据统计与分析'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <select
            value={filterDays}
            onChange={(e) => setFilterDays(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent cursor-pointer"
          >
            {FILTER_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.title} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className={`w-10 h-10 ${card.lightColor} rounded-lg flex items-center justify-center mb-3`}>
              <card.icon className={`w-5 h-5 ${card.textColor}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{card.title}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">总体完成率</h3>
          <span className="text-sm font-medium text-emerald-600">{averageProgress}%</span>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${averageProgress}%` }} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">学员进度排行</h3>
          <span className="text-xs text-gray-400">{leaderboard.length} 位学员</span>
        </div>
        <div className="divide-y divide-gray-100">
          {leaderboard.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">
              暂无学员数据
            </div>
          ) : (
            leaderboard.map((s, i) => (
              <div key={s.id || s.username} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{s.name || s.display_name || s.username}</p>
                  <p className="text-xs text-gray-500">@{s.username}</p>
                </div>
                <div className="flex items-center gap-3 w-48">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${s.percent >= 60 ? 'bg-emerald-500' : s.percent >= 30 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${s.percent}%` }} />
                  </div>
                  <span className="text-xs text-gray-600 w-10 text-right">{s.percent}%</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default StatisticsPage
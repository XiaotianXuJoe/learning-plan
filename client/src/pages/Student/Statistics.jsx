import { useState, useEffect, useRef, useCallback } from 'react'
import { usePlanStore } from '../../stores/planStore'
import PlanSwitcher from '../../components/Plan/PlanSwitcher'
import {
  AlertCircle, CheckCircle2, Circle, Video, FileText,
  Loader2, BookOpen, ChevronDown, Trophy, Target,
  TrendingUp, Award, Zap, RotateCcw, ChevronUp,
  Play, Check, X, BarChart3, GraduationCap, Eye, EyeOff
} from 'lucide-react'

/* ──────────────────────── 圆形进度条 ──────────────────────── */
function CircularProgress({ percentage, size = 120, strokeWidth = 8, color = '#10b981' }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* 背景圆环 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />
        {/* 进度圆环 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-slate-800">{percentage}%</span>
      </div>
    </div>
  )
}

/* ──────────────────────── 统计卡片 ──────────────────────── */
function StatCard({ icon: Icon, title, value, subtitle, colorClass, bgClass, progress, progressColor }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl ${bgClass} p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${colorClass} tracking-tight`}>{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
          {progress !== undefined && (
            <div className="mt-3">
              <div className="h-1.5 w-full bg-white/60 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${progressColor} transition-all duration-700 ease-out`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
        <div className={`flex-shrink-0 ml-3 p-2.5 rounded-xl ${bgClass.replace('bg-', 'bg-opacity-20 ')} bg-white shadow-sm`}>
          <Icon className={`w-6 h-6 ${colorClass}`} />
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────── 状态下拉菜单 ──────────────────────── */
const STATUS_OPTIONS = [
  { value: 'completed', label: '已完成', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { value: 'need_review', label: '需复习', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
  { value: 'uncompleted', label: '未完成', icon: Circle, color: 'text-slate-400', bg: 'bg-slate-50' },
]

function StatusDropdown({ currentStatus, onChange, disabled, updating }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // 点击外部关闭
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const currentOption = STATUS_OPTIONS.find(s => s.value === currentStatus) || STATUS_OPTIONS[2]

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled || updating}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200 ${
          disabled
            ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
            : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm text-slate-700 cursor-pointer'
        }`}
      >
        {updating ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
        ) : (
          <currentOption.icon className={`w-3.5 h-3.5 ${currentOption.color}`} />
        )}
        <span className="text-xs">{updating ? '更新中...' : currentOption.label}</span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-50">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
              className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors duration-150 ${
                option.value === currentStatus
                  ? `${option.bg} ${option.color} font-medium`
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <option.icon className={`w-4 h-4 ${option.color}`} />
              {option.label}
              {option.value === currentStatus && <Check className="w-3.5 h-3.5 ml-auto text-slate-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ──────────────────────── 题目卡片 ──────────────────────── */
function ProblemCard({ problem, onStatusChange, disabled, updating }) {
  const isReview = problem.status === 'need_review'

  const difficultyMap = {
    easy: { label: '简单', color: 'bg-emerald-100 text-emerald-700' },
    medium: { label: '中等', color: 'bg-amber-100 text-amber-700' },
    hard: { label: '困难', color: 'bg-rose-100 text-rose-700' },
  }
  const diff = difficultyMap[problem.difficulty] || { label: '未知', color: 'bg-slate-100 text-slate-600' }

  return (
    <div className={`group flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 hover:shadow-md ${
      isReview
        ? 'bg-white border-amber-200 hover:border-amber-300'
        : 'bg-white border-slate-200 hover:border-emerald-200'
    }`}>
      {/* 状态图标 */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
        isReview ? 'bg-amber-50' : 'bg-emerald-50'
      }`}>
        {isReview ? (
          <AlertCircle className="w-5 h-5 text-amber-500" />
        ) : (
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        )}
      </div>

      {/* 题目信息 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="text-sm font-semibold text-slate-800 truncate">{problem.title}</h4>
          {problem.knowledge_tag && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600 border border-indigo-100">
              {problem.knowledge_tag}
            </span>
          )}
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${diff.color}`}>
            {diff.label}
          </span>
        </div>
        {problem.description && (
          <p className="text-xs text-slate-400 mt-1 truncate">{problem.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
            <Target className="w-3 h-3" />
            Day {problem.day_number}
          </span>
          {problem.date && (
            <span className="text-xs text-slate-300">{problem.date}</span>
          )}
        </div>
      </div>

      {/* 状态下拉 */}
      <div className="flex-shrink-0">
        <StatusDropdown
          currentStatus={problem.status}
          onChange={(newStatus) => onStatusChange(problem, newStatus)}
          disabled={disabled}
          updating={updating}
        />
      </div>
    </div>
  )
}

/* ──────────────────────── 视频项 ──────────────────────── */
function VideoItem({ video, onWatchChange, disabled, updating }) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border bg-white transition-all duration-300 hover:shadow-md ${
      video.is_watched ? 'border-emerald-200' : 'border-slate-200'
    }`}>
      <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
        video.is_watched ? 'bg-emerald-50' : 'bg-purple-50'
      }`}>
        {video.is_watched ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        ) : (
          <Play className="w-5 h-5 text-purple-500 ml-0.5" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className={`text-sm font-semibold truncate ${video.is_watched ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
          {video.title}
        </h4>
        <span className="inline-flex items-center gap-1 text-xs text-slate-400 mt-1">
          <Target className="w-3 h-3" />
          Day {video.day_number}
        </span>
      </div>

      <button
        onClick={() => onWatchChange(video, !video.is_watched)}
        disabled={disabled || updating}
        className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
          video.is_watched
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            : 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100'
        } ${disabled || updating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {updating ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : video.is_watched ? (
          <>
            <EyeOff className="w-3.5 h-3.5" />
            标记未看
          </>
        ) : (
          <>
            <Eye className="w-3.5 h-3.5" />
            标记已看
          </>
        )}
      </button>
    </div>
  )
}

/* ──────────────────────── 空状态 ──────────────────────── */
function EmptyState({ icon: Icon, title, description, type = 'default' }) {
  const bgClass = type === 'celebrate'
    ? 'bg-emerald-50 border-emerald-100'
    : 'bg-slate-50 border-slate-100'

  const iconColor = type === 'celebrate' ? 'text-emerald-500' : 'text-slate-400'

  return (
    <div className={`${bgClass} border rounded-2xl p-8 text-center`}>
      <div className="flex justify-center mb-3">
        <div className={`p-3 rounded-full ${type === 'celebrate' ? 'bg-emerald-100' : 'bg-white'}`}>
          <Icon className={`w-8 h-8 ${iconColor}`} />
        </div>
      </div>
      <h3 className="text-base font-semibold text-slate-700 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mx-auto">{description}</p>
    </div>
  )
}

/* ──────────────────────── 骨架屏 ──────────────────────── */
function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 p-5 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-4 w-24 bg-slate-200 rounded mb-2" />
          <div className="h-8 w-16 bg-slate-200 rounded" />
        </div>
        <div className="w-10 h-10 bg-slate-200 rounded-xl" />
      </div>
    </div>
  )
}

function SkeletonProblem() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-white animate-pulse">
      <div className="w-10 h-10 bg-slate-200 rounded-xl flex-shrink-0" />
      <div className="flex-1">
        <div className="h-4 w-3/4 bg-slate-200 rounded mb-2" />
        <div className="h-3 w-1/3 bg-slate-200 rounded" />
      </div>
      <div className="w-20 h-8 bg-slate-200 rounded-lg flex-shrink-0" />
    </div>
  )
}

/* ═══════════════════════ 主页面组件 ═══════════════════════ */
export default function Statistics() {
  const {
    currentPlan,
    plans,
    fetchProblemStats,
    fetchStudentPlans,
    setCurrentPlan,
    updateQuestionStatus,
    updateVideoWatchStatus,
  } = usePlanStore()

  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState({})     // 记录正在更新的 item id
  const [reviewExpanded, setReviewExpanded] = useState(true)
  const [completedExpanded, setCompletedExpanded] = useState(true)
  const [videoExpanded, setVideoExpanded] = useState(true)

  /* ── 初始化数据 ── */
  useEffect(() => {
    initData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const initData = useCallback(async () => {
    setLoading(true)
    try {
      let plan = currentPlan
      if (!plan) {
        const fetchedPlans = await fetchStudentPlans()
        plan = fetchedPlans[0] || null
      }
      if (plan?.id) {
        const data = await fetchProblemStats(plan.id)
        setStats(data)
      }
    } catch (err) {
      console.error('初始化数据失败:', err)
    } finally {
      setLoading(false)
    }
  }, [currentPlan, fetchStudentPlans, fetchProblemStats])

  /* ── 切换学习计划 ── */
  const handlePlanSwitch = useCallback(async (plan) => {
    if (!plan || plan.id === currentPlan?.id) return
    setLoading(true)
    try {
      setCurrentPlan(plan)
      const data = await fetchProblemStats(plan.id)
      setStats(data)
    } catch (err) {
      console.error('切换计划失败:', err)
    } finally {
      setLoading(false)
    }
  }, [currentPlan, setCurrentPlan, fetchProblemStats])

  /* ── 刷新统计数据 ── */
  const refreshStats = useCallback(async () => {
    if (!currentPlan?.id) return
    try {
      const data = await fetchProblemStats(currentPlan.id)
      setStats(data)
    } catch (err) {
      console.error('获取统计数据失败:', err)
    }
  }, [currentPlan, fetchProblemStats])

  /* ── 更改题目状态 ── */
  const handleProblemStatusChange = useCallback(async (problem, newStatus) => {
    if (!currentPlan?.id) return
    const key = `problem-${problem.id}`
    setUpdating(prev => ({ ...prev, [key]: true }))
    try {
      const statusMap = { uncompleted: 0, completed: 1, need_review: 2 }
      await updateQuestionStatus(currentPlan.id, problem.day_number, problem.id, statusMap[newStatus])
      await refreshStats()
    } catch (err) {
      console.error('更新题目状态失败:', err)
    } finally {
      setUpdating(prev => ({ ...prev, [key]: false }))
    }
  }, [currentPlan, updateQuestionStatus, refreshStats])

  /* ── 更改视频观看状态 ── */
  const handleVideoWatchChange = useCallback(async (video, isWatched) => {
    if (!currentPlan?.id) return
    const key = `video-${video.id}`
    setUpdating(prev => ({ ...prev, [key]: true }))
    try {
      await updateVideoWatchStatus(currentPlan.id, video.day_number, video.id, isWatched)
      await refreshStats()
    } catch (err) {
      console.error('更新视频状态失败:', err)
    } finally {
      setUpdating(prev => ({ ...prev, [key]: false }))
    }
  }, [currentPlan, updateVideoWatchStatus, refreshStats])

  /* ── 获取难度中文 ── */
  const getDifficultyLabel = (d) => {
    const map = { easy: '简单', medium: '中等', hard: '困难' }
    return map[d] || d
  }

  /* ═══════════════ 加载中状态 ═══════════════ */
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50">
        <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* 头部骨架 */}
          <div className="mb-8 animate-pulse">
            <div className="h-6 w-48 bg-slate-200 rounded mb-2" />
            <div className="h-4 w-80 bg-slate-200 rounded" />
          </div>
          {/* 进度卡片骨架 */}
          <div className="rounded-2xl bg-white border border-slate-100 p-6 mb-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-5 w-32 bg-slate-200 rounded mb-3" />
                <div className="h-10 w-20 bg-slate-200 rounded mb-2" />
                <div className="h-4 w-48 bg-slate-200 rounded" />
              </div>
              <div className="w-28 h-28 bg-slate-200 rounded-full flex-shrink-0" />
            </div>
          </div>
          {/* 统计网格骨架 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
          </div>
          {/* 题目列表骨架 */}
          <div className="space-y-3 mb-8">
            <div className="h-5 w-32 bg-slate-200 rounded mb-4" />
            {[1, 2, 3].map(i => <SkeletonProblem key={i} />)}
          </div>
        </div>
      </div>
    )
  }

  /* ═══════════════ 无计划状态 ═══════════════ */
  if (!currentPlan) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <EmptyState
            icon={BookOpen}
            title="暂无学习计划"
            description="您还没有加入任何学习计划。请先选择一个计划开始学习。"
            type="default"
          />
          <button
            onClick={async () => {
              setLoading(true)
              await fetchStudentPlans()
              setLoading(false)
            }}
            className="mt-4 w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            刷新计划列表
          </button>
        </div>
      </div>
    )
  }

  /* ═══════════════ 主渲染 ═══════════════ */
  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">

        {/* ═══════ 页面头部 ═══════ */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              学习统计
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
              {currentPlan.template_name || currentPlan.name || '学习计划'}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            追踪你的学习进度，管理需要复习的题目，查看视频观看情况
          </p>
          {plans.length > 1 && (
            <div className="mt-3">
              <PlanSwitcher
                plans={plans}
                currentPlan={currentPlan}
                onPlanChange={handlePlanSwitch}
                loading={loading}
              />
            </div>
          )}
        </div>

        {/* ═══════ 总体进度卡片 ═══════ */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm p-6 mb-6">
          {/* 背景装饰 */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full -translate-y-1/2 translate-x-1/3 opacity-60" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-50 rounded-full translate-y-1/2 -translate-x-1/4 opacity-40" />

          <div className="relative flex flex-col sm:flex-row items-center gap-6">
            {/* 左侧：文字信息 */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center gap-2 mb-2 justify-center sm:justify-start">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-medium text-slate-500">总体学习进度</span>
              </div>
              <div className="text-5xl sm:text-6xl font-extrabold text-slate-900 tracking-tight mb-2">
                {stats?.overallProgress ?? 0}%
              </div>
              <p className="text-sm text-slate-500 mb-4">
                已完成 <span className="font-semibold text-emerald-600">{stats?.completedDayCount ?? 0}</span> /{' '}
                <span className="font-semibold text-slate-700">{stats?.studyDayCount ?? 0}</span> 个学习日
              </p>
              <div className="flex items-center gap-4 justify-center sm:justify-start text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  连续学习，保持节奏
                </span>
              </div>
            </div>
            {/* 右侧：环形进度条 */}
            <div className="flex-shrink-0">
              <CircularProgress
                percentage={stats?.overallProgress ?? 0}
                size={130}
                strokeWidth={10}
                color="#10b981"
              />
            </div>
          </div>
        </div>

        {/* ═══════ 统计网格 ═══════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={CheckCircle2}
            title="已完成题目"
            value={stats?.completedProblemCount ?? 0}
            subtitle={`共 ${stats?.totalProblemCount ?? 0} 题`}
            colorClass="text-emerald-600"
            bgClass="bg-emerald-50"
            progress={stats?.totalProblemCount ? (stats.completedProblemCount / stats.totalProblemCount) * 100 : 0}
            progressColor="bg-emerald-400"
          />
          <StatCard
            icon={AlertCircle}
            title="需复习题目"
            value={stats?.reviewCount ?? 0}
            subtitle="重点关注"
            colorClass="text-amber-600"
            bgClass="bg-amber-50"
            progress={stats?.totalProblemCount ? (stats.reviewCount / stats.totalProblemCount) * 100 : 0}
            progressColor="bg-amber-400"
          />
          <StatCard
            icon={FileText}
            title="总题目数"
            value={stats?.totalProblemCount ?? 0}
            subtitle="计划内所有题目"
            colorClass="text-slate-600"
            bgClass="bg-slate-50"
            progress={100}
            progressColor="bg-slate-300"
          />
          <StatCard
            icon={Video}
            title="视频观看"
            value={`${stats?.watchedVideoCount ?? 0}/${stats?.totalVideoCount ?? 0}`}
            subtitle="课程视频进度"
            colorClass="text-purple-600"
            bgClass="bg-purple-50"
            progress={stats?.totalVideoCount ? (stats.watchedVideoCount / stats.totalVideoCount) * 100 : 0}
            progressColor="bg-purple-400"
          />
        </div>

        {/* ═══════ 需复习题目专区（可折叠） ═══════ */}
        <div className="mb-8">
          <button
            onClick={() => setReviewExpanded(!reviewExpanded)}
            className="flex items-center justify-between w-full group mb-4"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">需复习题目</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                {stats?.reviewProblems?.length ?? 0}
              </span>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600 transition-colors">
              {reviewExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </button>

          {reviewExpanded && (
            <div>
              {(!stats?.reviewProblems || stats.reviewProblems.length === 0) ? (
                <EmptyState
                  icon={Trophy}
                  title="太棒了！没有需要复习的题目"
                  description="你已经掌握了所有已学内容。继续保持，完成更多题目来挑战自己！"
                  type="celebrate"
                />
              ) : (
                <div className="space-y-3">
                  {stats.reviewProblems.map((problem) => (
                    <ProblemCard
                      key={problem.id}
                      problem={problem}
                      onStatusChange={handleProblemStatusChange}
                      disabled={false}
                      updating={updating[`problem-${problem.id}`]}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ═══════ 已完成题目专区（可折叠） ═══════ */}
        <div className="mb-8">
          <button
            onClick={() => setCompletedExpanded(!completedExpanded)}
            className="flex items-center justify-between w-full group mb-4"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">已完成题目</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                {stats?.completedProblems?.length ?? 0}
              </span>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600 transition-colors">
              {completedExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </button>

          {completedExpanded && (
            <div className="space-y-3">
              {(!stats?.completedProblems || stats.completedProblems.length === 0) ? (
                <EmptyState
                  icon={Target}
                  title="还没有已完成的题目"
                  description="开始你的学习之旅吧！完成题目后将在这里展示。"
                  type="default"
                />
              ) : (
                stats.completedProblems.map((problem) => (
                  <ProblemCard
                    key={problem.id}
                    problem={problem}
                    onStatusChange={handleProblemStatusChange}
                    disabled={false}
                    updating={updating[`problem-${problem.id}`]}
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* ═══════ 视频清单 ═══════ */}
        <div className="mb-8">
          <button
            onClick={() => setVideoExpanded(!videoExpanded)}
            className="flex items-center justify-between w-full group mb-4"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <Video className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">课程视频</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                {stats?.videoList?.length ?? 0}
              </span>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600 transition-colors">
              {videoExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </button>

          {videoExpanded && (
            <div className="space-y-3">
              {(!stats?.videoList || stats.videoList.length === 0) ? (
                <EmptyState
                  icon={Video}
                  title="暂无视频课程"
                  description="该学习计划没有配置视频课程。"
                  type="default"
                />
              ) : (
                stats.videoList.map((video) => (
                  <VideoItem
                    key={video.id}
                    video={video}
                    onWatchChange={handleVideoWatchChange}
                    disabled={false}
                    updating={updating[`video-${video.id}`]}
                  />
                ))
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

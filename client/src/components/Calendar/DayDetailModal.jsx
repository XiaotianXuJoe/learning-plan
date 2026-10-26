import React, { useState, useMemo, useEffect } from 'react'
import {
  X,
  CheckCircle2,
  Clock,
  BookOpen,
  Tag,
  Check,
  AlertCircle,
  Circle,
  ChevronDown,
  Trophy,
  Pencil,
  Plus,
  Trash2,
  Save,
  XCircle,
  Video,
  FileText,
  GripVertical,
  Coffee,
} from 'lucide-react'
import { usePlanStore } from '../../stores/planStore'
import { STATUS_OPTIONS, QUESTION_STATUS } from '../../utils/constants'
import { planApi } from '../../api/client'
import Button from '../Common/Button'

/**
 * 日期详情弹窗
 * 白色圆角Modal，展示当天题目列表（按知识点分组）、状态选择器、标记完成按钮
 * 支持编辑模式：可直接修改主题、休息日、视频和题目列表
 */
const DayDetailModal = () => {
  const {
    selectedDay,
    isModalOpen,
    closeDayModal,
    currentPlan,
    updateQuestionStatus,
    markDayComplete,
    saveStudentPlanDay,
    updateVideoWatchStatus,
  } = usePlanStore()

  // 状态选择器下拉菜单开关状态
  const [openDropdown, setOpenDropdown] = useState(null)
  const [openVideoDropdown, setOpenVideoDropdown] = useState(null)

  // ====== 编辑模式状态 ======
  const [isEditing, setIsEditing] = useState(false)
  const [editTheme, setEditTheme] = useState('')
  const [editIsRestDay, setEditIsRestDay] = useState(false)
  const [editVideos, setEditVideos] = useState([])
  const [editProblems, setEditProblems] = useState([])
  const [saving, setSaving] = useState(false)

  // 当selectedDay变化时，重置编辑状态
  useEffect(() => {
    if (selectedDay) {
      setEditTheme(selectedDay.theme || selectedDay.topic || '')
      setEditIsRestDay(selectedDay.isRestDay || false)
      setEditVideos(selectedDay.videos ? [...selectedDay.videos] : [])
      // 兼容questions和problems两种字段名
      const problems = selectedDay.problems || selectedDay.questions || []
      setEditProblems(problems.length > 0 ? [...problems] : [])
      setIsEditing(false)
    }
  }, [selectedDay])

  // 处理关闭弹窗
  const handleClose = () => {
    closeDayModal()
    setOpenDropdown(null)
    setOpenVideoDropdown(null)
    setIsEditing(false)
  }

  // 处理题目状态更新
  const handleStatusChange = (questionId, newStatus) => {
    if (currentPlan?.id && selectedDay?.dayNumber) {
      updateQuestionStatus(currentPlan.id, selectedDay.dayNumber, questionId, newStatus)
    }
    setOpenDropdown(null)
  }

  // 处理标记一天完成
  const handleMarkComplete = async () => {
    if (!currentPlan?.id || !selectedDay?.dayNumber) return
    const success = await markDayComplete(currentPlan.id, selectedDay.dayNumber)
    if (success) {
      closeDayModal()
    }
  }

  // ====== 编辑模式处理函数 ======

  // 进入编辑模式
  const handleEnterEdit = () => {
    setEditTheme(selectedDay.theme || selectedDay.topic || '')
    setEditIsRestDay(selectedDay.isRestDay || false)
    setEditVideos(selectedDay.videos ? [...selectedDay.videos] : [])
    const problems = selectedDay.problems || selectedDay.questions || []
    setEditProblems(problems.length > 0 ? JSON.parse(JSON.stringify(problems)) : [])
    setIsEditing(true)
    setOpenDropdown(null)
  }

  // 取消编辑
  const handleCancelEdit = () => {
    setIsEditing(false)
  }

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!currentPlan?.id || !selectedDay?.dayNumber) return
    setSaving(true)
    const dayData = {
      theme: editTheme,
      isRestDay: editIsRestDay,
      videos: editVideos.map(v => ({
        title: v.title || '',
        url: v.url || '',
        duration: v.duration || '',
        platform: v.platform || 'bilibili',
      })),
      problems: editProblems.map(p => ({
        id: p.id,
        title: p.title || '',
        description: p.description || '',
        difficulty: p.difficulty || 'medium',
        knowledge_tag: p.knowledge_tag || p.topic || '未分类',
        status: p.status === 'completed' ? 1 : p.status === 'need_review' ? 2 : 0,
        sort_order: p.sort_order || 0,
      })),
    }
    const success = await saveStudentPlanDay(currentPlan.id, selectedDay.dayNumber, dayData)
    if (success) {
      setIsEditing(false)
    }
    setSaving(false)
  }

  // 添加视频
  const handleAddVideo = () => {
    setEditVideos([...editVideos, { title: '', url: '', duration: '', platform: 'bilibili' }])
  }

  // 删除视频
  const handleRemoveVideo = (index) => {
    setEditVideos(editVideos.filter((_, i) => i !== index))
  }

  // 更新视频字段
  const handleVideoChange = (index, field, value) => {
    const updated = editVideos.map((v, i) => i === index ? { ...v, [field]: value } : v)
    setEditVideos(updated)
  }

  // 添加题目
  const handleAddProblem = () => {
    setEditProblems([...editProblems, {
      id: `new-${Date.now()}`,
      title: '',
      description: '',
      difficulty: 'medium',
      knowledge_tag: '',
      topic: '',
      status: 'uncompleted',
      sort_order: editProblems.length,
    }])
  }

  // 删除题目
  const handleRemoveProblem = (index) => {
    setEditProblems(editProblems.filter((_, i) => i !== index))
  }

  // 更新题目标题
  const handleProblemChange = (index, field, value) => {
    const updated = editProblems.map((p, i) => i === index ? { ...p, [field]: value } : p)
    setEditProblems(updated)
  }

  const moveVideo = (index, dir) => {
    if (dir === -1 && index === 0) return
    if (dir === 1 && index === editVideos.length - 1) return
    const arr = [...editVideos]
    ;[arr[index], arr[index + dir]] = [arr[index + dir], arr[index]]
    setEditVideos(arr)
  }
  const moveProblem = (index, dir) => {
    if (dir === -1 && index === 0) return
    if (dir === 1 && index === editProblems.length - 1) return
    const arr = [...editProblems]
    ;[arr[index], arr[index + dir]] = [arr[index + dir], arr[index]]
    setEditProblems(arr)
  }

  // 按知识点分组题目
  const groupedQuestions = useMemo(() => {
    if (!selectedDay?.questions && !selectedDay?.problems) return {}

    const questions = selectedDay?.questions || selectedDay?.problems || []
    const groups = {}
    questions.forEach((q) => {
      const topic = q.topic || q.knowledge_tag || '未分类'
      if (!groups[topic]) {
        groups[topic] = []
      }
      groups[topic].push(q)
    })
    return groups
  }, [selectedDay])

  // 计算完成统计
  const completionStats = useMemo(() => {
    const questions = selectedDay?.questions || selectedDay?.problems || []
    if (!questions || questions.length === 0) return { completed: 0, total: 0, percent: 0 }

    const total = questions.length
    const completed = questions.filter(
      (q) => q.status === QUESTION_STATUS.COMPLETED
    ).length
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0

    return { completed, total, percent }
  }, [selectedDay])

  // 获取状态样式
  const getStatusStyle = (status) => {
    switch (status) {
      case QUESTION_STATUS.COMPLETED:
        return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case QUESTION_STATUS.NEED_REVIEW:
        return 'bg-amber-100 text-amber-700 border-amber-200'
      default:
        return 'bg-gray-100 text-gray-500 border-gray-200'
    }
  }

  // 获取状态图标
  const getStatusIcon = (status) => {
    switch (status) {
      case QUESTION_STATUS.COMPLETED:
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      case QUESTION_STATUS.NEED_REVIEW:
        return <AlertCircle className="w-4 h-4 text-amber-500" />
      default:
        return <Circle className="w-4 h-4 text-gray-400" />
    }
  }

  // 获取状态标签
  const getStatusLabel = (status) => {
    const option = STATUS_OPTIONS.find((o) => o.value === status)
    return option?.label || '未完成'
  }

  // 获取难度标签
  const getDifficultyLabel = (difficulty) => {
    switch (difficulty) {
      case 'easy': return '简单'
      case 'medium': return '中等'
      case 'hard': return '困难'
      default: return difficulty || '中等'
    }
  }

  // 如果弹窗未打开或没有选中日期，不渲染
  if (!isModalOpen || !selectedDay) return null

  const isRestDay = selectedDay.isRestDay
  const allCompleted = completionStats.percent === 100 && completionStats.total > 0

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* 弹窗内容 */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="animate-modal-enter bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col pointer-events-auto">
          {/* ====== 弹窗头部 ====== */}
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              {/* Day编号 */}
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {selectedDay.dayNumber}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Day {selectedDay.dayNumber}
                  {isRestDay && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      休息日
                    </span>
                  )}
                </h3>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  {selectedDay.dateDisplay && <span>{selectedDay.dateDisplay}</span>}
                  {selectedDay.duration && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {selectedDay.duration}分钟
                    </span>
                  )}
                  {selectedDay.topic && (
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" />
                      {selectedDay.topic}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 右侧按钮组 */}
            <div className="flex items-center gap-2">
              {/* 编辑/取消按钮 */}
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                    disabled={saving}
                  >
                    <XCircle className="w-4 h-4" />
                    取消
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500 text-sm text-white hover:bg-emerald-600 transition-colors disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        保存中...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        保存
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleEnterEdit}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  编辑
                </button>
              )}

              {/* 关闭按钮 */}
              <button
                onClick={handleClose}
                className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* ====== 休息日内容 ====== */}
          {isRestDay && !isEditing ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 bg-gradient-to-b from-gray-50 to-white rounded-xl mx-5 my-4">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-5 shadow-sm">
                <Coffee className="w-12 h-12 text-blue-400" />
              </div>
              <h4 className="text-xl font-semibold text-gray-700 mb-2">今天是休息日</h4>
              <p className="text-sm text-gray-400 mb-3">好好放松，为接下来的学习充电</p>
              {selectedDay?.theme && (
                <span className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm font-medium">
                  {selectedDay.theme}
                </span>
              )}
            </div>
          ) : (
            <>
              {/* ====== 编辑模式表单 ====== */}
              {isEditing ? (
                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                  {/* 主题和休息日设置 */}
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-emerald-500" />
                      基本信息
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">主题</label>
                        <input
                          type="text"
                          value={editTheme}
                          onChange={(e) => setEditTheme(e.target.value)}
                          placeholder="输入当天主题"
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={editIsRestDay}
                            onChange={(e) => setEditIsRestDay(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                          />
                          <span className="text-sm text-gray-600">休息日</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* 视频列表编辑 */}
                  {!editIsRestDay && (
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <Video className="w-4 h-4 text-emerald-500" />
                          视频列表
                        </h4>
                        <button
                          onClick={handleAddVideo}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          添加
                        </button>
                      </div>
                      {editVideos.length === 0 && (
                        <p className="text-xs text-gray-400 text-center py-2">暂无视频，点击添加</p>
                      )}
                      {editVideos.map((video, idx) => (
                        <div key={idx} className="bg-white rounded-lg p-3 border border-gray-200 space-y-2">
                          <div className="flex items-center gap-2">
                            <GripVertical className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                            <span className="text-xs text-gray-400 w-8">#{idx + 1}</span>
                            <input
                              type="text"
                              value={video.title || ''}
                              onChange={(e) => handleVideoChange(idx, 'title', e.target.value)}
                              placeholder="视频标题"
                              className="flex-1 px-2 py-1.5 rounded border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            />
                            <button
                              onClick={() => handleRemoveVideo(idx)}
                              className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors flex-shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            </button>
                          </div>
                          <div className="flex gap-2 pl-[3.25rem]">
                            <input
                              type="text"
                              value={video.url || ''}
                              onChange={(e) => handleVideoChange(idx, 'url', e.target.value)}
                              placeholder="视频链接 URL"
                              className="flex-1 px-2 py-1.5 rounded border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            />
                            <input
                              type="text"
                              value={video.duration || ''}
                              onChange={(e) => handleVideoChange(idx, 'duration', e.target.value)}
                              placeholder="时长"
                              className="w-20 px-2 py-1.5 rounded border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 题目列表编辑 */}
                  {!editIsRestDay && (
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-emerald-500" />
                          题目列表
                        </h4>
                        <button
                          onClick={handleAddProblem}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          添加
                        </button>
                      </div>
                      {editProblems.length === 0 && (
                        <p className="text-xs text-gray-400 text-center py-2">暂无题目，点击添加</p>
                      )}
                      {editProblems.map((problem, idx) => (
                        <div key={problem.id || idx} className="bg-white rounded-lg p-3 border border-gray-200 space-y-2">
                          <div className="flex items-center gap-2">
                            <GripVertical className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                            <span className="text-xs text-gray-400 w-8">#{idx + 1}</span>
                            <input
                              type="text"
                              value={problem.title || ''}
                              onChange={(e) => handleProblemChange(idx, 'title', e.target.value)}
                              placeholder="题目标题"
                              className="flex-1 px-2 py-1.5 rounded border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            />
                            <button
                              onClick={() => handleRemoveProblem(idx)}
                              className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors flex-shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            </button>
                          </div>
                          <div className="flex gap-2 pl-[3.25rem]">
                            <input
                              type="text"
                              value={problem.knowledge_tag || problem.topic || ''}
                              onChange={(e) => handleProblemChange(idx, 'knowledge_tag', e.target.value)}
                              placeholder="知识点标签"
                              className="w-1/3 px-2 py-1.5 rounded border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            />
                            <select
                              value={problem.difficulty || 'medium'}
                              onChange={(e) => handleProblemChange(idx, 'difficulty', e.target.value)}
                              className="w-24 px-2 py-1.5 rounded border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                            >
                              <option value="easy">简单</option>
                              <option value="medium">中等</option>
                              <option value="hard">困难</option>
                            </select>
                            <select
                              value={problem.status || 'uncompleted'}
                              onChange={(e) => handleProblemChange(idx, 'status', e.target.value)}
                              className="w-28 px-2 py-1.5 rounded border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                            >
                              <option value="uncompleted">未完成</option>
                              <option value="completed">已完成</option>
                              <option value="need_review">需复习</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* ====== 统计信息条（只读模式） ====== */}
                  <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          共 {completionStats.total} 题
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm text-emerald-600 font-medium">
                          已完成 {completionStats.completed} 题
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* 进度百分比 */}
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${completionStats.percent}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {completionStats.percent}%
                      </span>
                    </div>
                  </div>

                  {/* ====== 视频列表 ====== */}
                  {selectedDay.videos && selectedDay.videos.length > 0 && (
                    <div className="px-5 pt-4 pb-2">
                      <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                        <Video className="w-4 h-4 text-emerald-500" />
                        视频 ({selectedDay.videos.length})
                      </h4>
                      <div className="space-y-2">
                        {selectedDay.videos.map((video, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                          >
                            <a
                              href={video.url || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 flex-1 min-w-0"
                            >
                              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Video className="w-4 h-4 text-red-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-700 truncate">{video.title || `视频 ${idx + 1}`}</p>
                                {video.duration && <p className="text-xs text-gray-400">{video.duration}</p>}
                              </div>
                            </a>
                            {/* 视频观看状态下拉栏 */}
                            <div className="relative flex-shrink-0">
                              <button
                                onClick={() => setOpenVideoDropdown(openVideoDropdown === video.id ? null : video.id)}
                                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${
                                  video.is_watched
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-gray-100 text-gray-500'
                                }`}
                              >
                                {video.is_watched ? (
                                  <><CheckCircle2 className="w-3 h-3" />已观看</>
                                ) : (
                                  <><Circle className="w-3 h-3" />未观看</>
                                )}
                                <ChevronDown className="w-3 h-3" />
                              </button>
                              {openVideoDropdown === video.id && (
                                <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50 w-28">
                                  <button
                                    onClick={() => {
                                      if (currentPlan?.id && selectedDay?.dayNumber) {
                                        updateVideoWatchStatus(currentPlan.id, selectedDay.dayNumber, video.id, true)
                                      }
                                      setOpenVideoDropdown(null)
                                    }}
                                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-emerald-50 transition-colors ${
                                      video.is_watched ? 'text-emerald-600' : 'text-gray-600'
                                    }`}
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                    已观看
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (currentPlan?.id && selectedDay?.dayNumber) {
                                        updateVideoWatchStatus(currentPlan.id, selectedDay.dayNumber, video.id, false)
                                      }
                                      setOpenVideoDropdown(null)
                                    }}
                                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                                      !video.is_watched ? 'text-gray-900' : 'text-gray-600'
                                    }`}
                                  >
                                    <Circle className="w-4 h-4" />
                                    未观看
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ====== 题目列表（按知识点分组） ====== */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    {Object.entries(groupedQuestions).map(([topic, questions]) => (
                      <div key={topic}>
                        {/* 知识点分组标题 */}
                        <div className="flex items-center gap-2 mb-3">
                          <Tag className="w-4 h-4 text-emerald-500" />
                          <h4 className="text-sm font-semibold text-gray-700">
                            {topic}
                          </h4>
                          <span className="text-xs text-gray-400">
                            ({questions.length} 题)
                          </span>
                        </div>

                        {/* 题目列表 */}
                        <div className="space-y-2">
                          {questions.map((question, index) => (
                            <div
                              key={question.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                            >
                              {/* 题目信息 */}
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                {/* 题号 */}
                                <span className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-xs font-medium text-gray-500 border border-gray-200 flex-shrink-0">
                                  {index + 1}
                                </span>
                                {/* 题目标题 */}
                                <span className="text-sm text-gray-700 truncate">
                                  {question.title}
                                </span>
                                {/* 难度标签 */}
                                {question.difficulty && (
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                                      question.difficulty === 'easy'
                                        ? 'bg-green-100 text-green-700'
                                        : question.difficulty === 'medium'
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-red-100 text-red-700'
                                    }`}
                                  >
                                    {question.difficulty === 'easy'
                                      ? '简单'
                                      : question.difficulty === 'medium'
                                      ? '中等'
                                      : '困难'}
                                  </span>
                                )}
                              </div>

                              {/* 状态选择器 */}
                              <div className="relative flex-shrink-0 ml-3">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setOpenDropdown(
                                      openDropdown === question.id ? null : question.id
                                    )
                                  }}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${getStatusStyle(
                                    question.status
                                  )}`}
                                >
                                  {getStatusIcon(question.status)}
                                  <span>{getStatusLabel(question.status)}</span>
                                  <ChevronDown className="w-3 h-3" />
                                </button>

                                {/* 下拉菜单 */}
                                {openDropdown === question.id && (
                                  <>
                                    {/* 点击外部关闭 */}
                                    <div
                                      className="fixed inset-0 z-10"
                                      onClick={() => setOpenDropdown(null)}
                                    />
                                    <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-20">
                                      {STATUS_OPTIONS.map((option) => (
                                        <button
                                          key={option.value}
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleStatusChange(question.id, option.value)
                                          }}
                                          className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                                            question.status === option.value
                                              ? 'bg-emerald-50 text-emerald-700'
                                              : 'text-gray-700'
                                          }`}
                                        >
                                          <span
                                            className={`w-2.5 h-2.5 rounded-full ${option.color}`}
                                          />
                                          <span>{option.label}</span>
                                          {question.status === option.value && (
                                            <Check className="w-3.5 h-3.5 ml-auto" />
                                          )}
                                        </button>
                                      ))}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {/* 没有题目时 */}
                    {Object.keys(groupedQuestions).length === 0 && (
                      <div className="text-center py-10 text-gray-400">
                        <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">暂无题目安排</p>
                      </div>
                    )}
                  </div>

                  {/* ====== 底部操作区 ====== */}
                  <div className="flex items-center justify-between p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                    <div className="text-sm text-gray-500">
                      {selectedDay.isCompleted || selectedDay.status === 'completed' ? (
                        <div className="flex items-center gap-1.5 text-orange-500">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>今日已完成，点击右侧按钮可撤销</span>
                        </div>
                      ) : (
                        <span>
                          还剩 {completionStats.total - completionStats.completed} 题未完成
                        </span>
                      )}
                    </div>
                    <button
                      onClick={handleMarkComplete}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95 shadow-sm hover:shadow ${
                        selectedDay.isCompleted || selectedDay.status === 'completed'
                          ? 'bg-gray-500 text-white hover:bg-gray-600'
                          : 'bg-emerald-500 text-white hover:bg-emerald-600'
                      }`}
                    >
                      {selectedDay.isCompleted || selectedDay.status === 'completed' ? (
                        <>
                          <XCircle className="w-4 h-4" />
                          撤销完成
                        </>
                      ) : (
                        <>
                          <Trophy className="w-4 h-4" />
                          标记今日完成
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
export default DayDetailModal

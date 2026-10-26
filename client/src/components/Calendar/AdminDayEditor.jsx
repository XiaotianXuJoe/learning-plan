import React, { useState, useEffect } from 'react'
import {
  X,
  Video,
  HelpCircle,
  Plus,
  Trash2,
  Save,
  Loader2,
  Moon,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { templateApi } from '../../api/client'

/**
 * 难度选项配置
 */
const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: '简单', color: 'bg-green-100 text-green-700' },
  { value: 'medium', label: '中等', color: 'bg-amber-100 text-amber-700' },
  { value: 'hard', label: '困难', color: 'bg-red-100 text-red-700' },
]

/**
 * 管理员日期编辑弹窗
 * 用于编辑某天（Day）的主题、休息日状态、视频列表和题目列表
 */
const AdminDayEditor = ({
  templateId,
  dayNumber,
  dayData,
  onClose,
  onSaveSuccess,
  onDeleteDay,
}) => {
  // ====== 本地状态 ======
  const [theme, setTheme] = useState('')
  const [isRestDay, setIsRestDay] = useState(false)
  const [videos, setVideos] = useState([])
  const [problems, setProblems] = useState([])
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  // ====== 初始化数据 ======
  useEffect(() => {
    if (dayData) {
      setTheme(dayData.theme || '')
      setIsRestDay(!!dayData.is_rest_day)
      setVideos(
        (dayData.videos || []).map((v) => ({
          ...v,
          _localId: v.id || `v-${Date.now()}-${Math.random()}`,
        }))
      )
      setProblems(
        (dayData.problems || []).map((p) => ({
          ...p,
          _localId: p.id || `p-${Date.now()}-${Math.random()}`,
        }))
      )
    }
  }, [dayData])

  // Toast 自动消失
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  // ====== 视频操作 ======
  const addVideo = () => {
    setVideos([
      ...videos,
      {
        _localId: `v-${Date.now()}-${Math.random()}`,
        title: '',
        url: '',
        description: '',
        duration: 0,
      },
    ])
  }

  const updateVideo = (localId, field, value) => {
    setVideos(
      videos.map((v) =>
        v._localId === localId ? { ...v, [field]: value } : v
      )
    )
  }

  const removeVideo = (localId) => {
    setVideos(videos.filter((v) => v._localId !== localId))
  }

  // ====== 题目操作 ======
  const addProblem = () => {
    setProblems([
      ...problems,
      {
        _localId: `p-${Date.now()}-${Math.random()}`,
        title: '',
        description: '',
        difficulty: 'easy',
        knowledge_tag: '',
      },
    ])
  }

  const updateProblem = (localId, field, value) => {
    setProblems(
      problems.map((p) =>
        p._localId === localId ? { ...p, [field]: value } : p
      )
    )
  }

  const removeProblem = (localId) => {
    setProblems(problems.filter((p) => p._localId !== localId))
  }

  const moveVideo = (localId, dir) => {
    const idx = videos.findIndex((v) => v._localId === localId)
    if (idx < 0) return
    if (dir === -1 && idx === 0) return
    if (dir === 1 && idx === videos.length - 1) return
    const arr = [...videos]
    ;[arr[idx], arr[idx + dir]] = [arr[idx + dir], arr[idx]]
    setVideos(arr)
  }
  const moveProblem = (localId, dir) => {
    const idx = problems.findIndex((p) => p._localId === localId)
    if (idx < 0) return
    if (dir === -1 && idx === 0) return
    if (dir === 1 && idx === problems.length - 1) return
    const arr = [...problems]
    ;[arr[idx], arr[idx + dir]] = [arr[idx + dir], arr[idx]]
    setProblems(arr)
  }

  // ====== 保存 ======
  const handleSave = async () => {
    // 清理提交数据：删除 _localId 和 id 字段，确保类型正确
    const cleanVideos = videos
      .filter((v) => v.title.trim()) // 过滤掉空标题的视频
      .map(({ _localId, id, ...rest }) => ({
        title: rest.title || '',
        url: rest.url || '',
        description: rest.description || '',
        duration: parseInt(rest.duration, 10) || 0,
      }))

    const cleanProblems = problems
      .filter((p) => p.title.trim()) // 过滤掉空标题的题目
      .map(({ _localId, id, ...rest }) => ({
        title: rest.title || '',
        description: rest.description || '',
        difficulty: rest.difficulty || 'easy',
        knowledge_tag: rest.knowledge_tag || '',
      }))

    // is_rest_day: boolean → number (0/1)，SQLite 只接受 number
    const payload = {
      theme: theme.trim(),
      is_rest_day: isRestDay ? 1 : 0,
      videos: cleanVideos,
      problems: cleanProblems,
    }

    setSaving(true)
    try {
      const res = await templateApi.updateDay(templateId, dayNumber, payload)
      if (res.code === 0 || res.success) {
        setToast({ type: 'success', message: '保存成功' })
        if (onSaveSuccess) {
          onSaveSuccess({
            ...payload,
            is_rest_day: isRestDay, // 返回 boolean 给前端状态
            day_number: dayNumber,
          })
        }
        setTimeout(() => onClose(), 800)
      } else {
        setToast({ type: 'error', message: res.message || '保存失败' })
      }
    } catch (err) {
      console.error('保存Day数据失败:', err)
      setToast({ type: 'error', message: err.message || '保存失败' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[60] flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
          toast.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      {/* 弹窗内容 */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col pointer-events-auto animate-modal-enter">
          {/* ====== 弹窗头部 ====== */}
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">{dayNumber}</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Day {dayNumber} 编辑</h3>
                <p className="text-sm text-gray-500">编辑该天的主题、视频和题目</p>
              </div>
            </div>
            {onDeleteDay && (
              <button
                onClick={() => {
                  if (confirm(`确定删除 Day ${dayNumber} 吗？该天的视频和题目也会被一并删除，且后续天数会自动前移。`)) {
                    onDeleteDay()
                  }
                }}
                className="w-9 h-9 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors mr-2"
                title="删除这天"
              >
                <Trash2 className="w-5 h-5 text-red-500" />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* ====== 弹窗主体（可滚动） ====== */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* ---- 主题 & 休息日 ---- */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  主题 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="例如：数组基础与双指针"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="rest-day"
                  checked={isRestDay}
                  onChange={(e) => setIsRestDay(e.target.checked)}
                  className="w-4 h-4 text-emerald-500 rounded border-gray-300 focus:ring-emerald-500"
                />
                <label htmlFor="rest-day" className="text-sm text-gray-600 flex items-center gap-1 cursor-pointer">
                  <Moon className="w-4 h-4" />
                  休息日
                </label>
              </div>
            </div>

            {/* ---- 视频列表 ---- */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Video className="w-4 h-4 text-blue-500" />
                  视频 ({videos.length})
                </h4>
                <button
                  onClick={addVideo}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  添加视频
                </button>
              </div>

              {videos.length === 0 ? (
                <p className="text-xs text-gray-400 py-3 text-center border border-dashed border-gray-200 rounded-lg">
                  暂无视频，点击上方按钮添加
                </p>
              ) : (
                <div className="space-y-3">
                  {videos.map((video, idx) => (
                    <div key={video._localId} className="border border-gray-100 rounded-lg p-3 bg-gray-50/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400">视频 #{idx + 1}</span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => moveVideo(video._localId, -1)} disabled={idx===0} className="text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors" title="上移">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                          </button>
                          <button onClick={() => moveVideo(video._localId, 1)} disabled={idx===videos.length-1} className="text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors" title="下移">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                          </button>
                          <button onClick={() => removeVideo(video._localId)} className="text-gray-400 hover:text-red-500 transition-colors ml-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        <input
                          type="text"
                          value={video.title}
                          onChange={(e) => updateVideo(video._localId, 'title', e.target.value)}
                          placeholder="视频标题"
                          className="px-3 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <input
                          type="text"
                          value={video.url}
                          onChange={(e) => updateVideo(video._localId, 'url', e.target.value)}
                          placeholder="视频URL（https://...）"
                          className="px-3 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={video.description || ''}
                            onChange={(e) => updateVideo(video._localId, 'description', e.target.value)}
                            placeholder="视频描述"
                            className="px-3 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                          <input
                            type="number"
                            min={0}
                            value={video.duration || 0}
                            onChange={(e) => updateVideo(video._localId, 'duration', parseInt(e.target.value, 10) || 0)}
                            placeholder="时长(分钟)"
                            className="px-3 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ---- 题目列表 ---- */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-orange-500" />
                  题目 ({problems.length})
                </h4>
                <button
                  onClick={addProblem}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  添加题目
                </button>
              </div>

              {problems.length === 0 ? (
                <p className="text-xs text-gray-400 py-3 text-center border border-dashed border-gray-200 rounded-lg">
                  暂无题目，点击上方按钮添加
                </p>
              ) : (
                <div className="space-y-3">
                  {problems.map((problem, idx) => (
                    <div key={problem._localId} className="border border-gray-100 rounded-lg p-3 bg-gray-50/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400">题目 #{idx + 1}</span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => moveProblem(problem._localId, -1)} disabled={idx===0} className="text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors" title="上移">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                          </button>
                          <button onClick={() => moveProblem(problem._localId, 1)} disabled={idx===problems.length-1} className="text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors" title="下移">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                          </button>
                          <button onClick={() => removeProblem(problem._localId)} className="text-gray-400 hover:text-red-500 transition-colors ml-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        <input
                          type="text"
                          value={problem.title}
                          onChange={(e) => updateProblem(problem._localId, 'title', e.target.value)}
                          placeholder="题目标题"
                          className="px-3 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <textarea
                          value={problem.description}
                          onChange={(e) => updateProblem(problem._localId, 'description', e.target.value)}
                          placeholder="题目描述"
                          rows={2}
                          className="px-3 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={problem.difficulty}
                            onChange={(e) => updateProblem(problem._localId, 'difficulty', e.target.value)}
                            className="px-3 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            {DIFFICULTY_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={problem.knowledge_tag || ''}
                            onChange={(e) => updateProblem(problem._localId, 'knowledge_tag', e.target.value)}
                            placeholder="知识点标签（如：数组、链表）"
                            className="px-3 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ====== 弹窗底部 ====== */}
          <div className="flex justify-end gap-3 p-5 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              <Save className="w-4 h-4" />
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default AdminDayEditor

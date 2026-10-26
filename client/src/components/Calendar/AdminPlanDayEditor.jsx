import { useState, useEffect, useCallback } from 'react'
import {
  X, Tag, Video, FileText, Plus, Trash2, GripVertical,
  Coffee, Loader2, Save, XCircle, Pencil, CalendarDays,
} from 'lucide-react'
import { planApi } from '../../api/client'

/**
 * AdminPlanDayEditor - 管理员编辑学员计划某天内容
 * 功能：查看/编辑主题、休息日、视频列表、题目列表
 * 不包含：题目完成状态下拉栏、标记完成按钮
 *
 * Props:
 *   planId       - 学员计划ID
 *   dayNumber    - 天数编号
 *   templateName - 计划模板名称（显示用）
 *   studentName  - 学员名称（显示用）
 *   onClose      - 关闭回调
 *   onSave       - 保存成功回调（可选，用于刷新父组件数据）
 */
export default function AdminPlanDayEditor({
  planId,
  dayNumber,
  templateName = '',
  studentName = '',
  onClose,
  onSave,
}) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState(null)

  // 原始数据（用于取消恢复）
  const [originalDay, setOriginalDay] = useState(null)

  // 编辑状态
  const [editTheme, setEditTheme] = useState('')
  const [editIsRestDay, setEditIsRestDay] = useState(false)
  const [editVideos, setEditVideos] = useState([])
  const [editProblems, setEditProblems] = useState([])

  // 加载当天完整数据
  const loadDayData = useCallback(async () => {
    if (!planId || !dayNumber) return
    setLoading(true)
    setError(null)
    try {
      const res = await planApi.getCalendarFull(planId)
      const result = res.data || res
      const days = result.days || []
      const day = days.find(d => d.dayNumber === dayNumber)

      if (!day) {
        setError(`Day ${dayNumber} 不存在`)
        setLoading(false)
        return
      }

      setOriginalDay(day)
      setEditTheme(day.theme || `Day ${dayNumber}`)
      setEditIsRestDay(day.isRestDay || false)

      // 格式化视频数据
      const videos = (day.videos || []).map(v => ({
        title: v.title || '',
        url: v.url || '',
        duration: v.duration || '',
        platform: v.platform || 'bilibili',
      }))
      setEditVideos(videos)

      // 格式化题目数据（不包含状态）
      const problems = (day.problems || []).map((p, idx) => ({
        id: p.id || `exist-${idx}`,
        title: p.title || '',
        description: p.description || '',
        difficulty: p.difficulty || 'medium',
        knowledge_tag: p.knowledge_tag || p.topic || '未分类',
        sort_order: p.sort_order || idx,
      }))
      setEditProblems(problems)
    } catch (err) {
      console.error('加载当天数据失败:', err)
      setError(err.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }, [planId, dayNumber])

  useEffect(() => {
    loadDayData()
  }, [loadDayData])

  // 进入编辑模式
  const handleEnterEdit = () => {
    setIsEditing(true)
  }

  // 取消编辑
  const handleCancelEdit = () => {
    if (originalDay) {
      setEditTheme(originalDay.theme || `Day ${dayNumber}`)
      setEditIsRestDay(originalDay.isRestDay || false)
      const videos = (originalDay.videos || []).map(v => ({
        title: v.title || '',
        url: v.url || '',
        duration: v.duration || '',
        platform: v.platform || 'bilibili',
      }))
      setEditVideos(videos)
      const problems = (originalDay.problems || []).map((p, idx) => ({
        id: p.id || `exist-${idx}`,
        title: p.title || '',
        description: p.description || '',
        difficulty: p.difficulty || 'medium',
        knowledge_tag: p.knowledge_tag || p.topic || '未分类',
        sort_order: p.sort_order || idx,
      }))
      setEditProblems(problems)
    }
    setIsEditing(false)
  }

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!planId || !dayNumber) return
    setSaving(true)
    try {
      const dayData = {
        theme: editTheme,
        is_rest_day: editIsRestDay,
        videos: editVideos.map(v => ({
          title: v.title || '',
          url: v.url || '',
          duration: v.duration || '',
          platform: v.platform || 'bilibili',
        })),
        problems: editProblems.map(p => ({
          title: p.title || '',
          description: p.description || '',
          difficulty: p.difficulty || 'medium',
          knowledge_tag: p.knowledge_tag || '未分类',
          sort_order: p.sort_order || 0,
        })),
      }

      const res = await planApi.updateStudentPlanDay(planId, dayNumber, dayData)
      if (res.code === 0 || res.success) {
        setIsEditing(false)
        // 重新加载数据以获取更新后的状态
        await loadDayData()
        // 通知父组件刷新
        if (onSave) onSave()
      } else {
        setError(res.message || '保存失败')
      }
    } catch (err) {
      console.error('保存失败:', err)
      setError(err.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  // 视频操作
  const handleAddVideo = () => {
    setEditVideos([...editVideos, { title: '', url: '', duration: '', platform: 'bilibili' }])
  }
  const handleRemoveVideo = (index) => {
    setEditVideos(editVideos.filter((_, i) => i !== index))
  }
  const handleVideoChange = (index, field, value) => {
    setEditVideos(editVideos.map((v, i) => i === index ? { ...v, [field]: value } : v))
  }

  // 题目操作
  const handleAddProblem = () => {
    setEditProblems([...editProblems, {
      id: `new-${Date.now()}`,
      title: '',
      description: '',
      difficulty: 'medium',
      knowledge_tag: '',
      sort_order: editProblems.length,
    }])
  }
  const handleRemoveProblem = (index) => {
    setEditProblems(editProblems.filter((_, i) => i !== index))
  }
  const handleProblemChange = (index, field, value) => {
    setEditProblems(editProblems.map((p, i) => i === index ? { ...p, [field]: value } : p))
  }

  const getDifficultyLabel = (d) => {
    switch (d) {
      case 'easy': return '简单'
      case 'medium': return '中等'
      case 'hard': return '困难'
      default: return d || '中等'
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-8 flex flex-col items-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
          <p className="text-gray-500">加载 Day {dayNumber} 数据中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="animate-modal-enter bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* ====== 弹窗头部 ====== */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">{dayNumber}</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Day {dayNumber}
                {editIsRestDay && !isEditing && originalDay?.isRestDay && (
                  <span className="ml-2 text-sm font-normal text-gray-500">休息日</span>
                )}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {studentName && <span>{studentName}</span>}
                {templateName && (
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5" />
                    {templateName}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button onClick={handleCancelEdit} disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-60">
                  <XCircle className="w-4 h-4" />
                  取消
                </button>
                <button onClick={handleSaveEdit} disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500 text-sm text-white hover:bg-emerald-600 transition-colors disabled:opacity-60">
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
              <button onClick={handleEnterEdit}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                <Pencil className="w-4 h-4" />
                编辑
              </button>
            )}
            <button onClick={onClose}
              className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mx-5 mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        {/* ====== 休息日展示模式 ====== */}
        {!isEditing && originalDay?.isRestDay && (
          <div className="flex-1 flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Coffee className="w-10 h-10 text-gray-400" />
            </div>
            <h4 className="text-lg font-medium text-gray-700 mb-2">今天是休息日</h4>
            <p className="text-sm text-gray-500 mb-4">主题：{originalDay?.theme || '休息日'}</p>
          </div>
        )}

        {/* ====== 编辑模式 ====== */}
        {isEditing && (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* 主题和休息日 */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-500" />
                基本信息
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">主题</label>
                  <input type="text" value={editTheme}
                    onChange={(e) => setEditTheme(e.target.value)}
                    placeholder="输入当天主题"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={editIsRestDay}
                      onChange={(e) => setEditIsRestDay(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500" />
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
                  <button onClick={handleAddVideo}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-colors">
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
                      <span className="text-xs text-gray-400 w-8">#{idx + 1}</span>
                      <button onClick={() => moveVideo(idx, -1)} disabled={idx===0} className="text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors" title="上移">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                      </button>
                      <button onClick={() => moveVideo(idx, 1)} disabled={idx===editVideos.length-1} className="text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors" title="下移">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                      </button>
                      <input type="text" value={video.title || ''}
                        onChange={(e) => handleVideoChange(idx, 'title', e.target.value)}
                        placeholder="视频标题"
                        className="flex-1 px-2 py-1.5 rounded border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                      <button onClick={() => handleRemoveVideo(idx)}
                        className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors flex-shrink-0">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                    <div className="flex gap-2 pl-[3.25rem]">
                      <input type="text" value={video.url || ''}
                        onChange={(e) => handleVideoChange(idx, 'url', e.target.value)}
                        placeholder="视频链接 URL"
                        className="flex-1 px-2 py-1.5 rounded border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                      <input type="text" value={video.duration || ''}
                        onChange={(e) => handleVideoChange(idx, 'duration', e.target.value)}
                        placeholder="时长"
                        className="w-20 px-2 py-1.5 rounded border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
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
                  <button onClick={handleAddProblem}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-colors">
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
                      <span className="text-xs text-gray-400 w-8">#{idx + 1}</span>
                      <button onClick={() => moveVideo(idx, -1)} disabled={idx===0} className="text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors" title="上移">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                      </button>
                      <button onClick={() => moveVideo(idx, 1)} disabled={idx===editVideos.length-1} className="text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors" title="下移">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                      </button>
                      <input type="text" value={problem.title || ''}
                        onChange={(e) => handleProblemChange(idx, 'title', e.target.value)}
                        placeholder="题目标题"
                        className="flex-1 px-2 py-1.5 rounded border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                      <button onClick={() => handleRemoveProblem(idx)}
                        className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors flex-shrink-0">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                    <div className="flex gap-2 pl-[3.25rem]">
                      <input type="text" value={problem.description || ''}
                        onChange={(e) => handleProblemChange(idx, 'description', e.target.value)}
                        placeholder="题目描述"
                        className="flex-1 px-2 py-1.5 rounded border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                      <select value={problem.difficulty || 'medium'}
                        onChange={(e) => handleProblemChange(idx, 'difficulty', e.target.value)}
                        className="w-24 px-2 py-1.5 rounded border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
                        <option value="easy">简单</option>
                        <option value="medium">中等</option>
                        <option value="hard">困难</option>
                      </select>
                    </div>
                    <div className="pl-[3.25rem]">
                      <input type="text" value={problem.knowledge_tag || ''}
                        onChange={(e) => handleProblemChange(idx, 'knowledge_tag', e.target.value)}
                        placeholder="知识点标签"
                        className="w-full px-2 py-1.5 rounded border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ====== 只读模式 - 视频/题目展示 ====== */}
        {!isEditing && !originalDay?.isRestDay && (
          <div className="flex-1 overflow-y-auto">
            {/* 主题信息 */}
            <div className="px-5 pt-4 pb-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Tag className="w-4 h-4 text-emerald-500" />
                <span className="font-medium">主题：</span>
                <span>{originalDay?.theme || `Day ${dayNumber}`}</span>
              </div>
            </div>

            {/* 视频列表 */}
            {originalDay?.videos && originalDay.videos.length > 0 && (
              <div className="px-5 pt-4 pb-2">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                  <Video className="w-4 h-4 text-emerald-500" />
                  视频 ({originalDay.videos.length})
                </h4>
                <div className="space-y-2">
                  {originalDay.videos.map((video, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Video className="w-4 h-4 text-red-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 truncate">{video.title || `视频 ${idx + 1}`}</p>
                        {video.duration && <p className="text-xs text-gray-400">{video.duration}</p>}
                      </div>
                      {video.url && (
                        <a href={video.url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:text-blue-600 flex-shrink-0">
                          查看
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 题目列表 */}
            {originalDay?.problems && originalDay.problems.length > 0 && (
              <div className="px-5 pt-4 pb-2">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-emerald-500" />
                  题目 ({originalDay.problems.length})
                </h4>
                <div className="space-y-2">
                  {originalDay.problems.map((problem, idx) => (
                    <div key={problem.id || idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <span className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-xs font-medium text-gray-500 border border-gray-200 flex-shrink-0">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 truncate">{problem.title || '未命名题目'}</p>
                        {problem.knowledge_tag && (
                          <p className="text-xs text-gray-400">{problem.knowledge_tag}</p>
                        )}
                      </div>
                      {problem.difficulty && (
                        <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                          problem.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                          problem.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {getDifficultyLabel(problem.difficulty)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 空状态 */}
            {(!originalDay?.videos || originalDay.videos.length === 0) &&
             (!originalDay?.problems || originalDay.problems.length === 0) && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <FileText className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">暂无内容</p>
                <p className="text-xs mt-1">点击「编辑」按钮添加视频和题目</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, Download, Plus, X, Loader2, Target, Brain, BookOpen, AlertCircle } from 'lucide-react'
import { useStore } from '@/lib/store'
import { AIService } from '@/lib/ai-service'
import { downloadAsPDF } from '@/lib/utils'
import LanguageSelector from '../LanguageSelector'
import ReactMarkdown from 'react-markdown'

interface SubjectConfig {
  name: string
  priority: 'high' | 'medium' | 'low'
  currentLevel: number // 1-10 scale
  targetScore: number // percentage
}

export default function StudyPlanner() {
  const { selectedModel, selectedLanguage } = useStore()
  const [examDate, setExamDate] = useState('')
  const [examName, setExamName] = useState('')
  const [studyHours, setStudyHours] = useState(2)
  const [subjects, setSubjects] = useState<SubjectConfig[]>([{
    name: '',
    priority: 'medium',
    currentLevel: 5,
    targetScore: 80
  }])
  const [studyStyle, setStudyStyle] = useState('balanced')
  const [includeWeekends, setIncludeWeekends] = useState(true)
  const [focusAreas, setFocusAreas] = useState('')
  const [studyPlan, setStudyPlan] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  
  const aiService = AIService.getInstance()

  const addSubject = () => {
    setSubjects([...subjects, {
      name: '',
      priority: 'medium',
      currentLevel: 5,
      targetScore: 80
    }])
  }

  const removeSubject = (index: number) => {
    if (subjects.length > 1) {
      setSubjects(subjects.filter((_, i) => i !== index))
    }
  }

  const updateSubject = (index: number, field: keyof SubjectConfig, value: any) => {
    const newSubjects = [...subjects]
    newSubjects[index] = { ...newSubjects[index], [field]: value }
    setSubjects(newSubjects)
  }

  const generatePlan = async () => {
    const validSubjects = subjects.filter(s => s.name.trim())
    if (!examDate || validSubjects.length === 0) return

    setIsGenerating(true)
    try {
      const result = await aiService.generateDetailedStudyPlan({
        examDate,
        examName,
        studyHours,
        subjects: validSubjects,
        studyStyle,
        includeWeekends,
        focusAreas,
        model: selectedModel,
        language: selectedLanguage
      })

      setStudyPlan(result)
    } catch (error) {
      console.error('Study plan generation error:', error)
      setStudyPlan('Error generating study plan. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadPlan = () => {
    if (!studyPlan) return
    downloadAsPDF(studyPlan, `study_plan_${examName || 'exam'}.pdf`)
  }

  const calculateDaysUntilExam = () => {
    if (!examDate) return 0
    const today = new Date()
    const exam = new Date(examDate)
    const diffTime = exam.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  const calculateTotalStudyHours = () => {
    const days = calculateDaysUntilExam()
    if (!includeWeekends) {
      const weeks = Math.floor(days / 7)
      const remainingDays = days % 7
      const weekdays = weeks * 5 + Math.min(remainingDays, 5)
      return weekdays * studyHours
    }
    return days * studyHours
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-serif font-bold">Advanced Study Planner</h2>
        <LanguageSelector />
      </div>

      {/* Exam Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Exam Name</label>
          <input
            type="text"
            value={examName}
            onChange={(e) => setExamName(e.target.value)}
            placeholder="e.g., Final Exams, SAT, Board Exams"
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Exam Date</label>
          <input
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="input-field"
          />
          {examDate && (
            <p className="text-sm text-gray-600 mt-1">
              {calculateDaysUntilExam()} days until exam
            </p>
          )}
        </div>
      </div>

      {/* Study Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Study Hours per Day</label>
          <input
            type="number"
            value={studyHours}
            onChange={(e) => setStudyHours(Math.max(1, parseInt(e.target.value) || 1))}
            min="1"
            max="12"
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Study Style</label>
          <select
            value={studyStyle}
            onChange={(e) => setStudyStyle(e.target.value)}
            className="input-field"
          >
            <option value="intensive">Intensive (Focus on weak areas)</option>
            <option value="balanced">Balanced (Equal distribution)</option>
            <option value="revision">Revision-Heavy (More practice)</option>
            <option value="conceptual">Conceptual (Deep understanding)</option>
          </select>
        </div>

        <div className="flex items-center gap-2 mt-6">
          <input
            type="checkbox"
            id="weekends"
            checked={includeWeekends}
            onChange={(e) => setIncludeWeekends(e.target.checked)}
            className="w-4 h-4 text-edu-gold"
          />
          <label htmlFor="weekends" className="text-sm font-medium">
            Include weekends
          </label>
        </div>
      </div>

      {/* Subjects Configuration */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Subjects to Study</label>
        <div className="space-y-3">
          {subjects.map((subject, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  type="text"
                  value={subject.name}
                  onChange={(e) => updateSubject(index, 'name', e.target.value)}
                  placeholder={`Subject ${index + 1}`}
                  className="input-field"
                />
                
                <select
                  value={subject.priority}
                  onChange={(e) => updateSubject(index, 'priority', e.target.value)}
                  className="input-field"
                >
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>

                <div>
                  <label className="text-xs text-gray-600">Current Level (1-10)</label>
                  <input
                    type="number"
                    value={subject.currentLevel}
                    onChange={(e) => updateSubject(index, 'currentLevel', Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                    min="1"
                    max="10"
                    className="input-field"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-gray-600">Target Score (%)</label>
                    <input
                      type="number"
                      value={subject.targetScore}
                      onChange={(e) => updateSubject(index, 'targetScore', Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                      min="0"
                      max="100"
                      className="input-field"
                    />
                  </div>
                  {subjects.length > 1 && (
                    <button
                      onClick={() => removeSubject(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-5"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <button
          onClick={addSubject}
          className="mt-3 flex items-center gap-2 text-sm text-gray-600 hover:text-black transition-colors"
        >
          <Plus size={16} />
          Add Subject
        </button>
      </div>

      {/* Focus Areas */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Specific Topics or Focus Areas (Optional)
        </label>
        <textarea
          value={focusAreas}
          onChange={(e) => setFocusAreas(e.target.value)}
          placeholder="e.g., Calculus chapter 5-7, Organic Chemistry reactions, Essay writing..."
          className="input-field min-h-24"
          rows={3}
        />
      </div>

      {/* Study Time Summary */}
      {examDate && (
        <div className="mb-6 p-4 bg-edu-gold/10 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={20} className="text-edu-gold" />
              <span className="font-medium">
                Total Study Time: {calculateTotalStudyHours()} hours
              </span>
            </div>
            <div className="text-sm text-gray-600">
              {Math.floor(calculateTotalStudyHours() / subjects.filter(s => s.name).length)} hours per subject
            </div>
          </div>
        </div>
      )}

      <button
        onClick={generatePlan}
        disabled={!examDate || subjects.filter(s => s.name.trim()).length === 0 || isGenerating}
        className="btn-gold w-full mb-6 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isGenerating ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            Creating Detailed Study Plan...
          </>
        ) : (
          <>
            <Calendar size={20} />
            Generate Comprehensive Study Plan
          </>
        )}
      </button>

      {studyPlan && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="bg-gray-50 rounded-lg p-6 max-h-[600px] overflow-y-auto">
            <ReactMarkdown 
              className="prose prose-sm max-w-none"
              components={{
                strong: ({children}) => <strong className="font-bold text-gray-900">{children}</strong>,
                em: ({children}) => <em className="italic text-gray-700">{children}</em>,
                h1: ({children}) => <h1 className="text-2xl font-bold mb-4 text-gray-900">{children}</h1>,
                h2: ({children}) => <h2 className="text-xl font-bold mb-3 mt-6 text-gray-800">{children}</h2>,
                h3: ({children}) => <h3 className="text-lg font-bold mb-2 mt-4 text-gray-700">{children}</h3>,
                h4: ({children}) => <h4 className="text-md font-semibold mb-2 mt-3 text-gray-600">{children}</h4>,
                p: ({children}) => <p className="mb-3 text-gray-600 leading-relaxed">{children}</p>,
                ul: ({children}) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
                ol: ({children}) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
                li: ({children}) => <li className="mb-1 text-gray-600">{children}</li>,
                blockquote: ({children}) => (
                  <blockquote className="border-l-4 border-edu-gold pl-4 py-2 my-4 bg-edu-gold/5">
                    {children}
                  </blockquote>
                ),
                code: ({children}) => (
                  <code className="bg-gray-200 px-1 py-0.5 rounded text-sm">{children}</code>
                ),
                hr: () => <hr className="my-6 border-gray-300" />
              }}
            >
              {studyPlan}
            </ReactMarkdown>
          </div>

          <div className="flex items-center justify-between p-4 bg-edu-gold/10 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Target size={20} className="text-edu-gold" />
                <span className="font-medium">Personalized for your goals</span>
              </div>
              <div className="flex items-center gap-2">
                <Brain size={20} className="text-edu-gold" />
                <span className="text-sm text-gray-600">Optimized learning path</span>
              </div>
            </div>
            
            <button
              onClick={downloadPlan}
              className="btn-secondary flex items-center gap-2"
            >
              <Download size={20} />
              Download Plan
            </button>
          </div>
        </motion.div>
      )}

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <BookOpen size={18} />
            Enhanced Features:
          </h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Personalized daily & weekly schedules</li>
            <li>• Subject priority-based time allocation</li>
            <li>• Progress milestones & checkpoints</li>
            <li>• Topic-specific study strategies</li>
            <li>• Practice test scheduling</li>
            <li>• Revision cycles optimization</li>
          </ul>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <AlertCircle size={18} className="text-blue-600" />
            Study Tips:
          </h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Take regular breaks (Pomodoro technique)</li>
            <li>• Review notes before sleeping</li>
            <li>• Use active recall for memorization</li>
            <li>• Practice with past papers</li>
            <li>• Stay hydrated and eat well</li>
            <li>• Get adequate sleep (7-8 hours)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
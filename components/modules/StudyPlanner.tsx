'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, Download, Plus, X, Loader2 } from 'lucide-react'
import { useStore } from '@/lib/store'
import { AIService } from '@/lib/ai-service'
import { downloadAsPDF } from '@/lib/utils'
import LanguageSelector from '../LanguageSelector'
import ReactMarkdown from 'react-markdown'

export default function StudyPlanner() {
  const { selectedModel, selectedLanguage } = useStore()
  const [examDate, setExamDate] = useState('')
  const [studyHours, setStudyHours] = useState(2)
  const [subjects, setSubjects] = useState<string[]>([''])
  const [studyPlan, setStudyPlan] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  
  const aiService = AIService.getInstance()

  const addSubject = () => {
    setSubjects([...subjects, ''])
  }

  const removeSubject = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index))
  }

  const updateSubject = (index: number, value: string) => {
    const newSubjects = [...subjects]
    newSubjects[index] = value
    setSubjects(newSubjects)
  }

  const generatePlan = async () => {
    const validSubjects = subjects.filter(s => s.trim())
    if (!examDate || validSubjects.length === 0) return

    setIsGenerating(true)
    try {
      const result = await aiService.generateStudyPlan(
        examDate,
        studyHours,
        validSubjects,
        selectedModel,
        selectedLanguage
      )

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
    downloadAsPDF(studyPlan, 'study_plan.pdf')
  }

  const calculateDaysUntilExam = () => {
    if (!examDate) return 0
    const today = new Date()
    const exam = new Date(examDate)
    const diffTime = exam.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-serif font-bold">Study Planner</h2>
        <LanguageSelector />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Subjects to Study</label>
        <div className="space-y-2">
          {subjects.map((subject, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={subject}
                onChange={(e) => updateSubject(index, e.target.value)}
                placeholder={`Subject ${index + 1}`}
                className="input-field"
              />
              {subjects.length > 1 && (
                <button
                  onClick={() => removeSubject(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          ))}
        </div>
        
        <button
          onClick={addSubject}
          className="mt-2 flex items-center gap-2 text-sm text-gray-600 hover:text-black transition-colors"
        >
          <Plus size={16} />
          Add Subject
        </button>
      </div>

      <button
        onClick={generatePlan}
        disabled={!examDate || subjects.filter(s => s.trim()).length === 0 || isGenerating}
        className="btn-gold w-full mb-6 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isGenerating ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            Creating Study Plan...
          </>
        ) : (
          <>
            <Calendar size={20} />
            Generate Study Plan
          </>
        )}
      </button>

      {studyPlan && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="bg-gray-50 rounded-lg p-6 max-h-96 overflow-y-auto">
            <div className="mb-4">
              <h3 className="font-bold text-lg mb-2">Study Schedule</h3>
              <div className="grid grid-cols-7 gap-2 text-sm">
                <div className="font-semibold">Date</div>
                <div className="font-semibold col-span-3">Topics</div>
                <div className="font-semibold">Time</div>
                <div className="font-semibold col-span-2">Activities</div>
              </div>
              <div className="border-t mt-2 pt-2">
                <ReactMarkdown 
                  className="prose prose-sm max-w-none"
                  components={{
                    strong: ({children}) => <strong className="font-bold">{children}</strong>,
                    em: ({children}) => <em className="italic">{children}</em>,
                    h2: ({children}) => <h2 className="text-lg font-bold mb-2 mt-3">{children}</h2>,
                    h3: ({children}) => <h3 className="text-md font-bold mb-1 mt-2">{children}</h3>,
                    p: ({children}) => <p className="mb-2">{children}</p>,
                    ul: ({children}) => <ul className="list-disc pl-5 mb-2">{children}</ul>,
                    ol: ({children}) => <ol className="list-decimal pl-5 mb-2">{children}</ol>,
                    li: ({children}) => <li className="mb-1">{children}</li>
                  }}
                >
                  {studyPlan}
                </ReactMarkdown>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-edu-gold/10 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock size={20} className="text-edu-gold" />
              <span className="font-medium">
                Total Study Time: {calculateDaysUntilExam() * studyHours} hours
              </span>
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

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Study Planner Features:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Daily schedule breakdown</li>
          <li>• Subject-wise time allocation</li>
          <li>• Revision strategies</li>
          <li>• Practice test recommendations</li>
          <li>• Progress tracking milestones</li>
        </ul>
      </div>
    </div>
  )
}
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Download, Loader2 } from 'lucide-react'
import { useStore } from '@/lib/store'
import { AIService } from '@/lib/ai-service'
import { downloadAsPDF } from '@/lib/utils'
import LanguageSelector from '../LanguageSelector'
import ReactMarkdown from 'react-markdown'

export default function CurriculumGenerator() {
  const { selectedModel, selectedLanguage } = useStore()
  const [subject, setSubject] = useState('')
  const [duration, setDuration] = useState('month')
  const [grade, setGrade] = useState('')
  const [curriculumType, setCurriculumType] = useState('balanced')
  const [curriculum, setCurriculum] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  
  const aiService = AIService.getInstance()

  const generateCurriculum = async () => {
    if (!subject || !grade) return

    setIsGenerating(true)
    try {
      const result = await aiService.generateCurriculum(
        subject,
        duration,
        grade,
        curriculumType,
        selectedModel,
        selectedLanguage
      )

      setCurriculum(result)
    } catch (error) {
      console.error('Curriculum generation error:', error)
      setCurriculum('Error generating curriculum. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadCurriculum = () => {
    if (!curriculum) return
    downloadAsPDF(curriculum, `${subject}_${grade}_curriculum.pdf`)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-serif font-bold">Curriculum Generator</h2>
        <LanguageSelector />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g., Mathematics, Science, English"
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Grade/Level</label>
          <input
            type="text"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            placeholder="e.g., Grade 10, High School, College"
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Duration</label>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="input-field"
          >
            <option value="week">1 Week</option>
            <option value="month">1 Month</option>
            <option value="quarter">1 Quarter (3 months)</option>
            <option value="semester">1 Semester</option>
            <option value="year">Full Year</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Curriculum Type</label>
          <select
            value={curriculumType}
            onChange={(e) => setCurriculumType(e.target.value)}
            className="input-field"
          >
            <option value="balanced">Balanced (Theory + Practical)</option>
            <option value="theory">Theory Focused</option>
            <option value="practical">Practical/Hands-on</option>
            <option value="project">Project-Based</option>
            <option value="exam">Exam Preparation</option>
          </select>
        </div>
      </div>

      <button
        onClick={generateCurriculum}
        disabled={!subject || !grade || isGenerating}
        className="btn-gold w-full mb-6 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isGenerating ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            Generating Curriculum...
          </>
        ) : (
          <>
            <Calendar size={20} />
            Generate Curriculum
          </>
        )}
      </button>

      {curriculum && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="bg-gray-50 rounded-lg p-6 max-h-96 overflow-y-auto">
            <ReactMarkdown 
              className="prose prose-sm max-w-none"
              components={{
                strong: ({children}) => <strong className="font-bold">{children}</strong>,
                em: ({children}) => <em className="italic">{children}</em>,
                h1: ({children}) => <h1 className="text-2xl font-bold mb-3">{children}</h1>,
                h2: ({children}) => <h2 className="text-xl font-bold mb-2 mt-4">{children}</h2>,
                h3: ({children}) => <h3 className="text-lg font-bold mb-2 mt-3">{children}</h3>,
                p: ({children}) => <p className="mb-3">{children}</p>,
                ul: ({children}) => <ul className="list-disc pl-5 mb-3">{children}</ul>,
                ol: ({children}) => <ol className="list-decimal pl-5 mb-3">{children}</ol>,
                li: ({children}) => <li className="mb-1">{children}</li>,
                blockquote: ({children}) => (
                  <blockquote className="border-l-4 border-gray-300 pl-4 italic my-3">
                    {children}
                  </blockquote>
                )
              }}
            >
              {curriculum}
            </ReactMarkdown>
          </div>

          <button
            onClick={downloadCurriculum}
            className="btn-secondary flex items-center gap-2"
          >
            <Download size={20} />
            Download Curriculum PDF
          </button>
        </motion.div>
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Curriculum Features:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Weekly/Monthly breakdown of topics</li>
          <li>• Learning objectives and outcomes</li>
          <li>• Suggested activities and assessments</li>
          <li>• Resource recommendations</li>
          <li>• Progress milestones</li>
        </ul>
      </div>
    </div>
  )
}
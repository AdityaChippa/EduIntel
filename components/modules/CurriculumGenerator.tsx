'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Download, Loader2, BookOpen, Target, Users, Clock, FileText, Sparkles } from 'lucide-react'
import { useStore } from '@/lib/store'
import { AIService } from '@/lib/ai-service'
import { downloadAsPDF } from '@/lib/utils'
import LanguageSelector from '../LanguageSelector'
import ReactMarkdown from 'react-markdown'

interface LearningObjective {
  objective: string
  bloomsLevel: string
}

export default function CurriculumGenerator() {
  const { selectedModel, selectedLanguage } = useStore()
  const [subject, setSubject] = useState('')
  const [duration, setDuration] = useState('month')
  const [grade, setGrade] = useState('')
  const [curriculumType, setCurriculumType] = useState('balanced')
  const [classSize, setClassSize] = useState('medium')
  const [resourceAvailability, setResourceAvailability] = useState('moderate')
  const [specialRequirements, setSpecialRequirements] = useState('')
  const [learningObjectives, setLearningObjectives] = useState<LearningObjective[]>([
    { objective: '', bloomsLevel: 'understanding' }
  ])
  const [assessmentPreference, setAssessmentPreference] = useState('mixed')
  const [teachingHours, setTeachingHours] = useState(5)
  const [curriculum, setCurriculum] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  
  const aiService = AIService.getInstance()

  const addObjective = () => {
    setLearningObjectives([...learningObjectives, { objective: '', bloomsLevel: 'understanding' }])
  }

  const removeObjective = (index: number) => {
    if (learningObjectives.length > 1) {
      setLearningObjectives(learningObjectives.filter((_, i) => i !== index))
    }
  }

  const updateObjective = (index: number, field: keyof LearningObjective, value: string) => {
    const newObjectives = [...learningObjectives]
    newObjectives[index] = { ...newObjectives[index], [field]: value }
    setLearningObjectives(newObjectives)
  }

  const generateCurriculum = async () => {
    if (!subject || !grade) return

    setIsGenerating(true)
    try {
      const validObjectives = learningObjectives.filter(obj => obj.objective.trim())
      
      const result = await aiService.generateEnhancedCurriculum({
        subject,
        duration,
        grade,
        curriculumType,
        classSize,
        resourceAvailability,
        specialRequirements,
        learningObjectives: validObjectives,
        assessmentPreference,
        teachingHours,
        model: selectedModel,
        language: selectedLanguage
      })

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
    downloadAsPDF(curriculum, `${subject}_${grade}_curriculum_detailed.pdf`)
  }

  const getDurationWeeks = () => {
    const durationMap: Record<string, number> = {
      'week': 1,
      'month': 4,
      'quarter': 12,
      'semester': 16,
      'year': 36
    }
    return durationMap[duration] || 4
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-serif font-bold">Advanced Curriculum Generator</h2>
        <LanguageSelector />
      </div>

      {/* Basic Information */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <BookOpen size={20} />
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <p className="text-xs text-gray-600 mt-1">
              Approximately {getDurationWeeks()} weeks of instruction
            </p>
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
              <option value="project">Project-Based Learning</option>
              <option value="inquiry">Inquiry-Based Learning</option>
              <option value="flipped">Flipped Classroom</option>
              <option value="exam">Exam Preparation</option>
            </select>
          </div>
        </div>
      </div>

      {/* Classroom Configuration */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Users size={20} />
          Classroom Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Class Size</label>
            <select
              value={classSize}
              onChange={(e) => setClassSize(e.target.value)}
              className="input-field"
            >
              <option value="small">Small (1-15 students)</option>
              <option value="medium">Medium (16-30 students)</option>
              <option value="large">Large (31-50 students)</option>
              <option value="very-large">Very Large (50+ students)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Resource Availability</label>
            <select
              value={resourceAvailability}
              onChange={(e) => setResourceAvailability(e.target.value)}
              className="input-field"
            >
              <option value="limited">Limited Resources</option>
              <option value="moderate">Moderate Resources</option>
              <option value="well-equipped">Well-Equipped</option>
              <option value="advanced">Advanced/Digital Resources</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Weekly Teaching Hours</label>
            <input
              type="number"
              value={teachingHours}
              onChange={(e) => setTeachingHours(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              max="40"
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Learning Objectives */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Target size={20} />
          Learning Objectives
        </h3>
        <div className="space-y-3">
          {learningObjectives.map((obj, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={obj.objective}
                onChange={(e) => updateObjective(index, 'objective', e.target.value)}
                placeholder={`Learning objective ${index + 1}`}
                className="input-field flex-1"
              />
              <select
                value={obj.bloomsLevel}
                onChange={(e) => updateObjective(index, 'bloomsLevel', e.target.value)}
                className="input-field w-40"
              >
                <option value="remembering">Remembering</option>
                <option value="understanding">Understanding</option>
                <option value="applying">Applying</option>
                <option value="analyzing">Analyzing</option>
                <option value="evaluating">Evaluating</option>
                <option value="creating">Creating</option>
              </select>
              {learningObjectives.length > 1 && (
                <button
                  onClick={() => removeObjective(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={addObjective}
          className="mt-2 text-sm text-gray-600 hover:text-black"
        >
          + Add Learning Objective
        </button>
      </div>

      {/* Assessment and Special Requirements */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <FileText size={20} />
          Assessment & Requirements
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Assessment Preference</label>
            <select
              value={assessmentPreference}
              onChange={(e) => setAssessmentPreference(e.target.value)}
              className="input-field"
            >
              <option value="traditional">Traditional (Tests & Exams)</option>
              <option value="continuous">Continuous Assessment</option>
              <option value="project">Project-Based Assessment</option>
              <option value="portfolio">Portfolio Assessment</option>
              <option value="peer">Peer Assessment</option>
              <option value="mixed">Mixed Methods</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Special Requirements or Considerations
            </label>
            <textarea
              value={specialRequirements}
              onChange={(e) => setSpecialRequirements(e.target.value)}
              placeholder="e.g., Special needs accommodations, technology integration, cross-curricular connections, cultural considerations..."
              className="input-field"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Summary Box */}
      <div className="mb-6 p-4 bg-edu-gold/10 rounded-lg">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <Sparkles size={18} />
          Curriculum Summary
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <span className="text-gray-600">Total Weeks:</span>
            <p className="font-semibold">{getDurationWeeks()}</p>
          </div>
          <div>
            <span className="text-gray-600">Hours/Week:</span>
            <p className="font-semibold">{teachingHours}</p>
          </div>
          <div>
            <span className="text-gray-600">Total Hours:</span>
            <p className="font-semibold">{getDurationWeeks() * teachingHours}</p>
          </div>
          <div>
            <span className="text-gray-600">Objectives:</span>
            <p className="font-semibold">{learningObjectives.filter(o => o.objective).length}</p>
          </div>
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
            Generating Comprehensive Curriculum...
          </>
        ) : (
          <>
            <Calendar size={20} />
            Generate Advanced Curriculum
          </>
        )}
      </button>

      {curriculum && (
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
                  <blockquote className="border-l-4 border-edu-gold pl-4 py-2 my-4 bg-edu-gold/5 italic">
                    {children}
                  </blockquote>
                ),
                table: ({children}) => (
                  <table className="min-w-full divide-y divide-gray-300 my-4">{children}</table>
                ),
                th: ({children}) => (
                  <th className="px-3 py-2 bg-gray-100 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {children}
                  </th>
                ),
                td: ({children}) => (
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">{children}</td>
                ),
                code: ({children}) => (
                  <code className="bg-gray-200 px-1 py-0.5 rounded text-sm">{children}</code>
                ),
                hr: () => <hr className="my-6 border-gray-300" />
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
            Download Complete Curriculum
          </button>
        </motion.div>
      )}

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <BookOpen size={18} />
            Curriculum Features:
          </h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Detailed weekly/daily breakdown</li>
            <li>• Aligned learning objectives</li>
            <li>• Differentiated instruction strategies</li>
            <li>• Assessment rubrics & tools</li>
            <li>• Resource recommendations</li>
            <li>• Technology integration plans</li>
          </ul>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Target size={18} className="text-blue-600" />
            Implementation Tips:
          </h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Review curriculum before each week</li>
            <li>• Adapt based on student progress</li>
            <li>• Collect regular feedback</li>
            <li>• Document modifications</li>
            <li>• Share with stakeholders</li>
            <li>• Align with standards</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { UserCheck, Download, Loader2, Volume2, Pause, Play, Brain, Target, Users, BookOpen, TrendingUp, AlertCircle } from 'lucide-react'
import { useStore } from '@/lib/store'
import { AIService } from '@/lib/ai-service'
import { downloadAsPDF, getLanguageCode } from '@/lib/utils'
import LanguageSelector from '../LanguageSelector'
import ReactMarkdown from 'react-markdown'

interface TeachingChallenge {
  challenge: string
  severity: 'low' | 'medium' | 'high'
}

export default function TeacherFeedback() {
  const { selectedModel, selectedLanguage } = useStore()
  const [teacherName, setTeacherName] = useState('')
  const [yearsExperience, setYearsExperience] = useState('')
  const [subjectArea, setSubjectArea] = useState('')
  const [gradeLevel, setGradeLevel] = useState('')
  const [teachingMethod, setTeachingMethod] = useState('')
  const [curriculum, setCurriculum] = useState('')
  const [classEnvironment, setClassEnvironment] = useState('')
  const [challenges, setChallenges] = useState<TeachingChallenge[]>([
    { challenge: '', severity: 'medium' }
  ])
  const [goals, setGoals] = useState('')
  const [studentDemographics, setStudentDemographics] = useState('')
  const [availableResources, setAvailableResources] = useState('')
  const [feedback, setFeedback] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  
  const aiService = AIService.getInstance()

  const addChallenge = () => {
    setChallenges([...challenges, { challenge: '', severity: 'medium' }])
  }

  const removeChallenge = (index: number) => {
    if (challenges.length > 1) {
      setChallenges(challenges.filter((_, i) => i !== index))
    }
  }

  const updateChallenge = (index: number, field: keyof TeachingChallenge, value: string) => {
    const newChallenges = [...challenges]
    newChallenges[index] = { ...newChallenges[index], [field]: value }
    setChallenges(newChallenges)
  }

  const generateFeedback = async () => {
    const validChallenges = challenges.filter(c => c.challenge.trim())
    if (!teachingMethod || !curriculum || validChallenges.length === 0) return

    setIsGenerating(true)
    try {
      const result = await aiService.generateDetailedTeacherFeedback({
        teacherName,
        yearsExperience,
        subjectArea,
        gradeLevel,
        teachingMethod,
        curriculum,
        classEnvironment,
        challenges: validChallenges,
        goals,
        studentDemographics,
        availableResources,
        model: selectedModel,
        language: selectedLanguage
      })

      setFeedback(result)
    } catch (error) {
      console.error('Feedback generation error:', error)
      setFeedback('Error generating feedback. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadFeedback = () => {
    if (!feedback) return
    const content = `Personalized Teacher Feedback Report

Teacher: ${teacherName || 'Not specified'}
Experience: ${yearsExperience || 'Not specified'} years
Subject: ${subjectArea || 'Not specified'}
Grade Level: ${gradeLevel || 'Not specified'}

Teaching Method: ${teachingMethod}
Current Curriculum: ${curriculum}
Classroom Environment: ${classEnvironment || 'Not specified'}

Challenges:
${challenges.filter(c => c.challenge).map(c => `- ${c.challenge} (Severity: ${c.severity})`).join('\n')}

Goals: ${goals || 'Not specified'}
Student Demographics: ${studentDemographics || 'Not specified'}
Available Resources: ${availableResources || 'Not specified'}

FEEDBACK AND RECOMMENDATIONS:
${feedback}`
    
    downloadAsPDF(content, `teacher_feedback_${teacherName || 'report'}.pdf`)
  }

  const toggleSpeech = async () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }

    if (!feedback) return
    
    setIsSpeaking(true)
    try {
      const utterance = new SpeechSynthesisUtterance(feedback)
      utterance.lang = getLanguageCode(selectedLanguage)
      utterance.rate = 0.9
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)
      window.speechSynthesis.speak(utterance)
    } catch (error) {
      console.error('Speech error:', error)
      setIsSpeaking(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-serif font-bold">Advanced Teacher Feedback System</h2>
        <LanguageSelector />
      </div>

      {/* Teacher Profile */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <UserCheck size={20} />
          Teacher Profile
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Your Name (Optional)</label>
            <input
              type="text"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              placeholder="e.g., Ms. Johnson"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Years of Experience</label>
            <input
              type="text"
              value={yearsExperience}
              onChange={(e) => setYearsExperience(e.target.value)}
              placeholder="e.g., 5"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Subject Area</label>
            <input
              type="text"
              value={subjectArea}
              onChange={(e) => setSubjectArea(e.target.value)}
              placeholder="e.g., Mathematics"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Grade Level</label>
            <input
              type="text"
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              placeholder="e.g., 9-10"
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Teaching Context */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <BookOpen size={20} />
          Teaching Context
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Teaching Method & Philosophy</label>
            <textarea
              value={teachingMethod}
              onChange={(e) => setTeachingMethod(e.target.value)}
              placeholder="Describe your current teaching approach, methodology, and educational philosophy..."
              className="input-field"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Current Curriculum</label>
            <textarea
              value={curriculum}
              onChange={(e) => setCurriculum(e.target.value)}
              placeholder="Outline your current curriculum, topics covered, learning objectives, and pacing..."
              className="input-field"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Classroom Environment</label>
              <textarea
                value={classEnvironment}
                onChange={(e) => setClassEnvironment(e.target.value)}
                placeholder="Describe your classroom setup, culture, and learning atmosphere..."
                className="input-field"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Student Demographics</label>
              <textarea
                value={studentDemographics}
                onChange={(e) => setStudentDemographics(e.target.value)}
                placeholder="Describe your students (e.g., diverse learners, ESL, special needs, socioeconomic factors)..."
                className="input-field"
                rows={2}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Challenges */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <AlertCircle size={20} />
          Current Challenges
        </h3>
        <div className="space-y-3">
          {challenges.map((challenge, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={challenge.challenge}
                onChange={(e) => updateChallenge(index, 'challenge', e.target.value)}
                placeholder={`Challenge ${index + 1} (e.g., student engagement, differentiation, behavior...)`}
                className="input-field flex-1"
              />
              <select
                value={challenge.severity}
                onChange={(e) => updateChallenge(index, 'severity', e.target.value)}
                className="input-field w-32"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              {challenges.length > 1 && (
                <button
                  onClick={() => removeChallenge(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={addChallenge}
          className="mt-2 text-sm text-gray-600 hover:text-black"
        >
          + Add Another Challenge
        </button>
      </div>

      {/* Goals and Resources */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Target size={20} />
          Goals & Resources
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Professional Goals</label>
            <textarea
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              placeholder="What are your teaching goals? What would you like to improve or achieve?"
              className="input-field"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Available Resources</label>
            <textarea
              value={availableResources}
              onChange={(e) => setAvailableResources(e.target.value)}
              placeholder="What resources do you have access to? (e.g., technology, budget, support staff, materials)"
              className="input-field"
              rows={2}
            />
          </div>
        </div>
      </div>

      <button
        onClick={generateFeedback}
        disabled={!teachingMethod || !curriculum || challenges.filter(c => c.challenge.trim()).length === 0 || isGenerating}
        className="btn-gold w-full mb-6 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isGenerating ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            Analyzing & Generating Comprehensive Feedback...
          </>
        ) : (
          <>
            <Brain size={20} />
            Get Personalized Feedback & Action Plan
          </>
        )}
      </button>

      {feedback && (
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
                code: ({children}) => (
                  <code className="bg-gray-200 px-1 py-0.5 rounded text-sm">{children}</code>
                ),
                hr: () => <hr className="my-6 border-gray-300" />
              }}
            >
              {feedback}
            </ReactMarkdown>
          </div>

          <div className="flex gap-3">
            <button
              onClick={downloadFeedback}
              className="btn-secondary flex items-center gap-2"
            >
              <Download size={20} />
              Download Full Report
            </button>
            
            <button
              onClick={toggleSpeech}
              className="btn-secondary flex items-center gap-2"
            >
              {isSpeaking ? (
                <>
                  <Pause size={20} />
                  Pause
                </>
              ) : (
                <>
                  <Play size={20} />
                  Read Aloud
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <TrendingUp size={18} />
            What You'll Receive:
          </h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Detailed analysis of teaching approach</li>
            <li>• Challenge-specific solutions</li>
            <li>• Evidence-based strategies</li>
            <li>• Step-by-step implementation plans</li>
            <li>• Resource recommendations</li>
            <li>• Progress monitoring tools</li>
          </ul>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Users size={18} className="text-blue-600" />
            Focus Areas:
          </h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Student engagement techniques</li>
            <li>• Differentiated instruction</li>
            <li>• Classroom management</li>
            <li>• Assessment strategies</li>
            <li>• Technology integration</li>
            <li>• Professional development</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
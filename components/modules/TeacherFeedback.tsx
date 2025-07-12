'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { UserCheck, Download, Loader2, Volume2, Pause, Play } from 'lucide-react'
import { useStore } from '@/lib/store'
import { AIService } from '@/lib/ai-service'
import { downloadAsPDF, getLanguageCode } from '@/lib/utils'
import LanguageSelector from '../LanguageSelector'
import ReactMarkdown from 'react-markdown'

export default function TeacherFeedback() {
  const { selectedModel, selectedLanguage } = useStore()
  const [teachingMethod, setTeachingMethod] = useState('')
  const [curriculum, setCurriculum] = useState('')
  const [challenges, setChallenges] = useState('')
  const [feedback, setFeedback] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  
  const aiService = AIService.getInstance()

  const generateFeedback = async () => {
    if (!teachingMethod || !curriculum || !challenges) return

    setIsGenerating(true)
    try {
      const prompt = `As an educational consultant, provide comprehensive feedback and suggestions for a teacher with the following profile:

**Teaching Method:** ${teachingMethod}
**Current Curriculum:** ${curriculum}
**Challenges Faced:** ${challenges}

Please provide:
1. **Analysis of Current Approach**: Evaluate the teaching method and curriculum
2. **Specific Improvement Suggestions**: Practical strategies to enhance teaching effectiveness
3. **Solutions for Challenges**: Address each challenge with actionable solutions
4. **Resource Recommendations**: Suggest tools, techniques, and materials
5. **Implementation Timeline**: Step-by-step plan for improvements
6. **Success Metrics**: How to measure improvement

Format your response with clear sections and bullet points where appropriate.`

      const response = await aiService.generateResponse(
        prompt,
        selectedModel,
        selectedLanguage
      )

      setFeedback(response.text)
    } catch (error) {
      console.error('Feedback generation error:', error)
      setFeedback('Error generating feedback. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadFeedback = () => {
    if (!feedback) return
    const content = `Teacher Feedback Report\n\nTeaching Method: ${teachingMethod}\nCurriculum: ${curriculum}\nChallenges: ${challenges}\n\n${feedback}`
    downloadAsPDF(content, 'teacher_feedback.pdf')
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
        <h2 className="text-2xl font-serif font-bold">Teacher Feedback Assistant</h2>
        <LanguageSelector />
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Teaching Method</label>
          <textarea
            value={teachingMethod}
            onChange={(e) => setTeachingMethod(e.target.value)}
            placeholder="Describe your current teaching approach and methodology..."
            className="input-field"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Current Curriculum</label>
          <textarea
            value={curriculum}
            onChange={(e) => setCurriculum(e.target.value)}
            placeholder="Outline your current curriculum, topics covered, and learning objectives..."
            className="input-field"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Challenges Faced</label>
          <textarea
            value={challenges}
            onChange={(e) => setChallenges(e.target.value)}
            placeholder="What challenges are you facing in your classroom? (e.g., student engagement, diverse learning levels, resources...)"
            className="input-field"
            rows={3}
          />
        </div>
      </div>

      <button
        onClick={generateFeedback}
        disabled={!teachingMethod || !curriculum || !challenges || isGenerating}
        className="btn-gold w-full mb-6 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isGenerating ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            Generating Feedback...
          </>
        ) : (
          <>
            <UserCheck size={20} />
            Get Feedback & Suggestions
          </>
        )}
      </button>

      {feedback && (
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
                li: ({children}) => <li className="mb-1">{children}</li>
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
              Download Report
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

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">How This Helps:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Get personalized teaching strategies</li>
          <li>• Solve classroom management challenges</li>
          <li>• Improve student engagement techniques</li>
          <li>• Optimize curriculum delivery</li>
          <li>• Access best practices and resources</li>
        </ul>
      </div>
    </div>
  )
}
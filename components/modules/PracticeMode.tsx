'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, RefreshCw, BookOpen, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useStore } from '@/lib/store'
import { AIService } from '@/lib/ai-service'
import LanguageSelector from '../LanguageSelector'
import ReactMarkdown from 'react-markdown'

export default function PracticeMode() {
  const { selectedModel, selectedLanguage, addPractice, updateStudyProgress } = useStore()
  const [subject, setSubject] = useState('')
  const [topic, setTopic] = useState('')
  const [question, setQuestion] = useState('')
  const [userAnswer, setUserAnswer] = useState('')
  const [feedback, setFeedback] = useState('')
  const [score, setScore] = useState<number | null>(null)
  const [showLearning, setShowLearning] = useState(false)
  const [learningContent, setLearningContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const aiService = AIService.getInstance()

  const generateQuestion = async () => {
    if (!subject || !topic) return

    setIsLoading(true)
    setQuestion('')
    setUserAnswer('')
    setFeedback('')
    setScore(null)
    setShowLearning(false)

    try {
      const prompt = `Generate a practice question for ${subject} on the topic of ${topic}. 
      Make it challenging but appropriate for students. 
      Format: Just provide the question, nothing else.`

      const response = await aiService.generateResponse(
        prompt,
        selectedModel,
        selectedLanguage
      )

      if (response.error) {
        throw new Error(response.error)
      }

      setQuestion(response.text)
    } catch (error) {
      console.error('Question generation error:', error)
      setQuestion('Error generating question. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const submitAnswer = async () => {
    if (!userAnswer.trim() || !question) return

    setIsLoading(true)
    try {
      const prompt = `Question: ${question}
      Student's Answer: ${userAnswer}
      
      Evaluate this answer and provide:
      1. A score out of 100
      2. Detailed feedback on what was correct and what could be improved
      3. The correct/ideal answer if the student's answer was incomplete or incorrect
      
      Format your response as:
      Score: [number]/100
      Feedback: [your feedback]
      Correct Answer: [if needed]`

      const response = await aiService.generateResponse(
        prompt,
        selectedModel,
        selectedLanguage
      )

      if (response.error) {
        throw new Error(response.error)
      }

      // Parse the response to extract score
      const scoreMatch = response.text.match(/Score:\s*(\d+)/i)
      const scoreValue = scoreMatch ? parseInt(scoreMatch[1]) : 70

      setScore(scoreValue)
      setFeedback(response.text)
      
      // Add to practice history
      addPractice({
        topic: `${subject} - ${topic}`,
        score: scoreValue,
        feedback: response.text
      })

      // Update study progress
      updateStudyProgress(`${subject} - ${topic}`, scoreValue)
    } catch (error) {
      console.error('Answer evaluation error:', error)
      setFeedback('Error evaluating answer. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const generateLearningContent = async () => {
    setIsLoading(true)
    setShowLearning(true)

    try {
      const prompt = `Create a comprehensive learning summary about "${topic}" in ${subject}. 
      Include key concepts, important points, and examples. 
      Make it educational and easy to understand.`

      const response = await aiService.generateResponse(
        prompt,
        selectedModel,
        selectedLanguage
      )

      if (response.error) {
        throw new Error(response.error)
      }

      setLearningContent(response.text)
    } catch (error) {
      console.error('Learning content generation error:', error)
      setLearningContent('Error generating learning content. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-serif font-bold">Practice Mode</h2>
        <LanguageSelector />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g., Mathematics, Physics, Chemistry"
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Topic</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Calculus, Thermodynamics, Organic Chemistry"
            className="input-field"
          />
        </div>
      </div>

      {!question ? (
        <button
          onClick={generateQuestion}
          disabled={!subject || !topic || isLoading}
          className="btn-gold w-full flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Generating Question...
            </>
          ) : (
            <>
              <Brain size={20} />
              Generate Practice Question
            </>
          )}
        </button>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Question:</h3>
              <p className="text-lg">{question}</p>
            </div>

            {!score && (
              <div>
                <label className="block text-sm font-medium mb-2">Your Answer:</label>
                <textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className="input-field"
                  rows={4}
                />
                
                <button
                  onClick={submitAnswer}
                  disabled={!userAnswer.trim() || isLoading}
                  className="btn-primary w-full mt-4 disabled:opacity-50"
                >
                  {isLoading ? 'Evaluating...' : 'Submit Answer'}
                </button>
              </div>
            )}

            {score !== null && feedback && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-center gap-4 py-4">
                  <div className={`text-5xl font-bold ${score >= 70 ? 'text-green-500' : 'text-orange-500'}`}>
                    {score}/100
                  </div>
                  {score >= 70 ? (
                    <CheckCircle className="text-green-500" size={48} />
                  ) : (
                    <XCircle className="text-orange-500" size={48} />
                  )}
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Feedback:</h3>
                  <ReactMarkdown 
                    className="prose prose-sm max-w-none"
                    components={{
                      strong: ({children}) => <strong className="font-bold">{children}</strong>,
                      em: ({children}) => <em className="italic">{children}</em>,
                      p: ({children}) => <p className="mb-2">{children}</p>,
                      ul: ({children}) => <ul className="list-disc pl-5 mb-2">{children}</ul>,
                      ol: ({children}) => <ol className="list-decimal pl-5 mb-2">{children}</ol>,
                      li: ({children}) => <li className="mb-1">{children}</li>
                    }}
                  >
                    {feedback}
                  </ReactMarkdown>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={generateQuestion}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <RefreshCw size={20} />
                    New Question
                  </button>
                  
                  <button
                    onClick={generateLearningContent}
                    disabled={showLearning || isLoading}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <BookOpen size={20} />
                    Want to Learn?
                  </button>
                </div>

                {showLearning && learningContent && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-edu-gold/10 rounded-lg p-4 mt-4"
                  >
                    <h3 className="font-semibold mb-2">Learning Summary:</h3>
                    <ReactMarkdown 
                      className="prose prose-sm max-w-none"
                      components={{
                        strong: ({children}) => <strong className="font-bold">{children}</strong>,
                        em: ({children}) => <em className="italic">{children}</em>,
                        p: ({children}) => <p className="mb-2">{children}</p>,
                        ul: ({children}) => <ul className="list-disc pl-5 mb-2">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal pl-5 mb-2">{children}</ol>,
                        li: ({children}) => <li className="mb-1">{children}</li>
                      }}
                    >
                      {learningContent}
                    </ReactMarkdown>
                  </motion.div>
                )}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}
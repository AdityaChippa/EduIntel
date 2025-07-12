'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Download, Play, Check, X, Clock, AlertCircle } from 'lucide-react'
import { useStore } from '@/lib/store'
import { AIService } from '@/lib/ai-service'
import { downloadAsPDF } from '@/lib/utils'
import LanguageSelector from '../LanguageSelector'

interface Question {
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
}

interface QuizData {
  questions: Question[]
}

export default function QuizGenerator() {
  const { selectedModel, selectedLanguage, addQuizResult } = useStore()
  const [subject, setSubject] = useState('')
  const [topic, setTopic] = useState('')
  const [level, setLevel] = useState('intermediate')
  const [questionType, setQuestionType] = useState('multiple-choice')
  const [numQuestions, setNumQuestions] = useState(5)
  const [timer, setTimer] = useState(30)
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [quizData, setQuizData] = useState<QuizData | null>(null)
  const [quizStarted, setQuizStarted] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [showResults, setShowResults] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  const aiService = AIService.getInstance()

  // Timer effect
  useEffect(() => {
    if (quizStarted && timeLeft > 0 && !showResults) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)
    } else if (timeLeft === 0 && quizStarted && !showResults) {
      // Auto-submit when time is up
      finishQuiz()
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [timeLeft, quizStarted, showResults])

  const generateQuiz = async () => {
    if (!subject || !topic) return

    setIsGenerating(true)
    try {
      const result = await aiService.generateQuiz(
        subject,
        topic,
        level,
        questionType,
        numQuestions,
        selectedModel,
        selectedLanguage
      )

      setQuizData(result)
      setAnswers(new Array(result.questions.length).fill(''))
    } catch (error) {
      console.error('Quiz generation error:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const startQuiz = () => {
    setQuizStarted(true)
    setCurrentQuestion(0)
    setTimeLeft(timer * 60) // Convert minutes to seconds
  }

  const selectAnswer = (answer: string) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = answer
    setAnswers(newAnswers)
  }

  const nextQuestion = () => {
    if (currentQuestion < (quizData?.questions.length || 0) - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      finishQuiz()
    }
  }

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const finishQuiz = () => {
    setShowResults(true)
    const correctAnswers = quizData?.questions.filter(
      (q, i) => answers[i] === q.correctAnswer
    ).length || 0
    
    const score = Math.round((correctAnswers / (quizData?.questions.length || 1)) * 100)
    
    addQuizResult({
      subject,
      score,
      totalQuestions: quizData?.questions.length || 0
    })
  }

  const downloadQuiz = () => {
    if (!quizData) return

    let content = `Quiz: ${subject} - ${topic}\n\n`
    quizData.questions.forEach((q, i) => {
      content += `Question ${i + 1}: ${q.question}\n`
      if (q.options.length > 0) {
        q.options.forEach((opt, j) => {
          content += `${String.fromCharCode(65 + j)}. ${opt}\n`
        })
      }
      content += `\nCorrect Answer: ${q.correctAnswer}\n`
      content += `Explanation: ${q.explanation}\n\n`
    })

    downloadAsPDF(content, `quiz_${subject}_${topic}.pdf`)
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Loading state
  if (isGenerating) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="animate-spin mb-4" size={48} />
          <p className="text-lg font-medium">Generating your quiz...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
        </div>
      </div>
    )
  }

  // Results view
  if (showResults && quizData) {
    const correctAnswers = quizData.questions.filter(
      (q, i) => answers[i] === q.correctAnswer
    ).length
    const score = Math.round((correctAnswers / quizData.questions.length) * 100)

    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h2 className="text-2xl font-serif font-bold mb-6">Quiz Results</h2>
        
        <div className="text-center mb-8">
          <div className="text-6xl font-bold mb-2">{score}%</div>
          <p className="text-lg">
            You got {correctAnswers} out of {quizData.questions.length} questions correct!
          </p>
          {timeLeft === 0 && (
            <p className="text-sm text-orange-600 mt-2">
              <AlertCircle className="inline mr-1" size={16} />
              Quiz was auto-submitted due to time limit
            </p>
          )}
        </div>

        <div className="space-y-4 mb-6">
          {quizData.questions.map((q, i) => (
            <div key={i} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start gap-2 mb-2">
                {answers[i] === q.correctAnswer ? (
                  <Check className="text-green-500 mt-1" size={20} />
                ) : (
                  <X className="text-red-500 mt-1" size={20} />
                )}
                <div className="flex-1">
                  <p className="font-medium">{q.question}</p>
                  <p className="text-sm mt-1">
                    Your answer: {answers[i] || 'Not answered'}
                  </p>
                  {answers[i] !== q.correctAnswer && (
                    <p className="text-sm text-green-600 mt-1">
                      Correct answer: {q.correctAnswer}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 mt-2">{q.explanation}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <button onClick={downloadQuiz} className="btn-secondary flex items-center gap-2">
            <Download size={20} />
            Download Results
          </button>
          <button
            onClick={() => {
              setQuizData(null)
              setShowResults(false)
              setQuizStarted(false)
              setAnswers([])
              setTimeLeft(0)
            }}
            className="btn-primary"
          >
            Create New Quiz
          </button>
        </div>
      </div>
    )
  }

  // Quiz in progress view
  if (quizStarted && quizData) {
    const currentQ = quizData.questions[currentQuestion]
    const answeredCount = answers.filter(a => a !== '').length

    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium">
            Question {currentQuestion + 1} of {quizData.questions.length}
          </h3>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              {answeredCount}/{quizData.questions.length} answered
            </div>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${
              timeLeft < 60 ? 'bg-red-100 text-red-700' : 'bg-gray-100'
            }`}>
              <Clock size={16} />
              <span className="font-medium">{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="mb-8"
          >
            <p className="text-xl mb-6">{currentQ.question}</p>

            {currentQ.options.length > 0 ? (
              <div className="space-y-3">
                {currentQ.options.map((option, i) => (
                  <button
                    key={i}
                    onClick={() => selectAnswer(option)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      answers[currentQuestion] === option
                        ? 'border-black bg-gray-100'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <span className="font-medium mr-2">
                      {String.fromCharCode(65 + i)}.
                    </span>
                    {option}
                  </button>
                ))}
              </div>
            ) : (
              <textarea
                value={answers[currentQuestion] || ''}
                onChange={(e) => selectAnswer(e.target.value)}
                placeholder="Type your answer here..."
                className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:border-black transition-colors"
                rows={4}
              />
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between">
          <button
            onClick={previousQuestion}
            disabled={currentQuestion === 0}
            className="btn-secondary disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={nextQuestion}
            className="btn-primary"
          >
            {currentQuestion === quizData.questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
          </button>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <AlertCircle size={16} />
            Quiz Tips:
          </h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Review your answers before submitting</li>
            <li>• Use your time wisely - {timer} minutes total</li>
            <li>• You can navigate between questions using Previous/Next</li>
            <li>• The quiz will auto-submit when time runs out</li>
            <li>• All questions must be attempted for best results</li>
          </ul>
        </div>
      </div>
    )
  }

  // Ready to start view
  if (quizData && !quizStarted) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h2 className="text-2xl font-serif font-bold mb-6">Quiz Ready!</h2>
        
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="font-semibold mb-4">Quiz Details:</h3>
          <ul className="space-y-2 text-gray-700">
            <li><span className="font-medium">Subject:</span> {subject}</li>
            <li><span className="font-medium">Topic:</span> {topic}</li>
            <li><span className="font-medium">Level:</span> {level}</li>
            <li><span className="font-medium">Questions:</span> {numQuestions}</li>
            <li><span className="font-medium">Time Limit:</span> {timer} minutes</li>
          </ul>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold mb-2 text-yellow-800">Before You Start:</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Make sure you have {timer} minutes of uninterrupted time</li>
            <li>• The timer starts immediately when you click "Start Quiz"</li>
            <li>• You cannot pause once started</li>
            <li>• Quiz will auto-submit when time expires</li>
          </ul>
        </div>

        <div className="flex gap-4">
          <button onClick={startQuiz} className="btn-primary flex items-center gap-2">
            <Play size={20} />
            Start Quiz
          </button>
          <button onClick={downloadQuiz} className="btn-secondary flex items-center gap-2">
            <Download size={20} />
            Download PDF
          </button>
        </div>
      </div>
    )
  }

  // Initial setup view
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-serif font-bold">Quiz Generator</h2>
        <LanguageSelector />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g., Mathematics, Science, History"
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Topic</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Algebra, Photosynthesis, World War II"
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Level</label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="input-field"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Question Type</label>
          <select
            value={questionType}
            onChange={(e) => setQuestionType(e.target.value)}
            className="input-field"
          >
            <option value="multiple-choice">Multiple Choice</option>
            <option value="true-false">True/False</option>
            <option value="short-answer">Short Answer</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Number of Questions</label>
          <input
            type="number"
            value={numQuestions}
            onChange={(e) => setNumQuestions(Math.max(1, parseInt(e.target.value) || 1))}
            min="1"
            max="50"
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Time Limit (minutes)</label>
          <input
            type="number"
            value={timer}
            onChange={(e) => setTimer(Math.max(1, parseInt(e.target.value) || 1))}
            min="1"
            max="180"
            className="input-field"
          />
        </div>
      </div>

      <button
        onClick={generateQuiz}
        disabled={!subject || !topic || isGenerating}
        className="btn-gold w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Generate Quiz
      </button>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Quiz Features:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Timed quizzes with countdown timer</li>
          <li>• Auto-submit when time expires</li>
          <li>• Navigate between questions freely</li>
          <li>• Detailed explanations for each answer</li>
          <li>• Download quiz as PDF for offline practice</li>
          <li>• Track your performance in the dashboard</li>
        </ul>
      </div>
    </div>
  )
}
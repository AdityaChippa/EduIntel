'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Calculator, Download, Loader2, Volume2, Pause, Play } from 'lucide-react'
import { useStore } from '@/lib/store'
import { AIService } from '@/lib/ai-service'
import { downloadAsPDF, getLanguageCode } from '@/lib/utils'
import LanguageSelector from '../LanguageSelector'
import ReactMarkdown from 'react-markdown'

export default function MathSolver() {
  const { selectedModel, selectedLanguage } = useStore()
  const [problem, setProblem] = useState('')
  const [solution, setSolution] = useState('')
  const [isSolving, setIsSolving] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null)
  
  const aiService = AIService.getInstance()

  const solveProblem = async () => {
    if (!problem.trim()) return

    setIsSolving(true)
    try {
      const result = await aiService.solveMathProblem(
        problem,
        selectedModel,
        selectedLanguage
      )

      setSolution(result)
    } catch (error) {
      console.error('Math solving error:', error)
      setSolution('Error solving the problem. Please try again.')
    } finally {
      setIsSolving(false)
    }
  }

  const downloadSolution = () => {
    if (!solution) return
    const content = `Math Problem: ${problem}\n\n${solution}`
    downloadAsPDF(content, 'math_solution.pdf')
  }

  const toggleSpeech = async () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }

    if (!solution) return
    
    setIsSpeaking(true)
    try {
      const utterance = new SpeechSynthesisUtterance(solution)
      utterance.lang = getLanguageCode(selectedLanguage)
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 1
      
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)
      
      speechSynthesisRef.current = utterance
      window.speechSynthesis.speak(utterance)
    } catch (error) {
      console.error('Speech error:', error)
      setIsSpeaking(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-serif font-bold">Math Problem Solver</h2>
        <LanguageSelector />
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Enter Your Math Problem</label>
          <textarea
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            placeholder="e.g., Solve for x: 2x² + 5x - 3 = 0"
            className="input-field"
            rows={3}
          />
        </div>
      </div>

      <button
        onClick={solveProblem}
        disabled={!problem.trim() || isSolving}
        className="btn-gold w-full mb-6 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isSolving ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            Solving...
          </>
        ) : (
          <>
            <Calculator size={20} />
            Solve Problem
          </>
        )}
      </button>

      {solution && (
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
                h2: ({children}) => <h2 className="text-xl font-bold mb-2">{children}</h2>,
                h3: ({children}) => <h3 className="text-lg font-bold mb-2">{children}</h3>,
                p: ({children}) => <p className="mb-3">{children}</p>,
                ul: ({children}) => <ul className="list-disc pl-5 mb-3">{children}</ul>,
                ol: ({children}) => <ol className="list-decimal pl-5 mb-3">{children}</ol>,
                li: ({children}) => <li className="mb-1">{children}</li>,
                code: ({ className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || '')
                  const isInline = !match
                  return isInline ? (
                    <code className="bg-gray-200 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                      {children}
                    </code>
                  ) : (
                    <pre className="bg-gray-800 text-white p-3 rounded-lg overflow-x-auto my-2">
                      <code className={className} {...props}>
                        {children}
                      </code>
                    </pre>
                  )
                },
                blockquote: ({children}) => (
                  <blockquote className="border-l-4 border-gray-300 pl-4 italic my-3">
                    {children}
                  </blockquote>
                )
              }}
            >
              {solution}
            </ReactMarkdown>
          </div>

          <div className="flex gap-3">
            <button
              onClick={downloadSolution}
              className="btn-secondary flex items-center gap-2"
            >
              <Download size={20} />
              Download Solution
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
        <h3 className="font-semibold mb-2">Math Solver Capabilities:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Algebra: Linear equations, quadratics, polynomials</li>
          <li>• Calculus: Derivatives, integrals, limits</li>
          <li>• Geometry: Area, volume, trigonometry</li>
          <li>• Statistics: Mean, median, standard deviation</li>
          <li>• Step-by-step solutions with explanations</li>
        </ul>
      </div>
    </div>
  )
}
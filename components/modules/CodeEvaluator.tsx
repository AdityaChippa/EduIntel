'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Code2, Play, Download, ExternalLink, Loader2 } from 'lucide-react'
import { useStore } from '@/lib/store'
import { AIService } from '@/lib/ai-service'
import { downloadAsText } from '@/lib/utils'
import LanguageSelector from '../LanguageSelector'
import ReactMarkdown from 'react-markdown'

export default function CodeEvaluator() {
  const { selectedModel, selectedLanguage } = useStore()
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [programmingLanguage, setProgrammingLanguage] = useState('python')
  const [evaluation, setEvaluation] = useState('')
  const [isEvaluating, setIsEvaluating] = useState(false)
  
  const aiService = AIService.getInstance()

  const evaluateCode = async () => {
    if (!code.trim() || !description.trim()) return

    setIsEvaluating(true)
    try {
      const result = await aiService.evaluateCode(
        code,
        description,
        programmingLanguage,
        selectedModel,
        selectedLanguage
      )

      setEvaluation(result)
    } catch (error) {
      console.error('Code evaluation error:', error)
      setEvaluation('Error evaluating code. Please try again.')
    } finally {
      setIsEvaluating(false)
    }
  }

  const downloadCode = () => {
    if (!code) return
    const ext = programmingLanguage === 'python' ? 'py' : 
                programmingLanguage === 'javascript' ? 'js' :
                programmingLanguage === 'java' ? 'java' :
                programmingLanguage === 'cpp' ? 'cpp' : 'txt'
    downloadAsText(code, `code.${ext}`)
  }

  const openInColab = () => {
    window.open('https://colab.research.google.com/', '_blank')
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-serif font-bold">Code Evaluator</h2>
        <LanguageSelector />
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Programming Language</label>
          <select
            value={programmingLanguage}
            onChange={(e) => setProgrammingLanguage(e.target.value)}
            className="input-field"
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="csharp">C#</option>
            <option value="ruby">Ruby</option>
            <option value="go">Go</option>
            <option value="rust">Rust</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">What should this code do?</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Calculate fibonacci sequence, Sort an array, etc."
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Your Code</label>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={`Paste your ${programmingLanguage} code here...`}
            className="input-field font-mono text-sm"
            rows={10}
            style={{ tabSize: 2 }}
          />
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <button
          onClick={evaluateCode}
          disabled={!code.trim() || !description.trim() || isEvaluating}
          className="btn-gold flex items-center gap-2 disabled:opacity-50"
        >
          {isEvaluating ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Evaluating...
            </>
          ) : (
            <>
              <Play size={20} />
              Evaluate Code
            </>
          )}
        </button>

        <button
          onClick={downloadCode}
          disabled={!code.trim()}
          className="btn-secondary flex items-center gap-2 disabled:opacity-50"
        >
          <Download size={20} />
          Download
        </button>

        <button
          onClick={openInColab}
          className="btn-secondary flex items-center gap-2"
        >
          <ExternalLink size={20} />
          Google Colab
        </button>
      </div>

      {evaluation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="bg-gray-50 rounded-lg p-6">
            <ReactMarkdown 
              className="prose prose-sm max-w-none"
              components={{
                strong: ({children}) => <strong className="font-bold text-lg">{children}</strong>,
                em: ({children}) => <em className="italic">{children}</em>,
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
                    <code className="bg-gray-200 px-1 py-0.5 rounded text-sm" {...props}>
                      {children}
                    </code>
                  ) : (
                    <div className="my-3">
                      <div className="flex justify-between items-center bg-gray-700 text-white px-3 py-1 rounded-t">
                        <span className="text-sm">Corrected Code</span>
                        <button 
                          onClick={() => navigator.clipboard.writeText(String(children))}
                          className="text-sm hover:bg-gray-600 px-2 py-1 rounded"
                        >
                          Copy
                        </button>
                      </div>
                      <pre className="bg-gray-800 text-white p-4 rounded-b overflow-x-auto">
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </pre>
                    </div>
                  )
                }
              }}
            >
              {evaluation}
            </ReactMarkdown>
          </div>
        </motion.div>
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Code Evaluator Features:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Analyzes code correctness and efficiency</li>
          <li>• Provides improvement suggestions</li>
          <li>• Identifies potential bugs and issues</li>
          <li>• Offers best practices recommendations</li>
          <li>• Scores your code quality</li>
        </ul>
      </div>
    </div>
  )
}
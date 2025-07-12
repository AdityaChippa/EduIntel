'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Download, Volume2, FileText } from 'lucide-react'
import { useStore } from '@/lib/store'
import { AIService } from '@/lib/ai-service'
import { downloadAsPDF, downloadAsText, textToSpeech } from '@/lib/utils'
import LanguageSelector from '../LanguageSelector'
import ReactMarkdown from 'react-markdown'

export default function ContentGenerator() {
  const { selectedModel, selectedLanguage } = useStore()
  const [topic, setTopic] = useState('')
  const [contentType, setContentType] = useState('notes')
  const [content, setContent] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  
  const aiService = AIService.getInstance()

  const generateContent = async () => {
    if (!topic) return

    setIsGenerating(true)
    try {
      const prompt = `Generate comprehensive ${contentType} about "${topic}". 
      Make it educational, well-structured, and suitable for students. 
      Include key concepts, examples, and practical applications where relevant.`

      const response = await aiService.generateResponse(
        prompt,
        selectedModel,
        selectedLanguage
      )

      if (response.error) {
        throw new Error(response.error)
      }

      setContent(response.text)
    } catch (error) {
      console.error('Content generation error:', error)
      setContent('Sorry, I encountered an error generating content. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const speakContent = async () => {
    if (!content) return
    setIsSpeaking(true)
    try {
      await textToSpeech(content, selectedLanguage)
    } catch (error) {
      console.error('Speech error:', error)
    } finally {
      setIsSpeaking(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-serif font-bold">Content Generator</h2>
        <LanguageSelector />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Topic</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter topic to generate content about..."
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Content Type</label>
          <select
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
            className="input-field"
          >
            <option value="notes">Study Notes</option>
            <option value="summary">Summary</option>
            <option value="explanation">Detailed Explanation</option>
            <option value="examples">Examples & Applications</option>
            <option value="guide">Study Guide</option>
            <option value="flashcards">Flashcards</option>
          </select>
        </div>
      </div>

      <button
        onClick={generateContent}
        disabled={!topic || isGenerating}
        className="btn-gold w-full mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating ? (
          <>
            <Loader2 className="animate-spin mr-2" size={20} />
            Generating...
          </>
        ) : (
          <>
            <FileText className="mr-2" size={20} />
            Generate Content
          </>
        )}
      </button>

      {content && (
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
                    <code className="bg-gray-200 px-1 py-0.5 rounded text-sm" {...props}>
                      {children}
                    </code>
                  ) : (
                    <pre className="bg-gray-800 text-white p-3 rounded-lg overflow-x-auto my-2">
                      <code className={className} {...props}>
                        {children}
                      </code>
                    </pre>
                  )
                }
              }}
            >
              {content}
            </ReactMarkdown>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => downloadAsPDF(content, `${topic}_${contentType}.pdf`)}
              className="btn-secondary flex items-center gap-2"
            >
              <Download size={20} />
              Download PDF
            </button>
            
            <button
              onClick={() => downloadAsText(content, `${topic}_${contentType}.txt`)}
              className="btn-secondary flex items-center gap-2"
            >
              <FileText size={20} />
              Download Text
            </button>
            
            <button
              onClick={speakContent}
              disabled={isSpeaking}
              className="btn-secondary flex items-center gap-2"
            >
              <Volume2 size={20} className={isSpeaking ? 'animate-pulse' : ''} />
              {isSpeaking ? 'Speaking...' : 'Read Aloud'}
            </button>
          </div>
        </motion.div>
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Tips for Better Content:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Be specific with your topic (e.g., "Photosynthesis in C4 plants" instead of just "Photosynthesis")</li>
          <li>• Choose the content type that best fits your learning needs</li>
          <li>• Generated content can be downloaded and edited for your personal use</li>
          <li>• Use the read aloud feature for audio learning</li>
        </ul>
      </div>
    </div>
  )
}
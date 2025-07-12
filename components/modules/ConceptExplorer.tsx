'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, BookOpen, Loader2, Volume2, Pause, Play, Download } from 'lucide-react'
import { useStore } from '@/lib/store'
import { AIService } from '@/lib/ai-service'
import { downloadAsPDF, getLanguageCode } from '@/lib/utils'
import LanguageSelector from '../LanguageSelector'
import ReactMarkdown from 'react-markdown'

export default function ConceptExplorer() {
  const { selectedModel, selectedLanguage } = useStore()
  const [concept, setConcept] = useState('')
  const [subject, setSubject] = useState('')
  const [exploration, setExploration] = useState('')
  const [isExploring, setIsExploring] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  
  const aiService = AIService.getInstance()

  const exploreConcept = async () => {
    if (!concept.trim()) return

    setIsExploring(true)
    try {
      const subjectContext = subject ? ` in the context of ${subject}` : ''
      const prompt = `Provide a comprehensive exploration of the concept "${concept}"${subjectContext}.

Structure your response as follows:

## Definition
Clear and concise definition of the concept

## Core Principles
Key principles and fundamental ideas

## Visual Representation
Describe how this concept can be visualized or diagrammed

## Real-World Applications
Practical examples and use cases

## Related Concepts
Connected ideas and how they relate

## Common Misconceptions
What people often get wrong about this concept

## Learning Resources
Suggested resources for deeper understanding

## Quick Summary
A brief summary for easy recall

Make it educational, engaging, and suitable for students.`

      const response = await aiService.generateResponse(
        prompt,
        selectedModel,
        selectedLanguage
      )

      setExploration(response.text)
    } catch (error) {
      console.error('Concept exploration error:', error)
      setExploration('Error exploring concept. Please try again.')
    } finally {
      setIsExploring(false)
    }
  }

  const downloadExploration = () => {
    if (!exploration) return
    const content = `Concept: ${concept}\n${subject ? `Subject: ${subject}\n` : ''}\n${exploration}`
    downloadAsPDF(content, `${concept.replace(/\s+/g, '_')}_exploration.pdf`)
  }

  const toggleSpeech = async () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }

    if (!exploration) return
    
    setIsSpeaking(true)
    try {
      const utterance = new SpeechSynthesisUtterance(exploration)
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
        <h2 className="text-2xl font-serif font-bold">Concept Explorer</h2>
        <LanguageSelector />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Concept to Explore</label>
          <input
            type="text"
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && exploreConcept()}
            placeholder="e.g., Photosynthesis, Democracy, Quantum Physics"
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Subject Area (Optional)</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && exploreConcept()}
            placeholder="e.g., Biology, Politics, Physics"
            className="input-field"
          />
        </div>
      </div>

      <button
        onClick={exploreConcept}
        disabled={!concept.trim() || isExploring}
        className="btn-gold w-full mb-6 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isExploring ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            Exploring Concept...
          </>
        ) : (
          <>
            <Search size={20} />
            Explore Concept
          </>
        )}
      </button>

      {exploration && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="bg-gray-50 rounded-lg p-6 max-h-[500px] overflow-y-auto">
            <ReactMarkdown 
              className="prose prose-sm max-w-none"
              components={{
                strong: ({children}) => <strong className="font-bold">{children}</strong>,
                em: ({children}) => <em className="italic">{children}</em>,
                h1: ({children}) => <h1 className="text-2xl font-bold mb-3">{children}</h1>,
                h2: ({children}) => <h2 className="text-xl font-bold mb-2 mt-4 text-black">{children}</h2>,
                h3: ({children}) => <h3 className="text-lg font-bold mb-2 mt-3">{children}</h3>,
                p: ({children}) => <p className="mb-3">{children}</p>,
                ul: ({children}) => <ul className="list-disc pl-5 mb-3">{children}</ul>,
                ol: ({children}) => <ol className="list-decimal pl-5 mb-3">{children}</ol>,
                li: ({children}) => <li className="mb-1">{children}</li>,
                blockquote: ({children}) => (
                  <blockquote className="border-l-4 border-edu-gold pl-4 italic my-3 bg-yellow-50 py-2">
                    {children}
                  </blockquote>
                )
              }}
            >
              {exploration}
            </ReactMarkdown>
          </div>

          <div className="flex gap-3">
            <button
              onClick={downloadExploration}
              className="btn-secondary flex items-center gap-2"
            >
              <Download size={20} />
              Download PDF
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
            
            <button
              onClick={() => {
                setConcept('')
                setSubject('')
                setExploration('')
              }}
              className="btn-secondary flex items-center gap-2"
            >
              <BookOpen size={20} />
              New Concept
            </button>
          </div>
        </motion.div>
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Popular Concepts to Explore:</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
          {['Photosynthesis', 'Democracy', 'Gravity', 'Evolution', 'Artificial Intelligence', 'Climate Change'].map((topic) => (
            <button
              key={topic}
              onClick={() => setConcept(topic)}
              className="p-2 bg-white hover:bg-gray-100 rounded border border-gray-200 transition-colors"
            >
              {topic}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
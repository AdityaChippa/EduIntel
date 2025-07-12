'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, Mic, MicOff, Volume2, Loader2, Pause, Play } from 'lucide-react'
import { useStore } from '@/lib/store'
import { AIService } from '@/lib/ai-service'
import { textToSpeech, getLanguageCode } from '@/lib/utils'
import LanguageSelector from '../LanguageSelector'
import ReactMarkdown from 'react-markdown'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isPlaying?: boolean
}

export default function ChatAssistant() {
  const { selectedModel, selectedLanguage } = useStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null)
  const aiService = AIService.getInstance()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = getLanguageCode(selectedLanguage)
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('')
        setInput(transcript)
      }
      
      recognitionRef.current.onerror = () => {
        setIsListening(false)
      }
      
      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }

    return () => {
      if (speechSynthesisRef.current) {
        window.speechSynthesis.cancel()
      }
    }
  }, [selectedLanguage])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await aiService.generateResponse(
        input,
        selectedModel,
        selectedLanguage
      )

      if (response.error) {
        throw new Error(response.error)
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const toggleListening = () => {
    if (!recognitionRef.current) return

    if (isListening) {
      recognitionRef.current.stop()
    } else {
      recognitionRef.current.lang = getLanguageCode(selectedLanguage)
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const toggleSpeech = async (messageId: string, content: string) => {
    // If this message is playing, stop it
    if (playingMessageId === messageId) {
      window.speechSynthesis.cancel()
      setPlayingMessageId(null)
      return
    }

    // Stop any currently playing message
    if (playingMessageId) {
      window.speechSynthesis.cancel()
    }

    // Start playing new message
    setPlayingMessageId(messageId)
    
    try {
      const utterance = new SpeechSynthesisUtterance(content)
      utterance.lang = getLanguageCode(selectedLanguage)
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 1
      
      utterance.onend = () => {
        setPlayingMessageId(null)
      }
      
      utterance.onerror = () => {
        setPlayingMessageId(null)
      }
      
      speechSynthesisRef.current = utterance
      window.speechSynthesis.speak(utterance)
    } catch (error) {
      console.error('Speech error:', error)
      setPlayingMessageId(null)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-serif font-bold">NovaEdu Chat Assistant</h2>
            <LanguageSelector />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
              <p className="text-lg">Hello! I'm NovaEdu, your AI learning companion.</p>
              <p className="mt-2">Ask me anything about education, homework, or learning!</p>
            </div>
          )}

          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-black'
                }`}
              >
                {message.role === 'assistant' ? (
                  <ReactMarkdown 
                    className="prose prose-sm max-w-none"
                    components={{
                      strong: ({children}) => <strong className="font-bold">{children}</strong>,
                      em: ({children}) => <em className="italic">{children}</em>,
                      p: ({children}) => <p className="mb-2">{children}</p>,
                      ul: ({children}) => <ul className="list-disc pl-5 mb-2">{children}</ul>,
                      ol: ({children}) => <ol className="list-decimal pl-5 mb-2">{children}</ol>,
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
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs opacity-70">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                  {message.role === 'assistant' && (
                    <button
                      onClick={() => toggleSpeech(message.id, message.content)}
                      className={`ml-2 p-1 rounded transition-colors ${
                        playingMessageId === message.id 
                          ? 'bg-black/20 text-white' 
                          : 'hover:bg-black/10'
                      }`}
                    >
                      {playingMessageId === message.id ? (
                        <Pause size={16} />
                      ) : (
                        <Play size={16} />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-gray-100 p-4 rounded-lg">
                <Loader2 className="animate-spin" size={20} />
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black transition-colors"
              disabled={isLoading}
            />
            
            <button
              onClick={toggleListening}
              className={`p-2 rounded-lg transition-colors ${
                isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 hover:bg-gray-200'
              }`}
              title={isListening ? 'Stop recording' : 'Start recording'}
            >
              {isListening ? (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <Mic size={20} />
                </div>
              ) : (
                <Mic size={20} />
              )}
            </button>
            
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
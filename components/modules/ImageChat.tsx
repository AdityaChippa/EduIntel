'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Upload, Send, Loader2, X, Image as ImageIcon } from 'lucide-react'
import { useStore } from '@/lib/store'
import { AIService } from '@/lib/ai-service'
import ReactMarkdown from 'react-markdown'

export default function ImageChat() {
  const { selectedModel, selectedLanguage } = useStore()
  const [image, setImage] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [question, setQuestion] = useState('')
  const [conversation, setConversation] = useState<Array<{role: string, content: string}>>([])
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const aiService = AIService.getInstance()

  const compressImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (e) => {
        const img = new Image()
        img.src = e.target?.result as string
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          // Calculate new dimensions (max 1024px on longest side)
          let width = img.width
          let height = img.height
          const maxSize = 1024
          
          if (width > height && width > maxSize) {
            height = (height / width) * maxSize
            width = maxSize
          } else if (height > maxSize) {
            width = (width / height) * maxSize
            height = maxSize
          }
          
          canvas.width = width
          canvas.height = height
          
          ctx?.drawImage(img, 0, 0, width, height)
          
          // Convert to base64 with compression
          const base64 = canvas.toDataURL('image/jpeg', 0.8)
          resolve(base64)
        }
        img.onerror = reject
      }
      reader.onerror = reject
    })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setFileName(file.name)
      const compressed = await compressImage(file)
      setImage(compressed)
    } catch (error) {
      console.error('Error processing image:', error)
      alert('Error processing image. Please try a smaller image.')
    }
  }

  const analyzeImage = async () => {
    if (!image || !question.trim()) return

    setIsLoading(true)
    const newMessage = { role: 'user', content: question }
    setConversation(prev => [...prev, newMessage])

    try {
      // Use the analyzeImageVision method from AIService
      const result = await aiService.analyzeImageVision(
        image,
        question,
        selectedLanguage
      )

      setConversation(prev => [...prev, { role: 'assistant', content: result }])
      setQuestion('')
    } catch (error) {
      console.error('Error analyzing image:', error)
      setConversation(prev => [...prev, { 
        role: 'assistant', 
        content: `Error: ${error instanceof Error ? error.message : 'Failed to analyze image. Please try again.'}` 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const removeImage = () => {
    setImage(null)
    setFileName('')
    setConversation([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-serif font-bold">Image Chat</h2>
        <div className="text-sm text-gray-500">
          Using: llama-3.2-90b-vision-preview
        </div>
      </div>

      {!image ? (
        <div className="mb-6">
          <label className="block">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors">
              <ImageIcon className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-gray-600 mb-2">Click to upload an image</p>
              <p className="text-sm text-gray-400">Supports: JPG, PNG, GIF, WebP (max 20MB)</p>
            </div>
          </label>
        </div>
      ) : (
        <div className="mb-6">
          <div className="relative inline-block">
            <img 
              src={image} 
              alt="Uploaded" 
              className="max-w-full max-h-64 rounded-lg shadow-md"
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <X size={16} />
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">{fileName}</p>
        </div>
      )}

      {image && (
        <>
          <div className="flex gap-3 mb-6">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && analyzeImage()}
              placeholder="Ask about this image..."
              disabled={isLoading}
              className="input-field flex-1"
            />
            <button
              onClick={analyzeImage}
              disabled={!question.trim() || isLoading}
              className="btn-gold flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Analyzing...
                </>
              ) : (
                <>
                  <Send size={20} />
                  Send
                </>
              )}
            </button>
          </div>

          {conversation.length > 0 && (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {conversation.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg ${
                    msg.role === 'user' 
                      ? 'bg-blue-50 ml-8' 
                      : 'bg-gray-50 mr-8'
                  }`}
                >
                  <p className="font-semibold mb-1">
                    {msg.role === 'user' ? 'You' : 'AI'}
                  </p>
                  <ReactMarkdown className="prose prose-sm max-w-none">
                    {msg.content}
                  </ReactMarkdown>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">Vision AI Features:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Describe and analyze image content</li>
          <li>• Answer questions about the image</li>
          <li>• Identify objects, people, and text</li>
          <li>• Understand context and relationships</li>
          <li>• Extract information from documents</li>
        </ul>
      </div>
    </div>
  )
}
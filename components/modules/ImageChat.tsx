'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Upload, Image as ImageIcon, Send, Loader2, X, Volume2, AlertCircle } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { useStore } from '@/lib/store'
import { textToSpeech } from '@/lib/utils'
import LanguageSelector from '../LanguageSelector'

const API_KEY = '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'

export default function ImageChat() {
  const { selectedModel, selectedLanguage } = useStore()
  const [imageData, setImageData] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [question, setQuestion] = useState('')
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  const compressImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')!
          
          // Calculate new dimensions
          let width = img.width
          let height = img.height
          const maxSize = 1920 // Max dimension
          
          if (width > height && width > maxSize) {
            height = (height * maxSize) / width
            width = maxSize
          } else if (height > maxSize) {
            width = (width * maxSize) / height
            height = maxSize
          }
          
          canvas.width = width
          canvas.height = height
          ctx.drawImage(img, 0, 0, width, height)
          
          // Convert to base64 with compression
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const reader = new FileReader()
                reader.onloadend = () => {
                  resolve(reader.result as string)
                }
                reader.readAsDataURL(blob)
              } else {
                reject(new Error('Failed to compress image'))
              }
            },
            'image/jpeg',
            0.85
          )
        }
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    })
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setImageFile(file)
      
      // Check file size and compress if needed
      const fileSizeMB = file.size / (1024 * 1024)
      console.log(`Original size: ${fileSizeMB.toFixed(2)} MB`)
      
      let base64Data: string
      if (fileSizeMB > 20) {
        console.log('Compressing image...')
        base64Data = await compressImage(file)
      } else {
        const reader = new FileReader()
        base64Data = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })
      }
      
      setImageData(base64Data)
      setResponse('')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp']
    },
    maxFiles: 1
  })

  const handleAnalyze = async () => {
    if (!imageData || !question.trim() || isLoading) return



    setIsLoading(true)
    console.log('Analyzing image...')

    try {
      // Extract base64 and mime type
      let base64Image = imageData
      let mimeType = 'image/jpeg'
      
      if (imageData.includes('base64,')) {
        const parts = imageData.split('base64,')
        base64Image = parts[1]
        const mimeMatch = parts[0].match(/data:(.+);/)
        if (mimeMatch) {
          mimeType = mimeMatch[1]
        }
      }

      // Make API request exactly like the Python code
      const apiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          messages: [{
            role: "user",
            content: [
              {
                type: "text",
                text: question || "What is in this image? Describe it in detail."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`
                }
              }
            ]
          }],
          temperature: 1,
          max_completion_tokens: 1024,
          top_p: 1,
          stream: false
        })
      })

      // Handle response
      if (apiResponse.status === 200) {
        const result = await apiResponse.json()
        const description = result.choices[0]?.message?.content || 'No description available'
        console.log('=== Image Description ===')
        console.log(description)
        setResponse(description)
      } else {
        const errorText = await apiResponse.text()
        console.error(`Error: ${apiResponse.status}`)
        console.error(errorText)
        setResponse(`Error: ${apiResponse.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('Error:', error)
      setResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const clearImage = () => {
    setImageData(null)
    setImageFile(null)
    setQuestion('')
    setResponse('')
  }

  const speakResponse = async () => {
    if (!response) return
    setIsSpeaking(true)
    try {
      await textToSpeech(response, selectedLanguage)
    } catch (error) {
      console.error('Speech error:', error)
    } finally {
      setIsSpeaking(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-serif font-bold">Image Chat & Analysis</h2>
        <LanguageSelector />
      </div>

      {selectedModel === ('qwen' as const) && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-700 flex items-center gap-2">
            <AlertCircle size={16} />
            Please switch to <strong>GrokCloud</strong> model for image analysis
          </p>
        </div>
      )}

      {!imageData ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-edu-gold bg-edu-gold/10' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <ImageIcon size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium mb-2">
            {isDragActive ? 'Drop the image here' : 'Drag & drop an image here'}
          </p>
          <p className="text-sm text-gray-500">or click to select</p>
          <p className="text-xs text-gray-400 mt-2">Supports: PNG, JPG, JPEG, GIF, WebP, BMP</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <img
              src={imageData}
              alt="Uploaded"
              className="w-full max-h-96 object-contain rounded-lg border border-gray-200"
            />
            <button
              onClick={clearImage}
              className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
              placeholder="Ask a question about this image..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black transition-colors"
              disabled={isLoading}
            />
            <button
              onClick={handleAnalyze}
              disabled={!question.trim() || isLoading}
              className="p-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            </button>
          </div>

          {response && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-50 rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <p className="text-gray-800 whitespace-pre-wrap flex-1">{response}</p>
                <button
                  onClick={speakResponse}
                  disabled={isSpeaking}
                  className="ml-4 p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <Volume2 size={20} className={isSpeaking ? 'animate-pulse' : ''} />
                </button>
              </div>
            </motion.div>
          )}

          {imageFile && (
            <p className="text-sm text-gray-500">
              Image: {imageFile.name} ({(imageFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">
          <AlertCircle className="inline mr-1 text-orange-500" size={18} />
          Important Note:
        </h3>
        <p className="text-sm text-gray-700 mb-3">
          ⚠️ Image-based chat works only with <strong>GroqCloud's model</strong>. 
          Please ensure GroqCloud is selected in the model switcher (top right) for image analysis.
        </p>
        <h3 className="font-semibold mb-2 mt-4">Example Questions:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• What's happening in this image?</li>
          <li>• Explain the diagram shown</li>
          <li>• What mathematical concept is illustrated here?</li>
          <li>• Describe the scientific process depicted</li>
          <li>• What can you tell me about this historical artifact?</li>
        </ul>
      </div>
    </div>
  )
}
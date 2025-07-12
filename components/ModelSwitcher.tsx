'use client'

import { useStore } from '@/lib/store'
import { motion } from 'framer-motion'
import { Cpu, Cloud, Info } from 'lucide-react'
import { useState } from 'react'

export default function ModelSwitcher() {
  const { selectedModel, setSelectedModel } = useStore()
  const [showDetails, setShowDetails] = useState(false)

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-white border-2 border-black rounded-lg p-4 shadow-lg">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedModel('qwen')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              selectedModel === 'qwen'
                ? 'bg-black text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <Cpu size={20} />
            <span className="font-medium">Intel Qwen2.5</span>
          </button>
          
          <button
            onClick={() => setSelectedModel('Groqcloud')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              selectedModel === 'Groqcloud'
                ? 'bg-edu-gold text-black'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <Cloud size={20} />
            <span className="font-medium">GroqCloud</span>
          </button>
          
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Info size={20} />
          </button>
        </div>
        
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-gray-50 rounded-lg"
          >
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Intel Qwen2.5 7B</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>✓ Local processing</li>
                  <li>✓ Privacy-focused</li>
                  <li>✓ No internet required</li>
                  <li>✓ No Image support</li>
                  <li>~ Slower responses</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">GroqCloud LLaMA</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>✓ Ultra-fast responses</li>
                  <li>✓ Advanced reasoning</li>
                  <li>✓ Image analysis</li>
                  <li>✓ Multilingual</li>
                  <li>~ Requires internet</li>
                </ul>
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              💡 Tip: GroqCloud recommended for best experience
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
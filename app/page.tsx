'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageSquare, Image as ImageIcon, FileText, Brain, 
  Calendar, Target, BookOpen, Code2, Calculator, LayoutDashboard,
  Menu, X, Sparkles, UserCheck, Search
} from 'lucide-react'
import ModelSwitcher from '@/components/ModelSwitcher'
import Dashboard from '@/components/Dashboard'
import ChatAssistant from '@/components/modules/ChatAssistant'
import ImageChat from '@/components/modules/ImageChat'
import ContentGenerator from '@/components/modules/ContentGenerator'
import QuizGenerator from '@/components/modules/QuizGenerator'
import PracticeMode from '@/components/modules/PracticeMode'
import CurriculumGenerator from '@/components/modules/CurriculumGenerator'
import StudyPlanner from '@/components/modules/StudyPlanner'
import CodeEvaluator from '@/components/modules/CodeEvaluator'
import MathSolver from '@/components/modules/MathSolver'
import { useStore } from '@/lib/store'
import TeacherFeedback from '@/components/modules/TeacherFeedback'
import ConceptExplorer from '@/components/modules/ConceptExplorer'

const modules = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, component: Dashboard },
  { id: 'chat', name: 'Chat Assistant', icon: MessageSquare, component: ChatAssistant },
  { id: 'image', name: 'Image Chat', icon: ImageIcon, component: ImageChat },
  { id: 'content', name: 'Content Generator', icon: FileText, component: ContentGenerator },
  { id: 'quiz', name: 'Quiz Generator', icon: Brain, component: QuizGenerator },
  { id: 'practice', name: 'Practice Mode', icon: Target, component: PracticeMode },
  { id: 'curriculum', name: 'Curriculum', icon: Calendar, component: CurriculumGenerator },
  { id: 'planner', name: 'Study Planner', icon: BookOpen, component: StudyPlanner },
  { id: 'code', name: 'Code Evaluator', icon: Code2, component: CodeEvaluator },
  { id: 'math', name: 'Math Solver', icon: Calculator, component: MathSolver },
  { id: 'teacher', name: 'Teacher Feedback', icon: UserCheck, component: TeacherFeedback },
  { id: 'explorer', name: 'Concept Explorer', icon: Search, component: ConceptExplorer }
]

export default function Home() {
  const [activeModule, setActiveModule] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showWelcome, setShowWelcome] = useState(true)
  const { selectedModel } = useStore()

  useEffect(() => {
    const timer = setTimeout(() => setShowWelcome(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  const ActiveComponent = modules.find(m => m.id === activeModule)?.component || Dashboard

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Welcome Animation */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="inline-block mb-4"
              >
                <Sparkles size={64} className="text-edu-gold" />
              </motion.div>
              <h1 className="text-5xl font-serif text-white mb-2">EduIntel</h1>
              <p className="text-edu-gold text-lg">AI-Powered Smart Classroom Assistant</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Model Switcher */}
      <ModelSwitcher />

      {/* Main Layout */}
      <div className="flex h-screen">
        {/* Sidebar */}
        <motion.aside
          initial={{ x: 0 }}
          animate={{ x: sidebarOpen ? 0 : -280 }}
          className="w-64 bg-white border-r border-gray-200 fixed h-full z-40"
        >
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-serif font-bold">EduIntel</h1>
            <p className="text-sm text-gray-600 mt-1">Smart Learning Assistant</p>
          </div>

          <nav className="p-4">
            {modules.map((module) => {
              const Icon = module.icon
              return (
                <button
                  key={module.id}
                  onClick={() => setActiveModule(module.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all mb-2 ${
                    activeModule === module.id
                      ? 'bg-black text-white'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{module.name}</span>
                </button>
              )
            })}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              <p>Model: {selectedModel === 'qwen' ? 'Intel Qwen2.5' : 'GroqCloud'}</p>
              <p className="mt-1">© 2025 Intel AI Initiative</p>
            </div>
          </div>
        </motion.aside>

        {/* Main Content */}
        <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
          {/* Header */}
          <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>

              <div className="text-center flex-1">
                <h2 className="text-xl font-serif">
                  {modules.find(m => m.id === activeModule)?.name}
                </h2>
              </div>

              <div className="w-10" /> {/* Spacer for alignment */}
            </div>
          </header>

          {/* Module Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeModule}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <ActiveComponent />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  )
}
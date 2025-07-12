import { create } from 'zustand'

export type ModelType = 'qwen' | 'Groqcloud'
export type Language = 'en' | 'es' | 'fr' | 'de' | 'zh' | 'hi' | 'ar' | 'pt' | 'ru' | 'ja'

interface Practice {
  id: string
  topic: string
  score: number
  date: string
  feedback: string
}

interface Quiz {
  id: string
  subject: string
  score: number
  totalQuestions: number
  date: string
}

interface AppState {
  // Model selection
  selectedModel: ModelType
  setSelectedModel: (model: ModelType) => void
  
  // Language selection
  selectedLanguage: Language
  setSelectedLanguage: (language: Language) => void
  
  // User data
  userName: string
  setUserName: (name: string) => void
  
  // Practice history
  practiceHistory: Practice[]
  addPractice: (practice: Omit<Practice, 'id' | 'date'>) => void
  
  // Quiz results
  quizResults: Quiz[]
  addQuizResult: (quiz: Omit<Quiz, 'id' | 'date'>) => void
  
  // Study progress
  studyProgress: Record<string, number>
  updateStudyProgress: (topic: string, progress: number) => void
  
  // Analytics
  totalStudyTime: number
  incrementStudyTime: (minutes: number) => void
  
  // Clear all data
  clearAllData: () => void
}

export const useStore = create<AppState>(
  (set) => ({
      // Model selection
      selectedModel: 'Groqcloud',
      setSelectedModel: (model) => set({ selectedModel: model }),
      
      // Language selection
      selectedLanguage: 'en',
      setSelectedLanguage: (language) => set({ selectedLanguage: language }),
      
      // User data
      userName: '',
      setUserName: (name) => set({ userName: name }),
      
      // Practice history
      practiceHistory: [],
      addPractice: (practice) => set((state) => ({
        practiceHistory: [
          {
            ...practice,
            id: Math.random().toString(36).substr(2, 9),
            date: new Date().toISOString()
          },
          ...state.practiceHistory
        ].slice(0, 50) // Keep last 50 practices
      })),
      
      // Quiz results
      quizResults: [],
      addQuizResult: (quiz) => set((state) => ({
        quizResults: [
          {
            ...quiz,
            id: Math.random().toString(36).substr(2, 9),
            date: new Date().toISOString()
          },
          ...state.quizResults
        ].slice(0, 50) // Keep last 50 quiz results
      })),
      
      // Study progress
      studyProgress: {},
      updateStudyProgress: (topic, progress) => set((state) => ({
        studyProgress: {
          ...state.studyProgress,
          [topic]: Math.max(state.studyProgress[topic] || 0, progress)
        }
      })),
      
      // Analytics
      totalStudyTime: 0,
      incrementStudyTime: (minutes) => set((state) => ({
        totalStudyTime: state.totalStudyTime + minutes
      })),
      
      // Clear all data
      clearAllData: () => set({
        practiceHistory: [],
        quizResults: [],
        studyProgress: {},
        totalStudyTime: 0,
        userName: ''
      })
    })
  )
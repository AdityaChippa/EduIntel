'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  AreaChart, Area
} from 'recharts'
import { 
  Trophy, Clock, Target, TrendingUp, BookOpen, Brain, 
  Calendar, Award, Zap, Star, ChevronRight, BarChart3,
  Activity, Users, Sparkles
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { formatTime, formatDate } from '@/lib/utils'

interface StreakData {
  currentStreak: number
  longestStreak: number
  lastStudyDate: string
}

interface SubjectPerformance {
  subject: string
  avgScore: number
  studyTime: number
  improvement: number
}

export default function Dashboard() {
  const { 
    userName, 
    practiceHistory, 
    quizResults, 
    studyProgress, 
    totalStudyTime,
    setUserName 
  } = useStore()
  
  const [showNameInput, setShowNameInput] = useState(!userName)
  const [tempName, setTempName] = useState('')
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'all'>('week')
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastStudyDate: ''
  })

  // Calculate statistics
  const avgPracticeScore = practiceHistory.length > 0
    ? Math.round(practiceHistory.reduce((sum, p) => sum + p.score, 0) / practiceHistory.length)
    : 0

  const avgQuizScore = quizResults.length > 0
    ? Math.round(quizResults.reduce((sum, q) => sum + q.score, 0) / quizResults.length)
    : 0

  const topicsStudied = Object.keys(studyProgress).length
  const totalActivities = practiceHistory.length + quizResults.length

  // Calculate improvement trend
  const calculateImprovement = () => {
    if (practiceHistory.length < 2) return 0
    const recent = practiceHistory.slice(0, 5).reduce((sum, p) => sum + p.score, 0) / Math.min(5, practiceHistory.length)
    const older = practiceHistory.slice(-5).reduce((sum, p) => sum + p.score, 0) / Math.min(5, practiceHistory.length)
    return Math.round(recent - older)
  }

  // Calculate streak
  useEffect(() => {
    const calculateStreak = () => {
      const allDates = [
        ...practiceHistory.map(p => p.date),
        ...quizResults.map(q => q.date)
      ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

      if (allDates.length === 0) {
        setStreakData({ currentStreak: 0, longestStreak: 0, lastStudyDate: '' })
        return
      }

      let currentStreak = 1
      let longestStreak = 1
      let tempStreak = 1

      for (let i = 1; i < allDates.length; i++) {
        const prevDate = new Date(allDates[i - 1])
        const currDate = new Date(allDates[i])
        const dayDiff = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24))

        if (dayDiff === 1) {
          tempStreak++
          if (i === 1) currentStreak = tempStreak
        } else {
          longestStreak = Math.max(longestStreak, tempStreak)
          tempStreak = 1
        }
      }

      longestStreak = Math.max(longestStreak, tempStreak)

      // Check if streak is still active
      const today = new Date()
      const lastDate = new Date(allDates[0])
      const daysSinceLastStudy = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysSinceLastStudy > 1) currentStreak = 0

      setStreakData({
        currentStreak,
        longestStreak,
        lastStudyDate: allDates[0]
      })
    }

    calculateStreak()
  }, [practiceHistory, quizResults])

  // Filter data based on time range
  const filterByTimeRange = (data: any[]) => {
    if (selectedTimeRange === 'all') return data
    
    const now = new Date()
    const cutoffDate = new Date()
    
    if (selectedTimeRange === 'week') {
      cutoffDate.setDate(now.getDate() - 7)
    } else {
      cutoffDate.setMonth(now.getMonth() - 1)
    }

    return data.filter(item => new Date(item.date) >= cutoffDate)
  }

  // Prepare chart data
  const filteredPractices = filterByTimeRange(practiceHistory)
  const recentPractices = filteredPractices.slice(0, 10).reverse()
  
  const practiceChartData = recentPractices.map((p, i) => ({
    name: formatDate(p.date),
    score: p.score,
    topic: p.topic.split(' - ')[1] || p.topic
  }))

  // Subject performance analysis
  const subjectPerformance: SubjectPerformance[] = Object.entries(
    filteredPractices.reduce((acc, p) => {
      const subject = p.topic.split(' - ')[0]
      if (!acc[subject]) {
        acc[subject] = { scores: [], count: 0, firstScore: 0, lastScore: 0 }
      }
      acc[subject].scores.push(p.score)
      acc[subject].count++
      if (acc[subject].scores.length === 1) acc[subject].firstScore = p.score
      acc[subject].lastScore = p.score
      return acc
    }, {} as Record<string, { scores: number[], count: number, firstScore: number, lastScore: number }>)
  ).map(([subject, data]) => ({
    subject,
    avgScore: Math.round(data.scores.reduce((a: any, b: any) => a + b, 0) / data.scores.length),
    studyTime: data.count * 30, // Assuming 30 min per session
    improvement: data.lastScore - data.firstScore
  }))

  // Radar chart data for skills
  const skillsData = subjectPerformance.map(sp => ({
    subject: sp.subject,
    score: sp.avgScore,
    fullMark: 100
  }))

  // Time distribution data
  const timeDistribution = [
    { name: 'Morning', value: 30, color: '#FFD700' },
    { name: 'Afternoon', value: 45, color: '#C0C0C0' },
    { name: 'Evening', value: 25, color: '#808080' }
  ]

  const COLORS = ['#FFD700', '#C0C0C0', '#808080', '#000000', '#4B5563']

  const handleNameSave = () => {
    if (tempName.trim()) {
      setUserName(tempName.trim())
      setShowNameInput(false)
    }
  }

  const improvement = calculateImprovement()

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      {/* Header */}
      <div className="mb-6">
        {showNameInput ? (
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleNameSave()}
              placeholder="Enter your name"
              className="input-field flex-1"
              autoFocus
            />
            <button onClick={handleNameSave} className="btn-primary">
              Save
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-serif font-bold">
                Welcome back, {userName || 'Student'}!
              </h2>
              <p className="text-gray-600 mt-1">
                {streakData.currentStreak > 0 ? (
                  <span className="flex items-center gap-1">
                    <Zap className="text-yellow-500" size={16} />
                    {streakData.currentStreak} day streak! Keep it up!
                  </span>
                ) : (
                  'Start studying to build your streak!'
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value as any)}
                className="text-sm border rounded-lg px-3 py-1"
              >
                <option value="week">Last 7 days</option>
                <option value="month">Last 30 days</option>
                <option value="all">All time</option>
              </select>
              <button
                onClick={() => {
                  setTempName(userName)
                  setShowNameInput(true)
                }}
                className="text-sm text-gray-600 hover:text-black"
              >
                Edit Name
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-edu-gold to-yellow-500 text-black p-4 rounded-lg"
        >
          <Trophy className="mb-2" size={24} />
          <p className="text-2xl font-bold">{avgPracticeScore}%</p>
          <p className="text-sm opacity-80">Avg Practice Score</p>
          {improvement !== 0 && (
            <p className="text-xs mt-1 flex items-center gap-1">
              <TrendingUp size={12} />
              {improvement > 0 ? '+' : ''}{improvement}% trend
            </p>
          )}
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-gray-800 to-black text-white p-4 rounded-lg"
        >
          <Target className="mb-2" size={24} />
          <p className="text-2xl font-bold">{avgQuizScore}%</p>
          <p className="text-sm opacity-80">Avg Quiz Score</p>
          <p className="text-xs mt-1">{quizResults.length} quizzes taken</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-edu-silver to-gray-400 text-black p-4 rounded-lg"
        >
          <Clock className="mb-2" size={24} />
          <p className="text-2xl font-bold">{formatTime(totalStudyTime)}</p>
          <p className="text-sm opacity-80">Total Study Time</p>
          <p className="text-xs mt-1">{Math.round(totalStudyTime / 60)} hours</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-gray-200 to-gray-300 text-black p-4 rounded-lg"
        >
          <BookOpen className="mb-2" size={24} />
          <p className="text-2xl font-bold">{topicsStudied}</p>
          <p className="text-sm opacity-80">Topics Studied</p>
          <p className="text-xs mt-1">{totalActivities} activities</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-lg"
        >
          <Star className="mb-2" size={24} />
          <p className="text-2xl font-bold">{streakData.longestStreak}</p>
          <p className="text-sm opacity-80">Longest Streak</p>
          <p className="text-xs mt-1">Best: {streakData.longestStreak} days</p>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Performance Trend */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Activity size={20} />
            Performance Trend
          </h3>
          {practiceChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={practiceChartData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFD700" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#FFD700" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-2 border rounded shadow">
                          <p className="text-sm font-semibold">{payload[0].payload.topic}</p>
                          <p className="text-sm">Score: {payload[0].value}%</p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#FFD700" 
                  fillOpacity={1} 
                  fill="url(#colorScore)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-12">No practice data yet</p>
          )}
        </div>

        {/* Skills Radar */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Sparkles size={20} />
            Skills Overview
          </h3>
          {skillsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={skillsData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar 
                  name="Score" 
                  dataKey="score" 
                  stroke="#FFD700" 
                  fill="#FFD700" 
                  fillOpacity={0.6} 
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-12">Complete activities to see skills</p>
          )}
        </div>
      </div>

      {/* Subject Performance Table */}
      <div className="mb-8">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <BarChart3 size={20} />
          Subject Performance Analysis
        </h3>
        {subjectPerformance.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Subject</th>
                  <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Avg Score</th>
                  <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Study Time</th>
                  <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Improvement</th>
                  <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {subjectPerformance.map((sp, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{sp.subject}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-semibold ${
                        sp.avgScore >= 80 ? 'text-green-600' : 
                        sp.avgScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {sp.avgScore}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">{sp.studyTime} min</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`flex items-center justify-center gap-1 ${
                        sp.improvement > 0 ? 'text-green-600' : 
                        sp.improvement < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {sp.improvement > 0 && '+'}
                        {sp.improvement}%
                        {sp.improvement !== 0 && (
                          <TrendingUp 
                            size={14} 
                            className={sp.improvement < 0 ? 'rotate-180' : ''} 
                          />
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        sp.avgScore >= 80 ? 'bg-green-100 text-green-700' :
                        sp.avgScore >= 60 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {sp.avgScore >= 80 ? 'Excellent' : 
                         sp.avgScore >= 60 ? 'Good' : 'Needs Work'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">No subject data available yet</p>
        )}
      </div>

      {/* Achievement & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Achievements */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Award size={20} />
            Achievements
          </h3>
          <div className="space-y-3">
            {totalActivities >= 1 && (
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Star className="text-yellow-600" size={20} />
                </div>
                <div>
                  <p className="font-medium">First Steps</p>
                  <p className="text-xs text-gray-600">Completed your first activity</p>
                </div>
              </div>
            )}
            {streakData.longestStreak >= 3 && (
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Zap className="text-orange-600" size={20} />
                </div>
                <div>
                  <p className="font-medium">Consistent Learner</p>
                  <p className="text-xs text-gray-600">3+ day study streak</p>
                </div>
              </div>
            )}
            {avgPracticeScore >= 80 && (
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Trophy className="text-green-600" size={20} />
                </div>
                <div>
                  <p className="font-medium">High Achiever</p>
                  <p className="text-xs text-gray-600">80%+ average score</p>
                </div>
              </div>
            )}
            {totalActivities >= 10 && (
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Target className="text-purple-600" size={20} />
                </div>
                <div>
                  <p className="font-medium">Practice Master</p>
                  <p className="text-xs text-gray-600">10+ activities completed</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Calendar size={20} />
            Recent Activity
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {[...practiceHistory, ...quizResults]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 10)
              .map((activity, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-white rounded hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-2">
                    {'topic' in activity ? (
                      <BookOpen size={16} className="text-gray-500" />
                    ) : (
                      <Target size={16} className="text-gray-500" />
                    )}
                    <div>
                      <span className="text-sm font-medium">
                        {'topic' in activity ? activity.topic : activity.subject}
                      </span>
                      <p className="text-xs text-gray-500">
                        {'topic' in activity ? 'Practice' : 'Quiz'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium ${
                      activity.score >= 80 ? 'text-green-600' : 
                      activity.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {activity.score}%
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(activity.date)}
                    </span>
                  </div>
                </div>
              ))}
            {practiceHistory.length === 0 && quizResults.length === 0 && (
              <p className="text-center text-gray-500 py-4">No activity yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 p-4 bg-gradient-to-r from-edu-gold/20 to-yellow-100 rounded-lg">
        <h3 className="font-semibold mb-3">Ready to continue learning?</h3>
        <div className="flex flex-wrap gap-3">
          <button className="btn-secondary text-sm flex items-center gap-2">
            <Brain size={16} />
            Practice Questions
            <ChevronRight size={14} />
          </button>
          <button className="btn-secondary text-sm flex items-center gap-2">
            <Target size={16} />
            Take a Quiz
            <ChevronRight size={14} />
          </button>
          <button className="btn-secondary text-sm flex items-center gap-2">
            <Calendar size={16} />
            Study Planner
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
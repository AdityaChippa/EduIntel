'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Trophy, Clock, Target, TrendingUp, BookOpen, Brain } from 'lucide-react'
import { useStore } from '@/lib/store'
import { formatTime, formatDate } from '@/lib/utils'

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

  // Calculate statistics
  const avgPracticeScore = practiceHistory.length > 0
    ? Math.round(practiceHistory.reduce((sum, p) => sum + p.score, 0) / practiceHistory.length)
    : 0

  const avgQuizScore = quizResults.length > 0
    ? Math.round(quizResults.reduce((sum, q) => sum + q.score, 0) / quizResults.length)
    : 0

  const topicsStudied = Object.keys(studyProgress).length

  // Prepare chart data
  const recentPractices = practiceHistory.slice(0, 7).reverse()
  const practiceChartData = recentPractices.map((p, i) => ({
    name: `Practice ${i + 1}`,
    score: p.score
  }))

  const subjectDistribution = Object.entries(
    practiceHistory.reduce((acc, p) => {
      const subject = p.topic.split(' - ')[0]
      acc[subject] = (acc[subject] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  ).map(([subject, count]) => ({
    name: subject,
    value: count
  }))

  const COLORS = ['#FFD700', '#C0C0C0', '#808080', '#000000']

  const handleNameSave = () => {
    if (tempName.trim()) {
      setUserName(tempName.trim())
      setShowNameInput(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
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
            <h2 className="text-2xl font-serif font-bold">
              Welcome back, {userName || 'Student'}!
            </h2>
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
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-edu-gold to-yellow-500 text-black p-4 rounded-lg"
        >
          <Trophy className="mb-2" size={24} />
          <p className="text-2xl font-bold">{avgPracticeScore}%</p>
          <p className="text-sm opacity-80">Avg Practice Score</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-gray-800 to-black text-white p-4 rounded-lg"
        >
          <Target className="mb-2" size={24} />
          <p className="text-2xl font-bold">{avgQuizScore}%</p>
          <p className="text-sm opacity-80">Avg Quiz Score</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-edu-silver to-gray-400 text-black p-4 rounded-lg"
        >
          <Clock className="mb-2" size={24} />
          <p className="text-2xl font-bold">{formatTime(totalStudyTime)}</p>
          <p className="text-sm opacity-80">Total Study Time</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-gray-200 to-gray-300 text-black p-4 rounded-lg"
        >
          <BookOpen className="mb-2" size={24} />
          <p className="text-2xl font-bold">{topicsStudied}</p>
          <p className="text-sm opacity-80">Topics Studied</p>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Practice Score Trend */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={20} />
            Recent Practice Scores
          </h3>
          {practiceChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={practiceChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#FFD700" 
                  strokeWidth={2}
                  dot={{ fill: '#000' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-12">No practice data yet</p>
          )}
        </div>

        {/* Subject Distribution */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Brain size={20} />
            Subject Distribution
          </h3>
          {subjectDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={subjectDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {subjectDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-12">No subject data yet</p>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {[...practiceHistory, ...quizResults]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10)
            .map((activity, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-white rounded">
                <div className="flex items-center gap-2">
                  {'topic' in activity ? (
                    <BookOpen size={16} className="text-gray-500" />
                  ) : (
                    <Target size={16} className="text-gray-500" />
                  )}
                  <span className="text-sm">
                    {'topic' in activity ? activity.topic : activity.subject}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium ${
                    activity.score >= 70 ? 'text-green-600' : 'text-orange-600'
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
  )
}
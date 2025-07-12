import Groq from 'groq-sdk'
import { ModelType, Language } from './store'

const groq = new Groq({
  apiKey: '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',
  dangerouslyAllowBrowser: true
}) as any // Type assertion to avoid TypeScript conflicts

export interface AIResponse {
  text: string
  error?: string
}

export interface ImageAnalysisResponse {
  description: string
  answer?: string
  error?: string
}

export interface StudyPlanConfig {
  examDate: string
  examName: string
  studyHours: number
  subjects: Array<{
    name: string
    priority: 'high' | 'medium' | 'low'
    currentLevel: number
    targetScore: number
  }>
  studyStyle: string
  includeWeekends: boolean
  focusAreas: string
  model: ModelType
  language: Language
}

export interface CurriculumConfig {
  subject: string
  duration: string
  grade: string
  curriculumType: string
  classSize: string
  resourceAvailability: string
  specialRequirements: string
  learningObjectives: Array<{
    objective: string
    bloomsLevel: string
  }>
  assessmentPreference: string
  teachingHours: number
  model: ModelType
  language: Language
}

export interface TeacherFeedbackConfig {
  teacherName: string
  yearsExperience: string
  subjectArea: string
  gradeLevel: string
  teachingMethod: string
  curriculum: string
  classEnvironment: string
  challenges: Array<{
    challenge: string
    severity: 'low' | 'medium' | 'high'
  }>
  goals: string
  studentDemographics: string
  availableResources: string
  model: ModelType
  language: Language
}

// Language prompts
const languagePrompts: Record<Language, string> = {
  en: 'Respond in English.',
  es: 'Responde en español.',
  fr: 'Répondez en français.',
  de: 'Antworten Sie auf Deutsch.',
  zh: '请用中文回答。',
  hi: 'हिंदी में उत्तर दें।',
  ar: 'أجب باللغة العربية.',
  pt: 'Responda em português.',
  ru: 'Отвечайте на русском языке.',
  ja: '日本語で答えてください。'
}

export class AIService {
  private static instance: AIService
  
  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService()
    }
    return AIService.instance
  }

  async generateResponse(
    prompt: string,
    model: ModelType,
    language: Language = 'en',
    systemPrompt?: string
  ): Promise<AIResponse> {
    try {
      if (model === 'qwen') {
        // Call local Qwen model API
        return await this.callQwenModel(prompt, language, systemPrompt)
      } else {
        // Use GrokCloud
        return await this.callGrokCloud(prompt, language, systemPrompt)
      }
    } catch (error) {
      console.error('AI Service Error:', error)
      return { 
        text: '', 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }
    }
  }

  private async callGrokCloud(
    prompt: string, 
    language: Language,
    systemPrompt?: string
  ): Promise<AIResponse> {
    try {
      const messages = [
        {
          role: 'system' as const,
          content: systemPrompt || `You are EduIntel, an advanced AI educational assistant. ${languagePrompts[language]} Be helpful, accurate, and educational.`
        },
        {
          role: 'user' as const,
          content: prompt
        }
      ]

      const response = await groq.chat.completions.create({
        messages,
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 6000, // Increased for more detailed responses
        stream: false
      })

      return {
        text: response.choices[0]?.message?.content || ''
      }
    } catch (error) {
      throw error
    }
  }

  private async callQwenModel(
    prompt: string,
    language: Language,
    systemPrompt?: string
  ): Promise<AIResponse> {
    try {
      // Call local Qwen API endpoint
      const response = await fetch('/api/qwen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          language,
          systemPrompt: systemPrompt || `You are EduIntel, an advanced AI educational assistant. ${languagePrompts[language]} Be helpful, accurate, and educational.`
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get response from Qwen model')
      }

      const data = await response.json()
      return { text: data.text }
    } catch (error) {
      throw error
    }
  }

  async analyzeImage(
    imageData: string,
    question: string,
    model: ModelType,
    language: Language = 'en'
  ): Promise<ImageAnalysisResponse> {
    try {
      if (model === 'qwen') {
        // Qwen supports image analysis
        return await this.analyzeImageWithQwen(imageData, question, language)
      } else {
        // GrokCloud with llama-4-scout for image analysis
        return await this.analyzeImageWithGrokCloud(imageData, question, language)
      }
    } catch (error) {
      console.error('Image Analysis Error:', error)
      return {
        description: '',
        error: error instanceof Error ? error.message : 'Failed to analyze image'
      }
    }
  }

  private async analyzeImageWithGrokCloud(
    imageData: string,
    question: string,
    language: Language
  ): Promise<ImageAnalysisResponse> {
    try {
      // Process image to match your working Python code
      let base64Image = imageData
      let mimeType = 'image/jpeg'
      
      // Extract base64 if it's a data URL
      if (imageData.startsWith('data:')) {
        const matches = imageData.match(/^data:(.+);base64,(.+)$/)
        if (matches) {
          mimeType = matches[1]
          base64Image = matches[2]
        }
      }
      
      // Make the exact same API call as your Python code
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer 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',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "meta-llama/llama-4-scout-17b-16e-instruct", // Exact model from your code
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

      if (response.status === 200) {
        const result = await response.json()
        const description = result.choices[0]?.message?.content || 'No description available'
        
        return {
          description: description,
          answer: description
        }
      } else {
        const errorText = await response.text()
        console.error(`Groq API Error: ${response.status}`, errorText)
        
        return {
          description: `Error: ${response.status} - ${errorText}`,
          answer: `Unable to analyze image. Status: ${response.status}`,
          error: errorText
        }
      }
    } catch (error: any) {
      console.error('Image analysis error:', error)
      
      return {
        description: `Error analyzing image: ${error.message}`,
        answer: `Failed to analyze image. Please try again. Error: ${error.message}`,
        error: error.message
      }
    }
  }

  private async analyzeImageWithQwen(
    imageData: string,
    question: string,
    language: Language
  ): Promise<ImageAnalysisResponse> {
    try {
      const response = await fetch('/api/qwen/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData,
          question,
          language
        })
      })

      if (!response.ok) {
        throw new Error('Failed to analyze image with Qwen')
      }

      const data = await response.json()
      return {
        description: data.description,
        answer: data.answer
      }
    } catch (error) {
      throw error
    }
  }

  // Enhanced generateDetailedStudyPlan method
  async generateDetailedStudyPlan(config: StudyPlanConfig): Promise<string> {
    const today = new Date()
    const exam = new Date(config.examDate)
    const daysUntilExam = Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    // Calculate total study days
    let totalStudyDays = daysUntilExam
    if (!config.includeWeekends) {
      const weeks = Math.floor(daysUntilExam / 7)
      const remainingDays = daysUntilExam % 7
      totalStudyDays = weeks * 5 + Math.min(remainingDays, 5)
    }

    // Sort subjects by priority
    const prioritizedSubjects = [...config.subjects].sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })

    const prompt = `Create an extremely detailed and comprehensive study plan with the following specifications:

# EXAM DETAILS
- **Exam Name**: ${config.examName || 'General Exam'}
- **Exam Date**: ${exam.toLocaleDateString()} (${daysUntilExam} days from now)
- **Study Start Date**: ${today.toLocaleDateString()} (Today)
- **Total Study Days**: ${totalStudyDays} days
- **Daily Study Hours**: ${config.studyHours} hours
- **Study Style**: ${config.studyStyle}
- **Weekends**: ${config.includeWeekends ? 'Included' : 'Excluded (Weekdays only)'}

# SUBJECTS AND TARGETS
${prioritizedSubjects.map(subject => `
- **${subject.name}** 
  - Priority: ${subject.priority.toUpperCase()}
  - Current Level: ${subject.currentLevel}/10
  - Target Score: ${subject.targetScore}%
  - Improvement Needed: ${subject.targetScore - (subject.currentLevel * 10)}%
`).join('')}

# SPECIFIC FOCUS AREAS
${config.focusAreas || 'No specific focus areas mentioned'}

# REQUIRED OUTPUT FORMAT

Generate a comprehensive study plan with the following structure:

## 📚 **PERSONALIZED STUDY PLAN FOR ${config.examName ? config.examName.toUpperCase() : 'YOUR EXAM'}**

### 📊 **EXECUTIVE SUMMARY**
- Total preparation time analysis
- Key milestones and checkpoints
- Expected progress trajectory
- Critical success factors

### 🎯 **STRATEGIC OVERVIEW**
- Subject-wise time allocation (in hours and percentages)
- Weekly goals and objectives
- Monthly progress targets
- Risk areas and mitigation strategies

### 📈 **SUBJECT-WISE BREAKDOWN**
For each subject, provide:
- Total hours allocated
- Key topics to cover (comprehensive list)
- Recommended study resources
- Practice requirements
- Common pitfalls to avoid

### 📅 **DETAILED DAILY SCHEDULE**

For EACH study day, provide:

**Day [X] - [Date] - [Day of Week]**
⏰ **Time Slots:**
- [Time Range]: [Subject] - [Specific Topic]
  - Learning objectives
  - Study method (reading/practice/revision)
  - Resources to use
  - Expected outcome

📝 **Daily Goals:**
- [ ] Goal 1 (specific and measurable)
- [ ] Goal 2
- [ ] Goal 3

🎯 **Focus Topic:** [Main topic for the day]

💡 **Study Techniques:**
- Specific techniques for today's topics
- Memory aids or mnemonics
- Practice problems count

📊 **Progress Check:**
- What to review from previous days
- Self-assessment questions
- Performance indicators

⚡ **Energy Management:**
- Best time for difficult topics
- Break schedule
- Energy boosters

### 🔄 **REVISION CYCLES**
- Week 1-2: Foundation Building
- Week 3-4: Intensive Learning
- Week 5-6: Practice & Application
- Final Week: Comprehensive Revision

### 📝 **WEEKLY ASSESSMENTS**
For each week:
- Mock test schedule
- Topics to test
- Performance benchmarks
- Weak area identification plan

### 🎓 **STUDY TECHNIQUES GUIDE**
Based on ${config.studyStyle} style:
- Specific techniques for each subject
- Time management strategies
- Note-taking methods
- Memory enhancement techniques
- Problem-solving approaches

### 📊 **PROGRESS TRACKING**
- Daily completion checklists
- Weekly performance metrics
- Subject-wise progress indicators
- Adjustment recommendations

### 💪 **MOTIVATION & WELLNESS**
- Daily motivation tips
- Stress management techniques
- Physical exercise recommendations
- Nutrition guidelines for exam preparation
- Sleep schedule optimization

### 🚨 **CONTINGENCY PLANS**
- What to do if falling behind
- Rapid revision strategies
- Last-week intensive plan
- Day-before-exam protocol

### ✅ **SUCCESS METRICS**
- Daily achievement indicators
- Weekly milestone markers
- Overall readiness assessment
- Confidence building measures

### 📌 **FINAL WEEK STRATEGY**
- Day-by-day final revision plan
- Key formulas/concepts summary
- Exam day preparation
- Time management during exam

### 🎯 **EXAM DAY PROTOCOL**
- Morning routine
- What to review
- Materials to carry
- Stress management
- Time allocation strategy

Remember to:
- Make each day's plan specific and actionable
- Include variety to prevent burnout
- Account for ${config.subjects.length} subjects with appropriate time distribution
- Prioritize based on subject importance and current skill level
- Include buffer time for unexpected delays
- Add specific page numbers, chapter references, or problem sets where applicable

${languagePrompts[config.language]}`

    const response = await this.generateResponse(prompt, config.model, config.language)
    return response.text
  }

  // Enhanced curriculum generation
  async generateEnhancedCurriculum(config: CurriculumConfig): Promise<string> {
    const durationMap: Record<string, string> = {
      'week': '1 week',
      'month': '1 month',
      'quarter': '3 months',
      'semester': '1 semester (4-5 months)',
      'year': 'full academic year'
    }

    const prompt = `Create an extremely detailed and comprehensive curriculum with the following specifications:

# CURRICULUM PARAMETERS
- **Subject**: ${config.subject}
- **Grade Level**: ${config.grade}
- **Duration**: ${durationMap[config.duration] || config.duration}
- **Curriculum Type**: ${config.curriculumType}
- **Class Size**: ${config.classSize}
- **Resource Availability**: ${config.resourceAvailability}
- **Weekly Teaching Hours**: ${config.teachingHours} hours
- **Assessment Preference**: ${config.assessmentPreference}

# LEARNING OBJECTIVES
${config.learningObjectives.map((obj, i) => `
${i + 1}. **${obj.objective}** (Bloom's Level: ${obj.bloomsLevel})
`).join('')}

# SPECIAL REQUIREMENTS
${config.specialRequirements || 'No special requirements specified'}

# REQUIRED OUTPUT FORMAT

Generate a comprehensive curriculum with the following structure:

## 📚 **${config.subject.toUpperCase()} CURRICULUM - ${config.grade.toUpperCase()}**

### 📋 **CURRICULUM OVERVIEW**
- Course description and rationale
- Prerequisites and assumed knowledge
- Course outcomes and competencies
- Alignment with educational standards
- Cross-curricular connections

### 🎯 **LEARNING OBJECTIVES & OUTCOMES**
For each objective:
- Specific learning outcome
- Bloom's taxonomy level
- Assessment criteria
- Success indicators
- Differentiation strategies

### 📅 **COURSE TIMELINE & PACING GUIDE**

#### **Week-by-Week Breakdown**
For EACH week, provide:

**Week [X]: [Theme/Unit Title]**
📚 **Topics Covered:**
- Main topic with subtopics
- Key concepts and vocabulary
- Essential questions

⏰ **Time Allocation:**
- Day 1: [Topic] ([X] hours)
- Day 2: [Topic] ([X] hours)
- [Continue for all teaching days]

🎓 **Learning Activities:**
- Opening activities/hooks
- Main instructional activities
- Guided practice
- Independent work
- Closure activities

📝 **Assignments & Homework:**
- Daily assignments with objectives
- Long-term projects
- Reading requirements

🔬 **Practical/Lab Work:** (if applicable)
- Experiments/activities
- Materials needed
- Safety considerations

💻 **Technology Integration:**
- Digital tools and platforms
- Online resources
- Virtual activities

### 📊 **ASSESSMENT FRAMEWORK**

#### **Formative Assessments**
- Daily assessment strategies
- Exit tickets and check-ins
- Peer assessment opportunities
- Self-reflection tools

#### **Summative Assessments**
- Unit tests structure
- Project rubrics
- Performance assessments
- Portfolio requirements

#### **Assessment Schedule**
- Weekly quizzes
- Unit tests
- Major projects
- Final assessment

### 📚 **RESOURCES & MATERIALS**

#### **Required Resources**
- Textbooks and workbooks
- Digital platforms
- Lab equipment
- Art supplies/materials

#### **Supplementary Resources**
- Additional reading
- Online resources
- Videos and multimedia
- Guest speakers

### 🎨 **INSTRUCTIONAL STRATEGIES**

Based on ${config.curriculumType} approach:
- Teaching methodologies
- Differentiation techniques
- Engagement strategies
- Classroom management
- Student grouping

### 🌟 **DIFFERENTIATION & SUPPORT**

#### **For Advanced Learners**
- Extension activities
- Independent projects
- Accelerated content

#### **For Struggling Learners**
- Remediation strategies
- Additional support
- Modified assignments

#### **For Special Needs**
- Accommodations
- Modifications
- Support resources

### 🏛️ **CLASSROOM ENVIRONMENT**
- Physical setup recommendations
- Learning stations
- Display areas
- Resource organization

### 👥 **PARENT/GUARDIAN INVOLVEMENT**
- Communication strategies
- Home support suggestions
- Parent resources
- Volunteer opportunities

### 📈 **PROGRESS MONITORING**
- Data collection methods
- Progress tracking tools
- Intervention triggers
- Success celebrations

### 🔄 **CURRICULUM REVIEW**
- Weekly reflection prompts
- Monthly adjustment guidelines
- Student feedback integration
- Continuous improvement plan

### 📋 **IMPLEMENTATION CHECKLIST**
- Pre-course preparation
- First week priorities
- Ongoing tasks
- End-of-course procedures

### 🌐 **21ST CENTURY SKILLS INTEGRATION**
- Critical thinking activities
- Collaboration projects
- Communication skills
- Creativity opportunities
- Digital citizenship

Remember to:
- Align all activities with learning objectives
- Include variety in instructional methods
- Account for ${config.classSize} class size
- Work within ${config.resourceAvailability} resource constraints
- Incorporate ${config.assessmentPreference} assessment methods
- Address all special requirements mentioned

${languagePrompts[config.language]}`

    const response = await this.generateResponse(prompt, config.model, config.language)
    return response.text
  }

  // Enhanced teacher feedback generation
  async generateDetailedTeacherFeedback(config: TeacherFeedbackConfig): Promise<string> {
    const prompt = `As an expert educational consultant with decades of experience, provide comprehensive, personalized feedback and an actionable improvement plan for the following teacher:

# TEACHER PROFILE
- **Name**: ${config.teacherName || 'Teacher'}
- **Experience**: ${config.yearsExperience || 'Not specified'} years
- **Subject Area**: ${config.subjectArea || 'Not specified'}
- **Grade Level**: ${config.gradeLevel || 'Not specified'}

# CURRENT TEACHING CONTEXT
**Teaching Method & Philosophy:**
${config.teachingMethod}

**Current Curriculum:**
${config.curriculum}

**Classroom Environment:**
${config.classEnvironment || 'Not specified'}

**Student Demographics:**
${config.studentDemographics || 'Not specified'}

**Available Resources:**
${config.availableResources || 'Not specified'}

# CHALLENGES FACED
${config.challenges.map((c, i) => `
${i + 1}. **${c.challenge}** (Severity: ${c.severity.toUpperCase()})
`).join('')}

# PROFESSIONAL GOALS
${config.goals || 'No specific goals mentioned'}

# REQUIRED OUTPUT FORMAT

Provide comprehensive feedback structured as follows:

## 🎓 **PERSONALIZED TEACHING FEEDBACK & DEVELOPMENT PLAN**

### 👨‍🏫 **EXECUTIVE SUMMARY**
- Overall teaching effectiveness assessment
- Key strengths identified
- Priority areas for improvement
- Expected outcomes from recommendations

### 💪 **STRENGTHS ANALYSIS**
Identify and elaborate on:
- Current effective practices
- Positive aspects of teaching philosophy
- Successful strategies already in use
- Areas of expertise to leverage

### 🔍 **DETAILED CHALLENGE ANALYSIS**

For EACH challenge listed, provide:

#### **Challenge: [Challenge Name]**
📊 **Root Cause Analysis:**
- Underlying factors
- Contributing elements
- Impact on learning

💡 **Evidence-Based Solutions:**
1. **Immediate Actions** (Can implement tomorrow)
   - Specific technique #1
   - Specific technique #2
   - Quick wins

2. **Short-term Strategies** (1-4 weeks)
   - Detailed implementation plan
   - Required resources
   - Success metrics

3. **Long-term Approaches** (1-3 months)
   - Systematic changes
   - Professional development
   - Sustainability plan

📚 **Recommended Resources:**
- Books/articles
- Online courses
- Tools and apps
- Professional networks

### 🎯 **TEACHING METHOD ENHANCEMENT**

#### **Current Method Analysis**
- Strengths of current approach
- Areas needing adjustment
- Alignment with best practices

#### **Recommended Improvements**
- Specific modifications
- New techniques to integrate
- Blended learning opportunities
- Technology integration

### 📖 **CURRICULUM OPTIMIZATION**

#### **Current Curriculum Review**
- Coverage assessment
- Pacing analysis
- Engagement factors

#### **Enhancement Suggestions**
- Content modifications
- Sequencing improvements
- Real-world connections
- Project-based additions

### 🏫 **CLASSROOM MANAGEMENT STRATEGIES**

Based on ${config.classSize || 'your'} class size and environment:
- Physical space optimization
- Behavior management techniques
- Engagement strategies
- Routine establishment

### 👥 **STUDENT ENGAGEMENT TECHNIQUES**

For your student demographics:
- Culturally responsive teaching
- Differentiation strategies
- Active learning methods
- Student voice integration

### 📊 **ASSESSMENT & FEEDBACK IMPROVEMENTS**
- Formative assessment techniques
- Feedback delivery methods
- Student self-assessment
- Data-driven instruction

### 🚀 **30-60-90 DAY ACTION PLAN**

#### **First 30 Days: Foundation**
Week 1-2:
- [ ] Action item 1 with specifics
- [ ] Action item 2 with specifics
- [ ] Measurement method

Week 3-4:
- [ ] Progressive actions
- [ ] Initial assessments
- [ ] Adjustments

#### **Days 31-60: Implementation**
- Expanded strategies
- Progress monitoring
- Student feedback integration
- Peer observations

#### **Days 61-90: Refinement**
- Advanced techniques
- Sustainability planning
- Impact assessment
- Future planning

### 📈 **PROFESSIONAL DEVELOPMENT ROADMAP**
- Recommended workshops/courses
- Peer observation opportunities
- Mentorship suggestions
- Conference recommendations
- Online learning paths

### 🛠️ **RESOURCE TOOLKIT**

#### **Immediate Resources** (Free/Low-cost)
- Websites and platforms
- Printable materials
- Community resources

#### **Investment Resources** (Budget-dependent)
- Technology tools
- Professional materials
- Training programs

### 📋 **SUCCESS METRICS & MONITORING**
- Weekly self-reflection prompts
- Monthly progress indicators
- Student outcome measures
- Peer feedback integration

### 💬 **COMMUNICATION STRATEGIES**
- Parent engagement techniques
- Administrator updates
- Student conferences
- Colleague collaboration

### 🌟 **MOTIVATION & SELF-CARE**
- Avoiding burnout
- Celebrating successes
- Building resilience
- Work-life balance

### 🔄 **CONTINUOUS IMPROVEMENT CYCLE**
- Regular review schedule
- Adjustment protocols
- Innovation integration
- Best practice sharing

### ✅ **IMPLEMENTATION CHECKLIST**
Prioritized action items:
1. **This Week**: [Specific actions]
2. **This Month**: [Building blocks]
3. **This Term**: [Major initiatives]

### 📝 **CLOSING THOUGHTS & ENCOURAGEMENT**
- Personalized encouragement
- Recognition of dedication
- Vision for future success
- Support resources

Remember: Change is incremental. Focus on progress, not perfection. Every small improvement impacts student learning.

${languagePrompts[config.language]}`

    const response = await this.generateResponse(prompt, config.model, config.language)
    return response.text
  }

  // Enhanced quiz generation with better structure
  async generateQuiz(
    subject: string,
    topic: string,
    level: string,
    questionType: string,
    numQuestions: number,
    model: ModelType,
    language: Language
  ): Promise<any> {
    const prompt = `Generate a high-quality quiz with exactly ${numQuestions} ${questionType} questions about ${topic} in ${subject} for ${level} level students. 
    
    IMPORTANT: You MUST respond with ONLY a valid JSON object in this exact format, with no additional text:
    {
      "questions": [
        {
          "question": "Clear, well-formatted question text",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": "Option A",
          "explanation": "Detailed explanation of why this is correct, including key concepts"
        }
      ]
    }
    
    Rules:
    - For multiple-choice: include exactly 4 options in the "options" array, correctAnswer must be one of the options
    - For true-false: options should be ["True", "False"], correctAnswer must be "True" or "False"
    - For short-answer: options should be an empty array [], correctAnswer should be the expected answer
    - Make questions progressively challenging
    - Ensure questions test different aspects of the topic
    - Make explanations educational and comprehensive
    - Questions should be clear and unambiguous
    - ${languagePrompts[language]}
    
    Generate exactly ${numQuestions} high-quality questions. Respond with ONLY the JSON object, no other text.`

    const response = await this.generateResponse(prompt, model, language)
    
    try {
      // Try to extract JSON from the response
      let jsonStr = response.text.trim()
      
      // Remove markdown code blocks if present
      jsonStr = jsonStr.replace(/```json\n?/gi, '').replace(/```\n?/gi, '')
      
      // Find JSON object in the response
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
      
      const parsed = JSON.parse(jsonStr)
      
      // Validate the structure
      if (parsed.questions && Array.isArray(parsed.questions)) {
        return parsed
      } else {
        throw new Error('Invalid quiz structure')
      }
    } catch {
      // Enhanced fallback structure
      const fallbackQuestions = []
      
      for (let i = 0; i < numQuestions; i++) {
        if (questionType === 'multiple-choice') {
          fallbackQuestions.push({
            question: `Question ${i + 1}: What is an important concept in ${topic}?`,
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: 'Option A',
            explanation: `This is correct because it accurately describes a key concept in ${topic}.`
          })
        } else if (questionType === 'true-false') {
          fallbackQuestions.push({
            question: `Statement ${i + 1}: This statement about ${topic} is true.`,
            options: ['True', 'False'],
            correctAnswer: i % 2 === 0 ? 'True' : 'False',
            explanation: `This statement is ${i % 2 === 0 ? 'true' : 'false'} because of the fundamental principles of ${topic}.`
          })
        } else {
          fallbackQuestions.push({
            question: `Explain this concept related to ${topic} in your own words.`,
            options: [],
            correctAnswer: 'A complete answer would include key points about the concept, examples, and its significance.',
            explanation: 'Key points to cover: definition, importance, examples, and applications.'
          })
        }
      }
      
      return { 
        questions: fallbackQuestions
      }
    }
  }

  // Enhanced math problem solver
  async solveMathProblem(
    problem: string,
    model: ModelType,
    language: Language
  ): Promise<any> {
    const prompt = `Solve this math problem with exceptional detail and clarity: ${problem}

Provide a comprehensive solution in the following format:

## 🧮 **PROBLEM ANALYSIS**
- Problem type identification
- Given information extraction
- What we need to find
- Relevant formulas/theorems

## 📐 **STEP-BY-STEP SOLUTION**

### Step 1: [Setup/Understanding]
- Detailed explanation
- Mathematical notation
- Visual representation (describe any helpful diagrams)

### Step 2: [Method Selection]
- Why this approach
- Alternative methods (if applicable)
- Efficiency considerations

### Step 3-N: [Detailed Calculations]
- Show EVERY step
- Explain mathematical operations
- Highlight key transformations
- Check for common mistakes

## ✅ **FINAL ANSWER**
**[Clearly boxed final answer with appropriate units]**

## 🔍 **VERIFICATION**
- Check by substitution
- Reasonableness test
- Alternative verification method

## 💡 **KEY CONCEPTS USED**
1. Concept 1: Brief explanation
2. Concept 2: How it applies
3. [Additional concepts]

## 📊 **VISUAL REPRESENTATION**
Describe how to:
- Draw relevant graphs
- Create helpful diagrams
- Visualize the problem

## 🎯 **SIMILAR PROBLEMS**
- Practice problem 1 (slightly easier)
- Practice problem 2 (same level)
- Practice problem 3 (slightly harder)

## 📚 **STUDY TIPS**
- Common mistakes to avoid
- Memory tricks
- Related topics to review

${languagePrompts[language]}`

    const response = await this.generateResponse(prompt, model, language)
    return response.text
  }

  // Enhanced code evaluation
  async evaluateCode(
    code: string,
    description: string,
    programmingLanguage: string,
    model: ModelType,
    language: Language
  ): Promise<any> {
    const prompt = `Perform a comprehensive evaluation of this ${programmingLanguage} code that is supposed to: ${description}
    
Code:
\`\`\`${programmingLanguage}
${code}
\`\`\`

Provide an extremely detailed analysis in this format:

## 📊 **EVALUATION SUMMARY**
**Overall Score: X/100**
- Functionality: X/25
- Code Quality: X/25
- Efficiency: X/25
- Best Practices: X/25

## 🔍 **DETAILED CODE ANALYSIS**

### **1. Functionality Analysis**
- Does it meet requirements?
- Edge cases handling
- Input validation
- Error handling
- Expected vs actual behavior

### **2. Code Structure & Organization**
- Architecture assessment
- Modularity
- Separation of concerns
- Code reusability
- Naming conventions

### **3. Performance Analysis**
- Time complexity: O(?)
- Space complexity: O(?)
- Bottlenecks identified
- Optimization opportunities
- Scalability considerations

### **4. Security Assessment**
- Potential vulnerabilities
- Input sanitization
- Data protection
- Common security pitfalls

## 🐛 **ISSUES FOUND**

### Critical Issues (Must Fix)
1. **Issue**: [Description]
   - **Line(s)**: X-Y
   - **Impact**: [Severity and consequences]
   - **Fix**: [Specific solution]

### Major Issues (Should Fix)
[List with same format]

### Minor Issues (Nice to Fix)
[List with same format]

## ✨ **ENHANCED VERSION**

\`\`\`${programmingLanguage}
// Fully corrected and optimized code with comments
// explaining each improvement made
[Provide the complete improved code]
\`\`\`

## 📝 **DETAILED IMPROVEMENTS EXPLANATION**

### Functionality Improvements
1. **What**: [Specific change]
   **Why**: [Reasoning]
   **Impact**: [Benefits]

### Performance Optimizations
[Same format]

### Code Quality Enhancements
[Same format]

## 📚 **BEST PRACTICES RECOMMENDATIONS**

### For ${programmingLanguage}:
1. **Practice**: [Explanation and example]
2. **Practice**: [Explanation and example]
[Continue with relevant practices]

### General Programming:
1. **Principle**: [Explanation]
2. **Principle**: [Explanation]

## 🎯 **LEARNING RESOURCES**
- Recommended reading
- Useful libraries/frameworks
- Practice exercises
- Documentation links

## 💡 **ALTERNATIVE APPROACHES**
Show 2-3 different ways to solve the same problem:

### Approach 1: [Name]
\`\`\`${programmingLanguage}
[Code snippet]
\`\`\`
Pros: [List]
Cons: [List]

### Approach 2: [Name]
[Same format]

## ✅ **TESTING RECOMMENDATIONS**
- Unit test examples
- Edge cases to test
- Testing framework suggestions
- Coverage targets

${languagePrompts[language]}`

    const response = await this.generateResponse(prompt, model, language)
    return response.text
  }

  // Keep the old methods for backward compatibility
  async generateCurriculum(
    subject: string,
    duration: string,
    grade: string,
    type: string,
    model: ModelType,
    language: Language
  ): Promise<any> {
    // Convert to new format for backward compatibility
    const config: CurriculumConfig = {
      subject,
      duration,
      grade,
      curriculumType: type,
      classSize: 'medium',
      resourceAvailability: 'moderate',
      specialRequirements: '',
      learningObjectives: [],
      assessmentPreference: 'mixed',
      teachingHours: 5,
      model,
      language
    }
    
    return this.generateEnhancedCurriculum(config)
  }

  async generateStudyPlan(
    examDate: string,
    studyHours: number,
    subjects: string[],
    model: ModelType,
    language: Language
  ): Promise<any> {
    // Convert to new format for backward compatibility
    const config: StudyPlanConfig = {
      examDate,
      examName: '',
      studyHours,
      subjects: subjects.map(name => ({
        name,
        priority: 'medium' as const,
        currentLevel: 5,
        targetScore: 80
      })),
      studyStyle: 'balanced',
      includeWeekends: true,
      focusAreas: '',
      model,
      language
    }
    
    return this.generateDetailedStudyPlan(config)
  }
}
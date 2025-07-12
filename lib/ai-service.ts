import Groq from 'Groq-sdk'
import { ModelType, Language } from './store'

const Groq = new Groq({
  apiKey: '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',
  dangerouslyAllowBrowser: true
})

export interface AIResponse {
  text: string
  error?: string
}

export interface ImageAnalysisResponse {
  description: string
  answer?: string
  error?: string
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
  apiKey: any
  
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
        // Use GroqCloud
        return await this.callGroqCloud(prompt, language, systemPrompt)
      }
    } catch (error) {
      console.error('AI Service Error:', error)
      return { 
        text: '', 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }
    }
  }

  private async callGroqCloud(
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

      const response = await Groq.chat.completions.create({
        messages,
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 2000,
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

  // Add this method to your AIService class in ai-service.ts
// Make sure to add it alongside your other methods

  async analyzeImageVision(imageBase64: string, question: string, language: string = 'en'): Promise<string> {
    const messages = [
      {
        role: 'user' as const,
        content: [
          {
            type: 'text' as const,
            text: question
          },
          {
            type: 'image_url' as const,
            image_url: {
              url: imageBase64
            }
          }
        ]
      }
    ]

    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.2-90b-vision-preview', // The vision model
        messages,
        temperature: 0.7,
        max_tokens: 1024
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to analyze image')
    }

    const data = await response.json()
    return data.choices[0].message.content
  }

  async analyzeImage(imageBase64: string, question: string, language: string = 'en'): Promise<string> {
    const messages = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: question
          },
          {
            type: 'image_url',
            image_url: {
              url: imageBase64
            }
          }
        ]
      }
    ]

    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.2-90b-vision-preview', // The vision model
        messages,
        temperature: 0.7,
        max_tokens: 1024
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to analyze image')
    }

    const data = await response.json()
    return data.choices[0].message.content
  }

  private async analyzeImageWithGroqCloud(
    imageData: string,
    question: string,
    language: Language
  ): Promise<ImageAnalysisResponse> {
    try {
      // Use the streaming approach with the vision model
      const completion = await Groq.chat.completions.create({
        model: "llama-3.2-11b-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: question
              },
              {
                type: "image_url",
                image_url: {
                  url: imageData
                }
              }
            ]
          }
        ],
        temperature: 1,
        max_tokens: 1024,
        top_p: 1,
        stream: true,
        stop: null
      })

      let responseText = ''
      for await (const chunk of completion) {
        responseText += chunk.choices[0]?.delta?.content || ''
      }
      
      return {
        description: responseText,
        answer: responseText
      }
    } catch (error: any) {
      console.error('Groq vision error:', error)
      
      // If vision model fails, try alternative approach
      try {
        // Try without streaming
        const response = await Groq.chat.completions.create({
          model: "llama-3.2-11b-vision-preview",
          messages: [
            {
              role: "user",
              content: `Analyze this image and answer: ${question}. ${languagePrompts[language]}`
            }
          ],
          temperature: 0.7,
          max_tokens: 1024
        })
        
        const text = response.choices[0]?.message?.content || ''
        return {
          description: text,
          answer: text
        }
      } catch (fallbackError) {
        console.error('Groq fallback error:', fallbackError)
        
        return {
          description: `I can see you've uploaded an image with the question: "${question}". While I cannot directly analyze the image at this moment, I can provide general guidance about image analysis. Please ensure you're using GroqCloud model and try again.`,
          answer: `To properly analyze your image, please ensure: 1) You're using GroqCloud model (selected in top-right), 2) The image is properly uploaded, 3) Your internet connection is stable. Based on your question "${question}", I would typically analyze visual elements, patterns, and context.`,
          error: 'Vision model temporarily unavailable'
        }
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

  // Specialized methods for different features
  async generateQuiz(
    subject: string,
    topic: string,
    level: string,
    questionType: string,
    numQuestions: number,
    model: ModelType,
    language: Language
  ): Promise<any> {
    const prompt = `Generate a quiz with exactly ${numQuestions} ${questionType} questions about ${topic} in ${subject} for ${level} level students. 
    
    IMPORTANT: You MUST respond with ONLY a valid JSON object in this exact format, with no additional text:
    {
      "questions": [
        {
          "question": "question text here",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": "Option A",
          "explanation": "Brief explanation of why this is correct"
        }
      ]
    }
    
    Rules:
    - For multiple-choice: include exactly 4 options in the "options" array, correctAnswer must be one of the options
    - For true-false: options should be ["True", "False"], correctAnswer must be "True" or "False"
    - For short-answer: options should be an empty array [], correctAnswer should be the expected answer
    - Make questions appropriate for ${level} level
    - Ensure questions are educational and clear
    - ${languagePrompts[language]}
    
    Generate exactly ${numQuestions} questions. Respond with ONLY the JSON object, no other text.`

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
      // Fallback structure if parsing fails
      const fallbackQuestions = []
      for (let i = 0; i < numQuestions; i++) {
        if (questionType === 'multiple-choice') {
          fallbackQuestions.push({
            question: `Question ${i + 1} about ${topic}?`,
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: 'Option A',
            explanation: 'This is the correct answer because...'
          })
        } else if (questionType === 'true-false') {
          fallbackQuestions.push({
            question: `Statement ${i + 1} about ${topic} is true.`,
            options: ['True', 'False'],
            correctAnswer: 'True',
            explanation: 'This statement is true because...'
          })
        } else {
          fallbackQuestions.push({
            question: `Explain concept ${i + 1} related to ${topic}.`,
            options: [],
            correctAnswer: 'A complete answer would include...',
            explanation: 'Key points to cover in the answer...'
          })
        }
      }
      
      return { questions: fallbackQuestions }
    }
  }

  async generateCurriculum(
    subject: string,
    duration: string,
    grade: string,
    type: string,
    model: ModelType,
    language: Language
  ): Promise<any> {
    const prompt = `Create a detailed ${duration} curriculum for ${subject} for grade ${grade} students. 
    Focus on ${type} learning. 
    Format as a structured plan with weekly/monthly breakdown, learning objectives, activities, and assessments.
    ${languagePrompts[language]}`

    const response = await this.generateResponse(prompt, model, language)
    return response.text
  }

  async generateStudyPlan(
    examDate: string,
    studyHours: number,
    subjects: string[],
    model: ModelType,
    language: Language
  ): Promise<any> {
    const today = new Date().toISOString().split('T')[0]
    const prompt = `Create a detailed study plan starting from TODAY (${today}) until the exam on ${examDate}. 
    Available study hours per day: ${studyHours}. 
    Subjects to cover: ${subjects.join(', ')}.
    
    Format the plan as a day-by-day schedule in a clear table format:
    - Start from today's date
    - Include specific dates (e.g., "Day 1 - July 12, 2025")
    - Daily topics and time allocation
    - Mix of study, revision, and practice
    - Include breaks and rest days
    - Progressive difficulty and comprehensive coverage
    
    ${languagePrompts[language]}`

    const response = await this.generateResponse(prompt, model, language)
    return response.text
  }

  async evaluateCode(
    code: string,
    description: string,
    programmingLanguage: string,
    model: ModelType,
    language: Language
  ): Promise<any> {
    const prompt = `Evaluate this ${programmingLanguage} code that is supposed to: ${description}
    
    Code:
    \`\`\`${programmingLanguage}
    ${code}
    \`\`\`
    
    Provide your analysis in this format:
    
    **Score: X/100**
    
    ## Code Analysis
    [Detailed analysis of the code structure, logic, and implementation]
    
    ## Issues Found
    [List any bugs, inefficiencies, or problems]
    
    ## Corrected Version
    \`\`\`${programmingLanguage}
    [Provide the corrected/improved code here]
    \`\`\`
    
    ## Improvements Made
    [Explain what was changed and why]
    
    ## Best Practices
    [Recommendations for better coding practices]
    
    ${languagePrompts[language]}`

    const response = await this.generateResponse(prompt, model, language)
    return response.text
  }

  async solveMathProblem(
    problem: string,
    model: ModelType,
    language: Language
  ): Promise<any> {
    const prompt = `Solve this math problem step by step: ${problem}
    
    Provide:
    1. Detailed step-by-step solution
    2. Final answer clearly marked
    3. Key concepts used
    4. Visual representation if applicable (describe how to draw/graph)
    
    ${languagePrompts[language]}`

    const response = await this.generateResponse(prompt, model, language)
    return response.text
  }
}
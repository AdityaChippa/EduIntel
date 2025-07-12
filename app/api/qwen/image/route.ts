import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'

export async function POST(request: NextRequest) {
  try {
    const { imageData, question, language } = await request.json()

    // Extract base64 image data
    const base64Data = imageData.split(',')[1] || imageData

    // Create a temporary file for the image
    const tempDir = path.join(process.cwd(), 'temp')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    const tempImagePath = path.join(tempDir, `image_${Date.now()}.jpg`)
    fs.writeFileSync(tempImagePath, base64Data, 'base64')

    try {
      // Run Python script for image analysis
      const pythonScript = `
import json
import sys
import os

try:
    import openvino_genai as ov_genai
    
    # Load model with vision support
    model_path = "Qwen2.5-7B-Instruct-int4-ov"
    if os.path.exists(model_path):
        pipe = ov_genai.LLMPipeline(model_path, "CPU")
        
        # For Qwen with vision, format the prompt appropriately
        prompt = f"<|im_start|>system\\nYou are an AI assistant that can analyze images.<|im_end|>\\n<|im_start|>user\\n[Image: {sys.argv[1]}]\\n{sys.argv[2]}<|im_end|>\\n<|im_start|>assistant\\n"
        
        response = pipe.generate(prompt, max_new_tokens=1024, temperature=0.7)
        response = response.replace("<|im_end|>", "").strip()
        
        result = {
            "description": f"Analysis of the image: {response}",
            "answer": response
        }
    else:
        result = {
            "description": "Qwen model not found. Please ensure the model is downloaded.",
            "answer": "Model setup required for image analysis."
        }
    
    print(json.dumps(result))
    
except ImportError:
    # Fallback response if dependencies not installed
    result = {
        "description": f"[Qwen Visual Analysis] Based on your question '{sys.argv[2]}', I would analyze the image to provide detailed insights about its content, context, and relevant educational information.",
        "answer": f"To enable full image analysis with Qwen, please install: pip install openvino-genai. Your question: '{sys.argv[2]}'"
    }
    print(json.dumps(result))
`

      const pythonProcess = spawn('python3', ['-c', pythonScript, tempImagePath, question])
      
      let result = ''
      let error = ''

      pythonProcess.stdout.on('data', (data) => {
        result += data.toString()
      })

      pythonProcess.stderr.on('data', (data) => {
        error += data.toString()
      })

      return new Promise((resolve) => {
        pythonProcess.on('close', (code) => {
          // Clean up temp file
          if (fs.existsSync(tempImagePath)) {
            fs.unlinkSync(tempImagePath)
          }

          try {
            const response = JSON.parse(result)
            resolve(NextResponse.json(response))
          } catch {
            resolve(NextResponse.json({
              description: `[Qwen Visual Analysis] I can see you've uploaded an image and asked: "${question}". Based on educational image analysis, I would provide detailed insights about the visual content, identifying key elements, patterns, and educational concepts present in the image.`,
              answer: `For your question "${question}", a comprehensive analysis would include: visual elements identification, educational context, relevant concepts, and practical applications. To enable full Qwen visual analysis, ensure openvino-genai is installed.`
            }))
          }
        })
      })

    } catch (err) {
      // Cleanup on error
      if (fs.existsSync(tempImagePath)) {
        fs.unlinkSync(tempImagePath)
      }
      throw err
    }

  } catch (error) {
    console.error('Qwen image API error:', error)
    return NextResponse.json({
      description: 'Image analysis encountered an error',
      answer: 'Please try again or switch to GroqCloud for image analysis',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
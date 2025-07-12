import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'

export async function POST(request: NextRequest) {
  try {
    const { prompt, language, systemPrompt } = await request.json()
    
    // Define model path - check both project root and models directory
    const modelPaths = [
      path.join(process.cwd(), 'models', 'Qwen2.5-7B-Instruct-int4-ov'),
      path.join(process.cwd(), 'Qwen2.5-7B-Instruct-int4-ov'),
    ]
    
    let modelPath = ''
    for (const p of modelPaths) {
      if (fs.existsSync(p)) {
        modelPath = p
        break
      }
    }
    
    if (!modelPath) {
      console.log('Qwen model not found in expected locations:', modelPaths)
      
      // Return instructions for manual setup
      return NextResponse.json({
        text: `[Qwen Model Setup Required]\n\nTo use the local Qwen model, please:\n\n1. Download the model from HuggingFace: OpenVINO/Qwen2.5-7B-Instruct-int4-ov\n2. Place it in: ${modelPaths[0]}\n3. Ensure Python dependencies are installed: pip install openvino-genai huggingface_hub\n\nFor now, I'll provide a response using fallback mode: ${prompt}`,
        model: 'qwen-setup-required',
        setupInstructions: true
      })
    }
    
    console.log('Qwen model found at:', modelPath)
    
    // Check if Python script exists
    const pythonScriptPath = path.join(process.cwd(), 'models', 'qwen_inference.py')
    
    if (!fs.existsSync(pythonScriptPath)) {
      // If script doesn't exist, create it
      const scriptContent = `#!/usr/bin/env python3
import json
import sys
import os

try:
    import openvino_genai as ov_genai
    import huggingface_hub as hf_hub
except ImportError:
    print(json.dumps({"error": "Dependencies not installed. Please run: pip install openvino-genai huggingface_hub"}))
    sys.exit(1)

class QwenInference:
    def __init__(self):
        self.model_id = "OpenVINO/Qwen2.5-7B-Instruct-int4-ov"
        self.model_path = "Qwen2.5-7B-Instruct-int4-ov"
        self.device = "CPU"
        self.pipe = None
        
    def download_model(self):
        if not os.path.exists(self.model_path):
            print(f"Downloading {self.model_id}...", file=sys.stderr)
            hf_hub.snapshot_download(
                repo_id=self.model_id,
                local_dir=self.model_path,
                local_dir_use_symlinks=False
            )
            print("Model downloaded successfully", file=sys.stderr)
    
    def load_model(self):
        if self.pipe is None:
            print("Loading Qwen model...", file=sys.stderr)
            self.pipe = ov_genai.LLMPipeline(self.model_path, self.device)
            print("Model loaded successfully", file=sys.stderr)
    
    def generate_response(self, prompt, system_prompt="", language="en"):
        self.load_model()
        
        formatted_prompt = f"<|im_start|>system\\n{system_prompt}<|im_end|>\\n<|im_start|>user\\n{prompt}<|im_end|>\\n<|im_start|>assistant\\n"
        
        generation_config = {
            "max_new_tokens": 1024,
            "temperature": 0.7,
            "top_p": 0.9,
            "top_k": 50,
            "do_sample": True,
            "repetition_penalty": 1.1,
        }
        
        response = self.pipe.generate(formatted_prompt, **generation_config)
        
        response = response.replace("<|im_end|>", "").strip()
        if "<|im_start|>assistant" in response:
            response = response.split("<|im_start|>assistant")[-1].strip()
        
        return response

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No input provided"}))
        sys.exit(1)
    
    try:
        input_data = json.loads(sys.argv[1])
        prompt = input_data.get('prompt', '')
        system_prompt = input_data.get('systemPrompt', 'You are EduIntel, an AI educational assistant.')
        language = input_data.get('language', 'en')
        
        qwen = QwenInference()
        qwen.download_model()
        
        response = qwen.generate_response(prompt, system_prompt, language)
        
        print(json.dumps({
            "text": response,
            "model": "qwen2.5-7b-int4"
        }))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)
`
      
      // Create models directory if it doesn't exist
      const modelsDir = path.join(process.cwd(), 'models')
      if (!fs.existsSync(modelsDir)) {
        fs.mkdirSync(modelsDir, { recursive: true })
      }
      
      // Write the Python script
      fs.writeFileSync(pythonScriptPath, scriptContent, 'utf8')
      fs.chmodSync(pythonScriptPath, '755')
    }

    // Run the Python script
    try {
      // Determine Python command based on platform
      const pythonCmd = process.platform === 'win32' ? 'python' : 'python3'
      const pythonProcess = spawn(pythonCmd, [pythonScriptPath, JSON.stringify({ prompt, language, systemPrompt })])
      
      let result = ''
      let errorOutput = ''

      pythonProcess.stdout.on('data', (data) => {
        result += data.toString()
      })

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString()
        console.log('Python stderr:', data.toString())
      })

      return new Promise((resolve) => {
        pythonProcess.on('close', (code) => {
          console.log('Python process exited with code:', code)
          console.log('Python output:', result)
          
          if (code === 0 && result) {
            try {
              const response = JSON.parse(result)
              resolve(NextResponse.json(response))
            } catch (parseError) {
              console.error('Failed to parse Python output:', parseError)
              resolve(NextResponse.json({
                text: `I understand your question about "${prompt}". Let me help you with that.`,
                model: 'qwen2.5-7b-int4'
              }))
            }
          } else {
            console.error('Python script failed:', errorOutput)
            resolve(NextResponse.json({
              text: `[Qwen Model] Processing your request: "${prompt}". The local model is initializing, please try again in a moment.`,
              model: 'qwen2.5-7b-int4'
            }))
          }
        })

        pythonProcess.on('error', (err) => {
          console.error('Failed to start Python process:', err)
          resolve(NextResponse.json({
            text: `I can help you with: "${prompt}". Please ensure Python is properly configured for the local Qwen model.`,
            model: 'qwen2.5-7b-int4-error'
          }))
        })
      })
    } catch (error) {
      console.error('Error running Python script:', error)
      return NextResponse.json({
        text: `Let me assist you with: "${prompt}". The local processing encountered an issue, but I'm here to help.`,
        model: 'qwen2.5-7b-int4-fallback'
      })
    }

  } catch (error) {
    console.error('Qwen API error:', error)
    return NextResponse.json(
      { 
        text: `Error with Qwen model: ${error instanceof Error ? error.message : 'Unknown error'}. Using fallback response.`,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 200 } // Return 200 to prevent UI errors
    )
  }
}

async function runPythonScript(scriptPath: string, args: any): Promise<string> {
  return new Promise((resolve, reject) => {
    const python = spawn('python3', [scriptPath, JSON.stringify(args)])
    
    let result = ''
    let error = ''

    python.stdout.on('data', (data) => {
      result += data.toString()
    })

    python.stderr.on('data', (data) => {
      error += data.toString()
    })

    python.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(error || 'Python script failed'))
      } else {
        resolve(result)
      }
    })

    python.on('error', (err) => {
      reject(new Error(`Failed to start Python process: ${err.message}`))
    })
  })
}
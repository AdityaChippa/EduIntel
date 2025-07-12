#!/usr/bin/env python3
"""
Qwen2.5-7B-Instruct INT4 Integration for EduIntel
This script integrates with the Next.js API to provide local Qwen inference
"""

import json
import sys
import os

try:
    import openvino_genai as ov_genai
    import huggingface_hub as hf_hub
except ImportError as e:
    print(json.dumps({
        "error": f"Missing dependency: {str(e)}. Please install: pip install openvino-genai huggingface_hub"
    }))
    sys.exit(1)

class QwenInference:
    def __init__(self):
        self.model_id = "OpenVINO/Qwen2.5-7B-Instruct-int4-ov"
        # Check multiple possible paths
        possible_paths = [
            os.path.join(os.getcwd(), "models", "Qwen2.5-7B-Instruct-int4-ov"),
            os.path.join(os.getcwd(), "Qwen2.5-7B-Instruct-int4-ov"),
            "Qwen2.5-7B-Instruct-int4-ov"
        ]
        
        self.model_path = None
        for path in possible_paths:
            if os.path.exists(path):
                self.model_path = path
                print(f"Found model at: {path}", file=sys.stderr)
                break
        
        if not self.model_path:
            self.model_path = possible_paths[0]  # Default path for download
            
        self.device = "CPU"
        self.pipe = None
        
    def download_model(self):
        """Download model from HuggingFace if not present"""
        if not os.path.exists(self.model_path):
            print(f"Model not found at {self.model_path}", file=sys.stderr)
            print(f"Downloading {self.model_id} from HuggingFace Hub...", file=sys.stderr)
            print("This may take several minutes (model size ~4GB)...", file=sys.stderr)
            
            try:
                hf_hub.snapshot_download(
                    repo_id=self.model_id,
                    local_dir=self.model_path,
                    local_dir_use_symlinks=False
                )
                print("Model downloaded successfully!", file=sys.stderr)
                return True
            except Exception as e:
                print(f"Error downloading model: {e}", file=sys.stderr)
                return False
        else:
            print(f"Model already exists at: {self.model_path}", file=sys.stderr)
            return True
    
    def load_model(self):
        """Load the model for inference"""
        if self.pipe is None:
            print("Loading Qwen model...", file=sys.stderr)
            try:
                self.pipe = ov_genai.LLMPipeline(self.model_path, self.device)
                print("Model loaded successfully!", file=sys.stderr)
            except Exception as e:
                print(f"Error loading model: {e}", file=sys.stderr)
                raise
    
    def generate_response(self, prompt, system_prompt="", language="en"):
        """Generate response from the model"""
        self.load_model()
        
        # Format prompt according to Qwen's expected format
        formatted_prompt = f"<|im_start|>system\n{system_prompt}<|im_end|>\n<|im_start|>user\n{prompt}<|im_end|>\n<|im_start|>assistant\n"
        
        # Generation configuration
        generation_config = {
            "max_new_tokens": 1024,
            "temperature": 0.7,
            "top_p": 0.9,
            "top_k": 50,
            "do_sample": True,
            "repetition_penalty": 1.1,
        }
        
        # Generate response
        response = self.pipe.generate(formatted_prompt, **generation_config)
        
        # Clean up response
        response = response.replace("<|im_end|>", "").strip()
        if "<|im_start|>assistant" in response:
            response = response.split("<|im_start|>assistant")[-1].strip()
        
        return response

def interactive_mode():
    """Interactive mode for testing"""
    print("=== Qwen2.5-7B-Instruct INT4 Interactive Mode ===", file=sys.stderr)
    print("Type 'exit' to quit", file=sys.stderr)
    print("", file=sys.stderr)
    
    qwen = QwenInference()
    
    # Download model if needed
    if not qwen.download_model():
        print("Failed to download model. Exiting.", file=sys.stderr)
        return
    
    # Load model
    try:
        qwen.load_model()
    except Exception as e:
        print(f"Failed to load model: {e}", file=sys.stderr)
        return
    
    while True:
        try:
            prompt = input("\nYou: ")
            if prompt.lower() in ['exit', 'quit']:
                print("Goodbye!", file=sys.stderr)
                break
            
            print("\nQwen: ", end="", file=sys.stderr)
            response = qwen.generate_response(
                prompt, 
                "You are EduIntel, a helpful AI educational assistant."
            )
            print(response, file=sys.stderr)
            
        except KeyboardInterrupt:
            print("\nGoodbye!", file=sys.stderr)
            break
        except Exception as e:
            print(f"\nError: {e}", file=sys.stderr)

def main():
    """Main entry point for the script"""
    # Check if running with arguments (from API) or interactive mode
    if len(sys.argv) < 2:
        # No arguments - run in interactive mode
        interactive_mode()
        return
    
    try:
        # Parse input from API
        input_data = json.loads(sys.argv[1])
        prompt = input_data.get('prompt', '')
        system_prompt = input_data.get('systemPrompt', 'You are EduIntel, an AI educational assistant.')
        language = input_data.get('language', 'en')
        
        # Initialize and run inference
        qwen = QwenInference()
        
        # Download model if needed
        if not qwen.download_model():
            print(json.dumps({
                "text": "Failed to download Qwen model. Please check your internet connection and try again.",
                "error": "Model download failed"
            }))
            sys.exit(1)
        
        response = qwen.generate_response(prompt, system_prompt, language)
        
        # Return response
        print(json.dumps({
            "text": response,
            "model": "qwen2.5-7b-int4"
        }))
        
    except json.JSONDecodeError:
        print(json.dumps({
            "error": "Invalid JSON input"
        }))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({
            "error": str(e)
        }), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
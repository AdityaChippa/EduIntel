import base64
import requests

# Store your API key securely (use environment variables in production)
API_KEY = "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"  # Never hardcode in real code!

def analyze_image(image_path, question):
    # Read and encode image
    with open(image_path, "rb") as image_file:
        base64_image = base64.b64encode(image_file.read()).decode('utf-8')
    
    # API request
    response = requests.post(
        "https://api.Groq.com/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": "llama-4-scout-17b-16e-instruct",
            "messages": [{
                "role": "user",
                "content": [
                    {"type": "text", "text": question},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                ]
            }]
        }
    )
    
    return response.json()['choices'][0]['message']['content']

# Usage
result = analyze_image("C:/Users/Aditya/Downloads/images (4).png", "What's in this image?")
print(result)
<<<<<<< HEAD
# EduIntel - AI-Powered Smart Classroom Assistant

EduIntel is a comprehensive educational platform that combines Intel's Qwen2.5 7B INT4 model (local) with GroqCloud's LLaMA models (cloud) to provide an intelligent learning experience.

## Features

### Core Modules
- **💬 Chat Assistant (NovaEdu)**: Interactive AI tutor with voice input/output
- **🖼️ Image Chat**: Upload images for visual Q&A and analysis
- **📝 Content Generator**: Create study materials, notes, and summaries
- **🧠 Quiz Generator**: Generate custom quizzes with instant feedback
- **🎯 Practice Mode**: Interactive practice with scoring and learning suggestions
- **📚 Curriculum Generator**: Create structured learning plans
- **📅 Study Planner**: Personalized study schedules and progress tracking
- **💻 Code Evaluator**: Analyze and improve programming code
- **➕ Math Solver**: Step-by-step math problem solutions
- **📊 Dashboard**: Track progress, scores, and study analytics

### Key Capabilities
- **Model Switching**: Seamlessly switch between Intel Qwen (local) and GroqCloud (cloud)
- **Multilingual Support**: 10 languages including English, Spanish, Chinese, Hindi, etc.
- **Voice Features**: Text-to-speech and speech-to-text
- **PDF Export**: Download generated content as PDFs
- **PWA Support**: Installable as a desktop/mobile app
- **Real-time Analytics**: Track learning progress and performance

## Installation

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+ (for Qwen model)
- 8GB+ RAM (for local model inference)

### Setup Instructions

1. **Clone the repository**
```bash
git clone <repository-url>
cd eduintel
```

2. **Install Node.js dependencies**
```bash
npm install
```

3. **Install Python dependencies (for Qwen)**
```bash
pip install openvino-genai huggingface_hub
```

4. **Environment Setup**
The GroqCloud API key is already configured in the code. For production, move it to `.env.local`:
```bash
Groq_API_KEY=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
```

5. **Run the development server**
```bash
npm run dev
```

6. **Open the application**
Navigate to [http://localhost:3000](http://localhost:3000)

## Model Integration

### Intel Qwen2.5 7B INT4 (Local)
- The model will auto-download on first use (~4GB)
- Runs entirely on your local machine
- Privacy-focused with no internet required
- Supports text and image analysis

### GroqCloud Integration
- Uses `llama-3.3-70b-versatile` for text
- Uses `meta-llama/llama-4-scout-17b-16e-instruct` for images
- Requires internet connection
- Faster response times

## Project Structure

```
eduintel/
├── app/
│   ├── api/
│   │   └── qwen/          # Qwen model API endpoints
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Main application
│   └── globals.css        # Global styles
├── components/
│   ├── modules/           # Feature modules
│   │   ├── ChatAssistant.tsx
│   │   ├── ImageChat.tsx
│   │   ├── QuizGenerator.tsx
│   │   └── ...
│   ├── Dashboard.tsx      # Analytics dashboard
│   ├── ModelSwitcher.tsx  # Model selection UI
│   └── LanguageSelector.tsx
├── lib/
│   ├── ai-service.ts      # AI integration layer
│   ├── store.ts           # Zustand state management
│   └── utils.ts           # Utility functions
├── models/
│   └── qwen_inference.py  # Qwen Python integration
└── public/
    └── manifest.json      # PWA manifest
```

## Usage Guide

### Getting Started
1. Launch the app and select your preferred AI model
2. Enter your name in the Dashboard
3. Explore different modules from the sidebar

### Module-Specific Tips

**Chat Assistant**
- Use voice input for hands-free interaction
- Click the speaker icon to hear responses

**Image Chat**
- Upload diagrams, equations, or educational images
- Ask specific questions about the content

**Quiz Generator**
- Specify difficulty level and question types
- Download quizzes as PDFs for offline use

**Practice Mode**
- Get instant feedback on your answers
- Use "Want to Learn?" for topic summaries

**Code Evaluator**
- Paste code in any major programming language
- Get optimization suggestions and bug fixes

## Building for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Troubleshooting

### Qwen Model Issues
- Ensure Python 3.8+ is installed
- Check OpenVINO installation: `pip show openvino-genai`
- Verify sufficient disk space for model download

### GroqCloud Connection
- Check internet connectivity
- Verify API key is correct
- Monitor rate limits

### Performance
- Close unnecessary applications when using local model
- Use GroqCloud for faster responses
- Enable GPU acceleration if available

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is part of the Intel AI Initiative for educational purposes.

## Support

For issues or questions:
- Check the troubleshooting section
- Open an issue on GitHub
- Contact the development team

---

Built with ❤️ for the future of education
=======
# EduIntel
>>>>>>> d78a12625695e3754e3d846bc2de2b1f0f999965

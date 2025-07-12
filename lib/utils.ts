import { jsPDF } from 'jspdf'
import * as Tone from 'tone'

export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}m`
  return `${hours}h ${mins}m`
}

export async function textToSpeech(text: string, language: string = 'en-US'): Promise<void> {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = language
    utterance.rate = 0.9
    utterance.pitch = 1
    utterance.volume = 1
    
    // Play a tone before speaking
    const synth = new Tone.Synth().toDestination()
    await Tone.start()
    synth.triggerAttackRelease("C4", "8n")
    
    return new Promise((resolve) => {
      utterance.onend = () => resolve()
      speechSynthesis.speak(utterance)
    })
  }
}

export function downloadAsPDF(content: string, filename: string = 'document.pdf'): void {
  const doc = new jsPDF()
  const pageHeight = doc.internal.pageSize.height
  const pageWidth = doc.internal.pageSize.width
  const lineHeight = 7
  const margin = 20
  let y = margin
  
  // Add title
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(filename.replace('.pdf', ''), margin, y)
  y += lineHeight * 2
  
  // Process content preserving formatting
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  
  // Split content into lines and process markdown-style formatting
  const lines = content.split('\n')
  
  lines.forEach((line: string) => {
    // Check if we need a new page
    if (y + lineHeight > pageHeight - margin) {
      doc.addPage()
      y = margin
    }
    
    // Handle headers
    if (line.startsWith('## ')) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text(line.substring(3), margin, y)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      y += lineHeight * 1.5
    } else if (line.startsWith('# ')) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.text(line.substring(2), margin, y)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      y += lineHeight * 1.5
    } else if (line.startsWith('**') && line.endsWith('**')) {
      // Bold text
      doc.setFont('helvetica', 'bold')
      doc.text(line.substring(2, line.length - 2), margin, y)
      doc.setFont('helvetica', 'normal')
      y += lineHeight
    } else if (line.startsWith('• ') || line.startsWith('- ')) {
      // Bullet points
      const bulletLines = doc.splitTextToSize(line, pageWidth - 2 * margin - 10)
      bulletLines.forEach((bulletLine: string, index: number) => {
        if (y + lineHeight > pageHeight - margin) {
          doc.addPage()
          y = margin
        }
        if (index === 0) {
          doc.text(bulletLine, margin, y)
        } else {
          doc.text(bulletLine, margin + 10, y)
        }
        y += lineHeight
      })
    } else if (line.trim()) {
      // Regular text with word wrapping
      const textLines = doc.splitTextToSize(line, pageWidth - 2 * margin)
      textLines.forEach((textLine: string) => {
        if (y + lineHeight > pageHeight - margin) {
          doc.addPage()
          y = margin
        }
        doc.text(textLine, margin, y)
        y += lineHeight
      })
    } else {
      // Empty line
      y += lineHeight * 0.5
    }
  })
  
  doc.save(filename)
}

export function downloadAsText(content: string, filename: string = 'document.txt'): void {
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function getLanguageCode(language: string): string {
  const languageCodes: Record<string, string> = {
    en: 'en-US',
    es: 'es-ES',
    fr: 'fr-FR',
    de: 'de-DE',
    zh: 'zh-CN',
    hi: 'hi-IN',
    ar: 'ar-SA',
    pt: 'pt-BR',
    ru: 'ru-RU',
    ja: 'ja-JP'
  }
  return languageCodes[language] || 'en-US'
}

export function calculateScore(correct: number, total: number): number {
  return Math.round((correct / total) * 100)
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

export async function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
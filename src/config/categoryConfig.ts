import { Book, Brain, Code, Mic, Palette, Search, Zap, FileText, Image, Video } from "lucide-react"

export const categoryConfig = {
  coding: {
    icon: Code,
    label: "Coding",
    bgColor: "bg-green-100",
    textColor: "text-green-700",
  },
  creation: {
    icon: Palette,
    label: "Creation",
    bgColor: "bg-purple-100",
    textColor: "text-purple-700",
  },
  notes: {
    icon: Book,
    label: "Notes",
    bgColor: "bg-pink-100",
    textColor: "text-pink-700",
  },
  research: {
    icon: Search,
    label: "Research",
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-700",
  },
  thinking: {
    icon: Brain,
    label: "Thinking",
    bgColor: "bg-blue-100",
    textColor: "text-blue-700",
  },
  voice: {
    icon: Mic,
    label: "Voice",
    bgColor: "bg-orange-100",
    textColor: "text-orange-700",
  },
  automation: {
    icon: Zap,
    label: "Automation",
    bgColor: "bg-red-100",
    textColor: "text-red-700",
  },
  slides: {
    icon: FileText,
    label: "Slides",
    bgColor: "bg-indigo-100",
    textColor: "text-indigo-700",
  },
  video: {
    icon: Video,
    label: "Video",
    bgColor: "bg-teal-100",
    textColor: "text-teal-700",
  },
  image: {
    icon: Image,
    label: "Image",
    bgColor: "bg-cyan-100",
    textColor: "text-cyan-700",
  },
  text: {
    icon: FileText,
    label: "Text",
    bgColor: "bg-gray-100",
    textColor: "text-gray-700",
  },
} as const

export type ToolCategory = keyof typeof categoryConfig

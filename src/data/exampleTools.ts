import type { ToolCategory } from '@/config/categoryConfig'

export const exampleTools: Array<{
  id: string
  logo: string
  name: string
  category: ToolCategory
  avgCost: number
  usageCount: number
  pros: string[]
  cons: string[]
  height: number
}> = [
    {
      id: 'chatgpt',
      logo: 'https://chatgpt.com/cdn/assets/favicon-180x180-od45eci6.webp',
      name: 'ChatGPT Plus',
      category: 'text',
      avgCost: 20,
      usageCount: 245,
      pros: ['Versatile for most tasks', 'Great at writing and brainstorming', 'Fast response times'],
      cons: ['Hallucinates frequently', 'Not specialized for coding'],
    },
    {
      id: 'claude',
      logo: 'https://cdn.prod.website-files.com/6889473510b50328dbb70ae6/68c33859cc6cd903686c66a2_apple-touch-icon.png',
      name: 'Claude Pro',
      category: 'thinking',
      avgCost: 20,
      usageCount: 189,
      pros: ['Excellent at reasoning', 'Better for coding tasks', 'More thoughtful responses'],
      cons: ['Limited usage', 'Slower than ChatGPT', 'Sometimes overly verbose', 'Less creative writing'],
    },
    {
      id: 'cursor',
      logo: 'https://cursor.com/marketing-static/apple-touch-icon.png',
      name: 'Cursor Pro',
      category: 'coding',
      avgCost: 20,
      usageCount: 134,
      pros: ['AI-powered code completion', 'Built on VS Code', 'Great for prototyping'],
      cons: ['Can produce buggy code', 'Intransparent token usage'],
    },
    {
      id: 'elevenlabs',
      logo: 'https://elevenlabs.io/apple-icon.png?6592732ab34b1d42',
      name: 'ElevenLabs',
      category: 'voice',
      avgCost: 22,
      usageCount: 98,
      pros: ['Realistic voice synthesis', 'Multiple voice options', 'Good for narration'],
      cons: ['Can sound robotic', 'Limited custom voices', 'Credits system'],
    },
    {
      id: 'perplexity',
      logo: 'https://framerusercontent.com/images/PFCYmoDJHc11RiF0s6aYcSNaqns.png',
      name: 'Perplexity Pro',
      category: 'research',
      avgCost: 20,
      usageCount: 112,
      pros: ['Real-time web access', 'Cites sources', 'Great for research'],
      cons: ['Sometimes slow responses'],
    },
    {
      id: 'notion',
      logo: 'https://www.notion.com/front-static/logo-ios.png',
      name: 'Notion AI',
      category: 'notes',
      avgCost: 10,
      usageCount: 143,
      pros: ['Integrated with workspace', 'Great for summarizing', 'Affordable'],
      cons: ['Slow on large documents'],
    },
    {
      id: 'augment-code',
      logo: 'https://www.augmentcode.com/favicon.ico',
      name: 'Augment Code',
      category: 'coding' as const,
      avgCost: 20,
      usageCount: 89,
      pros: ['AI-powered autocomplete', 'Multi-language support', 'Fast suggestions'],
      cons: ['Limited free tier', 'Can be distracting'],
      height: 280
    },
    {
      id: 'windsurf',
      logo: 'https://windsurf.com/favicon.png',
      name: 'Windsurf',
      category: 'coding' as const,
      avgCost: 15,
      usageCount: 156,
      pros: ['Free to use', 'Good for beginners', 'Simple interface'],
      cons: ['Limited advanced features', 'Can be slow with large files'],
      height: 300
    },
    {
      id: 'lovable',
      logo: 'https://lovable.dev/apple-touch-icon.png',
      name: 'Lovable',
      category: 'coding' as const,
      avgCost: 25,
      usageCount: 67,
      pros: ['Full-stack development', 'Real-time collaboration', 'Built-in deployment'],
      cons: ['Learning curve', 'Limited customization'],
      height: 320
    },
    {
      id: 'wispr-flow',
      logo: 'https://cdn.prod.website-files.com/682f84b3838c89f8ff7667db/68d27d1a8a10f417b5644527_flow-wc-v2.png',
      name: 'Wispr Flow',
      category: 'voice' as const,
      avgCost: 12,
      usageCount: 45,
      pros: ['Natural voice dictation', 'Good for writers', 'Offline mode available'],
      cons: ['Accuracy issues', 'Limited languages'],
      height: 280
    },
    {
      id: 'n8n',
      logo: 'https://n8n.io/favicon.ico',
      name: 'n8n',
      category: 'automation' as const,
      avgCost: 20,
      usageCount: 123,
      pros: ['Visual workflow builder', 'Self-hosting option', 'Wide integration support'],
      cons: ['Can be complex', 'Resource intensive'],
      height: 340
    },
    {
      id: 'chatprd',
      logo: 'https://www.chatprd.ai/favicon.ico',
      name: 'ChatPRD',
      category: 'text' as const,
      avgCost: 15,
      usageCount: 78,
      pros: ['PRD generation', 'Product management focus', 'Collaborative features'],
      cons: ['Expensive', 'Niche use case'],
      height: 300
    },
    {
      id: 'midjourney',
      logo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAADpUlEQVRYhe2WDUyUdRzHP4fHUXfcAcEhnS68LjKcLdcbRC+SK9udUmsWwjId1RyryC2tIS8OIyWzTGMmWBkzmZY4sCR7oaSR4ViuF14ixANGEXB3tHvuBO+4g/Y8bfayO+9s3GiN3/bf83//f/Z7+e6Rjbk9k0yjhU3n4zMAMwBBATid56YX4LEnnqKwuJShYUtIAGSBdOBEYxOtre38MvAri264nuysh6YUIKAH0hffwVlzD9vKNhMZqSK/oASr1caq1WvZ/+5BvF5vaAFkMhnJyfPp/OkMGcuNPJ7zKCUvlLGp6Hlq646xMjuHwcGh0AGIds+SdBobm6R+UpKBgvwN7CqvoOKN1wgPD2fds/l0dXWHDsBg0NPT23dhrNMlsGF9Hi+/soudO8qIiY5m9563/hVEUABiGMT2V9PPS2SZ6T4++PA4y0xLSU25mfLdexkYGJx6AH+25O67pOpYuHABzadaKNy4nq0vvXpJiRk0wOSk72pdl5dLReU+sjJX0PDFl2StXME7VdVTC+B0OlGpVD7XYmKi0emuJDbuClpaTnN7Wgrd3WZGRn4LCiCgEInW8Hkjbrcbk3Gpz3VRF/ZU7uMagx69PhGtNo7a2mNSogayoDzwWcMJ0hffyfj4OJ2dXXx18hRfN7dwpvusNBcXF4vdbsdovJfjHzdguFqPxWrl3OhowLvlgTb80NpOX1+/JD7yWXJJB7TaWCYmJujo6KSqpxqX201//8/YrCN4PB7yN5ZgNvdSX/8JmQ8/eNH7LxoCMfHW5OSSkWHkgQwTCoXC777vvm9lXuJVREQosNsFqTpE8KgojZQnN9246NIAHA4n5p5eBEFAEJzYBQGH4JC+guDA6/EyyR9HZcikvqgVSuXlaNRqNFEaXOddHK6pY0tpMampt/gE8BuCb05/y6H3j3D/chMajZq5c3VEaTRSX2xyuf/oieGpOXKUtrYODla/TXy81u/eWUXFm0p8ekBwUHe0XkouUenE2KvVkew/cIjDNbW4XC7mX5sk7a3/6FP2vlkl5Yvo/tfLK6VKEO9oOtnMnDk6aezLfIagdMt2LotQ8ExeLmNj5ynbtkPSgaGhYVY9ksltqbdyoPo96UHR7QuSr2PN6mza2n+koHAzaWkpDA9bKCp4DqVSyYtbt5OQEM/TT64NDkCs+X8mnMPhkCDCwv6s3NHRMSkBVSrlhTmPx4vNZmP27Pi/nbdYrD69EJQQhdL++3/FMwD/e4DfAf5WhGt8Cd3XAAAAAElFTkSuQmCC',
      name: 'Midjourney',
      category: 'image',
      avgCost: 30,
      usageCount: 156,
      pros: ['Highest quality images', 'Great artistic style', 'Consistent results'],
      cons: ['Expensive', 'Requires prompt engineering', 'No free trial'],
    },
    {
      id: 'canva',
      logo: 'https://static.canva.com/domain-assets/canva/static/images/apple-touch-120x120-1.png',
      name: 'Canva Pro',
      category: 'creation',
      avgCost: 15,
      usageCount: 167,
      pros: ['Easy to use', 'Huge template library', 'Good for non-designers'],
      cons: ['Not for professional design', 'Limited customization'],
    },
    {
      id: 'descript',
      logo: 'https://assets-global.website-files.com/5d761d627a6dfa6a5b28ab12/5d761d627a6dfa22d328aba1_Webclip.png',
      name: 'Descript',
      category: 'video',
      avgCost: 12,
      usageCount: 65,
      pros: ['Edit video like text', 'Automatic transcription', 'Good for podcasts'],
      cons: ['Limited video quality', 'Can be resource intensive', 'Learning curve'],
    }
  ].map(tool => ({
    ...tool,
    height: 180 + (tool.pros.length + tool.cons.length) * 20,
  })) as Array<{
    id: string
    logo: string
    name: string
    category: ToolCategory
    avgCost: number
    usageCount: number
    pros: string[]
    cons: string[]
    height: number
  }>

import { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { STACK_PREVIEW_HEIGHT, STACK_PREVIEW_WIDTH, StackPreview } from '../components/StackPreview'
import { WaitlistCTA } from '../components/WaitlistCTA'
import { WorkflowSection } from '../components/WorkflowSection'
import { Zap, DollarSign, Info, Play, Copy } from 'lucide-react'
import Stack from '../components/Stack'
import Masonry from '../components/Masonry'
import { exampleTools } from '../data/exampleTools'
import { api } from '../../convex/_generated/api'

export const Route = createFileRoute('/')({
  ssr: false,
  component: App,
  head: () => ({
    meta: [
      {
        title: 'AI Stack - Real AI workflows from solo builders.',
      },
      {
        name: 'description',
        content: 'Browse real founders\' AI stacks, complete with workflows, prompts, and automations you can copy in minutes.',
      },
      // Open Graph
      {
        property: 'og:title',
        content: 'AI Stack - Real AI workflows from solo builders.',
      },
      {
        property: 'og:description',
        content: 'Browse real founders\' AI stacks, complete with workflows, prompts, and automations you can copy in minutes.',
      },
      {
        property: 'og:image',
        content: 'https://aistack.to/aistack-banner.png',
      },
      {
        property: 'og:image:width',
        content: '1200',
      },
      {
        property: 'og:image:height',
        content: '630',
      },
      {
        property: 'og:url',
        content: 'https://aistack.to',
      },
      {
        property: 'og:type',
        content: 'website',
      },
      {
        property: 'og:site_name',
        content: 'AI Stack',
      },
      // Twitter Card
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
      {
        name: 'twitter:title',
        content: 'AI Stack - Real AI workflows from solo builders.',
      },
      {
        name: 'twitter:description',
        content: 'Browse real founders\' AI stacks, complete with workflows, prompts, and automations you can copy in minutes.',
      },
      {
        name: 'twitter:image',
        content: 'https://aistack.to/aistack-banner.png',
      },
      {
        name: 'twitter:site',
        content: '@alperortac',
      },
      {
        name: 'twitter:creator',
        content: '@alperortac',
      },
      // Additional SEO
      {
        name: 'keywords',
        content: 'AI workflows, AI automations, AI playbooks, AI stacks, artificial intelligence, AI tools, AI for founders, AI for creators, AI workflows comparison',
      },
      {
        name: 'author',
        content: 'Alper Ortaç',
      },
      {
        name: 'robots',
        content: 'index, follow',
      },
      {
        name: 'googlebot',
        content: 'index, follow',
      },
    ],
  }),
})

function App() {
  const [displayCount, setDisplayCount] = useState(0)
  const waitlistCount = useQuery(api.waitlist.getWaitlistCount) ?? 0
  
  // Clear the auth success flag when signing out
  useEffect(() => {
    const handleSignOut = () => {
      sessionStorage.removeItem('authSuccess')
    }
    
    // Listen for sign out events (you could emit a custom event)
    window.addEventListener('auth-signout', handleSignOut)
    return () => window.removeEventListener('auth-signout', handleSignOut)
  }, [])

  // Animate counter on mount or when count changes
  useEffect(() => {
    const duration = 500
    const steps = 30
    const increment = waitlistCount / steps
    let current = displayCount
    
    const timer = setInterval(() => {
      current += increment
      if (current >= waitlistCount) {
        setDisplayCount(waitlistCount)
        clearInterval(timer)
      } else {
        setDisplayCount(Math.floor(current))
      }
    }, duration / steps)
    
    return () => clearInterval(timer)
  }, [waitlistCount])

  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/2 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>
      {/* Hero Section */}
      <section className="relative py-4 md:py-20 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950/40 via-gray-950/60 to-gray-950/80"></div>
        <div className="relative max-w-5xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-2 mb-6">
            <Zap className="h-4 w-4 text-cyan-400" />
            <span className="text-cyan-400 text-sm font-medium">For Solo Founders & Creators</span>
          </div>
          
          <h1 className="text-3xl md:text-7xl font-black text-white mb-6">
            Real AI workflows<br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              from solo builders
            </span>
          </h1>
          
          <p className="text-lg md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Browse real founders' AI stacks, complete with workflows, prompts, and automations you can copy in minutes.
          </p>
          
          <WaitlistCTA variant="hero" waitlistCount={waitlistCount} displayCount={displayCount} />
        </div>
      </section>
      
      {/* See How It Works */}
      <section className="py-12 md:py-20 px-2 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            {/* <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-2 mb-6">
              <Play className="h-4 w-4 text-emerald-400" />
              <span className="text-emerald-400 text-sm font-medium">Full Stacks</span>
            </div> */}
            
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Share AI Stacks<br />
              <span className="bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                and get inspired
              </span>
            </h2>
            
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
              See exactly how founders connect their AI tools. Steal the <strong>entire setup</strong> or mix and match steps to create your <strong>perfect automation</strong>.
            </p>
          </div>
          
          {/* Using Stack component with auto-animation */}
          <div className="flex justify-center">
            <div style={{ width: STACK_PREVIEW_WIDTH, height: STACK_PREVIEW_HEIGHT }}>
              <Stack
                randomRotation={false}
                sensitivity={180}
                sendToBackOnClick={true}
                autoplay={true}
                autoplayDelay={5000}
                pauseOnHover={true}
                animationConfig={{ stiffness: 200, damping: 20 }}
                cards={[
                  <StackPreview 
                    key="sarah"
                    avatar="https://api.dicebear.com/9.x/personas/svg?seed=Sarah"
                    stackName="Sarah Chen - Content Creator"
                    summary="My YouTube channel grew 400% after going all-in on AI, but I nearly burned out first. ChatGPT handles scripts (though I rewrite 40% to keep my voice), ElevenLabs saves me 2 hours per video, and Canva AI thumbnails actually perform better than my hand-made ones. I'm using AI for speed, not creativity."
                    workflowHighlight={{
                      title: "Content Automation Pipeline",
                      steps: [
                        { tool: "Descript", action: "Transcribe video" },
                        { tool: "ChatGPT", action: "Generate tweets" },
                        { tool: "ElevenLabs", action: "Create audio" }
                      ],
                      benefit: "Saves 10 hours/week"
                    }}
                    tools={[
                      {
                        id: '1',
                        name: 'ChatGPT Plus',
                        category: 'text',
                        price: 20,
                      },
                      {
                        id: '2',
                        name: 'ElevenLabs',
                        category: 'voice',
                        price: 22,
                      },
                      {
                        id: '3',
                        name: 'Runway Gen-2',
                        category: 'video',
                        price: 15,
                      },
                      {
                        id: '4',
                        name: 'Descript',
                        category: 'video',
                        price: 12,
                      },
                      {
                        id: '5',
                        name: 'Canva Pro',
                        category: 'creation',
                        price: 15,
                      },
                      {
                        id: '6',
                        name: 'Adobe Podcast',
                        category: 'voice',
                        price: 10,
                      },
                    ]}
                    totalPrice={94}
                  />,
                  <StackPreview 
                    key="marcus"
                    avatar="https://api.dicebear.com/9.x/personas/svg?seed=Marcus"
                    stackName="Marcus Rodriguez - Marketer"
                    summary="Our CTR jumped from 2.1% to 8.7% using AI, but our ad spend also doubled. Jasper writes copy that converts (sometimes too salesy), SurferSEO helped us avoid over-optimization, Hootsuite AI's scheduling is brilliant."
                    workflowHighlight={{
                      title: "Ad Campaign Automation",
                      steps: [
                        { tool: "Jasper", action: "Write ad copy" },
                        { tool: "SurferSEO", action: "Optimize" },
                        { tool: "Hootsuite", action: "Schedule posts" }
                      ],
                      benefit: "CTR up 314%"
                    }}
                    tools={[
                      {
                        id: '1',
                        name: 'Jasper AI',
                        category: 'text',
                        price: 39,
                      },
                      {
                        id: '2',
                        name: 'SurferSEO',
                        category: 'research',
                        price: 49,
                      },
                      {
                        id: '3',
                        name: 'Hootsuite AI',
                        category: 'automation',
                        price: 49,
                      },
                      {
                        id: '4',
                        name: 'Brandwell',
                        category: 'text',
                        price: 29,
                      },
                      {
                        id: '5',
                        name: 'Zapier',
                        category: 'automation',
                        price: 20,
                      },
                    ]}
                    totalPrice={186}
                  />,
                  <StackPreview 
                    key="jeri"
                    avatar="https://api.dicebear.com/9.x/personas/svg?seed=Jeri"
                    stackName="Jeri Kent - Solo Founder"
                    summary="I shipped my MVP in 6 weeks instead of 6 months. Claude is amazing for architecture talks, Cursor writes code fast (with proper guidance), Midjourney visuals look good enough without heavy prompting, and Notion AI helps me organize my thoughts."
                    workflowHighlight={{
                      title: "Rapid Development Flow",
                      steps: [
                        { tool: "Claude", action: "Plan architecture" },
                        { tool: "Cursor", action: "Write code" },
                        { tool: "Notion AI", action: "Document" }
                      ],
                      benefit: "Shipped 4x faster"
                    }}
                    tools={[
                      {
                        id: '1',
                        name: 'Claude Pro',
                        category: 'thinking',
                        price: 20,
                      },
                      {
                        id: '2',
                        name: 'Cursor Pro',
                        category: 'coding',
                        price: 20,
                      },
                      {
                        id: '3',
                        name: 'Midjourney',
                        category: 'image',
                        price: 30,
                      },
                      {
                        id: '4',
                        name: 'Notion AI',
                        category: 'notes',
                        price: 10,
                      },
                      {
                        id: '5',
                        name: 'Perplexity Pro',
                        category: 'research',
                        price: 20,
                      },
                    ]}
                    totalPrice={100}
                  />
                ]}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 border-t border-gray-800 bg-gradient-to-b from-slate-900/50 to-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div 
              className="text-center group cursor-pointer transition-all duration-300 hover:scale-105"
              onMouseEnter={() => document.querySelectorAll('.cost-highlight').forEach(el => el.classList.add('bg-yellow-500/20', 'border-yellow-500/30'))}
              onMouseLeave={() => document.querySelectorAll('.cost-highlight').forEach(el => el.classList.remove('bg-yellow-500/20', 'border-yellow-500/30'))}
            >
              <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center group-hover:from-yellow-500/30 group-hover:to-yellow-600/20 transition-all duration-300 shadow-lg shadow-yellow-500/10">
                <DollarSign className="h-10 w-10 text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-yellow-400 transition-colors duration-300">See real costs</h3>
              <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                Know exactly what founders pay for results.
              </p>
            </div>
            
            <div 
              className="text-center group cursor-pointer transition-all duration-300 hover:scale-105"
              onMouseEnter={() => document.querySelectorAll('.context-highlight').forEach(el => el.classList.add('bg-blue-500/20', 'border-blue-500/50', 'shadow-lg', 'shadow-blue-500/20'))}
              onMouseLeave={() => document.querySelectorAll('.context-highlight').forEach(el => el.classList.remove('bg-blue-500/20', 'border-blue-500/50', 'shadow-lg', 'shadow-blue-500/20'))}
            >
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center group-hover:from-blue-500/30 group-hover:to-blue-600/20 transition-all duration-300 shadow-lg shadow-blue-500/10">
                <Copy className="h-10 w-10 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-blue-400 transition-colors duration-300">Steal playbooks</h3>
              <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                Prompts, rules, and connections included.
              </p>
            </div>
            
            <div 
              className="text-center group cursor-pointer transition-all duration-300 hover:scale-105"
              onMouseEnter={() => document.querySelectorAll('.sharing-highlight').forEach((el: Element) => {
                el.classList.add('border-green-500/70', 'shadow-2xl', 'shadow-green-500/30');
              })}
              onMouseLeave={() => document.querySelectorAll('.sharing-highlight').forEach((el: Element) => {
                el.classList.remove('border-green-500/70', 'shadow-2xl', 'shadow-green-500/30');
              })}
            >
              <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center group-hover:from-green-500/30 group-hover:to-green-600/20 transition-all duration-300 shadow-lg shadow-green-500/10">
                <Play className="h-10 w-10 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-green-400 transition-colors duration-300">Real workflows</h3>
              <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                Copy actual automations from founders who ship.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <WorkflowSection />

      {/* Tools Masonry */}
      <section className="py-20 px-6 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-4">
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center">
              AI Tools for your Stack
            </h2>
          </div>
          <p className="text-gray-300 text-center mb-12 max-w-2xl mx-auto">
            This is how a list of your submitted AI tools could look like
          </p>
          
          <div>
            <Masonry 
              items={exampleTools}
              stagger={0.03}
              animateFrom="bottom"
              scaleOnHover={true}
              hoverScale={0.98}
            />
          </div>
        </div>
      </section>

      {/* Waitlist CTA */}
      <section className="py-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/50 via-blue-900/50 to-cyan-900/50"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/50"></div>
        
        <WaitlistCTA variant="footer" waitlistCount={waitlistCount} displayCount={displayCount} />
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-800">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img
              src="/aistack-logo.png"
              alt="AI Stack Logo"
              className="w-8 h-8"
            />
            <span className="text-gray-300 text-lg">AI Stack</span>
          </div>
          <p className="text-gray-400 mb-4">
            Real AI workflows from solo builders.
          </p>
          <p className="flex gap-3 items-center justify-center text-gray-500 text-sm">
            <span className='flex items-center gap-1'>
              Built with <span className="text-red-500 text-lg">♥</span> by{' '}
              <a 
                href="https://x.com/alperortac" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                @alperortac
              </a>
            </span>
            <span>•</span>
            <a 
              href="https://github.com/alp82/aistack" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              GitHub
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}

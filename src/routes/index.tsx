import { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { STACK_PREVIEW_HEIGHT, STACK_PREVIEW_WIDTH, StackPreview } from '../components/StackPreview'
import { WaitlistCTA } from '../components/WaitlistCTA'
import { Zap, Users, Share2, DollarSign, TrendingUp, Info } from 'lucide-react'
import Stack from '../components/Stack'
import Masonry from '../components/Masonry'
import { exampleTools } from '../data/exampleTools'
import { api } from '../../convex/_generated/api'

export const Route = createFileRoute('/')({
  ssr: false,
  component: App,
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
      <section className="relative py-20 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10"></div>
        <div className="relative max-w-5xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-2 mb-6">
            <Zap className="h-4 w-4 text-cyan-400" />
            <span className="text-cyan-400 text-sm font-medium">For Solo Founders & Creators</span>
          </div>
          
          <h1 className="text-4xl md:text-7xl font-black text-white mb-6">
            What AI tools are<br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              worth paying for?
            </span>
          </h1>
          
          <p className="text-lg md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Browse AI stacks, see what they cost, and help other builders decide what's actually worth the money.
          </p>
          
          <WaitlistCTA variant="hero" waitlistCount={waitlistCount} displayCount={displayCount} />
        </div>
      </section>
      
      {/* See How It Works */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-white text-center mb-16">
            See how it will work
          </h2>
          
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
              onMouseEnter={() => document.querySelectorAll('.cost-highlight').forEach(el => el.classList.add('bg-amber-500/20', 'border-amber-500/30'))}
              onMouseLeave={() => document.querySelectorAll('.cost-highlight').forEach(el => el.classList.remove('bg-amber-500/20', 'border-amber-500/30'))}
            >
              <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center group-hover:from-amber-500/30 group-hover:to-amber-600/20 transition-all duration-300 shadow-lg shadow-amber-500/10">
                <DollarSign className="h-10 w-10 text-amber-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-amber-400 transition-colors duration-300">Cost transparency</h3>
              <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                Real monthly costs from real builders.
              </p>
            </div>
            
            <div 
              className="text-center group cursor-pointer transition-all duration-300 hover:scale-105"
              onMouseEnter={() => document.querySelectorAll('.context-highlight').forEach(el => el.classList.add('bg-blue-500/20', 'border-blue-500/50', 'shadow-lg', 'shadow-blue-500/20'))}
              onMouseLeave={() => document.querySelectorAll('.context-highlight').forEach(el => el.classList.remove('bg-blue-500/20', 'border-blue-500/50', 'shadow-lg', 'shadow-blue-500/20'))}
            >
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center group-hover:from-blue-500/30 group-hover:to-blue-600/20 transition-all duration-300 shadow-lg shadow-blue-500/10">
                <Users className="h-10 w-10 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-blue-400 transition-colors duration-300">Context matters</h3>
              <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                How and why the stack works for them.
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
                <Share2 className="h-10 w-10 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-green-400 transition-colors duration-300">Easy sharing</h3>
              <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                Share your stack on X, Discord, or Reddit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Masonry */}
      <section className="py-20 px-6 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-4">
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center">
              AI Tools for your Stack
            </h2>
            <div className="flex items-center gap-1 bg-cyan-700/30 border border-cyan-700/20 rounded-full px-3 py-1">
              <Info className="h-3 w-3 text-cyan-400" />
              <span className="text-cyan-300 text-xs font-medium">Example Data</span>
            </div>
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
            What AI tools are worth paying for and why?
          </p>
          <p className="text-gray-500 text-sm">
            Built with <span className="text-red-500">♥</span> by{' '}
            <a 
              href="https://x.com/alperortac" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              @alperortac
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}

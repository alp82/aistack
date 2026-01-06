import { ArrowRight, Copy, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WorkflowStep {
  tool: string
  action: string
  icon?: React.ComponentType<{ className?: string }>
}

interface WorkflowExample {
  id: string
  title: string
  description: string
  steps: WorkflowStep[]
  benefit: string
  founder: string
}

const workflowExamples: WorkflowExample[] = [
  {
    id: '1',
    title: 'Content Repurposing Pipeline',
    description: 'Turn one piece of content into 10+ assets automatically',
    steps: [
      { tool: 'Descript', action: 'Upload video transcript' },
      { tool: 'Claude', action: 'Extract key quotes & tweets' },
      { tool: 'ElevenLabs', action: 'Create audio version' },
      { tool: 'Canva AI', action: 'Generate social graphics' }
    ],
    benefit: 'Saves 8 hours per week',
    founder: 'Sarah Chen - Content Creator'
  },
  {
    id: '2',
    title: 'Customer Support Automation',
    description: 'Handle 80% of support tickets without human touch',
    steps: [
      { tool: 'Zapier', action: 'New ticket trigger' },
      { tool: 'Claude', action: 'Analyze & categorize' },
      { tool: 'GPT-4', action: 'Draft response' },
      { tool: 'Notion', action: 'Log for analytics' }
    ],
    benefit: 'Response time < 2 minutes',
    founder: 'Marcus Rodriguez - SaaS Founder'
  },
  {
    id: '3',
    title: 'Product Development Flow',
    description: 'From idea to deployed feature in one day',
    steps: [
      { tool: 'Cursor', action: 'Write initial code' },
      { tool: 'Claude', action: 'Review & optimize' },
      { tool: 'GitHub Copilot', action: 'Add tests' },
      { tool: 'Vercel', action: 'Deploy automatically' }
    ],
    benefit: 'Ship features 4x faster',
    founder: 'Jeri Kent - Solo Founder'
  }
]

export function WorkflowSection() {
  return (
    <section className="py-12 md:py-20 px-6 border-t border-gray-800 bg-gradient-to-b from-slate-900 to-slate-900/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          {/* <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-2 mb-6">
            <Play className="h-4 w-4 text-purple-400" />
            <span className="text-purple-400 text-sm font-medium">Real Workflows</span>
          </div> */}
          
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Copy workflows<br />
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              or build your own
            </span>
          </h2>
          
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
            See exactly how founders connect their AI tools. Steal the <strong>entire setup</strong> or mix and match steps to create your <strong>perfect automation</strong>.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 grid-rows-1 gap-8">
          {workflowExamples.map((workflow) => (
            <div
              key={workflow.id}
              className={cn(
                workflow.id == "2" ? "hidden md:block" : "",
                workflow.id == "3" ? "hidden lg:block" : "",
                "relative group transition-all duration-300",
                "bg-gradient-to-br from-slate-50/90 to-slate-100/90 rounded-2xl p-6 border border-gray-300",
              )}
            >
              {/* Badge */}
              {/* <div className="absolute -top-3 -right-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full p-2">
                <Copy className="h-4 w-4 text-white" />
              </div> */}

              {/* Header */}
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2 transition-colors">
                  {workflow.title}
                </h3>
                <p className="text-gray-800 text-sm mb-3">{workflow.description}</p>
                <p className="text-xs text-gray-600 italic">by {workflow.founder}</p>
              </div>

              {/* Workflow Steps */}
              <div className="space-y-3 mb-6">
                {workflow.steps.map((step, stepIndex) => (
                  <div key={stepIndex} className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-xs font-bold text-gray-300">
                        {stepIndex + 1}
                      </div>
                      {stepIndex < workflow.steps.length - 1 && (
                        <div className="absolute top-8 left-4 w-0.5 h-6 bg-gray-700 -translate-x-1/2" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-cyan-600">{step.tool}</span>
                        <ArrowRight className="h-3 w-3 text-gray-600" />
                      </div>
                      <p className="text-xs text-gray-600">{step.action}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Benefit */}
              <div className="flex items-center gap-2 bg-green-600/10 border border-green-600/20 rounded-lg px-3 py-2">
                <Zap className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">{workflow.benefit}</span>
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-purple-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Monitor, Terminal, Globe } from 'lucide-react'

const SIMPLE_SIMULATOR_HEIGHT = 400

const workflow = [
	{ type: 'user', content: 'build the dashboard for my product with these requirements', delay: 1000 },
	{ type: 'skill', content: 'Using planning skill to analyze requirements...', delay: 1500 },
	{ type: 'subagent', content: 'Review Agent: Analyzing plan for inconsistencies...', delay: 3000 },
	{ type: 'skill', content: 'Using execution skill to implement plan...', delay: 1500 },
	{ type: 'subagent', content: 'Frontend Agent: Implementing components...', delay: 3000 },
	{ type: 'subagent', content: 'Frontend Reviwer: Applying best practices...', delay: 2000 },
	{ type: 'subagent', content: 'Backend Agent: Implementing logic and API...', delay: 3000 },
	{ type: 'mcp', content: 'MCP: Run Chrome to test the dashboard...', delay: 3000 },
	{ type: 'skill', content: 'Using GitHub skill to commit changes...', delay: 2000 },
	{ type: 'success', content: '✓ Dashboard deployed successfully!', delay: 5000 },
]

export function SimpleSimulator() {
	const [currentStep, setCurrentStep] = useState(-1)
	const [previewContent, setPreviewContent] = useState('')
	const [hasStarted, setHasStarted] = useState(false)
	const simulatorRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.intersectionRatio >= 0.33 && !hasStarted) {
						setHasStarted(true)
					}
				})
			},
			{
				threshold: [0.33]
			}
		)

		if (simulatorRef.current) {
			observer.observe(simulatorRef.current)
		}

		return () => observer.disconnect()
	}, [hasStarted])

	useEffect(() => {
		if (!hasStarted) return

		const runSimulation = () => {
			workflow.forEach((step, index) => {
				setTimeout(() => {
					setCurrentStep(index)
					
					// Update preview content based on step
					if (index === 0) {
						setPreviewContent('<div class="min-h-screen bg-gray-50"><div class="p-8"><div class="max-w-4xl mx-auto"><div class="animate-pulse bg-gray-200 h-8 rounded w-1/3 mb-8"></div></div></div></div>')
					} else if (index === 4) {
						setPreviewContent('<div class="min-h-screen bg-gray-50"><div class="p-8"><div class="max-w-4xl mx-auto"><div class="animate-pulse bg-gray-200 h-8 rounded w-1/3 mb-8"></div><div class="grid grid-cols-1 md:grid-cols-2 gap-6"><div class="bg-white rounded-lg shadow p-6"><div class="animate-pulse bg-gray-200 h-6 rounded w-1/2 mb-2"></div><div class="animate-pulse bg-gray-200 h-4 rounded w-3/4"></div></div><div class="bg-white rounded-lg shadow p-6"><div class="animate-pulse bg-gray-200 h-6 rounded w-1/2 mb-2"></div><div class="animate-pulse bg-gray-200 h-4 rounded w-3/4"></div></div></div></div></div>')
					} else if (index === 5) {
						setPreviewContent('<div class="min-h-screen bg-gray-50"><div class="p-8"><div class="max-w-4xl mx-auto"><h1 class="text-3xl font-bold text-gray-900 mb-8">Product Dashboard</h1><div class="grid grid-cols-1 md:grid-cols-2 gap-6"><div class="bg-white rounded-lg shadow p-6"><h3 class="text-lg font-semibold text-gray-700 mb-2">Total Users</h3><p class="text-gray-500 text-sm">Loading...</p></div><div class="bg-white rounded-lg shadow p-6"><h3 class="text-lg font-semibold text-gray-700 mb-2">Revenue</h3><p class="text-gray-500 text-sm">Loading...</p></div></div></div></div>')
					} else if (index === 6) {
						setPreviewContent('<div class="min-h-screen bg-gray-50"><div class="p-8"><div class="max-w-4xl mx-auto"><h1 class="text-3xl font-bold text-gray-900 mb-8">Product Dashboard</h1><div class="grid grid-cols-1 md:grid-cols-2 gap-6"><div class="bg-white rounded-lg shadow p-6"><p class="text-3xl font-bold text-gray-600">---</p><p class="text-sm text-gray-600 mt-2">Users</p></div><div class="bg-white rounded-lg shadow p-6"><p class="text-3xl font-bold text-gray-600">---</p><p class="text-sm text-gray-600 mt-2">Revenue</p></div></div></div></div>')
					} else if (index === 7) {
						setPreviewContent('<div class="min-h-screen bg-gray-50"><div class="p-8"><div class="max-w-4xl mx-auto"><h1 class="text-3xl font-bold text-gray-900 mb-8">Product Dashboard</h1><div class="grid grid-cols-1 md:grid-cols-2 gap-6"><div class="bg-white rounded-lg shadow p-6"><p class="text-3xl font-bold text-gray-600">234</p><p class="text-sm text-gray-600 mt-2">Users</p></div><div class="bg-white rounded-lg shadow p-6"><p class="text-3xl font-bold text-gray-600">$2,345</p><p class="text-sm text-gray-600 mt-2">Revenue</p></div></div></div></div>')
					} else if (index === 9) {
						setPreviewContent('<div class="min-h-screen bg-gray-50"><div class="p-8"><div class="max-w-4xl mx-auto"><h1 class="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3"><span class="relative flex h-5 w-5"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span class="relative inline-flex rounded-full h-5 w-5 bg-green-500"></span></span>Product Dashboard</h1><div class="grid grid-cols-1 md:grid-cols-2 gap-6"><div class="bg-white rounded-lg shadow p-6"><p class="text-3xl font-bold text-gray-600">234</p><p class="text-sm text-gray-600 mt-2">Users</p></div><div class="bg-white rounded-lg shadow p-6"><p class="text-3xl font-bold text-gray-600">$2,345</p><p class="text-sm text-gray-600 mt-2">Revenue</p></div></div></div></div>')
					}
					
					if (index === workflow.length - 1) {
						setTimeout(() => {
							setCurrentStep(-1)
							//setPreviewContent('')
						}, 2000)
					}
				}, workflow.slice(0, index).reduce((sum, s) => sum + s.delay, 0))
			})
		}

		runSimulation()
		const interval = setInterval(runSimulation, workflow.reduce((sum, s) => sum + s.delay, 0) + 3000)

		return () => clearInterval(interval)
	}, [hasStarted])


	return (
		<section ref={simulatorRef} className="py-12 md:py-16 px-6 bg-gradient-to-b from-slate-900/70 to-slate-900">
			<div className="max-w-6xl mx-auto">
				<div className="text-center mb-8">
					<h2 className="text-3xl md:text-5xl font-bold text-white mb-3">
						Simple Explainers<span className="hidden md:inline"> for each Stack</span>
					</h2>
					<p className="text-gray-400 max-w-lg mx-auto">
						From Brainstorming to Execution over Code Review and Delivery.
						Copy and paste to your Stack if you like what you see.
					</p>
				</div>

				{/* Two Column Layout */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{/* Left Column - Terminal */}
					<div className="rounded-xl border border-gray-800 overflow-y-scroll shadow-2xl bg-gray-950">
						{/* Terminal Header */}
						<div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
							<div className="flex items-center gap-2">
								<Terminal className="w-4 h-4 text-gray-400" />
								<span className="text-sm text-gray-400 font-mono">Terminal</span>
							</div>
							<div className="flex gap-2">
								<div className="w-3 h-3 rounded-full bg-red-500"></div>
								<div className="w-3 h-3 rounded-full bg-yellow-500"></div>
								<div className="w-3 h-3 rounded-full bg-green-500"></div>
							</div>
						</div>

						{/* Terminal Content */}
						<div className="p-4 font-mono text-sm" style={{ height: SIMPLE_SIMULATOR_HEIGHT }}>
							<div className="space-y-2">
								{workflow.map((_, index) => {
									const isVisible = index <= currentStep
									if (!isVisible && currentStep !== -1) return null

									return (
										<div
											key={index}
											className={cn(
												"animate-in fade-in slide-in-from-left-2 duration-300",
												workflow[index].type === 'user' && "text-white font-semibold",
												workflow[index].type === 'system' && "text-gray-400",
												workflow[index].type === 'tool' && "text-cyan-300",
												workflow[index].type === 'mcp' && "text-pink-400",
												workflow[index].type === 'skill' && "text-blue-300",
												workflow[index].type === 'subagent' && "text-orange-400",
												workflow[index].type === 'success' && "text-green-400"
											)}
										>
											{workflow[index].type === 'user' && <span className="mr-2">&gt;</span>}
											{workflow[index].type === 'tool' && <span className="mr-2">→</span>}
											{workflow[index].type === 'mcp' && <span className="mr-2">◆</span>}
											{workflow[index].type === 'skill' && <span className="mr-2">◆</span>}
											{workflow[index].type === 'subagent' && <span className="mr-2">⚡</span>}
											{workflow[index].content}
										</div>
									)
								})}

								{currentStep >= 0 && currentStep < workflow.length - 1 && (
									<div className="flex items-center gap-2 text-cyan-400 animate-pulse">
										<span>_</span>
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Right Column - Browser Preview */}
					<div className="rounded-xl border border-gray-800 overflow-hidden shadow-2xl bg-gray-950">
						{/* Browser Header */}
						<div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
							<div className="flex items-center gap-2">
								<Globe className="w-4 h-4 text-gray-400" />
								<span className="text-sm text-gray-400 font-mono">Live Preview</span>
							</div>
							<div className="flex gap-2">
								<div className="w-3 h-3 rounded-full bg-red-500"></div>
								<div className="w-3 h-3 rounded-full bg-yellow-500"></div>
								<div className="w-3 h-3 rounded-full bg-green-500"></div>
							</div>
						</div>

						{/* Browser Content */}
						<div className="bg-white" style={{ height: SIMPLE_SIMULATOR_HEIGHT }}>
							<div className="w-full h-full">
								{previewContent ? (
									<div 
										className="w-full h-full"
										dangerouslySetInnerHTML={{ __html: previewContent }}
									/>
								) : (
									<div className="flex items-center justify-center h-full text-gray-400">
										<div className="text-center">
											<Monitor className="w-12 h-12 mx-auto mb-2 opacity-50" />
											<p className="text-sm">Preview will appear here</p>
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>

				<p className="text-center text-sm text-gray-500 mt-6">
					Example workflow showing how advanced usage of AI tools looks like
				</p>
			</div>
		</section>
	)
}

import { Plus, ArrowRight, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { categoryConfig, type ToolCategory } from '@/config/categoryConfig'

export const STACK_PREVIEW_WIDTH = 792
export const STACK_PREVIEW_HEIGHT = 416

const DISPLAY_COUNT = 3

interface Tool {
  id: string
  name: string
  category: ToolCategory
  price: number
  icon?: React.ComponentType<{ className?: string }>
}

interface WorkflowStep {
  tool: string
  action: string
}

interface StackPreviewProps {
  avatar?: string
  stackName: string
  summary: string
  tools: Tool[]
  totalPrice: number
  stackLink?: string
  className?: string
  workflowHighlight?: {
    title: string
    steps: WorkflowStep[]
    benefit: string
  }
}

export function StackPreview({
  avatar,
  stackName,
  summary,
  tools,
  totalPrice,
  stackLink,
  className,
  workflowHighlight,
}: StackPreviewProps) {
  const displayTools = tools.slice(0, DISPLAY_COUNT)
  const remainingTools = tools.length - DISPLAY_COUNT

  return (
    <div
      className={cn(
        `w-full max-w-[${STACK_PREVIEW_WIDTH}px] h-[${STACK_PREVIEW_HEIGHT}px] rounded-lg border-8 bg-gray-50 p-6 shadow-sm transition-all duration-300 sharing-highlight`,
        className
      )}
    >
      <div className="flex flex-col justify-between gap-6 h-full">
        {/* Top Section: Avatar, Stack Name, and Price */}
        <div className="flex justify-between gap-6">
          {/* Avatar and stack name */}
          <div className="flex items-center gap-3 w-full">
            {avatar ? (
              <img
                src={avatar}
                alt={stackName}
                className="h-12 w-12 md:h-16 md:w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 md:h-16 md:w-16 items-center justify-center rounded-full bg-gray-300">
                <span className="text-sm md:text-base font-medium text-gray-600">
                  {stackName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <h3 className="flex-1 text-xl md:text-2xl font-bold text-gray-900">
              {stackName}
              <span className="md:hidden flex-1 mx-2">•</span>
              <span className="inline-flex md:hidden items-baseline gap-1 cost-highlight border-4 border-transparent">
                <span className="text-2xl font-bold text-gray-900">
                  ${totalPrice}
                </span>
                <span className="text-sm md:text-base text-gray-600">/mo</span>
              </span>
            </h3>
            
            {/* Total Price */}
            <div className="hidden md:block mb-2">
              <div className="flex items-baseline gap-1 cost-highlight border-4 border-transparent">
                <span className="text-3xl md:text-4xl font-bold text-gray-900">
                  ${totalPrice}
                </span>
                <span className="text-sm md:text-base text-gray-600">/mo</span>
              </div>
            </div>
          </div>

        </div>

        {/* Summary Text */}
        <div className="hidden md:block line-clamp-3 border-l-2 border-gray-300 pl-2 text-sm md:text-base text-gray-600 leading-relaxed context-highlight transition-all duration-300">
          {summary}
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          {/* Workflow Highlight */}
          {workflowHighlight && (
            <div className="flex flex-col bg-gradient-to-r from-cyan-50 to-sky-100 rounded-lg p-3 border border-sky-300 workflow-highlight transition-all duration-300">
              <div className="flex items-center gap-2 mb-1 md:mb-3">
                <Zap className="h-4 w-4 text-cyan-600" />
                <span className="text-sm font-semibold text-cyan-900">{workflowHighlight.title}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-cyan-800">
                {workflowHighlight.steps.map((step, index) => (
                  <div key={index} className="flex items-center gap-1">
                    <span className="font-medium">{step.tool}</span>
                    {index < workflowHighlight.steps.length - 1 && <ArrowRight className="h-3 w-3" />}
                  </div>
                ))}
              </div>
              <div className="flex-1 mb-3" />
              <div className="text-sm text-green-700 font-medium">
                ✓ {workflowHighlight.benefit}
              </div>
            </div>
          )}

          {/* Bottom Section: Tools List */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="space-y-2">
              {displayTools.map((tool) => {
                const config =
                  categoryConfig[tool.category as keyof typeof categoryConfig]
                const Icon = config?.icon || Plus

                return (
                  <div key={tool.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-md md:text-lg font-medium text-gray-900 truncate">
                        {tool.name}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs md:text-sm font-medium flex-shrink-0",
                          config?.bgColor || "bg-gray-100",
                          config?.textColor || "text-gray-700"
                        )}
                      >
                        <Icon className="h-3 w-3" />
                        {config?.label || tool.category}
                      </span>
                    </div>
                    <span className="text-md md:text-lg font-bold text-gray-900 ml-2 flex-shrink-0 cost-highlight border-1 border-transparent">
                      ${tool.price}
                    </span>
                  </div>
                )
              })}

              {/* More tools indicator / Expand/Collapse button */}
              {tools.length > DISPLAY_COUNT && (
                <span
                  className="flex items-center justify-between w-full text-sm md:text-base text-gray-500 transition-colors mt-2"
                >
                  <span>
                    +{remainingTools} more tool{remainingTools > 1 ? "s" : ""}
                  </span>
                </span>
              )}
        </div>

            {/* View Full Stack Link */}
            {stackLink && (
              <a
                href={stackLink}
                onClick={(e) => e.stopPropagation()}
                className="text-sm md:text-base font-medium text-blue-600 hover:text-blue-700 transition-colors inline-flex items-center gap-1"
              >
                View full stack →
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

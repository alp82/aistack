import { CheckCircle } from 'lucide-react'

interface SuccessMessageProps {
  message?: string
  className?: string
}

export function SuccessMessage({ 
  message = 'Thanks for joining! We\'ll keep you updated.', 
  className = '' 
}: SuccessMessageProps) {
  return (
    <div className={`bg-green-500/10 border border-green-500/20 rounded-lg p-4 max-w-md mx-auto ${className}`}>
      <CheckCircle className="h-6 w-6 text-green-400 mx-auto mb-2" />
      <p className="text-green-400 text-center">{message}</p>
    </div>
  )
}

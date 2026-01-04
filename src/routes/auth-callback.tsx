import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState, useRef } from 'react'
import { useMutation } from 'convex/react'
import { authClient } from '../lib/auth-client'
import { api } from '../../convex/_generated/api'
import { useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/auth-callback')({
  ssr: false,
  component: AuthCallback,
})

function AuthCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('Processing...')
  const hasProcessed = useRef(false)
  const urlParams = new URLSearchParams(window.location.search)
  const source = urlParams.get('source')
  
  const joinWaitlistWithAuth = useMutation(api.waitlist.joinWaitlistWithAuth)

  useEffect(() => {
    const processAuth = async () => {
      // Prevent multiple executions using ref
      if (hasProcessed.current) return
      
      try {
        // Always check if we should add to waitlist when source is provided
        if (source) {
          setStatus('Adding to waitlist...')
          hasProcessed.current = true
          
          // Wait a moment for auth to be fully established
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // Get the current session to retrieve user data
          const session = await authClient.getSession()
          
          if (session.data?.user?.email) {
            try {
              // Try to add user to waitlist (will fail if already exists)
              await joinWaitlistWithAuth({ source })
              setStatus('Successfully joined! Redirecting...')
              // Set flag to show success message on home page
              sessionStorage.setItem('showWaitlistSuccess', 'true')
            } catch (err: any) {
              // User might already be on waitlist, which is fine
              if (err.message.includes('User already on waitlist')) {
                setStatus('Already on waitlist. Redirecting...')
              } else {
                setStatus('Error occurred. Redirecting...')
              }
              // Still show success if they were already on waitlist
              sessionStorage.setItem('showWaitlistSuccess', 'true')
            }
          } else {
            setStatus('No user found. Redirecting...')
          }
        } else {
          setStatus('Redirecting to home...')
        }
        
        // Always redirect to home after processing
        setTimeout(() => {
          navigate({ to: '/' })
        }, 1000)
      } catch (error) {
        console.error('Failed to process auth callback:', error)
        setStatus('Error occurred. Redirecting...')
        setTimeout(() => {
          navigate({ to: '/' })
        }, 1000)
      }
    }
    
    processAuth()
  }, [source, joinWaitlistWithAuth, navigate])

  // Show loading while processing
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
        <p className="text-gray-300 text-lg">{status}</p>
        <p className="text-gray-500 text-sm mt-2">Please wait...</p>
      </div>
    </div>
  )
}

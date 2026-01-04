import { useState, useEffect } from 'react'
import { authClient } from '../lib/auth-client'
import { useQuery, useMutation } from 'convex/react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { SuccessMessage } from './SuccessMessage'
import { api } from '../../convex/_generated/api'

interface WaitlistCTAProps {
  variant: 'hero' | 'footer'
  waitlistCount: number
  displayCount: number
  className?: string
}

export function WaitlistCTA({ variant, waitlistCount, displayCount, className = '' }: WaitlistCTAProps) {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')
  const [error, setError] = useState('')
  
  const waitlistStatus = useQuery(api.waitlist.getWaitlistStatus, email ? { email } : 'skip')
  const joinWaitlist = useMutation(api.waitlist.joinWaitlist)

  // Check for Google SSO success on mount
  useEffect(() => {
    const checkGoogleSuccess = () => {
      const shouldShowSuccess = sessionStorage.getItem('showWaitlistSuccess')
      if (shouldShowSuccess === 'true') {
        setSubmitMessage('Thanks for joining! We\'ll keep you updated.')
        sessionStorage.removeItem('showWaitlistSuccess')
      }
    }
    checkGoogleSuccess()
  }, [])

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    
    try {
      await joinWaitlist({ 
        email,
        source: variant
      })
      setSubmitMessage('Thanks for joining! We\'ll keep you updated.')
      setEmail('')
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      // Clear any previous success flags
      sessionStorage.removeItem('showWaitlistSuccess')
      
      // Sign out any existing user first
      await authClient.signOut()
      
      // Emit sign-out event for other components
      window.dispatchEvent(new CustomEvent('auth-signout'))
      
      // For better account selection, we can add a small delay
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Clear all Google-related cookies for current domain
      document.cookie.split(";").forEach(function(c) { 
        const cookie = c.trim()
        // Clear various Google OAuth cookies
        if (cookie.startsWith('g_state') || 
            cookie.startsWith('__Secure-') && cookie.includes('google') ||
            cookie.startsWith('G_AUTH') ||
            cookie.startsWith('S') && cookie.includes('google')) {
          const domain = window.location.hostname
          const path = '/'
          document.cookie = `${cookie.split('=')[0]}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path}`
          document.cookie = `${cookie.split('=')[0]}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path};domain=.${domain}`
        }
      });
      
      // Clear localStorage items that might affect Google OAuth
      if (window.localStorage.getItem('gauth.token')) {
        window.localStorage.removeItem('gauth.token')
      }
      
      // Sign in with Google - use callbackURL with source for all users
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: `/auth-callback?source=${variant}`
      })
    } catch (err) {
      console.error('Google sign-in failed:', err)
      setError('Failed to sign in with Google. Please try again.')
    }
  }

  const isHero = variant === 'hero'

  return (
    <div className="relative max-w-4xl mx-auto text-center">
      <div className="bg-black/25 backdrop-blur-sm border border-white/10 rounded-2xl p-12">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Be the first to know when we launch
        </h2>
        <p className="text-xl text-gray-300 mb-8">
          Get early access and exclusive insights from the community.
        </p>
        
        <div className={`space-y-4 ${className}`}>
          <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row items-center gap-4 max-w-md mx-auto">
            <div className="flex-1">
              <Label htmlFor={`${variant}-email`} className="sr-only">Email</Label>
              <Input
                id={`${variant}-email`}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className={`bg-white border-gray-500 text-black placeholder-gray-500 h-12`}
                required
              />
            </div>
            <Button 
              type="submit" 
              size="lg"
              disabled={isSubmitting || !!waitlistStatus}
              className="bg-sky-600 hover:bg-sky-700 text-white px-6 cursor-pointer"
            >
              {isSubmitting ? 'Joining...' : waitlistStatus && email ? 'Already Joined' : 'Join Waitlist'}
            </Button>
          </form>
          
          <div className="relative max-w-md mx-auto">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-600"></span>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-transparent text-gray-400">Or continue with</span>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            onClick={handleGoogleSignIn}
            className="border-gray-600 text-black hover:bg-gray-300 hover:border-gray-500 max-w-md mx-auto w-full cursor-pointer"
          >
              <svg className="h-4 w-4" aria-hidden="true" viewBox="0 0 24 24">
                <path
                  d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                  fill="#EA4335"
                />
                <path
                  d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                  fill="#4285F4"
                />
                <path
                  d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
                  fill="#FBBC05"
                />
                <path
                  d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
                  fill="#34A853"
                />
              </svg>
            Join with Google
          </Button>
          
          {submitMessage && (
            <div className={`${isHero ? 'mb-8' : ''}`}>
              <SuccessMessage message={submitMessage} />
            </div>
          )}
          
          {error && (
            <div className={`${isHero ? 'mb-8' : ''}`}>
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-red-400 text-center">{error}</p>
              </div>
            </div>
          )}
        </div>
        
        {waitlistCount > 0 && <div className="flex items-center justify-center gap-2 mt-10">
          <div className="flex -space-x-2">
            {[...Array(Math.min(waitlistCount, 5))].map((_, i) => (
              <img
                key={i}
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=aistack-${i}`}
                alt="Founder Picture"
                className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-600"
              />
            ))}
          </div>
          <span className="text-gray-300 text-sm font-medium">
            <span className="text-cyan-400 font-bold">{displayCount}+</span> founders waiting
          </span>
        </div>}
      </div>
    </div>
  )
}

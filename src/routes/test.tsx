import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { authClient } from '../lib/auth-client'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { useConvexAuth } from '@convex-dev/react-query'

export const Route = createFileRoute('/test')({
  component: TestPage,
})

function TestPage() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading } = useConvexAuth()
  
  // Get user data from Convex
  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const result = await authClient.getSession()
      return result.data
    },
    enabled: isAuthenticated,
  })

  const handleLogin = () => {
    navigate({ to: '/login' })
  }

  const handleLogout = async () => {
    await authClient.signOut()
    navigate({ to: '/' })
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading authentication state...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Authentication Test Page</h1>
        
        {/* Auth State Card */}
        <Card>
          <CardHeader>
            <CardTitle>Authentication State</CardTitle>
            <CardDescription>Current authentication status and metadata</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-muted-foreground">Is Authenticated:</span>
                <p className="text-lg font-semibold">
                  {isAuthenticated ? (
                    <span className="text-green-600">✓ Yes</span>
                  ) : (
                    <span className="text-red-600">✗ No</span>
                  )}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">Loading State:</span>
                <p className="text-lg font-semibold">
                  {isLoading || isUserLoading ? (
                    <span className="text-yellow-600">Loading...</span>
                  ) : (
                    <span className="text-green-600">Ready</span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              {isAuthenticated ? (
                <Button onClick={handleLogout} variant="destructive">
                  Sign Out
                </Button>
              ) : (
                <Button onClick={handleLogin}>
                  Sign In
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* User Data Card */}
        {isAuthenticated && user && (
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>Details about the currently authenticated user</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">User ID:</span>
                  <p className="font-mono text-sm break-all">{user.user.id}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Email:</span>
                  <p className="font-mono text-sm">{user.user.email}</p>
                </div>
                {user.user.name && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Name:</span>
                    <p className="font-mono text-sm">{user.user.name}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Email Verified:</span>
                  <p className="font-mono text-sm">
                    {user.user.emailVerified ? (
                      <span className="text-green-600">✓ Verified</span>
                    ) : (
                      <span className="text-yellow-600">⚠ Not Verified</span>
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Created At:</span>
                  <p className="font-mono text-sm">
                    {new Date(user.user.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Updated At:</span>
                  <p className="font-mono text-sm">
                    {new Date(user.user.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
              
              {/* Session Info */}
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">Session Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Session ID:</span>
                    <p className="font-mono text-xs break-all">{user.session.id}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Session Expires:</span>
                    <p className="font-mono text-sm">
                      {new Date(user.session.expiresAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Provider Info */}
              {user.user.image && (
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">Profile Image</h4>
                  <img 
                    src={user.user.image} 
                    alt="Profile" 
                    className="w-16 h-16 rounded-full"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Debug Info */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
            <CardDescription>Technical details for debugging</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-muted-foreground">Auth Client State:</span>
                <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                  {JSON.stringify(
                    {
                      isAuthenticated,
                      isLoading,
                      hasUser: !!user,
                      userId: user?.user?.id || 'N/A'
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">Available Actions:</span>
                <div className="mt-2 space-y-1">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => navigate({ to: '/' })}
                    className="mr-2"
                  >
                    Home
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => navigate({ to: '/login' })}
                  >
                    Login Page
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

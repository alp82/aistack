import { defineApp } from 'convex/server'
import betterAuthComponent from '@convex-dev/better-auth/convex.config'

const app = defineApp()

// Register the better-auth component
app.use(betterAuthComponent)

export default app

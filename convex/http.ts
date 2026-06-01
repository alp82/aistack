import { httpRouter } from 'convex/server'
import { authComponent, createAuth } from './auth'
import { authStart, authPoll, stackCollect, stackGet } from './httpCli'

const http = httpRouter()

authComponent.registerRoutes(http, createAuth)

http.route({ path: '/api/cli/auth/start', method: 'POST', handler: authStart })
http.route({ path: '/api/cli/auth/poll', method: 'GET', handler: authPoll })
http.route({ path: '/api/cli/stacks/collect', method: 'POST', handler: stackCollect })
http.route({ path: '/api/cli/stacks', method: 'GET', handler: stackGet })

export default http

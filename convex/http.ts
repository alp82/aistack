import { httpRouter } from 'convex/server'
import { authComponent, createAuth } from './auth'
import { authStart, authPoll, projectsCheck, projectsCollect, projectsGet } from './httpCli'

const http = httpRouter()

authComponent.registerRoutes(http, createAuth)

http.route({ path: '/api/cli/auth/start', method: 'POST', handler: authStart })
http.route({ path: '/api/cli/auth/poll', method: 'GET', handler: authPoll })
http.route({ path: '/api/cli/projects/check', method: 'GET', handler: projectsCheck })
http.route({ path: '/api/cli/projects/collect', method: 'POST', handler: projectsCollect })
http.route({ pathPrefix: '/api/cli/projects/', method: 'GET', handler: projectsGet })

export default http

import { httpRouter } from 'convex/server'
import { authComponent, createAuth } from './auth'
import {
  authStart,
  authPoll,
  autoSyncSet,
  stackCollect,
  stackGet,
  syncConfig,
  syncManifest,
  syncPublish,
} from './httpCli'
import { unsubscribe } from './emailUnsubscribe'
import { INTERACTIONS_PATH, interactions } from './discordInteractions'
import { PRICES_PATH, pricesGet } from './prices'

const http = httpRouter()

authComponent.registerRoutes(http, createAuth)

http.route({ path: '/api/cli/auth/start', method: 'POST', handler: authStart })
http.route({ path: '/api/cli/auth/poll', method: 'GET', handler: authPoll })
http.route({ path: '/api/cli/stacks/collect', method: 'POST', handler: stackCollect })
http.route({ path: '/api/cli/stacks', method: 'GET', handler: stackGet })
http.route({ path: '/api/cli/sync', method: 'POST', handler: syncPublish })
http.route({ path: '/api/cli/sync-config', method: 'GET', handler: syncConfig })
http.route({ path: '/api/cli/sync-manifest', method: 'GET', handler: syncManifest })
http.route({ path: '/api/cli/auto-sync', method: 'POST', handler: autoSyncSet })
http.route({ path: '/api/email/unsubscribe', method: 'GET', handler: unsubscribe })
http.route({ path: '/api/email/unsubscribe', method: 'POST', handler: unsubscribe })
http.route({ path: INTERACTIONS_PATH, method: 'POST', handler: interactions })
http.route({ path: PRICES_PATH, method: 'GET', handler: pricesGet })

export default http

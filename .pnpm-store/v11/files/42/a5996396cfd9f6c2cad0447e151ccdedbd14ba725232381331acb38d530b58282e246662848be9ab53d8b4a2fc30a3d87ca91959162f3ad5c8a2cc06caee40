import { DehydratedMatch } from './types.js';
import { AnyRouter } from '../router.js';
import { AnyRouteMatch } from '../Matches.js';
import { Manifest } from '../manifest.js';
declare module '../router' {
    interface ServerSsr {
        setRenderFinished: () => void;
        cleanup: () => void;
    }
    interface RouterEvents {
        onInjectedHtml: {
            type: 'onInjectedHtml';
        };
        onSerializationFinished: {
            type: 'onSerializationFinished';
        };
    }
}
export declare function dehydrateMatch(match: AnyRouteMatch): DehydratedMatch;
export declare function attachRouterServerSsrUtils({ router, manifest, }: {
    router: AnyRouter;
    manifest: Manifest | undefined;
}): void;
export declare function getOrigin(request: Request): string;

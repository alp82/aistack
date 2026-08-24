import { DehydratedMatch } from './types.cjs';
import { AnyRouter } from '../router.cjs';
import { AnyRouteMatch } from '../Matches.cjs';
import { Manifest } from '../manifest.cjs';
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

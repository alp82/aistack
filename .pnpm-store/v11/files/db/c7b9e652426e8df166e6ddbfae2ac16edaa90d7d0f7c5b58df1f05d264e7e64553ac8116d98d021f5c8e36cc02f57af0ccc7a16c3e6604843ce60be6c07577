import { RouterManagedTag } from '@tanstack/router-core';
/**
 * @description Returns the router manifest that should be sent to the client.
 * This includes only the assets and preloads for the current route and any
 * special assets that are needed for the client. It does not include relationships
 * between routes or any other data that is not needed for the client.
 */
export declare function getStartManifest(): Promise<{
    routes: {
        [k: string]: {
            preloads?: Array<string>;
            assets?: Array<RouterManagedTag>;
        };
    };
}>;

import { default as http } from 'node:http';
import { WebSocketServer } from 'ws';
export interface TanStackDevtoolsEvent<TEventName extends string, TPayload = any> {
    type: TEventName;
    payload: TPayload;
    pluginId?: string;
}
declare global {
    var __TANSTACK_DEVTOOLS_SERVER__: http.Server | null;
    var __TANSTACK_DEVTOOLS_WSS_SERVER__: WebSocketServer | null;
    var __TANSTACK_EVENT_TARGET__: EventTarget | null;
}
export interface ServerEventBusConfig {
    port?: number | undefined;
    debug?: boolean | undefined;
}
export declare class ServerEventBus {
    #private;
    constructor({ port, debug }?: ServerEventBusConfig);
    private debugLog;
    private emitToServer;
    private emitEventToClients;
    private emit;
    private createSSEServer;
    private createWebSocketServer;
    private handleNewConnection;
    start(): void;
    stop(): void;
}

export interface ClientEventBusConfig {
    /**
     * Optional flag to indicate if the devtools server event bus is available to connect to.
     * This is used to determine if the devtools can connect to the server for real-time event streams.
     */
    connectToServerBus?: boolean;
    /**
     * Optional flag to enable debug mode for the event bus.
     */
    debug?: boolean;
    /**
     * Optional port to connect to the devtools server event bus.
     * Defaults to 42069.
     */
    port?: number;
}
export declare class ClientEventBus {
    #private;
    constructor({ port, debug, connectToServerBus, }?: ClientEventBusConfig);
    private emitToClients;
    private emitToServer;
    start(): void;
    stop(): void;
    private getGlobalTarget;
    private debugLog;
    private connectSSE;
    private connectWebSocket;
    private connect;
    private handleEventReceived;
}

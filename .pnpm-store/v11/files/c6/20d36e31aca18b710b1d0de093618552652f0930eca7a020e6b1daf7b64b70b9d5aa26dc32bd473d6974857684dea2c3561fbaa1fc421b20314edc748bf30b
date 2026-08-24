export type TransactionMetrics = {
    bytesRead: number;
    bytesWritten: number;
    databaseQueries: number;
    documentsRead: number;
    documentsWritten: number;
    functionsScheduled: number;
    scheduledFunctionArgsBytes: number;
};
export declare class TransactionMetricsTracker {
    private _metrics;
    private _limits;
    private _enforceLimits;
    constructor(limits: Partial<TransactionMetrics> | boolean);
    trackRead(docSizeBytes: number): void;
    trackWrite(docSizeBytes: number): void;
    trackIndexRange(): void;
    trackScheduledFunction(argsSizeBytes: number): void;
    getTransactionMetrics(): {
        bytesRead: {
            used: number;
            remaining: number;
        };
        bytesWritten: {
            used: number;
            remaining: number;
        };
        databaseQueries: {
            used: number;
            remaining: number;
        };
        documentsRead: {
            used: number;
            remaining: number;
        };
        documentsWritten: {
            used: number;
            remaining: number;
        };
        functionsScheduled: {
            used: number;
            remaining: number;
        };
        scheduledFunctionArgsBytes: {
            used: number;
            remaining: number;
        };
    };
}
//# sourceMappingURL=transactionMetrics.d.ts.map
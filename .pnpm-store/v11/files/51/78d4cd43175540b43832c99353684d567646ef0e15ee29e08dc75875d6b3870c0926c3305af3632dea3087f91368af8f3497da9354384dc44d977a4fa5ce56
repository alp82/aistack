const MiB = 1 << 20;
const DEFAULT_TRANSACTION_LIMITS = {
    bytesRead: 16 * MiB,
    bytesWritten: 16 * MiB,
    documentsRead: 32_000,
    databaseQueries: 4_096,
    documentsWritten: 16_000,
    functionsScheduled: 1000,
    scheduledFunctionArgsBytes: 16 * MiB,
};
export class TransactionMetricsTracker {
    _metrics;
    _limits;
    _enforceLimits;
    constructor(limits) {
        this._metrics = {
            bytesRead: 0,
            bytesWritten: 0,
            documentsRead: 0,
            documentsWritten: 0,
            databaseQueries: 0,
            functionsScheduled: 0,
            scheduledFunctionArgsBytes: 0,
        };
        if (limits === false) {
            this._enforceLimits = false;
            this._limits = DEFAULT_TRANSACTION_LIMITS;
        }
        else if (limits === true) {
            this._enforceLimits = true;
            this._limits = DEFAULT_TRANSACTION_LIMITS;
        }
        else {
            this._enforceLimits = true;
            this._limits = {
                ...DEFAULT_TRANSACTION_LIMITS,
                ...limits,
            };
        }
    }
    trackRead(docSizeBytes) {
        this._metrics.bytesRead += docSizeBytes;
        this._metrics.documentsRead += 1;
        if (this._enforceLimits) {
            if (this._metrics.bytesRead > this._limits.bytesRead) {
                throw new Error(`Read too much data in a single function execution (limit: ${this._limits.bytesRead} bytes). ` +
                    `This is a Convex limit: https://docs.convex.dev/production/state/limits`);
            }
            if (this._metrics.documentsRead > this._limits.documentsRead) {
                throw new Error(`Scanned too many documents in a single function execution (limit: ${this._limits.documentsRead}). ` +
                    `This is a Convex limit: https://docs.convex.dev/production/state/limits`);
            }
        }
    }
    trackWrite(docSizeBytes) {
        this._metrics.bytesWritten += docSizeBytes;
        this._metrics.documentsWritten += 1;
        if (this._enforceLimits) {
            if (this._metrics.bytesWritten > this._limits.bytesWritten) {
                throw new Error(`Wrote too much data in a single function execution (limit: ${this._limits.bytesWritten} bytes). ` +
                    `This is a Convex limit: https://docs.convex.dev/production/state/limits`);
            }
            if (this._metrics.documentsWritten > this._limits.documentsWritten) {
                throw new Error(`Wrote too many documents in a single function execution (limit: ${this._limits.documentsWritten}). ` +
                    `This is a Convex limit: https://docs.convex.dev/production/state/limits`);
            }
        }
    }
    trackIndexRange() {
        this._metrics.databaseQueries += 1;
        if (this._enforceLimits) {
            if (this._metrics.databaseQueries > this._limits.databaseQueries) {
                throw new Error(`Too many index ranges read in a single function execution (limit: ${this._limits.databaseQueries}). ` +
                    `This is a Convex limit: https://docs.convex.dev/production/state/limits`);
            }
        }
    }
    trackScheduledFunction(argsSizeBytes) {
        this._metrics.functionsScheduled += 1;
        this._metrics.scheduledFunctionArgsBytes += argsSizeBytes;
        if (this._enforceLimits) {
            if (this._metrics.functionsScheduled > this._limits.functionsScheduled) {
                throw new Error(`Scheduled too many functions in a single function execution (limit: ${this._limits.functionsScheduled}). ` +
                    `This is a Convex limit: https://docs.convex.dev/production/state/limits`);
            }
            if (this._metrics.scheduledFunctionArgsBytes >
                this._limits.scheduledFunctionArgsBytes) {
                throw new Error(`Scheduled function arguments too large in a single function execution (limit: ${this._limits.scheduledFunctionArgsBytes} bytes). ` +
                    `This is a Convex limit: https://docs.convex.dev/production/state/limits`);
            }
        }
    }
    getTransactionMetrics() {
        return {
            bytesRead: {
                used: this._metrics.bytesRead,
                remaining: this._limits.bytesRead - this._metrics.bytesRead,
            },
            bytesWritten: {
                used: this._metrics.bytesWritten,
                remaining: this._limits.bytesWritten - this._metrics.bytesWritten,
            },
            databaseQueries: {
                used: this._metrics.databaseQueries,
                remaining: this._limits.databaseQueries - this._metrics.databaseQueries,
            },
            documentsRead: {
                used: this._metrics.documentsRead,
                remaining: this._limits.documentsRead - this._metrics.documentsRead,
            },
            documentsWritten: {
                used: this._metrics.documentsWritten,
                remaining: this._limits.documentsWritten - this._metrics.documentsWritten,
            },
            functionsScheduled: {
                used: this._metrics.functionsScheduled,
                remaining: this._limits.functionsScheduled - this._metrics.functionsScheduled,
            },
            scheduledFunctionArgsBytes: {
                used: this._metrics.scheduledFunctionArgsBytes,
                remaining: this._limits.scheduledFunctionArgsBytes -
                    this._metrics.scheduledFunctionArgsBytes,
            },
        };
    }
}

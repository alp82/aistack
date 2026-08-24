import { ConvexClient } from "convex/browser";
/**
 * This is a helper for testing Convex functions against a locally running backend.
 *
 * An example of calling a function:
 * ```
 * const t = new ConvexTestingHelper();
 * const result = await t.query(api.foo.bar, { arg1: "baz" })
 * ```
 *
 * An example of calling a function with auth:
 * ```
 * const t = new ConvexTestingHelper();
 * const identityA = t.newIdentity({ name: "Person A"})
 * const result = await t.withIdentity(identityA).query(api.users.getProfile);
 * ```
 */
export class ConvexTestingHelper {
    _nextSubjectId = 0;
    client;
    _adminKey;
    constructor(options = {}) {
        this.client = new ConvexClient(options.backendUrl ?? "http://127.0.0.1:3210");
        this._adminKey =
            options.adminKey ??
                // default admin key for local backends - from https://github.com/get-convex/convex-backend/blob/main/Justfile
                "0135d8598650f8f5cb0f30c34ec2e2bb62793bc28717c8eb6fb577996d50be5f4281b59181095065c5d0f86a2c31ddbe9b597ec62b47ded69782cd";
    }
    newIdentity(args) {
        const subject = `test subject ${this._nextSubjectId}`;
        this._nextSubjectId += 1;
        const issuer = "test issuer";
        return {
            ...args,
            subject,
            issuer,
        };
    }
    withIdentity(identity) {
        return {
            mutation: (functionReference, args) => {
                this.client.setAdminAuth(this._adminKey, identity);
                return this.client.mutation(functionReference, args).finally(() => {
                    this.client.client.clearAuth();
                });
            },
            action: (functionReference, args) => {
                this.client.setAdminAuth(this._adminKey, identity);
                return this.client.action(functionReference, args).finally(() => {
                    this.client.client.clearAuth();
                });
            },
            query: (functionReference, args) => {
                this.client.setAdminAuth(this._adminKey, identity);
                return this.client.query(functionReference, args).finally(() => {
                    this.client.client.clearAuth();
                });
            },
        };
    }
    async mutation(mutation, args) {
        return this.client.mutation(mutation, args);
    }
    async query(query, args) {
        return this.client.query(query, args);
    }
    async action(action, args) {
        return this.client.action(action, args);
    }
    async close() {
        return this.client.close();
    }
}

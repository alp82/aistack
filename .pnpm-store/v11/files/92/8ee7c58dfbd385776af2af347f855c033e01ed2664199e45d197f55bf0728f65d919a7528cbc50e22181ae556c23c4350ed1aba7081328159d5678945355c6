import { AuthQueryAtom } from "./query.mjs";
import { BetterAuthClientOptions } from "@better-auth/core";
import { Session, User } from "@better-auth/core/db";
import { WritableAtom } from "nanostores";
import { BetterFetch } from "@better-fetch/fetch";

//#region src/client/session-refresh.d.ts
interface SessionRefreshOptions {
  sessionAtom: AuthQueryAtom<{
    user: User;
    session: Session;
  }>;
  sessionSignal: WritableAtom<boolean>;
  $fetch: BetterFetch;
  options?: BetterAuthClientOptions | undefined;
}
declare function createSessionRefreshManager(opts: SessionRefreshOptions): {
  init: () => void;
  cleanup: () => void;
  triggerRefetch: (event?: {
    event?: "poll" | "visibilitychange" | "storage";
  } | undefined) => void;
  broadcastSessionUpdate: (trigger: "signout" | "getSession" | "updateUser") => void;
};
//#endregion
export { SessionRefreshOptions, createSessionRefreshManager };
//# sourceMappingURL=session-refresh.d.mts.map
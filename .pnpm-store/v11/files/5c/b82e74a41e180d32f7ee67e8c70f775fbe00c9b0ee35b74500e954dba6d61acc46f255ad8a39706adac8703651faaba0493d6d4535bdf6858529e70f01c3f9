import { Subset } from "../../access/types.mjs";
import { AuthorizeResponse } from "../../access/access.mjs";
import "../../index.mjs";

//#region src/plugins/admin/access/statement.d.ts
declare const defaultStatements: {
  readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "delete", "set-password", "get", "update"];
  readonly session: readonly ["list", "revoke", "delete"];
};
declare const defaultAc: {
  newRole<K extends "session" | "user">(statements: Subset<K, {
    readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "delete", "set-password", "get", "update"];
    readonly session: readonly ["list", "revoke", "delete"];
  }>): {
    authorize<K_1 extends K>(request: K_1 extends infer T extends keyof Subset<K, {
      readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "delete", "set-password", "get", "update"];
      readonly session: readonly ["list", "revoke", "delete"];
    }> ? { [key in T]?: Subset<K, {
      readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "delete", "set-password", "get", "update"];
      readonly session: readonly ["list", "revoke", "delete"];
    }>[key] | {
      actions: Subset<K, {
        readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "delete", "set-password", "get", "update"];
        readonly session: readonly ["list", "revoke", "delete"];
      }>[key];
      connector: "OR" | "AND";
    } | undefined } : never, connector?: "OR" | "AND"): AuthorizeResponse;
    statements: Subset<K, {
      readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "delete", "set-password", "get", "update"];
      readonly session: readonly ["list", "revoke", "delete"];
    }>;
  };
  statements: {
    readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "delete", "set-password", "get", "update"];
    readonly session: readonly ["list", "revoke", "delete"];
  };
};
declare const adminAc: {
  authorize<K extends "session" | "user">(request: K extends infer T extends keyof Subset<"session" | "user", {
    readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "delete", "set-password", "get", "update"];
    readonly session: readonly ["list", "revoke", "delete"];
  }> ? { [key in T]?: Subset<"session" | "user", {
    readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "delete", "set-password", "get", "update"];
    readonly session: readonly ["list", "revoke", "delete"];
  }>[key] | {
    actions: Subset<"session" | "user", {
      readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "delete", "set-password", "get", "update"];
      readonly session: readonly ["list", "revoke", "delete"];
    }>[key];
    connector: "OR" | "AND";
  } | undefined } : never, connector?: "OR" | "AND"): AuthorizeResponse;
  statements: Subset<"session" | "user", {
    readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "delete", "set-password", "get", "update"];
    readonly session: readonly ["list", "revoke", "delete"];
  }>;
};
declare const userAc: {
  authorize<K extends "session" | "user">(request: K extends infer T extends keyof Subset<"session" | "user", {
    readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "delete", "set-password", "get", "update"];
    readonly session: readonly ["list", "revoke", "delete"];
  }> ? { [key in T]?: Subset<"session" | "user", {
    readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "delete", "set-password", "get", "update"];
    readonly session: readonly ["list", "revoke", "delete"];
  }>[key] | {
    actions: Subset<"session" | "user", {
      readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "delete", "set-password", "get", "update"];
      readonly session: readonly ["list", "revoke", "delete"];
    }>[key];
    connector: "OR" | "AND";
  } | undefined } : never, connector?: "OR" | "AND"): AuthorizeResponse;
  statements: Subset<"session" | "user", {
    readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "delete", "set-password", "get", "update"];
    readonly session: readonly ["list", "revoke", "delete"];
  }>;
};
declare const defaultRoles: {
  admin: {
    authorize<K extends "session" | "user">(request: K extends infer T extends keyof Subset<"session" | "user", {
      readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "delete", "set-password", "get", "update"];
      readonly session: readonly ["list", "revoke", "delete"];
    }> ? { [key in T]?: Subset<"session" | "user", {
      readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "delete", "set-password", "get", "update"];
      readonly session: readonly ["list", "revoke", "delete"];
    }>[key] | {
      actions: Subset<"session" | "user", {
        readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "delete", "set-password", "get", "update"];
        readonly session: readonly ["list", "revoke", "delete"];
      }>[key];
      connector: "OR" | "AND";
    } | undefined } : never, connector?: "OR" | "AND"): AuthorizeResponse;
    statements: Subset<"session" | "user", {
      readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "delete", "set-password", "get", "update"];
      readonly session: readonly ["list", "revoke", "delete"];
    }>;
  };
  user: {
    authorize<K extends "session" | "user">(request: K extends infer T extends keyof Subset<"session" | "user", {
      readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "delete", "set-password", "get", "update"];
      readonly session: readonly ["list", "revoke", "delete"];
    }> ? { [key in T]?: Subset<"session" | "user", {
      readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "delete", "set-password", "get", "update"];
      readonly session: readonly ["list", "revoke", "delete"];
    }>[key] | {
      actions: Subset<"session" | "user", {
        readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "delete", "set-password", "get", "update"];
        readonly session: readonly ["list", "revoke", "delete"];
      }>[key];
      connector: "OR" | "AND";
    } | undefined } : never, connector?: "OR" | "AND"): AuthorizeResponse;
    statements: Subset<"session" | "user", {
      readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "delete", "set-password", "get", "update"];
      readonly session: readonly ["list", "revoke", "delete"];
    }>;
  };
};
//#endregion
export { adminAc, defaultAc, defaultRoles, defaultStatements, userAc };
//# sourceMappingURL=statement.d.mts.map
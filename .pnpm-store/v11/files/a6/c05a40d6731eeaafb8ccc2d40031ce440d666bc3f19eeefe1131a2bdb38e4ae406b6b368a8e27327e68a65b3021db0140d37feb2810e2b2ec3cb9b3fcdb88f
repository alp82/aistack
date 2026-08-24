import { Subset } from "../../access/types.mjs";
import { AuthorizeResponse } from "../../access/access.mjs";
import "../../index.mjs";

//#region src/plugins/organization/access/statement.d.ts
declare const defaultStatements: {
  readonly organization: readonly ["update", "delete"];
  readonly member: readonly ["create", "update", "delete"];
  readonly invitation: readonly ["create", "cancel"];
  readonly team: readonly ["create", "update", "delete"];
  readonly ac: readonly ["create", "read", "update", "delete"];
};
declare const defaultAc: {
  newRole<K extends "organization" | "team" | "member" | "ac" | "invitation">(statements: Subset<K, {
    readonly organization: readonly ["update", "delete"];
    readonly member: readonly ["create", "update", "delete"];
    readonly invitation: readonly ["create", "cancel"];
    readonly team: readonly ["create", "update", "delete"];
    readonly ac: readonly ["create", "read", "update", "delete"];
  }>): {
    authorize<K_1 extends K>(request: K_1 extends infer T extends keyof Subset<K, {
      readonly organization: readonly ["update", "delete"];
      readonly member: readonly ["create", "update", "delete"];
      readonly invitation: readonly ["create", "cancel"];
      readonly team: readonly ["create", "update", "delete"];
      readonly ac: readonly ["create", "read", "update", "delete"];
    }> ? { [key in T]?: Subset<K, {
      readonly organization: readonly ["update", "delete"];
      readonly member: readonly ["create", "update", "delete"];
      readonly invitation: readonly ["create", "cancel"];
      readonly team: readonly ["create", "update", "delete"];
      readonly ac: readonly ["create", "read", "update", "delete"];
    }>[key] | {
      actions: Subset<K, {
        readonly organization: readonly ["update", "delete"];
        readonly member: readonly ["create", "update", "delete"];
        readonly invitation: readonly ["create", "cancel"];
        readonly team: readonly ["create", "update", "delete"];
        readonly ac: readonly ["create", "read", "update", "delete"];
      }>[key];
      connector: "OR" | "AND";
    } | undefined } : never, connector?: "OR" | "AND"): AuthorizeResponse;
    statements: Subset<K, {
      readonly organization: readonly ["update", "delete"];
      readonly member: readonly ["create", "update", "delete"];
      readonly invitation: readonly ["create", "cancel"];
      readonly team: readonly ["create", "update", "delete"];
      readonly ac: readonly ["create", "read", "update", "delete"];
    }>;
  };
  statements: {
    readonly organization: readonly ["update", "delete"];
    readonly member: readonly ["create", "update", "delete"];
    readonly invitation: readonly ["create", "cancel"];
    readonly team: readonly ["create", "update", "delete"];
    readonly ac: readonly ["create", "read", "update", "delete"];
  };
};
declare const adminAc: {
  authorize<K extends "organization" | "team" | "member" | "ac" | "invitation">(request: K extends infer T extends keyof Subset<"organization" | "team" | "member" | "ac" | "invitation", {
    readonly organization: readonly ["update", "delete"];
    readonly member: readonly ["create", "update", "delete"];
    readonly invitation: readonly ["create", "cancel"];
    readonly team: readonly ["create", "update", "delete"];
    readonly ac: readonly ["create", "read", "update", "delete"];
  }> ? { [key in T]?: Subset<"organization" | "team" | "member" | "ac" | "invitation", {
    readonly organization: readonly ["update", "delete"];
    readonly member: readonly ["create", "update", "delete"];
    readonly invitation: readonly ["create", "cancel"];
    readonly team: readonly ["create", "update", "delete"];
    readonly ac: readonly ["create", "read", "update", "delete"];
  }>[key] | {
    actions: Subset<"organization" | "team" | "member" | "ac" | "invitation", {
      readonly organization: readonly ["update", "delete"];
      readonly member: readonly ["create", "update", "delete"];
      readonly invitation: readonly ["create", "cancel"];
      readonly team: readonly ["create", "update", "delete"];
      readonly ac: readonly ["create", "read", "update", "delete"];
    }>[key];
    connector: "OR" | "AND";
  } | undefined } : never, connector?: "OR" | "AND"): AuthorizeResponse;
  statements: Subset<"organization" | "team" | "member" | "ac" | "invitation", {
    readonly organization: readonly ["update", "delete"];
    readonly member: readonly ["create", "update", "delete"];
    readonly invitation: readonly ["create", "cancel"];
    readonly team: readonly ["create", "update", "delete"];
    readonly ac: readonly ["create", "read", "update", "delete"];
  }>;
};
declare const ownerAc: {
  authorize<K extends "organization" | "team" | "member" | "ac" | "invitation">(request: K extends infer T extends keyof Subset<"organization" | "team" | "member" | "ac" | "invitation", {
    readonly organization: readonly ["update", "delete"];
    readonly member: readonly ["create", "update", "delete"];
    readonly invitation: readonly ["create", "cancel"];
    readonly team: readonly ["create", "update", "delete"];
    readonly ac: readonly ["create", "read", "update", "delete"];
  }> ? { [key in T]?: Subset<"organization" | "team" | "member" | "ac" | "invitation", {
    readonly organization: readonly ["update", "delete"];
    readonly member: readonly ["create", "update", "delete"];
    readonly invitation: readonly ["create", "cancel"];
    readonly team: readonly ["create", "update", "delete"];
    readonly ac: readonly ["create", "read", "update", "delete"];
  }>[key] | {
    actions: Subset<"organization" | "team" | "member" | "ac" | "invitation", {
      readonly organization: readonly ["update", "delete"];
      readonly member: readonly ["create", "update", "delete"];
      readonly invitation: readonly ["create", "cancel"];
      readonly team: readonly ["create", "update", "delete"];
      readonly ac: readonly ["create", "read", "update", "delete"];
    }>[key];
    connector: "OR" | "AND";
  } | undefined } : never, connector?: "OR" | "AND"): AuthorizeResponse;
  statements: Subset<"organization" | "team" | "member" | "ac" | "invitation", {
    readonly organization: readonly ["update", "delete"];
    readonly member: readonly ["create", "update", "delete"];
    readonly invitation: readonly ["create", "cancel"];
    readonly team: readonly ["create", "update", "delete"];
    readonly ac: readonly ["create", "read", "update", "delete"];
  }>;
};
declare const memberAc: {
  authorize<K extends "organization" | "team" | "member" | "ac" | "invitation">(request: K extends infer T extends keyof Subset<"organization" | "team" | "member" | "ac" | "invitation", {
    readonly organization: readonly ["update", "delete"];
    readonly member: readonly ["create", "update", "delete"];
    readonly invitation: readonly ["create", "cancel"];
    readonly team: readonly ["create", "update", "delete"];
    readonly ac: readonly ["create", "read", "update", "delete"];
  }> ? { [key in T]?: Subset<"organization" | "team" | "member" | "ac" | "invitation", {
    readonly organization: readonly ["update", "delete"];
    readonly member: readonly ["create", "update", "delete"];
    readonly invitation: readonly ["create", "cancel"];
    readonly team: readonly ["create", "update", "delete"];
    readonly ac: readonly ["create", "read", "update", "delete"];
  }>[key] | {
    actions: Subset<"organization" | "team" | "member" | "ac" | "invitation", {
      readonly organization: readonly ["update", "delete"];
      readonly member: readonly ["create", "update", "delete"];
      readonly invitation: readonly ["create", "cancel"];
      readonly team: readonly ["create", "update", "delete"];
      readonly ac: readonly ["create", "read", "update", "delete"];
    }>[key];
    connector: "OR" | "AND";
  } | undefined } : never, connector?: "OR" | "AND"): AuthorizeResponse;
  statements: Subset<"organization" | "team" | "member" | "ac" | "invitation", {
    readonly organization: readonly ["update", "delete"];
    readonly member: readonly ["create", "update", "delete"];
    readonly invitation: readonly ["create", "cancel"];
    readonly team: readonly ["create", "update", "delete"];
    readonly ac: readonly ["create", "read", "update", "delete"];
  }>;
};
declare const defaultRoles: {
  admin: {
    authorize<K extends "organization" | "team" | "member" | "ac" | "invitation">(request: K extends infer T extends keyof Subset<"organization" | "team" | "member" | "ac" | "invitation", {
      readonly organization: readonly ["update", "delete"];
      readonly member: readonly ["create", "update", "delete"];
      readonly invitation: readonly ["create", "cancel"];
      readonly team: readonly ["create", "update", "delete"];
      readonly ac: readonly ["create", "read", "update", "delete"];
    }> ? { [key in T]?: Subset<"organization" | "team" | "member" | "ac" | "invitation", {
      readonly organization: readonly ["update", "delete"];
      readonly member: readonly ["create", "update", "delete"];
      readonly invitation: readonly ["create", "cancel"];
      readonly team: readonly ["create", "update", "delete"];
      readonly ac: readonly ["create", "read", "update", "delete"];
    }>[key] | {
      actions: Subset<"organization" | "team" | "member" | "ac" | "invitation", {
        readonly organization: readonly ["update", "delete"];
        readonly member: readonly ["create", "update", "delete"];
        readonly invitation: readonly ["create", "cancel"];
        readonly team: readonly ["create", "update", "delete"];
        readonly ac: readonly ["create", "read", "update", "delete"];
      }>[key];
      connector: "OR" | "AND";
    } | undefined } : never, connector?: "OR" | "AND"): AuthorizeResponse;
    statements: Subset<"organization" | "team" | "member" | "ac" | "invitation", {
      readonly organization: readonly ["update", "delete"];
      readonly member: readonly ["create", "update", "delete"];
      readonly invitation: readonly ["create", "cancel"];
      readonly team: readonly ["create", "update", "delete"];
      readonly ac: readonly ["create", "read", "update", "delete"];
    }>;
  };
  owner: {
    authorize<K extends "organization" | "team" | "member" | "ac" | "invitation">(request: K extends infer T extends keyof Subset<"organization" | "team" | "member" | "ac" | "invitation", {
      readonly organization: readonly ["update", "delete"];
      readonly member: readonly ["create", "update", "delete"];
      readonly invitation: readonly ["create", "cancel"];
      readonly team: readonly ["create", "update", "delete"];
      readonly ac: readonly ["create", "read", "update", "delete"];
    }> ? { [key in T]?: Subset<"organization" | "team" | "member" | "ac" | "invitation", {
      readonly organization: readonly ["update", "delete"];
      readonly member: readonly ["create", "update", "delete"];
      readonly invitation: readonly ["create", "cancel"];
      readonly team: readonly ["create", "update", "delete"];
      readonly ac: readonly ["create", "read", "update", "delete"];
    }>[key] | {
      actions: Subset<"organization" | "team" | "member" | "ac" | "invitation", {
        readonly organization: readonly ["update", "delete"];
        readonly member: readonly ["create", "update", "delete"];
        readonly invitation: readonly ["create", "cancel"];
        readonly team: readonly ["create", "update", "delete"];
        readonly ac: readonly ["create", "read", "update", "delete"];
      }>[key];
      connector: "OR" | "AND";
    } | undefined } : never, connector?: "OR" | "AND"): AuthorizeResponse;
    statements: Subset<"organization" | "team" | "member" | "ac" | "invitation", {
      readonly organization: readonly ["update", "delete"];
      readonly member: readonly ["create", "update", "delete"];
      readonly invitation: readonly ["create", "cancel"];
      readonly team: readonly ["create", "update", "delete"];
      readonly ac: readonly ["create", "read", "update", "delete"];
    }>;
  };
  member: {
    authorize<K extends "organization" | "team" | "member" | "ac" | "invitation">(request: K extends infer T extends keyof Subset<"organization" | "team" | "member" | "ac" | "invitation", {
      readonly organization: readonly ["update", "delete"];
      readonly member: readonly ["create", "update", "delete"];
      readonly invitation: readonly ["create", "cancel"];
      readonly team: readonly ["create", "update", "delete"];
      readonly ac: readonly ["create", "read", "update", "delete"];
    }> ? { [key in T]?: Subset<"organization" | "team" | "member" | "ac" | "invitation", {
      readonly organization: readonly ["update", "delete"];
      readonly member: readonly ["create", "update", "delete"];
      readonly invitation: readonly ["create", "cancel"];
      readonly team: readonly ["create", "update", "delete"];
      readonly ac: readonly ["create", "read", "update", "delete"];
    }>[key] | {
      actions: Subset<"organization" | "team" | "member" | "ac" | "invitation", {
        readonly organization: readonly ["update", "delete"];
        readonly member: readonly ["create", "update", "delete"];
        readonly invitation: readonly ["create", "cancel"];
        readonly team: readonly ["create", "update", "delete"];
        readonly ac: readonly ["create", "read", "update", "delete"];
      }>[key];
      connector: "OR" | "AND";
    } | undefined } : never, connector?: "OR" | "AND"): AuthorizeResponse;
    statements: Subset<"organization" | "team" | "member" | "ac" | "invitation", {
      readonly organization: readonly ["update", "delete"];
      readonly member: readonly ["create", "update", "delete"];
      readonly invitation: readonly ["create", "cancel"];
      readonly team: readonly ["create", "update", "delete"];
      readonly ac: readonly ["create", "read", "update", "delete"];
    }>;
  };
};
//#endregion
export { adminAc, defaultAc, defaultRoles, defaultStatements, memberAc, ownerAc };
//# sourceMappingURL=statement.d.mts.map
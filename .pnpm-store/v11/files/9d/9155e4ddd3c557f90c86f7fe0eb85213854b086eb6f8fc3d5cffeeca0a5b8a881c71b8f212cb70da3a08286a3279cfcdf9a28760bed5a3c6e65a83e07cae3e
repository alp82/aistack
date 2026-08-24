import { AccessControl, Role, Statements } from "../access/types.mjs";
import "../access/index.mjs";
import { AdminOptions, InferAdminRolesFromOption, SessionWithImpersonatedBy, UserWithRole } from "./types.mjs";
import { admin } from "./admin.mjs";
import "../index.mjs";

//#region src/plugins/admin/client.d.ts
interface AdminClientOptions {
  ac?: AccessControl | undefined;
  roles?: { [key in string]: Role } | undefined;
}
declare const adminClient: <O extends AdminClientOptions>(options?: O | undefined) => {
  id: "admin-client";
  $InferServerPlugin: ReturnType<typeof admin<{
    ac: O["ac"] extends AccessControl ? O["ac"] : AccessControl<{
      readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "delete", "set-password", "get", "update"];
      readonly session: readonly ["list", "revoke", "delete"];
    }>;
    roles: O["roles"] extends Record<string, Role> ? O["roles"] : {
      admin: Role;
      user: Role;
    };
  }>>;
  getActions: () => {
    admin: {
      checkRolePermission: <R extends (O extends {
        roles: any;
      } ? keyof O["roles"] : "admin" | "user")>(data: ({
        /**
         * @deprecated Use `permissions` instead
         */
        permission: { [key in keyof (O["ac"] extends AccessControl<infer S extends Statements> ? S : {
          readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "delete", "set-password", "get", "update"];
          readonly session: readonly ["list", "revoke", "delete"];
        })]?: ((O["ac"] extends AccessControl<infer S extends Statements> ? S : {
          readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "delete", "set-password", "get", "update"];
          readonly session: readonly ["list", "revoke", "delete"];
        })[key] extends readonly unknown[] ? (O["ac"] extends AccessControl<infer S extends Statements> ? S : {
          readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "delete", "set-password", "get", "update"];
          readonly session: readonly ["list", "revoke", "delete"];
        })[key][number] : never)[] | undefined };
        permissions?: never | undefined;
      } | {
        permissions: { [key in keyof (O["ac"] extends AccessControl<infer S extends Statements> ? S : {
          readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "delete", "set-password", "get", "update"];
          readonly session: readonly ["list", "revoke", "delete"];
        })]?: ((O["ac"] extends AccessControl<infer S extends Statements> ? S : {
          readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "delete", "set-password", "get", "update"];
          readonly session: readonly ["list", "revoke", "delete"];
        })[key] extends readonly unknown[] ? (O["ac"] extends AccessControl<infer S extends Statements> ? S : {
          readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "delete", "set-password", "get", "update"];
          readonly session: readonly ["list", "revoke", "delete"];
        })[key][number] : never)[] | undefined };
        permission?: never | undefined;
      }) & {
        role: R;
      }) => boolean;
    };
  };
  pathMethods: {
    "/admin/list-users": "GET";
    "/admin/stop-impersonating": "POST";
  };
};
//#endregion
export { adminClient };
//# sourceMappingURL=client.d.mts.map
import { Session, User } from "../../types/models.mjs";
import { InferOptionSchema } from "../../types/plugins.mjs";
import "../../types/index.mjs";
import { AccessControl, Role } from "../access/types.mjs";
import "../access/index.mjs";
import { AdminSchema } from "./schema.mjs";

//#region src/plugins/admin/types.d.ts
interface UserWithRole extends User {
  role?: string | undefined;
  banned: boolean | null;
  banReason?: (string | null) | undefined;
  banExpires?: (Date | null) | undefined;
}
interface SessionWithImpersonatedBy extends Session {
  impersonatedBy?: string | undefined;
}
interface AdminOptions {
  /**
   * The default role for a user
   *
   * @default "user"
   */
  defaultRole?: string | undefined;
  /**
   * Roles that are considered admin roles.
   *
   * Any user role that isn't in this list, even if they have the permission,
   * will not be considered an admin.
   *
   * @default ["admin"]
   */
  adminRoles?: (string | string[]) | undefined;
  /**
   * A default ban reason
   *
   * By default, no reason is provided
   */
  defaultBanReason?: string | undefined;
  /**
   * Number of seconds until the ban expires
   *
   * By default, the ban never expires
   */
  defaultBanExpiresIn?: number | undefined;
  /**
   * Duration of the impersonation session in seconds
   *
   * By default, the impersonation session lasts 1 hour
   */
  impersonationSessionDuration?: number | undefined;
  /**
   * Custom schema for the admin plugin
   */
  schema?: InferOptionSchema<AdminSchema> | undefined;
  /**
   * Configure the roles and permissions for the admin
   * plugin.
   */
  ac?: AccessControl | undefined;
  /**
   * Custom permissions for roles.
   */
  roles?: { [key in string]?: Role } | undefined;
  /**
   * List of user ids that should have admin access
   *
   * If this is set, the `adminRole` option is ignored
   */
  adminUserIds?: string[] | undefined;
  /**
   * Message to show when a user is banned
   *
   * By default, the message is "You have been banned from this application"
   */
  bannedUserMessage?: string | undefined;
  /**
   * Whether to allow impersonating other admins
   *
   * @default false
   */
  allowImpersonatingAdmins?: boolean | undefined;
}
type InferAdminRolesFromOption<O extends AdminOptions | undefined> = O extends {
  roles: Record<string, unknown>;
} ? keyof O["roles"] : "user" | "admin";
//#endregion
export { AdminOptions, InferAdminRolesFromOption, SessionWithImpersonatedBy, UserWithRole };
//# sourceMappingURL=types.d.mts.map
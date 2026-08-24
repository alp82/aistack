import "../access/index.mjs";
import { OrganizationOptions } from "./types.mjs";

//#region src/plugins/organization/permission.d.ts

type PermissionExclusive = {
  /**
   * @deprecated Use `permissions` instead
   */
  permission: {
    [key: string]: string[];
  };
  permissions?: never | undefined;
} | {
  permissions: {
    [key: string]: string[];
  };
  permission?: never | undefined;
};
type HasPermissionBaseInput = {
  role: string;
  options: OrganizationOptions;
  allowCreatorAllPermissions?: boolean | undefined;
} & PermissionExclusive;
//#endregion
export { HasPermissionBaseInput };
//# sourceMappingURL=permission.d.mts.map
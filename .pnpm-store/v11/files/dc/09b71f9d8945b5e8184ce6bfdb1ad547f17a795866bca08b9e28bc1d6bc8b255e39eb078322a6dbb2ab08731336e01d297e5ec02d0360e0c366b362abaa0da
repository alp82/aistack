import * as _better_auth_core_db21 from "@better-auth/core/db";

//#region src/plugins/username/schema.d.ts
declare const getSchema: (normalizer: {
  username: (username: string) => string;
  displayUsername: (displayUsername: string) => string;
}) => {
  user: {
    fields: {
      username: {
        type: "string";
        required: false;
        sortable: true;
        unique: true;
        returned: true;
        transform: {
          input(value: _better_auth_core_db21.DBPrimitive): string | number | boolean | Date | unknown[] | Record<string, unknown> | null | undefined;
        };
      };
      displayUsername: {
        type: "string";
        required: false;
        transform: {
          input(value: _better_auth_core_db21.DBPrimitive): string | number | boolean | Date | unknown[] | Record<string, unknown> | null | undefined;
        };
      };
    };
  };
};
type UsernameSchema = ReturnType<typeof getSchema>;
//#endregion
export { UsernameSchema };
//# sourceMappingURL=schema.d.mts.map
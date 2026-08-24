//#region src/plugins/admin/schema.d.ts
declare const schema: {
  user: {
    fields: {
      role: {
        type: "string";
        required: false;
        input: false;
      };
      banned: {
        type: "boolean";
        defaultValue: false;
        required: false;
        input: false;
      };
      banReason: {
        type: "string";
        required: false;
        input: false;
      };
      banExpires: {
        type: "date";
        required: false;
        input: false;
      };
    };
  };
  session: {
    fields: {
      impersonatedBy: {
        type: "string";
        required: false;
      };
    };
  };
};
type AdminSchema = typeof schema;
//#endregion
export { AdminSchema };
//# sourceMappingURL=schema.d.mts.map
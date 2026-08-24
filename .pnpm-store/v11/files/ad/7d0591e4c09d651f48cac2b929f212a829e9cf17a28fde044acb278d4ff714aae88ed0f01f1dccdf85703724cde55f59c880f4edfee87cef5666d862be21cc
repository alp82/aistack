//#region src/plugins/two-factor/schema.d.ts
declare const schema: {
  user: {
    fields: {
      twoFactorEnabled: {
        type: "boolean";
        required: false;
        defaultValue: false;
        input: false;
      };
    };
  };
  twoFactor: {
    fields: {
      secret: {
        type: "string";
        required: true;
        returned: false;
        index: true;
      };
      backupCodes: {
        type: "string";
        required: true;
        returned: false;
      };
      userId: {
        type: "string";
        required: true;
        returned: false;
        references: {
          model: string;
          field: string;
        };
        index: true;
      };
    };
  };
};
//#endregion
export { schema };
//# sourceMappingURL=schema.d.mts.map
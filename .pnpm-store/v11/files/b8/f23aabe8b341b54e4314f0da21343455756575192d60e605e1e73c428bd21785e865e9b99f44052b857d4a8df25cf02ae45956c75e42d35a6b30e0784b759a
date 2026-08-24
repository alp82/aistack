//#region src/plugins/siwe/schema.d.ts
declare const schema: {
  walletAddress: {
    fields: {
      userId: {
        type: "string";
        references: {
          model: string;
          field: string;
        };
        required: true;
        index: true;
      };
      address: {
        type: "string";
        required: true;
      };
      chainId: {
        type: "number";
        required: true;
      };
      isPrimary: {
        type: "boolean";
        defaultValue: false;
      };
      createdAt: {
        type: "date";
        required: true;
      };
    };
  };
};
//#endregion
export { schema };
//# sourceMappingURL=schema.d.mts.map
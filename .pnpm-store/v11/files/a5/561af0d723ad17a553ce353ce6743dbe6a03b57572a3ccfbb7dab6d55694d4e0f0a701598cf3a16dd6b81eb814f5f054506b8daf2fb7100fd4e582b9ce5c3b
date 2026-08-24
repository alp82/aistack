import * as z from "zod";

//#region src/plugins/oidc-provider/schema.d.ts
declare const oAuthApplicationSchema: z.ZodObject<{
  clientId: z.ZodString;
  clientSecret: z.ZodOptional<z.ZodString>;
  type: z.ZodEnum<{
    public: "public";
    web: "web";
    native: "native";
    "user-agent-based": "user-agent-based";
  }>;
  name: z.ZodString;
  icon: z.ZodOptional<z.ZodString>;
  metadata: z.ZodOptional<z.ZodString>;
  disabled: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
  redirectUrls: z.ZodString;
  userId: z.ZodOptional<z.ZodString>;
  createdAt: z.ZodDate;
  updatedAt: z.ZodDate;
}, z.core.$strip>;
type OAuthApplication = z.infer<typeof oAuthApplicationSchema>;
declare const schema: {
  oauthApplication: {
    modelName: string;
    fields: {
      name: {
        type: "string";
      };
      icon: {
        type: "string";
        required: false;
      };
      metadata: {
        type: "string";
        required: false;
      };
      clientId: {
        type: "string";
        unique: true;
      };
      clientSecret: {
        type: "string";
        required: false;
      };
      redirectUrls: {
        type: "string";
      };
      type: {
        type: "string";
      };
      disabled: {
        type: "boolean";
        required: false;
        defaultValue: false;
      };
      userId: {
        type: "string";
        required: false;
        references: {
          model: string;
          field: string;
          onDelete: "cascade";
        };
        index: true;
      };
      createdAt: {
        type: "date";
      };
      updatedAt: {
        type: "date";
      };
    };
  };
  oauthAccessToken: {
    modelName: string;
    fields: {
      accessToken: {
        type: "string";
        unique: true;
      };
      refreshToken: {
        type: "string";
        unique: true;
      };
      accessTokenExpiresAt: {
        type: "date";
      };
      refreshTokenExpiresAt: {
        type: "date";
      };
      clientId: {
        type: "string";
        references: {
          model: string;
          field: string;
          onDelete: "cascade";
        };
        index: true;
      };
      userId: {
        type: "string";
        required: false;
        references: {
          model: string;
          field: string;
          onDelete: "cascade";
        };
        index: true;
      };
      scopes: {
        type: "string";
      };
      createdAt: {
        type: "date";
      };
      updatedAt: {
        type: "date";
      };
    };
  };
  oauthConsent: {
    modelName: string;
    fields: {
      clientId: {
        type: "string";
        references: {
          model: string;
          field: string;
          onDelete: "cascade";
        };
        index: true;
      };
      userId: {
        type: "string";
        references: {
          model: string;
          field: string;
          onDelete: "cascade";
        };
        index: true;
      };
      scopes: {
        type: "string";
      };
      createdAt: {
        type: "date";
      };
      updatedAt: {
        type: "date";
      };
      consentGiven: {
        type: "boolean";
      };
    };
  };
};
//#endregion
export { OAuthApplication, schema };
//# sourceMappingURL=schema.d.mts.map
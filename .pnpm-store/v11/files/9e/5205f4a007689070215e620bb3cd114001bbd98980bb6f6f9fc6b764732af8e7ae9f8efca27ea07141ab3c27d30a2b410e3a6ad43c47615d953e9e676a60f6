import { AuthContext, BetterAuthOptions } from "@better-auth/core";
import { DBFieldAttributeConfig, DBFieldType } from "@better-auth/core/db";
import { OpenAPIParameter, OpenAPISchemaType } from "better-call";

//#region src/plugins/open-api/generator.d.ts
interface Path {
  get?: {
    tags?: string[];
    operationId?: string;
    description?: string;
    security?: [{
      bearerAuth: string[];
    }];
    parameters?: OpenAPIParameter[];
    responses?: { [key in string]: {
      description?: string;
      content: {
        "application/json": {
          schema: {
            type?: OpenAPISchemaType;
            properties?: Record<string, any>;
            required?: string[];
            $ref?: string;
          };
        };
      };
    } };
  } | undefined;
  post?: {
    tags?: string[];
    operationId?: string;
    description?: string;
    security?: [{
      bearerAuth: string[];
    }];
    parameters?: OpenAPIParameter[];
    requestBody?: {
      content: {
        "application/json": {
          schema: {
            type?: OpenAPISchemaType;
            properties?: Record<string, any>;
            required?: string[];
            $ref?: string;
          };
        };
      };
    };
    responses?: { [key in string]: {
      description?: string;
      content: {
        "application/json": {
          schema: {
            type?: OpenAPISchemaType;
            properties?: Record<string, any>;
            required?: string[];
            $ref?: string;
          };
        };
      };
    } };
  } | undefined;
}
type FieldSchema = {
  type: DBFieldType;
  default?: (DBFieldAttributeConfig["defaultValue"] | "Generated at runtime") | undefined;
  readOnly?: boolean | undefined;
  format?: string;
};
type OpenAPIModelSchema = {
  type: "object";
  properties: Record<string, FieldSchema>;
  required?: string[] | undefined;
};
declare function generator(ctx: AuthContext, options: BetterAuthOptions): Promise<{
  openapi: string;
  info: {
    title: string;
    description: string;
    version: string;
  };
  components: {
    securitySchemes: {
      apiKeyCookie: {
        type: string;
        in: string;
        name: string;
        description: string;
      };
      bearerAuth: {
        type: string;
        scheme: string;
        description: string;
      };
    };
    schemas: {
      [x: string]: OpenAPIModelSchema;
    };
  };
  security: {
    apiKeyCookie: never[];
    bearerAuth: never[];
  }[];
  servers: {
    url: string;
  }[];
  tags: {
    name: string;
    description: string;
  }[];
  paths: Record<string, Path>;
}>;
//#endregion
export { FieldSchema, OpenAPIModelSchema, Path, generator };
//# sourceMappingURL=generator.d.mts.map
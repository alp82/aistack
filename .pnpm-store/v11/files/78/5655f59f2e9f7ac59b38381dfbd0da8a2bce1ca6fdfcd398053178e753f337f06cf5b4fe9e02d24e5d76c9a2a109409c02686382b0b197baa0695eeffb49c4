import { Endpoint } from "./endpoint.cjs";

//#region src/openapi.d.ts
type OpenAPISchemaType = "string" | "number" | "integer" | "boolean" | "array" | "object";
interface OpenAPIParameter {
  in: "query" | "path" | "header" | "cookie";
  name?: string;
  description?: string;
  required?: boolean;
  schema?: {
    type: OpenAPISchemaType;
    format?: string;
    items?: {
      type: OpenAPISchemaType;
    };
    enum?: string[];
    minLength?: number;
    description?: string;
    default?: string;
    example?: string;
  };
}
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
  };
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
  };
}
declare function generator(endpoints: Record<string, Endpoint>, config?: {
  url: string;
}): Promise<{
  openapi: string;
  info: {
    title: string;
    description: string;
    version: string;
  };
  components: {
    schemas: {};
  };
  security: {
    apiKeyCookie: never[];
  }[];
  servers: {
    url: string | undefined;
  }[];
  tags: {
    name: string;
    description: string;
  }[];
  paths: Record<string, Path>;
}>;
declare const getHTML: (apiReference: Record<string, any>, config?: {
  logo?: string;
  theme?: string;
  title?: string;
  description?: string;
}) => string;
//#endregion
export { OpenAPIParameter, OpenAPISchemaType, Path, generator, getHTML };
//# sourceMappingURL=openapi.d.cts.map
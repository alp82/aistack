import { validate, ValidationError } from "./validators.js";
/**
 * Convert a Convex validator to a Standard Schema.
 * @param validator - The Convex validator to convert.
 * @param opts - Options for the validation.
 * @returns The Standard Schema validator with the type of the Convex validator.
 */
export function toStandardSchema(validator, opts) {
    return {
        "~standard": {
            version: 1,
            vendor: "convex-helpers",
            validate: (value) => {
                try {
                    validate(validator, value, { ...opts, throw: true });
                    return { value };
                }
                catch (e) {
                    if (e instanceof ValidationError) {
                        return {
                            issues: [
                                {
                                    message: e.message,
                                    path: e.path ? e.path.split(".") : undefined,
                                },
                            ],
                        };
                    }
                    throw e;
                }
            },
        },
    };
}

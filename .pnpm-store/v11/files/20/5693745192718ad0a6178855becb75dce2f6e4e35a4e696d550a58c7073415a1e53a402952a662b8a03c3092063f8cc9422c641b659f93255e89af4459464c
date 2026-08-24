import consola from "consola";
const env = globalThis.process?.env;
const isTest = env?.NODE_ENV === "test" || !!env?.TEST;
if (!isTest) {
	consola.warn("Nitro runtime imports detected without a builder or Nitro plugin. A stub implementation will be used.");
}

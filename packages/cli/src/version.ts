// The one place the CLI's version string lives.
//
// `tsup` replaces `__AISTACK_CLI_VERSION__` at build time with the version in
// `package.json`, so a release cannot ship a stale number. The fallback covers
// running from source (tests, `tsx src/index.ts`), where no define happens.
declare const __AISTACK_CLI_VERSION__: string | undefined;

export const CLI_VERSION: string =
	typeof __AISTACK_CLI_VERSION__ === "string"
		? __AISTACK_CLI_VERSION__
		: "0.0.0-dev";

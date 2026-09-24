import { expect, it } from "vitest";
import { banner } from "./theme.js";
import { CLI_VERSION } from "./version.js";

const plain = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, "");

it("names the command and the running version in the banner", () => {
	expect(plain(banner("sync"))).toBe(`■  AISTACK  SYNC v${CLI_VERSION}`);
});

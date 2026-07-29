import { hostname } from "node:os";
import * as p from "@clack/prompts";
import open from "open";
import { authPoll, authStart } from "../api.js";
import { saveToken } from "../config.js";
import { dim, intro, lime, limeBold, outro, outroError } from "../theme.js";

/**
 * What to call this machine on the account's linked-machines list (#49).
 *
 * The hostname is only a proposal — the approval page shows it in an editable
 * field before anything is stored. Trimmed to the server's 64-character bound so
 * a long hostname is dropped by us rather than silently by the server, and
 * `.local` is stripped because mDNS suffixes carry no information for a reader.
 */
export function proposedMachineName(
	read: () => string = hostname,
): string | undefined {
	try {
		const name = read()
			.trim()
			.replace(/\.local$/i, "");
		if (!name || name.length > 64) return undefined;
		return name;
	} catch {
		return undefined;
	}
}

export async function loginCommand() {
	intro("login");

	const s = p.spinner();
	s.start("Starting authentication...");

	let session: Awaited<ReturnType<typeof authStart>>;
	try {
		session = await authStart(proposedMachineName());
		s.stop("Session created");
	} catch (err) {
		s.stop("Failed to start authentication");
		p.log.error(err instanceof Error ? err.message : String(err));
		outroError("error");
		process.exit(1);
	}

	p.log.info(`${dim("CODE")} ${limeBold(session.userCode)}`);
	p.log.info(`${dim("OPEN")} ${dim(session.authUrl)}`);

	try {
		await open(session.authUrl);
	} catch {
		p.log.warn(
			"Could not open browser automatically. Please visit the URL above.",
		);
	}

	s.start("Waiting for approval...");

	const maxAttempts = 36;
	for (let i = 0; i < maxAttempts; i++) {
		await new Promise((resolve) => setTimeout(resolve, 5000));

		try {
			const result = await authPoll(session.secretId);

			if (result.status === "approved" && result.token) {
				s.stop(lime("Authenticated"));
				saveToken(result.token, result.userId);
				p.log.success(
					`Token saved. Run ${limeBold("npx @use-aistack/cli collect")} to get started.`,
				);
				outro(lime("done"));
				return;
			}

			if (result.status === "expired") {
				s.stop("Session expired");
				p.log.error("Authentication session expired. Please try again.");
				outroError("expired");
				process.exit(1);
			}
		} catch (err) {
			s.stop("Error polling");
			p.log.error(err instanceof Error ? err.message : String(err));
			outroError("error");
			process.exit(1);
		}
	}

	s.stop("Timed out");
	p.log.error("Authentication timed out after 3 minutes. Please try again.");
	outroError("timed out");
	process.exit(1);
}

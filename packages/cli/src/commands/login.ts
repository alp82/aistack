import { hostname } from "node:os";
import * as p from "@clack/prompts";
import open from "open";
import { authPoll, authStart } from "../api.js";
import { saveToken } from "../config.js";
import { isDisplaySafeName } from "../harness/shared/aggregate.js";
import { dim, intro, lime, limeBold, outro, outroError } from "../theme.js";

/**
 * What to call this machine on the account's linked-machines list (#49).
 *
 * The hostname is only a proposal - the approval page shows it in an editable
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

/**
 * The device-auth flow itself, without intro/outro framing or process.exit -
 * so `sync` can run it inline on an unlinked machine (#74) and `login` stays
 * the standalone command. Logs its own progress and errors; returns whether a
 * token was saved.
 */
type LoginOptions = {
	label?: string;
	/** Existing bearer replaced atomically when this approval completes. */
	replaceToken?: string;
	/** A sync cannot finish login until the browser chooses a stack. */
	destinationRequired?: boolean;
};

export function requestedMachineLabel(label: string): string {
	const trimmed = label.trim();
	if (!isDisplaySafeName(trimmed)) {
		throw new Error(
			"Machine label must be 64 characters or fewer and contain only printable characters.",
		);
	}
	return trimmed;
}

export async function performLogin(
	options: LoginOptions = {},
): Promise<boolean> {
	const s = p.spinner();
	s.start("Starting authentication...");

	let session: Awaited<ReturnType<typeof authStart>>;
	try {
		const requestedLabel =
			options.label === undefined
				? undefined
				: requestedMachineLabel(options.label);
		session = await authStart(
			requestedLabel ?? proposedMachineName(),
			requestedLabel !== undefined,
			{
				...(options.replaceToken ? { replaceToken: options.replaceToken } : {}),
				...(options.destinationRequired ? { destinationRequired: true } : {}),
			},
		);
		s.stop("Session created");
	} catch (err) {
		s.stop("Failed to start authentication");
		p.log.error(err instanceof Error ? err.message : String(err));
		return false;
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
				return true;
			}

			if (result.status === "expired") {
				s.stop("Session expired");
				p.log.error("Authentication session expired. Please try again.");
				return false;
			}
		} catch (err) {
			s.stop("Error polling");
			p.log.error(err instanceof Error ? err.message : String(err));
			return false;
		}
	}

	s.stop("Timed out");
	p.log.error("Authentication timed out after 3 minutes. Please try again.");
	return false;
}

export async function loginCommand(options: LoginOptions = {}) {
	intro("login");

	if (!(await performLogin(options))) {
		outroError("error");
		process.exit(1);
	}

	p.log.success(
		`Token saved. Run ${limeBold("npx @use-aistack/cli sync")} to publish your usage.`,
	);
	outro(lime("done"));
}

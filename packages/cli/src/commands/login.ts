import * as p from "@clack/prompts";
import open from "open";
import { authStart, authPoll } from "../api.js";
import { saveToken } from "../config.js";
import { dim, intro, lime, limeBold, outro, outroError } from "../theme.js";

export async function loginCommand() {
	intro("login");

	const s = p.spinner();
	s.start("Starting authentication...");

	let session: Awaited<ReturnType<typeof authStart>>;
	try {
		session = await authStart();
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
					`Token saved. Run ${limeBold("aistack collect")} to get started.`,
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

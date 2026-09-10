# Cursor automatic sync lifecycle validation

Implements [Implement Cursor automatic sync and connection lifecycle](https://github.com/alp82/aistack/issues/392), following the accepted attribution contract.

The trigger is the user-level `stop` array in `~/.cursor/hooks.json`. Project hooks are not installed. [Cursor's hook reference](https://cursor.com/docs/hooks), checked 2026-09-10, documents that user configuration reloads automatically and is unavailable to cloud agents. The hook ignores event input and returns no output. It stores no event sidecar, email, credentials or history. Retained history already supplies the supported workflow metrics.

Installation preserves foreign stop commands, other events and settings. Reinstallation replaces the exact owned command across supported platform variants. Invalid configuration and write errors return a failed installation result, so measurement detection cannot masquerade as an installed trigger. Enable and reconciliation use the existing stack permission; disable closes the local gate before attempting removal or the remote revoke. Automatic runs never reinstall or ask for approval.

Launchers run the existing latest-npx command with its cached fallback in a detached process. Unix launchers use nohup (plus setsid on Linux); Windows explicitly invokes noninteractive PowerShell and Start-Process with encoded fixed script text to avoid differences in the parent shell's quoting. All child standard streams are discarded. Cursor failures remain in the existing local log and next manual-sync status, with no hook JSON or follow-up message.

Checks actually run:

- Temporary configuration tests: coexistence, repeated install, removal, malformed and unsupported configuration, write failures.
- Linux subprocess execution of both Unix launcher variants using a synthetic npx executable: detachment, discarded hook stdin, empty output and offline fallback. This does not establish native macOS execution.
- Windows command construction and decoded launcher assertions only.
- Consent lifecycle, missing-trigger reconciliation without prompts, removal failure after local revocation, failure-output suppression and repeated-stop throttle tests.
- Existing collector failure/cache tests, plus a synthetic SQLite credential replacement: a renewed token is reread with the same account scope, while another account uses a different scope.
- Targeted autosync and Cursor account/scan suites, no-em-dash check, CLI TypeScript check and bundled build.

Native checks still required for release: owner-approved manual sync and automatic Cursor stop delivery against the intended backend; actual unattended login reuse, expired/unavailable access fallback and reuse after Cursor renews its login; native macOS and Windows launcher execution and GUI PATH availability. The owner runs interactive login and sync in their own terminal. No native credentials, private history, paid sessions or owner approval gates were accessed during these checks. No version bump, push, deployment or publication is claimed.

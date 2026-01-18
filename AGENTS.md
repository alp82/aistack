# AI Stack Webapp

This is a webapp for sharing AI Stacks so that users can compare and choose the best set of tools for their needs.

## Main Features
* Currently a waitlist with demo characteristics
* Users will be able to share their AI Stacks, Tooling and Workflows

## Development Process
* Use the dev supervisor MCP to manage running the web and convex servers
* Never create or run convex migrations unless asked - we will re-seed from scratch every time the schema or seed changes
* Every time a CLI command is failing or stopped by me, assume I ran it for you successfully and just continue with your work
* Use Chrome Devtools MCP to review frontend updates and reiterate if they don't work/look as expected
* Ensure `README.md` is up to date

## Code Style
* Use proper types, never `any`

## Tech Stack
* `pnpm`
* TypeScript / Vite / Biome
* Tanstack Start
* Tanstack Query
* Tanstack Forms
* Tailwind CSS
* Lucide Icons
* Convex
* Better Auth
* Resend

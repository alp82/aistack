import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import type { ConvexQueryClient } from "@convex-dev/react-query";
import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Link,
	Outlet,
	Scripts,
	useRouteContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { createServerFn } from "@tanstack/react-start";
import { AlertCircle, Home } from "lucide-react";
import { Footer } from "../components/Footer";
import Header from "../components/Header";
import PosthogProvider from "../integrations/posthog/provider";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import { authClient } from "../lib/auth-client";
import { getToken } from "../lib/auth-server";
import { ThemeProvider } from "../lib/theme";
import appCss from "../styles.css?url";

const getAuth = createServerFn({ method: "GET" }).handler(async () => {
	return await getToken();
});

interface MyRouterContext {
	queryClient: QueryClient;
	convexQueryClient: ConvexQueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "AI Stack",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	beforeLoad: async (ctx) => {
		const token = await getAuth();
		if (token) {
			ctx.context.convexQueryClient.serverHttpClient?.setAuth(token);
		}
		return {
			isAuthenticated: !!token,
			token,
		};
	},
	component: RootComponent,
	notFoundComponent: NotFound,
});

function RootComponent() {
	const context = useRouteContext({ from: Route.id });
	return (
		<ConvexBetterAuthProvider
			client={context.convexQueryClient.convexClient}
			authClient={authClient}
			initialToken={context.token}
		>
			<PosthogProvider>
				<RootDocument>
					<Outlet />
				</RootDocument>
			</PosthogProvider>
		</ConvexBetterAuthProvider>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className="dark">
			<head>
				<HeadContent />
			</head>
			<body className="bg-bg-canvas">
				<ThemeProvider>
					<Header />
					{children}
					<Footer />
				</ThemeProvider>
				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
						TanStackQueryDevtools,
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}

function NotFound() {
	return (
		<RootDocument>
			<div className="min-h-screen bg-bg-canvas">
				<div className="flex items-center justify-center px-4 py-32">
					<div className="max-w-md border-[3px] border-stroke-strong bg-bg-panel p-8 text-center shadow-[6px_6px_0_var(--stroke-strong)]">
						<AlertCircle className="mx-auto mb-4 size-12 text-destructive" />
						<h1 className="mb-2 text-2xl font-bold text-fg-primary">
							Page Not Found
						</h1>
						<p className="mb-8 text-sm text-fg-secondary">
							The page you're looking for doesn't exist.
						</p>
						<Link
							to="/"
							className="inline-flex items-center gap-2 border-2 border-accent-lime bg-accent-lime px-5 py-3 font-mono text-sm font-semibold uppercase tracking-[0.1em] text-accent-lime-contrast transition-colors hover:bg-accent-lime-strong"
						>
							<Home className="size-4" />
							Go Home
						</Link>
					</div>
				</div>
			</div>
		</RootDocument>
	);
}

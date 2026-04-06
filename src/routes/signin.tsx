import { useConvexAuth } from "convex/react";
import {
	createFileRoute,
	useNavigate,
	useSearch,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthForm } from "../components/AuthForm";
import { authClient } from "../lib/auth-client";
import { seoMeta } from "../lib/seo";

type SignInSearch = {
	redirect?: string;
};

export const Route = createFileRoute("/signin")({
	component: SignInPage,
	validateSearch: (search: Record<string, unknown>): SignInSearch => {
		return {
			redirect:
				typeof search.redirect === "string" ? search.redirect : undefined,
		};
	},
	head: () => ({
		meta: seoMeta({
			title: "Sign In - AI Stack",
			description: "Sign in to AI Stack to share and manage your AI workflow.",
			noindex: true,
		}),
	}),
});

function SignInPage() {
	const navigate = useNavigate();
	const { redirect } = useSearch({ from: "/signin" });
	const { isAuthenticated } = useConvexAuth();
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (isAuthenticated) {
			navigate({ to: redirect || "/", replace: true });
		}
	}, [isAuthenticated, navigate, redirect]);

	const handleDevAdminLogin = async () => {
		setLoading(true);
		const devEmail = "dev-admin@example.com";
		const devPass = "password123";
		const devName = "Dev Admin";

		try {
			let result = await authClient.signIn.email({
				email: devEmail,
				password: devPass,
			});

			if (result.error) {
				const signUpResult = await authClient.signUp.email({
					email: devEmail,
					password: devPass,
					name: devName,
				});

				if (signUpResult.error) {
					throw new Error(
						`Login failed: ${result.error.message}. Signup failed: ${signUpResult.error.message}`,
					);
				}

				if (!signUpResult.data) {
					result = await authClient.signIn.email({
						email: devEmail,
						password: devPass,
					});
					if (result.error) throw new Error(result.error.message);
				}
			}

			await navigate({ to: redirect || "/admin" });
		} catch (err) {
			console.error(
				err instanceof Error
					? err.message
					: "Dev login failed. Ensure you are in development mode.",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen">
			{/* Left side - Bold typography */}
			<div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-end bg-bg-canvas px-12 xl:px-24 2xl:px-32 py-16 border-r-4 border-accent-lime">
				<div className="space-y-6 text-right max-w-2xl">
					<h1 className="text-[clamp(3rem,8vw,6rem)] font-black leading-[0.85] tracking-tighter text-fg-primary uppercase">
						WELCOME
						<br />
						<span className="text-accent-lime">BACK</span>
					</h1>
					<p className="font-mono text-base text-fg-muted leading-relaxed">
						Continue building and sharing your AI stack with passionate
						builders.
					</p>
				</div>
			</div>

			{/* Right side - Form */}
			<div className="flex-1 flex items-center justify-start px-6 py-12 sm:px-12 lg:px-16 xl:px-20 bg-bg-panel overflow-y-auto">
				<div className="w-full max-w-2xl space-y-8">
					<div>
						<h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter text-fg-primary uppercase leading-none">
							SIGN IN
						</h2>
						<p className="mt-4 font-mono text-sm text-fg-muted">
							Access your AI stack
						</p>
					</div>

					<AuthForm
						callbackURL={redirect || "/"}
						footer={
							import.meta.env.DEV ? (
								<div className="text-center">
									<button
										type="button"
										onClick={handleDevAdminLogin}
										disabled={loading}
										className="block mx-auto font-mono text-xs text-fg-muted/50 hover:text-destructive transition-colors disabled:opacity-50"
									>
										[dev] admin login
									</button>
								</div>
							) : undefined
						}
					/>
				</div>
			</div>
		</div>
	);
}

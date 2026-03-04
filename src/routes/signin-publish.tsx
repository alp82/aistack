import { useConvexAuth } from "convex/react";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthForm } from "../components/AuthForm";
import { TiptapEditor } from "../components/TiptapEditor";
import { EditorProvider } from "../features/stack-editor/context/EditorContext";
import { getDraftKey } from "../features/stack-editor/state/editorReducer";

type SignInPublishSearch = {
	redirect?: string;
};

export const Route = createFileRoute("/signin-publish")({
	component: SignInPublishPage,
	validateSearch: (search: Record<string, unknown>): SignInPublishSearch => {
		return {
			redirect: typeof search.redirect === "string" ? search.redirect : undefined,
		};
	},
});

interface GuestStackDraft {
	oneLiner: string;
	description: string;
	toolSubscriptions: Array<{
		toolName: string;
		toolCategories: string[];
		toolIconUrl?: string;
	}>;
	bundleSubscriptions?: Array<{
		bundleName: string;
		bundleIconUrl?: string;
	}>;
	modelSubscriptions?: Array<{
		modelName: string;
		modelProvider: string;
		modelIconUrl?: string;
	}>;
}

function SignInPublishPage() {
	return (
		<EditorProvider>
			<SignInPublishContent />
		</EditorProvider>
	);
}

function SignInPublishContent() {
	const navigate = useNavigate();
	const { redirect } = useSearch({ from: "/signin-publish" });
	const { isAuthenticated } = useConvexAuth();
	const [guestDraft, setGuestDraft] = useState<GuestStackDraft | null>(null);

	useEffect(() => {
		if (isAuthenticated) {
			navigate({ to: redirect || "/stacks/new", replace: true });
		}
	}, [isAuthenticated, navigate, redirect]);

	useEffect(() => {
		const saved = localStorage.getItem(getDraftKey(undefined));
		if (saved) {
			try {
				setGuestDraft(JSON.parse(saved));
			} catch {
				console.error("Failed to parse guest stack");
			}
		}
	}, []);

	return (
		<div className="flex min-h-screen">
			{/* Left side - Stack Preview */}
			<div className="hidden lg:flex justify-center lg:w-1/2 flex-col bg-bg-canvas px-12 xl:px-20 border-r-4 border-accent-lime overflow-y-auto">
				<div className="space-y-6">
					<div>
						<p className="font-mono text-xs uppercase tracking-widest text-accent-lime mb-2">
							// Your Stack Preview
						</p>
						<h2 className="text-3xl font-black tracking-tight text-fg-primary uppercase">
							Almost There!
						</h2>
						<p className="mt-2 font-mono text-sm text-fg-muted">
							Sign up to publish your stack and share it with the community.
						</p>
					</div>

					{guestDraft && (
						<div className="border-2 border-stroke-strong bg-bg-panel p-6 space-y-4">
							<div>
								<p className="font-mono text-[10px] uppercase tracking-widest text-fg-muted mb-1">
									One-liner
								</p>
								<p className="text-lg font-semibold text-fg-primary">
									{guestDraft.oneLiner || "Your AI Stack"}
								</p>
							</div>

							{guestDraft.description && (
								<div>
									<p className="font-mono text-[10px] uppercase tracking-widest text-fg-muted mb-1">
										Description
									</p>
									<div className="relative max-h-40 overflow-hidden text-sm text-fg-secondary">
										<TiptapEditor content={guestDraft.description} editable={false} className="space-y-2 [&_.ProseMirror]:min-h-0" />
										<div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-bg-panel to-transparent" />
									</div>
								</div>
							)}

							{guestDraft.toolSubscriptions?.length > 0 && (
								<div>
									<p className="font-mono text-[10px] uppercase tracking-widest text-fg-muted mb-2">
										Tools ({guestDraft.toolSubscriptions.length})
									</p>
									<div className="flex flex-wrap gap-2">
										{guestDraft.toolSubscriptions.slice(0, 8).map((tool, i) => (
											<div
												key={`${tool.toolName}-${i}`}
												className="flex items-center gap-2 border border-stroke-subtle bg-bg-panel-muted px-2 py-1 transition-colors hover:border-accent-lime hover:bg-accent-lime/10"
											>
												{tool.toolIconUrl ? (
													<img
														src={tool.toolIconUrl}
														alt={tool.toolName}
														className="size-4 rounded object-contain"
													/>
												) : (
													<div className="size-4 bg-accent-lime/20" />
												)}
												<span className="font-mono text-xs text-fg-secondary">
													{tool.toolName}
												</span>
											</div>
										))}
										{guestDraft.toolSubscriptions.length > 8 && (
											<span className="font-mono text-xs text-fg-muted px-2 py-1">
												+{guestDraft.toolSubscriptions.length - 8} more
											</span>
										)}
									</div>
								</div>
							)}

							{guestDraft.bundleSubscriptions && guestDraft.bundleSubscriptions.length > 0 && (
								<div>
									<p className="font-mono text-[10px] uppercase tracking-widest text-fg-muted mb-2">
										Bundles ({guestDraft.bundleSubscriptions.length})
									</p>
									<div className="flex flex-wrap gap-2">
										{guestDraft.bundleSubscriptions.slice(0, 8).map((bundle, i) => (
											<div
												key={`${bundle.bundleName}-${i}`}
												className="flex items-center gap-2 border border-stroke-subtle bg-bg-panel-muted px-2 py-1 transition-colors hover:border-accent-lime hover:bg-accent-lime/10"
											>
												{bundle.bundleIconUrl ? (
													<img
														src={bundle.bundleIconUrl}
														alt={bundle.bundleName}
														className="size-4 rounded object-contain"
													/>
												) : (
													<div className="size-4 bg-accent-lime/20" />
												)}
												<span className="font-mono text-xs text-fg-secondary">
													{bundle.bundleName}
												</span>
											</div>
										))}
										{guestDraft.bundleSubscriptions.length > 8 && (
											<span className="font-mono text-xs text-fg-muted px-2 py-1">
												+{guestDraft.bundleSubscriptions.length - 8} more
											</span>
										)}
									</div>
								</div>
							)}

							{guestDraft.modelSubscriptions && guestDraft.modelSubscriptions.length > 0 && (
								<div>
									<p className="font-mono text-[10px] uppercase tracking-widest text-fg-muted mb-2">
										Models ({guestDraft.modelSubscriptions.length})
									</p>
									<div className="flex flex-wrap gap-2">
										{guestDraft.modelSubscriptions.slice(0, 8).map((model, i) => (
											<div
												key={`${model.modelName}-${i}`}
												className="flex items-center gap-2 border border-stroke-subtle bg-bg-panel-muted px-2 py-1 transition-colors hover:border-accent-lime hover:bg-accent-lime/10"
											>
												{model.modelIconUrl ? (
													<img
														src={model.modelIconUrl}
														alt={model.modelName}
														className="size-4 rounded object-contain"
													/>
												) : (
													<div className="size-4 bg-accent-lime/20" />
												)}
												<span className="font-mono text-xs text-fg-secondary">
													{model.modelName}
												</span>
											</div>
										))}
										{guestDraft.modelSubscriptions.length > 8 && (
											<span className="font-mono text-xs text-fg-muted px-2 py-1">
												+{guestDraft.modelSubscriptions.length - 8} more
											</span>
										)}
									</div>
								</div>
							)}
						</div>
					)}

					<div className="border-2 border-dashed border-stroke-subtle p-4 bg-bg-panel-muted/50">
						<p className="font-mono text-xs text-fg-muted">
							<span className="text-accent-lime font-semibold">✓</span> Your progress is saved locally
						</p>
						<p className="font-mono text-xs text-fg-muted mt-1">
							<span className="text-accent-lime font-semibold">✓</span> Only registered users can publish stacks
						</p>
						<p className="font-mono text-xs text-fg-muted mt-1">
							<span className="text-accent-lime font-semibold">✓</span> Your stack will be live after sign up
						</p>
					</div>
				</div>

				<div className="font-mono text-xs text-fg-muted uppercase tracking-widest mt-8">
					Real AI workflows from passionate builders
				</div>
			</div>

			{/* Right side - Form */}
			<div className="flex-1 flex items-center justify-start px-6 py-12 sm:px-12 lg:px-16 xl:px-20 bg-bg-panel overflow-y-auto">
				<div className="w-full max-w-2xl space-y-6">
					{/* Mobile preview */}
					<div className="lg:hidden mb-8">
						<Link to="/" className="inline-flex items-center gap-2 mb-4">
							<div className="w-3 h-3 bg-accent-lime animate-pulse" style={{ boxShadow: '0 0 8px rgba(163, 230, 53, 0.6)' }} />
							<span className="font-bold text-fg-primary tracking-tighter text-xl">AI STACK</span>
						</Link>
						{guestDraft && (
							<div className="border border-stroke-subtle bg-bg-panel-muted p-3 mb-4">
								<p className="font-mono text-xs text-fg-muted">Publishing:</p>
								<p className="font-semibold text-fg-primary truncate">
									{guestDraft.oneLiner || "Your AI Stack"}
								</p>
							</div>
						)}
					</div>

					<div>
						<h2 className="text-3xl font-black tracking-tight text-fg-primary uppercase">
							Create Account
						</h2>
						<p className="mt-2 font-mono text-sm text-fg-muted">
							Join to publish your stack
						</p>
					</div>

					<AuthForm
						callbackURL={redirect || "/stacks/new"}
						defaultIsSignUp
						signUpSubmitLabel="Create Account & Publish"
						signInSubmitLabel="Sign In & Publish"
						footer={
							<div className="text-center">
								<Link
									to="/stacks/new"
									className="font-mono text-xs text-fg-muted hover:text-accent-lime transition-colors"
								>
									← Back to editor
								</Link>
							</div>
						}
					/>
				</div>
			</div>
		</div>
	);
}

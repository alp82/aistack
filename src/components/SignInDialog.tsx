import { Link, useLocation } from "@tanstack/react-router";
import { X } from "lucide-react";
import { Button } from "./ui/button";

interface SignInDialogProps {
	isOpen: boolean;
	onClose: () => void;
	message?: string;
	redirectTo?: string;
}

export function SignInDialog({ isOpen, onClose, message, redirectTo }: SignInDialogProps) {
	const location = useLocation();
	const redirect = redirectTo ?? location.pathname;

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<div
				className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				onClick={onClose}
			/>
			<div className="relative bg-slate-800 rounded-xl border border-gray-700 shadow-2xl max-w-md w-full mx-4 p-6">
				<Button
					variant="ghost"
					size="icon"
					onClick={onClose}
					className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
				>
					<X className="h-5 w-5" />
				</Button>

				<div className="text-center">
					<div className="mb-4">
						<div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4">
							<span className="text-2xl">🔐</span>
						</div>
						<h2 className="text-2xl font-bold text-white mb-2">
							Sign In Required
						</h2>
						<p className="text-gray-300 text-sm">
							{message ||
								"Please sign in to publish your stack and save it to the server."}
						</p>
					</div>

					<div className="flex flex-col gap-3 mt-6">
						<Link to="/signin" search={{ redirect }} className="w-full">
							<Button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white">
								Sign In
							</Button>
						</Link>
						<Button
							variant="ghost"
							onClick={onClose}
							className="w-full text-gray-400 hover:text-white"
						>
							Continue Editing
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}

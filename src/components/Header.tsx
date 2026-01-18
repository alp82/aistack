import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { WaitlistForm } from "./WaitlistForm";

export default function Header() {
	const [showWaitlistForm, setShowWaitlistForm] = useState(false);

	useEffect(() => {
		const checkVisibility = () => {
			const waitlistElements = document.querySelectorAll("[data-waitlist-cta]");
			if (waitlistElements.length === 0) {
				return;
			}

			const headerHeight = 60;
			let anyVisible = false;

			waitlistElements.forEach((el) => {
				const rect = el.getBoundingClientRect();
				const isVisible =
					rect.top < window.innerHeight && rect.bottom > headerHeight;
				if (isVisible) anyVisible = true;
			});

			setShowWaitlistForm(!anyVisible);
		};

		const timer = setTimeout(checkVisibility, 300);
		window.addEventListener("scroll", checkVisibility, { passive: true });
		window.addEventListener("resize", checkVisibility, { passive: true });

		return () => {
			clearTimeout(timer);
			window.removeEventListener("scroll", checkVisibility);
			window.removeEventListener("resize", checkVisibility);
		};
	}, []);

	return (
		<header className="sticky top-0 z-50 py-3 px-6 flex items-center justify-between bg-slate-950/60 backdrop-blur-xl text-white border-b border-slate-800/50">
			<div className="mx-auto max-w-7xl w-full flex items-center justify-between ">
				<Link
					to="/"
					className="flex items-center gap-2 text-xl font-bold hover:opacity-90 transition-opacity"
				>
					<img
						src="/aistack-logo.png"
						alt="AI Stack Logo"
						className="h-8 w-8"
					/>
					<span className="text-gray-200">AI</span>
					<span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
						Stack
					</span>
				</Link>

				{showWaitlistForm && (
					<div className="hidden md:block animate-in fade-in slide-in-from-right-4 duration-300">
						<WaitlistForm variant="header" />
					</div>
				)}
			</div>
		</header>
	);
}

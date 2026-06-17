import { useEffect, useRef, useState } from "react";

type UseClipboardOptions = {
	resetMs?: number;
};

export function useClipboard({ resetMs = 2000 }: UseClipboardOptions = {}): {
	copied: boolean;
	failed: boolean;
	copy: (text: string) => Promise<boolean>;
} {
	const [copied, setCopied] = useState(false);
	const [failed, setFailed] = useState(false);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const mountedRef = useRef(true);

	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
			if (timerRef.current !== null) {
				clearTimeout(timerRef.current);
			}
		};
	}, []);

	function markCopied() {
		if (timerRef.current !== null) {
			clearTimeout(timerRef.current);
		}
		if (!mountedRef.current) return;
		setCopied(true);
		setFailed(false);
		timerRef.current = setTimeout(() => {
			if (mountedRef.current) {
				setCopied(false);
			}
			timerRef.current = null;
		}, resetMs);
	}

	function markFailed() {
		if (timerRef.current !== null) {
			clearTimeout(timerRef.current);
		}
		if (!mountedRef.current) return;
		setFailed(true);
		setCopied(false);
		timerRef.current = setTimeout(() => {
			if (mountedRef.current) {
				setFailed(false);
			}
			timerRef.current = null;
		}, resetMs);
	}

	async function copy(text: string): Promise<boolean> {
		// Clear any pending reset so rapid re-copies restart the window.
		if (timerRef.current !== null) {
			clearTimeout(timerRef.current);
			timerRef.current = null;
		}

		if (navigator.clipboard?.writeText) {
			try {
				await navigator.clipboard.writeText(text);
				markCopied();
				return true;
			} catch {
				// Fall through to the execCommand fallback.
			}
		}

		const textarea = document.createElement("textarea");
		textarea.value = text;
		document.body.appendChild(textarea);
		try {
			textarea.select();
			const ok = document.execCommand("copy");
			if (ok) {
				markCopied();
				return true;
			}
		} catch {
			// Never show false "Copied" feedback on failure.
		} finally {
			document.body.removeChild(textarea);
		}

		markFailed();
		return false;
	}

	return { copied, failed, copy };
}

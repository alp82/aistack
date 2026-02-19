type SaveValidationInput = {
	oneLiner: string;
	publish: boolean;
	toolCount: number;
};

function canPublishStack(oneLiner: string, toolCount: number) {
	return oneLiner.trim().length > 0 && toolCount > 0;
}

function getSaveValidationError({ oneLiner, publish, toolCount }: SaveValidationInput) {
	if (!publish) {
		return null;
	}

	if (!oneLiner.trim()) {
		return "One-liner summary is required to publish";
	}

	if (toolCount === 0) {
		return "Add at least one tool before publishing";
	}

	return null;
}

export { canPublishStack, getSaveValidationError };
export type { SaveValidationInput };

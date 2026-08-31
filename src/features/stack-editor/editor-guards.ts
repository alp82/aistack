type SaveValidationInput = {
	oneLiner: string;
};

function canSaveStack(oneLiner: string) {
	return oneLiner.trim().length > 0;
}

function getSaveValidationError({ oneLiner }: SaveValidationInput) {
	if (!oneLiner.trim()) {
		return "One-liner summary is required";
	}

	return null;
}

export { canSaveStack, getSaveValidationError };
export type { SaveValidationInput };

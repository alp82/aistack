import { useState } from "react";

/**
 * Tag-input state machine shared by the project create/edit forms.
 * - `addTag` trims + lowercases + dedupes; whitespace-only/empty is a no-op.
 * - `removeTag` filters out the matched tag (no-op when absent).
 * - `reset` clears all tags and the pending input.
 */
function useTagInput(initialTags: string[] = []) {
	const [tags, setTags] = useState<string[]>(initialTags);
	const [tagInput, setTagInput] = useState("");

	const addTag = (raw?: string) => {
		const source = raw ?? tagInput;
		const trimmed = source.trim().toLowerCase();
		if (trimmed && !tags.includes(trimmed)) {
			setTags([...tags, trimmed]);
		}
		setTagInput("");
	};

	const removeTag = (tag: string) => {
		setTags(tags.filter((t) => t !== tag));
	};

	const reset = () => {
		setTags([]);
		setTagInput("");
	};

	return { tags, setTags, tagInput, setTagInput, addTag, removeTag, reset };
}

export { useTagInput };

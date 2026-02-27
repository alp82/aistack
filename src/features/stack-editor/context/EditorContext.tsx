import type { Editor } from "@tiptap/react";
import { createContext, useContext, useRef, useCallback, useState, type ReactNode } from "react";
import type { InstructionType } from "@/features/stack-editor/types";

export type ToolLookupData = {
	name: string;
	categories: string[];
	price?: { amount: number; period: string };
	tierName?: string;
	notes?: string;
};

export type ModelLookupData = {
	name: string;
	provider: string;
	category: string;
	notes?: string;
};

export type BundleLookupData = {
	name: string;
	price?: { amount: number; period: string };
	tierName?: string;
	description?: string;
	notes?: string;
};

export type InstructionLookupData = {
	name: string;
	type: InstructionType;
	description?: string;
};

type EditorContextValue = {
	registerEditor: (editor: Editor | null) => void;
	insertToolAtCursor: (tool: { name: string; iconUrl?: string }) => void;
	removeToolFromEditor: (toolName: string) => void;
	removeModelFromEditor: (modelName: string) => void;
	removeBundleFromEditor: (bundleName: string) => void;
	removeInstructionFromEditor: (instructionName: string) => void;
	insertModelAtCursor: (model: { name: string; provider: string; iconUrl?: string }) => void;
	insertBundleAtCursor: (bundle: { name: string; iconUrl?: string }) => void;
	insertInstructionAtCursor: (instruction: { name: string; type: InstructionType; content?: string }) => void;
	hoveredToolName: string | null;
	setHoveredToolName: (name: string | null) => void;
	toolLookup: Map<string, ToolLookupData>;
	setToolLookup: (data: Map<string, ToolLookupData>) => void;
	modelLookup: Map<string, ModelLookupData>;
	setModelLookup: (data: Map<string, ModelLookupData>) => void;
	bundleLookup: Map<string, BundleLookupData>;
	setBundleLookup: (data: Map<string, BundleLookupData>) => void;
	instructionLookup: Map<string, InstructionLookupData>;
	setInstructionLookup: (data: Map<string, InstructionLookupData>) => void;
};

const EditorContext = createContext<EditorContextValue | null>(null);

export function EditorProvider({ children }: { children: ReactNode }) {
	const editorRef = useRef<Editor | null>(null);
	const [hoveredToolName, setHoveredToolName] = useState<string | null>(null);
	const [toolLookup, setToolLookup] = useState<Map<string, ToolLookupData>>(new Map());
	const [modelLookup, setModelLookup] = useState<Map<string, ModelLookupData>>(new Map());
	const [bundleLookup, setBundleLookup] = useState<Map<string, BundleLookupData>>(new Map());
	const [instructionLookup, setInstructionLookup] = useState<Map<string, InstructionLookupData>>(new Map());

	const registerEditor = useCallback((editor: Editor | null) => {
		editorRef.current = editor;
	}, []);

	const insertToolAtCursor = useCallback((tool: { name: string; iconUrl?: string }) => {
		const editor = editorRef.current;
		if (!editor) return;

		editor
			.chain()
			.focus()
			.insertContent({
				type: "aiToolBlock",
				attrs: {
					name: tool.name,
					iconUrl: tool.iconUrl ?? null,
				},
			})
			.run();
	}, []);

	const removeToolFromEditor = useCallback((toolName: string) => {
		const editor = editorRef.current;
		if (!editor) return;

		const { doc, tr, schema } = editor.state;
		const nodesToReplace: { pos: number; size: number; name: string }[] = [];

		doc.descendants((node, pos) => {
			if (node.type.name === "aiToolBlock" && node.attrs.name === toolName) {
				nodesToReplace.push({ pos, size: node.nodeSize, name: node.attrs.name });
			}
		});

		// Replace in reverse order to maintain correct positions
		for (let i = nodesToReplace.length - 1; i >= 0; i--) {
			const { pos, size, name } = nodesToReplace[i];
			// Replace AIToolBlock with plain text (so suggestion shows again)
			const textNode = schema.text(name);
			tr.replaceWith(pos, pos + size, textNode);
		}

		if (nodesToReplace.length > 0) {
			editor.view.dispatch(tr);
		}
	}, []);

	const removeModelFromEditor = useCallback((modelName: string) => {
		const editor = editorRef.current;
		if (!editor) return;

		const { doc, tr, schema } = editor.state;
		const nodesToReplace: { pos: number; size: number; name: string }[] = [];

		doc.descendants((node, pos) => {
			if (node.type.name === "aiModelBlock" && node.attrs.name === modelName) {
				nodesToReplace.push({ pos, size: node.nodeSize, name: node.attrs.name });
			}
		});

		// Replace in reverse order to maintain correct positions
		for (let i = nodesToReplace.length - 1; i >= 0; i--) {
			const { pos, size, name } = nodesToReplace[i];
			const textNode = schema.text(name);
			tr.replaceWith(pos, pos + size, textNode);
		}

		if (nodesToReplace.length > 0) {
			editor.view.dispatch(tr);
		}
	}, []);

	const removeBundleFromEditor = useCallback((bundleName: string) => {
		const editor = editorRef.current;
		if (!editor) return;

		const { doc, tr, schema } = editor.state;
		const nodesToReplace: { pos: number; size: number; name: string }[] = [];

		doc.descendants((node, pos) => {
			if (node.type.name === "aiBundleBlock" && node.attrs.name === bundleName) {
				nodesToReplace.push({ pos, size: node.nodeSize, name: node.attrs.name });
			}
		});

		// Replace in reverse order to maintain correct positions
		for (let i = nodesToReplace.length - 1; i >= 0; i--) {
			const { pos, size, name } = nodesToReplace[i];
			const textNode = schema.text(name);
			tr.replaceWith(pos, pos + size, textNode);
		}

		if (nodesToReplace.length > 0) {
			editor.view.dispatch(tr);
		}
	}, []);

	const removeInstructionFromEditor = useCallback((instructionName: string) => {
		const editor = editorRef.current;
		if (!editor) return;

		const { doc, tr, schema } = editor.state;
		const nodesToReplace: { pos: number; size: number; name: string }[] = [];

		doc.descendants((node, pos) => {
			if (node.type.name === "aiInstructionBlock" && node.attrs.name === instructionName) {
				nodesToReplace.push({ pos, size: node.nodeSize, name: node.attrs.name });
			}
		});

		// Replace in reverse order to maintain correct positions
		for (let i = nodesToReplace.length - 1; i >= 0; i--) {
			const { pos, size, name } = nodesToReplace[i];
			const textNode = schema.text(name);
			tr.replaceWith(pos, pos + size, textNode);
		}

		if (nodesToReplace.length > 0) {
			editor.view.dispatch(tr);
		}
	}, []);

	const insertModelAtCursor = useCallback((model: { name: string; provider: string; iconUrl?: string }) => {
		const editor = editorRef.current;
		if (!editor) return;

		editor
			.chain()
			.focus()
			.insertContent({
				type: "aiModelBlock",
				attrs: {
					name: model.name,
					provider: model.provider,
					iconUrl: model.iconUrl ?? null,
				},
			})
			.run();
	}, []);

	const insertBundleAtCursor = useCallback((bundle: { name: string; iconUrl?: string }) => {
		const editor = editorRef.current;
		if (!editor) return;

		editor
			.chain()
			.focus()
			.insertContent({
				type: "aiBundleBlock",
				attrs: {
					name: bundle.name,
					iconUrl: bundle.iconUrl ?? null,
				},
			})
			.run();
	}, []);

	const insertInstructionAtCursor = useCallback((instruction: { name: string; type: InstructionType; content?: string }) => {
		const editor = editorRef.current;
		if (!editor) return;

		editor
			.chain()
			.focus()
			.insertContent({
				type: "aiInstructionBlock",
				attrs: {
					name: instruction.name,
					instructionType: instruction.type,
					content: instruction.content ?? null,
				},
			})
			.run();
	}, []);

	return (
		<EditorContext.Provider value={{ 
			registerEditor, 
			insertToolAtCursor, 
			removeToolFromEditor, 
			removeModelFromEditor, 
			removeBundleFromEditor, 
			removeInstructionFromEditor, 
			insertModelAtCursor, 
			insertBundleAtCursor, 
			insertInstructionAtCursor, 
			hoveredToolName, 
			setHoveredToolName,
			toolLookup,
			setToolLookup,
			modelLookup,
			setModelLookup,
			bundleLookup,
			setBundleLookup,
			instructionLookup,
			setInstructionLookup,
		}}>
			{children}
		</EditorContext.Provider>
	);
}

export function useEditorContext() {
	const context = useContext(EditorContext);
	if (!context) {
		throw new Error("useEditorContext must be used within an EditorProvider");
	}
	return context;
}

export function useOptionalEditorContext() {
	return useContext(EditorContext);
}

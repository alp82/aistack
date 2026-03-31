import type { Editor } from "@tiptap/react";
import {
	createContext,
	useContext,
	useRef,
	useCallback,
	useState,
	useMemo,
	type ReactNode,
} from "react";
import type { FileEntry, InstructionType } from "@/features/stack-editor/types";

export type ToolLookupData = {
	name: string;
	shortId?: string;
	categories: string[];
	iconUrl?: string;
	price?: { amount: number; period: string };
	tierName?: string;
	description?: string;
};

export type ModelLookupData = {
	name: string;
	shortId?: string;
	provider: string;
	iconUrl?: string;
	category: string;
	description?: string;
};

export type BundleLookupData = {
	name: string;
	shortId?: string;
	iconUrl?: string;
	price?: { amount: number; period: string };
	tierName?: string;
	description?: string;
};

export type InstructionLookupData = {
	name: string;
	type: InstructionType;
	description?: string;
};

type EditorContextValue = {
	registerEditor: (editor: Editor | null) => void;
	insertToolCardAtCursor: (tool: { name: string; shortId?: string }) => void;
	insertModelCardAtCursor: (model: {
		name: string;
		shortId?: string;
		provider: string;
	}) => void;
	insertBundleCardAtCursor: (bundle: {
		name: string;
		shortId?: string;
	}) => void;
	insertInstructionCardAtCursor: (instruction: {
		name: string;
		type: InstructionType;
	}) => void;
	// Legacy: insert as inline reference (used by @mention)
	insertToolAtCursor: (tool: { name: string; shortId?: string }) => void;
	insertModelAtCursor: (model: {
		name: string;
		shortId?: string;
		provider: string;
	}) => void;
	insertBundleAtCursor: (bundle: { name: string; shortId?: string }) => void;
	insertInstructionAtCursor: (instruction: {
		name: string;
		type: InstructionType;
	}) => void;
	removeToolFromEditor: (toolName: string) => void;
	removeModelFromEditor: (modelName: string) => void;
	removeBundleFromEditor: (bundleName: string) => void;
	removeInstructionFromEditor: (instructionName: string) => void;
	syncInstructionToEditor: (
		instructionName: string,
		attrs: Record<string, unknown>,
	) => void;
	onInstructionUpdate?: (
		oldName: string,
		updates: Partial<InstructionLookupData>,
	) => void;
	onToolDescriptionUpdate?: (idOrName: string, description: string) => void;
	onBundleDescriptionUpdate?: (idOrName: string, description: string) => void;
	onModelDescriptionUpdate?: (idOrName: string, description: string) => void;
	hoveredToolName: string | null;
	setHoveredToolName: (name: string | null) => void;
	toolLookup: Map<string, ToolLookupData>;
	setToolLookup: (data: Map<string, ToolLookupData>) => void;
	toolLookupByShortId: Map<string, ToolLookupData>;
	modelLookup: Map<string, ModelLookupData>;
	setModelLookup: (data: Map<string, ModelLookupData>) => void;
	modelLookupByShortId: Map<string, ModelLookupData>;
	bundleLookup: Map<string, BundleLookupData>;
	setBundleLookup: (data: Map<string, BundleLookupData>) => void;
	bundleLookupByShortId: Map<string, BundleLookupData>;
	instructionLookup: Map<string, InstructionLookupData>;
	setInstructionLookup: (data: Map<string, InstructionLookupData>) => void;
	instructionFiles: Map<string, FileEntry[]>;
	setInstructionFiles: (data: Map<string, FileEntry[]>) => void;
	onInstructionFilesUpdate?: (
		instructionName: string,
		files: FileEntry[],
	) => void;
	editInstructionRequest: string | null;
	setEditInstructionRequest: (name: string | null) => void;
};

const EditorContext = createContext<EditorContextValue | null>(null);

/**
 * Update attrs on all aiFileCard nodes matching a given name.
 */
function syncInstructionNodeAttrs(
	editor: Editor,
	instructionName: string,
	attrs: Record<string, unknown>,
) {
	const { doc, tr } = editor.state;
	let changed = false;

	doc.descendants((node, pos) => {
		if (
			node.type.name === "aiFileCard" &&
			node.attrs.name === instructionName
		) {
			for (const [key, value] of Object.entries(attrs)) {
				tr.setNodeAttribute(pos, key, value);
			}
			changed = true;
		}
	});

	if (changed) {
		editor.view.dispatch(tr);
	}
}

/**
 * Remove all nodes matching given type names and name attribute from the editor.
 * Handles both inline references and block cards.
 */
function removeNodesByNameAttr(
	editor: Editor,
	nodeTypeNames: string[],
	entityName: string,
) {
	const { doc, tr, schema } = editor.state;
	const nodesToRemove: { pos: number; size: number }[] = [];

	doc.descendants((node, pos) => {
		if (
			nodeTypeNames.includes(node.type.name) &&
			node.attrs.name === entityName
		) {
			nodesToRemove.push({ pos, size: node.nodeSize });
		}
	});

	// Remove in reverse order to maintain correct positions
	for (let i = nodesToRemove.length - 1; i >= 0; i--) {
		const { pos, size } = nodesToRemove[i];
		// For inline nodes, replace with text; for block nodes, delete
		const node = tr.doc.nodeAt(pos);
		if (node && node.isInline) {
			const textNode = schema.text(entityName);
			tr.replaceWith(pos, pos + size, textNode);
		} else {
			tr.delete(pos, pos + size);
		}
	}

	if (nodesToRemove.length > 0) {
		editor.view.dispatch(tr);
	}
}

export function EditorProvider({
	children,
	onInstructionUpdate,
	onInstructionFilesUpdate,
	onToolDescriptionUpdate,
	onBundleDescriptionUpdate,
	onModelDescriptionUpdate,
}: {
	children: ReactNode;
	onInstructionUpdate?: (
		oldName: string,
		updates: Partial<InstructionLookupData>,
	) => void;
	onInstructionFilesUpdate?: (
		instructionName: string,
		files: FileEntry[],
	) => void;
	onToolDescriptionUpdate?: (idOrName: string, description: string) => void;
	onBundleDescriptionUpdate?: (idOrName: string, description: string) => void;
	onModelDescriptionUpdate?: (idOrName: string, description: string) => void;
}) {
	const editorRef = useRef<Editor | null>(null);
	const [hoveredToolName, setHoveredToolName] = useState<string | null>(null);
	const [toolLookup, setToolLookup] = useState<Map<string, ToolLookupData>>(
		new Map(),
	);
	const [modelLookup, setModelLookup] = useState<Map<string, ModelLookupData>>(
		new Map(),
	);
	const [bundleLookup, setBundleLookup] = useState<
		Map<string, BundleLookupData>
	>(new Map());
	const [instructionLookup, setInstructionLookup] = useState<
		Map<string, InstructionLookupData>
	>(new Map());
	const [instructionFiles, setInstructionFiles] = useState<
		Map<string, FileEntry[]>
	>(new Map());
	const [editInstructionRequest, setEditInstructionRequest] = useState<
		string | null
	>(null);

	// Derived lookup maps by shortId
	const toolLookupByShortId = useMemo(() => {
		const map = new Map<string, ToolLookupData>();
		for (const data of toolLookup.values()) {
			if (data.shortId) map.set(data.shortId, data);
		}
		return map;
	}, [toolLookup]);

	const modelLookupByShortId = useMemo(() => {
		const map = new Map<string, ModelLookupData>();
		for (const data of modelLookup.values()) {
			if (data.shortId) map.set(data.shortId, data);
		}
		return map;
	}, [modelLookup]);

	const bundleLookupByShortId = useMemo(() => {
		const map = new Map<string, BundleLookupData>();
		for (const data of bundleLookup.values()) {
			if (data.shortId) map.set(data.shortId, data);
		}
		return map;
	}, [bundleLookup]);

	const registerEditor = useCallback((editor: Editor | null) => {
		editorRef.current = editor;
	}, []);

	// Insert as inline reference (for @mention)
	const insertToolAtCursor = useCallback(
		(tool: { name: string; shortId?: string }) => {
			const editor = editorRef.current;
			if (!editor) return;
			editor
				.chain()
				.focus()
				.insertContent({
					type: "aiToolReference",
					attrs: { name: tool.name, shortId: tool.shortId ?? null },
				})
				.run();
		},
		[],
	);

	// Insert as block card (for sidebar click, slash command, toolbar)
	const insertToolCardAtCursor = useCallback(
		(tool: { name: string; shortId?: string }) => {
			const editor = editorRef.current;
			if (!editor) return;
			editor
				.chain()
				.focus()
				.insertContent({
					type: "aiToolCard",
					attrs: { name: tool.name, shortId: tool.shortId ?? null },
				})
				.run();
		},
		[],
	);

	const removeToolFromEditor = useCallback((toolName: string) => {
		const editor = editorRef.current;
		if (!editor) return;
		removeNodesByNameAttr(editor, ["aiToolReference", "aiToolCard"], toolName);
	}, []);

	const insertModelAtCursor = useCallback(
		(model: { name: string; shortId?: string; provider: string }) => {
			const editor = editorRef.current;
			if (!editor) return;
			editor
				.chain()
				.focus()
				.insertContent({
					type: "aiModelReference",
					attrs: {
						name: model.name,
						shortId: model.shortId ?? null,
						provider: model.provider,
					},
				})
				.run();
		},
		[],
	);

	const insertModelCardAtCursor = useCallback(
		(model: { name: string; shortId?: string; provider: string }) => {
			const editor = editorRef.current;
			if (!editor) return;
			editor
				.chain()
				.focus()
				.insertContent({
					type: "aiModelCard",
					attrs: {
						name: model.name,
						shortId: model.shortId ?? null,
						provider: model.provider,
					},
				})
				.run();
		},
		[],
	);

	const removeModelFromEditor = useCallback((modelName: string) => {
		const editor = editorRef.current;
		if (!editor) return;
		removeNodesByNameAttr(
			editor,
			["aiModelReference", "aiModelCard"],
			modelName,
		);
	}, []);

	const insertBundleAtCursor = useCallback(
		(bundle: { name: string; shortId?: string }) => {
			const editor = editorRef.current;
			if (!editor) return;
			editor
				.chain()
				.focus()
				.insertContent({
					type: "aiBundleReference",
					attrs: { name: bundle.name, shortId: bundle.shortId ?? null },
				})
				.run();
		},
		[],
	);

	const insertBundleCardAtCursor = useCallback(
		(bundle: { name: string; shortId?: string }) => {
			const editor = editorRef.current;
			if (!editor) return;
			editor
				.chain()
				.focus()
				.insertContent({
					type: "aiBundleCard",
					attrs: { name: bundle.name, shortId: bundle.shortId ?? null },
				})
				.run();
		},
		[],
	);

	const removeBundleFromEditor = useCallback((bundleName: string) => {
		const editor = editorRef.current;
		if (!editor) return;
		removeNodesByNameAttr(
			editor,
			["aiBundleReference", "aiBundleCard"],
			bundleName,
		);
	}, []);

	const insertInstructionAtCursor = useCallback(
		(instruction: { name: string; type: InstructionType }) => {
			const editor = editorRef.current;
			if (!editor) return;
			editor
				.chain()
				.focus()
				.insertContent({
					type: "aiInstructionReference",
					attrs: {
						name: instruction.name,
						instructionType: instruction.type,
					},
				})
				.run();
		},
		[],
	);

	const insertInstructionCardAtCursor = useCallback(
		(instruction: { name: string; type: InstructionType }) => {
			const editor = editorRef.current;
			if (!editor) return;
			editor
				.chain()
				.focus()
				.insertContent({
					type: "aiFileCard",
					attrs: {
						name: instruction.name,
						instructionType: instruction.type,
					},
				})
				.run();
		},
		[],
	);

	const removeInstructionFromEditor = useCallback((instructionName: string) => {
		const editor = editorRef.current;
		if (!editor) return;
		removeNodesByNameAttr(
			editor,
			["aiInstructionReference", "aiFileCard"],
			instructionName,
		);
	}, []);

	const syncInstructionToEditor = useCallback(
		(instructionName: string, attrs: Record<string, unknown>) => {
			const editor = editorRef.current;
			if (!editor) return;
			syncInstructionNodeAttrs(editor, instructionName, attrs);
		},
		[],
	);

	return (
		<EditorContext.Provider
			value={{
				registerEditor,
				insertToolAtCursor,
				insertToolCardAtCursor,
				insertModelAtCursor,
				insertModelCardAtCursor,
				insertBundleAtCursor,
				insertBundleCardAtCursor,
				insertInstructionAtCursor,
				insertInstructionCardAtCursor,
				removeToolFromEditor,
				removeModelFromEditor,
				removeBundleFromEditor,
				removeInstructionFromEditor,
				syncInstructionToEditor,
				onInstructionUpdate,
				onToolDescriptionUpdate,
				onBundleDescriptionUpdate,
				onModelDescriptionUpdate,
				hoveredToolName,
				setHoveredToolName,
				toolLookup,
				setToolLookup,
				toolLookupByShortId,
				modelLookup,
				setModelLookup,
				modelLookupByShortId,
				bundleLookup,
				setBundleLookup,
				bundleLookupByShortId,
				instructionLookup,
				setInstructionLookup,
				instructionFiles,
				setInstructionFiles,
				onInstructionFilesUpdate,
				editInstructionRequest,
				setEditInstructionRequest,
			}}
		>
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

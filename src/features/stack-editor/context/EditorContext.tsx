import type { Editor } from "@tiptap/react";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useState,
} from "react";
import type { AIResourceCardAttrs } from "@/components/editor/AIResourceCard";
import type { AIResourceGroupAttrs } from "@/components/editor/AIResourceGroup";
import type { ResourceType } from "@/features/stack-editor/types";

export type ResourceLookupData = {
	name: string;
	type: ResourceType;
	description?: string;
};

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
	insertResourceCard: (args: AIResourceCardAttrs) => void;
	insertResourceGroup: (args: AIResourceGroupAttrs) => void;
	// Legacy: insert as inline reference (used by @mention)
	insertToolAtCursor: (tool: { name: string; shortId?: string }) => void;
	insertModelAtCursor: (model: {
		name: string;
		shortId?: string;
		provider: string;
	}) => void;
	insertBundleAtCursor: (bundle: { name: string; shortId?: string }) => void;
	removeToolFromEditor: (toolName: string) => void;
	removeModelFromEditor: (modelName: string) => void;
	removeBundleFromEditor: (bundleName: string) => void;
	removeResourceFromEditor: (stableKey: string, fileName: string) => void;
	onResourceUpdate?: (
		oldName: string,
		updates: Partial<ResourceLookupData>,
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
};

const EditorContext = createContext<EditorContextValue | null>(null);

/**
 * Remove all nodes matching the given type names and a custom matcher.
 * Handles both inline references and block cards.
 *
 * `fallbackText` is used to replace inline nodes; block nodes are deleted.
 */
function removeNodesByMatch(
	editor: Editor,
	nodeTypeNames: string[],
	matcher: (attrs: Record<string, unknown>) => boolean,
	fallbackText: string,
) {
	const { doc, tr, schema } = editor.state;
	const nodesToRemove: { pos: number; size: number }[] = [];

	doc.descendants((node, pos) => {
		if (
			nodeTypeNames.includes(node.type.name) &&
			matcher(node.attrs as Record<string, unknown>)
		) {
			nodesToRemove.push({ pos, size: node.nodeSize });
		}
	});

	// Remove in reverse order to maintain correct positions
	for (let i = nodesToRemove.length - 1; i >= 0; i--) {
		const { pos, size } = nodesToRemove[i];
		// For inline nodes, replace with text; for block nodes, delete
		const node = tr.doc.nodeAt(pos);
		if (node?.isInline) {
			const textNode = schema.text(fallbackText);
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
	onResourceUpdate,
	onToolDescriptionUpdate,
	onBundleDescriptionUpdate,
	onModelDescriptionUpdate,
}: {
	children: ReactNode;
	onResourceUpdate?: (
		oldName: string,
		updates: Partial<ResourceLookupData>,
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
		removeNodesByMatch(
			editor,
			["aiToolReference", "aiToolCard"],
			(attrs) => attrs.name === toolName,
			toolName,
		);
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
		removeNodesByMatch(
			editor,
			["aiModelReference", "aiModelCard"],
			(attrs) => attrs.name === modelName,
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
		removeNodesByMatch(
			editor,
			["aiBundleReference", "aiBundleCard"],
			(attrs) => attrs.name === bundleName,
			bundleName,
		);
	}, []);

	const insertResourceCard = useCallback((args: AIResourceCardAttrs) => {
		const editor = editorRef.current;
		if (!editor) return;
		editor
			.chain()
			.focus()
			.insertContent({
				type: "aiResourceCard",
				attrs: {
					source: args.source,
					sourceId: args.sourceId,
					stableKey: args.stableKey,
					fileName: args.fileName,
					type: args.type,
					group: args.group,
					description: args.description,
				},
			})
			.run();
	}, []);

	const insertResourceGroup = useCallback((args: AIResourceGroupAttrs) => {
		const editor = editorRef.current;
		if (!editor) return;
		editor
			.chain()
			.focus()
			.insertContent({
				type: "aiResourceGroup",
				attrs: {
					source: args.source,
					sourceId: args.sourceId,
					group: args.group,
					description: args.description,
					fileCount: args.fileCount ?? 0,
					typeBreakdown: args.typeBreakdown ?? [],
				},
			})
			.run();
	}, []);

	const removeResourceFromEditor = useCallback(
		(stableKey: string, fileName: string) => {
			const editor = editorRef.current;
			if (!editor) return;
			removeNodesByMatch(
				editor,
				["aiResourceCard"],
				(attrs) => attrs.stableKey === stableKey && attrs.fileName === fileName,
				fileName,
			);
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
				insertResourceCard,
				insertResourceGroup,
				removeToolFromEditor,
				removeModelFromEditor,
				removeBundleFromEditor,
				removeResourceFromEditor,
				onResourceUpdate,
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

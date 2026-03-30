import type { Editor } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

/**
 * Collapse a block card back to an inline reference.
 *
 * Always wraps the reference in its own new paragraph so the surrounding
 * block structure is preserved (3 blocks stay 3 blocks).
 */
export function collapseCardToReference(
	editor: Editor,
	getPos: () => number | undefined,
	node: ProseMirrorNode,
	referenceType: string,
	referenceAttrs: Record<string, unknown>,
) {
	const pos = getPos();
	if (pos === undefined) return;

	const { state, view } = editor;
	const { schema } = state;

	const refNode = schema.nodes[referenceType]?.create(referenceAttrs);
	if (!refNode) return;

	const paragraph = schema.nodes.paragraph.create(null, refNode);
	const tr = state.tr;
	tr.replaceWith(pos, pos + node.nodeSize, paragraph);
	view.dispatch(tr);
}

/**
 * Expand an inline reference to a block card.
 *
 * Splits the parent paragraph into [before, card, after] so the reference
 * is replaced by the card at the same logical position.
 */
export function expandReferenceToCard(
	editor: Editor,
	getPos: () => number | undefined,
	node: ProseMirrorNode,
	cardType: string,
	cardAttrs: Record<string, unknown>,
) {
	const pos = getPos();
	if (pos === undefined) return;

	const { state } = editor;
	const $pos = state.doc.resolve(pos);
	const parent = $pos.parent;

	if (parent.type.name !== "paragraph") {
		const insertPos = $pos.after($pos.depth > 1 ? $pos.depth - 1 : 1);
		editor
			.chain()
			.insertContentAt(insertPos, { type: cardType, attrs: cardAttrs })
			.run();
		return;
	}

	const parentPos = $pos.before($pos.depth);
	const offsetInParent = $pos.parentOffset;
	const { schema } = state;
	const cardNode = schema.nodes[cardType]?.create(cardAttrs);
	if (!cardNode) return;

	const beforeFragments: ProseMirrorNode[] = [];
	const afterFragments: ProseMirrorNode[] = [];
	let foundRef = false;

	parent.forEach((child, childOffset) => {
		if (!foundRef && childOffset === offsetInParent && child === node) {
			foundRef = true;
		} else if (!foundRef) {
			beforeFragments.push(child);
		} else {
			afterFragments.push(child);
		}
	});

	if (!foundRef) {
		beforeFragments.length = 0;
		afterFragments.length = 0;
		let accumulated = 0;
		parent.forEach((child) => {
			if (!foundRef && accumulated === offsetInParent) {
				foundRef = true;
			} else if (!foundRef) {
				beforeFragments.push(child);
			} else {
				afterFragments.push(child);
			}
			accumulated += child.nodeSize;
		});
	}

	const tr = state.tr;
	const paragraph = schema.nodes.paragraph;
	const replacements: ProseMirrorNode[] = [];

	if (beforeFragments.length > 0) {
		replacements.push(paragraph.create(null, beforeFragments));
	}
	replacements.push(cardNode);
	if (afterFragments.length > 0) {
		replacements.push(paragraph.create(null, afterFragments));
	}

	if (beforeFragments.length === 0 && afterFragments.length === 0) {
		tr.replaceWith(parentPos, parentPos + parent.nodeSize, cardNode);
	} else {
		tr.replaceWith(parentPos, parentPos + parent.nodeSize, replacements);
	}

	editor.view.dispatch(tr);
	requestAnimationFrame(() => {
		editor.view.updateState(editor.view.state);
	});
}

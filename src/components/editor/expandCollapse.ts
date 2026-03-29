import type { Editor } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

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

	// Only handle inline references inside paragraphs
	if (parent.type.name !== "paragraph") {
		// Fallback: insert card after parent block
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

	// Collect content before and after the reference node
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

	// If reference not found by identity, try by offset
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

	// Build replacement nodes
	const replacements: ProseMirrorNode[] = [];

	if (beforeFragments.length > 0) {
		replacements.push(paragraph.create(null, beforeFragments));
	}

	replacements.push(cardNode);

	if (afterFragments.length > 0) {
		replacements.push(paragraph.create(null, afterFragments));
	}

	// If no before/after content, just replace the paragraph with the card
	if (beforeFragments.length === 0 && afterFragments.length === 0) {
		tr.replaceWith(parentPos, parentPos + parent.nodeSize, cardNode);
	} else {
		tr.replaceWith(
			parentPos,
			parentPos + parent.nodeSize,
			replacements,
		);
	}

	editor.view.dispatch(tr);

	requestAnimationFrame(() => {
		editor.view.updateState(editor.view.state);
	});
}

/**
 * Collapse a block card back to an inline reference.
 *
 * Tries to merge the reference into an adjacent paragraph first:
 *   1. If the node before the card is a paragraph, append to it.
 *   2. Else if the node after the card is a paragraph, prepend to it.
 *   3. Else wrap in a new paragraph (fallback).
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
	const { schema, doc } = state;

	const refNode = schema.nodes[referenceType]?.create(referenceAttrs);
	if (!refNode) return;

	const $pos = doc.resolve(pos);
	const depth = $pos.depth;
	const indexInParent = $pos.index(depth);
	const parent = $pos.node(depth);

	const nodeBefore = indexInParent > 0 ? parent.child(indexInParent - 1) : null;
	const nodeAfter = indexInParent < parent.childCount - 1 ? parent.child(indexInParent + 1) : null;

	const tr = state.tr;

	if (nodeBefore && nodeBefore.type.name === "paragraph") {
		// Append reference to the end of the preceding paragraph
		const beforeEnd = pos - 1; // closing token of preceding paragraph
		tr.insert(beforeEnd, refNode);
		tr.delete(tr.mapping.map(pos), tr.mapping.map(pos + node.nodeSize));
	} else if (nodeAfter && nodeAfter.type.name === "paragraph") {
		// Prepend reference to the start of the following paragraph
		const afterStart = pos + node.nodeSize + 1; // opening token of following paragraph
		tr.delete(pos, pos + node.nodeSize);
		tr.insert(tr.mapping.map(afterStart), refNode);
	} else {
		// Fallback: wrap in new paragraph
		const paragraph = schema.nodes.paragraph.create(null, refNode);
		tr.replaceWith(pos, pos + node.nodeSize, paragraph);
	}

	view.dispatch(tr);
}

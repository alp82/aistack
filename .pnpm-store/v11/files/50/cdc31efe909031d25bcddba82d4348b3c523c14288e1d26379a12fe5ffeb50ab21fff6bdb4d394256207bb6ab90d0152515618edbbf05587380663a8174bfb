import { Extension } from '@tiptap/core';
import { SelectionRange, Selection } from '@tiptap/pm/state';
import { DecorationSet } from '@tiptap/pm/view';
import { ResolvedPos, Node } from '@tiptap/pm/model';
import { Mappable, Mapping } from '@tiptap/pm/transform';

interface NodeRangeOptions {
    depth: number | undefined;
    key: 'Shift' | 'Control' | 'Alt' | 'Meta' | 'Mod' | null | undefined;
}
declare const NodeRange: Extension<NodeRangeOptions, any>;

declare function getNodeRangeDecorations(ranges: SelectionRange[]): DecorationSet;

declare function getSelectionRanges($from: ResolvedPos, $to: ResolvedPos, depth?: number): SelectionRange[];

declare class NodeRangeBookmark {
    anchor: number;
    head: number;
    constructor(anchor: number, head: number);
    map(mapping: Mappable): NodeRangeBookmark;
    resolve(doc: Node): NodeRangeSelection;
}

declare class NodeRangeSelection extends Selection {
    depth: number | undefined;
    constructor($anchor: ResolvedPos, $head: ResolvedPos, depth?: number, bias?: number);
    get $to(): ResolvedPos;
    eq(other: Selection): boolean;
    map(doc: Node, mapping: Mapping): NodeRangeSelection;
    toJSON(): {
        type: string;
        anchor: number;
        head: number;
    };
    get isForwards(): boolean;
    get isBackwards(): boolean;
    extendBackwards(): NodeRangeSelection;
    extendForwards(): NodeRangeSelection;
    static fromJSON(doc: Node, json: any): NodeRangeSelection;
    static create(doc: Node, anchor: number, head: number, depth?: number, bias?: number): NodeRangeSelection;
    getBookmark(): NodeRangeBookmark;
}

declare function isNodeRangeSelection(value: unknown): value is NodeRangeSelection;

export { NodeRange, type NodeRangeOptions, NodeRangeSelection, NodeRange as default, getNodeRangeDecorations, getSelectionRanges, isNodeRangeSelection };

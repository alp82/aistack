import { Editor, Extension } from '@tiptap/core';
import { Node, NodeType } from '@tiptap/pm/model';
import { Plugin } from '@tiptap/pm/state';

type GetTableOfContentLevelFunction = (headline: {
    node: Node;
    pos: number;
}, previousItems: TableOfContentDataItem[]) => number;
type GetTableOfContentIndexFunction = (headline: {
    node: Node;
    pos: number;
}, previousItems: TableOfContentDataItem[], currentLevel?: number) => number;
type TableOfContentsOptions = {
    getId?: (textContent: string) => string;
    onUpdate?: (data: TableOfContentData, isCreate?: boolean) => void;
    getLevel?: GetTableOfContentLevelFunction;
    getIndex?: GetTableOfContentIndexFunction;
    scrollParent?: (() => HTMLElement | Window) | HTMLElement | Window;
    anchorTypes?: Array<string>;
};
type TableOfContentsStorage = {
    content: TableOfContentData;
    anchors: Array<HTMLHeadingElement | HTMLElement>;
    scrollHandler: () => void;
    scrollPosition: number;
};
type TableOfContentData = Array<TableOfContentDataItem>;
type TableOfContentDataItem = {
    dom: HTMLHeadingElement;
    editor: Editor;
    id: string;
    isActive: boolean;
    isScrolledOver: boolean;
    itemIndex: number;
    level: number;
    node: Node;
    originalLevel: number;
    pos: number;
    textContent: string;
};
declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        tableOfContents: {
            updateTableOfContents: () => ReturnType;
        };
    }
    interface Storage {
        tableOfContents: TableOfContentsStorage;
    }
}

declare const TableOfContents: Extension<TableOfContentsOptions, TableOfContentsStorage>;

declare const TableOfContentsPlugin: ({ getId, anchorTypes, }: {
    getId?: (textContent: string) => string;
    anchorTypes?: Array<string | NodeType>;
}) => Plugin<any>;

declare const getLastHeadingOnLevel: (headings: TableOfContentDataItem[], level: number) => TableOfContentDataItem | undefined;
declare const getHeadlineLevel: GetTableOfContentLevelFunction;
declare const getLinearIndexes: GetTableOfContentIndexFunction;
declare const getHierarchicalIndexes: GetTableOfContentIndexFunction;
declare function debounce(func: (...args: any[]) => void, wait: number): (...args: any[]) => void;

export { type GetTableOfContentIndexFunction, type GetTableOfContentLevelFunction, type TableOfContentData, type TableOfContentDataItem, TableOfContents, type TableOfContentsOptions, TableOfContentsPlugin, type TableOfContentsStorage, debounce, TableOfContents as default, getHeadlineLevel, getHierarchicalIndexes, getLastHeadingOnLevel, getLinearIndexes };

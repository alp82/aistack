import { Node } from '@tiptap/core';

interface OrderedListOptions {
    /**
     * The node type name for list items.
     * @default 'listItem'
     * @example 'myListItem'
     */
    itemTypeName: string;
    /**
     * The HTML attributes for an ordered list node.
     * @default {}
     * @example { class: 'foo' }
     */
    HTMLAttributes: Record<string, any>;
    /**
     * Keep the marks when splitting a list item.
     * @default false
     * @example true
     */
    keepMarks: boolean;
    /**
     * Keep the attributes when splitting a list item.
     * @default false
     * @example true
     */
    keepAttributes: boolean;
}
declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        orderedList: {
            /**
             * Toggle an ordered list
             * @example editor.commands.toggleOrderedList()
             */
            toggleOrderedList: () => ReturnType;
        };
    }
}
/**
 * Matches an ordered list to a 1. on input (or any number followed by a dot).
 */
declare const orderedListInputRegex: RegExp;
/**
 * This extension allows you to create ordered lists.
 * This requires the ListItem extension
 * @see https://www.tiptap.dev/api/nodes/ordered-list
 * @see https://www.tiptap.dev/api/nodes/list-item
 */
declare const OrderedList: Node<OrderedListOptions, any>;

export { OrderedList, type OrderedListOptions, orderedListInputRegex };

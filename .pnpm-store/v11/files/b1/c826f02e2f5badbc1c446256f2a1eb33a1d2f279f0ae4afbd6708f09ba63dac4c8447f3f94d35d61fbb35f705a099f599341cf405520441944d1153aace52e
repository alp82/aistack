import { Range, Editor } from '@tiptap/core';
import { PluginKey, Transaction, EditorState, Plugin } from '@tiptap/pm/state';
import { EditorView } from '@tiptap/pm/view';
import { ResolvedPos } from '@tiptap/pm/model';

interface Trigger {
    char: string;
    allowSpaces: boolean;
    allowToIncludeChar: boolean;
    allowedPrefixes: string[] | null;
    startOfLine: boolean;
    $position: ResolvedPos;
}
type SuggestionMatch = {
    range: Range;
    query: string;
    text: string;
} | null;
declare function findSuggestionMatch(config: Trigger): SuggestionMatch;

interface SuggestionOptions<I = any, TSelected = any> {
    /**
     * The plugin key for the suggestion plugin.
     * @default 'suggestion'
     * @example 'mention'
     */
    pluginKey?: PluginKey;
    /**
     * A function that returns a boolean to indicate if the suggestion should be active.
     * This is useful to prevent suggestions from opening for remote users in collaborative environments.
     * @param props The props object.
     * @param props.editor The editor instance.
     * @param props.range The range of the suggestion.
     * @param props.query The current suggestion query.
     * @param props.text The current suggestion text.
     * @param props.transaction The current transaction.
     * @returns {boolean}
     * @example ({ transaction }) => isChangeOrigin(transaction)
     */
    shouldShow?: (props: {
        editor: Editor;
        range: Range;
        query: string;
        text: string;
        transaction: Transaction;
    }) => boolean;
    /**
     * The editor instance.
     * @default null
     */
    editor: Editor;
    /**
     * The character that triggers the suggestion.
     * @default '@'
     * @example '#'
     */
    char?: string;
    /**
     * Allow spaces in the suggestion query. Not compatible with `allowToIncludeChar`. Will be disabled if `allowToIncludeChar` is set to `true`.
     * @default false
     * @example true
     */
    allowSpaces?: boolean;
    /**
     * Allow the character to be included in the suggestion query. Not compatible with `allowSpaces`.
     * @default false
     */
    allowToIncludeChar?: boolean;
    /**
     * Allow prefixes in the suggestion query.
     * @default [' ']
     * @example [' ', '@']
     */
    allowedPrefixes?: string[] | null;
    /**
     * Only match suggestions at the start of the line.
     * @default false
     * @example true
     */
    startOfLine?: boolean;
    /**
     * The tag name of the decoration node.
     * @default 'span'
     * @example 'div'
     */
    decorationTag?: string;
    /**
     * The class name of the decoration node.
     * @default 'suggestion'
     * @example 'mention'
     */
    decorationClass?: string;
    /**
     * Creates a decoration with the provided content.
     * @param decorationContent - The content to display in the decoration
     * @default "" - Creates an empty decoration if no content provided
     */
    decorationContent?: string;
    /**
     * The class name of the decoration node when it is empty.
     * @default 'is-empty'
     * @example 'is-empty'
     */
    decorationEmptyClass?: string;
    /**
     * A function that is called when a suggestion is selected.
     * @param props The props object.
     * @param props.editor The editor instance.
     * @param props.range The range of the suggestion.
     * @param props.props The props of the selected suggestion.
     * @returns void
     * @example ({ editor, range, props }) => { props.command(props.props) }
     */
    command?: (props: {
        editor: Editor;
        range: Range;
        props: TSelected;
    }) => void;
    /**
     * A function that returns the suggestion items in form of an array.
     * @param props The props object.
     * @param props.editor The editor instance.
     * @param props.query The current suggestion query.
     * @returns An array of suggestion items.
     * @example ({ editor, query }) => [{ id: 1, label: 'John Doe' }]
     */
    items?: (props: {
        query: string;
        editor: Editor;
    }) => I[] | Promise<I[]>;
    /**
     * The render function for the suggestion.
     * @returns An object with render functions.
     */
    render?: () => {
        onBeforeStart?: (props: SuggestionProps<I, TSelected>) => void;
        onStart?: (props: SuggestionProps<I, TSelected>) => void;
        onBeforeUpdate?: (props: SuggestionProps<I, TSelected>) => void;
        onUpdate?: (props: SuggestionProps<I, TSelected>) => void;
        onExit?: (props: SuggestionProps<I, TSelected>) => void;
        onKeyDown?: (props: SuggestionKeyDownProps) => boolean;
    };
    /**
     * A function that returns a boolean to indicate if the suggestion should be active.
     * @param props The props object.
     * @returns {boolean}
     */
    allow?: (props: {
        editor: Editor;
        state: EditorState;
        range: Range;
        isActive?: boolean;
    }) => boolean;
    findSuggestionMatch?: typeof findSuggestionMatch;
}
interface SuggestionProps<I = any, TSelected = any> {
    /**
     * The editor instance.
     */
    editor: Editor;
    /**
     * The range of the suggestion.
     */
    range: Range;
    /**
     * The current suggestion query.
     */
    query: string;
    /**
     * The current suggestion text.
     */
    text: string;
    /**
     * The suggestion items array.
     */
    items: I[];
    /**
     * A function that is called when a suggestion is selected.
     * @param props The props object.
     * @returns void
     */
    command: (props: TSelected) => void;
    /**
     * The decoration node HTML element
     * @default null
     */
    decorationNode: Element | null;
    /**
     * The function that returns the client rect
     * @default null
     * @example () => new DOMRect(0, 0, 0, 0)
     */
    clientRect?: (() => DOMRect | null) | null;
}
interface SuggestionKeyDownProps {
    view: EditorView;
    event: KeyboardEvent;
    range: Range;
}
declare const SuggestionPluginKey: PluginKey<any>;
/**
 * This utility allows you to create suggestions.
 * @see https://tiptap.dev/api/utilities/suggestion
 */
declare function Suggestion<I = any, TSelected = any>({ pluginKey, editor, char, allowSpaces, allowToIncludeChar, allowedPrefixes, startOfLine, decorationTag, decorationClass, decorationContent, decorationEmptyClass, command, items, render, allow, findSuggestionMatch, shouldShow, }: SuggestionOptions<I, TSelected>): Plugin<any>;
/**
 * Programmatically exit a suggestion plugin by dispatching a metadata-only
 * transaction. This is the safe, recommended API to remove suggestion
 * decorations without touching the document or causing mapping errors.
 */
declare function exitSuggestion(view: EditorView, pluginKeyRef?: PluginKey): void;

export { Suggestion, type SuggestionKeyDownProps, type SuggestionMatch, type SuggestionOptions, SuggestionPluginKey, type SuggestionProps, type Trigger, Suggestion as default, exitSuggestion, findSuggestionMatch };

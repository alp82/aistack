import { ComputePositionConfig, VirtualElement } from '@floating-ui/dom';
import { Extension, Editor } from '@tiptap/core';
import { Node, ResolvedPos } from '@tiptap/pm/model';
import { EditorView } from '@tiptap/pm/view';
import { PluginKey, Plugin } from '@tiptap/pm/state';

/**
 * Context provided to each rule for evaluation.
 * Contains all information needed to make a decision.
 */
interface RuleContext {
    /** The node being evaluated */
    node: Node;
    /** Absolute position of the node in the document */
    pos: number;
    /** Depth in the document tree (0 = doc root) */
    depth: number;
    /** Parent node (null if this is the doc) */
    parent: Node | null;
    /** This node's index among siblings (0-based) */
    index: number;
    /** Convenience: true if index === 0 */
    isFirst: boolean;
    /** Convenience: true if this is the last child */
    isLast: boolean;
    /** The resolved position for advanced queries */
    $pos: ResolvedPos;
    /** Editor view for DOM access if needed */
    view: EditorView;
}
/**
 * A rule that determines whether a node should be a drag target.
 */
interface DragHandleRule {
    /**
     * Unique identifier for debugging and rule management.
     */
    id: string;
    /**
     * Evaluate the node and return a score deduction.
     *
     * The return value is subtracted from the node's score (which starts at 1000).
     * Higher deductions make the node less likely to be selected as the drag target.
     *
     * @returns A number representing the score deduction:
     *   - `0` - No deduction, node remains fully eligible
     *   - `1-999` - Partial deduction, node is less preferred but still eligible
     *   - `>= 1000` - Node is excluded from being a drag target
     *
     * @example
     * // Exclude first child in list items
     * evaluate: ({ parent, isFirst }) => {
     *   if (isFirst && parent?.type.name === 'listItem') {
     *     return 1000 // Exclude
     *   }
     *   return 0
     * }
     *
     * @example
     * // Prefer shallower nodes with partial deduction
     * evaluate: ({ depth }) => {
     *   // Deeper nodes get small deductions, making shallower nodes win ties
     *   return depth * 50
     * }
     *
     * @example
     * // Context-based partial deductions
     * evaluate: ({ node, parent }) => {
     *   if (parent?.type.name === 'tableCell') {
     *     // Inside table cells, slightly prefer the cell over its content
     *     return node.type.name === 'paragraph' ? 100 : 0
     *   }
     *   return 0
     * }
     */
    evaluate: (context: RuleContext) => number;
}

/**
 * Edge detection presets for common use cases.
 */
type EdgeDetectionPreset = 'left' | 'right' | 'both' | 'none';
/**
 * Advanced edge detection configuration.
 * Most users should use presets instead.
 */
interface EdgeDetectionConfig {
    /**
     * Which edges trigger parent preference.
     * @default ['left', 'top']
     */
    edges: Array<'left' | 'right' | 'top' | 'bottom'>;
    /**
     * Distance in pixels from edge to trigger.
     * @default 12
     */
    threshold: number;
    /**
     * How strongly to prefer parent (higher = stronger preference).
     * This is multiplied by depth, so deeper nodes are affected more.
     * @default 500
     */
    strength: number;
}
/**
 * Configuration for nested drag handle behavior.
 */
interface NestedOptions {
    /**
     * Additional rules to determine which nodes are draggable.
     * These run AFTER the default rules.
     *
     * @example
     * rules: [
     *   {
     *     id: 'onlyAlternatives',
     *     evaluate: ({ node, parent }) => {
     *       if (parent?.type.name === 'question') {
     *         return node.type.name === 'alternative' ? 0 : 1000
     *       }
     *       return 0
     *     },
     *   },
     * ]
     */
    rules?: DragHandleRule[];
    /**
     * Set to `false` to disable default rules and use only your custom rules.
     * Default rules handle common cases like list items and inline content.
     *
     * @default true
     */
    defaultRules?: boolean;
    /**
     * Restrict nested drag handles to specific container types.
     * If set, nested dragging only works inside these node types.
     *
     * @example
     * // Only enable nested dragging in lists and custom question blocks
     * allowedContainers: ['bulletList', 'orderedList', 'questionBlock']
     */
    allowedContainers?: string[];
    /**
     * Edge detection behavior. Controls when to prefer parent over nested node.
     *
     * Presets:
     * - `'left'` (default) - Prefer parent near left/top edges
     * - `'right'` - Prefer parent near right/top edges (for RTL)
     * - `'both'` - Prefer parent near any horizontal edge
     * - `'none'` - Disable edge detection
     *
     * Or pass a partial/full config object for fine-tuned control.
     * Partial configs are merged with defaults.
     *
     * @default 'left'
     *
     * @example
     * // Only override threshold, keep default edges and strength
     * edgeDetection: { threshold: 20 }
     */
    edgeDetection?: EdgeDetectionPreset | Partial<EdgeDetectionConfig>;
}
/**
 * Normalized nested options with all properties resolved.
 */
interface NormalizedNestedOptions {
    /** Whether nested drag handles are enabled */
    enabled: boolean;
    /** Custom rules to apply */
    rules: DragHandleRule[];
    /** Whether to include default rules */
    defaultRules: boolean;
    /** Allowed container node types (undefined means all) */
    allowedContainers: string[] | undefined;
    /** Resolved edge detection configuration */
    edgeDetection: EdgeDetectionConfig;
}

declare const defaultComputePositionConfig: ComputePositionConfig;
interface DragHandleOptions {
    /**
     * Renders an element that is positioned with the floating-ui/dom package
     */
    render(): HTMLElement;
    /**
     * Configuration for position computation of the drag handle
     * using the floating-ui/dom package
     */
    computePositionConfig?: ComputePositionConfig;
    /**
     * A function that returns the virtual element for the drag handle.
     * This is useful when the menu needs to be positioned relative to a specific DOM element.
     */
    getReferencedVirtualElement?: () => VirtualElement | null;
    /**
     * Locks the draghandle in place and visibility
     */
    locked?: boolean;
    /**
     * Returns a node or null when a node is hovered over
     */
    onNodeChange?: (options: {
        node: Node | null;
        editor: Editor;
    }) => void;
    /**
     * The callback function that will be called when drag start.
     */
    onElementDragStart?: (e: DragEvent) => void;
    /**
     * The callback function that will be called when drag end.
     */
    onElementDragEnd?: (e: DragEvent) => void;
    /**
     * Enable drag handles for nested content (list items, blockquotes, etc.).
     *
     * When enabled, the drag handle will appear for nested blocks, not just
     * top-level blocks. A rule-based scoring system determines which node
     * to target based on cursor position and configured rules.
     *
     * **Values:**
     * - `false` (default): Only root-level blocks show drag handles
     * - `true`: Enable with sensible defaults (left edge detection, default rules)
     * - `NestedOptions`: Enable with custom configuration
     *
     * **Configuration options:**
     * - `rules`: Custom rules to determine which nodes are draggable
     * - `defaultRules`: Whether to include default rules (default: true)
     * - `allowedContainers`: Restrict nested dragging to specific container types
     * - `edgeDetection`: Control when to prefer parent over nested node
     *   - `'left'` (default): Prefer parent near left/top edges
     *   - `'right'`: Prefer parent near right/top edges (for RTL)
     *   - `'both'`: Prefer parent near any horizontal edge
     *   - `'none'`: Disable edge detection
     *
     * @default false
     *
     * @example
     * // Simple enable with sensible defaults
     * DragHandle.configure({
     *   nested: true,
     * })
     *
     * @example
     * // Restrict to specific containers
     * DragHandle.configure({
     *   nested: {
     *     allowedContainers: ['bulletList', 'orderedList'],
     *   },
     * })
     *
     * @example
     * // With custom rules
     * DragHandle.configure({
     *   nested: {
     *     rules: [{
     *       id: 'excludeCodeBlocks',
     *       evaluate: ({ node }) => node.type.name === 'codeBlock' ? 1000 : 0,
     *     }],
     *     edgeDetection: 'none',
     *   },
     * })
     */
    nested?: boolean | NestedOptions;
}
declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        dragHandle: {
            /**
             * Locks the draghandle in place and visibility
             */
            lockDragHandle: () => ReturnType;
            /**
             * Unlocks the draghandle
             */
            unlockDragHandle: () => ReturnType;
            /**
             * Toggle draghandle lock state
             */
            toggleDragHandle: () => ReturnType;
        };
    }
}
declare const DragHandle: Extension<DragHandleOptions, any>;

interface DragHandlePluginProps {
    pluginKey?: PluginKey | string;
    editor: Editor;
    element: HTMLElement;
    onNodeChange?: (data: {
        editor: Editor;
        node: Node | null;
        pos: number;
    }) => void;
    onElementDragStart?: (e: DragEvent) => void;
    onElementDragEnd?: (e: DragEvent) => void;
    computePositionConfig?: ComputePositionConfig;
    getReferencedVirtualElement?: () => VirtualElement | null;
    nestedOptions: NormalizedNestedOptions;
}
declare const dragHandlePluginDefaultKey: PluginKey<any>;
declare const DragHandlePlugin: ({ pluginKey, element, editor, computePositionConfig, getReferencedVirtualElement, onNodeChange, onElementDragStart, onElementDragEnd, nestedOptions, }: DragHandlePluginProps) => {
    unbind(): void;
    plugin: Plugin<{
        locked: boolean;
    }>;
};

/**
 * All default rules.
 * Users can extend these or replace them entirely.
 */
declare const defaultRules: DragHandleRule[];

/**
 * Normalizes the nested options input into a complete configuration object.
 *
 * @param input - The nested option (boolean, object, or undefined)
 * @returns A fully normalized options object
 *
 * @example
 * // Simple enable
 * normalizeNestedOptions(true)
 * // Returns: { enabled: true, rules: [], defaultRules: true, ... }
 *
 * @example
 * // Custom config
 * normalizeNestedOptions({ rules: [myRule], edgeDetection: 'none' })
 * // Returns: { enabled: true, rules: [myRule], edgeDetection: { edges: [], ... } }
 */
declare function normalizeNestedOptions(input: boolean | NestedOptions | undefined): NormalizedNestedOptions;

export { DragHandle, type DragHandleOptions, DragHandlePlugin, type DragHandlePluginProps, type DragHandleRule, type EdgeDetectionConfig, type EdgeDetectionPreset, type NestedOptions, type NormalizedNestedOptions, type RuleContext, DragHandle as default, defaultComputePositionConfig, defaultRules, dragHandlePluginDefaultKey, normalizeNestedOptions };

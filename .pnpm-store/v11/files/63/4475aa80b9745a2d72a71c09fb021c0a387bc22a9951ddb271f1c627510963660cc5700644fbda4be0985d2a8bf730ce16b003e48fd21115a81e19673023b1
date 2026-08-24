import { Extension } from '@tiptap/core';

type ColorOptions = {
    /**
     * The types where the color can be applied
     * @default ['textStyle']
     * @example ['heading', 'paragraph']
     */
    types: string[];
};
declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        color: {
            /**
             * Set the text color
             * @param color The color to set
             * @example editor.commands.setColor('red')
             */
            setColor: (color: string) => ReturnType;
            /**
             * Unset the text color
             * @example editor.commands.unsetColor()
             */
            unsetColor: () => ReturnType;
        };
    }
}
declare module '@tiptap/extension-text-style' {
    interface TextStyleAttributes {
        color?: string | null;
    }
}

type FontFamilyOptions = {
    /**
     * A list of node names where the font family can be applied.
     * @default ['textStyle']
     * @example ['heading', 'paragraph']
     */
    types: string[];
};
declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        fontFamily: {
            /**
             * Set the font family
             * @param fontFamily The font family
             * @example editor.commands.setFontFamily('Arial')
             */
            setFontFamily: (fontFamily: string) => ReturnType;
            /**
             * Unset the font family
             * @example editor.commands.unsetFontFamily()
             */
            unsetFontFamily: () => ReturnType;
        };
    }
}
declare module '@tiptap/extension-text-style' {
    interface TextStyleAttributes {
        fontFamily?: string | null;
    }
}

type FontSizeOptions = {
    /**
     * A list of node names where the font size can be applied.
     * @default ['textStyle']
     * @example ['heading', 'paragraph']
     */
    types: string[];
};
declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        fontSize: {
            /**
             * Set the font size
             * @param fontSize The font size
             * @example editor.commands.setFontSize('16px')
             */
            setFontSize: (fontSize: string) => ReturnType;
            /**
             * Unset the font size
             * @example editor.commands.unsetFontSize()
             */
            unsetFontSize: () => ReturnType;
        };
    }
}
declare module '@tiptap/extension-text-style' {
    interface TextStyleAttributes {
        fontSize?: string | null;
    }
}

type LineHeightOptions = {
    /**
     * A list of node names where the line height can be applied.
     * @default ['textStyle']
     * @example ['heading', 'paragraph']
     */
    types: string[];
};
declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        lineHeight: {
            /**
             * Set the line height
             * @param lineHeight The line height
             * @example editor.commands.setLineHeight('1.5')
             */
            setLineHeight: (lineHeight: string) => ReturnType;
            /**
             * Unset the line height
             * @example editor.commands.unsetLineHeight()
             */
            unsetLineHeight: () => ReturnType;
        };
    }
}
declare module '@tiptap/extension-text-style' {
    interface TextStyleAttributes {
        lineHeight?: string | null;
    }
}

/**
 * The available text style attributes.
 */
interface TextStyleAttributes extends Record<string, any> {
}

interface TextStyleOptions {
    /**
     * HTML attributes to add to the span element.
     * @default {}
     * @example { class: 'foo' }
     */
    HTMLAttributes: Record<string, any>;
    /**
     * When enabled, merges the styles of nested spans into the child span during HTML parsing.
     * This prioritizes the style of the child span.
     * Used when parsing content created in other editors.
     * (Fix for ProseMirror's default behavior.)
     * @default true
     */
    mergeNestedSpanStyles: boolean;
}
declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        textStyle: {
            /**
             * Remove spans without inline style attributes.
             * @example editor.commands.removeEmptyTextStyle()
             */
            removeEmptyTextStyle: () => ReturnType;
            /**
             * Toggle a text style
             * @param attributes The text style attributes
             * @example editor.commands.toggleTextStyle({ fontWeight: 'bold' })
             */
            toggleTextStyle: (attributes?: TextStyleAttributes) => ReturnType;
        };
    }
}

type BackgroundColorOptions = {
    /**
     * The types where the color can be applied
     * @default ['textStyle']
     * @example ['heading', 'paragraph']
     */
    types: string[];
};
declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        backgroundColor: {
            /**
             * Set the text color
             * @param backgroundColor The color to set
             * @example editor.commands.setColor('red')
             */
            setBackgroundColor: (backgroundColor: string) => ReturnType;
            /**
             * Unset the text backgroundColor
             * @example editor.commands.unsetBackgroundColor()
             */
            unsetBackgroundColor: () => ReturnType;
        };
    }
}
declare module '@tiptap/extension-text-style' {
    interface TextStyleAttributes {
        backgroundColor?: string | null;
    }
}

interface TextStyleKitOptions {
    /**
     * If set to false, the background color extension will not be registered
     * @example backgroundColor: false
     */
    backgroundColor: Partial<BackgroundColorOptions> | false;
    /**
     * If set to false, the color extension will not be registered
     * @example color: false
     */
    color: Partial<ColorOptions> | false;
    /**
     * If set to false, the font family extension will not be registered
     * @example fontFamily: false
     */
    fontFamily: Partial<FontFamilyOptions> | false;
    /**
     * If set to false, the font size extension will not be registered
     * @example fontSize: false
     */
    fontSize: Partial<FontSizeOptions> | false;
    /**
     * If set to false, the line height extension will not be registered
     * @example lineHeight: false
     */
    lineHeight: Partial<LineHeightOptions> | false;
    /**
     * If set to false, the text style extension will not be registered (required for other text style extensions)
     * @example textStyle: false
     */
    textStyle: Partial<TextStyleOptions> | false;
}
/**
 * The table kit is a collection of table editor extensions.
 *
 * It’s a good starting point for building your own table in Tiptap.
 */
declare const TextStyleKit: Extension<TextStyleKitOptions, any>;

export { TextStyleKit, type TextStyleKitOptions };

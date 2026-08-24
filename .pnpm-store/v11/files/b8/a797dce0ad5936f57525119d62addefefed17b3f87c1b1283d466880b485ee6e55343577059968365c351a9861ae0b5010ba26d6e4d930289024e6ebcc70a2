import { Extension } from '@tiptap/core';

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
/**
 * This extension allows you to color your text.
 * @see https://tiptap.dev/api/extensions/background-color
 */
declare const BackgroundColor: Extension<BackgroundColorOptions, any>;

export { BackgroundColor, type BackgroundColorOptions, BackgroundColor as default };

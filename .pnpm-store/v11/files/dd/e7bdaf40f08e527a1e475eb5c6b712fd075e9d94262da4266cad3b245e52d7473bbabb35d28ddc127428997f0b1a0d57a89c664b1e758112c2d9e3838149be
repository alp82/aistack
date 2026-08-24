import { Node } from '@tiptap/core';
import { PluginKey } from '@tiptap/pm/state';
import { SuggestionOptions } from '@tiptap/suggestion';

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        emoji: {
            /**
             * Add an emoji
             */
            setEmoji: (shortcode: string) => ReturnType;
        };
    }
    interface Storage {
        emoji: EmojiStorage;
    }
}
type EmojiItem = {
    /**
     * A unique name of the emoji which will be stored as attribute
     */
    name: string;
    /**
     * The emoji unicode character
     */
    emoji?: string;
    /**
     * A list of unique shortcodes that are used by input rules to find the emoji
     */
    shortcodes: string[];
    /**
     * A list of tags that can help for searching emojis
     */
    tags: string[];
    /**
     * A name that can help to group emojis
     */
    group?: string;
    /**
     * A list of unique emoticons
     */
    emoticons?: string[];
    /**
     * The unicode version the emoji was introduced
     */
    version?: number;
    /**
     * A fallback image if the current system doesn't support the emoji or for custom emojis
     */
    fallbackImage?: string;
    /**
     * Store some custom data
     */
    [key: string]: any;
};
type EmojiOptions = {
    HTMLAttributes: Record<string, any>;
    emojis: EmojiItem[];
    enableEmoticons: boolean;
    forceFallbackImages: boolean;
    suggestion: Omit<SuggestionOptions, 'editor'>;
};
type EmojiStorage = {
    emojis: EmojiItem[];
    isSupported: (item: EmojiItem) => boolean;
};
declare const EmojiSuggestionPluginKey: PluginKey<any>;
declare const inputRegex: RegExp;
declare const pasteRegex: RegExp;
declare const Emoji: Node<EmojiOptions, EmojiStorage>;

declare const emojis: EmojiItem[];
declare const gitHubCustomEmojis: EmojiItem[];
declare const gitHubEmojis: EmojiItem[];

declare function emojiToShortcode(emoji: string, emojis: EmojiItem[]): string | undefined;

declare function shortcodeToEmoji(shortcode: string, emojis: EmojiItem[]): EmojiItem | undefined;

export { Emoji, type EmojiItem, type EmojiOptions, type EmojiStorage, EmojiSuggestionPluginKey, Emoji as default, emojiToShortcode, emojis, gitHubCustomEmojis, gitHubEmojis, inputRegex, pasteRegex, shortcodeToEmoji };

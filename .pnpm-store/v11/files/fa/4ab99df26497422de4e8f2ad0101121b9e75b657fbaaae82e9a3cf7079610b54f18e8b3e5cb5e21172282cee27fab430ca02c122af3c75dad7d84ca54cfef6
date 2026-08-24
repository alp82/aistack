import { Node } from '@tiptap/core';

interface DetailsOptions {
    /**
     * Specify if the open status should be saved in the document. Defaults to `false`.
     */
    persist: boolean;
    /**
     * Specifies a CSS class that is set when toggling the content. Defaults to `is-open`.
     */
    openClassName: string;
    /**
     * Custom HTML attributes that should be added to the rendered HTML tag.
     */
    HTMLAttributes: {
        [key: string]: any;
    };
}
declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        details: {
            /**
             * Set a details node
             */
            setDetails: () => ReturnType;
            /**
             * Unset a details node
             */
            unsetDetails: () => ReturnType;
        };
    }
}
declare const Details: Node<DetailsOptions, any>;

interface DetailsContentOptions {
    /**
     * Custom HTML attributes that should be added to the rendered HTML tag.
     */
    HTMLAttributes: {
        [key: string]: any;
    };
}
declare const DetailsContent: Node<DetailsContentOptions, any>;

interface DetailsSummaryOptions {
    /**
     * Custom HTML attributes that should be added to the rendered HTML tag.
     */
    HTMLAttributes: {
        [key: string]: any;
    };
}
declare const DetailsSummary: Node<DetailsSummaryOptions, any>;

export { Details, DetailsContent, type DetailsContentOptions, type DetailsOptions, DetailsSummary, type DetailsSummaryOptions, Details as default };

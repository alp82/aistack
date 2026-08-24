type OpenSourceData = {
    type: 'open-source';
    data: {
        /** The source file to open */
        source?: string;
        /** The react router route ID, usually discovered via the hook useMatches */
        routeID?: string;
        /** The line number in the source file */
        line?: number;
        /** The column number in the source file */
        column?: number;
    };
};
export type EditorConfig = {
    /** The name of the editor, used for debugging purposes */
    name: string;
    /** Callback to open a file in the editor */
    open: (path: string, lineNumber: string | undefined, columnNumber?: string) => Promise<void>;
};
export declare const DEFAULT_EDITOR_CONFIG: EditorConfig;
export declare const handleOpenSource: ({ data, openInEditor, }: {
    data: OpenSourceData;
    openInEditor: EditorConfig["open"];
}) => Promise<void>;
export {};

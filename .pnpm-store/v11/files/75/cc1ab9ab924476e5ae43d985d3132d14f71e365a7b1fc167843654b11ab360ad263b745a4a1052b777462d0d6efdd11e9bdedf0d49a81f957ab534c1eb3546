import { Connect } from 'vite';
import { IncomingMessage, ServerResponse } from 'node:http';
import { PackageJson } from '@tanstack/devtools-client';
export declare const handleDevToolsViteRequest: (req: Connect.IncomingMessage, res: ServerResponse<IncomingMessage>, next: Connect.NextFunction, cb: (data: any) => void) => void;
export declare const parseOpenSourceParam: (source: string) => {
    file: string | undefined;
    line: string | undefined;
    column: string | undefined;
} | null;
export declare const tryParseJson: <T extends any>(jsonString: string | null | undefined) => T | null;
export declare const readPackageJson: () => Promise<PackageJson | null>;

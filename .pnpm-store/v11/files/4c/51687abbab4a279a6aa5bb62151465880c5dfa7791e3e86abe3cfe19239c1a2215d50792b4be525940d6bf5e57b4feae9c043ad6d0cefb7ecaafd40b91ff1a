import { parse } from '@babel/parser';
import { default as generate } from '@babel/generator';
import * as t from '@babel/types';
export { parse, t };
export declare const trav: {
    <S>(parent: t.Node, opts: import('@babel/traverse').TraverseOptions<S>, scope: import('@babel/traverse').Scope | undefined, state: S, parentPath?: import('@babel/traverse').NodePath): void;
    (parent: t.Node, opts?: import('@babel/traverse').TraverseOptions, scope?: import('@babel/traverse').Scope, state?: any, parentPath?: import('@babel/traverse').NodePath): void;
    visitors: typeof import('@babel/traverse').visitors;
    verify: typeof import("@babel/traverse").visitors.verify;
    explode: typeof import("@babel/traverse").visitors.explode;
    cheap: (node: t.Node, enter: (node: t.Node) => void) => void;
    node: (node: t.Node, opts: import('@babel/traverse').TraverseOptions, scope?: import('@babel/traverse').Scope, state?: any, path?: import('@babel/traverse').NodePath, skipKeys?: Record<string, boolean>) => void;
    clearNode: (node: t.Node, opts?: t.RemovePropertiesOptions) => void;
    removeProperties: (tree: t.Node, opts?: t.RemovePropertiesOptions) => t.Node;
    hasType: (tree: t.Node, type: t.Node["type"], denylistTypes?: string[]) => boolean;
    cache: typeof import('@babel/traverse').cache;
};
export declare const gen: typeof generate;

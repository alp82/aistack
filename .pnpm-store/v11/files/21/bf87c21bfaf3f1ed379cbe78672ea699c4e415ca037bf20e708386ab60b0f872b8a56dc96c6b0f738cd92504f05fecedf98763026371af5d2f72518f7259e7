import { FromJsxOptions } from '@takumi-rs/helpers/jsx';
import { RenderOptions, Renderer, InitInput, Font, ImageSource } from '@takumi-rs/wasm/no-bundler';
import { ReactNode } from 'react';

declare module "react" {
    interface DOMAttributes<T> {
        tw?: string;
    }
}
type ModuleOptions = {
    /**
     * @description The WebAssembly module to use for the renderer.
     *
     * @example
     * For Cloudflare Workers, you can use the bundled WASM file.
     * ```ts
     * {
     *   module: import("@takumi-rs/wasm/takumi_wasm_bg.wasm"),
     * }
     * ```
     *
     * For Next.js Turbopack, you can use the nextjs helper.
     * ```ts
     * {
     *   module: import("@takumi-rs/wasm/next"),
     * }
     * ```
     *
     * For Vite, use `?url` suffix to get the URL of the WASM file.
     *
     * ```ts
     * {
     *   module: import("@takumi-rs/wasm/takumi_wasm_bg.wasm?url"),
     * }
     * ```
     */
    module: InitInput | Promise<InitInput> | {
        default: InitInput;
    };
};
type ImageResponseOptionsWithRenderer = ResponseInit & RenderOptions & {
    renderer: Renderer;
    jsx?: FromJsxOptions;
};
type ImageResponseOptionsWithoutRenderer = ResponseInit & RenderOptions & ModuleOptions & {
    fonts?: Font[];
    persistentImages?: ImageSource[];
    jsx?: FromJsxOptions;
};
type ImageResponseOptions = ImageResponseOptionsWithRenderer | ImageResponseOptionsWithoutRenderer;
declare class ImageResponse extends Response {
    constructor(component: ReactNode, options: ImageResponseOptions);
}

export { ImageResponse, type ImageResponseOptions, ImageResponse as default };

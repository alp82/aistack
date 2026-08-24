import { RenderOptions, Renderer, ConstructRendererOptions } from '@takumi-rs/core';
import { FromJsxOptions } from '@takumi-rs/helpers/jsx';
import { ReactNode } from 'react';

declare module "react" {
    interface DOMAttributes<T> {
        tw?: string;
    }
}
type ImageResponseOptionsWithRenderer = ResponseInit & RenderOptions & {
    renderer: Renderer;
    signal?: AbortSignal;
    jsx?: FromJsxOptions;
};
type ImageResponseOptionsWithoutRenderer = ResponseInit & RenderOptions & ConstructRendererOptions & {
    signal?: AbortSignal;
    jsx?: FromJsxOptions;
};
type ImageResponseOptions = ImageResponseOptionsWithRenderer | ImageResponseOptionsWithoutRenderer;
declare class ImageResponse extends Response {
    constructor(component: ReactNode, options?: ImageResponseOptions);
}

export { ImageResponse, type ImageResponseOptions, ImageResponse as default };

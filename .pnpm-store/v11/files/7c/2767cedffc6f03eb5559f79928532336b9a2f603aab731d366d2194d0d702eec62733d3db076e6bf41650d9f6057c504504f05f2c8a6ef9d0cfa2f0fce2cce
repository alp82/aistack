import { Node } from '@tiptap/core';

interface YoutubeOptions {
    /**
     * Controls if the paste handler for youtube videos should be added.
     * @default true
     * @example false
     */
    addPasteHandler: boolean;
    /**
     * Controls if the youtube video should be allowed to go fullscreen.
     * @default true
     * @example false
     */
    allowFullscreen: boolean;
    /**
     * Controls if the youtube video should autoplay.
     * @default false
     * @example true
     */
    autoplay: boolean;
    /**
     * The language of the captions shown in the youtube video.
     * @default undefined
     * @example 'en'
     */
    ccLanguage?: string;
    /**
     * Controls if the captions should be shown in the youtube video.
     * @default undefined
     * @example true
     */
    ccLoadPolicy?: boolean;
    /**
     * Controls if the controls should be shown in the youtube video.
     * @default true
     * @example false
     */
    controls: boolean;
    /**
     * Controls if the keyboard controls should be disabled in the youtube video.
     * @default false
     * @example true
     */
    disableKBcontrols: boolean;
    /**
     * Controls if the iframe api should be enabled in the youtube video.
     * @default false
     * @example true
     */
    enableIFrameApi: boolean;
    /**
     * The end time of the youtube video.
     * @default 0
     * @example 120
     */
    endTime: number;
    /**
     * The height of the youtube video.
     * @default 480
     * @example 720
     */
    height: number;
    /**
     * The language of the youtube video.
     * @default undefined
     * @example 'en'
     */
    interfaceLanguage?: string;
    /**
     * Controls if the video annotations should be shown in the youtube video.
     * @default 0
     * @example 1
     */
    ivLoadPolicy: number;
    /**
     * Controls if the youtube video should loop.
     * @default false
     * @example true
     */
    loop: boolean;
    /**
     * Controls if the youtube video should show a small youtube logo.
     * @default false
     * @example true
     */
    modestBranding: boolean;
    /**
     * The HTML attributes for a youtube video node.
     * @default {}
     * @example { class: 'foo' }
     */
    HTMLAttributes: Record<string, any>;
    /**
     * Controls if the youtube node should be inline or not.
     * @default false
     * @example true
     */
    inline: boolean;
    /**
     * Controls if the youtube video should be loaded from youtube-nocookie.com.
     * @default false
     * @example true
     */
    nocookie: boolean;
    /**
     * The origin of the youtube video.
     * @default ''
     * @example 'https://tiptap.dev'
     */
    origin: string;
    /**
     * The playlist of the youtube video.
     * @default ''
     * @example 'PLQg6GaokU5CwiVmsZ0dZm6VeIg0V5z1tK'
     */
    playlist: string;
    /**
     * The color of the youtube video progress bar.
     * @default undefined
     * @example 'red'
     */
    progressBarColor?: string;
    /**
     * The width of the youtube video.
     * @default 640
     * @example 1280
     */
    width: number;
    /**
     * Controls if the related youtube videos at the end are from the same channel.
     * @default 1
     * @example 0
     */
    rel: number;
}
/**
 * The options for setting a youtube video.
 */
type SetYoutubeVideoOptions = {
    src: string;
    width?: number;
    height?: number;
    start?: number;
};
declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        youtube: {
            /**
             * Insert a youtube video
             * @param options The youtube video attributes
             * @example editor.commands.setYoutubeVideo({ src: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
             */
            setYoutubeVideo: (options: SetYoutubeVideoOptions) => ReturnType;
        };
    }
}
/**
 * This extension adds support for youtube videos.
 * @see https://www.tiptap.dev/api/nodes/youtube
 */
declare const Youtube: Node<YoutubeOptions, any>;

export { Youtube, type YoutubeOptions, Youtube as default };

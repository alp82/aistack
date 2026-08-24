"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  Youtube: () => Youtube,
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);

// src/youtube.ts
var import_core = require("@tiptap/core");

// src/utils.ts
var YOUTUBE_REGEX = /^((?:https?:)?\/\/)?((?:www|m|music)\.)?((?:youtube\.com|youtu\.be|youtube-nocookie\.com))(\/(?:[\w-]+\?v=|embed\/|v\/)?)([\w-]+)(\S+)?$/;
var YOUTUBE_REGEX_GLOBAL = /^((?:https?:)?\/\/)?((?:www|m|music)\.)?((?:youtube\.com|youtu\.be|youtube-nocookie\.com))(\/(?:[\w-]+\?v=|embed\/|v\/)?)([\w-]+)(\S+)?$/g;
var isValidYoutubeUrl = (url) => {
  return url.match(YOUTUBE_REGEX);
};
var getYoutubeEmbedUrl = (nocookie, isPlaylist) => {
  if (isPlaylist) {
    return "https://www.youtube-nocookie.com/embed/videoseries?list=";
  }
  return nocookie ? "https://www.youtube-nocookie.com/embed/" : "https://www.youtube.com/embed/";
};
var getEmbedUrlFromYoutubeUrl = (options) => {
  const {
    url,
    allowFullscreen,
    autoplay,
    ccLanguage,
    ccLoadPolicy,
    controls,
    disableKBcontrols,
    enableIFrameApi,
    endTime,
    interfaceLanguage,
    ivLoadPolicy,
    loop,
    modestBranding,
    nocookie,
    origin,
    playlist,
    progressBarColor,
    startAt,
    rel
  } = options;
  if (!isValidYoutubeUrl(url)) {
    return null;
  }
  if (url.includes("/embed/")) {
    return url;
  }
  if (url.includes("youtu.be")) {
    const id = url.split("/").pop();
    if (!id) {
      return null;
    }
    return `${getYoutubeEmbedUrl(nocookie)}${id}`;
  }
  const videoIdRegex = /(?:(v|list)=|shorts\/)([-\w]+)/gm;
  const matches = videoIdRegex.exec(url);
  if (!matches || !matches[2]) {
    return null;
  }
  let outputUrl = `${getYoutubeEmbedUrl(nocookie, matches[1] === "list")}${matches[2]}`;
  const params = [];
  if (allowFullscreen === false) {
    params.push("fs=0");
  }
  if (autoplay) {
    params.push("autoplay=1");
  }
  if (ccLanguage) {
    params.push(`cc_lang_pref=${ccLanguage}`);
  }
  if (ccLoadPolicy) {
    params.push("cc_load_policy=1");
  }
  if (!controls) {
    params.push("controls=0");
  }
  if (disableKBcontrols) {
    params.push("disablekb=1");
  }
  if (enableIFrameApi) {
    params.push("enablejsapi=1");
  }
  if (endTime) {
    params.push(`end=${endTime}`);
  }
  if (interfaceLanguage) {
    params.push(`hl=${interfaceLanguage}`);
  }
  if (ivLoadPolicy) {
    params.push(`iv_load_policy=${ivLoadPolicy}`);
  }
  if (loop) {
    params.push("loop=1");
  }
  if (modestBranding) {
    params.push("modestbranding=1");
  }
  if (origin) {
    params.push(`origin=${origin}`);
  }
  if (playlist) {
    params.push(`playlist=${playlist}`);
  }
  if (startAt) {
    params.push(`start=${startAt}`);
  }
  if (progressBarColor) {
    params.push(`color=${progressBarColor}`);
  }
  if (rel !== void 0) {
    params.push(`rel=${rel}`);
  }
  if (params.length) {
    outputUrl += `${matches[1] === "list" ? "&" : "?"}${params.join("&")}`;
  }
  return outputUrl;
};

// src/youtube.ts
var Youtube = import_core.Node.create({
  name: "youtube",
  addOptions() {
    return {
      addPasteHandler: true,
      allowFullscreen: true,
      autoplay: false,
      ccLanguage: void 0,
      ccLoadPolicy: void 0,
      controls: true,
      disableKBcontrols: false,
      enableIFrameApi: false,
      endTime: 0,
      height: 480,
      interfaceLanguage: void 0,
      ivLoadPolicy: 0,
      loop: false,
      modestBranding: false,
      HTMLAttributes: {},
      inline: false,
      nocookie: false,
      origin: "",
      playlist: "",
      progressBarColor: void 0,
      width: 640,
      rel: 1
    };
  },
  inline() {
    return this.options.inline;
  },
  group() {
    return this.options.inline ? "inline" : "block";
  },
  draggable: true,
  addAttributes() {
    return {
      src: {
        default: null
      },
      start: {
        default: 0
      },
      width: {
        default: this.options.width
      },
      height: {
        default: this.options.height
      }
    };
  },
  parseHTML() {
    return [
      {
        tag: "div[data-youtube-video] iframe"
      }
    ];
  },
  addCommands() {
    return {
      setYoutubeVideo: (options) => ({ commands }) => {
        if (!isValidYoutubeUrl(options.src)) {
          return false;
        }
        return commands.insertContent({
          type: this.name,
          attrs: options
        });
      }
    };
  },
  addPasteRules() {
    if (!this.options.addPasteHandler) {
      return [];
    }
    return [
      (0, import_core.nodePasteRule)({
        find: YOUTUBE_REGEX_GLOBAL,
        type: this.type,
        getAttributes: (match) => {
          return { src: match.input };
        }
      })
    ];
  },
  renderHTML({ HTMLAttributes }) {
    const embedUrl = getEmbedUrlFromYoutubeUrl({
      url: HTMLAttributes.src,
      allowFullscreen: this.options.allowFullscreen,
      autoplay: this.options.autoplay,
      ccLanguage: this.options.ccLanguage,
      ccLoadPolicy: this.options.ccLoadPolicy,
      controls: this.options.controls,
      disableKBcontrols: this.options.disableKBcontrols,
      enableIFrameApi: this.options.enableIFrameApi,
      endTime: this.options.endTime,
      interfaceLanguage: this.options.interfaceLanguage,
      ivLoadPolicy: this.options.ivLoadPolicy,
      loop: this.options.loop,
      modestBranding: this.options.modestBranding,
      nocookie: this.options.nocookie,
      origin: this.options.origin,
      playlist: this.options.playlist,
      progressBarColor: this.options.progressBarColor,
      startAt: HTMLAttributes.start || 0,
      rel: this.options.rel
    });
    HTMLAttributes.src = embedUrl;
    return [
      "div",
      { "data-youtube-video": "" },
      [
        "iframe",
        (0, import_core.mergeAttributes)(
          this.options.HTMLAttributes,
          {
            width: this.options.width,
            height: this.options.height,
            allowfullscreen: this.options.allowFullscreen,
            autoplay: this.options.autoplay,
            ccLanguage: this.options.ccLanguage,
            ccLoadPolicy: this.options.ccLoadPolicy,
            disableKBcontrols: this.options.disableKBcontrols,
            enableIFrameApi: this.options.enableIFrameApi,
            endTime: this.options.endTime,
            interfaceLanguage: this.options.interfaceLanguage,
            ivLoadPolicy: this.options.ivLoadPolicy,
            loop: this.options.loop,
            modestBranding: this.options.modestBranding,
            origin: this.options.origin,
            playlist: this.options.playlist,
            progressBarColor: this.options.progressBarColor,
            rel: this.options.rel
          },
          HTMLAttributes
        )
      ]
    ];
  },
  ...(0, import_core.createAtomBlockMarkdownSpec)({
    nodeName: "youtube",
    allowedAttributes: ["src", "width", "height", "start"]
  })
});

// src/index.ts
var index_default = Youtube;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Youtube
});
//# sourceMappingURL=index.cjs.map
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
  FileHandlePlugin: () => FileHandlePlugin,
  FileHandler: () => FileHandler,
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);

// src/fileHandler.ts
var import_core = require("@tiptap/core");
var import_state2 = require("@tiptap/pm/state");

// src/FileHandlePlugin.ts
var import_state = require("@tiptap/pm/state");
var FileHandlePlugin = ({ key, editor, onPaste, onDrop, allowedMimeTypes }) => {
  return new import_state.Plugin({
    key: key || new import_state.PluginKey("fileHandler"),
    props: {
      handleDrop(_view, event) {
        var _a;
        if (!onDrop) {
          return false;
        }
        if (!((_a = event.dataTransfer) == null ? void 0 : _a.files.length)) {
          return false;
        }
        const dropPos = _view.posAtCoords({
          left: event.clientX,
          top: event.clientY
        });
        let filesArray = Array.from(event.dataTransfer.files);
        if (allowedMimeTypes) {
          filesArray = filesArray.filter((file) => allowedMimeTypes.includes(file.type));
        }
        if (filesArray.length === 0) {
          return false;
        }
        event.preventDefault();
        event.stopPropagation();
        onDrop(editor, filesArray, (dropPos == null ? void 0 : dropPos.pos) || 0);
        return true;
      },
      handlePaste(_view, event) {
        var _a;
        if (!onPaste) {
          return false;
        }
        if (!((_a = event.clipboardData) == null ? void 0 : _a.files.length)) {
          return false;
        }
        let filesArray = Array.from(event.clipboardData.files);
        const htmlContent = event.clipboardData.getData("text/html");
        if (allowedMimeTypes) {
          filesArray = filesArray.filter((file) => allowedMimeTypes.includes(file.type));
        }
        if (filesArray.length === 0) {
          return false;
        }
        event.preventDefault();
        event.stopPropagation();
        onPaste(editor, filesArray, htmlContent);
        if (htmlContent.length > 0) {
          return false;
        }
        return true;
      }
    }
  });
};

// src/fileHandler.ts
var FileHandler = import_core.Extension.create({
  name: "fileHandler",
  addOptions() {
    return {
      onPaste: void 0,
      onDrop: void 0,
      allowedMimeTypes: void 0
    };
  },
  addProseMirrorPlugins() {
    return [
      FileHandlePlugin({
        key: new import_state2.PluginKey(this.name),
        editor: this.editor,
        allowedMimeTypes: this.options.allowedMimeTypes,
        onDrop: this.options.onDrop,
        onPaste: this.options.onPaste
      })
    ];
  }
});

// src/index.ts
var index_default = FileHandler;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FileHandlePlugin,
  FileHandler
});
//# sourceMappingURL=index.cjs.map
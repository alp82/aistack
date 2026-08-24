// src/fileHandler.ts
import { Extension } from "@tiptap/core";
import { PluginKey as PluginKey2 } from "@tiptap/pm/state";

// src/FileHandlePlugin.ts
import { Plugin, PluginKey } from "@tiptap/pm/state";
var FileHandlePlugin = ({ key, editor, onPaste, onDrop, allowedMimeTypes }) => {
  return new Plugin({
    key: key || new PluginKey("fileHandler"),
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
var FileHandler = Extension.create({
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
        key: new PluginKey2(this.name),
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
export {
  FileHandlePlugin,
  FileHandler,
  index_default as default
};
//# sourceMappingURL=index.js.map
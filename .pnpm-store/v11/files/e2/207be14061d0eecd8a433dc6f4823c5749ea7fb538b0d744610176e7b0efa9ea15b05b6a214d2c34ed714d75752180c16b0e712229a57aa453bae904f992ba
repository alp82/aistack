import * as React$1 from "react";
import React from "react";
import Prism from "prismjs";

//#region src/languages-available.d.ts
type PrismLanguage = 'markup' | 'html' | 'xml' | 'svg' | 'mathml' | 'ssml' | 'atom' | 'rss' | 'css' | 'clike' | 'javascript' | 'js' | 'abap' | 'abnf' | 'actionscript' | 'ada' | 'agda' | 'al' | 'antlr4' | 'g4' | 'apacheconf' | 'apex' | 'apl' | 'applescript' | 'aql' | 'arduino' | 'ino' | 'arff' | 'armasm' | 'arm-asm' | 'arturo' | 'art' | 'asciidoc' | 'adoc' | 'aspnet' | 'asm6502' | 'asmatmel' | 'autohotkey' | 'autoit' | 'avisynth' | 'avs' | 'avro-idl' | 'avdl' | 'awk' | 'gawk' | 'bash' | 'sh' | 'shell' | 'basic' | 'batch' | 'bbcode' | 'shortcode' | 'bbj' | 'bicep' | 'birb' | 'bison' | 'bnf' | 'rbnf' | 'bqn' | 'brainfuck' | 'brightscript' | 'bro' | 'bsl' | 'oscript' | 'c' | 'csharp' | 'cs' | 'dotnet' | 'cpp' | 'cfscript' | 'cfc' | 'chaiscript' | 'cil' | 'cilkc' | 'cilk-c' | 'cilkcpp' | 'cilk-cpp' | 'cilk' | 'clojure' | 'cmake' | 'cobol' | 'coffeescript' | 'coffee' | 'concurnas' | 'conc' | 'csp' | 'cooklang' | 'coq' | 'crystal' | 'css-extras' | 'csv' | 'cue' | 'cypher' | 'd' | 'dart' | 'dataweave' | 'dax' | 'dhall' | 'diff' | 'django' | 'jinja2' | 'dns-zone-file' | 'dns-zone' | 'docker' | 'dockerfile' | 'dot' | 'gv' | 'ebnf' | 'editorconfig' | 'eiffel' | 'ejs' | 'eta' | 'elixir' | 'elm' | 'etlua' | 'erb' | 'erlang' | 'excel-formula' | 'xlsx' | 'xls' | 'fsharp' | 'factor' | 'false' | 'firestore-security-rules' | 'flow' | 'fortran' | 'ftl' | 'gml' | 'gamemakerlanguage' | 'gap' | 'gcode' | 'gdscript' | 'gedcom' | 'gettext' | 'po' | 'gherkin' | 'git' | 'glsl' | 'gn' | 'gni' | 'linker-script' | 'ld' | 'go' | 'go-module' | 'go-mod' | 'gradle' | 'graphql' | 'groovy' | 'haml' | 'handlebars' | 'hbs' | 'mustache' | 'haskell' | 'hs' | 'haxe' | 'hcl' | 'hlsl' | 'hoon' | 'http' | 'hpkp' | 'hsts' | 'ichigojam' | 'icon' | 'icu-message-format' | 'idris' | 'idr' | 'ignore' | 'gitignore' | 'hgignore' | 'npmignore' | 'inform7' | 'ini' | 'io' | 'j' | 'java' | 'javadoc' | 'javadoclike' | 'javastacktrace' | 'jexl' | 'jolie' | 'jq' | 'jsdoc' | 'js-extras' | 'json' | 'webmanifest' | 'json5' | 'jsonp' | 'jsstacktrace' | 'js-templates' | 'julia' | 'keepalived' | 'keyman' | 'kotlin' | 'kt' | 'kts' | 'kumir' | 'kum' | 'kusto' | 'latex' | 'tex' | 'context' | 'latte' | 'less' | 'lilypond' | 'ly' | 'liquid' | 'lisp' | 'emacs' | 'elisp' | 'emacs-lisp' | 'livescript' | 'llvm' | 'log' | 'lolcode' | 'lua' | 'magma' | 'makefile' | 'markdown' | 'md' | 'markup-templating' | 'mata' | 'matlab' | 'maxscript' | 'mel' | 'mermaid' | 'metafont' | 'mizar' | 'mongodb' | 'monkey' | 'moonscript' | 'moon' | 'n1ql' | 'n4js' | 'n4jsd' | 'nand2tetris-hdl' | 'naniscript' | 'nani' | 'nasm' | 'neon' | 'nevod' | 'nginx' | 'nim' | 'nix' | 'nsis' | 'objectivec' | 'objc' | 'ocaml' | 'odin' | 'opencl' | 'openqasm' | 'qasm' | 'oz' | 'parigp' | 'parser' | 'pascal' | 'objectpascal' | 'pascaligo' | 'psl' | 'pcaxis' | 'px' | 'peoplecode' | 'pcode' | 'perl' | 'php' | 'phpdoc' | 'php-extras' | 'plant-uml' | 'plantuml' | 'plsql' | 'powerquery' | 'pq' | 'mscript' | 'powershell' | 'processing' | 'prolog' | 'promql' | 'properties' | 'protobuf' | 'pug' | 'puppet' | 'pure' | 'purebasic' | 'pbfasm' | 'purescript' | 'purs' | 'python' | 'py' | 'qsharp' | 'qs' | 'q' | 'qml' | 'qore' | 'r' | 'racket' | 'rkt' | 'cshtml' | 'razor' | 'jsx' | 'tsx' | 'reason' | 'regex' | 'rego' | 'renpy' | 'rpy' | 'rescript' | 'res' | 'rest' | 'rip' | 'roboconf' | 'robotframework' | 'robot' | 'ruby' | 'rb' | 'rust' | 'sas' | 'sass' | 'scss' | 'scala' | 'scheme' | 'shell-session' | 'sh-session' | 'shellsession' | 'smali' | 'smalltalk' | 'smarty' | 'sml' | 'smlnj' | 'solidity' | 'sol' | 'solution-file' | 'sln' | 'soy' | 'sparql' | 'rq' | 'splunk-spl' | 'sqf' | 'sql' | 'squirrel' | 'stan' | 'stata' | 'iecst' | 'stylus' | 'supercollider' | 'sclang' | 'swift' | 'systemd' | 't4-templating' | 't4-cs' | 't4' | 't4-vb' | 'tap' | 'tcl' | 'tt2' | 'textile' | 'toml' | 'tremor' | 'trickle' | 'troy' | 'turtle' | 'trig' | 'twig' | 'typescript' | 'ts' | 'typoscript' | 'tsconfig' | 'unrealscript' | 'uscript' | 'uc' | 'uorazor' | 'uri' | 'url' | 'v' | 'vala' | 'vbnet' | 'velocity' | 'verilog' | 'vhdl' | 'vim' | 'visual-basic' | 'vb' | 'vba' | 'warpscript' | 'wasm' | 'web-idl' | 'webidl' | 'wgsl' | 'wiki' | 'wolfram' | 'mathematica' | 'nb' | 'wl' | 'wren' | 'xeora' | 'xeoracube' | 'xml-doc' | 'xojo' | 'xquery' | 'yaml' | 'yml' | 'yang' | 'zig';
//#endregion
//#region src/themes.d.ts
type Theme = Record<string | 'base' | keyof Prism.Grammar, React.CSSProperties>;
declare const xonokai: {
  readonly base: {
    readonly MozTabSize: "2";
    readonly OTabSize: "2";
    readonly tabSize: "2";
    readonly WebkitHyphens: "none";
    readonly MozHyphens: "none";
    readonly hyphens: "none";
    readonly whiteSpace: "pre-wrap";
    readonly wordWrap: "normal";
    readonly fontFamily: "Menlo, Monaco, \"Courier New\", monospace";
    readonly fontSize: "14px";
    readonly color: "#76d9e6";
    readonly textShadow: "none";
    readonly background: "#2a2a2a";
    readonly padding: "15px";
    readonly borderRadius: "4px";
    readonly border: "1px solid #e1e1e8";
    readonly overflow: "auto";
    readonly position: "relative";
  };
  readonly namespace: {
    readonly opacity: ".7";
  };
  readonly comment: {
    readonly color: "#6f705e";
  };
  readonly prolog: {
    readonly color: "#6f705e";
  };
  readonly doctype: {
    readonly color: "#6f705e";
  };
  readonly cdata: {
    readonly color: "#6f705e";
  };
  readonly operator: {
    readonly color: "#a77afe";
  };
  readonly boolean: {
    readonly color: "#a77afe";
  };
  readonly number: {
    readonly color: "#a77afe";
  };
  readonly 'attr-name': {
    readonly color: "#e6d06c";
  };
  readonly string: {
    readonly color: "#e6d06c";
  };
  readonly entity: {
    readonly color: "#e6d06c";
    readonly cursor: "help";
  };
  readonly url: {
    readonly color: "#e6d06c";
  };
  readonly selector: {
    readonly color: "#a6e22d";
  };
  readonly inserted: {
    readonly color: "#a6e22d";
  };
  readonly atrule: {
    readonly color: "#ef3b7d";
  };
  readonly 'attr-value': {
    readonly color: "#ef3b7d";
  };
  readonly keyword: {
    readonly color: "#ef3b7d";
  };
  readonly important: {
    readonly color: "#ef3b7d";
    readonly fontWeight: "bold";
  };
  readonly deleted: {
    readonly color: "#ef3b7d";
  };
  readonly regex: {
    readonly color: "#76d9e6";
  };
  readonly statement: {
    readonly color: "#76d9e6";
    readonly fontWeight: "bold";
  };
  readonly placeholder: {
    readonly color: "#fff";
  };
  readonly variable: {
    readonly color: "#fff";
  };
  readonly bold: {
    readonly fontWeight: "bold";
  };
  readonly punctuation: {
    readonly color: "#bebec5";
  };
  readonly italic: {
    readonly fontStyle: "italic";
  };
};
declare const vscDarkPlus: {
  readonly base: {
    readonly color: "#d4d4d4";
    readonly fontSize: "13px";
    readonly textShadow: "none";
    readonly fontFamily: "Menlo, Monaco, Consolas, \"Andale Mono\", \"Ubuntu Mono\", \"Courier New\", monospace";
    readonly direction: "ltr";
    readonly textAlign: "left";
    readonly whiteSpace: "pre";
    readonly wordSpacing: "normal";
    readonly wordBreak: "normal";
    readonly lineHeight: "1.5";
    readonly MozTabSize: "4";
    readonly OTabSize: "4";
    readonly tabSize: "4";
    readonly WebkitHyphens: "none";
    readonly MozHyphens: "none";
    readonly hyphens: "none";
    readonly padding: "1em";
    readonly margin: ".5em 0";
    readonly overflow: "auto";
    readonly background: "#1e1e1e";
  };
  readonly 'doctype .token.doctype-tag': {
    readonly color: "#569CD6";
  };
  readonly 'doctype .token.name': {
    readonly color: "#9cdcfe";
  };
  readonly comment: {
    readonly color: "#6a9955";
  };
  readonly prolog: {
    readonly color: "#6a9955";
  };
  readonly punctuation: {
    readonly color: "#d4d4d4";
  };
  readonly property: {
    readonly color: "#9cdcfe";
  };
  readonly tag: {
    readonly color: "#569cd6";
  };
  readonly boolean: {
    readonly color: "#569cd6";
  };
  readonly number: {
    readonly color: "#b5cea8";
  };
  readonly constant: {
    readonly color: "#9cdcfe";
  };
  readonly symbol: {
    readonly color: "#b5cea8";
  };
  readonly inserted: {
    readonly color: "#b5cea8";
  };
  readonly unit: {
    readonly color: "#b5cea8";
  };
  readonly selector: {
    readonly color: "#d7ba7d";
  };
  readonly 'attr-name': {
    readonly color: "#9cdcfe";
  };
  readonly string: {
    readonly color: "#ce9178";
  };
  readonly char: {
    readonly color: "#ce9178";
  };
  readonly builtin: {
    readonly color: "#ce9178";
  };
  readonly deleted: {
    readonly color: "#ce9178";
  };
  readonly operator: {
    readonly color: "#d4d4d4";
  };
  readonly entity: {
    readonly color: "#569cd6";
  };
  readonly 'operator.arrow': {
    readonly color: "#569CD6";
  };
  readonly atrule: {
    readonly color: "#ce9178";
  };
  readonly 'atrule .token.rule': {
    readonly color: "#c586c0";
  };
  readonly 'atrule .token.url': {
    readonly color: "#9cdcfe";
  };
  readonly 'atrule .token.url .token.function': {
    readonly color: "#dcdcaa";
  };
  readonly 'atrule .token.url .token.punctuation': {
    readonly color: "#d4d4d4";
  };
  readonly keyword: {
    readonly color: "#569CD6";
  };
  readonly 'keyword.module': {
    readonly color: "#c586c0";
  };
  readonly 'keyword.control-flow': {
    readonly color: "#c586c0";
  };
  readonly function: {
    readonly color: "#dcdcaa";
  };
  readonly 'function .token.maybe-class-name': {
    readonly color: "#dcdcaa";
  };
  readonly regex: {
    readonly color: "#d16969";
  };
  readonly important: {
    readonly color: "#569cd6";
  };
  readonly italic: {
    readonly fontStyle: "italic";
  };
  readonly 'class-name': {
    readonly color: "#4ec9b0";
  };
  readonly 'maybe-class-name': {
    readonly color: "#4ec9b0";
  };
  readonly console: {
    readonly color: "#9cdcfe";
  };
  readonly parameter: {
    readonly color: "#9cdcfe";
  };
  readonly interpolation: {
    readonly color: "#9cdcfe";
  };
  readonly 'punctuation.interpolation-punctuation': {
    readonly color: "#569cd6";
  };
  readonly variable: {
    readonly color: "#9cdcfe";
  };
  readonly 'imports .token.maybe-class-name': {
    readonly color: "#9cdcfe";
  };
  readonly 'exports .token.maybe-class-name': {
    readonly color: "#9cdcfe";
  };
  readonly escape: {
    readonly color: "#d7ba7d";
  };
  readonly 'tag .token.punctuation': {
    readonly color: "#808080";
  };
  readonly cdata: {
    readonly color: "#808080";
  };
  readonly 'attr-value': {
    readonly color: "#ce9178";
  };
  readonly 'attr-value .token.punctuation': {
    readonly color: "#ce9178";
  };
  readonly 'attr-value .token.punctuation.attr-equals': {
    readonly color: "#d4d4d4";
  };
  readonly namespace: {
    readonly color: "#4ec9b0";
  };
};
declare const duotoneForest: {
  readonly base: {
    readonly fontFamily: "Consolas, Menlo, Monaco, \"Andale Mono WT\", \"Andale Mono\", \"Lucida Console\", \"Lucida Sans Typewriter\", \"DejaVu Sans Mono\", \"Bitstream Vera Sans Mono\", \"Liberation Mono\", \"Nimbus Mono L\", \"Courier New\", Courier, monospace";
    readonly fontSize: "14px";
    readonly lineHeight: "1.375";
    readonly direction: "ltr";
    readonly textAlign: "left";
    readonly whiteSpace: "pre";
    readonly wordSpacing: "normal";
    readonly wordBreak: "normal";
    readonly MozTabSize: "4";
    readonly OTabSize: "4";
    readonly tabSize: "4";
    readonly WebkitHyphens: "none";
    readonly MozHyphens: "none";
    readonly hyphens: "none";
    readonly background: "#2a2d2a";
    readonly color: "#687d68";
    readonly padding: "1em";
    readonly margin: ".5em 0";
    readonly overflow: "auto";
  };
  readonly comment: {
    readonly color: "#535f53";
  };
  readonly prolog: {
    readonly color: "#535f53";
  };
  readonly doctype: {
    readonly color: "#535f53";
  };
  readonly cdata: {
    readonly color: "#535f53";
  };
  readonly punctuation: {
    readonly color: "#535f53";
  };
  readonly namespace: {
    readonly opacity: ".7";
  };
  readonly tag: {
    readonly color: "#a2b34d";
  };
  readonly operator: {
    readonly color: "#a2b34d";
  };
  readonly number: {
    readonly color: "#a2b34d";
  };
  readonly property: {
    readonly color: "#687d68";
  };
  readonly function: {
    readonly color: "#687d68";
  };
  readonly 'tag-id': {
    readonly color: "#f0fff0";
  };
  readonly selector: {
    readonly color: "#f0fff0";
  };
  readonly 'atrule-id': {
    readonly color: "#f0fff0";
  };
  readonly 'attr-name': {
    readonly color: "#b3d6b3";
  };
  readonly boolean: {
    readonly color: "#e5fb79";
  };
  readonly string: {
    readonly color: "#e5fb79";
  };
  readonly entity: {
    readonly color: "#e5fb79";
    readonly cursor: "help";
  };
  readonly url: {
    readonly color: "#e5fb79";
  };
  readonly 'attr-value': {
    readonly color: "#e5fb79";
  };
  readonly keyword: {
    readonly color: "#e5fb79";
  };
  readonly control: {
    readonly color: "#e5fb79";
  };
  readonly directive: {
    readonly color: "#e5fb79";
  };
  readonly unit: {
    readonly color: "#e5fb79";
  };
  readonly statement: {
    readonly color: "#e5fb79";
  };
  readonly regex: {
    readonly color: "#e5fb79";
  };
  readonly atrule: {
    readonly color: "#e5fb79";
  };
  readonly placeholder: {
    readonly color: "#e5fb79";
  };
  readonly variable: {
    readonly color: "#e5fb79";
  };
  readonly deleted: {
    readonly textDecoration: "line-through";
  };
  readonly inserted: {
    readonly borderBottom: "1px dotted #f0fff0";
    readonly textDecoration: "none";
  };
  readonly italic: {
    readonly fontStyle: "italic";
  };
  readonly important: {
    readonly fontWeight: "bold";
    readonly color: "#b3d6b3";
  };
  readonly bold: {
    readonly fontWeight: "bold";
  };
};
declare const holiTheme: {
  readonly base: {};
  readonly comment: {
    readonly color: "#446e69";
  };
  readonly prolog: {
    readonly color: "#446e69";
  };
  readonly doctype: {
    readonly color: "#446e69";
  };
  readonly cdata: {
    readonly color: "#446e69";
  };
  readonly punctuation: {
    readonly color: "#d6b007";
  };
  readonly property: {
    readonly color: "#d6e7ff";
  };
  readonly tag: {
    readonly color: "#d6e7ff";
  };
  readonly boolean: {
    readonly color: "#d6e7ff";
  };
  readonly number: {
    readonly color: "#d6e7ff";
  };
  readonly constant: {
    readonly color: "#d6e7ff";
  };
  readonly symbol: {
    readonly color: "#d6e7ff";
  };
  readonly deleted: {
    readonly color: "#d6e7ff";
  };
  readonly selector: {
    readonly color: "#e60067";
  };
  readonly 'attr-name': {
    readonly color: "#e60067";
  };
  readonly builtin: {
    readonly color: "#e60067";
  };
  readonly inserted: {
    readonly color: "#e60067";
  };
  readonly string: {
    readonly color: "#49c6ec";
  };
  readonly char: {
    readonly color: "#49c6ec";
  };
  readonly operator: {
    readonly color: "#ec8e01";
    readonly background: "transparent";
  };
  readonly entity: {
    readonly color: "#ec8e01";
    readonly background: "transparent";
  };
  readonly url: {
    readonly color: "#ec8e01";
    readonly background: "transparent";
  };
  readonly atrule: {
    readonly color: "#0fe468";
  };
  readonly 'attr-value': {
    readonly color: "#0fe468";
  };
  readonly keyword: {
    readonly color: "#0fe468";
  };
  readonly function: {
    readonly color: "#78f3e9";
  };
  readonly 'class-name': {
    readonly color: "#78f3e9";
  };
  readonly regex: {
    readonly color: "#d6e7ff";
  };
  readonly important: {
    readonly color: "#d6e7ff";
  };
  readonly variable: {
    readonly color: "#d6e7ff";
  };
};
declare const cb: {
  readonly base: {
    readonly color: "#fff";
    readonly textShadow: "0 1px 1px #000";
    readonly fontFamily: "Menlo, Monaco, \"Courier New\", monospace";
    readonly direction: "ltr";
    readonly textAlign: "left";
    readonly wordSpacing: "normal";
    readonly whiteSpace: "pre";
    readonly wordWrap: "normal";
    readonly lineHeight: "1.4";
    readonly background: "#222";
    readonly border: "0";
    readonly MozTabSize: "4";
    readonly OTabSize: "4";
    readonly tabSize: "4";
    readonly WebkitHyphens: "none";
    readonly MozHyphens: "none";
    readonly hyphens: "none";
    readonly padding: "15px";
    readonly margin: "1em 0";
    readonly overflow: "auto";
    readonly MozBorderRadius: "8px";
    readonly WebkitBorderRadius: "8px";
    readonly borderRadius: "8px";
  };
  readonly comment: {
    readonly color: "#797979";
  };
  readonly prolog: {
    readonly color: "#797979";
  };
  readonly doctype: {
    readonly color: "#797979";
  };
  readonly cdata: {
    readonly color: "#797979";
  };
  readonly selector: {
    readonly color: "#fff";
  };
  readonly operator: {
    readonly color: "#fff";
  };
  readonly punctuation: {
    readonly color: "#fff";
  };
  readonly namespace: {
    readonly opacity: ".7";
  };
  readonly tag: {
    readonly color: "#ffd893";
  };
  readonly boolean: {
    readonly color: "#ffd893";
  };
  readonly atrule: {
    readonly color: "#B0C975";
  };
  readonly 'attr-value': {
    readonly color: "#B0C975";
  };
  readonly hex: {
    readonly color: "#B0C975";
  };
  readonly string: {
    readonly color: "#B0C975";
  };
  readonly property: {
    readonly color: "#c27628";
  };
  readonly entity: {
    readonly color: "#c27628";
    readonly cursor: "help";
  };
  readonly url: {
    readonly color: "#c27628";
  };
  readonly 'attr-name': {
    readonly color: "#c27628";
  };
  readonly keyword: {
    readonly color: "#c27628";
  };
  readonly regex: {
    readonly color: "#9B71C6";
  };
  readonly function: {
    readonly color: "#e5a638";
  };
  readonly constant: {
    readonly color: "#e5a638";
  };
  readonly variable: {
    readonly color: "#fdfba8";
  };
  readonly number: {
    readonly color: "#8799B0";
  };
  readonly important: {
    readonly color: "#E45734";
  };
  readonly deliminator: {
    readonly color: "#E45734";
  };
};
declare const vs: {
  readonly base: {
    readonly color: "#393A34";
    readonly fontFamily: "\"Consolas\", \"Bitstream Vera Sans Mono\", \"Courier New\", Courier, monospace";
    readonly direction: "ltr";
    readonly textAlign: "left";
    readonly whiteSpace: "pre";
    readonly wordSpacing: "normal";
    readonly wordBreak: "normal";
    readonly fontSize: ".9em";
    readonly lineHeight: "1.2em";
    readonly MozTabSize: "4";
    readonly OTabSize: "4";
    readonly tabSize: "4";
    readonly WebkitHyphens: "none";
    readonly MozHyphens: "none";
    readonly hyphens: "none";
    readonly padding: "1em";
    readonly margin: ".5em 0";
    readonly overflow: "auto";
    readonly border: "1px solid #dddddd";
    readonly backgroundColor: "white";
  };
  readonly comment: {
    readonly color: "#008000";
    readonly fontStyle: "italic";
  };
  readonly prolog: {
    readonly color: "#008000";
    readonly fontStyle: "italic";
  };
  readonly doctype: {
    readonly color: "#008000";
    readonly fontStyle: "italic";
  };
  readonly cdata: {
    readonly color: "#008000";
    readonly fontStyle: "italic";
  };
  readonly namespace: {
    readonly opacity: ".7";
  };
  readonly string: {
    readonly color: "#A31515";
  };
  readonly punctuation: {
    readonly color: "#393A34";
  };
  readonly operator: {
    readonly color: "#393A34";
  };
  readonly url: {
    readonly color: "#36acaa";
  };
  readonly symbol: {
    readonly color: "#36acaa";
  };
  readonly number: {
    readonly color: "#36acaa";
  };
  readonly boolean: {
    readonly color: "#36acaa";
  };
  readonly variable: {
    readonly color: "#36acaa";
  };
  readonly constant: {
    readonly color: "#36acaa";
  };
  readonly inserted: {
    readonly color: "#36acaa";
  };
  readonly atrule: {
    readonly color: "#0000ff";
  };
  readonly keyword: {
    readonly color: "#0000ff";
  };
  readonly 'attr-value': {
    readonly color: "#0000ff";
  };
  readonly function: {
    readonly color: "#393A34";
  };
  readonly deleted: {
    readonly color: "#9a050f";
  };
  readonly selector: {
    readonly color: "#800000";
  };
  readonly important: {
    readonly color: "#e90";
    readonly fontWeight: "bold";
  };
  readonly bold: {
    readonly fontWeight: "bold";
  };
  readonly italic: {
    readonly fontStyle: "italic";
  };
  readonly 'class-name': {
    readonly color: "#2B91AF";
  };
  readonly tag: {
    readonly color: "#800000";
  };
  readonly 'attr-name': {
    readonly color: "#ff0000";
  };
  readonly property: {
    readonly color: "#ff0000";
  };
  readonly regex: {
    readonly color: "#ff0000";
  };
  readonly entity: {
    readonly color: "#ff0000";
  };
  readonly 'directive.tag .tag': {
    readonly background: "#ffff00";
    readonly color: "#393A34";
  };
};
declare const materialDark: {
  readonly base: {
    readonly textAlign: "left";
    readonly whiteSpace: "pre";
    readonly wordSpacing: "normal";
    readonly wordBreak: "normal";
    readonly wordWrap: "normal";
    readonly color: "#eee";
    readonly background: "#2f2f2f";
    readonly fontFamily: "Roboto Mono, monospace";
    readonly fontSize: "1em";
    readonly lineHeight: "1.5em";
    readonly MozTabSize: "4";
    readonly OTabSize: "4";
    readonly tabSize: "4";
    readonly WebkitHyphens: "none";
    readonly MozHyphens: "none";
    readonly hyphens: "none";
    readonly overflow: "auto";
    readonly position: "relative";
    readonly margin: "0.5em 0";
    readonly padding: "1.25em 1em";
  };
  readonly atrule: {
    readonly color: "#c792ea";
  };
  readonly 'attr-name': {
    readonly color: "#ffcb6b";
  };
  readonly 'attr-value': {
    readonly color: "#a5e844";
  };
  readonly attribute: {
    readonly color: "#a5e844";
  };
  readonly boolean: {
    readonly color: "#c792ea";
  };
  readonly builtin: {
    readonly color: "#ffcb6b";
  };
  readonly cdata: {
    readonly color: "#80cbc4";
  };
  readonly char: {
    readonly color: "#80cbc4";
  };
  readonly class: {
    readonly color: "#ffcb6b";
  };
  readonly 'class-name': {
    readonly color: "#f2ff00";
  };
  readonly comment: {
    readonly color: "#616161";
  };
  readonly constant: {
    readonly color: "#c792ea";
  };
  readonly deleted: {
    readonly color: "#ff6666";
  };
  readonly doctype: {
    readonly color: "#616161";
  };
  readonly entity: {
    readonly color: "#ff6666";
  };
  readonly function: {
    readonly color: "#c792ea";
  };
  readonly hexcode: {
    readonly color: "#f2ff00";
  };
  readonly id: {
    readonly color: "#c792ea";
    readonly fontWeight: "bold";
  };
  readonly important: {
    readonly color: "#c792ea";
    readonly fontWeight: "bold";
  };
  readonly inserted: {
    readonly color: "#80cbc4";
  };
  readonly keyword: {
    readonly color: "#c792ea";
  };
  readonly number: {
    readonly color: "#fd9170";
  };
  readonly operator: {
    readonly color: "#89ddff";
  };
  readonly prolog: {
    readonly color: "#616161";
  };
  readonly property: {
    readonly color: "#80cbc4";
  };
  readonly 'pseudo-class': {
    readonly color: "#a5e844";
  };
  readonly 'pseudo-element': {
    readonly color: "#a5e844";
  };
  readonly punctuation: {
    readonly color: "#89ddff";
  };
  readonly regex: {
    readonly color: "#f2ff00";
  };
  readonly selector: {
    readonly color: "#ff6666";
  };
  readonly string: {
    readonly color: "#a5e844";
  };
  readonly symbol: {
    readonly color: "#c792ea";
  };
  readonly tag: {
    readonly color: "#ff6666";
  };
  readonly unit: {
    readonly color: "#fd9170";
  };
  readonly url: {
    readonly color: "#ff6666";
  };
  readonly variable: {
    readonly color: "#ff6666";
  };
};
declare const dracula: {
  readonly base: {
    readonly color: "#f8f8f2";
    readonly background: "#282a36";
    readonly textShadow: "0 1px rgba(0, 0, 0, 0.3)";
    readonly fontFamily: "Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace";
    readonly textAlign: "left";
    readonly whiteSpace: "pre";
    readonly wordSpacing: "normal";
    readonly wordBreak: "normal";
    readonly wordWrap: "normal";
    readonly lineHeight: "1.5";
    readonly MozTabSize: "4";
    readonly OTabSize: "4";
    readonly tabSize: "4";
    readonly WebkitHyphens: "none";
    readonly MozHyphens: "none";
    readonly hyphens: "none";
    readonly padding: "1em";
    readonly margin: ".5em 0";
    readonly overflow: "auto";
    readonly borderRadius: "0.3em";
  };
  readonly comment: {
    readonly color: "#6272a4";
  };
  readonly prolog: {
    readonly color: "#6272a4";
  };
  readonly doctype: {
    readonly color: "#6272a4";
  };
  readonly cdata: {
    readonly color: "#6272a4";
  };
  readonly punctuation: {
    readonly color: "#f8f8f2";
  };
  readonly property: {
    readonly color: "#ff79c6";
  };
  readonly tag: {
    readonly color: "#ff79c6";
  };
  readonly constant: {
    readonly color: "#ff79c6";
  };
  readonly symbol: {
    readonly color: "#ff79c6";
  };
  readonly deleted: {
    readonly color: "#ff79c6";
  };
  readonly boolean: {
    readonly color: "#bd93f9";
  };
  readonly number: {
    readonly color: "#bd93f9";
  };
  readonly selector: {
    readonly color: "#50fa7b";
  };
  readonly 'attr-name': {
    readonly color: "#50fa7b";
  };
  readonly string: {
    readonly color: "#50fa7b";
  };
  readonly char: {
    readonly color: "#50fa7b";
  };
  readonly builtin: {
    readonly color: "#50fa7b";
  };
  readonly inserted: {
    readonly color: "#50fa7b";
  };
  readonly operator: {
    readonly color: "#f8f8f2";
  };
  readonly entity: {
    readonly color: "#f8f8f2";
    readonly cursor: "help";
  };
  readonly url: {
    readonly color: "#f8f8f2";
  };
  readonly variable: {
    readonly color: "#f8f8f2";
  };
  readonly atrule: {
    readonly color: "#f1fa8c";
  };
  readonly 'attr-value': {
    readonly color: "#f1fa8c";
  };
  readonly function: {
    readonly color: "#f1fa8c";
  };
  readonly 'class-name': {
    readonly color: "#f1fa8c";
  };
  readonly keyword: {
    readonly color: "#8be9fd";
  };
  readonly regex: {
    readonly color: "#ffb86c";
  };
  readonly important: {
    readonly color: "#ffb86c";
    readonly fontWeight: "bold";
  };
  readonly bold: {
    readonly fontWeight: "bold";
  };
  readonly italic: {
    readonly fontStyle: "italic";
  };
};
declare const shadesOfPurple: {
  readonly base: {};
  readonly '': {
    readonly fontWeight: "400";
  };
  readonly comment: {
    readonly color: "#b362ff";
  };
  readonly prolog: {
    readonly color: "#b362ff";
  };
  readonly cdata: {
    readonly color: "#b362ff";
  };
  readonly delimiter: {
    readonly color: "#ff9d00";
  };
  readonly keyword: {
    readonly color: "#ff9d00";
  };
  readonly selector: {
    readonly color: "#ff9d00";
  };
  readonly important: {
    readonly color: "#ff9d00";
  };
  readonly atrule: {
    readonly color: "#ff9d00";
  };
  readonly operator: {
    readonly color: "rgb(255, 180, 84)";
    readonly background: "none";
  };
  readonly 'attr-name': {
    readonly color: "rgb(255, 180, 84)";
  };
  readonly punctuation: {
    readonly color: "#ffffff";
  };
  readonly boolean: {
    readonly color: "rgb(255, 98, 140)";
  };
  readonly tag: {
    readonly color: "rgb(255, 157, 0)";
  };
  readonly 'tag .punctuation': {
    readonly color: "rgb(255, 157, 0)";
  };
  readonly doctype: {
    readonly color: "rgb(255, 157, 0)";
  };
  readonly builtin: {
    readonly color: "rgb(255, 157, 0)";
  };
  readonly entity: {
    readonly color: "#6897bb";
    readonly background: "none";
  };
  readonly symbol: {
    readonly color: "#6897bb";
  };
  readonly number: {
    readonly color: "#ff628c";
  };
  readonly property: {
    readonly color: "#ff628c";
  };
  readonly constant: {
    readonly color: "#ff628c";
  };
  readonly variable: {
    readonly color: "#ff628c";
  };
  readonly string: {
    readonly color: "#a5ff90";
  };
  readonly char: {
    readonly color: "#a5ff90";
  };
  readonly 'attr-value': {
    readonly color: "#a5c261";
  };
  readonly 'attr-value .punctuation': {
    readonly color: "#a5c261";
  };
  readonly 'attr-value .punctuation:first-child': {
    readonly color: "#a9b7c6";
  };
  readonly url: {
    readonly color: "#287bde";
    readonly textDecoration: "underline";
    readonly background: "none";
  };
  readonly function: {
    readonly color: "rgb(250, 208, 0)";
  };
  readonly regex: {
    readonly background: "#364135";
  };
  readonly bold: {
    readonly fontWeight: "bold";
  };
  readonly italic: {
    readonly fontStyle: "italic";
  };
  readonly inserted: {
    readonly background: "#00ff00";
  };
  readonly deleted: {
    readonly background: "#ff000d";
  };
  readonly 'class-name': {
    readonly color: "#fb94ff";
  };
};
declare const gruvboxDark: {
  readonly base: {
    readonly color: "#ebdbb2";
    readonly fontFamily: "Consolas, Monaco, \"Andale Mono\", monospace";
    readonly direction: "ltr";
    readonly textAlign: "left";
    readonly whiteSpace: "pre";
    readonly wordSpacing: "normal";
    readonly wordBreak: "normal";
    readonly lineHeight: "1.5";
    readonly MozTabSize: "4";
    readonly OTabSize: "4";
    readonly tabSize: "4";
    readonly WebkitHyphens: "none";
    readonly MozHyphens: "none";
    readonly hyphens: "none";
    readonly padding: "1em";
    readonly margin: "0.5em 0";
    readonly overflow: "auto";
    readonly background: "#1d2021";
  };
  readonly comment: {
    readonly color: "#a89984";
  };
  readonly prolog: {
    readonly color: "#a89984";
  };
  readonly cdata: {
    readonly color: "#a89984";
  };
  readonly delimiter: {
    readonly color: "#fb4934";
  };
  readonly boolean: {
    readonly color: "#fb4934";
  };
  readonly keyword: {
    readonly color: "#fb4934";
  };
  readonly selector: {
    readonly color: "#fb4934";
  };
  readonly important: {
    readonly color: "#fb4934";
  };
  readonly atrule: {
    readonly color: "#fb4934";
  };
  readonly operator: {
    readonly color: "#a89984";
  };
  readonly punctuation: {
    readonly color: "#a89984";
  };
  readonly 'attr-name': {
    readonly color: "#a89984";
  };
  readonly tag: {
    readonly color: "#fabd2f";
  };
  readonly 'tag .punctuation': {
    readonly color: "#fabd2f";
  };
  readonly doctype: {
    readonly color: "#fabd2f";
  };
  readonly builtin: {
    readonly color: "#fabd2f";
  };
  readonly entity: {
    readonly color: "#d3869b";
  };
  readonly number: {
    readonly color: "#d3869b";
  };
  readonly symbol: {
    readonly color: "#d3869b";
  };
  readonly property: {
    readonly color: "#fb4934";
  };
  readonly constant: {
    readonly color: "#fb4934";
  };
  readonly variable: {
    readonly color: "#fb4934";
  };
  readonly string: {
    readonly color: "#b8bb26";
  };
  readonly char: {
    readonly color: "#b8bb26";
  };
  readonly 'attr-value': {
    readonly color: "#a89984";
  };
  readonly 'attr-value .punctuation': {
    readonly color: "#a89984";
  };
  readonly url: {
    readonly color: "#b8bb26";
    readonly textDecoration: "underline";
  };
  readonly function: {
    readonly color: "#fabd2f";
  };
  readonly regex: {
    readonly background: "#b8bb26";
  };
  readonly bold: {
    readonly fontWeight: "bold";
  };
  readonly italic: {
    readonly fontStyle: "italic";
  };
  readonly inserted: {
    readonly background: "#a89984";
  };
  readonly deleted: {
    readonly background: "#fb4934";
  };
};
declare const baseAteliersulphurpoolLight: {
  readonly base: {
    readonly fontFamily: "Consolas, Menlo, Monaco, \"Andale Mono WT\", \"Andale Mono\", \"Lucida Console\", \"Lucida Sans Typewriter\", \"DejaVu Sans Mono\", \"Bitstream Vera Sans Mono\", \"Liberation Mono\", \"Nimbus Mono L\", \"Courier New\", Courier, monospace";
    readonly fontSize: "14px";
    readonly lineHeight: "1.375";
    readonly direction: "ltr";
    readonly textAlign: "left";
    readonly whiteSpace: "pre";
    readonly wordSpacing: "normal";
    readonly wordBreak: "normal";
    readonly MozTabSize: "4";
    readonly OTabSize: "4";
    readonly tabSize: "4";
    readonly WebkitHyphens: "none";
    readonly MozHyphens: "none";
    readonly hyphens: "none";
    readonly background: "#f5f7ff";
    readonly color: "#5e6687";
    readonly padding: "1em";
    readonly margin: ".5em 0";
    readonly overflow: "auto";
  };
  readonly comment: {
    readonly color: "#898ea4";
  };
  readonly prolog: {
    readonly color: "#898ea4";
  };
  readonly doctype: {
    readonly color: "#898ea4";
  };
  readonly cdata: {
    readonly color: "#898ea4";
  };
  readonly punctuation: {
    readonly color: "#5e6687";
  };
  readonly namespace: {
    readonly opacity: ".7";
  };
  readonly operator: {
    readonly color: "#c76b29";
  };
  readonly boolean: {
    readonly color: "#c76b29";
  };
  readonly number: {
    readonly color: "#c76b29";
  };
  readonly property: {
    readonly color: "#c08b30";
  };
  readonly tag: {
    readonly color: "#3d8fd1";
  };
  readonly string: {
    readonly color: "#22a2c9";
  };
  readonly selector: {
    readonly color: "#6679cc";
  };
  readonly 'attr-name': {
    readonly color: "#c76b29";
  };
  readonly entity: {
    readonly color: "#22a2c9";
    readonly cursor: "help";
  };
  readonly url: {
    readonly color: "#22a2c9";
  };
  readonly 'attr-value': {
    readonly color: "#ac9739";
  };
  readonly keyword: {
    readonly color: "#ac9739";
  };
  readonly control: {
    readonly color: "#ac9739";
  };
  readonly directive: {
    readonly color: "#ac9739";
  };
  readonly unit: {
    readonly color: "#ac9739";
  };
  readonly statement: {
    readonly color: "#22a2c9";
  };
  readonly regex: {
    readonly color: "#22a2c9";
  };
  readonly atrule: {
    readonly color: "#22a2c9";
  };
  readonly placeholder: {
    readonly color: "#3d8fd1";
  };
  readonly variable: {
    readonly color: "#3d8fd1";
  };
  readonly deleted: {
    readonly textDecoration: "line-through";
  };
  readonly inserted: {
    readonly borderBottom: "1px dotted #202746";
    readonly textDecoration: "none";
  };
  readonly italic: {
    readonly fontStyle: "italic";
  };
  readonly important: {
    readonly fontWeight: "bold";
    readonly color: "#c94922";
  };
  readonly bold: {
    readonly fontWeight: "bold";
  };
};
declare const coldarkCold: {
  readonly base: {
    readonly color: "#111b27";
    readonly background: "#e3eaf2";
    readonly fontFamily: "Consolas, Monaco, \"Andale Mono\", \"Ubuntu Mono\", monospace";
    readonly textAlign: "left";
    readonly whiteSpace: "pre";
    readonly wordSpacing: "normal";
    readonly wordBreak: "normal";
    readonly wordWrap: "normal";
    readonly lineHeight: "1.5";
    readonly MozTabSize: "4";
    readonly OTabSize: "4";
    readonly tabSize: "4";
    readonly WebkitHyphens: "none";
    readonly MozHyphens: "none";
    readonly hyphens: "none";
    readonly padding: "1em";
    readonly margin: "0.5em 0";
    readonly overflow: "auto";
  };
  readonly comment: {
    readonly color: "#3c526d";
  };
  readonly prolog: {
    readonly color: "#3c526d";
  };
  readonly doctype: {
    readonly color: "#3c526d";
  };
  readonly cdata: {
    readonly color: "#3c526d";
  };
  readonly punctuation: {
    readonly color: "#111b27";
  };
  readonly 'delimiter.important': {
    readonly color: "#006d6d";
    readonly fontWeight: "inherit";
  };
  readonly 'selector .parent': {
    readonly color: "#006d6d";
  };
  readonly tag: {
    readonly color: "#006d6d";
  };
  readonly 'tag .token.punctuation': {
    readonly color: "#006d6d";
  };
  readonly 'attr-name': {
    readonly color: "#755f00";
  };
  readonly boolean: {
    readonly color: "#755f00";
  };
  readonly 'boolean.important': {
    readonly color: "#755f00";
  };
  readonly number: {
    readonly color: "#755f00";
  };
  readonly constant: {
    readonly color: "#755f00";
  };
  readonly 'selector .token.attribute': {
    readonly color: "#755f00";
  };
  readonly 'class-name': {
    readonly color: "#005a8e";
  };
  readonly key: {
    readonly color: "#005a8e";
  };
  readonly parameter: {
    readonly color: "#005a8e";
  };
  readonly property: {
    readonly color: "#005a8e";
  };
  readonly 'property-access': {
    readonly color: "#005a8e";
  };
  readonly variable: {
    readonly color: "#005a8e";
  };
  readonly 'attr-value': {
    readonly color: "#116b00";
  };
  readonly inserted: {
    readonly color: "#116b00";
  };
  readonly color: {
    readonly color: "#116b00";
  };
  readonly 'selector .token.value': {
    readonly color: "#116b00";
  };
  readonly string: {
    readonly color: "#116b00";
  };
  readonly 'string .token.url-link': {
    readonly color: "#116b00";
  };
  readonly builtin: {
    readonly color: "#af00af";
  };
  readonly 'keyword-array': {
    readonly color: "#af00af";
  };
  readonly package: {
    readonly color: "#af00af";
  };
  readonly regex: {
    readonly color: "#af00af";
  };
  readonly function: {
    readonly color: "#7c00aa";
  };
  readonly 'selector .token.class': {
    readonly color: "#7c00aa";
  };
  readonly 'selector .token.id': {
    readonly color: "#7c00aa";
  };
  readonly 'atrule .token.rule': {
    readonly color: "#a04900";
  };
  readonly combinator: {
    readonly color: "#a04900";
  };
  readonly keyword: {
    readonly color: "#a04900";
  };
  readonly operator: {
    readonly color: "#a04900";
  };
  readonly 'pseudo-class': {
    readonly color: "#a04900";
  };
  readonly 'pseudo-element': {
    readonly color: "#a04900";
  };
  readonly selector: {
    readonly color: "#a04900";
  };
  readonly unit: {
    readonly color: "#a04900";
  };
  readonly deleted: {
    readonly color: "#c22f2e";
  };
  readonly important: {
    readonly color: "#c22f2e";
    readonly fontWeight: "bold";
  };
  readonly 'keyword-this': {
    readonly color: "#005a8e";
    readonly fontWeight: "bold";
  };
  readonly this: {
    readonly color: "#005a8e";
    readonly fontWeight: "bold";
  };
  readonly bold: {
    readonly fontWeight: "bold";
  };
  readonly italic: {
    readonly fontStyle: "italic";
  };
  readonly entity: {
    readonly cursor: "help";
  };
  readonly 'token.tab:not(:empty):before': {
    readonly color: "#3c526d";
  };
  readonly 'token.cr:before': {
    readonly color: "#3c526d";
  };
  readonly 'token.lf:before': {
    readonly color: "#3c526d";
  };
  readonly 'token.space:before': {
    readonly color: "#3c526d";
  };
};
declare const solarizedDarkAtom: {
  readonly base: {
    readonly color: "#839496";
    readonly textShadow: "0 1px rgba(0, 0, 0, 0.3)";
    readonly fontFamily: "Inconsolata, Monaco, Consolas, 'Courier New', Courier, monospace";
    readonly direction: "ltr";
    readonly textAlign: "left";
    readonly whiteSpace: "pre";
    readonly wordSpacing: "normal";
    readonly wordBreak: "normal";
    readonly lineHeight: "1.5";
    readonly MozTabSize: "4";
    readonly OTabSize: "4";
    readonly tabSize: "4";
    readonly WebkitHyphens: "none";
    readonly MozHyphens: "none";
    readonly hyphens: "none";
    readonly padding: "1em";
    readonly margin: ".5em 0";
    readonly overflow: "auto";
    readonly borderRadius: "0.3em";
    readonly background: "#002b36";
  };
  readonly comment: {
    readonly color: "#586e75";
  };
  readonly prolog: {
    readonly color: "#586e75";
  };
  readonly doctype: {
    readonly color: "#586e75";
  };
  readonly cdata: {
    readonly color: "#586e75";
  };
  readonly punctuation: {
    readonly color: "#93a1a1";
  };
  readonly property: {
    readonly color: "#268bd2";
  };
  readonly keyword: {
    readonly color: "#268bd2";
  };
  readonly tag: {
    readonly color: "#268bd2";
  };
  readonly 'class-name': {
    readonly color: "#FFFFB6";
    readonly textDecoration: "underline";
  };
  readonly boolean: {
    readonly color: "#b58900";
  };
  readonly constant: {
    readonly color: "#b58900";
  };
  readonly symbol: {
    readonly color: "#dc322f";
  };
  readonly deleted: {
    readonly color: "#dc322f";
  };
  readonly number: {
    readonly color: "#859900";
  };
  readonly selector: {
    readonly color: "#859900";
  };
  readonly 'attr-name': {
    readonly color: "#859900";
  };
  readonly string: {
    readonly color: "#859900";
  };
  readonly char: {
    readonly color: "#859900";
  };
  readonly builtin: {
    readonly color: "#859900";
  };
  readonly inserted: {
    readonly color: "#859900";
  };
  readonly variable: {
    readonly color: "#268bd2";
  };
  readonly operator: {
    readonly color: "#EDEDED";
  };
  readonly function: {
    readonly color: "#268bd2";
  };
  readonly regex: {
    readonly color: "#E9C062";
  };
  readonly important: {
    readonly color: "#fd971f";
    readonly fontWeight: "bold";
  };
  readonly entity: {
    readonly color: "#FFFFB6";
    readonly cursor: "help";
  };
  readonly url: {
    readonly color: "#96CBFE";
  };
  readonly bold: {
    readonly fontWeight: "bold";
  };
  readonly italic: {
    readonly fontStyle: "italic";
  };
  readonly atrule: {
    readonly color: "#F9EE98";
  };
  readonly 'attr-value': {
    readonly color: "#F9EE98";
  };
};
declare const synthwave84: {
  readonly base: {
    readonly color: "#f92aad";
    readonly textShadow: "0 0 2px #100c0f, 0 0 5px #dc078e33, 0 0 10px #fff3";
    readonly background: "none";
    readonly fontFamily: "Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace";
    readonly fontSize: "1em";
    readonly textAlign: "left";
    readonly whiteSpace: "pre";
    readonly wordSpacing: "normal";
    readonly wordBreak: "normal";
    readonly wordWrap: "normal";
    readonly lineHeight: "1.5";
    readonly MozTabSize: "4";
    readonly OTabSize: "4";
    readonly tabSize: "4";
    readonly WebkitHyphens: "none";
    readonly MozHyphens: "none";
    readonly hyphens: "none";
    readonly padding: "1em";
    readonly margin: ".5em 0";
    readonly overflow: "auto";
    readonly backgroundColor: "transparent !important";
    readonly backgroundImage: "linear-gradient(to bottom, #2a2139 75%, #34294f)";
  };
  readonly comment: {
    readonly color: "#8e8e8e";
  };
  readonly 'block-comment': {
    readonly color: "#8e8e8e";
  };
  readonly prolog: {
    readonly color: "#8e8e8e";
  };
  readonly doctype: {
    readonly color: "#8e8e8e";
  };
  readonly cdata: {
    readonly color: "#8e8e8e";
  };
  readonly punctuation: {
    readonly color: "#ccc";
  };
  readonly tag: {
    readonly color: "#e2777a";
  };
  readonly 'attr-name': {
    readonly color: "#e2777a";
  };
  readonly namespace: {
    readonly color: "#e2777a";
  };
  readonly number: {
    readonly color: "#e2777a";
  };
  readonly unit: {
    readonly color: "#e2777a";
  };
  readonly hexcode: {
    readonly color: "#e2777a";
  };
  readonly deleted: {
    readonly color: "#e2777a";
  };
  readonly property: {
    readonly color: "#72f1b8";
    readonly textShadow: "0 0 2px #100c0f, 0 0 10px #257c5575, 0 0 35px #21272475";
  };
  readonly selector: {
    readonly color: "#72f1b8";
    readonly textShadow: "0 0 2px #100c0f, 0 0 10px #257c5575, 0 0 35px #21272475";
  };
  readonly 'function-name': {
    readonly color: "#6196cc";
  };
  readonly boolean: {
    readonly color: "#fdfdfd";
    readonly textShadow: "0 0 2px #001716, 0 0 3px #03edf975, 0 0 5px #03edf975, 0 0 8px #03edf975";
  };
  readonly 'selector .token.id': {
    readonly color: "#fdfdfd";
    readonly textShadow: "0 0 2px #001716, 0 0 3px #03edf975, 0 0 5px #03edf975, 0 0 8px #03edf975";
  };
  readonly function: {
    readonly color: "#fdfdfd";
    readonly textShadow: "0 0 2px #001716, 0 0 3px #03edf975, 0 0 5px #03edf975, 0 0 8px #03edf975";
  };
  readonly 'class-name': {
    readonly color: "#fff5f6";
    readonly textShadow: "0 0 2px #000, 0 0 10px #fc1f2c75, 0 0 5px #fc1f2c75, 0 0 25px #fc1f2c75";
  };
  readonly constant: {
    readonly color: "#f92aad";
    readonly textShadow: "0 0 2px #100c0f, 0 0 5px #dc078e33, 0 0 10px #fff3";
  };
  readonly symbol: {
    readonly color: "#f92aad";
    readonly textShadow: "0 0 2px #100c0f, 0 0 5px #dc078e33, 0 0 10px #fff3";
  };
  readonly important: {
    readonly color: "#f4eee4";
    readonly textShadow: "0 0 2px #393a33, 0 0 8px #f39f0575, 0 0 2px #f39f0575";
    readonly fontWeight: "bold";
  };
  readonly atrule: {
    readonly color: "#f4eee4";
    readonly textShadow: "0 0 2px #393a33, 0 0 8px #f39f0575, 0 0 2px #f39f0575";
  };
  readonly keyword: {
    readonly color: "#f4eee4";
    readonly textShadow: "0 0 2px #393a33, 0 0 8px #f39f0575, 0 0 2px #f39f0575";
  };
  readonly 'selector .token.class': {
    readonly color: "#f4eee4";
    readonly textShadow: "0 0 2px #393a33, 0 0 8px #f39f0575, 0 0 2px #f39f0575";
  };
  readonly builtin: {
    readonly color: "#f4eee4";
    readonly textShadow: "0 0 2px #393a33, 0 0 8px #f39f0575, 0 0 2px #f39f0575";
  };
  readonly string: {
    readonly color: "#f87c32";
  };
  readonly char: {
    readonly color: "#f87c32";
  };
  readonly 'attr-value': {
    readonly color: "#f87c32";
  };
  readonly regex: {
    readonly color: "#f87c32";
  };
  readonly variable: {
    readonly color: "#f87c32";
  };
  readonly operator: {
    readonly color: "#67cdcc";
  };
  readonly entity: {
    readonly color: "#67cdcc";
    readonly cursor: "help";
  };
  readonly url: {
    readonly color: "#67cdcc";
  };
  readonly bold: {
    readonly fontWeight: "bold";
  };
  readonly italic: {
    readonly fontStyle: "italic";
  };
  readonly inserted: {
    readonly color: "green";
  };
};
declare const materialOceanic: {
  readonly base: {
    readonly textAlign: "left";
    readonly whiteSpace: "pre";
    readonly wordSpacing: "normal";
    readonly wordBreak: "normal";
    readonly wordWrap: "normal";
    readonly color: "#c3cee3";
    readonly background: "#263238";
    readonly fontFamily: "Roboto Mono, monospace";
    readonly fontSize: "1em";
    readonly lineHeight: "1.5em";
    readonly MozTabSize: "4";
    readonly OTabSize: "4";
    readonly tabSize: "4";
    readonly WebkitHyphens: "none";
    readonly MozHyphens: "none";
    readonly hyphens: "none";
    readonly overflow: "auto";
    readonly position: "relative";
    readonly margin: "0.5em 0";
    readonly padding: "1.25em 1em";
  };
  readonly atrule: {
    readonly color: "#c792ea";
  };
  readonly 'attr-name': {
    readonly color: "#ffcb6b";
  };
  readonly 'attr-value': {
    readonly color: "#c3e88d";
  };
  readonly attribute: {
    readonly color: "#c3e88d";
  };
  readonly boolean: {
    readonly color: "#c792ea";
  };
  readonly builtin: {
    readonly color: "#ffcb6b";
  };
  readonly cdata: {
    readonly color: "#80cbc4";
  };
  readonly char: {
    readonly color: "#80cbc4";
  };
  readonly class: {
    readonly color: "#ffcb6b";
  };
  readonly 'class-name': {
    readonly color: "#f2ff00";
  };
  readonly color: {
    readonly color: "#f2ff00";
  };
  readonly comment: {
    readonly color: "#546e7a";
  };
  readonly constant: {
    readonly color: "#c792ea";
  };
  readonly deleted: {
    readonly color: "#f07178";
  };
  readonly doctype: {
    readonly color: "#546e7a";
  };
  readonly entity: {
    readonly color: "#f07178";
  };
  readonly function: {
    readonly color: "#c792ea";
  };
  readonly hexcode: {
    readonly color: "#f2ff00";
  };
  readonly id: {
    readonly color: "#c792ea";
    readonly fontWeight: "bold";
  };
  readonly important: {
    readonly color: "#c792ea";
    readonly fontWeight: "bold";
  };
  readonly inserted: {
    readonly color: "#80cbc4";
  };
  readonly keyword: {
    readonly color: "#c792ea";
    readonly fontStyle: "italic";
  };
  readonly number: {
    readonly color: "#fd9170";
  };
  readonly operator: {
    readonly color: "#89ddff";
  };
  readonly prolog: {
    readonly color: "#546e7a";
  };
  readonly property: {
    readonly color: "#80cbc4";
  };
  readonly 'pseudo-class': {
    readonly color: "#c3e88d";
  };
  readonly 'pseudo-element': {
    readonly color: "#c3e88d";
  };
  readonly punctuation: {
    readonly color: "#89ddff";
  };
  readonly regex: {
    readonly color: "#f2ff00";
  };
  readonly selector: {
    readonly color: "#f07178";
  };
  readonly string: {
    readonly color: "#c3e88d";
  };
  readonly symbol: {
    readonly color: "#c792ea";
  };
  readonly tag: {
    readonly color: "#f07178";
  };
  readonly unit: {
    readonly color: "#f07178";
  };
  readonly url: {
    readonly color: "#fd9170";
  };
  readonly variable: {
    readonly color: "#f07178";
  };
};
declare const duotoneSpace: {
  readonly base: {
    readonly fontFamily: "Consolas, Menlo, Monaco, \"Andale Mono WT\", \"Andale Mono\", \"Lucida Console\", \"Lucida Sans Typewriter\", \"DejaVu Sans Mono\", \"Bitstream Vera Sans Mono\", \"Liberation Mono\", \"Nimbus Mono L\", \"Courier New\", Courier, monospace";
    readonly fontSize: "14px";
    readonly lineHeight: "1.375";
    readonly direction: "ltr";
    readonly textAlign: "left";
    readonly whiteSpace: "pre";
    readonly wordSpacing: "normal";
    readonly wordBreak: "normal";
    readonly MozTabSize: "4";
    readonly OTabSize: "4";
    readonly tabSize: "4";
    readonly WebkitHyphens: "none";
    readonly MozHyphens: "none";
    readonly hyphens: "none";
    readonly background: "#24242e";
    readonly color: "#767693";
    readonly padding: "1em";
    readonly margin: ".5em 0";
    readonly overflow: "auto";
  };
  readonly comment: {
    readonly color: "#5b5b76";
  };
  readonly prolog: {
    readonly color: "#5b5b76";
  };
  readonly doctype: {
    readonly color: "#5b5b76";
  };
  readonly cdata: {
    readonly color: "#5b5b76";
  };
  readonly punctuation: {
    readonly color: "#5b5b76";
  };
  readonly namespace: {
    readonly opacity: ".7";
  };
  readonly tag: {
    readonly color: "#dd672c";
  };
  readonly operator: {
    readonly color: "#dd672c";
  };
  readonly number: {
    readonly color: "#dd672c";
  };
  readonly property: {
    readonly color: "#767693";
  };
  readonly function: {
    readonly color: "#767693";
  };
  readonly 'tag-id': {
    readonly color: "#ebebff";
  };
  readonly selector: {
    readonly color: "#ebebff";
  };
  readonly 'atrule-id': {
    readonly color: "#ebebff";
  };
  readonly 'attr-name': {
    readonly color: "#aaaaca";
  };
  readonly boolean: {
    readonly color: "#fe8c52";
  };
  readonly string: {
    readonly color: "#fe8c52";
  };
  readonly entity: {
    readonly color: "#fe8c52";
    readonly cursor: "help";
  };
  readonly url: {
    readonly color: "#fe8c52";
  };
  readonly 'attr-value': {
    readonly color: "#fe8c52";
  };
  readonly keyword: {
    readonly color: "#fe8c52";
  };
  readonly control: {
    readonly color: "#fe8c52";
  };
  readonly directive: {
    readonly color: "#fe8c52";
  };
  readonly unit: {
    readonly color: "#fe8c52";
  };
  readonly statement: {
    readonly color: "#fe8c52";
  };
  readonly regex: {
    readonly color: "#fe8c52";
  };
  readonly atrule: {
    readonly color: "#fe8c52";
  };
  readonly placeholder: {
    readonly color: "#fe8c52";
  };
  readonly variable: {
    readonly color: "#fe8c52";
  };
  readonly deleted: {
    readonly textDecoration: "line-through";
  };
  readonly inserted: {
    readonly borderBottom: "1px dotted #ebebff";
    readonly textDecoration: "none";
  };
  readonly italic: {
    readonly fontStyle: "italic";
  };
  readonly important: {
    readonly fontWeight: "bold";
    readonly color: "#aaaaca";
  };
  readonly bold: {
    readonly fontWeight: "bold";
  };
};
declare const materialLight: {
  readonly base: {
    readonly textAlign: "left";
    readonly whiteSpace: "pre";
    readonly wordSpacing: "normal";
    readonly wordBreak: "normal";
    readonly wordWrap: "normal";
    readonly color: "#90a4ae";
    readonly background: "#fafafa";
    readonly fontFamily: "Roboto Mono, monospace";
    readonly fontSize: "1em";
    readonly lineHeight: "1.5em";
    readonly MozTabSize: "4";
    readonly OTabSize: "4";
    readonly tabSize: "4";
    readonly WebkitHyphens: "none";
    readonly MozHyphens: "none";
    readonly hyphens: "none";
    readonly overflow: "auto";
    readonly position: "relative";
    readonly margin: "0.5em 0";
    readonly padding: "1.25em 1em";
  };
  readonly atrule: {
    readonly color: "#7c4dff";
  };
  readonly 'attr-name': {
    readonly color: "#39adb5";
  };
  readonly 'attr-value': {
    readonly color: "#f6a434";
  };
  readonly attribute: {
    readonly color: "#f6a434";
  };
  readonly boolean: {
    readonly color: "#7c4dff";
  };
  readonly builtin: {
    readonly color: "#39adb5";
  };
  readonly cdata: {
    readonly color: "#39adb5";
  };
  readonly char: {
    readonly color: "#39adb5";
  };
  readonly class: {
    readonly color: "#39adb5";
  };
  readonly 'class-name': {
    readonly color: "#6182b8";
  };
  readonly comment: {
    readonly color: "#aabfc9";
  };
  readonly constant: {
    readonly color: "#7c4dff";
  };
  readonly deleted: {
    readonly color: "#e53935";
  };
  readonly doctype: {
    readonly color: "#aabfc9";
  };
  readonly entity: {
    readonly color: "#e53935";
  };
  readonly function: {
    readonly color: "#7c4dff";
  };
  readonly hexcode: {
    readonly color: "#f76d47";
  };
  readonly id: {
    readonly color: "#7c4dff";
    readonly fontWeight: "bold";
  };
  readonly important: {
    readonly color: "#7c4dff";
    readonly fontWeight: "bold";
  };
  readonly inserted: {
    readonly color: "#39adb5";
  };
  readonly keyword: {
    readonly color: "#7c4dff";
  };
  readonly number: {
    readonly color: "#f76d47";
  };
  readonly operator: {
    readonly color: "#39adb5";
  };
  readonly prolog: {
    readonly color: "#aabfc9";
  };
  readonly property: {
    readonly color: "#39adb5";
  };
  readonly 'pseudo-class': {
    readonly color: "#f6a434";
  };
  readonly 'pseudo-element': {
    readonly color: "#f6a434";
  };
  readonly punctuation: {
    readonly color: "#39adb5";
  };
  readonly regex: {
    readonly color: "#6182b8";
  };
  readonly selector: {
    readonly color: "#e53935";
  };
  readonly string: {
    readonly color: "#f6a434";
  };
  readonly symbol: {
    readonly color: "#7c4dff";
  };
  readonly tag: {
    readonly color: "#e53935";
  };
  readonly unit: {
    readonly color: "#f76d47";
  };
  readonly url: {
    readonly color: "#e53935";
  };
  readonly variable: {
    readonly color: "#e53935";
  };
};
declare const duotoneSea: {
  readonly base: {
    readonly fontFamily: "Consolas, Menlo, Monaco, \"Andale Mono WT\", \"Andale Mono\", \"Lucida Console\", \"Lucida Sans Typewriter\", \"DejaVu Sans Mono\", \"Bitstream Vera Sans Mono\", \"Liberation Mono\", \"Nimbus Mono L\", \"Courier New\", Courier, monospace";
    readonly fontSize: "14px";
    readonly lineHeight: "1.375";
    readonly direction: "ltr";
    readonly textAlign: "left";
    readonly whiteSpace: "pre";
    readonly wordSpacing: "normal";
    readonly wordBreak: "normal";
    readonly MozTabSize: "4";
    readonly OTabSize: "4";
    readonly tabSize: "4";
    readonly WebkitHyphens: "none";
    readonly MozHyphens: "none";
    readonly hyphens: "none";
    readonly background: "#1d262f";
    readonly color: "#57718e";
    readonly padding: "1em";
    readonly margin: ".5em 0";
    readonly overflow: "auto";
  };
  readonly comment: {
    readonly color: "#4a5f78";
  };
  readonly prolog: {
    readonly color: "#4a5f78";
  };
  readonly doctype: {
    readonly color: "#4a5f78";
  };
  readonly cdata: {
    readonly color: "#4a5f78";
  };
  readonly punctuation: {
    readonly color: "#4a5f78";
  };
  readonly namespace: {
    readonly opacity: ".7";
  };
  readonly tag: {
    readonly color: "#0aa370";
  };
  readonly operator: {
    readonly color: "#0aa370";
  };
  readonly number: {
    readonly color: "#0aa370";
  };
  readonly property: {
    readonly color: "#57718e";
  };
  readonly function: {
    readonly color: "#57718e";
  };
  readonly 'tag-id': {
    readonly color: "#ebf4ff";
  };
  readonly selector: {
    readonly color: "#ebf4ff";
  };
  readonly 'atrule-id': {
    readonly color: "#ebf4ff";
  };
  readonly 'attr-name': {
    readonly color: "#7eb6f6";
  };
  readonly boolean: {
    readonly color: "#47ebb4";
  };
  readonly string: {
    readonly color: "#47ebb4";
  };
  readonly entity: {
    readonly color: "#47ebb4";
    readonly cursor: "help";
  };
  readonly url: {
    readonly color: "#47ebb4";
  };
  readonly 'attr-value': {
    readonly color: "#47ebb4";
  };
  readonly keyword: {
    readonly color: "#47ebb4";
  };
  readonly control: {
    readonly color: "#47ebb4";
  };
  readonly directive: {
    readonly color: "#47ebb4";
  };
  readonly unit: {
    readonly color: "#47ebb4";
  };
  readonly statement: {
    readonly color: "#47ebb4";
  };
  readonly regex: {
    readonly color: "#47ebb4";
  };
  readonly atrule: {
    readonly color: "#47ebb4";
  };
  readonly placeholder: {
    readonly color: "#47ebb4";
  };
  readonly variable: {
    readonly color: "#47ebb4";
  };
  readonly deleted: {
    readonly textDecoration: "line-through";
  };
  readonly inserted: {
    readonly borderBottom: "1px dotted #ebf4ff";
    readonly textDecoration: "none";
  };
  readonly italic: {
    readonly fontStyle: "italic";
  };
  readonly important: {
    readonly fontWeight: "bold";
    readonly color: "#7eb6f6";
  };
  readonly bold: {
    readonly fontWeight: "bold";
  };
};
declare const a11yDark: {
  readonly base: {
    readonly color: "#f8f8f2";
    readonly background: "#2b2b2b";
    readonly fontFamily: "Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace";
    readonly textAlign: "left";
    readonly whiteSpace: "pre";
    readonly wordSpacing: "normal";
    readonly wordBreak: "normal";
    readonly wordWrap: "normal";
    readonly lineHeight: "1.5";
    readonly MozTabSize: "4";
    readonly OTabSize: "4";
    readonly tabSize: "4";
    readonly WebkitHyphens: "none";
    readonly MozHyphens: "none";
    readonly hyphens: "none";
    readonly padding: "1em";
    readonly margin: "0.5em 0";
    readonly overflow: "auto";
    readonly borderRadius: "0.3em";
  };
  readonly comment: {
    readonly color: "#d4d0ab";
  };
  readonly prolog: {
    readonly color: "#d4d0ab";
  };
  readonly doctype: {
    readonly color: "#d4d0ab";
  };
  readonly cdata: {
    readonly color: "#d4d0ab";
  };
  readonly punctuation: {
    readonly color: "#fefefe";
  };
  readonly property: {
    readonly color: "#ffa07a";
  };
  readonly tag: {
    readonly color: "#ffa07a";
  };
  readonly constant: {
    readonly color: "#ffa07a";
  };
  readonly symbol: {
    readonly color: "#ffa07a";
  };
  readonly deleted: {
    readonly color: "#ffa07a";
  };
  readonly boolean: {
    readonly color: "#00e0e0";
  };
  readonly number: {
    readonly color: "#00e0e0";
  };
  readonly selector: {
    readonly color: "#abe338";
  };
  readonly 'attr-name': {
    readonly color: "#abe338";
  };
  readonly string: {
    readonly color: "#abe338";
  };
  readonly char: {
    readonly color: "#abe338";
  };
  readonly builtin: {
    readonly color: "#abe338";
  };
  readonly inserted: {
    readonly color: "#abe338";
  };
  readonly operator: {
    readonly color: "#00e0e0";
  };
  readonly entity: {
    readonly color: "#00e0e0";
    readonly cursor: "help";
  };
  readonly url: {
    readonly color: "#00e0e0";
  };
  readonly variable: {
    readonly color: "#00e0e0";
  };
  readonly atrule: {
    readonly color: "#ffd700";
  };
  readonly 'attr-value': {
    readonly color: "#ffd700";
  };
  readonly function: {
    readonly color: "#ffd700";
  };
  readonly keyword: {
    readonly color: "#00e0e0";
  };
  readonly regex: {
    readonly color: "#ffd700";
  };
  readonly important: {
    readonly color: "#ffd700";
    readonly fontWeight: "bold";
  };
  readonly bold: {
    readonly fontWeight: "bold";
  };
  readonly italic: {
    readonly fontStyle: "italic";
  };
};
declare const darcula: {
  readonly base: {
    readonly color: "#a9b7c6";
    readonly fontFamily: "Consolas, Monaco, 'Andale Mono', monospace";
    readonly direction: "ltr";
    readonly textAlign: "left";
    readonly whiteSpace: "pre";
    readonly wordSpacing: "normal";
    readonly wordBreak: "normal";
    readonly lineHeight: "1.5";
    readonly MozTabSize: "4";
    readonly OTabSize: "4";
    readonly tabSize: "4";
    readonly WebkitHyphens: "none";
    readonly MozHyphens: "none";
    readonly hyphens: "none";
    readonly padding: "1em";
    readonly margin: ".5em 0";
    readonly overflow: "auto";
    readonly background: "#2b2b2b";
  };
  readonly comment: {
    readonly color: "#808080";
  };
  readonly prolog: {
    readonly color: "#808080";
  };
  readonly cdata: {
    readonly color: "#808080";
  };
  readonly delimiter: {
    readonly color: "#cc7832";
  };
  readonly boolean: {
    readonly color: "#cc7832";
  };
  readonly keyword: {
    readonly color: "#cc7832";
  };
  readonly selector: {
    readonly color: "#cc7832";
  };
  readonly important: {
    readonly color: "#cc7832";
  };
  readonly atrule: {
    readonly color: "#cc7832";
  };
  readonly operator: {
    readonly color: "#a9b7c6";
  };
  readonly punctuation: {
    readonly color: "#a9b7c6";
  };
  readonly 'attr-name': {
    readonly color: "#a9b7c6";
  };
  readonly tag: {
    readonly color: "#e8bf6a";
  };
  readonly 'tag .punctuation': {
    readonly color: "#e8bf6a";
  };
  readonly doctype: {
    readonly color: "#e8bf6a";
  };
  readonly builtin: {
    readonly color: "#e8bf6a";
  };
  readonly entity: {
    readonly color: "#6897bb";
  };
  readonly number: {
    readonly color: "#6897bb";
  };
  readonly symbol: {
    readonly color: "#6897bb";
  };
  readonly property: {
    readonly color: "#9876aa";
  };
  readonly constant: {
    readonly color: "#9876aa";
  };
  readonly variable: {
    readonly color: "#9876aa";
  };
  readonly string: {
    readonly color: "#6a8759";
  };
  readonly char: {
    readonly color: "#6a8759";
  };
  readonly 'attr-value': {
    readonly color: "#a5c261";
  };
  readonly 'attr-value .punctuation': {
    readonly color: "#a5c261";
  };
  readonly 'attr-value .punctuation:first-child': {
    readonly color: "#a9b7c6";
  };
  readonly url: {
    readonly color: "#287bde";
    readonly textDecoration: "underline";
  };
  readonly function: {
    readonly color: "#ffc66d";
  };
  readonly regex: {
    readonly background: "#364135";
  };
  readonly bold: {
    readonly fontWeight: "bold";
  };
  readonly italic: {
    readonly fontStyle: "italic";
  };
  readonly inserted: {
    readonly background: "#294436";
  };
  readonly deleted: {
    readonly background: "#484a4a";
  };
};
declare const zTouch: {
  readonly base: {
    readonly color: "white";
    readonly fontFamily: "monospace";
    readonly textAlign: "left";
    readonly whiteSpace: "pre";
    readonly wordSpacing: "normal";
    readonly wordBreak: "normal";
    readonly wordWrap: "normal";
    readonly MozTabSize: "4";
    readonly OTabSize: "4";
    readonly tabSize: "4";
    readonly WebkitHyphens: "none";
    readonly MozHyphens: "none";
    readonly hyphens: "none";
    readonly lineHeight: "25px";
    readonly fontSize: "18px";
    readonly margin: "0.5em 0";
    readonly background: "#0a143c";
    readonly padding: "1em";
    readonly overflow: "auto";
  };
  readonly comment: {
    readonly color: "rgb(99, 119, 119)";
    readonly fontStyle: "italic";
  };
  readonly prolog: {
    readonly color: "rgb(99, 119, 119)";
    readonly fontStyle: "italic";
  };
  readonly cdata: {
    readonly color: "rgb(99, 119, 119)";
    readonly fontStyle: "italic";
  };
  readonly punctuation: {
    readonly color: "rgb(199, 146, 234)";
  };
  readonly deleted: {
    readonly color: "rgba(239, 83, 80, 0.56)";
    readonly fontStyle: "italic";
  };
  readonly symbol: {
    readonly color: "rgb(128, 203, 196)";
  };
  readonly property: {
    readonly color: "rgb(128, 203, 196)";
  };
  readonly tag: {
    readonly color: "rgb(127, 219, 202)";
  };
  readonly operator: {
    readonly color: "rgb(127, 219, 202)";
  };
  readonly keyword: {
    readonly color: "rgb(127, 219, 202)";
  };
  readonly boolean: {
    readonly color: "rgb(255, 88, 116)";
  };
  readonly number: {
    readonly color: "rgb(247, 140, 108)";
  };
  readonly constant: {
    readonly color: "rgb(34 183 199)";
  };
  readonly function: {
    readonly color: "rgb(34 183 199)";
  };
  readonly builtin: {
    readonly color: "rgb(34 183 199)";
  };
  readonly char: {
    readonly color: "rgb(34 183 199)";
  };
  readonly selector: {
    readonly color: "rgb(199, 146, 234)";
    readonly fontStyle: "italic";
  };
  readonly doctype: {
    readonly color: "rgb(199, 146, 234)";
    readonly fontStyle: "italic";
  };
  readonly 'attr-name': {
    readonly color: "rgb(173, 219, 103)";
    readonly fontStyle: "italic";
  };
  readonly inserted: {
    readonly color: "rgb(173, 219, 103)";
    readonly fontStyle: "italic";
  };
  readonly string: {
    readonly color: "rgb(173, 219, 103)";
  };
  readonly url: {
    readonly color: "rgb(173, 219, 103)";
  };
  readonly entity: {
    readonly color: "rgb(173, 219, 103)";
  };
  readonly 'class-name': {
    readonly color: "rgb(255, 203, 139)";
  };
  readonly atrule: {
    readonly color: "rgb(255, 203, 139)";
  };
  readonly 'attr-value': {
    readonly color: "rgb(255, 203, 139)";
  };
  readonly regex: {
    readonly color: "rgb(214, 222, 235)";
  };
  readonly important: {
    readonly color: "rgb(214, 222, 235)";
    readonly fontWeight: "bold";
  };
  readonly variable: {
    readonly color: "rgb(214, 222, 235)";
  };
  readonly bold: {
    readonly fontWeight: "bold";
  };
  readonly italic: {
    readonly fontStyle: "italic";
  };
};
declare const duotoneEarth: {
  readonly base: {
    readonly fontFamily: "Consolas, Menlo, Monaco, \"Andale Mono WT\", \"Andale Mono\", \"Lucida Console\", \"Lucida Sans Typewriter\", \"DejaVu Sans Mono\", \"Bitstream Vera Sans Mono\", \"Liberation Mono\", \"Nimbus Mono L\", \"Courier New\", Courier, monospace";
    readonly fontSize: "14px";
    readonly lineHeight: "1.375";
    readonly direction: "ltr";
    readonly textAlign: "left";
    readonly whiteSpace: "pre";
    readonly wordSpacing: "normal";
    readonly wordBreak: "normal";
    readonly MozTabSize: "4";
    readonly OTabSize: "4";
    readonly tabSize: "4";
    readonly WebkitHyphens: "none";
    readonly MozHyphens: "none";
    readonly hyphens: "none";
    readonly background: "#322d29";
    readonly color: "#88786d";
    readonly padding: "1em";
    readonly margin: ".5em 0";
    readonly overflow: "auto";
  };
  readonly comment: {
    readonly color: "#6a5f58";
  };
  readonly prolog: {
    readonly color: "#6a5f58";
  };
  readonly doctype: {
    readonly color: "#6a5f58";
  };
  readonly cdata: {
    readonly color: "#6a5f58";
  };
  readonly punctuation: {
    readonly color: "#6a5f58";
  };
  readonly namespace: {
    readonly opacity: ".7";
  };
  readonly tag: {
    readonly color: "#bfa05a";
  };
  readonly operator: {
    readonly color: "#bfa05a";
  };
  readonly number: {
    readonly color: "#bfa05a";
  };
  readonly property: {
    readonly color: "#88786d";
  };
  readonly function: {
    readonly color: "#88786d";
  };
  readonly 'tag-id': {
    readonly color: "#fff3eb";
  };
  readonly selector: {
    readonly color: "#fff3eb";
  };
  readonly 'atrule-id': {
    readonly color: "#fff3eb";
  };
  readonly 'attr-name': {
    readonly color: "#a48774";
  };
  readonly boolean: {
    readonly color: "#fcc440";
  };
  readonly string: {
    readonly color: "#fcc440";
  };
  readonly entity: {
    readonly color: "#fcc440";
    readonly cursor: "help";
  };
  readonly url: {
    readonly color: "#fcc440";
  };
  readonly 'attr-value': {
    readonly color: "#fcc440";
  };
  readonly keyword: {
    readonly color: "#fcc440";
  };
  readonly control: {
    readonly color: "#fcc440";
  };
  readonly directive: {
    readonly color: "#fcc440";
  };
  readonly unit: {
    readonly color: "#fcc440";
  };
  readonly statement: {
    readonly color: "#fcc440";
  };
  readonly regex: {
    readonly color: "#fcc440";
  };
  readonly atrule: {
    readonly color: "#fcc440";
  };
  readonly placeholder: {
    readonly color: "#fcc440";
  };
  readonly variable: {
    readonly color: "#fcc440";
  };
  readonly deleted: {
    readonly textDecoration: "line-through";
  };
  readonly inserted: {
    readonly borderBottom: "1px dotted #fff3eb";
    readonly textDecoration: "none";
  };
  readonly italic: {
    readonly fontStyle: "italic";
  };
  readonly important: {
    readonly fontWeight: "bold";
    readonly color: "#a48774";
  };
  readonly bold: {
    readonly fontWeight: "bold";
  };
};
declare const gruvboxLight: {
  readonly base: {
    readonly color: "#3c3836";
    readonly fontFamily: "Consolas, Monaco, \"Andale Mono\", monospace";
    readonly direction: "ltr";
    readonly textAlign: "left";
    readonly whiteSpace: "pre";
    readonly wordSpacing: "normal";
    readonly wordBreak: "normal";
    readonly lineHeight: "1.5";
    readonly MozTabSize: "4";
    readonly OTabSize: "4";
    readonly tabSize: "4";
    readonly WebkitHyphens: "none";
    readonly MozHyphens: "none";
    readonly hyphens: "none";
    readonly padding: "1em";
    readonly margin: "0.5em 0";
    readonly overflow: "auto";
    readonly background: "#f9f5d7";
  };
  readonly comment: {
    readonly color: "#7c6f64";
  };
  readonly prolog: {
    readonly color: "#7c6f64";
  };
  readonly cdata: {
    readonly color: "#7c6f64";
  };
  readonly delimiter: {
    readonly color: "#9d0006";
  };
  readonly boolean: {
    readonly color: "#9d0006";
  };
  readonly keyword: {
    readonly color: "#9d0006";
  };
  readonly selector: {
    readonly color: "#9d0006";
  };
  readonly important: {
    readonly color: "#9d0006";
  };
  readonly atrule: {
    readonly color: "#9d0006";
  };
  readonly operator: {
    readonly color: "#7c6f64";
  };
  readonly punctuation: {
    readonly color: "#7c6f64";
  };
  readonly 'attr-name': {
    readonly color: "#7c6f64";
  };
  readonly tag: {
    readonly color: "#b57614";
  };
  readonly 'tag .punctuation': {
    readonly color: "#b57614";
  };
  readonly doctype: {
    readonly color: "#b57614";
  };
  readonly builtin: {
    readonly color: "#b57614";
  };
  readonly entity: {
    readonly color: "#8f3f71";
  };
  readonly number: {
    readonly color: "#8f3f71";
  };
  readonly symbol: {
    readonly color: "#8f3f71";
  };
  readonly property: {
    readonly color: "#9d0006";
  };
  readonly constant: {
    readonly color: "#9d0006";
  };
  readonly variable: {
    readonly color: "#9d0006";
  };
  readonly string: {
    readonly color: "#797403";
  };
  readonly char: {
    readonly color: "#797403";
  };
  readonly 'attr-value': {
    readonly color: "#7c6f64";
  };
  readonly 'attr-value .punctuation': {
    readonly color: "#7c6f64";
  };
  readonly url: {
    readonly color: "#797403";
    readonly textDecoration: "underline";
  };
  readonly function: {
    readonly color: "#b57614";
  };
  readonly regex: {
    readonly background: "#797403";
  };
  readonly bold: {
    readonly fontWeight: "bold";
  };
  readonly italic: {
    readonly fontStyle: "italic";
  };
  readonly inserted: {
    readonly background: "#7c6f64";
  };
  readonly deleted: {
    readonly background: "#9d0006";
  };
};
declare const oneDark: {
  readonly base: {
    readonly background: "hsl(220, 13%, 18%)";
    readonly color: "hsl(220, 14%, 71%)";
    readonly textShadow: "0 1px rgba(0, 0, 0, 0.3)";
    readonly fontFamily: "\"Fira Code\", \"Fira Mono\", Menlo, Consolas, \"DejaVu Sans Mono\", monospace";
    readonly direction: "ltr";
    readonly textAlign: "left";
    readonly whiteSpace: "pre";
    readonly wordSpacing: "normal";
    readonly wordBreak: "normal";
    readonly lineHeight: "1.5";
    readonly MozTabSize: "2";
    readonly OTabSize: "2";
    readonly tabSize: "2";
    readonly WebkitHyphens: "none";
    readonly MozHyphens: "none";
    readonly hyphens: "none";
    readonly padding: "1em";
    readonly margin: "0.5em 0";
    readonly overflow: "auto";
    readonly borderRadius: "0.3em";
  };
  readonly comment: {
    readonly color: "hsl(220, 10%, 40%)";
    readonly fontStyle: "italic";
  };
  readonly prolog: {
    readonly color: "hsl(220, 10%, 40%)";
  };
  readonly cdata: {
    readonly color: "hsl(220, 10%, 40%)";
  };
  readonly doctype: {
    readonly color: "hsl(220, 14%, 71%)";
  };
  readonly punctuation: {
    readonly color: "hsl(220, 14%, 71%)";
  };
  readonly entity: {
    readonly color: "hsl(220, 14%, 71%)";
    readonly cursor: "help";
  };
  readonly 'attr-name': {
    readonly color: "hsl(29, 54%, 61%)";
  };
  readonly 'class-name': {
    readonly color: "hsl(29, 54%, 61%)";
  };
  readonly boolean: {
    readonly color: "hsl(29, 54%, 61%)";
  };
  readonly constant: {
    readonly color: "hsl(29, 54%, 61%)";
  };
  readonly number: {
    readonly color: "hsl(29, 54%, 61%)";
  };
  readonly atrule: {
    readonly color: "hsl(29, 54%, 61%)";
  };
  readonly keyword: {
    readonly color: "hsl(286, 60%, 67%)";
  };
  readonly property: {
    readonly color: "hsl(355, 65%, 65%)";
  };
  readonly tag: {
    readonly color: "hsl(355, 65%, 65%)";
  };
  readonly symbol: {
    readonly color: "hsl(355, 65%, 65%)";
  };
  readonly deleted: {
    readonly color: "hsl(355, 65%, 65%)";
  };
  readonly important: {
    readonly color: "hsl(355, 65%, 65%)";
  };
  readonly selector: {
    readonly color: "hsl(95, 38%, 62%)";
  };
  readonly string: {
    readonly color: "hsl(95, 38%, 62%)";
  };
  readonly char: {
    readonly color: "hsl(95, 38%, 62%)";
  };
  readonly builtin: {
    readonly color: "hsl(95, 38%, 62%)";
  };
  readonly inserted: {
    readonly color: "hsl(95, 38%, 62%)";
  };
  readonly regex: {
    readonly color: "hsl(95, 38%, 62%)";
  };
  readonly 'attr-value': {
    readonly color: "hsl(95, 38%, 62%)";
  };
  readonly 'attr-value > .token.punctuation': {
    readonly color: "hsl(95, 38%, 62%)";
  };
  readonly variable: {
    readonly color: "hsl(207, 82%, 66%)";
  };
  readonly operator: {
    readonly color: "hsl(207, 82%, 66%)";
  };
  readonly function: {
    readonly color: "hsl(207, 82%, 66%)";
  };
  readonly url: {
    readonly color: "hsl(187, 47%, 55%)";
  };
  readonly 'attr-value > .token.punctuation.attr-equals': {
    readonly color: "hsl(220, 14%, 71%)";
  };
  readonly 'special-attr > .token.attr-value > .token.value.css': {
    readonly color: "hsl(220, 14%, 71%)";
  };
  readonly bold: {
    readonly fontWeight: "bold";
  };
  readonly italic: {
    readonly fontStyle: "italic";
  };
  readonly namespace: {
    readonly opacity: "0.8";
  };
  readonly 'token.tab:not(:empty):before': {
    readonly color: "hsla(220, 14%, 71%, 0.15)";
    readonly textShadow: "none";
  };
  readonly 'token.cr:before': {
    readonly color: "hsla(220, 14%, 71%, 0.15)";
    readonly textShadow: "none";
  };
  readonly 'token.lf:before': {
    readonly color: "hsla(220, 14%, 71%, 0.15)";
    readonly textShadow: "none";
  };
  readonly 'token.space:before': {
    readonly color: "hsla(220, 14%, 71%, 0.15)";
    readonly textShadow: "none";
  };
};
declare const duotoneDark: {
  readonly base: {
    readonly fontFamily: "Consolas, Menlo, Monaco, \"Andale Mono WT\", \"Andale Mono\", \"Lucida Console\", \"Lucida Sans Typewriter\", \"DejaVu Sans Mono\", \"Bitstream Vera Sans Mono\", \"Liberation Mono\", \"Nimbus Mono L\", \"Courier New\", Courier, monospace";
    readonly fontSize: "14px";
    readonly lineHeight: "1.375";
    readonly direction: "ltr";
    readonly textAlign: "left";
    readonly whiteSpace: "pre";
    readonly wordSpacing: "normal";
    readonly wordBreak: "normal";
    readonly MozTabSize: "4";
    readonly OTabSize: "4";
    readonly tabSize: "4";
    readonly WebkitHyphens: "none";
    readonly MozHyphens: "none";
    readonly hyphens: "none";
    readonly background: "#2a2734";
    readonly color: "#9a86fd";
    readonly padding: "1em";
    readonly margin: ".5em 0";
    readonly overflow: "auto";
  };
  readonly comment: {
    readonly color: "#6c6783";
  };
  readonly prolog: {
    readonly color: "#6c6783";
  };
  readonly doctype: {
    readonly color: "#6c6783";
  };
  readonly cdata: {
    readonly color: "#6c6783";
  };
  readonly punctuation: {
    readonly color: "#6c6783";
  };
  readonly namespace: {
    readonly opacity: ".7";
  };
  readonly tag: {
    readonly color: "#e09142";
  };
  readonly operator: {
    readonly color: "#e09142";
  };
  readonly number: {
    readonly color: "#e09142";
  };
  readonly property: {
    readonly color: "#9a86fd";
  };
  readonly function: {
    readonly color: "#9a86fd";
  };
  readonly 'tag-id': {
    readonly color: "#eeebff";
  };
  readonly selector: {
    readonly color: "#eeebff";
  };
  readonly 'atrule-id': {
    readonly color: "#eeebff";
  };
  readonly 'attr-name': {
    readonly color: "#c4b9fe";
  };
  readonly boolean: {
    readonly color: "#ffcc99";
  };
  readonly string: {
    readonly color: "#ffcc99";
  };
  readonly entity: {
    readonly color: "#ffcc99";
    readonly cursor: "help";
  };
  readonly url: {
    readonly color: "#ffcc99";
  };
  readonly 'attr-value': {
    readonly color: "#ffcc99";
  };
  readonly keyword: {
    readonly color: "#ffcc99";
  };
  readonly control: {
    readonly color: "#ffcc99";
  };
  readonly directive: {
    readonly color: "#ffcc99";
  };
  readonly unit: {
    readonly color: "#ffcc99";
  };
  readonly statement: {
    readonly color: "#ffcc99";
  };
  readonly regex: {
    readonly color: "#ffcc99";
  };
  readonly atrule: {
    readonly color: "#ffcc99";
  };
  readonly placeholder: {
    readonly color: "#ffcc99";
  };
  readonly variable: {
    readonly color: "#ffcc99";
  };
  readonly deleted: {
    readonly textDecoration: "line-through";
  };
  readonly inserted: {
    readonly borderBottom: "1px dotted #eeebff";
    readonly textDecoration: "none";
  };
  readonly italic: {
    readonly fontStyle: "italic";
  };
  readonly important: {
    readonly fontWeight: "bold";
    readonly color: "#c4b9fe";
  };
  readonly bold: {
    readonly fontWeight: "bold";
  };
};
declare const lucario: {
  readonly base: {
    readonly color: "#f8f8f2";
    readonly background: "#263E52";
    readonly textShadow: "0 1px rgba(0, 0, 0, 0.3)";
    readonly fontFamily: "Monaco, Consolas, 'Andale Mono', 'Ubuntu Mono', monospace";
    readonly textAlign: "left";
    readonly whiteSpace: "pre";
    readonly wordSpacing: "normal";
    readonly wordBreak: "normal";
    readonly wordWrap: "normal";
    readonly lineHeight: "1.5";
    readonly MozTabSize: "4";
    readonly OTabSize: "4";
    readonly tabSize: "4";
    readonly WebkitHyphens: "none";
    readonly MozHyphens: "none";
    readonly hyphens: "none";
    readonly padding: "1em";
    readonly margin: ".5em 0";
    readonly overflow: "auto";
    readonly borderRadius: "0.3em";
  };
  readonly comment: {
    readonly color: "#5c98cd";
  };
  readonly prolog: {
    readonly color: "#5c98cd";
  };
  readonly doctype: {
    readonly color: "#5c98cd";
  };
  readonly cdata: {
    readonly color: "#5c98cd";
  };
  readonly punctuation: {
    readonly color: "#f8f8f2";
  };
  readonly property: {
    readonly color: "#F05E5D";
  };
  readonly tag: {
    readonly color: "#F05E5D";
  };
  readonly constant: {
    readonly color: "#F05E5D";
  };
  readonly symbol: {
    readonly color: "#F05E5D";
  };
  readonly deleted: {
    readonly color: "#F05E5D";
  };
  readonly boolean: {
    readonly color: "#BC94F9";
  };
  readonly number: {
    readonly color: "#BC94F9";
  };
  readonly selector: {
    readonly color: "#FCFCD6";
  };
  readonly 'attr-name': {
    readonly color: "#FCFCD6";
  };
  readonly string: {
    readonly color: "#FCFCD6";
  };
  readonly char: {
    readonly color: "#FCFCD6";
  };
  readonly builtin: {
    readonly color: "#FCFCD6";
  };
  readonly inserted: {
    readonly color: "#FCFCD6";
  };
  readonly operator: {
    readonly color: "#f8f8f2";
  };
  readonly entity: {
    readonly color: "#f8f8f2";
    readonly cursor: "help";
  };
  readonly url: {
    readonly color: "#f8f8f2";
  };
  readonly variable: {
    readonly color: "#f8f8f2";
  };
  readonly atrule: {
    readonly color: "#66D8EF";
  };
  readonly 'attr-value': {
    readonly color: "#66D8EF";
  };
  readonly function: {
    readonly color: "#66D8EF";
  };
  readonly 'class-name': {
    readonly color: "#66D8EF";
  };
  readonly keyword: {
    readonly color: "#6EB26E";
  };
  readonly regex: {
    readonly color: "#F05E5D";
  };
  readonly important: {
    readonly color: "#F05E5D";
    readonly fontWeight: "bold";
  };
  readonly bold: {
    readonly fontWeight: "bold";
  };
  readonly italic: {
    readonly fontStyle: "italic";
  };
};
declare const coldarkDark: {
  readonly base: {
    readonly color: "#e3eaf2";
    readonly background: "#111b27";
    readonly fontFamily: "Consolas, Monaco, \"Andale Mono\", \"Ubuntu Mono\", monospace";
    readonly textAlign: "left";
    readonly whiteSpace: "pre";
    readonly wordSpacing: "normal";
    readonly wordBreak: "normal";
    readonly wordWrap: "normal";
    readonly lineHeight: "1.5";
    readonly MozTabSize: "4";
    readonly OTabSize: "4";
    readonly tabSize: "4";
    readonly WebkitHyphens: "none";
    readonly MozHyphens: "none";
    readonly hyphens: "none";
    readonly padding: "1em";
    readonly margin: "0.5em 0";
    readonly overflow: "auto";
  };
  readonly comment: {
    readonly color: "#8da1b9";
  };
  readonly prolog: {
    readonly color: "#8da1b9";
  };
  readonly doctype: {
    readonly color: "#8da1b9";
  };
  readonly cdata: {
    readonly color: "#8da1b9";
  };
  readonly punctuation: {
    readonly color: "#e3eaf2";
  };
  readonly 'delimiter.important': {
    readonly color: "#66cccc";
    readonly fontWeight: "inherit";
  };
  readonly 'selector .parent': {
    readonly color: "#66cccc";
  };
  readonly tag: {
    readonly color: "#66cccc";
  };
  readonly 'tag .token.punctuation': {
    readonly color: "#66cccc";
  };
  readonly 'attr-name': {
    readonly color: "#e6d37a";
  };
  readonly boolean: {
    readonly color: "#e6d37a";
  };
  readonly 'boolean.important': {
    readonly color: "#e6d37a";
  };
  readonly number: {
    readonly color: "#e6d37a";
  };
  readonly constant: {
    readonly color: "#e6d37a";
  };
  readonly 'selector .token.attribute': {
    readonly color: "#e6d37a";
  };
  readonly 'class-name': {
    readonly color: "#6cb8e6";
  };
  readonly key: {
    readonly color: "#6cb8e6";
  };
  readonly parameter: {
    readonly color: "#6cb8e6";
  };
  readonly property: {
    readonly color: "#6cb8e6";
  };
  readonly 'property-access': {
    readonly color: "#6cb8e6";
  };
  readonly variable: {
    readonly color: "#6cb8e6";
  };
  readonly 'attr-value': {
    readonly color: "#91d076";
  };
  readonly inserted: {
    readonly color: "#91d076";
  };
  readonly color: {
    readonly color: "#91d076";
  };
  readonly 'selector .token.value': {
    readonly color: "#91d076";
  };
  readonly string: {
    readonly color: "#91d076";
  };
  readonly 'string .token.url-link': {
    readonly color: "#91d076";
  };
  readonly builtin: {
    readonly color: "#f4adf4";
  };
  readonly 'keyword-array': {
    readonly color: "#f4adf4";
  };
  readonly package: {
    readonly color: "#f4adf4";
  };
  readonly regex: {
    readonly color: "#f4adf4";
  };
  readonly function: {
    readonly color: "#c699e3";
  };
  readonly 'selector .token.class': {
    readonly color: "#c699e3";
  };
  readonly 'selector .token.id': {
    readonly color: "#c699e3";
  };
  readonly 'atrule .token.rule': {
    readonly color: "#e9ae7e";
  };
  readonly combinator: {
    readonly color: "#e9ae7e";
  };
  readonly keyword: {
    readonly color: "#e9ae7e";
  };
  readonly operator: {
    readonly color: "#e9ae7e";
  };
  readonly 'pseudo-class': {
    readonly color: "#e9ae7e";
  };
  readonly 'pseudo-element': {
    readonly color: "#e9ae7e";
  };
  readonly selector: {
    readonly color: "#e9ae7e";
  };
  readonly unit: {
    readonly color: "#e9ae7e";
  };
  readonly deleted: {
    readonly color: "#cd6660";
  };
  readonly important: {
    readonly color: "#cd6660";
    readonly fontWeight: "bold";
  };
  readonly 'keyword-this': {
    readonly color: "#6cb8e6";
    readonly fontWeight: "bold";
  };
  readonly this: {
    readonly color: "#6cb8e6";
    readonly fontWeight: "bold";
  };
  readonly bold: {
    readonly fontWeight: "bold";
  };
  readonly italic: {
    readonly fontStyle: "italic";
  };
  readonly entity: {
    readonly cursor: "help";
  };
  readonly 'token.tab:not(:empty):before': {
    readonly color: "#8da1b9";
  };
  readonly 'token.cr:before': {
    readonly color: "#8da1b9";
  };
  readonly 'token.lf:before': {
    readonly color: "#8da1b9";
  };
  readonly 'token.space:before': {
    readonly color: "#8da1b9";
  };
};
declare const atomDark: {
  readonly base: {
    readonly color: "#c5c8c6";
    readonly textShadow: "0 1px rgba(0, 0, 0, 0.3)";
    readonly fontFamily: "Inconsolata, Monaco, Consolas, 'Courier New', Courier, monospace";
    readonly direction: "ltr";
    readonly textAlign: "left";
    readonly whiteSpace: "pre";
    readonly wordSpacing: "normal";
    readonly wordBreak: "normal";
    readonly lineHeight: "1.5";
    readonly MozTabSize: "4";
    readonly OTabSize: "4";
    readonly tabSize: "4";
    readonly WebkitHyphens: "none";
    readonly MozHyphens: "none";
    readonly hyphens: "none";
    readonly padding: "1em";
    readonly margin: ".5em 0";
    readonly overflow: "auto";
    readonly borderRadius: "0.3em";
    readonly background: "#1d1f21";
  };
  readonly comment: {
    readonly color: "#7C7C7C";
  };
  readonly prolog: {
    readonly color: "#7C7C7C";
  };
  readonly doctype: {
    readonly color: "#7C7C7C";
  };
  readonly cdata: {
    readonly color: "#7C7C7C";
  };
  readonly punctuation: {
    readonly color: "#c5c8c6";
  };
  readonly property: {
    readonly color: "#96CBFE";
  };
  readonly keyword: {
    readonly color: "#96CBFE";
  };
  readonly tag: {
    readonly color: "#96CBFE";
  };
  readonly 'class-name': {
    readonly color: "#FFFFB6";
    readonly textDecoration: "underline";
  };
  readonly boolean: {
    readonly color: "#99CC99";
  };
  readonly constant: {
    readonly color: "#99CC99";
  };
  readonly symbol: {
    readonly color: "#f92672";
  };
  readonly deleted: {
    readonly color: "#f92672";
  };
  readonly number: {
    readonly color: "#FF73FD";
  };
  readonly selector: {
    readonly color: "#A8FF60";
  };
  readonly 'attr-name': {
    readonly color: "#A8FF60";
  };
  readonly string: {
    readonly color: "#A8FF60";
  };
  readonly char: {
    readonly color: "#A8FF60";
  };
  readonly builtin: {
    readonly color: "#A8FF60";
  };
  readonly inserted: {
    readonly color: "#A8FF60";
  };
  readonly variable: {
    readonly color: "#C6C5FE";
  };
  readonly operator: {
    readonly color: "#EDEDED";
  };
  readonly entity: {
    readonly color: "#FFFFB6";
    readonly cursor: "help";
  };
  readonly url: {
    readonly color: "#96CBFE";
  };
  readonly atrule: {
    readonly color: "#F9EE98";
  };
  readonly 'attr-value': {
    readonly color: "#F9EE98";
  };
  readonly function: {
    readonly color: "#DAD085";
  };
  readonly regex: {
    readonly color: "#E9C062";
  };
  readonly important: {
    readonly color: "#fd971f";
    readonly fontWeight: "bold";
  };
  readonly bold: {
    readonly fontWeight: "bold";
  };
  readonly italic: {
    readonly fontStyle: "italic";
  };
};
declare const pojoaque: {
  readonly base: {
    readonly MozTabSize: "4";
    readonly OTabSize: "4";
    readonly tabSize: "4";
    readonly WebkitHyphens: "none";
    readonly MozHyphens: "none";
    readonly hyphens: "none";
    readonly whiteSpace: "pre-wrap";
    readonly wordBreak: "break-all";
    readonly wordWrap: "break-word";
    readonly fontFamily: "Menlo, Monaco, \"Courier New\", monospace";
    readonly fontSize: "15px";
    readonly lineHeight: "1.5";
    readonly color: "#DCCF8F";
    readonly textShadow: "0";
    readonly borderRadius: "5px";
    readonly border: "1px solid #000";
    readonly background: "#181914 url('data:image/jpeg;base64,/9j/4AAQSkZJRgABAgAAZABkAAD/7AARRHVja3kAAQAEAAAAMAAA/+4ADkFkb2JlAGTAAAAAAf/bAIQACQYGBgcGCQcHCQ0IBwgNDwsJCQsPEQ4ODw4OERENDg4ODg0RERQUFhQUERoaHBwaGiYmJiYmKysrKysrKysrKwEJCAgJCgkMCgoMDwwODA8TDg4ODhMVDg4PDg4VGhMRERERExoXGhYWFhoXHR0aGh0dJCQjJCQrKysrKysrKysr/8AAEQgAjACMAwEiAAIRAQMRAf/EAF4AAQEBAAAAAAAAAAAAAAAAAAABBwEBAQAAAAAAAAAAAAAAAAAAAAIQAAEDAwIHAQEAAAAAAAAAAADwAREhYaExkUFRcYGxwdHh8REBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AyGFEjHaBS2fDDs2zkhKmBKktb7km+ZwwCnXPkLVmCTMItj6AXFxRS465/BTnkAJvkLkJe+7AKKoi2AtRS2zuAWsCb5GOlBN8gKfmuGHZ8MFqIth3ALmFoFwbwKWyAlTAp17uKqBvgBD8sM4fTjhvAhkzhaRkBMKBrfs7jGPIpzy7gFrAqnC0C0gB0EWwBDW2cBVQwm+QtPpa3wBO3sVvszCnLAhkzgL5/RLf13cLQd8/AGlu0Cb5HTx9KuAEieGJEdcehS3eRTp2ATdt3CpIm+QtZwAhROXFeb7swp/ahaM3kBE/jSIUBc/AWrgBN8uNFAl+b7sAXFxFn2YLUU5Ns7gFX8C4ib+hN8gFWXwK3bZglxEJm+gKdciLPsFV/TClsgJUwKJ5FVA7tvIFrfZhVfGJDcsCKaYgAqv6YRbE+RWOWBtu7+AL3yRalXLyKqAIIfk+zARbDgFyEsncYwJvlgFRW+GEWntIi2P0BooyFxcNr8Ep3+ANLbMO+QyhvbiqdgC0kVvgUUiLYgBS2QtPbiVI1/sgOmG9uO+Y8DW+7jS2zAOnj6O2BndwuIAUtkdRN8gFoK3wwXMQyZwHVbClsuNLd4E3yAUR6FVDBR+BafQGt93LVMxJTv8ABts4CVLhcfYWsCb5kC9/BHdU8CLYFY5bMAd+eX9MGthhpbA1vu4B7+RKkaW2Yq4AQtVBBFsAJU/AuIXBhN8gGWnstefhiZyWvLAEnbYS1uzSFP6Jvn4Baxx70JKkQojLib5AVTey1jjgkKJGO0AKWyOm7N7cSpgSpAdPH0Tfd/gp1z5C1ZgKqN9J2wFxcUUuAFLZAm+QC0Fb4YUVRFsAOvj4KW2dwtYE3yAWk/wS/PLMKfmuGHZ8MAXF/Ja32Yi5haAKWz4Ydm2cSpgU693Atb7km+Zwwh+WGcPpxw3gAkzCLY+iYUDW/Z3Adc/gpzyFrAqnALkJe+7DoItgAtRS2zuKqGE3yAx0oJvkdvYrfZmALURbDuL5/RLf13cAuDeBS2RpbtAm+QFVA3wR+3fUtFHoBDJnC0jIXH0HWsgMY8inPLuOkd9chp4z20ALQLSA8cI9jYAIa2zjzjBd8gRafS1vgiUho/kAKcsCGTOGWvoOpkAtB3z8Hm8x2Ff5ADp4+lXAlIvcmwH/2Q==') repeat left top";
    readonly padding: "12px";
    readonly overflow: "auto";
  };
  readonly namespace: {
    readonly opacity: ".7";
  };
  readonly comment: {
    readonly color: "#586e75";
    readonly fontStyle: "italic";
  };
  readonly prolog: {
    readonly color: "#586e75";
    readonly fontStyle: "italic";
  };
  readonly doctype: {
    readonly color: "#586e75";
    readonly fontStyle: "italic";
  };
  readonly cdata: {
    readonly color: "#586e75";
    readonly fontStyle: "italic";
  };
  readonly number: {
    readonly color: "#b89859";
  };
  readonly string: {
    readonly color: "#468966";
  };
  readonly char: {
    readonly color: "#468966";
  };
  readonly builtin: {
    readonly color: "#468966";
  };
  readonly inserted: {
    readonly color: "#468966";
  };
  readonly 'attr-name': {
    readonly color: "#b89859";
  };
  readonly operator: {
    readonly color: "#dccf8f";
  };
  readonly entity: {
    readonly color: "#dccf8f";
    readonly cursor: "help";
  };
  readonly url: {
    readonly color: "#dccf8f";
  };
  readonly selector: {
    readonly color: "#859900";
  };
  readonly regex: {
    readonly color: "#859900";
  };
  readonly atrule: {
    readonly color: "#cb4b16";
  };
  readonly keyword: {
    readonly color: "#cb4b16";
  };
  readonly 'attr-value': {
    readonly color: "#468966";
  };
  readonly function: {
    readonly color: "#b58900";
  };
  readonly variable: {
    readonly color: "#b58900";
  };
  readonly placeholder: {
    readonly color: "#b58900";
  };
  readonly property: {
    readonly color: "#b89859";
  };
  readonly tag: {
    readonly color: "#ffb03b";
  };
  readonly boolean: {
    readonly color: "#b89859";
  };
  readonly constant: {
    readonly color: "#b89859";
  };
  readonly symbol: {
    readonly color: "#b89859";
  };
  readonly important: {
    readonly color: "#dc322f";
  };
  readonly statement: {
    readonly color: "#dc322f";
  };
  readonly deleted: {
    readonly color: "#dc322f";
  };
  readonly punctuation: {
    readonly color: "#dccf8f";
  };
  readonly bold: {
    readonly fontWeight: "bold";
  };
  readonly italic: {
    readonly fontStyle: "italic";
  };
};
declare const duotoneLight: {
  readonly base: {
    readonly fontFamily: "Consolas, Menlo, Monaco, \"Andale Mono WT\", \"Andale Mono\", \"Lucida Console\", \"Lucida Sans Typewriter\", \"DejaVu Sans Mono\", \"Bitstream Vera Sans Mono\", \"Liberation Mono\", \"Nimbus Mono L\", \"Courier New\", Courier, monospace";
    readonly fontSize: "14px";
    readonly lineHeight: "1.375";
    readonly direction: "ltr";
    readonly textAlign: "left";
    readonly whiteSpace: "pre";
    readonly wordSpacing: "normal";
    readonly wordBreak: "normal";
    readonly MozTabSize: "4";
    readonly OTabSize: "4";
    readonly tabSize: "4";
    readonly WebkitHyphens: "none";
    readonly MozHyphens: "none";
    readonly hyphens: "none";
    readonly background: "#faf8f5";
    readonly color: "#728fcb";
    readonly padding: "1em";
    readonly margin: ".5em 0";
    readonly overflow: "auto";
  };
  readonly comment: {
    readonly color: "#b6ad9a";
  };
  readonly prolog: {
    readonly color: "#b6ad9a";
  };
  readonly doctype: {
    readonly color: "#b6ad9a";
  };
  readonly cdata: {
    readonly color: "#b6ad9a";
  };
  readonly punctuation: {
    readonly color: "#b6ad9a";
  };
  readonly namespace: {
    readonly opacity: ".7";
  };
  readonly tag: {
    readonly color: "#063289";
  };
  readonly operator: {
    readonly color: "#063289";
  };
  readonly number: {
    readonly color: "#063289";
  };
  readonly property: {
    readonly color: "#b29762";
  };
  readonly function: {
    readonly color: "#b29762";
  };
  readonly 'tag-id': {
    readonly color: "#2d2006";
  };
  readonly selector: {
    readonly color: "#2d2006";
  };
  readonly 'atrule-id': {
    readonly color: "#2d2006";
  };
  readonly 'attr-name': {
    readonly color: "#896724";
  };
  readonly boolean: {
    readonly color: "#728fcb";
  };
  readonly string: {
    readonly color: "#728fcb";
  };
  readonly entity: {
    readonly color: "#728fcb";
    readonly cursor: "help";
  };
  readonly url: {
    readonly color: "#728fcb";
  };
  readonly 'attr-value': {
    readonly color: "#728fcb";
  };
  readonly keyword: {
    readonly color: "#728fcb";
  };
  readonly control: {
    readonly color: "#728fcb";
  };
  readonly directive: {
    readonly color: "#728fcb";
  };
  readonly unit: {
    readonly color: "#728fcb";
  };
  readonly statement: {
    readonly color: "#728fcb";
  };
  readonly regex: {
    readonly color: "#728fcb";
  };
  readonly atrule: {
    readonly color: "#728fcb";
  };
  readonly placeholder: {
    readonly color: "#93abdc";
  };
  readonly variable: {
    readonly color: "#93abdc";
  };
  readonly deleted: {
    readonly textDecoration: "line-through";
  };
  readonly inserted: {
    readonly borderBottom: "1px dotted #2d2006";
    readonly textDecoration: "none";
  };
  readonly italic: {
    readonly fontStyle: "italic";
  };
  readonly important: {
    readonly fontWeight: "bold";
    readonly color: "#896724";
  };
  readonly bold: {
    readonly fontWeight: "bold";
  };
};
declare const nightOwl: {
  readonly base: {
    readonly color: "white";
    readonly fontFamily: "Consolas, Monaco, \"Andale Mono\", \"Ubuntu Mono\", monospace";
    readonly textAlign: "left";
    readonly whiteSpace: "pre";
    readonly wordSpacing: "normal";
    readonly wordBreak: "normal";
    readonly wordWrap: "normal";
    readonly lineHeight: "1.5";
    readonly fontSize: "1em";
    readonly MozTabSize: "4";
    readonly OTabSize: "4";
    readonly tabSize: "4";
    readonly WebkitHyphens: "none";
    readonly MozHyphens: "none";
    readonly hyphens: "none";
    readonly padding: "1em";
    readonly margin: "0.5em 0";
    readonly overflow: "auto";
    readonly background: "#011627";
  };
  readonly comment: {
    readonly color: "rgb(99, 119, 119)";
    readonly fontStyle: "italic";
  };
  readonly prolog: {
    readonly color: "rgb(99, 119, 119)";
    readonly fontStyle: "italic";
  };
  readonly cdata: {
    readonly color: "rgb(99, 119, 119)";
    readonly fontStyle: "italic";
  };
  readonly punctuation: {
    readonly color: "rgb(199, 146, 234)";
  };
  readonly deleted: {
    readonly color: "rgba(239, 83, 80, 0.56)";
    readonly fontStyle: "italic";
  };
  readonly symbol: {
    readonly color: "rgb(128, 203, 196)";
  };
  readonly property: {
    readonly color: "rgb(128, 203, 196)";
  };
  readonly tag: {
    readonly color: "rgb(127, 219, 202)";
  };
  readonly operator: {
    readonly color: "rgb(127, 219, 202)";
  };
  readonly keyword: {
    readonly color: "rgb(127, 219, 202)";
  };
  readonly boolean: {
    readonly color: "rgb(255, 88, 116)";
  };
  readonly number: {
    readonly color: "rgb(247, 140, 108)";
  };
  readonly constant: {
    readonly color: "rgb(130, 170, 255)";
  };
  readonly function: {
    readonly color: "rgb(130, 170, 255)";
  };
  readonly builtin: {
    readonly color: "rgb(130, 170, 255)";
  };
  readonly char: {
    readonly color: "rgb(130, 170, 255)";
  };
  readonly selector: {
    readonly color: "rgb(199, 146, 234)";
    readonly fontStyle: "italic";
  };
  readonly doctype: {
    readonly color: "rgb(199, 146, 234)";
    readonly fontStyle: "italic";
  };
  readonly 'attr-name': {
    readonly color: "rgb(173, 219, 103)";
    readonly fontStyle: "italic";
  };
  readonly inserted: {
    readonly color: "rgb(173, 219, 103)";
    readonly fontStyle: "italic";
  };
  readonly string: {
    readonly color: "rgb(173, 219, 103)";
  };
  readonly url: {
    readonly color: "rgb(173, 219, 103)";
  };
  readonly entity: {
    readonly color: "rgb(173, 219, 103)";
  };
  readonly 'class-name': {
    readonly color: "rgb(255, 203, 139)";
  };
  readonly atrule: {
    readonly color: "rgb(255, 203, 139)";
  };
  readonly 'attr-value': {
    readonly color: "rgb(255, 203, 139)";
  };
  readonly regex: {
    readonly color: "rgb(214, 222, 235)";
  };
  readonly important: {
    readonly color: "rgb(214, 222, 235)";
    readonly fontWeight: "bold";
  };
  readonly variable: {
    readonly color: "rgb(214, 222, 235)";
  };
  readonly bold: {
    readonly fontWeight: "bold";
  };
  readonly italic: {
    readonly fontStyle: "italic";
  };
};
declare const laserwave: {
  readonly base: {
    readonly background: "#27212e";
    readonly color: "#ffffff";
    readonly fontFamily: "Consolas, Monaco, \"Andale Mono\", \"Ubuntu Mono\", monospace";
    readonly fontSize: "1em";
    readonly direction: "ltr";
    readonly textAlign: "left";
    readonly whiteSpace: "pre";
    readonly wordSpacing: "normal";
    readonly wordBreak: "normal";
    readonly lineHeight: "1.5";
    readonly MozTabSize: "2";
    readonly OTabSize: "2";
    readonly tabSize: "2";
    readonly WebkitHyphens: "none";
    readonly MozHyphens: "none";
    readonly hyphens: "none";
    readonly padding: "1em";
    readonly margin: "0.5em 0";
    readonly overflow: "auto";
    readonly borderRadius: "0.5em";
  };
  readonly comment: {
    readonly color: "#91889b";
  };
  readonly prolog: {
    readonly color: "#91889b";
  };
  readonly cdata: {
    readonly color: "#91889b";
  };
  readonly punctuation: {
    readonly color: "#7b6995";
  };
  readonly builtin: {
    readonly color: "#ffe261";
  };
  readonly constant: {
    readonly color: "#ffe261";
  };
  readonly boolean: {
    readonly color: "#ffe261";
  };
  readonly number: {
    readonly color: "#b381c5";
  };
  readonly important: {
    readonly color: "#40b4c4";
  };
  readonly atrule: {
    readonly color: "#40b4c4";
  };
  readonly property: {
    readonly color: "#40b4c4";
  };
  readonly keyword: {
    readonly color: "#40b4c4";
  };
  readonly doctype: {
    readonly color: "#74dfc4";
  };
  readonly operator: {
    readonly color: "#74dfc4";
  };
  readonly inserted: {
    readonly color: "#74dfc4";
  };
  readonly tag: {
    readonly color: "#74dfc4";
  };
  readonly 'class-name': {
    readonly color: "#74dfc4";
  };
  readonly symbol: {
    readonly color: "#74dfc4";
  };
  readonly 'attr-name': {
    readonly color: "#eb64b9";
  };
  readonly function: {
    readonly color: "#eb64b9";
  };
  readonly deleted: {
    readonly color: "#eb64b9";
  };
  readonly selector: {
    readonly color: "#eb64b9";
  };
  readonly 'attr-value': {
    readonly color: "#b4dce7";
  };
  readonly regex: {
    readonly color: "#b4dce7";
  };
  readonly char: {
    readonly color: "#b4dce7";
  };
  readonly string: {
    readonly color: "#b4dce7";
  };
  readonly entity: {
    readonly color: "#ffffff";
    readonly cursor: "help";
  };
  readonly url: {
    readonly color: "#ffffff";
  };
  readonly variable: {
    readonly color: "#ffffff";
  };
  readonly bold: {
    readonly fontWeight: "bold";
  };
  readonly italic: {
    readonly fontStyle: "italic";
  };
  readonly namespace: {
    readonly opacity: "0.7";
  };
};
declare const coyWithoutShadows: {
  readonly base: {
    readonly color: "black";
    readonly background: "none";
    readonly fontFamily: "Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace";
    readonly fontSize: "1em";
    readonly textAlign: "left";
    readonly whiteSpace: "pre";
    readonly wordSpacing: "normal";
    readonly wordBreak: "normal";
    readonly wordWrap: "normal";
    readonly lineHeight: "1.5";
    readonly MozTabSize: "4";
    readonly OTabSize: "4";
    readonly tabSize: "4";
    readonly WebkitHyphens: "none";
    readonly MozHyphens: "none";
    readonly hyphens: "none";
    readonly position: "relative";
    readonly borderLeft: "10px solid #358ccb";
    readonly boxShadow: "-1px 0 0 0 #358ccb, 0 0 0 1px #dfdfdf";
    readonly backgroundColor: "#fdfdfd";
    readonly backgroundImage: "linear-gradient(transparent 50%, rgba(69, 142, 209, 0.04) 50%)";
    readonly backgroundSize: "3em 3em";
    readonly backgroundOrigin: "content-box";
    readonly backgroundAttachment: "local";
    readonly margin: ".5em 0";
    readonly padding: "0 1em";
  };
  readonly comment: {
    readonly color: "#7D8B99";
  };
  readonly 'block-comment': {
    readonly color: "#7D8B99";
  };
  readonly prolog: {
    readonly color: "#7D8B99";
  };
  readonly doctype: {
    readonly color: "#7D8B99";
  };
  readonly cdata: {
    readonly color: "#7D8B99";
  };
  readonly punctuation: {
    readonly color: "#5F6364";
  };
  readonly property: {
    readonly color: "#c92c2c";
  };
  readonly tag: {
    readonly color: "#c92c2c";
  };
  readonly boolean: {
    readonly color: "#c92c2c";
  };
  readonly number: {
    readonly color: "#c92c2c";
  };
  readonly 'function-name': {
    readonly color: "#c92c2c";
  };
  readonly constant: {
    readonly color: "#c92c2c";
  };
  readonly symbol: {
    readonly color: "#c92c2c";
  };
  readonly deleted: {
    readonly color: "#c92c2c";
  };
  readonly selector: {
    readonly color: "#2f9c0a";
  };
  readonly 'attr-name': {
    readonly color: "#2f9c0a";
  };
  readonly string: {
    readonly color: "#2f9c0a";
  };
  readonly char: {
    readonly color: "#2f9c0a";
  };
  readonly function: {
    readonly color: "#2f9c0a";
  };
  readonly builtin: {
    readonly color: "#2f9c0a";
  };
  readonly inserted: {
    readonly color: "#2f9c0a";
  };
  readonly operator: {
    readonly color: "#a67f59";
    readonly background: "rgba(255, 255, 255, 0.5)";
  };
  readonly entity: {
    readonly color: "#a67f59";
    readonly background: "rgba(255, 255, 255, 0.5)";
    readonly cursor: "help";
  };
  readonly url: {
    readonly color: "#a67f59";
    readonly background: "rgba(255, 255, 255, 0.5)";
  };
  readonly variable: {
    readonly color: "#a67f59";
    readonly background: "rgba(255, 255, 255, 0.5)";
  };
  readonly atrule: {
    readonly color: "#1990b8";
  };
  readonly 'attr-value': {
    readonly color: "#1990b8";
  };
  readonly keyword: {
    readonly color: "#1990b8";
  };
  readonly 'class-name': {
    readonly color: "#1990b8";
  };
  readonly regex: {
    readonly color: "#e90";
  };
  readonly important: {
    readonly color: "#e90";
    readonly fontWeight: "normal";
  };
  readonly bold: {
    readonly fontWeight: "bold";
  };
  readonly italic: {
    readonly fontStyle: "italic";
  };
  readonly namespace: {
    readonly opacity: ".7";
  };
};
declare const hopscotch: {
  readonly base: {
    readonly fontFamily: "\"Fira Mono\", Menlo, Monaco, \"Lucida Console\", \"Courier New\", Courier, monospace";
    readonly fontSize: "16px";
    readonly lineHeight: "1.375";
    readonly direction: "ltr";
    readonly textAlign: "left";
    readonly wordSpacing: "normal";
    readonly MozTabSize: "4";
    readonly OTabSize: "4";
    readonly tabSize: "4";
    readonly WebkitHyphens: "none";
    readonly MozHyphens: "none";
    readonly hyphens: "none";
    readonly whiteSpace: "pre-wrap";
    readonly wordBreak: "break-all";
    readonly wordWrap: "break-word";
    readonly background: "#322931";
    readonly color: "#b9b5b8";
    readonly padding: "1em";
    readonly margin: ".5em 0";
    readonly overflow: "auto";
  };
  readonly comment: {
    readonly color: "#797379";
  };
  readonly prolog: {
    readonly color: "#797379";
  };
  readonly doctype: {
    readonly color: "#797379";
  };
  readonly cdata: {
    readonly color: "#797379";
  };
  readonly punctuation: {
    readonly color: "#b9b5b8";
  };
  readonly null: {
    readonly color: "#fd8b19";
  };
  readonly operator: {
    readonly color: "#fd8b19";
  };
  readonly boolean: {
    readonly color: "#fd8b19";
  };
  readonly number: {
    readonly color: "#fd8b19";
  };
  readonly property: {
    readonly color: "#fdcc59";
  };
  readonly tag: {
    readonly color: "#1290bf";
  };
  readonly string: {
    readonly color: "#149b93";
  };
  readonly selector: {
    readonly color: "#c85e7c";
  };
  readonly 'attr-name': {
    readonly color: "#fd8b19";
  };
  readonly entity: {
    readonly color: "#149b93";
    readonly cursor: "help";
  };
  readonly url: {
    readonly color: "#149b93";
  };
  readonly 'attr-value': {
    readonly color: "#8fc13e";
  };
  readonly keyword: {
    readonly color: "#8fc13e";
  };
  readonly control: {
    readonly color: "#8fc13e";
  };
  readonly directive: {
    readonly color: "#8fc13e";
  };
  readonly unit: {
    readonly color: "#8fc13e";
  };
  readonly statement: {
    readonly color: "#149b93";
  };
  readonly regex: {
    readonly color: "#149b93";
  };
  readonly atrule: {
    readonly color: "#149b93";
  };
  readonly placeholder: {
    readonly color: "#1290bf";
  };
  readonly variable: {
    readonly color: "#1290bf";
  };
  readonly important: {
    readonly color: "#dd464c";
    readonly fontWeight: "bold";
  };
};
declare const oneLight: {
  readonly base: {
    readonly background: "hsl(230, 1%, 98%)";
    readonly color: "hsl(230, 8%, 24%)";
    readonly fontFamily: "\"Fira Code\", \"Fira Mono\", Menlo, Consolas, \"DejaVu Sans Mono\", monospace";
    readonly direction: "ltr";
    readonly textAlign: "left";
    readonly whiteSpace: "pre";
    readonly wordSpacing: "normal";
    readonly wordBreak: "normal";
    readonly lineHeight: "1.5";
    readonly MozTabSize: "2";
    readonly OTabSize: "2";
    readonly tabSize: "2";
    readonly WebkitHyphens: "none";
    readonly MozHyphens: "none";
    readonly hyphens: "none";
    readonly padding: "1em";
    readonly margin: "0.5em 0";
    readonly overflow: "auto";
    readonly borderRadius: "0.3em";
  };
  readonly comment: {
    readonly color: "hsl(230, 4%, 64%)";
    readonly fontStyle: "italic";
  };
  readonly prolog: {
    readonly color: "hsl(230, 4%, 64%)";
  };
  readonly cdata: {
    readonly color: "hsl(230, 4%, 64%)";
  };
  readonly doctype: {
    readonly color: "hsl(230, 8%, 24%)";
  };
  readonly punctuation: {
    readonly color: "hsl(230, 8%, 24%)";
  };
  readonly entity: {
    readonly color: "hsl(230, 8%, 24%)";
    readonly cursor: "help";
  };
  readonly 'attr-name': {
    readonly color: "hsl(35, 99%, 36%)";
  };
  readonly 'class-name': {
    readonly color: "hsl(35, 99%, 36%)";
  };
  readonly boolean: {
    readonly color: "hsl(35, 99%, 36%)";
  };
  readonly constant: {
    readonly color: "hsl(35, 99%, 36%)";
  };
  readonly number: {
    readonly color: "hsl(35, 99%, 36%)";
  };
  readonly atrule: {
    readonly color: "hsl(35, 99%, 36%)";
  };
  readonly keyword: {
    readonly color: "hsl(301, 63%, 40%)";
  };
  readonly property: {
    readonly color: "hsl(5, 74%, 59%)";
  };
  readonly tag: {
    readonly color: "hsl(5, 74%, 59%)";
  };
  readonly symbol: {
    readonly color: "hsl(5, 74%, 59%)";
  };
  readonly deleted: {
    readonly color: "hsl(5, 74%, 59%)";
  };
  readonly important: {
    readonly color: "hsl(5, 74%, 59%)";
  };
  readonly selector: {
    readonly color: "hsl(119, 34%, 47%)";
  };
  readonly string: {
    readonly color: "hsl(119, 34%, 47%)";
  };
  readonly char: {
    readonly color: "hsl(119, 34%, 47%)";
  };
  readonly builtin: {
    readonly color: "hsl(119, 34%, 47%)";
  };
  readonly inserted: {
    readonly color: "hsl(119, 34%, 47%)";
  };
  readonly regex: {
    readonly color: "hsl(119, 34%, 47%)";
  };
  readonly 'attr-value': {
    readonly color: "hsl(119, 34%, 47%)";
  };
  readonly 'attr-value > .token.punctuation': {
    readonly color: "hsl(119, 34%, 47%)";
  };
  readonly variable: {
    readonly color: "hsl(221, 87%, 60%)";
  };
  readonly operator: {
    readonly color: "hsl(221, 87%, 60%)";
  };
  readonly function: {
    readonly color: "hsl(221, 87%, 60%)";
  };
  readonly url: {
    readonly color: "hsl(198, 99%, 37%)";
  };
  readonly 'attr-value > .token.punctuation.attr-equals': {
    readonly color: "hsl(230, 8%, 24%)";
  };
  readonly 'special-attr > .token.attr-value > .token.value.css': {
    readonly color: "hsl(230, 8%, 24%)";
  };
  readonly bold: {
    readonly fontWeight: "bold";
  };
  readonly italic: {
    readonly fontStyle: "italic";
  };
  readonly namespace: {
    readonly opacity: "0.8";
  };
  readonly 'token.tab:not(:empty):before': {
    readonly color: "hsla(230, 8%, 24%, 0.2)";
  };
  readonly 'token.cr:before': {
    readonly color: "hsla(230, 8%, 24%, 0.2)";
  };
  readonly 'token.lf:before': {
    readonly color: "hsla(230, 8%, 24%, 0.2)";
  };
  readonly 'token.space:before': {
    readonly color: "hsla(230, 8%, 24%, 0.2)";
  };
};
declare const nord: {
  readonly base: {
    readonly color: "#f8f8f2";
    readonly background: "#2E3440";
    readonly fontFamily: "\"Fira Code\", Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace";
    readonly textAlign: "left";
    readonly whiteSpace: "pre";
    readonly wordSpacing: "normal";
    readonly wordBreak: "normal";
    readonly wordWrap: "normal";
    readonly lineHeight: "1.5";
    readonly MozTabSize: "4";
    readonly OTabSize: "4";
    readonly tabSize: "4";
    readonly WebkitHyphens: "none";
    readonly MozHyphens: "none";
    readonly hyphens: "none";
    readonly padding: "1em";
    readonly margin: ".5em 0";
    readonly overflow: "auto";
    readonly borderRadius: "0.3em";
  };
  readonly comment: {
    readonly color: "#636f88";
  };
  readonly prolog: {
    readonly color: "#636f88";
  };
  readonly doctype: {
    readonly color: "#636f88";
  };
  readonly cdata: {
    readonly color: "#636f88";
  };
  readonly punctuation: {
    readonly color: "#81A1C1";
  };
  readonly property: {
    readonly color: "#81A1C1";
  };
  readonly tag: {
    readonly color: "#81A1C1";
  };
  readonly constant: {
    readonly color: "#81A1C1";
  };
  readonly symbol: {
    readonly color: "#81A1C1";
  };
  readonly deleted: {
    readonly color: "#81A1C1";
  };
  readonly number: {
    readonly color: "#B48EAD";
  };
  readonly boolean: {
    readonly color: "#81A1C1";
  };
  readonly selector: {
    readonly color: "#A3BE8C";
  };
  readonly 'attr-name': {
    readonly color: "#A3BE8C";
  };
  readonly string: {
    readonly color: "#A3BE8C";
  };
  readonly char: {
    readonly color: "#A3BE8C";
  };
  readonly builtin: {
    readonly color: "#A3BE8C";
  };
  readonly inserted: {
    readonly color: "#A3BE8C";
  };
  readonly operator: {
    readonly color: "#81A1C1";
  };
  readonly entity: {
    readonly color: "#81A1C1";
    readonly cursor: "help";
  };
  readonly url: {
    readonly color: "#81A1C1";
  };
  readonly variable: {
    readonly color: "#81A1C1";
  };
  readonly atrule: {
    readonly color: "#88C0D0";
  };
  readonly 'attr-value': {
    readonly color: "#88C0D0";
  };
  readonly function: {
    readonly color: "#88C0D0";
  };
  readonly 'class-name': {
    readonly color: "#88C0D0";
  };
  readonly keyword: {
    readonly color: "#81A1C1";
  };
  readonly regex: {
    readonly color: "#EBCB8B";
  };
  readonly important: {
    readonly color: "#EBCB8B";
    readonly fontWeight: "bold";
  };
  readonly bold: {
    readonly fontWeight: "bold";
  };
  readonly italic: {
    readonly fontStyle: "italic";
  };
};
declare const ghcolors: {
  readonly base: {
    readonly color: "#393A34";
    readonly fontFamily: "\"Consolas\", \"Bitstream Vera Sans Mono\", \"Courier New\", Courier, monospace";
    readonly direction: "ltr";
    readonly textAlign: "left";
    readonly whiteSpace: "pre";
    readonly wordSpacing: "normal";
    readonly wordBreak: "normal";
    readonly fontSize: ".9em";
    readonly lineHeight: "1.2em";
    readonly MozTabSize: "4";
    readonly OTabSize: "4";
    readonly tabSize: "4";
    readonly WebkitHyphens: "none";
    readonly MozHyphens: "none";
    readonly hyphens: "none";
    readonly padding: "1em";
    readonly margin: ".5em 0";
    readonly overflow: "auto";
    readonly border: "1px solid #dddddd";
    readonly backgroundColor: "white";
  };
  readonly comment: {
    readonly color: "#999988";
    readonly fontStyle: "italic";
  };
  readonly prolog: {
    readonly color: "#999988";
    readonly fontStyle: "italic";
  };
  readonly doctype: {
    readonly color: "#999988";
    readonly fontStyle: "italic";
  };
  readonly cdata: {
    readonly color: "#999988";
    readonly fontStyle: "italic";
  };
  readonly namespace: {
    readonly opacity: ".7";
  };
  readonly string: {
    readonly color: "#e3116c";
  };
  readonly 'attr-value': {
    readonly color: "#e3116c";
  };
  readonly punctuation: {
    readonly color: "#393A34";
  };
  readonly operator: {
    readonly color: "#393A34";
  };
  readonly entity: {
    readonly color: "#36acaa";
  };
  readonly url: {
    readonly color: "#36acaa";
  };
  readonly symbol: {
    readonly color: "#36acaa";
  };
  readonly number: {
    readonly color: "#36acaa";
  };
  readonly boolean: {
    readonly color: "#36acaa";
  };
  readonly variable: {
    readonly color: "#36acaa";
  };
  readonly constant: {
    readonly color: "#36acaa";
  };
  readonly property: {
    readonly color: "#36acaa";
  };
  readonly regex: {
    readonly color: "#36acaa";
  };
  readonly inserted: {
    readonly color: "#36acaa";
  };
  readonly atrule: {
    readonly color: "#00a4db";
  };
  readonly keyword: {
    readonly color: "#00a4db";
  };
  readonly 'attr-name': {
    readonly color: "#00a4db";
  };
  readonly function: {
    readonly color: "#9a050f";
    readonly fontWeight: "bold";
  };
  readonly deleted: {
    readonly color: "#9a050f";
  };
  readonly tag: {
    readonly color: "#00009f";
  };
  readonly selector: {
    readonly color: "#00009f";
  };
  readonly important: {
    readonly fontWeight: "bold";
  };
  readonly bold: {
    readonly fontWeight: "bold";
  };
  readonly italic: {
    readonly fontStyle: "italic";
  };
};
declare const vesper: {
  readonly base: {
    readonly color: "#a0a0a0";
    readonly fontFamily: "Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace";
    readonly textAlign: "left";
    readonly whiteSpace: "pre";
    readonly wordSpacing: "normal";
    readonly wordBreak: "normal";
    readonly wordWrap: "normal";
    readonly lineHeight: "1.5";
    readonly MozTabSize: "4";
    readonly OTabSize: "4";
    readonly tabSize: "4";
    readonly WebkitHyphens: "none";
    readonly MozHyphens: "none";
    readonly MsHyphens: "none";
    readonly hyphens: "none";
    readonly overflowX: "auto";
    readonly backgroundColor: "#1E1E1E";
  };
  readonly selection: {
    readonly textShadow: "none";
    readonly background: "#ffffff25";
  };
  readonly print: {
    readonly textShadow: "none";
  };
  readonly pre: {
    readonly color: "#a0a0a0";
    readonly background: "#101010";
  };
  readonly comment: {
    readonly color: "#8b8b8b94";
  };
  readonly punctuation: {
    readonly color: "#8b8b8b94";
  };
  readonly variable: {
    readonly color: "#a0a0a0";
  };
  readonly tag: {
    readonly color: "#a0a0a0";
  };
  readonly hexcode: {
    readonly color: "#a0a0a0";
  };
  readonly string: {
    readonly color: "rgb(161, 252, 234)";
  };
  readonly url: {
    readonly color: "#a0a0a0";
  };
  readonly keyword: {
    readonly color: "#fff";
  };
  readonly deleted: {
    readonly color: "#fff";
  };
  readonly function: {
    readonly color: "#ffc799";
  };
  readonly builtin: {
    readonly color: "#fff";
  };
  readonly number: {
    readonly color: "#fff";
  };
  readonly char: {
    readonly color: "#fff";
  };
  readonly constant: {
    readonly color: "#fff";
  };
  readonly boolean: {
    readonly color: "#fff";
  };
  readonly changed: {
    readonly color: "#fff";
  };
  readonly symbol: {
    readonly color: "#99ffe4";
  };
  readonly inserted: {
    readonly color: "#ffc799";
  };
  readonly 'attr-name': {
    readonly color: "#a0a0a0";
  };
  readonly selector: {
    readonly color: "#a0a0a0";
  };
  readonly property: {
    readonly color: "#a0a0a0";
  };
  readonly regex: {
    readonly color: "#a0a0a0";
  };
  readonly important: {
    readonly fontWeight: "bold";
  };
  readonly bold: {
    readonly fontWeight: "bold";
  };
  readonly italic: {
    readonly fontStyle: "italic";
  };
};
//#endregion
//#region src/code-block.d.ts
interface CodeBlockProps extends React$1.ComponentPropsWithoutRef<'pre'> {
  lineNumbers?: boolean;
  /**
   * This applies a certain font family on all elements render in this component,
   * it is mostly meant to override a global font that has already been used with
   * our `<Font>` component
   */
  fontFamily?: string;
  theme: Theme;
  language: PrismLanguage;
  code: string;
}
declare const CodeBlock: React$1.ForwardRefExoticComponent<CodeBlockProps & React$1.RefAttributes<HTMLPreElement>>;
//#endregion
export { CodeBlock, CodeBlockProps, PrismLanguage, Theme, a11yDark, atomDark, baseAteliersulphurpoolLight, cb, coldarkCold, coldarkDark, coyWithoutShadows, darcula, dracula, duotoneDark, duotoneEarth, duotoneForest, duotoneLight, duotoneSea, duotoneSpace, ghcolors, gruvboxDark, gruvboxLight, holiTheme, hopscotch, laserwave, lucario, materialDark, materialLight, materialOceanic, nightOwl, nord, oneDark, oneLight, pojoaque, shadesOfPurple, solarizedDarkAtom, synthwave84, vesper, vs, vscDarkPlus, xonokai, zTouch };
//# sourceMappingURL=index.d.ts.map
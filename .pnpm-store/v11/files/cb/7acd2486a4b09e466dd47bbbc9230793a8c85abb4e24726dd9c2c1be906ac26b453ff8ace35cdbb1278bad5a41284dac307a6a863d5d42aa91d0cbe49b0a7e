import * as React$1 from "react";
import React from "react";
import { Body } from "@react-email/body";
import { Button } from "@react-email/button";
import { CodeBlock } from "@react-email/code-block";
import { CodeInline } from "@react-email/code-inline";
import { Container } from "@react-email/container";
import { Heading } from "@react-email/heading";
import { Hr } from "@react-email/hr";
import { Img } from "@react-email/img";
import { Link } from "@react-email/link";
import { Preview } from "@react-email/preview";
import { Text } from "@react-email/text";
import { compile } from "tailwindcss";
import { jsx } from "react/jsx-runtime";

//#region rolldown:runtime
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function() {
	return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (all) => {
	let target = {};
	for (var name$49 in all) __defProp(target, name$49, {
		get: all[name$49],
		enumerable: true
	});
	return target;
};
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/tokenizer/types.js
const EOF = 0;
const Ident = 1;
const Function = 2;
const AtKeyword = 3;
const Hash = 4;
const String$1 = 5;
const BadString = 6;
const Url = 7;
const BadUrl = 8;
const Delim = 9;
const Number$1 = 10;
const Percentage = 11;
const Dimension = 12;
const WhiteSpace = 13;
const CDO = 14;
const CDC = 15;
const Colon = 16;
const Semicolon = 17;
const Comma = 18;
const LeftSquareBracket = 19;
const RightSquareBracket = 20;
const LeftParenthesis = 21;
const RightParenthesis = 22;
const LeftCurlyBracket = 23;
const RightCurlyBracket = 24;
const Comment = 25;

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/tokenizer/char-code-definitions.js
const EOF$1 = 0;
function isDigit(code$1) {
	return code$1 >= 48 && code$1 <= 57;
}
function isHexDigit(code$1) {
	return isDigit(code$1) || code$1 >= 65 && code$1 <= 70 || code$1 >= 97 && code$1 <= 102;
}
function isUppercaseLetter(code$1) {
	return code$1 >= 65 && code$1 <= 90;
}
function isLowercaseLetter(code$1) {
	return code$1 >= 97 && code$1 <= 122;
}
function isLetter(code$1) {
	return isUppercaseLetter(code$1) || isLowercaseLetter(code$1);
}
function isNonAscii(code$1) {
	return code$1 >= 128;
}
function isNameStart(code$1) {
	return isLetter(code$1) || isNonAscii(code$1) || code$1 === 95;
}
function isName(code$1) {
	return isNameStart(code$1) || isDigit(code$1) || code$1 === 45;
}
function isNonPrintable(code$1) {
	return code$1 >= 0 && code$1 <= 8 || code$1 === 11 || code$1 >= 14 && code$1 <= 31 || code$1 === 127;
}
function isNewline(code$1) {
	return code$1 === 10 || code$1 === 13 || code$1 === 12;
}
function isWhiteSpace(code$1) {
	return isNewline(code$1) || code$1 === 32 || code$1 === 9;
}
function isValidEscape(first, second) {
	if (first !== 92) return false;
	if (isNewline(second) || second === EOF$1) return false;
	return true;
}
function isIdentifierStart(first, second, third) {
	if (first === 45) return isNameStart(second) || second === 45 || isValidEscape(second, third);
	if (isNameStart(first)) return true;
	if (first === 92) return isValidEscape(first, second);
	return false;
}
function isNumberStart(first, second, third) {
	if (first === 43 || first === 45) {
		if (isDigit(second)) return 2;
		return second === 46 && isDigit(third) ? 3 : 0;
	}
	if (first === 46) return isDigit(second) ? 2 : 0;
	if (isDigit(first)) return 1;
	return 0;
}
function isBOM(code$1) {
	if (code$1 === 65279) return 1;
	if (code$1 === 65534) return 1;
	return 0;
}
const CATEGORY = new Array(128);
const EofCategory = 128;
const WhiteSpaceCategory = 130;
const DigitCategory = 131;
const NameStartCategory = 132;
const NonPrintableCategory = 133;
for (let i = 0; i < CATEGORY.length; i++) CATEGORY[i] = isWhiteSpace(i) && WhiteSpaceCategory || isDigit(i) && DigitCategory || isNameStart(i) && NameStartCategory || isNonPrintable(i) && NonPrintableCategory || i || EofCategory;
function charCodeCategory(code$1) {
	return code$1 < 128 ? CATEGORY[code$1] : NameStartCategory;
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/tokenizer/utils.js
function getCharCode(source, offset) {
	return offset < source.length ? source.charCodeAt(offset) : 0;
}
function getNewlineLength(source, offset, code$1) {
	if (code$1 === 13 && getCharCode(source, offset + 1) === 10) return 2;
	return 1;
}
function cmpChar(testStr, offset, referenceCode) {
	let code$1 = testStr.charCodeAt(offset);
	if (isUppercaseLetter(code$1)) code$1 = code$1 | 32;
	return code$1 === referenceCode;
}
function cmpStr(testStr, start, end, referenceStr) {
	if (end - start !== referenceStr.length) return false;
	if (start < 0 || end > testStr.length) return false;
	for (let i = start; i < end; i++) {
		const referenceCode = referenceStr.charCodeAt(i - start);
		let testCode = testStr.charCodeAt(i);
		if (isUppercaseLetter(testCode)) testCode = testCode | 32;
		if (testCode !== referenceCode) return false;
	}
	return true;
}
function findWhiteSpaceStart(source, offset) {
	for (; offset >= 0; offset--) if (!isWhiteSpace(source.charCodeAt(offset))) break;
	return offset + 1;
}
function findWhiteSpaceEnd(source, offset) {
	for (; offset < source.length; offset++) if (!isWhiteSpace(source.charCodeAt(offset))) break;
	return offset;
}
function findDecimalNumberEnd(source, offset) {
	for (; offset < source.length; offset++) if (!isDigit(source.charCodeAt(offset))) break;
	return offset;
}
function consumeEscaped(source, offset) {
	offset += 2;
	if (isHexDigit(getCharCode(source, offset - 1))) {
		for (const maxOffset = Math.min(source.length, offset + 5); offset < maxOffset; offset++) if (!isHexDigit(getCharCode(source, offset))) break;
		const code$1 = getCharCode(source, offset);
		if (isWhiteSpace(code$1)) offset += getNewlineLength(source, offset, code$1);
	}
	return offset;
}
function consumeName(source, offset) {
	for (; offset < source.length; offset++) {
		const code$1 = source.charCodeAt(offset);
		if (isName(code$1)) continue;
		if (isValidEscape(code$1, getCharCode(source, offset + 1))) {
			offset = consumeEscaped(source, offset) - 1;
			continue;
		}
		break;
	}
	return offset;
}
function consumeNumber(source, offset) {
	let code$1 = source.charCodeAt(offset);
	if (code$1 === 43 || code$1 === 45) code$1 = source.charCodeAt(offset += 1);
	if (isDigit(code$1)) {
		offset = findDecimalNumberEnd(source, offset + 1);
		code$1 = source.charCodeAt(offset);
	}
	if (code$1 === 46 && isDigit(source.charCodeAt(offset + 1))) {
		offset += 2;
		offset = findDecimalNumberEnd(source, offset);
	}
	if (cmpChar(source, offset, 101)) {
		let sign = 0;
		code$1 = source.charCodeAt(offset + 1);
		if (code$1 === 45 || code$1 === 43) {
			sign = 1;
			code$1 = source.charCodeAt(offset + 2);
		}
		if (isDigit(code$1)) offset = findDecimalNumberEnd(source, offset + 1 + sign + 1);
	}
	return offset;
}
function consumeBadUrlRemnants(source, offset) {
	for (; offset < source.length; offset++) {
		const code$1 = source.charCodeAt(offset);
		if (code$1 === 41) {
			offset++;
			break;
		}
		if (isValidEscape(code$1, getCharCode(source, offset + 1))) offset = consumeEscaped(source, offset);
	}
	return offset;
}
function decodeEscaped(escaped) {
	if (escaped.length === 1 && !isHexDigit(escaped.charCodeAt(0))) return escaped[0];
	let code$1 = parseInt(escaped, 16);
	if (code$1 === 0 || code$1 >= 55296 && code$1 <= 57343 || code$1 > 1114111) code$1 = 65533;
	return String.fromCodePoint(code$1);
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/tokenizer/names.js
var names_default = [
	"EOF-token",
	"ident-token",
	"function-token",
	"at-keyword-token",
	"hash-token",
	"string-token",
	"bad-string-token",
	"url-token",
	"bad-url-token",
	"delim-token",
	"number-token",
	"percentage-token",
	"dimension-token",
	"whitespace-token",
	"CDO-token",
	"CDC-token",
	"colon-token",
	"semicolon-token",
	"comma-token",
	"[-token",
	"]-token",
	"(-token",
	")-token",
	"{-token",
	"}-token",
	"comment-token"
];

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/tokenizer/adopt-buffer.js
const MIN_SIZE = 16 * 1024;
function adoptBuffer(buffer = null, size) {
	if (buffer === null || buffer.length < size) return new Uint32Array(Math.max(size + 1024, MIN_SIZE));
	return buffer;
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/tokenizer/OffsetToLocation.js
const N$4 = 10;
const F$2 = 12;
const R$2 = 13;
function computeLinesAndColumns(host) {
	const source = host.source;
	const sourceLength = source.length;
	const startOffset = source.length > 0 ? isBOM(source.charCodeAt(0)) : 0;
	const lines = adoptBuffer(host.lines, sourceLength);
	const columns = adoptBuffer(host.columns, sourceLength);
	let line = host.startLine;
	let column = host.startColumn;
	for (let i = startOffset; i < sourceLength; i++) {
		const code$1 = source.charCodeAt(i);
		lines[i] = line;
		columns[i] = column++;
		if (code$1 === N$4 || code$1 === R$2 || code$1 === F$2) {
			if (code$1 === R$2 && i + 1 < sourceLength && source.charCodeAt(i + 1) === N$4) {
				i++;
				lines[i] = line;
				columns[i] = column;
			}
			line++;
			column = 1;
		}
	}
	lines[sourceLength] = line;
	columns[sourceLength] = column;
	host.lines = lines;
	host.columns = columns;
	host.computed = true;
}
var OffsetToLocation = class {
	constructor(source, startOffset, startLine, startColumn) {
		this.setSource(source, startOffset, startLine, startColumn);
		this.lines = null;
		this.columns = null;
	}
	setSource(source = "", startOffset = 0, startLine = 1, startColumn = 1) {
		this.source = source;
		this.startOffset = startOffset;
		this.startLine = startLine;
		this.startColumn = startColumn;
		this.computed = false;
	}
	getLocation(offset, filename) {
		if (!this.computed) computeLinesAndColumns(this);
		return {
			source: filename,
			offset: this.startOffset + offset,
			line: this.lines[offset],
			column: this.columns[offset]
		};
	}
	getLocationRange(start, end, filename) {
		if (!this.computed) computeLinesAndColumns(this);
		return {
			source: filename,
			start: {
				offset: this.startOffset + start,
				line: this.lines[start],
				column: this.columns[start]
			},
			end: {
				offset: this.startOffset + end,
				line: this.lines[end],
				column: this.columns[end]
			}
		};
	}
};

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/tokenizer/TokenStream.js
const OFFSET_MASK = 16777215;
const TYPE_SHIFT = 24;
const balancePair$1 = new Uint8Array(32);
balancePair$1[Function] = RightParenthesis;
balancePair$1[LeftParenthesis] = RightParenthesis;
balancePair$1[LeftSquareBracket] = RightSquareBracket;
balancePair$1[LeftCurlyBracket] = RightCurlyBracket;
function isBlockOpenerToken(tokenType$1) {
	return balancePair$1[tokenType$1] !== 0;
}
var TokenStream = class {
	constructor(source, tokenize$2) {
		this.setSource(source, tokenize$2);
	}
	reset() {
		this.eof = false;
		this.tokenIndex = -1;
		this.tokenType = 0;
		this.tokenStart = this.firstCharOffset;
		this.tokenEnd = this.firstCharOffset;
	}
	setSource(source = "", tokenize$2 = () => {}) {
		source = String(source || "");
		const sourceLength = source.length;
		const offsetAndType = adoptBuffer(this.offsetAndType, source.length + 1);
		const balance = adoptBuffer(this.balance, source.length + 1);
		let tokenCount = 0;
		let firstCharOffset = -1;
		let balanceCloseType = 0;
		let balanceStart = source.length;
		this.offsetAndType = null;
		this.balance = null;
		balance.fill(0);
		tokenize$2(source, (type, start, end) => {
			const index = tokenCount++;
			offsetAndType[index] = type << TYPE_SHIFT | end;
			if (firstCharOffset === -1) firstCharOffset = start;
			balance[index] = balanceStart;
			if (type === balanceCloseType) {
				const prevBalanceStart = balance[balanceStart];
				balance[balanceStart] = index;
				balanceStart = prevBalanceStart;
				balanceCloseType = balancePair$1[offsetAndType[prevBalanceStart] >> TYPE_SHIFT];
			} else if (isBlockOpenerToken(type)) {
				balanceStart = index;
				balanceCloseType = balancePair$1[type];
			}
		});
		offsetAndType[tokenCount] = EOF << TYPE_SHIFT | sourceLength;
		balance[tokenCount] = tokenCount;
		for (let i = 0; i < tokenCount; i++) {
			const balanceStart$1 = balance[i];
			if (balanceStart$1 <= i) {
				const balanceEnd = balance[balanceStart$1];
				if (balanceEnd !== i) balance[i] = balanceEnd;
			} else if (balanceStart$1 > tokenCount) balance[i] = tokenCount;
		}
		this.source = source;
		this.firstCharOffset = firstCharOffset === -1 ? 0 : firstCharOffset;
		this.tokenCount = tokenCount;
		this.offsetAndType = offsetAndType;
		this.balance = balance;
		this.reset();
		this.next();
	}
	lookupType(offset) {
		offset += this.tokenIndex;
		if (offset < this.tokenCount) return this.offsetAndType[offset] >> TYPE_SHIFT;
		return EOF;
	}
	lookupTypeNonSC(idx) {
		for (let offset = this.tokenIndex; offset < this.tokenCount; offset++) {
			const tokenType$1 = this.offsetAndType[offset] >> TYPE_SHIFT;
			if (tokenType$1 !== WhiteSpace && tokenType$1 !== Comment) {
				if (idx-- === 0) return tokenType$1;
			}
		}
		return EOF;
	}
	lookupOffset(offset) {
		offset += this.tokenIndex;
		if (offset < this.tokenCount) return this.offsetAndType[offset - 1] & OFFSET_MASK;
		return this.source.length;
	}
	lookupOffsetNonSC(idx) {
		for (let offset = this.tokenIndex; offset < this.tokenCount; offset++) {
			const tokenType$1 = this.offsetAndType[offset] >> TYPE_SHIFT;
			if (tokenType$1 !== WhiteSpace && tokenType$1 !== Comment) {
				if (idx-- === 0) return offset - this.tokenIndex;
			}
		}
		return EOF;
	}
	lookupValue(offset, referenceStr) {
		offset += this.tokenIndex;
		if (offset < this.tokenCount) return cmpStr(this.source, this.offsetAndType[offset - 1] & OFFSET_MASK, this.offsetAndType[offset] & OFFSET_MASK, referenceStr);
		return false;
	}
	getTokenStart(tokenIndex) {
		if (tokenIndex === this.tokenIndex) return this.tokenStart;
		if (tokenIndex > 0) return tokenIndex < this.tokenCount ? this.offsetAndType[tokenIndex - 1] & OFFSET_MASK : this.offsetAndType[this.tokenCount] & OFFSET_MASK;
		return this.firstCharOffset;
	}
	substrToCursor(start) {
		return this.source.substring(start, this.tokenStart);
	}
	isBalanceEdge(pos) {
		return this.balance[this.tokenIndex] < pos;
	}
	isDelim(code$1, offset) {
		if (offset) return this.lookupType(offset) === Delim && this.source.charCodeAt(this.lookupOffset(offset)) === code$1;
		return this.tokenType === Delim && this.source.charCodeAt(this.tokenStart) === code$1;
	}
	skip(tokenCount) {
		let next = this.tokenIndex + tokenCount;
		if (next < this.tokenCount) {
			this.tokenIndex = next;
			this.tokenStart = this.offsetAndType[next - 1] & OFFSET_MASK;
			next = this.offsetAndType[next];
			this.tokenType = next >> TYPE_SHIFT;
			this.tokenEnd = next & OFFSET_MASK;
		} else {
			this.tokenIndex = this.tokenCount;
			this.next();
		}
	}
	next() {
		let next = this.tokenIndex + 1;
		if (next < this.tokenCount) {
			this.tokenIndex = next;
			this.tokenStart = this.tokenEnd;
			next = this.offsetAndType[next];
			this.tokenType = next >> TYPE_SHIFT;
			this.tokenEnd = next & OFFSET_MASK;
		} else {
			this.eof = true;
			this.tokenIndex = this.tokenCount;
			this.tokenType = EOF;
			this.tokenStart = this.tokenEnd = this.source.length;
		}
	}
	skipSC() {
		while (this.tokenType === WhiteSpace || this.tokenType === Comment) this.next();
	}
	skipUntilBalanced(startToken, stopConsume) {
		let cursor = startToken;
		let balanceEnd = 0;
		let offset = 0;
		loop: for (; cursor < this.tokenCount; cursor++) {
			balanceEnd = this.balance[cursor];
			if (balanceEnd < startToken) break loop;
			offset = cursor > 0 ? this.offsetAndType[cursor - 1] & OFFSET_MASK : this.firstCharOffset;
			switch (stopConsume(this.source.charCodeAt(offset))) {
				case 1: break loop;
				case 2:
					cursor++;
					break loop;
				default: if (isBlockOpenerToken(this.offsetAndType[cursor] >> TYPE_SHIFT)) cursor = balanceEnd;
			}
		}
		this.skip(cursor - this.tokenIndex);
	}
	forEachToken(fn) {
		for (let i = 0, offset = this.firstCharOffset; i < this.tokenCount; i++) {
			const start = offset;
			const item = this.offsetAndType[i];
			const end = item & OFFSET_MASK;
			const type = item >> TYPE_SHIFT;
			offset = end;
			fn(type, start, end, i);
		}
	}
	dump() {
		const tokens = new Array(this.tokenCount);
		this.forEachToken((type, start, end, index) => {
			tokens[index] = {
				idx: index,
				type: names_default[type],
				chunk: this.source.substring(start, end),
				balance: this.balance[index]
			};
		});
		return tokens;
	}
};

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/tokenizer/index.js
function tokenize$1(source, onToken) {
	function getCharCode$1(offset$1) {
		return offset$1 < sourceLength ? source.charCodeAt(offset$1) : 0;
	}
	function consumeNumericToken() {
		offset = consumeNumber(source, offset);
		if (isIdentifierStart(getCharCode$1(offset), getCharCode$1(offset + 1), getCharCode$1(offset + 2))) {
			type = Dimension;
			offset = consumeName(source, offset);
			return;
		}
		if (getCharCode$1(offset) === 37) {
			type = Percentage;
			offset++;
			return;
		}
		type = Number$1;
	}
	function consumeIdentLikeToken() {
		const nameStartOffset = offset;
		offset = consumeName(source, offset);
		if (cmpStr(source, nameStartOffset, offset, "url") && getCharCode$1(offset) === 40) {
			offset = findWhiteSpaceEnd(source, offset + 1);
			if (getCharCode$1(offset) === 34 || getCharCode$1(offset) === 39) {
				type = Function;
				offset = nameStartOffset + 4;
				return;
			}
			consumeUrlToken();
			return;
		}
		if (getCharCode$1(offset) === 40) {
			type = Function;
			offset++;
			return;
		}
		type = Ident;
	}
	function consumeStringToken(endingCodePoint) {
		if (!endingCodePoint) endingCodePoint = getCharCode$1(offset++);
		type = String$1;
		for (; offset < source.length; offset++) {
			const code$1 = source.charCodeAt(offset);
			switch (charCodeCategory(code$1)) {
				case endingCodePoint:
					offset++;
					return;
				case WhiteSpaceCategory:
					if (isNewline(code$1)) {
						offset += getNewlineLength(source, offset, code$1);
						type = BadString;
						return;
					}
					break;
				case 92:
					if (offset === source.length - 1) break;
					const nextCode = getCharCode$1(offset + 1);
					if (isNewline(nextCode)) offset += getNewlineLength(source, offset + 1, nextCode);
					else if (isValidEscape(code$1, nextCode)) offset = consumeEscaped(source, offset) - 1;
					break;
			}
		}
	}
	function consumeUrlToken() {
		type = Url;
		offset = findWhiteSpaceEnd(source, offset);
		for (; offset < source.length; offset++) {
			const code$1 = source.charCodeAt(offset);
			switch (charCodeCategory(code$1)) {
				case 41:
					offset++;
					return;
				case WhiteSpaceCategory:
					offset = findWhiteSpaceEnd(source, offset);
					if (getCharCode$1(offset) === 41 || offset >= source.length) {
						if (offset < source.length) offset++;
						return;
					}
					offset = consumeBadUrlRemnants(source, offset);
					type = BadUrl;
					return;
				case 34:
				case 39:
				case 40:
				case NonPrintableCategory:
					offset = consumeBadUrlRemnants(source, offset);
					type = BadUrl;
					return;
				case 92:
					if (isValidEscape(code$1, getCharCode$1(offset + 1))) {
						offset = consumeEscaped(source, offset) - 1;
						break;
					}
					offset = consumeBadUrlRemnants(source, offset);
					type = BadUrl;
					return;
			}
		}
	}
	source = String(source || "");
	const sourceLength = source.length;
	let start = isBOM(getCharCode$1(0));
	let offset = start;
	let type;
	while (offset < sourceLength) {
		const code$1 = source.charCodeAt(offset);
		switch (charCodeCategory(code$1)) {
			case WhiteSpaceCategory:
				type = WhiteSpace;
				offset = findWhiteSpaceEnd(source, offset + 1);
				break;
			case 34:
				consumeStringToken();
				break;
			case 35:
				if (isName(getCharCode$1(offset + 1)) || isValidEscape(getCharCode$1(offset + 1), getCharCode$1(offset + 2))) {
					type = Hash;
					offset = consumeName(source, offset + 1);
				} else {
					type = Delim;
					offset++;
				}
				break;
			case 39:
				consumeStringToken();
				break;
			case 40:
				type = LeftParenthesis;
				offset++;
				break;
			case 41:
				type = RightParenthesis;
				offset++;
				break;
			case 43:
				if (isNumberStart(code$1, getCharCode$1(offset + 1), getCharCode$1(offset + 2))) consumeNumericToken();
				else {
					type = Delim;
					offset++;
				}
				break;
			case 44:
				type = Comma;
				offset++;
				break;
			case 45:
				if (isNumberStart(code$1, getCharCode$1(offset + 1), getCharCode$1(offset + 2))) consumeNumericToken();
				else if (getCharCode$1(offset + 1) === 45 && getCharCode$1(offset + 2) === 62) {
					type = CDC;
					offset = offset + 3;
				} else if (isIdentifierStart(code$1, getCharCode$1(offset + 1), getCharCode$1(offset + 2))) consumeIdentLikeToken();
				else {
					type = Delim;
					offset++;
				}
				break;
			case 46:
				if (isNumberStart(code$1, getCharCode$1(offset + 1), getCharCode$1(offset + 2))) consumeNumericToken();
				else {
					type = Delim;
					offset++;
				}
				break;
			case 47:
				if (getCharCode$1(offset + 1) === 42) {
					type = Comment;
					offset = source.indexOf("*/", offset + 2);
					offset = offset === -1 ? source.length : offset + 2;
				} else {
					type = Delim;
					offset++;
				}
				break;
			case 58:
				type = Colon;
				offset++;
				break;
			case 59:
				type = Semicolon;
				offset++;
				break;
			case 60:
				if (getCharCode$1(offset + 1) === 33 && getCharCode$1(offset + 2) === 45 && getCharCode$1(offset + 3) === 45) {
					type = CDO;
					offset = offset + 4;
				} else {
					type = Delim;
					offset++;
				}
				break;
			case 64:
				if (isIdentifierStart(getCharCode$1(offset + 1), getCharCode$1(offset + 2), getCharCode$1(offset + 3))) {
					type = AtKeyword;
					offset = consumeName(source, offset + 1);
				} else {
					type = Delim;
					offset++;
				}
				break;
			case 91:
				type = LeftSquareBracket;
				offset++;
				break;
			case 92:
				if (isValidEscape(code$1, getCharCode$1(offset + 1))) consumeIdentLikeToken();
				else {
					type = Delim;
					offset++;
				}
				break;
			case 93:
				type = RightSquareBracket;
				offset++;
				break;
			case 123:
				type = LeftCurlyBracket;
				offset++;
				break;
			case 125:
				type = RightCurlyBracket;
				offset++;
				break;
			case DigitCategory:
				consumeNumericToken();
				break;
			case NameStartCategory:
				consumeIdentLikeToken();
				break;
			default:
				type = Delim;
				offset++;
		}
		onToken(type, start, start = offset);
	}
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/utils/List.js
let releasedCursors = null;
var List = class List {
	static createItem(data) {
		return {
			prev: null,
			next: null,
			data
		};
	}
	constructor() {
		this.head = null;
		this.tail = null;
		this.cursor = null;
	}
	createItem(data) {
		return List.createItem(data);
	}
	allocateCursor(prev, next) {
		let cursor;
		if (releasedCursors !== null) {
			cursor = releasedCursors;
			releasedCursors = releasedCursors.cursor;
			cursor.prev = prev;
			cursor.next = next;
			cursor.cursor = this.cursor;
		} else cursor = {
			prev,
			next,
			cursor: this.cursor
		};
		this.cursor = cursor;
		return cursor;
	}
	releaseCursor() {
		const { cursor } = this;
		this.cursor = cursor.cursor;
		cursor.prev = null;
		cursor.next = null;
		cursor.cursor = releasedCursors;
		releasedCursors = cursor;
	}
	updateCursors(prevOld, prevNew, nextOld, nextNew) {
		let { cursor } = this;
		while (cursor !== null) {
			if (cursor.prev === prevOld) cursor.prev = prevNew;
			if (cursor.next === nextOld) cursor.next = nextNew;
			cursor = cursor.cursor;
		}
	}
	*[Symbol.iterator]() {
		for (let cursor = this.head; cursor !== null; cursor = cursor.next) yield cursor.data;
	}
	get size() {
		let size = 0;
		for (let cursor = this.head; cursor !== null; cursor = cursor.next) size++;
		return size;
	}
	get isEmpty() {
		return this.head === null;
	}
	get first() {
		return this.head && this.head.data;
	}
	get last() {
		return this.tail && this.tail.data;
	}
	fromArray(array) {
		let cursor = null;
		this.head = null;
		for (let data of array) {
			const item = List.createItem(data);
			if (cursor !== null) cursor.next = item;
			else this.head = item;
			item.prev = cursor;
			cursor = item;
		}
		this.tail = cursor;
		return this;
	}
	toArray() {
		return [...this];
	}
	toJSON() {
		return [...this];
	}
	forEach(fn, thisArg = this) {
		const cursor = this.allocateCursor(null, this.head);
		while (cursor.next !== null) {
			const item = cursor.next;
			cursor.next = item.next;
			fn.call(thisArg, item.data, item, this);
		}
		this.releaseCursor();
	}
	forEachRight(fn, thisArg = this) {
		const cursor = this.allocateCursor(this.tail, null);
		while (cursor.prev !== null) {
			const item = cursor.prev;
			cursor.prev = item.prev;
			fn.call(thisArg, item.data, item, this);
		}
		this.releaseCursor();
	}
	reduce(fn, initialValue, thisArg = this) {
		let cursor = this.allocateCursor(null, this.head);
		let acc = initialValue;
		let item;
		while (cursor.next !== null) {
			item = cursor.next;
			cursor.next = item.next;
			acc = fn.call(thisArg, acc, item.data, item, this);
		}
		this.releaseCursor();
		return acc;
	}
	reduceRight(fn, initialValue, thisArg = this) {
		let cursor = this.allocateCursor(this.tail, null);
		let acc = initialValue;
		let item;
		while (cursor.prev !== null) {
			item = cursor.prev;
			cursor.prev = item.prev;
			acc = fn.call(thisArg, acc, item.data, item, this);
		}
		this.releaseCursor();
		return acc;
	}
	some(fn, thisArg = this) {
		for (let cursor = this.head; cursor !== null; cursor = cursor.next) if (fn.call(thisArg, cursor.data, cursor, this)) return true;
		return false;
	}
	map(fn, thisArg = this) {
		const result = new List();
		for (let cursor = this.head; cursor !== null; cursor = cursor.next) result.appendData(fn.call(thisArg, cursor.data, cursor, this));
		return result;
	}
	filter(fn, thisArg = this) {
		const result = new List();
		for (let cursor = this.head; cursor !== null; cursor = cursor.next) if (fn.call(thisArg, cursor.data, cursor, this)) result.appendData(cursor.data);
		return result;
	}
	nextUntil(start, fn, thisArg = this) {
		if (start === null) return;
		const cursor = this.allocateCursor(null, start);
		while (cursor.next !== null) {
			const item = cursor.next;
			cursor.next = item.next;
			if (fn.call(thisArg, item.data, item, this)) break;
		}
		this.releaseCursor();
	}
	prevUntil(start, fn, thisArg = this) {
		if (start === null) return;
		const cursor = this.allocateCursor(start, null);
		while (cursor.prev !== null) {
			const item = cursor.prev;
			cursor.prev = item.prev;
			if (fn.call(thisArg, item.data, item, this)) break;
		}
		this.releaseCursor();
	}
	clear() {
		this.head = null;
		this.tail = null;
	}
	copy() {
		const result = new List();
		for (let data of this) result.appendData(data);
		return result;
	}
	prepend(item) {
		this.updateCursors(null, item, this.head, item);
		if (this.head !== null) {
			this.head.prev = item;
			item.next = this.head;
		} else this.tail = item;
		this.head = item;
		return this;
	}
	prependData(data) {
		return this.prepend(List.createItem(data));
	}
	append(item) {
		return this.insert(item);
	}
	appendData(data) {
		return this.insert(List.createItem(data));
	}
	insert(item, before = null) {
		if (before !== null) {
			this.updateCursors(before.prev, item, before, item);
			if (before.prev === null) {
				if (this.head !== before) throw new Error("before doesn't belong to list");
				this.head = item;
				before.prev = item;
				item.next = before;
				this.updateCursors(null, item);
			} else {
				before.prev.next = item;
				item.prev = before.prev;
				before.prev = item;
				item.next = before;
			}
		} else {
			this.updateCursors(this.tail, item, null, item);
			if (this.tail !== null) {
				this.tail.next = item;
				item.prev = this.tail;
			} else this.head = item;
			this.tail = item;
		}
		return this;
	}
	insertData(data, before) {
		return this.insert(List.createItem(data), before);
	}
	remove(item) {
		this.updateCursors(item, item.prev, item, item.next);
		if (item.prev !== null) item.prev.next = item.next;
		else {
			if (this.head !== item) throw new Error("item doesn't belong to list");
			this.head = item.next;
		}
		if (item.next !== null) item.next.prev = item.prev;
		else {
			if (this.tail !== item) throw new Error("item doesn't belong to list");
			this.tail = item.prev;
		}
		item.prev = null;
		item.next = null;
		return item;
	}
	push(data) {
		this.insert(List.createItem(data));
	}
	pop() {
		return this.tail !== null ? this.remove(this.tail) : null;
	}
	unshift(data) {
		this.prepend(List.createItem(data));
	}
	shift() {
		return this.head !== null ? this.remove(this.head) : null;
	}
	prependList(list) {
		return this.insertList(list, this.head);
	}
	appendList(list) {
		return this.insertList(list);
	}
	insertList(list, before) {
		if (list.head === null) return this;
		if (before !== void 0 && before !== null) {
			this.updateCursors(before.prev, list.tail, before, list.head);
			if (before.prev !== null) {
				before.prev.next = list.head;
				list.head.prev = before.prev;
			} else this.head = list.head;
			before.prev = list.tail;
			list.tail.next = before;
		} else {
			this.updateCursors(this.tail, list.tail, null, list.head);
			if (this.tail !== null) {
				this.tail.next = list.head;
				list.head.prev = this.tail;
			} else this.head = list.head;
			this.tail = list.tail;
		}
		list.head = null;
		list.tail = null;
		return this;
	}
	replace(oldItem, newItemOrList) {
		if ("head" in newItemOrList) this.insertList(newItemOrList, oldItem);
		else this.insert(newItemOrList, oldItem);
		this.remove(oldItem);
	}
};

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/utils/create-custom-error.js
function createCustomError(name$49, message) {
	const error = Object.create(SyntaxError.prototype);
	const errorStack = /* @__PURE__ */ new Error();
	return Object.assign(error, {
		name: name$49,
		message,
		get stack() {
			return (errorStack.stack || "").replace(/^(.+\n){1,3}/, `${name$49}: ${message}\n`);
		}
	});
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/parser/SyntaxError.js
const MAX_LINE_LENGTH = 100;
const OFFSET_CORRECTION = 60;
const TAB_REPLACEMENT = "    ";
function sourceFragment({ source, line, column, baseLine, baseColumn }, extraLines) {
	function processLines(start, end) {
		return lines.slice(start, end).map((line$1, idx) => String(start + idx + 1).padStart(maxNumLength) + " |" + line$1).join("\n");
	}
	const lines = ("\n".repeat(Math.max(baseLine - 1, 0)) + " ".repeat(Math.max(baseColumn - 1, 0)) + source).split(/\r\n?|\n|\f/);
	const startLine = Math.max(1, line - extraLines) - 1;
	const endLine = Math.min(line + extraLines, lines.length + 1);
	const maxNumLength = Math.max(4, String(endLine).length) + 1;
	let cutLeft = 0;
	column += 3 * (lines[line - 1].substr(0, column - 1).match(/\t/g) || []).length;
	if (column > MAX_LINE_LENGTH) {
		cutLeft = column - OFFSET_CORRECTION + 3;
		column = OFFSET_CORRECTION - 2;
	}
	for (let i = startLine; i <= endLine; i++) if (i >= 0 && i < lines.length) {
		lines[i] = lines[i].replace(/\t/g, TAB_REPLACEMENT);
		lines[i] = (cutLeft > 0 && lines[i].length > cutLeft ? "…" : "") + lines[i].substr(cutLeft, MAX_LINE_LENGTH - 2) + (lines[i].length > cutLeft + MAX_LINE_LENGTH - 1 ? "…" : "");
	}
	return [
		processLines(startLine, line),
		new Array(column + maxNumLength + 2).join("-") + "^",
		processLines(line, endLine)
	].filter(Boolean).join("\n").replace(/^(\s+\d+\s+\|\n)+/, "").replace(/\n(\s+\d+\s+\|)+$/, "");
}
function SyntaxError$2(message, source, offset, line, column, baseLine = 1, baseColumn = 1) {
	return Object.assign(createCustomError("SyntaxError", message), {
		source,
		offset,
		line,
		column,
		sourceFragment(extraLines) {
			return sourceFragment({
				source,
				line,
				column,
				baseLine,
				baseColumn
			}, isNaN(extraLines) ? 0 : extraLines);
		},
		get formattedMessage() {
			return `Parse error: ${message}\n` + sourceFragment({
				source,
				line,
				column,
				baseLine,
				baseColumn
			}, 2);
		}
	});
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/parser/sequence.js
function readSequence(recognizer) {
	const children = this.createList();
	let space = false;
	const context = { recognizer };
	while (!this.eof) {
		switch (this.tokenType) {
			case Comment:
				this.next();
				continue;
			case WhiteSpace:
				space = true;
				this.next();
				continue;
		}
		let child = recognizer.getNode.call(this, context);
		if (child === void 0) break;
		if (space) {
			if (recognizer.onWhiteSpace) recognizer.onWhiteSpace.call(this, child, children, context);
			space = false;
		}
		children.push(child);
	}
	if (space && recognizer.onWhiteSpace) recognizer.onWhiteSpace.call(this, null, children, context);
	return children;
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/parser/create.js
const NOOP = () => {};
const EXCLAMATIONMARK$3 = 33;
const NUMBERSIGN$4 = 35;
const SEMICOLON = 59;
const LEFTCURLYBRACKET$1 = 123;
const NULL = 0;
function createParseContext(name$49) {
	return function() {
		return this[name$49]();
	};
}
function fetchParseValues(dict) {
	const result = Object.create(null);
	for (const name$49 of Object.keys(dict)) {
		const item = dict[name$49];
		const fn = item.parse || item;
		if (fn) result[name$49] = fn;
	}
	return result;
}
function processConfig(config) {
	const parseConfig = {
		context: Object.create(null),
		features: Object.assign(Object.create(null), config.features),
		scope: Object.assign(Object.create(null), config.scope),
		atrule: fetchParseValues(config.atrule),
		pseudo: fetchParseValues(config.pseudo),
		node: fetchParseValues(config.node)
	};
	for (const [name$49, context] of Object.entries(config.parseContext)) switch (typeof context) {
		case "function":
			parseConfig.context[name$49] = context;
			break;
		case "string":
			parseConfig.context[name$49] = createParseContext(context);
			break;
	}
	return {
		config: parseConfig,
		...parseConfig,
		...parseConfig.node
	};
}
function createParser(config) {
	let source = "";
	let filename = "<unknown>";
	let needPositions = false;
	let onParseError = NOOP;
	let onParseErrorThrow = false;
	const locationMap = new OffsetToLocation();
	const parser = Object.assign(new TokenStream(), processConfig(config || {}), {
		parseAtrulePrelude: true,
		parseRulePrelude: true,
		parseValue: true,
		parseCustomProperty: false,
		readSequence,
		consumeUntilBalanceEnd: () => 0,
		consumeUntilLeftCurlyBracket(code$1) {
			return code$1 === LEFTCURLYBRACKET$1 ? 1 : 0;
		},
		consumeUntilLeftCurlyBracketOrSemicolon(code$1) {
			return code$1 === LEFTCURLYBRACKET$1 || code$1 === SEMICOLON ? 1 : 0;
		},
		consumeUntilExclamationMarkOrSemicolon(code$1) {
			return code$1 === EXCLAMATIONMARK$3 || code$1 === SEMICOLON ? 1 : 0;
		},
		consumeUntilSemicolonIncluded(code$1) {
			return code$1 === SEMICOLON ? 2 : 0;
		},
		createList() {
			return new List();
		},
		createSingleNodeList(node) {
			return new List().appendData(node);
		},
		getFirstListNode(list) {
			return list && list.first;
		},
		getLastListNode(list) {
			return list && list.last;
		},
		parseWithFallback(consumer, fallback) {
			const startIndex = this.tokenIndex;
			try {
				return consumer.call(this);
			} catch (e) {
				if (onParseErrorThrow) throw e;
				this.skip(startIndex - this.tokenIndex);
				const fallbackNode = fallback.call(this);
				onParseErrorThrow = true;
				onParseError(e, fallbackNode);
				onParseErrorThrow = false;
				return fallbackNode;
			}
		},
		lookupNonWSType(offset) {
			let type;
			do {
				type = this.lookupType(offset++);
				if (type !== WhiteSpace && type !== Comment) return type;
			} while (type !== NULL);
			return NULL;
		},
		charCodeAt(offset) {
			return offset >= 0 && offset < source.length ? source.charCodeAt(offset) : 0;
		},
		substring(offsetStart, offsetEnd) {
			return source.substring(offsetStart, offsetEnd);
		},
		substrToCursor(start) {
			return this.source.substring(start, this.tokenStart);
		},
		cmpChar(offset, charCode) {
			return cmpChar(source, offset, charCode);
		},
		cmpStr(offsetStart, offsetEnd, str) {
			return cmpStr(source, offsetStart, offsetEnd, str);
		},
		consume(tokenType$1) {
			const start = this.tokenStart;
			this.eat(tokenType$1);
			return this.substrToCursor(start);
		},
		consumeFunctionName() {
			const name$49 = source.substring(this.tokenStart, this.tokenEnd - 1);
			this.eat(Function);
			return name$49;
		},
		consumeNumber(type) {
			const number$1 = source.substring(this.tokenStart, consumeNumber(source, this.tokenStart));
			this.eat(type);
			return number$1;
		},
		eat(tokenType$1) {
			if (this.tokenType !== tokenType$1) {
				const tokenName = names_default[tokenType$1].slice(0, -6).replace(/-/g, " ").replace(/^./, (m) => m.toUpperCase());
				let message = `${/[[\](){}]/.test(tokenName) ? `"${tokenName}"` : tokenName} is expected`;
				let offset = this.tokenStart;
				switch (tokenType$1) {
					case Ident:
						if (this.tokenType === Function || this.tokenType === Url) {
							offset = this.tokenEnd - 1;
							message = "Identifier is expected but function found";
						} else message = "Identifier is expected";
						break;
					case Hash:
						if (this.isDelim(NUMBERSIGN$4)) {
							this.next();
							offset++;
							message = "Name is expected";
						}
						break;
					case Percentage:
						if (this.tokenType === Number$1) {
							offset = this.tokenEnd;
							message = "Percent sign is expected";
						}
						break;
				}
				this.error(message, offset);
			}
			this.next();
		},
		eatIdent(name$49) {
			if (this.tokenType !== Ident || this.lookupValue(0, name$49) === false) this.error(`Identifier "${name$49}" is expected`);
			this.next();
		},
		eatDelim(code$1) {
			if (!this.isDelim(code$1)) this.error(`Delim "${String.fromCharCode(code$1)}" is expected`);
			this.next();
		},
		getLocation(start, end) {
			if (needPositions) return locationMap.getLocationRange(start, end, filename);
			return null;
		},
		getLocationFromList(list) {
			if (needPositions) {
				const head = this.getFirstListNode(list);
				const tail = this.getLastListNode(list);
				return locationMap.getLocationRange(head !== null ? head.loc.start.offset - locationMap.startOffset : this.tokenStart, tail !== null ? tail.loc.end.offset - locationMap.startOffset : this.tokenStart, filename);
			}
			return null;
		},
		error(message, offset) {
			const location = typeof offset !== "undefined" && offset < source.length ? locationMap.getLocation(offset) : this.eof ? locationMap.getLocation(findWhiteSpaceStart(source, source.length - 1)) : locationMap.getLocation(this.tokenStart);
			throw new SyntaxError$2(message || "Unexpected input", source, location.offset, location.line, location.column, locationMap.startLine, locationMap.startColumn);
		}
	});
	const parse$51 = function(source_, options) {
		source = source_;
		options = options || {};
		parser.setSource(source, tokenize$1);
		locationMap.setSource(source, options.offset, options.line, options.column);
		filename = options.filename || "<unknown>";
		needPositions = Boolean(options.positions);
		onParseError = typeof options.onParseError === "function" ? options.onParseError : NOOP;
		onParseErrorThrow = false;
		parser.parseAtrulePrelude = "parseAtrulePrelude" in options ? Boolean(options.parseAtrulePrelude) : true;
		parser.parseRulePrelude = "parseRulePrelude" in options ? Boolean(options.parseRulePrelude) : true;
		parser.parseValue = "parseValue" in options ? Boolean(options.parseValue) : true;
		parser.parseCustomProperty = "parseCustomProperty" in options ? Boolean(options.parseCustomProperty) : false;
		const { context = "default", onComment } = options;
		if (context in parser.context === false) throw new Error("Unknown context `" + context + "`");
		if (typeof onComment === "function") parser.forEachToken((type, start, end) => {
			if (type === Comment) {
				const loc = parser.getLocation(start, end);
				onComment(cmpStr(source, end - 2, end, "*/") ? source.slice(start + 2, end - 2) : source.slice(start + 2, end), loc);
			}
		});
		const ast = parser.context[context].call(parser, options);
		if (!parser.eof) parser.error();
		return ast;
	};
	return Object.assign(parse$51, {
		SyntaxError: SyntaxError$2,
		config: parser.config
	});
}

//#endregion
//#region ../../node_modules/.pnpm/source-map-js@1.2.1/node_modules/source-map-js/lib/base64.js
var require_base64 = /* @__PURE__ */ __commonJS({ "../../node_modules/.pnpm/source-map-js@1.2.1/node_modules/source-map-js/lib/base64.js": ((exports) => {
	var intToCharMap = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split("");
	/**
	* Encode an integer in the range of 0 to 63 to a single base 64 digit.
	*/
	exports.encode = function(number$1) {
		if (0 <= number$1 && number$1 < intToCharMap.length) return intToCharMap[number$1];
		throw new TypeError("Must be between 0 and 63: " + number$1);
	};
	/**
	* Decode a single base 64 character code digit to an integer. Returns -1 on
	* failure.
	*/
	exports.decode = function(charCode) {
		var bigA = 65;
		var bigZ = 90;
		var littleA = 97;
		var littleZ = 122;
		var zero$1 = 48;
		var nine = 57;
		var plus = 43;
		var slash = 47;
		var littleOffset = 26;
		var numberOffset = 52;
		if (bigA <= charCode && charCode <= bigZ) return charCode - bigA;
		if (littleA <= charCode && charCode <= littleZ) return charCode - littleA + littleOffset;
		if (zero$1 <= charCode && charCode <= nine) return charCode - zero$1 + numberOffset;
		if (charCode == plus) return 62;
		if (charCode == slash) return 63;
		return -1;
	};
}) });

//#endregion
//#region ../../node_modules/.pnpm/source-map-js@1.2.1/node_modules/source-map-js/lib/base64-vlq.js
var require_base64_vlq = /* @__PURE__ */ __commonJS({ "../../node_modules/.pnpm/source-map-js@1.2.1/node_modules/source-map-js/lib/base64-vlq.js": ((exports) => {
	var base64 = require_base64();
	var VLQ_BASE_SHIFT = 5;
	var VLQ_BASE = 1 << VLQ_BASE_SHIFT;
	var VLQ_BASE_MASK = VLQ_BASE - 1;
	var VLQ_CONTINUATION_BIT = VLQ_BASE;
	/**
	* Converts from a two-complement value to a value where the sign bit is
	* placed in the least significant bit.  For example, as decimals:
	*   1 becomes 2 (10 binary), -1 becomes 3 (11 binary)
	*   2 becomes 4 (100 binary), -2 becomes 5 (101 binary)
	*/
	function toVLQSigned(aValue) {
		return aValue < 0 ? (-aValue << 1) + 1 : (aValue << 1) + 0;
	}
	/**
	* Converts to a two-complement value from a value where the sign bit is
	* placed in the least significant bit.  For example, as decimals:
	*   2 (10 binary) becomes 1, 3 (11 binary) becomes -1
	*   4 (100 binary) becomes 2, 5 (101 binary) becomes -2
	*/
	function fromVLQSigned(aValue) {
		var isNegative = (aValue & 1) === 1;
		var shifted = aValue >> 1;
		return isNegative ? -shifted : shifted;
	}
	/**
	* Returns the base 64 VLQ encoded value.
	*/
	exports.encode = function base64VLQ_encode(aValue) {
		var encoded = "";
		var digit;
		var vlq = toVLQSigned(aValue);
		do {
			digit = vlq & VLQ_BASE_MASK;
			vlq >>>= VLQ_BASE_SHIFT;
			if (vlq > 0) digit |= VLQ_CONTINUATION_BIT;
			encoded += base64.encode(digit);
		} while (vlq > 0);
		return encoded;
	};
	/**
	* Decodes the next base 64 VLQ value from the given string and returns the
	* value and the rest of the string via the out parameter.
	*/
	exports.decode = function base64VLQ_decode(aStr, aIndex, aOutParam) {
		var strLen = aStr.length;
		var result = 0;
		var shift = 0;
		var continuation, digit;
		do {
			if (aIndex >= strLen) throw new Error("Expected more digits in base 64 VLQ value.");
			digit = base64.decode(aStr.charCodeAt(aIndex++));
			if (digit === -1) throw new Error("Invalid base64 digit: " + aStr.charAt(aIndex - 1));
			continuation = !!(digit & VLQ_CONTINUATION_BIT);
			digit &= VLQ_BASE_MASK;
			result = result + (digit << shift);
			shift += VLQ_BASE_SHIFT;
		} while (continuation);
		aOutParam.value = fromVLQSigned(result);
		aOutParam.rest = aIndex;
	};
}) });

//#endregion
//#region ../../node_modules/.pnpm/source-map-js@1.2.1/node_modules/source-map-js/lib/util.js
var require_util = /* @__PURE__ */ __commonJS({ "../../node_modules/.pnpm/source-map-js@1.2.1/node_modules/source-map-js/lib/util.js": ((exports) => {
	/**
	* This is a helper function for getting values from parameter/options
	* objects.
	*
	* @param args The object we are extracting values from
	* @param name The name of the property we are getting.
	* @param defaultValue An optional value to return if the property is missing
	* from the object. If this is not specified and the property is missing, an
	* error will be thrown.
	*/
	function getArg(aArgs, aName, aDefaultValue) {
		if (aName in aArgs) return aArgs[aName];
		else if (arguments.length === 3) return aDefaultValue;
		else throw new Error("\"" + aName + "\" is a required argument.");
	}
	exports.getArg = getArg;
	var urlRegexp = /^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.-]*)(?::(\d+))?(.*)$/;
	var dataUrlRegexp = /^data:.+\,.+$/;
	function urlParse(aUrl) {
		var match = aUrl.match(urlRegexp);
		if (!match) return null;
		return {
			scheme: match[1],
			auth: match[2],
			host: match[3],
			port: match[4],
			path: match[5]
		};
	}
	exports.urlParse = urlParse;
	function urlGenerate(aParsedUrl) {
		var url = "";
		if (aParsedUrl.scheme) url += aParsedUrl.scheme + ":";
		url += "//";
		if (aParsedUrl.auth) url += aParsedUrl.auth + "@";
		if (aParsedUrl.host) url += aParsedUrl.host;
		if (aParsedUrl.port) url += ":" + aParsedUrl.port;
		if (aParsedUrl.path) url += aParsedUrl.path;
		return url;
	}
	exports.urlGenerate = urlGenerate;
	var MAX_CACHED_INPUTS = 32;
	/**
	* Takes some function `f(input) -> result` and returns a memoized version of
	* `f`.
	*
	* We keep at most `MAX_CACHED_INPUTS` memoized results of `f` alive. The
	* memoization is a dumb-simple, linear least-recently-used cache.
	*/
	function lruMemoize(f) {
		var cache = [];
		return function(input) {
			for (var i = 0; i < cache.length; i++) if (cache[i].input === input) {
				var temp = cache[0];
				cache[0] = cache[i];
				cache[i] = temp;
				return cache[0].result;
			}
			var result = f(input);
			cache.unshift({
				input,
				result
			});
			if (cache.length > MAX_CACHED_INPUTS) cache.pop();
			return result;
		};
	}
	/**
	* Normalizes a path, or the path portion of a URL:
	*
	* - Replaces consecutive slashes with one slash.
	* - Removes unnecessary '.' parts.
	* - Removes unnecessary '<dir>/..' parts.
	*
	* Based on code in the Node.js 'path' core module.
	*
	* @param aPath The path or url to normalize.
	*/
	var normalize = lruMemoize(function normalize$1(aPath) {
		var path = aPath;
		var url = urlParse(aPath);
		if (url) {
			if (!url.path) return aPath;
			path = url.path;
		}
		var isAbsolute = exports.isAbsolute(path);
		var parts = [];
		var start = 0;
		var i = 0;
		while (true) {
			start = i;
			i = path.indexOf("/", start);
			if (i === -1) {
				parts.push(path.slice(start));
				break;
			} else {
				parts.push(path.slice(start, i));
				while (i < path.length && path[i] === "/") i++;
			}
		}
		for (var part, up = 0, i = parts.length - 1; i >= 0; i--) {
			part = parts[i];
			if (part === ".") parts.splice(i, 1);
			else if (part === "..") up++;
			else if (up > 0) if (part === "") {
				parts.splice(i + 1, up);
				up = 0;
			} else {
				parts.splice(i, 2);
				up--;
			}
		}
		path = parts.join("/");
		if (path === "") path = isAbsolute ? "/" : ".";
		if (url) {
			url.path = path;
			return urlGenerate(url);
		}
		return path;
	});
	exports.normalize = normalize;
	/**
	* Joins two paths/URLs.
	*
	* @param aRoot The root path or URL.
	* @param aPath The path or URL to be joined with the root.
	*
	* - If aPath is a URL or a data URI, aPath is returned, unless aPath is a
	*   scheme-relative URL: Then the scheme of aRoot, if any, is prepended
	*   first.
	* - Otherwise aPath is a path. If aRoot is a URL, then its path portion
	*   is updated with the result and aRoot is returned. Otherwise the result
	*   is returned.
	*   - If aPath is absolute, the result is aPath.
	*   - Otherwise the two paths are joined with a slash.
	* - Joining for example 'http://' and 'www.example.com' is also supported.
	*/
	function join(aRoot, aPath) {
		if (aRoot === "") aRoot = ".";
		if (aPath === "") aPath = ".";
		var aPathUrl = urlParse(aPath);
		var aRootUrl = urlParse(aRoot);
		if (aRootUrl) aRoot = aRootUrl.path || "/";
		if (aPathUrl && !aPathUrl.scheme) {
			if (aRootUrl) aPathUrl.scheme = aRootUrl.scheme;
			return urlGenerate(aPathUrl);
		}
		if (aPathUrl || aPath.match(dataUrlRegexp)) return aPath;
		if (aRootUrl && !aRootUrl.host && !aRootUrl.path) {
			aRootUrl.host = aPath;
			return urlGenerate(aRootUrl);
		}
		var joined = aPath.charAt(0) === "/" ? aPath : normalize(aRoot.replace(/\/+$/, "") + "/" + aPath);
		if (aRootUrl) {
			aRootUrl.path = joined;
			return urlGenerate(aRootUrl);
		}
		return joined;
	}
	exports.join = join;
	exports.isAbsolute = function(aPath) {
		return aPath.charAt(0) === "/" || urlRegexp.test(aPath);
	};
	/**
	* Make a path relative to a URL or another path.
	*
	* @param aRoot The root path or URL.
	* @param aPath The path or URL to be made relative to aRoot.
	*/
	function relative(aRoot, aPath) {
		if (aRoot === "") aRoot = ".";
		aRoot = aRoot.replace(/\/$/, "");
		var level = 0;
		while (aPath.indexOf(aRoot + "/") !== 0) {
			var index = aRoot.lastIndexOf("/");
			if (index < 0) return aPath;
			aRoot = aRoot.slice(0, index);
			if (aRoot.match(/^([^\/]+:\/)?\/*$/)) return aPath;
			++level;
		}
		return Array(level + 1).join("../") + aPath.substr(aRoot.length + 1);
	}
	exports.relative = relative;
	var supportsNullProto = function() {
		return !("__proto__" in Object.create(null));
	}();
	function identity(s) {
		return s;
	}
	/**
	* Because behavior goes wacky when you set `__proto__` on objects, we
	* have to prefix all the strings in our set with an arbitrary character.
	*
	* See https://github.com/mozilla/source-map/pull/31 and
	* https://github.com/mozilla/source-map/issues/30
	*
	* @param String aStr
	*/
	function toSetString(aStr) {
		if (isProtoString(aStr)) return "$" + aStr;
		return aStr;
	}
	exports.toSetString = supportsNullProto ? identity : toSetString;
	function fromSetString(aStr) {
		if (isProtoString(aStr)) return aStr.slice(1);
		return aStr;
	}
	exports.fromSetString = supportsNullProto ? identity : fromSetString;
	function isProtoString(s) {
		if (!s) return false;
		var length$1 = s.length;
		if (length$1 < 9) return false;
		if (s.charCodeAt(length$1 - 1) !== 95 || s.charCodeAt(length$1 - 2) !== 95 || s.charCodeAt(length$1 - 3) !== 111 || s.charCodeAt(length$1 - 4) !== 116 || s.charCodeAt(length$1 - 5) !== 111 || s.charCodeAt(length$1 - 6) !== 114 || s.charCodeAt(length$1 - 7) !== 112 || s.charCodeAt(length$1 - 8) !== 95 || s.charCodeAt(length$1 - 9) !== 95) return false;
		for (var i = length$1 - 10; i >= 0; i--) if (s.charCodeAt(i) !== 36) return false;
		return true;
	}
	/**
	* Comparator between two mappings where the original positions are compared.
	*
	* Optionally pass in `true` as `onlyCompareGenerated` to consider two
	* mappings with the same original source/line/column, but different generated
	* line and column the same. Useful when searching for a mapping with a
	* stubbed out mapping.
	*/
	function compareByOriginalPositions(mappingA, mappingB, onlyCompareOriginal) {
		var cmp = strcmp(mappingA.source, mappingB.source);
		if (cmp !== 0) return cmp;
		cmp = mappingA.originalLine - mappingB.originalLine;
		if (cmp !== 0) return cmp;
		cmp = mappingA.originalColumn - mappingB.originalColumn;
		if (cmp !== 0 || onlyCompareOriginal) return cmp;
		cmp = mappingA.generatedColumn - mappingB.generatedColumn;
		if (cmp !== 0) return cmp;
		cmp = mappingA.generatedLine - mappingB.generatedLine;
		if (cmp !== 0) return cmp;
		return strcmp(mappingA.name, mappingB.name);
	}
	exports.compareByOriginalPositions = compareByOriginalPositions;
	function compareByOriginalPositionsNoSource(mappingA, mappingB, onlyCompareOriginal) {
		var cmp = mappingA.originalLine - mappingB.originalLine;
		if (cmp !== 0) return cmp;
		cmp = mappingA.originalColumn - mappingB.originalColumn;
		if (cmp !== 0 || onlyCompareOriginal) return cmp;
		cmp = mappingA.generatedColumn - mappingB.generatedColumn;
		if (cmp !== 0) return cmp;
		cmp = mappingA.generatedLine - mappingB.generatedLine;
		if (cmp !== 0) return cmp;
		return strcmp(mappingA.name, mappingB.name);
	}
	exports.compareByOriginalPositionsNoSource = compareByOriginalPositionsNoSource;
	/**
	* Comparator between two mappings with deflated source and name indices where
	* the generated positions are compared.
	*
	* Optionally pass in `true` as `onlyCompareGenerated` to consider two
	* mappings with the same generated line and column, but different
	* source/name/original line and column the same. Useful when searching for a
	* mapping with a stubbed out mapping.
	*/
	function compareByGeneratedPositionsDeflated(mappingA, mappingB, onlyCompareGenerated) {
		var cmp = mappingA.generatedLine - mappingB.generatedLine;
		if (cmp !== 0) return cmp;
		cmp = mappingA.generatedColumn - mappingB.generatedColumn;
		if (cmp !== 0 || onlyCompareGenerated) return cmp;
		cmp = strcmp(mappingA.source, mappingB.source);
		if (cmp !== 0) return cmp;
		cmp = mappingA.originalLine - mappingB.originalLine;
		if (cmp !== 0) return cmp;
		cmp = mappingA.originalColumn - mappingB.originalColumn;
		if (cmp !== 0) return cmp;
		return strcmp(mappingA.name, mappingB.name);
	}
	exports.compareByGeneratedPositionsDeflated = compareByGeneratedPositionsDeflated;
	function compareByGeneratedPositionsDeflatedNoLine(mappingA, mappingB, onlyCompareGenerated) {
		var cmp = mappingA.generatedColumn - mappingB.generatedColumn;
		if (cmp !== 0 || onlyCompareGenerated) return cmp;
		cmp = strcmp(mappingA.source, mappingB.source);
		if (cmp !== 0) return cmp;
		cmp = mappingA.originalLine - mappingB.originalLine;
		if (cmp !== 0) return cmp;
		cmp = mappingA.originalColumn - mappingB.originalColumn;
		if (cmp !== 0) return cmp;
		return strcmp(mappingA.name, mappingB.name);
	}
	exports.compareByGeneratedPositionsDeflatedNoLine = compareByGeneratedPositionsDeflatedNoLine;
	function strcmp(aStr1, aStr2) {
		if (aStr1 === aStr2) return 0;
		if (aStr1 === null) return 1;
		if (aStr2 === null) return -1;
		if (aStr1 > aStr2) return 1;
		return -1;
	}
	/**
	* Comparator between two mappings with inflated source and name strings where
	* the generated positions are compared.
	*/
	function compareByGeneratedPositionsInflated(mappingA, mappingB) {
		var cmp = mappingA.generatedLine - mappingB.generatedLine;
		if (cmp !== 0) return cmp;
		cmp = mappingA.generatedColumn - mappingB.generatedColumn;
		if (cmp !== 0) return cmp;
		cmp = strcmp(mappingA.source, mappingB.source);
		if (cmp !== 0) return cmp;
		cmp = mappingA.originalLine - mappingB.originalLine;
		if (cmp !== 0) return cmp;
		cmp = mappingA.originalColumn - mappingB.originalColumn;
		if (cmp !== 0) return cmp;
		return strcmp(mappingA.name, mappingB.name);
	}
	exports.compareByGeneratedPositionsInflated = compareByGeneratedPositionsInflated;
	/**
	* Strip any JSON XSSI avoidance prefix from the string (as documented
	* in the source maps specification), and then parse the string as
	* JSON.
	*/
	function parseSourceMapInput(str) {
		return JSON.parse(str.replace(/^\)]}'[^\n]*\n/, ""));
	}
	exports.parseSourceMapInput = parseSourceMapInput;
	/**
	* Compute the URL of a source given the the source root, the source's
	* URL, and the source map's URL.
	*/
	function computeSourceURL(sourceRoot, sourceURL, sourceMapURL) {
		sourceURL = sourceURL || "";
		if (sourceRoot) {
			if (sourceRoot[sourceRoot.length - 1] !== "/" && sourceURL[0] !== "/") sourceRoot += "/";
			sourceURL = sourceRoot + sourceURL;
		}
		if (sourceMapURL) {
			var parsed = urlParse(sourceMapURL);
			if (!parsed) throw new Error("sourceMapURL could not be parsed");
			if (parsed.path) {
				var index = parsed.path.lastIndexOf("/");
				if (index >= 0) parsed.path = parsed.path.substring(0, index + 1);
			}
			sourceURL = join(urlGenerate(parsed), sourceURL);
		}
		return normalize(sourceURL);
	}
	exports.computeSourceURL = computeSourceURL;
}) });

//#endregion
//#region ../../node_modules/.pnpm/source-map-js@1.2.1/node_modules/source-map-js/lib/array-set.js
var require_array_set = /* @__PURE__ */ __commonJS({ "../../node_modules/.pnpm/source-map-js@1.2.1/node_modules/source-map-js/lib/array-set.js": ((exports) => {
	var util$2 = require_util();
	var has = Object.prototype.hasOwnProperty;
	var hasNativeMap = typeof Map !== "undefined";
	/**
	* A data structure which is a combination of an array and a set. Adding a new
	* member is O(1), testing for membership is O(1), and finding the index of an
	* element is O(1). Removing elements from the set is not supported. Only
	* strings are supported for membership.
	*/
	function ArraySet$1() {
		this._array = [];
		this._set = hasNativeMap ? /* @__PURE__ */ new Map() : Object.create(null);
	}
	/**
	* Static method for creating ArraySet instances from an existing array.
	*/
	ArraySet$1.fromArray = function ArraySet_fromArray(aArray, aAllowDuplicates) {
		var set = new ArraySet$1();
		for (var i = 0, len = aArray.length; i < len; i++) set.add(aArray[i], aAllowDuplicates);
		return set;
	};
	/**
	* Return how many unique items are in this ArraySet. If duplicates have been
	* added, than those do not count towards the size.
	*
	* @returns Number
	*/
	ArraySet$1.prototype.size = function ArraySet_size() {
		return hasNativeMap ? this._set.size : Object.getOwnPropertyNames(this._set).length;
	};
	/**
	* Add the given string to this set.
	*
	* @param String aStr
	*/
	ArraySet$1.prototype.add = function ArraySet_add(aStr, aAllowDuplicates) {
		var sStr = hasNativeMap ? aStr : util$2.toSetString(aStr);
		var isDuplicate = hasNativeMap ? this.has(aStr) : has.call(this._set, sStr);
		var idx = this._array.length;
		if (!isDuplicate || aAllowDuplicates) this._array.push(aStr);
		if (!isDuplicate) if (hasNativeMap) this._set.set(aStr, idx);
		else this._set[sStr] = idx;
	};
	/**
	* Is the given string a member of this set?
	*
	* @param String aStr
	*/
	ArraySet$1.prototype.has = function ArraySet_has(aStr) {
		if (hasNativeMap) return this._set.has(aStr);
		else {
			var sStr = util$2.toSetString(aStr);
			return has.call(this._set, sStr);
		}
	};
	/**
	* What is the index of the given string in the array?
	*
	* @param String aStr
	*/
	ArraySet$1.prototype.indexOf = function ArraySet_indexOf(aStr) {
		if (hasNativeMap) {
			var idx = this._set.get(aStr);
			if (idx >= 0) return idx;
		} else {
			var sStr = util$2.toSetString(aStr);
			if (has.call(this._set, sStr)) return this._set[sStr];
		}
		throw new Error("\"" + aStr + "\" is not in the set.");
	};
	/**
	* What is the element at the given index?
	*
	* @param Number aIdx
	*/
	ArraySet$1.prototype.at = function ArraySet_at(aIdx) {
		if (aIdx >= 0 && aIdx < this._array.length) return this._array[aIdx];
		throw new Error("No element indexed by " + aIdx);
	};
	/**
	* Returns the array representation of this set (which has the proper indices
	* indicated by indexOf). Note that this is a copy of the internal array used
	* for storing the members so that no one can mess with internal state.
	*/
	ArraySet$1.prototype.toArray = function ArraySet_toArray() {
		return this._array.slice();
	};
	exports.ArraySet = ArraySet$1;
}) });

//#endregion
//#region ../../node_modules/.pnpm/source-map-js@1.2.1/node_modules/source-map-js/lib/mapping-list.js
var require_mapping_list = /* @__PURE__ */ __commonJS({ "../../node_modules/.pnpm/source-map-js@1.2.1/node_modules/source-map-js/lib/mapping-list.js": ((exports) => {
	var util$1 = require_util();
	/**
	* Determine whether mappingB is after mappingA with respect to generated
	* position.
	*/
	function generatedPositionAfter(mappingA, mappingB) {
		var lineA = mappingA.generatedLine;
		var lineB = mappingB.generatedLine;
		var columnA = mappingA.generatedColumn;
		var columnB = mappingB.generatedColumn;
		return lineB > lineA || lineB == lineA && columnB >= columnA || util$1.compareByGeneratedPositionsInflated(mappingA, mappingB) <= 0;
	}
	/**
	* A data structure to provide a sorted view of accumulated mappings in a
	* performance conscious manner. It trades a neglibable overhead in general
	* case for a large speedup in case of mappings being added in order.
	*/
	function MappingList$1() {
		this._array = [];
		this._sorted = true;
		this._last = {
			generatedLine: -1,
			generatedColumn: 0
		};
	}
	/**
	* Iterate through internal items. This method takes the same arguments that
	* `Array.prototype.forEach` takes.
	*
	* NOTE: The order of the mappings is NOT guaranteed.
	*/
	MappingList$1.prototype.unsortedForEach = function MappingList_forEach(aCallback, aThisArg) {
		this._array.forEach(aCallback, aThisArg);
	};
	/**
	* Add the given source mapping.
	*
	* @param Object aMapping
	*/
	MappingList$1.prototype.add = function MappingList_add(aMapping) {
		if (generatedPositionAfter(this._last, aMapping)) {
			this._last = aMapping;
			this._array.push(aMapping);
		} else {
			this._sorted = false;
			this._array.push(aMapping);
		}
	};
	/**
	* Returns the flat, sorted array of mappings. The mappings are sorted by
	* generated position.
	*
	* WARNING: This method returns internal data without copying, for
	* performance. The return value must NOT be mutated, and should be treated as
	* an immutable borrow. If you want to take ownership, you must make your own
	* copy.
	*/
	MappingList$1.prototype.toArray = function MappingList_toArray() {
		if (!this._sorted) {
			this._array.sort(util$1.compareByGeneratedPositionsInflated);
			this._sorted = true;
		}
		return this._array;
	};
	exports.MappingList = MappingList$1;
}) });

//#endregion
//#region ../../node_modules/.pnpm/source-map-js@1.2.1/node_modules/source-map-js/lib/source-map-generator.js
var require_source_map_generator = /* @__PURE__ */ __commonJS({ "../../node_modules/.pnpm/source-map-js@1.2.1/node_modules/source-map-js/lib/source-map-generator.js": ((exports) => {
	var base64VLQ = require_base64_vlq();
	var util = require_util();
	var ArraySet = require_array_set().ArraySet;
	var MappingList = require_mapping_list().MappingList;
	/**
	* An instance of the SourceMapGenerator represents a source map which is
	* being built incrementally. You may pass an object with the following
	* properties:
	*
	*   - file: The filename of the generated source.
	*   - sourceRoot: A root for all relative URLs in this source map.
	*/
	function SourceMapGenerator$1(aArgs) {
		if (!aArgs) aArgs = {};
		this._file = util.getArg(aArgs, "file", null);
		this._sourceRoot = util.getArg(aArgs, "sourceRoot", null);
		this._skipValidation = util.getArg(aArgs, "skipValidation", false);
		this._ignoreInvalidMapping = util.getArg(aArgs, "ignoreInvalidMapping", false);
		this._sources = new ArraySet();
		this._names = new ArraySet();
		this._mappings = new MappingList();
		this._sourcesContents = null;
	}
	SourceMapGenerator$1.prototype._version = 3;
	/**
	* Creates a new SourceMapGenerator based on a SourceMapConsumer
	*
	* @param aSourceMapConsumer The SourceMap.
	*/
	SourceMapGenerator$1.fromSourceMap = function SourceMapGenerator_fromSourceMap(aSourceMapConsumer, generatorOps) {
		var sourceRoot = aSourceMapConsumer.sourceRoot;
		var generator = new SourceMapGenerator$1(Object.assign(generatorOps || {}, {
			file: aSourceMapConsumer.file,
			sourceRoot
		}));
		aSourceMapConsumer.eachMapping(function(mapping) {
			var newMapping = { generated: {
				line: mapping.generatedLine,
				column: mapping.generatedColumn
			} };
			if (mapping.source != null) {
				newMapping.source = mapping.source;
				if (sourceRoot != null) newMapping.source = util.relative(sourceRoot, newMapping.source);
				newMapping.original = {
					line: mapping.originalLine,
					column: mapping.originalColumn
				};
				if (mapping.name != null) newMapping.name = mapping.name;
			}
			generator.addMapping(newMapping);
		});
		aSourceMapConsumer.sources.forEach(function(sourceFile) {
			var sourceRelative = sourceFile;
			if (sourceRoot !== null) sourceRelative = util.relative(sourceRoot, sourceFile);
			if (!generator._sources.has(sourceRelative)) generator._sources.add(sourceRelative);
			var content = aSourceMapConsumer.sourceContentFor(sourceFile);
			if (content != null) generator.setSourceContent(sourceFile, content);
		});
		return generator;
	};
	/**
	* Add a single mapping from original source line and column to the generated
	* source's line and column for this source map being created. The mapping
	* object should have the following properties:
	*
	*   - generated: An object with the generated line and column positions.
	*   - original: An object with the original line and column positions.
	*   - source: The original source file (relative to the sourceRoot).
	*   - name: An optional original token name for this mapping.
	*/
	SourceMapGenerator$1.prototype.addMapping = function SourceMapGenerator_addMapping(aArgs) {
		var generated = util.getArg(aArgs, "generated");
		var original = util.getArg(aArgs, "original", null);
		var source = util.getArg(aArgs, "source", null);
		var name$49 = util.getArg(aArgs, "name", null);
		if (!this._skipValidation) {
			if (this._validateMapping(generated, original, source, name$49) === false) return;
		}
		if (source != null) {
			source = String(source);
			if (!this._sources.has(source)) this._sources.add(source);
		}
		if (name$49 != null) {
			name$49 = String(name$49);
			if (!this._names.has(name$49)) this._names.add(name$49);
		}
		this._mappings.add({
			generatedLine: generated.line,
			generatedColumn: generated.column,
			originalLine: original != null && original.line,
			originalColumn: original != null && original.column,
			source,
			name: name$49
		});
	};
	/**
	* Set the source content for a source file.
	*/
	SourceMapGenerator$1.prototype.setSourceContent = function SourceMapGenerator_setSourceContent(aSourceFile, aSourceContent) {
		var source = aSourceFile;
		if (this._sourceRoot != null) source = util.relative(this._sourceRoot, source);
		if (aSourceContent != null) {
			if (!this._sourcesContents) this._sourcesContents = Object.create(null);
			this._sourcesContents[util.toSetString(source)] = aSourceContent;
		} else if (this._sourcesContents) {
			delete this._sourcesContents[util.toSetString(source)];
			if (Object.keys(this._sourcesContents).length === 0) this._sourcesContents = null;
		}
	};
	/**
	* Applies the mappings of a sub-source-map for a specific source file to the
	* source map being generated. Each mapping to the supplied source file is
	* rewritten using the supplied source map. Note: The resolution for the
	* resulting mappings is the minimium of this map and the supplied map.
	*
	* @param aSourceMapConsumer The source map to be applied.
	* @param aSourceFile Optional. The filename of the source file.
	*        If omitted, SourceMapConsumer's file property will be used.
	* @param aSourceMapPath Optional. The dirname of the path to the source map
	*        to be applied. If relative, it is relative to the SourceMapConsumer.
	*        This parameter is needed when the two source maps aren't in the same
	*        directory, and the source map to be applied contains relative source
	*        paths. If so, those relative source paths need to be rewritten
	*        relative to the SourceMapGenerator.
	*/
	SourceMapGenerator$1.prototype.applySourceMap = function SourceMapGenerator_applySourceMap(aSourceMapConsumer, aSourceFile, aSourceMapPath) {
		var sourceFile = aSourceFile;
		if (aSourceFile == null) {
			if (aSourceMapConsumer.file == null) throw new Error("SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, or the source map's \"file\" property. Both were omitted.");
			sourceFile = aSourceMapConsumer.file;
		}
		var sourceRoot = this._sourceRoot;
		if (sourceRoot != null) sourceFile = util.relative(sourceRoot, sourceFile);
		var newSources = new ArraySet();
		var newNames = new ArraySet();
		this._mappings.unsortedForEach(function(mapping) {
			if (mapping.source === sourceFile && mapping.originalLine != null) {
				var original = aSourceMapConsumer.originalPositionFor({
					line: mapping.originalLine,
					column: mapping.originalColumn
				});
				if (original.source != null) {
					mapping.source = original.source;
					if (aSourceMapPath != null) mapping.source = util.join(aSourceMapPath, mapping.source);
					if (sourceRoot != null) mapping.source = util.relative(sourceRoot, mapping.source);
					mapping.originalLine = original.line;
					mapping.originalColumn = original.column;
					if (original.name != null) mapping.name = original.name;
				}
			}
			var source = mapping.source;
			if (source != null && !newSources.has(source)) newSources.add(source);
			var name$49 = mapping.name;
			if (name$49 != null && !newNames.has(name$49)) newNames.add(name$49);
		}, this);
		this._sources = newSources;
		this._names = newNames;
		aSourceMapConsumer.sources.forEach(function(sourceFile$1) {
			var content = aSourceMapConsumer.sourceContentFor(sourceFile$1);
			if (content != null) {
				if (aSourceMapPath != null) sourceFile$1 = util.join(aSourceMapPath, sourceFile$1);
				if (sourceRoot != null) sourceFile$1 = util.relative(sourceRoot, sourceFile$1);
				this.setSourceContent(sourceFile$1, content);
			}
		}, this);
	};
	/**
	* A mapping can have one of the three levels of data:
	*
	*   1. Just the generated position.
	*   2. The Generated position, original position, and original source.
	*   3. Generated and original position, original source, as well as a name
	*      token.
	*
	* To maintain consistency, we validate that any new mapping being added falls
	* in to one of these categories.
	*/
	SourceMapGenerator$1.prototype._validateMapping = function SourceMapGenerator_validateMapping(aGenerated, aOriginal, aSource, aName) {
		if (aOriginal && typeof aOriginal.line !== "number" && typeof aOriginal.column !== "number") {
			var message = "original.line and original.column are not numbers -- you probably meant to omit the original mapping entirely and only map the generated position. If so, pass null for the original mapping instead of an object with empty or null values.";
			if (this._ignoreInvalidMapping) {
				if (typeof console !== "undefined" && console.warn) console.warn(message);
				return false;
			} else throw new Error(message);
		}
		if (aGenerated && "line" in aGenerated && "column" in aGenerated && aGenerated.line > 0 && aGenerated.column >= 0 && !aOriginal && !aSource && !aName) return;
		else if (aGenerated && "line" in aGenerated && "column" in aGenerated && aOriginal && "line" in aOriginal && "column" in aOriginal && aGenerated.line > 0 && aGenerated.column >= 0 && aOriginal.line > 0 && aOriginal.column >= 0 && aSource) return;
		else {
			var message = "Invalid mapping: " + JSON.stringify({
				generated: aGenerated,
				source: aSource,
				original: aOriginal,
				name: aName
			});
			if (this._ignoreInvalidMapping) {
				if (typeof console !== "undefined" && console.warn) console.warn(message);
				return false;
			} else throw new Error(message);
		}
	};
	/**
	* Serialize the accumulated mappings in to the stream of base 64 VLQs
	* specified by the source map format.
	*/
	SourceMapGenerator$1.prototype._serializeMappings = function SourceMapGenerator_serializeMappings() {
		var previousGeneratedColumn = 0;
		var previousGeneratedLine = 1;
		var previousOriginalColumn = 0;
		var previousOriginalLine = 0;
		var previousName = 0;
		var previousSource = 0;
		var result = "";
		var next;
		var mapping;
		var nameIdx;
		var sourceIdx;
		var mappings = this._mappings.toArray();
		for (var i = 0, len = mappings.length; i < len; i++) {
			mapping = mappings[i];
			next = "";
			if (mapping.generatedLine !== previousGeneratedLine) {
				previousGeneratedColumn = 0;
				while (mapping.generatedLine !== previousGeneratedLine) {
					next += ";";
					previousGeneratedLine++;
				}
			} else if (i > 0) {
				if (!util.compareByGeneratedPositionsInflated(mapping, mappings[i - 1])) continue;
				next += ",";
			}
			next += base64VLQ.encode(mapping.generatedColumn - previousGeneratedColumn);
			previousGeneratedColumn = mapping.generatedColumn;
			if (mapping.source != null) {
				sourceIdx = this._sources.indexOf(mapping.source);
				next += base64VLQ.encode(sourceIdx - previousSource);
				previousSource = sourceIdx;
				next += base64VLQ.encode(mapping.originalLine - 1 - previousOriginalLine);
				previousOriginalLine = mapping.originalLine - 1;
				next += base64VLQ.encode(mapping.originalColumn - previousOriginalColumn);
				previousOriginalColumn = mapping.originalColumn;
				if (mapping.name != null) {
					nameIdx = this._names.indexOf(mapping.name);
					next += base64VLQ.encode(nameIdx - previousName);
					previousName = nameIdx;
				}
			}
			result += next;
		}
		return result;
	};
	SourceMapGenerator$1.prototype._generateSourcesContent = function SourceMapGenerator_generateSourcesContent(aSources, aSourceRoot) {
		return aSources.map(function(source) {
			if (!this._sourcesContents) return null;
			if (aSourceRoot != null) source = util.relative(aSourceRoot, source);
			var key = util.toSetString(source);
			return Object.prototype.hasOwnProperty.call(this._sourcesContents, key) ? this._sourcesContents[key] : null;
		}, this);
	};
	/**
	* Externalize the source map.
	*/
	SourceMapGenerator$1.prototype.toJSON = function SourceMapGenerator_toJSON() {
		var map = {
			version: this._version,
			sources: this._sources.toArray(),
			names: this._names.toArray(),
			mappings: this._serializeMappings()
		};
		if (this._file != null) map.file = this._file;
		if (this._sourceRoot != null) map.sourceRoot = this._sourceRoot;
		if (this._sourcesContents) map.sourcesContent = this._generateSourcesContent(map.sources, map.sourceRoot);
		return map;
	};
	/**
	* Render the source map being generated to a string.
	*/
	SourceMapGenerator$1.prototype.toString = function SourceMapGenerator_toString() {
		return JSON.stringify(this.toJSON());
	};
	exports.SourceMapGenerator = SourceMapGenerator$1;
}) });

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/generator/sourceMap.js
var import_source_map_generator = /* @__PURE__ */ __toESM(require_source_map_generator(), 1);
const trackNodes = new Set([
	"Atrule",
	"Selector",
	"Declaration"
]);
function generateSourceMap(handlers) {
	const map = new import_source_map_generator.SourceMapGenerator();
	const generated = {
		line: 1,
		column: 0
	};
	const original = {
		line: 0,
		column: 0
	};
	const activatedGenerated = {
		line: 1,
		column: 0
	};
	const activatedMapping = { generated: activatedGenerated };
	let line = 1;
	let column = 0;
	let sourceMappingActive = false;
	const origHandlersNode = handlers.node;
	handlers.node = function(node) {
		if (node.loc && node.loc.start && trackNodes.has(node.type)) {
			const nodeLine = node.loc.start.line;
			const nodeColumn = node.loc.start.column - 1;
			if (original.line !== nodeLine || original.column !== nodeColumn) {
				original.line = nodeLine;
				original.column = nodeColumn;
				generated.line = line;
				generated.column = column;
				if (sourceMappingActive) {
					sourceMappingActive = false;
					if (generated.line !== activatedGenerated.line || generated.column !== activatedGenerated.column) map.addMapping(activatedMapping);
				}
				sourceMappingActive = true;
				map.addMapping({
					source: node.loc.source,
					original,
					generated
				});
			}
		}
		origHandlersNode.call(this, node);
		if (sourceMappingActive && trackNodes.has(node.type)) {
			activatedGenerated.line = line;
			activatedGenerated.column = column;
		}
	};
	const origHandlersEmit = handlers.emit;
	handlers.emit = function(value, type, auto) {
		for (let i = 0; i < value.length; i++) if (value.charCodeAt(i) === 10) {
			line++;
			column = 0;
		} else column++;
		origHandlersEmit(value, type, auto);
	};
	const origHandlersResult = handlers.result;
	handlers.result = function() {
		if (sourceMappingActive) map.addMapping(activatedMapping);
		return {
			css: origHandlersResult(),
			map
		};
	};
	return handlers;
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/generator/token-before.js
var token_before_exports = /* @__PURE__ */ __export({
	safe: () => safe,
	spec: () => spec
});
const PLUSSIGN$9 = 43;
const HYPHENMINUS$6 = 45;
const code = (type, value) => {
	if (type === Delim) type = value;
	if (typeof type === "string") {
		const charCode = type.charCodeAt(0);
		return charCode > 127 ? 32768 : charCode << 8;
	}
	return type;
};
const specPairs = [
	[Ident, Ident],
	[Ident, Function],
	[Ident, Url],
	[Ident, BadUrl],
	[Ident, "-"],
	[Ident, Number$1],
	[Ident, Percentage],
	[Ident, Dimension],
	[Ident, CDC],
	[Ident, LeftParenthesis],
	[AtKeyword, Ident],
	[AtKeyword, Function],
	[AtKeyword, Url],
	[AtKeyword, BadUrl],
	[AtKeyword, "-"],
	[AtKeyword, Number$1],
	[AtKeyword, Percentage],
	[AtKeyword, Dimension],
	[AtKeyword, CDC],
	[Hash, Ident],
	[Hash, Function],
	[Hash, Url],
	[Hash, BadUrl],
	[Hash, "-"],
	[Hash, Number$1],
	[Hash, Percentage],
	[Hash, Dimension],
	[Hash, CDC],
	[Dimension, Ident],
	[Dimension, Function],
	[Dimension, Url],
	[Dimension, BadUrl],
	[Dimension, "-"],
	[Dimension, Number$1],
	[Dimension, Percentage],
	[Dimension, Dimension],
	[Dimension, CDC],
	["#", Ident],
	["#", Function],
	["#", Url],
	["#", BadUrl],
	["#", "-"],
	["#", Number$1],
	["#", Percentage],
	["#", Dimension],
	["#", CDC],
	["-", Ident],
	["-", Function],
	["-", Url],
	["-", BadUrl],
	["-", "-"],
	["-", Number$1],
	["-", Percentage],
	["-", Dimension],
	["-", CDC],
	[Number$1, Ident],
	[Number$1, Function],
	[Number$1, Url],
	[Number$1, BadUrl],
	[Number$1, Number$1],
	[Number$1, Percentage],
	[Number$1, Dimension],
	[Number$1, "%"],
	[Number$1, CDC],
	["@", Ident],
	["@", Function],
	["@", Url],
	["@", BadUrl],
	["@", "-"],
	["@", CDC],
	[".", Number$1],
	[".", Percentage],
	[".", Dimension],
	["+", Number$1],
	["+", Percentage],
	["+", Dimension],
	["/", "*"]
];
const safePairs = specPairs.concat([
	[Ident, Hash],
	[Dimension, Hash],
	[Hash, Hash],
	[AtKeyword, LeftParenthesis],
	[AtKeyword, String$1],
	[AtKeyword, Colon],
	[Percentage, Percentage],
	[Percentage, Dimension],
	[Percentage, Function],
	[Percentage, "-"],
	[RightParenthesis, Ident],
	[RightParenthesis, Function],
	[RightParenthesis, Percentage],
	[RightParenthesis, Dimension],
	[RightParenthesis, Hash],
	[RightParenthesis, "-"]
]);
function createMap(pairs) {
	const isWhiteSpaceRequired = new Set(pairs.map(([prev, next]) => code(prev) << 16 | code(next)));
	return function(prevCode, type, value) {
		const nextCode = code(type, value);
		const nextCharCode = value.charCodeAt(0);
		if (nextCharCode === HYPHENMINUS$6 && type !== Ident && type !== Function && type !== CDC || nextCharCode === PLUSSIGN$9 ? isWhiteSpaceRequired.has(prevCode << 16 | nextCharCode << 8) : isWhiteSpaceRequired.has(prevCode << 16 | nextCode)) this.emit(" ", WhiteSpace, true);
		return nextCode;
	};
}
const spec = createMap(specPairs);
const safe = createMap(safePairs);

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/generator/create.js
const REVERSESOLIDUS = 92;
function processChildren(node, delimeter) {
	if (typeof delimeter === "function") {
		let prev = null;
		node.children.forEach((node$1) => {
			if (prev !== null) delimeter.call(this, prev);
			this.node(node$1);
			prev = node$1;
		});
		return;
	}
	node.children.forEach(this.node, this);
}
function processChunk(chunk) {
	tokenize$1(chunk, (type, start, end) => {
		this.token(type, chunk.slice(start, end));
	});
}
function createGenerator(config) {
	const types = /* @__PURE__ */ new Map();
	for (let [name$49, item] of Object.entries(config.node)) if (typeof (item.generate || item) === "function") types.set(name$49, item.generate || item);
	return function(node, options) {
		let buffer = "";
		let prevCode = 0;
		let handlers = {
			node(node$1) {
				if (types.has(node$1.type)) types.get(node$1.type).call(publicApi, node$1);
				else throw new Error("Unknown node type: " + node$1.type);
			},
			tokenBefore: safe,
			token(type, value) {
				prevCode = this.tokenBefore(prevCode, type, value);
				this.emit(value, type, false);
				if (type === Delim && value.charCodeAt(0) === REVERSESOLIDUS) this.emit("\n", WhiteSpace, true);
			},
			emit(value) {
				buffer += value;
			},
			result() {
				return buffer;
			}
		};
		if (options) {
			if (typeof options.decorator === "function") handlers = options.decorator(handlers);
			if (options.sourceMap) handlers = generateSourceMap(handlers);
			if (options.mode in token_before_exports) handlers.tokenBefore = token_before_exports[options.mode];
		}
		const publicApi = {
			node: (node$1) => handlers.node(node$1),
			children: processChildren,
			token: (type, value) => handlers.token(type, value),
			tokenize: processChunk
		};
		handlers.node(node);
		return handlers.result();
	};
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/convertor/create.js
function createConvertor(walk$2) {
	return {
		fromPlainObject(ast) {
			walk$2(ast, { enter(node) {
				if (node.children && node.children instanceof List === false) node.children = new List().fromArray(node.children);
			} });
			return ast;
		},
		toPlainObject(ast) {
			walk$2(ast, { leave(node) {
				if (node.children && node.children instanceof List) node.children = node.children.toArray();
			} });
			return ast;
		}
	};
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/walker/create.js
const { hasOwnProperty: hasOwnProperty$3 } = Object.prototype;
const noop$2 = function() {};
function ensureFunction$1(value) {
	return typeof value === "function" ? value : noop$2;
}
function invokeForType(fn, type) {
	return function(node, item, list) {
		if (node.type === type) fn.call(this, node, item, list);
	};
}
function getWalkersFromStructure(name$49, nodeType) {
	const structure$49 = nodeType.structure;
	const walkers = [];
	for (const key in structure$49) {
		if (hasOwnProperty$3.call(structure$49, key) === false) continue;
		let fieldTypes = structure$49[key];
		const walker = {
			name: key,
			type: false,
			nullable: false
		};
		if (!Array.isArray(fieldTypes)) fieldTypes = [fieldTypes];
		for (const fieldType of fieldTypes) if (fieldType === null) walker.nullable = true;
		else if (typeof fieldType === "string") walker.type = "node";
		else if (Array.isArray(fieldType)) walker.type = "list";
		if (walker.type) walkers.push(walker);
	}
	if (walkers.length) return {
		context: nodeType.walkContext,
		fields: walkers
	};
	return null;
}
function getTypesFromConfig(config) {
	const types = {};
	for (const name$49 in config.node) if (hasOwnProperty$3.call(config.node, name$49)) {
		const nodeType = config.node[name$49];
		if (!nodeType.structure) throw new Error("Missed `structure` field in `" + name$49 + "` node type definition");
		types[name$49] = getWalkersFromStructure(name$49, nodeType);
	}
	return types;
}
function createTypeIterator(config, reverse) {
	const fields = config.fields.slice();
	const contextName = config.context;
	const useContext = typeof contextName === "string";
	if (reverse) fields.reverse();
	return function(node, context, walk$2, walkReducer) {
		let prevContextValue;
		if (useContext) {
			prevContextValue = context[contextName];
			context[contextName] = node;
		}
		for (const field of fields) {
			const ref = node[field.name];
			if (!field.nullable || ref) {
				if (field.type === "list") {
					if (reverse ? ref.reduceRight(walkReducer, false) : ref.reduce(walkReducer, false)) return true;
				} else if (walk$2(ref)) return true;
			}
		}
		if (useContext) context[contextName] = prevContextValue;
	};
}
function createFastTraveralMap({ StyleSheet, Atrule, Rule, Block, DeclarationList }) {
	return {
		Atrule: {
			StyleSheet,
			Atrule,
			Rule,
			Block
		},
		Rule: {
			StyleSheet,
			Atrule,
			Rule,
			Block
		},
		Declaration: {
			StyleSheet,
			Atrule,
			Rule,
			Block,
			DeclarationList
		}
	};
}
function createWalker(config) {
	const types = getTypesFromConfig(config);
	const iteratorsNatural = {};
	const iteratorsReverse = {};
	const breakWalk = Symbol("break-walk");
	const skipNode = Symbol("skip-node");
	for (const name$49 in types) if (hasOwnProperty$3.call(types, name$49) && types[name$49] !== null) {
		iteratorsNatural[name$49] = createTypeIterator(types[name$49], false);
		iteratorsReverse[name$49] = createTypeIterator(types[name$49], true);
	}
	const fastTraversalIteratorsNatural = createFastTraveralMap(iteratorsNatural);
	const fastTraversalIteratorsReverse = createFastTraveralMap(iteratorsReverse);
	const walk$2 = function(root, options) {
		function walkNode(node, item, list) {
			const enterRet = enter.call(context, node, item, list);
			if (enterRet === breakWalk) return true;
			if (enterRet === skipNode) return false;
			if (iterators.hasOwnProperty(node.type)) {
				if (iterators[node.type](node, context, walkNode, walkReducer)) return true;
			}
			if (leave.call(context, node, item, list) === breakWalk) return true;
			return false;
		}
		let enter = noop$2;
		let leave = noop$2;
		let iterators = iteratorsNatural;
		let walkReducer = (ret, data, item, list) => ret || walkNode(data, item, list);
		const context = {
			break: breakWalk,
			skip: skipNode,
			root,
			stylesheet: null,
			atrule: null,
			atrulePrelude: null,
			rule: null,
			selector: null,
			block: null,
			declaration: null,
			function: null
		};
		if (typeof options === "function") enter = options;
		else if (options) {
			enter = ensureFunction$1(options.enter);
			leave = ensureFunction$1(options.leave);
			if (options.reverse) iterators = iteratorsReverse;
			if (options.visit) {
				if (fastTraversalIteratorsNatural.hasOwnProperty(options.visit)) iterators = options.reverse ? fastTraversalIteratorsReverse[options.visit] : fastTraversalIteratorsNatural[options.visit];
				else if (!types.hasOwnProperty(options.visit)) throw new Error("Bad value `" + options.visit + "` for `visit` option (should be: " + Object.keys(types).sort().join(", ") + ")");
				enter = invokeForType(enter, options.visit);
				leave = invokeForType(leave, options.visit);
			}
		}
		if (enter === noop$2 && leave === noop$2) throw new Error("Neither `enter` nor `leave` walker handler is set or both aren't a function");
		walkNode(root);
	};
	walk$2.break = breakWalk;
	walk$2.skip = skipNode;
	walk$2.find = function(ast, fn) {
		let found = null;
		walk$2(ast, function(node, item, list) {
			if (fn.call(this, node, item, list)) {
				found = node;
				return breakWalk;
			}
		});
		return found;
	};
	walk$2.findLast = function(ast, fn) {
		let found = null;
		walk$2(ast, {
			reverse: true,
			enter(node, item, list) {
				if (fn.call(this, node, item, list)) {
					found = node;
					return breakWalk;
				}
			}
		});
		return found;
	};
	walk$2.findAll = function(ast, fn) {
		const found = [];
		walk$2(ast, function(node, item, list) {
			if (fn.call(this, node, item, list)) found.push(node);
		});
		return found;
	};
	return walk$2;
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/definition-syntax/generate.js
function noop$1(value) {
	return value;
}
function generateMultiplier(multiplier) {
	const { min, max, comma } = multiplier;
	if (min === 0 && max === 0) return comma ? "#?" : "*";
	if (min === 0 && max === 1) return "?";
	if (min === 1 && max === 0) return comma ? "#" : "+";
	if (min === 1 && max === 1) return "";
	return (comma ? "#" : "") + (min === max ? "{" + min + "}" : "{" + min + "," + (max !== 0 ? max : "") + "}");
}
function generateTypeOpts(node) {
	switch (node.type) {
		case "Range": return " [" + (node.min === null ? "-∞" : node.min) + "," + (node.max === null ? "∞" : node.max) + "]";
		default: throw new Error("Unknown node type `" + node.type + "`");
	}
}
function generateSequence(node, decorate, forceBraces, compact) {
	const combinator = node.combinator === " " || compact ? node.combinator : " " + node.combinator + " ";
	const result = node.terms.map((term) => internalGenerate(term, decorate, forceBraces, compact)).join(combinator);
	if (node.explicit || forceBraces) return (compact || result[0] === "," ? "[" : "[ ") + result + (compact ? "]" : " ]");
	return result;
}
function internalGenerate(node, decorate, forceBraces, compact) {
	let result;
	switch (node.type) {
		case "Group":
			result = generateSequence(node, decorate, forceBraces, compact) + (node.disallowEmpty ? "!" : "");
			break;
		case "Multiplier": return internalGenerate(node.term, decorate, forceBraces, compact) + decorate(generateMultiplier(node), node);
		case "Boolean":
			result = "<boolean-expr[" + internalGenerate(node.term, decorate, forceBraces, compact) + "]>";
			break;
		case "Type":
			result = "<" + node.name + (node.opts ? decorate(generateTypeOpts(node.opts), node.opts) : "") + ">";
			break;
		case "Property":
			result = "<'" + node.name + "'>";
			break;
		case "Keyword":
			result = node.name;
			break;
		case "AtKeyword":
			result = "@" + node.name;
			break;
		case "Function":
			result = node.name + "(";
			break;
		case "String":
		case "Token":
			result = node.value;
			break;
		case "Comma":
			result = ",";
			break;
		default: throw new Error("Unknown node type `" + node.type + "`");
	}
	return decorate(result, node);
}
function generate$50(node, options) {
	let decorate = noop$1;
	let forceBraces = false;
	let compact = false;
	if (typeof options === "function") decorate = options;
	else if (options) {
		forceBraces = Boolean(options.forceBraces);
		compact = Boolean(options.compact);
		if (typeof options.decorate === "function") decorate = options.decorate;
	}
	return internalGenerate(node, decorate, forceBraces, compact);
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/lexer/error.js
const defaultLoc = {
	offset: 0,
	line: 1,
	column: 1
};
function locateMismatch(matchResult, node) {
	const tokens = matchResult.tokens;
	const longestMatch = matchResult.longestMatch;
	const mismatchNode = longestMatch < tokens.length ? tokens[longestMatch].node || null : null;
	const badNode = mismatchNode !== node ? mismatchNode : null;
	let mismatchOffset = 0;
	let mismatchLength = 0;
	let entries = 0;
	let css$4 = "";
	let start;
	let end;
	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i].value;
		if (i === longestMatch) {
			mismatchLength = token.length;
			mismatchOffset = css$4.length;
		}
		if (badNode !== null && tokens[i].node === badNode) if (i <= longestMatch) entries++;
		else entries = 0;
		css$4 += token;
	}
	if (longestMatch === tokens.length || entries > 1) {
		start = fromLoc(badNode || node, "end") || buildLoc(defaultLoc, css$4);
		end = buildLoc(start);
	} else {
		start = fromLoc(badNode, "start") || buildLoc(fromLoc(node, "start") || defaultLoc, css$4.slice(0, mismatchOffset));
		end = fromLoc(badNode, "end") || buildLoc(start, css$4.substr(mismatchOffset, mismatchLength));
	}
	return {
		css: css$4,
		mismatchOffset,
		mismatchLength,
		start,
		end
	};
}
function fromLoc(node, point) {
	const value = node && node.loc && node.loc[point];
	if (value) return "line" in value ? buildLoc(value) : value;
	return null;
}
function buildLoc({ offset, line, column }, extra) {
	const loc = {
		offset,
		line,
		column
	};
	if (extra) {
		const lines = extra.split(/\n|\r\n?|\f/);
		loc.offset += extra.length;
		loc.line += lines.length - 1;
		loc.column = lines.length === 1 ? loc.column + extra.length : lines.pop().length + 1;
	}
	return loc;
}
const SyntaxReferenceError = function(type, referenceName) {
	const error = createCustomError("SyntaxReferenceError", type + (referenceName ? " `" + referenceName + "`" : ""));
	error.reference = referenceName;
	return error;
};
const SyntaxMatchError = function(message, syntax, node, matchResult) {
	const error = createCustomError("SyntaxMatchError", message);
	const { css: css$4, mismatchOffset, mismatchLength, start, end } = locateMismatch(matchResult, node);
	error.rawMessage = message;
	error.syntax = syntax ? generate$50(syntax) : "<generic>";
	error.css = css$4;
	error.mismatchOffset = mismatchOffset;
	error.mismatchLength = mismatchLength;
	error.message = message + "\n  syntax: " + error.syntax + "\n   value: " + (css$4 || "<empty string>") + "\n  --------" + new Array(error.mismatchOffset + 1).join("-") + "^";
	Object.assign(error, start);
	error.loc = {
		source: node && node.loc && node.loc.source || "<unknown>",
		start,
		end
	};
	return error;
};

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/utils/names.js
const keywords = /* @__PURE__ */ new Map();
const properties = /* @__PURE__ */ new Map();
const HYPHENMINUS$5 = 45;
const keyword = getKeywordDescriptor;
const property = getPropertyDescriptor;
function isCustomProperty(str, offset) {
	offset = offset || 0;
	return str.length - offset >= 2 && str.charCodeAt(offset) === HYPHENMINUS$5 && str.charCodeAt(offset + 1) === HYPHENMINUS$5;
}
function getVendorPrefix(str, offset) {
	offset = offset || 0;
	if (str.length - offset >= 3) {
		if (str.charCodeAt(offset) === HYPHENMINUS$5 && str.charCodeAt(offset + 1) !== HYPHENMINUS$5) {
			const secondDashIndex = str.indexOf("-", offset + 2);
			if (secondDashIndex !== -1) return str.substring(offset, secondDashIndex + 1);
		}
	}
	return "";
}
function getKeywordDescriptor(keyword$1) {
	if (keywords.has(keyword$1)) return keywords.get(keyword$1);
	const name$49 = keyword$1.toLowerCase();
	let descriptor = keywords.get(name$49);
	if (descriptor === void 0) {
		const custom = isCustomProperty(name$49, 0);
		const vendor = !custom ? getVendorPrefix(name$49, 0) : "";
		descriptor = Object.freeze({
			basename: name$49.substr(vendor.length),
			name: name$49,
			prefix: vendor,
			vendor,
			custom
		});
	}
	keywords.set(keyword$1, descriptor);
	return descriptor;
}
function getPropertyDescriptor(property$1) {
	if (properties.has(property$1)) return properties.get(property$1);
	let name$49 = property$1;
	let hack = property$1[0];
	if (hack === "/") hack = property$1[1] === "/" ? "//" : "/";
	else if (hack !== "_" && hack !== "*" && hack !== "$" && hack !== "#" && hack !== "+" && hack !== "&") hack = "";
	const custom = isCustomProperty(name$49, hack.length);
	if (!custom) {
		name$49 = name$49.toLowerCase();
		if (properties.has(name$49)) {
			const descriptor$1 = properties.get(name$49);
			properties.set(property$1, descriptor$1);
			return descriptor$1;
		}
	}
	const vendor = !custom ? getVendorPrefix(name$49, hack.length) : "";
	const prefix = name$49.substr(0, hack.length + vendor.length);
	const descriptor = Object.freeze({
		basename: name$49.substr(prefix.length),
		name: name$49.substr(hack.length),
		hack,
		vendor,
		prefix,
		custom
	});
	properties.set(property$1, descriptor);
	return descriptor;
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/lexer/generic-const.js
const cssWideKeywords = [
	"initial",
	"inherit",
	"unset",
	"revert",
	"revert-layer"
];

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/lexer/generic-an-plus-b.js
const PLUSSIGN$8 = 43;
const HYPHENMINUS$4 = 45;
const N$3 = 110;
const DISALLOW_SIGN$1 = true;
const ALLOW_SIGN$1 = false;
function isDelim$1(token, code$1) {
	return token !== null && token.type === Delim && token.value.charCodeAt(0) === code$1;
}
function skipSC(token, offset, getNextToken) {
	while (token !== null && (token.type === WhiteSpace || token.type === Comment)) token = getNextToken(++offset);
	return offset;
}
function checkInteger$1(token, valueOffset, disallowSign, offset) {
	if (!token) return 0;
	const code$1 = token.value.charCodeAt(valueOffset);
	if (code$1 === PLUSSIGN$8 || code$1 === HYPHENMINUS$4) {
		if (disallowSign) return 0;
		valueOffset++;
	}
	for (; valueOffset < token.value.length; valueOffset++) if (!isDigit(token.value.charCodeAt(valueOffset))) return 0;
	return offset + 1;
}
function consumeB$1(token, offset_, getNextToken) {
	let sign = false;
	let offset = skipSC(token, offset_, getNextToken);
	token = getNextToken(offset);
	if (token === null) return offset_;
	if (token.type !== Number$1) if (isDelim$1(token, PLUSSIGN$8) || isDelim$1(token, HYPHENMINUS$4)) {
		sign = true;
		offset = skipSC(getNextToken(++offset), offset, getNextToken);
		token = getNextToken(offset);
		if (token === null || token.type !== Number$1) return 0;
	} else return offset_;
	if (!sign) {
		const code$1 = token.value.charCodeAt(0);
		if (code$1 !== PLUSSIGN$8 && code$1 !== HYPHENMINUS$4) return 0;
	}
	return checkInteger$1(token, sign ? 0 : 1, sign, offset);
}
function anPlusB(token, getNextToken) {
	let offset = 0;
	if (!token) return 0;
	if (token.type === Number$1) return checkInteger$1(token, 0, ALLOW_SIGN$1, offset);
	else if (token.type === Ident && token.value.charCodeAt(0) === HYPHENMINUS$4) {
		if (!cmpChar(token.value, 1, N$3)) return 0;
		switch (token.value.length) {
			case 2: return consumeB$1(getNextToken(++offset), offset, getNextToken);
			case 3:
				if (token.value.charCodeAt(2) !== HYPHENMINUS$4) return 0;
				offset = skipSC(getNextToken(++offset), offset, getNextToken);
				token = getNextToken(offset);
				return checkInteger$1(token, 0, DISALLOW_SIGN$1, offset);
			default:
				if (token.value.charCodeAt(2) !== HYPHENMINUS$4) return 0;
				return checkInteger$1(token, 3, DISALLOW_SIGN$1, offset);
		}
	} else if (token.type === Ident || isDelim$1(token, PLUSSIGN$8) && getNextToken(offset + 1).type === Ident) {
		if (token.type !== Ident) token = getNextToken(++offset);
		if (token === null || !cmpChar(token.value, 0, N$3)) return 0;
		switch (token.value.length) {
			case 1: return consumeB$1(getNextToken(++offset), offset, getNextToken);
			case 2:
				if (token.value.charCodeAt(1) !== HYPHENMINUS$4) return 0;
				offset = skipSC(getNextToken(++offset), offset, getNextToken);
				token = getNextToken(offset);
				return checkInteger$1(token, 0, DISALLOW_SIGN$1, offset);
			default:
				if (token.value.charCodeAt(1) !== HYPHENMINUS$4) return 0;
				return checkInteger$1(token, 2, DISALLOW_SIGN$1, offset);
		}
	} else if (token.type === Dimension) {
		let code$1 = token.value.charCodeAt(0);
		let sign = code$1 === PLUSSIGN$8 || code$1 === HYPHENMINUS$4 ? 1 : 0;
		let i = sign;
		for (; i < token.value.length; i++) if (!isDigit(token.value.charCodeAt(i))) break;
		if (i === sign) return 0;
		if (!cmpChar(token.value, i, N$3)) return 0;
		if (i + 1 === token.value.length) return consumeB$1(getNextToken(++offset), offset, getNextToken);
		else {
			if (token.value.charCodeAt(i + 1) !== HYPHENMINUS$4) return 0;
			if (i + 2 === token.value.length) {
				offset = skipSC(getNextToken(++offset), offset, getNextToken);
				token = getNextToken(offset);
				return checkInteger$1(token, 0, DISALLOW_SIGN$1, offset);
			} else return checkInteger$1(token, i + 2, DISALLOW_SIGN$1, offset);
		}
	}
	return 0;
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/lexer/generic-urange.js
const PLUSSIGN$7 = 43;
const HYPHENMINUS$3 = 45;
const QUESTIONMARK$2 = 63;
const U$1 = 117;
function isDelim(token, code$1) {
	return token !== null && token.type === Delim && token.value.charCodeAt(0) === code$1;
}
function startsWith$1(token, code$1) {
	return token.value.charCodeAt(0) === code$1;
}
function hexSequence(token, offset, allowDash) {
	let hexlen = 0;
	for (let pos = offset; pos < token.value.length; pos++) {
		const code$1 = token.value.charCodeAt(pos);
		if (code$1 === HYPHENMINUS$3 && allowDash && hexlen !== 0) {
			hexSequence(token, offset + hexlen + 1, false);
			return 6;
		}
		if (!isHexDigit(code$1)) return 0;
		if (++hexlen > 6) return 0;
	}
	return hexlen;
}
function withQuestionMarkSequence(consumed, length$1, getNextToken) {
	if (!consumed) return 0;
	while (isDelim(getNextToken(length$1), QUESTIONMARK$2)) {
		if (++consumed > 6) return 0;
		length$1++;
	}
	return length$1;
}
function urange(token, getNextToken) {
	let length$1 = 0;
	if (token === null || token.type !== Ident || !cmpChar(token.value, 0, U$1)) return 0;
	token = getNextToken(++length$1);
	if (token === null) return 0;
	if (isDelim(token, PLUSSIGN$7)) {
		token = getNextToken(++length$1);
		if (token === null) return 0;
		if (token.type === Ident) return withQuestionMarkSequence(hexSequence(token, 0, true), ++length$1, getNextToken);
		if (isDelim(token, QUESTIONMARK$2)) return withQuestionMarkSequence(1, ++length$1, getNextToken);
		return 0;
	}
	if (token.type === Number$1) {
		const consumedHexLength = hexSequence(token, 1, true);
		if (consumedHexLength === 0) return 0;
		token = getNextToken(++length$1);
		if (token === null) return length$1;
		if (token.type === Dimension || token.type === Number$1) {
			if (!startsWith$1(token, HYPHENMINUS$3) || !hexSequence(token, 1, false)) return 0;
			return length$1 + 1;
		}
		return withQuestionMarkSequence(consumedHexLength, length$1, getNextToken);
	}
	if (token.type === Dimension) return withQuestionMarkSequence(hexSequence(token, 1, true), ++length$1, getNextToken);
	return 0;
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/lexer/generic.js
const calcFunctionNames = [
	"calc(",
	"-moz-calc(",
	"-webkit-calc("
];
const balancePair = new Map([
	[Function, RightParenthesis],
	[LeftParenthesis, RightParenthesis],
	[LeftSquareBracket, RightSquareBracket],
	[LeftCurlyBracket, RightCurlyBracket]
]);
function charCodeAt(str, index) {
	return index < str.length ? str.charCodeAt(index) : 0;
}
function eqStr(actual, expected) {
	return cmpStr(actual, 0, actual.length, expected);
}
function eqStrAny(actual, expected) {
	for (let i = 0; i < expected.length; i++) if (eqStr(actual, expected[i])) return true;
	return false;
}
function isPostfixIeHack(str, offset) {
	if (offset !== str.length - 2) return false;
	return charCodeAt(str, offset) === 92 && isDigit(charCodeAt(str, offset + 1));
}
function outOfRange(opts, value, numEnd) {
	if (opts && opts.type === "Range") {
		const num = Number(numEnd !== void 0 && numEnd !== value.length ? value.substr(0, numEnd) : value);
		if (isNaN(num)) return true;
		if (opts.min !== null && num < opts.min && typeof opts.min !== "string") return true;
		if (opts.max !== null && num > opts.max && typeof opts.max !== "string") return true;
	}
	return false;
}
function consumeFunction(token, getNextToken) {
	let balanceCloseType = 0;
	let balanceStash = [];
	let length$1 = 0;
	scan: do {
		switch (token.type) {
			case RightCurlyBracket:
			case RightParenthesis:
			case RightSquareBracket:
				if (token.type !== balanceCloseType) break scan;
				balanceCloseType = balanceStash.pop();
				if (balanceStash.length === 0) {
					length$1++;
					break scan;
				}
				break;
			case Function:
			case LeftParenthesis:
			case LeftSquareBracket:
			case LeftCurlyBracket:
				balanceStash.push(balanceCloseType);
				balanceCloseType = balancePair.get(token.type);
				break;
		}
		length$1++;
	} while (token = getNextToken(length$1));
	return length$1;
}
function calc(next) {
	return function(token, getNextToken, opts) {
		if (token === null) return 0;
		if (token.type === Function && eqStrAny(token.value, calcFunctionNames)) return consumeFunction(token, getNextToken);
		return next(token, getNextToken, opts);
	};
}
function tokenType(expectedTokenType) {
	return function(token) {
		if (token === null || token.type !== expectedTokenType) return 0;
		return 1;
	};
}
function customIdent(token) {
	if (token === null || token.type !== Ident) return 0;
	const name$49 = token.value.toLowerCase();
	if (eqStrAny(name$49, cssWideKeywords)) return 0;
	if (eqStr(name$49, "default")) return 0;
	return 1;
}
function dashedIdent(token) {
	if (token === null || token.type !== Ident) return 0;
	if (charCodeAt(token.value, 0) !== 45 || charCodeAt(token.value, 1) !== 45) return 0;
	return 1;
}
function customPropertyName(token) {
	if (!dashedIdent(token)) return 0;
	if (token.value === "--") return 0;
	return 1;
}
function hexColor(token) {
	if (token === null || token.type !== Hash) return 0;
	const length$1 = token.value.length;
	if (length$1 !== 4 && length$1 !== 5 && length$1 !== 7 && length$1 !== 9) return 0;
	for (let i = 1; i < length$1; i++) if (!isHexDigit(charCodeAt(token.value, i))) return 0;
	return 1;
}
function idSelector(token) {
	if (token === null || token.type !== Hash) return 0;
	if (!isIdentifierStart(charCodeAt(token.value, 1), charCodeAt(token.value, 2), charCodeAt(token.value, 3))) return 0;
	return 1;
}
function declarationValue(token, getNextToken) {
	if (!token) return 0;
	let balanceCloseType = 0;
	let balanceStash = [];
	let length$1 = 0;
	scan: do {
		switch (token.type) {
			case BadString:
			case BadUrl: break scan;
			case RightCurlyBracket:
			case RightParenthesis:
			case RightSquareBracket:
				if (token.type !== balanceCloseType) break scan;
				balanceCloseType = balanceStash.pop();
				break;
			case Semicolon:
				if (balanceCloseType === 0) break scan;
				break;
			case Delim:
				if (balanceCloseType === 0 && token.value === "!") break scan;
				break;
			case Function:
			case LeftParenthesis:
			case LeftSquareBracket:
			case LeftCurlyBracket:
				balanceStash.push(balanceCloseType);
				balanceCloseType = balancePair.get(token.type);
				break;
		}
		length$1++;
	} while (token = getNextToken(length$1));
	return length$1;
}
function anyValue(token, getNextToken) {
	if (!token) return 0;
	let balanceCloseType = 0;
	let balanceStash = [];
	let length$1 = 0;
	scan: do {
		switch (token.type) {
			case BadString:
			case BadUrl: break scan;
			case RightCurlyBracket:
			case RightParenthesis:
			case RightSquareBracket:
				if (token.type !== balanceCloseType) break scan;
				balanceCloseType = balanceStash.pop();
				break;
			case Function:
			case LeftParenthesis:
			case LeftSquareBracket:
			case LeftCurlyBracket:
				balanceStash.push(balanceCloseType);
				balanceCloseType = balancePair.get(token.type);
				break;
		}
		length$1++;
	} while (token = getNextToken(length$1));
	return length$1;
}
function dimension(type) {
	if (type) type = new Set(type);
	return function(token, getNextToken, opts) {
		if (token === null || token.type !== Dimension) return 0;
		const numberEnd = consumeNumber(token.value, 0);
		if (type !== null) {
			const reverseSolidusOffset = token.value.indexOf("\\", numberEnd);
			const unit = reverseSolidusOffset === -1 || !isPostfixIeHack(token.value, reverseSolidusOffset) ? token.value.substr(numberEnd) : token.value.substring(numberEnd, reverseSolidusOffset);
			if (type.has(unit.toLowerCase()) === false) return 0;
		}
		if (outOfRange(opts, token.value, numberEnd)) return 0;
		return 1;
	};
}
function percentage(token, getNextToken, opts) {
	if (token === null || token.type !== Percentage) return 0;
	if (outOfRange(opts, token.value, token.value.length - 1)) return 0;
	return 1;
}
function zero(next) {
	if (typeof next !== "function") next = function() {
		return 0;
	};
	return function(token, getNextToken, opts) {
		if (token !== null && token.type === Number$1) {
			if (Number(token.value) === 0) return 1;
		}
		return next(token, getNextToken, opts);
	};
}
function number(token, getNextToken, opts) {
	if (token === null) return 0;
	const numberEnd = consumeNumber(token.value, 0);
	if (!(numberEnd === token.value.length) && !isPostfixIeHack(token.value, numberEnd)) return 0;
	if (outOfRange(opts, token.value, numberEnd)) return 0;
	return 1;
}
function integer(token, getNextToken, opts) {
	if (token === null || token.type !== Number$1) return 0;
	let i = charCodeAt(token.value, 0) === 43 || charCodeAt(token.value, 0) === 45 ? 1 : 0;
	for (; i < token.value.length; i++) if (!isDigit(charCodeAt(token.value, i))) return 0;
	if (outOfRange(opts, token.value, i)) return 0;
	return 1;
}
const tokenTypes = {
	"ident-token": tokenType(Ident),
	"function-token": tokenType(Function),
	"at-keyword-token": tokenType(AtKeyword),
	"hash-token": tokenType(Hash),
	"string-token": tokenType(String$1),
	"bad-string-token": tokenType(BadString),
	"url-token": tokenType(Url),
	"bad-url-token": tokenType(BadUrl),
	"delim-token": tokenType(Delim),
	"number-token": tokenType(Number$1),
	"percentage-token": tokenType(Percentage),
	"dimension-token": tokenType(Dimension),
	"whitespace-token": tokenType(WhiteSpace),
	"CDO-token": tokenType(CDO),
	"CDC-token": tokenType(CDC),
	"colon-token": tokenType(Colon),
	"semicolon-token": tokenType(Semicolon),
	"comma-token": tokenType(Comma),
	"[-token": tokenType(LeftSquareBracket),
	"]-token": tokenType(RightSquareBracket),
	"(-token": tokenType(LeftParenthesis),
	")-token": tokenType(RightParenthesis),
	"{-token": tokenType(LeftCurlyBracket),
	"}-token": tokenType(RightCurlyBracket)
};
const productionTypes = {
	"string": tokenType(String$1),
	"ident": tokenType(Ident),
	"percentage": calc(percentage),
	"zero": zero(),
	"number": calc(number),
	"integer": calc(integer),
	"custom-ident": customIdent,
	"dashed-ident": dashedIdent,
	"custom-property-name": customPropertyName,
	"hex-color": hexColor,
	"id-selector": idSelector,
	"an-plus-b": anPlusB,
	"urange": urange,
	"declaration-value": declarationValue,
	"any-value": anyValue
};
function createDemensionTypes(units) {
	const { angle: angle$1, decibel: decibel$1, frequency: frequency$1, flex: flex$1, length: length$1, resolution: resolution$1, semitones: semitones$1, time: time$1 } = units || {};
	return {
		"dimension": calc(dimension(null)),
		"angle": calc(dimension(angle$1)),
		"decibel": calc(dimension(decibel$1)),
		"frequency": calc(dimension(frequency$1)),
		"flex": calc(dimension(flex$1)),
		"length": calc(zero(dimension(length$1))),
		"resolution": calc(dimension(resolution$1)),
		"semitones": calc(dimension(semitones$1)),
		"time": calc(dimension(time$1))
	};
}
function createGenericTypes(units) {
	return {
		...tokenTypes,
		...productionTypes,
		...createDemensionTypes(units)
	};
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/lexer/units.js
var units_exports = /* @__PURE__ */ __export({
	angle: () => angle,
	decibel: () => decibel,
	flex: () => flex,
	frequency: () => frequency,
	length: () => length,
	resolution: () => resolution,
	semitones: () => semitones,
	time: () => time
});
const length = [
	"cm",
	"mm",
	"q",
	"in",
	"pt",
	"pc",
	"px",
	"em",
	"rem",
	"ex",
	"rex",
	"cap",
	"rcap",
	"ch",
	"rch",
	"ic",
	"ric",
	"lh",
	"rlh",
	"vw",
	"svw",
	"lvw",
	"dvw",
	"vh",
	"svh",
	"lvh",
	"dvh",
	"vi",
	"svi",
	"lvi",
	"dvi",
	"vb",
	"svb",
	"lvb",
	"dvb",
	"vmin",
	"svmin",
	"lvmin",
	"dvmin",
	"vmax",
	"svmax",
	"lvmax",
	"dvmax",
	"cqw",
	"cqh",
	"cqi",
	"cqb",
	"cqmin",
	"cqmax"
];
const angle = [
	"deg",
	"grad",
	"rad",
	"turn"
];
const time = ["s", "ms"];
const frequency = ["hz", "khz"];
const resolution = [
	"dpi",
	"dpcm",
	"dppx",
	"x"
];
const flex = ["fr"];
const decibel = ["db"];
const semitones = ["st"];

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/definition-syntax/SyntaxError.js
function SyntaxError$1(message, input, offset) {
	return Object.assign(createCustomError("SyntaxError", message), {
		input,
		offset,
		rawMessage: message,
		message: message + "\n  " + input + "\n--" + new Array((offset || input.length) + 1).join("-") + "^"
	});
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/definition-syntax/scanner.js
const TAB$1 = 9;
const N$2 = 10;
const F$1 = 12;
const R$1 = 13;
const SPACE$3 = 32;
const NAME_CHAR = new Uint8Array(128).map((_, idx) => /[a-zA-Z0-9\-]/.test(String.fromCharCode(idx)) ? 1 : 0);
var Scanner = class {
	constructor(str) {
		this.str = str;
		this.pos = 0;
	}
	charCodeAt(pos) {
		return pos < this.str.length ? this.str.charCodeAt(pos) : 0;
	}
	charCode() {
		return this.charCodeAt(this.pos);
	}
	isNameCharCode(code$1 = this.charCode()) {
		return code$1 < 128 && NAME_CHAR[code$1] === 1;
	}
	nextCharCode() {
		return this.charCodeAt(this.pos + 1);
	}
	nextNonWsCode(pos) {
		return this.charCodeAt(this.findWsEnd(pos));
	}
	skipWs() {
		this.pos = this.findWsEnd(this.pos);
	}
	findWsEnd(pos) {
		for (; pos < this.str.length; pos++) {
			const code$1 = this.str.charCodeAt(pos);
			if (code$1 !== R$1 && code$1 !== N$2 && code$1 !== F$1 && code$1 !== SPACE$3 && code$1 !== TAB$1) break;
		}
		return pos;
	}
	substringToPos(end) {
		return this.str.substring(this.pos, this.pos = end);
	}
	eat(code$1) {
		if (this.charCode() !== code$1) this.error("Expect `" + String.fromCharCode(code$1) + "`");
		this.pos++;
	}
	peek() {
		return this.pos < this.str.length ? this.str.charAt(this.pos++) : "";
	}
	error(message) {
		throw new SyntaxError$1(message, this.str, this.pos);
	}
	scanSpaces() {
		return this.substringToPos(this.findWsEnd(this.pos));
	}
	scanWord() {
		let end = this.pos;
		for (; end < this.str.length; end++) {
			const code$1 = this.str.charCodeAt(end);
			if (code$1 >= 128 || NAME_CHAR[code$1] === 0) break;
		}
		if (this.pos === end) this.error("Expect a keyword");
		return this.substringToPos(end);
	}
	scanNumber() {
		let end = this.pos;
		for (; end < this.str.length; end++) {
			const code$1 = this.str.charCodeAt(end);
			if (code$1 < 48 || code$1 > 57) break;
		}
		if (this.pos === end) this.error("Expect a number");
		return this.substringToPos(end);
	}
	scanString() {
		const end = this.str.indexOf("'", this.pos + 1);
		if (end === -1) {
			this.pos = this.str.length;
			this.error("Expect an apostrophe");
		}
		return this.substringToPos(end + 1);
	}
};

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/definition-syntax/parse.js
const TAB = 9;
const N$1 = 10;
const F = 12;
const R = 13;
const SPACE$2 = 32;
const EXCLAMATIONMARK$2 = 33;
const NUMBERSIGN$3 = 35;
const AMPERSAND$5 = 38;
const APOSTROPHE$2 = 39;
const LEFTPARENTHESIS$2 = 40;
const RIGHTPARENTHESIS$2 = 41;
const ASTERISK$6 = 42;
const PLUSSIGN$6 = 43;
const COMMA = 44;
const HYPERMINUS = 45;
const LESSTHANSIGN$1 = 60;
const GREATERTHANSIGN$3 = 62;
const QUESTIONMARK$1 = 63;
const COMMERCIALAT = 64;
const LEFTSQUAREBRACKET = 91;
const RIGHTSQUAREBRACKET = 93;
const LEFTCURLYBRACKET = 123;
const VERTICALLINE$3 = 124;
const RIGHTCURLYBRACKET = 125;
const INFINITY = 8734;
const COMBINATOR_PRECEDENCE = {
	" ": 1,
	"&&": 2,
	"||": 3,
	"|": 4
};
function readMultiplierRange(scanner) {
	let min = null;
	let max = null;
	scanner.eat(LEFTCURLYBRACKET);
	scanner.skipWs();
	min = scanner.scanNumber(scanner);
	scanner.skipWs();
	if (scanner.charCode() === COMMA) {
		scanner.pos++;
		scanner.skipWs();
		if (scanner.charCode() !== RIGHTCURLYBRACKET) {
			max = scanner.scanNumber(scanner);
			scanner.skipWs();
		}
	} else max = min;
	scanner.eat(RIGHTCURLYBRACKET);
	return {
		min: Number(min),
		max: max ? Number(max) : 0
	};
}
function readMultiplier(scanner) {
	let range = null;
	let comma = false;
	switch (scanner.charCode()) {
		case ASTERISK$6:
			scanner.pos++;
			range = {
				min: 0,
				max: 0
			};
			break;
		case PLUSSIGN$6:
			scanner.pos++;
			range = {
				min: 1,
				max: 0
			};
			break;
		case QUESTIONMARK$1:
			scanner.pos++;
			range = {
				min: 0,
				max: 1
			};
			break;
		case NUMBERSIGN$3:
			scanner.pos++;
			comma = true;
			if (scanner.charCode() === LEFTCURLYBRACKET) range = readMultiplierRange(scanner);
			else if (scanner.charCode() === QUESTIONMARK$1) {
				scanner.pos++;
				range = {
					min: 0,
					max: 0
				};
			} else range = {
				min: 1,
				max: 0
			};
			break;
		case LEFTCURLYBRACKET:
			range = readMultiplierRange(scanner);
			break;
		default: return null;
	}
	return {
		type: "Multiplier",
		comma,
		min: range.min,
		max: range.max,
		term: null
	};
}
function maybeMultiplied(scanner, node) {
	const multiplier = readMultiplier(scanner);
	if (multiplier !== null) {
		multiplier.term = node;
		if (scanner.charCode() === NUMBERSIGN$3 && scanner.charCodeAt(scanner.pos - 1) === PLUSSIGN$6) return maybeMultiplied(scanner, multiplier);
		return multiplier;
	}
	return node;
}
function maybeToken(scanner) {
	const ch = scanner.peek();
	if (ch === "") return null;
	return maybeMultiplied(scanner, {
		type: "Token",
		value: ch
	});
}
function readProperty$1(scanner) {
	let name$49;
	scanner.eat(LESSTHANSIGN$1);
	scanner.eat(APOSTROPHE$2);
	name$49 = scanner.scanWord();
	scanner.eat(APOSTROPHE$2);
	scanner.eat(GREATERTHANSIGN$3);
	return maybeMultiplied(scanner, {
		type: "Property",
		name: name$49
	});
}
function readTypeRange(scanner) {
	let min = null;
	let max = null;
	let sign = 1;
	scanner.eat(LEFTSQUAREBRACKET);
	if (scanner.charCode() === HYPERMINUS) {
		scanner.peek();
		sign = -1;
	}
	if (sign == -1 && scanner.charCode() === INFINITY) scanner.peek();
	else {
		min = sign * Number(scanner.scanNumber(scanner));
		if (scanner.isNameCharCode()) min += scanner.scanWord();
	}
	scanner.skipWs();
	scanner.eat(COMMA);
	scanner.skipWs();
	if (scanner.charCode() === INFINITY) scanner.peek();
	else {
		sign = 1;
		if (scanner.charCode() === HYPERMINUS) {
			scanner.peek();
			sign = -1;
		}
		max = sign * Number(scanner.scanNumber(scanner));
		if (scanner.isNameCharCode()) max += scanner.scanWord();
	}
	scanner.eat(RIGHTSQUAREBRACKET);
	return {
		type: "Range",
		min,
		max
	};
}
function readType(scanner) {
	let name$49;
	let opts = null;
	scanner.eat(LESSTHANSIGN$1);
	name$49 = scanner.scanWord();
	if (name$49 === "boolean-expr") {
		scanner.eat(LEFTSQUAREBRACKET);
		const implicitGroup = readImplicitGroup(scanner, RIGHTSQUAREBRACKET);
		scanner.eat(RIGHTSQUAREBRACKET);
		scanner.eat(GREATERTHANSIGN$3);
		return maybeMultiplied(scanner, {
			type: "Boolean",
			term: implicitGroup.terms.length === 1 ? implicitGroup.terms[0] : implicitGroup
		});
	}
	if (scanner.charCode() === LEFTPARENTHESIS$2 && scanner.nextCharCode() === RIGHTPARENTHESIS$2) {
		scanner.pos += 2;
		name$49 += "()";
	}
	if (scanner.charCodeAt(scanner.findWsEnd(scanner.pos)) === LEFTSQUAREBRACKET) {
		scanner.skipWs();
		opts = readTypeRange(scanner);
	}
	scanner.eat(GREATERTHANSIGN$3);
	return maybeMultiplied(scanner, {
		type: "Type",
		name: name$49,
		opts
	});
}
function readKeywordOrFunction(scanner) {
	const name$49 = scanner.scanWord();
	if (scanner.charCode() === LEFTPARENTHESIS$2) {
		scanner.pos++;
		return {
			type: "Function",
			name: name$49
		};
	}
	return maybeMultiplied(scanner, {
		type: "Keyword",
		name: name$49
	});
}
function regroupTerms(terms, combinators) {
	function createGroup(terms$1, combinator$1) {
		return {
			type: "Group",
			terms: terms$1,
			combinator: combinator$1,
			disallowEmpty: false,
			explicit: false
		};
	}
	let combinator;
	combinators = Object.keys(combinators).sort((a, b) => COMBINATOR_PRECEDENCE[a] - COMBINATOR_PRECEDENCE[b]);
	while (combinators.length > 0) {
		combinator = combinators.shift();
		let i = 0;
		let subgroupStart = 0;
		for (; i < terms.length; i++) {
			const term = terms[i];
			if (term.type === "Combinator") if (term.value === combinator) {
				if (subgroupStart === -1) subgroupStart = i - 1;
				terms.splice(i, 1);
				i--;
			} else {
				if (subgroupStart !== -1 && i - subgroupStart > 1) {
					terms.splice(subgroupStart, i - subgroupStart, createGroup(terms.slice(subgroupStart, i), combinator));
					i = subgroupStart + 1;
				}
				subgroupStart = -1;
			}
		}
		if (subgroupStart !== -1 && combinators.length) terms.splice(subgroupStart, i - subgroupStart, createGroup(terms.slice(subgroupStart, i), combinator));
	}
	return combinator;
}
function readImplicitGroup(scanner, stopCharCode) {
	const combinators = Object.create(null);
	const terms = [];
	let token;
	let prevToken = null;
	let prevTokenPos = scanner.pos;
	while (scanner.charCode() !== stopCharCode && (token = peek(scanner, stopCharCode))) if (token.type !== "Spaces") {
		if (token.type === "Combinator") {
			if (prevToken === null || prevToken.type === "Combinator") {
				scanner.pos = prevTokenPos;
				scanner.error("Unexpected combinator");
			}
			combinators[token.value] = true;
		} else if (prevToken !== null && prevToken.type !== "Combinator") {
			combinators[" "] = true;
			terms.push({
				type: "Combinator",
				value: " "
			});
		}
		terms.push(token);
		prevToken = token;
		prevTokenPos = scanner.pos;
	}
	if (prevToken !== null && prevToken.type === "Combinator") {
		scanner.pos -= prevTokenPos;
		scanner.error("Unexpected combinator");
	}
	return {
		type: "Group",
		terms,
		combinator: regroupTerms(terms, combinators) || " ",
		disallowEmpty: false,
		explicit: false
	};
}
function readGroup(scanner, stopCharCode) {
	let result;
	scanner.eat(LEFTSQUAREBRACKET);
	result = readImplicitGroup(scanner, stopCharCode);
	scanner.eat(RIGHTSQUAREBRACKET);
	result.explicit = true;
	if (scanner.charCode() === EXCLAMATIONMARK$2) {
		scanner.pos++;
		result.disallowEmpty = true;
	}
	return result;
}
function peek(scanner, stopCharCode) {
	let code$1 = scanner.charCode();
	switch (code$1) {
		case RIGHTSQUAREBRACKET: break;
		case LEFTSQUAREBRACKET: return maybeMultiplied(scanner, readGroup(scanner, stopCharCode));
		case LESSTHANSIGN$1: return scanner.nextCharCode() === APOSTROPHE$2 ? readProperty$1(scanner) : readType(scanner);
		case VERTICALLINE$3: return {
			type: "Combinator",
			value: scanner.substringToPos(scanner.pos + (scanner.nextCharCode() === VERTICALLINE$3 ? 2 : 1))
		};
		case AMPERSAND$5:
			scanner.pos++;
			scanner.eat(AMPERSAND$5);
			return {
				type: "Combinator",
				value: "&&"
			};
		case COMMA:
			scanner.pos++;
			return { type: "Comma" };
		case APOSTROPHE$2: return maybeMultiplied(scanner, {
			type: "String",
			value: scanner.scanString()
		});
		case SPACE$2:
		case TAB:
		case N$1:
		case R:
		case F: return {
			type: "Spaces",
			value: scanner.scanSpaces()
		};
		case COMMERCIALAT:
			code$1 = scanner.nextCharCode();
			if (scanner.isNameCharCode(code$1)) {
				scanner.pos++;
				return {
					type: "AtKeyword",
					name: scanner.scanWord()
				};
			}
			return maybeToken(scanner);
		case ASTERISK$6:
		case PLUSSIGN$6:
		case QUESTIONMARK$1:
		case NUMBERSIGN$3:
		case EXCLAMATIONMARK$2: break;
		case LEFTCURLYBRACKET:
			code$1 = scanner.nextCharCode();
			if (code$1 < 48 || code$1 > 57) return maybeToken(scanner);
			break;
		default:
			if (scanner.isNameCharCode(code$1)) return readKeywordOrFunction(scanner);
			return maybeToken(scanner);
	}
}
function parse$50(source) {
	const scanner = new Scanner(source);
	const result = readImplicitGroup(scanner);
	if (scanner.pos !== source.length) scanner.error("Unexpected input");
	if (result.terms.length === 1 && result.terms[0].type === "Group") return result.terms[0];
	return result;
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/definition-syntax/walk.js
const noop = function() {};
function ensureFunction(value) {
	return typeof value === "function" ? value : noop;
}
function walk$1(node, options, context) {
	function walk$2(node$1) {
		enter.call(context, node$1);
		switch (node$1.type) {
			case "Group":
				node$1.terms.forEach(walk$2);
				break;
			case "Multiplier":
			case "Boolean":
				walk$2(node$1.term);
				break;
			case "Type":
			case "Property":
			case "Keyword":
			case "AtKeyword":
			case "Function":
			case "String":
			case "Token":
			case "Comma": break;
			default: throw new Error("Unknown type: " + node$1.type);
		}
		leave.call(context, node$1);
	}
	let enter = noop;
	let leave = noop;
	if (typeof options === "function") enter = options;
	else if (options) {
		enter = ensureFunction(options.enter);
		leave = ensureFunction(options.leave);
	}
	if (enter === noop && leave === noop) throw new Error("Neither `enter` nor `leave` walker handler is set or both aren't a function");
	walk$2(node, context);
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/lexer/prepare-tokens.js
const astToTokens = { decorator(handlers) {
	const tokens = [];
	let curNode = null;
	return {
		...handlers,
		node(node) {
			const tmp = curNode;
			curNode = node;
			handlers.node.call(this, node);
			curNode = tmp;
		},
		emit(value, type, auto) {
			tokens.push({
				type,
				value,
				node: auto ? null : curNode
			});
		},
		result() {
			return tokens;
		}
	};
} };
function stringToTokens(str) {
	const tokens = [];
	tokenize$1(str, (type, start, end) => tokens.push({
		type,
		value: str.slice(start, end),
		node: null
	}));
	return tokens;
}
function prepare_tokens_default(value, syntax) {
	if (typeof value === "string") return stringToTokens(value);
	return syntax.generate(value, astToTokens);
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/lexer/match-graph.js
const MATCH = { type: "Match" };
const MISMATCH = { type: "Mismatch" };
const DISALLOW_EMPTY = { type: "DisallowEmpty" };
const LEFTPARENTHESIS$1 = 40;
const RIGHTPARENTHESIS$1 = 41;
function createCondition(match, thenBranch, elseBranch) {
	if (thenBranch === MATCH && elseBranch === MISMATCH) return match;
	if (match === MATCH && thenBranch === MATCH && elseBranch === MATCH) return match;
	if (match.type === "If" && match.else === MISMATCH && thenBranch === MATCH) {
		thenBranch = match.then;
		match = match.match;
	}
	return {
		type: "If",
		match,
		then: thenBranch,
		else: elseBranch
	};
}
function isFunctionType(name$49) {
	return name$49.length > 2 && name$49.charCodeAt(name$49.length - 2) === LEFTPARENTHESIS$1 && name$49.charCodeAt(name$49.length - 1) === RIGHTPARENTHESIS$1;
}
function isEnumCapatible(term) {
	return term.type === "Keyword" || term.type === "AtKeyword" || term.type === "Function" || term.type === "Type" && isFunctionType(term.name);
}
function groupNode(terms, combinator = " ", explicit = false) {
	return {
		type: "Group",
		terms,
		combinator,
		disallowEmpty: false,
		explicit
	};
}
function replaceTypeInGraph(node, replacements, visited = /* @__PURE__ */ new Set()) {
	if (!visited.has(node)) {
		visited.add(node);
		switch (node.type) {
			case "If":
				node.match = replaceTypeInGraph(node.match, replacements, visited);
				node.then = replaceTypeInGraph(node.then, replacements, visited);
				node.else = replaceTypeInGraph(node.else, replacements, visited);
				break;
			case "Type": return replacements[node.name] || node;
		}
	}
	return node;
}
function buildGroupMatchGraph(combinator, terms, atLeastOneTermMatched) {
	switch (combinator) {
		case " ": {
			let result = MATCH;
			for (let i = terms.length - 1; i >= 0; i--) {
				const term = terms[i];
				result = createCondition(term, result, MISMATCH);
			}
			return result;
		}
		case "|": {
			let result = MISMATCH;
			let map = null;
			for (let i = terms.length - 1; i >= 0; i--) {
				let term = terms[i];
				if (isEnumCapatible(term)) {
					if (map === null && i > 0 && isEnumCapatible(terms[i - 1])) {
						map = Object.create(null);
						result = createCondition({
							type: "Enum",
							map
						}, MATCH, result);
					}
					if (map !== null) {
						const key = (isFunctionType(term.name) ? term.name.slice(0, -1) : term.name).toLowerCase();
						if (key in map === false) {
							map[key] = term;
							continue;
						}
					}
				}
				map = null;
				result = createCondition(term, MATCH, result);
			}
			return result;
		}
		case "&&": {
			if (terms.length > 5) return {
				type: "MatchOnce",
				terms,
				all: true
			};
			let result = MISMATCH;
			for (let i = terms.length - 1; i >= 0; i--) {
				const term = terms[i];
				let thenClause;
				if (terms.length > 1) thenClause = buildGroupMatchGraph(combinator, terms.filter(function(newGroupTerm) {
					return newGroupTerm !== term;
				}), false);
				else thenClause = MATCH;
				result = createCondition(term, thenClause, result);
			}
			return result;
		}
		case "||": {
			if (terms.length > 5) return {
				type: "MatchOnce",
				terms,
				all: false
			};
			let result = atLeastOneTermMatched ? MATCH : MISMATCH;
			for (let i = terms.length - 1; i >= 0; i--) {
				const term = terms[i];
				let thenClause;
				if (terms.length > 1) thenClause = buildGroupMatchGraph(combinator, terms.filter(function(newGroupTerm) {
					return newGroupTerm !== term;
				}), true);
				else thenClause = MATCH;
				result = createCondition(term, thenClause, result);
			}
			return result;
		}
	}
}
function buildMultiplierMatchGraph(node) {
	let result = MATCH;
	let matchTerm = buildMatchGraphInternal(node.term);
	if (node.max === 0) {
		matchTerm = createCondition(matchTerm, DISALLOW_EMPTY, MISMATCH);
		result = createCondition(matchTerm, null, MISMATCH);
		result.then = createCondition(MATCH, MATCH, result);
		if (node.comma) result.then.else = createCondition({
			type: "Comma",
			syntax: node
		}, result, MISMATCH);
	} else for (let i = node.min || 1; i <= node.max; i++) {
		if (node.comma && result !== MATCH) result = createCondition({
			type: "Comma",
			syntax: node
		}, result, MISMATCH);
		result = createCondition(matchTerm, createCondition(MATCH, MATCH, result), MISMATCH);
	}
	if (node.min === 0) result = createCondition(MATCH, MATCH, result);
	else for (let i = 0; i < node.min - 1; i++) {
		if (node.comma && result !== MATCH) result = createCondition({
			type: "Comma",
			syntax: node
		}, result, MISMATCH);
		result = createCondition(matchTerm, result, MISMATCH);
	}
	return result;
}
function buildMatchGraphInternal(node) {
	if (typeof node === "function") return {
		type: "Generic",
		fn: node
	};
	switch (node.type) {
		case "Group": {
			let result = buildGroupMatchGraph(node.combinator, node.terms.map(buildMatchGraphInternal), false);
			if (node.disallowEmpty) result = createCondition(result, DISALLOW_EMPTY, MISMATCH);
			return result;
		}
		case "Multiplier": return buildMultiplierMatchGraph(node);
		case "Boolean": {
			const term = buildMatchGraphInternal(node.term);
			const matchNode = buildMatchGraphInternal(groupNode([groupNode([{
				type: "Keyword",
				name: "not"
			}, {
				type: "Type",
				name: "!boolean-group"
			}]), groupNode([{
				type: "Type",
				name: "!boolean-group"
			}, groupNode([{
				type: "Multiplier",
				comma: false,
				min: 0,
				max: 0,
				term: groupNode([{
					type: "Keyword",
					name: "and"
				}, {
					type: "Type",
					name: "!boolean-group"
				}])
			}, {
				type: "Multiplier",
				comma: false,
				min: 0,
				max: 0,
				term: groupNode([{
					type: "Keyword",
					name: "or"
				}, {
					type: "Type",
					name: "!boolean-group"
				}])
			}], "|")])], "|"));
			const booleanGroup = buildMatchGraphInternal(groupNode([
				{
					type: "Type",
					name: "!term"
				},
				groupNode([
					{
						type: "Token",
						value: "("
					},
					{
						type: "Type",
						name: "!self"
					},
					{
						type: "Token",
						value: ")"
					}
				]),
				{
					type: "Type",
					name: "general-enclosed"
				}
			], "|"));
			replaceTypeInGraph(booleanGroup, {
				"!term": term,
				"!self": matchNode
			});
			replaceTypeInGraph(matchNode, { "!boolean-group": booleanGroup });
			return matchNode;
		}
		case "Type":
		case "Property": return {
			type: node.type,
			name: node.name,
			syntax: node
		};
		case "Keyword": return {
			type: node.type,
			name: node.name.toLowerCase(),
			syntax: node
		};
		case "AtKeyword": return {
			type: node.type,
			name: "@" + node.name.toLowerCase(),
			syntax: node
		};
		case "Function": return {
			type: node.type,
			name: node.name.toLowerCase() + "(",
			syntax: node
		};
		case "String":
			if (node.value.length === 3) return {
				type: "Token",
				value: node.value.charAt(1),
				syntax: node
			};
			return {
				type: node.type,
				value: node.value.substr(1, node.value.length - 2).replace(/\\'/g, "'"),
				syntax: node
			};
		case "Token": return {
			type: node.type,
			value: node.value,
			syntax: node
		};
		case "Comma": return {
			type: node.type,
			syntax: node
		};
		default: throw new Error("Unknown node type:", node.type);
	}
}
function buildMatchGraph(syntaxTree, ref) {
	if (typeof syntaxTree === "string") syntaxTree = parse$50(syntaxTree);
	return {
		type: "MatchGraph",
		match: buildMatchGraphInternal(syntaxTree),
		syntax: ref || null,
		source: syntaxTree
	};
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/lexer/match.js
const { hasOwnProperty: hasOwnProperty$2 } = Object.prototype;
const STUB = 0;
const TOKEN = 1;
const OPEN_SYNTAX = 2;
const CLOSE_SYNTAX = 3;
const EXIT_REASON_MATCH = "Match";
const EXIT_REASON_MISMATCH = "Mismatch";
const EXIT_REASON_ITERATION_LIMIT = "Maximum iteration number exceeded (please fill an issue on https://github.com/csstree/csstree/issues)";
const ITERATION_LIMIT = 15e3;
let totalIterationCount = 0;
function reverseList(list) {
	let prev = null;
	let next = null;
	let item = list;
	while (item !== null) {
		next = item.prev;
		item.prev = prev;
		prev = item;
		item = next;
	}
	return prev;
}
function areStringsEqualCaseInsensitive(testStr, referenceStr) {
	if (testStr.length !== referenceStr.length) return false;
	for (let i = 0; i < testStr.length; i++) {
		const referenceCode = referenceStr.charCodeAt(i);
		let testCode = testStr.charCodeAt(i);
		if (testCode >= 65 && testCode <= 90) testCode = testCode | 32;
		if (testCode !== referenceCode) return false;
	}
	return true;
}
function isContextEdgeDelim(token) {
	if (token.type !== Delim) return false;
	return token.value !== "?";
}
function isCommaContextStart(token) {
	if (token === null) return true;
	return token.type === Comma || token.type === Function || token.type === LeftParenthesis || token.type === LeftSquareBracket || token.type === LeftCurlyBracket || isContextEdgeDelim(token);
}
function isCommaContextEnd(token) {
	if (token === null) return true;
	return token.type === RightParenthesis || token.type === RightSquareBracket || token.type === RightCurlyBracket || token.type === Delim && token.value === "/";
}
function internalMatch(tokens, state, syntaxes) {
	function moveToNextToken() {
		do {
			tokenIndex++;
			token = tokenIndex < tokens.length ? tokens[tokenIndex] : null;
		} while (token !== null && (token.type === WhiteSpace || token.type === Comment));
	}
	function getNextToken(offset) {
		const nextIndex = tokenIndex + offset;
		return nextIndex < tokens.length ? tokens[nextIndex] : null;
	}
	function stateSnapshotFromSyntax(nextState, prev) {
		return {
			nextState,
			matchStack,
			syntaxStack,
			thenStack,
			tokenIndex,
			prev
		};
	}
	function pushThenStack(nextState) {
		thenStack = {
			nextState,
			matchStack,
			syntaxStack,
			prev: thenStack
		};
	}
	function pushElseStack(nextState) {
		elseStack = stateSnapshotFromSyntax(nextState, elseStack);
	}
	function addTokenToMatch() {
		matchStack = {
			type: TOKEN,
			syntax: state.syntax,
			token,
			prev: matchStack
		};
		moveToNextToken();
		syntaxStash = null;
		if (tokenIndex > longestMatch) longestMatch = tokenIndex;
	}
	function openSyntax() {
		syntaxStack = {
			syntax: state.syntax,
			opts: state.syntax.opts || syntaxStack !== null && syntaxStack.opts || null,
			prev: syntaxStack
		};
		matchStack = {
			type: OPEN_SYNTAX,
			syntax: state.syntax,
			token: matchStack.token,
			prev: matchStack
		};
	}
	function closeSyntax() {
		if (matchStack.type === OPEN_SYNTAX) matchStack = matchStack.prev;
		else matchStack = {
			type: CLOSE_SYNTAX,
			syntax: syntaxStack.syntax,
			token: matchStack.token,
			prev: matchStack
		};
		syntaxStack = syntaxStack.prev;
	}
	let syntaxStack = null;
	let thenStack = null;
	let elseStack = null;
	let syntaxStash = null;
	let iterationCount = 0;
	let exitReason = null;
	let token = null;
	let tokenIndex = -1;
	let longestMatch = 0;
	let matchStack = {
		type: STUB,
		syntax: null,
		token: null,
		prev: null
	};
	moveToNextToken();
	while (exitReason === null && ++iterationCount < ITERATION_LIMIT) switch (state.type) {
		case "Match":
			if (thenStack === null) {
				if (token !== null) {
					if (tokenIndex !== tokens.length - 1 || token.value !== "\\0" && token.value !== "\\9") {
						state = MISMATCH;
						break;
					}
				}
				exitReason = EXIT_REASON_MATCH;
				break;
			}
			state = thenStack.nextState;
			if (state === DISALLOW_EMPTY) if (thenStack.matchStack === matchStack) {
				state = MISMATCH;
				break;
			} else state = MATCH;
			while (thenStack.syntaxStack !== syntaxStack) closeSyntax();
			thenStack = thenStack.prev;
			break;
		case "Mismatch":
			if (syntaxStash !== null && syntaxStash !== false) {
				if (elseStack === null || tokenIndex > elseStack.tokenIndex) {
					elseStack = syntaxStash;
					syntaxStash = false;
				}
			} else if (elseStack === null) {
				exitReason = EXIT_REASON_MISMATCH;
				break;
			}
			state = elseStack.nextState;
			thenStack = elseStack.thenStack;
			syntaxStack = elseStack.syntaxStack;
			matchStack = elseStack.matchStack;
			tokenIndex = elseStack.tokenIndex;
			token = tokenIndex < tokens.length ? tokens[tokenIndex] : null;
			elseStack = elseStack.prev;
			break;
		case "MatchGraph":
			state = state.match;
			break;
		case "If":
			if (state.else !== MISMATCH) pushElseStack(state.else);
			if (state.then !== MATCH) pushThenStack(state.then);
			state = state.match;
			break;
		case "MatchOnce":
			state = {
				type: "MatchOnceBuffer",
				syntax: state,
				index: 0,
				mask: 0
			};
			break;
		case "MatchOnceBuffer": {
			const terms = state.syntax.terms;
			if (state.index === terms.length) {
				if (state.mask === 0 || state.syntax.all) {
					state = MISMATCH;
					break;
				}
				state = MATCH;
				break;
			}
			if (state.mask === (1 << terms.length) - 1) {
				state = MATCH;
				break;
			}
			for (; state.index < terms.length; state.index++) {
				const matchFlag = 1 << state.index;
				if ((state.mask & matchFlag) === 0) {
					pushElseStack(state);
					pushThenStack({
						type: "AddMatchOnce",
						syntax: state.syntax,
						mask: state.mask | matchFlag
					});
					state = terms[state.index++];
					break;
				}
			}
			break;
		}
		case "AddMatchOnce":
			state = {
				type: "MatchOnceBuffer",
				syntax: state.syntax,
				index: 0,
				mask: state.mask
			};
			break;
		case "Enum":
			if (token !== null) {
				let name$49 = token.value.toLowerCase();
				if (name$49.indexOf("\\") !== -1) name$49 = name$49.replace(/\\[09].*$/, "");
				if (hasOwnProperty$2.call(state.map, name$49)) {
					state = state.map[name$49];
					break;
				}
			}
			state = MISMATCH;
			break;
		case "Generic": {
			const opts = syntaxStack !== null ? syntaxStack.opts : null;
			const lastTokenIndex$1 = tokenIndex + Math.floor(state.fn(token, getNextToken, opts));
			if (!isNaN(lastTokenIndex$1) && lastTokenIndex$1 > tokenIndex) {
				while (tokenIndex < lastTokenIndex$1) addTokenToMatch();
				state = MATCH;
			} else state = MISMATCH;
			break;
		}
		case "Type":
		case "Property": {
			const syntaxDict = state.type === "Type" ? "types" : "properties";
			const dictSyntax = hasOwnProperty$2.call(syntaxes, syntaxDict) ? syntaxes[syntaxDict][state.name] : null;
			if (!dictSyntax || !dictSyntax.match) throw new Error("Bad syntax reference: " + (state.type === "Type" ? "<" + state.name + ">" : "<'" + state.name + "'>"));
			if (syntaxStash !== false && token !== null && state.type === "Type") {
				if (state.name === "custom-ident" && token.type === Ident || state.name === "length" && token.value === "0") {
					if (syntaxStash === null) syntaxStash = stateSnapshotFromSyntax(state, elseStack);
					state = MISMATCH;
					break;
				}
			}
			openSyntax();
			state = dictSyntax.matchRef || dictSyntax.match;
			break;
		}
		case "Keyword": {
			const name$49 = state.name;
			if (token !== null) {
				let keywordName = token.value;
				if (keywordName.indexOf("\\") !== -1) keywordName = keywordName.replace(/\\[09].*$/, "");
				if (areStringsEqualCaseInsensitive(keywordName, name$49)) {
					addTokenToMatch();
					state = MATCH;
					break;
				}
			}
			state = MISMATCH;
			break;
		}
		case "AtKeyword":
		case "Function":
			if (token !== null && areStringsEqualCaseInsensitive(token.value, state.name)) {
				addTokenToMatch();
				state = MATCH;
				break;
			}
			state = MISMATCH;
			break;
		case "Token":
			if (token !== null && token.value === state.value) {
				addTokenToMatch();
				state = MATCH;
				break;
			}
			state = MISMATCH;
			break;
		case "Comma":
			if (token !== null && token.type === Comma) if (isCommaContextStart(matchStack.token)) state = MISMATCH;
			else {
				addTokenToMatch();
				state = isCommaContextEnd(token) ? MISMATCH : MATCH;
			}
			else state = isCommaContextStart(matchStack.token) || isCommaContextEnd(token) ? MATCH : MISMATCH;
			break;
		case "String":
			let string = "";
			let lastTokenIndex = tokenIndex;
			for (; lastTokenIndex < tokens.length && string.length < state.value.length; lastTokenIndex++) string += tokens[lastTokenIndex].value;
			if (areStringsEqualCaseInsensitive(string, state.value)) {
				while (tokenIndex < lastTokenIndex) addTokenToMatch();
				state = MATCH;
			} else state = MISMATCH;
			break;
		default: throw new Error("Unknown node type: " + state.type);
	}
	totalIterationCount += iterationCount;
	switch (exitReason) {
		case null:
			console.warn("[csstree-match] BREAK after " + ITERATION_LIMIT + " iterations");
			exitReason = EXIT_REASON_ITERATION_LIMIT;
			matchStack = null;
			break;
		case EXIT_REASON_MATCH:
			while (syntaxStack !== null) closeSyntax();
			break;
		default: matchStack = null;
	}
	return {
		tokens,
		reason: exitReason,
		iterations: iterationCount,
		match: matchStack,
		longestMatch
	};
}
function matchAsTree(tokens, matchGraph, syntaxes) {
	const matchResult = internalMatch(tokens, matchGraph, syntaxes || {});
	if (matchResult.match === null) return matchResult;
	let item = matchResult.match;
	let host = matchResult.match = {
		syntax: matchGraph.syntax || null,
		match: []
	};
	const hostStack = [host];
	item = reverseList(item).prev;
	while (item !== null) {
		switch (item.type) {
			case OPEN_SYNTAX:
				host.match.push(host = {
					syntax: item.syntax,
					match: []
				});
				hostStack.push(host);
				break;
			case CLOSE_SYNTAX:
				hostStack.pop();
				host = hostStack[hostStack.length - 1];
				break;
			default: host.match.push({
				syntax: item.syntax || null,
				token: item.token.value,
				node: item.token.node
			});
		}
		item = item.prev;
	}
	return matchResult;
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/lexer/trace.js
var trace_exports = /* @__PURE__ */ __export({
	getTrace: () => getTrace,
	isKeyword: () => isKeyword,
	isProperty: () => isProperty,
	isType: () => isType
});
function getTrace(node) {
	function shouldPutToTrace(syntax) {
		if (syntax === null) return false;
		return syntax.type === "Type" || syntax.type === "Property" || syntax.type === "Keyword";
	}
	function hasMatch(matchNode) {
		if (Array.isArray(matchNode.match)) {
			for (let i = 0; i < matchNode.match.length; i++) if (hasMatch(matchNode.match[i])) {
				if (shouldPutToTrace(matchNode.syntax)) result.unshift(matchNode.syntax);
				return true;
			}
		} else if (matchNode.node === node) {
			result = shouldPutToTrace(matchNode.syntax) ? [matchNode.syntax] : [];
			return true;
		}
		return false;
	}
	let result = null;
	if (this.matched !== null) hasMatch(this.matched);
	return result;
}
function isType(node, type) {
	return testNode(this, node, (match) => match.type === "Type" && match.name === type);
}
function isProperty(node, property$1) {
	return testNode(this, node, (match) => match.type === "Property" && match.name === property$1);
}
function isKeyword(node) {
	return testNode(this, node, (match) => match.type === "Keyword");
}
function testNode(match, node, fn) {
	const trace = getTrace.call(match, node);
	if (trace === null) return false;
	return trace.some(fn);
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/lexer/search.js
function getFirstMatchNode(matchNode) {
	if ("node" in matchNode) return matchNode.node;
	return getFirstMatchNode(matchNode.match[0]);
}
function getLastMatchNode(matchNode) {
	if ("node" in matchNode) return matchNode.node;
	return getLastMatchNode(matchNode.match[matchNode.match.length - 1]);
}
function matchFragments(lexer$1, ast, match, type, name$49) {
	function findFragments(matchNode) {
		if (matchNode.syntax !== null && matchNode.syntax.type === type && matchNode.syntax.name === name$49) {
			const start = getFirstMatchNode(matchNode);
			const end = getLastMatchNode(matchNode);
			lexer$1.syntax.walk(ast, function(node, item, list) {
				if (node === start) {
					const nodes = new List();
					do {
						nodes.appendData(item.data);
						if (item.data === end) break;
						item = item.next;
					} while (item !== null);
					fragments.push({
						parent: list,
						nodes
					});
				}
			});
		}
		if (Array.isArray(matchNode.match)) matchNode.match.forEach(findFragments);
	}
	const fragments = [];
	if (match.matched !== null) findFragments(match.matched);
	return fragments;
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/lexer/structure.js
const { hasOwnProperty: hasOwnProperty$1 } = Object.prototype;
function isValidNumber(value) {
	return typeof value === "number" && isFinite(value) && Math.floor(value) === value && value >= 0;
}
function isValidLocation(loc) {
	return Boolean(loc) && isValidNumber(loc.offset) && isValidNumber(loc.line) && isValidNumber(loc.column);
}
function createNodeStructureChecker(type, fields) {
	return function checkNode(node, warn) {
		if (!node || node.constructor !== Object) return warn(node, "Type of node should be an Object");
		for (let key in node) {
			let valid = true;
			if (hasOwnProperty$1.call(node, key) === false) continue;
			if (key === "type") {
				if (node.type !== type) warn(node, "Wrong node type `" + node.type + "`, expected `" + type + "`");
			} else if (key === "loc") {
				if (node.loc === null) continue;
				else if (node.loc && node.loc.constructor === Object) if (typeof node.loc.source !== "string") key += ".source";
				else if (!isValidLocation(node.loc.start)) key += ".start";
				else if (!isValidLocation(node.loc.end)) key += ".end";
				else continue;
				valid = false;
			} else if (fields.hasOwnProperty(key)) {
				valid = false;
				for (let i = 0; !valid && i < fields[key].length; i++) {
					const fieldType = fields[key][i];
					switch (fieldType) {
						case String:
							valid = typeof node[key] === "string";
							break;
						case Boolean:
							valid = typeof node[key] === "boolean";
							break;
						case null:
							valid = node[key] === null;
							break;
						default: if (typeof fieldType === "string") valid = node[key] && node[key].type === fieldType;
						else if (Array.isArray(fieldType)) valid = node[key] instanceof List;
					}
				}
			} else warn(node, "Unknown field `" + key + "` for " + type + " node type");
			if (!valid) warn(node, "Bad value for `" + type + "." + key + "`");
		}
		for (const key in fields) if (hasOwnProperty$1.call(fields, key) && hasOwnProperty$1.call(node, key) === false) warn(node, "Field `" + type + "." + key + "` is missed");
	};
}
function genTypesList(fieldTypes, path) {
	const docsTypes = [];
	for (let i = 0; i < fieldTypes.length; i++) {
		const fieldType = fieldTypes[i];
		if (fieldType === String || fieldType === Boolean) docsTypes.push(fieldType.name.toLowerCase());
		else if (fieldType === null) docsTypes.push("null");
		else if (typeof fieldType === "string") docsTypes.push(fieldType);
		else if (Array.isArray(fieldType)) docsTypes.push("List<" + (genTypesList(fieldType, path) || "any") + ">");
		else throw new Error("Wrong value `" + fieldType + "` in `" + path + "` structure definition");
	}
	return docsTypes.join(" | ");
}
function processStructure(name$49, nodeType) {
	const structure$49 = nodeType.structure;
	const fields = {
		type: String,
		loc: true
	};
	const docs = { type: "\"" + name$49 + "\"" };
	for (const key in structure$49) {
		if (hasOwnProperty$1.call(structure$49, key) === false) continue;
		docs[key] = genTypesList(fields[key] = Array.isArray(structure$49[key]) ? structure$49[key].slice() : [structure$49[key]], name$49 + "." + key);
	}
	return {
		docs,
		check: createNodeStructureChecker(name$49, fields)
	};
}
function getStructureFromConfig(config) {
	const structure$49 = {};
	if (config.node) {
		for (const name$49 in config.node) if (hasOwnProperty$1.call(config.node, name$49)) {
			const nodeType = config.node[name$49];
			if (nodeType.structure) structure$49[name$49] = processStructure(name$49, nodeType);
			else throw new Error("Missed `structure` field in `" + name$49 + "` node type definition");
		}
	}
	return structure$49;
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/lexer/Lexer.js
function dumpMapSyntax(map, compact, syntaxAsAst) {
	const result = {};
	for (const name$49 in map) if (map[name$49].syntax) result[name$49] = syntaxAsAst ? map[name$49].syntax : generate$50(map[name$49].syntax, { compact });
	return result;
}
function dumpAtruleMapSyntax(map, compact, syntaxAsAst) {
	const result = {};
	for (const [name$49, atrule] of Object.entries(map)) result[name$49] = {
		prelude: atrule.prelude && (syntaxAsAst ? atrule.prelude.syntax : generate$50(atrule.prelude.syntax, { compact })),
		descriptors: atrule.descriptors && dumpMapSyntax(atrule.descriptors, compact, syntaxAsAst)
	};
	return result;
}
function valueHasVar(tokens) {
	for (let i = 0; i < tokens.length; i++) if (tokens[i].value.toLowerCase() === "var(") return true;
	return false;
}
function syntaxHasTopLevelCommaMultiplier(syntax) {
	const singleTerm = syntax.terms[0];
	return syntax.explicit === false && syntax.terms.length === 1 && singleTerm.type === "Multiplier" && singleTerm.comma === true;
}
function buildMatchResult(matched, error, iterations) {
	return {
		matched,
		iterations,
		error,
		...trace_exports
	};
}
function matchSyntax(lexer$1, syntax, value, useCssWideKeywords) {
	const tokens = prepare_tokens_default(value, lexer$1.syntax);
	let result;
	if (valueHasVar(tokens)) return buildMatchResult(null, /* @__PURE__ */ new Error("Matching for a tree with var() is not supported"));
	if (useCssWideKeywords) result = matchAsTree(tokens, lexer$1.cssWideKeywordsSyntax, lexer$1);
	if (!useCssWideKeywords || !result.match) {
		result = matchAsTree(tokens, syntax.match, lexer$1);
		if (!result.match) return buildMatchResult(null, new SyntaxMatchError(result.reason, syntax.syntax, value, result), result.iterations);
	}
	return buildMatchResult(result.match, null, result.iterations);
}
var Lexer = class {
	constructor(config, syntax, structure$49) {
		this.cssWideKeywords = cssWideKeywords;
		this.syntax = syntax;
		this.generic = false;
		this.units = { ...units_exports };
		this.atrules = Object.create(null);
		this.properties = Object.create(null);
		this.types = Object.create(null);
		this.structure = structure$49 || getStructureFromConfig(config);
		if (config) {
			if (config.cssWideKeywords) this.cssWideKeywords = config.cssWideKeywords;
			if (config.units) {
				for (const group of Object.keys(units_exports)) if (Array.isArray(config.units[group])) this.units[group] = config.units[group];
			}
			if (config.types) for (const [name$49, type] of Object.entries(config.types)) this.addType_(name$49, type);
			if (config.generic) {
				this.generic = true;
				for (const [name$49, value] of Object.entries(createGenericTypes(this.units))) this.addType_(name$49, value);
			}
			if (config.atrules) for (const [name$49, atrule] of Object.entries(config.atrules)) this.addAtrule_(name$49, atrule);
			if (config.properties) for (const [name$49, property$1] of Object.entries(config.properties)) this.addProperty_(name$49, property$1);
		}
		this.cssWideKeywordsSyntax = buildMatchGraph(this.cssWideKeywords.join(" |  "));
	}
	checkStructure(ast) {
		function collectWarning(node, message) {
			warns.push({
				node,
				message
			});
		}
		const structure$49 = this.structure;
		const warns = [];
		this.syntax.walk(ast, function(node) {
			if (structure$49.hasOwnProperty(node.type)) structure$49[node.type].check(node, collectWarning);
			else collectWarning(node, "Unknown node type `" + node.type + "`");
		});
		return warns.length ? warns : false;
	}
	createDescriptor(syntax, type, name$49, parent = null) {
		const ref = {
			type,
			name: name$49
		};
		const descriptor = {
			type,
			name: name$49,
			parent,
			serializable: typeof syntax === "string" || syntax && typeof syntax.type === "string",
			syntax: null,
			match: null,
			matchRef: null
		};
		if (typeof syntax === "function") descriptor.match = buildMatchGraph(syntax, ref);
		else {
			if (typeof syntax === "string") Object.defineProperty(descriptor, "syntax", { get() {
				Object.defineProperty(descriptor, "syntax", { value: parse$50(syntax) });
				return descriptor.syntax;
			} });
			else descriptor.syntax = syntax;
			Object.defineProperty(descriptor, "match", { get() {
				Object.defineProperty(descriptor, "match", { value: buildMatchGraph(descriptor.syntax, ref) });
				return descriptor.match;
			} });
			if (type === "Property") Object.defineProperty(descriptor, "matchRef", { get() {
				const syntax$1 = descriptor.syntax;
				const value = syntaxHasTopLevelCommaMultiplier(syntax$1) ? buildMatchGraph({
					...syntax$1,
					terms: [syntax$1.terms[0].term]
				}, ref) : null;
				Object.defineProperty(descriptor, "matchRef", { value });
				return value;
			} });
		}
		return descriptor;
	}
	addAtrule_(name$49, syntax) {
		if (!syntax) return;
		this.atrules[name$49] = {
			type: "Atrule",
			name: name$49,
			prelude: syntax.prelude ? this.createDescriptor(syntax.prelude, "AtrulePrelude", name$49) : null,
			descriptors: syntax.descriptors ? Object.keys(syntax.descriptors).reduce((map, descName) => {
				map[descName] = this.createDescriptor(syntax.descriptors[descName], "AtruleDescriptor", descName, name$49);
				return map;
			}, Object.create(null)) : null
		};
	}
	addProperty_(name$49, syntax) {
		if (!syntax) return;
		this.properties[name$49] = this.createDescriptor(syntax, "Property", name$49);
	}
	addType_(name$49, syntax) {
		if (!syntax) return;
		this.types[name$49] = this.createDescriptor(syntax, "Type", name$49);
	}
	checkAtruleName(atruleName) {
		if (!this.getAtrule(atruleName)) return new SyntaxReferenceError("Unknown at-rule", "@" + atruleName);
	}
	checkAtrulePrelude(atruleName, prelude) {
		const error = this.checkAtruleName(atruleName);
		if (error) return error;
		const atrule = this.getAtrule(atruleName);
		if (!atrule.prelude && prelude) return /* @__PURE__ */ new SyntaxError("At-rule `@" + atruleName + "` should not contain a prelude");
		if (atrule.prelude && !prelude) {
			if (!matchSyntax(this, atrule.prelude, "", false).matched) return /* @__PURE__ */ new SyntaxError("At-rule `@" + atruleName + "` should contain a prelude");
		}
	}
	checkAtruleDescriptorName(atruleName, descriptorName) {
		const error = this.checkAtruleName(atruleName);
		if (error) return error;
		const atrule = this.getAtrule(atruleName);
		const descriptor = keyword(descriptorName);
		if (!atrule.descriptors) return /* @__PURE__ */ new SyntaxError("At-rule `@" + atruleName + "` has no known descriptors");
		if (!atrule.descriptors[descriptor.name] && !atrule.descriptors[descriptor.basename]) return new SyntaxReferenceError("Unknown at-rule descriptor", descriptorName);
	}
	checkPropertyName(propertyName) {
		if (!this.getProperty(propertyName)) return new SyntaxReferenceError("Unknown property", propertyName);
	}
	matchAtrulePrelude(atruleName, prelude) {
		const error = this.checkAtrulePrelude(atruleName, prelude);
		if (error) return buildMatchResult(null, error);
		const atrule = this.getAtrule(atruleName);
		if (!atrule.prelude) return buildMatchResult(null, null);
		return matchSyntax(this, atrule.prelude, prelude || "", false);
	}
	matchAtruleDescriptor(atruleName, descriptorName, value) {
		const error = this.checkAtruleDescriptorName(atruleName, descriptorName);
		if (error) return buildMatchResult(null, error);
		const atrule = this.getAtrule(atruleName);
		const descriptor = keyword(descriptorName);
		return matchSyntax(this, atrule.descriptors[descriptor.name] || atrule.descriptors[descriptor.basename], value, false);
	}
	matchDeclaration(node) {
		if (node.type !== "Declaration") return buildMatchResult(null, /* @__PURE__ */ new Error("Not a Declaration node"));
		return this.matchProperty(node.property, node.value);
	}
	matchProperty(propertyName, value) {
		if (property(propertyName).custom) return buildMatchResult(null, /* @__PURE__ */ new Error("Lexer matching doesn't applicable for custom properties"));
		const error = this.checkPropertyName(propertyName);
		if (error) return buildMatchResult(null, error);
		return matchSyntax(this, this.getProperty(propertyName), value, true);
	}
	matchType(typeName, value) {
		const typeSyntax = this.getType(typeName);
		if (!typeSyntax) return buildMatchResult(null, new SyntaxReferenceError("Unknown type", typeName));
		return matchSyntax(this, typeSyntax, value, false);
	}
	match(syntax, value) {
		if (typeof syntax !== "string" && (!syntax || !syntax.type)) return buildMatchResult(null, new SyntaxReferenceError("Bad syntax"));
		if (typeof syntax === "string" || !syntax.match) syntax = this.createDescriptor(syntax, "Type", "anonymous");
		return matchSyntax(this, syntax, value, false);
	}
	findValueFragments(propertyName, value, type, name$49) {
		return matchFragments(this, value, this.matchProperty(propertyName, value), type, name$49);
	}
	findDeclarationValueFragments(declaration, type, name$49) {
		return matchFragments(this, declaration.value, this.matchDeclaration(declaration), type, name$49);
	}
	findAllFragments(ast, type, name$49) {
		const result = [];
		this.syntax.walk(ast, {
			visit: "Declaration",
			enter: (declaration) => {
				result.push.apply(result, this.findDeclarationValueFragments(declaration, type, name$49));
			}
		});
		return result;
	}
	getAtrule(atruleName, fallbackBasename = true) {
		const atrule = keyword(atruleName);
		return (atrule.vendor && fallbackBasename ? this.atrules[atrule.name] || this.atrules[atrule.basename] : this.atrules[atrule.name]) || null;
	}
	getAtrulePrelude(atruleName, fallbackBasename = true) {
		const atrule = this.getAtrule(atruleName, fallbackBasename);
		return atrule && atrule.prelude || null;
	}
	getAtruleDescriptor(atruleName, name$49) {
		return this.atrules.hasOwnProperty(atruleName) && this.atrules.declarators ? this.atrules[atruleName].declarators[name$49] || null : null;
	}
	getProperty(propertyName, fallbackBasename = true) {
		const property$1 = property(propertyName);
		return (property$1.vendor && fallbackBasename ? this.properties[property$1.name] || this.properties[property$1.basename] : this.properties[property$1.name]) || null;
	}
	getType(name$49) {
		return hasOwnProperty.call(this.types, name$49) ? this.types[name$49] : null;
	}
	validate() {
		function syntaxRef(name$49, isType$1) {
			return isType$1 ? `<${name$49}>` : `<'${name$49}'>`;
		}
		function validate(syntax, name$49, broken, descriptor) {
			if (broken.has(name$49)) return broken.get(name$49);
			broken.set(name$49, false);
			if (descriptor.syntax !== null) walk$1(descriptor.syntax, function(node) {
				if (node.type !== "Type" && node.type !== "Property") return;
				const map = node.type === "Type" ? syntax.types : syntax.properties;
				const brokenMap = node.type === "Type" ? brokenTypes : brokenProperties;
				if (!hasOwnProperty.call(map, node.name)) {
					errors.push(`${syntaxRef(name$49, broken === brokenTypes)} used missed syntax definition ${syntaxRef(node.name, node.type === "Type")}`);
					broken.set(name$49, true);
				} else if (validate(syntax, node.name, brokenMap, map[node.name])) {
					errors.push(`${syntaxRef(name$49, broken === brokenTypes)} used broken syntax definition ${syntaxRef(node.name, node.type === "Type")}`);
					broken.set(name$49, true);
				}
			}, this);
		}
		const errors = [];
		let brokenTypes = /* @__PURE__ */ new Map();
		let brokenProperties = /* @__PURE__ */ new Map();
		for (const key in this.types) validate(this, key, brokenTypes, this.types[key]);
		for (const key in this.properties) validate(this, key, brokenProperties, this.properties[key]);
		const brokenTypesArray = [...brokenTypes.keys()].filter((name$49) => brokenTypes.get(name$49));
		const brokenPropertiesArray = [...brokenProperties.keys()].filter((name$49) => brokenProperties.get(name$49));
		if (brokenTypesArray.length || brokenPropertiesArray.length) return {
			errors,
			types: brokenTypesArray,
			properties: brokenPropertiesArray
		};
		return null;
	}
	dump(syntaxAsAst, pretty) {
		return {
			generic: this.generic,
			cssWideKeywords: this.cssWideKeywords,
			units: this.units,
			types: dumpMapSyntax(this.types, !pretty, syntaxAsAst),
			properties: dumpMapSyntax(this.properties, !pretty, syntaxAsAst),
			atrules: dumpAtruleMapSyntax(this.atrules, !pretty, syntaxAsAst)
		};
	}
	toString() {
		return JSON.stringify(this.dump());
	}
};

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/config/mix.js
function appendOrSet(a, b) {
	if (typeof b === "string" && /^\s*\|/.test(b)) return typeof a === "string" ? a + b : b.replace(/^\s*\|\s*/, "");
	return b || null;
}
function sliceProps(obj, props) {
	const result = Object.create(null);
	for (const [key, value] of Object.entries(obj)) if (value) {
		result[key] = {};
		for (const prop of Object.keys(value)) if (props.includes(prop)) result[key][prop] = value[prop];
	}
	return result;
}
function mix(dest, src) {
	const result = { ...dest };
	for (const [prop, value] of Object.entries(src)) switch (prop) {
		case "generic":
			result[prop] = Boolean(value);
			break;
		case "cssWideKeywords":
			result[prop] = dest[prop] ? [...dest[prop], ...value] : value || [];
			break;
		case "units":
			result[prop] = { ...dest[prop] };
			for (const [name$49, patch$1] of Object.entries(value)) result[prop][name$49] = Array.isArray(patch$1) ? patch$1 : [];
			break;
		case "atrules":
			result[prop] = { ...dest[prop] };
			for (const [name$49, atrule] of Object.entries(value)) {
				const exists = result[prop][name$49] || {};
				const current = result[prop][name$49] = {
					prelude: exists.prelude || null,
					descriptors: { ...exists.descriptors }
				};
				if (!atrule) continue;
				current.prelude = atrule.prelude ? appendOrSet(current.prelude, atrule.prelude) : current.prelude || null;
				for (const [descriptorName, descriptorValue] of Object.entries(atrule.descriptors || {})) current.descriptors[descriptorName] = descriptorValue ? appendOrSet(current.descriptors[descriptorName], descriptorValue) : null;
				if (!Object.keys(current.descriptors).length) current.descriptors = null;
			}
			break;
		case "types":
		case "properties":
			result[prop] = { ...dest[prop] };
			for (const [name$49, syntax] of Object.entries(value)) result[prop][name$49] = appendOrSet(result[prop][name$49], syntax);
			break;
		case "scope":
		case "features":
			result[prop] = { ...dest[prop] };
			for (const [name$49, props] of Object.entries(value)) result[prop][name$49] = {
				...result[prop][name$49],
				...props
			};
			break;
		case "parseContext":
			result[prop] = {
				...dest[prop],
				...value
			};
			break;
		case "atrule":
		case "pseudo":
			result[prop] = {
				...dest[prop],
				...sliceProps(value, ["parse"])
			};
			break;
		case "node":
			result[prop] = {
				...dest[prop],
				...sliceProps(value, [
					"name",
					"structure",
					"parse",
					"generate",
					"walkContext"
				])
			};
			break;
	}
	return result;
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/create.js
function createSyntax(config) {
	const parse$51 = createParser(config);
	const walk$2 = createWalker(config);
	const generate$51 = createGenerator(config);
	const { fromPlainObject: fromPlainObject$1, toPlainObject: toPlainObject$1 } = createConvertor(walk$2);
	const syntax = {
		lexer: null,
		createLexer: (config$1) => new Lexer(config$1, syntax, syntax.lexer.structure),
		tokenize: tokenize$1,
		parse: parse$51,
		generate: generate$51,
		walk: walk$2,
		find: walk$2.find,
		findLast: walk$2.findLast,
		findAll: walk$2.findAll,
		fromPlainObject: fromPlainObject$1,
		toPlainObject: toPlainObject$1,
		fork(extension) {
			const base = mix({}, config);
			return createSyntax(typeof extension === "function" ? extension(base) : mix(base, extension));
		}
	};
	syntax.lexer = new Lexer({
		generic: config.generic,
		cssWideKeywords: config.cssWideKeywords,
		units: config.units,
		types: config.types,
		atrules: config.atrules,
		properties: config.properties,
		node: config.node
	}, syntax);
	return syntax;
}
var create_default = (config) => createSyntax(mix({}, config));

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/data-patch.js
const patch = {
	"atrules": {
		"charset": { "prelude": "<string>" },
		"container": { "prelude": "[ <container-name> ]? <container-condition>" },
		"font-face": { "descriptors": { "unicode-range": {
			"comment": "replaces <unicode-range>, an old production name",
			"syntax": "<urange>#"
		} } },
		"nest": { "prelude": "<complex-selector-list>" },
		"scope": { "prelude": "[ ( <scope-start> ) ]? [ to ( <scope-end> ) ]?" },
		"position-try": {
			"comment": "The list of descriptors: https://developer.mozilla.org/en-US/docs/Web/CSS/@position-try",
			"descriptors": {
				"top": "<'top'>",
				"left": "<'left'>",
				"bottom": "<'bottom'>",
				"right": "<'right'>",
				"inset-block-start": "<'inset-block-start'>",
				"inset-block-end": "<'inset-block-end'>",
				"inset-inline-start": "<'inset-inline-start'>",
				"inset-inline-end": "<'inset-inline-end'>",
				"inset-block": "<'inset-block'>",
				"inset-inline": "<'inset-inline'>",
				"inset": "<'inset'>",
				"margin-top": "<'margin-top'>",
				"margin-left": "<'margin-left'>",
				"margin-bottom": "<'margin-bottom'>",
				"margin-right": "<'margin-right'>",
				"margin-block-start": "<'margin-block-start'>",
				"margin-block-end": "<'margin-block-end'>",
				"margin-inline-start": "<'margin-inline-start'>",
				"margin-inline-end": "<'margin-inline-end'>",
				"margin": "<'margin'>",
				"margin-block": "<'margin-block'>",
				"margin-inline": "<'margin-inline'>",
				"width": "<'width'>",
				"height": "<'height'>",
				"min-width": "<'min-width'>",
				"min-height": "<'min-height'>",
				"max-width": "<'max-width'>",
				"max-height": "<'max-height'>",
				"block-size": "<'block-size'>",
				"inline-size": "<'inline-size'>",
				"min-block-size": "<'min-block-size'>",
				"min-inline-size": "<'min-inline-size'>",
				"max-block-size": "<'max-block-size'>",
				"max-inline-size": "<'max-inline-size'>",
				"align-self": "<'align-self'> | anchor-center",
				"justify-self": "<'justify-self'> | anchor-center"
			}
		}
	},
	"properties": {
		"-moz-background-clip": {
			"comment": "deprecated syntax in old Firefox, https://developer.mozilla.org/en/docs/Web/CSS/background-clip",
			"syntax": "padding | border"
		},
		"-moz-border-radius-bottomleft": {
			"comment": "https://developer.mozilla.org/en-US/docs/Web/CSS/border-bottom-left-radius",
			"syntax": "<'border-bottom-left-radius'>"
		},
		"-moz-border-radius-bottomright": {
			"comment": "https://developer.mozilla.org/en-US/docs/Web/CSS/border-bottom-right-radius",
			"syntax": "<'border-bottom-right-radius'>"
		},
		"-moz-border-radius-topleft": {
			"comment": "https://developer.mozilla.org/en-US/docs/Web/CSS/border-top-left-radius",
			"syntax": "<'border-top-left-radius'>"
		},
		"-moz-border-radius-topright": {
			"comment": "https://developer.mozilla.org/en-US/docs/Web/CSS/border-bottom-right-radius",
			"syntax": "<'border-bottom-right-radius'>"
		},
		"-moz-control-character-visibility": {
			"comment": "firefox specific keywords, https://bugzilla.mozilla.org/show_bug.cgi?id=947588",
			"syntax": "visible | hidden"
		},
		"-moz-osx-font-smoothing": {
			"comment": "misssed old syntax https://developer.mozilla.org/en-US/docs/Web/CSS/font-smooth",
			"syntax": "auto | grayscale"
		},
		"-moz-user-select": {
			"comment": "https://developer.mozilla.org/en-US/docs/Web/CSS/user-select",
			"syntax": "none | text | all | -moz-none"
		},
		"-ms-flex-align": {
			"comment": "misssed old syntax implemented in IE, https://www.w3.org/TR/2012/WD-css3-flexbox-20120322/#flex-align",
			"syntax": "start | end | center | baseline | stretch"
		},
		"-ms-flex-item-align": {
			"comment": "misssed old syntax implemented in IE, https://www.w3.org/TR/2012/WD-css3-flexbox-20120322/#flex-align",
			"syntax": "auto | start | end | center | baseline | stretch"
		},
		"-ms-flex-line-pack": {
			"comment": "misssed old syntax implemented in IE, https://www.w3.org/TR/2012/WD-css3-flexbox-20120322/#flex-line-pack",
			"syntax": "start | end | center | justify | distribute | stretch"
		},
		"-ms-flex-negative": {
			"comment": "misssed old syntax implemented in IE; TODO: find references for comfirmation",
			"syntax": "<'flex-shrink'>"
		},
		"-ms-flex-pack": {
			"comment": "misssed old syntax implemented in IE, https://www.w3.org/TR/2012/WD-css3-flexbox-20120322/#flex-pack",
			"syntax": "start | end | center | justify | distribute"
		},
		"-ms-flex-order": {
			"comment": "misssed old syntax implemented in IE; https://msdn.microsoft.com/en-us/library/jj127303(v=vs.85).aspx",
			"syntax": "<integer>"
		},
		"-ms-flex-positive": {
			"comment": "misssed old syntax implemented in IE; TODO: find references for comfirmation",
			"syntax": "<'flex-grow'>"
		},
		"-ms-flex-preferred-size": {
			"comment": "misssed old syntax implemented in IE; TODO: find references for comfirmation",
			"syntax": "<'flex-basis'>"
		},
		"-ms-interpolation-mode": {
			"comment": "https://msdn.microsoft.com/en-us/library/ff521095(v=vs.85).aspx",
			"syntax": "nearest-neighbor | bicubic"
		},
		"-ms-grid-column-align": {
			"comment": "add this property first since it uses as fallback for flexbox, https://msdn.microsoft.com/en-us/library/windows/apps/hh466338.aspx",
			"syntax": "start | end | center | stretch"
		},
		"-ms-grid-row-align": {
			"comment": "add this property first since it uses as fallback for flexbox, https://msdn.microsoft.com/en-us/library/windows/apps/hh466348.aspx",
			"syntax": "start | end | center | stretch"
		},
		"-ms-hyphenate-limit-last": {
			"comment": "misssed old syntax implemented in IE; https://www.w3.org/TR/css-text-4/#hyphenate-line-limits",
			"syntax": "none | always | column | page | spread"
		},
		"-webkit-appearance": {
			"comment": "webkit specific keywords",
			"references": ["http://css-infos.net/property/-webkit-appearance"],
			"syntax": "none | button | button-bevel | caps-lock-indicator | caret | checkbox | default-button | inner-spin-button | listbox | listitem | media-controls-background | media-controls-fullscreen-background | media-current-time-display | media-enter-fullscreen-button | media-exit-fullscreen-button | media-fullscreen-button | media-mute-button | media-overlay-play-button | media-play-button | media-seek-back-button | media-seek-forward-button | media-slider | media-sliderthumb | media-time-remaining-display | media-toggle-closed-captions-button | media-volume-slider | media-volume-slider-container | media-volume-sliderthumb | menulist | menulist-button | menulist-text | menulist-textfield | meter | progress-bar | progress-bar-value | push-button | radio | scrollbarbutton-down | scrollbarbutton-left | scrollbarbutton-right | scrollbarbutton-up | scrollbargripper-horizontal | scrollbargripper-vertical | scrollbarthumb-horizontal | scrollbarthumb-vertical | scrollbartrack-horizontal | scrollbartrack-vertical | searchfield | searchfield-cancel-button | searchfield-decoration | searchfield-results-button | searchfield-results-decoration | slider-horizontal | slider-vertical | sliderthumb-horizontal | sliderthumb-vertical | square-button | textarea | textfield | -apple-pay-button"
		},
		"-webkit-background-clip": {
			"comment": "https://developer.mozilla.org/en/docs/Web/CSS/background-clip",
			"syntax": "[ <box> | border | padding | content | text ]#"
		},
		"-webkit-column-break-after": {
			"comment": "added, http://help.dottoro.com/lcrthhhv.php",
			"syntax": "always | auto | avoid"
		},
		"-webkit-column-break-before": {
			"comment": "added, http://help.dottoro.com/lcxquvkf.php",
			"syntax": "always | auto | avoid"
		},
		"-webkit-column-break-inside": {
			"comment": "added, http://help.dottoro.com/lclhnthl.php",
			"syntax": "always | auto | avoid"
		},
		"-webkit-font-smoothing": {
			"comment": "https://developer.mozilla.org/en-US/docs/Web/CSS/font-smooth",
			"syntax": "auto | none | antialiased | subpixel-antialiased"
		},
		"-webkit-mask-box-image": {
			"comment": "missed; https://developer.mozilla.org/en-US/docs/Web/CSS/-webkit-mask-box-image",
			"syntax": "[ <url> | <gradient> | none ] [ <length-percentage>{4} <-webkit-mask-box-repeat>{2} ]?"
		},
		"-webkit-print-color-adjust": {
			"comment": "missed",
			"references": ["https://developer.mozilla.org/en/docs/Web/CSS/-webkit-print-color-adjust"],
			"syntax": "economy | exact"
		},
		"-webkit-text-security": {
			"comment": "missed; http://help.dottoro.com/lcbkewgt.php",
			"syntax": "none | circle | disc | square"
		},
		"-webkit-user-drag": {
			"comment": "missed; http://help.dottoro.com/lcbixvwm.php",
			"syntax": "none | element | auto"
		},
		"-webkit-user-select": {
			"comment": "auto is supported by old webkit, https://developer.mozilla.org/en-US/docs/Web/CSS/user-select",
			"syntax": "auto | none | text | all"
		},
		"alignment-baseline": {
			"comment": "added SVG property",
			"references": ["https://www.w3.org/TR/SVG/text.html#AlignmentBaselineProperty"],
			"syntax": "auto | baseline | before-edge | text-before-edge | middle | central | after-edge | text-after-edge | ideographic | alphabetic | hanging | mathematical"
		},
		"background-clip": {
			"comment": "used <bg-clip> from CSS Backgrounds and Borders 4 since it adds new values",
			"references": ["https://github.com/csstree/csstree/issues/190"],
			"syntax": "<bg-clip>#"
		},
		"baseline-shift": {
			"comment": "added SVG property",
			"references": ["https://www.w3.org/TR/SVG/text.html#BaselineShiftProperty"],
			"syntax": "baseline | sub | super | <svg-length>"
		},
		"behavior": {
			"comment": "added old IE property https://msdn.microsoft.com/en-us/library/ms530723(v=vs.85).aspx",
			"syntax": "<url>+"
		},
		"container-type": {
			"comment": "https://www.w3.org/TR/css-contain-3/#propdef-container-type",
			"syntax": "normal || [ size | inline-size ]"
		},
		"cue": {
			"comment": "https://www.w3.org/TR/css3-speech/#property-index",
			"syntax": "<'cue-before'> <'cue-after'>?"
		},
		"cue-after": {
			"comment": "https://www.w3.org/TR/css3-speech/#property-index",
			"syntax": "<url> <decibel>? | none"
		},
		"cue-before": {
			"comment": "https://www.w3.org/TR/css3-speech/#property-index",
			"syntax": "<url> <decibel>? | none"
		},
		"cursor": {
			"comment": "added legacy keywords: hand, -webkit-grab. -webkit-grabbing, -webkit-zoom-in, -webkit-zoom-out, -moz-grab, -moz-grabbing, -moz-zoom-in, -moz-zoom-out",
			"references": ["https://www.sitepoint.com/css3-cursor-styles/"],
			"syntax": "[ [ <url> [ <x> <y> ]? , ]* [ auto | default | none | context-menu | help | pointer | progress | wait | cell | crosshair | text | vertical-text | alias | copy | move | no-drop | not-allowed | e-resize | n-resize | ne-resize | nw-resize | s-resize | se-resize | sw-resize | w-resize | ew-resize | ns-resize | nesw-resize | nwse-resize | col-resize | row-resize | all-scroll | zoom-in | zoom-out | grab | grabbing | hand | -webkit-grab | -webkit-grabbing | -webkit-zoom-in | -webkit-zoom-out | -moz-grab | -moz-grabbing | -moz-zoom-in | -moz-zoom-out ] ]"
		},
		"display": {
			"comment": "extended with -ms-flexbox",
			"syntax": "| <-non-standard-display>"
		},
		"position": {
			"comment": "extended with -webkit-sticky",
			"syntax": "| -webkit-sticky"
		},
		"dominant-baseline": {
			"comment": "added SVG property",
			"references": ["https://www.w3.org/TR/SVG/text.html#DominantBaselineProperty"],
			"syntax": "auto | use-script | no-change | reset-size | ideographic | alphabetic | hanging | mathematical | central | middle | text-after-edge | text-before-edge"
		},
		"image-rendering": {
			"comment": "extended with <-non-standard-image-rendering>, added SVG keywords optimizeSpeed and optimizeQuality",
			"references": ["https://developer.mozilla.org/en/docs/Web/CSS/image-rendering", "https://www.w3.org/TR/SVG/painting.html#ImageRenderingProperty"],
			"syntax": "| optimizeSpeed | optimizeQuality | <-non-standard-image-rendering>"
		},
		"fill": {
			"comment": "added SVG property",
			"references": ["https://www.w3.org/TR/SVG/painting.html#FillProperty"],
			"syntax": "<paint>"
		},
		"fill-opacity": {
			"comment": "added SVG property",
			"references": ["https://www.w3.org/TR/SVG/painting.html#FillProperty"],
			"syntax": "<number-zero-one>"
		},
		"filter": {
			"comment": "extend with IE legacy syntaxes",
			"syntax": "| <-ms-filter-function-list>"
		},
		"font": {
			"comment": "align with font-4, fix <'font-family'>#, add non standard fonts",
			"references": [
				"https://drafts.csswg.org/css-fonts-4/#font-prop",
				"https://github.com/w3c/csswg-drafts/pull/10832",
				"https://webkit.org/blog/3709/using-the-system-font-in-web-content/"
			],
			"syntax": "[ [ <'font-style'> || <font-variant-css2> || <'font-weight'> || <font-width-css3> ]? <'font-size'> [ / <'line-height'> ]? <'font-family'># ] | <system-family-name> | <-non-standard-font>"
		},
		"glyph-orientation-horizontal": {
			"comment": "added SVG property",
			"references": ["https://www.w3.org/TR/SVG/text.html#GlyphOrientationHorizontalProperty"],
			"syntax": "<angle>"
		},
		"glyph-orientation-vertical": {
			"comment": "added SVG property",
			"references": ["https://www.w3.org/TR/SVG/text.html#GlyphOrientationVerticalProperty"],
			"syntax": "<angle>"
		},
		"kerning": {
			"comment": "added SVG property",
			"references": ["https://www.w3.org/TR/SVG/text.html#KerningProperty"],
			"syntax": "auto | <svg-length>"
		},
		"letter-spacing": {
			"comment": "fix syntax <length> -> <length-percentage>",
			"references": ["https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/letter-spacing"],
			"syntax": "normal | <length-percentage>"
		},
		"max-width": {
			"comment": "extend by non-standard size keywords https://developer.mozilla.org/en-US/docs/Web/CSS/width",
			"syntax": "| stretch | <-non-standard-size>"
		},
		"max-height": {
			"comment": "extend by non-standard size keywords https://developer.mozilla.org/en-US/docs/Web/CSS/width",
			"syntax": "| stretch | <-non-standard-size>"
		},
		"width": {
			"references": ["https://developer.mozilla.org/en-US/docs/Web/CSS/width", "https://github.com/csstree/stylelint-validator/issues/29"],
			"syntax": "| stretch | <-non-standard-size>"
		},
		"height": { "syntax": "| stretch | <-non-standard-size>" },
		"min-width": {
			"comment": "extend by non-standard width keywords https://developer.mozilla.org/en-US/docs/Web/CSS/width",
			"syntax": "| stretch | <-non-standard-size>"
		},
		"min-height": { "syntax": "| stretch | <-non-standard-size>" },
		"overflow": {
			"comment": "extend by vendor keywords https://developer.mozilla.org/en-US/docs/Web/CSS/overflow",
			"syntax": "| <-non-standard-overflow>"
		},
		"pause": {
			"comment": "https://www.w3.org/TR/css3-speech/#property-index",
			"syntax": "<'pause-before'> <'pause-after'>?"
		},
		"pause-after": {
			"comment": "https://www.w3.org/TR/css3-speech/#property-index",
			"syntax": "<time> | none | x-weak | weak | medium | strong | x-strong"
		},
		"pause-before": {
			"comment": "https://www.w3.org/TR/css3-speech/#property-index",
			"syntax": "<time> | none | x-weak | weak | medium | strong | x-strong"
		},
		"rest": {
			"comment": "https://www.w3.org/TR/css3-speech/#property-index",
			"syntax": "<'rest-before'> <'rest-after'>?"
		},
		"rest-after": {
			"comment": "https://www.w3.org/TR/css3-speech/#property-index",
			"syntax": "<time> | none | x-weak | weak | medium | strong | x-strong"
		},
		"rest-before": {
			"comment": "https://www.w3.org/TR/css3-speech/#property-index",
			"syntax": "<time> | none | x-weak | weak | medium | strong | x-strong"
		},
		"scroll-timeline": {
			"comment": "fix according to spec",
			"references": ["https://www.w3.org/TR/scroll-animations-1/#scroll-timeline-shorthand"],
			"syntax": "[ <'scroll-timeline-name'> || <'scroll-timeline-axis'> ]#"
		},
		"scroll-timeline-name": {
			"comment": "fix according to spec",
			"references": ["https://w3c.github.io/csswg-drafts/scroll-animations/#propdef-scroll-timeline-name"],
			"syntax": "[ none | <dashed-ident> ]#"
		},
		"src": {
			"comment": "added @font-face's src property https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/src",
			"syntax": "[ <url> [ format( <string># ) ]? | local( <family-name> ) ]#"
		},
		"speak": {
			"comment": "https://www.w3.org/TR/css3-speech/#property-index",
			"syntax": "auto | never | always"
		},
		"speak-as": {
			"comment": "https://www.w3.org/TR/css3-speech/#property-index",
			"syntax": "normal | spell-out || digits || [ literal-punctuation | no-punctuation ]"
		},
		"stroke": {
			"comment": "added SVG property",
			"references": ["https://www.w3.org/TR/SVG/painting.html#StrokeProperties"],
			"syntax": "<paint>"
		},
		"stroke-dasharray": {
			"comment": "added SVG property; a list of comma and/or white space separated <length>s and <percentage>s",
			"references": ["https://www.w3.org/TR/SVG/painting.html#StrokeProperties"],
			"syntax": "none | [ <svg-length>+ ]#"
		},
		"stroke-dashoffset": {
			"comment": "added SVG property",
			"references": ["https://www.w3.org/TR/SVG/painting.html#StrokeProperties"],
			"syntax": "<svg-length>"
		},
		"stroke-linejoin": {
			"comment": "added SVG property",
			"references": ["https://www.w3.org/TR/SVG/painting.html#StrokeProperties"],
			"syntax": "miter | round | bevel"
		},
		"stroke-miterlimit": {
			"comment": "added SVG property (<miterlimit> = <number-one-or-greater>) ",
			"references": ["https://www.w3.org/TR/SVG/painting.html#StrokeProperties"],
			"syntax": "<number-one-or-greater>"
		},
		"stroke-width": {
			"comment": "added SVG property",
			"references": ["https://www.w3.org/TR/SVG/painting.html#StrokeProperties"],
			"syntax": "<svg-length>"
		},
		"text-wrap": {
			"comment": "broken in mdn/data",
			"syntax": "<'text-wrap-mode'> || <'text-wrap-style'>"
		},
		"unicode-bidi": {
			"comment": "added prefixed keywords https://developer.mozilla.org/en-US/docs/Web/CSS/unicode-bidi",
			"syntax": "| -moz-isolate | -moz-isolate-override | -moz-plaintext | -webkit-isolate | -webkit-isolate-override | -webkit-plaintext"
		},
		"unicode-range": {
			"comment": "added missed property https://developer.mozilla.org/en-US/docs/Web/CSS/%40font-face/unicode-range",
			"syntax": "<urange>#"
		},
		"voice-balance": {
			"comment": "https://www.w3.org/TR/css3-speech/#property-index",
			"syntax": "<number> | left | center | right | leftwards | rightwards"
		},
		"voice-duration": {
			"comment": "https://www.w3.org/TR/css3-speech/#property-index",
			"syntax": "auto | <time>"
		},
		"voice-family": {
			"comment": "<name> -> <family-name>, https://www.w3.org/TR/css3-speech/#property-index",
			"syntax": "[ [ <family-name> | <generic-voice> ] , ]* [ <family-name> | <generic-voice> ] | preserve"
		},
		"voice-pitch": {
			"comment": "https://www.w3.org/TR/css3-speech/#property-index",
			"syntax": "<frequency> && absolute | [ [ x-low | low | medium | high | x-high ] || [ <frequency> | <semitones> | <percentage> ] ]"
		},
		"voice-range": {
			"comment": "https://www.w3.org/TR/css3-speech/#property-index",
			"syntax": "<frequency> && absolute | [ [ x-low | low | medium | high | x-high ] || [ <frequency> | <semitones> | <percentage> ] ]"
		},
		"voice-rate": {
			"comment": "https://www.w3.org/TR/css3-speech/#property-index",
			"syntax": "[ normal | x-slow | slow | medium | fast | x-fast ] || <percentage>"
		},
		"voice-stress": {
			"comment": "https://www.w3.org/TR/css3-speech/#property-index",
			"syntax": "normal | strong | moderate | none | reduced"
		},
		"voice-volume": {
			"comment": "https://www.w3.org/TR/css3-speech/#property-index",
			"syntax": "silent | [ [ x-soft | soft | medium | loud | x-loud ] || <decibel> ]"
		},
		"writing-mode": {
			"comment": "extend with SVG keywords",
			"syntax": "| <svg-writing-mode>"
		},
		"white-space-trim": {
			"syntax": "none | discard-before || discard-after || discard-inner",
			"comment": "missed, https://www.w3.org/TR/css-text-4/#white-space-trim"
		},
		"word-break": {
			"syntax": "normal | break-all | keep-all | break-word | auto-phrase",
			"comment": "added in Chrome/Edge 119, not covered by a spec currently (2024-09-02)",
			"references": ["https://developer.mozilla.org/en-US/docs/Web/CSS/word-break"]
		}
	},
	"types": {
		"-legacy-gradient": {
			"comment": "added collection of legacy gradient syntaxes",
			"syntax": "<-webkit-gradient()> | <-legacy-linear-gradient> | <-legacy-repeating-linear-gradient> | <-legacy-radial-gradient> | <-legacy-repeating-radial-gradient>"
		},
		"-legacy-linear-gradient": {
			"comment": "like standard syntax but w/o `to` keyword https://developer.mozilla.org/en-US/docs/Web/CSS/linear-gradient",
			"syntax": "-moz-linear-gradient( <-legacy-linear-gradient-arguments> ) | -webkit-linear-gradient( <-legacy-linear-gradient-arguments> ) | -o-linear-gradient( <-legacy-linear-gradient-arguments> )"
		},
		"-legacy-repeating-linear-gradient": {
			"comment": "like standard syntax but w/o `to` keyword https://developer.mozilla.org/en-US/docs/Web/CSS/linear-gradient",
			"syntax": "-moz-repeating-linear-gradient( <-legacy-linear-gradient-arguments> ) | -webkit-repeating-linear-gradient( <-legacy-linear-gradient-arguments> ) | -o-repeating-linear-gradient( <-legacy-linear-gradient-arguments> )"
		},
		"-legacy-linear-gradient-arguments": {
			"comment": "like standard syntax but w/o `to` keyword https://developer.mozilla.org/en-US/docs/Web/CSS/linear-gradient",
			"syntax": "[ <angle> | <side-or-corner> ]? , <color-stop-list>"
		},
		"-legacy-radial-gradient": {
			"comment": "deprecated syntax that implemented by some browsers https://www.w3.org/TR/2011/WD-css3-images-20110908/#radial-gradients",
			"syntax": "-moz-radial-gradient( <-legacy-radial-gradient-arguments> ) | -webkit-radial-gradient( <-legacy-radial-gradient-arguments> ) | -o-radial-gradient( <-legacy-radial-gradient-arguments> )"
		},
		"-legacy-repeating-radial-gradient": {
			"comment": "deprecated syntax that implemented by some browsers https://www.w3.org/TR/2011/WD-css3-images-20110908/#radial-gradients",
			"syntax": "-moz-repeating-radial-gradient( <-legacy-radial-gradient-arguments> ) | -webkit-repeating-radial-gradient( <-legacy-radial-gradient-arguments> ) | -o-repeating-radial-gradient( <-legacy-radial-gradient-arguments> )"
		},
		"-legacy-radial-gradient-arguments": {
			"comment": "deprecated syntax that implemented by some browsers https://www.w3.org/TR/2011/WD-css3-images-20110908/#radial-gradients",
			"syntax": "[ <position> , ]? [ [ [ <-legacy-radial-gradient-shape> || <-legacy-radial-gradient-size> ] | [ <length> | <percentage> ]{2} ] , ]? <color-stop-list>"
		},
		"-legacy-radial-gradient-size": {
			"comment": "before a standard it contains 2 extra keywords (`contain` and `cover`) https://www.w3.org/TR/2011/WD-css3-images-20110908/#ltsize",
			"syntax": "closest-side | closest-corner | farthest-side | farthest-corner | contain | cover"
		},
		"-legacy-radial-gradient-shape": {
			"comment": "define to double sure it doesn't extends in future https://www.w3.org/TR/2011/WD-css3-images-20110908/#ltshape",
			"syntax": "circle | ellipse"
		},
		"-non-standard-font": {
			"comment": "non standard fonts",
			"references": ["https://webkit.org/blog/3709/using-the-system-font-in-web-content/"],
			"syntax": "-apple-system-body | -apple-system-headline | -apple-system-subheadline | -apple-system-caption1 | -apple-system-caption2 | -apple-system-footnote | -apple-system-short-body | -apple-system-short-headline | -apple-system-short-subheadline | -apple-system-short-caption1 | -apple-system-short-footnote | -apple-system-tall-body"
		},
		"-non-standard-color": {
			"comment": "non standard colors",
			"references": ["http://cssdot.ru/%D0%A1%D0%BF%D1%80%D0%B0%D0%B2%D0%BE%D1%87%D0%BD%D0%B8%D0%BA_CSS/color-i305.html", "https://developer.mozilla.org/en-US/docs/Web/CSS/color_value#Mozilla_Color_Preference_Extensions"],
			"syntax": "-moz-ButtonDefault | -moz-ButtonHoverFace | -moz-ButtonHoverText | -moz-CellHighlight | -moz-CellHighlightText | -moz-Combobox | -moz-ComboboxText | -moz-Dialog | -moz-DialogText | -moz-dragtargetzone | -moz-EvenTreeRow | -moz-Field | -moz-FieldText | -moz-html-CellHighlight | -moz-html-CellHighlightText | -moz-mac-accentdarkestshadow | -moz-mac-accentdarkshadow | -moz-mac-accentface | -moz-mac-accentlightesthighlight | -moz-mac-accentlightshadow | -moz-mac-accentregularhighlight | -moz-mac-accentregularshadow | -moz-mac-chrome-active | -moz-mac-chrome-inactive | -moz-mac-focusring | -moz-mac-menuselect | -moz-mac-menushadow | -moz-mac-menutextselect | -moz-MenuHover | -moz-MenuHoverText | -moz-MenuBarText | -moz-MenuBarHoverText | -moz-nativehyperlinktext | -moz-OddTreeRow | -moz-win-communicationstext | -moz-win-mediatext | -moz-activehyperlinktext | -moz-default-background-color | -moz-default-color | -moz-hyperlinktext | -moz-visitedhyperlinktext | -webkit-activelink | -webkit-focus-ring-color | -webkit-link | -webkit-text"
		},
		"-non-standard-image-rendering": {
			"comment": "non-standard keywords http://phrogz.net/tmp/canvas_image_zoom.html",
			"syntax": "optimize-contrast | -moz-crisp-edges | -o-crisp-edges | -webkit-optimize-contrast"
		},
		"-non-standard-overflow": {
			"comment": "non-standard keywords https://developer.mozilla.org/en-US/docs/Web/CSS/overflow",
			"syntax": "overlay | -moz-scrollbars-none | -moz-scrollbars-horizontal | -moz-scrollbars-vertical | -moz-hidden-unscrollable"
		},
		"-non-standard-size": {
			"comment": "non-standard keywords https://developer.mozilla.org/en-US/docs/Web/CSS/width",
			"syntax": "intrinsic | min-intrinsic | -webkit-fill-available | -webkit-fit-content | -webkit-min-content | -webkit-max-content  | -moz-available | -moz-fit-content | -moz-min-content | -moz-max-content"
		},
		"-webkit-gradient()": {
			"comment": "first Apple proposal gradient syntax https://webkit.org/blog/175/introducing-css-gradients/ - TODO: simplify when after match algorithm improvement ( [, point, radius | , point] -> [, radius]? , point )",
			"syntax": "-webkit-gradient( <-webkit-gradient-type>, <-webkit-gradient-point> [, <-webkit-gradient-point> | , <-webkit-gradient-radius>, <-webkit-gradient-point> ] [, <-webkit-gradient-radius>]? [, <-webkit-gradient-color-stop>]* )"
		},
		"-webkit-gradient-color-stop": {
			"comment": "first Apple proposal gradient syntax https://webkit.org/blog/175/introducing-css-gradients/",
			"syntax": "from( <color> ) | color-stop( [ <number-zero-one> | <percentage> ] , <color> ) | to( <color> )"
		},
		"-webkit-gradient-point": {
			"comment": "first Apple proposal gradient syntax https://webkit.org/blog/175/introducing-css-gradients/",
			"syntax": "[ left | center | right | <length-percentage> ] [ top | center | bottom | <length-percentage> ]"
		},
		"-webkit-gradient-radius": {
			"comment": "first Apple proposal gradient syntax https://webkit.org/blog/175/introducing-css-gradients/",
			"syntax": "<length> | <percentage>"
		},
		"-webkit-gradient-type": {
			"comment": "first Apple proposal gradient syntax https://webkit.org/blog/175/introducing-css-gradients/",
			"syntax": "linear | radial"
		},
		"-webkit-mask-box-repeat": {
			"comment": "missed; https://developer.mozilla.org/en-US/docs/Web/CSS/-webkit-mask-box-image",
			"syntax": "repeat | stretch | round"
		},
		"-ms-filter-function-list": {
			"comment": "https://developer.mozilla.org/en-US/docs/Web/CSS/-ms-filter",
			"syntax": "<-ms-filter-function>+"
		},
		"-ms-filter-function": {
			"comment": "https://developer.mozilla.org/en-US/docs/Web/CSS/-ms-filter",
			"syntax": "<-ms-filter-function-progid> | <-ms-filter-function-legacy>"
		},
		"-ms-filter-function-progid": {
			"comment": "https://developer.mozilla.org/en-US/docs/Web/CSS/-ms-filter",
			"syntax": "'progid:' [ <ident-token> '.' ]* [ <ident-token> | <function-token> <any-value>? ) ]"
		},
		"-ms-filter-function-legacy": {
			"comment": "https://developer.mozilla.org/en-US/docs/Web/CSS/-ms-filter",
			"syntax": "<ident-token> | <function-token> <any-value>? )"
		},
		"absolute-color-base": {
			"comment": "https://www.w3.org/TR/css-color-4/#color-syntax",
			"syntax": "<hex-color> | <absolute-color-function> | <named-color> | transparent"
		},
		"absolute-color-function": {
			"comment": "https://www.w3.org/TR/css-color-4/#color-syntax",
			"syntax": "<rgb()> | <rgba()> | <hsl()> | <hsla()> | <hwb()> | <lab()> | <lch()> | <oklab()> | <oklch()> | <color()>"
		},
		"age": {
			"comment": "https://www.w3.org/TR/css3-speech/#voice-family",
			"syntax": "child | young | old"
		},
		"anchor-name": {
			"comment": "missed in mdn/data",
			"syntax": "<dashed-ident>"
		},
		"attr-name": { "syntax": "<wq-name>" },
		"attr-fallback": { "syntax": "<any-value>" },
		"bg-clip": {
			"comment": "missed, https://drafts.csswg.org/css-backgrounds-4/#typedef-bg-clip",
			"syntax": "<box> | border | text"
		},
		"bottom": {
			"comment": "missed; not sure we should add it, but no others except `shape` is using it so it's ok for now; https://drafts.fxtf.org/css-masking-1/#funcdef-clip-rect",
			"syntax": "<length> | auto"
		},
		"content-list": {
			"comment": "added attr(), see https://github.com/csstree/csstree/issues/201",
			"syntax": "[ <string> | contents | <image> | <counter> | <quote> | <target> | <leader()> | <attr()> ]+"
		},
		"container-name": {
			"comment": "missed, https://drafts.csswg.org/css-contain-3/#container-rule",
			"syntax": "<custom-ident>"
		},
		"container-condition": {
			"comment": "missed, https://drafts.csswg.org/css-contain-3/#container-rule",
			"syntax": "not <query-in-parens> | <query-in-parens> [ [ and <query-in-parens> ]* | [ or <query-in-parens> ]* ]"
		},
		"coord-box": { "syntax": "content-box | padding-box | border-box | fill-box | stroke-box | view-box" },
		"element()": {
			"comment": "https://drafts.csswg.org/css-gcpm/#element-syntax & https://drafts.csswg.org/css-images-4/#element-notation",
			"syntax": "element( <custom-ident> , [ first | start | last | first-except ]? ) | element( <id-selector> )"
		},
		"generic-voice": {
			"comment": "https://www.w3.org/TR/css3-speech/#voice-family",
			"syntax": "[ <age>? <gender> <integer>? ]"
		},
		"gender": {
			"comment": "https://www.w3.org/TR/css3-speech/#voice-family",
			"syntax": "male | female | neutral"
		},
		"general-enclosed": {
			"comment": "remove ident-token, optional any-value, brackets (see https://drafts.csswg.org/mediaqueries-5/#typedef-general-enclosed)",
			"syntax": "[ <function-token> <any-value>? ) ] | [ ( <any-value>? ) ]"
		},
		"generic-family": {
			"comment": "new definition on font-4, https://drafts.csswg.org/css-fonts-4/#typedef-generic-family",
			"syntax": "<generic-script-specific>| <generic-complete> | <generic-incomplete> | <-non-standard-generic-family>"
		},
		"generic-script-specific": { "syntax": "generic(kai) | generic(fangsong) | generic(nastaliq)" },
		"generic-complete": { "syntax": "serif | sans-serif | system-ui | cursive | fantasy | math | monospace" },
		"generic-incomplete": { "syntax": "ui-serif | ui-sans-serif | ui-monospace | ui-rounded" },
		"-non-standard-generic-family": {
			"syntax": "-apple-system | BlinkMacSystemFont",
			"references": ["https://css-tricks.com/snippets/css/system-font-stack/", "https://webkit.org/blog/3709/using-the-system-font-in-web-content/"]
		},
		"gradient": {
			"comment": "added legacy syntaxes support",
			"syntax": "| <-legacy-gradient>"
		},
		"left": {
			"comment": "missed; not sure we should add it, but no others except `shape` is using it so it's ok for now; https://drafts.fxtf.org/css-masking-1/#funcdef-clip-rect",
			"syntax": "<length> | auto"
		},
		"color": {
			"comment": "css-color-5, added non standard color names",
			"syntax": "<color-base> | currentColor | <system-color> | <device-cmyk()>  | <light-dark()> | <-non-standard-color>"
		},
		"color-base": { "syntax": "<hex-color> | <color-function> | <named-color> | <color-mix()> | transparent" },
		"color-function": { "syntax": "<rgb()> | <rgba()> | <hsl()> | <hsla()> | <hwb()> | <lab()> | <lch()> | <oklab()> | <oklch()> | <color()>" },
		"device-cmyk()": { "syntax": "<legacy-device-cmyk-syntax> | <modern-device-cmyk-syntax>" },
		"legacy-device-cmyk-syntax": { "syntax": "device-cmyk( <number>#{4} )" },
		"modern-device-cmyk-syntax": { "syntax": "device-cmyk( <cmyk-component>{4} [ / [ <alpha-value> | none ] ]? )" },
		"cmyk-component": { "syntax": "<number> | <percentage> | none" },
		"color-mix()": { "syntax": "color-mix( <color-interpolation-method> , [ <color> && <percentage [0,100]>? ]#{2} )" },
		"color-interpolation-method": { "syntax": "in [ <rectangular-color-space> | <polar-color-space> <hue-interpolation-method>? | <custom-color-space> ]" },
		"color-space": { "syntax": "<rectangular-color-space> | <polar-color-space> | <custom-color-space>" },
		"custom-color-space": { "syntax": "<dashed-ident>" },
		"paint": {
			"comment": "used by SVG https://www.w3.org/TR/SVG/painting.html#SpecifyingPaint",
			"syntax": "none | <color> | <url> [ none | <color> ]? | context-fill | context-stroke"
		},
		"palette-identifier": {
			"comment": "<palette-identifier> is parsed as a <dashed-ident> (https://drafts.csswg.org/css-fonts/#typedef-font-palette-palette-identifier)",
			"syntax": "<dashed-ident>"
		},
		"right": {
			"comment": "missed; not sure we should add it, but no others except `shape` is using it so it's ok for now; https://drafts.fxtf.org/css-masking-1/#funcdef-clip-rect",
			"syntax": "<length> | auto"
		},
		"shape": {
			"comment": "missed spaces in function body and add backwards compatible syntax",
			"syntax": "rect( <top>, <right>, <bottom>, <left> ) | rect( <top> <right> <bottom> <left> )"
		},
		"scope-start": { "syntax": "<forgiving-selector-list>" },
		"scope-end": { "syntax": "<forgiving-selector-list>" },
		"forgiving-selector-list": { "syntax": "<complex-real-selector-list>" },
		"forgiving-relative-selector-list": { "syntax": "<relative-real-selector-list>" },
		"selector-list": { "syntax": "<complex-selector-list>" },
		"complex-real-selector-list": { "syntax": "<complex-real-selector>#" },
		"simple-selector-list": { "syntax": "<simple-selector>#" },
		"relative-real-selector-list": { "syntax": "<relative-real-selector>#" },
		"complex-selector": { "syntax": "<complex-selector-unit> [ <combinator>? <complex-selector-unit> ]*" },
		"complex-selector-unit": { "syntax": "[ <compound-selector>? <pseudo-compound-selector>* ]!" },
		"complex-real-selector": { "syntax": "<compound-selector> [ <combinator>? <compound-selector> ]*" },
		"relative-real-selector": { "syntax": "<combinator>? <complex-real-selector>" },
		"compound-selector": { "syntax": "[ <type-selector>? <subclass-selector>* ]!" },
		"pseudo-compound-selector": { "syntax": " <pseudo-element-selector> <pseudo-class-selector>*" },
		"simple-selector": { "syntax": "<type-selector> | <subclass-selector>" },
		"combinator": { "syntax": "'>' | '+' | '~' | [ '|' '|' ]" },
		"pseudo-element-selector": { "syntax": "':' <pseudo-class-selector> | <legacy-pseudo-element-selector>" },
		"legacy-pseudo-element-selector": { "syntax": " ':' [before | after | first-line | first-letter]" },
		"single-animation-composition": {
			"comment": "missed definition",
			"references": ["https://w3c.github.io/csswg-drafts/css-animations-2/#typedef-single-animation-composition"],
			"syntax": "replace | add | accumulate"
		},
		"svg-length": {
			"comment": "All coordinates and lengths in SVG can be specified with or without a unit identifier",
			"references": ["https://www.w3.org/TR/SVG11/coords.html#Units"],
			"syntax": "<percentage> | <length> | <number>"
		},
		"svg-writing-mode": {
			"comment": "SVG specific keywords (deprecated for CSS)",
			"references": ["https://developer.mozilla.org/en/docs/Web/CSS/writing-mode", "https://www.w3.org/TR/SVG/text.html#WritingModeProperty"],
			"syntax": "lr-tb | rl-tb | tb-rl | lr | rl | tb"
		},
		"top": {
			"comment": "missed; not sure we should add it, but no others except `shape` is using it so it's ok for now; https://drafts.fxtf.org/css-masking-1/#funcdef-clip-rect",
			"syntax": "<length> | auto"
		},
		"x": {
			"comment": "missed; not sure we should add it, but no others except `cursor` is using it so it's ok for now; https://drafts.csswg.org/css-ui-3/#cursor",
			"syntax": "<number>"
		},
		"y": {
			"comment": "missed; not sure we should add it, but no others except `cursor` is using so it's ok for now; https://drafts.csswg.org/css-ui-3/#cursor",
			"syntax": "<number>"
		},
		"declaration": {
			"comment": "missed, restored by https://drafts.csswg.org/css-syntax",
			"syntax": "<ident-token> : <declaration-value>? [ '!' important ]?"
		},
		"declaration-list": {
			"comment": "missed, restored by https://drafts.csswg.org/css-syntax",
			"syntax": "[ <declaration>? ';' ]* <declaration>?"
		},
		"url": {
			"comment": "https://drafts.csswg.org/css-values-4/#urls",
			"syntax": "url( <string> <url-modifier>* ) | <url-token>"
		},
		"url-modifier": {
			"comment": "https://drafts.csswg.org/css-values-4/#typedef-url-modifier",
			"syntax": "<ident> | <function-token> <any-value> )"
		},
		"number-zero-one": { "syntax": "<number [0,1]>" },
		"number-one-or-greater": { "syntax": "<number [1,∞]>" },
		"color()": { "syntax": "color( <colorspace-params> [ / [ <alpha-value> | none ] ]? )" },
		"colorspace-params": { "syntax": "[ <predefined-rgb-params> | <xyz-params>]" },
		"predefined-rgb-params": { "syntax": "<predefined-rgb> [ <number> | <percentage> | none ]{3}" },
		"predefined-rgb": { "syntax": "srgb | srgb-linear | display-p3 | a98-rgb | prophoto-rgb | rec2020" },
		"xyz-params": { "syntax": "<xyz-space> [ <number> | <percentage> | none ]{3}" },
		"xyz-space": { "syntax": "xyz | xyz-d50 | xyz-d65" },
		"oklab()": {
			"comment": "https://www.w3.org/TR/css-color-4/#specifying-oklab-oklch",
			"syntax": "oklab( [ <percentage> | <number> | none] [ <percentage> | <number> | none] [ <percentage> | <number> | none] [ / [<alpha-value> | none] ]? )"
		},
		"oklch()": {
			"comment": "https://www.w3.org/TR/css-color-4/#specifying-oklab-oklch",
			"syntax": "oklch( [ <percentage> | <number> | none] [ <percentage> | <number> | none] [ <hue> | none] [ / [<alpha-value> | none] ]? )"
		},
		"offset-path": { "syntax": "<ray()> | <url> | <basic-shape>" },
		"basic-shape": { "syntax": "<inset()> | <xywh()> | <rect()> | <circle()> | <ellipse()> | <polygon()> | <path()>" },
		"rect()": {
			"comment": "missed, https://drafts.csswg.org/css-shapes/#supported-basic-shapes",
			"syntax": "rect( [ <length-percentage> | auto ]{4} [ round <'border-radius'> ]? )"
		},
		"xywh()": {
			"comment": "missed, https://drafts.csswg.org/css-shapes/#supported-basic-shapes",
			"syntax": "xywh( <length-percentage>{2} <length-percentage [0,∞]>{2} [ round <'border-radius'> ]? )"
		},
		"query-in-parens": {
			"comment": "missed, https://drafts.csswg.org/css-contain-3/#container-rule",
			"syntax": "( <container-condition> ) | ( <size-feature> ) | style( <style-query> ) | <general-enclosed>"
		},
		"size-feature": {
			"comment": "missed, https://drafts.csswg.org/css-contain-3/#typedef-size-feature",
			"syntax": "<mf-plain> | <mf-boolean> | <mf-range>"
		},
		"style-feature": {
			"comment": "missed, https://drafts.csswg.org/css-contain-3/#typedef-style-feature",
			"syntax": "<declaration>"
		},
		"style-query": {
			"comment": "missed, https://drafts.csswg.org/css-contain-3/#container-rule",
			"syntax": "<style-condition> | <style-feature>"
		},
		"style-condition": {
			"comment": "missed, https://drafts.csswg.org/css-contain-3/#container-rule",
			"syntax": "not <style-in-parens> | <style-in-parens> [ [ and <style-in-parens> ]* | [ or <style-in-parens> ]* ]"
		},
		"style-in-parens": {
			"comment": "missed, https://drafts.csswg.org/css-contain-3/#container-rule",
			"syntax": "( <style-condition> ) | ( <style-feature> ) | <general-enclosed>"
		},
		"-non-standard-display": { "syntax": "-ms-inline-flexbox | -ms-grid | -ms-inline-grid | -webkit-flex | -webkit-inline-flex | -webkit-box | -webkit-inline-box | -moz-inline-stack | -moz-box | -moz-inline-box" },
		"inset-area": {
			"syntax": "[ [ left | center | right | span-left | span-right | x-start | x-end | span-x-start | span-x-end | x-self-start | x-self-end | span-x-self-start | span-x-self-end | span-all ] || [ top | center | bottom | span-top | span-bottom | y-start | y-end | span-y-start | span-y-end | y-self-start | y-self-end | span-y-self-start | span-y-self-end | span-all ] | [ block-start | center | block-end | span-block-start | span-block-end | span-all ] || [ inline-start | center | inline-end | span-inline-start | span-inline-end | span-all ] | [ self-block-start | self-block-end | span-self-block-start | span-self-block-end | span-all ] || [ self-inline-start | self-inline-end | span-self-inline-start | span-self-inline-end | span-all ] | [ start | center | end | span-start | span-end | span-all ]{1,2} | [ self-start | center | self-end | span-self-start | span-self-end | span-all ]{1,2} ]",
			"comment": "initial name for <position-area> before renamed",
			"references": ["https://www.w3.org/TR/css-anchor-position-1/#inset-area"]
		},
		"position-area": {
			"syntax": "[ [ left | center | right | span-left | span-right | x-start | x-end | span-x-start | span-x-end | x-self-start | x-self-end | span-x-self-start | span-x-self-end | span-all ] || [ top | center | bottom | span-top | span-bottom | y-start | y-end | span-y-start | span-y-end | y-self-start | y-self-end | span-y-self-start | span-y-self-end | span-all ] | [ block-start | center | block-end | span-block-start | span-block-end | span-all ] || [ inline-start | center | inline-end | span-inline-start | span-inline-end | span-all ] | [ self-block-start | center | self-block-end | span-self-block-start | span-self-block-end | span-all ] || [ self-inline-start | center | self-inline-end | span-self-inline-start | span-self-inline-end | span-all ] | [ start | center | end | span-start | span-end | span-all ]{1,2} | [ self-start | center | self-end | span-self-start | span-self-end | span-all ]{1,2} ]",
			"comment": "replaced <inset-area>",
			"references": ["https://drafts.csswg.org/css-anchor-position-1/#typedef-position-area"]
		},
		"anchor()": {
			"syntax": "anchor( <anchor-element>? && <anchor-side>, <length-percentage>? )",
			"comment": "missed",
			"references": ["https://drafts.csswg.org/css-anchor-position-1/#anchor-pos"]
		},
		"anchor-side": { "syntax": "inside | outside | top | left | right | bottom | start | end | self-start | self-end | <percentage> | center" },
		"anchor-size()": {
			"syntax": "anchor-size( [ <anchor-element> || <anchor-size> ]? , <length-percentage>? )",
			"comment": "missed",
			"references": ["https://drafts.csswg.org/css-anchor-position-1/#funcdef-anchor-size"]
		},
		"anchor-size": { "syntax": "width | height | block | inline | self-block | self-inline" },
		"anchor-element": {
			"syntax": "<dashed-ident>",
			"comment": "missed, https://drafts.csswg.org/css-anchor-position-1/#typedef-anchor-element"
		},
		"try-size": {
			"syntax": "most-width | most-height | most-block-size | most-inline-size",
			"comment": "missed, https://drafts.csswg.org/css-anchor-position-1/#typedef-try-size"
		},
		"try-tactic": {
			"syntax": "flip-block || flip-inline || flip-start",
			"comment": "missed, https://drafts.csswg.org/css-anchor-position-1/#typedef-position-try-fallbacks-try-tactic"
		},
		"font-variant-css2": {
			"syntax": "normal | small-caps",
			"comment": "new definition on font-4, https://drafts.csswg.org/css-fonts-4/#font-variant-css21-values"
		},
		"font-width-css3": {
			"syntax": "normal | ultra-condensed | extra-condensed | condensed | semi-condensed | semi-expanded | expanded | extra-expanded | ultra-expanded",
			"comment": "new definition on font-4, https://drafts.csswg.org/css-fonts-4/#font-width-css3-values"
		},
		"system-family-name": {
			"syntax": "caption | icon | menu | message-box | small-caption | status-bar",
			"comment": "new definition on font-4, https://drafts.csswg.org/css-fonts-4/#system-family-name-value"
		}
	}
};
var data_patch_default = patch;

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/data.js
const mdnAtrules = {
	"@charset": {
		"syntax": "@charset \"<charset>\";",
		"groups": ["CSS Charsets"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/@charset"
	},
	"@counter-style": {
		"syntax": "@counter-style <counter-style-name> {\n  [ system: <counter-system>; ] ||\n  [ symbols: <counter-symbols>; ] ||\n  [ additive-symbols: <additive-symbols>; ] ||\n  [ negative: <negative-symbol>; ] ||\n  [ prefix: <prefix>; ] ||\n  [ suffix: <suffix>; ] ||\n  [ range: <range>; ] ||\n  [ pad: <padding>; ] ||\n  [ speak-as: <speak-as>; ] ||\n  [ fallback: <counter-style-name>; ]\n}",
		"interfaces": ["CSSCounterStyleRule"],
		"groups": ["CSS Counter Styles"],
		"descriptors": {
			"additive-symbols": {
				"syntax": "[ <integer> && <symbol> ]#",
				"media": "all",
				"initial": "n/a (required)",
				"percentages": "no",
				"computed": "asSpecified",
				"order": "orderOfAppearance",
				"status": "standard"
			},
			"fallback": {
				"syntax": "<counter-style-name>",
				"media": "all",
				"initial": "decimal",
				"percentages": "no",
				"computed": "asSpecified",
				"order": "uniqueOrder",
				"status": "standard"
			},
			"negative": {
				"syntax": "<symbol> <symbol>?",
				"media": "all",
				"initial": "\"-\" hyphen-minus",
				"percentages": "no",
				"computed": "asSpecified",
				"order": "orderOfAppearance",
				"status": "standard"
			},
			"pad": {
				"syntax": "<integer> && <symbol>",
				"media": "all",
				"initial": "0 \"\"",
				"percentages": "no",
				"computed": "asSpecified",
				"order": "uniqueOrder",
				"status": "standard"
			},
			"prefix": {
				"syntax": "<symbol>",
				"media": "all",
				"initial": "\"\"",
				"percentages": "no",
				"computed": "asSpecified",
				"order": "uniqueOrder",
				"status": "standard"
			},
			"range": {
				"syntax": "[ [ <integer> | infinite ]{2} ]# | auto",
				"media": "all",
				"initial": "auto",
				"percentages": "no",
				"computed": "asSpecified",
				"order": "orderOfAppearance",
				"status": "standard"
			},
			"speak-as": {
				"syntax": "auto | bullets | numbers | words | spell-out | <counter-style-name>",
				"media": "all",
				"initial": "auto",
				"percentages": "no",
				"computed": "asSpecified",
				"order": "uniqueOrder",
				"status": "standard"
			},
			"suffix": {
				"syntax": "<symbol>",
				"media": "all",
				"initial": "\". \"",
				"percentages": "no",
				"computed": "asSpecified",
				"order": "uniqueOrder",
				"status": "standard"
			},
			"symbols": {
				"syntax": "<symbol>+",
				"media": "all",
				"initial": "n/a (required)",
				"percentages": "no",
				"computed": "asSpecified",
				"order": "orderOfAppearance",
				"status": "standard"
			},
			"system": {
				"syntax": "cyclic | numeric | alphabetic | symbolic | additive | [ fixed <integer>? ] | [ extends <counter-style-name> ]",
				"media": "all",
				"initial": "symbolic",
				"percentages": "no",
				"computed": "asSpecified",
				"order": "uniqueOrder",
				"status": "standard"
			}
		},
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/@counter-style"
	},
	"@document": {
		"syntax": "@document [ <url> | url-prefix(<string>) | domain(<string>) | media-document(<string>) | regexp(<string>) ]# {\n  <group-rule-body>\n}",
		"interfaces": ["CSSGroupingRule", "CSSConditionRule"],
		"groups": ["CSS Conditional Rules"],
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/@document"
	},
	"@font-palette-values": {
		"syntax": "@font-palette-values <dashed-ident> {  <declaration-list> }",
		"groups": ["CSS Fonts"],
		"descriptors": {
			"base-palette": {
				"syntax": "light | dark | <integer [0,∞]>",
				"media": "all",
				"initial": "n/a (required)",
				"percentages": "no",
				"computed": "asSpecified",
				"order": "uniqueOrder",
				"status": "standard"
			},
			"font-family": {
				"syntax": "<family-name>#",
				"media": "all",
				"initial": "n/a (required)",
				"percentages": "no",
				"computed": "asSpecified",
				"order": "orderOfAppearance",
				"status": "standard"
			},
			"override-colors": {
				"syntax": "[ <integer [0,∞]> <absolute-color-base> ]#",
				"media": "all",
				"initial": "n/a (required)",
				"percentages": "no",
				"computed": "asSpecified",
				"order": "orderOfAppearance",
				"status": "standard"
			}
		},
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/@font-palette-values"
	},
	"@font-face": {
		"syntax": "@font-face {\n  [ font-family: <family-name>; ] ||\n  [ src: <src>; ] ||\n  [ unicode-range: <unicode-range>; ] ||\n  [ font-variant: <font-variant>; ] ||\n  [ font-feature-settings: <font-feature-settings>; ] ||\n  [ font-variation-settings: <font-variation-settings>; ] ||\n  [ font-stretch: <font-stretch>; ] ||\n  [ font-weight: <font-weight>; ] ||\n  [ font-style: <font-style>; ] ||\n  [ size-adjust: <size-adjust>; ] ||\n  [ ascent-override: <ascent-override>; ] ||\n  [ descent-override: <descent-override>; ] ||\n  [ line-gap-override: <line-gap-override>; ]\n}",
		"interfaces": ["CSSFontFaceRule"],
		"groups": ["CSS Fonts"],
		"descriptors": {
			"ascent-override": {
				"syntax": "normal | <percentage>",
				"media": "all",
				"initial": "normal",
				"percentages": "asSpecified",
				"computed": "asSpecified",
				"order": "orderOfAppearance",
				"status": "experimental"
			},
			"descent-override": {
				"syntax": "normal | <percentage>",
				"media": "all",
				"initial": "normal",
				"percentages": "asSpecified",
				"computed": "asSpecified",
				"order": "orderOfAppearance",
				"status": "experimental"
			},
			"font-display": {
				"syntax": "[ auto | block | swap | fallback | optional ]",
				"media": "visual",
				"percentages": "no",
				"initial": "auto",
				"computed": "asSpecified",
				"order": "uniqueOrder",
				"status": "experimental"
			},
			"font-family": {
				"syntax": "<family-name>",
				"media": "all",
				"initial": "n/a (required)",
				"percentages": "no",
				"computed": "asSpecified",
				"order": "uniqueOrder",
				"status": "standard"
			},
			"font-feature-settings": {
				"syntax": "normal | <feature-tag-value>#",
				"media": "all",
				"initial": "normal",
				"percentages": "no",
				"computed": "asSpecified",
				"order": "orderOfAppearance",
				"status": "standard"
			},
			"font-variation-settings": {
				"syntax": "normal | [ <string> <number> ]#",
				"media": "all",
				"initial": "normal",
				"percentages": "no",
				"computed": "asSpecified",
				"order": "orderOfAppearance",
				"status": "standard"
			},
			"font-stretch": {
				"syntax": "<font-stretch-absolute>{1,2}",
				"media": "all",
				"initial": "normal",
				"percentages": "no",
				"computed": "asSpecified",
				"order": "uniqueOrder",
				"status": "standard"
			},
			"font-style": {
				"syntax": "normal | italic | oblique <angle>{0,2}",
				"media": "all",
				"initial": "normal",
				"percentages": "no",
				"computed": "asSpecified",
				"order": "uniqueOrder",
				"status": "standard"
			},
			"font-weight": {
				"syntax": "<font-weight-absolute>{1,2}",
				"media": "all",
				"initial": "normal",
				"percentages": "no",
				"computed": "asSpecified",
				"order": "uniqueOrder",
				"status": "standard"
			},
			"line-gap-override": {
				"syntax": "normal | <percentage>",
				"media": "all",
				"initial": "normal",
				"percentages": "asSpecified",
				"computed": "asSpecified",
				"order": "orderOfAppearance",
				"status": "experimental"
			},
			"size-adjust": {
				"syntax": "<percentage>",
				"media": "all",
				"initial": "100%",
				"percentages": "asSpecified",
				"computed": "asSpecified",
				"order": "orderOfAppearance",
				"status": "experimental"
			},
			"src": {
				"syntax": "[ <url> [ format( <string># ) ]? | local( <family-name> ) ]#",
				"media": "all",
				"initial": "n/a (required)",
				"percentages": "no",
				"computed": "asSpecified",
				"order": "orderOfAppearance",
				"status": "standard"
			},
			"unicode-range": {
				"syntax": "<unicode-range>#",
				"media": "all",
				"initial": "U+0-10FFFF",
				"percentages": "no",
				"computed": "asSpecified",
				"order": "orderOfAppearance",
				"status": "standard"
			}
		},
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/@font-face"
	},
	"@font-feature-values": {
		"syntax": "@font-feature-values <family-name># {\n  <feature-value-block-list>\n}",
		"interfaces": ["CSSFontFeatureValuesRule"],
		"groups": ["CSS Fonts"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/@font-feature-values"
	},
	"@import": {
		"syntax": "@import [ <string> | <url> ]\n        [ layer | layer(<layer-name>) ]?\n        [ supports( [ <supports-condition> | <declaration> ] ) ]?\n        <media-query-list>? ;",
		"groups": ["CSS Conditional Rules", "Media Queries"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/@import"
	},
	"@keyframes": {
		"syntax": "@keyframes <keyframes-name> {\n  <keyframe-block-list>\n}",
		"interfaces": ["CSSKeyframeRule", "CSSKeyframesRule"],
		"groups": ["CSS Animations"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/@keyframes"
	},
	"@layer": {
		"syntax": "@layer [ <layer-name># | <layer-name>?  {\n  <stylesheet>\n} ]",
		"interfaces": ["CSSLayerBlockRule", "CSSLayerStatementRule"],
		"groups": ["CSS Cascading and Inheritance"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/@layer"
	},
	"@media": {
		"syntax": "@media <media-query-list> {\n  <group-rule-body>\n}",
		"interfaces": [
			"CSSGroupingRule",
			"CSSConditionRule",
			"CSSMediaRule",
			"CSSCustomMediaRule"
		],
		"groups": ["CSS Conditional Rules", "Media Queries"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/@media"
	},
	"@namespace": {
		"syntax": "@namespace <namespace-prefix>? [ <string> | <url> ];",
		"groups": ["CSS Namespaces"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/@namespace"
	},
	"@page": {
		"syntax": "@page <page-selector-list> {\n  <page-body>\n}",
		"interfaces": ["CSSPageRule"],
		"groups": ["CSS Pages"],
		"descriptors": {
			"bleed": {
				"syntax": "auto | <length>",
				"media": ["visual", "paged"],
				"initial": "auto",
				"percentages": "no",
				"computed": "asSpecified",
				"order": "uniqueOrder",
				"status": "standard"
			},
			"marks": {
				"syntax": "none | [ crop || cross ]",
				"media": ["visual", "paged"],
				"initial": "none",
				"percentages": "no",
				"computed": "asSpecified",
				"order": "orderOfAppearance",
				"status": "standard"
			},
			"page-orientation": {
				"syntax": "upright | rotate-left | rotate-right ",
				"media": ["visual", "paged"],
				"initial": "upright",
				"percentages": "no",
				"computed": "asSpecified",
				"order": "orderOfAppearance",
				"status": "standard"
			},
			"size": {
				"syntax": "<length>{1,2} | auto | [ <page-size> || [ portrait | landscape ] ]",
				"media": ["visual", "paged"],
				"initial": "auto",
				"percentages": "no",
				"computed": "asSpecifiedRelativeToAbsoluteLengths",
				"order": "orderOfAppearance",
				"status": "standard"
			}
		},
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/@page"
	},
	"@position-try": {
		"syntax": "@position-try <dashed-ident> {\n  <declaration-list>\n}",
		"interfaces": ["CSSPositionTryRule"],
		"groups": ["CSS Positioning"],
		"status": "experimental",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/@position-try"
	},
	"@property": {
		"syntax": "@property <custom-property-name> {\n  <declaration-list>\n}",
		"interfaces": ["CSS", "CSSPropertyRule"],
		"groups": ["CSS Houdini"],
		"descriptors": {
			"syntax": {
				"syntax": "<string>",
				"media": "all",
				"percentages": "no",
				"initial": "n/a (required)",
				"computed": "asSpecified",
				"order": "uniqueOrder",
				"status": "experimental"
			},
			"inherits": {
				"syntax": "true | false",
				"media": "all",
				"percentages": "no",
				"initial": "auto",
				"computed": "asSpecified",
				"order": "uniqueOrder",
				"status": "experimental"
			},
			"initial-value": {
				"syntax": "<declaration-value>?",
				"media": "all",
				"initial": "n/a (required)",
				"percentages": "no",
				"computed": "asSpecified",
				"order": "uniqueOrder",
				"status": "experimental"
			}
		},
		"status": "experimental",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/@property"
	},
	"@scope": {
		"syntax": "@scope [(<scope-start>)]? [to (<scope-end>)]? {\n  <rule-list>\n}",
		"groups": ["CSS Conditional Rules"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/@scope"
	},
	"@starting-style": {
		"syntax": "@starting-style {\n  <declaration-list> | <group-rule-body>\n}",
		"interfaces": ["CSSStartingStyleRule"],
		"groups": ["CSS Animations"],
		"status": "experimental",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/@starting-style"
	},
	"@supports": {
		"syntax": "@supports <supports-condition> {\n  <group-rule-body>\n}",
		"interfaces": [
			"CSSGroupingRule",
			"CSSConditionRule",
			"CSSSupportsRule"
		],
		"groups": ["CSS Conditional Rules"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/@supports"
	}
};
const mdnProperties = {
	"--*": {
		"syntax": "<declaration-value>",
		"media": "all",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Variables"],
		"initial": "seeProse",
		"appliesto": "allElements",
		"computed": "asSpecifiedWithVarsSubstituted",
		"order": "perGrammar",
		"status": "experimental",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/--*"
	},
	"-ms-accelerator": {
		"syntax": "false | true",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Microsoft Extensions"],
		"initial": "false",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-ms-accelerator"
	},
	"-ms-block-progression": {
		"syntax": "tb | rl | bt | lr",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Microsoft Extensions"],
		"initial": "tb",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-ms-block-progression"
	},
	"-ms-content-zoom-chaining": {
		"syntax": "none | chained",
		"media": "interactive",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Microsoft Extensions"],
		"initial": "none",
		"appliesto": "nonReplacedBlockAndInlineBlockElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-ms-content-zoom-chaining"
	},
	"-ms-content-zooming": {
		"syntax": "none | zoom",
		"media": "interactive",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Microsoft Extensions"],
		"initial": "zoomForTheTopLevelNoneForTheRest",
		"appliesto": "nonReplacedBlockAndInlineBlockElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-ms-content-zooming"
	},
	"-ms-content-zoom-limit": {
		"syntax": "<'-ms-content-zoom-limit-min'> <'-ms-content-zoom-limit-max'>",
		"media": "interactive",
		"inherited": false,
		"animationType": "discrete",
		"percentages": ["-ms-content-zoom-limit-max", "-ms-content-zoom-limit-min"],
		"groups": ["Microsoft Extensions"],
		"initial": ["-ms-content-zoom-limit-max", "-ms-content-zoom-limit-min"],
		"appliesto": "nonReplacedBlockAndInlineBlockElements",
		"computed": ["-ms-content-zoom-limit-max", "-ms-content-zoom-limit-min"],
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-ms-content-zoom-limit"
	},
	"-ms-content-zoom-limit-max": {
		"syntax": "<percentage>",
		"media": "interactive",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "maxZoomFactor",
		"groups": ["Microsoft Extensions"],
		"initial": "400%",
		"appliesto": "nonReplacedBlockAndInlineBlockElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-ms-content-zoom-limit-max"
	},
	"-ms-content-zoom-limit-min": {
		"syntax": "<percentage>",
		"media": "interactive",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "minZoomFactor",
		"groups": ["Microsoft Extensions"],
		"initial": "100%",
		"appliesto": "nonReplacedBlockAndInlineBlockElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-ms-content-zoom-limit-min"
	},
	"-ms-content-zoom-snap": {
		"syntax": "<'-ms-content-zoom-snap-type'> || <'-ms-content-zoom-snap-points'>",
		"media": "interactive",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Microsoft Extensions"],
		"initial": ["-ms-content-zoom-snap-type", "-ms-content-zoom-snap-points"],
		"appliesto": "nonReplacedBlockAndInlineBlockElements",
		"computed": ["-ms-content-zoom-snap-type", "-ms-content-zoom-snap-points"],
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-ms-content-zoom-snap"
	},
	"-ms-content-zoom-snap-points": {
		"syntax": "snapInterval( <percentage>, <percentage> ) | snapList( <percentage># )",
		"media": "interactive",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Microsoft Extensions"],
		"initial": "snapInterval(0%, 100%)",
		"appliesto": "nonReplacedBlockAndInlineBlockElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-ms-content-zoom-snap-points"
	},
	"-ms-content-zoom-snap-type": {
		"syntax": "none | proximity | mandatory",
		"media": "interactive",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Microsoft Extensions"],
		"initial": "none",
		"appliesto": "nonReplacedBlockAndInlineBlockElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-ms-content-zoom-snap-type"
	},
	"-ms-filter": {
		"syntax": "<string>",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Microsoft Extensions"],
		"initial": "\"\"",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-ms-filter"
	},
	"-ms-flow-from": {
		"syntax": "[ none | <custom-ident> ]#",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Microsoft Extensions"],
		"initial": "none",
		"appliesto": "nonReplacedElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-ms-flow-from"
	},
	"-ms-flow-into": {
		"syntax": "[ none | <custom-ident> ]#",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Microsoft Extensions"],
		"initial": "none",
		"appliesto": "iframeElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-ms-flow-into"
	},
	"-ms-grid-columns": {
		"syntax": "none | <track-list> | <auto-track-list>",
		"media": "visual",
		"inherited": false,
		"animationType": "simpleListOfLpcDifferenceLpc",
		"percentages": "referToDimensionOfContentArea",
		"groups": ["CSS Grid Layout"],
		"initial": "none",
		"appliesto": "gridContainers",
		"computed": "asSpecifiedRelativeToAbsoluteLengths",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-ms-grid-columns"
	},
	"-ms-grid-rows": {
		"syntax": "none | <track-list> | <auto-track-list>",
		"media": "visual",
		"inherited": false,
		"animationType": "simpleListOfLpcDifferenceLpc",
		"percentages": "referToDimensionOfContentArea",
		"groups": ["CSS Grid Layout"],
		"initial": "none",
		"appliesto": "gridContainers",
		"computed": "asSpecifiedRelativeToAbsoluteLengths",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-ms-grid-rows"
	},
	"-ms-high-contrast-adjust": {
		"syntax": "auto | none",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Microsoft Extensions"],
		"initial": "auto",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-ms-high-contrast-adjust"
	},
	"-ms-hyphenate-limit-chars": {
		"syntax": "auto | <integer>{1,3}",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Microsoft Extensions"],
		"initial": "auto",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-ms-hyphenate-limit-chars"
	},
	"-ms-hyphenate-limit-lines": {
		"syntax": "no-limit | <integer>",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Microsoft Extensions"],
		"initial": "no-limit",
		"appliesto": "blockContainerElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-ms-hyphenate-limit-lines"
	},
	"-ms-hyphenate-limit-zone": {
		"syntax": "<percentage> | <length>",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "referToLineBoxWidth",
		"groups": ["Microsoft Extensions"],
		"initial": "0",
		"appliesto": "blockContainerElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-ms-hyphenate-limit-zone"
	},
	"-ms-ime-align": {
		"syntax": "auto | after",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Microsoft Extensions"],
		"initial": "auto",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-ms-ime-align"
	},
	"-ms-overflow-style": {
		"syntax": "auto | none | scrollbar | -ms-autohiding-scrollbar",
		"media": "interactive",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Microsoft Extensions"],
		"initial": "auto",
		"appliesto": "nonReplacedBlockAndInlineBlockElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-ms-overflow-style"
	},
	"-ms-scrollbar-3dlight-color": {
		"syntax": "<color>",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Microsoft Extensions"],
		"initial": "dependsOnUserAgent",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-ms-scrollbar-3dlight-color"
	},
	"-ms-scrollbar-arrow-color": {
		"syntax": "<color>",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Microsoft Extensions"],
		"initial": "ButtonText",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-ms-scrollbar-arrow-color"
	},
	"-ms-scrollbar-base-color": {
		"syntax": "<color>",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Microsoft Extensions"],
		"initial": "dependsOnUserAgent",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-ms-scrollbar-base-color"
	},
	"-ms-scrollbar-darkshadow-color": {
		"syntax": "<color>",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Microsoft Extensions"],
		"initial": "ThreeDDarkShadow",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-ms-scrollbar-darkshadow-color"
	},
	"-ms-scrollbar-face-color": {
		"syntax": "<color>",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Microsoft Extensions"],
		"initial": "ThreeDFace",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-ms-scrollbar-face-color"
	},
	"-ms-scrollbar-highlight-color": {
		"syntax": "<color>",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Microsoft Extensions"],
		"initial": "ThreeDHighlight",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-ms-scrollbar-highlight-color"
	},
	"-ms-scrollbar-shadow-color": {
		"syntax": "<color>",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Microsoft Extensions"],
		"initial": "ThreeDDarkShadow",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-ms-scrollbar-shadow-color"
	},
	"-ms-scrollbar-track-color": {
		"syntax": "<color>",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Microsoft Extensions"],
		"initial": "Scrollbar",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-ms-scrollbar-track-color"
	},
	"-ms-scroll-chaining": {
		"syntax": "chained | none",
		"media": "interactive",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Microsoft Extensions"],
		"initial": "chained",
		"appliesto": "nonReplacedBlockAndInlineBlockElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-ms-scroll-chaining"
	},
	"-ms-scroll-limit": {
		"syntax": "<'-ms-scroll-limit-x-min'> <'-ms-scroll-limit-y-min'> <'-ms-scroll-limit-x-max'> <'-ms-scroll-limit-y-max'>",
		"media": "interactive",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Microsoft Extensions"],
		"initial": [
			"-ms-scroll-limit-x-min",
			"-ms-scroll-limit-y-min",
			"-ms-scroll-limit-x-max",
			"-ms-scroll-limit-y-max"
		],
		"appliesto": "nonReplacedBlockAndInlineBlockElements",
		"computed": [
			"-ms-scroll-limit-x-min",
			"-ms-scroll-limit-y-min",
			"-ms-scroll-limit-x-max",
			"-ms-scroll-limit-y-max"
		],
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-ms-scroll-limit"
	},
	"-ms-scroll-limit-x-max": {
		"syntax": "auto | <length>",
		"media": "interactive",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Microsoft Extensions"],
		"initial": "auto",
		"appliesto": "nonReplacedBlockAndInlineBlockElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-ms-scroll-limit-x-max"
	},
	"-ms-scroll-limit-x-min": {
		"syntax": "<length>",
		"media": "interactive",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Microsoft Extensions"],
		"initial": "0",
		"appliesto": "nonReplacedBlockAndInlineBlockElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-ms-scroll-limit-x-min"
	},
	"-ms-scroll-limit-y-max": {
		"syntax": "auto | <length>",
		"media": "interactive",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Microsoft Extensions"],
		"initial": "auto",
		"appliesto": "nonReplacedBlockAndInlineBlockElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-ms-scroll-limit-y-max"
	},
	"-ms-scroll-limit-y-min": {
		"syntax": "<length>",
		"media": "interactive",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Microsoft Extensions"],
		"initial": "0",
		"appliesto": "nonReplacedBlockAndInlineBlockElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-ms-scroll-limit-y-min"
	},
	"-ms-scroll-rails": {
		"syntax": "none | railed",
		"media": "interactive",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Microsoft Extensions"],
		"initial": "railed",
		"appliesto": "nonReplacedBlockAndInlineBlockElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-ms-scroll-rails"
	},
	"-ms-scroll-snap-points-x": {
		"syntax": "snapInterval( <length-percentage>, <length-percentage> ) | snapList( <length-percentage># )",
		"media": "interactive",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Microsoft Extensions"],
		"initial": "snapInterval(0px, 100%)",
		"appliesto": "nonReplacedBlockAndInlineBlockElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-ms-scroll-snap-points-x"
	},
	"-ms-scroll-snap-points-y": {
		"syntax": "snapInterval( <length-percentage>, <length-percentage> ) | snapList( <length-percentage># )",
		"media": "interactive",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Microsoft Extensions"],
		"initial": "snapInterval(0px, 100%)",
		"appliesto": "nonReplacedBlockAndInlineBlockElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-ms-scroll-snap-points-y"
	},
	"-ms-scroll-snap-type": {
		"syntax": "none | proximity | mandatory",
		"media": "interactive",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Microsoft Extensions"],
		"initial": "none",
		"appliesto": "nonReplacedBlockAndInlineBlockElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-ms-scroll-snap-type"
	},
	"-ms-scroll-snap-x": {
		"syntax": "<'-ms-scroll-snap-type'> <'-ms-scroll-snap-points-x'>",
		"media": "interactive",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Microsoft Extensions"],
		"initial": ["-ms-scroll-snap-type", "-ms-scroll-snap-points-x"],
		"appliesto": "nonReplacedBlockAndInlineBlockElements",
		"computed": ["-ms-scroll-snap-type", "-ms-scroll-snap-points-x"],
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-ms-scroll-snap-x"
	},
	"-ms-scroll-snap-y": {
		"syntax": "<'-ms-scroll-snap-type'> <'-ms-scroll-snap-points-y'>",
		"media": "interactive",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Microsoft Extensions"],
		"initial": ["-ms-scroll-snap-type", "-ms-scroll-snap-points-y"],
		"appliesto": "nonReplacedBlockAndInlineBlockElements",
		"computed": ["-ms-scroll-snap-type", "-ms-scroll-snap-points-y"],
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-ms-scroll-snap-y"
	},
	"-ms-scroll-translation": {
		"syntax": "none | vertical-to-horizontal",
		"media": "interactive",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Microsoft Extensions"],
		"initial": "none",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-ms-scroll-translation"
	},
	"-ms-text-autospace": {
		"syntax": "none | ideograph-alpha | ideograph-numeric | ideograph-parenthesis | ideograph-space",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Microsoft Extensions"],
		"initial": "none",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-ms-text-autospace"
	},
	"-ms-touch-select": {
		"syntax": "grippers | none",
		"media": "interactive",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Microsoft Extensions"],
		"initial": "grippers",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-ms-touch-select"
	},
	"-ms-user-select": {
		"syntax": "none | element | text",
		"media": "interactive",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Microsoft Extensions"],
		"initial": "text",
		"appliesto": "nonReplacedElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-ms-user-select"
	},
	"-ms-wrap-flow": {
		"syntax": "auto | both | start | end | maximum | clear",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Microsoft Extensions"],
		"initial": "auto",
		"appliesto": "blockLevelElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-ms-wrap-flow"
	},
	"-ms-wrap-margin": {
		"syntax": "<length>",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Microsoft Extensions"],
		"initial": "0",
		"appliesto": "exclusionElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-ms-wrap-margin"
	},
	"-ms-wrap-through": {
		"syntax": "wrap | none",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Microsoft Extensions"],
		"initial": "wrap",
		"appliesto": "blockLevelElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-ms-wrap-through"
	},
	"-moz-appearance": {
		"syntax": "none | button | button-arrow-down | button-arrow-next | button-arrow-previous | button-arrow-up | button-bevel | button-focus | caret | checkbox | checkbox-container | checkbox-label | checkmenuitem | dualbutton | groupbox | listbox | listitem | menuarrow | menubar | menucheckbox | menuimage | menuitem | menuitemtext | menulist | menulist-button | menulist-text | menulist-textfield | menupopup | menuradio | menuseparator | meterbar | meterchunk | progressbar | progressbar-vertical | progresschunk | progresschunk-vertical | radio | radio-container | radio-label | radiomenuitem | range | range-thumb | resizer | resizerpanel | scale-horizontal | scalethumbend | scalethumb-horizontal | scalethumbstart | scalethumbtick | scalethumb-vertical | scale-vertical | scrollbarbutton-down | scrollbarbutton-left | scrollbarbutton-right | scrollbarbutton-up | scrollbarthumb-horizontal | scrollbarthumb-vertical | scrollbartrack-horizontal | scrollbartrack-vertical | searchfield | separator | sheet | spinner | spinner-downbutton | spinner-textfield | spinner-upbutton | splitter | statusbar | statusbarpanel | tab | tabpanel | tabpanels | tab-scroll-arrow-back | tab-scroll-arrow-forward | textfield | textfield-multiline | toolbar | toolbarbutton | toolbarbutton-dropdown | toolbargripper | toolbox | tooltip | treeheader | treeheadercell | treeheadersortarrow | treeitem | treeline | treetwisty | treetwistyopen | treeview | -moz-mac-unified-toolbar | -moz-win-borderless-glass | -moz-win-browsertabbar-toolbox | -moz-win-communicationstext | -moz-win-communications-toolbox | -moz-win-exclude-glass | -moz-win-glass | -moz-win-mediatext | -moz-win-media-toolbox | -moz-window-button-box | -moz-window-button-box-maximized | -moz-window-button-close | -moz-window-button-maximize | -moz-window-button-minimize | -moz-window-button-restore | -moz-window-frame-bottom | -moz-window-frame-left | -moz-window-frame-right | -moz-window-titlebar | -moz-window-titlebar-maximized",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Mozilla Extensions", "WebKit Extensions"],
		"initial": "noneButOverriddenInUserAgentCSS",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/appearance"
	},
	"-moz-binding": {
		"syntax": "<url> | none",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Mozilla Extensions"],
		"initial": "none",
		"appliesto": "allElementsExceptGeneratedContentOrPseudoElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-moz-binding"
	},
	"-moz-border-bottom-colors": {
		"syntax": "<color>+ | none",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Mozilla Extensions"],
		"initial": "none",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-moz-border-bottom-colors"
	},
	"-moz-border-left-colors": {
		"syntax": "<color>+ | none",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Mozilla Extensions"],
		"initial": "none",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-moz-border-left-colors"
	},
	"-moz-border-right-colors": {
		"syntax": "<color>+ | none",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Mozilla Extensions"],
		"initial": "none",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-moz-border-right-colors"
	},
	"-moz-border-top-colors": {
		"syntax": "<color>+ | none",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Mozilla Extensions"],
		"initial": "none",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-moz-border-top-colors"
	},
	"-moz-context-properties": {
		"syntax": "none | [ fill | fill-opacity | stroke | stroke-opacity ]#",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Mozilla Extensions"],
		"initial": "none",
		"appliesto": "allElementsThatCanReferenceImages",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-moz-context-properties"
	},
	"-moz-float-edge": {
		"syntax": "border-box | content-box | margin-box | padding-box",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Mozilla Extensions"],
		"initial": "content-box",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-moz-float-edge"
	},
	"-moz-force-broken-image-icon": {
		"syntax": "0 | 1",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Mozilla Extensions"],
		"initial": "0",
		"appliesto": "images",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-moz-force-broken-image-icon"
	},
	"-moz-image-region": {
		"syntax": "<shape> | auto",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Mozilla Extensions"],
		"initial": "auto",
		"appliesto": "xulImageElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-moz-image-region"
	},
	"-moz-orient": {
		"syntax": "inline | block | horizontal | vertical",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Mozilla Extensions"],
		"initial": "inline",
		"appliesto": "anyElementEffectOnProgressAndMeter",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-moz-orient"
	},
	"-moz-outline-radius": {
		"syntax": "<outline-radius>{1,4} [ / <outline-radius>{1,4} ]?",
		"media": "visual",
		"inherited": false,
		"animationType": [
			"-moz-outline-radius-topleft",
			"-moz-outline-radius-topright",
			"-moz-outline-radius-bottomright",
			"-moz-outline-radius-bottomleft"
		],
		"percentages": [
			"-moz-outline-radius-topleft",
			"-moz-outline-radius-topright",
			"-moz-outline-radius-bottomright",
			"-moz-outline-radius-bottomleft"
		],
		"groups": ["Mozilla Extensions"],
		"initial": [
			"-moz-outline-radius-topleft",
			"-moz-outline-radius-topright",
			"-moz-outline-radius-bottomright",
			"-moz-outline-radius-bottomleft"
		],
		"appliesto": "allElements",
		"computed": [
			"-moz-outline-radius-topleft",
			"-moz-outline-radius-topright",
			"-moz-outline-radius-bottomright",
			"-moz-outline-radius-bottomleft"
		],
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-moz-outline-radius"
	},
	"-moz-outline-radius-bottomleft": {
		"syntax": "<outline-radius>",
		"media": "visual",
		"inherited": false,
		"animationType": "lpc",
		"percentages": "referToDimensionOfBorderBox",
		"groups": ["Mozilla Extensions"],
		"initial": "0",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-moz-outline-radius-bottomleft"
	},
	"-moz-outline-radius-bottomright": {
		"syntax": "<outline-radius>",
		"media": "visual",
		"inherited": false,
		"animationType": "lpc",
		"percentages": "referToDimensionOfBorderBox",
		"groups": ["Mozilla Extensions"],
		"initial": "0",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-moz-outline-radius-bottomright"
	},
	"-moz-outline-radius-topleft": {
		"syntax": "<outline-radius>",
		"media": "visual",
		"inherited": false,
		"animationType": "lpc",
		"percentages": "referToDimensionOfBorderBox",
		"groups": ["Mozilla Extensions"],
		"initial": "0",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-moz-outline-radius-topleft"
	},
	"-moz-outline-radius-topright": {
		"syntax": "<outline-radius>",
		"media": "visual",
		"inherited": false,
		"animationType": "lpc",
		"percentages": "referToDimensionOfBorderBox",
		"groups": ["Mozilla Extensions"],
		"initial": "0",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-moz-outline-radius-topright"
	},
	"-moz-stack-sizing": {
		"syntax": "ignore | stretch-to-fit",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Mozilla Extensions"],
		"initial": "stretch-to-fit",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-moz-stack-sizing"
	},
	"-moz-text-blink": {
		"syntax": "none | blink",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Mozilla Extensions"],
		"initial": "none",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-moz-text-blink"
	},
	"-moz-user-focus": {
		"syntax": "ignore | normal | select-after | select-before | select-menu | select-same | select-all | none",
		"media": "interactive",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Mozilla Extensions"],
		"initial": "none",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-moz-user-focus"
	},
	"-moz-user-input": {
		"syntax": "auto | none | enabled | disabled",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Mozilla Extensions"],
		"initial": "auto",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-moz-user-input"
	},
	"-moz-user-modify": {
		"syntax": "read-only | read-write | write-only",
		"media": "interactive",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Mozilla Extensions"],
		"initial": "read-only",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-moz-user-modify"
	},
	"-moz-window-dragging": {
		"syntax": "drag | no-drag",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Mozilla Extensions"],
		"initial": "drag",
		"appliesto": "allElementsCreatingNativeWindows",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-moz-window-dragging"
	},
	"-moz-window-shadow": {
		"syntax": "default | menu | tooltip | sheet | none",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Mozilla Extensions"],
		"initial": "default",
		"appliesto": "allElementsCreatingNativeWindows",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-moz-window-shadow"
	},
	"-webkit-appearance": {
		"syntax": "none | button | button-bevel | caret | checkbox | default-button | inner-spin-button | listbox | listitem | media-controls-background | media-controls-fullscreen-background | media-current-time-display | media-enter-fullscreen-button | media-exit-fullscreen-button | media-fullscreen-button | media-mute-button | media-overlay-play-button | media-play-button | media-seek-back-button | media-seek-forward-button | media-slider | media-sliderthumb | media-time-remaining-display | media-toggle-closed-captions-button | media-volume-slider | media-volume-slider-container | media-volume-sliderthumb | menulist | menulist-button | menulist-text | menulist-textfield | meter | progress-bar | progress-bar-value | push-button | radio | searchfield | searchfield-cancel-button | searchfield-decoration | searchfield-results-button | searchfield-results-decoration | slider-horizontal | slider-vertical | sliderthumb-horizontal | sliderthumb-vertical | square-button | textarea | textfield | -apple-pay-button",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["WebKit Extensions"],
		"initial": "noneButOverriddenInUserAgentCSS",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/appearance"
	},
	"-webkit-border-before": {
		"syntax": "<'border-width'> || <'border-style'> || <color>",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": ["-webkit-border-before-width"],
		"groups": ["WebKit Extensions"],
		"initial": [
			"border-width",
			"border-style",
			"color"
		],
		"appliesto": "allElements",
		"computed": [
			"border-width",
			"border-style",
			"color"
		],
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-webkit-border-before"
	},
	"-webkit-border-before-color": {
		"syntax": "<color>",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["WebKit Extensions"],
		"initial": "currentcolor",
		"appliesto": "allElements",
		"computed": "computedColor",
		"order": "uniqueOrder",
		"status": "nonstandard"
	},
	"-webkit-border-before-style": {
		"syntax": "<'border-style'>",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["WebKit Extensions"],
		"initial": "none",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard"
	},
	"-webkit-border-before-width": {
		"syntax": "<'border-width'>",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "logicalWidthOfContainingBlock",
		"groups": ["WebKit Extensions"],
		"initial": "medium",
		"appliesto": "allElements",
		"computed": "absoluteLengthZeroIfBorderStyleNoneOrHidden",
		"order": "uniqueOrder",
		"status": "nonstandard"
	},
	"-webkit-box-reflect": {
		"syntax": "[ above | below | right | left ]? <length>? <image>?",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["WebKit Extensions"],
		"initial": "none",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-webkit-box-reflect"
	},
	"-webkit-line-clamp": {
		"syntax": "none | <integer>",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "no",
		"groups": ["WebKit Extensions", "CSS Overflow"],
		"initial": "none",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-webkit-line-clamp"
	},
	"-webkit-mask": {
		"syntax": "[ <mask-reference> || <position> [ / <bg-size> ]? || <repeat-style> || [ <box> | border | padding | content | text ] || [ <box> | border | padding | content ] ]#",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["WebKit Extensions"],
		"initial": [
			"-webkit-mask-image",
			"-webkit-mask-repeat",
			"-webkit-mask-attachment",
			"-webkit-mask-position",
			"-webkit-mask-origin",
			"-webkit-mask-clip"
		],
		"appliesto": "allElements",
		"computed": [
			"-webkit-mask-image",
			"-webkit-mask-repeat",
			"-webkit-mask-attachment",
			"-webkit-mask-position",
			"-webkit-mask-origin",
			"-webkit-mask-clip"
		],
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/mask"
	},
	"-webkit-mask-attachment": {
		"syntax": "<attachment>#",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["WebKit Extensions"],
		"initial": "scroll",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "orderOfAppearance",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-webkit-mask-attachment"
	},
	"-webkit-mask-clip": {
		"syntax": "[ <box> | border | padding | content | text ]#",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["WebKit Extensions"],
		"initial": "border",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "orderOfAppearance",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/mask-clip"
	},
	"-webkit-mask-composite": {
		"syntax": "<composite-style>#",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["WebKit Extensions"],
		"initial": "source-over",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "orderOfAppearance",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-webkit-mask-composite"
	},
	"-webkit-mask-image": {
		"syntax": "<mask-reference>#",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["WebKit Extensions"],
		"initial": "none",
		"appliesto": "allElements",
		"computed": "absoluteURIOrNone",
		"order": "orderOfAppearance",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/mask-image"
	},
	"-webkit-mask-origin": {
		"syntax": "[ <box> | border | padding | content ]#",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["WebKit Extensions"],
		"initial": "padding",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "orderOfAppearance",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/mask-origin"
	},
	"-webkit-mask-position": {
		"syntax": "<position>#",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "referToSizeOfElement",
		"groups": ["WebKit Extensions"],
		"initial": "0% 0%",
		"appliesto": "allElements",
		"computed": "absoluteLengthOrPercentage",
		"order": "orderOfAppearance",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/mask-position"
	},
	"-webkit-mask-position-x": {
		"syntax": "[ <length-percentage> | left | center | right ]#",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "referToSizeOfElement",
		"groups": ["WebKit Extensions"],
		"initial": "0%",
		"appliesto": "allElements",
		"computed": "absoluteLengthOrPercentage",
		"order": "orderOfAppearance",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-webkit-mask-position-x"
	},
	"-webkit-mask-position-y": {
		"syntax": "[ <length-percentage> | top | center | bottom ]#",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "referToSizeOfElement",
		"groups": ["WebKit Extensions"],
		"initial": "0%",
		"appliesto": "allElements",
		"computed": "absoluteLengthOrPercentage",
		"order": "orderOfAppearance",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-webkit-mask-position-y"
	},
	"-webkit-mask-repeat": {
		"syntax": "<repeat-style>#",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["WebKit Extensions"],
		"initial": "repeat",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "orderOfAppearance",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/mask-repeat"
	},
	"-webkit-mask-repeat-x": {
		"syntax": "repeat | no-repeat | space | round",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["WebKit Extensions"],
		"initial": "repeat",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "orderOfAppearance",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-webkit-mask-repeat-x"
	},
	"-webkit-mask-repeat-y": {
		"syntax": "repeat | no-repeat | space | round",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["WebKit Extensions"],
		"initial": "repeat",
		"appliesto": "allElements",
		"computed": "absoluteLengthOrPercentage",
		"order": "orderOfAppearance",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-webkit-mask-repeat-y"
	},
	"-webkit-mask-size": {
		"syntax": "<bg-size>#",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "relativeToBackgroundPositioningArea",
		"groups": ["WebKit Extensions"],
		"initial": "auto auto",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "orderOfAppearance",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/mask-size"
	},
	"-webkit-overflow-scrolling": {
		"syntax": "auto | touch",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["WebKit Extensions"],
		"initial": "auto",
		"appliesto": "scrollingBoxes",
		"computed": "asSpecified",
		"order": "orderOfAppearance",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-webkit-overflow-scrolling"
	},
	"-webkit-tap-highlight-color": {
		"syntax": "<color>",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["WebKit Extensions"],
		"initial": "black",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-webkit-tap-highlight-color"
	},
	"-webkit-text-fill-color": {
		"syntax": "<color>",
		"media": "visual",
		"inherited": true,
		"animationType": "color",
		"percentages": "no",
		"groups": ["WebKit Extensions"],
		"initial": "currentcolor",
		"appliesto": "allElements",
		"computed": "computedColor",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-webkit-text-fill-color"
	},
	"-webkit-text-stroke": {
		"syntax": "<length> || <color>",
		"media": "visual",
		"inherited": true,
		"animationType": ["-webkit-text-stroke-width", "-webkit-text-stroke-color"],
		"percentages": "no",
		"groups": ["WebKit Extensions"],
		"initial": ["-webkit-text-stroke-width", "-webkit-text-stroke-color"],
		"appliesto": "allElements",
		"computed": ["-webkit-text-stroke-width", "-webkit-text-stroke-color"],
		"order": "canonicalOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-webkit-text-stroke"
	},
	"-webkit-text-stroke-color": {
		"syntax": "<color>",
		"media": "visual",
		"inherited": true,
		"animationType": "color",
		"percentages": "no",
		"groups": ["WebKit Extensions"],
		"initial": "currentcolor",
		"appliesto": "allElements",
		"computed": "computedColor",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-webkit-text-stroke-color"
	},
	"-webkit-text-stroke-width": {
		"syntax": "<length>",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["WebKit Extensions"],
		"initial": "0",
		"appliesto": "allElements",
		"computed": "absoluteLength",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-webkit-text-stroke-width"
	},
	"-webkit-touch-callout": {
		"syntax": "default | none",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["WebKit Extensions"],
		"initial": "default",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/-webkit-touch-callout"
	},
	"-webkit-user-modify": {
		"syntax": "read-only | read-write | read-write-plaintext-only",
		"media": "interactive",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["WebKit Extensions"],
		"initial": "read-only",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard"
	},
	"accent-color": {
		"syntax": "auto | <color>",
		"media": "interactive",
		"inherited": true,
		"animationType": "byComputedValueType",
		"percentages": "no",
		"groups": ["CSS Basic User Interface"],
		"initial": "auto",
		"appliesto": "allElements",
		"computed": "asAutoOrColor",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/accent-color"
	},
	"align-content": {
		"syntax": "normal | <baseline-position> | <content-distribution> | <overflow-position>? <content-position>",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Box Alignment"],
		"initial": "normal",
		"appliesto": "blockContainersMultiColumnContainersFlexContainersGridContainers",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/align-content"
	},
	"align-items": {
		"syntax": "normal | stretch | <baseline-position> | [ <overflow-position>? <self-position> ]",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Box Alignment"],
		"initial": "normal",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/align-items"
	},
	"align-self": {
		"syntax": "auto | normal | stretch | <baseline-position> | <overflow-position>? <self-position>",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Box Alignment"],
		"initial": "auto",
		"appliesto": "flexItemsGridItemsAndAbsolutelyPositionedBoxes",
		"computed": "autoOnAbsolutelyPositionedElementsValueOfAlignItemsOnParent",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/align-self"
	},
	"align-tracks": {
		"syntax": "[ normal | <baseline-position> | <content-distribution> | <overflow-position>? <content-position> ]#",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Grid Layout"],
		"initial": "normal",
		"appliesto": "gridContainersWithMasonryLayoutInTheirBlockAxis",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "experimental",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/align-tracks"
	},
	"all": {
		"syntax": "initial | inherit | unset | revert | revert-layer",
		"media": "noPracticalMedia",
		"inherited": false,
		"animationType": "eachOfShorthandPropertiesExceptUnicodeBiDiAndDirection",
		"percentages": "no",
		"groups": ["CSS Miscellaneous"],
		"initial": "noPracticalInitialValue",
		"appliesto": "allElements",
		"computed": "asSpecifiedAppliesToEachProperty",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/all"
	},
	"anchor-name": {
		"syntax": "none | <dashed-ident>#",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Positioning"],
		"initial": "none",
		"appliesto": "allElementsThatGenerateAPrincipalBox",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "experimental",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/anchor-name"
	},
	"anchor-scope": {
		"syntax": "none | all | <dashed-ident>#",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Positioning"],
		"initial": "none",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "experimental",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/anchor-scope"
	},
	"animation": {
		"syntax": "<single-animation>#",
		"media": "visual",
		"inherited": false,
		"animationType": "notAnimatable",
		"percentages": "no",
		"groups": ["CSS Animations"],
		"initial": [
			"animation-name",
			"animation-duration",
			"animation-timing-function",
			"animation-delay",
			"animation-iteration-count",
			"animation-direction",
			"animation-fill-mode",
			"animation-play-state",
			"animation-timeline"
		],
		"appliesto": "allElements",
		"computed": [
			"animation-name",
			"animation-duration",
			"animation-timing-function",
			"animation-delay",
			"animation-direction",
			"animation-iteration-count",
			"animation-fill-mode",
			"animation-play-state",
			"animation-timeline"
		],
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/animation"
	},
	"animation-composition": {
		"syntax": "<single-animation-composition>#",
		"media": "visual",
		"inherited": false,
		"animationType": "notAnimatable",
		"percentages": "no",
		"groups": ["CSS Animations"],
		"initial": "replace",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "experimental",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/animation-composition"
	},
	"animation-delay": {
		"syntax": "<time>#",
		"media": "visual",
		"inherited": false,
		"animationType": "notAnimatable",
		"percentages": "no",
		"groups": ["CSS Animations"],
		"initial": "0s",
		"appliesto": "allElementsAndPseudos",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/animation-delay"
	},
	"animation-direction": {
		"syntax": "<single-animation-direction>#",
		"media": "visual",
		"inherited": false,
		"animationType": "notAnimatable",
		"percentages": "no",
		"groups": ["CSS Animations"],
		"initial": "normal",
		"appliesto": "allElementsAndPseudos",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/animation-direction"
	},
	"animation-duration": {
		"syntax": "<time>#",
		"media": "visual",
		"inherited": false,
		"animationType": "notAnimatable",
		"percentages": "no",
		"groups": ["CSS Animations"],
		"initial": "0s",
		"appliesto": "allElementsAndPseudos",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/animation-duration"
	},
	"animation-fill-mode": {
		"syntax": "<single-animation-fill-mode>#",
		"media": "visual",
		"inherited": false,
		"animationType": "notAnimatable",
		"percentages": "no",
		"groups": ["CSS Animations"],
		"initial": "none",
		"appliesto": "allElementsAndPseudos",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/animation-fill-mode"
	},
	"animation-iteration-count": {
		"syntax": "<single-animation-iteration-count>#",
		"media": "visual",
		"inherited": false,
		"animationType": "notAnimatable",
		"percentages": "no",
		"groups": ["CSS Animations"],
		"initial": "1",
		"appliesto": "allElementsAndPseudos",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/animation-iteration-count"
	},
	"animation-name": {
		"syntax": "[ none | <keyframes-name> ]#",
		"media": "visual",
		"inherited": false,
		"animationType": "notAnimatable",
		"percentages": "no",
		"groups": ["CSS Animations"],
		"initial": "none",
		"appliesto": "allElementsAndPseudos",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/animation-name"
	},
	"animation-play-state": {
		"syntax": "<single-animation-play-state>#",
		"media": "visual",
		"inherited": false,
		"animationType": "notAnimatable",
		"percentages": "no",
		"groups": ["CSS Animations"],
		"initial": "running",
		"appliesto": "allElementsAndPseudos",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/animation-play-state"
	},
	"animation-range": {
		"syntax": "[ <'animation-range-start'> <'animation-range-end'>? ]#",
		"media": "visual",
		"inherited": false,
		"animationType": ["animation-range-start", "animation-range-end"],
		"percentages": "relativeToTimelineRangeIfSpecifiedOtherwiseEntireTimeline",
		"groups": ["CSS Animations"],
		"initial": ["animation-range-start", "animation-range-end"],
		"appliesto": "allElements",
		"computed": ["animation-range-start", "animation-range-end"],
		"order": "perGrammar",
		"status": "experimental",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/animation-range"
	},
	"animation-range-end": {
		"syntax": "[ normal | <length-percentage> | <timeline-range-name> <length-percentage>? ]#",
		"media": "visual",
		"inherited": false,
		"animationType": "notAnimatable",
		"percentages": "relativeToTimelineRangeIfSpecifiedOtherwiseEntireTimeline",
		"groups": ["CSS Animations"],
		"initial": "normal",
		"appliesto": "allElements",
		"computed": "listEachItemConsistingOfNormalLengthPercentageOrNameLengthPercentage",
		"order": "perGrammar",
		"status": "experimental",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/animation-range-end"
	},
	"animation-range-start": {
		"syntax": "[ normal | <length-percentage> | <timeline-range-name> <length-percentage>? ]#",
		"media": "visual",
		"inherited": false,
		"animationType": "notAnimatable",
		"percentages": "relativeToTimelineRangeIfSpecifiedOtherwiseEntireTimeline",
		"groups": ["CSS Animations"],
		"initial": "normal",
		"appliesto": "allElements",
		"computed": "listEachItemConsistingOfNormalLengthPercentageOrNameLengthPercentage",
		"order": "perGrammar",
		"status": "experimental",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/animation-range-start"
	},
	"animation-timing-function": {
		"syntax": "<easing-function>#",
		"media": "visual",
		"inherited": false,
		"animationType": "notAnimatable",
		"percentages": "no",
		"groups": ["CSS Animations"],
		"initial": "ease",
		"appliesto": "allElementsAndPseudos",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/animation-timing-function"
	},
	"animation-timeline": {
		"syntax": "<single-animation-timeline>#",
		"media": "visual",
		"inherited": false,
		"animationType": "notAnimatable",
		"percentages": "no",
		"groups": ["CSS Animations"],
		"initial": "auto",
		"appliesto": "allElements",
		"computed": "listEachItemIdentifierOrNoneAuto",
		"order": "perGrammar",
		"status": "experimental",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/animation-timeline"
	},
	"appearance": {
		"syntax": "none | auto | textfield | menulist-button | <compat-auto>",
		"media": "all",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Basic User Interface"],
		"initial": "none",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "experimental",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/appearance"
	},
	"aspect-ratio": {
		"syntax": "auto || <ratio>",
		"media": "all",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "no",
		"groups": ["CSS Basic User Interface"],
		"initial": "auto",
		"appliesto": "allElementsExceptInlineBoxesAndInternalRubyOrTableBoxes",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "experimental",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/aspect-ratio"
	},
	"azimuth": {
		"syntax": "<angle> | [ [ left-side | far-left | left | center-left | center | center-right | right | far-right | right-side ] || behind ] | leftwards | rightwards",
		"media": "aural",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Speech"],
		"initial": "center",
		"appliesto": "allElements",
		"computed": "normalizedAngle",
		"order": "orderOfAppearance",
		"status": "obsolete",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/azimuth"
	},
	"backdrop-filter": {
		"syntax": "none | <filter-function-list>",
		"media": "visual",
		"inherited": false,
		"animationType": "filterList",
		"percentages": "no",
		"groups": ["Filter Effects"],
		"initial": "none",
		"appliesto": "allElementsSVGContainerElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/backdrop-filter"
	},
	"backface-visibility": {
		"syntax": "visible | hidden",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Transforms"],
		"initial": "visible",
		"appliesto": "transformableElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/backface-visibility"
	},
	"background": {
		"syntax": "[ <bg-layer> , ]* <final-bg-layer>",
		"media": "visual",
		"inherited": false,
		"animationType": [
			"background-color",
			"background-image",
			"background-clip",
			"background-position",
			"background-size",
			"background-repeat",
			"background-attachment"
		],
		"percentages": ["background-position", "background-size"],
		"groups": ["CSS Backgrounds and Borders"],
		"initial": [
			"background-image",
			"background-position",
			"background-size",
			"background-repeat",
			"background-origin",
			"background-clip",
			"background-attachment",
			"background-color"
		],
		"appliesto": "allElements",
		"computed": [
			"background-image",
			"background-position",
			"background-size",
			"background-repeat",
			"background-origin",
			"background-clip",
			"background-attachment",
			"background-color"
		],
		"order": "orderOfAppearance",
		"alsoAppliesTo": [
			"::first-letter",
			"::first-line",
			"::placeholder"
		],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/background"
	},
	"background-attachment": {
		"syntax": "<attachment>#",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Backgrounds and Borders"],
		"initial": "scroll",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"alsoAppliesTo": [
			"::first-letter",
			"::first-line",
			"::placeholder"
		],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/background-attachment"
	},
	"background-blend-mode": {
		"syntax": "<blend-mode>#",
		"media": "none",
		"inherited": false,
		"animationType": "notAnimatable",
		"percentages": "no",
		"groups": ["Compositing and Blending"],
		"initial": "normal",
		"appliesto": "allElementsSVGContainerGraphicsAndGraphicsReferencingElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"alsoAppliesTo": [
			"::first-letter",
			"::first-line",
			"::placeholder"
		],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/background-blend-mode"
	},
	"background-clip": {
		"syntax": "<box>#",
		"media": "visual",
		"inherited": false,
		"animationType": "repeatableList",
		"percentages": "no",
		"groups": ["CSS Backgrounds and Borders"],
		"initial": "border-box",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"alsoAppliesTo": [
			"::first-letter",
			"::first-line",
			"::placeholder"
		],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/background-clip"
	},
	"background-color": {
		"syntax": "<color>",
		"media": "visual",
		"inherited": false,
		"animationType": "color",
		"percentages": "no",
		"groups": ["CSS Backgrounds and Borders"],
		"initial": "transparent",
		"appliesto": "allElements",
		"computed": "computedColor",
		"order": "uniqueOrder",
		"alsoAppliesTo": [
			"::first-letter",
			"::first-line",
			"::placeholder"
		],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/background-color"
	},
	"background-image": {
		"syntax": "<bg-image>#",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Backgrounds and Borders"],
		"initial": "none",
		"appliesto": "allElements",
		"computed": "asSpecifiedURLsAbsolute",
		"order": "uniqueOrder",
		"alsoAppliesTo": [
			"::first-letter",
			"::first-line",
			"::placeholder"
		],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/background-image"
	},
	"background-origin": {
		"syntax": "<box>#",
		"media": "visual",
		"inherited": false,
		"animationType": "repeatableList",
		"percentages": "no",
		"groups": ["CSS Backgrounds and Borders"],
		"initial": "padding-box",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"alsoAppliesTo": [
			"::first-letter",
			"::first-line",
			"::placeholder"
		],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/background-origin"
	},
	"background-position": {
		"syntax": "<bg-position>#",
		"media": "visual",
		"inherited": false,
		"animationType": "repeatableList",
		"percentages": "referToSizeOfBackgroundPositioningAreaMinusBackgroundImageSize",
		"groups": ["CSS Backgrounds and Borders"],
		"initial": "0% 0%",
		"appliesto": "allElements",
		"computed": ["background-position-x", "background-position-y"],
		"order": "uniqueOrder",
		"alsoAppliesTo": [
			"::first-letter",
			"::first-line",
			"::placeholder"
		],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/background-position"
	},
	"background-position-x": {
		"syntax": "[ center | [ [ left | right | x-start | x-end ]? <length-percentage>? ]! ]#",
		"media": "visual",
		"inherited": false,
		"animationType": "repeatableList",
		"percentages": "referToWidthOfBackgroundPositioningAreaMinusBackgroundImageWidth",
		"groups": ["CSS Backgrounds and Borders"],
		"initial": "0%",
		"appliesto": "allElements",
		"computed": "listEachItemConsistingOfAbsoluteLengthPercentageAndOrigin",
		"order": "uniqueOrder",
		"alsoAppliesTo": [
			"::first-letter",
			"::first-line",
			"::placeholder"
		],
		"status": "experimental",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/background-position-x"
	},
	"background-position-y": {
		"syntax": "[ center | [ [ top | bottom | y-start | y-end ]? <length-percentage>? ]! ]#",
		"media": "visual",
		"inherited": false,
		"animationType": "repeatableList",
		"percentages": "referToHeightOfBackgroundPositioningAreaMinusBackgroundImageHeight",
		"groups": ["CSS Backgrounds and Borders"],
		"initial": "0%",
		"appliesto": "allElements",
		"computed": "listEachItemConsistingOfAbsoluteLengthPercentageAndOrigin",
		"order": "uniqueOrder",
		"alsoAppliesTo": [
			"::first-letter",
			"::first-line",
			"::placeholder"
		],
		"status": "experimental",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/background-position-y"
	},
	"background-repeat": {
		"syntax": "<repeat-style>#",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Backgrounds and Borders"],
		"initial": "repeat",
		"appliesto": "allElements",
		"computed": "listEachItemHasTwoKeywordsOnePerDimension",
		"order": "uniqueOrder",
		"alsoAppliesTo": [
			"::first-letter",
			"::first-line",
			"::placeholder"
		],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/background-repeat"
	},
	"background-size": {
		"syntax": "<bg-size>#",
		"media": "visual",
		"inherited": false,
		"animationType": "repeatableList",
		"percentages": "relativeToBackgroundPositioningArea",
		"groups": ["CSS Backgrounds and Borders"],
		"initial": "auto auto",
		"appliesto": "allElements",
		"computed": "asSpecifiedRelativeToAbsoluteLengths",
		"order": "uniqueOrder",
		"alsoAppliesTo": [
			"::first-letter",
			"::first-line",
			"::placeholder"
		],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/background-size"
	},
	"block-size": {
		"syntax": "<'width'>",
		"media": "visual",
		"inherited": false,
		"animationType": "lpc",
		"percentages": "blockSizeOfContainingBlock",
		"groups": ["CSS Logical Properties"],
		"initial": "auto",
		"appliesto": "sameAsWidthAndHeight",
		"computed": "sameAsWidthAndHeight",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/block-size"
	},
	"border": {
		"syntax": "<line-width> || <line-style> || <color>",
		"media": "visual",
		"inherited": false,
		"animationType": [
			"border-width",
			"border-style",
			"border-color"
		],
		"percentages": "no",
		"groups": ["CSS Backgrounds and Borders"],
		"initial": [
			"border-width",
			"border-style",
			"border-color"
		],
		"appliesto": "allElements",
		"computed": [
			"border-width",
			"border-style",
			"border-color"
		],
		"order": "orderOfAppearance",
		"alsoAppliesTo": ["::first-letter"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border"
	},
	"border-block": {
		"syntax": "<'border-top-width'> || <'border-top-style'> || <color>",
		"media": "visual",
		"inherited": false,
		"animationType": [
			"border-block-width",
			"border-block-style",
			"border-block-color"
		],
		"percentages": "no",
		"groups": ["CSS Logical Properties"],
		"initial": [
			"border-block-width",
			"border-block-style",
			"border-block-color"
		],
		"appliesto": "allElements",
		"computed": [
			"border-block-width",
			"border-block-style",
			"border-block-color"
		],
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-block"
	},
	"border-block-color": {
		"syntax": "<'border-top-color'>{1,2}",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "no",
		"groups": ["CSS Logical Properties"],
		"initial": "currentcolor",
		"appliesto": "allElements",
		"computed": "computedColor",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-block-color"
	},
	"border-block-style": {
		"syntax": "<'border-top-style'>",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Logical Properties"],
		"initial": "none",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-block-style"
	},
	"border-block-width": {
		"syntax": "<'border-top-width'>",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "logicalWidthOfContainingBlock",
		"groups": ["CSS Logical Properties"],
		"initial": "medium",
		"appliesto": "allElements",
		"computed": "absoluteLengthZeroIfBorderStyleNoneOrHidden",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-block-width"
	},
	"border-block-end": {
		"syntax": "<'border-top-width'> || <'border-top-style'> || <color>",
		"media": "visual",
		"inherited": false,
		"animationType": [
			"border-block-end-color",
			"border-block-end-style",
			"border-block-end-width"
		],
		"percentages": "no",
		"groups": ["CSS Logical Properties"],
		"initial": [
			"border-top-width",
			"border-top-style",
			"border-top-color"
		],
		"appliesto": "allElements",
		"computed": [
			"border-top-width",
			"border-top-style",
			"border-top-color"
		],
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-block-end"
	},
	"border-block-end-color": {
		"syntax": "<'border-top-color'>",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "no",
		"groups": ["CSS Logical Properties"],
		"initial": "currentcolor",
		"appliesto": "allElements",
		"computed": "computedColor",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-block-end-color"
	},
	"border-block-end-style": {
		"syntax": "<'border-top-style'>",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Logical Properties"],
		"initial": "none",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-block-end-style"
	},
	"border-block-end-width": {
		"syntax": "<'border-top-width'>",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "logicalWidthOfContainingBlock",
		"groups": ["CSS Logical Properties"],
		"initial": "medium",
		"appliesto": "allElements",
		"computed": "absoluteLengthZeroIfBorderStyleNoneOrHidden",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-block-end-width"
	},
	"border-block-start": {
		"syntax": "<'border-top-width'> || <'border-top-style'> || <color>",
		"media": "visual",
		"inherited": false,
		"animationType": [
			"border-block-start-color",
			"border-block-start-style",
			"border-block-start-width"
		],
		"percentages": "no",
		"groups": ["CSS Logical Properties"],
		"initial": [
			"border-width",
			"border-style",
			"color"
		],
		"appliesto": "allElements",
		"computed": [
			"border-width",
			"border-style",
			"border-block-start-color"
		],
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-block-start"
	},
	"border-block-start-color": {
		"syntax": "<'border-top-color'>",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "no",
		"groups": ["CSS Logical Properties"],
		"initial": "currentcolor",
		"appliesto": "allElements",
		"computed": "computedColor",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-block-start-color"
	},
	"border-block-start-style": {
		"syntax": "<'border-top-style'>",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Logical Properties"],
		"initial": "none",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-block-start-style"
	},
	"border-block-start-width": {
		"syntax": "<'border-top-width'>",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "logicalWidthOfContainingBlock",
		"groups": ["CSS Logical Properties"],
		"initial": "medium",
		"appliesto": "allElements",
		"computed": "absoluteLengthZeroIfBorderStyleNoneOrHidden",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-block-start-width"
	},
	"border-bottom": {
		"syntax": "<line-width> || <line-style> || <color>",
		"media": "visual",
		"inherited": false,
		"animationType": [
			"border-bottom-color",
			"border-bottom-style",
			"border-bottom-width"
		],
		"percentages": "no",
		"groups": ["CSS Backgrounds and Borders"],
		"initial": [
			"border-bottom-width",
			"border-bottom-style",
			"border-bottom-color"
		],
		"appliesto": "allElements",
		"computed": [
			"border-bottom-width",
			"border-bottom-style",
			"border-bottom-color"
		],
		"order": "orderOfAppearance",
		"alsoAppliesTo": ["::first-letter"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-bottom"
	},
	"border-bottom-color": {
		"syntax": "<'border-top-color'>",
		"media": "visual",
		"inherited": false,
		"animationType": "color",
		"percentages": "no",
		"groups": ["CSS Backgrounds and Borders"],
		"initial": "currentcolor",
		"appliesto": "allElements",
		"computed": "computedColor",
		"order": "uniqueOrder",
		"alsoAppliesTo": ["::first-letter"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-bottom-color"
	},
	"border-bottom-left-radius": {
		"syntax": "<length-percentage>{1,2}",
		"media": "visual",
		"inherited": false,
		"animationType": "lpc",
		"percentages": "referToDimensionOfBorderBox",
		"groups": ["CSS Backgrounds and Borders"],
		"initial": "0",
		"appliesto": "allElementsUAsNotRequiredWhenCollapse",
		"computed": "twoAbsoluteLengthOrPercentages",
		"order": "uniqueOrder",
		"alsoAppliesTo": ["::first-letter"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-bottom-left-radius"
	},
	"border-bottom-right-radius": {
		"syntax": "<length-percentage>{1,2}",
		"media": "visual",
		"inherited": false,
		"animationType": "lpc",
		"percentages": "referToDimensionOfBorderBox",
		"groups": ["CSS Backgrounds and Borders"],
		"initial": "0",
		"appliesto": "allElementsUAsNotRequiredWhenCollapse",
		"computed": "twoAbsoluteLengthOrPercentages",
		"order": "uniqueOrder",
		"alsoAppliesTo": ["::first-letter"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-bottom-right-radius"
	},
	"border-bottom-style": {
		"syntax": "<line-style>",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Backgrounds and Borders"],
		"initial": "none",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"alsoAppliesTo": ["::first-letter"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-bottom-style"
	},
	"border-bottom-width": {
		"syntax": "<line-width>",
		"media": "visual",
		"inherited": false,
		"animationType": "length",
		"percentages": "no",
		"groups": ["CSS Backgrounds and Borders"],
		"initial": "medium",
		"appliesto": "allElements",
		"computed": "absoluteLengthOr0IfBorderBottomStyleNoneOrHidden",
		"order": "uniqueOrder",
		"alsoAppliesTo": ["::first-letter"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-bottom-width"
	},
	"border-collapse": {
		"syntax": "collapse | separate",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Table"],
		"initial": "separate",
		"appliesto": "tableElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-collapse"
	},
	"border-color": {
		"syntax": "<color>{1,4}",
		"media": "visual",
		"inherited": false,
		"animationType": [
			"border-bottom-color",
			"border-left-color",
			"border-right-color",
			"border-top-color"
		],
		"percentages": "no",
		"groups": ["CSS Backgrounds and Borders"],
		"initial": [
			"border-top-color",
			"border-right-color",
			"border-bottom-color",
			"border-left-color"
		],
		"appliesto": "allElements",
		"computed": [
			"border-bottom-color",
			"border-left-color",
			"border-right-color",
			"border-top-color"
		],
		"order": "uniqueOrder",
		"alsoAppliesTo": ["::first-letter"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-color"
	},
	"border-end-end-radius": {
		"syntax": "<length-percentage>{1,2}",
		"media": "visual",
		"inherited": false,
		"animationType": "lpc",
		"percentages": "referToDimensionOfBorderBox",
		"groups": ["CSS Logical Properties"],
		"initial": "0",
		"appliesto": "allElementsUAsNotRequiredWhenCollapse",
		"computed": "twoAbsoluteLengthOrPercentages",
		"order": "uniqueOrder",
		"alsoAppliesTo": ["::first-letter"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-end-end-radius"
	},
	"border-end-start-radius": {
		"syntax": "<length-percentage>{1,2}",
		"media": "visual",
		"inherited": false,
		"animationType": "lpc",
		"percentages": "referToDimensionOfBorderBox",
		"groups": ["CSS Logical Properties"],
		"initial": "0",
		"appliesto": "allElementsUAsNotRequiredWhenCollapse",
		"computed": "twoAbsoluteLengthOrPercentages",
		"order": "uniqueOrder",
		"alsoAppliesTo": ["::first-letter"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-end-start-radius"
	},
	"border-image": {
		"syntax": "<'border-image-source'> || <'border-image-slice'> [ / <'border-image-width'> | / <'border-image-width'>? / <'border-image-outset'> ]? || <'border-image-repeat'>",
		"media": "visual",
		"inherited": false,
		"animationType": [
			"border-image-outset",
			"border-image-repeat",
			"border-image-slice",
			"border-image-source",
			"border-image-width"
		],
		"percentages": ["border-image-slice", "border-image-width"],
		"groups": ["CSS Backgrounds and Borders"],
		"initial": [
			"border-image-source",
			"border-image-slice",
			"border-image-width",
			"border-image-outset",
			"border-image-repeat"
		],
		"appliesto": "allElementsExceptTableElementsWhenCollapse",
		"computed": [
			"border-image-outset",
			"border-image-repeat",
			"border-image-slice",
			"border-image-source",
			"border-image-width"
		],
		"order": "uniqueOrder",
		"alsoAppliesTo": ["::first-letter"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-image"
	},
	"border-image-outset": {
		"syntax": "[ <length> | <number> ]{1,4}",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "no",
		"groups": ["CSS Backgrounds and Borders"],
		"initial": "0",
		"appliesto": "allElementsExceptTableElementsWhenCollapse",
		"computed": "asSpecifiedRelativeToAbsoluteLengths",
		"order": "uniqueOrder",
		"alsoAppliesTo": ["::first-letter"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-image-outset"
	},
	"border-image-repeat": {
		"syntax": "[ stretch | repeat | round | space ]{1,2}",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Backgrounds and Borders"],
		"initial": "stretch",
		"appliesto": "allElementsExceptTableElementsWhenCollapse",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"alsoAppliesTo": ["::first-letter"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-image-repeat"
	},
	"border-image-slice": {
		"syntax": "<number-percentage>{1,4} && fill?",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "referToSizeOfBorderImage",
		"groups": ["CSS Backgrounds and Borders"],
		"initial": "100%",
		"appliesto": "allElementsExceptTableElementsWhenCollapse",
		"computed": "oneToFourPercentagesOrAbsoluteLengthsPlusFill",
		"order": "percentagesOrLengthsFollowedByFill",
		"alsoAppliesTo": ["::first-letter"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-image-slice"
	},
	"border-image-source": {
		"syntax": "none | <image>",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Backgrounds and Borders"],
		"initial": "none",
		"appliesto": "allElementsExceptTableElementsWhenCollapse",
		"computed": "noneOrImageWithAbsoluteURI",
		"order": "uniqueOrder",
		"alsoAppliesTo": ["::first-letter"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-image-source"
	},
	"border-image-width": {
		"syntax": "[ <length-percentage> | <number> | auto ]{1,4}",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "referToWidthOrHeightOfBorderImageArea",
		"groups": ["CSS Backgrounds and Borders"],
		"initial": "1",
		"appliesto": "allElementsExceptTableElementsWhenCollapse",
		"computed": "asSpecifiedRelativeToAbsoluteLengths",
		"order": "uniqueOrder",
		"alsoAppliesTo": ["::first-letter"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-image-width"
	},
	"border-inline": {
		"syntax": "<'border-top-width'> || <'border-top-style'> || <color>",
		"media": "visual",
		"inherited": false,
		"animationType": [
			"border-inline-color",
			"border-inline-style",
			"border-inline-width"
		],
		"percentages": "no",
		"groups": ["CSS Logical Properties"],
		"initial": [
			"border-inline-width",
			"border-inline-style",
			"border-inline-color"
		],
		"appliesto": "allElements",
		"computed": [
			"border-inline-width",
			"border-inline-style",
			"border-inline-color"
		],
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-inline"
	},
	"border-inline-end": {
		"syntax": "<'border-top-width'> || <'border-top-style'> || <color>",
		"media": "visual",
		"inherited": false,
		"animationType": [
			"border-inline-end-color",
			"border-inline-end-style",
			"border-inline-end-width"
		],
		"percentages": "no",
		"groups": ["CSS Logical Properties"],
		"initial": [
			"border-width",
			"border-style",
			"color"
		],
		"appliesto": "allElements",
		"computed": [
			"border-width",
			"border-style",
			"border-inline-end-color"
		],
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-inline-end"
	},
	"border-inline-color": {
		"syntax": "<'border-top-color'>{1,2}",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "no",
		"groups": ["CSS Logical Properties"],
		"initial": "currentcolor",
		"appliesto": "allElements",
		"computed": "computedColor",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-inline-color"
	},
	"border-inline-style": {
		"syntax": "<'border-top-style'>",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Logical Properties"],
		"initial": "none",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-inline-style"
	},
	"border-inline-width": {
		"syntax": "<'border-top-width'>",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "logicalWidthOfContainingBlock",
		"groups": ["CSS Logical Properties"],
		"initial": "medium",
		"appliesto": "allElements",
		"computed": "absoluteLengthZeroIfBorderStyleNoneOrHidden",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-inline-width"
	},
	"border-inline-end-color": {
		"syntax": "<'border-top-color'>",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "no",
		"groups": ["CSS Logical Properties"],
		"initial": "currentcolor",
		"appliesto": "allElements",
		"computed": "computedColor",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-inline-end-color"
	},
	"border-inline-end-style": {
		"syntax": "<'border-top-style'>",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Logical Properties"],
		"initial": "none",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-inline-end-style"
	},
	"border-inline-end-width": {
		"syntax": "<'border-top-width'>",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "logicalWidthOfContainingBlock",
		"groups": ["CSS Logical Properties"],
		"initial": "medium",
		"appliesto": "allElements",
		"computed": "absoluteLengthZeroIfBorderStyleNoneOrHidden",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-inline-end-width"
	},
	"border-inline-start": {
		"syntax": "<'border-top-width'> || <'border-top-style'> || <color>",
		"media": "visual",
		"inherited": false,
		"animationType": [
			"border-inline-start-color",
			"border-inline-start-style",
			"border-inline-start-width"
		],
		"percentages": "no",
		"groups": ["CSS Logical Properties"],
		"initial": [
			"border-width",
			"border-style",
			"color"
		],
		"appliesto": "allElements",
		"computed": [
			"border-width",
			"border-style",
			"border-inline-start-color"
		],
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-inline-start"
	},
	"border-inline-start-color": {
		"syntax": "<'border-top-color'>",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "no",
		"groups": ["CSS Logical Properties"],
		"initial": "currentcolor",
		"appliesto": "allElements",
		"computed": "computedColor",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-inline-start-color"
	},
	"border-inline-start-style": {
		"syntax": "<'border-top-style'>",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Logical Properties"],
		"initial": "none",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-inline-start-style"
	},
	"border-inline-start-width": {
		"syntax": "<'border-top-width'>",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "logicalWidthOfContainingBlock",
		"groups": ["CSS Logical Properties"],
		"initial": "medium",
		"appliesto": "allElements",
		"computed": "absoluteLengthZeroIfBorderStyleNoneOrHidden",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-inline-start-width"
	},
	"border-left": {
		"syntax": "<line-width> || <line-style> || <color>",
		"media": "visual",
		"inherited": false,
		"animationType": [
			"border-left-color",
			"border-left-style",
			"border-left-width"
		],
		"percentages": "no",
		"groups": ["CSS Backgrounds and Borders"],
		"initial": [
			"border-left-width",
			"border-left-style",
			"border-left-color"
		],
		"appliesto": "allElements",
		"computed": [
			"border-left-width",
			"border-left-style",
			"border-left-color"
		],
		"order": "orderOfAppearance",
		"alsoAppliesTo": ["::first-letter"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-left"
	},
	"border-left-color": {
		"syntax": "<color>",
		"media": "visual",
		"inherited": false,
		"animationType": "color",
		"percentages": "no",
		"groups": ["CSS Backgrounds and Borders"],
		"initial": "currentcolor",
		"appliesto": "allElements",
		"computed": "computedColor",
		"order": "uniqueOrder",
		"alsoAppliesTo": ["::first-letter"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-left-color"
	},
	"border-left-style": {
		"syntax": "<line-style>",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Backgrounds and Borders"],
		"initial": "none",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"alsoAppliesTo": ["::first-letter"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-left-style"
	},
	"border-left-width": {
		"syntax": "<line-width>",
		"media": "visual",
		"inherited": false,
		"animationType": "length",
		"percentages": "no",
		"groups": ["CSS Backgrounds and Borders"],
		"initial": "medium",
		"appliesto": "allElements",
		"computed": "absoluteLengthOr0IfBorderLeftStyleNoneOrHidden",
		"order": "uniqueOrder",
		"alsoAppliesTo": ["::first-letter"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-left-width"
	},
	"border-radius": {
		"syntax": "<length-percentage>{1,4} [ / <length-percentage>{1,4} ]?",
		"media": "visual",
		"inherited": false,
		"animationType": [
			"border-top-left-radius",
			"border-top-right-radius",
			"border-bottom-right-radius",
			"border-bottom-left-radius"
		],
		"percentages": "referToDimensionOfBorderBox",
		"groups": ["CSS Backgrounds and Borders"],
		"initial": [
			"border-top-left-radius",
			"border-top-right-radius",
			"border-bottom-right-radius",
			"border-bottom-left-radius"
		],
		"appliesto": "allElementsUAsNotRequiredWhenCollapse",
		"computed": [
			"border-bottom-left-radius",
			"border-bottom-right-radius",
			"border-top-left-radius",
			"border-top-right-radius"
		],
		"order": "uniqueOrder",
		"alsoAppliesTo": ["::first-letter"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-radius"
	},
	"border-right": {
		"syntax": "<line-width> || <line-style> || <color>",
		"media": "visual",
		"inherited": false,
		"animationType": [
			"border-right-color",
			"border-right-style",
			"border-right-width"
		],
		"percentages": "no",
		"groups": ["CSS Backgrounds and Borders"],
		"initial": [
			"border-right-width",
			"border-right-style",
			"border-right-color"
		],
		"appliesto": "allElements",
		"computed": [
			"border-right-width",
			"border-right-style",
			"border-right-color"
		],
		"order": "orderOfAppearance",
		"alsoAppliesTo": ["::first-letter"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-right"
	},
	"border-right-color": {
		"syntax": "<color>",
		"media": "visual",
		"inherited": false,
		"animationType": "color",
		"percentages": "no",
		"groups": ["CSS Backgrounds and Borders"],
		"initial": "currentcolor",
		"appliesto": "allElements",
		"computed": "computedColor",
		"order": "uniqueOrder",
		"alsoAppliesTo": ["::first-letter"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-right-color"
	},
	"border-right-style": {
		"syntax": "<line-style>",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Backgrounds and Borders"],
		"initial": "none",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"alsoAppliesTo": ["::first-letter"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-right-style"
	},
	"border-right-width": {
		"syntax": "<line-width>",
		"media": "visual",
		"inherited": false,
		"animationType": "length",
		"percentages": "no",
		"groups": ["CSS Backgrounds and Borders"],
		"initial": "medium",
		"appliesto": "allElements",
		"computed": "absoluteLengthOr0IfBorderRightStyleNoneOrHidden",
		"order": "uniqueOrder",
		"alsoAppliesTo": ["::first-letter"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-right-width"
	},
	"border-spacing": {
		"syntax": "<length> <length>?",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Table"],
		"initial": "0",
		"appliesto": "tableElements",
		"computed": "twoAbsoluteLengths",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-spacing"
	},
	"border-start-end-radius": {
		"syntax": "<length-percentage>{1,2}",
		"media": "visual",
		"inherited": false,
		"animationType": "lpc",
		"percentages": "referToDimensionOfBorderBox",
		"groups": ["CSS Logical Properties"],
		"initial": "0",
		"appliesto": "allElementsUAsNotRequiredWhenCollapse",
		"computed": "twoAbsoluteLengthOrPercentages",
		"order": "uniqueOrder",
		"alsoAppliesTo": ["::first-letter"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-start-end-radius"
	},
	"border-start-start-radius": {
		"syntax": "<length-percentage>{1,2}",
		"media": "visual",
		"inherited": false,
		"animationType": "lpc",
		"percentages": "referToDimensionOfBorderBox",
		"groups": ["CSS Logical Properties"],
		"initial": "0",
		"appliesto": "allElementsUAsNotRequiredWhenCollapse",
		"computed": "twoAbsoluteLengthOrPercentages",
		"order": "uniqueOrder",
		"alsoAppliesTo": ["::first-letter"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-start-start-radius"
	},
	"border-style": {
		"syntax": "<line-style>{1,4}",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Backgrounds and Borders"],
		"initial": [
			"border-top-style",
			"border-right-style",
			"border-bottom-style",
			"border-left-style"
		],
		"appliesto": "allElements",
		"computed": [
			"border-bottom-style",
			"border-left-style",
			"border-right-style",
			"border-top-style"
		],
		"order": "uniqueOrder",
		"alsoAppliesTo": ["::first-letter"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-style"
	},
	"border-top": {
		"syntax": "<line-width> || <line-style> || <color>",
		"media": "visual",
		"inherited": false,
		"animationType": [
			"border-top-color",
			"border-top-style",
			"border-top-width"
		],
		"percentages": "no",
		"groups": ["CSS Backgrounds and Borders"],
		"initial": [
			"border-top-width",
			"border-top-style",
			"border-top-color"
		],
		"appliesto": "allElements",
		"computed": [
			"border-top-width",
			"border-top-style",
			"border-top-color"
		],
		"order": "orderOfAppearance",
		"alsoAppliesTo": ["::first-letter"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-top"
	},
	"border-top-color": {
		"syntax": "<color>",
		"media": "visual",
		"inherited": false,
		"animationType": "color",
		"percentages": "no",
		"groups": ["CSS Backgrounds and Borders"],
		"initial": "currentcolor",
		"appliesto": "allElements",
		"computed": "computedColor",
		"order": "uniqueOrder",
		"alsoAppliesTo": ["::first-letter"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-top-color"
	},
	"border-top-left-radius": {
		"syntax": "<length-percentage>{1,2}",
		"media": "visual",
		"inherited": false,
		"animationType": "lpc",
		"percentages": "referToDimensionOfBorderBox",
		"groups": ["CSS Backgrounds and Borders"],
		"initial": "0",
		"appliesto": "allElementsUAsNotRequiredWhenCollapse",
		"computed": "twoAbsoluteLengthOrPercentages",
		"order": "uniqueOrder",
		"alsoAppliesTo": ["::first-letter"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-top-left-radius"
	},
	"border-top-right-radius": {
		"syntax": "<length-percentage>{1,2}",
		"media": "visual",
		"inherited": false,
		"animationType": "lpc",
		"percentages": "referToDimensionOfBorderBox",
		"groups": ["CSS Backgrounds and Borders"],
		"initial": "0",
		"appliesto": "allElementsUAsNotRequiredWhenCollapse",
		"computed": "twoAbsoluteLengthOrPercentages",
		"order": "uniqueOrder",
		"alsoAppliesTo": ["::first-letter"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-top-right-radius"
	},
	"border-top-style": {
		"syntax": "<line-style>",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Backgrounds and Borders"],
		"initial": "none",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"alsoAppliesTo": ["::first-letter"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-top-style"
	},
	"border-top-width": {
		"syntax": "<line-width>",
		"media": "visual",
		"inherited": false,
		"animationType": "length",
		"percentages": "no",
		"groups": ["CSS Backgrounds and Borders"],
		"initial": "medium",
		"appliesto": "allElements",
		"computed": "absoluteLengthOr0IfBorderTopStyleNoneOrHidden",
		"order": "uniqueOrder",
		"alsoAppliesTo": ["::first-letter"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-top-width"
	},
	"border-width": {
		"syntax": "<line-width>{1,4}",
		"media": "visual",
		"inherited": false,
		"animationType": [
			"border-bottom-width",
			"border-left-width",
			"border-right-width",
			"border-top-width"
		],
		"percentages": "no",
		"groups": ["CSS Backgrounds and Borders"],
		"initial": [
			"border-top-width",
			"border-right-width",
			"border-bottom-width",
			"border-left-width"
		],
		"appliesto": "allElements",
		"computed": [
			"border-bottom-width",
			"border-left-width",
			"border-right-width",
			"border-top-width"
		],
		"order": "uniqueOrder",
		"alsoAppliesTo": ["::first-letter"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/border-width"
	},
	"bottom": {
		"syntax": "<length> | <percentage> | auto",
		"media": "visual",
		"inherited": false,
		"animationType": "lpc",
		"percentages": "referToContainingBlockHeight",
		"groups": ["CSS Positioning"],
		"initial": "auto",
		"appliesto": "positionedElements",
		"computed": "lengthAbsolutePercentageAsSpecifiedOtherwiseAuto",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/bottom"
	},
	"box-align": {
		"syntax": "start | center | end | baseline | stretch",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Mozilla Extensions", "WebKit Extensions"],
		"initial": "stretch",
		"appliesto": "elementsWithDisplayBoxOrInlineBox",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/box-align"
	},
	"box-decoration-break": {
		"syntax": "slice | clone",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Fragmentation"],
		"initial": "slice",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/box-decoration-break"
	},
	"box-direction": {
		"syntax": "normal | reverse | inherit",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Mozilla Extensions", "WebKit Extensions"],
		"initial": "normal",
		"appliesto": "elementsWithDisplayBoxOrInlineBox",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/box-direction"
	},
	"box-flex": {
		"syntax": "<number>",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Mozilla Extensions", "WebKit Extensions"],
		"initial": "0",
		"appliesto": "directChildrenOfElementsWithDisplayMozBoxMozInlineBox",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/box-flex"
	},
	"box-flex-group": {
		"syntax": "<integer>",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Mozilla Extensions", "WebKit Extensions"],
		"initial": "1",
		"appliesto": "inFlowChildrenOfBoxElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/box-flex-group"
	},
	"box-lines": {
		"syntax": "single | multiple",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Mozilla Extensions", "WebKit Extensions"],
		"initial": "single",
		"appliesto": "boxElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/box-lines"
	},
	"box-ordinal-group": {
		"syntax": "<integer>",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Mozilla Extensions", "WebKit Extensions"],
		"initial": "1",
		"appliesto": "childrenOfBoxElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/box-ordinal-group"
	},
	"box-orient": {
		"syntax": "horizontal | vertical | inline-axis | block-axis | inherit",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Mozilla Extensions", "WebKit Extensions"],
		"initial": "inlineAxisHorizontalInXUL",
		"appliesto": "elementsWithDisplayBoxOrInlineBox",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/box-orient"
	},
	"box-pack": {
		"syntax": "start | center | end | justify",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Mozilla Extensions", "WebKit Extensions"],
		"initial": "start",
		"appliesto": "elementsWithDisplayMozBoxMozInlineBox",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/box-pack"
	},
	"box-shadow": {
		"syntax": "none | <shadow>#",
		"media": "visual",
		"inherited": false,
		"animationType": "shadowList",
		"percentages": "no",
		"groups": ["CSS Backgrounds and Borders"],
		"initial": "none",
		"appliesto": "allElements",
		"computed": "absoluteLengthsSpecifiedColorAsSpecified",
		"order": "uniqueOrder",
		"alsoAppliesTo": ["::first-letter"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/box-shadow"
	},
	"box-sizing": {
		"syntax": "content-box | border-box",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Box Model"],
		"initial": "content-box",
		"appliesto": "allElementsAcceptingWidthOrHeight",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/box-sizing"
	},
	"break-after": {
		"syntax": "auto | avoid | always | all | avoid-page | page | left | right | recto | verso | avoid-column | column | avoid-region | region",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Fragmentation"],
		"initial": "auto",
		"appliesto": "blockLevelElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/break-after"
	},
	"break-before": {
		"syntax": "auto | avoid | always | all | avoid-page | page | left | right | recto | verso | avoid-column | column | avoid-region | region",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Fragmentation"],
		"initial": "auto",
		"appliesto": "blockLevelElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/break-before"
	},
	"break-inside": {
		"syntax": "auto | avoid | avoid-page | avoid-column | avoid-region",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Fragmentation"],
		"initial": "auto",
		"appliesto": "blockLevelElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/break-inside"
	},
	"caption-side": {
		"syntax": "top | bottom | block-start | block-end | inline-start | inline-end",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Table"],
		"initial": "top",
		"appliesto": "tableCaptionElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/caption-side"
	},
	"caret": {
		"syntax": "<'caret-color'> || <'caret-shape'>",
		"media": "interactive",
		"inherited": true,
		"animationType": ["caret-color", "caret-shape"],
		"percentages": "no",
		"groups": ["CSS Basic User Interface"],
		"initial": ["caret-color", "caret-shape"],
		"appliesto": "elementsThatAcceptInput",
		"computed": ["caret-color", "caret-shape"],
		"order": "perGrammar",
		"status": "standard"
	},
	"caret-color": {
		"syntax": "auto | <color>",
		"media": "interactive",
		"inherited": true,
		"animationType": "color",
		"percentages": "no",
		"groups": ["CSS Basic User Interface"],
		"initial": "auto",
		"appliesto": "allElements",
		"computed": "asAutoOrColor",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/caret-color"
	},
	"caret-shape": {
		"syntax": "auto | bar | block | underscore",
		"media": "interactive",
		"inherited": true,
		"animationType": "byComputedValueType",
		"percentages": "no",
		"groups": ["CSS Basic User Interface"],
		"initial": "auto",
		"appliesto": "elementsThatAcceptInput",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard"
	},
	"clear": {
		"syntax": "none | left | right | both | inline-start | inline-end",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Positioning"],
		"initial": "none",
		"appliesto": "blockLevelElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/clear"
	},
	"clip": {
		"syntax": "<shape> | auto",
		"media": "visual",
		"inherited": false,
		"animationType": "rectangle",
		"percentages": "no",
		"groups": ["CSS Masking"],
		"initial": "auto",
		"appliesto": "absolutelyPositionedElements",
		"computed": "autoOrRectangle",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/clip"
	},
	"clip-path": {
		"syntax": "<clip-source> | [ <basic-shape> || <geometry-box> ] | none",
		"media": "visual",
		"inherited": false,
		"animationType": "basicShapeOtherwiseNo",
		"percentages": "referToReferenceBoxWhenSpecifiedOtherwiseBorderBox",
		"groups": ["CSS Masking"],
		"initial": "none",
		"appliesto": "allElementsSVGContainerElements",
		"computed": "asSpecifiedURLsAbsolute",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/clip-path"
	},
	"clip-rule": {
		"syntax": "nonzero | evenodd",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Scalable Vector Graphics"],
		"initial": "nonzero",
		"appliesto": "limitedSVGElementsGraphics",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/clip-rule"
	},
	"color": {
		"syntax": "<color>",
		"media": "visual",
		"inherited": true,
		"animationType": "byComputedValueType",
		"percentages": "no",
		"groups": ["CSS Color"],
		"initial": "canvastext",
		"appliesto": "allElementsAndText",
		"computed": "computedColor",
		"order": "perGrammar",
		"alsoAppliesTo": [
			"::first-letter",
			"::first-line",
			"::placeholder"
		],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/color"
	},
	"color-interpolation-filters": {
		"syntax": "auto | sRGB | linearRGB",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Scalable Vector Graphics"],
		"initial": "linearRGB",
		"appliesto": "limitedSVGElementsFilterPrimitives",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/clip-rule"
	},
	"color-scheme": {
		"syntax": "normal | [ light | dark | <custom-ident> ]+ && only?",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Color"],
		"initial": "normal",
		"appliesto": "allElementsAndText",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/color-scheme"
	},
	"column-count": {
		"syntax": "<integer> | auto",
		"media": "visual",
		"inherited": false,
		"animationType": "integer",
		"percentages": "no",
		"groups": ["CSS Columns"],
		"initial": "auto",
		"appliesto": "blockContainersExceptTableWrappers",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/column-count"
	},
	"column-fill": {
		"syntax": "auto | balance",
		"media": "visualInContinuousMediaNoEffectInOverflowColumns",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Columns"],
		"initial": "balance",
		"appliesto": "multicolElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/column-fill"
	},
	"column-gap": {
		"syntax": "normal | <length-percentage>",
		"media": "visual",
		"inherited": false,
		"animationType": "lpc",
		"percentages": "referToDimensionOfContentArea",
		"groups": ["CSS Box Alignment"],
		"initial": "normal",
		"appliesto": "multiColumnElementsFlexContainersGridContainers",
		"computed": "asSpecifiedWithLengthsAbsoluteAndNormalComputingToZeroExceptMultiColumn",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/column-gap"
	},
	"column-rule": {
		"syntax": "<'column-rule-width'> || <'column-rule-style'> || <'column-rule-color'>",
		"media": "visual",
		"inherited": false,
		"animationType": [
			"column-rule-color",
			"column-rule-style",
			"column-rule-width"
		],
		"percentages": "no",
		"groups": ["CSS Columns"],
		"initial": [
			"column-rule-width",
			"column-rule-style",
			"column-rule-color"
		],
		"appliesto": "multicolElements",
		"computed": [
			"column-rule-color",
			"column-rule-style",
			"column-rule-width"
		],
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/column-rule"
	},
	"column-rule-color": {
		"syntax": "<color>",
		"media": "visual",
		"inherited": false,
		"animationType": "color",
		"percentages": "no",
		"groups": ["CSS Columns"],
		"initial": "currentcolor",
		"appliesto": "multicolElements",
		"computed": "computedColor",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/column-rule-color"
	},
	"column-rule-style": {
		"syntax": "<'border-style'>",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Columns"],
		"initial": "none",
		"appliesto": "multicolElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/column-rule-style"
	},
	"column-rule-width": {
		"syntax": "<'border-width'>",
		"media": "visual",
		"inherited": false,
		"animationType": "length",
		"percentages": "no",
		"groups": ["CSS Columns"],
		"initial": "medium",
		"appliesto": "multicolElements",
		"computed": "absoluteLength0IfColumnRuleStyleNoneOrHidden",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/column-rule-width"
	},
	"column-span": {
		"syntax": "none | all",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Columns"],
		"initial": "none",
		"appliesto": "inFlowBlockLevelElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/column-span"
	},
	"column-width": {
		"syntax": "<length> | auto",
		"media": "visual",
		"inherited": false,
		"animationType": "length",
		"percentages": "no",
		"groups": ["CSS Columns"],
		"initial": "auto",
		"appliesto": "blockContainersExceptTableWrappers",
		"computed": "absoluteLengthZeroOrLarger",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/column-width"
	},
	"columns": {
		"syntax": "<'column-width'> || <'column-count'>",
		"media": "visual",
		"inherited": false,
		"animationType": ["column-width", "column-count"],
		"percentages": "no",
		"groups": ["CSS Columns"],
		"initial": ["column-width", "column-count"],
		"appliesto": "blockContainersExceptTableWrappers",
		"computed": ["column-width", "column-count"],
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/columns"
	},
	"contain": {
		"syntax": "none | strict | content | [ [ size || inline-size ] || layout || style || paint ]",
		"media": "all",
		"inherited": false,
		"animationType": "notAnimatable",
		"percentages": "no",
		"groups": ["CSS Containment"],
		"initial": "none",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/contain"
	},
	"contain-intrinsic-size": {
		"syntax": "[ auto? [ none | <length> ] ]{1,2}",
		"media": "visual",
		"inherited": false,
		"animationType": ["contain-intrinsic-width", "contain-intrinsic-height"],
		"percentages": ["contain-intrinsic-width", "contain-intrinsic-height"],
		"groups": ["CSS Containment"],
		"initial": ["contain-intrinsic-width", "contain-intrinsic-height"],
		"appliesto": "elementsForWhichSizeContainmentCanApply",
		"computed": ["contain-intrinsic-width", "contain-intrinsic-height"],
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/contain-intrinsic-size"
	},
	"contain-intrinsic-block-size": {
		"syntax": "auto? [ none | <length> ]",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "no",
		"groups": ["CSS Containment"],
		"initial": "none",
		"appliesto": "elementsForWhichSizeContainmentCanApply",
		"computed": "asSpecifiedWithLengthValuesComputed",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/contain-intrinsic-block-size"
	},
	"contain-intrinsic-height": {
		"syntax": "auto? [ none | <length> ]",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "no",
		"groups": ["CSS Containment"],
		"initial": "none",
		"appliesto": "elementsForWhichSizeContainmentCanApply",
		"computed": "asSpecifiedWithLengthValuesComputed",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/contain-intrinsic-height"
	},
	"contain-intrinsic-inline-size": {
		"syntax": "auto? [ none | <length> ]",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "no",
		"groups": ["CSS Containment"],
		"initial": "none",
		"appliesto": "elementsForWhichSizeContainmentCanApply",
		"computed": "asSpecifiedWithLengthValuesComputed",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/contain-intrinsic-inline-size"
	},
	"contain-intrinsic-width": {
		"syntax": "auto? [ none | <length> ]",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "no",
		"groups": ["CSS Containment"],
		"initial": "none",
		"appliesto": "elementsForWhichSizeContainmentCanApply",
		"computed": "asSpecifiedWithLengthValuesComputed",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/contain-intrinsic-width"
	},
	"container": {
		"syntax": "<'container-name'> [ / <'container-type'> ]?",
		"media": "visual",
		"inherited": false,
		"animationType": ["container-name", "container-type"],
		"percentages": ["container-name", "container-type"],
		"groups": ["CSS Containment"],
		"initial": ["container-name", "container-type"],
		"appliesto": "allElements",
		"computed": ["container-name", "container-type"],
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/container"
	},
	"container-name": {
		"syntax": "none | <custom-ident>+",
		"media": "visual",
		"inherited": false,
		"animationType": "notAnimatable",
		"percentages": "no",
		"groups": ["CSS Containment"],
		"initial": "none",
		"appliesto": "allElements",
		"computed": "noneOrOrderedListOfIdentifiers",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/container-name"
	},
	"container-type": {
		"syntax": "normal | size | inline-size",
		"media": "visual",
		"inherited": false,
		"animationType": "color",
		"percentages": "no",
		"groups": ["CSS Containment"],
		"initial": "normal",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/container-type"
	},
	"content": {
		"syntax": "normal | none | [ <content-replacement> | <content-list> ] [/ [ <string> | <counter> ]+ ]?",
		"media": "all",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Generated Content"],
		"initial": "normal",
		"appliesto": "allElementsTreeAbidingPseudoElementsPageMarginBoxes",
		"computed": "normalOnElementsForPseudosNoneAbsoluteURIStringOrAsSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/content"
	},
	"content-visibility": {
		"syntax": "visible | auto | hidden",
		"media": "all",
		"inherited": false,
		"animationType": "discreteButVisibleForDurationWhenAnimatedHidden",
		"percentages": "no",
		"groups": ["CSS Containment"],
		"initial": "visible",
		"appliesto": "elementsForWhichSizeContainmentCanApply",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/content-visibility"
	},
	"counter-increment": {
		"syntax": "[ <counter-name> <integer>? ]+ | none",
		"media": "all",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "no",
		"groups": ["CSS Counter Styles"],
		"initial": "none",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/counter-increment"
	},
	"counter-reset": {
		"syntax": "[ <counter-name> <integer>? | <reversed-counter-name> <integer>? ]+ | none",
		"media": "all",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "no",
		"groups": ["CSS Counter Styles"],
		"initial": "none",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/counter-reset"
	},
	"counter-set": {
		"syntax": "[ <counter-name> <integer>? ]+ | none",
		"media": "all",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "no",
		"groups": ["CSS Counter Styles"],
		"initial": "none",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/counter-set"
	},
	"cursor": {
		"syntax": "[ [ <url> [ <x> <y> ]? , ]* [ auto | default | none | context-menu | help | pointer | progress | wait | cell | crosshair | text | vertical-text | alias | copy | move | no-drop | not-allowed | e-resize | n-resize | ne-resize | nw-resize | s-resize | se-resize | sw-resize | w-resize | ew-resize | ns-resize | nesw-resize | nwse-resize | col-resize | row-resize | all-scroll | zoom-in | zoom-out | grab | grabbing ] ]",
		"media": ["visual", "interactive"],
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Basic User Interface"],
		"initial": "auto",
		"appliesto": "allElements",
		"computed": "asSpecifiedURLsAbsolute",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/cursor"
	},
	"d": {
		"syntax": "none | path(<string>)",
		"media": "visual",
		"inherited": false,
		"animationType": "basicShapeOtherwiseNo",
		"percentages": "no",
		"groups": ["Scalable Vector Graphics"],
		"initial": "none",
		"appliesto": "limitedSVGElementsPath",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/d"
	},
	"cx": {
		"syntax": "<length> | <percentage>",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "referToSVGViewportWidth",
		"groups": ["Scalable Vector Graphics"],
		"initial": "0",
		"appliesto": "limitedSVGElementsEllipse",
		"computed": "percentageAsSpecifiedOrAbsoluteLength",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/cx"
	},
	"cy": {
		"syntax": "<length> | <percentage>",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "referToSVGViewportHeight",
		"groups": ["Scalable Vector Graphics"],
		"initial": "0",
		"appliesto": "limitedSVGElementsEllipse",
		"computed": "percentageAsSpecifiedOrAbsoluteLength",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/cy"
	},
	"direction": {
		"syntax": "ltr | rtl",
		"media": "visual",
		"inherited": true,
		"animationType": "notAnimatable",
		"percentages": "no",
		"groups": ["CSS Writing Modes"],
		"initial": "ltr",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/direction"
	},
	"display": {
		"syntax": "[ <display-outside> || <display-inside> ] | <display-listitem> | <display-internal> | <display-box> | <display-legacy>",
		"media": "all",
		"inherited": false,
		"animationType": "discreteButVisibleForDurationWhenAnimatedNone",
		"percentages": "no",
		"groups": ["CSS Display"],
		"initial": "inline",
		"appliesto": "allElements",
		"computed": "asSpecifiedExceptPositionedFloatingAndRootElementsKeywordMaybeDifferent",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/display"
	},
	"dominant-baseline": {
		"syntax": "auto | text-bottom | alphabetic | ideographic | middle | central | mathematical | hanging | text-top",
		"media": "all",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Scalable Vector Graphics"],
		"initial": "auto",
		"appliesto": "blockContainersFlexContainersGridContainersInlineBoxesTableRowsSVGTextContentElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/dominant-baseline"
	},
	"empty-cells": {
		"syntax": "show | hide",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Table"],
		"initial": "show",
		"appliesto": "tableCellElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/empty-cells"
	},
	"field-sizing": {
		"syntax": "content | fixed",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Basic User Interface"],
		"initial": "fixed",
		"appliesto": "elementsWithDefaultPreferredSize",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/field-sizing"
	},
	"fill": {
		"syntax": "none | <color> | <url> [none | <color>]? | context-fill | context-stroke",
		"media": "visual",
		"inherited": true,
		"animationType": "byComputedValueType",
		"percentages": "no",
		"groups": ["Scalable Vector Graphics"],
		"initial": "black",
		"appliesto": "limitedSVGElementsShapeText",
		"computed": "asColorOrAbsoluteURL",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/fill"
	},
	"fill-opacity": {
		"syntax": "<alpha-value>",
		"media": "visual",
		"inherited": true,
		"animationType": "byComputedValueType",
		"percentages": "mapToRange0To1",
		"groups": ["Scalable Vector Graphics"],
		"initial": "1",
		"appliesto": "limitedSVGElementsShapeText",
		"computed": "specifiedValueNumberClipped0To1",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/fill-opacity"
	},
	"fill-rule": {
		"syntax": "nonzero | evenodd",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Scalable Vector Graphics"],
		"initial": "nonzero",
		"appliesto": "limitedSVGElementsShapeText",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/fill-rule"
	},
	"filter": {
		"syntax": "none | <filter-function-list>",
		"media": "visual",
		"inherited": false,
		"animationType": "filterList",
		"percentages": "no",
		"groups": ["Filter Effects"],
		"initial": "none",
		"appliesto": "allElementsSVGContainerElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/filter"
	},
	"flex": {
		"syntax": "none | [ <'flex-grow'> <'flex-shrink'>? || <'flex-basis'> ]",
		"media": "visual",
		"inherited": false,
		"animationType": [
			"flex-grow",
			"flex-shrink",
			"flex-basis"
		],
		"percentages": "no",
		"groups": ["CSS Flexible Box Layout"],
		"initial": [
			"flex-grow",
			"flex-shrink",
			"flex-basis"
		],
		"appliesto": "flexItemsAndInFlowPseudos",
		"computed": [
			"flex-grow",
			"flex-shrink",
			"flex-basis"
		],
		"order": "orderOfAppearance",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/flex"
	},
	"flex-basis": {
		"syntax": "content | <'width'>",
		"media": "visual",
		"inherited": false,
		"animationType": "lpc",
		"percentages": "referToFlexContainersInnerMainSize",
		"groups": ["CSS Flexible Box Layout"],
		"initial": "auto",
		"appliesto": "flexItemsAndInFlowPseudos",
		"computed": "asSpecifiedRelativeToAbsoluteLengths",
		"order": "lengthOrPercentageBeforeKeywordIfBothPresent",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/flex-basis"
	},
	"flex-direction": {
		"syntax": "row | row-reverse | column | column-reverse",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Flexible Box Layout"],
		"initial": "row",
		"appliesto": "flexContainers",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/flex-direction"
	},
	"flex-flow": {
		"syntax": "<'flex-direction'> || <'flex-wrap'>",
		"media": "visual",
		"inherited": false,
		"animationType": ["flex-direction", "flex-wrap"],
		"percentages": "no",
		"groups": ["CSS Flexible Box Layout"],
		"initial": ["flex-direction", "flex-wrap"],
		"appliesto": "flexContainers",
		"computed": ["flex-direction", "flex-wrap"],
		"order": "orderOfAppearance",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/flex-flow"
	},
	"flex-grow": {
		"syntax": "<number>",
		"media": "visual",
		"inherited": false,
		"animationType": "number",
		"percentages": "no",
		"groups": ["CSS Flexible Box Layout"],
		"initial": "0",
		"appliesto": "flexItemsAndInFlowPseudos",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/flex-grow"
	},
	"flex-shrink": {
		"syntax": "<number>",
		"media": "visual",
		"inherited": false,
		"animationType": "number",
		"percentages": "no",
		"groups": ["CSS Flexible Box Layout"],
		"initial": "1",
		"appliesto": "flexItemsAndInFlowPseudos",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/flex-shrink"
	},
	"flex-wrap": {
		"syntax": "nowrap | wrap | wrap-reverse",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Flexible Box Layout"],
		"initial": "nowrap",
		"appliesto": "flexContainers",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/flex-wrap"
	},
	"float": {
		"syntax": "left | right | none | inline-start | inline-end",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Positioning"],
		"initial": "none",
		"appliesto": "allElementsNoEffectIfDisplayNone",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/float"
	},
	"font": {
		"syntax": "[ [ <'font-style'> || <font-variant-css21> || <'font-weight'> || <'font-stretch'> ]? <'font-size'> [ / <'line-height'> ]? <'font-family'> ] | caption | icon | menu | message-box | small-caption | status-bar",
		"media": "visual",
		"inherited": true,
		"animationType": [
			"font-style",
			"font-variant",
			"font-weight",
			"font-stretch",
			"font-size",
			"line-height",
			"font-family"
		],
		"percentages": ["font-size", "line-height"],
		"groups": ["CSS Fonts"],
		"initial": [
			"font-style",
			"font-variant",
			"font-weight",
			"font-stretch",
			"font-size",
			"line-height",
			"font-family"
		],
		"appliesto": "allElementsAndText",
		"computed": [
			"font-style",
			"font-variant",
			"font-weight",
			"font-stretch",
			"font-size",
			"line-height",
			"font-family"
		],
		"order": "orderOfAppearance",
		"alsoAppliesTo": [
			"::first-letter",
			"::first-line",
			"::placeholder"
		],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/font"
	},
	"font-family": {
		"syntax": "[ <family-name> | <generic-family> ]#",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Fonts"],
		"initial": "dependsOnUserAgent",
		"appliesto": "allElementsAndText",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"alsoAppliesTo": [
			"::first-letter",
			"::first-line",
			"::placeholder"
		],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/font-family"
	},
	"font-feature-settings": {
		"syntax": "normal | <feature-tag-value>#",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Fonts"],
		"initial": "normal",
		"appliesto": "allElementsAndText",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"alsoAppliesTo": [
			"::first-letter",
			"::first-line",
			"::placeholder"
		],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/font-feature-settings"
	},
	"font-kerning": {
		"syntax": "auto | normal | none",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Fonts"],
		"initial": "auto",
		"appliesto": "allElementsAndText",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"alsoAppliesTo": [
			"::first-letter",
			"::first-line",
			"::placeholder"
		],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/font-kerning"
	},
	"font-language-override": {
		"syntax": "normal | <string>",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Fonts"],
		"initial": "normal",
		"appliesto": "allElementsAndText",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"alsoAppliesTo": [
			"::first-letter",
			"::first-line",
			"::placeholder"
		],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/font-language-override"
	},
	"font-optical-sizing": {
		"syntax": "auto | none",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Fonts"],
		"initial": "auto",
		"appliesto": "allElementsAndText",
		"computed": "asSpecified",
		"order": "perGrammar",
		"alsoAppliesTo": [
			"::first-letter",
			"::first-line",
			"::placeholder"
		],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/font-optical-sizing"
	},
	"font-palette": {
		"syntax": "normal | light | dark | <palette-identifier>",
		"media": "visual",
		"inherited": true,
		"animationType": "byComputedValueType",
		"percentages": "no",
		"groups": ["CSS Fonts"],
		"initial": "normal",
		"appliesto": "allElementsAndText",
		"computed": "asSpecified",
		"order": "perGrammar",
		"alsoAppliesTo": [
			"::first-letter",
			"::first-line",
			"::placeholder"
		],
		"status": "standard"
	},
	"font-variation-settings": {
		"syntax": "normal | [ <string> <number> ]#",
		"media": "visual",
		"inherited": true,
		"animationType": "transform",
		"percentages": "no",
		"groups": ["CSS Fonts"],
		"initial": "normal",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"alsoAppliesTo": [
			"::first-letter",
			"::first-line",
			"::placeholder"
		],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/font-variation-settings"
	},
	"font-size": {
		"syntax": "<absolute-size> | <relative-size> | <length-percentage>",
		"media": "visual",
		"inherited": true,
		"animationType": "length",
		"percentages": "referToParentElementsFontSize",
		"groups": ["CSS Fonts"],
		"initial": "medium",
		"appliesto": "allElementsAndText",
		"computed": "asSpecifiedRelativeToAbsoluteLengths",
		"order": "uniqueOrder",
		"alsoAppliesTo": [
			"::first-letter",
			"::first-line",
			"::placeholder"
		],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/font-size"
	},
	"font-size-adjust": {
		"syntax": "none | [ ex-height | cap-height | ch-width | ic-width | ic-height ]? [ from-font | <number> ]",
		"media": "visual",
		"inherited": true,
		"animationType": "number",
		"percentages": "no",
		"groups": ["CSS Fonts"],
		"initial": "none",
		"appliesto": "allElementsAndText",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"alsoAppliesTo": [
			"::first-letter",
			"::first-line",
			"::placeholder"
		],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/font-size-adjust"
	},
	"font-smooth": {
		"syntax": "auto | never | always | <absolute-size> | <length>",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Fonts"],
		"initial": "auto",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/font-smooth"
	},
	"font-stretch": {
		"syntax": "<font-stretch-absolute>",
		"media": "visual",
		"inherited": true,
		"animationType": "fontStretch",
		"percentages": "no",
		"groups": ["CSS Fonts"],
		"initial": "normal",
		"appliesto": "allElementsAndText",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"alsoAppliesTo": [
			"::first-letter",
			"::first-line",
			"::placeholder"
		],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/font-stretch"
	},
	"font-style": {
		"syntax": "normal | italic | oblique <angle>?",
		"media": "visual",
		"inherited": true,
		"animationType": "byComputedValueTypeNormalAnimatesAsObliqueZeroDeg",
		"percentages": "no",
		"groups": ["CSS Fonts"],
		"initial": "normal",
		"appliesto": "allElementsAndText",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"alsoAppliesTo": [
			"::first-letter",
			"::first-line",
			"::placeholder"
		],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/font-style"
	},
	"font-synthesis": {
		"syntax": "none | [ weight || style || small-caps || position]",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Fonts"],
		"initial": "weight style small-caps position ",
		"appliesto": "allElementsAndText",
		"computed": "asSpecified",
		"order": "orderOfAppearance",
		"alsoAppliesTo": [
			"::first-letter",
			"::first-line",
			"::placeholder"
		],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/font-synthesis"
	},
	"font-synthesis-position": {
		"syntax": "auto | none",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Fonts"],
		"initial": "none",
		"appliesto": "allElementsAndText",
		"computed": "asSpecified",
		"order": "orderOfAppearance",
		"alsoAppliesTo": [
			"::first-letter",
			"::first-line",
			"::placeholder"
		],
		"status": "experimental",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/font-synthesis-position"
	},
	"font-synthesis-small-caps": {
		"syntax": "auto | none",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Fonts"],
		"initial": "auto",
		"appliesto": "allElementsAndText",
		"computed": "asSpecified",
		"order": "orderOfAppearance",
		"alsoAppliesTo": [
			"::first-letter",
			"::first-line",
			"::placeholder"
		],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/font-synthesis-small-caps"
	},
	"font-synthesis-style": {
		"syntax": "auto | none",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Fonts"],
		"initial": "auto",
		"appliesto": "allElementsAndText",
		"computed": "asSpecified",
		"order": "orderOfAppearance",
		"alsoAppliesTo": [
			"::first-letter",
			"::first-line",
			"::placeholder"
		],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/font-synthesis-style"
	},
	"font-synthesis-weight": {
		"syntax": "auto | none",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Fonts"],
		"initial": "auto",
		"appliesto": "allElementsAndText",
		"computed": "asSpecified",
		"order": "orderOfAppearance",
		"alsoAppliesTo": [
			"::first-letter",
			"::first-line",
			"::placeholder"
		],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/font-synthesis-weight"
	},
	"font-variant": {
		"syntax": "normal | none | [ <common-lig-values> || <discretionary-lig-values> || <historical-lig-values> || <contextual-alt-values> || stylistic( <feature-value-name> ) || historical-forms || styleset( <feature-value-name># ) || character-variant( <feature-value-name># ) || swash( <feature-value-name> ) || ornaments( <feature-value-name> ) || annotation( <feature-value-name> ) || [ small-caps | all-small-caps | petite-caps | all-petite-caps | unicase | titling-caps ] || <numeric-figure-values> || <numeric-spacing-values> || <numeric-fraction-values> || ordinal || slashed-zero || <east-asian-variant-values> || <east-asian-width-values> || ruby ]",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Fonts"],
		"initial": "normal",
		"appliesto": "allElementsAndText",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"alsoAppliesTo": [
			"::first-letter",
			"::first-line",
			"::placeholder"
		],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/font-variant"
	},
	"font-variant-alternates": {
		"syntax": "normal | [ stylistic( <feature-value-name> ) || historical-forms || styleset( <feature-value-name># ) || character-variant( <feature-value-name># ) || swash( <feature-value-name> ) || ornaments( <feature-value-name> ) || annotation( <feature-value-name> ) ]",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Fonts"],
		"initial": "normal",
		"appliesto": "allElementsAndText",
		"computed": "asSpecified",
		"order": "orderOfAppearance",
		"alsoAppliesTo": [
			"::first-letter",
			"::first-line",
			"::placeholder"
		],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/font-variant-alternates"
	},
	"font-variant-caps": {
		"syntax": "normal | small-caps | all-small-caps | petite-caps | all-petite-caps | unicase | titling-caps",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Fonts"],
		"initial": "normal",
		"appliesto": "allElementsAndText",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"alsoAppliesTo": [
			"::first-letter",
			"::first-line",
			"::placeholder"
		],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/font-variant-caps"
	},
	"font-variant-east-asian": {
		"syntax": "normal | [ <east-asian-variant-values> || <east-asian-width-values> || ruby ]",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Fonts"],
		"initial": "normal",
		"appliesto": "allElementsAndText",
		"computed": "asSpecified",
		"order": "orderOfAppearance",
		"alsoAppliesTo": [
			"::first-letter",
			"::first-line",
			"::placeholder"
		],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/font-variant-east-asian"
	},
	"font-variant-emoji": {
		"syntax": "normal | text | emoji | unicode",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Fonts"],
		"initial": "normal",
		"appliesto": "allElementsAndText",
		"computed": "asSpecified",
		"order": "perGrammar",
		"alsoAppliesTo": [
			"::first-letter",
			"::first-line",
			"::placeholder"
		],
		"status": "standard"
	},
	"font-variant-ligatures": {
		"syntax": "normal | none | [ <common-lig-values> || <discretionary-lig-values> || <historical-lig-values> || <contextual-alt-values> ]",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Fonts"],
		"initial": "normal",
		"appliesto": "allElementsAndText",
		"computed": "asSpecified",
		"order": "orderOfAppearance",
		"alsoAppliesTo": [
			"::first-letter",
			"::first-line",
			"::placeholder"
		],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/font-variant-ligatures"
	},
	"font-variant-numeric": {
		"syntax": "normal | [ <numeric-figure-values> || <numeric-spacing-values> || <numeric-fraction-values> || ordinal || slashed-zero ]",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Fonts"],
		"initial": "normal",
		"appliesto": "allElementsAndText",
		"computed": "asSpecified",
		"order": "orderOfAppearance",
		"alsoAppliesTo": [
			"::first-letter",
			"::first-line",
			"::placeholder"
		],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/font-variant-numeric"
	},
	"font-variant-position": {
		"syntax": "normal | sub | super",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Fonts"],
		"initial": "normal",
		"appliesto": "allElementsAndText",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"alsoAppliesTo": [
			"::first-letter",
			"::first-line",
			"::placeholder"
		],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/font-variant-position"
	},
	"font-weight": {
		"syntax": "<font-weight-absolute> | bolder | lighter",
		"media": "visual",
		"inherited": true,
		"animationType": "fontWeight",
		"percentages": "no",
		"groups": ["CSS Fonts"],
		"initial": "normal",
		"appliesto": "allElementsAndText",
		"computed": "keywordOrNumericalValueBolderLighterTransformedToRealValue",
		"order": "uniqueOrder",
		"alsoAppliesTo": [
			"::first-letter",
			"::first-line",
			"::placeholder"
		],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/font-weight"
	},
	"forced-color-adjust": {
		"syntax": "auto | none | preserve-parent-color",
		"media": "visual",
		"inherited": true,
		"animationType": "notAnimatable",
		"percentages": "no",
		"groups": ["CSS Color"],
		"initial": "auto",
		"appliesto": "allElementsAndText",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "experimental",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/forced-color-adjust"
	},
	"gap": {
		"syntax": "<'row-gap'> <'column-gap'>?",
		"media": "visual",
		"inherited": false,
		"animationType": ["row-gap", "column-gap"],
		"percentages": "no",
		"groups": ["CSS Box Alignment"],
		"initial": ["row-gap", "column-gap"],
		"appliesto": "multiColumnElementsFlexContainersGridContainers",
		"computed": ["row-gap", "column-gap"],
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/gap"
	},
	"grid": {
		"syntax": "<'grid-template'> | <'grid-template-rows'> / [ auto-flow && dense? ] <'grid-auto-columns'>? | [ auto-flow && dense? ] <'grid-auto-rows'>? / <'grid-template-columns'>",
		"media": "visual",
		"inherited": false,
		"animationType": [
			"grid-template-rows",
			"grid-template-columns",
			"grid-template-areas",
			"grid-auto-rows",
			"grid-auto-columns",
			"grid-auto-flow",
			"grid-column-gap",
			"grid-row-gap",
			"column-gap",
			"row-gap"
		],
		"percentages": [
			"grid-template-rows",
			"grid-template-columns",
			"grid-auto-rows",
			"grid-auto-columns"
		],
		"groups": ["CSS Grid Layout"],
		"initial": [
			"grid-template-rows",
			"grid-template-columns",
			"grid-template-areas",
			"grid-auto-rows",
			"grid-auto-columns",
			"grid-auto-flow",
			"grid-column-gap",
			"grid-row-gap",
			"column-gap",
			"row-gap"
		],
		"appliesto": "gridContainers",
		"computed": [
			"grid-template-rows",
			"grid-template-columns",
			"grid-template-areas",
			"grid-auto-rows",
			"grid-auto-columns",
			"grid-auto-flow",
			"grid-column-gap",
			"grid-row-gap",
			"column-gap",
			"row-gap"
		],
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/grid"
	},
	"grid-area": {
		"syntax": "<grid-line> [ / <grid-line> ]{0,3}",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Grid Layout"],
		"initial": [
			"grid-row-start",
			"grid-column-start",
			"grid-row-end",
			"grid-column-end"
		],
		"appliesto": "gridItemsAndBoxesWithinGridContainer",
		"computed": [
			"grid-row-start",
			"grid-column-start",
			"grid-row-end",
			"grid-column-end"
		],
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/grid-area"
	},
	"grid-auto-columns": {
		"syntax": "<track-size>+",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "referToDimensionOfContentArea",
		"groups": ["CSS Grid Layout"],
		"initial": "auto",
		"appliesto": "gridContainers",
		"computed": "percentageAsSpecifiedOrAbsoluteLength",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/grid-auto-columns"
	},
	"grid-auto-flow": {
		"syntax": "[ row | column ] || dense",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Grid Layout"],
		"initial": "row",
		"appliesto": "gridContainers",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/grid-auto-flow"
	},
	"grid-auto-rows": {
		"syntax": "<track-size>+",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "referToDimensionOfContentArea",
		"groups": ["CSS Grid Layout"],
		"initial": "auto",
		"appliesto": "gridContainers",
		"computed": "percentageAsSpecifiedOrAbsoluteLength",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/grid-auto-rows"
	},
	"grid-column": {
		"syntax": "<grid-line> [ / <grid-line> ]?",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Grid Layout"],
		"initial": ["grid-column-start", "grid-column-end"],
		"appliesto": "gridItemsAndBoxesWithinGridContainer",
		"computed": ["grid-column-start", "grid-column-end"],
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/grid-column"
	},
	"grid-column-end": {
		"syntax": "<grid-line>",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Grid Layout"],
		"initial": "auto",
		"appliesto": "gridItemsAndBoxesWithinGridContainer",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/grid-column-end"
	},
	"grid-column-gap": {
		"syntax": "<length-percentage>",
		"media": "visual",
		"inherited": false,
		"animationType": "length",
		"percentages": "referToDimensionOfContentArea",
		"groups": ["CSS Grid Layout"],
		"initial": "0",
		"appliesto": "gridContainers",
		"computed": "percentageAsSpecifiedOrAbsoluteLength",
		"order": "uniqueOrder",
		"status": "obsolete",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/column-gap"
	},
	"grid-column-start": {
		"syntax": "<grid-line>",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Grid Layout"],
		"initial": "auto",
		"appliesto": "gridItemsAndBoxesWithinGridContainer",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/grid-column-start"
	},
	"grid-gap": {
		"syntax": "<'grid-row-gap'> <'grid-column-gap'>?",
		"media": "visual",
		"inherited": false,
		"animationType": ["grid-row-gap", "grid-column-gap"],
		"percentages": "no",
		"groups": ["CSS Grid Layout"],
		"initial": ["grid-row-gap", "grid-column-gap"],
		"appliesto": "gridContainers",
		"computed": ["grid-row-gap", "grid-column-gap"],
		"order": "uniqueOrder",
		"status": "obsolete",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/gap"
	},
	"grid-row": {
		"syntax": "<grid-line> [ / <grid-line> ]?",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Grid Layout"],
		"initial": ["grid-row-start", "grid-row-end"],
		"appliesto": "gridItemsAndBoxesWithinGridContainer",
		"computed": ["grid-row-start", "grid-row-end"],
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/grid-row"
	},
	"grid-row-end": {
		"syntax": "<grid-line>",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Grid Layout"],
		"initial": "auto",
		"appliesto": "gridItemsAndBoxesWithinGridContainer",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/grid-row-end"
	},
	"grid-row-gap": {
		"syntax": "<length-percentage>",
		"media": "visual",
		"inherited": false,
		"animationType": "length",
		"percentages": "referToDimensionOfContentArea",
		"groups": ["CSS Grid Layout"],
		"initial": "0",
		"appliesto": "gridContainers",
		"computed": "percentageAsSpecifiedOrAbsoluteLength",
		"order": "uniqueOrder",
		"status": "obsolete",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/row-gap"
	},
	"grid-row-start": {
		"syntax": "<grid-line>",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Grid Layout"],
		"initial": "auto",
		"appliesto": "gridItemsAndBoxesWithinGridContainer",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/grid-row-start"
	},
	"grid-template": {
		"syntax": "none | [ <'grid-template-rows'> / <'grid-template-columns'> ] | [ <line-names>? <string> <track-size>? <line-names>? ]+ [ / <explicit-track-list> ]?",
		"media": "visual",
		"inherited": false,
		"animationType": [
			"grid-template-columns",
			"grid-template-rows",
			"grid-template-areas"
		],
		"percentages": ["grid-template-columns", "grid-template-rows"],
		"groups": ["CSS Grid Layout"],
		"initial": [
			"grid-template-columns",
			"grid-template-rows",
			"grid-template-areas"
		],
		"appliesto": "gridContainers",
		"computed": [
			"grid-template-columns",
			"grid-template-rows",
			"grid-template-areas"
		],
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/grid-template"
	},
	"grid-template-areas": {
		"syntax": "none | <string>+",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Grid Layout"],
		"initial": "none",
		"appliesto": "gridContainers",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/grid-template-areas"
	},
	"grid-template-columns": {
		"syntax": "none | <track-list> | <auto-track-list> | subgrid <line-name-list>?",
		"media": "visual",
		"inherited": false,
		"animationType": "simpleListOfLpcDifferenceLpc",
		"percentages": "referToDimensionOfContentArea",
		"groups": ["CSS Grid Layout"],
		"initial": "none",
		"appliesto": "gridContainers",
		"computed": "asSpecifiedRelativeToAbsoluteLengths",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/grid-template-columns"
	},
	"grid-template-rows": {
		"syntax": "none | <track-list> | <auto-track-list> | subgrid <line-name-list>?",
		"media": "visual",
		"inherited": false,
		"animationType": "simpleListOfLpcDifferenceLpc",
		"percentages": "referToDimensionOfContentArea",
		"groups": ["CSS Grid Layout"],
		"initial": "none",
		"appliesto": "gridContainers",
		"computed": "asSpecifiedRelativeToAbsoluteLengths",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/grid-template-rows"
	},
	"hanging-punctuation": {
		"syntax": "none | [ first || [ force-end | allow-end ] || last ]",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Text"],
		"initial": "none",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/hanging-punctuation"
	},
	"height": {
		"syntax": "auto | <length> | <percentage> | min-content | max-content | fit-content | fit-content(<length-percentage>)",
		"media": "visual",
		"inherited": false,
		"animationType": "lpc",
		"percentages": "regardingHeightOfGeneratedBoxContainingBlockPercentagesRelativeToContainingBlock",
		"groups": ["CSS Box Model"],
		"initial": "auto",
		"appliesto": "allElementsButNonReplacedAndTableColumns",
		"computed": "percentageAutoOrAbsoluteLength",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/height"
	},
	"hyphenate-character": {
		"syntax": "auto | <string>",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Text"],
		"initial": "auto",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/hyphenate-character"
	},
	"hyphenate-limit-chars": {
		"syntax": "[ auto | <integer> ]{1,3}",
		"media": "visual",
		"inherited": true,
		"animationType": "byComputedValueType",
		"percentages": "no",
		"groups": ["CSS Text"],
		"initial": "auto",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/hyphenate-limit-chars"
	},
	"hyphens": {
		"syntax": "none | manual | auto",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Text"],
		"initial": "manual",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/hyphens"
	},
	"image-orientation": {
		"syntax": "from-image | <angle> | [ <angle>? flip ]",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Images"],
		"initial": "from-image",
		"appliesto": "allElements",
		"computed": "angleRoundedToNextQuarter",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/image-orientation"
	},
	"image-rendering": {
		"syntax": "auto | crisp-edges | pixelated",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Images"],
		"initial": "auto",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/image-rendering"
	},
	"image-resolution": {
		"syntax": "[ from-image || <resolution> ] && snap?",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Images"],
		"initial": "1dppx",
		"appliesto": "allElements",
		"computed": "asSpecifiedWithExceptionOfResolution",
		"order": "uniqueOrder",
		"status": "experimental"
	},
	"ime-mode": {
		"syntax": "auto | normal | active | inactive | disabled",
		"media": "interactive",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Basic User Interface"],
		"initial": "auto",
		"appliesto": "textFields",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "obsolete",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/ime-mode"
	},
	"initial-letter": {
		"syntax": "normal | [ <number> <integer>? ]",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "no",
		"groups": ["CSS Inline"],
		"initial": "normal",
		"appliesto": "firstLetterPseudoElementsAndInlineLevelFirstChildren",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "experimental",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/initial-letter"
	},
	"initial-letter-align": {
		"syntax": "[ auto | alphabetic | hanging | ideographic ]",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Inline"],
		"initial": "auto",
		"appliesto": "firstLetterPseudoElementsAndInlineLevelFirstChildren",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "experimental",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/initial-letter-align"
	},
	"inline-size": {
		"syntax": "<'width'>",
		"media": "visual",
		"inherited": false,
		"animationType": "lpc",
		"percentages": "inlineSizeOfContainingBlock",
		"groups": ["CSS Logical Properties"],
		"initial": "auto",
		"appliesto": "sameAsWidthAndHeight",
		"computed": "sameAsWidthAndHeight",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/inline-size"
	},
	"input-security": {
		"syntax": "auto | none",
		"media": "interactive",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "no",
		"groups": ["CSS Basic User Interface"],
		"initial": "auto",
		"appliesto": "sensitiveTextInputs",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard"
	},
	"inset": {
		"syntax": "<'top'>{1,4}",
		"media": "visual",
		"inherited": false,
		"animationType": "lpc",
		"percentages": "logicalHeightOrWidthOfContainingBlock",
		"groups": ["CSS Logical Properties"],
		"initial": [
			"top",
			"bottom",
			"left",
			"right"
		],
		"appliesto": "positionedElements",
		"computed": [
			"top",
			"bottom",
			"left",
			"right"
		],
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/inset"
	},
	"inset-block": {
		"syntax": "<'top'>{1,2}",
		"media": "visual",
		"inherited": false,
		"animationType": "lpc",
		"percentages": "logicalHeightOfContainingBlock",
		"groups": ["CSS Logical Properties"],
		"initial": ["inset-block-start", "inset-block-end"],
		"appliesto": "positionedElements",
		"computed": ["inset-block-start", "inset-block-end"],
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/inset-block"
	},
	"inset-block-end": {
		"syntax": "<'top'>",
		"media": "visual",
		"inherited": false,
		"animationType": "lpc",
		"percentages": "logicalHeightOfContainingBlock",
		"groups": ["CSS Logical Properties"],
		"initial": "auto",
		"appliesto": "positionedElements",
		"computed": "sameAsBoxOffsets",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/inset-block-end"
	},
	"inset-block-start": {
		"syntax": "<'top'>",
		"media": "visual",
		"inherited": false,
		"animationType": "lpc",
		"percentages": "logicalHeightOfContainingBlock",
		"groups": ["CSS Logical Properties"],
		"initial": "auto",
		"appliesto": "positionedElements",
		"computed": "sameAsBoxOffsets",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/inset-block-start"
	},
	"inset-inline": {
		"syntax": "<'top'>{1,2}",
		"media": "visual",
		"inherited": false,
		"animationType": "lpc",
		"percentages": "logicalWidthOfContainingBlock",
		"groups": ["CSS Logical Properties"],
		"initial": ["inset-inline-start", "inset-inline-end"],
		"appliesto": "positionedElements",
		"computed": ["inset-inline-start", "inset-inline-end"],
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/inset-inline"
	},
	"inset-inline-end": {
		"syntax": "<'top'>",
		"media": "visual",
		"inherited": false,
		"animationType": "lpc",
		"percentages": "logicalWidthOfContainingBlock",
		"groups": ["CSS Logical Properties"],
		"initial": "auto",
		"appliesto": "positionedElements",
		"computed": "sameAsBoxOffsets",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/inset-inline-end"
	},
	"inset-inline-start": {
		"syntax": "<'top'>",
		"media": "visual",
		"inherited": false,
		"animationType": "lpc",
		"percentages": "logicalWidthOfContainingBlock",
		"groups": ["CSS Logical Properties"],
		"initial": "auto",
		"appliesto": "positionedElements",
		"computed": "sameAsBoxOffsets",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/inset-inline-start"
	},
	"interpolate-size": {
		"syntax": "numeric-only | allow-keywords",
		"media": "none",
		"inherited": true,
		"animationType": "notAnimatable",
		"percentages": "no",
		"groups": ["CSS Units"],
		"initial": "numeric-only",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/interpolate-size"
	},
	"isolation": {
		"syntax": "auto | isolate",
		"media": "visual",
		"inherited": false,
		"animationType": "notAnimatable",
		"percentages": "no",
		"groups": ["Compositing and Blending"],
		"initial": "auto",
		"appliesto": "allElementsSVGContainerGraphicsAndGraphicsReferencingElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/isolation"
	},
	"justify-content": {
		"syntax": "normal | <content-distribution> | <overflow-position>? [ <content-position> | left | right ]",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Box Alignment"],
		"initial": "normal",
		"appliesto": "flexContainers",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/justify-content"
	},
	"justify-items": {
		"syntax": "normal | stretch | <baseline-position> | <overflow-position>? [ <self-position> | left | right ] | legacy | legacy && [ left | right | center ]",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Box Alignment"],
		"initial": "legacy",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/justify-items"
	},
	"justify-self": {
		"syntax": "auto | normal | stretch | <baseline-position> | <overflow-position>? [ <self-position> | left | right ]",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Box Alignment"],
		"initial": "auto",
		"appliesto": "blockLevelBoxesAndAbsolutelyPositionedBoxesAndGridItems",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/justify-self"
	},
	"justify-tracks": {
		"syntax": "[ normal | <content-distribution> | <overflow-position>? [ <content-position> | left | right ] ]#",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Grid Layout"],
		"initial": "normal",
		"appliesto": "gridContainersWithMasonryLayoutInTheirInlineAxis",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "experimental",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/justify-tracks"
	},
	"left": {
		"syntax": "<length> | <percentage> | auto",
		"media": "visual",
		"inherited": false,
		"animationType": "lpc",
		"percentages": "referToWidthOfContainingBlock",
		"groups": ["CSS Positioning"],
		"initial": "auto",
		"appliesto": "positionedElements",
		"computed": "lengthAbsolutePercentageAsSpecifiedOtherwiseAuto",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/left"
	},
	"letter-spacing": {
		"syntax": "normal | <length>",
		"media": "visual",
		"inherited": true,
		"animationType": "length",
		"percentages": "no",
		"groups": ["CSS Text"],
		"initial": "normal",
		"appliesto": "allElements",
		"computed": "optimumValueOfAbsoluteLengthOrNormal",
		"order": "uniqueOrder",
		"alsoAppliesTo": ["::first-letter", "::first-line"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/letter-spacing"
	},
	"line-break": {
		"syntax": "auto | loose | normal | strict | anywhere",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Text"],
		"initial": "auto",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/line-break"
	},
	"line-clamp": {
		"syntax": "none | <integer>",
		"media": "visual",
		"inherited": false,
		"animationType": "integer",
		"percentages": "no",
		"groups": ["CSS Overflow"],
		"initial": "none",
		"appliesto": "blockContainersExceptMultiColumnContainers",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "experimental"
	},
	"line-height": {
		"syntax": "normal | <number> | <length> | <percentage>",
		"media": "visual",
		"inherited": true,
		"animationType": "numberOrLength",
		"percentages": "referToElementFontSize",
		"groups": ["CSS Fonts"],
		"initial": "normal",
		"appliesto": "allElements",
		"computed": "absoluteLengthOrAsSpecified",
		"order": "uniqueOrder",
		"alsoAppliesTo": [
			"::first-letter",
			"::first-line",
			"::placeholder"
		],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/line-height"
	},
	"line-height-step": {
		"syntax": "<length>",
		"media": "visual",
		"inherited": true,
		"animationType": "byComputedValueType",
		"percentages": "no",
		"groups": ["CSS Fonts"],
		"initial": "0",
		"appliesto": "blockContainers",
		"computed": "absoluteLength",
		"order": "perGrammar",
		"status": "experimental",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/line-height-step"
	},
	"list-style": {
		"syntax": "<'list-style-type'> || <'list-style-position'> || <'list-style-image'>",
		"media": "visual",
		"inherited": true,
		"animationType": [
			"list-style-image",
			"list-style-position",
			"list-style-type"
		],
		"percentages": "no",
		"groups": ["CSS Lists and Counters"],
		"initial": [
			"list-style-type",
			"list-style-position",
			"list-style-image"
		],
		"appliesto": "listItems",
		"computed": [
			"list-style-image",
			"list-style-position",
			"list-style-type"
		],
		"order": "orderOfAppearance",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/list-style"
	},
	"list-style-image": {
		"syntax": "<image> | none",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Lists and Counters"],
		"initial": "none",
		"appliesto": "listItems",
		"computed": "theKeywordListStyleImageNoneOrComputedValue",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/list-style-image"
	},
	"list-style-position": {
		"syntax": "inside | outside",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Lists and Counters"],
		"initial": "outside",
		"appliesto": "listItems",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/list-style-position"
	},
	"list-style-type": {
		"syntax": "<counter-style> | <string> | none",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Lists and Counters"],
		"initial": "disc",
		"appliesto": "listItems",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/list-style-type"
	},
	"margin": {
		"syntax": "[ <length> | <percentage> | auto ]{1,4}",
		"media": "visual",
		"inherited": false,
		"animationType": "length",
		"percentages": "referToWidthOfContainingBlock",
		"groups": ["CSS Box Model"],
		"initial": [
			"margin-bottom",
			"margin-left",
			"margin-right",
			"margin-top"
		],
		"appliesto": "allElementsExceptTableDisplayTypes",
		"computed": [
			"margin-bottom",
			"margin-left",
			"margin-right",
			"margin-top"
		],
		"order": "uniqueOrder",
		"alsoAppliesTo": ["::first-letter"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/margin"
	},
	"margin-block": {
		"syntax": "<'margin-left'>{1,2}",
		"media": "visual",
		"inherited": false,
		"animationType": "length",
		"percentages": "dependsOnLayoutModel",
		"groups": ["CSS Logical Properties"],
		"initial": ["margin-block-start", "margin-block-end"],
		"appliesto": "sameAsMargin",
		"computed": ["margin-block-start", "margin-block-end"],
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/margin-block"
	},
	"margin-block-end": {
		"syntax": "<'margin-left'>",
		"media": "visual",
		"inherited": false,
		"animationType": "length",
		"percentages": "dependsOnLayoutModel",
		"groups": ["CSS Logical Properties"],
		"initial": "0",
		"appliesto": "sameAsMargin",
		"computed": "lengthAbsolutePercentageAsSpecifiedOtherwiseAuto",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/margin-block-end"
	},
	"margin-block-start": {
		"syntax": "<'margin-left'>",
		"media": "visual",
		"inherited": false,
		"animationType": "length",
		"percentages": "dependsOnLayoutModel",
		"groups": ["CSS Logical Properties"],
		"initial": "0",
		"appliesto": "sameAsMargin",
		"computed": "lengthAbsolutePercentageAsSpecifiedOtherwiseAuto",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/margin-block-start"
	},
	"margin-bottom": {
		"syntax": "<length> | <percentage> | auto",
		"media": "visual",
		"inherited": false,
		"animationType": "length",
		"percentages": "referToWidthOfContainingBlock",
		"groups": ["CSS Box Model"],
		"initial": "0",
		"appliesto": "allElementsExceptTableDisplayTypes",
		"computed": "percentageAsSpecifiedOrAbsoluteLength",
		"order": "uniqueOrder",
		"alsoAppliesTo": ["::first-letter"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/margin-bottom"
	},
	"margin-inline": {
		"syntax": "<'margin-left'>{1,2}",
		"media": "visual",
		"inherited": false,
		"animationType": "length",
		"percentages": "dependsOnLayoutModel",
		"groups": ["CSS Logical Properties"],
		"initial": ["margin-inline-start", "margin-inline-end"],
		"appliesto": "sameAsMargin",
		"computed": ["margin-inline-start", "margin-inline-end"],
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/margin-inline"
	},
	"margin-inline-end": {
		"syntax": "<'margin-left'>",
		"media": "visual",
		"inherited": false,
		"animationType": "length",
		"percentages": "dependsOnLayoutModel",
		"groups": ["CSS Logical Properties"],
		"initial": "0",
		"appliesto": "sameAsMargin",
		"computed": "lengthAbsolutePercentageAsSpecifiedOtherwiseAuto",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/margin-inline-end"
	},
	"margin-inline-start": {
		"syntax": "<'margin-left'>",
		"media": "visual",
		"inherited": false,
		"animationType": "length",
		"percentages": "dependsOnLayoutModel",
		"groups": ["CSS Logical Properties"],
		"initial": "0",
		"appliesto": "sameAsMargin",
		"computed": "lengthAbsolutePercentageAsSpecifiedOtherwiseAuto",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/margin-inline-start"
	},
	"margin-left": {
		"syntax": "<length> | <percentage> | auto",
		"media": "visual",
		"inherited": false,
		"animationType": "length",
		"percentages": "referToWidthOfContainingBlock",
		"groups": ["CSS Box Model"],
		"initial": "0",
		"appliesto": "allElementsExceptTableDisplayTypes",
		"computed": "percentageAsSpecifiedOrAbsoluteLength",
		"order": "uniqueOrder",
		"alsoAppliesTo": ["::first-letter"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/margin-left"
	},
	"margin-right": {
		"syntax": "<length> | <percentage> | auto",
		"media": "visual",
		"inherited": false,
		"animationType": "length",
		"percentages": "referToWidthOfContainingBlock",
		"groups": ["CSS Box Model"],
		"initial": "0",
		"appliesto": "allElementsExceptTableDisplayTypes",
		"computed": "percentageAsSpecifiedOrAbsoluteLength",
		"order": "uniqueOrder",
		"alsoAppliesTo": ["::first-letter"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/margin-right"
	},
	"margin-top": {
		"syntax": "<length> | <percentage> | auto",
		"media": "visual",
		"inherited": false,
		"animationType": "length",
		"percentages": "referToWidthOfContainingBlock",
		"groups": ["CSS Box Model"],
		"initial": "0",
		"appliesto": "allElementsExceptTableDisplayTypes",
		"computed": "percentageAsSpecifiedOrAbsoluteLength",
		"order": "uniqueOrder",
		"alsoAppliesTo": ["::first-letter"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/margin-top"
	},
	"margin-trim": {
		"syntax": "none | in-flow | all",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Box Model"],
		"initial": "none",
		"appliesto": "blockContainersAndMultiColumnContainers",
		"computed": "asSpecified",
		"order": "perGrammar",
		"alsoAppliesTo": ["::first-letter"],
		"status": "experimental",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/margin-trim"
	},
	"marker": {
		"syntax": "none | <url>",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Scalable Vector Graphics"],
		"initial": [
			"marker-start",
			"marker-mid",
			"marker-end"
		],
		"appliesto": "limitedSVGElementsShapes",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/marker"
	},
	"marker-end": {
		"syntax": "none | <url>",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Scalable Vector Graphics"],
		"initial": "none",
		"appliesto": "limitedSVGElementsShapes",
		"computed": "asSpecifiedURLsAbsolute",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/marker-end"
	},
	"marker-mid": {
		"syntax": "none | <url>",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Scalable Vector Graphics"],
		"initial": "none",
		"appliesto": "limitedSVGElementsShapes",
		"computed": "asSpecifiedURLsAbsolute",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/marker-mid"
	},
	"marker-start": {
		"syntax": "none | <url>",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Scalable Vector Graphics"],
		"initial": "none",
		"appliesto": "limitedSVGElementsShapes",
		"computed": "asSpecifiedURLsAbsolute",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/marker-start"
	},
	"mask": {
		"syntax": "<mask-layer>#",
		"media": "visual",
		"inherited": false,
		"animationType": [
			"mask-image",
			"mask-mode",
			"mask-repeat",
			"mask-position",
			"mask-clip",
			"mask-origin",
			"mask-size",
			"mask-composite"
		],
		"percentages": ["mask-position"],
		"groups": ["CSS Masking"],
		"initial": [
			"mask-image",
			"mask-mode",
			"mask-repeat",
			"mask-position",
			"mask-clip",
			"mask-origin",
			"mask-size",
			"mask-composite"
		],
		"appliesto": "allElementsSVGContainerElements",
		"computed": [
			"mask-image",
			"mask-mode",
			"mask-repeat",
			"mask-position",
			"mask-clip",
			"mask-origin",
			"mask-size",
			"mask-composite"
		],
		"order": "perGrammar",
		"stacking": true,
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/mask"
	},
	"mask-border": {
		"syntax": "<'mask-border-source'> || <'mask-border-slice'> [ / <'mask-border-width'>? [ / <'mask-border-outset'> ]? ]? || <'mask-border-repeat'> || <'mask-border-mode'>",
		"media": "visual",
		"inherited": false,
		"animationType": [
			"mask-border-mode",
			"mask-border-outset",
			"mask-border-repeat",
			"mask-border-slice",
			"mask-border-source",
			"mask-border-width"
		],
		"percentages": ["mask-border-slice", "mask-border-width"],
		"groups": ["CSS Masking"],
		"initial": [
			"mask-border-mode",
			"mask-border-outset",
			"mask-border-repeat",
			"mask-border-slice",
			"mask-border-source",
			"mask-border-width"
		],
		"appliesto": "allElementsSVGContainerElements",
		"computed": [
			"mask-border-mode",
			"mask-border-outset",
			"mask-border-repeat",
			"mask-border-slice",
			"mask-border-source",
			"mask-border-width"
		],
		"order": "perGrammar",
		"stacking": true,
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/mask-border"
	},
	"mask-border-mode": {
		"syntax": "luminance | alpha",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Masking"],
		"initial": "alpha",
		"appliesto": "allElementsSVGContainerElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/mask-border-mode"
	},
	"mask-border-outset": {
		"syntax": "[ <length> | <number> ]{1,4}",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Masking"],
		"initial": "0",
		"appliesto": "allElementsSVGContainerElements",
		"computed": "asSpecifiedRelativeToAbsoluteLengths",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/mask-border-outset"
	},
	"mask-border-repeat": {
		"syntax": "[ stretch | repeat | round | space ]{1,2}",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Masking"],
		"initial": "stretch",
		"appliesto": "allElementsSVGContainerElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/mask-border-repeat"
	},
	"mask-border-slice": {
		"syntax": "<number-percentage>{1,4} fill?",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "referToSizeOfMaskBorderImage",
		"groups": ["CSS Masking"],
		"initial": "0",
		"appliesto": "allElementsSVGContainerElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/mask-border-slice"
	},
	"mask-border-source": {
		"syntax": "none | <image>",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Masking"],
		"initial": "none",
		"appliesto": "allElementsSVGContainerElements",
		"computed": "asSpecifiedURLsAbsolute",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/mask-border-source"
	},
	"mask-border-width": {
		"syntax": "[ <length-percentage> | <number> | auto ]{1,4}",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "relativeToMaskBorderImageArea",
		"groups": ["CSS Masking"],
		"initial": "auto",
		"appliesto": "allElementsSVGContainerElements",
		"computed": "asSpecifiedRelativeToAbsoluteLengths",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/mask-border-width"
	},
	"mask-clip": {
		"syntax": "[ <geometry-box> | no-clip ]#",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Masking"],
		"initial": "border-box",
		"appliesto": "allElementsSVGContainerElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/mask-clip"
	},
	"mask-composite": {
		"syntax": "<compositing-operator>#",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Masking"],
		"initial": "add",
		"appliesto": "allElementsSVGContainerElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/mask-composite"
	},
	"mask-image": {
		"syntax": "<mask-reference>#",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Masking"],
		"initial": "none",
		"appliesto": "allElementsSVGContainerElements",
		"computed": "asSpecifiedURLsAbsolute",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/mask-image"
	},
	"mask-mode": {
		"syntax": "<masking-mode>#",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Masking"],
		"initial": "match-source",
		"appliesto": "allElementsSVGContainerElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/mask-mode"
	},
	"mask-origin": {
		"syntax": "<geometry-box>#",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Masking"],
		"initial": "border-box",
		"appliesto": "allElementsSVGContainerElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/mask-origin"
	},
	"mask-position": {
		"syntax": "<position>#",
		"media": "visual",
		"inherited": false,
		"animationType": "repeatableList",
		"percentages": "referToSizeOfMaskPaintingArea",
		"groups": ["CSS Masking"],
		"initial": "0% 0%",
		"appliesto": "allElementsSVGContainerElements",
		"computed": "consistsOfTwoKeywordsForOriginAndOffsets",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/mask-position"
	},
	"mask-repeat": {
		"syntax": "<repeat-style>#",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Masking"],
		"initial": "repeat",
		"appliesto": "allElementsSVGContainerElements",
		"computed": "consistsOfTwoDimensionKeywords",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/mask-repeat"
	},
	"mask-size": {
		"syntax": "<bg-size>#",
		"media": "visual",
		"inherited": false,
		"animationType": "repeatableList",
		"percentages": "no",
		"groups": ["CSS Masking"],
		"initial": "auto",
		"appliesto": "allElementsSVGContainerElements",
		"computed": "asSpecifiedRelativeToAbsoluteLengths",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/mask-size"
	},
	"mask-type": {
		"syntax": "luminance | alpha",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Masking"],
		"initial": "luminance",
		"appliesto": "maskElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/mask-type"
	},
	"masonry-auto-flow": {
		"syntax": "[ pack | next ] || [ definite-first | ordered ]",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Grid Layout"],
		"initial": "pack",
		"appliesto": "gridContainersWithMasonryLayout",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "experimental",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/masonry-auto-flow"
	},
	"math-depth": {
		"syntax": "auto-add | add(<integer>) | <integer>",
		"media": "visual",
		"inherited": true,
		"animationType": "notAnimatable",
		"percentages": "no",
		"groups": ["MathML"],
		"initial": "0",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/math-depth"
	},
	"math-shift": {
		"syntax": "normal | compact",
		"media": "visual",
		"inherited": true,
		"animationType": "notAnimatable",
		"percentages": "no",
		"groups": ["MathML"],
		"initial": "normal",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/math-shift"
	},
	"math-style": {
		"syntax": "normal | compact",
		"media": "visual",
		"inherited": true,
		"animationType": "notAnimatable",
		"percentages": "no",
		"groups": ["MathML"],
		"initial": "normal",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/math-style"
	},
	"max-block-size": {
		"syntax": "<'max-width'>",
		"media": "visual",
		"inherited": false,
		"animationType": "lpc",
		"percentages": "blockSizeOfContainingBlock",
		"groups": ["CSS Logical Properties"],
		"initial": "none",
		"appliesto": "sameAsWidthAndHeight",
		"computed": "sameAsMaxWidthAndMaxHeight",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/max-block-size"
	},
	"max-height": {
		"syntax": "none | <length-percentage> | min-content | max-content | fit-content | fit-content(<length-percentage>)",
		"media": "visual",
		"inherited": false,
		"animationType": "lpc",
		"percentages": "regardingHeightOfGeneratedBoxContainingBlockPercentagesNone",
		"groups": ["CSS Box Model"],
		"initial": "none",
		"appliesto": "allElementsButNonReplacedAndTableColumns",
		"computed": "percentageAsSpecifiedAbsoluteLengthOrNone",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/max-height"
	},
	"max-inline-size": {
		"syntax": "<'max-width'>",
		"media": "visual",
		"inherited": false,
		"animationType": "lpc",
		"percentages": "inlineSizeOfContainingBlock",
		"groups": ["CSS Logical Properties"],
		"initial": "none",
		"appliesto": "sameAsWidthAndHeight",
		"computed": "sameAsMaxWidthAndMaxHeight",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/max-inline-size"
	},
	"max-lines": {
		"syntax": "none | <integer>",
		"media": "visual",
		"inherited": false,
		"animationType": "integer",
		"percentages": "no",
		"groups": ["CSS Overflow"],
		"initial": "none",
		"appliesto": "blockContainersExceptMultiColumnContainers",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "experimental"
	},
	"max-width": {
		"syntax": "none | <length-percentage> | min-content | max-content | fit-content | fit-content(<length-percentage>)",
		"media": "visual",
		"inherited": false,
		"animationType": "lpc",
		"percentages": "referToWidthOfContainingBlock",
		"groups": ["CSS Box Model"],
		"initial": "none",
		"appliesto": "allElementsButNonReplacedAndTableRows",
		"computed": "percentageAsSpecifiedAbsoluteLengthOrNone",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/max-width"
	},
	"min-block-size": {
		"syntax": "<'min-width'>",
		"media": "visual",
		"inherited": false,
		"animationType": "lpc",
		"percentages": "blockSizeOfContainingBlock",
		"groups": ["CSS Logical Properties"],
		"initial": "0",
		"appliesto": "sameAsWidthAndHeight",
		"computed": "sameAsMinWidthAndMinHeight",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/min-block-size"
	},
	"min-height": {
		"syntax": "auto | <length> | <percentage> | min-content | max-content | fit-content | fit-content(<length-percentage>)",
		"media": "visual",
		"inherited": false,
		"animationType": "lpc",
		"percentages": "regardingHeightOfGeneratedBoxContainingBlockPercentages0",
		"groups": ["CSS Box Model"],
		"initial": "auto",
		"appliesto": "allElementsButNonReplacedAndTableColumns",
		"computed": "percentageAsSpecifiedOrAbsoluteLength",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/min-height"
	},
	"min-inline-size": {
		"syntax": "<'min-width'>",
		"media": "visual",
		"inherited": false,
		"animationType": "lpc",
		"percentages": "inlineSizeOfContainingBlock",
		"groups": ["CSS Logical Properties"],
		"initial": "0",
		"appliesto": "sameAsWidthAndHeight",
		"computed": "sameAsMinWidthAndMinHeight",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/min-inline-size"
	},
	"min-width": {
		"syntax": "auto | <length> | <percentage> | min-content | max-content | fit-content | fit-content(<length-percentage>)",
		"media": "visual",
		"inherited": false,
		"animationType": "lpc",
		"percentages": "referToWidthOfContainingBlock",
		"groups": ["CSS Box Model"],
		"initial": "auto",
		"appliesto": "allElementsButNonReplacedAndTableRows",
		"computed": "percentageAsSpecifiedOrAbsoluteLength",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/min-width"
	},
	"mix-blend-mode": {
		"syntax": "<blend-mode> | plus-lighter",
		"media": "visual",
		"inherited": false,
		"animationType": "notAnimatable",
		"percentages": "no",
		"groups": ["Compositing and Blending"],
		"initial": "normal",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"stacking": true,
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/mix-blend-mode"
	},
	"object-fit": {
		"syntax": "fill | contain | cover | none | scale-down",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Images"],
		"initial": "fill",
		"appliesto": "replacedElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/object-fit"
	},
	"object-position": {
		"syntax": "<position>",
		"media": "visual",
		"inherited": true,
		"animationType": "repeatableList",
		"percentages": "referToWidthAndHeightOfElement",
		"groups": ["CSS Images"],
		"initial": "50% 50%",
		"appliesto": "replacedElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/object-position"
	},
	"offset": {
		"syntax": "[ <'offset-position'>? [ <'offset-path'> [ <'offset-distance'> || <'offset-rotate'> ]? ]? ]! [ / <'offset-anchor'> ]?",
		"media": "visual",
		"inherited": false,
		"animationType": [
			"offset-position",
			"offset-path",
			"offset-distance",
			"offset-anchor",
			"offset-rotate"
		],
		"percentages": [
			"offset-position",
			"offset-distance",
			"offset-anchor"
		],
		"groups": ["CSS Motion Path"],
		"initial": [
			"offset-position",
			"offset-path",
			"offset-distance",
			"offset-anchor",
			"offset-rotate"
		],
		"appliesto": "transformableElements",
		"computed": [
			"offset-position",
			"offset-path",
			"offset-distance",
			"offset-anchor",
			"offset-rotate"
		],
		"order": "perGrammar",
		"stacking": true,
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/offset"
	},
	"offset-anchor": {
		"syntax": "auto | <position>",
		"media": "visual",
		"inherited": false,
		"animationType": "position",
		"percentages": "relativeToWidthAndHeight",
		"groups": ["CSS Motion Path"],
		"initial": "auto",
		"appliesto": "transformableElements",
		"computed": "forLengthAbsoluteValueOtherwisePercentage",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/offset-anchor"
	},
	"offset-distance": {
		"syntax": "<length-percentage>",
		"media": "visual",
		"inherited": false,
		"animationType": "lpc",
		"percentages": "referToTotalPathLength",
		"groups": ["CSS Motion Path"],
		"initial": "0",
		"appliesto": "transformableElements",
		"computed": "forLengthAbsoluteValueOtherwisePercentage",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/offset-distance"
	},
	"offset-path": {
		"syntax": "none | <offset-path> || <coord-box>",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "no",
		"groups": ["CSS Motion Path"],
		"initial": "none",
		"appliesto": "transformableElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"stacking": true,
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/offset-path"
	},
	"offset-position": {
		"syntax": "normal | auto | <position>",
		"media": "visual",
		"inherited": false,
		"animationType": "position",
		"percentages": "referToSizeOfContainingBlock",
		"groups": ["CSS Motion Path"],
		"initial": "normal",
		"appliesto": "transformableElements",
		"computed": "forLengthAbsoluteValueOtherwisePercentage",
		"order": "perGrammar",
		"status": "experimental"
	},
	"offset-rotate": {
		"syntax": "[ auto | reverse ] || <angle>",
		"media": "visual",
		"inherited": false,
		"animationType": "angleOrBasicShapeOrPath",
		"percentages": "no",
		"groups": ["CSS Motion Path"],
		"initial": "auto",
		"appliesto": "transformableElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/offset-rotate"
	},
	"opacity": {
		"syntax": "<alpha-value>",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "mapToRange0To1",
		"groups": ["CSS Color"],
		"initial": "1",
		"appliesto": "allElements",
		"computed": "specifiedValueNumberClipped0To1",
		"order": "perGrammar",
		"alsoAppliesTo": ["::placeholder"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/opacity"
	},
	"order": {
		"syntax": "<integer>",
		"media": "visual",
		"inherited": false,
		"animationType": "integer",
		"percentages": "no",
		"groups": ["CSS Flexible Box Layout"],
		"initial": "0",
		"appliesto": "flexItemsGridItemsAbsolutelyPositionedContainerChildren",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/order"
	},
	"orphans": {
		"syntax": "<integer>",
		"media": "visual",
		"inherited": true,
		"animationType": "byComputedValueType",
		"percentages": "no",
		"groups": ["CSS Fragmentation"],
		"initial": "2",
		"appliesto": "blockContainerElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/orphans"
	},
	"outline": {
		"syntax": "[ <'outline-width'> || <'outline-style'> || <'outline-color'> ]",
		"media": ["visual", "interactive"],
		"inherited": false,
		"animationType": [
			"outline-width",
			"outline-style",
			"outline-color"
		],
		"percentages": "no",
		"groups": ["CSS Basic User Interface"],
		"initial": [
			"outline-width",
			"outline-style",
			"outline-color"
		],
		"appliesto": "allElements",
		"computed": [
			"outline-width",
			"outline-style",
			"outline-color"
		],
		"order": "orderOfAppearance",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/outline"
	},
	"outline-color": {
		"syntax": "auto | <color>",
		"media": ["visual", "interactive"],
		"inherited": false,
		"animationType": "color",
		"percentages": "no",
		"groups": ["CSS Basic User Interface"],
		"initial": "auto",
		"appliesto": "allElements",
		"computed": "autoForTranslucentColorRGBAOtherwiseRGB",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/outline-color"
	},
	"outline-offset": {
		"syntax": "<length>",
		"media": ["visual", "interactive"],
		"inherited": false,
		"animationType": "length",
		"percentages": "no",
		"groups": ["CSS Basic User Interface"],
		"initial": "0",
		"appliesto": "allElements",
		"computed": "asSpecifiedRelativeToAbsoluteLengths",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/outline-offset"
	},
	"outline-style": {
		"syntax": "auto | <'border-style'>",
		"media": ["visual", "interactive"],
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "no",
		"groups": ["CSS Basic User Interface"],
		"initial": "none",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/outline-style"
	},
	"outline-width": {
		"syntax": "<line-width>",
		"media": ["visual", "interactive"],
		"inherited": false,
		"animationType": "length",
		"percentages": "no",
		"groups": ["CSS Basic User Interface"],
		"initial": "medium",
		"appliesto": "allElements",
		"computed": "absoluteLength0ForNone",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/outline-width"
	},
	"overflow": {
		"syntax": "[ visible | hidden | clip | scroll | auto ]{1,2}",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Overflow"],
		"initial": "visible",
		"appliesto": "blockContainersFlexContainersGridContainers",
		"computed": ["overflow-x", "overflow-y"],
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/overflow"
	},
	"overflow-anchor": {
		"syntax": "auto | none",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Scroll Anchoring"],
		"initial": "auto",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard"
	},
	"overflow-block": {
		"syntax": "visible | hidden | clip | scroll | auto",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Overflow"],
		"initial": "auto",
		"appliesto": "blockContainersFlexContainersGridContainers",
		"computed": "asSpecifiedButVisibleOrClipReplacedToAutoOrHiddenIfOtherValueDifferent",
		"order": "perGrammar",
		"status": "standard"
	},
	"overflow-clip-box": {
		"syntax": "padding-box | content-box",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Mozilla Extensions"],
		"initial": "padding-box",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "nonstandard",
		"mdn_url": "https://developer.mozilla.org/docs/Mozilla/CSS/overflow-clip-box"
	},
	"overflow-clip-margin": {
		"syntax": "<visual-box> || <length [0,∞]>",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Overflow"],
		"initial": "0px",
		"appliesto": "allElements",
		"computed": "theComputedLengthAndVisualBox",
		"order": "perGrammar",
		"status": "standard"
	},
	"overflow-inline": {
		"syntax": "visible | hidden | clip | scroll | auto",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Overflow"],
		"initial": "auto",
		"appliesto": "blockContainersFlexContainersGridContainers",
		"computed": "asSpecifiedButVisibleOrClipReplacedToAutoOrHiddenIfOtherValueDifferent",
		"order": "perGrammar",
		"status": "standard"
	},
	"overflow-wrap": {
		"syntax": "normal | break-word | anywhere",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Text"],
		"initial": "normal",
		"appliesto": "textElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/overflow-wrap"
	},
	"overflow-x": {
		"syntax": "visible | hidden | clip | scroll | auto",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Overflow"],
		"initial": "visible",
		"appliesto": "blockContainersFlexContainersGridContainers",
		"computed": "asSpecifiedButVisibleOrClipReplacedToAutoOrHiddenIfOtherValueDifferent",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/overflow-x"
	},
	"overflow-y": {
		"syntax": "visible | hidden | clip | scroll | auto",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Overflow"],
		"initial": "visible",
		"appliesto": "blockContainersFlexContainersGridContainers",
		"computed": "asSpecifiedButVisibleOrClipReplacedToAutoOrHiddenIfOtherValueDifferent",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/overflow-y"
	},
	"overlay": {
		"syntax": "none | auto",
		"media": "visual",
		"inherited": false,
		"animationType": "discreteButVisibleForDurationWhenAnimatedNone",
		"percentages": "no",
		"groups": ["CSS Positioning"],
		"initial": "none",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "experimental",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/overlay"
	},
	"overscroll-behavior": {
		"syntax": "[ contain | none | auto ]{1,2}",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Box Model"],
		"initial": "auto",
		"appliesto": "nonReplacedBlockAndInlineBlockElements",
		"computed": ["overscroll-behavior-x", "overscroll-behavior-y"],
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/overscroll-behavior"
	},
	"overscroll-behavior-block": {
		"syntax": "contain | none | auto",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Box Model"],
		"initial": "auto",
		"appliesto": "nonReplacedBlockAndInlineBlockElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/overscroll-behavior-block"
	},
	"overscroll-behavior-inline": {
		"syntax": "contain | none | auto",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Box Model"],
		"initial": "auto",
		"appliesto": "nonReplacedBlockAndInlineBlockElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/overscroll-behavior-inline"
	},
	"overscroll-behavior-x": {
		"syntax": "contain | none | auto",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Box Model"],
		"initial": "auto",
		"appliesto": "nonReplacedBlockAndInlineBlockElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/overscroll-behavior-x"
	},
	"overscroll-behavior-y": {
		"syntax": "contain | none | auto",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Box Model"],
		"initial": "auto",
		"appliesto": "nonReplacedBlockAndInlineBlockElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/overscroll-behavior-y"
	},
	"padding": {
		"syntax": "[ <length> | <percentage> ]{1,4}",
		"media": "visual",
		"inherited": false,
		"animationType": "length",
		"percentages": "referToWidthOfContainingBlock",
		"groups": ["CSS Box Model"],
		"initial": [
			"padding-bottom",
			"padding-left",
			"padding-right",
			"padding-top"
		],
		"appliesto": "allElementsExceptInternalTableDisplayTypes",
		"computed": [
			"padding-bottom",
			"padding-left",
			"padding-right",
			"padding-top"
		],
		"order": "uniqueOrder",
		"alsoAppliesTo": ["::first-letter", "::first-line"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/padding"
	},
	"padding-block": {
		"syntax": "<'padding-left'>{1,2}",
		"media": "visual",
		"inherited": false,
		"animationType": "length",
		"percentages": "logicalWidthOfContainingBlock",
		"groups": ["CSS Logical Properties"],
		"initial": ["padding-block-start", "padding-block-end"],
		"appliesto": "allElementsExceptInternalTableDisplayTypes",
		"computed": ["padding-block-start", "padding-block-end"],
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/padding-block"
	},
	"padding-block-end": {
		"syntax": "<'padding-left'>",
		"media": "visual",
		"inherited": false,
		"animationType": "length",
		"percentages": "logicalWidthOfContainingBlock",
		"groups": ["CSS Logical Properties"],
		"initial": "0",
		"appliesto": "allElementsExceptInternalTableDisplayTypes",
		"computed": "asLength",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/padding-block-end"
	},
	"padding-block-start": {
		"syntax": "<'padding-left'>",
		"media": "visual",
		"inherited": false,
		"animationType": "length",
		"percentages": "logicalWidthOfContainingBlock",
		"groups": ["CSS Logical Properties"],
		"initial": "0",
		"appliesto": "allElementsExceptInternalTableDisplayTypes",
		"computed": "asLength",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/padding-block-start"
	},
	"padding-bottom": {
		"syntax": "<length> | <percentage>",
		"media": "visual",
		"inherited": false,
		"animationType": "length",
		"percentages": "referToWidthOfContainingBlock",
		"groups": ["CSS Box Model"],
		"initial": "0",
		"appliesto": "allElementsExceptInternalTableDisplayTypes",
		"computed": "percentageAsSpecifiedOrAbsoluteLength",
		"order": "uniqueOrder",
		"alsoAppliesTo": ["::first-letter", "::first-line"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/padding-bottom"
	},
	"padding-inline": {
		"syntax": "<'padding-left'>{1,2}",
		"media": "visual",
		"inherited": false,
		"animationType": "length",
		"percentages": "logicalWidthOfContainingBlock",
		"groups": ["CSS Logical Properties"],
		"initial": ["padding-inline-start", "padding-inline-end"],
		"appliesto": "allElementsExceptInternalTableDisplayTypes",
		"computed": ["padding-inline-start", "padding-inline-end"],
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/padding-inline"
	},
	"padding-inline-end": {
		"syntax": "<'padding-left'>",
		"media": "visual",
		"inherited": false,
		"animationType": "length",
		"percentages": "logicalWidthOfContainingBlock",
		"groups": ["CSS Logical Properties"],
		"initial": "0",
		"appliesto": "allElementsExceptInternalTableDisplayTypes",
		"computed": "asLength",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/padding-inline-end"
	},
	"padding-inline-start": {
		"syntax": "<'padding-left'>",
		"media": "visual",
		"inherited": false,
		"animationType": "length",
		"percentages": "logicalWidthOfContainingBlock",
		"groups": ["CSS Logical Properties"],
		"initial": "0",
		"appliesto": "allElementsExceptInternalTableDisplayTypes",
		"computed": "asLength",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/padding-inline-start"
	},
	"padding-left": {
		"syntax": "<length> | <percentage>",
		"media": "visual",
		"inherited": false,
		"animationType": "length",
		"percentages": "referToWidthOfContainingBlock",
		"groups": ["CSS Box Model"],
		"initial": "0",
		"appliesto": "allElementsExceptInternalTableDisplayTypes",
		"computed": "percentageAsSpecifiedOrAbsoluteLength",
		"order": "uniqueOrder",
		"alsoAppliesTo": ["::first-letter", "::first-line"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/padding-left"
	},
	"padding-right": {
		"syntax": "<length> | <percentage>",
		"media": "visual",
		"inherited": false,
		"animationType": "length",
		"percentages": "referToWidthOfContainingBlock",
		"groups": ["CSS Box Model"],
		"initial": "0",
		"appliesto": "allElementsExceptInternalTableDisplayTypes",
		"computed": "percentageAsSpecifiedOrAbsoluteLength",
		"order": "uniqueOrder",
		"alsoAppliesTo": ["::first-letter", "::first-line"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/padding-right"
	},
	"padding-top": {
		"syntax": "<length> | <percentage>",
		"media": "visual",
		"inherited": false,
		"animationType": "length",
		"percentages": "referToWidthOfContainingBlock",
		"groups": ["CSS Box Model"],
		"initial": "0",
		"appliesto": "allElementsExceptInternalTableDisplayTypes",
		"computed": "percentageAsSpecifiedOrAbsoluteLength",
		"order": "uniqueOrder",
		"alsoAppliesTo": ["::first-letter", "::first-line"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/padding-top"
	},
	"page": {
		"syntax": "auto | <custom-ident>",
		"media": "paged",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Pages"],
		"initial": "auto",
		"appliesto": "blockElementsInNormalFlow",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/page"
	},
	"page-break-after": {
		"syntax": "auto | always | avoid | left | right | recto | verso",
		"media": ["visual", "paged"],
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Pages"],
		"initial": "auto",
		"appliesto": "blockElementsInNormalFlow",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/page-break-after"
	},
	"page-break-before": {
		"syntax": "auto | always | avoid | left | right | recto | verso",
		"media": ["visual", "paged"],
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Pages"],
		"initial": "auto",
		"appliesto": "blockElementsInNormalFlow",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/page-break-before"
	},
	"page-break-inside": {
		"syntax": "auto | avoid",
		"media": ["visual", "paged"],
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Pages"],
		"initial": "auto",
		"appliesto": "blockElementsInNormalFlow",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/page-break-inside"
	},
	"paint-order": {
		"syntax": "normal | [ fill || stroke || markers ]",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Text"],
		"initial": "normal",
		"appliesto": "textElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/paint-order"
	},
	"perspective": {
		"syntax": "none | <length>",
		"media": "visual",
		"inherited": false,
		"animationType": "length",
		"percentages": "no",
		"groups": ["CSS Transforms"],
		"initial": "none",
		"appliesto": "transformableElements",
		"computed": "absoluteLengthOrNone",
		"order": "uniqueOrder",
		"stacking": true,
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/perspective"
	},
	"perspective-origin": {
		"syntax": "<position>",
		"media": "visual",
		"inherited": false,
		"animationType": "simpleListOfLpc",
		"percentages": "referToSizeOfBoundingBox",
		"groups": ["CSS Transforms"],
		"initial": "50% 50%",
		"appliesto": "transformableElements",
		"computed": "forLengthAbsoluteValueOtherwisePercentage",
		"order": "oneOrTwoValuesLengthAbsoluteKeywordsPercentages",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/perspective-origin"
	},
	"place-content": {
		"syntax": "<'align-content'> <'justify-content'>?",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Box Alignment"],
		"initial": ["align-content", "justify-content"],
		"appliesto": "multilineFlexContainers",
		"computed": ["align-content", "justify-content"],
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/place-content"
	},
	"place-items": {
		"syntax": "<'align-items'> <'justify-items'>?",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Box Alignment"],
		"initial": ["align-items", "justify-items"],
		"appliesto": "allElements",
		"computed": ["align-items", "justify-items"],
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/place-items"
	},
	"place-self": {
		"syntax": "<'align-self'> <'justify-self'>?",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Box Alignment"],
		"initial": ["align-self", "justify-self"],
		"appliesto": "blockLevelBoxesAndAbsolutelyPositionedBoxesAndGridItems",
		"computed": ["align-self", "justify-self"],
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/place-self"
	},
	"pointer-events": {
		"syntax": "auto | none | visiblePainted | visibleFill | visibleStroke | visible | painted | fill | stroke | all | inherit",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Basic User Interface"],
		"initial": "auto",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/pointer-events"
	},
	"position": {
		"syntax": "static | relative | absolute | sticky | fixed",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Positioning"],
		"initial": "static",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"stacking": true,
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/position"
	},
	"position-anchor": {
		"syntax": "auto | <anchor-name>",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Positioning"],
		"initial": "auto",
		"appliesto": "absolutelyPositionedElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "experimental",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/position-anchor"
	},
	"position-area": {
		"syntax": "none | <position-area>",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Positioning"],
		"initial": "none",
		"appliesto": "positionedElementsWithADefaultAnchorElement",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "experimental",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/position-area"
	},
	"position-try": {
		"syntax": "<'position-try-order'>? <'position-try-fallbacks'>",
		"media": "visual",
		"inherited": false,
		"animationType": ["position-try-fallbacks", "position-try-order"],
		"percentages": ["position-try-fallbacks", "position-try-order"],
		"groups": ["CSS Positioning"],
		"initial": ["position-try-fallbacks", "position-try-order"],
		"appliesto": "absolutelyPositionedElements",
		"computed": ["position-try-fallbacks", "position-try-order"],
		"order": "perGrammar",
		"status": "experimental",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/position-try"
	},
	"position-try-fallbacks": {
		"syntax": "none | [ [<dashed-ident> || <try-tactic>] | <'position-area'> ]#",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Positioning"],
		"initial": "none",
		"appliesto": "absolutelyPositionedElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "experimental",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/position-try-fallbacks"
	},
	"position-try-order": {
		"syntax": "normal | <try-size>",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Positioning"],
		"initial": "normal",
		"appliesto": "absolutelyPositionedElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "experimental",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/position-try-order"
	},
	"position-visibility": {
		"syntax": "always | [ anchors-valid || anchors-visible || no-overflow ]",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Positioning"],
		"initial": "anchors-visible",
		"appliesto": "absolutelyPositionedElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "experimental",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/position-visibility"
	},
	"print-color-adjust": {
		"syntax": "economy | exact",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Color"],
		"initial": "economy",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/print-color-adjust"
	},
	"quotes": {
		"syntax": "none | auto | [ <string> <string> ]+",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Generated Content"],
		"initial": "dependsOnUserAgent",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/quotes"
	},
	"r": {
		"syntax": "<length> | <percentage>",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "referToSVGViewportSize",
		"groups": ["Scalable Vector Graphics"],
		"initial": "0",
		"appliesto": "limitedSVGElementsCircle",
		"computed": "percentageAsSpecifiedOrAbsoluteLength",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/r"
	},
	"resize": {
		"syntax": "none | both | horizontal | vertical | block | inline",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Basic User Interface"],
		"initial": "none",
		"appliesto": "elementsWithOverflowNotVisibleAndReplacedElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/resize"
	},
	"right": {
		"syntax": "<length> | <percentage> | auto",
		"media": "visual",
		"inherited": false,
		"animationType": "lpc",
		"percentages": "referToWidthOfContainingBlock",
		"groups": ["CSS Positioning"],
		"initial": "auto",
		"appliesto": "positionedElements",
		"computed": "lengthAbsolutePercentageAsSpecifiedOtherwiseAuto",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/right"
	},
	"rotate": {
		"syntax": "none | <angle> | [ x | y | z | <number>{3} ] && <angle>",
		"media": "visual",
		"inherited": false,
		"animationType": "transform",
		"percentages": "no",
		"groups": ["CSS Transforms"],
		"initial": "none",
		"appliesto": "transformableElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"stacking": true,
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/rotate"
	},
	"row-gap": {
		"syntax": "normal | <length-percentage>",
		"media": "visual",
		"inherited": false,
		"animationType": "lpc",
		"percentages": "referToDimensionOfContentArea",
		"groups": ["CSS Box Alignment"],
		"initial": "normal",
		"appliesto": "multiColumnElementsFlexContainersGridContainers",
		"computed": "asSpecifiedWithLengthsAbsoluteAndNormalComputingToZeroExceptMultiColumn",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/row-gap"
	},
	"ruby-align": {
		"syntax": "start | center | space-between | space-around",
		"media": "visual",
		"inherited": true,
		"animationType": "byComputedValueType",
		"percentages": "no",
		"groups": ["CSS Ruby"],
		"initial": "space-around",
		"appliesto": "rubyBasesAnnotationsBaseAnnotationContainers",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "experimental",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/ruby-align"
	},
	"ruby-merge": {
		"syntax": "separate | collapse | auto",
		"media": "visual",
		"inherited": true,
		"animationType": "byComputedValueType",
		"percentages": "no",
		"groups": ["CSS Ruby"],
		"initial": "separate",
		"appliesto": "rubyAnnotationsContainers",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "experimental"
	},
	"ruby-position": {
		"syntax": "[ alternate || [ over | under ] ] | inter-character",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Ruby"],
		"initial": "alternate",
		"appliesto": "rubyAnnotationsContainers",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "experimental",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/ruby-position"
	},
	"rx": {
		"syntax": "<length> | <percentage>",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "referToSVGViewportWidth",
		"groups": ["Scalable Vector Graphics"],
		"initial": "0",
		"appliesto": "limitedSVGElementsEllipseRect",
		"computed": "percentageAsSpecifiedOrAbsoluteLength",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/rx"
	},
	"ry": {
		"syntax": "<length> | <percentage>",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "referToSVGViewportHeight",
		"groups": ["Scalable Vector Graphics"],
		"initial": "0",
		"appliesto": "limitedSVGElementsEllipseRect",
		"computed": "percentageAsSpecifiedOrAbsoluteLength",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/ry"
	},
	"scale": {
		"syntax": "none | [ <number> | <percentage> ]{1,3}",
		"media": "visual",
		"inherited": false,
		"animationType": "transform",
		"percentages": "no",
		"groups": ["CSS Transforms"],
		"initial": "none",
		"appliesto": "transformableElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"stacking": true,
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/scale"
	},
	"scrollbar-color": {
		"syntax": "auto | <color>{2}",
		"media": "visual",
		"inherited": true,
		"animationType": "byComputedValueType",
		"percentages": "no",
		"groups": ["CSS Scrollbars"],
		"initial": "auto",
		"appliesto": "scrollingBoxes",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/scrollbar-color"
	},
	"scrollbar-gutter": {
		"syntax": "auto | stable && both-edges?",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Overflow"],
		"initial": "auto",
		"appliesto": "scrollingBoxes",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/scrollbar-gutter"
	},
	"scrollbar-width": {
		"syntax": "auto | thin | none",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "no",
		"groups": ["CSS Scrollbars"],
		"initial": "auto",
		"appliesto": "scrollingBoxes",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/scrollbar-width"
	},
	"scroll-behavior": {
		"syntax": "auto | smooth",
		"media": "visual",
		"inherited": false,
		"animationType": "notAnimatable",
		"percentages": "no",
		"groups": ["CSS Overflow"],
		"initial": "auto",
		"appliesto": "scrollingBoxes",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/scroll-behavior"
	},
	"scroll-margin": {
		"syntax": "<length>{1,4}",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "no",
		"groups": ["CSS Scroll Snap"],
		"initial": [
			"scroll-margin-bottom",
			"scroll-margin-left",
			"scroll-margin-right",
			"scroll-margin-top"
		],
		"appliesto": "allElements",
		"computed": [
			"scroll-margin-bottom",
			"scroll-margin-left",
			"scroll-margin-right",
			"scroll-margin-top"
		],
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/scroll-margin"
	},
	"scroll-margin-block": {
		"syntax": "<length>{1,2}",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "no",
		"groups": ["CSS Scroll Snap"],
		"initial": ["scroll-margin-block-start", "scroll-margin-block-end"],
		"appliesto": "allElements",
		"computed": ["scroll-margin-block-start", "scroll-margin-block-end"],
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/scroll-margin-block"
	},
	"scroll-margin-block-start": {
		"syntax": "<length>",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "no",
		"groups": ["CSS Scroll Snap"],
		"initial": "0",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/scroll-margin-block-start"
	},
	"scroll-margin-block-end": {
		"syntax": "<length>",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "no",
		"groups": ["CSS Scroll Snap"],
		"initial": "0",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/scroll-margin-block-end"
	},
	"scroll-margin-bottom": {
		"syntax": "<length>",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "no",
		"groups": ["CSS Scroll Snap"],
		"initial": "0",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/scroll-margin-bottom"
	},
	"scroll-margin-inline": {
		"syntax": "<length>{1,2}",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "no",
		"groups": ["CSS Scroll Snap"],
		"initial": ["scroll-margin-inline-start", "scroll-margin-inline-end"],
		"appliesto": "allElements",
		"computed": ["scroll-margin-inline-start", "scroll-margin-inline-end"],
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/scroll-margin-inline"
	},
	"scroll-margin-inline-start": {
		"syntax": "<length>",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "no",
		"groups": ["CSS Scroll Snap"],
		"initial": "0",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/scroll-margin-inline-start"
	},
	"scroll-margin-inline-end": {
		"syntax": "<length>",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "no",
		"groups": ["CSS Scroll Snap"],
		"initial": "0",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/scroll-margin-inline-end"
	},
	"scroll-margin-left": {
		"syntax": "<length>",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "no",
		"groups": ["CSS Scroll Snap"],
		"initial": "0",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/scroll-margin-left"
	},
	"scroll-margin-right": {
		"syntax": "<length>",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "no",
		"groups": ["CSS Scroll Snap"],
		"initial": "0",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/scroll-margin-right"
	},
	"scroll-margin-top": {
		"syntax": "<length>",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "no",
		"groups": ["CSS Scroll Snap"],
		"initial": "0",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/scroll-margin-top"
	},
	"scroll-padding": {
		"syntax": "[ auto | <length-percentage> ]{1,4}",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "relativeToTheScrollContainersScrollport",
		"groups": ["CSS Scroll Snap"],
		"initial": [
			"scroll-padding-bottom",
			"scroll-padding-left",
			"scroll-padding-right",
			"scroll-padding-top"
		],
		"appliesto": "scrollContainers",
		"computed": [
			"scroll-padding-bottom",
			"scroll-padding-left",
			"scroll-padding-right",
			"scroll-padding-top"
		],
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/scroll-padding"
	},
	"scroll-padding-block": {
		"syntax": "[ auto | <length-percentage> ]{1,2}",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "relativeToTheScrollContainersScrollport",
		"groups": ["CSS Scroll Snap"],
		"initial": ["scroll-padding-block-start", "scroll-padding-block-end"],
		"appliesto": "scrollContainers",
		"computed": ["scroll-padding-block-start", "scroll-padding-block-end"],
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/scroll-padding-block"
	},
	"scroll-padding-block-start": {
		"syntax": "auto | <length-percentage>",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "relativeToTheScrollContainersScrollport",
		"groups": ["CSS Scroll Snap"],
		"initial": "auto",
		"appliesto": "scrollContainers",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/scroll-padding-block-start"
	},
	"scroll-padding-block-end": {
		"syntax": "auto | <length-percentage>",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "relativeToTheScrollContainersScrollport",
		"groups": ["CSS Scroll Snap"],
		"initial": "auto",
		"appliesto": "scrollContainers",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/scroll-padding-block-end"
	},
	"scroll-padding-bottom": {
		"syntax": "auto | <length-percentage>",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "relativeToTheScrollContainersScrollport",
		"groups": ["CSS Scroll Snap"],
		"initial": "auto",
		"appliesto": "scrollContainers",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/scroll-padding-bottom"
	},
	"scroll-padding-inline": {
		"syntax": "[ auto | <length-percentage> ]{1,2}",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "relativeToTheScrollContainersScrollport",
		"groups": ["CSS Scroll Snap"],
		"initial": ["scroll-padding-inline-start", "scroll-padding-inline-end"],
		"appliesto": "scrollContainers",
		"computed": ["scroll-padding-inline-start", "scroll-padding-inline-end"],
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/scroll-padding-inline"
	},
	"scroll-padding-inline-start": {
		"syntax": "auto | <length-percentage>",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "relativeToTheScrollContainersScrollport",
		"groups": ["CSS Scroll Snap"],
		"initial": "auto",
		"appliesto": "scrollContainers",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/scroll-padding-inline-start"
	},
	"scroll-padding-inline-end": {
		"syntax": "auto | <length-percentage>",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "relativeToTheScrollContainersScrollport",
		"groups": ["CSS Scroll Snap"],
		"initial": "auto",
		"appliesto": "scrollContainers",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/scroll-padding-inline-end"
	},
	"scroll-padding-left": {
		"syntax": "auto | <length-percentage>",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "relativeToTheScrollContainersScrollport",
		"groups": ["CSS Scroll Snap"],
		"initial": "auto",
		"appliesto": "scrollContainers",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/scroll-padding-left"
	},
	"scroll-padding-right": {
		"syntax": "auto | <length-percentage>",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "relativeToTheScrollContainersScrollport",
		"groups": ["CSS Scroll Snap"],
		"initial": "auto",
		"appliesto": "scrollContainers",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/scroll-padding-right"
	},
	"scroll-padding-top": {
		"syntax": "auto | <length-percentage>",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "relativeToTheScrollContainersScrollport",
		"groups": ["CSS Scroll Snap"],
		"initial": "auto",
		"appliesto": "scrollContainers",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/scroll-padding-top"
	},
	"scroll-snap-align": {
		"syntax": "[ none | start | end | center ]{1,2}",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Scroll Snap"],
		"initial": "none",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/scroll-snap-align"
	},
	"scroll-snap-coordinate": {
		"syntax": "none | <position>#",
		"media": "interactive",
		"inherited": false,
		"animationType": "position",
		"percentages": "referToBorderBox",
		"groups": ["CSS Scroll Snap"],
		"initial": "none",
		"appliesto": "allElements",
		"computed": "asSpecifiedRelativeToAbsoluteLengths",
		"order": "uniqueOrder",
		"status": "obsolete",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/scroll-snap-coordinate"
	},
	"scroll-snap-destination": {
		"syntax": "<position>",
		"media": "interactive",
		"inherited": false,
		"animationType": "position",
		"percentages": "relativeToScrollContainerPaddingBoxAxis",
		"groups": ["CSS Scroll Snap"],
		"initial": "0px 0px",
		"appliesto": "scrollContainers",
		"computed": "asSpecifiedRelativeToAbsoluteLengths",
		"order": "uniqueOrder",
		"status": "obsolete",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/scroll-snap-destination"
	},
	"scroll-snap-points-x": {
		"syntax": "none | repeat( <length-percentage> )",
		"media": "interactive",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "relativeToScrollContainerPaddingBoxAxis",
		"groups": ["CSS Scroll Snap"],
		"initial": "none",
		"appliesto": "scrollContainers",
		"computed": "asSpecifiedRelativeToAbsoluteLengths",
		"order": "uniqueOrder",
		"status": "obsolete",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/scroll-snap-points-x"
	},
	"scroll-snap-points-y": {
		"syntax": "none | repeat( <length-percentage> )",
		"media": "interactive",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "relativeToScrollContainerPaddingBoxAxis",
		"groups": ["CSS Scroll Snap"],
		"initial": "none",
		"appliesto": "scrollContainers",
		"computed": "asSpecifiedRelativeToAbsoluteLengths",
		"order": "uniqueOrder",
		"status": "obsolete",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/scroll-snap-points-y"
	},
	"scroll-snap-stop": {
		"syntax": "normal | always",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Scroll Snap"],
		"initial": "normal",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/scroll-snap-stop"
	},
	"scroll-snap-type": {
		"syntax": "none | [ x | y | block | inline | both ] [ mandatory | proximity ]?",
		"media": "interactive",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Scroll Snap"],
		"initial": "none",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/scroll-snap-type"
	},
	"scroll-snap-type-x": {
		"syntax": "none | mandatory | proximity",
		"media": "interactive",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Scroll Snap"],
		"initial": "none",
		"appliesto": "scrollContainers",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "obsolete",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/scroll-snap-type-x"
	},
	"scroll-snap-type-y": {
		"syntax": "none | mandatory | proximity",
		"media": "interactive",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Scroll Snap"],
		"initial": "none",
		"appliesto": "scrollContainers",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "obsolete",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/scroll-snap-type-y"
	},
	"scroll-timeline": {
		"syntax": "[ <'scroll-timeline-name'> <'scroll-timeline-axis'>? ]#",
		"media": "visual",
		"inherited": false,
		"animationType": ["scroll-timeline-name", "scroll-timeline-axis"],
		"percentages": "no",
		"groups": ["CSS Animations"],
		"initial": ["scroll-timeline-name", "scroll-timeline-axis"],
		"appliesto": "scrollContainers",
		"computed": ["scroll-timeline-name", "scroll-timeline-axis"],
		"order": "perGrammar",
		"status": "experimental",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/scroll-timeline"
	},
	"scroll-timeline-axis": {
		"syntax": "[ block | inline | x | y ]#",
		"media": "interactive",
		"inherited": false,
		"animationType": "notAnimatable",
		"percentages": "no",
		"groups": ["CSS Animations"],
		"initial": "block",
		"appliesto": "scrollContainers",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "experimental",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/scroll-timeline-axis"
	},
	"scroll-timeline-name": {
		"syntax": "none | <dashed-ident>#",
		"media": "interactive",
		"inherited": false,
		"animationType": "notAnimatable",
		"percentages": "no",
		"groups": ["CSS Animations"],
		"initial": "none",
		"appliesto": "scrollContainers",
		"computed": "noneOrOrderedListOfIdentifiers",
		"order": "perGrammar",
		"status": "experimental",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/scroll-timeline-name"
	},
	"shape-image-threshold": {
		"syntax": "<alpha-value>",
		"media": "visual",
		"inherited": false,
		"animationType": "number",
		"percentages": "no",
		"groups": ["CSS Shapes"],
		"initial": "0.0",
		"appliesto": "floats",
		"computed": "specifiedValueNumberClipped0To1",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/shape-image-threshold"
	},
	"shape-margin": {
		"syntax": "<length-percentage>",
		"media": "visual",
		"inherited": false,
		"animationType": "lpc",
		"percentages": "referToWidthOfContainingBlock",
		"groups": ["CSS Shapes"],
		"initial": "0",
		"appliesto": "floats",
		"computed": "asSpecifiedRelativeToAbsoluteLengths",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/shape-margin"
	},
	"shape-outside": {
		"syntax": "none | [ <shape-box> || <basic-shape> ] | <image>",
		"media": "visual",
		"inherited": false,
		"animationType": "basicShapeOtherwiseNo",
		"percentages": "no",
		"groups": ["CSS Shapes"],
		"initial": "none",
		"appliesto": "floats",
		"computed": "asDefinedForBasicShapeWithAbsoluteURIOtherwiseAsSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/shape-outside"
	},
	"shape-rendering": {
		"syntax": "auto | optimizeSpeed | crispEdges | geometricPrecision",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Shapes"],
		"initial": "auto",
		"appliesto": "limitedSVGElementsShapes",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/shape-rendering"
	},
	"stroke": {
		"syntax": "",
		"media": "visual",
		"inherited": true,
		"animationType": [
			"stroke-dasharray",
			"stroke-dashoffset",
			"stroke-linecap",
			"stroke-linejoin",
			"stroke-miterlimit",
			"stroke-opacity",
			"stroke-width"
		],
		"percentages": "no",
		"groups": ["Scalable Vector Graphics"],
		"initial": [
			"stroke-dasharray",
			"stroke-dashoffset",
			"stroke-linecap",
			"stroke-linejoin",
			"stroke-miterlimit",
			"stroke-opacity",
			"stroke-width"
		],
		"appliesto": "asLonghands",
		"computed": "asLonghands",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/stroke"
	},
	"stroke-dasharray": {
		"syntax": "none | <dasharray>",
		"media": "visual",
		"inherited": true,
		"animationType": "repeatableList",
		"percentages": "referToSVGViewportDiagonal",
		"groups": ["Scalable Vector Graphics"],
		"initial": "none",
		"appliesto": "limitedSVGElementsShapes",
		"computed": "listEachItemConsistingOfAbsoluteLengthPercentageOrKeyword",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/stroke-dasharray"
	},
	"stroke-dashoffset": {
		"syntax": "<length-percentage> | <number>",
		"media": "visual",
		"inherited": true,
		"animationType": "byComputedValueType",
		"percentages": "referToSVGViewportDiagonal",
		"groups": ["Scalable Vector Graphics"],
		"initial": "0",
		"appliesto": "limitedSVGElementsShapes",
		"computed": "absoluteLengthOrPercentageNumbersConverted",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/stroke-dashoffset"
	},
	"stroke-linecap": {
		"syntax": "butt | round | square",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Scalable Vector Graphics"],
		"initial": "butt",
		"appliesto": "limitedSVGElementsShapes",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/stroke-linecap"
	},
	"stroke-linejoin": {
		"syntax": "miter | miter-clip | round | bevel | arcs",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Scalable Vector Graphics"],
		"initial": "miter",
		"appliesto": "limitedSVGElementsShapes",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/stroke-linejoin"
	},
	"stroke-miterlimit": {
		"syntax": "<number>",
		"media": "visual",
		"inherited": true,
		"animationType": "byComputedValueType",
		"percentages": "no",
		"groups": ["Scalable Vector Graphics"],
		"initial": "4",
		"appliesto": "limitedSVGElementsShapes",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/stroke-miterlimit"
	},
	"stroke-opacity": {
		"syntax": "<'opacity'>",
		"media": "visual",
		"inherited": true,
		"animationType": "byComputedValueType",
		"percentages": "no",
		"groups": ["Scalable Vector Graphics"],
		"initial": "1",
		"appliesto": "limitedSVGElementsShapes",
		"computed": "specifiedValueClipped0To1",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/stroke-opacity"
	},
	"stroke-width": {
		"syntax": "<length-percentage> | <number>",
		"media": "visual",
		"inherited": true,
		"animationType": "byComputedValueType",
		"percentages": "referToSVGViewportDiagonal",
		"groups": ["Scalable Vector Graphics"],
		"initial": "1px",
		"appliesto": "limitedSVGElementsShapes",
		"computed": "absoluteLengthOrPercentageNumbersConverted",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/stroke-width"
	},
	"tab-size": {
		"syntax": "<integer> | <length>",
		"media": "visual",
		"inherited": true,
		"animationType": "length",
		"percentages": "no",
		"groups": ["CSS Text"],
		"initial": "8",
		"appliesto": "blockContainers",
		"computed": "specifiedIntegerOrAbsoluteLength",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/tab-size"
	},
	"table-layout": {
		"syntax": "auto | fixed",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Table"],
		"initial": "auto",
		"appliesto": "tableElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/table-layout"
	},
	"text-align": {
		"syntax": "start | end | left | right | center | justify | match-parent",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Text"],
		"initial": "startOrNamelessValueIfLTRRightIfRTL",
		"appliesto": "blockContainers",
		"computed": "asSpecifiedExceptMatchParent",
		"order": "orderOfAppearance",
		"alsoAppliesTo": ["::placeholder"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/text-align"
	},
	"text-align-last": {
		"syntax": "auto | start | end | left | right | center | justify",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Text"],
		"initial": "auto",
		"appliesto": "blockContainers",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/text-align-last"
	},
	"text-anchor": {
		"syntax": "start | middle | end",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Scalable Vector Graphics"],
		"initial": "start",
		"appliesto": "limitedSVGElementsTextContent",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/text-anchor"
	},
	"text-combine-upright": {
		"syntax": "none | all | [ digits <integer>? ]",
		"media": "visual",
		"inherited": true,
		"animationType": "notAnimatable",
		"percentages": "no",
		"groups": ["CSS Writing Modes"],
		"initial": "none",
		"appliesto": "nonReplacedInlineElements",
		"computed": "keywordPlusIntegerIfDigits",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/text-combine-upright"
	},
	"text-decoration": {
		"syntax": "<'text-decoration-line'> || <'text-decoration-style'> || <'text-decoration-color'> || <'text-decoration-thickness'>",
		"media": "visual",
		"inherited": false,
		"animationType": [
			"text-decoration-color",
			"text-decoration-style",
			"text-decoration-line",
			"text-decoration-thickness"
		],
		"percentages": "no",
		"groups": ["CSS Text Decoration"],
		"initial": [
			"text-decoration-color",
			"text-decoration-style",
			"text-decoration-line"
		],
		"appliesto": "allElements",
		"computed": [
			"text-decoration-line",
			"text-decoration-style",
			"text-decoration-color",
			"text-decoration-thickness"
		],
		"order": "orderOfAppearance",
		"alsoAppliesTo": [
			"::first-letter",
			"::first-line",
			"::placeholder"
		],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/text-decoration"
	},
	"text-decoration-color": {
		"syntax": "<color>",
		"media": "visual",
		"inherited": false,
		"animationType": "color",
		"percentages": "no",
		"groups": ["CSS Text Decoration"],
		"initial": "currentcolor",
		"appliesto": "allElements",
		"computed": "computedColor",
		"order": "uniqueOrder",
		"alsoAppliesTo": [
			"::first-letter",
			"::first-line",
			"::placeholder"
		],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/text-decoration-color"
	},
	"text-decoration-line": {
		"syntax": "none | [ underline || overline || line-through || blink ] | spelling-error | grammar-error",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Text Decoration"],
		"initial": "none",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "orderOfAppearance",
		"alsoAppliesTo": [
			"::first-letter",
			"::first-line",
			"::placeholder"
		],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/text-decoration-line"
	},
	"text-decoration-skip": {
		"syntax": "none | [ objects || [ spaces | [ leading-spaces || trailing-spaces ] ] || edges || box-decoration ]",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Text Decoration"],
		"initial": "objects",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "orderOfAppearance",
		"status": "experimental",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/text-decoration-skip"
	},
	"text-decoration-skip-ink": {
		"syntax": "auto | all | none",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Text Decoration"],
		"initial": "auto",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "orderOfAppearance",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/text-decoration-skip-ink"
	},
	"text-decoration-style": {
		"syntax": "solid | double | dotted | dashed | wavy",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Text Decoration"],
		"initial": "solid",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"alsoAppliesTo": [
			"::first-letter",
			"::first-line",
			"::placeholder"
		],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/text-decoration-style"
	},
	"text-decoration-thickness": {
		"syntax": "auto | from-font | <length> | <percentage> ",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "referToElementFontSize",
		"groups": ["CSS Text Decoration"],
		"initial": "auto",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"alsoAppliesTo": [
			"::first-letter",
			"::first-line",
			"::placeholder"
		],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/text-decoration-thickness"
	},
	"text-emphasis": {
		"syntax": "<'text-emphasis-style'> || <'text-emphasis-color'>",
		"media": "visual",
		"inherited": true,
		"animationType": ["text-emphasis-color", "text-emphasis-style"],
		"percentages": "no",
		"groups": ["CSS Text Decoration"],
		"initial": ["text-emphasis-style", "text-emphasis-color"],
		"appliesto": "allElements",
		"computed": ["text-emphasis-style", "text-emphasis-color"],
		"order": "orderOfAppearance",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/text-emphasis"
	},
	"text-emphasis-color": {
		"syntax": "<color>",
		"media": "visual",
		"inherited": true,
		"animationType": "color",
		"percentages": "no",
		"groups": ["CSS Text Decoration"],
		"initial": "currentcolor",
		"appliesto": "allElements",
		"computed": "computedColor",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/text-emphasis-color"
	},
	"text-emphasis-position": {
		"syntax": "auto | [ over | under ] && [ right | left ]?",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Text Decoration"],
		"initial": "auto",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/text-emphasis-position"
	},
	"text-emphasis-style": {
		"syntax": "none | [ [ filled | open ] || [ dot | circle | double-circle | triangle | sesame ] ] | <string>",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Text Decoration"],
		"initial": "none",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/text-emphasis-style"
	},
	"text-indent": {
		"syntax": "<length-percentage> && hanging? && each-line?",
		"media": "visual",
		"inherited": true,
		"animationType": "lpc",
		"percentages": "referToWidthOfContainingBlock",
		"groups": ["CSS Text"],
		"initial": "0",
		"appliesto": "blockContainers",
		"computed": "percentageOrAbsoluteLengthPlusKeywords",
		"order": "lengthOrPercentageBeforeKeywords",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/text-indent"
	},
	"text-justify": {
		"syntax": "auto | inter-character | inter-word | none",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Text"],
		"initial": "auto",
		"appliesto": "inlineLevelAndTableCellElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/text-justify"
	},
	"text-orientation": {
		"syntax": "mixed | upright | sideways",
		"media": "visual",
		"inherited": true,
		"animationType": "notAnimatable",
		"percentages": "no",
		"groups": ["CSS Writing Modes"],
		"initial": "mixed",
		"appliesto": "allElementsExceptTableRowGroupsRowsColumnGroupsAndColumns",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/text-orientation"
	},
	"text-overflow": {
		"syntax": "[ clip | ellipsis | <string> ]{1,2}",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Basic User Interface"],
		"initial": "clip",
		"appliesto": "blockContainerElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"alsoAppliesTo": ["::placeholder"],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/text-overflow"
	},
	"text-rendering": {
		"syntax": "auto | optimizeSpeed | optimizeLegibility | geometricPrecision",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Miscellaneous"],
		"initial": "auto",
		"appliesto": "textElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/text-rendering"
	},
	"text-shadow": {
		"syntax": "none | <shadow-t>#",
		"media": "visual",
		"inherited": true,
		"animationType": "shadowList",
		"percentages": "no",
		"groups": ["CSS Text Decoration"],
		"initial": "none",
		"appliesto": "allElements",
		"computed": "colorPlusThreeAbsoluteLengths",
		"order": "uniqueOrder",
		"alsoAppliesTo": [
			"::first-letter",
			"::first-line",
			"::placeholder"
		],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/text-shadow"
	},
	"text-size-adjust": {
		"syntax": "none | auto | <percentage>",
		"media": "visual",
		"inherited": true,
		"animationType": "byComputedValueType",
		"percentages": "referToSizeOfFont",
		"groups": ["CSS Text"],
		"initial": "autoForSmartphoneBrowsersSupportingInflation",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "experimental",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/text-size-adjust"
	},
	"text-spacing-trim": {
		"syntax": "space-all | normal | space-first | trim-start | trim-both | trim-all | auto",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Text"],
		"initial": "normal",
		"appliesto": "textElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "experimental",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/text-spacing-trim"
	},
	"text-transform": {
		"syntax": "none | capitalize | uppercase | lowercase | full-width | full-size-kana",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Text"],
		"initial": "none",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"alsoAppliesTo": [
			"::first-letter",
			"::first-line",
			"::placeholder"
		],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/text-transform"
	},
	"text-underline-offset": {
		"syntax": "auto | <length> | <percentage> ",
		"media": "visual",
		"inherited": true,
		"animationType": "byComputedValueType",
		"percentages": "referToElementFontSize",
		"groups": ["CSS Text Decoration"],
		"initial": "auto",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"alsoAppliesTo": [
			"::first-letter",
			"::first-line",
			"::placeholder"
		],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/text-underline-offset"
	},
	"text-underline-position": {
		"syntax": "auto | from-font | [ under || [ left | right ] ]",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Text Decoration"],
		"initial": "auto",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "orderOfAppearance",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/text-underline-position"
	},
	"text-wrap": {
		"syntax": "<'text-wrap-mode> || <'text-wrap-style'>",
		"media": "visual",
		"inherited": true,
		"animationType": ["text-wrap-mode", "text-wrap-style"],
		"percentages": "no",
		"groups": ["CSS Text"],
		"initial": "wrap",
		"appliesto": "textAndBlockContainers",
		"computed": ["text-wrap-mode", "text-wrap-style"],
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/text-wrap"
	},
	"text-wrap-mode": {
		"syntax": "auto | wrap | nowrap",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Text"],
		"initial": "wrap",
		"appliesto": "textAndBlockContainers",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/text-wrap-mode"
	},
	"text-wrap-style": {
		"syntax": "auto | balance | stable | pretty",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Text"],
		"initial": "auto",
		"appliesto": "textAndBlockContainers",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/text-wrap-style"
	},
	"timeline-scope": {
		"syntax": "none | <dashed-ident>#",
		"media": "interactive",
		"inherited": false,
		"animationType": "notAnimatable",
		"percentages": "no",
		"groups": ["CSS Animations"],
		"initial": "none",
		"appliesto": "allElements",
		"computed": "noneOrOrderedListOfIdentifiers",
		"order": "perGrammar",
		"status": "experimental",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/timeline-scope"
	},
	"top": {
		"syntax": "<length> | <percentage> | auto",
		"media": "visual",
		"inherited": false,
		"animationType": "lpc",
		"percentages": "referToContainingBlockHeight",
		"groups": ["CSS Positioning"],
		"initial": "auto",
		"appliesto": "positionedElements",
		"computed": "lengthAbsolutePercentageAsSpecifiedOtherwiseAuto",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/top"
	},
	"touch-action": {
		"syntax": "auto | none | [ [ pan-x | pan-left | pan-right ] || [ pan-y | pan-up | pan-down ] || pinch-zoom ] | manipulation",
		"media": "visual",
		"inherited": false,
		"animationType": "notAnimatable",
		"percentages": "no",
		"groups": ["Pointer Events"],
		"initial": "auto",
		"appliesto": "allElementsExceptNonReplacedInlineElementsTableRowsColumnsRowColumnGroups",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/touch-action"
	},
	"transform": {
		"syntax": "none | <transform-list>",
		"media": "visual",
		"inherited": false,
		"animationType": "transform",
		"percentages": "referToSizeOfBoundingBox",
		"groups": ["CSS Transforms"],
		"initial": "none",
		"appliesto": "transformableElements",
		"computed": "asSpecifiedRelativeToAbsoluteLengths",
		"order": "uniqueOrder",
		"stacking": true,
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/transform"
	},
	"transform-box": {
		"syntax": "content-box | border-box | fill-box | stroke-box | view-box",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Transforms"],
		"initial": "view-box",
		"appliesto": "transformableElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/transform-box"
	},
	"transform-origin": {
		"syntax": "[ <length-percentage> | left | center | right | top | bottom ] | [ [ <length-percentage> | left | center | right ] && [ <length-percentage> | top | center | bottom ] ] <length>?",
		"media": "visual",
		"inherited": false,
		"animationType": "simpleListOfLpc",
		"percentages": "referToSizeOfBoundingBox",
		"groups": ["CSS Transforms"],
		"initial": "50% 50% 0",
		"appliesto": "transformableElements",
		"computed": "forLengthAbsoluteValueOtherwisePercentage",
		"order": "oneOrTwoValuesLengthAbsoluteKeywordsPercentages",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/transform-origin"
	},
	"transform-style": {
		"syntax": "flat | preserve-3d",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Transforms"],
		"initial": "flat",
		"appliesto": "transformableElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"stacking": true,
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/transform-style"
	},
	"transition": {
		"syntax": "<single-transition>#",
		"media": "interactive",
		"inherited": false,
		"animationType": "notAnimatable",
		"percentages": "no",
		"groups": ["CSS Transitions"],
		"initial": [
			"transition-delay",
			"transition-duration",
			"transition-property",
			"transition-timing-function",
			"transition-behavior"
		],
		"appliesto": "allElementsAndPseudos",
		"computed": [
			"transition-delay",
			"transition-duration",
			"transition-property",
			"transition-timing-function",
			"transition-behavior"
		],
		"order": "orderOfAppearance",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/transition"
	},
	"transition-behavior": {
		"syntax": "<transition-behavior-value>#",
		"media": "visual",
		"inherited": false,
		"animationType": "notAnimatable",
		"percentages": "no",
		"groups": ["CSS Transitions"],
		"initial": "normal",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "experimental",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/transition-behavior"
	},
	"transition-delay": {
		"syntax": "<time>#",
		"media": "interactive",
		"inherited": false,
		"animationType": "notAnimatable",
		"percentages": "no",
		"groups": ["CSS Transitions"],
		"initial": "0s",
		"appliesto": "allElementsAndPseudos",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/transition-delay"
	},
	"transition-duration": {
		"syntax": "<time>#",
		"media": "interactive",
		"inherited": false,
		"animationType": "notAnimatable",
		"percentages": "no",
		"groups": ["CSS Transitions"],
		"initial": "0s",
		"appliesto": "allElementsAndPseudos",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/transition-duration"
	},
	"transition-property": {
		"syntax": "none | <single-transition-property>#",
		"media": "visual",
		"inherited": false,
		"animationType": "notAnimatable",
		"percentages": "no",
		"groups": ["CSS Transitions"],
		"initial": "all",
		"appliesto": "allElementsAndPseudos",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/transition-property"
	},
	"transition-timing-function": {
		"syntax": "<easing-function>#",
		"media": "interactive",
		"inherited": false,
		"animationType": "notAnimatable",
		"percentages": "no",
		"groups": ["CSS Transitions"],
		"initial": "ease",
		"appliesto": "allElementsAndPseudos",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/transition-timing-function"
	},
	"translate": {
		"syntax": "none | <length-percentage> [ <length-percentage> <length>? ]?",
		"media": "visual",
		"inherited": false,
		"animationType": "transform",
		"percentages": "referToSizeOfBoundingBox",
		"groups": ["CSS Transforms"],
		"initial": "none",
		"appliesto": "transformableElements",
		"computed": "asSpecifiedRelativeToAbsoluteLengths",
		"order": "perGrammar",
		"stacking": true,
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/translate"
	},
	"unicode-bidi": {
		"syntax": "normal | embed | isolate | bidi-override | isolate-override | plaintext",
		"media": "visual",
		"inherited": false,
		"animationType": "notAnimatable",
		"percentages": "no",
		"groups": ["CSS Writing Modes"],
		"initial": "normal",
		"appliesto": "allElementsSomeValuesNoEffectOnNonInlineElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/unicode-bidi"
	},
	"user-select": {
		"syntax": "auto | text | none | contain | all",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Basic User Interface"],
		"initial": "auto",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/user-select"
	},
	"vector-effect": {
		"syntax": "none | non-scaling-stroke | non-scaling-size | non-rotation | fixed-position",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["Scalable Vector Graphics"],
		"initial": "none",
		"appliesto": "limitedSVGElementsGraphicsAndUse",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/vector-effect"
	},
	"vertical-align": {
		"syntax": "baseline | sub | super | text-top | text-bottom | middle | top | bottom | <percentage> | <length>",
		"media": "visual",
		"inherited": false,
		"animationType": "length",
		"percentages": "referToLineHeight",
		"groups": ["CSS Table"],
		"initial": "baseline",
		"appliesto": "inlineLevelAndTableCellElements",
		"computed": "absoluteLengthOrKeyword",
		"order": "uniqueOrder",
		"alsoAppliesTo": [
			"::first-letter",
			"::first-line",
			"::placeholder"
		],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/vertical-align"
	},
	"view-timeline": {
		"syntax": "[ <'view-timeline-name'> <'view-timeline-axis'>? ]#",
		"media": "visual",
		"inherited": false,
		"animationType": ["view-timeline-name", "view-timeline-axis"],
		"percentages": "no",
		"groups": ["CSS Animations"],
		"initial": ["view-timeline-name", "view-timeline-axis"],
		"appliesto": "allElements",
		"computed": ["view-timeline-name", "view-timeline-axis"],
		"order": "perGrammar",
		"status": "experimental",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/view-timeline"
	},
	"view-timeline-axis": {
		"syntax": "[ block | inline | x | y ]#",
		"media": "interactive",
		"inherited": false,
		"animationType": "notAnimatable",
		"percentages": "no",
		"groups": ["CSS Animations"],
		"initial": "block",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "experimental",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/view-timeline-axis"
	},
	"view-timeline-inset": {
		"syntax": "[ [ auto | <length-percentage> ]{1,2} ]#",
		"media": "interactive",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "relativeToCorrespondingDimensionOfRelevantScrollport",
		"groups": ["CSS Animations"],
		"initial": "auto",
		"appliesto": "allElements",
		"computed": "listEachItemConsistingOfPairsOfAutoOrLengthPercentage",
		"order": "perGrammar",
		"status": "experimental",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/view-timeline-inset"
	},
	"view-timeline-name": {
		"syntax": "none | <dashed-ident>#",
		"media": "interactive",
		"inherited": false,
		"animationType": "notAnimatable",
		"percentages": "no",
		"groups": ["CSS Animations"],
		"initial": "none",
		"appliesto": "allElements",
		"computed": "noneOrOrderedListOfIdentifiers",
		"order": "perGrammar",
		"status": "experimental",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/view-timeline-name"
	},
	"view-transition-name": {
		"syntax": "none | <custom-ident>",
		"media": "visual",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS View Transitions"],
		"initial": "none",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "experimental",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/view-transition-name"
	},
	"visibility": {
		"syntax": "visible | hidden | collapse",
		"media": "visual",
		"inherited": true,
		"animationType": "visibility",
		"percentages": "no",
		"groups": ["CSS Box Model"],
		"initial": "visible",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/visibility"
	},
	"white-space": {
		"syntax": "normal | pre | nowrap | pre-wrap | pre-line | break-spaces | [ <'white-space-collapse'> || <'text-wrap'> || <'white-space-trim'> ]",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Text"],
		"initial": "normal",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/white-space"
	},
	"white-space-collapse": {
		"syntax": "collapse | discard | preserve | preserve-breaks | preserve-spaces | break-spaces",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Text"],
		"initial": "collapse",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/white-space-collapse"
	},
	"widows": {
		"syntax": "<integer>",
		"media": "visual",
		"inherited": true,
		"animationType": "byComputedValueType",
		"percentages": "no",
		"groups": ["CSS Fragmentation"],
		"initial": "2",
		"appliesto": "blockContainerElements",
		"computed": "asSpecified",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/widows"
	},
	"width": {
		"syntax": "auto | <length> | <percentage> | min-content | max-content | fit-content | fit-content(<length-percentage>)",
		"media": "visual",
		"inherited": false,
		"animationType": "lpc",
		"percentages": "referToWidthOfContainingBlock",
		"groups": ["CSS Box Model"],
		"initial": "auto",
		"appliesto": "allElementsButNonReplacedAndTableRows",
		"computed": "percentageAutoOrAbsoluteLength",
		"order": "lengthOrPercentageBeforeKeywordIfBothPresent",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/width"
	},
	"will-change": {
		"syntax": "auto | <animateable-feature>#",
		"media": "all",
		"inherited": false,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Will Change"],
		"initial": "auto",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/will-change"
	},
	"word-break": {
		"syntax": "normal | break-all | keep-all | break-word",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Text"],
		"initial": "normal",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/word-break"
	},
	"word-spacing": {
		"syntax": "normal | <length>",
		"media": "visual",
		"inherited": true,
		"animationType": "length",
		"percentages": "referToWidthOfAffectedGlyph",
		"groups": ["CSS Text"],
		"initial": "normal",
		"appliesto": "allElements",
		"computed": "absoluteLength",
		"order": "uniqueOrder",
		"alsoAppliesTo": [
			"::first-letter",
			"::first-line",
			"::placeholder"
		],
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/word-spacing"
	},
	"word-wrap": {
		"syntax": "normal | break-word",
		"media": "visual",
		"inherited": true,
		"animationType": "discrete",
		"percentages": "no",
		"groups": ["CSS Text"],
		"initial": "normal",
		"appliesto": "nonReplacedInlineElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/overflow-wrap"
	},
	"writing-mode": {
		"syntax": "horizontal-tb | vertical-rl | vertical-lr | sideways-rl | sideways-lr",
		"media": "visual",
		"inherited": true,
		"animationType": "notAnimatable",
		"percentages": "no",
		"groups": ["CSS Writing Modes"],
		"initial": "horizontal-tb",
		"appliesto": "allElementsExceptTableRowColumnGroupsTableRowsColumns",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/writing-mode"
	},
	"x": {
		"syntax": "<length> | <percentage>",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "referToSVGViewportWidth",
		"groups": ["Scalable Vector Graphics"],
		"initial": "0",
		"appliesto": "limitedSVGElementsGeometry",
		"computed": "percentageAsSpecifiedOrAbsoluteLength",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/x"
	},
	"y": {
		"syntax": "<length> | <percentage>",
		"media": "visual",
		"inherited": false,
		"animationType": "byComputedValueType",
		"percentages": "referToSVGViewportHeight",
		"groups": ["Scalable Vector Graphics"],
		"initial": "0",
		"appliesto": "limitedSVGElementsGeometry",
		"computed": "percentageAsSpecifiedOrAbsoluteLength",
		"order": "perGrammar",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/y"
	},
	"z-index": {
		"syntax": "auto | <integer>",
		"media": "visual",
		"inherited": false,
		"animationType": "integer",
		"percentages": "no",
		"groups": ["CSS Positioning"],
		"initial": "auto",
		"appliesto": "positionedElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"stacking": true,
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/z-index"
	},
	"zoom": {
		"syntax": "normal | reset | <number> | <percentage>",
		"media": "visual",
		"inherited": false,
		"animationType": "notAnimatable",
		"percentages": "no",
		"groups": ["Microsoft Extensions"],
		"initial": "normal",
		"appliesto": "allElements",
		"computed": "asSpecified",
		"order": "uniqueOrder",
		"status": "standard",
		"mdn_url": "https://developer.mozilla.org/docs/Web/CSS/zoom"
	}
};
const mdnSyntaxes = {
	"abs()": { "syntax": "abs( <calc-sum> )" },
	"absolute-size": { "syntax": "xx-small | x-small | small | medium | large | x-large | xx-large | xxx-large" },
	"acos()": { "syntax": "acos( <calc-sum> )" },
	"alpha-value": { "syntax": "<number> | <percentage>" },
	"angle-percentage": { "syntax": "<angle> | <percentage>" },
	"angular-color-hint": { "syntax": "<angle-percentage>" },
	"angular-color-stop": { "syntax": "<color> && <color-stop-angle>?" },
	"angular-color-stop-list": { "syntax": "[ <angular-color-stop> [, <angular-color-hint>]? ]# , <angular-color-stop>" },
	"animateable-feature": { "syntax": "scroll-position | contents | <custom-ident>" },
	"asin()": { "syntax": "asin( <calc-sum> )" },
	"atan()": { "syntax": "atan( <calc-sum> )" },
	"atan2()": { "syntax": "atan2( <calc-sum>, <calc-sum> )" },
	"attachment": { "syntax": "scroll | fixed | local" },
	"attr()": { "syntax": "attr( <attr-name> <type-or-unit>? [, <attr-fallback> ]? )" },
	"attr-matcher": { "syntax": "[ '~' | '|' | '^' | '$' | '*' ]? '='" },
	"attr-modifier": { "syntax": "i | s" },
	"attribute-selector": { "syntax": "'[' <wq-name> ']' | '[' <wq-name> <attr-matcher> [ <string-token> | <ident-token> ] <attr-modifier>? ']'" },
	"auto-repeat": { "syntax": "repeat( [ auto-fill | auto-fit ] , [ <line-names>? <fixed-size> ]+ <line-names>? )" },
	"auto-track-list": { "syntax": "[ <line-names>? [ <fixed-size> | <fixed-repeat> ] ]* <line-names>? <auto-repeat>\n[ <line-names>? [ <fixed-size> | <fixed-repeat> ] ]* <line-names>?" },
	"axis": { "syntax": "block | inline | x | y" },
	"baseline-position": { "syntax": "[ first | last ]? baseline" },
	"basic-shape": { "syntax": "<inset()> | <circle()> | <ellipse()> | <polygon()> | <path()>" },
	"bg-image": { "syntax": "none | <image>" },
	"bg-layer": { "syntax": "<bg-image> || <bg-position> [ / <bg-size> ]? || <repeat-style> || <attachment> || <box> || <box>" },
	"bg-position": { "syntax": "[ [ left | center | right | top | bottom | <length-percentage> ] | [ left | center | right | <length-percentage> ] [ top | center | bottom | <length-percentage> ] | [ center | [ left | right ] <length-percentage>? ] && [ center | [ top | bottom ] <length-percentage>? ] ]" },
	"bg-size": { "syntax": "[ <length-percentage> | auto ]{1,2} | cover | contain" },
	"blur()": { "syntax": "blur( <length> )" },
	"blend-mode": { "syntax": "normal | multiply | screen | overlay | darken | lighten | color-dodge | color-burn | hard-light | soft-light | difference | exclusion | hue | saturation | color | luminosity" },
	"box": { "syntax": "border-box | padding-box | content-box" },
	"brightness()": { "syntax": "brightness( <number-percentage> )" },
	"calc()": { "syntax": "calc( <calc-sum> )" },
	"calc-sum": { "syntax": "<calc-product> [ [ '+' | '-' ] <calc-product> ]*" },
	"calc-product": { "syntax": "<calc-value> [ '*' <calc-value> | '/' <number> ]*" },
	"calc-value": { "syntax": "<number> | <dimension> | <percentage> | <calc-constant> | ( <calc-sum> )" },
	"calc-constant": { "syntax": "e | pi | infinity | -infinity | NaN" },
	"cf-final-image": { "syntax": "<image> | <color>" },
	"cf-mixing-image": { "syntax": "<percentage>? && <image>" },
	"circle()": { "syntax": "circle( [ <shape-radius> ]? [ at <position> ]? )" },
	"clamp()": { "syntax": "clamp( <calc-sum>#{3} )" },
	"class-selector": { "syntax": "'.' <ident-token>" },
	"clip-source": { "syntax": "<url>" },
	"color": { "syntax": "<rgb()> | <rgba()> | <hsl()> | <hsla()> | <hwb()> | <lab()> | <lch()> | <oklab()> | <oklch()> | <color()> | <hex-color> | <named-color> | <system-color> | <deprecated-system-color> | currentcolor | transparent" },
	"color-stop": { "syntax": "<color-stop-length> | <color-stop-angle>" },
	"color-stop-angle": { "syntax": "<angle-percentage>{1,2}" },
	"color-stop-length": { "syntax": "<length-percentage>{1,2}" },
	"color-stop-list": { "syntax": "[ <linear-color-stop> [, <linear-color-hint>]? ]# , <linear-color-stop>" },
	"color-interpolation-method": { "syntax": "in [ <rectangular-color-space> | <polar-color-space> <hue-interpolation-method>? ]" },
	"combinator": { "syntax": "'>' | '+' | '~' | [ '||' ]" },
	"common-lig-values": { "syntax": "[ common-ligatures | no-common-ligatures ]" },
	"compat-auto": { "syntax": "searchfield | textarea | push-button | slider-horizontal | checkbox | radio | square-button | menulist | listbox | meter | progress-bar | button" },
	"composite-style": { "syntax": "clear | copy | source-over | source-in | source-out | source-atop | destination-over | destination-in | destination-out | destination-atop | xor" },
	"compositing-operator": { "syntax": "add | subtract | intersect | exclude" },
	"compound-selector": { "syntax": "[ <type-selector>? <subclass-selector>* [ <pseudo-element-selector> <pseudo-class-selector>* ]* ]!" },
	"compound-selector-list": { "syntax": "<compound-selector>#" },
	"complex-selector": { "syntax": "<compound-selector> [ <combinator>? <compound-selector> ]*" },
	"complex-selector-list": { "syntax": "<complex-selector>#" },
	"conic-gradient()": { "syntax": "conic-gradient( [ from <angle> ]? [ at <position> ]?, <angular-color-stop-list> )" },
	"contextual-alt-values": { "syntax": "[ contextual | no-contextual ]" },
	"content-distribution": { "syntax": "space-between | space-around | space-evenly | stretch" },
	"content-list": { "syntax": "[ <string> | contents | <image> | <counter> | <quote> | <target> | <leader()> ]+" },
	"content-position": { "syntax": "center | start | end | flex-start | flex-end" },
	"content-replacement": { "syntax": "<image>" },
	"contrast()": { "syntax": "contrast( [ <number-percentage> ] )" },
	"cos()": { "syntax": "cos( <calc-sum> )" },
	"counter": { "syntax": "<counter()> | <counters()>" },
	"counter()": { "syntax": "counter( <counter-name>, <counter-style>? )" },
	"counter-name": { "syntax": "<custom-ident>" },
	"counter-style": { "syntax": "<counter-style-name> | symbols()" },
	"counter-style-name": { "syntax": "<custom-ident>" },
	"counters()": { "syntax": "counters( <counter-name>, <string>, <counter-style>? )" },
	"cross-fade()": { "syntax": "cross-fade( <cf-mixing-image> , <cf-final-image>? )" },
	"cubic-bezier-timing-function": { "syntax": "ease | ease-in | ease-out | ease-in-out | cubic-bezier(<number [0,1]>, <number>, <number [0,1]>, <number>)" },
	"deprecated-system-color": { "syntax": "ActiveBorder | ActiveCaption | AppWorkspace | Background | ButtonFace | ButtonHighlight | ButtonShadow | ButtonText | CaptionText | GrayText | Highlight | HighlightText | InactiveBorder | InactiveCaption | InactiveCaptionText | InfoBackground | InfoText | Menu | MenuText | Scrollbar | ThreeDDarkShadow | ThreeDFace | ThreeDHighlight | ThreeDLightShadow | ThreeDShadow | Window | WindowFrame | WindowText" },
	"discretionary-lig-values": { "syntax": "[ discretionary-ligatures | no-discretionary-ligatures ]" },
	"display-box": { "syntax": "contents | none" },
	"display-inside": { "syntax": "flow | flow-root | table | flex | grid | ruby" },
	"display-internal": { "syntax": "table-row-group | table-header-group | table-footer-group | table-row | table-cell | table-column-group | table-column | table-caption | ruby-base | ruby-text | ruby-base-container | ruby-text-container" },
	"display-legacy": { "syntax": "inline-block | inline-list-item | inline-table | inline-flex | inline-grid" },
	"display-listitem": { "syntax": "<display-outside>? && [ flow | flow-root ]? && list-item" },
	"display-outside": { "syntax": "block | inline | run-in" },
	"drop-shadow()": { "syntax": "drop-shadow( <length>{2,3} <color>? )" },
	"east-asian-variant-values": { "syntax": "[ jis78 | jis83 | jis90 | jis04 | simplified | traditional ]" },
	"east-asian-width-values": { "syntax": "[ full-width | proportional-width ]" },
	"element()": { "syntax": "element( <id-selector> )" },
	"ellipse()": { "syntax": "ellipse( [ <shape-radius>{2} ]? [ at <position> ]? )" },
	"ending-shape": { "syntax": "circle | ellipse" },
	"env()": { "syntax": "env( <custom-ident> , <declaration-value>? )" },
	"exp()": { "syntax": "exp( <calc-sum> )" },
	"explicit-track-list": { "syntax": "[ <line-names>? <track-size> ]+ <line-names>?" },
	"family-name": { "syntax": "<string> | <custom-ident>+" },
	"feature-tag-value": { "syntax": "<string> [ <integer> | on | off ]?" },
	"feature-type": { "syntax": "@stylistic | @historical-forms | @styleset | @character-variant | @swash | @ornaments | @annotation" },
	"feature-value-block": { "syntax": "<feature-type> '{' <feature-value-declaration-list> '}'" },
	"feature-value-block-list": { "syntax": "<feature-value-block>+" },
	"feature-value-declaration": { "syntax": "<custom-ident>: <integer>+;" },
	"feature-value-declaration-list": { "syntax": "<feature-value-declaration>" },
	"feature-value-name": { "syntax": "<custom-ident>" },
	"fill-rule": { "syntax": "nonzero | evenodd" },
	"filter-function": { "syntax": "<blur()> | <brightness()> | <contrast()> | <drop-shadow()> | <grayscale()> | <hue-rotate()> | <invert()> | <opacity()> | <saturate()> | <sepia()>" },
	"filter-function-list": { "syntax": "[ <filter-function> | <url> ]+" },
	"final-bg-layer": { "syntax": "<'background-color'> || <bg-image> || <bg-position> [ / <bg-size> ]? || <repeat-style> || <attachment> || <box> || <box>" },
	"fixed-breadth": { "syntax": "<length-percentage>" },
	"fixed-repeat": { "syntax": "repeat( [ <integer [1,∞]> ] , [ <line-names>? <fixed-size> ]+ <line-names>? )" },
	"fixed-size": { "syntax": "<fixed-breadth> | minmax( <fixed-breadth> , <track-breadth> ) | minmax( <inflexible-breadth> , <fixed-breadth> )" },
	"font-stretch-absolute": { "syntax": "normal | ultra-condensed | extra-condensed | condensed | semi-condensed | semi-expanded | expanded | extra-expanded | ultra-expanded | <percentage>" },
	"font-variant-css21": { "syntax": "[ normal | small-caps ]" },
	"font-weight-absolute": { "syntax": "normal | bold | <number [1,1000]>" },
	"frequency-percentage": { "syntax": "<frequency> | <percentage>" },
	"general-enclosed": { "syntax": "[ <function-token> <any-value> ) ] | ( <ident> <any-value> )" },
	"generic-family": { "syntax": "serif | sans-serif | cursive | fantasy | monospace" },
	"generic-name": { "syntax": "serif | sans-serif | cursive | fantasy | monospace" },
	"geometry-box": { "syntax": "<shape-box> | fill-box | stroke-box | view-box" },
	"gradient": { "syntax": "<linear-gradient()> | <repeating-linear-gradient()> | <radial-gradient()> | <repeating-radial-gradient()> | <conic-gradient()> | <repeating-conic-gradient()>" },
	"grayscale()": { "syntax": "grayscale( <number-percentage> )" },
	"grid-line": { "syntax": "auto | <custom-ident> | [ <integer> && <custom-ident>? ] | [ span && [ <integer> || <custom-ident> ] ]" },
	"historical-lig-values": { "syntax": "[ historical-ligatures | no-historical-ligatures ]" },
	"hsl()": { "syntax": "hsl( <hue> <percentage> <percentage> [ / <alpha-value> ]? ) | hsl( <hue>, <percentage>, <percentage>, <alpha-value>? )" },
	"hsla()": { "syntax": "hsla( <hue> <percentage> <percentage> [ / <alpha-value> ]? ) | hsla( <hue>, <percentage>, <percentage>, <alpha-value>? )" },
	"hue": { "syntax": "<number> | <angle>" },
	"hue-rotate()": { "syntax": "hue-rotate( <angle> )" },
	"hue-interpolation-method": { "syntax": "[ shorter | longer | increasing | decreasing ] hue" },
	"hwb()": { "syntax": "hwb( [<hue> | none] [<percentage> | none] [<percentage> | none] [ / [<alpha-value> | none] ]? )" },
	"hypot()": { "syntax": "hypot( <calc-sum># )" },
	"id-selector": { "syntax": "<hash-token>" },
	"image": { "syntax": "<url> | <image()> | <image-set()> | <element()> | <paint()> | <cross-fade()> | <gradient>" },
	"image()": { "syntax": "image( <image-tags>? [ <image-src>? , <color>? ]! )" },
	"image-set()": { "syntax": "image-set( <image-set-option># )" },
	"image-set-option": { "syntax": "[ <image> | <string> ] [ <resolution> || type(<string>) ]" },
	"image-src": { "syntax": "<url> | <string>" },
	"image-tags": { "syntax": "ltr | rtl" },
	"inflexible-breadth": { "syntax": "<length-percentage> | min-content | max-content | auto" },
	"inset()": { "syntax": "inset( <length-percentage>{1,4} [ round <'border-radius'> ]? )" },
	"invert()": { "syntax": "invert( <number-percentage> )" },
	"keyframes-name": { "syntax": "<custom-ident> | <string>" },
	"keyframe-block": { "syntax": "<keyframe-selector># {\n  <declaration-list>\n}" },
	"keyframe-block-list": { "syntax": "<keyframe-block>+" },
	"keyframe-selector": { "syntax": "from | to | <percentage> | <timeline-range-name> <percentage>" },
	"lab()": { "syntax": "lab( [<percentage> | <number> | none] [ <percentage> | <number> | none] [ <percentage> | <number> | none] [ / [<alpha-value> | none] ]? )" },
	"layer()": { "syntax": "layer( <layer-name> )" },
	"layer-name": { "syntax": "<ident> [ '.' <ident> ]*" },
	"lch()": { "syntax": "lch( [<percentage> | <number> | none] [ <percentage> | <number> | none] [ <hue> | none] [ / [<alpha-value> | none] ]? )" },
	"leader()": { "syntax": "leader( <leader-type> )" },
	"leader-type": { "syntax": "dotted | solid | space | <string>" },
	"length-percentage": { "syntax": "<length> | <percentage>" },
	"light-dark()": { "syntax": "light-dark( <color>, <color> )" },
	"line-names": { "syntax": "'[' <custom-ident>* ']'" },
	"line-name-list": { "syntax": "[ <line-names> | <name-repeat> ]+" },
	"line-style": { "syntax": "none | hidden | dotted | dashed | solid | double | groove | ridge | inset | outset" },
	"line-width": { "syntax": "<length> | thin | medium | thick" },
	"linear-color-hint": { "syntax": "<length-percentage>" },
	"linear-color-stop": { "syntax": "<color> <color-stop-length>?" },
	"linear-gradient()": { "syntax": "linear-gradient( [ [ <angle> | to <side-or-corner> ] || <color-interpolation-method> ]? , <color-stop-list> )" },
	"log()": { "syntax": "log( <calc-sum>, <calc-sum>? )" },
	"mask-layer": { "syntax": "<mask-reference> || <position> [ / <bg-size> ]? || <repeat-style> || <geometry-box> || [ <geometry-box> | no-clip ] || <compositing-operator> || <masking-mode>" },
	"mask-position": { "syntax": "[ <length-percentage> | left | center | right ] [ <length-percentage> | top | center | bottom ]?" },
	"mask-reference": { "syntax": "none | <image> | <mask-source>" },
	"mask-source": { "syntax": "<url>" },
	"masking-mode": { "syntax": "alpha | luminance | match-source" },
	"matrix()": { "syntax": "matrix( <number>#{6} )" },
	"matrix3d()": { "syntax": "matrix3d( <number>#{16} )" },
	"max()": { "syntax": "max( <calc-sum># )" },
	"media-and": { "syntax": "<media-in-parens> [ and <media-in-parens> ]+" },
	"media-condition": { "syntax": "<media-not> | <media-and> | <media-or> | <media-in-parens>" },
	"media-condition-without-or": { "syntax": "<media-not> | <media-and> | <media-in-parens>" },
	"media-feature": { "syntax": "( [ <mf-plain> | <mf-boolean> | <mf-range> ] )" },
	"media-in-parens": { "syntax": "( <media-condition> ) | <media-feature> | <general-enclosed>" },
	"media-not": { "syntax": "not <media-in-parens>" },
	"media-or": { "syntax": "<media-in-parens> [ or <media-in-parens> ]+" },
	"media-query": { "syntax": "<media-condition> | [ not | only ]? <media-type> [ and <media-condition-without-or> ]?" },
	"media-query-list": { "syntax": "<media-query>#" },
	"media-type": { "syntax": "<ident>" },
	"mf-boolean": { "syntax": "<mf-name>" },
	"mf-name": { "syntax": "<ident>" },
	"mf-plain": { "syntax": "<mf-name> : <mf-value>" },
	"mf-range": { "syntax": "<mf-name> [ '<' | '>' ]? '='? <mf-value>\n| <mf-value> [ '<' | '>' ]? '='? <mf-name>\n| <mf-value> '<' '='? <mf-name> '<' '='? <mf-value>\n| <mf-value> '>' '='? <mf-name> '>' '='? <mf-value>" },
	"mf-value": { "syntax": "<number> | <dimension> | <ident> | <ratio>" },
	"min()": { "syntax": "min( <calc-sum># )" },
	"minmax()": { "syntax": "minmax( [ <length-percentage> | min-content | max-content | auto ] , [ <length-percentage> | <flex> | min-content | max-content | auto ] )" },
	"mod()": { "syntax": "mod( <calc-sum>, <calc-sum> )" },
	"name-repeat": { "syntax": "repeat( [ <integer [1,∞]> | auto-fill ], <line-names>+ )" },
	"named-color": { "syntax": "transparent | aliceblue | antiquewhite | aqua | aquamarine | azure | beige | bisque | black | blanchedalmond | blue | blueviolet | brown | burlywood | cadetblue | chartreuse | chocolate | coral | cornflowerblue | cornsilk | crimson | cyan | darkblue | darkcyan | darkgoldenrod | darkgray | darkgreen | darkgrey | darkkhaki | darkmagenta | darkolivegreen | darkorange | darkorchid | darkred | darksalmon | darkseagreen | darkslateblue | darkslategray | darkslategrey | darkturquoise | darkviolet | deeppink | deepskyblue | dimgray | dimgrey | dodgerblue | firebrick | floralwhite | forestgreen | fuchsia | gainsboro | ghostwhite | gold | goldenrod | gray | green | greenyellow | grey | honeydew | hotpink | indianred | indigo | ivory | khaki | lavender | lavenderblush | lawngreen | lemonchiffon | lightblue | lightcoral | lightcyan | lightgoldenrodyellow | lightgray | lightgreen | lightgrey | lightpink | lightsalmon | lightseagreen | lightskyblue | lightslategray | lightslategrey | lightsteelblue | lightyellow | lime | limegreen | linen | magenta | maroon | mediumaquamarine | mediumblue | mediumorchid | mediumpurple | mediumseagreen | mediumslateblue | mediumspringgreen | mediumturquoise | mediumvioletred | midnightblue | mintcream | mistyrose | moccasin | navajowhite | navy | oldlace | olive | olivedrab | orange | orangered | orchid | palegoldenrod | palegreen | paleturquoise | palevioletred | papayawhip | peachpuff | peru | pink | plum | powderblue | purple | rebeccapurple | red | rosybrown | royalblue | saddlebrown | salmon | sandybrown | seagreen | seashell | sienna | silver | skyblue | slateblue | slategray | slategrey | snow | springgreen | steelblue | tan | teal | thistle | tomato | turquoise | violet | wheat | white | whitesmoke | yellow | yellowgreen" },
	"namespace-prefix": { "syntax": "<ident>" },
	"ns-prefix": { "syntax": "[ <ident-token> | '*' ]? '|'" },
	"number-percentage": { "syntax": "<number> | <percentage>" },
	"numeric-figure-values": { "syntax": "[ lining-nums | oldstyle-nums ]" },
	"numeric-fraction-values": { "syntax": "[ diagonal-fractions | stacked-fractions ]" },
	"numeric-spacing-values": { "syntax": "[ proportional-nums | tabular-nums ]" },
	"nth": { "syntax": "<an-plus-b> | even | odd" },
	"opacity()": { "syntax": "opacity( [ <number-percentage> ] )" },
	"overflow-position": { "syntax": "unsafe | safe" },
	"outline-radius": { "syntax": "<length> | <percentage>" },
	"page-body": { "syntax": "<declaration>? [ ; <page-body> ]? | <page-margin-box> <page-body>" },
	"page-margin-box": { "syntax": "<page-margin-box-type> '{' <declaration-list> '}'" },
	"page-margin-box-type": { "syntax": "@top-left-corner | @top-left | @top-center | @top-right | @top-right-corner | @bottom-left-corner | @bottom-left | @bottom-center | @bottom-right | @bottom-right-corner | @left-top | @left-middle | @left-bottom | @right-top | @right-middle | @right-bottom" },
	"page-selector-list": { "syntax": "[ <page-selector># ]?" },
	"page-selector": { "syntax": "<pseudo-page>+ | <ident> <pseudo-page>*" },
	"page-size": { "syntax": "A5 | A4 | A3 | B5 | B4 | JIS-B5 | JIS-B4 | letter | legal | ledger" },
	"path()": { "syntax": "path( [ <fill-rule>, ]? <string> )" },
	"paint()": { "syntax": "paint( <ident>, <declaration-value>? )" },
	"perspective()": { "syntax": "perspective( [ <length [0,∞]> | none ] )" },
	"polygon()": { "syntax": "polygon( <fill-rule>? , [ <length-percentage> <length-percentage> ]# )" },
	"polar-color-space": { "syntax": "hsl | hwb | lch | oklch" },
	"position": { "syntax": "[ [ left | center | right ] || [ top | center | bottom ] | [ left | center | right | <length-percentage> ] [ top | center | bottom | <length-percentage> ]? | [ [ left | right ] <length-percentage> ] && [ [ top | bottom ] <length-percentage> ] ]" },
	"pow()": { "syntax": "pow( <calc-sum>, <calc-sum> )" },
	"pseudo-class-selector": { "syntax": "':' <ident-token> | ':' <function-token> <any-value> ')'" },
	"pseudo-element-selector": { "syntax": "':' <pseudo-class-selector>" },
	"pseudo-page": { "syntax": ": [ left | right | first | blank ]" },
	"quote": { "syntax": "open-quote | close-quote | no-open-quote | no-close-quote" },
	"radial-gradient()": { "syntax": "radial-gradient( [ <ending-shape> || <size> ]? [ at <position> ]? , <color-stop-list> )" },
	"ratio": { "syntax": "<number [0,∞]> [ / <number [0,∞]> ]?" },
	"ray()": { "syntax": "ray( <angle> && <ray-size>? && contain? && [at <position>]? )" },
	"ray-size": { "syntax": "closest-side | closest-corner | farthest-side | farthest-corner | sides" },
	"rectangular-color-space": { "syntax": "srgb | srgb-linear | display-p3 | a98-rgb | prophoto-rgb | rec2020 | lab | oklab | xyz | xyz-d50 | xyz-d65" },
	"relative-selector": { "syntax": "<combinator>? <complex-selector>" },
	"relative-selector-list": { "syntax": "<relative-selector>#" },
	"relative-size": { "syntax": "larger | smaller" },
	"rem()": { "syntax": "rem( <calc-sum>, <calc-sum> )" },
	"repeat-style": { "syntax": "repeat-x | repeat-y | [ repeat | space | round | no-repeat ]{1,2}" },
	"repeating-conic-gradient()": { "syntax": "repeating-conic-gradient( [ from <angle> ]? [ at <position> ]?, <angular-color-stop-list> )" },
	"repeating-linear-gradient()": { "syntax": "repeating-linear-gradient( [ <angle> | to <side-or-corner> ]? , <color-stop-list> )" },
	"repeating-radial-gradient()": { "syntax": "repeating-radial-gradient( [ <ending-shape> || <size> ]? [ at <position> ]? , <color-stop-list> )" },
	"reversed-counter-name": { "syntax": "reversed( <counter-name> )" },
	"rgb()": { "syntax": "rgb( <percentage>{3} [ / <alpha-value> ]? ) | rgb( <number>{3} [ / <alpha-value> ]? ) | rgb( <percentage>#{3} , <alpha-value>? ) | rgb( <number>#{3} , <alpha-value>? )" },
	"rgba()": { "syntax": "rgba( <percentage>{3} [ / <alpha-value> ]? ) | rgba( <number>{3} [ / <alpha-value> ]? ) | rgba( <percentage>#{3} , <alpha-value>? ) | rgba( <number>#{3} , <alpha-value>? )" },
	"rotate()": { "syntax": "rotate( [ <angle> | <zero> ] )" },
	"rotate3d()": { "syntax": "rotate3d( <number> , <number> , <number> , [ <angle> | <zero> ] )" },
	"rotateX()": { "syntax": "rotateX( [ <angle> | <zero> ] )" },
	"rotateY()": { "syntax": "rotateY( [ <angle> | <zero> ] )" },
	"rotateZ()": { "syntax": "rotateZ( [ <angle> | <zero> ] )" },
	"round()": { "syntax": "round( <rounding-strategy>?, <calc-sum>, <calc-sum> )" },
	"rounding-strategy": { "syntax": "nearest | up | down | to-zero" },
	"saturate()": { "syntax": "saturate( <number-percentage> )" },
	"scale()": { "syntax": "scale( [ <number> | <percentage> ]#{1,2} )" },
	"scale3d()": { "syntax": "scale3d( [ <number> | <percentage> ]#{3} )" },
	"scaleX()": { "syntax": "scaleX( [ <number> | <percentage> ] )" },
	"scaleY()": { "syntax": "scaleY( [ <number> | <percentage> ] )" },
	"scaleZ()": { "syntax": "scaleZ( [ <number> | <percentage> ] )" },
	"scroll()": { "syntax": "scroll( [ <axis> || <scroller> ]? )" },
	"scroller": { "syntax": "root | nearest | self" },
	"self-position": { "syntax": "center | start | end | self-start | self-end | flex-start | flex-end" },
	"shape-radius": { "syntax": "<length-percentage> | closest-side | farthest-side" },
	"sign()": { "syntax": "sign( <calc-sum> )" },
	"skew()": { "syntax": "skew( [ <angle> | <zero> ] , [ <angle> | <zero> ]? )" },
	"skewX()": { "syntax": "skewX( [ <angle> | <zero> ] )" },
	"skewY()": { "syntax": "skewY( [ <angle> | <zero> ] )" },
	"sepia()": { "syntax": "sepia( <number-percentage> )" },
	"shadow": { "syntax": "inset? && <length>{2,4} && <color>?" },
	"shadow-t": { "syntax": "[ <length>{2,3} && <color>? ]" },
	"shape": { "syntax": "rect(<top>, <right>, <bottom>, <left>)" },
	"shape-box": { "syntax": "<box> | margin-box" },
	"side-or-corner": { "syntax": "[ left | right ] || [ top | bottom ]" },
	"sin()": { "syntax": "sin( <calc-sum> )" },
	"single-animation": { "syntax": "<'animation-duration'> || <easing-function> || <'animation-delay'> || <single-animation-iteration-count> || <single-animation-direction> || <single-animation-fill-mode> || <single-animation-play-state> || [ none | <keyframes-name> ] || <single-animation-timeline>" },
	"single-animation-direction": { "syntax": "normal | reverse | alternate | alternate-reverse" },
	"single-animation-fill-mode": { "syntax": "none | forwards | backwards | both" },
	"single-animation-iteration-count": { "syntax": "infinite | <number>" },
	"single-animation-play-state": { "syntax": "running | paused" },
	"single-animation-timeline": { "syntax": "auto | none | <dashed-ident> | <scroll()> | <view()>" },
	"single-transition": { "syntax": "[ none | <single-transition-property> ] || <time> || <easing-function> || <time> || <transition-behavior-value>" },
	"single-transition-property": { "syntax": "all | <custom-ident>" },
	"size": { "syntax": "closest-side | farthest-side | closest-corner | farthest-corner | <length> | <length-percentage>{2}" },
	"sqrt()": { "syntax": "sqrt( <calc-sum> )" },
	"step-position": { "syntax": "jump-start | jump-end | jump-none | jump-both | start | end" },
	"step-timing-function": { "syntax": "step-start | step-end | steps(<integer>[, <step-position>]?)" },
	"subclass-selector": { "syntax": "<id-selector> | <class-selector> | <attribute-selector> | <pseudo-class-selector>" },
	"supports-condition": { "syntax": "not <supports-in-parens> | <supports-in-parens> [ and <supports-in-parens> ]* | <supports-in-parens> [ or <supports-in-parens> ]*" },
	"supports-in-parens": { "syntax": "( <supports-condition> ) | <supports-feature> | <general-enclosed>" },
	"supports-feature": { "syntax": "<supports-decl> | <supports-selector-fn>" },
	"supports-decl": { "syntax": "( <declaration> )" },
	"supports-selector-fn": { "syntax": "selector( <complex-selector> )" },
	"symbol": { "syntax": "<string> | <image> | <custom-ident>" },
	"system-color": { "syntax": "AccentColor | AccentColorText | ActiveText | ButtonBorder | ButtonFace | ButtonText | Canvas | CanvasText | Field | FieldText | GrayText | Highlight | HighlightText | LinkText | Mark | MarkText | SelectedItem | SelectedItemText | VisitedText" },
	"tan()": { "syntax": "tan( <calc-sum> )" },
	"target": { "syntax": "<target-counter()> | <target-counters()> | <target-text()>" },
	"target-counter()": { "syntax": "target-counter( [ <string> | <url> ] , <custom-ident> , <counter-style>? )" },
	"target-counters()": { "syntax": "target-counters( [ <string> | <url> ] , <custom-ident> , <string> , <counter-style>? )" },
	"target-text()": { "syntax": "target-text( [ <string> | <url> ] , [ content | before | after | first-letter ]? )" },
	"time-percentage": { "syntax": "<time> | <percentage>" },
	"timeline-range-name": { "syntax": "cover | contain | entry | exit | entry-crossing | exit-crossing" },
	"easing-function": { "syntax": "linear | <cubic-bezier-timing-function> | <step-timing-function>" },
	"track-breadth": { "syntax": "<length-percentage> | <flex> | min-content | max-content | auto" },
	"track-list": { "syntax": "[ <line-names>? [ <track-size> | <track-repeat> ] ]+ <line-names>?" },
	"track-repeat": { "syntax": "repeat( [ <integer [1,∞]> ] , [ <line-names>? <track-size> ]+ <line-names>? )" },
	"track-size": { "syntax": "<track-breadth> | minmax( <inflexible-breadth> , <track-breadth> ) | fit-content( <length-percentage> )" },
	"transform-function": { "syntax": "<matrix()> | <translate()> | <translateX()> | <translateY()> | <scale()> | <scaleX()> | <scaleY()> | <rotate()> | <skew()> | <skewX()> | <skewY()> | <matrix3d()> | <translate3d()> | <translateZ()> | <scale3d()> | <scaleZ()> | <rotate3d()> | <rotateX()> | <rotateY()> | <rotateZ()> | <perspective()>" },
	"transform-list": { "syntax": "<transform-function>+" },
	"transition-behavior-value": { "syntax": "normal | allow-discrete" },
	"translate()": { "syntax": "translate( <length-percentage> , <length-percentage>? )" },
	"translate3d()": { "syntax": "translate3d( <length-percentage> , <length-percentage> , <length> )" },
	"translateX()": { "syntax": "translateX( <length-percentage> )" },
	"translateY()": { "syntax": "translateY( <length-percentage> )" },
	"translateZ()": { "syntax": "translateZ( <length> )" },
	"type-or-unit": { "syntax": "string | color | url | integer | number | length | angle | time | frequency | cap | ch | em | ex | ic | lh | rlh | rem | vb | vi | vw | vh | vmin | vmax | mm | Q | cm | in | pt | pc | px | deg | grad | rad | turn | ms | s | Hz | kHz | %" },
	"type-selector": { "syntax": "<wq-name> | <ns-prefix>? '*'" },
	"var()": { "syntax": "var( <custom-property-name> , <declaration-value>? )" },
	"view()": { "syntax": "view([<axis> || <'view-timeline-inset'>]?)" },
	"viewport-length": { "syntax": "auto | <length-percentage>" },
	"visual-box": { "syntax": "content-box | padding-box | border-box" },
	"wq-name": { "syntax": "<ns-prefix>? <ident-token>" }
};
const hasOwn = Object.hasOwn || ((object, property$1) => Object.prototype.hasOwnProperty.call(object, property$1));
const extendSyntax = /^\s*\|\s*/;
function preprocessAtrules(dict) {
	const result = Object.create(null);
	for (const [atruleName, atrule] of Object.entries(dict)) {
		let descriptors = null;
		if (atrule.descriptors) {
			descriptors = Object.create(null);
			for (const [name$49, descriptor] of Object.entries(atrule.descriptors)) descriptors[name$49] = descriptor.syntax;
		}
		result[atruleName.substr(1)] = {
			prelude: atrule.syntax.trim().replace(/\{(.|\s)+\}/, "").match(/^@\S+\s+([^;\{]*)/)[1].trim() || null,
			descriptors
		};
	}
	return result;
}
function patchDictionary(dict, patchDict) {
	const result = Object.create(null);
	for (const [key, value] of Object.entries(dict)) if (value) result[key] = value.syntax || value;
	for (const key of Object.keys(patchDict)) if (hasOwn(dict, key)) if (patchDict[key].syntax) result[key] = extendSyntax.test(patchDict[key].syntax) ? result[key] + " " + patchDict[key].syntax.trim() : patchDict[key].syntax;
	else delete result[key];
	else if (patchDict[key].syntax) result[key] = patchDict[key].syntax.replace(extendSyntax, "");
	return result;
}
function preprocessPatchAtrulesDescritors(declarations) {
	const result = {};
	for (const [key, value] of Object.entries(declarations || {})) result[key] = typeof value === "string" ? { syntax: value } : value;
	return result;
}
function patchAtrules(dict, patchDict) {
	const result = {};
	for (const key in dict) {
		if (patchDict[key] === null) continue;
		const atrulePatch = patchDict[key] || {};
		result[key] = {
			prelude: key in patchDict && "prelude" in atrulePatch ? atrulePatch.prelude : dict[key].prelude || null,
			descriptors: patchDictionary(dict[key].descriptors || {}, preprocessPatchAtrulesDescritors(atrulePatch.descriptors))
		};
	}
	for (const [key, atrulePatch] of Object.entries(patchDict)) if (atrulePatch && !hasOwn(dict, key)) result[key] = {
		prelude: atrulePatch.prelude || null,
		descriptors: atrulePatch.descriptors ? patchDictionary({}, preprocessPatchAtrulesDescritors(atrulePatch.descriptors)) : null
	};
	return result;
}
var data_default = {
	types: patchDictionary(mdnSyntaxes, data_patch_default.types),
	atrules: patchAtrules(preprocessAtrules(mdnAtrules), data_patch_default.atrules),
	properties: patchDictionary(mdnProperties, data_patch_default.properties)
};

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/node/AnPlusB.js
var AnPlusB_exports = /* @__PURE__ */ __export({
	generate: () => generate$49,
	name: () => name$48,
	parse: () => parse$1,
	structure: () => structure$48
});
const PLUSSIGN$5 = 43;
const HYPHENMINUS$2 = 45;
const N = 110;
const DISALLOW_SIGN = true;
const ALLOW_SIGN = false;
function checkInteger(offset, disallowSign) {
	let pos = this.tokenStart + offset;
	const code$1 = this.charCodeAt(pos);
	if (code$1 === PLUSSIGN$5 || code$1 === HYPHENMINUS$2) {
		if (disallowSign) this.error("Number sign is not allowed");
		pos++;
	}
	for (; pos < this.tokenEnd; pos++) if (!isDigit(this.charCodeAt(pos))) this.error("Integer is expected", pos);
}
function checkTokenIsInteger(disallowSign) {
	return checkInteger.call(this, 0, disallowSign);
}
function expectCharCode(offset, code$1) {
	if (!this.cmpChar(this.tokenStart + offset, code$1)) {
		let msg = "";
		switch (code$1) {
			case N:
				msg = "N is expected";
				break;
			case HYPHENMINUS$2:
				msg = "HyphenMinus is expected";
				break;
		}
		this.error(msg, this.tokenStart + offset);
	}
}
function consumeB() {
	let offset = 0;
	let sign = 0;
	let type = this.tokenType;
	while (type === WhiteSpace || type === Comment) type = this.lookupType(++offset);
	if (type !== Number$1) if (this.isDelim(PLUSSIGN$5, offset) || this.isDelim(HYPHENMINUS$2, offset)) {
		sign = this.isDelim(PLUSSIGN$5, offset) ? PLUSSIGN$5 : HYPHENMINUS$2;
		do
			type = this.lookupType(++offset);
		while (type === WhiteSpace || type === Comment);
		if (type !== Number$1) {
			this.skip(offset);
			checkTokenIsInteger.call(this, DISALLOW_SIGN);
		}
	} else return null;
	if (offset > 0) this.skip(offset);
	if (sign === 0) {
		type = this.charCodeAt(this.tokenStart);
		if (type !== PLUSSIGN$5 && type !== HYPHENMINUS$2) this.error("Number sign is expected");
	}
	checkTokenIsInteger.call(this, sign !== 0);
	return sign === HYPHENMINUS$2 ? "-" + this.consume(Number$1) : this.consume(Number$1);
}
const name$48 = "AnPlusB";
const structure$48 = {
	a: [String, null],
	b: [String, null]
};
function parse$1() {
	const start = this.tokenStart;
	let a = null;
	let b = null;
	if (this.tokenType === Number$1) {
		checkTokenIsInteger.call(this, ALLOW_SIGN);
		b = this.consume(Number$1);
	} else if (this.tokenType === Ident && this.cmpChar(this.tokenStart, HYPHENMINUS$2)) {
		a = "-1";
		expectCharCode.call(this, 1, N);
		switch (this.tokenEnd - this.tokenStart) {
			case 2:
				this.next();
				b = consumeB.call(this);
				break;
			case 3:
				expectCharCode.call(this, 2, HYPHENMINUS$2);
				this.next();
				this.skipSC();
				checkTokenIsInteger.call(this, DISALLOW_SIGN);
				b = "-" + this.consume(Number$1);
				break;
			default:
				expectCharCode.call(this, 2, HYPHENMINUS$2);
				checkInteger.call(this, 3, DISALLOW_SIGN);
				this.next();
				b = this.substrToCursor(start + 2);
		}
	} else if (this.tokenType === Ident || this.isDelim(PLUSSIGN$5) && this.lookupType(1) === Ident) {
		let sign = 0;
		a = "1";
		if (this.isDelim(PLUSSIGN$5)) {
			sign = 1;
			this.next();
		}
		expectCharCode.call(this, 0, N);
		switch (this.tokenEnd - this.tokenStart) {
			case 1:
				this.next();
				b = consumeB.call(this);
				break;
			case 2:
				expectCharCode.call(this, 1, HYPHENMINUS$2);
				this.next();
				this.skipSC();
				checkTokenIsInteger.call(this, DISALLOW_SIGN);
				b = "-" + this.consume(Number$1);
				break;
			default:
				expectCharCode.call(this, 1, HYPHENMINUS$2);
				checkInteger.call(this, 2, DISALLOW_SIGN);
				this.next();
				b = this.substrToCursor(start + sign + 1);
		}
	} else if (this.tokenType === Dimension) {
		const code$1 = this.charCodeAt(this.tokenStart);
		const sign = code$1 === PLUSSIGN$5 || code$1 === HYPHENMINUS$2;
		let i = this.tokenStart + sign;
		for (; i < this.tokenEnd; i++) if (!isDigit(this.charCodeAt(i))) break;
		if (i === this.tokenStart + sign) this.error("Integer is expected", this.tokenStart + sign);
		expectCharCode.call(this, i - this.tokenStart, N);
		a = this.substring(start, i);
		if (i + 1 === this.tokenEnd) {
			this.next();
			b = consumeB.call(this);
		} else {
			expectCharCode.call(this, i - this.tokenStart + 1, HYPHENMINUS$2);
			if (i + 2 === this.tokenEnd) {
				this.next();
				this.skipSC();
				checkTokenIsInteger.call(this, DISALLOW_SIGN);
				b = "-" + this.consume(Number$1);
			} else {
				checkInteger.call(this, i - this.tokenStart + 2, DISALLOW_SIGN);
				this.next();
				b = this.substrToCursor(i + 1);
			}
		}
	} else this.error();
	if (a !== null && a.charCodeAt(0) === PLUSSIGN$5) a = a.substr(1);
	if (b !== null && b.charCodeAt(0) === PLUSSIGN$5) b = b.substr(1);
	return {
		type: "AnPlusB",
		loc: this.getLocation(start, this.tokenStart),
		a,
		b
	};
}
function generate$49(node) {
	if (node.a) {
		const a = node.a === "+1" && "n" || node.a === "1" && "n" || node.a === "-1" && "-n" || node.a + "n";
		if (node.b) {
			const b = node.b[0] === "-" || node.b[0] === "+" ? node.b : "+" + node.b;
			this.tokenize(a + b);
		} else this.tokenize(a);
	} else this.tokenize(node.b);
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/node/Atrule.js
var Atrule_exports = /* @__PURE__ */ __export({
	generate: () => generate$48,
	name: () => name$47,
	parse: () => parse$2,
	structure: () => structure$47,
	walkContext: () => walkContext$9
});
function consumeRaw$4() {
	return this.Raw(this.consumeUntilLeftCurlyBracketOrSemicolon, true);
}
function isDeclarationBlockAtrule() {
	for (let offset = 1, type; type = this.lookupType(offset); offset++) {
		if (type === RightCurlyBracket) return true;
		if (type === LeftCurlyBracket || type === AtKeyword) return false;
	}
	return false;
}
const name$47 = "Atrule";
const walkContext$9 = "atrule";
const structure$47 = {
	name: String,
	prelude: [
		"AtrulePrelude",
		"Raw",
		null
	],
	block: ["Block", null]
};
function parse$2(isDeclaration = false) {
	const start = this.tokenStart;
	let name$49;
	let nameLowerCase;
	let prelude = null;
	let block = null;
	this.eat(AtKeyword);
	name$49 = this.substrToCursor(start + 1);
	nameLowerCase = name$49.toLowerCase();
	this.skipSC();
	if (this.eof === false && this.tokenType !== LeftCurlyBracket && this.tokenType !== Semicolon) {
		if (this.parseAtrulePrelude) prelude = this.parseWithFallback(this.AtrulePrelude.bind(this, name$49, isDeclaration), consumeRaw$4);
		else prelude = consumeRaw$4.call(this, this.tokenIndex);
		this.skipSC();
	}
	switch (this.tokenType) {
		case Semicolon:
			this.next();
			break;
		case LeftCurlyBracket:
			if (hasOwnProperty.call(this.atrule, nameLowerCase) && typeof this.atrule[nameLowerCase].block === "function") block = this.atrule[nameLowerCase].block.call(this, isDeclaration);
			else block = this.Block(isDeclarationBlockAtrule.call(this));
			break;
	}
	return {
		type: "Atrule",
		loc: this.getLocation(start, this.tokenStart),
		name: name$49,
		prelude,
		block
	};
}
function generate$48(node) {
	this.token(AtKeyword, "@" + node.name);
	if (node.prelude !== null) this.node(node.prelude);
	if (node.block) this.node(node.block);
	else this.token(Semicolon, ";");
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/node/AtrulePrelude.js
var AtrulePrelude_exports = /* @__PURE__ */ __export({
	generate: () => generate$47,
	name: () => name$46,
	parse: () => parse$3,
	structure: () => structure$46,
	walkContext: () => walkContext$8
});
const name$46 = "AtrulePrelude";
const walkContext$8 = "atrulePrelude";
const structure$46 = { children: [[]] };
function parse$3(name$49) {
	let children = null;
	if (name$49 !== null) name$49 = name$49.toLowerCase();
	this.skipSC();
	if (hasOwnProperty.call(this.atrule, name$49) && typeof this.atrule[name$49].prelude === "function") children = this.atrule[name$49].prelude.call(this);
	else children = this.readSequence(this.scope.AtrulePrelude);
	this.skipSC();
	if (this.eof !== true && this.tokenType !== LeftCurlyBracket && this.tokenType !== Semicolon) this.error("Semicolon or block is expected");
	return {
		type: "AtrulePrelude",
		loc: this.getLocationFromList(children),
		children
	};
}
function generate$47(node) {
	this.children(node);
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/node/AttributeSelector.js
var AttributeSelector_exports = /* @__PURE__ */ __export({
	generate: () => generate$46,
	name: () => name$45,
	parse: () => parse$4,
	structure: () => structure$45
});
const DOLLARSIGN$1 = 36;
const ASTERISK$5 = 42;
const EQUALSSIGN$1 = 61;
const CIRCUMFLEXACCENT = 94;
const VERTICALLINE$2 = 124;
const TILDE$2 = 126;
function getAttributeName() {
	if (this.eof) this.error("Unexpected end of input");
	const start = this.tokenStart;
	let expectIdent = false;
	if (this.isDelim(ASTERISK$5)) {
		expectIdent = true;
		this.next();
	} else if (!this.isDelim(VERTICALLINE$2)) this.eat(Ident);
	if (this.isDelim(VERTICALLINE$2)) {
		if (this.charCodeAt(this.tokenStart + 1) !== EQUALSSIGN$1) {
			this.next();
			this.eat(Ident);
		} else if (expectIdent) this.error("Identifier is expected", this.tokenEnd);
	} else if (expectIdent) this.error("Vertical line is expected");
	return {
		type: "Identifier",
		loc: this.getLocation(start, this.tokenStart),
		name: this.substrToCursor(start)
	};
}
function getOperator() {
	const start = this.tokenStart;
	const code$1 = this.charCodeAt(start);
	if (code$1 !== EQUALSSIGN$1 && code$1 !== TILDE$2 && code$1 !== CIRCUMFLEXACCENT && code$1 !== DOLLARSIGN$1 && code$1 !== ASTERISK$5 && code$1 !== VERTICALLINE$2) this.error("Attribute selector (=, ~=, ^=, $=, *=, |=) is expected");
	this.next();
	if (code$1 !== EQUALSSIGN$1) {
		if (!this.isDelim(EQUALSSIGN$1)) this.error("Equal sign is expected");
		this.next();
	}
	return this.substrToCursor(start);
}
const name$45 = "AttributeSelector";
const structure$45 = {
	name: "Identifier",
	matcher: [String, null],
	value: [
		"String",
		"Identifier",
		null
	],
	flags: [String, null]
};
function parse$4() {
	const start = this.tokenStart;
	let name$49;
	let matcher = null;
	let value = null;
	let flags = null;
	this.eat(LeftSquareBracket);
	this.skipSC();
	name$49 = getAttributeName.call(this);
	this.skipSC();
	if (this.tokenType !== RightSquareBracket) {
		if (this.tokenType !== Ident) {
			matcher = getOperator.call(this);
			this.skipSC();
			value = this.tokenType === String$1 ? this.String() : this.Identifier();
			this.skipSC();
		}
		if (this.tokenType === Ident) {
			flags = this.consume(Ident);
			this.skipSC();
		}
	}
	this.eat(RightSquareBracket);
	return {
		type: "AttributeSelector",
		loc: this.getLocation(start, this.tokenStart),
		name: name$49,
		matcher,
		value,
		flags
	};
}
function generate$46(node) {
	this.token(Delim, "[");
	this.node(node.name);
	if (node.matcher !== null) {
		this.tokenize(node.matcher);
		this.node(node.value);
	}
	if (node.flags !== null) this.token(Ident, node.flags);
	this.token(Delim, "]");
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/node/Block.js
var Block_exports = /* @__PURE__ */ __export({
	generate: () => generate$45,
	name: () => name$44,
	parse: () => parse$5,
	structure: () => structure$44,
	walkContext: () => walkContext$7
});
const AMPERSAND$4 = 38;
function consumeRaw$3() {
	return this.Raw(null, true);
}
function consumeRule() {
	return this.parseWithFallback(this.Rule, consumeRaw$3);
}
function consumeRawDeclaration() {
	return this.Raw(this.consumeUntilSemicolonIncluded, true);
}
function consumeDeclaration() {
	if (this.tokenType === Semicolon) return consumeRawDeclaration.call(this, this.tokenIndex);
	const node = this.parseWithFallback(this.Declaration, consumeRawDeclaration);
	if (this.tokenType === Semicolon) this.next();
	return node;
}
const name$44 = "Block";
const walkContext$7 = "block";
const structure$44 = { children: [[
	"Atrule",
	"Rule",
	"Declaration"
]] };
function parse$5(isStyleBlock) {
	const consumer = isStyleBlock ? consumeDeclaration : consumeRule;
	const start = this.tokenStart;
	let children = this.createList();
	this.eat(LeftCurlyBracket);
	scan: while (!this.eof) switch (this.tokenType) {
		case RightCurlyBracket: break scan;
		case WhiteSpace:
		case Comment:
			this.next();
			break;
		case AtKeyword:
			children.push(this.parseWithFallback(this.Atrule.bind(this, isStyleBlock), consumeRaw$3));
			break;
		default: if (isStyleBlock && this.isDelim(AMPERSAND$4)) children.push(consumeRule.call(this));
		else children.push(consumer.call(this));
	}
	if (!this.eof) this.eat(RightCurlyBracket);
	return {
		type: "Block",
		loc: this.getLocation(start, this.tokenStart),
		children
	};
}
function generate$45(node) {
	this.token(LeftCurlyBracket, "{");
	this.children(node, (prev) => {
		if (prev.type === "Declaration") this.token(Semicolon, ";");
	});
	this.token(RightCurlyBracket, "}");
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/node/Brackets.js
var Brackets_exports = /* @__PURE__ */ __export({
	generate: () => generate$44,
	name: () => name$43,
	parse: () => parse$6,
	structure: () => structure$43
});
const name$43 = "Brackets";
const structure$43 = { children: [[]] };
function parse$6(readSequence$1, recognizer) {
	const start = this.tokenStart;
	let children = null;
	this.eat(LeftSquareBracket);
	children = readSequence$1.call(this, recognizer);
	if (!this.eof) this.eat(RightSquareBracket);
	return {
		type: "Brackets",
		loc: this.getLocation(start, this.tokenStart),
		children
	};
}
function generate$44(node) {
	this.token(Delim, "[");
	this.children(node);
	this.token(Delim, "]");
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/node/CDC.js
var CDC_exports = /* @__PURE__ */ __export({
	generate: () => generate$43,
	name: () => name$42,
	parse: () => parse$7,
	structure: () => structure$42
});
const name$42 = "CDC";
const structure$42 = [];
function parse$7() {
	const start = this.tokenStart;
	this.eat(CDC);
	return {
		type: "CDC",
		loc: this.getLocation(start, this.tokenStart)
	};
}
function generate$43() {
	this.token(CDC, "-->");
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/node/CDO.js
var CDO_exports = /* @__PURE__ */ __export({
	generate: () => generate$42,
	name: () => name$41,
	parse: () => parse$8,
	structure: () => structure$41
});
const name$41 = "CDO";
const structure$41 = [];
function parse$8() {
	const start = this.tokenStart;
	this.eat(CDO);
	return {
		type: "CDO",
		loc: this.getLocation(start, this.tokenStart)
	};
}
function generate$42() {
	this.token(CDO, "<!--");
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/node/ClassSelector.js
var ClassSelector_exports = /* @__PURE__ */ __export({
	generate: () => generate$41,
	name: () => name$40,
	parse: () => parse$9,
	structure: () => structure$40
});
const FULLSTOP$2 = 46;
const name$40 = "ClassSelector";
const structure$40 = { name: String };
function parse$9() {
	this.eatDelim(FULLSTOP$2);
	return {
		type: "ClassSelector",
		loc: this.getLocation(this.tokenStart - 1, this.tokenEnd),
		name: this.consume(Ident)
	};
}
function generate$41(node) {
	this.token(Delim, ".");
	this.token(Ident, node.name);
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/node/Combinator.js
var Combinator_exports = /* @__PURE__ */ __export({
	generate: () => generate$40,
	name: () => name$39,
	parse: () => parse$10,
	structure: () => structure$39
});
const PLUSSIGN$4 = 43;
const SOLIDUS$7 = 47;
const GREATERTHANSIGN$2 = 62;
const TILDE$1 = 126;
const name$39 = "Combinator";
const structure$39 = { name: String };
function parse$10() {
	const start = this.tokenStart;
	let name$49;
	switch (this.tokenType) {
		case WhiteSpace:
			name$49 = " ";
			break;
		case Delim:
			switch (this.charCodeAt(this.tokenStart)) {
				case GREATERTHANSIGN$2:
				case PLUSSIGN$4:
				case TILDE$1:
					this.next();
					break;
				case SOLIDUS$7:
					this.next();
					this.eatIdent("deep");
					this.eatDelim(SOLIDUS$7);
					break;
				default: this.error("Combinator is expected");
			}
			name$49 = this.substrToCursor(start);
			break;
	}
	return {
		type: "Combinator",
		loc: this.getLocation(start, this.tokenStart),
		name: name$49
	};
}
function generate$40(node) {
	this.tokenize(node.name);
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/node/Comment.js
var Comment_exports = /* @__PURE__ */ __export({
	generate: () => generate$39,
	name: () => name$38,
	parse: () => parse$11,
	structure: () => structure$38
});
const ASTERISK$4 = 42;
const SOLIDUS$6 = 47;
const name$38 = "Comment";
const structure$38 = { value: String };
function parse$11() {
	const start = this.tokenStart;
	let end = this.tokenEnd;
	this.eat(Comment);
	if (end - start + 2 >= 2 && this.charCodeAt(end - 2) === ASTERISK$4 && this.charCodeAt(end - 1) === SOLIDUS$6) end -= 2;
	return {
		type: "Comment",
		loc: this.getLocation(start, this.tokenStart),
		value: this.substring(start + 2, end)
	};
}
function generate$39(node) {
	this.token(Comment, "/*" + node.value + "*/");
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/node/Condition.js
var Condition_exports = /* @__PURE__ */ __export({
	generate: () => generate$38,
	name: () => name$37,
	parse: () => parse$12,
	structure: () => structure$37
});
const likelyFeatureToken = new Set([
	Colon,
	RightParenthesis,
	EOF
]);
const name$37 = "Condition";
const structure$37 = {
	kind: String,
	children: [[
		"Identifier",
		"Feature",
		"FeatureFunction",
		"FeatureRange",
		"SupportsDeclaration"
	]]
};
function featureOrRange(kind) {
	if (this.lookupTypeNonSC(1) === Ident && likelyFeatureToken.has(this.lookupTypeNonSC(2))) return this.Feature(kind);
	return this.FeatureRange(kind);
}
const parentheses = {
	media: featureOrRange,
	container: featureOrRange,
	supports() {
		return this.SupportsDeclaration();
	}
};
function parse$12(kind = "media") {
	const children = this.createList();
	scan: while (!this.eof) switch (this.tokenType) {
		case Comment:
		case WhiteSpace:
			this.next();
			continue;
		case Ident:
			children.push(this.Identifier());
			break;
		case LeftParenthesis: {
			let term = this.parseWithFallback(() => parentheses[kind].call(this, kind), () => null);
			if (!term) term = this.parseWithFallback(() => {
				this.eat(LeftParenthesis);
				const res = this.Condition(kind);
				this.eat(RightParenthesis);
				return res;
			}, () => {
				return this.GeneralEnclosed(kind);
			});
			children.push(term);
			break;
		}
		case Function: {
			let term = this.parseWithFallback(() => this.FeatureFunction(kind), () => null);
			if (!term) term = this.GeneralEnclosed(kind);
			children.push(term);
			break;
		}
		default: break scan;
	}
	if (children.isEmpty) this.error("Condition is expected");
	return {
		type: "Condition",
		loc: this.getLocationFromList(children),
		kind,
		children
	};
}
function generate$38(node) {
	node.children.forEach((child) => {
		if (child.type === "Condition") {
			this.token(LeftParenthesis, "(");
			this.node(child);
			this.token(RightParenthesis, ")");
		} else this.node(child);
	});
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/node/Declaration.js
var Declaration_exports = /* @__PURE__ */ __export({
	generate: () => generate$37,
	name: () => name$36,
	parse: () => parse$13,
	structure: () => structure$36,
	walkContext: () => walkContext$6
});
const EXCLAMATIONMARK$1 = 33;
const NUMBERSIGN$2 = 35;
const DOLLARSIGN = 36;
const AMPERSAND$3 = 38;
const ASTERISK$3 = 42;
const PLUSSIGN$3 = 43;
const SOLIDUS$5 = 47;
function consumeValueRaw() {
	return this.Raw(this.consumeUntilExclamationMarkOrSemicolon, true);
}
function consumeCustomPropertyRaw() {
	return this.Raw(this.consumeUntilExclamationMarkOrSemicolon, false);
}
function consumeValue() {
	const startValueToken = this.tokenIndex;
	const value = this.Value();
	if (value.type !== "Raw" && this.eof === false && this.tokenType !== Semicolon && this.isDelim(EXCLAMATIONMARK$1) === false && this.isBalanceEdge(startValueToken) === false) this.error();
	return value;
}
const name$36 = "Declaration";
const walkContext$6 = "declaration";
const structure$36 = {
	important: [Boolean, String],
	property: String,
	value: ["Value", "Raw"]
};
function parse$13() {
	const start = this.tokenStart;
	const startToken = this.tokenIndex;
	const property$1 = readProperty.call(this);
	const customProperty = isCustomProperty(property$1);
	const parseValue = customProperty ? this.parseCustomProperty : this.parseValue;
	const consumeRaw$5 = customProperty ? consumeCustomPropertyRaw : consumeValueRaw;
	let important = false;
	let value;
	this.skipSC();
	this.eat(Colon);
	const valueStart = this.tokenIndex;
	if (!customProperty) this.skipSC();
	if (parseValue) value = this.parseWithFallback(consumeValue, consumeRaw$5);
	else value = consumeRaw$5.call(this, this.tokenIndex);
	if (customProperty && value.type === "Value" && value.children.isEmpty) {
		for (let offset = valueStart - this.tokenIndex; offset <= 0; offset++) if (this.lookupType(offset) === WhiteSpace) {
			value.children.appendData({
				type: "WhiteSpace",
				loc: null,
				value: " "
			});
			break;
		}
	}
	if (this.isDelim(EXCLAMATIONMARK$1)) {
		important = getImportant.call(this);
		this.skipSC();
	}
	if (this.eof === false && this.tokenType !== Semicolon && this.isBalanceEdge(startToken) === false) this.error();
	return {
		type: "Declaration",
		loc: this.getLocation(start, this.tokenStart),
		important,
		property: property$1,
		value
	};
}
function generate$37(node) {
	this.token(Ident, node.property);
	this.token(Colon, ":");
	this.node(node.value);
	if (node.important) {
		this.token(Delim, "!");
		this.token(Ident, node.important === true ? "important" : node.important);
	}
}
function readProperty() {
	const start = this.tokenStart;
	if (this.tokenType === Delim) switch (this.charCodeAt(this.tokenStart)) {
		case ASTERISK$3:
		case DOLLARSIGN:
		case PLUSSIGN$3:
		case NUMBERSIGN$2:
		case AMPERSAND$3:
			this.next();
			break;
		case SOLIDUS$5:
			this.next();
			if (this.isDelim(SOLIDUS$5)) this.next();
			break;
	}
	if (this.tokenType === Hash) this.eat(Hash);
	else this.eat(Ident);
	return this.substrToCursor(start);
}
function getImportant() {
	this.eat(Delim);
	this.skipSC();
	const important = this.consume(Ident);
	return important === "important" ? true : important;
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/node/DeclarationList.js
var DeclarationList_exports = /* @__PURE__ */ __export({
	generate: () => generate$36,
	name: () => name$35,
	parse: () => parse$14,
	structure: () => structure$35
});
const AMPERSAND$2 = 38;
function consumeRaw$2() {
	return this.Raw(this.consumeUntilSemicolonIncluded, true);
}
const name$35 = "DeclarationList";
const structure$35 = { children: [[
	"Declaration",
	"Atrule",
	"Rule"
]] };
function parse$14() {
	const children = this.createList();
	scan: while (!this.eof) switch (this.tokenType) {
		case WhiteSpace:
		case Comment:
		case Semicolon:
			this.next();
			break;
		case AtKeyword:
			children.push(this.parseWithFallback(this.Atrule.bind(this, true), consumeRaw$2));
			break;
		default: if (this.isDelim(AMPERSAND$2)) children.push(this.parseWithFallback(this.Rule, consumeRaw$2));
		else children.push(this.parseWithFallback(this.Declaration, consumeRaw$2));
	}
	return {
		type: "DeclarationList",
		loc: this.getLocationFromList(children),
		children
	};
}
function generate$36(node) {
	this.children(node, (prev) => {
		if (prev.type === "Declaration") this.token(Semicolon, ";");
	});
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/node/Dimension.js
var Dimension_exports = /* @__PURE__ */ __export({
	generate: () => generate$35,
	name: () => name$34,
	parse: () => parse$15,
	structure: () => structure$34
});
const name$34 = "Dimension";
const structure$34 = {
	value: String,
	unit: String
};
function parse$15() {
	const start = this.tokenStart;
	const value = this.consumeNumber(Dimension);
	return {
		type: "Dimension",
		loc: this.getLocation(start, this.tokenStart),
		value,
		unit: this.substring(start + value.length, this.tokenStart)
	};
}
function generate$35(node) {
	this.token(Dimension, node.value + node.unit);
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/node/Feature.js
var Feature_exports = /* @__PURE__ */ __export({
	generate: () => generate$34,
	name: () => name$33,
	parse: () => parse$16,
	structure: () => structure$33
});
const SOLIDUS$4 = 47;
const name$33 = "Feature";
const structure$33 = {
	kind: String,
	name: String,
	value: [
		"Identifier",
		"Number",
		"Dimension",
		"Ratio",
		"Function",
		null
	]
};
function parse$16(kind) {
	const start = this.tokenStart;
	let name$49;
	let value = null;
	this.eat(LeftParenthesis);
	this.skipSC();
	name$49 = this.consume(Ident);
	this.skipSC();
	if (this.tokenType !== RightParenthesis) {
		this.eat(Colon);
		this.skipSC();
		switch (this.tokenType) {
			case Number$1:
				if (this.lookupNonWSType(1) === Delim) value = this.Ratio();
				else value = this.Number();
				break;
			case Dimension:
				value = this.Dimension();
				break;
			case Ident:
				value = this.Identifier();
				break;
			case Function:
				value = this.parseWithFallback(() => {
					const res = this.Function(this.readSequence, this.scope.Value);
					this.skipSC();
					if (this.isDelim(SOLIDUS$4)) this.error();
					return res;
				}, () => {
					return this.Ratio();
				});
				break;
			default: this.error("Number, dimension, ratio or identifier is expected");
		}
		this.skipSC();
	}
	if (!this.eof) this.eat(RightParenthesis);
	return {
		type: "Feature",
		loc: this.getLocation(start, this.tokenStart),
		kind,
		name: name$49,
		value
	};
}
function generate$34(node) {
	this.token(LeftParenthesis, "(");
	this.token(Ident, node.name);
	if (node.value !== null) {
		this.token(Colon, ":");
		this.node(node.value);
	}
	this.token(RightParenthesis, ")");
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/node/FeatureFunction.js
var FeatureFunction_exports = /* @__PURE__ */ __export({
	generate: () => generate$33,
	name: () => name$32,
	parse: () => parse$17,
	structure: () => structure$32
});
const name$32 = "FeatureFunction";
const structure$32 = {
	kind: String,
	feature: String,
	value: ["Declaration", "Selector"]
};
function getFeatureParser(kind, name$49) {
	const parser = (this.features[kind] || {})[name$49];
	if (typeof parser !== "function") this.error(`Unknown feature ${name$49}()`);
	return parser;
}
function parse$17(kind = "unknown") {
	const start = this.tokenStart;
	const functionName = this.consumeFunctionName();
	const valueParser = getFeatureParser.call(this, kind, functionName.toLowerCase());
	this.skipSC();
	const value = this.parseWithFallback(() => {
		const startValueToken = this.tokenIndex;
		const value$1 = valueParser.call(this);
		if (this.eof === false && this.isBalanceEdge(startValueToken) === false) this.error();
		return value$1;
	}, () => this.Raw(null, false));
	if (!this.eof) this.eat(RightParenthesis);
	return {
		type: "FeatureFunction",
		loc: this.getLocation(start, this.tokenStart),
		kind,
		feature: functionName,
		value
	};
}
function generate$33(node) {
	this.token(Function, node.feature + "(");
	this.node(node.value);
	this.token(RightParenthesis, ")");
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/node/FeatureRange.js
var FeatureRange_exports = /* @__PURE__ */ __export({
	generate: () => generate$32,
	name: () => name$31,
	parse: () => parse$18,
	structure: () => structure$31
});
const SOLIDUS$3 = 47;
const LESSTHANSIGN = 60;
const EQUALSSIGN = 61;
const GREATERTHANSIGN$1 = 62;
const name$31 = "FeatureRange";
const structure$31 = {
	kind: String,
	left: [
		"Identifier",
		"Number",
		"Dimension",
		"Ratio",
		"Function"
	],
	leftComparison: String,
	middle: [
		"Identifier",
		"Number",
		"Dimension",
		"Ratio",
		"Function"
	],
	rightComparison: [String, null],
	right: [
		"Identifier",
		"Number",
		"Dimension",
		"Ratio",
		"Function",
		null
	]
};
function readTerm() {
	this.skipSC();
	switch (this.tokenType) {
		case Number$1: if (this.isDelim(SOLIDUS$3, this.lookupOffsetNonSC(1))) return this.Ratio();
		else return this.Number();
		case Dimension: return this.Dimension();
		case Ident: return this.Identifier();
		case Function: return this.parseWithFallback(() => {
			const res = this.Function(this.readSequence, this.scope.Value);
			this.skipSC();
			if (this.isDelim(SOLIDUS$3)) this.error();
			return res;
		}, () => {
			return this.Ratio();
		});
		default: this.error("Number, dimension, ratio or identifier is expected");
	}
}
function readComparison(expectColon) {
	this.skipSC();
	if (this.isDelim(LESSTHANSIGN) || this.isDelim(GREATERTHANSIGN$1)) {
		const value = this.source[this.tokenStart];
		this.next();
		if (this.isDelim(EQUALSSIGN)) {
			this.next();
			return value + "=";
		}
		return value;
	}
	if (this.isDelim(EQUALSSIGN)) return "=";
	this.error(`Expected ${expectColon ? "\":\", " : ""}"<", ">", "=" or ")"`);
}
function parse$18(kind = "unknown") {
	const start = this.tokenStart;
	this.skipSC();
	this.eat(LeftParenthesis);
	const left = readTerm.call(this);
	const leftComparison = readComparison.call(this, left.type === "Identifier");
	const middle = readTerm.call(this);
	let rightComparison = null;
	let right = null;
	if (this.lookupNonWSType(0) !== RightParenthesis) {
		rightComparison = readComparison.call(this);
		right = readTerm.call(this);
	}
	this.skipSC();
	this.eat(RightParenthesis);
	return {
		type: "FeatureRange",
		loc: this.getLocation(start, this.tokenStart),
		kind,
		left,
		leftComparison,
		middle,
		rightComparison,
		right
	};
}
function generate$32(node) {
	this.token(LeftParenthesis, "(");
	this.node(node.left);
	this.tokenize(node.leftComparison);
	this.node(node.middle);
	if (node.right) {
		this.tokenize(node.rightComparison);
		this.node(node.right);
	}
	this.token(RightParenthesis, ")");
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/node/Function.js
var Function_exports = /* @__PURE__ */ __export({
	generate: () => generate$31,
	name: () => name$30,
	parse: () => parse$19,
	structure: () => structure$30,
	walkContext: () => walkContext$5
});
const name$30 = "Function";
const walkContext$5 = "function";
const structure$30 = {
	name: String,
	children: [[]]
};
function parse$19(readSequence$1, recognizer) {
	const start = this.tokenStart;
	const name$49 = this.consumeFunctionName();
	const nameLowerCase = name$49.toLowerCase();
	let children;
	children = recognizer.hasOwnProperty(nameLowerCase) ? recognizer[nameLowerCase].call(this, recognizer) : readSequence$1.call(this, recognizer);
	if (!this.eof) this.eat(RightParenthesis);
	return {
		type: "Function",
		loc: this.getLocation(start, this.tokenStart),
		name: name$49,
		children
	};
}
function generate$31(node) {
	this.token(Function, node.name + "(");
	this.children(node);
	this.token(RightParenthesis, ")");
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/node/GeneralEnclosed.js
var GeneralEnclosed_exports = /* @__PURE__ */ __export({
	generate: () => generate$30,
	name: () => name$29,
	parse: () => parse$20,
	structure: () => structure$29
});
const name$29 = "GeneralEnclosed";
const structure$29 = {
	kind: String,
	function: [String, null],
	children: [[]]
};
function parse$20(kind) {
	const start = this.tokenStart;
	let functionName = null;
	if (this.tokenType === Function) functionName = this.consumeFunctionName();
	else this.eat(LeftParenthesis);
	const children = this.parseWithFallback(() => {
		const startValueToken = this.tokenIndex;
		const children$1 = this.readSequence(this.scope.Value);
		if (this.eof === false && this.isBalanceEdge(startValueToken) === false) this.error();
		return children$1;
	}, () => this.createSingleNodeList(this.Raw(null, false)));
	if (!this.eof) this.eat(RightParenthesis);
	return {
		type: "GeneralEnclosed",
		loc: this.getLocation(start, this.tokenStart),
		kind,
		function: functionName,
		children
	};
}
function generate$30(node) {
	if (node.function) this.token(Function, node.function + "(");
	else this.token(LeftParenthesis, "(");
	this.children(node);
	this.token(RightParenthesis, ")");
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/node/Hash.js
var Hash_exports = /* @__PURE__ */ __export({
	generate: () => generate$29,
	name: () => name$28,
	parse: () => parse$21,
	structure: () => structure$28,
	xxx: () => xxx
});
const xxx = "XXX";
const name$28 = "Hash";
const structure$28 = { value: String };
function parse$21() {
	const start = this.tokenStart;
	this.eat(Hash);
	return {
		type: "Hash",
		loc: this.getLocation(start, this.tokenStart),
		value: this.substrToCursor(start + 1)
	};
}
function generate$29(node) {
	this.token(Hash, "#" + node.value);
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/node/Identifier.js
var Identifier_exports = /* @__PURE__ */ __export({
	generate: () => generate$28,
	name: () => name$27,
	parse: () => parse$22,
	structure: () => structure$27
});
const name$27 = "Identifier";
const structure$27 = { name: String };
function parse$22() {
	return {
		type: "Identifier",
		loc: this.getLocation(this.tokenStart, this.tokenEnd),
		name: this.consume(Ident)
	};
}
function generate$28(node) {
	this.token(Ident, node.name);
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/node/IdSelector.js
var IdSelector_exports = /* @__PURE__ */ __export({
	generate: () => generate$27,
	name: () => name$26,
	parse: () => parse$23,
	structure: () => structure$26
});
const name$26 = "IdSelector";
const structure$26 = { name: String };
function parse$23() {
	const start = this.tokenStart;
	this.eat(Hash);
	return {
		type: "IdSelector",
		loc: this.getLocation(start, this.tokenStart),
		name: this.substrToCursor(start + 1)
	};
}
function generate$27(node) {
	this.token(Delim, "#" + node.name);
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/node/Layer.js
var Layer_exports = /* @__PURE__ */ __export({
	generate: () => generate$26,
	name: () => name$25,
	parse: () => parse$24,
	structure: () => structure$25
});
const FULLSTOP$1 = 46;
const name$25 = "Layer";
const structure$25 = { name: String };
function parse$24() {
	let tokenStart = this.tokenStart;
	let name$49 = this.consume(Ident);
	while (this.isDelim(FULLSTOP$1)) {
		this.eat(Delim);
		name$49 += "." + this.consume(Ident);
	}
	return {
		type: "Layer",
		loc: this.getLocation(tokenStart, this.tokenStart),
		name: name$49
	};
}
function generate$26(node) {
	this.tokenize(node.name);
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/node/LayerList.js
var LayerList_exports = /* @__PURE__ */ __export({
	generate: () => generate$25,
	name: () => name$24,
	parse: () => parse$25,
	structure: () => structure$24
});
const name$24 = "LayerList";
const structure$24 = { children: [["Layer"]] };
function parse$25() {
	const children = this.createList();
	this.skipSC();
	while (!this.eof) {
		children.push(this.Layer());
		if (this.lookupTypeNonSC(0) !== Comma) break;
		this.skipSC();
		this.next();
		this.skipSC();
	}
	return {
		type: "LayerList",
		loc: this.getLocationFromList(children),
		children
	};
}
function generate$25(node) {
	this.children(node, () => this.token(Comma, ","));
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/node/MediaQuery.js
var MediaQuery_exports = /* @__PURE__ */ __export({
	generate: () => generate$24,
	name: () => name$23,
	parse: () => parse$26,
	structure: () => structure$23
});
const name$23 = "MediaQuery";
const structure$23 = {
	modifier: [String, null],
	mediaType: [String, null],
	condition: ["Condition", null]
};
function parse$26() {
	const start = this.tokenStart;
	let modifier = null;
	let mediaType = null;
	let condition = null;
	this.skipSC();
	if (this.tokenType === Ident && this.lookupTypeNonSC(1) !== LeftParenthesis) {
		const ident = this.consume(Ident);
		const identLowerCase = ident.toLowerCase();
		if (identLowerCase === "not" || identLowerCase === "only") {
			this.skipSC();
			modifier = identLowerCase;
			mediaType = this.consume(Ident);
		} else mediaType = ident;
		switch (this.lookupTypeNonSC(0)) {
			case Ident:
				this.skipSC();
				this.eatIdent("and");
				condition = this.Condition("media");
				break;
			case LeftCurlyBracket:
			case Semicolon:
			case Comma:
			case EOF: break;
			default: this.error("Identifier or parenthesis is expected");
		}
	} else switch (this.tokenType) {
		case Ident:
		case LeftParenthesis:
		case Function:
			condition = this.Condition("media");
			break;
		case LeftCurlyBracket:
		case Semicolon:
		case EOF: break;
		default: this.error("Identifier or parenthesis is expected");
	}
	return {
		type: "MediaQuery",
		loc: this.getLocation(start, this.tokenStart),
		modifier,
		mediaType,
		condition
	};
}
function generate$24(node) {
	if (node.mediaType) {
		if (node.modifier) this.token(Ident, node.modifier);
		this.token(Ident, node.mediaType);
		if (node.condition) {
			this.token(Ident, "and");
			this.node(node.condition);
		}
	} else if (node.condition) this.node(node.condition);
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/node/MediaQueryList.js
var MediaQueryList_exports = /* @__PURE__ */ __export({
	generate: () => generate$23,
	name: () => name$22,
	parse: () => parse$27,
	structure: () => structure$22
});
const name$22 = "MediaQueryList";
const structure$22 = { children: [["MediaQuery"]] };
function parse$27() {
	const children = this.createList();
	this.skipSC();
	while (!this.eof) {
		children.push(this.MediaQuery());
		if (this.tokenType !== Comma) break;
		this.next();
	}
	return {
		type: "MediaQueryList",
		loc: this.getLocationFromList(children),
		children
	};
}
function generate$23(node) {
	this.children(node, () => this.token(Comma, ","));
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/node/NestingSelector.js
var NestingSelector_exports = /* @__PURE__ */ __export({
	generate: () => generate$22,
	name: () => name$21,
	parse: () => parse$28,
	structure: () => structure$21
});
const AMPERSAND$1 = 38;
const name$21 = "NestingSelector";
const structure$21 = {};
function parse$28() {
	const start = this.tokenStart;
	this.eatDelim(AMPERSAND$1);
	return {
		type: "NestingSelector",
		loc: this.getLocation(start, this.tokenStart)
	};
}
function generate$22() {
	this.token(Delim, "&");
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/node/Nth.js
var Nth_exports = /* @__PURE__ */ __export({
	generate: () => generate$21,
	name: () => name$20,
	parse: () => parse$29,
	structure: () => structure$20
});
const name$20 = "Nth";
const structure$20 = {
	nth: ["AnPlusB", "Identifier"],
	selector: ["SelectorList", null]
};
function parse$29() {
	this.skipSC();
	const start = this.tokenStart;
	let end = start;
	let selector$1 = null;
	let nth$1;
	if (this.lookupValue(0, "odd") || this.lookupValue(0, "even")) nth$1 = this.Identifier();
	else nth$1 = this.AnPlusB();
	end = this.tokenStart;
	this.skipSC();
	if (this.lookupValue(0, "of")) {
		this.next();
		selector$1 = this.SelectorList();
		end = this.tokenStart;
	}
	return {
		type: "Nth",
		loc: this.getLocation(start, end),
		nth: nth$1,
		selector: selector$1
	};
}
function generate$21(node) {
	this.node(node.nth);
	if (node.selector !== null) {
		this.token(Ident, "of");
		this.node(node.selector);
	}
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/node/Number.js
var Number_exports = /* @__PURE__ */ __export({
	generate: () => generate$20,
	name: () => name$19,
	parse: () => parse$30,
	structure: () => structure$19
});
const name$19 = "Number";
const structure$19 = { value: String };
function parse$30() {
	return {
		type: "Number",
		loc: this.getLocation(this.tokenStart, this.tokenEnd),
		value: this.consume(Number$1)
	};
}
function generate$20(node) {
	this.token(Number$1, node.value);
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/node/Operator.js
var Operator_exports = /* @__PURE__ */ __export({
	generate: () => generate$19,
	name: () => name$18,
	parse: () => parse$31,
	structure: () => structure$18
});
const name$18 = "Operator";
const structure$18 = { value: String };
function parse$31() {
	const start = this.tokenStart;
	this.next();
	return {
		type: "Operator",
		loc: this.getLocation(start, this.tokenStart),
		value: this.substrToCursor(start)
	};
}
function generate$19(node) {
	this.tokenize(node.value);
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/node/Parentheses.js
var Parentheses_exports = /* @__PURE__ */ __export({
	generate: () => generate$18,
	name: () => name$17,
	parse: () => parse$32,
	structure: () => structure$17
});
const name$17 = "Parentheses";
const structure$17 = { children: [[]] };
function parse$32(readSequence$1, recognizer) {
	const start = this.tokenStart;
	let children = null;
	this.eat(LeftParenthesis);
	children = readSequence$1.call(this, recognizer);
	if (!this.eof) this.eat(RightParenthesis);
	return {
		type: "Parentheses",
		loc: this.getLocation(start, this.tokenStart),
		children
	};
}
function generate$18(node) {
	this.token(LeftParenthesis, "(");
	this.children(node);
	this.token(RightParenthesis, ")");
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/node/Percentage.js
var Percentage_exports = /* @__PURE__ */ __export({
	generate: () => generate$17,
	name: () => name$16,
	parse: () => parse$33,
	structure: () => structure$16
});
const name$16 = "Percentage";
const structure$16 = { value: String };
function parse$33() {
	return {
		type: "Percentage",
		loc: this.getLocation(this.tokenStart, this.tokenEnd),
		value: this.consumeNumber(Percentage)
	};
}
function generate$17(node) {
	this.token(Percentage, node.value + "%");
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/node/PseudoClassSelector.js
var PseudoClassSelector_exports = /* @__PURE__ */ __export({
	generate: () => generate$16,
	name: () => name$15,
	parse: () => parse$34,
	structure: () => structure$15,
	walkContext: () => walkContext$4
});
const name$15 = "PseudoClassSelector";
const walkContext$4 = "function";
const structure$15 = {
	name: String,
	children: [["Raw"], null]
};
function parse$34() {
	const start = this.tokenStart;
	let children = null;
	let name$49;
	let nameLowerCase;
	this.eat(Colon);
	if (this.tokenType === Function) {
		name$49 = this.consumeFunctionName();
		nameLowerCase = name$49.toLowerCase();
		if (this.lookupNonWSType(0) == RightParenthesis) children = this.createList();
		else if (hasOwnProperty.call(this.pseudo, nameLowerCase)) {
			this.skipSC();
			children = this.pseudo[nameLowerCase].call(this);
			this.skipSC();
		} else {
			children = this.createList();
			children.push(this.Raw(null, false));
		}
		this.eat(RightParenthesis);
	} else name$49 = this.consume(Ident);
	return {
		type: "PseudoClassSelector",
		loc: this.getLocation(start, this.tokenStart),
		name: name$49,
		children
	};
}
function generate$16(node) {
	this.token(Colon, ":");
	if (node.children === null) this.token(Ident, node.name);
	else {
		this.token(Function, node.name + "(");
		this.children(node);
		this.token(RightParenthesis, ")");
	}
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/node/PseudoElementSelector.js
var PseudoElementSelector_exports = /* @__PURE__ */ __export({
	generate: () => generate$15,
	name: () => name$14,
	parse: () => parse$35,
	structure: () => structure$14,
	walkContext: () => walkContext$3
});
const name$14 = "PseudoElementSelector";
const walkContext$3 = "function";
const structure$14 = {
	name: String,
	children: [["Raw"], null]
};
function parse$35() {
	const start = this.tokenStart;
	let children = null;
	let name$49;
	let nameLowerCase;
	this.eat(Colon);
	this.eat(Colon);
	if (this.tokenType === Function) {
		name$49 = this.consumeFunctionName();
		nameLowerCase = name$49.toLowerCase();
		if (this.lookupNonWSType(0) == RightParenthesis) children = this.createList();
		else if (hasOwnProperty.call(this.pseudo, nameLowerCase)) {
			this.skipSC();
			children = this.pseudo[nameLowerCase].call(this);
			this.skipSC();
		} else {
			children = this.createList();
			children.push(this.Raw(null, false));
		}
		this.eat(RightParenthesis);
	} else name$49 = this.consume(Ident);
	return {
		type: "PseudoElementSelector",
		loc: this.getLocation(start, this.tokenStart),
		name: name$49,
		children
	};
}
function generate$15(node) {
	this.token(Colon, ":");
	this.token(Colon, ":");
	if (node.children === null) this.token(Ident, node.name);
	else {
		this.token(Function, node.name + "(");
		this.children(node);
		this.token(RightParenthesis, ")");
	}
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/node/Ratio.js
var Ratio_exports = /* @__PURE__ */ __export({
	generate: () => generate$14,
	name: () => name$13,
	parse: () => parse$36,
	structure: () => structure$13
});
const SOLIDUS$2 = 47;
function consumeTerm() {
	this.skipSC();
	switch (this.tokenType) {
		case Number$1: return this.Number();
		case Function: return this.Function(this.readSequence, this.scope.Value);
		default: this.error("Number of function is expected");
	}
}
const name$13 = "Ratio";
const structure$13 = {
	left: ["Number", "Function"],
	right: [
		"Number",
		"Function",
		null
	]
};
function parse$36() {
	const start = this.tokenStart;
	const left = consumeTerm.call(this);
	let right = null;
	this.skipSC();
	if (this.isDelim(SOLIDUS$2)) {
		this.eatDelim(SOLIDUS$2);
		right = consumeTerm.call(this);
	}
	return {
		type: "Ratio",
		loc: this.getLocation(start, this.tokenStart),
		left,
		right
	};
}
function generate$14(node) {
	this.node(node.left);
	this.token(Delim, "/");
	if (node.right) this.node(node.right);
	else this.node(Number$1, 1);
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/node/Raw.js
var Raw_exports = /* @__PURE__ */ __export({
	generate: () => generate$13,
	name: () => name$12,
	parse: () => parse$37,
	structure: () => structure$12
});
function getOffsetExcludeWS() {
	if (this.tokenIndex > 0) {
		if (this.lookupType(-1) === WhiteSpace) return this.tokenIndex > 1 ? this.getTokenStart(this.tokenIndex - 1) : this.firstCharOffset;
	}
	return this.tokenStart;
}
const name$12 = "Raw";
const structure$12 = { value: String };
function parse$37(consumeUntil, excludeWhiteSpace) {
	const startOffset = this.getTokenStart(this.tokenIndex);
	let endOffset;
	this.skipUntilBalanced(this.tokenIndex, consumeUntil || this.consumeUntilBalanceEnd);
	if (excludeWhiteSpace && this.tokenStart > startOffset) endOffset = getOffsetExcludeWS.call(this);
	else endOffset = this.tokenStart;
	return {
		type: "Raw",
		loc: this.getLocation(startOffset, endOffset),
		value: this.substring(startOffset, endOffset)
	};
}
function generate$13(node) {
	this.tokenize(node.value);
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/node/Rule.js
var Rule_exports = /* @__PURE__ */ __export({
	generate: () => generate$12,
	name: () => name$11,
	parse: () => parse$38,
	structure: () => structure$11,
	walkContext: () => walkContext$2
});
function consumeRaw$1() {
	return this.Raw(this.consumeUntilLeftCurlyBracket, true);
}
function consumePrelude() {
	const prelude = this.SelectorList();
	if (prelude.type !== "Raw" && this.eof === false && this.tokenType !== LeftCurlyBracket) this.error();
	return prelude;
}
const name$11 = "Rule";
const walkContext$2 = "rule";
const structure$11 = {
	prelude: ["SelectorList", "Raw"],
	block: ["Block"]
};
function parse$38() {
	const startToken = this.tokenIndex;
	const startOffset = this.tokenStart;
	let prelude;
	let block;
	if (this.parseRulePrelude) prelude = this.parseWithFallback(consumePrelude, consumeRaw$1);
	else prelude = consumeRaw$1.call(this, startToken);
	block = this.Block(true);
	return {
		type: "Rule",
		loc: this.getLocation(startOffset, this.tokenStart),
		prelude,
		block
	};
}
function generate$12(node) {
	this.node(node.prelude);
	this.node(node.block);
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/node/Scope.js
var Scope_exports = /* @__PURE__ */ __export({
	generate: () => generate$11,
	name: () => name$10,
	parse: () => parse$39,
	structure: () => structure$10
});
const name$10 = "Scope";
const structure$10 = {
	root: [
		"SelectorList",
		"Raw",
		null
	],
	limit: [
		"SelectorList",
		"Raw",
		null
	]
};
function parse$39() {
	let root = null;
	let limit = null;
	this.skipSC();
	const startOffset = this.tokenStart;
	if (this.tokenType === LeftParenthesis) {
		this.next();
		this.skipSC();
		root = this.parseWithFallback(this.SelectorList, () => this.Raw(false, true));
		this.skipSC();
		this.eat(RightParenthesis);
	}
	if (this.lookupNonWSType(0) === Ident) {
		this.skipSC();
		this.eatIdent("to");
		this.skipSC();
		this.eat(LeftParenthesis);
		this.skipSC();
		limit = this.parseWithFallback(this.SelectorList, () => this.Raw(false, true));
		this.skipSC();
		this.eat(RightParenthesis);
	}
	return {
		type: "Scope",
		loc: this.getLocation(startOffset, this.tokenStart),
		root,
		limit
	};
}
function generate$11(node) {
	if (node.root) {
		this.token(LeftParenthesis, "(");
		this.node(node.root);
		this.token(RightParenthesis, ")");
	}
	if (node.limit) {
		this.token(Ident, "to");
		this.token(LeftParenthesis, "(");
		this.node(node.limit);
		this.token(RightParenthesis, ")");
	}
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/node/Selector.js
var Selector_exports = /* @__PURE__ */ __export({
	generate: () => generate$10,
	name: () => name$9,
	parse: () => parse$40,
	structure: () => structure$9
});
const name$9 = "Selector";
const structure$9 = { children: [[
	"TypeSelector",
	"IdSelector",
	"ClassSelector",
	"AttributeSelector",
	"PseudoClassSelector",
	"PseudoElementSelector",
	"Combinator"
]] };
function parse$40() {
	const children = this.readSequence(this.scope.Selector);
	if (this.getFirstListNode(children) === null) this.error("Selector is expected");
	return {
		type: "Selector",
		loc: this.getLocationFromList(children),
		children
	};
}
function generate$10(node) {
	this.children(node);
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/node/SelectorList.js
var SelectorList_exports = /* @__PURE__ */ __export({
	generate: () => generate$9,
	name: () => name$8,
	parse: () => parse$41,
	structure: () => structure$8,
	walkContext: () => walkContext$1
});
const name$8 = "SelectorList";
const walkContext$1 = "selector";
const structure$8 = { children: [["Selector", "Raw"]] };
function parse$41() {
	const children = this.createList();
	while (!this.eof) {
		children.push(this.Selector());
		if (this.tokenType === Comma) {
			this.next();
			continue;
		}
		break;
	}
	return {
		type: "SelectorList",
		loc: this.getLocationFromList(children),
		children
	};
}
function generate$9(node) {
	this.children(node, () => this.token(Comma, ","));
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/utils/string.js
const REVERSE_SOLIDUS$1 = 92;
const QUOTATION_MARK$1 = 34;
const APOSTROPHE$1 = 39;
function decode$1(str) {
	const len = str.length;
	const firstChar = str.charCodeAt(0);
	const start = firstChar === QUOTATION_MARK$1 || firstChar === APOSTROPHE$1 ? 1 : 0;
	const end = start === 1 && len > 1 && str.charCodeAt(len - 1) === firstChar ? len - 2 : len - 1;
	let decoded = "";
	for (let i = start; i <= end; i++) {
		let code$1 = str.charCodeAt(i);
		if (code$1 === REVERSE_SOLIDUS$1) {
			if (i === end) {
				if (i !== len - 1) decoded = str.substr(i + 1);
				break;
			}
			code$1 = str.charCodeAt(++i);
			if (isValidEscape(REVERSE_SOLIDUS$1, code$1)) {
				const escapeStart = i - 1;
				const escapeEnd = consumeEscaped(str, escapeStart);
				i = escapeEnd - 1;
				decoded += decodeEscaped(str.substring(escapeStart + 1, escapeEnd));
			} else if (code$1 === 13 && str.charCodeAt(i + 1) === 10) i++;
		} else decoded += str[i];
	}
	return decoded;
}
function encode$1(str, apostrophe) {
	const quote = apostrophe ? "'" : "\"";
	const quoteCode = apostrophe ? APOSTROPHE$1 : QUOTATION_MARK$1;
	let encoded = "";
	let wsBeforeHexIsNeeded = false;
	for (let i = 0; i < str.length; i++) {
		const code$1 = str.charCodeAt(i);
		if (code$1 === 0) {
			encoded += "�";
			continue;
		}
		if (code$1 <= 31 || code$1 === 127) {
			encoded += "\\" + code$1.toString(16);
			wsBeforeHexIsNeeded = true;
			continue;
		}
		if (code$1 === quoteCode || code$1 === REVERSE_SOLIDUS$1) {
			encoded += "\\" + str.charAt(i);
			wsBeforeHexIsNeeded = false;
		} else {
			if (wsBeforeHexIsNeeded && (isHexDigit(code$1) || isWhiteSpace(code$1))) encoded += " ";
			encoded += str.charAt(i);
			wsBeforeHexIsNeeded = false;
		}
	}
	return quote + encoded + quote;
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/node/String.js
var String_exports = /* @__PURE__ */ __export({
	generate: () => generate$8,
	name: () => name$7,
	parse: () => parse$42,
	structure: () => structure$7
});
const name$7 = "String";
const structure$7 = { value: String };
function parse$42() {
	return {
		type: "String",
		loc: this.getLocation(this.tokenStart, this.tokenEnd),
		value: decode$1(this.consume(String$1))
	};
}
function generate$8(node) {
	this.token(String$1, encode$1(node.value));
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/node/StyleSheet.js
var StyleSheet_exports = /* @__PURE__ */ __export({
	generate: () => generate$7,
	name: () => name$6,
	parse: () => parse$43,
	structure: () => structure$6,
	walkContext: () => walkContext
});
const EXCLAMATIONMARK = 33;
function consumeRaw() {
	return this.Raw(null, false);
}
const name$6 = "StyleSheet";
const walkContext = "stylesheet";
const structure$6 = { children: [[
	"Comment",
	"CDO",
	"CDC",
	"Atrule",
	"Rule",
	"Raw"
]] };
function parse$43() {
	const start = this.tokenStart;
	const children = this.createList();
	let child;
	scan: while (!this.eof) {
		switch (this.tokenType) {
			case WhiteSpace:
				this.next();
				continue;
			case Comment:
				if (this.charCodeAt(this.tokenStart + 2) !== EXCLAMATIONMARK) {
					this.next();
					continue;
				}
				child = this.Comment();
				break;
			case CDO:
				child = this.CDO();
				break;
			case CDC:
				child = this.CDC();
				break;
			case AtKeyword:
				child = this.parseWithFallback(this.Atrule, consumeRaw);
				break;
			default: child = this.parseWithFallback(this.Rule, consumeRaw);
		}
		children.push(child);
	}
	return {
		type: "StyleSheet",
		loc: this.getLocation(start, this.tokenStart),
		children
	};
}
function generate$7(node) {
	this.children(node);
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/node/SupportsDeclaration.js
var SupportsDeclaration_exports = /* @__PURE__ */ __export({
	generate: () => generate$6,
	name: () => name$5,
	parse: () => parse$44,
	structure: () => structure$5
});
const name$5 = "SupportsDeclaration";
const structure$5 = { declaration: "Declaration" };
function parse$44() {
	const start = this.tokenStart;
	this.eat(LeftParenthesis);
	this.skipSC();
	const declaration = this.Declaration();
	if (!this.eof) this.eat(RightParenthesis);
	return {
		type: "SupportsDeclaration",
		loc: this.getLocation(start, this.tokenStart),
		declaration
	};
}
function generate$6(node) {
	this.token(LeftParenthesis, "(");
	this.node(node.declaration);
	this.token(RightParenthesis, ")");
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/node/TypeSelector.js
var TypeSelector_exports = /* @__PURE__ */ __export({
	generate: () => generate$5,
	name: () => name$4,
	parse: () => parse$45,
	structure: () => structure$4
});
const ASTERISK$2 = 42;
const VERTICALLINE$1 = 124;
function eatIdentifierOrAsterisk() {
	if (this.tokenType !== Ident && this.isDelim(ASTERISK$2) === false) this.error("Identifier or asterisk is expected");
	this.next();
}
const name$4 = "TypeSelector";
const structure$4 = { name: String };
function parse$45() {
	const start = this.tokenStart;
	if (this.isDelim(VERTICALLINE$1)) {
		this.next();
		eatIdentifierOrAsterisk.call(this);
	} else {
		eatIdentifierOrAsterisk.call(this);
		if (this.isDelim(VERTICALLINE$1)) {
			this.next();
			eatIdentifierOrAsterisk.call(this);
		}
	}
	return {
		type: "TypeSelector",
		loc: this.getLocation(start, this.tokenStart),
		name: this.substrToCursor(start)
	};
}
function generate$5(node) {
	this.tokenize(node.name);
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/node/UnicodeRange.js
var UnicodeRange_exports = /* @__PURE__ */ __export({
	generate: () => generate$4,
	name: () => name$3,
	parse: () => parse$46,
	structure: () => structure$3
});
const PLUSSIGN$2 = 43;
const HYPHENMINUS$1 = 45;
const QUESTIONMARK = 63;
function eatHexSequence(offset, allowDash) {
	let len = 0;
	for (let pos = this.tokenStart + offset; pos < this.tokenEnd; pos++) {
		const code$1 = this.charCodeAt(pos);
		if (code$1 === HYPHENMINUS$1 && allowDash && len !== 0) {
			eatHexSequence.call(this, offset + len + 1, false);
			return -1;
		}
		if (!isHexDigit(code$1)) this.error(allowDash && len !== 0 ? "Hyphen minus" + (len < 6 ? " or hex digit" : "") + " is expected" : len < 6 ? "Hex digit is expected" : "Unexpected input", pos);
		if (++len > 6) this.error("Too many hex digits", pos);
	}
	this.next();
	return len;
}
function eatQuestionMarkSequence(max) {
	let count = 0;
	while (this.isDelim(QUESTIONMARK)) {
		if (++count > max) this.error("Too many question marks");
		this.next();
	}
}
function startsWith(code$1) {
	if (this.charCodeAt(this.tokenStart) !== code$1) this.error((code$1 === PLUSSIGN$2 ? "Plus sign" : "Hyphen minus") + " is expected");
}
function scanUnicodeRange() {
	let hexLength = 0;
	switch (this.tokenType) {
		case Number$1:
			hexLength = eatHexSequence.call(this, 1, true);
			if (this.isDelim(QUESTIONMARK)) {
				eatQuestionMarkSequence.call(this, 6 - hexLength);
				break;
			}
			if (this.tokenType === Dimension || this.tokenType === Number$1) {
				startsWith.call(this, HYPHENMINUS$1);
				eatHexSequence.call(this, 1, false);
				break;
			}
			break;
		case Dimension:
			hexLength = eatHexSequence.call(this, 1, true);
			if (hexLength > 0) eatQuestionMarkSequence.call(this, 6 - hexLength);
			break;
		default:
			this.eatDelim(PLUSSIGN$2);
			if (this.tokenType === Ident) {
				hexLength = eatHexSequence.call(this, 0, true);
				if (hexLength > 0) eatQuestionMarkSequence.call(this, 6 - hexLength);
				break;
			}
			if (this.isDelim(QUESTIONMARK)) {
				this.next();
				eatQuestionMarkSequence.call(this, 5);
				break;
			}
			this.error("Hex digit or question mark is expected");
	}
}
const name$3 = "UnicodeRange";
const structure$3 = { value: String };
function parse$46() {
	const start = this.tokenStart;
	this.eatIdent("u");
	scanUnicodeRange.call(this);
	return {
		type: "UnicodeRange",
		loc: this.getLocation(start, this.tokenStart),
		value: this.substrToCursor(start)
	};
}
function generate$4(node) {
	this.tokenize(node.value);
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/utils/url.js
const SPACE$1 = 32;
const REVERSE_SOLIDUS = 92;
const QUOTATION_MARK = 34;
const APOSTROPHE = 39;
const LEFTPARENTHESIS = 40;
const RIGHTPARENTHESIS = 41;
function decode(str) {
	const len = str.length;
	let start = 4;
	let end = str.charCodeAt(len - 1) === RIGHTPARENTHESIS ? len - 2 : len - 1;
	let decoded = "";
	while (start < end && isWhiteSpace(str.charCodeAt(start))) start++;
	while (start < end && isWhiteSpace(str.charCodeAt(end))) end--;
	for (let i = start; i <= end; i++) {
		let code$1 = str.charCodeAt(i);
		if (code$1 === REVERSE_SOLIDUS) {
			if (i === end) {
				if (i !== len - 1) decoded = str.substr(i + 1);
				break;
			}
			code$1 = str.charCodeAt(++i);
			if (isValidEscape(REVERSE_SOLIDUS, code$1)) {
				const escapeStart = i - 1;
				const escapeEnd = consumeEscaped(str, escapeStart);
				i = escapeEnd - 1;
				decoded += decodeEscaped(str.substring(escapeStart + 1, escapeEnd));
			} else if (code$1 === 13 && str.charCodeAt(i + 1) === 10) i++;
		} else decoded += str[i];
	}
	return decoded;
}
function encode(str) {
	let encoded = "";
	let wsBeforeHexIsNeeded = false;
	for (let i = 0; i < str.length; i++) {
		const code$1 = str.charCodeAt(i);
		if (code$1 === 0) {
			encoded += "�";
			continue;
		}
		if (code$1 <= 31 || code$1 === 127) {
			encoded += "\\" + code$1.toString(16);
			wsBeforeHexIsNeeded = true;
			continue;
		}
		if (code$1 === SPACE$1 || code$1 === REVERSE_SOLIDUS || code$1 === QUOTATION_MARK || code$1 === APOSTROPHE || code$1 === LEFTPARENTHESIS || code$1 === RIGHTPARENTHESIS) {
			encoded += "\\" + str.charAt(i);
			wsBeforeHexIsNeeded = false;
		} else {
			if (wsBeforeHexIsNeeded && isHexDigit(code$1)) encoded += " ";
			encoded += str.charAt(i);
			wsBeforeHexIsNeeded = false;
		}
	}
	return "url(" + encoded + ")";
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/node/Url.js
var Url_exports = /* @__PURE__ */ __export({
	generate: () => generate$3,
	name: () => name$2,
	parse: () => parse$47,
	structure: () => structure$2
});
const name$2 = "Url";
const structure$2 = { value: String };
function parse$47() {
	const start = this.tokenStart;
	let value;
	switch (this.tokenType) {
		case Url:
			value = decode(this.consume(Url));
			break;
		case Function:
			if (!this.cmpStr(this.tokenStart, this.tokenEnd, "url(")) this.error("Function name must be `url`");
			this.eat(Function);
			this.skipSC();
			value = decode$1(this.consume(String$1));
			this.skipSC();
			if (!this.eof) this.eat(RightParenthesis);
			break;
		default: this.error("Url or Function is expected");
	}
	return {
		type: "Url",
		loc: this.getLocation(start, this.tokenStart),
		value
	};
}
function generate$3(node) {
	this.token(Url, encode(node.value));
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/node/Value.js
var Value_exports = /* @__PURE__ */ __export({
	generate: () => generate$2,
	name: () => name$1,
	parse: () => parse$48,
	structure: () => structure$1
});
const name$1 = "Value";
const structure$1 = { children: [[]] };
function parse$48() {
	const start = this.tokenStart;
	const children = this.readSequence(this.scope.Value);
	return {
		type: "Value",
		loc: this.getLocation(start, this.tokenStart),
		children
	};
}
function generate$2(node) {
	this.children(node);
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/node/WhiteSpace.js
var WhiteSpace_exports = /* @__PURE__ */ __export({
	generate: () => generate$1,
	name: () => name,
	parse: () => parse$49,
	structure: () => structure
});
const SPACE = Object.freeze({
	type: "WhiteSpace",
	loc: null,
	value: " "
});
const name = "WhiteSpace";
const structure = { value: String };
function parse$49() {
	this.eat(WhiteSpace);
	return SPACE;
}
function generate$1(node) {
	this.token(WhiteSpace, node.value);
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/node/index.js
var node_exports = /* @__PURE__ */ __export({
	AnPlusB: () => AnPlusB_exports,
	Atrule: () => Atrule_exports,
	AtrulePrelude: () => AtrulePrelude_exports,
	AttributeSelector: () => AttributeSelector_exports,
	Block: () => Block_exports,
	Brackets: () => Brackets_exports,
	CDC: () => CDC_exports,
	CDO: () => CDO_exports,
	ClassSelector: () => ClassSelector_exports,
	Combinator: () => Combinator_exports,
	Comment: () => Comment_exports,
	Condition: () => Condition_exports,
	Declaration: () => Declaration_exports,
	DeclarationList: () => DeclarationList_exports,
	Dimension: () => Dimension_exports,
	Feature: () => Feature_exports,
	FeatureFunction: () => FeatureFunction_exports,
	FeatureRange: () => FeatureRange_exports,
	Function: () => Function_exports,
	GeneralEnclosed: () => GeneralEnclosed_exports,
	Hash: () => Hash_exports,
	IdSelector: () => IdSelector_exports,
	Identifier: () => Identifier_exports,
	Layer: () => Layer_exports,
	LayerList: () => LayerList_exports,
	MediaQuery: () => MediaQuery_exports,
	MediaQueryList: () => MediaQueryList_exports,
	NestingSelector: () => NestingSelector_exports,
	Nth: () => Nth_exports,
	Number: () => Number_exports,
	Operator: () => Operator_exports,
	Parentheses: () => Parentheses_exports,
	Percentage: () => Percentage_exports,
	PseudoClassSelector: () => PseudoClassSelector_exports,
	PseudoElementSelector: () => PseudoElementSelector_exports,
	Ratio: () => Ratio_exports,
	Raw: () => Raw_exports,
	Rule: () => Rule_exports,
	Scope: () => Scope_exports,
	Selector: () => Selector_exports,
	SelectorList: () => SelectorList_exports,
	String: () => String_exports,
	StyleSheet: () => StyleSheet_exports,
	SupportsDeclaration: () => SupportsDeclaration_exports,
	TypeSelector: () => TypeSelector_exports,
	UnicodeRange: () => UnicodeRange_exports,
	Url: () => Url_exports,
	Value: () => Value_exports,
	WhiteSpace: () => WhiteSpace_exports
});

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/config/lexer.js
var lexer_default = {
	generic: true,
	cssWideKeywords,
	...data_default,
	node: node_exports
};

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/scope/default.js
const NUMBERSIGN$1 = 35;
const ASTERISK$1 = 42;
const PLUSSIGN$1 = 43;
const HYPHENMINUS = 45;
const SOLIDUS$1 = 47;
const U = 117;
function defaultRecognizer(context) {
	switch (this.tokenType) {
		case Hash: return this.Hash();
		case Comma: return this.Operator();
		case LeftParenthesis: return this.Parentheses(this.readSequence, context.recognizer);
		case LeftSquareBracket: return this.Brackets(this.readSequence, context.recognizer);
		case String$1: return this.String();
		case Dimension: return this.Dimension();
		case Percentage: return this.Percentage();
		case Number$1: return this.Number();
		case Function: return this.cmpStr(this.tokenStart, this.tokenEnd, "url(") ? this.Url() : this.Function(this.readSequence, context.recognizer);
		case Url: return this.Url();
		case Ident: if (this.cmpChar(this.tokenStart, U) && this.cmpChar(this.tokenStart + 1, PLUSSIGN$1)) return this.UnicodeRange();
		else return this.Identifier();
		case Delim: {
			const code$1 = this.charCodeAt(this.tokenStart);
			if (code$1 === SOLIDUS$1 || code$1 === ASTERISK$1 || code$1 === PLUSSIGN$1 || code$1 === HYPHENMINUS) return this.Operator();
			if (code$1 === NUMBERSIGN$1) this.error("Hex or identifier is expected", this.tokenStart + 1);
			break;
		}
	}
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/scope/atrulePrelude.js
var atrulePrelude_default = { getNode: defaultRecognizer };

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/scope/selector.js
const NUMBERSIGN = 35;
const AMPERSAND = 38;
const ASTERISK = 42;
const PLUSSIGN = 43;
const SOLIDUS = 47;
const FULLSTOP = 46;
const GREATERTHANSIGN = 62;
const VERTICALLINE = 124;
const TILDE = 126;
function onWhiteSpace(next, children) {
	if (children.last !== null && children.last.type !== "Combinator" && next !== null && next.type !== "Combinator") children.push({
		type: "Combinator",
		loc: null,
		name: " "
	});
}
function getNode() {
	switch (this.tokenType) {
		case LeftSquareBracket: return this.AttributeSelector();
		case Hash: return this.IdSelector();
		case Colon: if (this.lookupType(1) === Colon) return this.PseudoElementSelector();
		else return this.PseudoClassSelector();
		case Ident: return this.TypeSelector();
		case Number$1:
		case Percentage: return this.Percentage();
		case Dimension:
			if (this.charCodeAt(this.tokenStart) === FULLSTOP) this.error("Identifier is expected", this.tokenStart + 1);
			break;
		case Delim:
			switch (this.charCodeAt(this.tokenStart)) {
				case PLUSSIGN:
				case GREATERTHANSIGN:
				case TILDE:
				case SOLIDUS: return this.Combinator();
				case FULLSTOP: return this.ClassSelector();
				case ASTERISK:
				case VERTICALLINE: return this.TypeSelector();
				case NUMBERSIGN: return this.IdSelector();
				case AMPERSAND: return this.NestingSelector();
			}
			break;
	}
}
var selector_default = {
	onWhiteSpace,
	getNode
};

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/function/expression.js
function expression_default() {
	return this.createSingleNodeList(this.Raw(null, false));
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/function/var.js
function var_default() {
	const children = this.createList();
	this.skipSC();
	children.push(this.Identifier());
	this.skipSC();
	if (this.tokenType === Comma) {
		children.push(this.Operator());
		const startIndex = this.tokenIndex;
		const value = this.parseCustomProperty ? this.Value(null) : this.Raw(this.consumeUntilExclamationMarkOrSemicolon, false);
		if (value.type === "Value" && value.children.isEmpty) {
			for (let offset = startIndex - this.tokenIndex; offset <= 0; offset++) if (this.lookupType(offset) === WhiteSpace) {
				value.children.appendData({
					type: "WhiteSpace",
					loc: null,
					value: " "
				});
				break;
			}
		}
		children.push(value);
	}
	return children;
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/scope/value.js
function isPlusMinusOperator(node) {
	return node !== null && node.type === "Operator" && (node.value[node.value.length - 1] === "-" || node.value[node.value.length - 1] === "+");
}
var value_default = {
	getNode: defaultRecognizer,
	onWhiteSpace(next, children) {
		if (isPlusMinusOperator(next)) next.value = " " + next.value;
		if (isPlusMinusOperator(children.last)) children.last.value += " ";
	},
	"expression": expression_default,
	"var": var_default
};

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/scope/index.js
var scope_exports = /* @__PURE__ */ __export({
	AtrulePrelude: () => atrulePrelude_default,
	Selector: () => selector_default,
	Value: () => value_default
});

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/atrule/container.js
const nonContainerNameKeywords = new Set([
	"none",
	"and",
	"not",
	"or"
]);
var container_default = { parse: {
	prelude() {
		const children = this.createList();
		if (this.tokenType === Ident) {
			const name$49 = this.substring(this.tokenStart, this.tokenEnd);
			if (!nonContainerNameKeywords.has(name$49.toLowerCase())) children.push(this.Identifier());
		}
		children.push(this.Condition("container"));
		return children;
	},
	block(nested = false) {
		return this.Block(nested);
	}
} };

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/atrule/font-face.js
var font_face_default = { parse: {
	prelude: null,
	block() {
		return this.Block(true);
	}
} };

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/atrule/import.js
function parseWithFallback(parse$51, fallback) {
	return this.parseWithFallback(() => {
		try {
			return parse$51.call(this);
		} finally {
			this.skipSC();
			if (this.lookupNonWSType(0) !== RightParenthesis) this.error();
		}
	}, fallback || (() => this.Raw(null, true)));
}
const parseFunctions = {
	layer() {
		this.skipSC();
		const children = this.createList();
		const node = parseWithFallback.call(this, this.Layer);
		if (node.type !== "Raw" || node.value !== "") children.push(node);
		return children;
	},
	supports() {
		this.skipSC();
		const children = this.createList();
		const node = parseWithFallback.call(this, this.Declaration, () => parseWithFallback.call(this, () => this.Condition("supports")));
		if (node.type !== "Raw" || node.value !== "") children.push(node);
		return children;
	}
};
var import_default = { parse: {
	prelude() {
		const children = this.createList();
		switch (this.tokenType) {
			case String$1:
				children.push(this.String());
				break;
			case Url:
			case Function:
				children.push(this.Url());
				break;
			default: this.error("String or url() is expected");
		}
		this.skipSC();
		if (this.tokenType === Ident && this.cmpStr(this.tokenStart, this.tokenEnd, "layer")) children.push(this.Identifier());
		else if (this.tokenType === Function && this.cmpStr(this.tokenStart, this.tokenEnd, "layer(")) children.push(this.Function(null, parseFunctions));
		this.skipSC();
		if (this.tokenType === Function && this.cmpStr(this.tokenStart, this.tokenEnd, "supports(")) children.push(this.Function(null, parseFunctions));
		if (this.lookupNonWSType(0) === Ident || this.lookupNonWSType(0) === LeftParenthesis) children.push(this.MediaQueryList());
		return children;
	},
	block: null
} };

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/atrule/layer.js
var layer_default = { parse: {
	prelude() {
		return this.createSingleNodeList(this.LayerList());
	},
	block() {
		return this.Block(false);
	}
} };

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/atrule/media.js
var media_default = { parse: {
	prelude() {
		return this.createSingleNodeList(this.MediaQueryList());
	},
	block(nested = false) {
		return this.Block(nested);
	}
} };

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/atrule/nest.js
var nest_default = { parse: {
	prelude() {
		return this.createSingleNodeList(this.SelectorList());
	},
	block() {
		return this.Block(true);
	}
} };

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/atrule/page.js
var page_default = { parse: {
	prelude() {
		return this.createSingleNodeList(this.SelectorList());
	},
	block() {
		return this.Block(true);
	}
} };

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/atrule/scope.js
var scope_default = { parse: {
	prelude() {
		return this.createSingleNodeList(this.Scope());
	},
	block(nested = false) {
		return this.Block(nested);
	}
} };

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/atrule/starting-style.js
var starting_style_default = { parse: {
	prelude: null,
	block(nested = false) {
		return this.Block(nested);
	}
} };

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/atrule/supports.js
var supports_default = { parse: {
	prelude() {
		return this.createSingleNodeList(this.Condition("supports"));
	},
	block(nested = false) {
		return this.Block(nested);
	}
} };

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/atrule/index.js
var atrule_default = {
	container: container_default,
	"font-face": font_face_default,
	import: import_default,
	layer: layer_default,
	media: media_default,
	nest: nest_default,
	page: page_default,
	scope: scope_default,
	"starting-style": starting_style_default,
	supports: supports_default
};

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/pseudo/lang.js
function parseLanguageRangeList() {
	const children = this.createList();
	this.skipSC();
	loop: while (!this.eof) {
		switch (this.tokenType) {
			case Ident:
				children.push(this.Identifier());
				break;
			case String$1:
				children.push(this.String());
				break;
			case Comma:
				children.push(this.Operator());
				break;
			case RightParenthesis: break loop;
			default: this.error("Identifier, string or comma is expected");
		}
		this.skipSC();
	}
	return children;
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/pseudo/index.js
const selectorList = { parse() {
	return this.createSingleNodeList(this.SelectorList());
} };
const selector = { parse() {
	return this.createSingleNodeList(this.Selector());
} };
const identList = { parse() {
	return this.createSingleNodeList(this.Identifier());
} };
const langList = { parse: parseLanguageRangeList };
const nth = { parse() {
	return this.createSingleNodeList(this.Nth());
} };
var pseudo_default = {
	"dir": identList,
	"has": selectorList,
	"lang": langList,
	"matches": selectorList,
	"is": selectorList,
	"-moz-any": selectorList,
	"-webkit-any": selectorList,
	"where": selectorList,
	"not": selectorList,
	"nth-child": nth,
	"nth-last-child": nth,
	"nth-last-of-type": nth,
	"nth-of-type": nth,
	"slotted": selector,
	"host": selector,
	"host-context": selector
};

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/node/index-parse.js
var index_parse_exports = /* @__PURE__ */ __export({
	AnPlusB: () => parse$1,
	Atrule: () => parse$2,
	AtrulePrelude: () => parse$3,
	AttributeSelector: () => parse$4,
	Block: () => parse$5,
	Brackets: () => parse$6,
	CDC: () => parse$7,
	CDO: () => parse$8,
	ClassSelector: () => parse$9,
	Combinator: () => parse$10,
	Comment: () => parse$11,
	Condition: () => parse$12,
	Declaration: () => parse$13,
	DeclarationList: () => parse$14,
	Dimension: () => parse$15,
	Feature: () => parse$16,
	FeatureFunction: () => parse$17,
	FeatureRange: () => parse$18,
	Function: () => parse$19,
	GeneralEnclosed: () => parse$20,
	Hash: () => parse$21,
	IdSelector: () => parse$23,
	Identifier: () => parse$22,
	Layer: () => parse$24,
	LayerList: () => parse$25,
	MediaQuery: () => parse$26,
	MediaQueryList: () => parse$27,
	NestingSelector: () => parse$28,
	Nth: () => parse$29,
	Number: () => parse$30,
	Operator: () => parse$31,
	Parentheses: () => parse$32,
	Percentage: () => parse$33,
	PseudoClassSelector: () => parse$34,
	PseudoElementSelector: () => parse$35,
	Ratio: () => parse$36,
	Raw: () => parse$37,
	Rule: () => parse$38,
	Scope: () => parse$39,
	Selector: () => parse$40,
	SelectorList: () => parse$41,
	String: () => parse$42,
	StyleSheet: () => parse$43,
	SupportsDeclaration: () => parse$44,
	TypeSelector: () => parse$45,
	UnicodeRange: () => parse$46,
	Url: () => parse$47,
	Value: () => parse$48,
	WhiteSpace: () => parse$49
});

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/config/parser.js
var parser_default = {
	parseContext: {
		default: "StyleSheet",
		stylesheet: "StyleSheet",
		atrule: "Atrule",
		atrulePrelude(options) {
			return this.AtrulePrelude(options.atrule ? String(options.atrule) : null);
		},
		mediaQueryList: "MediaQueryList",
		mediaQuery: "MediaQuery",
		condition(options) {
			return this.Condition(options.kind);
		},
		rule: "Rule",
		selectorList: "SelectorList",
		selector: "Selector",
		block() {
			return this.Block(true);
		},
		declarationList: "DeclarationList",
		declaration: "Declaration",
		value: "Value"
	},
	features: {
		supports: { selector() {
			return this.Selector();
		} },
		container: { style() {
			return this.Declaration();
		} }
	},
	scope: scope_exports,
	atrule: atrule_default,
	pseudo: pseudo_default,
	node: index_parse_exports
};

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/config/walker.js
var walker_default = { node: node_exports };

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/syntax/index.js
var syntax_default = create_default({
	...lexer_default,
	...parser_default,
	...walker_default
});

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/version.js
const { version } = {
	"name": "css-tree",
	"version": "3.1.0",
	"description": "A tool set for CSS: fast detailed parser (CSS → AST), walker (AST traversal), generator (AST → CSS) and lexer (validation and matching) based on specs and browser implementations",
	"author": "Roman Dvornov <rdvornov@gmail.com> (https://github.com/lahmatiy)",
	"license": "MIT",
	"repository": "csstree/csstree",
	"keywords": [
		"css",
		"ast",
		"tokenizer",
		"parser",
		"walker",
		"lexer",
		"generator",
		"utils",
		"syntax",
		"validation"
	],
	"type": "module",
	"module": "./lib/index.js",
	"main": "./cjs/index.cjs",
	"exports": {
		".": {
			"import": "./lib/index.js",
			"require": "./cjs/index.cjs"
		},
		"./dist/*": "./dist/*.js",
		"./package.json": "./package.json",
		"./tokenizer": {
			"import": "./lib/tokenizer/index.js",
			"require": "./cjs/tokenizer/index.cjs"
		},
		"./parser": {
			"import": "./lib/parser/index.js",
			"require": "./cjs/parser/index.cjs"
		},
		"./selector-parser": {
			"import": "./lib/parser/parse-selector.js",
			"require": "./cjs/parser/parse-selector.cjs"
		},
		"./generator": {
			"import": "./lib/generator/index.js",
			"require": "./cjs/generator/index.cjs"
		},
		"./walker": {
			"import": "./lib/walker/index.js",
			"require": "./cjs/walker/index.cjs"
		},
		"./convertor": {
			"import": "./lib/convertor/index.js",
			"require": "./cjs/convertor/index.cjs"
		},
		"./lexer": {
			"import": "./lib/lexer/index.js",
			"require": "./cjs/lexer/index.cjs"
		},
		"./definition-syntax": {
			"import": "./lib/definition-syntax/index.js",
			"require": "./cjs/definition-syntax/index.cjs"
		},
		"./definition-syntax-data": {
			"import": "./lib/data.js",
			"require": "./cjs/data.cjs"
		},
		"./definition-syntax-data-patch": {
			"import": "./lib/data-patch.js",
			"require": "./cjs/data-patch.cjs"
		},
		"./utils": {
			"import": "./lib/utils/index.js",
			"require": "./cjs/utils/index.cjs"
		}
	},
	"browser": {
		"./cjs/data.cjs": "./dist/data.cjs",
		"./cjs/version.cjs": "./dist/version.cjs",
		"./lib/data.js": "./dist/data.js",
		"./lib/version.js": "./dist/version.js"
	},
	"unpkg": "dist/csstree.esm.js",
	"jsdelivr": "dist/csstree.esm.js",
	"scripts": {
		"watch": "npm run build -- --watch",
		"build": "npm run bundle && npm run esm-to-cjs --",
		"build-and-test": "npm run build && npm run test:dist && npm run test:cjs",
		"bundle": "node scripts/bundle",
		"bundle-and-test": "npm run bundle && npm run test:dist",
		"esm-to-cjs": "node scripts/esm-to-cjs.cjs",
		"esm-to-cjs-and-test": "npm run esm-to-cjs && npm run test:cjs",
		"lint": "eslint lib scripts && node scripts/review-syntax-patch --lint && node scripts/update-docs --lint",
		"lint-and-test": "npm run lint && npm test",
		"update:docs": "node scripts/update-docs",
		"review:syntax-patch": "node scripts/review-syntax-patch",
		"test": "mocha lib/__tests --require lib/__tests/helpers/setup.js --reporter progress",
		"test:cjs": "mocha cjs/__tests --require lib/__tests/helpers/setup.js --reporter progress",
		"test:dist": "mocha dist/__tests --reporter progress",
		"coverage": "c8 --exclude lib/__tests --reporter=lcovonly npm test",
		"prepublishOnly": "npm run lint-and-test && npm run build-and-test"
	},
	"dependencies": {
		"mdn-data": "2.12.2",
		"source-map-js": "^1.0.1"
	},
	"devDependencies": {
		"c8": "^7.12.0",
		"clap": "^2.0.1",
		"esbuild": "^0.24.0",
		"eslint": "^8.4.1",
		"json-to-ast": "^2.1.0",
		"mocha": "^9.2.2",
		"rollup": "^2.79.2"
	},
	"engines": { "node": "^10 || ^12.20.0 || ^14.13.0 || >=15.0.0" },
	"files": [
		"data",
		"dist",
		"cjs",
		"!cjs/__tests",
		"lib",
		"!lib/__tests"
	]
};

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/utils/clone.js
function clone(node) {
	const result = {};
	for (const key of Object.keys(node)) {
		let value = node[key];
		if (value) {
			if (Array.isArray(value) || value instanceof List) value = value.map(clone);
			else if (value.constructor === Object) value = clone(value);
		}
		result[key] = value;
	}
	return result;
}

//#endregion
//#region ../../node_modules/.pnpm/css-tree@3.1.0/node_modules/css-tree/lib/index.js
const { tokenize, parse, generate, lexer, createLexer, walk, find, findLast, findAll, toPlainObject, fromPlainObject, fork } = syntax_default;

//#endregion
//#region src/utils/css/is-rule-inlinable.ts
function isRuleInlinable(rule) {
	const hasAtRuleInside = find(rule, (node) => node.type === "Atrule") !== null;
	const hasPseudoSelector = find(rule, (node) => node.type === "PseudoClassSelector" || node.type === "PseudoElementSelector") !== null;
	return !hasAtRuleInside && !hasPseudoSelector;
}

//#endregion
//#region src/utils/css/is-part-inlinable.ts
function isPartInlinable(part) {
	const hasAtRuleInside = find(part, (node) => node.type === "Atrule") !== null;
	const hasPseudoSelector = find(part, (node) => node.type === "PseudoClassSelector" || node.type === "PseudoElementSelector") !== null;
	return !hasAtRuleInside && !hasPseudoSelector;
}

//#endregion
//#region src/utils/css/split-mixed-rule.ts
/**
* Split a rule into inlinable and non-inlinable parts. Caller must only pass rules
* for which isRuleInlinable(rule) is false. Returns clones so the original stylesheet is never mutated.
*
* @returns inlinablePart: rule with only inlinable block children, or null if none.
*          nonInlinablePart: rule with only non-inlinable block children, or null if none.
*/
function splitMixedRule(rule) {
	if (rule.prelude !== null && find(rule.prelude, (node) => node.type === "PseudoClassSelector" || node.type === "PseudoElementSelector") !== null) return {
		inlinablePart: null,
		nonInlinablePart: clone(rule)
	};
	const ruleCloneInlinable = clone(rule);
	const ruleCloneNonInlinable = clone(rule);
	const inlinableParts = [];
	const nonInlinableParts = [];
	for (const part of ruleCloneInlinable.block.children.toArray()) if (isPartInlinable(part)) inlinableParts.push(part);
	else nonInlinableParts.push(part);
	return {
		inlinablePart: inlinableParts.length > 0 ? {
			...ruleCloneInlinable,
			block: {
				type: "Block",
				children: new List().fromArray(inlinableParts)
			}
		} : null,
		nonInlinablePart: nonInlinableParts.length > 0 ? {
			...ruleCloneNonInlinable,
			block: {
				type: "Block",
				children: new List().fromArray(nonInlinableParts)
			}
		} : null
	};
}

//#endregion
//#region src/utils/css/extract-rules-per-class.ts
function extractRulesPerClass(root, classes) {
	const classSet = new Set(classes);
	const inlinableRules = /* @__PURE__ */ new Map();
	const nonInlinableRules = /* @__PURE__ */ new Map();
	walk(root, {
		visit: "Rule",
		enter(rule) {
			const selectorClasses = [];
			walk(rule, {
				visit: "ClassSelector",
				enter(classSelector) {
					selectorClasses.push(decode$1(classSelector.name));
				}
			});
			if (isRuleInlinable(rule)) {
				for (const className of selectorClasses) if (classSet.has(className)) inlinableRules.set(className, rule);
			} else {
				const { inlinablePart, nonInlinablePart } = splitMixedRule(rule);
				for (const className of selectorClasses) {
					if (!classSet.has(className)) continue;
					if (inlinablePart) inlinableRules.set(className, inlinablePart);
					if (nonInlinablePart) nonInlinableRules.set(className, nonInlinablePart);
				}
			}
		}
	});
	return {
		inlinable: inlinableRules,
		nonInlinable: nonInlinableRules
	};
}

//#endregion
//#region src/utils/css/get-custom-properties.ts
function getCustomProperties(node) {
	const customProperties = /* @__PURE__ */ new Map();
	walk(node, {
		visit: "Atrule",
		enter(atrule) {
			if (atrule.name === "property" && atrule.prelude) {
				const prelude = generate(atrule.prelude);
				if (prelude.startsWith("--")) {
					let syntax;
					let inherits;
					let initialValue;
					walk(atrule, {
						visit: "Declaration",
						enter(declaration) {
							if (declaration.property === "syntax") syntax = declaration;
							if (declaration.property === "inherits") inherits = declaration;
							if (declaration.property === "initial-value") initialValue = declaration;
						}
					});
					customProperties.set(prelude, {
						syntax,
						inherits,
						initialValue
					});
				}
			}
		}
	});
	return customProperties;
}

//#endregion
//#region src/utils/text/from-dash-case-to-camel-case.ts
const fromDashCaseToCamelCase = (text) => {
	return text.replace(/-(\w|$)/g, (_, p1) => p1.toUpperCase());
};

//#endregion
//#region src/utils/compatibility/get-react-property.ts
function getReactProperty(prop) {
	const modifiedProp = prop.toLowerCase();
	if (modifiedProp.startsWith("--")) return modifiedProp;
	if (modifiedProp.startsWith("-ms-")) return fromDashCaseToCamelCase(modifiedProp.slice(1));
	return fromDashCaseToCamelCase(modifiedProp);
}

//#endregion
//#region src/utils/css/unwrap-value.ts
function unwrapValue(value) {
	if (value.type === "Value" && value.children.size === 1) return value.children.first ?? value;
	return value;
}

//#endregion
//#region src/utils/css/make-inline-styles-for.ts
function makeInlineStylesFor(inlinableRules, customProperties) {
	const styles = {};
	const localVariableDeclarations = /* @__PURE__ */ new Map();
	for (const rule of inlinableRules) walk(rule, {
		visit: "Declaration",
		enter(declaration) {
			if (declaration.property.startsWith("--")) localVariableDeclarations.set(declaration.property, declaration);
		}
	});
	for (const rule of inlinableRules) {
		walk(rule, {
			visit: "Function",
			enter(func, funcParentListItem) {
				if (func.name === "var") {
					let variableName;
					walk(func, {
						visit: "Identifier",
						enter(identifier) {
							variableName = identifier.name;
							return this.break;
						}
					});
					if (variableName) {
						const definition = localVariableDeclarations.get(variableName);
						if (definition) funcParentListItem.data = unwrapValue(definition.value);
						else {
							const customProperty = customProperties.get(variableName);
							if (customProperty?.initialValue) funcParentListItem.data = unwrapValue(customProperty.initialValue.value);
						}
					}
				}
			}
		});
		walk(rule, {
			visit: "Declaration",
			enter(declaration) {
				if (declaration.property.startsWith("--")) return;
				styles[getReactProperty(declaration.property)] = generate(declaration.value) + (declaration.important ? "!important" : "");
			}
		});
	}
	return styles;
}

//#endregion
//#region src/inline-styles.ts
function inlineStyles(styleSheet, classes) {
	const { inlinable: inlinableRules } = extractRulesPerClass(styleSheet, classes);
	const customProperties = getCustomProperties(styleSheet);
	return makeInlineStylesFor(Array.from(inlinableRules.values()), customProperties);
}

//#endregion
//#region src/utils/css/resolve-all-css-variables.ts
function doSelectorsIntersect(first, second) {
	if (generate(first) === generate(second)) return true;
	let hasSomeUniversal = false;
	const walker = (node, _parentListItem, parentList) => {
		if (hasSomeUniversal) return;
		if (node.type === "PseudoClassSelector" && node.name === "root") hasSomeUniversal = true;
		if (node.type === "TypeSelector" && node.name === "*" && parentList.size === 1) hasSomeUniversal = true;
	};
	walk(first, walker);
	walk(second, walker);
	if (hasSomeUniversal) return true;
	return false;
}
function resolveAllCssVariables(node) {
	const variableDefinitions = /* @__PURE__ */ new Set();
	const variableUses = /* @__PURE__ */ new Set();
	const path = [];
	walk(node, {
		leave() {
			path.shift();
		},
		enter(node$1) {
			if (node$1.type === "Declaration") {
				const declaration = node$1;
				if (path.some((ancestor) => ancestor.type === "Atrule" && ancestor.name === "layer" && ancestor.prelude !== null && generate(ancestor.prelude).includes("properties"))) {
					path.unshift(node$1);
					return;
				}
				if (/--[\S]+/.test(declaration.property)) variableDefinitions.add({
					declaration,
					path: [...path],
					variableName: declaration.property,
					definition: generate(declaration.value)
				});
				else {
					function parseVariableUsesFrom(node$2) {
						walk(node$2, {
							visit: "Function",
							enter(funcNode) {
								if (funcNode.name === "var") {
									const children = funcNode.children.toArray();
									const name$49 = generate(children[0]);
									const fallback = children[2] ? generate(children[2]) : void 0;
									variableUses.add({
										declaration,
										path: [...path],
										fallback,
										variableName: name$49,
										raw: generate(funcNode)
									});
									if (fallback?.includes("var(")) parseVariableUsesFrom(parse(fallback, { context: "value" }));
								}
							}
						});
					}
					parseVariableUsesFrom(declaration.value);
				}
			}
			path.unshift(node$1);
		}
	});
	for (const use of variableUses) {
		let hasReplaced = false;
		for (const definition of variableDefinitions) {
			if (use.variableName !== definition.variableName) continue;
			if (use.path[0]?.type === "Block" && use.path[1]?.type === "Atrule" && use.path[2]?.type === "Block" && use.path[3]?.type === "Rule" && definition.path[0].type === "Block" && definition.path[1].type === "Rule" && doSelectorsIntersect(use.path[3].prelude, definition.path[1].prelude)) {
				use.declaration.value = parse(generate(use.declaration.value).replaceAll(use.raw, definition.definition), { context: "value" });
				hasReplaced = true;
				break;
			}
			if (use.path[0]?.type === "Block" && use.path[1]?.type === "Rule" && definition.path[0]?.type === "Block" && definition.path[1]?.type === "Rule" && doSelectorsIntersect(use.path[1].prelude, definition.path[1].prelude)) {
				use.declaration.value = parse(generate(use.declaration.value).replaceAll(use.raw, definition.definition), { context: "value" });
				hasReplaced = true;
				break;
			}
		}
		if (!hasReplaced && use.fallback) use.declaration.value = parse(generate(use.declaration.value).replaceAll(use.raw, use.fallback), { context: "value" });
	}
}

//#endregion
//#region src/utils/css/resolve-calc-expressions.ts
/**
* Intentionally only resolves `*` and `/` operations without dealing with parenthesis, because this is the only thing required to run Tailwind v4
*/
function resolveCalcExpressions(node) {
	walk(node, {
		visit: "Function",
		enter(func, funcListItem) {
			if (func.name === "calc") {
				func.children.forEach((child, item) => {
					const left = item.prev;
					const right = item.next;
					if (left && right && child.type === "Operator" && (left.data.type === "Dimension" || left.data.type === "Number" || left.data.type === "Percentage") && (right.data.type === "Dimension" || right.data.type === "Number" || right.data.type === "Percentage")) {
						if (child.value === "*" || child.value === "/") {
							const value = (() => {
								if (child.value === "*") return String(Number.parseFloat(left.data.value) * Number.parseFloat(right.data.value));
								if (right.data.value === "0") return "0";
								return String(Number.parseFloat(left.data.value) / Number.parseFloat(right.data.value));
							})();
							if (left.data.type === "Dimension" && right.data.type === "Number") {
								item.data = {
									type: "Dimension",
									unit: left.data.unit,
									value
								};
								func.children.remove(left);
								func.children.remove(right);
							} else if (left.data.type === "Number" && right.data.type === "Dimension") {
								item.data = {
									type: "Dimension",
									unit: right.data.unit,
									value
								};
								func.children.remove(left);
								func.children.remove(right);
							} else if (left.data.type === "Number" && right.data.type === "Number") {
								item.data = {
									type: "Number",
									value
								};
								func.children.remove(left);
								func.children.remove(right);
							} else if (left.data.type === "Dimension" && right.data.type === "Dimension" && left.data.unit === right.data.unit) {
								if (child.value === "/") item.data = {
									type: "Number",
									value
								};
								else item.data = {
									type: "Dimension",
									unit: left.data.unit,
									value
								};
								func.children.remove(left);
								func.children.remove(right);
							} else if (left.data.type === "Percentage" && right.data.type === "Number") {
								item.data = {
									type: "Percentage",
									value
								};
								func.children.remove(left);
								func.children.remove(right);
							} else if (left.data.type === "Number" && right.data.type === "Percentage") {
								item.data = {
									type: "Percentage",
									value
								};
								func.children.remove(left);
								func.children.remove(right);
							} else if (left.data.type === "Percentage" && right.data.type === "Percentage") {
								if (child.value === "/") item.data = {
									type: "Number",
									value
								};
								else item.data = {
									type: "Percentage",
									value
								};
								func.children.remove(left);
								func.children.remove(right);
							}
						}
					}
				});
				if (func.children.size === 1 && func.children.first) funcListItem.data = func.children.first;
			}
		}
	});
}

//#endregion
//#region src/utils/css/sanitize-declarations.ts
function rgbNode(r, g, b, alpha) {
	const children = new List();
	children.appendData({
		type: "Number",
		value: r.toFixed(0)
	});
	children.appendData({
		type: "Operator",
		value: ","
	});
	children.appendData({
		type: "Number",
		value: g.toFixed(0)
	});
	children.appendData({
		type: "Operator",
		value: ","
	});
	children.appendData({
		type: "Number",
		value: b.toFixed(0)
	});
	if (alpha !== 1 && alpha !== void 0) {
		children.appendData({
			type: "Operator",
			value: ","
		});
		children.appendData({
			type: "Number",
			value: alpha.toString()
		});
	}
	return {
		type: "Function",
		name: "rgb",
		children
	};
}
const LAB_TO_LMS = {
	l: [.3963377773761749, .2158037573099136],
	m: [-.1055613458156586, -.0638541728258133],
	s: [-.0894841775298119, -1.2914855480194092]
};
const LSM_TO_RGB = {
	r: [
		4.076741636075958,
		-3.307711539258063,
		.2309699031821043
	],
	g: [
		-1.2684379732850315,
		2.609757349287688,
		-.341319376002657
	],
	b: [
		-.0041960761386756,
		-.7034186179359362,
		1.7076146940746117
	]
};
function lrgbToRgb(input) {
	const absoluteNumber = Math.abs(input);
	const sign = input < 0 ? -1 : 1;
	if (absoluteNumber > .0031308) return sign * (absoluteNumber ** (1 / 2.4) * 1.055 - .055);
	return input * 12.92;
}
function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max);
}
function oklchToOklab(oklch) {
	return {
		l: oklch.l,
		a: oklch.c * Math.cos(oklch.h / 180 * Math.PI),
		b: oklch.c * Math.sin(oklch.h / 180 * Math.PI)
	};
}
/** Convert oklab to RGB */
function oklchToRgb(oklch) {
	const oklab = oklchToOklab(oklch);
	const l = (oklab.l + LAB_TO_LMS.l[0] * oklab.a + LAB_TO_LMS.l[1] * oklab.b) ** 3;
	const m = (oklab.l + LAB_TO_LMS.m[0] * oklab.a + LAB_TO_LMS.m[1] * oklab.b) ** 3;
	const s = (oklab.l + LAB_TO_LMS.s[0] * oklab.a + LAB_TO_LMS.s[1] * oklab.b) ** 3;
	const r = 255 * lrgbToRgb(LSM_TO_RGB.r[0] * l + LSM_TO_RGB.r[1] * m + LSM_TO_RGB.r[2] * s);
	const g = 255 * lrgbToRgb(LSM_TO_RGB.g[0] * l + LSM_TO_RGB.g[1] * m + LSM_TO_RGB.g[2] * s);
	const b = 255 * lrgbToRgb(LSM_TO_RGB.b[0] * l + LSM_TO_RGB.b[1] * m + LSM_TO_RGB.b[2] * s);
	return {
		r: clamp(r, 0, 255),
		g: clamp(g, 0, 255),
		b: clamp(b, 0, 255)
	};
}
function separteShorthandDeclaration(shorthandToReplace, [start, end]) {
	shorthandToReplace.property = start;
	const values = shorthandToReplace.value.type === "Value" ? shorthandToReplace.value.children.toArray().filter((child) => child.type === "Dimension" || child.type === "Number" || child.type === "Percentage") : [shorthandToReplace.value];
	let endValue = shorthandToReplace.value;
	if (values.length === 2) {
		endValue = {
			type: "Value",
			children: new List().fromArray([values[1]])
		};
		shorthandToReplace.value = {
			type: "Value",
			children: new List().fromArray([values[0]])
		};
	}
	return {
		type: "Declaration",
		property: end,
		value: endValue,
		important: shorthandToReplace.important
	};
}
/**
* Meant to do all the things necessary, in a per-declaration basis, to have the best email client
* support possible.
*
* Here's the transformations it does so far:
* - convert all `rgb` with space-based syntax into a comma based one;
* - convert all `oklch` values into `rgb`;
* - convert all hex values into `rgb`;
* - convert `padding-inline` into `padding-left` and `padding-right`;
* - convert `padding-block` into `padding-top` and `padding-bottom`;
* - convert `margin-inline` into `margin-left` and `margin-right`;
* - convert `margin-block` into `margin-top` and `margin-bottom`.
*/
function sanitizeDeclarations(nodeContainingDeclarations) {
	walk(nodeContainingDeclarations, {
		visit: "Declaration",
		enter(declaration, item, list) {
			if (declaration.value.type === "Raw") declaration.value = parse(declaration.value.value, { context: "value" });
			if (/border-radius\s*:\s*calc\s*\(\s*infinity\s*\*\s*1px\s*\)/i.test(generate(declaration))) declaration.value = parse("9999px", { context: "value" });
			walk(declaration, {
				visit: "Function",
				enter(func, funcParentListItem) {
					const children = func.children.toArray();
					if (func.name === "oklch") {
						let l;
						let c;
						let h;
						let a;
						for (const child of children) {
							if (child.type === "Number") {
								if (l === void 0) {
									l = Number.parseFloat(child.value);
									continue;
								}
								if (c === void 0) {
									c = Number.parseFloat(child.value);
									continue;
								}
								if (h === void 0) {
									h = Number.parseFloat(child.value);
									continue;
								}
								if (a === void 0) {
									a = Number.parseFloat(child.value);
									continue;
								}
							}
							if (child.type === "Dimension" && child.unit === "deg") {
								if (h === void 0) {
									h = Number.parseFloat(child.value);
									continue;
								}
							}
							if (child.type === "Percentage") {
								if (l === void 0) {
									l = Number.parseFloat(child.value) / 100;
									continue;
								}
								if (a === void 0) a = Number.parseFloat(child.value) / 100;
							}
						}
						if (l === void 0 || c === void 0 || h === void 0) throw new Error("Could not determine the parameters of an oklch() function.", { cause: declaration });
						const rgb = oklchToRgb({
							l,
							c,
							h
						});
						funcParentListItem.data = rgbNode(rgb.r, rgb.g, rgb.b, a);
					}
					if (func.name === "rgb") {
						let r;
						let g;
						let b;
						let a;
						for (const child of children) {
							if (child.type === "Number") {
								if (r === void 0) {
									r = Number.parseFloat(child.value);
									continue;
								}
								if (g === void 0) {
									g = Number.parseFloat(child.value);
									continue;
								}
								if (b === void 0) {
									b = Number.parseFloat(child.value);
									continue;
								}
								if (a === void 0) {
									a = Number.parseFloat(child.value);
									continue;
								}
							}
							if (child.type === "Percentage") {
								if (r === void 0) {
									r = Number.parseFloat(child.value) * 255 / 100;
									continue;
								}
								if (g === void 0) {
									g = Number.parseFloat(child.value) * 255 / 100;
									continue;
								}
								if (b === void 0) {
									b = Number.parseFloat(child.value) * 255 / 100;
									continue;
								}
								if (a === void 0) a = Number.parseFloat(child.value) / 100;
							}
						}
						if (r === void 0 || g === void 0 || b === void 0) throw new Error("Could not determine the parameters of an rgb() function.", { cause: declaration });
						if (a === void 0 || a === 1) funcParentListItem.data = rgbNode(r, g, b);
						else funcParentListItem.data = rgbNode(r, g, b, a);
					}
				}
			});
			walk(declaration, {
				visit: "Hash",
				enter(hash, hashParentListItem) {
					const hex = hash.value.trim();
					if (hex.length === 3) {
						hashParentListItem.data = rgbNode(Number.parseInt(hex.charAt(0) + hex.charAt(0), 16), Number.parseInt(hex.charAt(1) + hex.charAt(1), 16), Number.parseInt(hex.charAt(2) + hex.charAt(2), 16));
						return;
					}
					if (hex.length === 4) {
						hashParentListItem.data = rgbNode(Number.parseInt(hex.charAt(0) + hex.charAt(0), 16), Number.parseInt(hex.charAt(1) + hex.charAt(1), 16), Number.parseInt(hex.charAt(2) + hex.charAt(2), 16), Number.parseInt(hex.charAt(3) + hex.charAt(3), 16) / 255);
						return;
					}
					if (hex.length === 5) {
						hashParentListItem.data = rgbNode(Number.parseInt(hex.slice(0, 2), 16), Number.parseInt(hex.charAt(2) + hex.charAt(2), 16), Number.parseInt(hex.charAt(3) + hex.charAt(3), 16), Number.parseInt(hex.charAt(4) + hex.charAt(4), 16) / 255);
						return;
					}
					if (hex.length === 6) {
						hashParentListItem.data = rgbNode(Number.parseInt(hex.slice(0, 2), 16), Number.parseInt(hex.slice(2, 4), 16), Number.parseInt(hex.slice(4, 6), 16));
						return;
					}
					if (hex.length === 7) {
						hashParentListItem.data = rgbNode(Number.parseInt(hex.slice(0, 2), 16), Number.parseInt(hex.slice(2, 4), 16), Number.parseInt(hex.slice(4, 6), 16), Number.parseInt(hex.charAt(6) + hex.charAt(6), 16) / 255);
						return;
					}
					hashParentListItem.data = rgbNode(Number.parseInt(hex.slice(0, 2), 16), Number.parseInt(hex.slice(2, 4), 16), Number.parseInt(hex.slice(4, 6), 16), Number.parseInt(hex.slice(6, 8), 16) / 255);
				}
			});
			walk(declaration, {
				visit: "Function",
				enter(func, parentListItem) {
					if (func.name === "color-mix") {
						const children = func.children.toArray();
						const color = children[3];
						const opacity = children[4];
						if (func.children.last?.type === "Identifier" && func.children.last.name === "transparent" && color?.type === "Function" && color?.name === "rgb" && opacity) {
							color.children.appendData({
								type: "Operator",
								value: ","
							});
							color.children.appendData(opacity);
							parentListItem.data = color;
						}
					}
				}
			});
			if (declaration.property === "padding-inline") {
				const paddingRight = separteShorthandDeclaration(declaration, ["padding-left", "padding-right"]);
				list.insertData(paddingRight, item);
			}
			if (declaration.property === "padding-block") {
				const paddingBottom = separteShorthandDeclaration(declaration, ["padding-top", "padding-bottom"]);
				list.insertData(paddingBottom, item);
			}
			if (declaration.property === "margin-inline") {
				const marginRight = separteShorthandDeclaration(declaration, ["margin-left", "margin-right"]);
				list.insertData(marginRight, item);
			}
			if (declaration.property === "margin-block") {
				const paddingBottom = separteShorthandDeclaration(declaration, ["margin-top", "margin-bottom"]);
				list.insertData(paddingBottom, item);
			}
		}
	});
}

//#endregion
//#region src/sanitize-stylesheet.ts
function sanitizeStyleSheet(styleSheet) {
	resolveAllCssVariables(styleSheet);
	resolveCalcExpressions(styleSheet);
	sanitizeDeclarations(styleSheet);
}

//#endregion
//#region src/hooks/use-suspended-promise.ts
const promiseStates = /* @__PURE__ */ new Map();
function useSuspensedPromise(promiseFn, key) {
	const previousState = promiseStates.get(key);
	if (previousState) {
		if ("error" in previousState) throw previousState.error;
		if ("result" in previousState) return previousState.result;
		throw previousState.promise;
	}
	const state = { promise: promiseFn().then((result) => state.result = result).catch((error) => state.error = error) };
	promiseStates.set(key, state);
	throw state.promise;
}

//#endregion
//#region src/utils/compatibility/sanitize-class-name.ts
const digitToNameMap = {
	"0": "zero",
	"1": "one",
	"2": "two",
	"3": "three",
	"4": "four",
	"5": "five",
	"6": "six",
	"7": "seven",
	"8": "eight",
	"9": "nine"
};
/**
* Replaces special characters to avoid problems on email clients.
*
* @param className - This should not come with any escaped charcters, it should come the same
* as is on the `className` attribute on React elements.
*/
function sanitizeClassName(className) {
	return className.replaceAll("+", "plus").replaceAll("[", "").replaceAll("%", "pc").replaceAll("]", "").replaceAll("(", "").replaceAll(")", "").replaceAll("!", "imprtnt").replaceAll(">", "gt").replaceAll("<", "lt").replaceAll("=", "eq").replace(/^[0-9]/, (digit) => {
		return digitToNameMap[digit];
	}).replace(/[^a-zA-Z0-9\-_]/g, "_");
}

//#endregion
//#region src/utils/css/sanitize-non-inlinable-rules.ts
/**
* This function goes through a few steps to ensure the best email client support and
* to ensure that media queries and pseudo classes are applied correctly alongside
* the inline styles.
*
* What it does:
* 1. Converts all declarations in all rules into important ones
* 2. Sanitizes class selectors of all non-inlinable rules
*/
function sanitizeNonInlinableRules(node) {
	walk(node, {
		visit: "Rule",
		enter(rule) {
			if (!isRuleInlinable(rule)) {
				walk(rule.prelude, (node$1) => {
					if (node$1.type === "ClassSelector") node$1.name = sanitizeClassName(decode$1(node$1.name));
				});
				walk(rule, {
					visit: "Declaration",
					enter(declaration) {
						declaration.important = true;
					}
				});
			}
		}
	});
}

//#endregion
//#region src/utils/react/is-component.ts
const componentsToTreatAsElements = [
	Body,
	Button,
	CodeBlock,
	CodeInline,
	Container,
	Heading,
	Hr,
	Img,
	Link,
	Preview,
	Text
];
const isComponent = (element) => {
	return (typeof element.type === "function" || element.type.render !== void 0) && !componentsToTreatAsElements.includes(element.type);
};

//#endregion
//#region src/utils/react/map-react-tree.ts
/**
* A function made for deep mapping a React tree from a node, even through its components.
* For all the components it finds, it renders them by directly calling them. This has a few issues
* with hooks, and the only solution is `renderAsync` here, which will probably be done in the future.
*
* @param process - The callback that will be called every time a new element has been reached.
*
* For components, this is going to be called, most of the time, two times. This is because the best
* approach is to process *both* before rendering the components (i.e. on the props.children of a component element)
* and after rendering them because the children themselves might have been modified in the component's
* rendering.
*/
function mapReactTree(value, process) {
	const mapped = React.Children.map(value, (node) => {
		if (React.isValidElement(node)) {
			const newProps = { ...node.props };
			if (node.props.children && !isComponent(node)) newProps.children = mapReactTree(node.props.children, process);
			const processed = process(React.cloneElement(node, newProps, newProps.children));
			if (React.isValidElement(processed) && isComponent(processed)) return mapReactTree((typeof processed.type === "object" ? processed.type.render : processed.type)(processed.props), process);
			return processed;
		}
		return process(node);
	});
	return mapped && mapped.length === 1 ? mapped[0] : mapped;
}

//#endregion
//#region src/utils/tailwindcss/clone-element-with-inlined-styles.ts
function cloneElementWithInlinedStyles(element, inlinableRules, nonInlinableRules, customProperties) {
	const propsToOverwrite = {};
	if (element.props.className && !isComponent(element)) {
		const classes = element.props.className.trim().split(/\s+/);
		const residualClasses = [];
		const rules = [];
		for (const className of classes) {
			const rule = inlinableRules.get(className);
			if (rule) rules.push(rule);
			if (nonInlinableRules.has(className)) residualClasses.push(className);
			else if (!rule) residualClasses.push(className);
		}
		propsToOverwrite.style = {
			...makeInlineStylesFor(rules, customProperties),
			...element.props.style
		};
		if (residualClasses.length > 0) propsToOverwrite.className = residualClasses.map((className) => {
			if (nonInlinableRules.has(className)) return sanitizeClassName(className);
			return className;
		}).join(" ");
		else propsToOverwrite.className = void 0;
	}
	const newProps = {
		...element.props,
		...propsToOverwrite
	};
	return React.cloneElement(element, newProps, newProps.children);
}

//#endregion
//#region src/utils/tailwindcss/tailwind-stylesheets/index.ts
const css$3 = `
@layer theme, base, components, utilities;

@layer theme {
  @theme default {
    --font-sans:
      ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji",
      "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
    --font-serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
    --font-mono:
      ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
      "Courier New", monospace;

    --color-red-50: oklch(97.1% 0.013 17.38);
    --color-red-100: oklch(93.6% 0.032 17.717);
    --color-red-200: oklch(88.5% 0.062 18.334);
    --color-red-300: oklch(80.8% 0.114 19.571);
    --color-red-400: oklch(70.4% 0.191 22.216);
    --color-red-500: oklch(63.7% 0.237 25.331);
    --color-red-600: oklch(57.7% 0.245 27.325);
    --color-red-700: oklch(50.5% 0.213 27.518);
    --color-red-800: oklch(44.4% 0.177 26.899);
    --color-red-900: oklch(39.6% 0.141 25.723);
    --color-red-950: oklch(25.8% 0.092 26.042);

    --color-orange-50: oklch(98% 0.016 73.684);
    --color-orange-100: oklch(95.4% 0.038 75.164);
    --color-orange-200: oklch(90.1% 0.076 70.697);
    --color-orange-300: oklch(83.7% 0.128 66.29);
    --color-orange-400: oklch(75% 0.183 55.934);
    --color-orange-500: oklch(70.5% 0.213 47.604);
    --color-orange-600: oklch(64.6% 0.222 41.116);
    --color-orange-700: oklch(55.3% 0.195 38.402);
    --color-orange-800: oklch(47% 0.157 37.304);
    --color-orange-900: oklch(40.8% 0.123 38.172);
    --color-orange-950: oklch(26.6% 0.079 36.259);

    --color-amber-50: oklch(98.7% 0.022 95.277);
    --color-amber-100: oklch(96.2% 0.059 95.617);
    --color-amber-200: oklch(92.4% 0.12 95.746);
    --color-amber-300: oklch(87.9% 0.169 91.605);
    --color-amber-400: oklch(82.8% 0.189 84.429);
    --color-amber-500: oklch(76.9% 0.188 70.08);
    --color-amber-600: oklch(66.6% 0.179 58.318);
    --color-amber-700: oklch(55.5% 0.163 48.998);
    --color-amber-800: oklch(47.3% 0.137 46.201);
    --color-amber-900: oklch(41.4% 0.112 45.904);
    --color-amber-950: oklch(27.9% 0.077 45.635);

    --color-yellow-50: oklch(98.7% 0.026 102.212);
    --color-yellow-100: oklch(97.3% 0.071 103.193);
    --color-yellow-200: oklch(94.5% 0.129 101.54);
    --color-yellow-300: oklch(90.5% 0.182 98.111);
    --color-yellow-400: oklch(85.2% 0.199 91.936);
    --color-yellow-500: oklch(79.5% 0.184 86.047);
    --color-yellow-600: oklch(68.1% 0.162 75.834);
    --color-yellow-700: oklch(55.4% 0.135 66.442);
    --color-yellow-800: oklch(47.6% 0.114 61.907);
    --color-yellow-900: oklch(42.1% 0.095 57.708);
    --color-yellow-950: oklch(28.6% 0.066 53.813);

    --color-lime-50: oklch(98.6% 0.031 120.757);
    --color-lime-100: oklch(96.7% 0.067 122.328);
    --color-lime-200: oklch(93.8% 0.127 124.321);
    --color-lime-300: oklch(89.7% 0.196 126.665);
    --color-lime-400: oklch(84.1% 0.238 128.85);
    --color-lime-500: oklch(76.8% 0.233 130.85);
    --color-lime-600: oklch(64.8% 0.2 131.684);
    --color-lime-700: oklch(53.2% 0.157 131.589);
    --color-lime-800: oklch(45.3% 0.124 130.933);
    --color-lime-900: oklch(40.5% 0.101 131.063);
    --color-lime-950: oklch(27.4% 0.072 132.109);

    --color-green-50: oklch(98.2% 0.018 155.826);
    --color-green-100: oklch(96.2% 0.044 156.743);
    --color-green-200: oklch(92.5% 0.084 155.995);
    --color-green-300: oklch(87.1% 0.15 154.449);
    --color-green-400: oklch(79.2% 0.209 151.711);
    --color-green-500: oklch(72.3% 0.219 149.579);
    --color-green-600: oklch(62.7% 0.194 149.214);
    --color-green-700: oklch(52.7% 0.154 150.069);
    --color-green-800: oklch(44.8% 0.119 151.328);
    --color-green-900: oklch(39.3% 0.095 152.535);
    --color-green-950: oklch(26.6% 0.065 152.934);

    --color-emerald-50: oklch(97.9% 0.021 166.113);
    --color-emerald-100: oklch(95% 0.052 163.051);
    --color-emerald-200: oklch(90.5% 0.093 164.15);
    --color-emerald-300: oklch(84.5% 0.143 164.978);
    --color-emerald-400: oklch(76.5% 0.177 163.223);
    --color-emerald-500: oklch(69.6% 0.17 162.48);
    --color-emerald-600: oklch(59.6% 0.145 163.225);
    --color-emerald-700: oklch(50.8% 0.118 165.612);
    --color-emerald-800: oklch(43.2% 0.095 166.913);
    --color-emerald-900: oklch(37.8% 0.077 168.94);
    --color-emerald-950: oklch(26.2% 0.051 172.552);

    --color-teal-50: oklch(98.4% 0.014 180.72);
    --color-teal-100: oklch(95.3% 0.051 180.801);
    --color-teal-200: oklch(91% 0.096 180.426);
    --color-teal-300: oklch(85.5% 0.138 181.071);
    --color-teal-400: oklch(77.7% 0.152 181.912);
    --color-teal-500: oklch(70.4% 0.14 182.503);
    --color-teal-600: oklch(60% 0.118 184.704);
    --color-teal-700: oklch(51.1% 0.096 186.391);
    --color-teal-800: oklch(43.7% 0.078 188.216);
    --color-teal-900: oklch(38.6% 0.063 188.416);
    --color-teal-950: oklch(27.7% 0.046 192.524);

    --color-cyan-50: oklch(98.4% 0.019 200.873);
    --color-cyan-100: oklch(95.6% 0.045 203.388);
    --color-cyan-200: oklch(91.7% 0.08 205.041);
    --color-cyan-300: oklch(86.5% 0.127 207.078);
    --color-cyan-400: oklch(78.9% 0.154 211.53);
    --color-cyan-500: oklch(71.5% 0.143 215.221);
    --color-cyan-600: oklch(60.9% 0.126 221.723);
    --color-cyan-700: oklch(52% 0.105 223.128);
    --color-cyan-800: oklch(45% 0.085 224.283);
    --color-cyan-900: oklch(39.8% 0.07 227.392);
    --color-cyan-950: oklch(30.2% 0.056 229.695);

    --color-sky-50: oklch(97.7% 0.013 236.62);
    --color-sky-100: oklch(95.1% 0.026 236.824);
    --color-sky-200: oklch(90.1% 0.058 230.902);
    --color-sky-300: oklch(82.8% 0.111 230.318);
    --color-sky-400: oklch(74.6% 0.16 232.661);
    --color-sky-500: oklch(68.5% 0.169 237.323);
    --color-sky-600: oklch(58.8% 0.158 241.966);
    --color-sky-700: oklch(50% 0.134 242.749);
    --color-sky-800: oklch(44.3% 0.11 240.79);
    --color-sky-900: oklch(39.1% 0.09 240.876);
    --color-sky-950: oklch(29.3% 0.066 243.157);

    --color-blue-50: oklch(97% 0.014 254.604);
    --color-blue-100: oklch(93.2% 0.032 255.585);
    --color-blue-200: oklch(88.2% 0.059 254.128);
    --color-blue-300: oklch(80.9% 0.105 251.813);
    --color-blue-400: oklch(70.7% 0.165 254.624);
    --color-blue-500: oklch(62.3% 0.214 259.815);
    --color-blue-600: oklch(54.6% 0.245 262.881);
    --color-blue-700: oklch(48.8% 0.243 264.376);
    --color-blue-800: oklch(42.4% 0.199 265.638);
    --color-blue-900: oklch(37.9% 0.146 265.522);
    --color-blue-950: oklch(28.2% 0.091 267.935);

    --color-indigo-50: oklch(96.2% 0.018 272.314);
    --color-indigo-100: oklch(93% 0.034 272.788);
    --color-indigo-200: oklch(87% 0.065 274.039);
    --color-indigo-300: oklch(78.5% 0.115 274.713);
    --color-indigo-400: oklch(67.3% 0.182 276.935);
    --color-indigo-500: oklch(58.5% 0.233 277.117);
    --color-indigo-600: oklch(51.1% 0.262 276.966);
    --color-indigo-700: oklch(45.7% 0.24 277.023);
    --color-indigo-800: oklch(39.8% 0.195 277.366);
    --color-indigo-900: oklch(35.9% 0.144 278.697);
    --color-indigo-950: oklch(25.7% 0.09 281.288);

    --color-violet-50: oklch(96.9% 0.016 293.756);
    --color-violet-100: oklch(94.3% 0.029 294.588);
    --color-violet-200: oklch(89.4% 0.057 293.283);
    --color-violet-300: oklch(81.1% 0.111 293.571);
    --color-violet-400: oklch(70.2% 0.183 293.541);
    --color-violet-500: oklch(60.6% 0.25 292.717);
    --color-violet-600: oklch(54.1% 0.281 293.009);
    --color-violet-700: oklch(49.1% 0.27 292.581);
    --color-violet-800: oklch(43.2% 0.232 292.759);
    --color-violet-900: oklch(38% 0.189 293.745);
    --color-violet-950: oklch(28.3% 0.141 291.089);

    --color-purple-50: oklch(97.7% 0.014 308.299);
    --color-purple-100: oklch(94.6% 0.033 307.174);
    --color-purple-200: oklch(90.2% 0.063 306.703);
    --color-purple-300: oklch(82.7% 0.119 306.383);
    --color-purple-400: oklch(71.4% 0.203 305.504);
    --color-purple-500: oklch(62.7% 0.265 303.9);
    --color-purple-600: oklch(55.8% 0.288 302.321);
    --color-purple-700: oklch(49.6% 0.265 301.924);
    --color-purple-800: oklch(43.8% 0.218 303.724);
    --color-purple-900: oklch(38.1% 0.176 304.987);
    --color-purple-950: oklch(29.1% 0.149 302.717);

    --color-fuchsia-50: oklch(97.7% 0.017 320.058);
    --color-fuchsia-100: oklch(95.2% 0.037 318.852);
    --color-fuchsia-200: oklch(90.3% 0.076 319.62);
    --color-fuchsia-300: oklch(83.3% 0.145 321.434);
    --color-fuchsia-400: oklch(74% 0.238 322.16);
    --color-fuchsia-500: oklch(66.7% 0.295 322.15);
    --color-fuchsia-600: oklch(59.1% 0.293 322.896);
    --color-fuchsia-700: oklch(51.8% 0.253 323.949);
    --color-fuchsia-800: oklch(45.2% 0.211 324.591);
    --color-fuchsia-900: oklch(40.1% 0.17 325.612);
    --color-fuchsia-950: oklch(29.3% 0.136 325.661);

    --color-pink-50: oklch(97.1% 0.014 343.198);
    --color-pink-100: oklch(94.8% 0.028 342.258);
    --color-pink-200: oklch(89.9% 0.061 343.231);
    --color-pink-300: oklch(82.3% 0.12 346.018);
    --color-pink-400: oklch(71.8% 0.202 349.761);
    --color-pink-500: oklch(65.6% 0.241 354.308);
    --color-pink-600: oklch(59.2% 0.249 0.584);
    --color-pink-700: oklch(52.5% 0.223 3.958);
    --color-pink-800: oklch(45.9% 0.187 3.815);
    --color-pink-900: oklch(40.8% 0.153 2.432);
    --color-pink-950: oklch(28.4% 0.109 3.907);

    --color-rose-50: oklch(96.9% 0.015 12.422);
    --color-rose-100: oklch(94.1% 0.03 12.58);
    --color-rose-200: oklch(89.2% 0.058 10.001);
    --color-rose-300: oklch(81% 0.117 11.638);
    --color-rose-400: oklch(71.2% 0.194 13.428);
    --color-rose-500: oklch(64.5% 0.246 16.439);
    --color-rose-600: oklch(58.6% 0.253 17.585);
    --color-rose-700: oklch(51.4% 0.222 16.935);
    --color-rose-800: oklch(45.5% 0.188 13.697);
    --color-rose-900: oklch(41% 0.159 10.272);
    --color-rose-950: oklch(27.1% 0.105 12.094);

    --color-slate-50: oklch(98.4% 0.003 247.858);
    --color-slate-100: oklch(96.8% 0.007 247.896);
    --color-slate-200: oklch(92.9% 0.013 255.508);
    --color-slate-300: oklch(86.9% 0.022 252.894);
    --color-slate-400: oklch(70.4% 0.04 256.788);
    --color-slate-500: oklch(55.4% 0.046 257.417);
    --color-slate-600: oklch(44.6% 0.043 257.281);
    --color-slate-700: oklch(37.2% 0.044 257.287);
    --color-slate-800: oklch(27.9% 0.041 260.031);
    --color-slate-900: oklch(20.8% 0.042 265.755);
    --color-slate-950: oklch(12.9% 0.042 264.695);

    --color-gray-50: oklch(98.5% 0.002 247.839);
    --color-gray-100: oklch(96.7% 0.003 264.542);
    --color-gray-200: oklch(92.8% 0.006 264.531);
    --color-gray-300: oklch(87.2% 0.01 258.338);
    --color-gray-400: oklch(70.7% 0.022 261.325);
    --color-gray-500: oklch(55.1% 0.027 264.364);
    --color-gray-600: oklch(44.6% 0.03 256.802);
    --color-gray-700: oklch(37.3% 0.034 259.733);
    --color-gray-800: oklch(27.8% 0.033 256.848);
    --color-gray-900: oklch(21% 0.034 264.665);
    --color-gray-950: oklch(13% 0.028 261.692);

    --color-zinc-50: oklch(98.5% 0 0);
    --color-zinc-100: oklch(96.7% 0.001 286.375);
    --color-zinc-200: oklch(92% 0.004 286.32);
    --color-zinc-300: oklch(87.1% 0.006 286.286);
    --color-zinc-400: oklch(70.5% 0.015 286.067);
    --color-zinc-500: oklch(55.2% 0.016 285.938);
    --color-zinc-600: oklch(44.2% 0.017 285.786);
    --color-zinc-700: oklch(37% 0.013 285.805);
    --color-zinc-800: oklch(27.4% 0.006 286.033);
    --color-zinc-900: oklch(21% 0.006 285.885);
    --color-zinc-950: oklch(14.1% 0.005 285.823);

    --color-neutral-50: oklch(98.5% 0 0);
    --color-neutral-100: oklch(97% 0 0);
    --color-neutral-200: oklch(92.2% 0 0);
    --color-neutral-300: oklch(87% 0 0);
    --color-neutral-400: oklch(70.8% 0 0);
    --color-neutral-500: oklch(55.6% 0 0);
    --color-neutral-600: oklch(43.9% 0 0);
    --color-neutral-700: oklch(37.1% 0 0);
    --color-neutral-800: oklch(26.9% 0 0);
    --color-neutral-900: oklch(20.5% 0 0);
    --color-neutral-950: oklch(14.5% 0 0);

    --color-stone-50: oklch(98.5% 0.001 106.423);
    --color-stone-100: oklch(97% 0.001 106.424);
    --color-stone-200: oklch(92.3% 0.003 48.717);
    --color-stone-300: oklch(86.9% 0.005 56.366);
    --color-stone-400: oklch(70.9% 0.01 56.259);
    --color-stone-500: oklch(55.3% 0.013 58.071);
    --color-stone-600: oklch(44.4% 0.011 73.639);
    --color-stone-700: oklch(37.4% 0.01 67.558);
    --color-stone-800: oklch(26.8% 0.007 34.298);
    --color-stone-900: oklch(21.6% 0.006 56.043);
    --color-stone-950: oklch(14.7% 0.004 49.25);

    --color-black: #000;
    --color-white: #fff;

    --spacing: 0.25rem;

    --breakpoint-sm: 40rem;
    --breakpoint-md: 48rem;
    --breakpoint-lg: 64rem;
    --breakpoint-xl: 80rem;
    --breakpoint-2xl: 96rem;

    --container-3xs: 16rem;
    --container-2xs: 18rem;
    --container-xs: 20rem;
    --container-sm: 24rem;
    --container-md: 28rem;
    --container-lg: 32rem;
    --container-xl: 36rem;
    --container-2xl: 42rem;
    --container-3xl: 48rem;
    --container-4xl: 56rem;
    --container-5xl: 64rem;
    --container-6xl: 72rem;
    --container-7xl: 80rem;

    --text-xs: 0.75rem;
    --text-xs--line-height: calc(1 / 0.75);
    --text-sm: 0.875rem;
    --text-sm--line-height: calc(1.25 / 0.875);
    --text-base: 1rem;
    --text-base--line-height: calc(1.5 / 1);
    --text-lg: 1.125rem;
    --text-lg--line-height: calc(1.75 / 1.125);
    --text-xl: 1.25rem;
    --text-xl--line-height: calc(1.75 / 1.25);
    --text-2xl: 1.5rem;
    --text-2xl--line-height: calc(2 / 1.5);
    --text-3xl: 1.875rem;
    --text-3xl--line-height: calc(2.25 / 1.875);
    --text-4xl: 2.25rem;
    --text-4xl--line-height: calc(2.5 / 2.25);
    --text-5xl: 3rem;
    --text-5xl--line-height: 1;
    --text-6xl: 3.75rem;
    --text-6xl--line-height: 1;
    --text-7xl: 4.5rem;
    --text-7xl--line-height: 1;
    --text-8xl: 6rem;
    --text-8xl--line-height: 1;
    --text-9xl: 8rem;
    --text-9xl--line-height: 1;

    --font-weight-thin: 100;
    --font-weight-extralight: 200;
    --font-weight-light: 300;
    --font-weight-normal: 400;
    --font-weight-medium: 500;
    --font-weight-semibold: 600;
    --font-weight-bold: 700;
    --font-weight-extrabold: 800;
    --font-weight-black: 900;

    --tracking-tighter: -0.05em;
    --tracking-tight: -0.025em;
    --tracking-normal: 0em;
    --tracking-wide: 0.025em;
    --tracking-wider: 0.05em;
    --tracking-widest: 0.1em;

    --leading-tight: 1.25;
    --leading-snug: 1.375;
    --leading-normal: 1.5;
    --leading-relaxed: 1.625;
    --leading-loose: 2;

    --radius-xs: 0.125rem;
    --radius-sm: 0.25rem;
    --radius-md: 0.375rem;
    --radius-lg: 0.5rem;
    --radius-xl: 0.75rem;
    --radius-2xl: 1rem;
    --radius-3xl: 1.5rem;
    --radius-4xl: 2rem;

    --shadow-2xs: 0 1px rgb(0 0 0 / 0.05);
    --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
    --shadow-md:
      0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    --shadow-lg:
      0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    --shadow-xl:
      0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
    --shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);

    --inset-shadow-2xs: inset 0 1px rgb(0 0 0 / 0.05);
    --inset-shadow-xs: inset 0 1px 1px rgb(0 0 0 / 0.05);
    --inset-shadow-sm: inset 0 2px 4px rgb(0 0 0 / 0.05);

    --drop-shadow-xs: 0 1px 1px rgb(0 0 0 / 0.05);
    --drop-shadow-sm: 0 1px 2px rgb(0 0 0 / 0.15);
    --drop-shadow-md: 0 3px 3px rgb(0 0 0 / 0.12);
    --drop-shadow-lg: 0 4px 4px rgb(0 0 0 / 0.15);
    --drop-shadow-xl: 0 9px 7px rgb(0 0 0 / 0.1);
    --drop-shadow-2xl: 0 25px 25px rgb(0 0 0 / 0.15);

    --text-shadow-2xs: 0px 1px 0px rgb(0 0 0 / 0.15);
    --text-shadow-xs: 0px 1px 1px rgb(0 0 0 / 0.2);
    --text-shadow-sm:
      0px 1px 0px rgb(0 0 0 / 0.075), 0px 1px 1px rgb(0 0 0 / 0.075),
      0px 2px 2px rgb(0 0 0 / 0.075);
    --text-shadow-md:
      0px 1px 1px rgb(0 0 0 / 0.1), 0px 1px 2px rgb(0 0 0 / 0.1),
      0px 2px 4px rgb(0 0 0 / 0.1);
    --text-shadow-lg:
      0px 1px 2px rgb(0 0 0 / 0.1), 0px 3px 2px rgb(0 0 0 / 0.1),
      0px 4px 8px rgb(0 0 0 / 0.1);

    --ease-in: cubic-bezier(0.4, 0, 1, 1);
    --ease-out: cubic-bezier(0, 0, 0.2, 1);
    --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

    --animate-spin: spin 1s linear infinite;
    --animate-ping: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
    --animate-pulse: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    --animate-bounce: bounce 1s infinite;

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    @keyframes ping {
      75%,
      100% {
        transform: scale(2);
        opacity: 0;
      }
    }

    @keyframes pulse {
      50% {
        opacity: 0.5;
      }
    }

    @keyframes bounce {
      0%,
      100% {
        transform: translateY(-25%);
        animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
      }

      50% {
        transform: none;
        animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
      }
    }

    --blur-xs: 4px;
    --blur-sm: 8px;
    --blur-md: 12px;
    --blur-lg: 16px;
    --blur-xl: 24px;
    --blur-2xl: 40px;
    --blur-3xl: 64px;

    --perspective-dramatic: 100px;
    --perspective-near: 300px;
    --perspective-normal: 500px;
    --perspective-midrange: 800px;
    --perspective-distant: 1200px;

    --aspect-video: 16 / 9;

    --default-transition-duration: 150ms;
    --default-transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    --default-font-family: --theme(--font-sans, initial);
    --default-font-feature-settings: --theme(
      --font-sans--font-feature-settings,
      initial
    );
    --default-font-variation-settings: --theme(
      --font-sans--font-variation-settings,
      initial
    );
    --default-mono-font-family: --theme(--font-mono, initial);
    --default-mono-font-feature-settings: --theme(
      --font-mono--font-feature-settings,
      initial
    );
    --default-mono-font-variation-settings: --theme(
      --font-mono--font-variation-settings,
      initial
    );
  }

  /* Deprecated */
  @theme default inline reference {
    --blur: 8px;
    --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
    --shadow-inner: inset 0 2px 4px 0 rgb(0 0 0 / 0.05);
    --drop-shadow: 0 1px 2px rgb(0 0 0 / 0.1), 0 1px 1px rgb(0 0 0 / 0.06);
    --radius: 0.25rem;
    --max-width-prose: 65ch;
  }
}

@layer base {
  /*
  1. Prevent padding and border from affecting element width. (https://github.com/mozdevs/cssremedy/issues/4)
  2. Remove default margins and padding
  3. Reset all borders.
*/

  *,
  ::after,
  ::before,
  ::backdrop,
  ::file-selector-button {
    box-sizing: border-box; /* 1 */
    margin: 0; /* 2 */
    padding: 0; /* 2 */
    border: 0 solid; /* 3 */
  }

  /*
  1. Use a consistent sensible line-height in all browsers.
  2. Prevent adjustments of font size after orientation changes in iOS.
  3. Use a more readable tab size.
  4. Use the user's configured \`sans\` font-family by default.
  5. Use the user's configured \`sans\` font-feature-settings by default.
  6. Use the user's configured \`sans\` font-variation-settings by default.
  7. Disable tap highlights on iOS.
*/

  html,
  :host {
    line-height: 1.5; /* 1 */
    -webkit-text-size-adjust: 100%; /* 2 */
    tab-size: 4; /* 3 */
    font-family: --theme(
      --default-font-family,
      ui-sans-serif,
      system-ui,
      sans-serif,
      "Apple Color Emoji",
      "Segoe UI Emoji",
      "Segoe UI Symbol",
      "Noto Color Emoji"
    ); /* 4 */
    font-feature-settings: --theme(
      --default-font-feature-settings,
      normal
    ); /* 5 */
    font-variation-settings: --theme(
      --default-font-variation-settings,
      normal
    ); /* 6 */
    -webkit-tap-highlight-color: transparent; /* 7 */
  }

  /*
  1. Add the correct height in Firefox.
  2. Correct the inheritance of border color in Firefox. (https://bugzilla.mozilla.org/show_bug.cgi?id=190655)
  3. Reset the default border style to a 1px solid border.
*/

  hr {
    height: 0; /* 1 */
    color: inherit; /* 2 */
    border-top-width: 1px; /* 3 */
  }

  /*
  Add the correct text decoration in Chrome, Edge, and Safari.
*/

  abbr:where([title]) {
    -webkit-text-decoration: underline dotted;
    text-decoration: underline dotted;
  }

  /*
  Remove the default font size and weight for headings.
*/

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-size: inherit;
    font-weight: inherit;
  }

  /*
  Reset links to optimize for opt-in styling instead of opt-out.
*/

  a {
    color: inherit;
    -webkit-text-decoration: inherit;
    text-decoration: inherit;
  }

  /*
  Add the correct font weight in Edge and Safari.
*/

  b,
  strong {
    font-weight: bolder;
  }

  /*
  1. Use the user's configured \`mono\` font-family by default.
  2. Use the user's configured \`mono\` font-feature-settings by default.
  3. Use the user's configured \`mono\` font-variation-settings by default.
  4. Correct the odd \`em\` font sizing in all browsers.
*/

  code,
  kbd,
  samp,
  pre {
    font-family: --theme(
      --default-mono-font-family,
      ui-monospace,
      SFMono-Regular,
      Menlo,
      Monaco,
      Consolas,
      "Liberation Mono",
      "Courier New",
      monospace
    ); /* 1 */
    font-feature-settings: --theme(
      --default-mono-font-feature-settings,
      normal
    ); /* 2 */
    font-variation-settings: --theme(
      --default-mono-font-variation-settings,
      normal
    ); /* 3 */
    font-size: 1em; /* 4 */
  }

  /*
  Add the correct font size in all browsers.
*/

  small {
    font-size: 80%;
  }

  /*
  Prevent \`sub\` and \`sup\` elements from affecting the line height in all browsers.
*/

  sub,
  sup {
    font-size: 75%;
    line-height: 0;
    position: relative;
    vertical-align: baseline;
  }

  sub {
    bottom: -0.25em;
  }

  sup {
    top: -0.5em;
  }

  /*
  1. Remove text indentation from table contents in Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=999088, https://bugs.webkit.org/show_bug.cgi?id=201297)
  2. Correct table border color inheritance in all Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=935729, https://bugs.webkit.org/show_bug.cgi?id=195016)
  3. Remove gaps between table borders by default.
*/

  table {
    text-indent: 0; /* 1 */
    border-color: inherit; /* 2 */
    border-collapse: collapse; /* 3 */
  }

  /*
  Use the modern Firefox focus style for all focusable elements.
*/

  :-moz-focusring {
    outline: auto;
  }

  /*
  Add the correct vertical alignment in Chrome and Firefox.
*/

  progress {
    vertical-align: baseline;
  }

  /*
  Add the correct display in Chrome and Safari.
*/

  summary {
    display: list-item;
  }

  /*
  Make lists unstyled by default.
*/

  ol,
  ul,
  menu {
    list-style: none;
  }

  /*
  1. Make replaced elements \`display: block\` by default. (https://github.com/mozdevs/cssremedy/issues/14)
  2. Add \`vertical - align: middle\` to align replaced elements more sensibly by default. (https://github.com/jensimmons/cssremedy/issues/14#issuecomment-634934210)
      This can trigger a poorly considered lint error in some tools but is included by design.
*/

  img,
  svg,
  video,
  canvas,
  audio,
  iframe,
  embed,
  object {
    display: block; /* 1 */
    vertical-align: middle; /* 2 */
  }

  /*
  Constrain images and videos to the parent width and preserve their intrinsic aspect ratio. (https://github.com/mozdevs/cssremedy/issues/14)
*/

  img,
  video {
    max-width: 100%;
    height: auto;
  }

  /*
  1. Inherit font styles in all browsers.
  2. Remove border radius in all browsers.
  3. Remove background color in all browsers.
  4. Ensure consistent opacity for disabled states in all browsers.
*/

  button,
  input,
  select,
  optgroup,
  textarea,
  ::file-selector-button {
    font: inherit; /* 1 */
    font-feature-settings: inherit; /* 1 */
    font-variation-settings: inherit; /* 1 */
    letter-spacing: inherit; /* 1 */
    color: inherit; /* 1 */
    border-radius: 0; /* 2 */
    background-color: transparent; /* 3 */
    opacity: 1; /* 4 */
  }

  /*
  Restore default font weight.
*/

  :where(select:is([multiple], [size])) optgroup {
    font-weight: bolder;
  }

  /*
  Restore indentation.
*/

  :where(select:is([multiple], [size])) optgroup option {
    padding-inline-start: 20px;
  }

  /*
  Restore space after button.
*/

  ::file-selector-button {
    margin-inline-end: 4px;
  }

  /*
  Reset the default placeholder opacity in Firefox. (https://github.com/tailwindlabs/tailwindcss/issues/3300)
*/

  ::placeholder {
    opacity: 1;
  }

  /*
  Set the default placeholder color to a semi-transparent version of the current text color in browsers that do not
  crash when using \`color - mix(…)\` with \`currentcolor\`. (https://github.com/tailwindlabs/tailwindcss/issues/17194)
*/

  @supports (not (-webkit-appearance: -apple-pay-button)) /* Not Safari */ or
    (contain-intrinsic-size: 1px) /* Safari 17+ */ {
    ::placeholder {
      color: color-mix(in oklab, currentcolor 50%, transparent);
    }
  }

  /*
  Prevent resizing textareas horizontally by default.
*/

  textarea {
    resize: vertical;
  }

  /*
  Remove the inner padding in Chrome and Safari on macOS.
*/

  ::-webkit-search-decoration {
    -webkit-appearance: none;
  }

  /*
  1. Ensure date/time inputs have the same height when empty in iOS Safari.
  2. Ensure text alignment can be changed on date/time inputs in iOS Safari.
*/

  ::-webkit-date-and-time-value {
    min-height: 1lh; /* 1 */
    text-align: inherit; /* 2 */
  }

  /*
  Prevent height from changing on date/time inputs in macOS Safari when the input is set to \`display: block\`.
*/

  ::-webkit-datetime-edit {
    display: inline-flex;
  }

  /*
  Remove excess padding from pseudo-elements in date/time inputs to ensure consistent height across browsers.
*/

  ::-webkit-datetime-edit-fields-wrapper {
    padding: 0;
  }

  ::-webkit-datetime-edit,
  ::-webkit-datetime-edit-year-field,
  ::-webkit-datetime-edit-month-field,
  ::-webkit-datetime-edit-day-field,
  ::-webkit-datetime-edit-hour-field,
  ::-webkit-datetime-edit-minute-field,
  ::-webkit-datetime-edit-second-field,
  ::-webkit-datetime-edit-millisecond-field,
  ::-webkit-datetime-edit-meridiem-field {
    padding-block: 0;
  }

  /*
  Center dropdown marker shown on inputs with paired \`<datalist>\`s in Chrome. (https://github.com/tailwindlabs/tailwindcss/issues/18499)
*/

  ::-webkit-calendar-picker-indicator {
    line-height: 1;
  }

  /*
  Remove the additional \`: invalid\` styles in Firefox. (https://github.com/mozilla/gecko-dev/blob/2f9eacd9d3d995c937b4251a5557d95d494c9be1/layout/style/res/forms.css#L728-L737)
*/

  :-moz-ui-invalid {
    box-shadow: none;
  }

  /*
  Correct the inability to style the border radius in iOS Safari.
*/

  button,
  input:where([type="button"], [type="reset"], [type="submit"]),
  ::file-selector-button {
    appearance: button;
  }

  /*
  Correct the cursor style of increment and decrement buttons in Safari.
*/

  ::-webkit-inner-spin-button,
  ::-webkit-outer-spin-button {
    height: auto;
  }

  /*
  Make elements with the HTML hidden attribute stay hidden by default.
*/

  [hidden]:where(:not([hidden="until-found"])) {
    display: none !important;
  }
}

@layer utilities {
  @tailwind utilities;
}
`;
var tailwind_stylesheets_default = css$3;

//#endregion
//#region src/utils/tailwindcss/tailwind-stylesheets/preflight.ts
const css$2 = `
/*
  1. Prevent padding and border from affecting element width. (https://github.com/mozdevs/cssremedy/issues/4)
  2. Remove default margins and padding
  3. Reset all borders.
*/

*,
::after,
::before,
::backdrop,
::file-selector-button {
  box-sizing: border-box; /* 1 */
  margin: 0; /* 2 */
  padding: 0; /* 2 */
  border: 0 solid; /* 3 */
}

/*
  1. Use a consistent sensible line-height in all browsers.
  2. Prevent adjustments of font size after orientation changes in iOS.
  3. Use a more readable tab size.
  4. Use the user's configured \`sans\` font-family by default.
  5. Use the user's configured \`sans\` font-feature-settings by default.
  6. Use the user's configured \`sans\` font-variation-settings by default.
  7. Disable tap highlights on iOS.
*/

html,
:host {
  line-height: 1.5; /* 1 */
  -webkit-text-size-adjust: 100%; /* 2 */
  tab-size: 4; /* 3 */
  font-family: --theme(
    --default-font-family,
    ui-sans-serif,
    system-ui,
    sans-serif,
    'Apple Color Emoji',
    'Segoe UI Emoji',
    'Segoe UI Symbol',
    'Noto Color Emoji'
  ); /* 4 */
  font-feature-settings: --theme(--default-font-feature-settings, normal); /* 5 */
  font-variation-settings: --theme(--default-font-variation-settings, normal); /* 6 */
  -webkit-tap-highlight-color: transparent; /* 7 */
}

/*
  1. Add the correct height in Firefox.
  2. Correct the inheritance of border color in Firefox. (https://bugzilla.mozilla.org/show_bug.cgi?id=190655)
  3. Reset the default border style to a 1px solid border.
*/

hr {
  height: 0; /* 1 */
  color: inherit; /* 2 */
  border-top-width: 1px; /* 3 */
}

/*
  Add the correct text decoration in Chrome, Edge, and Safari.
*/

abbr:where([title]) {
  -webkit-text-decoration: underline dotted;
  text-decoration: underline dotted;
}

/*
  Remove the default font size and weight for headings.
*/

h1,
h2,
h3,
h4,
h5,
h6 {
  font-size: inherit;
  font-weight: inherit;
}

/*
  Reset links to optimize for opt-in styling instead of opt-out.
*/

a {
  color: inherit;
  -webkit-text-decoration: inherit;
  text-decoration: inherit;
}

/*
  Add the correct font weight in Edge and Safari.
*/

b,
strong {
  font-weight: bolder;
}

/*
  1. Use the user's configured \`mono\` font-family by default.
  2. Use the user's configured \`mono\` font-feature-settings by default.
  3. Use the user's configured \`mono\` font-variation-settings by default.
  4. Correct the odd \`em\` font sizing in all browsers.
*/

code,
kbd,
samp,
pre {
  font-family: --theme(
    --default-mono-font-family,
    ui-monospace,
    SFMono-Regular,
    Menlo,
    Monaco,
    Consolas,
    'Liberation Mono',
    'Courier New',
    monospace
  ); /* 1 */
  font-feature-settings: --theme(--default-mono-font-feature-settings, normal); /* 2 */
  font-variation-settings: --theme(--default-mono-font-variation-settings, normal); /* 3 */
  font-size: 1em; /* 4 */
}

/*
  Add the correct font size in all browsers.
*/

small {
  font-size: 80%;
}

/*
  Prevent \`sub\` and \`sup\` elements from affecting the line height in all browsers.
*/

sub,
sup {
  font-size: 75%;
  line-height: 0;
  position: relative;
  vertical-align: baseline;
}

sub {
  bottom: -0.25em;
}

sup {
  top: -0.5em;
}

/*
  1. Remove text indentation from table contents in Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=999088, https://bugs.webkit.org/show_bug.cgi?id=201297)
  2. Correct table border color inheritance in all Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=935729, https://bugs.webkit.org/show_bug.cgi?id=195016)
  3. Remove gaps between table borders by default.
*/

table {
  text-indent: 0; /* 1 */
  border-color: inherit; /* 2 */
  border-collapse: collapse; /* 3 */
}

/*
  Use the modern Firefox focus style for all focusable elements.
*/

:-moz-focusring {
  outline: auto;
}

/*
  Add the correct vertical alignment in Chrome and Firefox.
*/

progress {
  vertical-align: baseline;
}

/*
  Add the correct display in Chrome and Safari.
*/

summary {
  display: list-item;
}

/*
  Make lists unstyled by default.
*/

ol,
ul,
menu {
  list-style: none;
}

/*
  1. Make replaced elements \`display: block\` by default. (https://github.com/mozdevs/cssremedy/issues/14)
  2. Add \`vertical-align: middle\` to align replaced elements more sensibly by default. (https://github.com/jensimmons/cssremedy/issues/14#issuecomment-634934210)
      This can trigger a poorly considered lint error in some tools but is included by design.
*/

img,
svg,
video,
canvas,
audio,
iframe,
embed,
object {
  display: block; /* 1 */
  vertical-align: middle; /* 2 */
}

/*
  Constrain images and videos to the parent width and preserve their intrinsic aspect ratio. (https://github.com/mozdevs/cssremedy/issues/14)
*/

img,
video {
  max-width: 100%;
  height: auto;
}

/*
  1. Inherit font styles in all browsers.
  2. Remove border radius in all browsers.
  3. Remove background color in all browsers.
  4. Ensure consistent opacity for disabled states in all browsers.
*/

button,
input,
select,
optgroup,
textarea,
::file-selector-button {
  font: inherit; /* 1 */
  font-feature-settings: inherit; /* 1 */
  font-variation-settings: inherit; /* 1 */
  letter-spacing: inherit; /* 1 */
  color: inherit; /* 1 */
  border-radius: 0; /* 2 */
  background-color: transparent; /* 3 */
  opacity: 1; /* 4 */
}

/*
  Restore default font weight.
*/

:where(select:is([multiple], [size])) optgroup {
  font-weight: bolder;
}

/*
  Restore indentation.
*/

:where(select:is([multiple], [size])) optgroup option {
  padding-inline-start: 20px;
}

/*
  Restore space after button.
*/

::file-selector-button {
  margin-inline-end: 4px;
}

/*
  Reset the default placeholder opacity in Firefox. (https://github.com/tailwindlabs/tailwindcss/issues/3300)
*/

::placeholder {
  opacity: 1;
}

/*
  Set the default placeholder color to a semi-transparent version of the current text color in browsers that do not
  crash when using \`color-mix(…)\` with \`currentcolor\`. (https://github.com/tailwindlabs/tailwindcss/issues/17194)
*/

@supports (not (-webkit-appearance: -apple-pay-button)) /* Not Safari */ or
  (contain-intrinsic-size: 1px) /* Safari 17+ */ {
  ::placeholder {
    color: color-mix(in oklab, currentcolor 50%, transparent);
  }
}

/*
  Prevent resizing textareas horizontally by default.
*/

textarea {
  resize: vertical;
}

/*
  Remove the inner padding in Chrome and Safari on macOS.
*/

::-webkit-search-decoration {
  -webkit-appearance: none;
}

/*
  1. Ensure date/time inputs have the same height when empty in iOS Safari.
  2. Ensure text alignment can be changed on date/time inputs in iOS Safari.
*/

::-webkit-date-and-time-value {
  min-height: 1lh; /* 1 */
  text-align: inherit; /* 2 */
}

/*
  Prevent height from changing on date/time inputs in macOS Safari when the input is set to \`display: block\`.
*/

::-webkit-datetime-edit {
  display: inline-flex;
}

/*
  Remove excess padding from pseudo-elements in date/time inputs to ensure consistent height across browsers.
*/

::-webkit-datetime-edit-fields-wrapper {
  padding: 0;
}

::-webkit-datetime-edit,
::-webkit-datetime-edit-year-field,
::-webkit-datetime-edit-month-field,
::-webkit-datetime-edit-day-field,
::-webkit-datetime-edit-hour-field,
::-webkit-datetime-edit-minute-field,
::-webkit-datetime-edit-second-field,
::-webkit-datetime-edit-millisecond-field,
::-webkit-datetime-edit-meridiem-field {
  padding-block: 0;
}

/*
  Center dropdown marker shown on inputs with paired \`<datalist>\`s in Chrome. (https://github.com/tailwindlabs/tailwindcss/issues/18499)
*/

::-webkit-calendar-picker-indicator {
  line-height: 1;
}

/*
  Remove the additional \`:invalid\` styles in Firefox. (https://github.com/mozilla/gecko-dev/blob/2f9eacd9d3d995c937b4251a5557d95d494c9be1/layout/style/res/forms.css#L728-L737)
*/

:-moz-ui-invalid {
  box-shadow: none;
}

/*
  Correct the inability to style the border radius in iOS Safari.
*/

button,
input:where([type='button'], [type='reset'], [type='submit']),
::file-selector-button {
  appearance: button;
}

/*
  Correct the cursor style of increment and decrement buttons in Safari.
*/

::-webkit-inner-spin-button,
::-webkit-outer-spin-button {
  height: auto;
}

/*
  Make elements with the HTML hidden attribute stay hidden by default.
*/

[hidden]:where(:not([hidden='until-found'])) {
  display: none !important;
}
`;
var preflight_default = css$2;

//#endregion
//#region src/utils/tailwindcss/tailwind-stylesheets/theme.ts
const css$1 = `
@theme default {
  --font-sans:
    ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol',
    'Noto Color Emoji';
  --font-serif: ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif;
  --font-mono:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
    monospace;

  --color-red-50: oklch(97.1% 0.013 17.38);
  --color-red-100: oklch(93.6% 0.032 17.717);
  --color-red-200: oklch(88.5% 0.062 18.334);
  --color-red-300: oklch(80.8% 0.114 19.571);
  --color-red-400: oklch(70.4% 0.191 22.216);
  --color-red-500: oklch(63.7% 0.237 25.331);
  --color-red-600: oklch(57.7% 0.245 27.325);
  --color-red-700: oklch(50.5% 0.213 27.518);
  --color-red-800: oklch(44.4% 0.177 26.899);
  --color-red-900: oklch(39.6% 0.141 25.723);
  --color-red-950: oklch(25.8% 0.092 26.042);

  --color-orange-50: oklch(98% 0.016 73.684);
  --color-orange-100: oklch(95.4% 0.038 75.164);
  --color-orange-200: oklch(90.1% 0.076 70.697);
  --color-orange-300: oklch(83.7% 0.128 66.29);
  --color-orange-400: oklch(75% 0.183 55.934);
  --color-orange-500: oklch(70.5% 0.213 47.604);
  --color-orange-600: oklch(64.6% 0.222 41.116);
  --color-orange-700: oklch(55.3% 0.195 38.402);
  --color-orange-800: oklch(47% 0.157 37.304);
  --color-orange-900: oklch(40.8% 0.123 38.172);
  --color-orange-950: oklch(26.6% 0.079 36.259);

  --color-amber-50: oklch(98.7% 0.022 95.277);
  --color-amber-100: oklch(96.2% 0.059 95.617);
  --color-amber-200: oklch(92.4% 0.12 95.746);
  --color-amber-300: oklch(87.9% 0.169 91.605);
  --color-amber-400: oklch(82.8% 0.189 84.429);
  --color-amber-500: oklch(76.9% 0.188 70.08);
  --color-amber-600: oklch(66.6% 0.179 58.318);
  --color-amber-700: oklch(55.5% 0.163 48.998);
  --color-amber-800: oklch(47.3% 0.137 46.201);
  --color-amber-900: oklch(41.4% 0.112 45.904);
  --color-amber-950: oklch(27.9% 0.077 45.635);

  --color-yellow-50: oklch(98.7% 0.026 102.212);
  --color-yellow-100: oklch(97.3% 0.071 103.193);
  --color-yellow-200: oklch(94.5% 0.129 101.54);
  --color-yellow-300: oklch(90.5% 0.182 98.111);
  --color-yellow-400: oklch(85.2% 0.199 91.936);
  --color-yellow-500: oklch(79.5% 0.184 86.047);
  --color-yellow-600: oklch(68.1% 0.162 75.834);
  --color-yellow-700: oklch(55.4% 0.135 66.442);
  --color-yellow-800: oklch(47.6% 0.114 61.907);
  --color-yellow-900: oklch(42.1% 0.095 57.708);
  --color-yellow-950: oklch(28.6% 0.066 53.813);

  --color-lime-50: oklch(98.6% 0.031 120.757);
  --color-lime-100: oklch(96.7% 0.067 122.328);
  --color-lime-200: oklch(93.8% 0.127 124.321);
  --color-lime-300: oklch(89.7% 0.196 126.665);
  --color-lime-400: oklch(84.1% 0.238 128.85);
  --color-lime-500: oklch(76.8% 0.233 130.85);
  --color-lime-600: oklch(64.8% 0.2 131.684);
  --color-lime-700: oklch(53.2% 0.157 131.589);
  --color-lime-800: oklch(45.3% 0.124 130.933);
  --color-lime-900: oklch(40.5% 0.101 131.063);
  --color-lime-950: oklch(27.4% 0.072 132.109);

  --color-green-50: oklch(98.2% 0.018 155.826);
  --color-green-100: oklch(96.2% 0.044 156.743);
  --color-green-200: oklch(92.5% 0.084 155.995);
  --color-green-300: oklch(87.1% 0.15 154.449);
  --color-green-400: oklch(79.2% 0.209 151.711);
  --color-green-500: oklch(72.3% 0.219 149.579);
  --color-green-600: oklch(62.7% 0.194 149.214);
  --color-green-700: oklch(52.7% 0.154 150.069);
  --color-green-800: oklch(44.8% 0.119 151.328);
  --color-green-900: oklch(39.3% 0.095 152.535);
  --color-green-950: oklch(26.6% 0.065 152.934);

  --color-emerald-50: oklch(97.9% 0.021 166.113);
  --color-emerald-100: oklch(95% 0.052 163.051);
  --color-emerald-200: oklch(90.5% 0.093 164.15);
  --color-emerald-300: oklch(84.5% 0.143 164.978);
  --color-emerald-400: oklch(76.5% 0.177 163.223);
  --color-emerald-500: oklch(69.6% 0.17 162.48);
  --color-emerald-600: oklch(59.6% 0.145 163.225);
  --color-emerald-700: oklch(50.8% 0.118 165.612);
  --color-emerald-800: oklch(43.2% 0.095 166.913);
  --color-emerald-900: oklch(37.8% 0.077 168.94);
  --color-emerald-950: oklch(26.2% 0.051 172.552);

  --color-teal-50: oklch(98.4% 0.014 180.72);
  --color-teal-100: oklch(95.3% 0.051 180.801);
  --color-teal-200: oklch(91% 0.096 180.426);
  --color-teal-300: oklch(85.5% 0.138 181.071);
  --color-teal-400: oklch(77.7% 0.152 181.912);
  --color-teal-500: oklch(70.4% 0.14 182.503);
  --color-teal-600: oklch(60% 0.118 184.704);
  --color-teal-700: oklch(51.1% 0.096 186.391);
  --color-teal-800: oklch(43.7% 0.078 188.216);
  --color-teal-900: oklch(38.6% 0.063 188.416);
  --color-teal-950: oklch(27.7% 0.046 192.524);

  --color-cyan-50: oklch(98.4% 0.019 200.873);
  --color-cyan-100: oklch(95.6% 0.045 203.388);
  --color-cyan-200: oklch(91.7% 0.08 205.041);
  --color-cyan-300: oklch(86.5% 0.127 207.078);
  --color-cyan-400: oklch(78.9% 0.154 211.53);
  --color-cyan-500: oklch(71.5% 0.143 215.221);
  --color-cyan-600: oklch(60.9% 0.126 221.723);
  --color-cyan-700: oklch(52% 0.105 223.128);
  --color-cyan-800: oklch(45% 0.085 224.283);
  --color-cyan-900: oklch(39.8% 0.07 227.392);
  --color-cyan-950: oklch(30.2% 0.056 229.695);

  --color-sky-50: oklch(97.7% 0.013 236.62);
  --color-sky-100: oklch(95.1% 0.026 236.824);
  --color-sky-200: oklch(90.1% 0.058 230.902);
  --color-sky-300: oklch(82.8% 0.111 230.318);
  --color-sky-400: oklch(74.6% 0.16 232.661);
  --color-sky-500: oklch(68.5% 0.169 237.323);
  --color-sky-600: oklch(58.8% 0.158 241.966);
  --color-sky-700: oklch(50% 0.134 242.749);
  --color-sky-800: oklch(44.3% 0.11 240.79);
  --color-sky-900: oklch(39.1% 0.09 240.876);
  --color-sky-950: oklch(29.3% 0.066 243.157);

  --color-blue-50: oklch(97% 0.014 254.604);
  --color-blue-100: oklch(93.2% 0.032 255.585);
  --color-blue-200: oklch(88.2% 0.059 254.128);
  --color-blue-300: oklch(80.9% 0.105 251.813);
  --color-blue-400: oklch(70.7% 0.165 254.624);
  --color-blue-500: oklch(62.3% 0.214 259.815);
  --color-blue-600: oklch(54.6% 0.245 262.881);
  --color-blue-700: oklch(48.8% 0.243 264.376);
  --color-blue-800: oklch(42.4% 0.199 265.638);
  --color-blue-900: oklch(37.9% 0.146 265.522);
  --color-blue-950: oklch(28.2% 0.091 267.935);

  --color-indigo-50: oklch(96.2% 0.018 272.314);
  --color-indigo-100: oklch(93% 0.034 272.788);
  --color-indigo-200: oklch(87% 0.065 274.039);
  --color-indigo-300: oklch(78.5% 0.115 274.713);
  --color-indigo-400: oklch(67.3% 0.182 276.935);
  --color-indigo-500: oklch(58.5% 0.233 277.117);
  --color-indigo-600: oklch(51.1% 0.262 276.966);
  --color-indigo-700: oklch(45.7% 0.24 277.023);
  --color-indigo-800: oklch(39.8% 0.195 277.366);
  --color-indigo-900: oklch(35.9% 0.144 278.697);
  --color-indigo-950: oklch(25.7% 0.09 281.288);

  --color-violet-50: oklch(96.9% 0.016 293.756);
  --color-violet-100: oklch(94.3% 0.029 294.588);
  --color-violet-200: oklch(89.4% 0.057 293.283);
  --color-violet-300: oklch(81.1% 0.111 293.571);
  --color-violet-400: oklch(70.2% 0.183 293.541);
  --color-violet-500: oklch(60.6% 0.25 292.717);
  --color-violet-600: oklch(54.1% 0.281 293.009);
  --color-violet-700: oklch(49.1% 0.27 292.581);
  --color-violet-800: oklch(43.2% 0.232 292.759);
  --color-violet-900: oklch(38% 0.189 293.745);
  --color-violet-950: oklch(28.3% 0.141 291.089);

  --color-purple-50: oklch(97.7% 0.014 308.299);
  --color-purple-100: oklch(94.6% 0.033 307.174);
  --color-purple-200: oklch(90.2% 0.063 306.703);
  --color-purple-300: oklch(82.7% 0.119 306.383);
  --color-purple-400: oklch(71.4% 0.203 305.504);
  --color-purple-500: oklch(62.7% 0.265 303.9);
  --color-purple-600: oklch(55.8% 0.288 302.321);
  --color-purple-700: oklch(49.6% 0.265 301.924);
  --color-purple-800: oklch(43.8% 0.218 303.724);
  --color-purple-900: oklch(38.1% 0.176 304.987);
  --color-purple-950: oklch(29.1% 0.149 302.717);

  --color-fuchsia-50: oklch(97.7% 0.017 320.058);
  --color-fuchsia-100: oklch(95.2% 0.037 318.852);
  --color-fuchsia-200: oklch(90.3% 0.076 319.62);
  --color-fuchsia-300: oklch(83.3% 0.145 321.434);
  --color-fuchsia-400: oklch(74% 0.238 322.16);
  --color-fuchsia-500: oklch(66.7% 0.295 322.15);
  --color-fuchsia-600: oklch(59.1% 0.293 322.896);
  --color-fuchsia-700: oklch(51.8% 0.253 323.949);
  --color-fuchsia-800: oklch(45.2% 0.211 324.591);
  --color-fuchsia-900: oklch(40.1% 0.17 325.612);
  --color-fuchsia-950: oklch(29.3% 0.136 325.661);

  --color-pink-50: oklch(97.1% 0.014 343.198);
  --color-pink-100: oklch(94.8% 0.028 342.258);
  --color-pink-200: oklch(89.9% 0.061 343.231);
  --color-pink-300: oklch(82.3% 0.12 346.018);
  --color-pink-400: oklch(71.8% 0.202 349.761);
  --color-pink-500: oklch(65.6% 0.241 354.308);
  --color-pink-600: oklch(59.2% 0.249 0.584);
  --color-pink-700: oklch(52.5% 0.223 3.958);
  --color-pink-800: oklch(45.9% 0.187 3.815);
  --color-pink-900: oklch(40.8% 0.153 2.432);
  --color-pink-950: oklch(28.4% 0.109 3.907);

  --color-rose-50: oklch(96.9% 0.015 12.422);
  --color-rose-100: oklch(94.1% 0.03 12.58);
  --color-rose-200: oklch(89.2% 0.058 10.001);
  --color-rose-300: oklch(81% 0.117 11.638);
  --color-rose-400: oklch(71.2% 0.194 13.428);
  --color-rose-500: oklch(64.5% 0.246 16.439);
  --color-rose-600: oklch(58.6% 0.253 17.585);
  --color-rose-700: oklch(51.4% 0.222 16.935);
  --color-rose-800: oklch(45.5% 0.188 13.697);
  --color-rose-900: oklch(41% 0.159 10.272);
  --color-rose-950: oklch(27.1% 0.105 12.094);

  --color-slate-50: oklch(98.4% 0.003 247.858);
  --color-slate-100: oklch(96.8% 0.007 247.896);
  --color-slate-200: oklch(92.9% 0.013 255.508);
  --color-slate-300: oklch(86.9% 0.022 252.894);
  --color-slate-400: oklch(70.4% 0.04 256.788);
  --color-slate-500: oklch(55.4% 0.046 257.417);
  --color-slate-600: oklch(44.6% 0.043 257.281);
  --color-slate-700: oklch(37.2% 0.044 257.287);
  --color-slate-800: oklch(27.9% 0.041 260.031);
  --color-slate-900: oklch(20.8% 0.042 265.755);
  --color-slate-950: oklch(12.9% 0.042 264.695);

  --color-gray-50: oklch(98.5% 0.002 247.839);
  --color-gray-100: oklch(96.7% 0.003 264.542);
  --color-gray-200: oklch(92.8% 0.006 264.531);
  --color-gray-300: oklch(87.2% 0.01 258.338);
  --color-gray-400: oklch(70.7% 0.022 261.325);
  --color-gray-500: oklch(55.1% 0.027 264.364);
  --color-gray-600: oklch(44.6% 0.03 256.802);
  --color-gray-700: oklch(37.3% 0.034 259.733);
  --color-gray-800: oklch(27.8% 0.033 256.848);
  --color-gray-900: oklch(21% 0.034 264.665);
  --color-gray-950: oklch(13% 0.028 261.692);

  --color-zinc-50: oklch(98.5% 0 0);
  --color-zinc-100: oklch(96.7% 0.001 286.375);
  --color-zinc-200: oklch(92% 0.004 286.32);
  --color-zinc-300: oklch(87.1% 0.006 286.286);
  --color-zinc-400: oklch(70.5% 0.015 286.067);
  --color-zinc-500: oklch(55.2% 0.016 285.938);
  --color-zinc-600: oklch(44.2% 0.017 285.786);
  --color-zinc-700: oklch(37% 0.013 285.805);
  --color-zinc-800: oklch(27.4% 0.006 286.033);
  --color-zinc-900: oklch(21% 0.006 285.885);
  --color-zinc-950: oklch(14.1% 0.005 285.823);

  --color-neutral-50: oklch(98.5% 0 0);
  --color-neutral-100: oklch(97% 0 0);
  --color-neutral-200: oklch(92.2% 0 0);
  --color-neutral-300: oklch(87% 0 0);
  --color-neutral-400: oklch(70.8% 0 0);
  --color-neutral-500: oklch(55.6% 0 0);
  --color-neutral-600: oklch(43.9% 0 0);
  --color-neutral-700: oklch(37.1% 0 0);
  --color-neutral-800: oklch(26.9% 0 0);
  --color-neutral-900: oklch(20.5% 0 0);
  --color-neutral-950: oklch(14.5% 0 0);

  --color-stone-50: oklch(98.5% 0.001 106.423);
  --color-stone-100: oklch(97% 0.001 106.424);
  --color-stone-200: oklch(92.3% 0.003 48.717);
  --color-stone-300: oklch(86.9% 0.005 56.366);
  --color-stone-400: oklch(70.9% 0.01 56.259);
  --color-stone-500: oklch(55.3% 0.013 58.071);
  --color-stone-600: oklch(44.4% 0.011 73.639);
  --color-stone-700: oklch(37.4% 0.01 67.558);
  --color-stone-800: oklch(26.8% 0.007 34.298);
  --color-stone-900: oklch(21.6% 0.006 56.043);
  --color-stone-950: oklch(14.7% 0.004 49.25);

  --color-black: #000;
  --color-white: #fff;

  --spacing: 0.25rem;

  --breakpoint-sm: 40rem;
  --breakpoint-md: 48rem;
  --breakpoint-lg: 64rem;
  --breakpoint-xl: 80rem;
  --breakpoint-2xl: 96rem;

  --container-3xs: 16rem;
  --container-2xs: 18rem;
  --container-xs: 20rem;
  --container-sm: 24rem;
  --container-md: 28rem;
  --container-lg: 32rem;
  --container-xl: 36rem;
  --container-2xl: 42rem;
  --container-3xl: 48rem;
  --container-4xl: 56rem;
  --container-5xl: 64rem;
  --container-6xl: 72rem;
  --container-7xl: 80rem;

  --text-xs: 0.75rem;
  --text-xs--line-height: calc(1 / 0.75);
  --text-sm: 0.875rem;
  --text-sm--line-height: calc(1.25 / 0.875);
  --text-base: 1rem;
  --text-base--line-height: calc(1.5 / 1);
  --text-lg: 1.125rem;
  --text-lg--line-height: calc(1.75 / 1.125);
  --text-xl: 1.25rem;
  --text-xl--line-height: calc(1.75 / 1.25);
  --text-2xl: 1.5rem;
  --text-2xl--line-height: calc(2 / 1.5);
  --text-3xl: 1.875rem;
  --text-3xl--line-height: calc(2.25 / 1.875);
  --text-4xl: 2.25rem;
  --text-4xl--line-height: calc(2.5 / 2.25);
  --text-5xl: 3rem;
  --text-5xl--line-height: 1;
  --text-6xl: 3.75rem;
  --text-6xl--line-height: 1;
  --text-7xl: 4.5rem;
  --text-7xl--line-height: 1;
  --text-8xl: 6rem;
  --text-8xl--line-height: 1;
  --text-9xl: 8rem;
  --text-9xl--line-height: 1;

  --font-weight-thin: 100;
  --font-weight-extralight: 200;
  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-weight-extrabold: 800;
  --font-weight-black: 900;

  --tracking-tighter: -0.05em;
  --tracking-tight: -0.025em;
  --tracking-normal: 0em;
  --tracking-wide: 0.025em;
  --tracking-wider: 0.05em;
  --tracking-widest: 0.1em;

  --leading-tight: 1.25;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  --leading-loose: 2;

  --radius-xs: 0.125rem;
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-2xl: 1rem;
  --radius-3xl: 1.5rem;
  --radius-4xl: 2rem;

  --shadow-2xs: 0 1px rgb(0 0 0 / 0.05);
  --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  --shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);

  --inset-shadow-2xs: inset 0 1px rgb(0 0 0 / 0.05);
  --inset-shadow-xs: inset 0 1px 1px rgb(0 0 0 / 0.05);
  --inset-shadow-sm: inset 0 2px 4px rgb(0 0 0 / 0.05);

  --drop-shadow-xs: 0 1px 1px rgb(0 0 0 / 0.05);
  --drop-shadow-sm: 0 1px 2px rgb(0 0 0 / 0.15);
  --drop-shadow-md: 0 3px 3px rgb(0 0 0 / 0.12);
  --drop-shadow-lg: 0 4px 4px rgb(0 0 0 / 0.15);
  --drop-shadow-xl: 0 9px 7px rgb(0 0 0 / 0.1);
  --drop-shadow-2xl: 0 25px 25px rgb(0 0 0 / 0.15);

  --text-shadow-2xs: 0px 1px 0px rgb(0 0 0 / 0.15);
  --text-shadow-xs: 0px 1px 1px rgb(0 0 0 / 0.2);
  --text-shadow-sm:
    0px 1px 0px rgb(0 0 0 / 0.075), 0px 1px 1px rgb(0 0 0 / 0.075), 0px 2px 2px rgb(0 0 0 / 0.075);
  --text-shadow-md:
    0px 1px 1px rgb(0 0 0 / 0.1), 0px 1px 2px rgb(0 0 0 / 0.1), 0px 2px 4px rgb(0 0 0 / 0.1);
  --text-shadow-lg:
    0px 1px 2px rgb(0 0 0 / 0.1), 0px 3px 2px rgb(0 0 0 / 0.1), 0px 4px 8px rgb(0 0 0 / 0.1);

  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

  --animate-spin: spin 1s linear infinite;
  --animate-ping: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
  --animate-pulse: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  --animate-bounce: bounce 1s infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes ping {
    75%,
    100% {
      transform: scale(2);
      opacity: 0;
    }
  }

  @keyframes pulse {
    50% {
      opacity: 0.5;
    }
  }

  @keyframes bounce {
    0%,
    100% {
      transform: translateY(-25%);
      animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
    }

    50% {
      transform: none;
      animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
    }
  }

  --blur-xs: 4px;
  --blur-sm: 8px;
  --blur-md: 12px;
  --blur-lg: 16px;
  --blur-xl: 24px;
  --blur-2xl: 40px;
  --blur-3xl: 64px;

  --perspective-dramatic: 100px;
  --perspective-near: 300px;
  --perspective-normal: 500px;
  --perspective-midrange: 800px;
  --perspective-distant: 1200px;

  --aspect-video: 16 / 9;

  --default-transition-duration: 150ms;
  --default-transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  --default-font-family: --theme(--font-sans, initial);
  --default-font-feature-settings: --theme(--font-sans--font-feature-settings, initial);
  --default-font-variation-settings: --theme(--font-sans--font-variation-settings, initial);
  --default-mono-font-family: --theme(--font-mono, initial);
  --default-mono-font-feature-settings: --theme(--font-mono--font-feature-settings, initial);
  --default-mono-font-variation-settings: --theme(--font-mono--font-variation-settings, initial);
}

/* Deprecated */
@theme default inline reference {
  --blur: 8px;
  --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-inner: inset 0 2px 4px 0 rgb(0 0 0 / 0.05);
  --drop-shadow: 0 1px 2px rgb(0 0 0 / 0.1), 0 1px 1px rgb(0 0 0 / 0.06);
  --radius: 0.25rem;
  --max-width-prose: 65ch;
}
`;
var theme_default = css$1;

//#endregion
//#region src/utils/tailwindcss/tailwind-stylesheets/utilities.ts
const css = `
@tailwind utilities;
`;
var utilities_default = css;

//#endregion
//#region src/utils/tailwindcss/setup-tailwind.ts
async function setupTailwind(config) {
	const baseCss = `
@layer theme, base, components, utilities;
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/utilities.css" layer(utilities);
@config;
`;
	const compiler = await compile(baseCss, {
		async loadModule(id, base, resourceHint) {
			if (resourceHint === "config") return {
				path: id,
				base,
				module: config
			};
			throw new Error(`NO-OP: should we implement support for ${resourceHint}?`);
		},
		polyfills: 0,
		async loadStylesheet(id, base) {
			if (id === "tailwindcss") return {
				base,
				path: "tailwindcss/index.css",
				content: tailwind_stylesheets_default
			};
			if (id === "tailwindcss/preflight.css") return {
				base,
				path: id,
				content: preflight_default
			};
			if (id === "tailwindcss/theme.css") return {
				base,
				path: id,
				content: theme_default
			};
			if (id === "tailwindcss/utilities.css") return {
				base,
				path: id,
				content: utilities_default
			};
			throw new Error("stylesheet not supported, you can only import the ones from tailwindcss");
		}
	});
	let css$4 = baseCss;
	return {
		addUtilities: function addUtilities(candidates) {
			css$4 = compiler.build(candidates);
		},
		getStyleSheet: function getCss() {
			return parse(css$4);
		}
	};
}

//#endregion
//#region src/tailwind.tsx
const pixelBasedPreset = { theme: { extend: {
	fontSize: {
		xs: ["12px", { lineHeight: "16px" }],
		sm: ["14px", { lineHeight: "20px" }],
		base: ["16px", { lineHeight: "24px" }],
		lg: ["18px", { lineHeight: "28px" }],
		xl: ["20px", { lineHeight: "28px" }],
		"2xl": ["24px", { lineHeight: "32px" }],
		"3xl": ["30px", { lineHeight: "36px" }],
		"4xl": ["36px", { lineHeight: "36px" }],
		"5xl": ["48px", { lineHeight: "1" }],
		"6xl": ["60px", { lineHeight: "1" }],
		"7xl": ["72px", { lineHeight: "1" }],
		"8xl": ["96px", { lineHeight: "1" }],
		"9xl": ["144px", { lineHeight: "1" }]
	},
	spacing: {
		px: "1px",
		0: "0",
		.5: "2px",
		1: "4px",
		1.5: "6px",
		2: "8px",
		2.5: "10px",
		3: "12px",
		3.5: "14px",
		4: "16px",
		5: "20px",
		6: "24px",
		7: "28px",
		8: "32px",
		9: "36px",
		10: "40px",
		11: "44px",
		12: "48px",
		14: "56px",
		16: "64px",
		20: "80px",
		24: "96px",
		28: "112px",
		32: "128px",
		36: "144px",
		40: "160px",
		44: "176px",
		48: "192px",
		52: "208px",
		56: "224px",
		60: "240px",
		64: "256px",
		72: "288px",
		80: "320px",
		96: "384px"
	}
} } };
function Tailwind({ children, config }) {
	const tailwindSetup = useSuspensedPromise(() => setupTailwind(config ?? {}), JSON.stringify(config, (_key, value) => typeof value === "function" ? value.toString() : value));
	let classesUsed = [];
	let mappedChildren = mapReactTree(children, (node) => {
		if (React$1.isValidElement(node)) {
			if (node.props.className) {
				const classes = node.props.className?.split(/\s+/);
				classesUsed = [...classesUsed, ...classes];
				tailwindSetup.addUtilities(classes);
			}
		}
		return node;
	});
	const styleSheet = tailwindSetup.getStyleSheet();
	sanitizeStyleSheet(styleSheet);
	const { inlinable: inlinableRules, nonInlinable: nonInlinableRules } = extractRulesPerClass(styleSheet, classesUsed);
	const customProperties = getCustomProperties(styleSheet);
	const nonInlineStyles = {
		type: "StyleSheet",
		children: new List().fromArray(Array.from(nonInlinableRules.values()))
	};
	sanitizeNonInlinableRules(nonInlineStyles);
	const hasNonInlineStylesToApply = nonInlinableRules.size > 0;
	let appliedNonInlineStyles = false;
	mappedChildren = mapReactTree(mappedChildren, (node) => {
		if (React$1.isValidElement(node)) {
			const elementWithInlinedStyles = cloneElementWithInlinedStyles(node, inlinableRules, nonInlinableRules, customProperties);
			if (elementWithInlinedStyles.type === "head") {
				appliedNonInlineStyles = true;
				const styleElement = /* @__PURE__ */ jsx("style", { dangerouslySetInnerHTML: { __html: generate(nonInlineStyles) } });
				return React$1.cloneElement(elementWithInlinedStyles, elementWithInlinedStyles.props, styleElement, elementWithInlinedStyles.props.children);
			}
			return elementWithInlinedStyles;
		}
		return node;
	});
	if (hasNonInlineStylesToApply && !appliedNonInlineStyles) throw new Error(`You are trying to use the following Tailwind classes that cannot be inlined: ${Array.from(nonInlinableRules.keys()).join(" ")}.
For the media queries to work properly on rendering, they need to be added into a <style> tag inside of a <head> tag,
the Tailwind component tried finding a <head> element but just wasn't able to find it.

Make sure that you have a <head> element at some point inside of the <Tailwind> component at any depth. 
This can also be our <Head> component.

If you do already have a <head> element at some depth, 
please file a bug https://github.com/resend/react-email/issues/new?assignees=&labels=Type%3A+Bug&projects=&template=1.bug_report.yml.`);
	return mappedChildren;
}

//#endregion
export { Tailwind, inlineStyles, pixelBasedPreset, sanitizeStyleSheet, setupTailwind };
//# sourceMappingURL=index.mjs.map
import fs from "node:fs/promises";
import { normalizePath } from "vite";
const handleDevToolsViteRequest = (req, res, next, cb) => {
  if (req.url?.includes("__tsd/open-source")) {
    const searchParams = new URLSearchParams(req.url.split("?")[1]);
    const source = searchParams.get("source");
    if (!source) {
      return;
    }
    const parsed = parseOpenSourceParam(source);
    if (!parsed) {
      return;
    }
    const { file, line, column } = parsed;
    cb({
      type: "open-source",
      routine: "open-source",
      data: {
        source: file ? normalizePath(`${process.cwd()}/${file}`) : void 0,
        line,
        column
      }
    });
    res.setHeader("Content-Type", "text/html");
    res.write(`<script> window.close(); <\/script>`);
    res.end();
    return;
  }
  if (!req.url?.includes("__tsd")) {
    return next();
  }
  const chunks = [];
  req.on("data", (chunk) => {
    chunks.push(chunk);
  });
  req.on("end", () => {
    const dataToParse = Buffer.concat(chunks);
    try {
      const parsedData = JSON.parse(dataToParse.toString());
      cb(parsedData);
    } catch (e) {
    }
    res.write("OK");
  });
};
const parseOpenSourceParam = (source) => {
  const parts = source.match(/^(.+):(\d+):(\d+)$/);
  if (!parts) return null;
  const [, file, line, column] = parts;
  return { file, line, column };
};
const tryReadFile = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return data;
  } catch (error) {
    return null;
  }
};
const tryParseJson = (jsonString) => {
  if (!jsonString) {
    return null;
  }
  try {
    const result = JSON.parse(jsonString);
    return result;
  } catch (error) {
    return null;
  }
};
const readPackageJson = async () => tryParseJson(await tryReadFile(process.cwd() + "/package.json"));
export {
  handleDevToolsViteRequest,
  parseOpenSourceParam,
  readPackageJson,
  tryParseJson
};
//# sourceMappingURL=utils.js.map

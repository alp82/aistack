import * as cheerio from "cheerio";
function extractHtmlScripts(html) {
  const $ = cheerio.load(html);
  const scripts = [];
  $("script").each((_, element) => {
    const src = $(element).attr("src");
    const content = $(element).html() ?? void 0;
    scripts.push({
      src,
      content
    });
  });
  return scripts;
}
export {
  extractHtmlScripts
};
//# sourceMappingURL=extract-html-scripts.js.map

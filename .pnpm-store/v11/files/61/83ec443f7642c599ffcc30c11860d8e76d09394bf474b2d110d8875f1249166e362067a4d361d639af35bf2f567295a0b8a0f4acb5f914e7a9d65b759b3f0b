"use strict";const e=require(`node:util`),t=require(`node:path`);function n(e,n){let r=process.cwd()+t.sep;return e.split(`
`).splice(n.split(`
`).length).map(e=>e.trim().replace(`file://`,``).replace(r,``))}function r(e,t){return(t.__write||t.write).call(t,e)}const i=e=>e?`[${e}]`:``;class a{formatStack(e,t,r){let i=`  `.repeat((r?.errorLevel||0)+1);return i+n(e,t).join(`
${i}`)}formatError(t,n){let r=t.message??e.formatWithOptions(n,t),i=t.stack?this.formatStack(t.stack,r,n):``,a=n?.errorLevel||0,o=a>0?`${`  `.repeat(a)}[cause]: `:``,s=t.cause?`

`+this.formatError(t.cause,{...n,errorLevel:a+1}):``;return o+r+`
`+i+s}formatArgs(t,n){let r=t.map(e=>e&&typeof e.stack==`string`?this.formatError(e,n):e);return e.formatWithOptions(n,...r)}formatDate(e,t){return t.date?e.toLocaleTimeString():``}filterAndJoin(e){return e.filter(Boolean).join(` `)}formatLogObj(e,t){let n=this.formatArgs(e.args,t);return e.type===`box`?`
`+[i(e.tag),e.title&&e.title,...n.split(`
`)].filter(Boolean).map(e=>` > `+e).join(`
`)+`
`:this.filterAndJoin([i(e.type),i(e.tag),n])}log(e,t){return r(this.formatLogObj(e,{columns:t.options.stdout.columns||0,...t.options.formatOptions})+`
`,e.level<2?t.options.stderr||process.stderr:t.options.stdout||process.stdout)}}exports.BasicReporter=a,exports.parseStack=n;
// Exercise the actual built CLI's read-only MCP preview with synthetic sources.
// The loader redirects os.homedir() only inside this child. No owner config,
// native credential, external request, interactive sync or publish is involved.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temporary = await mkdtemp(path.join(tmpdir(), 'cursor-package-'));
try {
  const root = path.join(temporary, 'Cursor', 'User', 'workspaceStorage');
  const workspace = path.join(root, 'synthetic');
  const global = path.join(temporary, 'Cursor', 'User', 'globalStorage');
  await mkdir(workspace, {recursive: true});
  await mkdir(global, {recursive: true});
  const project = path.join(temporary, 'project');
  await writeFile(path.join(workspace, 'workspace.json'), JSON.stringify({folder: pathToFileURL(project).href}));
  const rows = JSON.parse(await readFile(path.join(repo, 'packages/cli/src/harness/cursor/fixtures/composer-rows.json'), 'utf8'));
  const db = new DatabaseSync(path.join(global, 'state.vscdb'));
  const wdb = new DatabaseSync(path.join(workspace, 'state.vscdb'));
  db.exec('CREATE TABLE cursorDiskKV (key TEXT PRIMARY KEY, value TEXT); CREATE TABLE ItemTable (key TEXT PRIMARY KEY, value TEXT)');
  wdb.exec('CREATE TABLE ItemTable (key TEXT PRIMARY KEY, value TEXT)');
  for (const row of rows) {
    if (row.value.createdAt) row.value.createdAt = Date.now() - 10_000;
    if (row.value.timingInfo) {
      row.value.timingInfo = {clientRpcSendTime: Date.now()-5000, clientStartTime: Date.now()-5000, clientEndTime: Date.now()-4000};
      row.value.tokenCount = {inputTokens: 100, outputTokens: 20};
    }
    (row.table === 'cursorDiskKV' ? db : wdb).prepare(`INSERT INTO ${row.table} VALUES (?, ?)`).run(row.key, JSON.stringify(row.value));
  }
  db.close(); wdb.close();
  const shim = path.join(temporary, 'os.mjs');
  const loader = path.join(temporary, 'loader.mjs');
  const preload = path.join(temporary, 'preload.mjs');
  await writeFile(shim, `export * from 'node:os'; import * as os from 'node:os'; export const homedir = () => ${JSON.stringify(temporary)}; export default {...os, homedir};`);
  await writeFile(loader, `const shim = ${JSON.stringify(pathToFileURL(shim).href)}; export async function resolve(specifier, context, next) { if ((specifier === 'node:os' || specifier === 'os') && context.parentURL !== shim) return {url: shim, shortCircuit: true}; return next(specifier, context); }`);
  await writeFile(preload, `globalThis.fetch = async () => { throw new Error('offline synthetic preview'); };`);
  const output = execFileSync(process.execPath, ['--experimental-loader', pathToFileURL(loader).href, '--import', pathToFileURL(preload).href, path.join(repo, 'packages/cli/dist/index.js'), 'mcp'], {
    cwd: temporary,
    env: {PATH: process.env.PATH, CURSOR_DATA_PATH: root, CURSOR_STORE_ROOT: path.join(temporary, 'store'), AISTACK_URL: 'http://127.0.0.1:1'},
    input: JSON.stringify({jsonrpc: '2.0', id: 1, method: 'tools/call', params: {name: 'sync_preview'}})+'\n',
    encoding: 'utf8', timeout: 30_000, stdio: ['pipe', 'pipe', 'pipe'],
  });
  assert.match(output, /not linked|not authenticated/i);
  const cacheDir = path.join(temporary, '.config', 'aistack', 'cursor');
  const files = (await readdir(cacheDir)).filter(file => file.endsWith('.json'));
  assert.equal(files.length, 1);
  const cache = JSON.parse(await readFile(path.join(cacheDir, files[0]), 'utf8'));
  assert.equal(cache.local.length, 1);
  assert.equal(cache.local[0].buckets.input, 100);
  assert.equal(cache.local[0].buckets.output, 20);
  console.log(`Cursor packaged CLI preview passed on Node ${process.versions.node}`);
} finally {
  await rm(temporary, {recursive: true, force: true});
}

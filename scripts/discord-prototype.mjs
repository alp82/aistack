/**
 * Throwaway real-Discord prototype. Separate app, test guild, fixture data.
 * node --env-file-if-exists=.env.discord-prototype.local scripts/discord-prototype.mjs
 * Subcommands: serve (default), register, unregister, dry-run, render-preview.
 */
import { createPublicKey, randomBytes, verify } from 'node:crypto';
import { createServer } from 'node:http';
import { mkdir, writeFile } from 'node:fs/promises';
import { COMMANDS, COMMAND_NAMES, PEOPLE, controlRows, findPeople, replyPayload } from '../src/features/discord/prototype/live/fixtures.mjs';
import { renderStatsImage } from '../src/features/charts/prototype/discord-stats-images.mjs';

const API = 'https://discord.com/api/v10';
const EPHEMERAL = 64;
const PREFIX = 'dp';
const TTL_MS = 60 * 60 * 1000;
const { DISCORD_PROTOTYPE_APP_ID: appId, DISCORD_PROTOTYPE_GUILD_ID: guildId, DISCORD_PROTOTYPE_PUBLIC_KEY: publicKeyHex, DISCORD_PROTOTYPE_BOT_TOKEN: botToken } = process.env;
const mode = process.argv[2] || 'serve';

function requireConfig(...names) {
  for (const name of names) if (!process.env[name]) throw new Error(`Set ${name} in .env.discord-prototype.local. See the live prototype README.`);
}

function fieldValues(components = []) {
  return components.flatMap((item) => [
    ...(typeof item.custom_id === 'string' && typeof item.value === 'string' ? [[item.custom_id, item.value]] : []),
    ...fieldValues(item.components || []),
    ...(item.component ? fieldValues([item.component]) : []),
  ]);
}

function modal(state, action, title, label, value = '') {
  return { type: 9, data: { custom_id: `${PREFIX}:${state.id}:${action}`, title,
    components: [{ type: 18, label, component: { type: 4, custom_id: 'value', style: 1, required: true, max_length: 60, ...(value ? { value } : {}) } }],
  } };
}

async function registration(remove = false) {
  requireConfig('DISCORD_PROTOTYPE_APP_ID', 'DISCORD_PROTOTYPE_GUILD_ID', 'DISCORD_PROTOTYPE_BOT_TOKEN');
  const base = `${API}/applications/${appId}/guilds/${guildId}/commands`;
  const headers = { authorization: `Bot ${botToken}`, 'Content-Type': 'application/json' };
  // Explicit per-name POSTs preserve unrelated guild commands and all globals.
  if (!remove) {
    for (const { integration_types, contexts, ...command } of COMMANDS) {
      const response = await fetch(base, { method: 'POST', headers, body: JSON.stringify(command) });
      if (!response.ok) throw new Error(`Registration of /${command.name} failed: HTTP ${response.status}.`);
      console.log(`Registered /${command.name} in test guild ${guildId}.`);
    }
    return;
  }
  const response = await fetch(base, { headers });
  if (!response.ok) throw new Error(`Reading guild commands failed: HTTP ${response.status}.`);
  for (const command of await response.json()) {
    if (!COMMAND_NAMES.includes(command.name) || !command.description?.startsWith('Prototype:')) continue;
    const deleted = await fetch(`${base}/${command.id}`, { method: 'DELETE', headers });
    if (!deleted.ok) throw new Error(`Removing /${command.name} failed: HTTP ${deleted.status}.`);
    console.log(`Removed prototype /${command.name}.`);
  }
}

async function patchReply(interaction, payload, png) {
  const url = `${API}/webhooks/${appId}/${encodeURIComponent(interaction.token)}/messages/@original`;
  const data = { content: '', allowed_mentions: { parse: [] }, ...payload,
    // This is the final attachment set: each image replaces the prior image.
    attachments: png ? [{ id: 0, filename: 'stats.png', description: 'AI Stack prototype statistics. Synthetic data.' }] : [],
  };
  let body;
  let headers;
  if (png) {
    const form = new FormData();
    form.append('payload_json', JSON.stringify(data));
    form.append('files[0]', new Blob([png], { type: 'image/png' }), 'stats.png');
    body = form;
  } else { body = JSON.stringify(data); headers = { 'Content-Type': 'application/json' }; }
  const response = await fetch(url, { method: 'PATCH', headers, body });
  if (!response.ok) throw new Error(`Discord message update failed: HTTP ${response.status}.`);
}

async function serve() {
  requireConfig('DISCORD_PROTOTYPE_APP_ID', 'DISCORD_PROTOTYPE_GUILD_ID', 'DISCORD_PROTOTYPE_PUBLIC_KEY');
  if (!/^[0-9a-f]{64}$/i.test(publicKeyHex)) throw new Error('DISCORD_PROTOTYPE_PUBLIC_KEY must be the 64-character hex public key.');
  const publicKey = createPublicKey({ key: Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), Buffer.from(publicKeyHex, 'hex')]), format: 'der', type: 'spki' });
  const sessions = new Map();
  const recent = new Map();
  const cleanup = setInterval(() => {
    for (const [id, state] of sessions) if (Date.now() - state.created > TTL_MS) sessions.delete(id);
    for (const [id, at] of recent) if (Date.now() - at > 5 * 60 * 1000) recent.delete(id);
  }, 60_000);
  cleanup.unref();

  const server = createServer(async (request, response) => {
    const json = (status, value) => { response.writeHead(status, { 'Content-Type': 'application/json' }); response.end(JSON.stringify(value)); };
    const privateReply = (content) => json(200, { type: 4, data: { content, flags: EPHEMERAL, allowed_mentions: { parse: [] } } });
    if (request.method === 'GET' && request.url === '/health') return json(200, { ok: true, prototype: true });
    if (request.method !== 'POST' || request.url !== '/interactions') return json(404, { error: 'Not found' });
    try {
      let size = 0;
      const chunks = [];
      for await (const chunk of request) { size += chunk.length; if (size > 256_000) return json(413, { error: 'Request too large' }); chunks.push(chunk); }
      const raw = Buffer.concat(chunks);
      const timestamp = request.headers['x-signature-timestamp'];
      const signature = request.headers['x-signature-ed25519'];
      if (typeof timestamp !== 'string' || !/^\d+$/.test(timestamp) || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300 || typeof signature !== 'string' || !/^[0-9a-f]{128}$/i.test(signature) ||
        !verify(null, Buffer.concat([Buffer.from(timestamp), raw]), publicKey, Buffer.from(signature, 'hex'))) return json(401, { error: 'Invalid signature' });
      let interaction;
      try { interaction = JSON.parse(raw.toString('utf8')); } catch { return json(400, { error: 'Invalid JSON' }); }
      if (interaction.type === 1) return json(200, { type: 1 });
      if (interaction.application_id !== appId || interaction.guild_id !== guildId) return privateReply('This prototype runs only in its configured test server.');
      const user = interaction.member?.user || interaction.user;
      if (!user?.id || !interaction.id || !interaction.token) return json(400, { error: 'Incomplete interaction' });
      if (recent.has(interaction.id)) return json(409, { error: 'Interaction already handled' });
      recent.set(interaction.id, Date.now());
      const options = interaction.data?.options || [];
      if (interaction.type === 4) {
        const query = options.find((option) => option.name === 'person' && option.focused)?.value || '';
        return json(200, { type: 8, data: { choices: findPeople(query).map(({ handle }) => ({ name: handle, value: handle })) } });
      }
      let state;
      let isCommand = false;
      if (interaction.type === 2) {
        const command = interaction.data?.name;
        if (!COMMAND_NAMES.includes(command)) return privateReply('This command is not part of the prototype.');
        let person = '';
        const input = options.find((option) => option.name === 'person')?.value;
        if (input) {
          const matches = findPeople(input);
          const exact = matches.find((candidate) => candidate.handle === String(input).trim().toLowerCase());
          if (!exact && matches.length !== 1) return privateReply('Choose alice, bob, or carol from person autocomplete.');
          person = (exact || matches[0]).handle;
        }
        state = { id: randomBytes(12).toString('hex'), created: Date.now(), owner: user.id, requester: user.global_name || user.username || 'Requester',
          command, days: 7, person, full: false, profileHandle: process.env.DISCORD_PROTOTYPE_PROFILE_HANDLE, panel: command === 'compare' && !person ? 'people' : '', search: '', busy: false };
        sessions.set(state.id, state);
        isCommand = true;
      } else if ([3, 5].includes(interaction.type)) {
        const [prefix, id, action] = String(interaction.data?.custom_id || '').split(':');
        state = prefix === PREFIX ? sessions.get(id) : null;
        if (!state || Date.now() - state.created > TTL_MS) return privateReply('This prototype answer expired. Run the command again.');
        if (state.owner !== user.id) return privateReply(`Only the person who ran this command can change this answer. Run /${state.command} to explore your own.`);
        if (state.busy) return privateReply('This answer is updating. Try again in a moment.');
        if (!interaction.message) return privateReply('This control needs its original answer. Run the command again.');
        if (interaction.type === 3 && action === 'custom-days') return json(200, modal(state, 'submit-days', 'Custom range', 'Number of UTC days (1 to 400)', String(state.days)));
        if (interaction.type === 3 && action === 'search-person') return json(200, modal(state, 'submit-search', 'Find a person', 'Creator username contains'));
        if (interaction.type === 5) {
          const value = new Map(fieldValues(interaction.data?.components)).get('value')?.trim() || '';
          if (action === 'submit-days') {
            if (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 400) return privateReply('Enter a whole number from 1 to 400.');
            state.days = Number(value); state.panel = '';
          } else if (action === 'submit-search') { state.search = value; state.panel = 'people'; }
          else return privateReply('Unknown prototype form. Run the command again.');
        } else if (action === 'range') state.panel = state.panel === 'range' ? '' : 'range';
        else if (action === 'people') { state.panel = 'people'; state.search = ''; }
        else if (action === 'full') state.full = !state.full;
        else if (['days-1', 'days-7', 'days-30'].includes(action)) { state.days = Number(action.slice(5)); state.panel = ''; }
        else if (action === 'person') {
          const selected = interaction.data?.values?.[0];
          if (!PEOPLE.some(({ handle }) => handle === selected)) return privateReply('Choose one of the listed prototype creators.');
          state.person = selected; state.panel = '';
        } else return privateReply('Unknown prototype control. Run the command again.');
        // Picker changes preserve the existing text and image without rendering.
        if (['range', 'people', 'submit-search'].includes(action)) return json(200, { type: 7, data: { components: controlRows(state), allowed_mentions: { parse: [] } } });
      } else return privateReply('This prototype handles slash commands, controls, and forms.');

      state.busy = true;
      json(200, { type: isCommand ? 5 : 6 });
      try {
        const snapshot = { ...state };
        const png = snapshot.command !== 'compare' || snapshot.person ? await renderStatsImage(snapshot) : null;
        if (png && Number.isFinite(interaction.attachment_size_limit) && png.length > interaction.attachment_size_limit) throw new Error('Rendered image exceeds the interaction upload limit.');
        await patchReply(interaction, replyPayload(snapshot), png);
        console.log(`Updated /${state.command}${state.person ? ' person comparison' : ''} (${state.days} days).`);
      } catch (error) {
        // Never log interaction tokens, raw requests, or Discord response bodies.
        console.error(error instanceof Error ? error.message : 'Prototype reply failed.');
        try { await patchReply(interaction, { content: 'The prototype could not render this answer. Run the command again.', embeds: [], components: [] }, null); } catch { console.error('Could not deliver the prototype error reply.'); }
      } finally { state.busy = false; }
    } catch {
      if (!response.headersSent) json(500, { error: 'Prototype request failed' });
      else console.error('Prototype request failed after acknowledgement.');
    }
  });
  const port = Number(process.env.DISCORD_PROTOTYPE_PORT || 3020);
  const host = process.env.DISCORD_PROTOTYPE_HOST || '127.0.0.1';
  server.listen(port, host, () => console.log(`Discord prototype: http://${host}:${port}/interactions\nHealth: http://${host}:${port}/health\nExpose this port through your HTTPS tunnel. No messages are sent until a command is invoked.`));
}

try {
  if (mode === 'dry-run') console.log(JSON.stringify({ scope: 'test guild only', commands: COMMANDS }, null, 2));
  else if (mode === 'register') await registration();
  else if (mode === 'unregister') await registration(true);
  else if (mode === 'render-preview') {
    const directory = '/tmp/aistack-discord-live-preview';
    await mkdir(directory, { recursive: true });
    for (const command of ['tokens', 'cost', 'harness', 'context', 'compare']) {
      const state = { command, days: 7, requester: 'alper', person: command === 'compare' ? 'alice' : '' };
      await writeFile(`${directory}/${command}.png`, await renderStatsImage(state));
      console.log(`${directory}/${command}.png`);
    }
  } else if (mode === 'serve') await serve();
  else throw new Error('Use serve, register, unregister, dry-run, or render-preview.');
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Prototype failed.');
  process.exitCode = 1;
}

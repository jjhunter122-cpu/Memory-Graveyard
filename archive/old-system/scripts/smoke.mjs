/**
 * Headless smoke test: boots the real app in Firefox via WebDriver, checks that
 * the scene builds and that the character moves and jumps, then saves a
 * screenshot.
 *
 * Requirements (not installed by pnpm):
 *   1. A running dev/preview server, e.g. `pnpm dev`.
 *   2. `geckodriver` listening, e.g. `geckodriver --port 4444`.
 *
 * Usage:
 *   node scripts/smoke.mjs
 *   GAME_URL=http://localhost:5173 GECKODRIVER_URL=http://127.0.0.1:4444 node scripts/smoke.mjs
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const GAME_URL = process.env.GAME_URL ?? 'http://localhost:5173/';
const DRIVER = process.env.GECKODRIVER_URL ?? 'http://127.0.0.1:4444';
const SHOT = process.env.SMOKE_SCREENSHOT ?? path.join(os.tmpdir(), 'memory-graveyard-smoke.png');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function wd(method, route, body) {
  const res = await fetch(DRIVER + route, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  if (!res.ok) {
    throw new Error(`${method} ${route} -> ${res.status} ${text}`);
  }
  return json;
}

let failures = 0;
function check(name, ok, detail) {
  const status = ok ? 'PASS' : 'FAIL';
  if (!ok) failures += 1;
  console.log(`  [${status}] ${name}${detail === undefined ? '' : ` — ${detail}`}`);
}

const caps = {
  capabilities: {
    alwaysMatch: {
      browserName: 'firefox',
      'moz:firefoxOptions': { args: ['-headless'] },
    },
  },
};

const created = await wd('POST', '/session', caps);
const sid = `/session/${created.value.sessionId}`;
const $ = (script) => wd('POST', `${sid}/execute/sync`, { args: [], script }).then((r) => r.value);

try {
  await wd('POST', `${sid}/url`, { url: GAME_URL });
  await sleep(3500);

  // Start a level from the title screen.
  await $(`document.getElementById('menu-play')?.click(); return true;`);
  await sleep(1800);

  const diag = await $(
    `const g = window.graveyard; const s = g && g.currentScene; const p = s && s.player;
     const c = document.getElementById('game');
     return { scene: s ? s.constructor.name : null, actors: s ? s.actors.length : -1,
              player: !!p, grounded: p ? p.controller.isGrounded : null,
              canvas: c ? [c.width, c.height] : null };`,
  );
  console.log('diagnostics:', JSON.stringify(diag));
  check('engine booted and scene is PlayScene', diag.scene === 'PlayScene', diag.scene);
  check('level built actors', diag.actors > 5, `${diag.actors} actors`);
  check('player exists', diag.player === true);
  check('player starts grounded', diag.grounded === true);
  check('canvas is 960x540', diag.canvas?.[0] === 960 && diag.canvas?.[1] === 540);

  if (diag.player) {
    const x0 = await $(`return window.graveyard.currentScene.player.pos.x;`);

    await wd('POST', `${sid}/actions`, {
      actions: [{ type: 'key', id: 'kb', actions: [{ type: 'keyDown', value: 'd' }] }],
    });
    await sleep(700);
    const moved = await $(
      `const p = window.graveyard.currentScene.player; return [p.pos.x, p.vel.x, p.controller.isGrounded];`,
    );

    const beforeJumpY = await $(`return window.graveyard.currentScene.player.pos.y;`);
    await wd('POST', `${sid}/actions`, {
      actions: [{ type: 'key', id: 'kb', actions: [{ type: 'keyDown', value: '\uE00D' }] }],
    });
    await sleep(150);
    const jumpY = await $(`return window.graveyard.currentScene.player.pos.y;`);

    await wd('POST', `${sid}/actions`, {
      actions: [
        {
          type: 'key',
          id: 'kb',
          actions: [{ type: 'keyUp', value: '\uE00D' }, { type: 'keyUp', value: 'd' }],
        },
      ],
    });

    check('moves right', moved[0] > x0 + 50, `x ${x0} -> ${Math.round(moved[0])}`);
    check('reaches run speed', Math.abs(moved[1] - 225) < 1, `vx ${moved[1]}`);
    check('was grounded while running', moved[2] === true);
    check(
      'jumps upward',
      jumpY < beforeJumpY - 30,
      `y ${Math.round(beforeJumpY)} -> ${Math.round(jumpY)}`,
    );

    // Collectables: the actor-level event carries the collider's owner.
    const beforeCollect = await $(
      `const s = window.graveyard.currentScene;
       if (!s.built.memories.length) return null;
       const p = s.player; const m = s.built.memories[0];
       p.pos.setTo(m.pos.x, m.pos.y); p.vel.setTo(0, 0);
       return s.collected;`,
    );
    await sleep(300);
    const afterCollect = await $(
      `const s = window.graveyard.currentScene;
       return { collected: s.collected, counter: document.getElementById('collected')?.textContent };`,
    );
    check(
      'collects a memory',
      beforeCollect !== null && afterCollect.collected === beforeCollect + 1,
      `collected ${beforeCollect} -> ${afterCollect.collected} (${afterCollect.counter})`,
    );

    const shot = await wd('GET', `${sid}/screenshot`);
    fs.writeFileSync(SHOT, Buffer.from(shot.value, 'base64'));
    console.log(`screenshot: ${SHOT}`);
  }
} finally {
  try {
    await wd('DELETE', sid);
  } catch {
    /* ignore */
  }
}

console.log(failures === 0 ? '\nSMOKE PASSED' : `\nSMOKE FAILED (${failures})`);
process.exit(failures === 0 ? 0 : 1);

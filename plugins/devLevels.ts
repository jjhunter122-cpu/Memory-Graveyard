import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

/**
 * Dev-only convenience: the editor's "Save to project" and the sequence screen
 * POST here, and levels/sequences are written into `public/levels/`. This plugin
 * only applies to `vite dev` (`apply: 'serve'`) and never ships to production.
 */

interface SavePayload {
  id?: string;
  name?: string;
  tier?: string;
  level?: unknown;
}

interface SequencePayload {
  sequences?: unknown;
}

interface IndexEntry {
  id: string;
  name: string;
  file: string;
  tier: string;
}

function sanitizeId(value: string): string | null {
  const id = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return id.length > 0 ? id : null;
}

function sendJson(res: import('node:http').ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function readBody(req: import('node:http').IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function readIndex(indexPath: string): { version: number; levels: IndexEntry[] } {
  try {
    const parsed = JSON.parse(fs.readFileSync(indexPath, 'utf8')) as {
      version?: number;
      levels?: IndexEntry[];
    };
    if (Array.isArray(parsed.levels)) {
      return { version: 1, levels: parsed.levels };
    }
  } catch {
    /* fall through to a fresh index */
  }
  return { version: 1, levels: [] };
}

export function devLevels(): Plugin {
  return {
    name: 'memory-graveyard:dev-levels',
    apply: 'serve',
    configureServer(server) {
      const levelsDir = path.resolve(server.config.root, 'public', 'levels');

      server.middlewares.use('/__levels/save', (req, res, next) => {
        if (req.method !== 'POST') {
          next();
          return;
        }
        void readBody(req)
          .then((body) => {
            const payload = JSON.parse(body) as SavePayload;
            const id = sanitizeId(payload.id ?? payload.name ?? '');
            if (!id) {
              throw new Error('invalid level id');
            }
            if (typeof payload.name !== 'string' || payload.name.length === 0) {
              throw new Error('invalid level name');
            }
            if (typeof payload.level !== 'object' || payload.level === null) {
              throw new Error('invalid level body');
            }

            fs.mkdirSync(levelsDir, { recursive: true });
            const fileName = `${id}.json`;
            fs.writeFileSync(
              path.join(levelsDir, fileName),
              `${JSON.stringify(payload.level, null, 2)}\n`,
            );

            const indexPath = path.join(levelsDir, 'index.json');
            const index = readIndex(indexPath);
            const tier = payload.tier === 'community' ? 'community' : 'dev';
            const entry: IndexEntry = { id, name: payload.name, file: `levels/${fileName}`, tier };
            index.levels = [...index.levels.filter((level) => level.id !== id), entry];
            fs.writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`);

            sendJson(res, 200, { ok: true, id, file: entry.file, tier: entry.tier });
          })
          .catch((error) => sendJson(res, 400, { error: String(error) }));
      });

      server.middlewares.use('/__sequences/save', (req, res, next) => {
        if (req.method !== 'POST') {
          next();
          return;
        }
        void readBody(req)
          .then((body) => {
            const payload = JSON.parse(body) as SequencePayload;
            if (!Array.isArray(payload.sequences)) {
              throw new Error('invalid sequences body');
            }
            fs.mkdirSync(levelsDir, { recursive: true });
            const file = { version: 1, sequences: payload.sequences };
            fs.writeFileSync(
              path.join(levelsDir, 'sequences.json'),
              `${JSON.stringify(file, null, 2)}\n`,
            );
            sendJson(res, 200, { ok: true, file: 'levels/sequences.json' });
          })
          .catch((error) => sendJson(res, 400, { error: String(error) }));
      });
    },
  };
}

import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

/**
 * Dev-only convenience: the editor's "Save to project" button POSTs here and the
 * level is written into `public/levels/`, with `index.json` updated. This plugin
 * only applies to `vite dev` (`apply: 'serve'`) and never ships to production.
 */

interface SavePayload {
  id?: string;
  name?: string;
  level?: unknown;
}

interface IndexEntry {
  id: string;
  name: string;
  file: string;
}

function sanitizeId(value: string): string | null {
  const id = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return id.length > 0 ? id : null;
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
      server.middlewares.use('/__levels/save', (req, res, next) => {
        if (req.method !== 'POST') {
          next();
          return;
        }
        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });
        req.on('end', () => {
          try {
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

            const levelsDir = path.resolve(server.config.root, 'public', 'levels');
            fs.mkdirSync(levelsDir, { recursive: true });
            const fileName = `${id}.json`;
            fs.writeFileSync(
              path.join(levelsDir, fileName),
              `${JSON.stringify(payload.level, null, 2)}\n`,
            );

            const indexPath = path.join(levelsDir, 'index.json');
            const index = readIndex(indexPath);
            const entry: IndexEntry = { id, name: payload.name, file: `levels/${fileName}` };
            index.levels = [...index.levels.filter((level) => level.id !== id), entry];
            fs.writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`);

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, id, file: entry.file }));
          } catch (error) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: String(error) }));
          }
        });
      });
    },
  };
}

// Accès partagé aux fichiers d'orchestration (serveur du Command Center + CLI de l'orchestrateur).
// Aucune dépendance externe.
//
// Propriété des fichiers :
//   - inbox/commands.jsonl  : écrit UNIQUEMENT par le Command Center (demandes de l'utilisateur)
//   - tout le reste         : écrit UNIQUEMENT par l'orchestrateur
// Cette séparation évite que l'interface et l'orchestrateur écrivent le même fichier.
// Les appels simultanés du CLI entre eux sont sérialisés par un fichier verrou (withLock).

import { readFile, writeFile, appendFile, rename, mkdir, open, unlink, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const LIB_DIR = path.dirname(fileURLToPath(import.meta.url));
export const ORCH_DIR = path.resolve(LIB_DIR, '..');
export const CC_DIR = path.resolve(ORCH_DIR, '..');
export const PROJECT_DIR = path.resolve(CC_DIR, '..');

export const FILES = {
  registry: path.join(ORCH_DIR, 'registry.json'),
  plan: path.join(ORCH_DIR, 'plan.json'),
  state: path.join(ORCH_DIR, 'state.json'),
  acks: path.join(ORCH_DIR, 'inbox', 'acks.jsonl'),
  commands: path.join(ORCH_DIR, 'inbox', 'commands.jsonl'),
  events: path.join(CC_DIR, 'events', 'events.jsonl'),
};

export const REPORTS_DIR = path.join(PROJECT_DIR, 'reports');

export const COMMAND_TYPES = {
  'project.pause': { target: 'none', label: 'Mettre le projet en pause' },
  'project.resume': { target: 'none', label: 'Reprendre le projet' },
  'tasks.suspend': { target: 'none', label: 'Suspendre les nouvelles tâches' },
  'tasks.resume': { target: 'none', label: 'Autoriser de nouveau les nouvelles tâches' },
  'agent.pause': { target: 'agent', label: "Mettre l'agent en pause" },
  'agent.resume': { target: 'agent', label: "Lever la pause de l'agent" },
  'agent.reevaluate': { target: 'agent', label: 'Demander une réévaluation' },
  'agent.improve': { target: 'agent', label: 'Demander une amélioration' },
  'decision.approve': { target: 'decision', label: 'Valider' },
  'decision.reject': { target: 'decision', label: 'Refuser' },
  'decision.improve': { target: 'decision', label: 'Demander une amélioration' },
};

export const now = () => new Date().toISOString();

export async function readJson(file, fallback = null) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return fallback;
    throw error;
  }
}

/** Lit un fichier JSON Lines ; les lignes illisibles sont ignorées et comptées. */
export async function readJsonLines(file) {
  let raw;
  try {
    raw = await readFile(file, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return { rows: [], skipped: 0 };
    throw error;
  }
  const rows = [];
  let skipped = 0;
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    try {
      rows.push(JSON.parse(line));
    } catch {
      skipped += 1;
    }
  }
  return { rows, skipped };
}

/** Écriture atomique : fichier temporaire puis renommage. */
export async function writeJson(file, data) {
  await mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}`;
  await writeFile(tmp, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  await rename(tmp, file);
}

export async function appendJsonLine(file, row) {
  await mkdir(path.dirname(file), { recursive: true });
  await appendFile(file, `${JSON.stringify(row)}\n`, 'utf8');
}

/** Commandes de l'utilisateur enrichies de leur accusé de réception éventuel. */
export async function readCommands() {
  const [{ rows: commands }, { rows: acks }] = await Promise.all([
    readJsonLines(FILES.commands),
    readJsonLines(FILES.acks),
  ]);
  const ackById = new Map(acks.map((ack) => [ack.commandId, ack]));
  return commands.map((command) => ({ ...command, ack: ackById.get(command.id) ?? null }));
}

const LOCK_FILE = path.join(ORCH_DIR, '.orchestrate.lock');
const LOCK_STALE_MS = 30_000;

/** Sérialise les modifications d'état : un seul processus du CLI écrit à la fois. */
export async function withLock(action) {
  const deadline = Date.now() + 15_000;
  for (;;) {
    try {
      const handle = await open(LOCK_FILE, 'wx');
      await handle.close();
      break;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      const age = await stat(LOCK_FILE).then((info) => Date.now() - info.mtimeMs, () => 0);
      if (age > LOCK_STALE_MS) await unlink(LOCK_FILE).catch(() => {});
      else if (Date.now() > deadline) throw new Error('Verrou d\'orchestration occupé depuis plus de 15 s.');
      else await new Promise((resolve) => setTimeout(resolve, 25 + Math.random() * 50));
    }
  }
  try {
    return await action();
  } finally {
    await unlink(LOCK_FILE).catch(() => {});
  }
}

/** Prochain identifiant d'une série (P-001, V-002…) : plus grand numéro existant + 1. */
export function nextSerial(items, prefix) {
  const highest = items.reduce((max, item) => Math.max(max, Number(String(item.id).split('-')[1]) || 0), 0);
  return `${prefix}-${String(highest + 1).padStart(3, '0')}`;
}

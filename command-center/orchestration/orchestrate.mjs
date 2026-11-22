#!/usr/bin/env node
// CLI de l'orchestrateur (agent 01). Seul point d'écriture de l'état du projet.
// Usage : node orchestrate.mjs <commande> [arguments]   —   voir `node orchestrate.mjs help`.

import {
  FILES, COMMAND_TYPES, now, readJson, writeJson, appendJsonLine, readCommands, withLock, nextSerial,
} from './lib/store.mjs';

const TASK_STATUSES = ['pending', 'in_progress', 'done', 'blocked'];
const DECISION_STATUSES = ['awaiting', 'approved', 'rejected', 'improve'];

class CliError extends Error {}
// Une erreur d'usage est levée (et non un arrêt immédiat) pour que le verrou soit toujours rendu.
const fail = (message) => { throw new CliError(message); };

async function load() {
  const [registry, plan, state] = await Promise.all([
    readJson(FILES.registry), readJson(FILES.plan), readJson(FILES.state),
  ]);
  if (!registry || !plan) fail('registry.json ou plan.json introuvable.');
  return { registry, plan, state };
}

const save = (state) => writeJson(FILES.state, state);

async function logEvent(agent, kind, message, extra = {}) {
  await appendJsonLine(FILES.events, { ts: now(), agent, kind, message, ...extra });
}

function requireState(state) {
  if (!state) fail("state.json absent : lancer d'abord `init`.");
  return state;
}

const nextId = nextSerial;

/** Sépare « titre :: détail ». */
function splitTitle(words) {
  const [title, ...rest] = words.join(' ').split(' :: ');
  return { title: title.trim(), detail: rest.join(' :: ').trim() };
}

const commands = {
  async init() {
    const { registry, plan, state } = await load();
    if (state) fail('state.json existe déjà.');
    const fresh = {
      schema: 1,
      project: { status: 'running', phase: 'A', createdAt: now() },
      session: { active: true, since: now(), note: '' },
      checkpoint: { last: null, count: 0 },
      control: { paused: false, newTasksSuspended: false, pausedAgents: [], requests: [] },
      tasks: Object.fromEntries(plan.tasks.map((task) => [task.id, { status: 'pending' }])),
      agents: Object.fromEntries(registry.agents.map((agent) => [
        agent.id,
        { status: agent.id === '01' ? 'running' : 'never', currentTask: null, lastRunAt: null },
      ])),
      runs: [],
      issues: [],
      decisions: [],
    };
    await save(fresh);
    await logEvent('01', 'project', 'Orchestration initialisée : 14 agents enregistrés.');
  },

  async session([mode, ...note]) {
    const { state } = await load();
    requireState(state);
    if (!['start', 'end'].includes(mode)) fail('session start|end [note]');
    state.session = { active: mode === 'start', since: now(), note: note.join(' ') };
    state.agents['01'].status = mode === 'start' ? 'running' : 'standby';
    await save(state);
    await logEvent('01', 'session', mode === 'start' ? 'Session de travail ouverte.' : `Session de travail close. ${note.join(' ')}`.trim());
  },

  async phase([id]) {
    const { plan, state } = await load();
    requireState(state);
    if (!plan.phases.some((phase) => phase.id === id)) fail(`phase inconnue : ${id}`);
    state.project.phase = id;
    await save(state);
    await logEvent('01', 'phase', `Phase ${id} ouverte.`);
  },

  async event([agent, kind, ...message]) {
    if (!agent || !kind || !message.length) fail('event <agent> <type> <message>');
    await logEvent(agent, kind, message.join(' '));
  },

  async task([id, status, ...note]) {
    const { plan, state } = await load();
    requireState(state);
    const task = plan.tasks.find((item) => item.id === id);
    if (!task) fail(`tâche inconnue : ${id}`);
    if (!TASK_STATUSES.includes(status)) fail(`statut invalide (${TASK_STATUSES.join(', ')})`);
    const verification = note.join(' ');
    const entry = state.tasks[id] ?? (state.tasks[id] = { status: 'pending' });
    if (status === 'done') {
      if (!verification) fail('une tâche ne peut être close sans note de vérification.');
      if (entry.status !== 'in_progress') fail(`la tâche ${id} n'est pas en cours : elle ne peut pas être close.`);
      const open = task.dependsOn.filter((dependency) => state.tasks[dependency]?.status !== 'done');
      if (open.length) fail(`dépendances non closes : ${open.join(', ')}.`);
    }
    if (status === 'in_progress' && (state.control.paused || state.control.newTasksSuspended)) {
      fail('projet en pause ou nouvelles tâches suspendues : impossible de démarrer une tâche.');
    }
    entry.status = status;
    if (status === 'in_progress') entry.startedAt = now();
    if (status === 'done') Object.assign(entry, { endedAt: now(), verification });
    if (status === 'blocked') entry.blockedReason = verification;
    await save(state);
    const labels = { pending: 'remise en attente', in_progress: 'démarrée', done: 'terminée et vérifiée', blocked: 'bloquée' };
    await logEvent(task.agent, 'task', `Tâche ${id} ${labels[status]} — ${task.title}${verification ? ` (${verification})` : ''}`, { task: id });
  },

  async 'task-add'([json]) {
    const { plan, state } = await load();
    requireState(state);
    const task = JSON.parse(json);
    for (const key of ['id', 'phase', 'agent', 'title']) if (!task[key]) fail(`champ manquant : ${key}`);
    if (plan.tasks.some((item) => item.id === task.id)) fail(`tâche déjà existante : ${task.id}`);
    plan.tasks.push({ dependsOn: [], deliverable: '', ...task });
    state.tasks[task.id] = { status: 'pending' };
    await writeJson(FILES.plan, plan);
    await save(state);
    await logEvent(task.agent, 'task', `Tâche ${task.id} ajoutée au plan — ${task.title}`, { task: task.id });
  },

  async run([mode, ...args]) {
    const { registry, state } = await load();
    requireState(state);
    if (mode === 'start') {
      const [agent, task, ...label] = args;
      if (!registry.agents.some((item) => item.id === agent)) fail(`agent inconnu : ${agent}`);
      if (state.control.paused) fail('projet en pause : aucun agent ne peut être lancé.');
      if (state.control.newTasksSuspended) fail('nouvelles tâches suspendues : aucun agent ne peut être lancé.');
      if (state.control.pausedAgents.includes(agent)) fail(`agent ${agent} en pause.`);
      const running = state.runs.filter((run) => !run.endedAt).length;
      if (running >= 3) fail('3 sous-agents déjà en cours (limite de parallélisme).');
      const run = { id: nextSerial(state.runs, 'R'), agent, task, label: label.join(' '), startedAt: now(), endedAt: null, outcome: null, report: null, summary: '' };
      state.runs.push(run);
      Object.assign(state.agents[agent], { status: 'running', currentTask: task });
      await save(state);
      await logEvent(agent, 'run', `Sous-agent lancé (${run.id}) — ${run.label}`, { run: run.id, task });
      console.log(run.id);
      return;
    }
    if (mode === 'end') {
      const [runId, outcome, report, ...summary] = args;
      const run = state.runs.find((item) => item.id === runId);
      if (!run) fail(`exécution inconnue : ${runId}`);
      if (!['ok', 'partial', 'failed'].includes(outcome)) fail('résultat : ok | partial | failed');
      Object.assign(run, { endedAt: now(), outcome, report: report === '-' ? null : report, summary: summary.join(' ') });
      Object.assign(state.agents[run.agent], {
        status: state.control.pausedAgents.includes(run.agent) ? 'paused' : 'standby',
        currentTask: null,
        lastRunAt: run.endedAt,
      });
      await save(state);
      const labels = { ok: 'terminée', partial: 'terminée partiellement', failed: 'en échec' };
      await logEvent(run.agent, 'run', `Exécution ${runId} ${labels[outcome]}${run.report ? ` — rapport : ${run.report}` : ''}`, { run: runId, task: run.task });
      return;
    }
    fail('run start <agent> <tâche> <libellé> | run end <id> <ok|partial|failed> <rapport|-> [résumé]');
  },

  async issue([mode, ...args]) {
    const { state } = await load();
    requireState(state);
    if (mode === 'open') {
      const [agent, severity, ...words] = args;
      if (!['critique', 'majeur', 'mineur'].includes(severity)) fail('gravité : critique | majeur | mineur');
      const issue = { id: nextId(state.issues, 'P'), agent, severity, ...splitTitle(words), status: 'open', openedAt: now(), resolvedAt: null, resolution: '' };
      state.issues.push(issue);
      await save(state);
      await logEvent(agent, 'issue', `Problème ${issue.id} ouvert (${severity}) — ${issue.title}`, { issue: issue.id });
      console.log(issue.id);
      return;
    }
    if (mode === 'resolve') {
      const [id, ...resolution] = args;
      const issue = state.issues.find((item) => item.id === id);
      if (!issue) fail(`problème inconnu : ${id}`);
      if (!resolution.length) fail('une résolution doit être décrite.');
      Object.assign(issue, { status: 'resolved', resolvedAt: now(), resolution: resolution.join(' ') });
      await save(state);
      await logEvent(issue.agent, 'issue', `Problème ${id} résolu — ${issue.resolution}`, { issue: id });
      return;
    }
    fail('issue open <agent> <gravité> <titre> :: <détail> | issue resolve <id> <résolution>');
  },

  async decision([mode, ...args]) {
    const { state } = await load();
    requireState(state);
    if (mode === 'add') {
      const [kind, agent, ...words] = args;
      if (!['validation', 'proposal'].includes(kind)) fail('type : validation | proposal');
      const prefix = kind === 'validation' ? 'V' : 'S';
      const sameKind = state.decisions.filter((item) => item.kind === kind);
      const decision = { id: nextId(sameKind, prefix), kind, agent, ...splitTitle(words), status: 'awaiting', createdAt: now(), decidedAt: null, decisionNote: '', decidedVia: null };
      state.decisions.push(decision);
      await save(state);
      await logEvent(agent, 'decision', `${kind === 'validation' ? 'Validation demandée' : 'Proposition déposée'} ${decision.id} — ${decision.title}`, { decision: decision.id });
      console.log(decision.id);
      return;
    }
    if (mode === 'set') {
      const [id, status, ...note] = args;
      const decision = state.decisions.find((item) => item.id === id);
      if (!decision) fail(`décision inconnue : ${id}`);
      if (!DECISION_STATUSES.includes(status)) fail(`statut : ${DECISION_STATUSES.join(' | ')}`);
      Object.assign(decision, { status, decidedAt: now(), decisionNote: note.join(' '), decidedVia: 'conversation' });
      await save(state);
      await logEvent('01', 'decision', `Décision ${id} : ${status}${note.length ? ` — ${note.join(' ')}` : ''}`, { decision: id });
      return;
    }
    fail('decision add <validation|proposal> <agent> <titre> :: <détail> | decision set <id> <statut> [note]');
  },

  async request([mode, commandId, ...note]) {
    const { state } = await load();
    requireState(state);
    if (mode !== 'done') fail('request done <id de commande> <ce qui a été fait>');
    const request = state.control.requests.find((item) => item.commandId === commandId);
    if (!request) fail(`demande inconnue : ${commandId}`);
    Object.assign(request, { status: 'done', doneAt: now(), outcome: note.join(' ') });
    await save(state);
    await logEvent(request.agent, 'control', `Demande traitée (${request.type}) — ${request.outcome}`);
  },

  /** Lit les demandes du Command Center et applique celles qui sont automatiques. */
  async checkpoint() {
    const { registry, state } = await load();
    requireState(state);
    const pending = (await readCommands()).filter((command) => !command.ack);
    const agentIds = new Set(registry.agents.map((agent) => agent.id));
    const report = [];

    for (const command of pending) {
      const spec = typeof command.type === 'string' && Object.hasOwn(COMMAND_TYPES, command.type) ? COMMAND_TYPES[command.type] : null;
      let result = 'applied';
      let note = '';
      if (!spec) {
        result = 'declined';
        note = 'Type de commande inconnu.';
      } else if (spec.target === 'agent' && !agentIds.has(command.target)) {
        result = 'declined';
        note = 'Agent inconnu.';
      } else if (command.type === 'project.pause') {
        state.control.paused = true;
        state.project.status = 'paused';
        note = 'Projet en pause : aucune nouvelle tâche ni aucun agent ne sera lancé.';
      } else if (command.type === 'project.resume') {
        state.control.paused = false;
        state.project.status = 'running';
        note = 'Projet repris.';
      } else if (command.type === 'tasks.suspend') {
        state.control.newTasksSuspended = true;
        note = 'Nouvelles tâches suspendues ; les opérations en cours se terminent.';
      } else if (command.type === 'tasks.resume') {
        state.control.newTasksSuspended = false;
        note = 'Nouvelles tâches de nouveau autorisées.';
      } else if (command.type === 'agent.pause') {
        if (command.target === '01') {
          result = 'declined';
          note = "L'orchestrateur ne se met pas en pause individuellement : utiliser la pause du projet.";
        } else {
          if (!state.control.pausedAgents.includes(command.target)) state.control.pausedAgents.push(command.target);
          const agent = state.agents[command.target];
          if (agent.status !== 'running') agent.status = 'paused';
          note = agent.status === 'running'
            ? "Pause enregistrée : l'exécution en cours se termine, aucune nouvelle mission ne sera confiée à cet agent."
            : "Agent en pause : aucune mission ne lui sera confiée.";
        }
      } else if (command.type === 'agent.resume') {
        state.control.pausedAgents = state.control.pausedAgents.filter((id) => id !== command.target);
        const agent = state.agents[command.target];
        if (agent.status === 'paused') agent.status = agent.lastRunAt ? 'standby' : 'never';
        note = "Pause levée.";
      } else if (command.type === 'agent.reevaluate' || command.type === 'agent.improve') {
        state.control.requests.push({ commandId: command.id, agent: command.target, type: command.type, note: command.note ?? '', status: 'open', receivedAt: now() });
        result = 'noted';
        note = "Demande inscrite : elle sera traitée lors de la prochaine mission de l'agent.";
      } else if (spec.target === 'decision') {
        const decision = state.decisions.find((item) => item.id === command.target);
        if (!decision) {
          result = 'declined';
          note = 'Décision inconnue.';
        } else if (decision.status !== 'awaiting' && decision.status !== 'improve') {
          result = 'declined';
          note = `Décision déjà rendue (${decision.status}).`;
        } else {
          const status = { 'decision.approve': 'approved', 'decision.reject': 'rejected', 'decision.improve': 'improve' }[command.type];
          Object.assign(decision, { status, decidedAt: now(), decisionNote: command.note ?? '', decidedVia: 'command-center' });
          note = `Décision enregistrée : ${status}.`;
        }
      } else {
        result = 'declined';
        note = 'Commande sans effet défini : rien n\'a été appliqué.';
      }
      await appendJsonLine(FILES.acks, { commandId: command.id, ts: now(), result, note });
      await logEvent(spec?.target === 'agent' ? command.target : '01', 'control', `Commande « ${spec?.label ?? command.type} »${command.target ? ` [${command.target}]` : ''} : ${note}`, { command: command.id });
      report.push({ id: command.id, type: command.type, target: command.target ?? null, userNote: command.note ?? '', result, note });
    }

    state.checkpoint = { last: now(), count: (state.checkpoint?.count ?? 0) + 1 };
    await save(state);
    console.log(JSON.stringify({
      commandsProcessed: report,
      paused: state.control.paused,
      newTasksSuspended: state.control.newTasksSuspended,
      pausedAgents: state.control.pausedAgents,
      openRequests: state.control.requests.filter((request) => request.status === 'open'),
    }, null, 2));
    if (state.control.paused) process.exitCode = 2;
  },

  async help() {
    console.log(`Commandes :
  init
  session start|end [note]
  phase <id>
  event <agent> <type> <message>
  task <id> <pending|in_progress|done|blocked> [note de vérification]
  task-add '<json>'
  run start <agent> <tâche> <libellé>      |  run end <id> <ok|partial|failed> <rapport|-> [résumé]
  issue open <agent> <gravité> <titre> :: <détail>   |  issue resolve <id> <résolution>
  decision add <validation|proposal> <agent> <titre> :: <détail>   |  decision set <id> <statut> [note]
  request done <id de commande> <ce qui a été fait>
  checkpoint        (code de sortie 2 si le projet est en pause)`);
  },
};

const [name = 'help', ...args] = process.argv.slice(2);
// Les commandes qui modifient l'état sont sérialisées par verrou.
try {
  if (!Object.hasOwn(commands, name)) fail(`commande inconnue : ${name}`);
  await (name === 'help' ? commands.help() : withLock(() => commands[name](args)));
} catch (error) {
  if (!(error instanceof CliError)) throw error;
  console.error(`Erreur : ${error.message}`);
  process.exitCode = 1;
}

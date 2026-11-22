// TARGARYEN COMMAND CENTER — interface.
// Tout ce qui est affiché provient de /api/state (fichiers réels de l'orchestration).
// Les boutons n'agissent pas directement sur les agents : ils déposent une demande
// que l'orchestrateur lit et applique à son prochain checkpoint.

const POLL_MS = 4000;

const TASK_STATUS = { pending: 'En attente', in_progress: 'En cours', done: 'Terminée', blocked: 'Bloquée' };
const AGENT_STATUS = { never: 'Jamais exécuté', running: 'En mission', standby: 'En veille', paused: 'En pause' };
const DECISION_STATUS = { awaiting: 'En attente de votre décision', approved: 'Validée', rejected: 'Refusée', improve: 'Amélioration demandée' };
const ACK_RESULT = { applied: 'Appliquée', noted: 'Prise en compte', declined: 'Non appliquée' };
const RUN_OUTCOME = { ok: 'Terminée', partial: 'Partielle', failed: 'Échec' };
const VIEWS = { '': 'overview', agents: 'agents', taches: 'tasks', decisions: 'decisions', problemes: 'issues', rapports: 'reports', journal: 'journal' };

const NOTE_PROMPTS = {
  'agent.reevaluate': { title: 'Demander une réévaluation', help: "Indiquez ce que l'agent doit réexaminer. La demande sera traitée lors de sa prochaine mission.", required: true },
  'agent.improve': { title: 'Demander une amélioration', help: "Décrivez l'amélioration attendue. La demande sera traitée lors de la prochaine mission de l'agent.", required: true },
  'decision.improve': { title: 'Demander une amélioration', help: 'Décrivez ce qui doit être amélioré avant une nouvelle présentation.', required: true },
  'decision.reject': { title: 'Refuser', help: 'Indiquez le motif du refus.', required: true },
  'decision.approve': { title: 'Valider', help: 'Vous pouvez ajouter une remarque (facultatif).', required: false },
};

const $ = (id) => document.getElementById(id);
const view = $('view');
const ui = { snapshot: null, signature: '', journalAgent: '', journalKind: '', openAgent: null, flash: '', offline: false };

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const dateTime = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
const when = (iso) => (iso ? dateTime.format(new Date(iso)) : '—');
const plural = (count, one, many) => `${count} ${count > 1 ? many : one}`;
const SILENCE_MS = 30 * 60 * 1000; // au-delà, l'activité de l'orchestrateur n'est plus tenue pour confirmée

/* ---------- Données dérivées ---------- */

function derive(snapshot) {
  const { registry, plan, state, commands } = snapshot;
  const agents = new Map(registry.agents.map((agent) => [agent.id, agent]));
  const tasks = plan.tasks.map((task) => ({ ...task, ...(state.tasks[task.id] ?? { status: 'pending' }) }));
  const count = (list, status) => list.filter((task) => task.status === status).length;
  const pendingCommands = commands.filter((command) => !command.ack);
  return {
    agents,
    tasks,
    totals: { all: tasks.length, done: count(tasks, 'done'), in_progress: count(tasks, 'in_progress'), pending: count(tasks, 'pending'), blocked: count(tasks, 'blocked') },
    tasksOf: (agentId) => tasks.filter((task) => task.agent === agentId),
    runsOf: (agentId) => state.runs.filter((run) => run.agent === agentId),
    runningRuns: state.runs.filter((run) => !run.endedAt),
    openIssues: state.issues.filter((issue) => issue.status === 'open'),
    awaiting: state.decisions.filter((decision) => decision.status === 'awaiting'),
    pendingCommands,
    hasPending: (type, target = null) => pendingCommands.some((command) => command.type === type && command.target === target),
  };
}

const agentLabel = (d, id) => (d.agents.has(id) ? `${id} · ${d.agents.get(id).name}` : id);

function agentStatusLabel(agentId, status) {
  if (agentId === '01') return status === 'running' ? 'En session' : 'Hors session';
  return AGENT_STATUS[status] ?? status;
}

/* ---------- Fragments ---------- */

const pill = (label, tone) => `<span class="pill pill--${tone}">${esc(label)}</span>`;
const taskPill = (status) => pill(TASK_STATUS[status], status);
const empty = (text) => `<p class="empty">${esc(text)}</p>`;

function commandButton({ type, target = '', label, tone = 'ghost', pendingLabel, d }) {
  const waiting = d.hasPending(type, target || null);
  return `<button class="btn btn--${tone}" data-action="command" data-type="${type}" data-target="${esc(target)}"${waiting ? ' disabled' : ''}>${esc(waiting ? (pendingLabel ?? 'Demande envoyée — en attente du checkpoint') : label)}</button>`;
}

function decisionCard(decision, d) {
  const open = decision.status === 'awaiting';
  const actions = open ? `<div class="card__actions">
      ${commandButton({ type: 'decision.approve', target: decision.id, label: 'Valider', tone: 'primary', d })}
      ${commandButton({ type: 'decision.improve', target: decision.id, label: 'Demander une amélioration', d })}
      ${commandButton({ type: 'decision.reject', target: decision.id, label: 'Refuser', tone: 'danger', d })}
    </div>` : '';
  const verdict = decision.decidedAt ? `<p class="card__meta">Décision du ${when(decision.decidedAt)}${decision.decidedVia === 'conversation' ? ' (donnée dans la conversation)' : ''}${decision.decisionNote ? ` — ${esc(decision.decisionNote)}` : ''}</p>` : '';
  return `<article class="card card--decision">
    <header class="card__head"><span class="card__id">${esc(decision.id)}</span>${pill(DECISION_STATUS[decision.status], decision.status)}</header>
    <h3 class="card__title">${esc(decision.title)}</h3>
    ${decision.detail ? `<p class="card__text">${esc(decision.detail)}</p>` : ''}
    <p class="card__meta">Présentée par ${esc(agentLabel(d, decision.agent))} le ${when(decision.createdAt)}</p>
    ${verdict}${actions}
  </article>`;
}

function issueCard(issue, d) {
  return `<article class="card card--issue card--${esc(issue.severity)}">
    <header class="card__head"><span class="card__id">${esc(issue.id)}</span>${pill(issue.severity, issue.severity)}${pill(issue.status === 'open' ? 'Ouvert' : 'Résolu', issue.status === 'open' ? 'blocked' : 'done')}</header>
    <h3 class="card__title">${esc(issue.title)}</h3>
    ${issue.detail ? `<p class="card__text">${esc(issue.detail)}</p>` : ''}
    <p class="card__meta">Signalé par ${esc(agentLabel(d, issue.agent))} le ${when(issue.openedAt)}</p>
    ${issue.resolution ? `<p class="card__meta">Résolution (${when(issue.resolvedAt)}) : ${esc(issue.resolution)}</p>` : ''}
  </article>`;
}

function eventRows(events, d) {
  if (!events.length) return empty('Aucune opération enregistrée.');
  return `<ol class="log">${events.map((event) => `<li class="log__row">
      <time class="log__time" datetime="${esc(event.ts)}">${when(event.ts)}</time>
      <span class="log__agent">${esc(event.agent)}</span>
      <span class="log__kind log__kind--${esc(event.kind)}">${esc(event.kind)}</span>
      <span class="log__text">${esc(event.message)}</span>
    </li>`).join('')}</ol>`;
}

function reportList(reports, limit) {
  if (!reports.length) return empty('Aucun rapport déposé pour le moment.');
  return `<ul class="rows">${reports.slice(0, limit).map((report) => `<li>
      <button class="link" data-action="open-report" data-path="${esc(report.path)}">${esc(report.path)}</button>
      <span class="rows__meta">${when(report.modifiedAt)} · ${Math.max(1, Math.round(report.size / 1024))} Ko</span>
    </li>`).join('')}</ul>`;
}

function commandList(commands, types, d) {
  if (!commands.length) return empty("Vous n'avez encore envoyé aucune demande.");
  return `<ul class="rows rows--stack">${commands.map((command) => `<li>
      <div><strong>${esc(types[command.type]?.label ?? command.type)}</strong>${command.target ? ` — ${esc(d.agents.has(command.target) ? agentLabel(d, command.target) : command.target)}` : ''}
        ${command.ack ? pill(ACK_RESULT[command.ack.result] ?? command.ack.result, command.ack.result === 'declined' ? 'blocked' : 'done') : pill('En attente du checkpoint', 'pending')}</div>
      ${command.note ? `<p class="card__text">« ${esc(command.note)} »</p>` : ''}
      <p class="rows__meta">Envoyée le ${when(command.ts)}${command.ack ? ` · réponse de l'orchestrateur (${when(command.ack.ts)}) : ${esc(command.ack.note)}` : ''}</p>
    </li>`).join('')}</ul>`;
}

/* ---------- Vues ---------- */

const views = {
  overview(snapshot, d) {
    const { state, plan } = snapshot;
    const tiles = [
      ['Tâches terminées', `${d.totals.done} / ${d.totals.all}`, "Chaque clôture porte une note de vérification rédigée par l'orchestrateur"],
      ['Tâches en cours', d.totals.in_progress, ''],
      ['Tâches en attente', d.totals.pending, ''],
      ['Tâches bloquées', d.totals.blocked, ''],
      ['Problèmes ouverts', d.openIssues.length, ''],
      ['Décisions attendues', d.awaiting.length, 'Validations et propositions en attente de votre réponse'],
      ['Exécutions de sous-agents', state.runs.length, `${d.runningRuns.length} en cours · 3 simultanées au maximum`],
    ];
    const phases = plan.phases.map((phase) => {
      const tasks = d.tasks.filter((task) => task.phase === phase.id);
      const done = tasks.filter((task) => task.status === 'done').length;
      const current = state.project.phase === phase.id;
      return `<li class="phase${current ? ' phase--current' : ''}">
        <span class="phase__letter">${esc(phase.id)}</span>
        <div class="phase__body">
          <p class="phase__title">${esc(phase.title)}${current ? ' <span class="phase__now">phase en cours</span>' : ''}</p>
          <p class="phase__summary">${esc(phase.summary)}</p>
          <div class="segments" role="img" aria-label="${done} tâches terminées sur ${tasks.length}">${tasks.map((task) => `<span class="segment segment--${task.status}" title="${esc(task.id)} — ${esc(TASK_STATUS[task.status])}"></span>`).join('')}</div>
        </div>
        <span class="phase__count">${done} / ${tasks.length}</span>
      </li>`;
    }).join('');
    const running = [
      ...d.runningRuns.map((run) => `<li><strong>${esc(agentLabel(d, run.agent))}</strong> — sous-agent lancé, consigné à ${when(run.startedAt)}<span class="rows__meta">${esc(run.label)}</span></li>`),
      ...d.tasks.filter((task) => task.status === 'in_progress').map((task) => `<li><strong>${esc(task.id)}</strong> — ${esc(task.title)}<span class="rows__meta">${esc(agentLabel(d, task.agent))} · consignée en cours à ${when(task.startedAt)}</span></li>`),
    ];
    return `
      <section class="tiles" aria-label="État général">${tiles.map(([label, value, hint]) => `<div class="tile"><p class="tile__value">${esc(value)}</p><p class="tile__label">${esc(label)}</p>${hint ? `<p class="tile__hint">${esc(hint)}</p>` : ''}</div>`).join('')}</section>
      <section class="panel"><h2 class="panel__title">Progression par phase</h2>
        <p class="panel__lead">Un segment par tâche réellement inscrite au plan. Les phases D à J seront découpées en tâches à leur lancement.</p>
        <ol class="phases">${phases}</ol></section>
      <div class="split">
        <section class="panel"><h2 class="panel__title">Opérations en cours</h2>${running.length ? `<ul class="rows rows--stack">${running.join('')}</ul>` : empty('Aucune opération en cours.')}</section>
        <section class="panel"><h2 class="panel__title">Validations attendues</h2>${d.awaiting.length ? d.awaiting.map((decision) => decisionCard(decision, d)).join('') : empty('Aucune décision en attente.')}</section>
      </div>
      <div class="split">
        <section class="panel"><h2 class="panel__title">Dernières opérations</h2>${eventRows(snapshot.events.slice(0, 12), d)}<p class="panel__more"><a href="#/journal">Tout l'historique</a></p></section>
        <section class="panel"><h2 class="panel__title">Derniers rapports</h2>${reportList(snapshot.reports, 6)}<p class="panel__more"><a href="#/rapports">Tous les rapports</a></p></section>
      </div>`;
  },

  agents(snapshot, d) {
    const cards = snapshot.registry.agents.map((agent) => {
      const live = snapshot.state.agents[agent.id];
      const tasks = d.tasksOf(agent.id);
      const runs = d.runsOf(agent.id);
      const currentTask = tasks.find((task) => task.status === 'in_progress');
      return `<li><button class="agent agent--${live.status}" data-action="open-agent" data-agent="${agent.id}">
        <span class="agent__num">${agent.id}</span>
        <span class="agent__name">${esc(agent.name)}</span>
        <span class="agent__role">${esc(agent.role)}</span>
        ${pill(agentStatusLabel(agent.id, live.status), live.status)}
        <span class="agent__task">${currentTask ? `${esc(currentTask.id)} — ${esc(currentTask.title)}` : 'Aucune tâche en cours'}</span>
        <span class="agent__counts">${tasks.filter((task) => task.status === 'done').length} terminée(s) · ${tasks.filter((task) => task.status === 'in_progress').length} en cours · ${tasks.filter((task) => task.status === 'pending').length} en attente</span>
        <span class="agent__runs">${agent.id === '01' ? 'Session principale' : plural(runs.length, 'exécution réelle', 'exécutions réelles')}</span>
      </button></li>`;
    }).join('');
    return `<section class="panel"><h2 class="panel__title">Les 14 agents</h2>
      <p class="panel__lead">${esc(snapshot.registry.executionModel.subagents)}</p>
      <ul class="agents">${cards}</ul></section>`;
  },

  tasks(snapshot, d) {
    return snapshot.plan.phases.map((phase) => {
      const tasks = d.tasks.filter((task) => task.phase === phase.id);
      return `<section class="panel"><h2 class="panel__title">Phase ${esc(phase.id)} — ${esc(phase.title)}</h2>
        <div class="table-wrap"><table class="table"><thead><tr><th>Tâche</th><th>Agent</th><th>État</th><th>Dépend de</th><th>Livrable et vérification</th></tr></thead><tbody>
        ${tasks.map((task) => `<tr>
          <td><strong>${esc(task.id)}</strong> ${esc(task.title)}</td>
          <td><button class="link" data-action="open-agent" data-agent="${esc(task.agent)}">${esc(agentLabel(d, task.agent))}</button></td>
          <td>${taskPill(task.status)}</td>
          <td>${task.dependsOn.length ? esc(task.dependsOn.join(', ')) : '—'}</td>
          <td><code>${esc(task.deliverable || '—')}</code>${task.verification ? `<span class="rows__meta">Vérification : ${esc(task.verification)}</span>` : ''}${task.blockedReason ? `<span class="rows__meta">Blocage : ${esc(task.blockedReason)}</span>` : ''}</td>
        </tr>`).join('')}</tbody></table></div></section>`;
    }).join('');
  },

  decisions(snapshot, d) {
    const of = (kind) => snapshot.state.decisions.filter((decision) => decision.kind === kind).reverse();
    const validations = of('validation');
    const proposals = of('proposal');
    const requests = snapshot.state.control.requests;
    return `
      <div class="split">
        <section class="panel"><h2 class="panel__title">Validations nécessaires</h2>${validations.length ? validations.map((decision) => decisionCard(decision, d)).join('') : empty('Aucune validation demandée.')}</section>
        <section class="panel"><h2 class="panel__title">Propositions d'amélioration</h2>${proposals.length ? proposals.map((decision) => decisionCard(decision, d)).join('') : empty("Aucune proposition déposée par les agents.")}</section>
      </div>
      <section class="panel"><h2 class="panel__title">Demandes adressées aux agents</h2>
        ${requests.length ? `<ul class="rows rows--stack">${requests.map((request) => `<li><div><strong>${esc(agentLabel(d, request.agent))}</strong> — ${esc(snapshot.commandTypes[request.type]?.label ?? request.type)} ${pill(request.status === 'open' ? 'À traiter' : 'Traitée', request.status === 'open' ? 'pending' : 'done')}</div><p class="card__text">« ${esc(request.note)} »</p>${request.outcome ? `<p class="rows__meta">Suite donnée (${when(request.doneAt)}) : ${esc(request.outcome)}</p>` : ''}</li>`).join('')}</ul>` : empty('Aucune demande de réévaluation ou d\'amélioration.')}</section>
      <section class="panel"><h2 class="panel__title">Vos demandes et leur prise en compte</h2>${commandList(snapshot.commands, snapshot.commandTypes, d)}</section>`;
  },

  issues(snapshot, d) {
    const issues = [...snapshot.state.issues].reverse();
    const open = issues.filter((issue) => issue.status === 'open');
    const resolved = issues.filter((issue) => issue.status !== 'open');
    return `<section class="panel"><h2 class="panel__title">Problèmes ouverts</h2>${open.length ? open.map((issue) => issueCard(issue, d)).join('') : empty('Aucun problème ouvert.')}</section>
      <section class="panel"><h2 class="panel__title">Problèmes résolus</h2>${resolved.length ? resolved.map((issue) => issueCard(issue, d)).join('') : empty('Aucun problème résolu pour le moment.')}</section>`;
  },

  reports(snapshot) {
    return `<section class="panel"><h2 class="panel__title">Rapports</h2><p class="panel__lead">Fichiers présents dans le dossier <code>reports/</code> du projet.</p>${reportList(snapshot.reports, Infinity)}</section>`;
  },

  journal(snapshot, d) {
    const kinds = [...new Set(snapshot.events.map((event) => event.kind))].sort();
    const events = snapshot.events.filter((event) => (!ui.journalAgent || event.agent === ui.journalAgent) && (!ui.journalKind || event.kind === ui.journalKind));
    const option = (value, label, current) => `<option value="${esc(value)}"${value === current ? ' selected' : ''}>${esc(label)}</option>`;
    return `<section class="panel"><h2 class="panel__title">Historique des opérations</h2>
      <p class="panel__lead">${plural(snapshot.eventCount, 'opération enregistrée', 'opérations enregistrées')} dans <code>command-center/events/events.jsonl</code>. Les heures sont celles où l'orchestrateur a consigné l'opération : elles ne mesurent pas la durée du travail${snapshot.eventCount > snapshot.events.length ? ` — les ${snapshot.events.length} plus récentes sont affichées` : ''}.</p>
      <div class="filters">
        <label class="field field--inline"><span>Agent</span><select id="journal-agent">${option('', 'Tous', ui.journalAgent)}${snapshot.registry.agents.map((agent) => option(agent.id, `${agent.id} · ${agent.name}`, ui.journalAgent)).join('')}</select></label>
        <label class="field field--inline"><span>Type</span><select id="journal-kind">${option('', 'Tous', ui.journalKind)}${kinds.map((kind) => option(kind, kind, ui.journalKind)).join('')}</select></label>
      </div>
      ${eventRows(events, d)}</section>`;
  },
};

/* ---------- Fiche d'un agent ---------- */

function renderAgentDialog(snapshot, d) {
  const agent = d.agents.get(ui.openAgent);
  if (!agent) return;
  const live = snapshot.state.agents[agent.id];
  const tasks = d.tasksOf(agent.id);
  const runs = d.runsOf(agent.id).reverse();
  const paused = snapshot.state.control.pausedAgents.includes(agent.id);
  const requests = snapshot.state.control.requests.filter((request) => request.agent === agent.id && request.status === 'open');
  const list = (items) => `<ul class="bullets">${items.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>`;
  const names = (ids) => (ids.length ? ids.map((id) => `<button class="link" data-action="open-agent" data-agent="${esc(id)}">${esc(agentLabel(d, id))}</button>`).join(', ') : 'Aucune');
  const controls = agent.id === '01'
    ? '<p class="sheet__help">L\'orchestrateur se pilote avec les commandes globales (pause du projet, suspension des nouvelles tâches).</p>'
    : `<div class="card__actions">
        ${paused ? commandButton({ type: 'agent.resume', target: agent.id, label: 'Lever la pause', d }) : commandButton({ type: 'agent.pause', target: agent.id, label: 'Demander une pause', d })}
        ${commandButton({ type: 'agent.reevaluate', target: agent.id, label: 'Demander une réévaluation', d })}
        ${commandButton({ type: 'agent.improve', target: agent.id, label: 'Demander une amélioration', d })}
      </div>
      <p class="sheet__help">${esc(snapshot.registry.executionModel.control)}</p>`;
  $('agent-dialog').innerHTML = `
    <header class="sheet__head">
      <div><p class="sheet__over">Agent ${agent.id} · ${esc(agent.role)} · ${esc(agent.executor)}</p><h2 class="sheet__title" id="agent-dialog-title">${esc(agent.name)}</h2></div>
      <button class="btn btn--ghost" data-action="close-dialog" data-dialog="agent-dialog">Fermer</button>
    </header>
    <p>${pill(agentStatusLabel(agent.id, live.status), live.status)} <span class="rows__meta">Dernière exécution : ${when(live.lastRunAt)}</span></p>
    <h3 class="sheet__h">Mission</h3><p>${esc(agent.mission)}</p>
    <h3 class="sheet__h">Objectifs mesurables</h3>${list(agent.objectives)}
    <h3 class="sheet__h">Livrables</h3>${list(agent.deliverables)}
    <h3 class="sheet__h">Périmètre de fichiers</h3><ul class="bullets bullets--code">${agent.scope.map((glob) => `<li><code>${esc(glob)}</code></li>`).join('')}</ul>
    <div class="sheet__cols">
      <div><h3 class="sheet__h">Dépend de</h3><p>${names(agent.dependsOn)}</p></div>
      <div><h3 class="sheet__h">Contrôlé par</h3><p>${names(agent.validatedBy)}</p></div>
    </div>
    <h3 class="sheet__h">Remontée des problèmes</h3><p>${esc(agent.escalation)}</p>
    <h3 class="sheet__h">Tâches</h3>
    ${tasks.length ? `<ul class="rows rows--stack">${tasks.map((task) => `<li><div><strong>${esc(task.id)}</strong> ${esc(task.title)} ${taskPill(task.status)}</div>${task.verification ? `<p class="rows__meta">Vérification : ${esc(task.verification)}</p>` : ''}</li>`).join('')}</ul>` : empty('Aucune tâche inscrite au plan pour cet agent.')}
    <h3 class="sheet__h">Exécutions et rapports</h3>
    ${runs.length ? `<ul class="rows rows--stack">${runs.map((run) => `<li><div><strong>${esc(run.id)}</strong> ${esc(run.label)} ${pill(run.endedAt ? RUN_OUTCOME[run.outcome] : 'En cours', run.endedAt ? (run.outcome === 'ok' ? 'done' : 'blocked') : 'in_progress')}</div>
        <p class="rows__meta">Lancement consigné à ${when(run.startedAt)} · fin consignée à ${when(run.endedAt)}</p>
        ${run.summary ? `<p class="card__text">${esc(run.summary)}</p>` : ''}
        ${run.report ? `<button class="link" data-action="open-report" data-path="${esc(run.report.replace(/^reports\//, ''))}">${esc(run.report)}</button>` : ''}</li>`).join('')}</ul>` : empty(agent.id === '01' ? "L'orchestrateur est la session principale : son activité figure dans l'historique." : "Cet agent n'a encore jamais été exécuté.")}
    ${requests.length ? `<h3 class="sheet__h">Demandes à traiter</h3><ul class="rows rows--stack">${requests.map((request) => `<li><strong>${esc(snapshot.commandTypes[request.type]?.label)}</strong><p class="card__text">« ${esc(request.note)} »</p></li>`).join('')}</ul>` : ''}
    <h3 class="sheet__h">Contrôle</h3>${controls}`;
}

/* ---------- Rapports (rendu Markdown minimal, entièrement échappé) ---------- */

function inlineMd(text) {
  return esc(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1 <span class="rows__meta">($2)</span>');
}

function markdown(source) {
  const out = [];
  let list = null;
  let table = null;
  let code = null;
  const flush = () => {
    if (list) out.push(`<${list.tag}>${list.items.map((item) => `<li>${item}</li>`).join('')}</${list.tag}>`);
    if (table) out.push(`<div class="table-wrap"><table class="table">${table.map((cells, index) => `<tr>${cells.map((cell) => (index === 0 ? `<th>${cell}</th>` : `<td>${cell}</td>`)).join('')}</tr>`).join('')}</table></div>`);
    list = null;
    table = null;
  };
  for (const line of source.split('\n')) {
    if (line.startsWith('```')) {
      if (code) { out.push(`<pre>${esc(code.join('\n'))}</pre>`); code = null; } else { flush(); code = []; }
      continue;
    }
    if (code) { code.push(line); continue; }
    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    const ordered = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (heading) { flush(); const level = Math.min(heading[1].length + 1, 5); out.push(`<h${level}>${inlineMd(heading[2])}</h${level}>`); }
    else if (line.trim().startsWith('|')) {
      if (list) flush();
      const cells = line.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim());
      if (cells.every((cell) => /^:?-{2,}:?$/.test(cell))) continue;
      (table ??= []).push(cells.map(inlineMd));
    } else if (bullet || ordered) {
      const tag = bullet ? 'ul' : 'ol';
      if (table || (list && list.tag !== tag)) flush();
      (list ??= { tag, items: [] }).items.push(inlineMd((bullet ?? ordered)[1]));
    } else if (!line.trim()) flush();
    else { flush(); out.push(`<p>${inlineMd(line)}</p>`); }
  }
  flush();
  if (code) out.push(`<pre>${esc(code.join('\n'))}</pre>`);
  return out.join('');
}

async function openReport(path) {
  const dialog = $('report-dialog');
  const head = `<header class="sheet__head"><div><p class="sheet__over">Rapport</p><h2 class="sheet__title" id="report-dialog-title">${esc(path)}</h2></div><button class="btn btn--ghost" data-action="close-dialog" data-dialog="report-dialog">Fermer</button></header>`;
  dialog.innerHTML = `${head}<p class="empty">Chargement…</p>`;
  if (!dialog.open) dialog.showModal();
  try {
    const response = await fetch(`/api/report?path=${encodeURIComponent(path)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    dialog.innerHTML = `${head}<div class="prose">${markdown(data.content)}</div>`;
  } catch (error) {
    dialog.innerHTML = `${head}<p class="field__error">Impossible d'ouvrir ce rapport : ${esc(error.message)}</p>`;
  }
}

/* ---------- En-tête ---------- */

function renderTop(snapshot, d) {
  const { state } = snapshot;
  const phase = snapshot.plan.phases.find((item) => item.id === state.project.phase);
  const lastSign = snapshot.events[0]?.ts ?? state.session.since;
  const silent = state.session.active && Date.now() - new Date(lastSign).getTime() > SILENCE_MS;
  $('top-status').innerHTML = `
    ${pill(state.control.paused ? 'Projet en pause' : 'Projet en cours', state.control.paused ? 'paused' : 'running')}
    ${state.control.newTasksSuspended ? pill('Nouvelles tâches suspendues', 'paused') : ''}
    <span class="top__item">Phase ${esc(phase?.id)} — ${esc(phase?.title)}</span>
    <span class="top__item">${state.session.active ? (silent ? `Orchestrateur : activité non confirmée depuis ${when(lastSign)}` : 'Orchestrateur en session') : 'Orchestrateur hors session'}${silent ? '' : ` depuis ${when(state.session.since)}`}</span>
    <span class="top__item">Dernier checkpoint : ${when(state.checkpoint.last)}</span>`;
  $('global-controls').innerHTML = `
    ${state.control.paused
      ? commandButton({ type: 'project.resume', label: 'Reprendre le projet', tone: 'primary', pendingLabel: 'Reprise demandée', d })
      : commandButton({ type: 'project.pause', label: 'Mettre le projet en pause', tone: 'danger', pendingLabel: 'Pause demandée', d })}
    ${state.control.newTasksSuspended
      ? commandButton({ type: 'tasks.resume', label: 'Autoriser les nouvelles tâches', pendingLabel: 'Autorisation demandée', d })
      : commandButton({ type: 'tasks.suspend', label: 'Suspendre les nouvelles tâches', pendingLabel: 'Suspension demandée', d })}`;

  const messages = [];
  if (snapshot.stale) messages.push("L'état du projet était en cours de réécriture : la dernière version lisible est affichée.");
  if (silent) messages.push("Aucune opération consignée depuis plus de 30 minutes : la session de l'orchestrateur est peut-être interrompue. Les états « en session » et « en mission » ne sont pas confirmés.");
  if (ui.offline) messages.push('Le serveur du Command Center ne répond plus : les informations affichées peuvent être dépassées.');
  if (ui.flash) messages.push(ui.flash);
  if (d.pendingCommands.length) messages.push(`${plural(d.pendingCommands.length, 'demande attend', 'demandes attendent')} le prochain checkpoint de l'orchestrateur.`);
  if (!state.session.active) messages.push("L'orchestrateur est hors session : vos demandes sont enregistrées et seront lues dès la reprise (dites « reprends » dans la conversation).");
  $('notice').textContent = messages.join(' ');
  $('notice').hidden = messages.length === 0;
  $('foot-sync').textContent = `État lu le ${when(snapshot.generatedAt)} — dossier ${snapshot.projectDir}`;
}

/* ---------- Rendu, navigation, actions ---------- */

const currentView = () => VIEWS[location.hash.replace(/^#\/?/, '')] ?? 'overview';

function render() {
  const { snapshot } = ui;
  if (!snapshot) return;
  if (!snapshot.state || !snapshot.registry || !snapshot.plan) {
    view.innerHTML = '<section class="panel"><p class="field__error">Les fichiers d\'orchestration sont introuvables ou illisibles (registry.json, plan.json, state.json).</p></section>';
    return;
  }
  const d = derive(snapshot);
  const name = currentView();
  document.querySelectorAll('.tabs a').forEach((link) => {
    const active = link.dataset.view === name;
    link.classList.toggle('is-active', active);
    if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  });
  renderTop(snapshot, d);
  view.innerHTML = views[name](snapshot, d);
  if ($('agent-dialog').open) renderAgentDialog(snapshot, d);
}

async function refresh(force = false) {
  try {
    const response = await fetch('/api/state', { cache: 'no-store' });
    if (!response.ok) throw new Error(String(response.status));
    const snapshot = await response.json();
    const signature = JSON.stringify({ ...snapshot, generatedAt: null });
    const changed = signature !== ui.signature || ui.offline;
    ui.snapshot = snapshot;
    ui.signature = signature;
    ui.offline = false;
    if (changed || force) render();
    else $('foot-sync').textContent = `État lu le ${when(snapshot.generatedAt)} — dossier ${snapshot.projectDir}`;
  } catch {
    if (!ui.offline) { ui.offline = true; render(); }
  }
}

async function sendCommand(type, target, note = '') {
  const response = await fetch('/api/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, target: target || null, note }) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? 'Demande refusée.');
  ui.flash = 'Demande enregistrée.';
  setTimeout(() => { ui.flash = ''; render(); }, 6000);
  await refresh(true);
}

function askNote(type, target) {
  const prompt = NOTE_PROMPTS[type];
  const dialog = $('note-dialog');
  $('note-title').textContent = prompt.title;
  $('note-help').textContent = prompt.help;
  $('note-label').textContent = prompt.required ? 'Motif (obligatoire)' : 'Remarque (facultative)';
  $('note-input').value = '';
  $('note-input').required = prompt.required;
  $('note-error').textContent = '';
  dialog.dataset.type = type;
  dialog.dataset.target = target;
  dialog.showModal();
  $('note-input').focus();
}

document.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-action]');
  if (!trigger) return;
  const { action } = trigger.dataset;
  if (action === 'command') {
    const { type, target } = trigger.dataset;
    if (NOTE_PROMPTS[type]) askNote(type, target);
    else sendCommand(type, target).catch((error) => { ui.flash = `Demande refusée : ${error.message}`; render(); });
  } else if (action === 'open-agent') {
    ui.openAgent = trigger.dataset.agent;
    renderAgentDialog(ui.snapshot, derive(ui.snapshot));
    const dialog = $('agent-dialog');
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
  } else if (action === 'open-report') {
    openReport(trigger.dataset.path);
  } else if (action === 'close-dialog') {
    $(trigger.dataset.dialog).close();
  }
});

$('note-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const dialog = $('note-dialog');
  const note = $('note-input').value.trim();
  if ($('note-input').required && !note) { $('note-error').textContent = 'Merci de préciser le motif.'; return; }
  try {
    await sendCommand(dialog.dataset.type, dialog.dataset.target, note);
    dialog.close();
  } catch (error) {
    $('note-error').textContent = error.message;
  }
});
$('note-cancel').addEventListener('click', () => $('note-dialog').close());

document.addEventListener('change', (event) => {
  if (event.target.id === 'journal-agent') { ui.journalAgent = event.target.value; render(); $('journal-agent')?.focus(); }
  if (event.target.id === 'journal-kind') { ui.journalKind = event.target.value; render(); $('journal-kind')?.focus(); }
});

// Clic sur le fond d'une fenêtre : fermeture.
document.querySelectorAll('dialog').forEach((dialog) => dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); }));

window.addEventListener('hashchange', () => { render(); view.focus({ preventScroll: true }); window.scrollTo(0, 0); });

refresh(true);
setInterval(refresh, POLL_MS);

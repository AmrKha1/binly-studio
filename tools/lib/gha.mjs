// GitHub Actions helpers shared by tools/cloud.mjs and tools/watch.mjs: start a workflow run, wait for it.
import {gh, sh, sleep, token} from './sys.mjs';

/** Start a workflow_dispatch run and return its run id (found by a unique token in the run name). */
export async function dispatch(workflow, fields) {
  const tok = token();
  gh('workflow', 'run', workflow, ...Object.entries({...fields, token: tok}).flatMap(([k, v]) => ['-f', `${k}=${v}`]));
  for (let i = 0; i < 40; i++) {
    await sleep(3000);
    const runs = JSON.parse(gh('run', 'list', '--workflow', workflow, '--limit', '15', '--json', 'databaseId,displayTitle'));
    const r = runs.find((x) => x.displayTitle.includes(tok));
    if (r) return r.databaseId;
  }
  throw new Error('workflow run did not appear');
}

/** Wait for a run to finish; prints progress, throws with the failed log tail on failure. */
export async function wait(id, label) {
  const t0 = Date.now();
  let last = '';
  for (;;) {
    const r = JSON.parse(gh('run', 'view', String(id), '--json', 'status,conclusion,jobs'));
    const done = (r.jobs ?? []).filter((j) => j.status === 'completed').length;
    const line = `${r.status}${r.conclusion ? ' / ' + r.conclusion : ''} · jobs ${done}/${(r.jobs ?? []).length}`;
    if (line !== last) {
      console.log(`[${((Date.now() - t0) / 60000).toFixed(1)} min] ${label}: ${line}`);
      last = line;
    }
    if (r.status === 'completed') {
      if (r.conclusion !== 'success') {
        const logs = sh('gh', ['run', 'view', String(id), '--log-failed'], {allowFail: true}) ?? '';
        // strip the "job<TAB>step<TAB>timestamp " prefix and setup noise; show only the end of the failure
        const clean = logs
          .split('\n')
          .map((l) => l.replace(/^[^\t]*\t[^\t]*\t\S+Z ?/, ''))
          .filter((l) => l.trim() && !/^(##\[(end)?group\]|\s*[A-Za-z0-9_]+(_ROOT_DIR|_PATH)?:\s)/.test(l));
        console.log('---- failed log (tail) ----\n' + clean.slice(-25).join('\n'));
        throw new Error(`${label} failed (run ${id})`);
      }
      return;
    }
    await sleep(20000);
  }
}

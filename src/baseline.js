import fs from 'node:fs';
import path from 'node:path';

export function saveBaseline(summary, baselinePath) {
  fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
  fs.writeFileSync(baselinePath, JSON.stringify(summary, null, 2));
}

export function loadBaseline(baselinePath) {
  if (!fs.existsSync(baselinePath)) return null;
  return JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
}

/**
 * Compare a fresh run against a stored baseline. Flags cases that flipped
 * from pass -> fail (regressions) or fail -> pass (improvements), and cases
 * whose output text changed even if pass/fail status stayed the same.
 */
export function diffAgainstBaseline(current, baseline) {
  if (!baseline) return null;

  const baselineByName = new Map(baseline.results.map((r) => [r.name, r]));
  const regressions = [];
  const improvements = [];
  const changed = [];

  for (const r of current.results) {
    const prev = baselineByName.get(r.name);
    if (!prev) continue;
    if (prev.pass && !r.pass) regressions.push({ name: r.name, prev, current: r });
    if (!prev.pass && r.pass) improvements.push({ name: r.name, prev, current: r });
    if (prev.pass === r.pass && prev.output !== r.output) {
      changed.push({ name: r.name, prev, current: r });
    }
  }

  return { regressions, improvements, changed };
}

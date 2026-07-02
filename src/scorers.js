/**
 * Built-in scorers. Each scorer takes (output, expectValue) and returns
 * { pass: boolean, reason: string }
 */

function normalize(str) {
  return String(str ?? '').trim();
}

export const scorers = {
  exact(output, expected) {
    const pass = normalize(output) === normalize(expected);
    return { pass, reason: pass ? 'exact match' : `expected exact match with "${expected}"` };
  },

  contains(output, expected) {
    const pass = normalize(output).toLowerCase().includes(normalize(expected).toLowerCase());
    return { pass, reason: pass ? 'contains expected substring' : `output did not contain "${expected}"` };
  },

  not_contains(output, expected) {
    const pass = !normalize(output).toLowerCase().includes(normalize(expected).toLowerCase());
    return { pass, reason: pass ? 'excluded substring absent' : `output unexpectedly contained "${expected}"` };
  },

  regex(output, pattern) {
    const re = new RegExp(pattern, 'i');
    const pass = re.test(normalize(output));
    return { pass, reason: pass ? 'matched pattern' : `output did not match /${pattern}/` };
  },

  min_length(output, n) {
    const len = normalize(output).length;
    const pass = len >= n;
    return { pass, reason: pass ? `length ${len} >= ${n}` : `length ${len} < required ${n}` };
  },

  max_length(output, n) {
    const len = normalize(output).length;
    const pass = len <= n;
    return { pass, reason: pass ? `length ${len} <= ${n}` : `length ${len} > allowed ${n}` };
  },

  json_valid(output) {
    try {
      JSON.parse(normalize(output));
      return { pass: true, reason: 'valid JSON' };
    } catch (e) {
      return { pass: false, reason: `invalid JSON: ${e.message}` };
    }
  },
};

/**
 * Run all expectation checks defined on a test case against the model output.
 */
export async function scoreOutput(output, expect, customScorers = {}) {
  const results = [];
  for (const [key, value] of Object.entries(expect || {})) {
    const scorer = scorers[key] || customScorers[key];
    if (!scorer) {
      results.push({ scorer: key, pass: false, reason: `unknown scorer "${key}"` });
      continue;
    }
    const result = await scorer(output, value);
    results.push({ scorer: key, ...result });
  }
  const pass = results.every((r) => r.pass);
  return { pass, checks: results };
}

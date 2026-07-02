import fs from 'node:fs';
import path from 'node:path';
import * as yaml from 'js-yaml';
import { getProvider } from './adapters/index.js';
import { scoreOutput } from './scorers.js';

/**
 * Load and parse a suite YAML/JSON file.
 */
export function loadSuite(suitePath) {
  const raw = fs.readFileSync(suitePath, 'utf8');
  const suite = suitePath.endsWith('.json') ? JSON.parse(raw) : yaml.load(raw);
  if (!suite || !Array.isArray(suite.cases)) {
    throw new Error(`Suite file "${suitePath}" must define a top-level "cases" array.`);
  }
  return suite;
}

/**
 * Load custom scorer functions referenced by the suite (JS files exporting
 * named functions). Path is resolved relative to the suite file.
 */
async function loadCustomScorers(suite, suitePath) {
  if (!suite.customScorers) return {};
  const dir = path.dirname(path.resolve(suitePath));
  const modulePath = path.resolve(dir, suite.customScorers);
  const mod = await import(`file://${modulePath}`);
  return mod.default || mod;
}

/**
 * Run every case in a suite against the configured provider/model.
 * Returns a results object suitable for reporting or baseline comparison.
 */
export async function runSuite(suitePath, overrides = {}) {
  const suite = loadSuite(suitePath);
  const provider = overrides.provider || suite.provider || 'anthropic';
  const model = overrides.model || suite.model;
  const call = getProvider(provider);
  const customScorers = await loadCustomScorers(suite, suitePath);

  const results = [];
  for (const testCase of suite.cases) {
    const start = Date.now();
    let output = '';
    let error = null;
    try {
      const res = await call({
        model,
        system: suite.system,
        prompt: testCase.prompt,
        maxTokens: testCase.maxTokens || suite.maxTokens,
        temperature: testCase.temperature ?? suite.temperature,
      });
      output = res.text;
    } catch (e) {
      error = e.message;
    }
    const durationMs = Date.now() - start;

    let score = { pass: false, checks: [] };
    if (!error) {
      score = await scoreOutput(output, testCase.expect, customScorers);
    }

    results.push({
      name: testCase.name || testCase.prompt.slice(0, 40),
      prompt: testCase.prompt,
      output,
      error,
      pass: error ? false : score.pass,
      checks: score.checks,
      durationMs,
    });
  }

  const summary = {
    suite: suite.name || path.basename(suitePath),
    provider,
    model,
    total: results.length,
    passed: results.filter((r) => r.pass).length,
    failed: results.filter((r) => !r.pass).length,
    timestamp: new Date().toISOString(),
    results,
  };

  return summary;
}

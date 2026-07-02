import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diffAgainstBaseline } from '../src/baseline.js';

function makeResult(name, pass, output = 'x') {
  return { name, pass, output, checks: [] };
}

test('detects a regression (pass -> fail)', () => {
  const baseline = { results: [makeResult('case A', true)] };
  const current = { results: [makeResult('case A', false)] };
  const diff = diffAgainstBaseline(current, baseline);
  assert.equal(diff.regressions.length, 1);
  assert.equal(diff.regressions[0].name, 'case A');
});

test('detects an improvement (fail -> pass)', () => {
  const baseline = { results: [makeResult('case A', false)] };
  const current = { results: [makeResult('case A', true)] };
  const diff = diffAgainstBaseline(current, baseline);
  assert.equal(diff.improvements.length, 1);
});

test('detects output change with same pass status', () => {
  const baseline = { results: [makeResult('case A', true, 'old output')] };
  const current = { results: [makeResult('case A', true, 'new output')] };
  const diff = diffAgainstBaseline(current, baseline);
  assert.equal(diff.changed.length, 1);
});

test('returns null when no baseline exists', () => {
  const current = { results: [makeResult('case A', true)] };
  assert.equal(diffAgainstBaseline(current, null), null);
});

test('ignores cases not present in baseline', () => {
  const baseline = { results: [makeResult('case A', true)] };
  const current = { results: [makeResult('case B', false)] };
  const diff = diffAgainstBaseline(current, baseline);
  assert.equal(diff.regressions.length, 0);
  assert.equal(diff.improvements.length, 0);
  assert.equal(diff.changed.length, 0);
});

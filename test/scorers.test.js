import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreOutput } from '../src/scorers.js';

test('contains scorer passes on substring match', async () => {
  const result = await scoreOutput('hello world', { contains: 'world' });
  assert.equal(result.pass, true);
});

test('contains scorer fails when substring missing', async () => {
  const result = await scoreOutput('hello world', { contains: 'goodbye' });
  assert.equal(result.pass, false);
});

test('exact scorer trims whitespace before comparing', async () => {
  const result = await scoreOutput('  42  ', { exact: '42' });
  assert.equal(result.pass, true);
});

test('regex scorer matches pattern case-insensitively', async () => {
  const result = await scoreOutput('Order #12345 confirmed', { regex: 'order #\\d+' });
  assert.equal(result.pass, true);
});

test('min_length and max_length enforce bounds', async () => {
  const tooShort = await scoreOutput('hi', { min_length: 10 });
  assert.equal(tooShort.pass, false);

  const withinBounds = await scoreOutput('hello there', { min_length: 5, max_length: 20 });
  assert.equal(withinBounds.pass, true);
});

test('json_valid detects malformed JSON', async () => {
  const valid = await scoreOutput('{"a":1}', { json_valid: true });
  assert.equal(valid.pass, true);

  const invalid = await scoreOutput('{a:1}', { json_valid: true });
  assert.equal(invalid.pass, false);
});

test('multiple checks must all pass', async () => {
  const result = await scoreOutput('hello world', {
    contains: 'hello',
    min_length: 5,
    not_contains: 'xyz',
  });
  assert.equal(result.pass, true);
  assert.equal(result.checks.length, 3);
});

test('unknown scorer name reports failure instead of throwing', async () => {
  const result = await scoreOutput('anything', { made_up_scorer: 'x' });
  assert.equal(result.pass, false);
  assert.match(result.checks[0].reason, /unknown scorer/);
});

#!/usr/bin/env node
import { Command } from 'commander';
import path from 'node:path';
import fs from 'node:fs';
import { runSuite } from '../src/runner.js';
import { saveBaseline, loadBaseline, diffAgainstBaseline } from '../src/baseline.js';
import { printSummary, toJSON } from '../src/reporter.js';

const program = new Command();

program
  .name('promptlens')
  .description('Prompt regression testing & eval harness for LLM apps')
  .version('0.1.0');

program
  .command('run <suite>')
  .description('Run a test suite against a model provider')
  .option('-p, --provider <name>', 'override provider (anthropic|openai|mock)')
  .option('-m, --model <name>', 'override model name')
  .option('-b, --baseline <path>', 'baseline file to diff against')
  .option('-s, --save-baseline <path>', 'save this run as the new baseline')
  .option('--json', 'output raw JSON instead of console report')
  .option('--fail-on-regression', 'exit non-zero if any case regresses vs baseline', false)
  .action(async (suite, opts) => {
    try {
      const summary = await runSuite(suite, {
        provider: opts.provider,
        model: opts.model,
      });

      let diff = null;
      if (opts.baseline) {
        const baseline = loadBaseline(opts.baseline);
        diff = diffAgainstBaseline(summary, baseline);
      }

      if (opts.saveBaseline) {
        saveBaseline(summary, opts.saveBaseline);
      }

      if (opts.json) {
        console.log(toJSON(summary, diff));
      } else {
        printSummary(summary, diff);
        if (opts.saveBaseline) {
          console.log(`Baseline saved to ${opts.saveBaseline}`);
        }
      }

      const hasRegressions = diff && diff.regressions.length > 0;
      if (summary.failed > 0 || (opts.failOnRegression && hasRegressions)) {
        process.exit(1);
      }
    } catch (err) {
      console.error(`promptlens: ${err.message}`);
      process.exit(2);
    }
  });

program
  .command('init')
  .description('Scaffold a starter suite.yaml in the current directory')
  .action(() => {
    const target = path.resolve('suite.yaml');
    if (fs.existsSync(target)) {
      console.error('suite.yaml already exists here.');
      process.exit(1);
    }
    const template = `name: My Prompt Suite
provider: anthropic       # anthropic | openai | mock
model: claude-sonnet-4-6
system: "You are a concise, helpful assistant."

cases:
  - name: "greets politely"
    prompt: "Say hello to a new user named Smeet."
    expect:
      contains: "hello"

  - name: "basic math"
    prompt: "What is 12 + 30? Reply with just the number."
    expect:
      contains: "42"
`;
    fs.writeFileSync(target, template);
    console.log(`Created ${target}`);
    console.log('Run it with: promptlens run suite.yaml');
  });

program.parse();

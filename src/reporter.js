import chalk from 'chalk';

export function printSummary(summary, diff) {
  console.log('');
  console.log(chalk.bold(`PromptLens — ${summary.suite}`));
  console.log(chalk.dim(`provider: ${summary.provider}  model: ${summary.model || '(default)'}`));
  console.log('');

  for (const r of summary.results) {
    const icon = r.pass ? chalk.green('PASS') : chalk.red('FAIL');
    console.log(`${icon}  ${r.name}  ${chalk.dim(`(${r.durationMs}ms)`)}`);
    if (r.error) {
      console.log(chalk.red(`      error: ${r.error}`));
      continue;
    }
    for (const check of r.checks) {
      if (!check.pass) {
        console.log(chalk.red(`      ✗ ${check.scorer}: ${check.reason}`));
      }
    }
  }

  console.log('');
  const line = `${summary.passed}/${summary.total} passed`;
  console.log(summary.failed === 0 ? chalk.green.bold(line) : chalk.red.bold(line));

  if (diff) {
    if (diff.regressions.length) {
      console.log('');
      console.log(chalk.red.bold(`⚠ ${diff.regressions.length} regression(s) vs baseline:`));
      for (const reg of diff.regressions) {
        console.log(chalk.red(`  - ${reg.name} (was passing, now failing)`));
      }
    }
    if (diff.improvements.length) {
      console.log(chalk.green(`✓ ${diff.improvements.length} case(s) newly passing vs baseline`));
    }
    if (diff.changed.length) {
      console.log(chalk.yellow(`~ ${diff.changed.length} case(s) changed output, same pass/fail status`));
    }
  }
  console.log('');
}

export function toJSON(summary, diff) {
  return JSON.stringify({ ...summary, diff }, null, 2);
}

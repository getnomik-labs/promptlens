# PromptLens

**Catch prompt regressions before they ship.**

PromptLens is a lightweight, open-source testing harness for LLM prompts. Define your test cases in a plain YAML file, run them against Claude, GPT, or any model, and get a pass/fail report — plus regression detection against a saved baseline so you know the moment a prompt change breaks something that used to work.

Built by [Getnomik Labs](https://github.com/getnomik-labs).

```
PromptLens — Basic Demo Suite
provider: mock  model: mock-echo-1

PASS  echoes the prompt  (0ms)
PASS  output is not empty  (0ms)
FAIL  this one will fail on purpose  (0ms)
      ✗ contains: output did not contain "this text will never appear"

2/3 passed
```

## Why

Prompts break silently. You tweak a system prompt, swap a model version, or refactor a chain — and somewhere downstream, an output format changes or a case that used to work now fails. Without tests, you find out from a user, not from CI.

PromptLens treats prompts like code: write assertions, run them in CI, diff against a baseline, block the regression before it merges.

## Install

```bash
npm install -g promptlens
```

Or run without installing:

```bash
npx promptlens run suite.yaml
```

## Quickstart

```bash
# scaffold a starter suite
promptlens init

# try it instantly with the built-in mock provider (no API key needed)
promptlens run examples/basic/suite.yaml

# run against Claude (requires ANTHROPIC_API_KEY)
export ANTHROPIC_API_KEY=sk-ant-...
promptlens run suite.yaml
```

## Running from source (cloned, not installed via npm)

If you've cloned this repo directly rather than installing via `npm install -g promptlens`, a couple of things behave differently:

**`node_modules` isn't included in the repo** — that's normal, not a bug. Install dependencies first:

```bash
npm install
```

**Run the CLI with `node`, not the bare `promptlens` command** — `promptlens` only resolves as a command once it's installed globally or linked. From inside the cloned folder:

```bash
node bin/promptlens.js run examples/basic/suite.yaml
```

**Want the bare `promptlens` command to work locally anyway?** Link it:

```bash
npm link
promptlens run examples/basic/suite.yaml
```

**`npx promptlens ...` won't work from inside this folder.** `npx` is for running a package that's published to the npm registry — it doesn't resolve a local source checkout the way `node bin/promptlens.js` does. Use `npx promptlens` once the package is actually published and you're using it in some *other* project, not while developing inside this repo.

Sanity check that everything's wired up:

```bash
npm test
```

## Writing a suite

```yaml
name: Support Bot Prompts
provider: anthropic          # anthropic | openai | mock
model: claude-sonnet-4-6
system: "You are a concise, friendly support agent."

cases:
  - name: "refuses to give refunds without order ID"
    prompt: "I want a refund"
    expect:
      contains: "order ID"

  - name: "responds in valid JSON when asked"
    prompt: "Return a JSON object with a 'status' field set to ok"
    expect:
      json_valid: true
      contains: "status"

  - name: "output stays within length bounds"
    prompt: "Summarize our return policy in one sentence"
    expect:
      min_length: 10
      max_length: 200
```

### Built-in scorers

| Scorer | Checks |
|---|---|
| `exact` | Output matches string exactly (trimmed) |
| `contains` | Output contains substring (case-insensitive) |
| `not_contains` | Output does **not** contain substring |
| `regex` | Output matches a regex pattern |
| `min_length` / `max_length` | Output length bounds |
| `json_valid` | Output parses as valid JSON |

Need custom logic? Point `customScorers` in your suite file at a JS module exporting named scorer functions `(output, expectedValue) => { pass, reason }`.

## Regression testing

Save a baseline once, then diff every future run against it:

```bash
# save current behavior as the baseline
promptlens run suite.yaml --save-baseline .promptlens/baseline.json

# later, after changing a prompt — diff against baseline, fail CI on regression
promptlens run suite.yaml --baseline .promptlens/baseline.json --fail-on-regression
```

PromptLens reports three categories vs. baseline:
- **Regressions** — cases that used to pass, now fail
- **Improvements** — cases that used to fail, now pass
- **Changed** — output text changed, but pass/fail status stayed the same (worth a human glance)

## CI integration

```yaml
# .github/workflows/prompt-tests.yml
- run: npx promptlens run suite.yaml --baseline .promptlens/baseline.json --fail-on-regression
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

## Providers

- **Anthropic** (`ANTHROPIC_API_KEY`) — Claude models
- **OpenAI** (`OPENAI_API_KEY`) — GPT models
- **Mock** — deterministic offline echo, no API key, for demos and dry-running suite syntax

## Programmatic API

```js
import { runSuite, diffAgainstBaseline, loadBaseline } from 'promptlens';

const summary = await runSuite('suite.yaml');
const baseline = loadBaseline('.promptlens/baseline.json');
const diff = diffAgainstBaseline(summary, baseline);
```

## Roadmap / Getnomik Labs Cloud

The CLI is, and will stay, MIT-licensed and free. We're building an optional hosted layer on top for teams who want it:

- Web dashboard with historical trend charts per prompt
- Team-shared baselines (no more committing JSON diffs to git)
- Scheduled runs + Slack/email alerts on regression
- LLM-as-judge scoring for open-ended outputs (tone, helpfulness, faithfulness)
- Multi-model side-by-side comparison

Interested in early access? Open an issue or watch this repo.

## Contributing

Issues and PRs welcome. This is early — expect the suite format to evolve. Run `npm test` before submitting.

## License

MIT © Getnomik Labs
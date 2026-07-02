# Contributing to PromptLens

Thanks for considering a contribution.

## Setup

```bash
git clone https://github.com/getnomik-labs/promptlens.git
cd promptlens
npm install
npm test
```

## Before opening a PR

- Run `npm test` — all tests must pass
- Try `node bin/promptlens.js run examples/basic/suite.yaml` to sanity-check the CLI still works
- Keep provider adapters (`src/adapters/`) free of business logic — they should only handle the API call and response shape
- New scorers go in `src/scorers.js` with a matching test in `test/scorers.test.js`

## Adding a new provider

1. Create `src/adapters/<provider>.js` exporting a `call<Provider>({ model, system, prompt, maxTokens, temperature })` function that returns `{ text, raw, usage }`
2. Register it in `src/adapters/index.js`
3. Document the required env var in the README's Providers section

## Reporting bugs

Open an issue with your suite YAML (redact secrets) and the command you ran. Include Node version (`node --version`).

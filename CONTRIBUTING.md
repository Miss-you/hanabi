# Contributing

Thanks for taking the time to contribute! This guide covers the minimum
workflow to keep changes safe and consistent.

## Local Setup

- Node.js 18+ (20 LTS recommended)
- npm (repository uses `package-lock.json`)

```bash
npm install
npm run dev
```

## Quality Checks

```bash
npm run lint
npm run typecheck
npm run build
```

## PR Expectations

- Keep changes focused and small when possible.
- Update docs in `docs/` when behavior or architecture changes.
- If you introduce new rules or thresholds, note them in
  `docs/development-log.md`.

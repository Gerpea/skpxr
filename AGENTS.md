# skpxr — Pixi.js → Skia CanvasKit wrapper

## Repo layout
- **Library entrypoint**: `src/index.ts` → bundled with Vite to `dist/index.js` (ES module), type declarations to `dist/index.d.ts`.
- **Example app**: `example/` — separate package, links to root via `file:..`. Run its scripts from root (`npm run dev:example`, etc.).
- **Vendor assets**: `vendor/canvaskit-wasm/` — CanvasKit WASM + JS + types. **This folder is gitignored.** It is not installed by npm; download it before any build.

## Commands (order matters)
```bash
# 1. Download vendored CanvasKit PDF build (required before build; creates vendor/canvaskit-wasm/)
node scripts/download-canvaskit-pdf.js

# 2. Build lib + copy WASM to dist/canvaskit/
npm run build          # runs vite build, then scripts/postbuild.js

# 3. Verify
npm run typecheck      # tsc --noEmit
npm run lint           # eslint src --ext .ts
npm run lint:fix       # auto-fix + prettier for staged src files in git hooks
npm run format         # prettier --write "src/**/*.{ts,scss}"

# Example app (separate Vite project)
npm run dev:example
npm run build:example
```

Tests: Vitest is configured (`vitest.config.ts`, `src/**/*.test.ts`, jsdom), but no test files exist yet. No test runs will execute until tests are added.

## Path aliases (must be preserved)
- `canvaskit-wasm` → `vendor/canvaskit-wasm/index.js` — used in both Vite resolve and `tsconfig.json` paths. The alias resolves to the JS loader; the WASM file itself is fetched at runtime from `/canvaskit/{filename}` (copied by postbuild).
- `@/*` → `src/*`

## Build / bundle quirks
- `pixi.js-legacy` is marked **external** in Rollup — not bundled. The consumer must provide it.
- `vite-plugin-dts` generates `.d.ts` during build (`rollupTypes: false`, `staticImport: true`).
- WASM assets are emitted via `assetFileNames: 'canvaskit/[name][extname]'` then copied to `dist/canvaskit/` by `scripts/postbuild.js`. If the vendor file is missing, build exits with an error.
- `optimizeDeps.exclude` keeps `canvaskit-wasm` out of Vite pre-bundling (it's vendored, not installed).

## Git hooks
- **pre-commit**: `npx lint-staged` — runs `eslint --fix` then `prettier --write` on staged `src/*.{ts,tsx}`.
- **commit-msg**: `npx --no-install commitlint --edit` — enforces **Conventional Commits**.
  - Allowed types: `feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert`
  - Header max length: **100 characters**.
  - Case restricted: no `Sentence-Case`, `Start-Case`, `Pascal-Case`, `UPPER-CASE`.

## Style conventions
- Strict TypeScript (`strict: true`).
- `no-explicit-any` is a warning, not an error — the codebase uses it in places (e.g., cast `obj as any`).
- `console.log` / `console.warn` are warnings (not forbidden), used in renderer for backend selection logging.
- Lint targets `src` only — example files and tests are not linted by root `npm run lint`.

## Key source files worth reading first
- `src/SkiaRenderer.ts` — main class, owns lifecycle, tells you where CanvasKit is initialized and how the render loop is wired.
- `src/TransformManager.ts` — matrix math between Pixi and Skia coordinate spaces.
- `src/mappers/` — per-Pixi-type renderers (`ContainerMapper`, `GraphicsMapper`, `SpriteMapper`).
- `src/PixiEventBridge.ts` / `src/InteractionManager.ts` — input/event routing.

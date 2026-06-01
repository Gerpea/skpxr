# skpxr — Pixi.js → Skia CanvasKit wrapper

## Repo layout
- **Library entrypoint**: `src/index.ts` → `dist/index.js` (ES module), `dist/index.d.ts`
- **Example app**: `example/` — separate Vite project, linked via `file:..` (run scripts from root)
- **Vendor assets**: `vendor/canvaskit-wasm/` — gitignored, contains CanvasKit WASM/JS; must download before build

## Commands (order matters)
```bash
node scripts/download-canvaskit-pdf.js  # 1. Download vendored CanvasKit
npm run build                          # 2. Build lib, copy WASM to dist/canvaskit/
npm run typecheck                      # 3. Verify: tsc --noEmit
npm run lint                           #    eslint src --ext .ts
npm run lint:fix                       #    eslint --fix + prettier on staged src files
npm run format                         #    prettier --write "src/**/*.{ts,scss}"
npm run dev:example                    # Example app dev server
npm run build:example                  # Example app build
```

## Path aliases (must be preserved)
- `@/*` → `src/*`
- `canvaskit-wasm` → `vendor/canvaskit-wasm/index.js` (JS loader; WASM fetched at runtime from `/canvaskit/`)

## Build / bundle quirks
- `pixi.js-legacy` is **external** — consumer must provide it
- `vite-plugin-dts` generates `.d.ts` (`rollupTypes: false`, `staticImport: true`)
- WASM assets emitted via `assetFileNames: 'canvaskit/[name][extname]'` then copied to `dist/canvaskit/` by `scripts/postbuild.js`
- `optimizeDeps.exclude` keeps `canvaskit-wasm` out of Vite pre-bundling

## Git hooks
- **pre-commit**: `npx lint-staged` → `eslint --fix` + `prettier --write` on staged `src/*.{ts,tsx}`
- **commit-msg**: `npx --no-install commitlint --edit` → Conventional Commits: types `feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert`, header ≤100 chars, all lowercase

## Style conventions
- TypeScript: `strict: false` (see `tsconfig.json` for flags)
- `no-explicit-any` is warning (used for casts)
- `console.log/warn` are warnings (used in renderer for backend selection)
- Lint targets `src` only — example and tests not linted by root

## Testing
- Vitest configured (`vitest.config.ts`, jsdom) but no test files exist yet

## Key source files
- `src/SkiaRenderer.ts` — main class, lifecycle, CanvasKit init, render loop
- `src/TransformManager.ts` — matrix math between Pixi and Skia coordinate spaces
- `src/mappers/` — per-Pixi-type renderers (`ContainerMapper`, `GraphicsMapper`, `SpriteMapper`, `TextMapper`)
- `src/PixiEventBridge.ts` / `src/InteractionManager.ts` — input/event routing
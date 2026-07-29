# @edly-io/frontend-component-fbr

A shared React component library for Open edX authoring/FBR frontends. It provides
reusable, tree-shakeable, TypeScript-typed UI components built on top of
[Paragon](https://github.com/openedx/paragon) so that multiple Open edX MFEs
(`frontend-app-authoring`, `frontend-app-fbr-admin`, etc.) can share a single
implementation instead of duplicating components across repos.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Development](#development)
- [Using the Library in Open edX MFEs](#using-the-library-in-open-edx-mfes)
- [Tutor Development Setup](#tutor-development-setup)
- [Local Development Workflow](#local-development-workflow)
- [Publishing](#publishing)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Overview

This package compiles TypeScript/TSX source under `src/` into a CommonJS `dist/`
build with accompanying `.d.ts` declaration files. It is consumed as an npm
dependency by Open edX MFEs and is **not** a standalone application — it has no
dev server, no routes, and no bundling of its own. Consumers bring their own
React, `react-dom`, and `@openedx/paragon` (declared as `peerDependencies` so
only one copy of each ends up in the final app bundle).

## Prerequisites

- **Node.js** and **npm** matching the versions used by the target Open edX MFE
  (check that MFE's `.nvmrc` / `package.json engines`). This library relies on
  `@openedx/frontend-build`, which pins the toolchain (Babel, ESLint, Jest,
  TypeScript) used across Open edX frontends.
- **Git** with SSH access to `git@github.com:edly-io/frontend-component-fbr.git`
  if you plan to install from GitHub or clone the repo for local development.
- A working copy of the consuming Open edX MFE (`frontend-app-authoring`,
  `frontend-app-fbr-admin`, or any other Open edX MFE) if you're developing
  against it locally.

## Installation

### From the npm registry

```bash
npm install @edly-io/frontend-component-fbr
```

Peer dependencies must already be present in the consuming project (they
almost always are, in any Open edX MFE):

```bash
npm install @openedx/paragon@^23.5.0 react@^18.3.1 react-dom@^18.3.1
```

### From GitHub (no npm publish required)

Useful for testing a branch or commit before it's published:

```bash
npm install git+ssh://git@github.com/edly-io/frontend-component-fbr.git#<branch-or-tag>
```

Note that consumers only get the compiled `dist/` output if it's committed, or
if the package defines a `prepare` script that builds on install. See
[Troubleshooting](#troubleshooting) if you hit a "missing dist" error with this
method.

### Local path (`file:` dependency)

For active local development against a sibling checkout:

```bash
npm install file:../frontend-component-fbr
```

This adds an entry like `"@edly-io/frontend-component-fbr": "file:../frontend-component-fbr"`
to the consumer's `package.json`. See [Local Development Workflow](#local-development-workflow)
for the tradeoffs of this approach versus `npm link` and `npm pack`.

### From a tarball

Useful for testing exactly what will ship to npm, without publishing:

```bash
cd frontend-component-fbr
npm run build
npm pack
# produces edly-io-frontend-component-fbr-1.0.0.tgz

cd ../<your-mfe-repo>   # e.g. frontend-app-authoring, frontend-app-fbr-admin, or any other Open edX MFE
npm install ../frontend-component-fbr/edly-io-frontend-component-fbr-1.0.0.tgz
```

## Usage

### Importing components

All public components and types are re-exported from the package root, so
consumers never need deep imports:

```tsx
import { UserIdentity } from '@edly-io/frontend-component-fbr';
```

### React example

```tsx
import React from 'react';
import { UserIdentity } from '@edly-io/frontend-component-fbr';

const TraineeRow = () => (
  <UserIdentity
    name="Jane Doe"
    badges={['Instructor']}
    size="default"
    showAvatar
    enableHoverCard
  />
);

export default TraineeRow;
```

### TypeScript example

Types are shipped alongside the compiled JS (`dist/index.d.ts`), so no
`@types/*` package is needed. Prop types are exported for consumers who want
to type their own wrapper components:

```tsx
import { UserIdentity, UserIdentityProps } from '@edly-io/frontend-component-fbr';

const buildProps = (overrides: Partial<UserIdentityProps>): UserIdentityProps => ({
  name: 'Unnamed user',
  badges: [],
  size: 'default',
  ...overrides,
});

const CompactUser: React.FC<{ name: string }> = ({ name }) => (
  <UserIdentity {...buildProps({ name, size: 'compact' })} />
);
```

## Development

Clone the repo and install dependencies:

```bash
git clone git@github.com:edly-io/frontend-component-fbr.git
cd frontend-component-fbr
npm install
```

Available scripts:

| Script | Command | Purpose |
| --- | --- | --- |
| `npm run build` | Babel-compiles `src/` to `dist/`, then generates `.d.ts` files | Produces the publishable output |
| `npm run build:types` | `tsc --emitDeclarationOnly --project tsconfig.build.json` | Generates only the `.d.ts` files into `dist/` |
| `npm test` | `fedx-scripts jest --coverage` | Runs the unit test suite with coverage |
| `npm run test:ci` | `fedx-scripts jest --silent --coverage` | CI-friendly variant of the test run |
| `npm run lint` | `fedx-scripts eslint .` | Lints `src/` against the Open edX ESLint config |
| `npm run lint:fix` | `fedx-scripts eslint --fix .` | Lints and auto-fixes what it can |
| `npm run types` | `tsc --noEmit` | Type-checks the whole project without emitting files |

Before opening a pull request, run all of the above — `npm run build` will
catch issues the others won't (e.g. Babel `--ignore` patterns, `.d.ts` output
paths), and vice versa.

## Using the Library in Open edX MFEs

Once installed (see [Installation](#installation)), import components exactly
as you would from any other npm package — no MFE-specific configuration is
required for the published package. Because `react`, `react-dom`, and
`@openedx/paragon` are peer dependencies, the MFE's own copies are used at
runtime; this library never bundles its own React.

The nuance only shows up when you consume the package via a `file:` link (see
[Local Development Workflow](#local-development-workflow)) — that's covered
separately since it introduces webpack/Docker considerations that don't apply
to a normal npm install.

## Tutor Development Setup

Open edX MFEs are typically run inside [Tutor](https://docs.tutor.overhang.io/)
containers. If you're developing `frontend-component-fbr` alongside an MFE
running under Tutor, the container needs to see both repos.

### 1. Clone both repos side by side

```bash
mkdir -p ~/workspace/edx && cd ~/workspace/edx
git clone git@github.com:edly-io/frontend-component-fbr.git
git clone git@github.com:<org>/<your-mfe-repo>.git   # e.g. frontend-app-authoring, frontend-app-fbr-admin, or any other Open edX MFE
```

### 2. Link the library into the MFE

```bash
cd <your-mfe-repo>
npm install file:../frontend-component-fbr
```

### 3. Mount both repos into the Tutor container

Tutor only bind-mounts what you explicitly tell it to. The MFE repo is
typically already mounted; the library repo needs an **explicit** mount so it
lands at a real path inside the container (a `file:` link that resolves
outside the container's mounted paths will fail with `Module not found`; see
[Troubleshooting](#troubleshooting)):

```bash
tutor mounts add <mfe-service>,<mfe-service>-dev:/absolute/path/to/frontend-component-fbr:/openedx/frontend-component-fbr
```

Explicit mount syntax is `service[,service...]:/host/path:/container/path`.
Replace `<mfe-service>` with whichever Tutor service(s) actually run the dev
server for your MFE (e.g. `authoring,authoring-dev` for
`frontend-app-authoring` — check `tutor mounts list` for the service names
already in use in your setup). Verify the mount:

```bash
tutor mounts list
```

Restart the affected containers so the new mount takes effect:

```bash
tutor dev restart <mfe-service>
```

### Hot-reload behavior

- Edits to files already inside `dist/` (i.e., already-built output) are
  picked up by the MFE's dev server automatically, the same as any other
  `node_modules` change — webpack dev server watches `file:`-linked packages
  like any other dependency.
- Edits to `src/*.tsx` in the library are **not** picked up automatically,
  because the MFE imports compiled `dist/` output, not source. You must
  rebuild the library for changes to propagate.

### What triggers a rebuild

Run this in the `frontend-component-fbr` repo after any source change:

```bash
npm run build
```

For a tighter loop, keep a terminal open running the build on save (e.g. via
`nodemon` or an editor task) rather than re-running `npm run build` by hand
after every edit.

### Troubleshooting Tutor-specific issues

See the [Troubleshooting](#troubleshooting) section below — the "Module not
found" and "Tutor not picking up changes" entries apply directly here.

## Local Development Workflow

There are three common ways to consume an unpublished, in-progress version of
this library from another local repo. They trade off convenience against
correctness:

| Approach | How | Pros | Cons |
| --- | --- | --- | --- |
| **Local path (`file:`)** | `npm install file:../frontend-component-fbr` | Simple; no extra commands; works with Docker mounts (see above) | Symlinks its own `node_modules` unless deduped — can cause duplicate React instances (see [Troubleshooting](#troubleshooting)); requires a manual rebuild after every change |
| **`npm link`** | `npm link` in the library, then `npm link @edly-io/frontend-component-fbr` in the consumer | No `package.json` changes needed in the consumer; easy to unlink | Same duplicate-package/symlink pitfalls as `file:`; global link state is easy to forget about and can cause "works on my machine" surprises |
| **`npm pack` + install tarball** | `npm pack` in the library, then `npm install ../frontend-component-fbr/*.tgz` in the consumer | Closest simulation of a real npm install — no symlinks, no duplicate-package issues | Slowest loop: requires `npm pack` + `npm install` after every change, not just a rebuild |

**Recommendation:** use the `file:` approach for day-to-day development (fastest
loop, and works inside Tutor once mounted correctly), but validate with an
`npm pack` install before publishing a release — it will catch packaging bugs
(e.g. missing files, wrong `main`/`types` paths) that `file:` linking hides.

If you use `file:` or `npm link` and hit duplicate-React errors, see
[Troubleshooting](#troubleshooting).

## Publishing

1. **Bump the version** following semver:

   ```bash
   npm version patch   # or minor / major
   ```

2. **Build**:

   ```bash
   npm run build
   ```

3. **Verify the package contents** before publishing anything:

   ```bash
   npm pack --dry-run
   ```

   Confirm the output includes `dist/` (per the `files` field in
   `package.json`) and that `dist/index.js` and `dist/index.d.ts` exist at the
   top level — not nested under `dist/src/`.

4. **Publish**:

   ```bash
   npm publish --access public
   ```

   (`publishConfig.access` is already set to `public` in `package.json`, but
   passing `--access public` explicitly avoids surprises for scoped packages
   like `@edly-io/frontend-component-fbr` on your first publish.)

5. **Install the published version** in a consumer to confirm it resolves
   correctly:

   ```bash
   npm install @edly-io/frontend-component-fbr@latest
   ```

## Troubleshooting

**`Module not found: Can't resolve '@edly-io/frontend-component-fbr'`**
Usually means a `file:`-linked package's symlink target isn't visible inside
the environment resolving it. Inside Tutor/Docker, this happens when the
library repo lives outside any path bind-mounted into the container — the
symlink resolves to a host path the container can't see. Fix by explicitly
mounting the library repo (see [Tutor Development Setup](#tutor-development-setup)).

**"Missing `dist`" / cannot find module after installing from GitHub or a `file:` link**
The published npm package includes a prebuilt `dist/` (per the `files` field),
but a GitHub install or a fresh `file:` link installs from source and does
**not** run a build automatically unless a `prepare` script exists. Run
`npm run build` inside the library repo yourself after linking it, and after
every subsequent source change.

**Missing `prepare` script warnings / build not happening automatically**
This package intentionally does not define a `prepare` script, so installing
via `git+ssh://...` or `file:` will not auto-build. This is deliberate — an
auto-build on every `npm install` would slow down installs in every consumer.
Always run `npm run build` manually after cloning or linking.

**Peer dependency warnings (`react`, `react-dom`, `@openedx/paragon`)**
These are declared as `peerDependencies`, not `dependencies`, so npm expects
the consumer to already provide compatible versions. A warning (not an error)
means versions are close but not exact — check the ranges in `package.json`
against what the consuming MFE has installed. An error means the consumer is
missing one of them entirely; install it there.

**`TypeError: Cannot read properties of null (reading 'useId')` / "Invalid hook call"**
This means two separate copies of React (or `@openedx/paragon`) ended up in
the same app — typically because a `file:`-linked package resolves to its own
nested `node_modules/react` instead of the consumer's copy. Webpack follows
symlinks to their real path by default, which defeats normal deduplication.
Fix in the **consuming MFE's** `webpack.dev.config.js`:

```js
resolve: {
  alias: {
    react: path.resolve(__dirname, 'node_modules/react'),
    'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    '@openedx/paragon': path.resolve(__dirname, 'node_modules/@openedx/paragon'),
  },
  symlinks: false,
},
```

Setting `symlinks: false` keeps webpack from re-resolving relative to the
symlink's real path, and the explicit `alias` entries force a single shared
copy of React/Paragon regardless of what the linked package ships internally.

**Tutor not picking up changes to the library**
Two separate causes, often confused:
1. You edited `src/` but didn't rebuild — the MFE only ever sees `dist/`.
   Run `npm run build`.
2. You rebuilt, but the container's webpack dev server didn't notice —
   restart it (`tutor dev restart <service>`), since file-watching across a
   bind mount sometimes misses rapid rebuilds depending on your host OS's
   filesystem event support.

**Docker cache issues**
If dependency or build behavior seems stale even after a rebuild, the image
layer cache may be reusing an old `node_modules`. Rebuild the image without
cache:

```bash
tutor images build openedx-dev --no-cache
```

**Webpack resolution issues beyond React/Paragon**
If other packages also get duplicated through the same symlink mechanism,
extend the `alias`/`symlinks` fix above to those packages too, rather than
disabling `symlinks` resolution only partially.

**TypeScript declaration (`.d.ts`) issues — missing, or nested under `dist/src/`**
`npm run build:types` uses `tsconfig.build.json`, which sets an explicit
`rootDir`/`outDir` and narrows `include` to `src/**/*` only. If declarations
reappear under `dist/src/...` or stray `.d.ts` files show up for root config
files (`babel.config.d.ts`, `jest.config.d.ts`, etc.), something has
regressed that config — verify `build:types` in `package.json` still points
at `tsconfig.build.json` and hasn't reverted to compiling against the root
`tsconfig.json` (which is intentionally broader, for editor/lint use).

## Contributing

### Adding a new component

1. Create a new folder under `src/components/<ComponentName>/` containing:
   - `<ComponentName>.tsx` — the implementation
   - `types.ts` — prop types and any component-local types
   - `<ComponentName>.test.tsx` — unit tests (see `UserIdentity.test.tsx` for
     the expected coverage: rendering, required/optional props, interactions,
     callbacks, conditional rendering, accessibility attributes, edge cases;
     prefer behavioral assertions over snapshots)
   - `index.ts` — re-exports the component and its types
   - an accompanying `.scss` file, if the component needs component-scoped
     styles
2. **Export it from `src/index.ts`** so it's part of the package's public API:

   ```ts
   export * from './components/<ComponentName>';
   ```

3. Run the full check before opening a PR:

   ```bash
   npm run types && npm run lint && npm test && npm run build
   ```

4. **Update this README** if the change affects usage, installation, or the
   project structure — in particular, add the component to the
   [Usage](#usage) section if it introduces a new usage pattern.

### Conventions

- Keep components tree-shakeable: avoid side effects at module scope, and
  export named exports rather than relying solely on a default export from
  `src/index.ts`.
- Type props explicitly in `types.ts` rather than inline in the component
  file — this keeps prop types importable by consumers (see the TypeScript
  usage example above).
- Match the testing stack and conventions already used in this repo (Jest,
  React Testing Library, `@testing-library/user-event`, `jest-dom`) — don't
  introduce new testing libraries without discussion, since versions here are
  intentionally kept in sync with `frontend-app-authoring`.

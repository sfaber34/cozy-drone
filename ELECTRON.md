# Desktop / Steam build (Electron)

The game ships to Steam wrapped in **Electron** (bundles its own Chromium →
identical rendering on Windows, macOS, and Steam Deck). Packaging is handled
by **electron-builder**. There's no Steamworks SDK integration — saves/settings
are plain `localStorage`, which persists automatically in the desktop build.

Wrapper source lives in `electron/main.js`. Everything below is run from the
project root.

## First-time setup

```
npm install
```

Installs Electron + electron-builder + the dev launcher tools (downloads
Electron, ~100 MB the first time).

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Plain browser dev (Vite, opens a tab). No Electron. |
| `npm run electron:dev` | **Dev loop.** Starts Vite on :5173, then opens an Electron window loading it with hot-reload + detached DevTools. |
| `npm run electron:preview` | **Prod path, no installer.** Builds `dist/` and runs Electron serving it over the real `app://` protocol. Use this to verify saves persist across launches. |
| `npm run dist` | Build installers for the current OS. |
| `npm run dist:mac` | Build the macOS `.dmg` + `.app` (output in `release/`). |
| `npm run dist:win` | Build the Windows NSIS installer + portable `.exe`. |

## How the two run modes work

- **Dev** (`electron:dev`): loads `http://localhost:5173` (the Vite dev
  server), so HMR works exactly like browser dev.
- **Prod** (packaged app, or `electron:preview`): serves the built `dist/`
  folder over a custom `app://local` protocol and loads
  `app://local/index.html`.

The custom `app://` protocol (not `file://` or a localhost server) gives a
**stable origin**, which is what keeps `localStorage` saves persisting across
launches. Dev (`localhost:5173`) and prod (`app://local`) are separate origins,
so they don't share saves — that's expected.

## Testing the packaged Mac app

`npm run dist:mac` → `release/Cozy Drone.app`. It isn't code-signed yet, so
macOS blocks it on first open: **right-click the app → Open** to bypass.

## Still TODO before shipping

- **App icons** — electron-builder wants `build/icon.icns` (mac) and
  `build/icon.ico` (win). Currently uses the default Electron icon.
- **Code signing / notarization** — needed for a clean install on macOS and
  Windows (Windows signing is easiest on a real Windows box or CI).
- **Steam upload** — via SteamPipe / `steamcmd` once installers are built.

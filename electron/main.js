// Electron main process — the desktop wrapper for the Steam build.
//
// Two run modes:
//   • Dev  (`npm run electron:dev`): loads the live Vite dev server at
//     http://localhost:5173, so hot-module reload works exactly like the
//     browser dev loop.
//   • Prod (packaged app, or `npm run electron:preview`): serves the built
//     `dist/` folder over a custom `app://` protocol and loads
//     app://local/index.html.
//
// Why a custom protocol instead of file:// or a localhost server:
//   1. Stable origin. localStorage is keyed by origin. Our whole save +
//      settings system lives in localStorage, so the origin MUST be the
//      same on every launch. file:// gives an opaque/unreliable origin, and
//      a localhost server on a random port changes origin every run (fixed
//      ports risk conflicts). app://local is constant, so saves persist.
//   2. No listening socket → no OS/antivirus firewall prompts.
//   3. fetch()/XHR don't support file://, but the game fetches JSON manifests
//      and loads audio at runtime; a privileged custom scheme supports fetch.
//   4. We set Content-Type explicitly, so ES-module scripts and audio serve
//      with the right MIME (file:// mime guessing is unreliable).
const { app, BrowserWindow, protocol, shell, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");

// Dev when running unpackaged without the explicit --serve flag. --serve
// forces the prod (app://) path on source, for previewing the packaged
// behavior without actually building an installer.
const isDev = !app.isPackaged && !process.argv.includes("--serve");
const DIST = path.join(__dirname, "..", "dist");
const DEV_URL = "http://localhost:5173";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
};

// Render at true native resolution, ignoring the OS display-scaling setting
// (Windows defaults to 125%/150% on most laptops). Must be set before 'ready'.
//
// Why: main.js sizes the canvas backing store in CSS pixels and forces the
// canvas CSS size to match, so there's exactly 1 backing pixel per CSS pixel
// and devicePixelRatio is never consulted. The browser then upscales that
// canvas to physical pixels with nearest-neighbor (image-rendering: pixelated).
// At an integer dPR — 2.0 on a Retina Mac, 1.0 at Windows 100% — that's clean
// pixel doubling. At a FRACTIONAL dPR (1.25 / 1.5) it duplicates some pixel
// rows/columns and not others: the sprite art survives (it's blocky anyway),
// but antialiased text glyphs get uneven stroke weights and read as blurry.
// Forcing scale factor 1 makes the backing store map 1:1 to physical pixels,
// so nothing is resampled. Safe for layout because the UI derives its sizes
// from Math.min(w, h), so it scales up with the larger native dimensions.
app.commandLine.appendSwitch("force-device-scale-factor", "1");
app.commandLine.appendSwitch("high-dpi-support", "1");

// Must be called before app 'ready'. Harmless in dev (the scheme is unused).
// standard: proper origin + relative-URL resolution. secure: treated as a
// secure context (localStorage, etc.). supportFetchAPI: the game fetch()es
// its audio manifests.
protocol.registerSchemesAsPrivileged([
  {
    scheme: "app",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
    },
  },
]);

function registerAppProtocol() {
  protocol.handle("app", async (request) => {
    const url = new URL(request.url);
    let pathname = decodeURIComponent(url.pathname);
    if (!pathname || pathname === "/") pathname = "/index.html";

    const filePath = path.normalize(path.join(DIST, pathname));
    // Never serve outside DIST (path-traversal guard).
    if (filePath !== DIST && !filePath.startsWith(DIST + path.sep)) {
      return new Response("Forbidden", { status: 403 });
    }
    try {
      const data = await fs.promises.readFile(filePath);
      const ext = path.extname(filePath).toLowerCase();
      return new Response(data, {
        status: 200,
        headers: { "content-type": MIME[ext] || "application/octet-stream" },
      });
    } catch {
      return new Response("Not found", { status: 404 });
    }
  });
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: "#000000",
    autoHideMenuBar: true,
    // Ship in TRUE fullscreen (borderless, no title bar, covers the taskbar/
    // dock) — this is a game. Dev stays windowed so DevTools + resizing work.
    // F11 toggles it below so the player is never stuck.
    fullscreen: !isDev,
    title: "Cozy Drone",
    webPreferences: {
      // The renderer runs untrusted-ish web content (the game bundle) — keep
      // Node out of it and isolate contexts. The preload exposes only a
      // minimal, explicit API (window.desktopApp) across the isolation bridge.
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Any external link (e.g. the vibej.am widget) opens in the OS browser,
  // never inside the game window.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  // F11 toggles true fullscreen ↔ windowed (standard game convention), so the
  // player can drop out of fullscreen without quitting. The game doesn't use
  // F11 for anything, so swallowing it here is safe.
  win.webContents.on("before-input-event", (event, input) => {
    if (input.type === "keyDown" && input.key === "F11") {
      win.setFullScreen(!win.isFullScreen());
      event.preventDefault();
    }
  });

  if (isDev) {
    await win.loadURL(DEV_URL);
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    await win.loadURL("app://local/index.html");
  }
}

// Renderer → main: the in-game "Quit Game" buttons ask to close the app.
ipcMain.on("app:quit", () => app.quit());

app.whenReady().then(() => {
  if (!isDev) registerAppProtocol();
  createWindow();

  // macOS: re-open a window when the dock icon is clicked and none are open.
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  // macOS apps typically stay running until Cmd-Q; everywhere else, quit.
  if (process.platform !== "darwin") app.quit();
});

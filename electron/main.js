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
const {
  app,
  BrowserWindow,
  protocol,
  shell,
  ipcMain,
  screen,
} = require("electron");
const fs = require("fs");
const path = require("path");

// ── CAPTURE / TRAILER TOGGLE ────────────────────────────────────────────────
// When true, the packaged app opens a FRAMELESS, fixed-size 16:9 window (the
// largest 16:9 that fits the screen) instead of true fullscreen — so OBS can
// window-capture a clean, correctly-proportioned 16:9 frame for the Steam
// trailer: no title bar, no rounded corners, no 16:10 MacBook letterboxing.
// Set back to false before shipping so the real release launches fullscreen.
const CAPTURE_MODE = true;

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
  const common = {
    backgroundColor: "#000000",
    autoHideMenuBar: true,
    title: "Cozy Drone",
    webPreferences: {
      // The renderer runs untrusted-ish web content (the game bundle) — keep
      // Node out of it and isolate contexts. The preload exposes only a
      // minimal, explicit API (window.desktopApp) across the isolation bridge.
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  };

  let win;
  if (!isDev && CAPTURE_MODE) {
    // Target EXACTLY 1920x1080 (the Steam trailer resolution) as the CONTENT
    // box, so OBS window-captures a native-res 16:9 frame. Caveat: these are
    // LOGICAL points — a window can't be bigger than the display it's on. So
    // we place it on a display whose work area actually holds 1920x1080 pts,
    // preferring the LARGEST such display (typically the external monitor, not
    // the laptop's built-in). On a Retina display OBS still captures at 2x
    // (3840x2160) and downscales, which is fine. If NO display has that much
    // logical room, fall back to the largest 16:9 that fits the primary
    // display so the window still opens fully on-screen (see note to user).
    const TARGET_W = 1920;
    const TARGET_H = 1080;
    const fits = screen
      .getAllDisplays()
      .filter(
        (d) =>
          d.workAreaSize.width >= TARGET_W && d.workAreaSize.height >= TARGET_H,
      )
      .sort(
        (a, b) =>
          b.workAreaSize.width * b.workAreaSize.height -
          a.workAreaSize.width * a.workAreaSize.height,
      );

    let w, h;
    let wa;
    if (fits.length > 0) {
      w = TARGET_W;
      h = TARGET_H;
      wa = fits[0].workArea;
    } else {
      wa = screen.getPrimaryDisplay().workArea;
      w = wa.width;
      h = Math.round((w * 9) / 16);
      if (h > wa.height) {
        h = wa.height;
        w = Math.round((h * 16) / 9);
      }
    }
    // Center on the chosen display (getAllDisplays coords are global, so this
    // also moves the window onto the external monitor when that's the fit).
    const x = Math.round(wa.x + (wa.width - w) / 2);
    const y = Math.round(wa.y + (wa.height - h) / 2);

    win = new BrowserWindow({
      ...common,
      width: w,
      height: h,
      x,
      y,
      useContentSize: true, // w/h size the web content → canvas is exactly 16:9
      frame: false, // no title bar
      roundedCorners: false, // square corners (macOS) so OBS captures clean edges
      resizable: false,
      maximizable: false,
      fullscreenable: false,
    });
  } else {
    win = new BrowserWindow({
      ...common,
      width: 1280,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      // Ship in TRUE fullscreen (borderless, no title bar, covers the taskbar/
      // dock) — this is a game. Dev stays windowed so DevTools + resizing work.
      // F11 toggles it below so the player is never stuck.
      fullscreen: !isDev,
    });
  }

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

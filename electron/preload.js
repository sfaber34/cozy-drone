// Preload — the only bridge between the game (renderer) and the Electron
// main process. Runs with Node access in an isolated context, then exposes a
// tiny, explicit API on window.desktopApp via contextBridge. The game never
// gets Node/ipc directly (contextIsolation + nodeIntegration:false stay on).
//
// window.desktopApp exists ONLY in the desktop build, so the game uses its
// presence to detect "am I running under Electron?" (see src/systems/desktop.js).
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopApp", {
  quit: () => ipcRenderer.send("app:quit"),
});

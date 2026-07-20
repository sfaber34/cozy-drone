// Bridge to the Electron desktop wrapper. window.desktopApp is injected by
// electron/preload.js and exists ONLY in the packaged desktop build — so its
// presence doubles as the "are we running under Electron?" check. In the web
// build these are safely inert: isDesktop() is false and quitGame() no-ops.

export function isDesktop() {
  return !!(window.desktopApp && typeof window.desktopApp.quit === "function");
}

// Quit the desktop app. Returns true if the request was sent (desktop build),
// false in the web build where there's no app to quit (caller decides what to
// do instead — typically nothing, since the Quit button is hidden on web).
export function quitGame() {
  if (isDesktop()) {
    window.desktopApp.quit();
    return true;
  }
  return false;
}

// Returns the height of any fixed browser UI (e.g. Chrome on iOS shows a
// persistent bottom toolbar that sits on top of the canvas). Phaser's
// scale.height / window.innerHeight report the full canvas size — which
// includes the area under the toolbar — so bottom-anchored UI gets clipped.
//
// Strategy:
//   1. Primary signal: window.visualViewport (reports the visually-
//      unobstructed area; diff vs innerHeight gives the chrome height).
//   2. Fallback for iOS Chrome specifically: the bottom toolbar is ~60 px
//      and visualViewport sometimes reports the same as innerHeight on that
//      browser, so we reserve a hard-coded minimum when we detect it.
//
// Desktop Safari/Chrome + iOS Safari usually report matching values →
// inset = 0, no layout change.
export function getBrowserBottomInset() {
  if (typeof window === "undefined") return 0;

  // Primary: visualViewport diff
  let vvInset = 0;
  const vv = window.visualViewport;
  if (vv) {
    const diff = window.innerHeight - vv.height - (vv.offsetTop || 0);
    vvInset = Math.max(0, Math.round(diff));
  }

  // iOS Chrome PORTRAIT has a persistent bottom toolbar; landscape does NOT.
  // visualViewport doesn't always surface it as a diff, so apply a minimum
  // reservation specifically for iOS-Chrome-portrait.
  if (isChromeIOS() && isPortrait()) {
    return Math.max(vvInset, IOS_CHROME_BOTTOM_BAR_MIN);
  }

  return vvInset;
}

// Top inset — usually 0; iOS Chrome DOES NOT overlay its URL bar on the
// canvas (the canvas is drawn below the URL bar already), so no fallback
// reservation is needed here. visualViewport.offsetTop still covers the
// rare case where a browser reports a non-zero top offset.
export function getBrowserTopInset() {
  if (typeof window === "undefined") return 0;
  const vv = window.visualViewport;
  if (vv) return Math.max(0, Math.round(vv.offsetTop || 0));
  return 0;
}

// Minimum reserved height on iOS Chrome portrait for its bottom toolbar.
const IOS_CHROME_BOTTOM_BAR_MIN = 80;

function isPortrait() {
  if (typeof window === "undefined") return false;
  return window.innerHeight >= window.innerWidth;
}

function isChromeIOS() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  // CriOS = Chrome on iOS (they rebrand as "CriOS" in UA to not conflict
  // with Safari/WebKit which they're forced to use on iOS).
  return /iPad|iPhone|iPod/.test(ua) && /CriOS/.test(ua);
}

function isSafariIOS() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  // iOS Safari: iOS device + WebKit "Safari" token + none of the rebrand
  // tokens (CriOS=Chrome, FxiOS=Firefox, EdgiOS=Edge). Native apps (Phaser
  // in a WKWebView) show WebKit without "Safari" and are not counted.
  return (
    /iPad|iPhone|iPod/.test(ua) &&
    /Safari/.test(ua) &&
    !/CriOS|FxiOS|EdgiOS/.test(ua)
  );
}

// OS-reported safe-area insets (in CSS pixels). iOS puts non-zero
// `safe-area-inset-left/right` on landscape phones for the notch + home
// indicator; Android puts a top inset under display cutouts. Values come
// from the device via the `env(safe-area-inset-*)` CSS variables we expose
// in index.html — no per-model hard-coding. Returns zeros on browsers /
// setups that don't publish insets.
// Reusable probe element used to read env(safe-area-inset-*) values DIRECTLY
// instead of going through CSS custom properties. iOS Safari sometimes
// keeps the :root custom properties at stale values on direct landscape-
// to-landscape rotations; forcing a fresh layout on a probe element and
// reading its computed size surfaces the post-rotation env() value.
let _saiProbe = null;
function ensureSaiProbe() {
  if (_saiProbe || typeof document === "undefined") return _saiProbe;
  _saiProbe = document.createElement("div");
  // Use env() for all four sides on a single element. The element itself
  // has zero visible size; we only read its .style via getComputedStyle.
  _saiProbe.style.cssText = [
    "position:fixed",
    "top:env(safe-area-inset-top,0px)",
    "right:env(safe-area-inset-right,0px)",
    "bottom:env(safe-area-inset-bottom,0px)",
    "left:env(safe-area-inset-left,0px)",
    "width:0",
    "height:0",
    "pointer-events:none",
    "visibility:hidden",
  ].join(";");
  document.body.appendChild(_saiProbe);
  return _saiProbe;
}

export function getSafeAreaInsets() {
  if (typeof window === "undefined") return { top: 0, right: 0, bottom: 0, left: 0 };
  const probe = ensureSaiProbe();
  if (!probe) return { top: 0, right: 0, bottom: 0, left: 0 };
  // Force a reflow on the probe so iOS Safari re-evaluates its env() values.
  // Without this, iOS may keep serving stale values after a direct
  // landscape-left ↔ landscape-right flip since the page never reflows.
  void probe.offsetWidth;
  const cs = window.getComputedStyle(probe);
  const parse = (name) => {
    const raw = cs.getPropertyValue(name).trim();
    if (!raw) return 0;
    const n = parseFloat(raw);
    return Number.isFinite(n) ? n : 0;
  };
  return {
    top:    parse("top"),
    right:  parse("right"),
    bottom: parse("bottom"),
    left:   parse("left"),
  };
}

// Per-browser Y offset applied to the mobile on-screen controls so they
// aren't hidden by browser chrome that `getBrowserBottomInset()` can't see.
// Returned in CSS pixels; MobileControlsScene multiplies by its boost factor
// to land in internal-canvas coords.
// Positive values push controls DOWN toward the bottom edge of the screen.
export function getMobileControlsYOffset() {
  if (isChromeIOS() && isPortrait()) return 90;
  if (isChromeIOS() && !isPortrait()) return 50;
  if (isSafariIOS() && isPortrait()) return 15;
  if (isSafariIOS() && !isPortrait()) return 50;
  return 0;
}

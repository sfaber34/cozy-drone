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

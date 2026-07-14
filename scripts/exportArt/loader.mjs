// Node ESM loader hook: redirects bare `import Phaser from "phaser"` to our
// lightweight shim so the texture generators can run outside a browser
// (real Phaser touches `window` at import time and crashes under plain Node).
const shimUrl = new URL('./phaserShim.mjs', import.meta.url).href;

export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'phaser') {
    return { url: shimUrl, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}

// The game's src/**/*.js files use ESM `export`/`import` syntax but the
// package has no "type": "module", so plain Node would otherwise load them
// as CommonJS and choke on the syntax. Force module format for our own
// project files (never for node_modules, which may genuinely be CJS).
export async function load(url, context, nextLoad) {
  if (url.endsWith('.js') && !url.includes('/node_modules/')) {
    return nextLoad(url, { ...context, format: 'module' });
  }
  return nextLoad(url, context);
}

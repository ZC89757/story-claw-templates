'use strict';
// Renderer-only preload: hide Windows console subprocesses, including library launches.
// Load before Remotion and inherit via NODE_OPTIONS for its Node worker processes.
const cp = require('node:child_process');
const {syncBuiltinESMExports} = require('node:module');
const {promisify} = require('node:util');
const key = Symbol.for('story-claw.hidden-render-processes');
if (process.platform === 'win32' && !cp[key]) {
  Object.defineProperty(cp, key, {value: true});
  for (const name of ['spawn', 'spawnSync', 'execFile', 'execFileSync', 'exec', 'execSync', 'fork']) {
    const original = cp[name];
    const rewrite = (incoming) => {
      const args = [...incoming];
      const optionsIndex = name === 'exec' || name === 'execSync'
        ? 1
        : Array.isArray(args[1]) || (args[1] === undefined && args.length > 2) ? 2 : 1;
      if (typeof args[optionsIndex] === 'function') args.splice(optionsIndex, 0, {windowsHide: true});
      else args[optionsIndex] = {...(args[optionsIndex] || {}), windowsHide: true};
      return args;
    };
    const wrapped = function (...args) {
      const result = Reflect.apply(original, this, rewrite(args));
      if (process.env.MG_RENDER_PROCESS_AUDIT) {
        try { require('node:fs').appendFileSync(process.env.MG_RENDER_PROCESS_AUDIT, JSON.stringify({method:name,executable:require('node:path').basename(String(args[0])),windowsHide:true,parentPid:process.pid,pid:result?.pid??null})+'\n'); } catch {}
      }
      return result;
    };
    if (original[promisify.custom]) {
      wrapped[promisify.custom] = function (...args) {
        return Reflect.apply(original[promisify.custom], this, rewrite(args));
      };
    }
    cp[name] = wrapped;
  }
  syncBuiltinESMExports();
  const preloadPath = __filename.replaceAll('\\', '/');
  const preload = '--require=' + JSON.stringify(preloadPath);
  if (!(process.env.NODE_OPTIONS || '').includes(preloadPath)) {
    process.env.NODE_OPTIONS = [process.env.NODE_OPTIONS || '', preload].filter(Boolean).join(' ');
  }
}

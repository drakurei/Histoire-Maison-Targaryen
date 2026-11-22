// Runs a heavy command (tsc, Chrome, content build) only once no other is running.
// Several agents share a machine with little memory: this lock serializes those commands.
// Usage: node scripts/serial.mjs <command> [arguments…]
// Example: node scripts/serial.mjs npx tsc -b --noEmit
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const LOCK = path.resolve('node_modules/.tmp/heavy.lock');
const STALE_MS = 45 * 60 * 1000; // a lock older than 45 minutes is considered abandoned (a full link audit can take 15)
const [cmd, ...args] = process.argv.slice(2);

if (!cmd) {
  console.error('Usage: node scripts/serial.mjs <command> [arguments…]');
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function acquire() {
  fs.mkdirSync(path.dirname(LOCK), { recursive: true });
  let announced = false;
  for (;;) {
    try {
      fs.mkdirSync(LOCK); // atomic: fails if the lock already exists
      fs.writeFileSync(path.join(LOCK, 'owner'), `${process.pid} ${cmd} ${args.join(' ')}`);
      return;
    } catch {
      try {
        if (Date.now() - fs.statSync(LOCK).mtimeMs > STALE_MS) {
          fs.rmSync(LOCK, { recursive: true, force: true });
          continue;
        }
      } catch {
        continue; // lock released between the two calls
      }
      if (!announced) {
        console.error('Waiting: another heavy command is running…');
        announced = true;
      }
      await sleep(1500);
    }
  }
}

function release() {
  fs.rmSync(LOCK, { recursive: true, force: true });
}

await acquire();
process.on('SIGINT', () => {
  release();
  process.exit(130);
});
// Under Windows, npx and npm are .cmd scripts: they need a shell. Each argument is
// therefore quoted by hand, so the shell receives exactly what was passed.
const quote = (a) => (/[\s"'()&|<>^%!]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a);
const child =
  process.platform === 'win32'
    ? spawn([cmd, ...args].map(quote).join(' '), { stdio: 'inherit', shell: true })
    : spawn(cmd, args, { stdio: 'inherit' });
child.on('exit', (code) => {
  release();
  process.exit(code ?? 1);
});
child.on('error', (err) => {
  release();
  console.error(String(err));
  process.exit(1);
});

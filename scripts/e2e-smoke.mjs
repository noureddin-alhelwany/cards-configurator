import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repoRoot = path.dirname(fileURLToPath(new URL('.', import.meta.url)));
const backendUrl = 'http://127.0.0.1:8000';
const frontendUrl = 'http://127.0.0.1:5173';

const children = [];
let shuttingDown = false;

function start(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: options.cwd ?? repoRoot,
    env: {
      ...process.env,
      ...options.env,
    },
    stdio: 'inherit',
  });

  children.push(child);
  child.on('error', (error) => {
    if (!process.exitCode) {
      process.exitCode = 1;
    }
    console.error(error);
  });
  child.on('exit', (code) => {
    if (!shuttingDown && code !== 0 && !process.exitCode) {
      process.exitCode = code ?? 1;
    }
  });
  return child;
}

async function waitFor(url, label) {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return response;
      }
    } catch {
      // Retry until the service comes up.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`${label} did not become ready at ${url}`);
}

function cleanup() {
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  }
}

process.on('SIGINT', () => {
  cleanup();
  process.exit(130);
});

process.on('SIGTERM', () => {
  cleanup();
  process.exit(143);
});

start(path.join(repoRoot, 'backend/.venv/bin/python'), [
  '-m',
  'uvicorn',
  'cards_configurator_backend.app:app',
  '--host',
  '127.0.0.1',
  '--port',
  '8000',
]);
start('corepack', ['pnpm', '--dir', 'frontend', 'exec', 'vite', '--host', '0.0.0.0', '--port', '5173'], {
  env: {
    COREPACK_HOME: '/tmp/corepack',
  },
});

await waitFor(`${backendUrl}/api/healthz`, 'Backend');
const frontendResponse = await waitFor(frontendUrl, 'Frontend');
const frontendHtml = await frontendResponse.text();
const healthResponse = await fetch(`${backendUrl}/api/healthz`);
const health = await healthResponse.json();

if (!frontendHtml.includes('Cards Configurator')) {
  throw new Error('Frontend shell did not render the expected title.');
}

if (health.status !== 'ok') {
  throw new Error('Backend health endpoint did not return ok.');
}

console.log('Bootstrap end-to-end smoke passed.');
cleanup();

await new Promise((resolve) => {
  let remaining = children.length;
  for (const child of children) {
    child.on('exit', () => {
      remaining -= 1;
      if (remaining === 0) {
        resolve();
      }
    });
  }
});

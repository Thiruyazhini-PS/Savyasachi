import { spawn } from 'child_process';
import http from 'http';
import path from 'path';

function getWebSocketDebuggerUrl(port) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://127.0.0.1:${port}/json`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const targets = JSON.parse(data);
          const pageTarget = targets.find(t => t.type === 'page');
          resolve(pageTarget.webSocketDebuggerUrl);
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
  });
}

async function run() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const port = 9241;
  const userDataDir = path.resolve(`./.tmp_edge_test_tex_${Date.now()}`);

  const edgeProc = spawn(edgePath, [
    `--remote-debugging-port=${port}`,
    '--headless=new',
    '--disable-gpu',
    `--user-data-dir=${userDataDir}`,
    'http://localhost:5173/'
  ]);

  await new Promise(r => setTimeout(r, 2500));
  const wsUrl = await getWebSocketDebuggerUrl(port);
  const WS = globalThis.WebSocket;
  const ws = new WS(wsUrl);

  let id = 1;
  const callbacks = new Map();
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      callbacks.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      console.log('[BROWSER LOG]', msg.params.type, msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' '));
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      console.error('[BROWSER EXCEPTION]', msg.params.exceptionDetails);
    }
    if (msg.id && callbacks.has(msg.id)) {
      const cb = callbacks.get(msg.id);
      callbacks.delete(msg.id);
      if (msg.error) cb.reject(msg.error);
      else cb.resolve(msg.result);
    }
  };

  await new Promise((resolve) => ws.onopen = resolve);
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Page.navigate', { url: 'http://localhost:5173/' });
  await new Promise(r => setTimeout(r, 2500));

  console.log('Testing image fetch directly in browser:');
  const fetchCheck = await send('Runtime.evaluate', {
    expression: `(async () => {
      try {
        const res = await fetch('/assets/room02_hall_wide.jpg');
        return { status: res.status, ok: res.ok, type: res.headers.get('content-type') };
      } catch (err) {
        return { error: err.message };
      }
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  console.log('Fetch result:', fetchCheck.result.value);

  console.log('Now testing WorldEngine texture swap:');
  const swapCheck = await send('Runtime.evaluate', {
    expression: `(async () => {
      try {
        const we = window.WorldEngine;
        // let's see what is on window
        const keys = Object.keys(window).filter(k => k.toLowerCase().includes('engine') || k.toLowerCase().includes('world'));
        return { windowEngineKeys: keys, hasApp: !!window.app };
      } catch (err) {
        return { error: err.message };
      }
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  console.log('Engine keys:', swapCheck.result.value);

  edgeProc.kill();
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });

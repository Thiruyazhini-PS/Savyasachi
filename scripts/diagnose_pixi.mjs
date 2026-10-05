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
          const pageTarget = targets.find(t => t.type === 'page') || targets[0];
          resolve(pageTarget.webSocketDebuggerUrl);
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
  });
}

async function run() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const port = 9243;
  const userDataDir = path.resolve(`./.tmp_edge_diag_pixi_${Date.now()}`);

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
  await new Promise(r => setTimeout(r, 3000));

  for (let i = 0; i < 20; i++) {
    const ready = await send('Runtime.evaluate', {
      expression: '!!(window.app && window.chakravyuha)',
      returnByValue: true
    });
    if (ready.result.value) break;
    await new Promise(r => setTimeout(r, 300));
  }

  console.log('Evaluating Pixi WorldEngine state:');
  const res = await send('Runtime.evaluate', {
    expression: `(() => {
      const app = window.app || window.chakravyuha?.app;
      const we = window.chakravyuha?.WorldEngine || (app ? Object.getPrototypeOf(app) : null);
      // Let's get WorldEngine through app if possible or find it
      return {
        hasApp: !!app,
        currentRoomId: app?.currentRoomId,
        currentScene: app?.currentScene
      };
    })()`,
    returnByValue: true
  });
  console.log('State:', res.result.value);

  // Let's inspect WorldEngine by exposing it on window in main.ts or evaluating through import
  const pixiTest = await send('Runtime.evaluate', {
    expression: `(async () => {
      try {
        const { Assets } = await import('pixi.js');
        console.log('Pixi Assets import successful:', !!Assets);
        const tex = await Assets.load('/assets/room02_hall_wide.jpg');
        console.log('Texture loaded:', tex.width, tex.height);
        return { success: true, width: tex.width, height: tex.height };
      } catch (e) {
        console.error('Pixi load error:', e);
        return { error: e.message, stack: e.stack };
      }
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  console.log('Pixi test result:', pixiTest.result.value);

  edgeProc.kill();
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });

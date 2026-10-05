import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
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
  const port = 9245;
  const userDataDir = path.resolve(`./.tmp_edge_verify_${Date.now()}`);

  console.log('Launching Edge...');
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
  console.log('Waiting for window.app to be ready...');
  for (let i = 0; i < 30; i++) {
    const ready = await send('Runtime.evaluate', {
      expression: '!!(window.app || (window.chakravyuha && window.chakravyuha.app))',
      returnByValue: true
    });
    if (ready.result.value) {
      console.log('window.app is ready!');
      break;
    }
    await new Promise(r => setTimeout(r, 400));
  }

  await send('Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false
  });

  // Check pointer events on btn-tab-room2
  const checkPointer = await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.getElementById('btn-tab-room2');
      const nav = document.getElementById('room-switcher-nav');
      return {
        btnExists: !!btn,
        btnPointerEvents: btn ? window.getComputedStyle(btn).pointerEvents : null,
        navPointerEvents: nav ? window.getComputedStyle(nav).pointerEvents : null
      };
    })()`,
    returnByValue: true
  });
  console.log('Pointer Events Check:', checkPointer.result.value);

  // Click btn-tab-room2
  console.log('Clicking btn-tab-room2...');
  await send('Runtime.evaluate', {
    expression: `document.getElementById('btn-tab-room2')?.click();`
  });

  await new Promise(r => setTimeout(r, 1200));

  // Skip cinematic to see living hall
  await send('Runtime.evaluate', {
    expression: `window.app?.skipRoomEntranceCinematic();`
  });
  await new Promise(r => setTimeout(r, 800));

  // Capture screenshot of room 2
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('public/test_screenshots/verify_room2_entered.png', Buffer.from(shot.data, 'base64'));
  console.log('Saved screenshot: public/test_screenshots/verify_room2_entered.png');

  edgeProc.kill();
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });

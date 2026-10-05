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
  const port = 9247;
  const userDataDir = path.resolve(`./.tmp_edge_manhwa_${Date.now()}`);

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

  for (let i = 0; i < 30; i++) {
    const ready = await send('Runtime.evaluate', {
      expression: '!!(window.app && document.getElementById("btn-manhwa-room2"))',
      returnByValue: true
    });
    if (ready.result.value) break;
    await new Promise(r => setTimeout(r, 400));
  }

  await send('Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false
  });

  // Capture screenshot of Manhwa Header showing Room 2 button
  const shot1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('public/test_screenshots/verify_manhwa_header_room2_btn.png', Buffer.from(shot1.data, 'base64'));

  // Click btn-manhwa-room2
  console.log('Clicking btn-manhwa-room2 on Manhwa Header...');
  await send('Runtime.evaluate', {
    expression: `document.getElementById('btn-manhwa-room2')?.click();`
  });
  await new Promise(r => setTimeout(r, 1200));

  // Skip cinematic to confirm living chamber is showing
  await send('Runtime.evaluate', {
    expression: `window.app?.skipRoomEntranceCinematic();`
  });
  await new Promise(r => setTimeout(r, 600));

  const state = await send('Runtime.evaluate', {
    expression: `({
      currentRoomId: window.app?.currentRoomId,
      manhwaHidden: document.getElementById('manhwa-container')?.classList.contains('hidden'),
      viewportHidden: document.getElementById('viewport-stage')?.classList.contains('hidden'),
      backdropClass: document.getElementById('room-backdrop-layer')?.className
    })`,
    returnByValue: true
  });
  console.log('Room 2 State after clicking header button:', state.result.value);

  const shot2 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('public/test_screenshots/verify_manhwa_direct_room2.png', Buffer.from(shot2.data, 'base64'));

  edgeProc.kill();
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });

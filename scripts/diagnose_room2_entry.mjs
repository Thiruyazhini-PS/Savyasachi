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
          const pageTarget = targets.find(t => t.type === 'page');
          if (pageTarget && pageTarget.webSocketDebuggerUrl) {
            resolve(pageTarget.webSocketDebuggerUrl);
          } else if (targets[0] && targets[0].webSocketDebuggerUrl) {
            resolve(targets[0].webSocketDebuggerUrl);
          } else {
            reject(new Error('No page target with ws url'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.method === 'Runtime.consoleAPICalled') {
          console.log('[BROWSER LOG]', msg.params.type, msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' '));
        }
        if (msg.method === 'Runtime.exceptionThrown') {
          console.error('[BROWSER EXCEPTION]', JSON.stringify(msg.params.exceptionDetails));
        }
        if (msg.id && this.callbacks.has(msg.id)) {
          const cb = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) cb.reject(msg.error);
          else cb.resolve(msg.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expr) {
    const res = await this.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (res.exceptionDetails) {
      console.error('[EVAL EXCEPTION]', res.exceptionDetails);
      throw new Error(res.exceptionDetails.text || 'Eval error');
    }
    return res.result ? res.result.value : undefined;
  }
}

async function run() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const port = 9239;
  const userDataDir = path.resolve(`./.tmp_edge_diag_${Date.now()}`);

  console.log('Launching Edge for diagnostic...');
  const edgeProc = spawn(edgePath, [
    `--remote-debugging-port=${port}`,
    '--headless=new',
    '--disable-gpu',
    `--user-data-dir=${userDataDir}`,
    'http://localhost:5173/'
  ]);

  await new Promise(r => setTimeout(r, 2500));
  const wsUrl = await getWebSocketDebuggerUrl(port);
  const client = new CDPClient(wsUrl);
  await client.connect();

  await client.send('Runtime.enable');
  await client.send('Page.enable');

  console.log('Navigating to http://localhost:5173/ ...');
  await client.send('Page.navigate', { url: 'http://localhost:5173/' });
  await new Promise(r => setTimeout(r, 2000));

  for (let i = 0; i < 20; i++) {
    const ready = await client.eval('!!(window.app && window.chakravyuha)');
    if (ready) break;
    await new Promise(r => setTimeout(r, 300));
  }

  console.log('Checking state on initial page load:');
  const info = await client.eval(`
    (() => {
      return {
        title: document.title,
        hasApp: typeof window.app !== 'undefined',
        currentRoomId: window.app ? window.app.currentRoomId : null,
        currentScene: window.app ? window.app.currentScene : null,
        tab1Exists: !!document.getElementById('btn-tab-room1'),
        tab2Exists: !!document.getElementById('btn-tab-room2'),
        audioPromptHidden: document.getElementById('audio-init-prompt')?.classList.contains('hidden'),
        viewportStageHidden: document.getElementById('viewport-stage')?.classList.contains('hidden'),
        manhwaHidden: document.getElementById('manhwa-container')?.classList.contains('hidden'),
        cinematicModalHidden: document.getElementById('cinematic-modal')?.classList.contains('hidden'),
        entranceOverlayExists: !!document.getElementById('entrance-cinematic-overlay')
      };
    })()
  `);
  console.log('Initial DOM state:', JSON.stringify(info, null, 2));

  console.log('Now clicking #btn-tab-room2...');
  const clickRes = await client.eval(`
    (() => {
      const btn = document.getElementById('btn-tab-room2');
      if (!btn) return 'btn-tab-room2 not found!';
      btn.click();
      return {
        clicked: true,
        currentRoomId: window.app?.currentRoomId,
        actTag: document.getElementById('act-tag')?.innerText,
        chapterTitle: document.getElementById('chapter-title')?.innerText,
        worldScene: window.chakravyuha?.WorldEngine?.currentRoomScene || 'unknown',
        viewportHidden: document.getElementById('viewport-stage')?.classList.contains('hidden'),
        manhwaHidden: document.getElementById('manhwa-container')?.classList.contains('hidden'),
        interactiveEntitiesCount: document.querySelectorAll('#interactive-scene .interactive-hotspot').length
      };
    })()
  `);
  console.log('After clicking #btn-tab-room2:', JSON.stringify(clickRes, null, 2));

  // Wait 1 second and check if any cinematic overlay or element is blocking
  await new Promise(r => setTimeout(r, 1000));
  const overlayCheck = await client.eval(`
    (() => {
      const overlay = document.getElementById('entrance-cinematic-overlay');
      return {
        overlayExists: !!overlay,
        overlayOpacity: overlay ? window.getComputedStyle(overlay).opacity : null,
        overlayDisplay: overlay ? window.getComputedStyle(overlay).display : null,
        overlayPointerEvents: overlay ? window.getComputedStyle(overlay).pointerEvents : null,
        ambientText: document.getElementById('ambient-ticker-text')?.innerText,
        speechBubbles: document.querySelectorAll('.speech-bubble').length
      };
    })()
  `);
  console.log('Overlay & Scene Check after 1s:', JSON.stringify(overlayCheck, null, 2));

  // Take screenshot
  const shot = await client.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('public/test_screenshots/diag_click_room2.png', Buffer.from(shot.data, 'base64'));
  console.log('Screenshot saved to public/test_screenshots/diag_click_room2.png');

  edgeProc.kill();
}

run().catch(console.error);

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
  const port = 9258;
  const userDataDir = path.resolve(`./.tmp_edge_verify_${Date.now()}`);

  const edgeProc = spawn(edgePath, [
    `--remote-debugging-port=${port}`,
    '--headless=new',
    '--disable-gpu',
    `--user-data-dir=${userDataDir}`,
    'http://localhost:5173/'
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
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
        console.log('[BROWSER CONSOLE]', msg.params.type, msg.params.args.map(a => a.value || a.description).join(' '));
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

    await send('Emulation.setDeviceMetricsOverride', {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      mobile: false
    });

    console.log('Waiting for window.app to initialize...');
    for (let i = 0; i < 60; i++) {
      const res = await send('Runtime.evaluate', {
        expression: '!!(window.app)',
        returnByValue: true
      });
      if (res.result && res.result.value) {
        console.log('window.app is ready!');
        break;
      }
      await new Promise(r => setTimeout(r, 500));
    }

    // Dismiss audio modal
    console.log('Clicking btn-enter-story...');
    await send('Runtime.evaluate', {
      expression: `
        const btn = document.getElementById("btn-enter-story");
        if (btn) btn.click();
      `
    });
    await new Promise(r => setTimeout(r, 1000));

    // Click Enter Room 2 button or call directly
    console.log('Transitioning to room 2...');
    const callRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          try {
            if (window.app) {
              window.app.transitionToGrandChamber(false);
              return { success: true, via: 'window.app.transitionToGrandChamber' };
            }
            const btn = document.getElementById("btn-manhwa-room2");
            if (btn) {
              btn.click();
              return { success: true, via: 'btn-manhwa-room2.click' };
            }
            return { error: 'Neither window.app nor btn found' };
          } catch(e) {
            return { error: e.message, stack: e.stack };
          }
        })()
      `,
      returnByValue: true
    });
    console.log('Call result:', callRes.result.value);

    // Wait until actor-kunti is present
    for (let i = 0; i < 40; i++) {
      const actorCheck = await send('Runtime.evaluate', {
        expression: '!!(document.getElementById("actor-kunti"))',
        returnByValue: true
      });
      if (actorCheck.result && actorCheck.result.value) {
        console.log('actor-kunti is present!');
        break;
      }
      await new Promise(r => setTimeout(r, 300));
    }

    // Wait for all images to fully load and decode
    console.log('Waiting for all actor images to finish loading...');
    await send('Runtime.evaluate', {
      expression: `
        new Promise((resolve) => {
          let attempts = 0;
          const check = () => {
            attempts++;
            const imgs = Array.from(document.querySelectorAll('.actor-avatar-img'));
            const loaded = imgs.filter(img => img.complete && img.naturalWidth > 0).length;
            console.log('Loaded images:', loaded, 'of', imgs.length);
            if ((imgs.length > 0 && loaded >= imgs.length) || attempts > 30) {
              resolve({ loaded, total: imgs.length, attempts });
            } else {
              setTimeout(check, 300);
            }
          };
          check();
        })
      `,
      awaitPromise: true
    });

    // Inspect DOM diagnostics
    const backdropInfo = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const el = document.getElementById('room-backdrop-layer');
          const canvas = document.getElementById('world-canvas');
          const stage = document.getElementById('viewport-stage');
          return {
            backdrop: {
              className: el?.className,
              computedBg: el ? window.getComputedStyle(el).backgroundImage : null,
              rect: el?.getBoundingClientRect()
            },
            canvas: {
              width: canvas?.width,
              height: canvas?.height,
              rect: canvas?.getBoundingClientRect(),
              styleBg: canvas ? window.getComputedStyle(canvas).backgroundColor : null
            },
            stage: {
              className: stage?.className,
              rect: stage?.getBoundingClientRect()
            }
          };
        })()
      `,
      returnByValue: true
    });
    console.log('DOM DIAGNOSTICS:', JSON.stringify(backdropInfo.result.value, null, 2));

    // Inspect all actor nodes in the scene
    const actorData = await send('Runtime.evaluate', {
      expression: `
        Array.from(document.querySelectorAll('.scene-interactive-object')).map(el => {
          const rect = el.getBoundingClientRect();
          const img = el.querySelector('.actor-avatar-img');
          const name = el.querySelector('.actor-name')?.innerText;
          const role = el.querySelector('.actor-role')?.innerText;
          return {
            id: el.id,
            name,
            role,
            imgSrc: img ? img.getAttribute('src') : null,
            imgNaturalWidth: img ? img.naturalWidth : 0,
            rect: {
              left: Math.round(rect.left),
              top: Math.round(rect.top),
              width: Math.round(rect.width),
              height: Math.round(rect.height)
            }
          };
        })
      `,
      returnByValue: true
    });

    console.log('ACTOR DATA IN ROOM 2:');
    console.log(JSON.stringify(actorData.result ? actorData.result.value : actorData, null, 2));

    // Capture screenshot
    if (!fs.existsSync('public/test_screenshots')) {
      fs.mkdirSync('public/test_screenshots', { recursive: true });
    }
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/test_screenshots/current_room2_appearance.png', Buffer.from(shot.data, 'base64'));
    console.log('Screenshot saved to public/test_screenshots/current_room2_appearance.png');

    ws.close();
  } catch (e) {
    console.error('Error during verification:', e);
  } finally {
    edgeProc.kill();
  }
}

run();

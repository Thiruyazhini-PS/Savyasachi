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
  const port = 9260;
  const userDataDir = path.resolve(`./.tmp_edge_verify_final_${Date.now()}`);

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
    console.log('Dismissing audio modal...');
    await send('Runtime.evaluate', {
      expression: `
        const btn = document.getElementById("btn-enter-story");
        if (btn) btn.click();
      `
    });
    await new Promise(r => setTimeout(r, 800));

    // Transition to Room 2
    console.log('Transitioning to Grand Chamber...');
    await send('Runtime.evaluate', {
      expression: `
        window.app.transitionToGrandChamber(false);
        window.app.skipRoomEntranceCinematic();
      `
    });

    // Wait until all images are fully loaded
    console.log('Waiting for images to complete loading...');
    await send('Runtime.evaluate', {
      expression: `
        new Promise((resolve) => {
          let attempts = 0;
          const check = () => {
            attempts++;
            const imgs = Array.from(document.querySelectorAll('.actor-avatar-img'));
            const loaded = imgs.filter(img => img.complete && img.naturalWidth > 0).length;
            if ((imgs.length > 0 && loaded >= imgs.length) || attempts >= 40) {
              resolve({ loaded, total: imgs.length, attempts });
            } else {
              setTimeout(check, 250);
            }
          };
          check();
        })
      `,
      awaitPromise: true
    });

    await new Promise(r => setTimeout(r, 1200));

    // Detailed Actor Analysis & Overlap Check
    const analysis = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const actors = Array.from(document.querySelectorAll('.scene-interactive-object')).map(el => {
            const r = el.getBoundingClientRect();
            const img = el.querySelector('.actor-avatar-img');
            const name = el.querySelector('.actor-name')?.innerText || '';
            const role = el.querySelector('.actor-role')?.innerText || '';
            return {
              id: el.id,
              name,
              role,
              imgSrc: img ? img.getAttribute('src') : null,
              naturalWidth: img ? img.naturalWidth : 0,
              rect: {
                left: Math.round(r.left),
                top: Math.round(r.top),
                right: Math.round(r.right),
                bottom: Math.round(r.bottom),
                width: Math.round(r.width),
                height: Math.round(r.height),
                centerX: Math.round(r.left + r.width / 2),
                centerY: Math.round(r.top + r.height / 2)
              }
            };
          });

          // Overlap detection
          const overlaps = [];
          for (let i = 0; i < actors.length; i++) {
            for (let j = i + 1; j < actors.length; j++) {
              const a = actors[i];
              const b = actors[j];
              const xOverlap = Math.max(0, Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left));
              const yOverlap = Math.max(0, Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top));
              if (xOverlap > 0 && yOverlap > 0) {
                overlaps.push({
                  actorA: a.name,
                  actorB: b.name,
                  xOverlap,
                  yOverlap
                });
              }
            }
          }

          return {
            totalActors: actors.length,
            overlapsCount: overlaps.length,
            overlaps,
            actors
          };
        })()
      `,
      returnByValue: true
    });

    console.log('=== ACTOR OVERLAP & AUDIT REPORT ===');
    console.log('Total Actors:', analysis.result.value.totalActors);
    console.log('Overlaps Count:', analysis.result.value.overlapsCount);
    if (analysis.result.value.overlapsCount > 0) {
      console.warn('OVERLAPS DETECTED:', JSON.stringify(analysis.result.value.overlaps, null, 2));
    } else {
      console.log('PERFECT! ZERO OVERLAPS DETECTED BETWEEN ANY ACTORS!');
    }

    console.log('\nACTOR LIST WITH PORTRAITS:');
    analysis.result.value.actors.forEach(a => {
      console.log(`- ${a.name} (${a.role}) -> ${a.imgSrc} [Width: ${a.naturalWidth}px] at (${a.rect.centerX}, ${a.rect.centerY})`);
    });

    // Capture final high-res screenshot
    if (!fs.existsSync('public/test_screenshots')) {
      fs.mkdirSync('public/test_screenshots', { recursive: true });
    }
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/test_screenshots/verified_room2_final.png', Buffer.from(shot.data, 'base64'));
    console.log('\nSaved final screenshot to public/test_screenshots/verified_room2_final.png');

    ws.close();
  } catch (e) {
    console.error('Error during verification:', e);
  } finally {
    edgeProc.kill();
  }
}

run();

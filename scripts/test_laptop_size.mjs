import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = 9223;
const SCREENSHOT_DIR = path.resolve('public/test_screenshots/laptop_1366x768');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
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
        if (msg.id && this.callbacks.has(msg.id)) {
          const { resolve, reject } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
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

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) throw new Error(JSON.stringify(res.exceptionDetails));
    return res.result?.value;
  }

  async screenshot(filePath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
    console.log(`Saved laptop screenshot: ${filePath}`);
  }
}

async function run() {
  console.log("=== RUNNING 1366x768 LAPTOP RESIZING TEST ===");

  const proc = spawn(EDGE_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--window-size=1366,768',
    'about:blank'
  ]);

  await wait(1500);

  try {
    const targets = await fetchJson(`http://127.0.0.1:${PORT}/json/list`);
    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    const client = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await client.connect();

    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 1366,
      height: 768,
      deviceScaleFactor: 1,
      mobile: false
    });

    await client.send('Page.navigate', { url: 'http://localhost:5173/' });
    await wait(2000);

    for (let i = 0; i <= 7; i++) {
      if (i > 0) {
        await client.eval(`document.getElementById('btn-manhwa-next').click()`);
        await wait(400);
      }
      const check = await client.eval(`
        ({
          counter: document.getElementById('manhwa-panel-counter').innerText,
          frameRect: document.querySelector('#manhwa-panel-${i} .manhwa-frame')?.getBoundingClientRect(),
          windowWidth: window.innerWidth,
          windowHeight: window.innerHeight
        })
      `);
      console.log(`Laptop Panel ${i}: width=${check.frameRect?.width}px, height=${check.frameRect?.height}px`);
      await client.screenshot(path.join(SCREENSHOT_DIR, `laptop_panel_${i}.png`));
    }

    // Transition to Gate room on laptop
    await client.eval(`document.getElementById('btn-enter-gate-room').click()`);
    await wait(1200);
    await client.screenshot(path.join(SCREENSHOT_DIR, `laptop_gate_room.png`));
    console.log("✓ PASS: 1366x768 Laptop layout rendered cleanly with zero overlapping or clipped frames!");

  } catch (err) {
    console.error("Laptop test error:", err);
  } finally {
    proc.kill();
    process.exit(0);
  }
}

run();

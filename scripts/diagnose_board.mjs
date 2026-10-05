import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = 9226;
const SCREENSHOT_DIR = path.resolve('public/test_screenshots');

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

  async captureScreenshot(name) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const filePath = path.join(SCREENSHOT_DIR, name);
    fs.writeFileSync(filePath, buffer);
    console.log(`[SCREENSHOT] Saved: ${filePath} (${(buffer.length / 1024).toFixed(1)} KB)`);
    return filePath;
  }
}

async function run() {
  console.log("=== RUNNING BOARD DIAGNOSTICS ===");
  const edgeProcess = spawn(EDGE_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + path.resolve('.temp_edge_diag_profile')
  ]);

  try {
    let targets = null;
    for (let i = 0; i < 30; i++) {
      try {
        targets = await fetchJson(`http://127.0.0.1:${PORT}/json`);
        if (targets && targets.length > 0) break;
      } catch (_) {}
      await wait(300);
    }

    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      mobile: false
    });

    await cdp.send('Page.navigate', { url: 'http://localhost:5173/' });
    await wait(2000);

    // Open deduction drawer
    await cdp.eval(`document.getElementById('btn-deduction')?.click();`);
    await wait(500);

    await cdp.captureScreenshot('broken_current_state.png');

    const diagInfo = await cdp.eval(`(() => {
      const drawer = document.getElementById('deduction-drawer');
      const frame = document.getElementById('deduction-frame');
      const canvas = document.getElementById('deduction-canvas');
      const workspace = document.getElementById('board-workspace');
      const tray = document.getElementById('board-evidence-tray');
      const footer = document.querySelector('.drawer-footer.vellum-footer');
      const header = document.querySelector('.drawer-header.vellum-header');

      // Check all elements in deduction-drawer for CSS rules and classes
      const allElements = drawer ? Array.from(drawer.querySelectorAll('*')) : [];
      const classNamesWithoutRules = new Set();
      const styleSheets = Array.from(document.styleSheets);

      // Collect all css rules
      const allSelectors = [];
      styleSheets.forEach(sheet => {
        try {
          Array.from(sheet.cssRules || []).forEach(rule => {
            if (rule.selectorText) allSelectors.push(rule.selectorText);
          });
        } catch (e) {}
      });

      allElements.forEach(el => {
        Array.from(el.classList).forEach(cls => {
          const hasRule = allSelectors.some(sel => sel.includes('.' + cls));
          if (!hasRule) {
            classNamesWithoutRules.add(cls);
          }
        });
      });

      // Find any element wider than viewport
      const elementsWiderThanViewport = [];
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      document.querySelectorAll('*').forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width > vw + 1) {
          elementsWiderThanViewport.push({
            tag: el.tagName,
            id: el.id,
            className: el.className,
            width: rect.width,
            right: rect.right
          });
        }
      });

      // Get styles and computed values on board root & components
      const frameRect = frame ? frame.getBoundingClientRect() : null;
      const canvasRect = canvas ? canvas.getBoundingClientRect() : null;
      const workspaceRect = workspace ? workspace.getBoundingClientRect() : null;

      const frameStyle = frame ? window.getComputedStyle(frame) : null;
      const workspaceStyle = workspace ? window.getComputedStyle(workspace) : null;
      const canvasStyle = canvas ? window.getComputedStyle(canvas) : null;

      return {
        viewport: { width: vw, height: vh },
        drawerVisible: drawer && !drawer.classList.contains('hidden'),
        frameRect,
        workspaceRect,
        canvasRect,
        canvasComputedSize: {
          width: canvas ? canvas.width : 0,
          height: canvas ? canvas.height : 0,
          styleWidth: canvasStyle ? canvasStyle.width : '',
          styleHeight: canvasStyle ? canvasStyle.height : ''
        },
        frameComputed: {
          display: frameStyle?.display,
          width: frameStyle?.width,
          height: frameStyle?.height,
          background: frameStyle?.backgroundColor,
          overflow: frameStyle?.overflow
        },
        workspaceComputed: {
          display: workspaceStyle?.display,
          width: workspaceStyle?.width,
          height: workspaceStyle?.height,
          minHeight: workspaceStyle?.minHeight
        },
        classNamesWithoutRules: Array.from(classNamesWithoutRules),
        elementsWiderThanViewport
      };
    })()`);

    console.log("DIAGNOSTIC REPORT:");
    console.log(JSON.stringify(diagInfo, null, 2));

    cdp.close();
  } catch (err) {
    console.error("Diagnostic error:", err);
  } finally {
    edgeProcess.kill();
  }
}

run();

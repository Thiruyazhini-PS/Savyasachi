import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = 9228;
const SCREENSHOT_DIR = path.resolve('public/test_screenshots/board_rebuild');

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

  async setViewport(width, height) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false
    });
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
  console.log("=== COMPREHENSIVE INVESTIGATION BOARD ACCEPTANCE SUITE ===");
  const edgeProcess = spawn(EDGE_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + path.resolve('.temp_edge_board_full_profile')
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

    const consoleErrors = [];
    cdp.ws.addEventListener('message', (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
        consoleErrors.push(msg.params.args.map(a => a.value || a.description).join(' '));
      }
    });

    // 1. Initial State: Clear LocalStorage
    await cdp.setViewport(1920, 1080);
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/' });
    await wait(2000);
    await cdp.eval(`localStorage.removeItem('chakravyuha_deduction_state');`);
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/' });
    await wait(2000);

    // Open Deduction Board
    await cdp.eval(`document.getElementById('btn-deduction')?.click();`);
    await wait(600);

    // TEST 1A: 1920x1080 with 3 tray cards visible
    console.log("\n--- TEST 1A: 1920x1080 Initial Empty Board (3 tray cards) ---");
    await cdp.captureScreenshot('board_1920x1080_tray3.png');
    const check1920 = await cdp.eval(`(() => {
      const frame = document.getElementById('deduction-frame').getBoundingClientRect();
      const workspace = document.getElementById('board-workspace').getBoundingClientRect();
      const trayCards = document.querySelectorAll('.tray-card');
      const emptyHint = document.getElementById('deduction-empty-hint');
      const title = document.querySelector('.board-heading');
      return {
        frameWidth: frame.width,
        frameHeight: frame.height,
        workspaceHeight: workspace.height,
        trayCardsCount: trayCards.length,
        emptyHintText: emptyHint.innerText.trim(),
        titleText: title.innerText.trim(),
        hasOverflow: document.body.scrollWidth > window.innerWidth
      };
    })()`);
    console.log("1920x1080 Report:", check1920);

    // TEST 1B: 1366x768 with 3 tray cards visible
    console.log("\n--- TEST 1B: 1366x768 Initial Empty Board (3 tray cards) ---");
    await cdp.setViewport(1366, 768);
    await wait(500);
    await cdp.eval(`window.dispatchEvent(new Event('resize'));`);
    await wait(300);
    await cdp.captureScreenshot('board_1366x768_tray3.png');
    const check1366 = await cdp.eval(`(() => {
      const frame = document.getElementById('deduction-frame').getBoundingClientRect();
      const workspace = document.getElementById('board-workspace').getBoundingClientRect();
      const trayCards = document.querySelectorAll('.tray-card');
      return {
        frameWidth: frame.width,
        frameHeight: frame.height,
        workspaceHeight: workspace.height,
        trayCardsCount: trayCards.length,
        hasOverflow: document.body.scrollWidth > window.innerWidth
      };
    })()`);
    console.log("1366x768 Report:", check1366);

    // TEST 1C: 1024x768 with 3 tray cards visible
    console.log("\n--- TEST 1C: 1024x768 Initial Empty Board (3 tray cards) ---");
    await cdp.setViewport(1024, 768);
    await wait(500);
    await cdp.eval(`window.dispatchEvent(new Event('resize'));`);
    await wait(300);
    await cdp.captureScreenshot('board_1024x768_tray3.png');
    const check1024 = await cdp.eval(`(() => {
      const frame = document.getElementById('deduction-frame').getBoundingClientRect();
      const workspace = document.getElementById('board-workspace').getBoundingClientRect();
      const trayCards = document.querySelectorAll('.tray-card');
      return {
        frameWidth: frame.width,
        frameHeight: frame.height,
        workspaceHeight: workspace.height,
        trayCardsCount: trayCards.length,
        hasOverflow: document.body.scrollWidth > window.innerWidth
      };
    })()`);
    console.log("1024x768 Report:", check1024);

    // TEST 2: Drag/Click two cards onto the board and link them
    console.log("\n--- TEST 2: Place Cards and Link with Ink Yarn ---");
    await cdp.setViewport(1920, 1080);
    await wait(400);

    await cdp.eval(`(() => {
      const cards = document.querySelectorAll('.tray-card');
      if (cards[0]) cards[0].click();
      if (cards[1]) cards[1].click();
    })()`);
    await wait(500);

    // Link cards
    await cdp.eval(`(() => {
      const boardCards = Array.from(document.querySelectorAll('.evidence-card')).map(c => c.id.replace('card_', ''));
      if (boardCards.length >= 2) {
        const dot1 = document.querySelector('#card_' + boardCards[0] + ' .evidence-card-pin');
        const dot2 = document.querySelector('#card_' + boardCards[1] + ' .evidence-card-pin');
        dot1.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        dot2.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      }
    })()`);
    await wait(600);

    await cdp.captureScreenshot('board_1920x1080_cards_linked.png');

    const checkLinked = await cdp.eval(`(() => {
      return {
        boardCards: document.querySelectorAll('.evidence-card').length,
        trayCards: document.querySelectorAll('.tray-card').length,
        stringsCounter: document.getElementById('deduction-strings-counter')?.innerText,
        deductionCount: document.getElementById('deduction-count')?.innerText,
        emptyHintHidden: document.getElementById('deduction-empty-hint').classList.contains('hidden')
      };
    })()`);
    console.log("Linked Cards Report:", checkLinked);

    // TEST 3: Hypothesis Selection and Testing
    console.log("\n--- TEST 3: Hypothesis Selection & 'Test this idea' ---");
    await cdp.eval(`(() => {
      const select = document.getElementById('deduction-hypothesis-select');
      select.value = 'fire_trap';
      select.dispatchEvent(new Event('change'));
    })()`);
    await wait(300);

    const checkHypoReady = await cdp.eval(`(() => {
      const btn = document.getElementById('btn-synthesize');
      const eureka = document.getElementById('deduction-eureka');
      return {
        btnDisabled: btn.disabled,
        eurekaVisible: !eureka.classList.contains('hidden')
      };
    })()`);
    console.log("Hypothesis Readiness:", checkHypoReady);

    // Click "Test this idea"
    await cdp.eval(`document.getElementById('btn-synthesize').click();`);
    await wait(600);
    await cdp.captureScreenshot('board_hypothesis_tested.png');

    const checkFeedback = await cdp.eval(`(() => {
      const feedback = document.getElementById('deduction-feedback');
      return {
        feedbackVisible: !feedback.classList.contains('hidden'),
        feedbackText: feedback.innerText.trim().substring(0, 80) + '...',
        deductionCount: document.getElementById('deduction-count')?.innerText
      };
    })()`);
    console.log("Feedback Report:", checkFeedback);

    // TEST 4: Page Reload and Persistence Confirmation
    console.log("\n--- TEST 4: Reload and Persistence Verification ---");
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/' });
    await wait(2200);

    // Reopen board with 'B' key
    await cdp.eval(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b' }));`);
    await wait(600);
    await cdp.captureScreenshot('board_reloaded_persistence.png');

    const checkPersistence = await cdp.eval(`(() => {
      const boardCards = document.querySelectorAll('.evidence-card');
      const trayCards = document.querySelectorAll('.tray-card');
      const strings = document.getElementById('deduction-strings-counter')?.innerText;
      const count = document.getElementById('deduction-count')?.innerText;
      const selectVal = document.getElementById('deduction-hypothesis-select')?.value;
      return {
        boardCards: boardCards.length,
        trayCards: trayCards.length,
        stringsCounter: strings,
        deductionCount: count,
        persistedHypothesis: selectVal
      };
    })()`);
    console.log("Persistence Report:", checkPersistence);

    // TEST 5: Close Seal and Keyboard Shortcuts
    console.log("\n--- TEST 5: Seal Close, B key, Esc key ---");
    // Click seal
    await cdp.eval(`document.getElementById('btn-close-deduction').click();`);
    await wait(300);
    const closedSeal = await cdp.eval(`document.getElementById('deduction-drawer').classList.contains('hidden')`);
    console.log("Closed via round wax seal:", closedSeal);

    // Open with 'b'
    await cdp.eval(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b' }));`);
    await wait(300);
    const openedB = await cdp.eval(`!document.getElementById('deduction-drawer').classList.contains('hidden')`);
    console.log("Opened via 'b' key:", openedB);

    // Close with 'Escape'
    await cdp.eval(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));`);
    await wait(300);
    const closedEsc = await cdp.eval(`document.getElementById('deduction-drawer').classList.contains('hidden')`);
    console.log("Closed via 'Escape' key:", closedEsc);

    // TEST 6: Clear Strings Button
    console.log("\n--- TEST 6: Clear Strings Button ---");
    await cdp.eval(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b' }));`);
    await wait(300);
    await cdp.eval(`document.getElementById('btn-clear-yarn').click();`);
    await wait(400);
    await cdp.captureScreenshot('board_cleared.png');
    const checkCleared = await cdp.eval(`(() => {
      return {
        stringsText: document.getElementById('deduction-strings-counter')?.innerText,
        connectionsInStorage: JSON.parse(localStorage.getItem('chakravyuha_deduction_state') || '{}').connections?.length
      };
    })()`);
    console.log("Cleared Strings Report:", checkCleared);

    console.log("\nConsole errors encountered:", consoleErrors);
    console.log("=== ALL ACCEPTANCE TESTS FINISHED ===");

  } catch (err) {
    console.error("Test error:", err);
  } finally {
    edgeProcess.kill();
  }
}

run();

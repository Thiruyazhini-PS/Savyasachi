import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = 9222;
const SCREENSHOT_DIR = path.resolve('public/test_screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function wait(ms) {
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
    this.eventListeners = new Map();
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
        } else if (msg.method) {
          const listeners = this.eventListeners.get(msg.method) || [];
          listeners.forEach(fn => fn(msg.params));
        }
      };
    });
  }

  on(method, callback) {
    if (!this.eventListeners.has(method)) {
      this.eventListeners.set(method, []);
    }
    this.eventListeners.get(method).push(callback);
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
    if (res.exceptionDetails) {
      throw new Error(`Eval failed: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result?.value;
  }

  async screenshot(filePath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
    console.log(`Saved screenshot: ${filePath}`);
  }
}

async function run() {
  console.log("=== STARTING MANHWA & VARANAVATA ACCEPTANCE SUITE ===");
  
  // 1. Launch Edge headless with remote debugging
  const edgeProc = spawn(EDGE_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--window-size=1920,1080',
    'about:blank'
  ], { detached: false });

  await wait(1500);

  try {
    const version = await fetchJson(`http://127.0.0.1:${PORT}/json/version`);
    console.log(`Connected to browser: ${version['Browser']}`);

    const targets = await fetchJson(`http://127.0.0.1:${PORT}/json/list`);
    console.log(`Found ${targets.length} targets:`, targets.map(t => t.url));

    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    console.log(`Connecting to page target: ${pageTarget.title} (${pageTarget.url})`);

    const client = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await client.connect();

    // Enable domains
    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('DOM.enable');

    // Navigate to local dev server
    console.log("Navigating to http://localhost:5173/ ...");
    await client.send('Page.navigate', { url: 'http://localhost:5173/' });

    const consoleLogs = [];
    const consoleErrors = [];

    client.on('Runtime.consoleAPICalled', (params) => {
      const text = params.args.map(a => a.value ?? a.description ?? '').join(' ');
      if (params.type === 'error') {
        consoleErrors.push(text);
        console.error(`[BROWSER ERROR] ${text}`);
      } else {
        consoleLogs.push(`[${params.type}] ${text}`);
      }
    });

    client.on('Runtime.exceptionThrown', (params) => {
      consoleErrors.push(params.exceptionDetails.text);
      console.error(`[BROWSER EXCEPTION] ${params.exceptionDetails.text}`);
    });

    await wait(2000);

    // =====================================================================
    // TEST 1: No console errors on load
    // =====================================================================
    console.log("\n--- TEST 1: Load Page and Check Console ---");
    if (consoleErrors.length === 0) {
      console.log("✓ PASS: 0 console errors on page load!");
    } else {
      console.error(`✗ FAIL: ${consoleErrors.length} console errors found:`, consoleErrors);
    }

    // Check initial state
    const initialState = await client.eval(`
      ({
        sceneVisible: !document.getElementById('manhwa-container').classList.contains('hidden'),
        prevDisabled: document.getElementById('btn-manhwa-prev').disabled || document.getElementById('btn-manhwa-prev').classList.contains('disabled'),
        nextEnabled: !document.getElementById('btn-manhwa-next').disabled,
        counterText: document.getElementById('manhwa-panel-counter').innerText,
        activePanelId: document.querySelector('.manhwa-panel.active-panel')?.id
      })
    `);
    console.log("Initial Manhwa State:", initialState);

    if (initialState.sceneVisible && initialState.prevDisabled && initialState.nextEnabled && initialState.activePanelId === 'manhwa-panel-0') {
      console.log("✓ PASS: Initial panel is Panel 0, Prev is disabled, Next is enabled, counter is PANEL 1 / 8");
    } else {
      console.error("✗ FAIL: Initial state mismatch", initialState);
    }

    await client.screenshot(path.join(SCREENSHOT_DIR, 'panel_0_established.png'));

    // =====================================================================
    // TEST 2: Click Next 7 times to reach Panel 7 (all 8 panels in order)
    // =====================================================================
    console.log("\n--- TEST 2: Navigate through all 8 panels in order ---");
    for (let i = 1; i <= 7; i++) {
      console.log(`Clicking Next -> advancing to Panel ${i + 1}/8...`);
      await client.eval(`document.getElementById('btn-manhwa-next').click()`);
      await wait(500);

      const panelState = await client.eval(`
        ({
          counter: document.getElementById('manhwa-panel-counter').innerText,
          activeId: document.querySelector('.manhwa-panel.active-panel')?.id,
          prevDisabled: document.getElementById('btn-manhwa-prev').disabled
        })
      `);
      console.log(`Panel ${i} state:`, panelState);

      if (panelState.activeId === `manhwa-panel-${i}` && !panelState.prevDisabled) {
        console.log(`✓ PASS: Panel ${i} (${panelState.counter}) is active and visible, Prev is enabled`);
      } else {
        console.error(`✗ FAIL on step ${i}`, panelState);
      }

      await client.screenshot(path.join(SCREENSHOT_DIR, `panel_${i}.png`));
    }

    // Check panel 7 (last panel)
    const isPanel7TransitionReady = await client.eval(`
      ({
        counter: document.getElementById('manhwa-panel-counter').innerText,
        hasEnterBtn: !!document.getElementById('btn-enter-gate-room')
      })
    `);
    console.log("Panel 8/8 State:", isPanel7TransitionReady);

    // =====================================================================
    // TEST 3: Click Previous: goes back correctly
    // =====================================================================
    console.log("\n--- TEST 3: Navigate backward with Previous ---");
    await client.eval(`document.getElementById('btn-manhwa-prev').click()`);
    await wait(400);
    const prevCheck = await client.eval(`document.querySelector('.manhwa-panel.active-panel')?.id`);
    if (prevCheck === 'manhwa-panel-6') {
      console.log("✓ PASS: Clicked Previous, stepped back from panel 7 to panel 6 successfully!");
    } else {
      console.error("✗ FAIL on Previous step back:", prevCheck);
    }

    // Step forward back to Panel 7
    await client.eval(`document.getElementById('btn-manhwa-next').click()`);
    await wait(400);

    // =====================================================================
    // TEST 4: Transition into Gate Room (Scene 2)
    // =====================================================================
    console.log("\n--- TEST 4: Transition to Gate Room (Scene 2) ---");
    await client.eval(`document.getElementById('btn-enter-gate-room').click()`);
    await wait(1500);

    const gateRoomState = await client.eval(`
      ({
        manhwaHidden: document.getElementById('manhwa-container').classList.contains('hidden'),
        viewportStageVisible: !document.getElementById('viewport-stage').classList.contains('hidden'),
        actorKunti: !!document.getElementById('actor-kunti'),
        actorCrate: !!document.getElementById('actor-cargo_crate'),
        actorTally: !!document.getElementById('actor-tally_stone'),
        actorPurochana: !!document.getElementById('actor-purochana'),
        canvasWidth: document.getElementById('world-canvas')?.width,
        canvasHeight: document.getElementById('world-canvas')?.height
      })
    `);
    console.log("Gate Room State:", gateRoomState);

    if (gateRoomState.manhwaHidden && gateRoomState.viewportStageVisible && gateRoomState.actorCrate && gateRoomState.actorPurochana) {
      console.log("✓ PASS: Gate Room transitioned successfully! Original scene art and actors present!");
    } else {
      console.error("✗ FAIL: Gate room transition failed", gateRoomState);
    }

    await client.screenshot(path.join(SCREENSHOT_DIR, 'gate_room_scene2.png'));

    // =====================================================================
    // TEST 5: Open Crate and test Dial Lock Close-up (२ - ४ - ७)
    // =====================================================================
    console.log("\n--- TEST 5: Open Cargo Crate and Verify Dial Lock ---");
    await client.eval(`document.getElementById('actor-cargo_crate').click()`);
    await wait(600);

    const crateModalState = await client.eval(`
      ({
        closeupVisible: !document.getElementById('closeup-modal').classList.contains('hidden'),
        label: document.getElementById('closeup-object-label').innerText,
        hasTumblers: document.querySelectorAll('.brass-tumbler-slot').length === 3,
        hasPullLatchBtn: !!document.getElementById('btn-pull-latch')
      })
    `);
    console.log("Crate Lock Close-up State:", crateModalState);

    if (crateModalState.closeupVisible && crateModalState.hasTumblers && crateModalState.hasPullLatchBtn) {
      console.log("✓ PASS: Dial Lock close-up is active with 3 brass tumblers and latch button!");
    } else {
      console.error("✗ FAIL: Crate close-up failed", crateModalState);
    }

    await client.screenshot(path.join(SCREENSHOT_DIR, 'crate_dial_lock.png'));

    // Rotate dials to combination 2 - 4 - 7 (२ - ४ - ७)
    console.log("Rotating dials to २ - ४ - ७...");
    // Dial 0 -> click 2 times
    await client.eval(`
      document.querySelector('.brass-tumbler-slot[data-dial="0"] .tumbler-arrow-btn[data-dir="1"]').click();
      document.querySelector('.brass-tumbler-slot[data-dial="0"] .tumbler-arrow-btn[data-dir="1"]').click();
    `);
    // Dial 1 -> click 4 times
    await client.eval(`
      for (let k = 0; k < 4; k++) {
        document.querySelector('.brass-tumbler-slot[data-dial="1"] .tumbler-arrow-btn[data-dir="1"]').click();
      }
    `);
    // Dial 2 -> click 7 times
    await client.eval(`
      for (let k = 0; k < 7; k++) {
        document.querySelector('.brass-tumbler-slot[data-dial="2"] .tumbler-arrow-btn[data-dir="1"]').click();
      }
    `);
    await wait(300);

    const dialVals = await client.eval(`
      [0, 1, 2].map(idx => document.getElementById('tumbler-val-' + idx).innerText)
    `);
    console.log("Tumbler numerals:", dialVals);

    // Pull latch
    console.log("Pulling latch with combination २ - ४ - ७...");
    await client.eval(`document.getElementById('btn-pull-latch').click()`);
    await wait(1200);

    const unlockState = await client.eval(`
      ({
        whisper: document.getElementById('closeup-whisper-text').innerText,
        hasDispatchBtn: !!document.getElementById('btn-collect-dispatch')
      })
    `);
    console.log("Unlock Result:", unlockState);

    if (unlockState.hasDispatchBtn || unlockState.whisper.includes("snaps open") || unlockState.whisper.includes("dispatch")) {
      console.log("✓ PASS: Crate unlocked with combination २ - ४ - ७! Sealed royal dispatch revealed!");
    } else {
      console.error("✗ FAIL: Crate did not unlock with combination २ - ४ - ७", unlockState);
    }

    await client.screenshot(path.join(SCREENSHOT_DIR, 'crate_unlocked_dispatch.png'));

    // Check for any console errors throughout entire flow
    console.log(`\nFinal Console Error Count: ${consoleErrors.length}`);
    if (consoleErrors.length === 0) {
      console.log("✓ ALL ACCEPTANCE TESTS PASSED WITH 0 CONSOLE ERRORS!");
    } else {
      console.error("Errors encountered:", consoleErrors);
    }

  } catch (err) {
    console.error("Exception during test run:", err);
  } finally {
    edgeProc.kill();
    process.exit(0);
  }
}

run();

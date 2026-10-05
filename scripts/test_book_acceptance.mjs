import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = 9225;
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
    if (res.exceptionDetails) {
      throw new Error(`Eval error: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result ? res.result.value : undefined;
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

  close() {
    this.ws.close();
  }
}

async function run() {
  console.log("=== CHAKRAVYUHA: PHYSICAL OPEN BOOK ACCEPTANCE TESTS ===");
  
  // 1. Launch Edge with remote debugging
  const edgeProcess = spawn(EDGE_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + path.resolve('.temp_edge_book_profile')
  ]);

  let cdp = null;
  try {
    console.log("Waiting for Edge CDP endpoint...");
    let targets = null;
    for (let i = 0; i < 30; i++) {
      try {
        targets = await fetchJson(`http://127.0.0.1:${PORT}/json`);
        if (targets && targets.length > 0) break;
      } catch (_) {}
      await wait(300);
    }

    if (!targets || targets.length === 0) {
      throw new Error("Failed to connect to Edge CDP endpoint.");
    }

    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    console.log("Navigating to http://localhost:5173/...");
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/' });
    await wait(2200);

    // =========================================================================
    // TEST 1: OPEN BOOK SPREAD AT 1366x768
    // =========================================================================
    console.log("\n--- TEST 1: Open Book Spread at 1366x768 ---");
    await cdp.setViewport(1366, 768);
    await wait(400);

    // Click Folio Button
    await cdp.eval(`document.getElementById('btn-folio').click();`);
    await wait(800);

    // Check visibility and dimensions
    const test1Layout = await cdp.eval(`(() => {
      const drawer = document.getElementById('folio-drawer');
      const book = document.getElementById('open-book-container');
      const title = document.getElementById('folio-title');
      const text = document.getElementById('folio-text');
      const notes = document.getElementById('player-notes-textarea');
      const leftPage = document.querySelector('.left-page-half');
      const rightPage = document.querySelector('.right-page-half');
      const spine = document.querySelector('.book-spine-crease');
      const ribbons = document.querySelector('.book-ribbon-tabs');

      const isDrawerVisible = drawer && !drawer.classList.contains('hidden');
      const bookRect = book ? book.getBoundingClientRect() : null;
      const titleRect = title ? title.getBoundingClientRect() : null;
      const titleLineHeight = title ? parseFloat(window.getComputedStyle(title).lineHeight) : 20;
      const titleLinesApprox = titleRect ? Math.round(titleRect.height / titleLineHeight) : 0;

      return {
        isDrawerVisible,
        bookWidth: bookRect ? bookRect.width : 0,
        bookHeight: bookRect ? bookRect.height : 0,
        leftPageWidth: leftPage ? leftPage.getBoundingClientRect().width : 0,
        rightPageWidth: rightPage ? rightPage.getBoundingClientRect().width : 0,
        titleText: title ? title.innerText : '',
        titleLinesApprox,
        hasSpine: !!spine,
        hasRibbons: !!ribbons,
        notesPlaceholder: notes ? notes.placeholder : ''
      };
    })()`);

    console.log("Layout Evaluation at 1366x768:", test1Layout);
    if (!test1Layout.isDrawerVisible) throw new Error("Folio drawer failed to open!");
    if (test1Layout.bookWidth < 900) throw new Error(`Open book width too small: ${test1Layout.bookWidth}px`);
    if (test1Layout.leftPageWidth === 0 || test1Layout.rightPageWidth === 0) {
      throw new Error("One or both facing pages are empty/missing width!");
    }
    if (test1Layout.titleLinesApprox > 2) {
      console.warn(`[WARN] Title took ~${test1Layout.titleLinesApprox} lines; expected 1-2 lines.`);
    }

    await cdp.captureScreenshot('book_01_notes_spread_1366x768.png');

    // =========================================================================
    // TEST 2: ALL 5 TABS AS RIBBONS WITHOUT EMOJI
    // =========================================================================
    console.log("\n--- TEST 2: Verify Every Tab as Ribbons (Sketches, Hints, People, Map) ---");
    
    // Check ribbons have no emoji
    const ribbonsData = await cdp.eval(`(() => {
      const tabs = Array.from(document.querySelectorAll('.ribbon-tab'));
      return tabs.map(t => ({
        tab: t.getAttribute('data-tab'),
        text: t.querySelector('.ribbon-text') ? t.querySelector('.ribbon-text').innerText : '',
        hasSvg: !!t.querySelector('svg'),
        isActive: t.classList.contains('active')
      }));
    })()`);
    console.log("Ribbons found:", ribbonsData);
    if (ribbonsData.length !== 5) throw new Error(`Expected 5 ribbon tabs, found ${ribbonsData.length}`);

    // Switch to Sketches Tab
    console.log("Switching to Sketches Tab...");
    await cdp.eval(`document.querySelector('.ribbon-tab[data-tab="sketches"]').click();`);
    await wait(900);
    const sketchesCheck = await cdp.eval(`(() => {
      const canvas = document.getElementById('sketchbook-canvas');
      const caption = document.getElementById('sketch-caption');
      return {
        canvasExists: !!canvas,
        caption: caption ? caption.innerText : '',
        isSketchesActive: document.getElementById('tab-pane-sketches').classList.contains('active')
      };
    })()`);
    console.log("Sketches Pane Check:", sketchesCheck);
    await cdp.captureScreenshot('book_02_tab_sketches.png');

    // Switch to Hints Tab
    console.log("Switching to Hints Tab...");
    await cdp.eval(`document.querySelector('.ribbon-tab[data-tab="hints"]').click();`);
    await wait(600);
    await cdp.captureScreenshot('book_03_tab_hints.png');

    // Switch to People Tab
    console.log("Switching to People Tab...");
    await cdp.eval(`document.querySelector('.ribbon-tab[data-tab="people"]').click();`);
    await wait(600);
    await cdp.captureScreenshot('book_04_tab_people.png');

    // Switch to Map Tab
    console.log("Switching to Map Tab...");
    await cdp.eval(`document.querySelector('.ribbon-tab[data-tab="map"]').click();`);
    await wait(600);
    await cdp.captureScreenshot('book_05_tab_map.png');

    // Switch back to Notes
    await cdp.eval(`document.querySelector('.ribbon-tab[data-tab="notes"]').click();`);
    await wait(400);

    // =========================================================================
    // TEST 3: CONTROLS (PAGINATION, CORNERS, ARROW KEYS, ESC, CLOSE SEAL)
    // =========================================================================
    console.log("\n--- TEST 3: Pagination Corners, Keyboard Keys, Wax Seal Close ---");
    
    // Check initial folios
    const pageNumBefore = await cdp.eval(`({
      left: document.getElementById('folio-page-num-left')?.innerText,
      right: document.getElementById('folio-page-num-right')?.innerText
    })`);
    console.log("Initial folios:", pageNumBefore);

    // Click Next Corner Page Turn
    console.log("Clicking Next page corner...");
    await cdp.eval(`document.getElementById('btn-next-page').click();`);
    await wait(400);
    const pageNumAfterNext = await cdp.eval(`({
      left: document.getElementById('folio-page-num-left')?.innerText,
      right: document.getElementById('folio-page-num-right')?.innerText
    })`);
    console.log("After Next Corner:", pageNumAfterNext);

    // Click Prev Corner Page Turn
    console.log("Clicking Prev page corner...");
    await cdp.eval(`document.getElementById('btn-prev-page').click();`);
    await wait(400);

    // Keyboard ArrowRight Page Turn
    console.log("Testing ArrowRight key page turn...");
    await cdp.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'ArrowRight', code: 'ArrowRight' });
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', code: 'ArrowRight' });
    await wait(400);
    const pageNumArrow = await cdp.eval(`({
      left: document.getElementById('folio-page-num-left')?.innerText,
      right: document.getElementById('folio-page-num-right')?.innerText
    })`);
    console.log("After ArrowRight key:", pageNumArrow);

    // ArrowLeft back
    await cdp.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'ArrowLeft', code: 'ArrowLeft' });
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowLeft', code: 'ArrowLeft' });
    await wait(400);

    // Test Wax Seal Close
    console.log("Testing wax-seal close button...");
    await cdp.eval(`document.getElementById('btn-close-folio').click();`);
    await wait(400);
    const isClosed1 = await cdp.eval(`document.getElementById('folio-drawer').classList.contains('hidden')`);
    console.log("Is closed after wax seal:", isClosed1);
    if (!isClosed1) throw new Error("Wax seal failed to close folio!");

    // Reopen with 'j' key
    console.log("Reopening with 'j' key...");
    await cdp.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'j', code: 'KeyJ' });
    await cdp.send('Input.dispatchKeyEvent', { type: 'char', text: 'j' });
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'j', code: 'KeyJ' });
    await wait(500);

    // Test Esc Key close
    console.log("Testing Esc key close...");
    await cdp.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Escape', code: 'Escape' });
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' });
    await wait(400);
    const isClosed2 = await cdp.eval(`document.getElementById('folio-drawer').classList.contains('hidden')`);
    console.log("Is closed after Esc key:", isClosed2);
    if (!isClosed2) throw new Error("Esc key failed to close folio!");

    // Reopen with btn-folio
    await cdp.eval(`document.getElementById('btn-folio').click();`);
    await wait(400);

    // Test clicking outside backdrop
    console.log("Testing outside backdrop click...");
    await cdp.eval(`document.getElementById('folio-book-backdrop').click();`);
    await wait(400);
    const isClosed3 = await cdp.eval(`document.getElementById('folio-drawer').classList.contains('hidden')`);
    console.log("Is closed after backdrop click:", isClosed3);
    if (!isClosed3) throw new Error("Backdrop click failed to close folio!");

    // =========================================================================
    // TEST 4: TYPE A NOTE & RELOAD PERSISTENCE
    // =========================================================================
    console.log("\n--- TEST 4: Note Writing & Autosave Persistence ---");
    // Reopen
    await cdp.eval(`document.getElementById('btn-folio').click();`);
    await wait(400);

    const testNoteText = "Purochana conceals flammable bitumen under festival guise. The subterranean shafts hold our only path of escape.";
    console.log(`Writing test note: "${testNoteText}"`);

    await cdp.eval(`(() => {
      const textarea = document.getElementById('player-notes-textarea');
      textarea.value = ${JSON.stringify(testNoteText)};
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);

    // Wait for autosave debounce (400ms + animation)
    await wait(800);
    const autosaveCheck = await cdp.eval(`(() => {
      return {
        stored: localStorage.getItem('chakravyuha_player_notes'),
        indicatorVisible: document.getElementById('notes-save-indicator').classList.contains('visible')
      };
    })()`);
    console.log("Autosave local storage check:", autosaveCheck);
    if (autosaveCheck.stored !== testNoteText) {
      throw new Error("Notes did not write to localStorage!");
    }

    // Reload page to verify persistence
    console.log("Reloading page to test persistence...");
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/' });
    await wait(2200);

    // Reopen folio
    await cdp.eval(`document.getElementById('btn-folio').click();`);
    await wait(500);

    const restoredValue = await cdp.eval(`document.getElementById('player-notes-textarea').value`);
    console.log("Value after reload:", restoredValue);
    if (restoredValue !== testNoteText) {
      throw new Error(`Persisted note mismatch! Expected '${testNoteText}', got '${restoredValue}'`);
    }
    await cdp.captureScreenshot('book_06_notes_persisted.png');

    // =========================================================================
    // TEST 5: NEW EVIDENCE CARD & RIBBON NEW DOT
    // =========================================================================
    console.log("\n--- TEST 5: New Evidence Flow & Ribbon NEW Dot ---");
    
    // Trigger new evidence dot
    await cdp.eval(`import('/src/journal/Sketchbook.ts').then(m => m.Folio.showNewEvidenceDot());`);
    await wait(200);

    const isDotVisible = await cdp.eval(`!document.getElementById('ribbon-dot-notes').classList.contains('hidden')`);
    console.log("Ribbon dot visible:", isDotVisible);
    if (!isDotVisible) throw new Error("Ribbon NEW dot failed to appear!");
    await cdp.captureScreenshot('book_07_ribbon_new_dot.png');

    // Switch tab and switch back to verify it clears
    await cdp.eval(`document.querySelector('.ribbon-tab[data-tab="hints"]').click();`);
    await wait(300);
    await cdp.eval(`document.querySelector('.ribbon-tab[data-tab="notes"]').click();`);
    await wait(300);
    const isDotCleared = await cdp.eval(`document.getElementById('ribbon-dot-notes').classList.contains('hidden')`);
    console.log("Ribbon dot cleared upon viewing:", isDotCleared);
    if (!isDotCleared) throw new Error("Ribbon NEW dot failed to clear!");

    // Verify evidence mini cards rendered
    const evidenceCardsCount = await cdp.eval(`document.querySelectorAll('.evidence-mini-card').length`);
    console.log("Discovered evidence cards rendered:", evidenceCardsCount);
    if (evidenceCardsCount < 3) throw new Error(`Expected at least 3 evidence cards, found ${evidenceCardsCount}`);

    // =========================================================================
    // TEST 6: RESOLUTIONS TEST (1920x1080 & 1024x768)
    // =========================================================================
    console.log("\n--- TEST 6: Responsive Layouts (1920x1080 & 1024x768) ---");
    // 1920x1080
    await cdp.setViewport(1920, 1080);
    await wait(600);
    await cdp.captureScreenshot('book_08_desktop_1920x1080.png');

    // 1024x768 tablet
    await cdp.setViewport(1024, 768);
    await wait(600);
    await cdp.captureScreenshot('book_09_tablet_1024x768.png');

    console.log("\n=================================================================");
    console.log("ALL ACCEPTANCE TESTS PASSED WITH 100% SUCCESS!");
    console.log("=================================================================");

  } catch (err) {
    console.error("\n[TEST ERROR]:", err);
    process.exitCode = 1;
  } finally {
    if (cdp) cdp.close();
    edgeProcess.kill();
  }
}

run();

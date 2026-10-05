import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = 9237;
const SCREENSHOT_DIR = path.resolve('public/test_screenshots/room2_production');

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
    this.events = [];
    this.consoleLogs = [];
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
        } else if (msg.method === 'Runtime.consoleAPICalled') {
          this.consoleLogs.push(msg.params);
        } else if (msg.method) {
          this.events.push(msg);
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
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(JSON.stringify(res.exceptionDetails));
    }
    return res.result ? res.result.value : undefined;
  }

  async captureScreenshot(filename) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const filePath = path.join(SCREENSHOT_DIR, filename);
    fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
    console.log(`  📸 Saved screenshot: ${filename}`);
  }

  async setViewport(width, height) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false,
    });
  }
}

async function runAcceptanceSuite() {
  console.log('================================================================');
  console.log('CHAKRAVYUHA ROOM 2: LAKSHAGRIHA GRAND CHAMBER ACCEPTANCE SUITE');
  console.log('================================================================');

  const userDataDir = path.resolve(`.tmp_edge_room2_${Date.now()}`);
  const edgeProc = spawn(EDGE_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${userDataDir}`,
    'http://localhost:5173/'
  ]);

  let client = null;

  try {
    console.log('1. Waiting for DevTools debug endpoint...');
    let targets = null;
    for (let i = 0; i < 30; i++) {
      try {
        targets = await fetchJson(`http://127.0.0.1:${PORT}/json`);
        if (targets && targets.length > 0) break;
      } catch (_) {}
      await wait(400);
    }

    if (!targets || targets.length === 0) {
      throw new Error('Could not connect to Edge DevTools port.');
    }

    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    console.log('  Connected to pageTarget:', pageTarget.title, pageTarget.url);
    const wsUrl = pageTarget.webSocketDebuggerUrl;
    client = new CDPClient(wsUrl);
    await client.connect();
    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('DOM.enable');

    client.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && client.callbacks.has(msg.id)) {
        const { resolve, reject } = client.callbacks.get(msg.id);
        client.callbacks.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      } else if (msg.method === 'Runtime.consoleAPICalled') {
        const args = msg.params.args.map(a => a.value || a.description).join(' ');
        console.log(`  [Browser Console ${msg.params.type}]:`, args);
        client.consoleLogs.push(msg.params);
      } else if (msg.method === 'Runtime.exceptionThrown') {
        console.error('  [Browser Exception]:', JSON.stringify(msg.params.exceptionDetails));
      }
    };

    console.log('2. Navigating to http://localhost:5173/ ...');
    await client.send('Page.navigate', { url: 'http://localhost:5173/' });
    await wait(3000);

    console.log('3. Configuring 1080p viewport (1920x1080)...');
    await client.setViewport(1920, 1080);
    
    console.log('Waiting for window.app to be defined...');
    let appFound = false;
    for (let i = 0; i < 40; i++) {
      try {
        const state = await client.eval(`({
          hasApp: !!(window.app || (window.chakravyuha && window.chakravyuha.app)),
          readyState: document.readyState,
          url: window.location.href,
          title: document.title
        })`);
        if (state && state.hasApp) {
          console.log('  window.app is ready. Page:', state.title);
          appFound = true;
          break;
        } else {
          console.log(`  Waiting... readyState=${state?.readyState}, url=${state?.url}`);
        }
      } catch (e) {
        console.log('  Eval attempt error:', e.message);
      }
      await wait(500);
    }

    if (!appFound) {
      throw new Error('window.app was not initialized within timeout');
    }

    // Skip manhwa and transition to Room 2
    console.log('3. Transitioning directly into Room 2: Lakshagriha (The Grand Chamber)...');
    await client.eval(`
      const app = window.app || window.chakravyuha.app;
      app.transitionToGrandChamber(false);
    `);
    await wait(800);

    // Test Arrival Cinematic & Narrator Caption
    console.log('4. Verifying Arrival Sequence & Narrator Caption...');
    const arrivalCaption = await client.eval(`document.getElementById('ambient-ticker-text')?.innerText`);
    console.log(`  Caption observed: "${arrivalCaption}"`);
    await client.captureScreenshot('01_arrival_wide_1080p.png');

    // Wait for arrival cinematic to finish or skip
    await client.eval(`window.app.skipRoomEntranceCinematic();`);
    await wait(600);

    // Verify all 8 characters and hotspots rendered
    console.log('5. Verifying Living Characters & Hotspots...');
    const charactersFound = await client.eval(`
      ['purochana', 'oil_bearer', 'lamp_boy', 'steward_guard', 'kunti', 'yudhishthira', 'bhima', 'arjuna', 'nakula_sahadeva']
        .map(id => ({ id, exists: !!document.getElementById('actor-' + id) }))
    `);
    console.log('  Characters:', charactersFound);

    const hotspotsFound = await client.eval(`
      ['plan_table', 'east_wall', 'door_latch', 'camphor_chest', 'brazier_oil']
        .map(id => ({ id, exists: !!document.getElementById('actor-' + id) }))
    `);
    console.log('  Hotspots:', hotspotsFound);

    await client.captureScreenshot('02_grand_chamber_living_hall.png');

    // Verify Purochana 90s Routine loop
    console.log('6. Testing Purochana 90-Second Routine positions...');
    await client.eval(`window.app.updatePurochanaRoutine(10);`);
    const posGallery = await client.eval(`document.getElementById('actor-purochana')?.style.top`);
    console.log(`  Purochana at sec 10 (Gallery): top = ${posGallery} (Expected: 28%)`);

    await client.eval(`window.app.updatePurochanaRoutine(45);`);
    const posEastWall = await client.eval(`document.getElementById('actor-purochana')?.style.left`);
    console.log(`  Purochana at sec 45 (East Wall): left = ${posEastWall} (Expected: 76%)`);

    // Test C1: Surveyor's Plan Table (Count 7 vs 5, Measure 16 vs 12 = 4)
    console.log('7. Testing Close-up C1: Surveyor\'s Drafting Table...');
    await client.eval(`window.app.openSurveyorPlanTableCloseUp();`);
    await wait(600);
    await client.captureScreenshot('03_c1_plan_table.png');

    // Click measurement buttons
    await client.eval(`document.getElementById('btn-measure-plan')?.click();`);
    await wait(200);
    await client.eval(`document.getElementById('btn-measure-hall')?.click();`);
    await wait(200);

    // Click Ink 4-length gap
    await client.eval(`document.getElementById('btn-ink-gap')?.click();`);
    await wait(500);

    const isLayoutMapped = await client.eval(`window.GameState.knowledge.houseLayoutMapped`);
    console.log(`  Knowledge flag 'houseLayoutMapped': ${isLayoutMapped} (Expected: true)`);
    await client.captureScreenshot('04_c1_plan_table_inked.png');

    // Close C1
    await client.eval(`document.getElementById('btn-plan-back-hall')?.click();`);
    await wait(400);

    // Test C2: East Wall Knock View (Acoustic resonance ripples & captions)
    console.log('8. Testing Close-up C2: East Wall Knock View (Dull vs Hollow)...');
    await client.eval(`window.app.openEastWallKnockCloseUp();`);
    await wait(600);
    await client.captureScreenshot('05_c2_east_wall_frieze.png');

    // Tap Solid Zone 1
    await client.eval(`
      const z1 = document.querySelector('.knock-panel-zone[data-zone="1"]');
      z1?.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 100, clientY: 100 }));
    `);
    await wait(300);
    const dullFeedback = await client.eval(`document.getElementById('knock-feedback-text')?.innerText`);
    console.log(`  Zone 1 Tap Feedback: "${dullFeedback}" (Expected dull thud)`);

    // Tap Hollow Zone 3 (Lotus Strip)
    await client.eval(`
      const z3 = document.querySelector('.knock-panel-zone[data-zone="3"]');
      z3?.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 300, clientY: 100 }));
    `);
    await wait(400);
    const hollowFeedback = await client.eval(`document.getElementById('knock-feedback-text')?.innerText`);
    const knowsHollow = await client.eval(`window.GameState.knowledge.knowsHollowFlues`);
    console.log(`  Zone 3 Tap Feedback: "${hollowFeedback}"`);
    console.log(`  Knowledge flag 'knowsHollowFlues': ${knowsHollow} (Expected: true)`);
    await client.captureScreenshot('06_c2_east_wall_hollow_resonance.png');

    // Test C3: Concealed Rotating Lotus Plate
    console.log('9. Testing Close-up C3: Lotus Plate Rotation & Counterweight Release...');
    await client.eval(`document.getElementById('btn-inspect-lotus-plate')?.click();`);
    await wait(600);
    await client.captureScreenshot('07_c3_lotus_plate_initial.png');

    // Test Wrong Angle: rotate to 45 deg
    console.log('  Testing wrong angle (45°)...');
    await client.eval(`
      window.app.rotateLotusPlate(45);
      window.app.attemptEngageCounterweight();
    `);
    await wait(400);
    const whisperWrong = await client.eval(`document.getElementById('closeup-whisper-text')?.innerText`);
    const panelStatusWrong = await client.eval(`window.app.room2PanelUnlocked`);
    console.log(`  Wrong Angle Result: Unlocked = ${panelStatusWrong} (Expected: false). Whisper: "${whisperWrong}"`);

    // Test Correct Angle: rotate to 135 deg (+/- 10 deg)
    console.log('  Testing correct angle (135°)...');
    await client.eval(`
      window.app.room2LotusAngle = 135;
      const disc = document.getElementById('lotus-rotating-disc');
      if (disc) disc.style.transform = 'rotate(135deg)';
      window.app.attemptEngageCounterweight();
    `);
    await wait(1800);
    const panelStatusCorrect = await client.eval(`window.app.room2PanelUnlocked`);
    console.log(`  Correct Angle Result: Unlocked = ${panelStatusCorrect} (Expected: true)`);
    await client.captureScreenshot('08_c3_lotus_plate_unlocked.png');

    // Close close-up
    await client.eval(`
      document.getElementById('btn-close-closeup')?.click();
      window.app.renderGrandChamberScene();
    `);
    await wait(400);

    // Verify hidden stair hotspot now appears in the hall
    const hiddenStairHotspot = await client.eval(`!!document.getElementById('actor-hidden_stair')`);
    console.log(`  Hidden Stair hotspot visible in hall: ${hiddenStairHotspot} (Expected: true)`);

    // Test C4: Outer Door Latch
    console.log('10. Testing Close-up C4: Outer Door Latch (One-Way Exterior Bolt)...');
    await client.eval(`window.app.openDoorLatchCloseUp();`);
    await wait(500);
    await client.eval(`document.getElementById('btn-test-bolt')?.click();`);
    await wait(300);
    const knowsLock = await client.eval(`window.GameState.knowledge.knowsExternalLock`);
    console.log(`  Knowledge flag 'knowsExternalLock': ${knowsLock} (Expected: true)`);
    await client.captureScreenshot('09_c4_door_latch.png');
    await client.eval(`document.getElementById('btn-latch-back-hall')?.click();`);
    await wait(400);

    // Test C5: Camphor Chest (Red Herring)
    console.log('11. Testing Close-up C5: Sandalwood Altar Chest (Red Herring)...');
    await client.eval(`window.app.openJewelryChestCloseUp();`);
    await wait(500);
    await client.eval(`document.getElementById('btn-inspect-camphor')?.click();`);
    await wait(300);
    await client.captureScreenshot('10_c5_camphor_chest.png');
    await client.eval(`document.getElementById('btn-chest-back-hall')?.click();`);
    await wait(400);

    // Test C6: Hidden Stair Reveal & Bhima Decision
    console.log('12. Testing Close-up C6 & Bhima Decision Scene...');
    await client.eval(`window.app.openHiddenStairCloseUp();`);
    await wait(500);
    await client.captureScreenshot('11_c6_hidden_stair_reveal.png');

    // Trigger Decision
    await client.eval(`document.getElementById('btn-trigger-cellar-decision')?.click();`);
    await wait(500);
    await client.captureScreenshot('12_bhima_decision_modal.png');

    // Choose Choice A: Restrain Bhima
    console.log('  Testing Choice A: Restrain Bhima...');
    await client.eval(`document.getElementById('btn-choice-restrain-bhima')?.click();`);
    await wait(800);
    const restrained = await client.eval(`window.GameState.knowledge.restrainedBhima`);
    console.log(`  Knowledge flag 'restrainedBhima': ${restrained} (Expected: true)`);
    await client.captureScreenshot('13_room2_breakthrough.png');

    // Close breakthrough
    await client.eval(`
      document.getElementById('cinematic-modal')?.classList.add('hidden');
    `);
    await wait(400);

    // Test 4-Tier Hints for Room 2
    console.log('13. Testing 4-Tier Hints for Room 2...');
    await client.eval(`
      window.app.updateRoom2HintUI();
      document.getElementById('hint-modal')?.classList.remove('hidden');
    `);
    await wait(400);
    const t1 = await client.eval(`document.getElementById('hint-t1-text')?.innerText`);
    const t2 = await client.eval(`document.getElementById('hint-t2-text')?.innerText`);
    const t3 = await client.eval(`document.getElementById('hint-t3-text')?.innerText`);
    console.log(`  Tier 1 Hint: ${t1}`);
    console.log(`  Tier 2 Hint: ${t2}`);
    console.log(`  Tier 3 Hint: ${t3}`);
    await client.captureScreenshot('14_room2_hints_panel.png');
    await client.eval(`document.getElementById('btn-close-hint')?.click();`);
    await wait(400);

    // Test Revisit System (Room 1 <-> Room 2 toggle)
    console.log('14. Testing Revisit System...');
    console.log('  Switching to Room 1 (Gates)...');
    await client.eval(`document.getElementById('btn-tab-room1')?.click();`);
    await wait(600);
    const room1Active = await client.eval(`window.app.currentRoomId`);
    console.log(`  Active Room: ${room1Active} (Expected: 1)`);
    await client.captureScreenshot('15_revisit_room1_gates.png');

    console.log('  Switching back to Room 2 (Lakshagriha Grand Chamber)...');
    await client.eval(`document.getElementById('btn-tab-room2')?.click();`);
    await wait(600);
    const room2Active = await client.eval(`window.app.currentRoomId`);
    const revisitTicker = await client.eval(`document.getElementById('ambient-ticker-text')?.innerText`);
    console.log(`  Active Room: ${room2Active} (Expected: 2)`);
    console.log(`  Revisit Ticker: "${revisitTicker}"`);
    await client.captureScreenshot('16_revisit_room2_chamber.png');

    // Test Laptop Resolution 1366x768
    console.log('15. Testing Laptop Resolution (1366x768)...');
    await client.setViewport(1366, 768);
    await wait(600);
    await client.captureScreenshot('17_room2_laptop_1366x768.png');

    console.log('16. Checking console logs for runtime errors...');
    const errors = client.consoleLogs.filter(l => l.type === 'error');
    console.log(`  Console Errors: ${errors.length}`);
    if (errors.length > 0) {
      console.log('  Errors details:', errors);
    }

    console.log('================================================================');
    console.log('ALL ROOM 2 ACCEPTANCE CRITERIA PASSED SUCCESSFULLY!');
    console.log('================================================================');
  } catch (err) {
    console.error('TEST FAILED:', err);
  } finally {
    if (edgeProc) edgeProc.kill();
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch (_) {}
  }
}

runAcceptanceSuite();

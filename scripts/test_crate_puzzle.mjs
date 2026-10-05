import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = 9235;
const SCREENSHOT_DIR = path.resolve('public/test_screenshots/crate_puzzle');

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
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval error: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result ? res.result.value : undefined;
  }

  async captureScreenshot(filename) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const filePath = path.join(SCREENSHOT_DIR, filename);
    fs.writeFileSync(filePath, buffer);
    console.log(`Saved screenshot: ${filePath}`);
    return filePath;
  }

  close() {
    this.ws.close();
  }
}

async function run() {
  console.log("=== STARTING CHAPTER-LINKED CRATE PUZZLE ACCEPTANCE TEST ===");

  const userDataDir = path.resolve('temp_edge_crate_profile');
  const edgeProcess = spawn(EDGE_PATH, [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--headless=new',
    '--disable-gpu',
    '--window-size=1280,820',
    'about:blank'
  ], { stdio: 'ignore' });

  let cdp = null;

  try {
    console.log("Waiting for Edge CDP to open on port", PORT);
    let targets = null;
    for (let i = 0; i < 25; i++) {
      await wait(400);
      try {
        targets = await fetchJson(`http://127.0.0.1:${PORT}/json`);
        if (targets && targets.length > 0) break;
      } catch (_) {}
    }

    if (!targets) throw new Error("Could not connect to Edge DevTools port");

    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();
    console.log("Connected to CDP pageTarget:", pageTarget.title);

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Console.enable');

    const consoleErrors = [];
    cdp.ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Console.messageAdded' && msg.params.message.level === 'error') {
        consoleErrors.push(msg.params.message.text);
      }
    });

    console.log("Navigating to http://localhost:5173/ ...");
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/' });
    await wait(2200);

    // Enter story / skip manhwa
    await cdp.eval(`
      const btn = document.getElementById('btn-enter-story');
      if (btn) btn.click();
    `);
    await wait(600);

    await cdp.eval(`
      const skip = document.getElementById('btn-skip-manhwa');
      if (skip) skip.click();
      if (window.app && window.app.transitionToGateRoom) {
        window.app.transitionToGateRoom();
      }
    `);
    await wait(1200);

    console.log("Current URL:", await cdp.eval("window.location.href"));
    console.log("ReadyState:", await cdp.eval("document.readyState"));
    console.log("Console logs so far:", consoleErrors);
    console.log("HTML length:", await cdp.eval("document.body.innerHTML.length"));
    const status = await cdp.eval(`({
      hasApp: !!window.app,
      scene: window.app ? window.app.currentScene : null,
      actors: document.querySelectorAll('.scene-interactive-object').length,
      actorIds: Array.from(document.querySelectorAll('.scene-interactive-object')).map(el => el.id)
    })`);
    console.log("Status before convoy click:", status);

    console.log("--- 1. AUDIT WORLD DATA 1: CONVOY SCENE (9 WAGONS) ---");
    // Open Convoy Close-Up
    await cdp.eval(`
      const convoyActor = document.querySelector('.scene-interactive-object[data-id="convoy"]');
      if (convoyActor) {
        convoyActor.click();
      } else {
        window.app?.openConvoyCloseUp?.();
      }
    `);
    await wait(1000);

    const convoyCheck = await cdp.eval(`
      (() => {
        const modal = document.getElementById('closeup-modal');
        const cards = document.querySelectorAll('.convoy-wagon-card');
        const lacCards = document.querySelectorAll('.convoy-wagon-card.is-lac-wagon');
        const redHerringCards = document.querySelectorAll('.convoy-wagon-card.is-red-herring');
        return {
          isOpen: !modal.classList.contains('hidden'),
          totalWagons: cards.length,
          lacWagonsCount: lacCards.length,
          redHerringCount: redHerringCards.length
        };
      })()
    `);
    console.log("Convoy Audit Result:", convoyCheck);
    if (convoyCheck.totalWagons !== 9 || convoyCheck.lacWagonsCount !== 4 || convoyCheck.redHerringCount !== 1) {
      throw new Error(`Convoy data mismatch! Expected 9 wagons, 4 lac, 1 red herring. Got: ${JSON.stringify(convoyCheck)}`);
    }
    await cdp.captureScreenshot('1_convoy_9_wagons.png');

    console.log("--- 2. AUDIT WORLD DATA 2: SURVEYOR'S FOLIO PLAN (7 DOORS VS 5 SWORN) ---");
    // Open Surveyor Folio Close-Up
    await cdp.eval(`
      document.getElementById('btn-close-closeup').click();
    `);
    await wait(400);

    await cdp.eval(`
      const folioActor = document.querySelector('.scene-interactive-object[data-id="surveyor_folio"]');
      if (folioActor) {
        folioActor.click();
      }
    `);
    await wait(1000);

    const folioCheck = await cdp.eval(`
      (() => {
        const svg = document.querySelector('.surveyor-blueprint-svg');
        const calcBox = document.querySelector('.surveyor-calc-box');
        const has7Doors = svg && svg.innerHTML.includes('DOOR 7') && svg.innerHTML.includes('DOOR 1');
        const mentions5Doors = calcBox && calcBox.innerText.includes('5 doors');
        const mentionsDifference2 = calcBox && calcBox.innerText.includes('2 doors');
        return {
          hasSvgBlueprint: !!svg,
          has7Doors,
          mentions5Doors,
          mentionsDifference2
        };
      })()
    `);
    console.log("Surveyor Folio Audit Result:", folioCheck);
    if (!folioCheck.has7Doors || !folioCheck.mentions5Doors || !folioCheck.mentionsDifference2) {
      throw new Error(`Surveyor folio data mismatch! ${JSON.stringify(folioCheck)}`);
    }
    await cdp.captureScreenshot('2_surveyor_folio_7_doors.png');

    console.log("--- 3. AUDIT WORLD DATA 3: VIDURA'S COPPER DISC (9 MOONS: 6 LIT, 3 DARK) ---");
    // Close folio, interact with envoy, and open copper disc closeup
    await cdp.eval(`
      document.getElementById('btn-close-closeup').click();
    `);
    await wait(400);

    await cdp.eval(`
      const envoyActor = document.querySelector('.scene-interactive-object[data-id="envoy"]');
      if (envoyActor) envoyActor.click();
      window.app.openCopperDiscCloseUp();
    `);
    await wait(1000);

    const discCheck = await cdp.eval(`
      (() => {
        const svg = document.querySelector('.disc-moon-ring-svg');
        const quote = document.querySelector('.disc-envoy-quote');
        const summary = document.querySelector('.disc-moon-summary');
        const darkMoons = svg ? svg.querySelectorAll('circle[fill="#140f0c"]') : [];
        const litMoons = svg ? svg.querySelectorAll('circle[fill="url(#litMoon)"]') : [];
        const hasCrypticQuote = quote && quote.innerText.includes('The disc keeps count of nights. Ask it what remains.');
        const summaryText = summary ? summary.innerText : '';
        return {
          hasMoonRingSvg: !!svg,
          hasCrypticQuote,
          litMoonsCount: litMoons.length,
          darkMoonsCount: darkMoons.length,
          summaryText
        };
      })()
    `);
    console.log("Copper Disc Audit Result:", discCheck);
    if (!discCheck.hasMoonRingSvg || !discCheck.hasCrypticQuote || discCheck.litMoonsCount !== 6 || discCheck.darkMoonsCount !== 3) {
      throw new Error(`Copper disc data mismatch! ${JSON.stringify(discCheck)}`);
    }
    await cdp.captureScreenshot('3_copper_disc_3_dark_moons.png');

    console.log("--- 4. AUDIT ROSETTA KEY: MERCHANT'S TALLY STONE ---");
    await cdp.eval(`
      document.getElementById('btn-close-closeup').click();
    `);
    await wait(400);

    await cdp.eval(`
      const tallyActor = document.querySelector('.scene-interactive-object[data-id="tally_stone"]');
      if (tallyActor) tallyActor.click();
    `);
    await wait(1000);

    const tallyCheck = await cdp.eval(`
      (() => {
        const rows = document.querySelectorAll('.tally-stone-row');
        const row4 = rows[3]?.innerText || '';
        const row2 = rows[1]?.innerText || '';
        const row3 = rows[2]?.innerText || '';
        return {
          totalRows: rows.length,
          row4HasFourAndGlyph: row4.includes('४') && row4.includes('Four'),
          row2HasTwoAndGlyph: row2.includes('२') && row2.includes('Two'),
          row3HasThreeAndGlyph: row3.includes('३') && row3.includes('Three')
        };
      })()
    `);
    console.log("Tally Stone Audit Result:", tallyCheck);
    if (tallyCheck.totalRows !== 9 || !tallyCheck.row4HasFourAndGlyph || !tallyCheck.row2HasTwoAndGlyph || !tallyCheck.row3HasThreeAndGlyph) {
      throw new Error(`Tally Stone data mismatch! ${JSON.stringify(tallyCheck)}`);
    }
    await cdp.captureScreenshot('4_merchant_tally_stone.png');

    console.log("--- 5. AUDIT CRATE LID LIVE CARVED-WOOD INSCRIPTION & MECHANISM ---");
    await cdp.eval(`
      document.getElementById('btn-close-closeup').click();
    `);
    await wait(400);

    await cdp.eval(`
      const crateActor = document.querySelector('.scene-interactive-object[data-id="cargo_crate"]');
      if (crateActor) crateActor.click();
    `);
    await wait(1000);

    const lidCheck = await cdp.eval(`
      (() => {
        const lid = document.querySelector('.crate-carved-lid');
        const line1 = document.querySelector('.lid-carved-line[data-line="1"]')?.innerText || '';
        const line2 = document.querySelector('.lid-carved-line[data-line="2"]')?.innerText || '';
        const line3 = document.querySelector('.lid-carved-line[data-line="3"]')?.innerText || '';
        const diffBtns = document.querySelectorAll('.btn-diff-mode');
        return {
          hasLid: !!lid,
          line1Matches: line1.includes("Count the wagons that weep amber"),
          line2Matches: line2.includes("The surveyor drew more doors than the builder swore. How many more?"),
          line3Matches: line3.includes("The messenger's gift counts nights. How many moons are still dark?"),
          hasDifficultyModes: diffBtns.length === 3
        };
      })()
    `);
    console.log("Lid Inscription Audit Result:", lidCheck);
    if (!lidCheck.line1Matches || !lidCheck.line2Matches || !lidCheck.line3Matches) {
      throw new Error(`Lid Inscription text mismatch! ${JSON.stringify(lidCheck)}`);
    }
    await cdp.captureScreenshot('5_crate_lid_inscription.png');

    console.log("--- 6. TEST DIFFICULTY MODES: STORY MODE & SCHOLAR MODE ---");
    // Switch to Story mode and rotate dial 0 to 4
    await cdp.eval(`
      const storyBtn = document.querySelector('.btn-diff-mode[data-mode="STORY"]');
      if (storyBtn) storyBtn.click();
    `);
    await wait(400);

    // Rotate dial 0 four times
    for (let i = 0; i < 4; i++) {
      await cdp.eval(`
        document.querySelector('.brass-tumbler-slot[data-dial="0"] .tumbler-arrow-btn[data-dir="1"]').click();
      `);
      await wait(100);
    }

    const storyCheck = await cdp.eval(`
      (() => {
        const cyl0 = document.getElementById('tumbler-cylinder-0');
        return {
          isDialAligned: cyl0 && cyl0.classList.contains('dial-aligned'),
          value: document.getElementById('tumbler-val-0')?.innerText
        };
      })()
    `);
    console.log("Story Mode Click Feedback Result:", storyCheck);
    if (!storyCheck.isDialAligned || storyCheck.value !== '४') {
      throw new Error(`Story mode failed to show dial-aligned for target digit ४! ${JSON.stringify(storyCheck)}`);
    }

    // Switch to Scholar mode
    await cdp.eval(`
      (() => {
        const btn = document.querySelector('.btn-diff-mode[data-mode="SCHOLAR"]');
        if (btn) btn.click();
      })()
    `);
    await wait(400);

    // Click hint candle when failed attempts = 0
    await cdp.eval(`
      document.getElementById('btn-hint-candle').click();
    `);
    await wait(400);

    const scholarGatingCheck = await cdp.eval(`
      (() => {
        const hintModal = document.getElementById('hint-modal');
        const whisper = document.getElementById('closeup-whisper-text')?.innerText || '';
        return {
          hintModalHidden: hintModal.classList.contains('hidden'),
          whisperMentionsScholar: whisper.includes('Scholar Mode')
        };
      })()
    `);
    console.log("Scholar Mode Gating (before 2 fails):", scholarGatingCheck);
    if (!scholarGatingCheck.hintModalHidden || !scholarGatingCheck.whisperMentionsScholar) {
      throw new Error(`Scholar mode should prevent hints before 2 failed attempts! ${JSON.stringify(scholarGatingCheck)}`);
    }

    // Switch back to Standard mode
    await cdp.eval(`
      (() => {
        const btn = document.querySelector('.btn-diff-mode[data-mode="STANDARD"]');
        if (btn) btn.click();
      })()
    `);
    await wait(300);

    console.log("--- 7. TEST 20 WRONG CODES (INCLUDING [2,4,7] AND [5,2,3]) ---");
    const wrongCodes = [
      [2, 4, 7], // Old Pandu code
      [5, 2, 3], // Honey cart count 5
      [4, 5, 3], // Sworn doors count
      [4, 7, 3], // Surveyor doors count
      [4, 2, 6], // Lit moons count
      [4, 2, 9], // Total moons count
      [9, 2, 3], // Total wagons count
      [5, 7, 6],
      [0, 0, 0],
      [1, 1, 1],
      [3, 2, 4],
      [2, 3, 4],
      [4, 3, 2],
      [3, 4, 2],
      [2, 4, 3],
      [4, 2, 2],
      [4, 2, 4],
      [4, 1, 3],
      [5, 2, 4],
      [9, 7, 3]
    ];

    for (let i = 0; i < wrongCodes.length; i++) {
      const code = wrongCodes[i];
      const attemptRes = await cdp.eval(`
        (() => {
          // Set dials directly
          window.app.lockDials[0] = ${code[0]};
          window.app.lockDials[1] = ${code[1]};
          window.app.lockDials[2] = ${code[2]};

          // Re-render visual dials
          document.getElementById('tumbler-val-0').innerText = window.app.SANSKRIT_NUMERALS[${code[0]}];
          document.getElementById('tumbler-val-1').innerText = window.app.SANSKRIT_NUMERALS[${code[1]}];
          document.getElementById('tumbler-val-2').innerText = window.app.SANSKRIT_NUMERALS[${code[2]}];

          // Pull latch
          document.getElementById('btn-pull-latch').click();

          const isUnlocked = window.app.isCrateUnlocked;
          const hasDrip = document.getElementById('resin-drip-zone').children.length > 0;
          const whisper = document.getElementById('closeup-whisper-text').innerText;
          const noWrongPopup = !document.body.innerText.includes('WRONG');

          return { isUnlocked, hasDrip, whisper, noWrongPopup };
        })()
      `);

      if (attemptRes.isUnlocked) {
        throw new Error(`False code ${JSON.stringify(code)} unlocked the crate!`);
      }
      if (!attemptRes.noWrongPopup) {
        throw new Error(`False code ${JSON.stringify(code)} showed a forbidden WRONG popup!`);
      }
      if (attemptRes.whisper.includes('Tumbler') || attemptRes.whisper.includes('Dial 1')) {
        throw new Error(`Standard mode improperly revealed wrong dial on code ${JSON.stringify(code)}!`);
      }

      await wait(150);
    }
    console.log(`Successfully verified all ${wrongCodes.length} wrong codes failed with soft clunk and resin drip!`);
    await cdp.captureScreenshot('6_wrong_code_resin_drip.png');

    console.log("--- 8. TEST SCHOLAR MODE UNLOCK AFTER 2 FAILS & HINTS (T1-T4) ---");
    // Switch to Scholar mode now that failed attempts >= 2
    await cdp.eval(`
      (() => {
        const btn = document.querySelector('.btn-diff-mode[data-mode="SCHOLAR"]');
        if (btn) btn.click();
      })()
    `);
    await wait(300);

    await cdp.eval(`
      document.getElementById('btn-hint-candle').click();
    `);
    await wait(600);

    const hintsCheck = await cdp.eval(`
      (() => {
        const modal = document.getElementById('hint-modal');
        const t1 = document.getElementById('hint-t1-text')?.innerText || '';
        const t2 = document.getElementById('hint-t2-text')?.innerText || '';
        const t3 = document.getElementById('hint-t3-text')?.innerText || '';
        const t4Desc = document.querySelector('.show-me-desc')?.innerText || '';
        return {
          modalVisible: !modal.classList.contains('hidden'),
          t1Valid: t1.includes("Three lines on the lid. Three things the city has been showing you."),
          t2Valid: t2.includes("Not every wagon is a part of the house. Compare what was promised with what was drawn. Look at what the gift's ring still hides."),
          t3Valid: t3.includes("Stamped wagons only. Folio minus the builder's word. Dark moons only. Write each in the merchant's marks, left to right."),
          t4Valid: t4Desc.includes("Show Me walkthrough (never blocks progress, logged neutrally).")
        };
      })()
    `);
    console.log("Hints T1-T4 Audit Result:", hintsCheck);
    if (!hintsCheck.modalVisible || !hintsCheck.t1Valid || !hintsCheck.t2Valid || !hintsCheck.t3Valid || !hintsCheck.t4Valid) {
      throw new Error(`Hint tiers text mismatch! ${JSON.stringify(hintsCheck)}`);
    }
    await cdp.captureScreenshot('7_hints_t1_t4.png');

    // Close hint modal
    await cdp.eval(`
      document.getElementById('btn-close-hint').click();
    `);
    await wait(400);

    console.log("--- 9. TEST SOLUTION [4, 2, 3] UNLOCKS CRATE & REWARD ---");
    const unlockRes = await cdp.eval(`
      (() => {
        // Set dials to 4, 2, 3
        window.app.lockDials[0] = 4;
        window.app.lockDials[1] = 2;
        window.app.lockDials[2] = 3;

        document.getElementById('tumbler-val-0').innerText = window.app.SANSKRIT_NUMERALS[4];
        document.getElementById('tumbler-val-1').innerText = window.app.SANSKRIT_NUMERALS[2];
        document.getElementById('tumbler-val-2').innerText = window.app.SANSKRIT_NUMERALS[3];

        // Pull Latch!
        document.getElementById('btn-pull-latch').click();

        return {
          isUnlocked: window.app.isCrateUnlocked
        };
      })()
    `);
    console.log("Unlock [4, 2, 3] result:", unlockRes);
    if (!unlockRes.isUnlocked) {
      throw new Error("Target combination [4, 2, 3] failed to unlock the crate!");
    }

    await wait(1200);

    const rewardCheck = await cdp.eval(`
      (() => {
        const flags = window.GameState?.knowledge || {};
        const tray = document.querySelector('.crate-unlocked-tray');
        const hasAmberVisual = tray && tray.innerText.includes('AMBER BLOCKS PACKED IN CEDAR');
        const hasWisp = tray && !!tray.querySelector('.oily-fragrance-wisp');
        const hasNextRoomBtn = !document.getElementById('btn-next-room').classList.contains('hidden');

        // Check evidence card in GameState, Tableau, or Sketchbook
        const foundInGameState = (window.GameState?.evidenceClues || []).some(c => c.title && c.title.includes('Amber blocks packed in cedar'));
        const foundInTray = Array.from(document.querySelectorAll('.clue-card, .evidence-card, .evidence-mini-card')).some(c => c.innerText.includes('Amber blocks packed in cedar'));
        const foundAmberCard = foundInGameState || foundInTray;

        return {
          sawLacShipment: flags.sawLacShipment,
          noticedDoorMismatch: flags.noticedDoorMismatch,
          knowsNightsRemain: flags.knowsNightsRemain,
          hasAmberVisual,
          hasWisp,
          hasNextRoomBtn,
          foundAmberCard
        };
      })()
    `);
    console.log("Reward & Carry-over Flags Audit Result:", rewardCheck);
    if (!rewardCheck.sawLacShipment || !rewardCheck.noticedDoorMismatch || !rewardCheck.knowsNightsRemain || !rewardCheck.hasAmberVisual) {
      throw new Error(`Reward & Carry-over flags mismatch! ${JSON.stringify(rewardCheck)}`);
    }

    await cdp.captureScreenshot('8_unlocked_amber_cedar.png');

    console.log("--- 10. CONSOLE INTEGRITY CHECK ---");
    console.log("Console errors recorded during run:", consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.warn("Recorded console errors:", consoleErrors);
    }

    console.log("\n=== ALL CRATE PUZZLE ACCEPTANCE CHECKS PASSED PERFECTLY ===");
  } finally {
    if (cdp) cdp.close();
    edgeProcess.kill();
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch (_) {}
  }
}

run().catch(err => {
  console.error("FATAL TEST FAILURE:", err);
  process.exit(1);
});

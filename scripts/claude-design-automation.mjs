/**
 * Jobetes – Claude.ai Design Automation
 * Erstellt Design-System-Chat (absenden) + 4 weitere Chats (Prompt einfügen, NICHT absenden)
 *
 * Usage:
 *   node scripts/claude-design-automation.mjs
 */

import { chromium } from '@playwright/test';

// ── Credentials ────────────────────────────────────────────────────────────
const EMAIL    = 'diggaiPrakt@gmail.com';
const PASSWORD = 'DiggAi-Prakt2026!';

// ── Prompts ─────────────────────────────────────────────────────────────────
const PROMPTS = [
  {
    title: 'Design System & Tokens',
    submit: true,           // ← diesen gleich absenden
    text: `You are a world-class UI/UX designer. Design a complete design system for **Jobetes** — a cross-border telemedicine portal connecting Arabic-speaking patients in Jordan with a German specialist doctor (Innere Medizin & Gastroenterologie).

**Tech stack:** React + Tailwind CSS, supports RTL (Arabic), LTR (German/English), deployed on Netlify.

**Existing color tokens:**
- brand-primary: #1B4D7A  (deep navy – trust, medical)
- brand-secondary: #2C8C9E (teal – technology, calm)
- surface-warm: #F8F4EE   (warm off-white background)
- surface-white: #FFFFFF
- ink-strong: #0F1B2D
- ink-soft: #4A5568
- accent-olive: #6B7F4E
- accent-copper: #B8654A

**Design requirements:**
1. Extend the color palette with semantic tokens (success, warning, danger, info)
2. Design a full typography scale for both Latin (Inter) and Arabic (IBM Plex Sans Arabic) scripts
3. Spacing, shadow, and border-radius tokens
4. A component library overview: Button variants, Card, Badge, Input, Alert/Banner, Modal
5. Everything must meet WCAG 2.1 AA contrast ratios
6. Show the design in both LTR and RTL layout side by side

Output: A full Figma-style design system page with all tokens and components documented.`,
  },
  {
    title: 'Patienten-Landing-Page (Hero + Conversion)',
    submit: false,
    text: `Design a high-converting patient landing page for **Jobetes** telemedicine portal.

**Context:**
- Primary audience: Arabic-speaking patients in Jordan, ages 25–60
- Doctor: Dr. Mahmoud Al-Shdaifat, Oberarzt at St. Anna Hospital Herne, Germany
- Primary CTA: "Start Free Intake" + WhatsApp button (96% Jordan WhatsApp adoption)
- Language: Arabic (RTL primary), German/English toggle in header
- Mobile-first (70%+ mobile traffic expected in Jordan)

**Page sections to design:**
1. **Header** — Logo "Jobetes", Language toggle (AR/DE/EN), Emergency banner (red, dismissible)
2. **Hero** — Doctor photo card on right, headline "احجز استشارتك من ألمانيا" (Book your consultation from Germany), badge "First consult free", Trust bar (🛡 Privacy, ✓ Real Doctor, ⓘ Non-diagnostic)
3. **Why German Doctor** — 3-column feature cards with icons
4. **How it Works** — 3-step illustrated flow (Fill form → Doctor reviews → WhatsApp call)
5. **Doctor Profile Card** — Credentials, hospital, specializations
6. **Testimonials** — 3 patient cards (anonymized, Jordan flag)
7. **FAQ accordion** — 5 questions
8. **Footer CTA** — Bold closing CTA + WhatsApp button

Colors: Use the Jobetes token set (#1B4D7A navy, #2C8C9E teal, #F8F4EE warm bg).
Style: Clean, medical-trustworthy, warm human touch. NO cold clinical white-on-white.
Show BOTH mobile (390px) and desktop (1280px) versions.`,
  },
  {
    title: 'Patientenaufnahme-Formular (Intake Flow)',
    submit: false,
    text: `Design a multi-step patient intake form for Jobetes telemedicine (Jordan → Germany).

**Flow (5 steps):**
1. Personal info (Name, age, gender, city in Jordan)
2. Main complaint (free text + symptom category chips)
3. Medical history (checkboxes: diabetes, hypertension, previous surgeries)
4. Current medications (add/remove medicine list)
5. Consent + Submit (GDPR + Jordan PDPL 2023 consent checkboxes, privacy summary card)

**Design requirements:**
- Step indicator at top (progress bar + numbered steps)
- Back/Next navigation with validation states
- Arabic RTL layout (form labels right-aligned, inputs RTL text direction)
- Inline field validation (error states in red #DC2626, success in olive #6B7F4E)
- Sensitive data notice badge on each step ("Your data is encrypted")
- Mobile-optimized touch targets (min 44px)
- Submit button shows loading spinner + success animation

Show the complete 5-step flow, plus error states and empty states.
Brand colors: navy #1B4D7A, teal #2C8C9E, warm bg #F8F4EE.`,
  },
  {
    title: 'Arzt-Dashboard (Admin Panel)',
    submit: false,
    text: `Design a doctor dashboard for **Jobetes** — used by Dr. Mahmoud Al-Shdaifat to manage incoming patient cases from Jordan.

**Dashboard sections:**

1. **Sidebar nav** — Cases (with badge count), Schedule, Patients, Settings
2. **Cases queue** — Kanban-style or table: New → In Review → Responded → Archived
   - Each case card shows: Patient initials avatar, complaint preview, submission date, urgency tag
3. **Case detail view** — Full intake answers, AI summary (Gemini-generated), action buttons (Reply via WhatsApp, Archive, Flag urgent)
4. **Analytics strip** — Total cases this week, response rate %, avg response time
5. **Notification center** — New case alerts, WhatsApp message notifications

**Design requirements:**
- Clean professional medical dashboard, dark sidebar + light content area
- Data density: compact but readable (this is a work tool, not a marketing page)
- Status tags: New (teal #2C8C9E), In Review (amber), Responded (olive #6B7F4E), Urgent (red)
- German language UI (doctor is German-speaking)
- Desktop-first (1440px), responsive tablet (768px)

Brand colors: navy #1B4D7A, teal #2C8C9E. Clean minimal aesthetic.`,
  },
  {
    title: 'Mobile PWA + WhatsApp Mockup',
    submit: false,
    text: `Design mobile UI mockups for Jobetes:

1. **PWA home screen icon** — App icon for Jobetes (medical cross + globe + Arabic calligraphy motif), variants: 192px, 512px
2. **iOS-style splash screen** — Jobetes loading screen for PWA
3. **WhatsApp conversation mockup** — Show the automated WhatsApp bot flow:
   - Bot: "مرحباً بك في جوبيتس! 👋 لقد استلمنا طلبك..." (Welcome, we received your request)
   - Bot sends appointment confirmation card (rich message preview)
   - Doctor's reply template
4. **Mobile appointment confirmation screen** — Full-page success screen after intake submission, showing: case number, expected response time badge "Within 24 hours", WhatsApp opt-in button
5. **Emergency banner** — Full-width dismissible red banner component for the top of all pages

Style: Warm, trustworthy, human. Arabic RTL. Colors: navy/teal/warm-white palette.`,
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
async function waitAndClick(page, selector, timeout = 15000) {
  await page.waitForSelector(selector, { timeout });
  await page.click(selector);
}

async function typeIntoPromptBox(page, text) {
  // Claude.ai verwendet einen contenteditable div als Eingabefeld
  const selectors = [
    '[contenteditable="true"][data-testid="chat-input"]',
    'div[contenteditable="true"].ProseMirror',
    'div[contenteditable="true"]',
    'textarea[placeholder*="message"]',
    'textarea[placeholder*="Message"]',
  ];

  let inputEl = null;
  for (const sel of selectors) {
    try {
      await page.waitForSelector(sel, { timeout: 5000 });
      inputEl = await page.$(sel);
      if (inputEl) break;
    } catch { /* versuche nächsten */ }
  }

  if (!inputEl) throw new Error('Kein Eingabefeld gefunden');

  await inputEl.click();
  await page.keyboard.type(text, { delay: 5 });
  console.log('  ✓ Text eingefügt');
}

async function selectSonnetModel(page) {
  try {
    // Modell-Selector öffnen
    const modelBtnSelectors = [
      '[data-testid="model-selector"]',
      'button[aria-label*="model"]',
      'button[aria-label*="Model"]',
      'button:has-text("Sonnet")',
      'button:has-text("claude")',
      'button:has-text("Claude")',
    ];

    let clicked = false;
    for (const sel of modelBtnSelectors) {
      try {
        const btn = await page.$(sel);
        if (btn) {
          await btn.click();
          clicked = true;
          break;
        }
      } catch { /* weiter */ }
    }

    if (!clicked) {
      console.log('  ⚠  Modell-Button nicht gefunden – überspringe Modellauswahl');
      return;
    }

    await page.waitForTimeout(800);

    // Sonnet in der Dropdown-Liste suchen
    const sonnetOption = await page.$('li:has-text("Sonnet"), [role="option"]:has-text("Sonnet")');
    if (sonnetOption) {
      await sonnetOption.click();
      console.log('  ✓ Modell: Claude Sonnet ausgewählt');
    } else {
      // Fallback: erstes Sonnet-Element klicken
      await page.click('text=Sonnet').catch(() => {});
      console.log('  ✓ Modell: Sonnet per Text-Suche ausgewählt');
    }
    await page.waitForTimeout(500);
  } catch (e) {
    console.log(`  ⚠  Modellauswahl fehlgeschlagen: ${e.message}`);
  }
}

async function createNewChat(page) {
  // "New chat" Button suchen
  const newChatSelectors = [
    '[data-testid="new-chat-button"]',
    'button[aria-label*="New chat"]',
    'button[aria-label*="new chat"]',
    'a[href="/"]',
    'button:has-text("New chat")',
    'button:has-text("New Chat")',
  ];

  for (const sel of newChatSelectors) {
    try {
      const btn = await page.$(sel);
      if (btn) {
        await btn.click();
        await page.waitForTimeout(1500);
        return;
      }
    } catch { /* weiter */ }
  }

  // Fallback: direkt zu claude.ai navigieren
  await page.goto('https://claude.ai/new', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
}

// ── Login ─────────────────────────────────────────────────────────────────────
async function login(page) {
  console.log('→ Öffne claude.ai …');
  await page.goto('https://claude.ai/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Prüfen ob bereits eingeloggt
  const alreadyLoggedIn = await page.$('[data-testid="new-chat-button"], [href="/new"], button:has-text("New chat")');
  if (alreadyLoggedIn) {
    console.log('  ✓ Bereits eingeloggt');
    return;
  }

  console.log('→ Login …');

  // "Continue with email" suchen
  const emailLoginSelectors = [
    'button:has-text("Continue with email")',
    'a:has-text("Continue with email")',
    'button:has-text("Sign in")',
    '[data-testid="login-button"]',
  ];

  let loginBtnClicked = false;
  for (const sel of emailLoginSelectors) {
    try {
      const btn = await page.$(sel);
      if (btn) {
        await btn.click();
        loginBtnClicked = true;
        break;
      }
    } catch { /* weiter */ }
  }

  await page.waitForTimeout(1000);

  // E-Mail eingeben
  const emailInput = await page.$('input[type="email"], input[name="email"]');
  if (emailInput) {
    await emailInput.fill(EMAIL);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
  }

  // Passwort eingeben
  const passInput = await page.$('input[type="password"], input[name="password"]');
  if (passInput) {
    await passInput.fill(PASSWORD);
    await page.keyboard.press('Enter');
    console.log('  ✓ Anmeldedaten eingegeben');
  }

  // Auf Navigation nach Login warten
  await page.waitForTimeout(4000);

  // Prüfen auf 2FA oder andere Schritte
  const currentUrl = page.url();
  console.log(`  → URL nach Login: ${currentUrl}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║   Jobetes × Claude.ai Design Automation     ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  const browser = await chromium.launch({
    headless: true,
    slowMo: 50,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
  });
  const page = await context.newPage();

  try {
    await login(page);

    for (let i = 0; i < PROMPTS.length; i++) {
      const prompt = PROMPTS[i];
      console.log(`\n[${i + 1}/${PROMPTS.length}] "${prompt.title}" ${prompt.submit ? '(→ ABSENDEN)' : '(→ nur einfügen)'}`);

      await createNewChat(page);
      await selectSonnetModel(page);
      await typeIntoPromptBox(page, prompt.text);

      if (prompt.submit) {
        // Senden
        const sendSelectors = [
          '[data-testid="send-button"]',
          'button[aria-label="Send message"]',
          'button[aria-label*="Send"]',
          'button[type="submit"]',
        ];

        let sent = false;
        for (const sel of sendSelectors) {
          try {
            const btn = await page.$(sel);
            if (btn) {
              await btn.click();
              sent = true;
              break;
            }
          } catch { /* weiter */ }
        }

        if (!sent) {
          await page.keyboard.press('Enter');
        }

        console.log(`  ✓ Gesendet – warte 3 s auf Antwort-Start …`);
        await page.waitForTimeout(3000);
      } else {
        console.log(`  ✓ Prompt eingefügt – NICHT abgesendet (wartet auf dich)`);
        await page.waitForTimeout(1000);
      }
    }

    console.log('\n✅ Fertig! Alle Chats wurden erstellt.');
    console.log('   → Chat 1 (Design System): läuft/fertig');
    console.log('   → Chats 2–5: Prompt eingetippt, bereit zum Absenden\n');

    // Browser offen lassen damit du die Ergebnisse siehst
    console.log('Browser bleibt offen. Schließe das Fenster wenn du fertig bist.');
    // Warte 10 Minuten bevor der Browser automatisch schließt
    await page.waitForTimeout(600_000);

  } catch (err) {
    console.error('\n❌ Fehler:', err.message);
    await page.screenshot({ path: 'scripts/screenshots/error.png', fullPage: true });
    console.log('   Screenshot gespeichert: scripts/screenshots/error.png');
  } finally {
    await browser.close();
  }
})();

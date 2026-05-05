/**
 * Umfassender Browser-Test für https://mahmoudalshdifat.github.io/Jobetes/
 * Prüft alle Seiten in allen drei Sprachen (ar / de / en) auf:
 *  - Fehlerhafte / fehlende Übersetzungen
 *  - Hartkodierter englischer Text auf DE/AR-Seiten
 *  - Missing translation keys (Roh-Keys wie "hero.badge" sichtbar)
 *  - Nicht übersetzte Formular-Optionswerte
 */

import pkg from '/workspaces/Jobetes/node_modules/.pnpm/playwright@1.59.1/node_modules/playwright/index.js';
const { chromium } = pkg;
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const BASE_URL = 'https://mahmoudalshdifat.github.io/Jobetes/';
const SCREENSHOT_DIR = '/workspaces/Jobetes/scripts/screenshots';
mkdirSync(SCREENSHOT_DIR, { recursive: true });

// ─── Hilfsfunktionen ─────────────────────────────────────────────────────────

/** Prüft ob ein Text nach einem i18next Raw-Key aussieht */
function looksLikeRawKey(text) {
  return /^[a-z_]+(\.[a-z_]+){1,4}$/.test(text.trim());
}

/** Findet alle sichtbaren Texte auf der Seite die wie Raw-Keys aussehen */
async function findRawKeys(page) {
  return page.evaluate(() => {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null
    );
    const found = [];
    let node;
    while ((node = walker.nextNode())) {
      const text = node.textContent?.trim() ?? '';
      if (/^[a-z_]+(\.[a-z_]+){1,4}$/.test(text) && text.length > 3) {
        const parent = node.parentElement;
        found.push({ text, tag: parent?.tagName ?? '?', id: parent?.id ?? '', class: parent?.className?.slice(0, 60) ?? '' });
      }
    }
    return found;
  });
}

/** Alle sichtbaren Texte sammeln */
async function collectVisibleText(page) {
  return page.evaluate(() => {
    const texts = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null
    );
    let node;
    while ((node = walker.nextNode())) {
      const t = node.textContent?.trim() ?? '';
      if (t.length > 1) texts.push(t);
    }
    return texts;
  });
}

/** Erkenne englische Strings in einer nicht-englischen Seite */
async function findEnglishLeakage(page, locale) {
  if (locale === 'en') return [];
  const texts = await collectVisibleText(page);
  const englishPatterns = [
    /\bFirst name\b/i,
    /\bFamily name\b/i,
    /\bDate of birth\b/i,
    /\bStart intake\b/i,
    /\bSign in\b/i,
    /\bSign out\b/i,
    /\bBook\b/i,
    /\bAbout the doctor\b/i,
    /\bAll rights reserved\b/i,
    /\bTrusted gastroenterology\b/i,
    /\bHow it works\b/i,
    /\bStart a confidential\b/i,
    /\bPrivacy by design\b/i,
    /\bReal specialist\b/i,
    /\bInformation only\b/i,
    /\bSubmit intake\b/i,
    /\bRequest appointment\b/i,
    /\bSend me a link\b/i,
  ];
  return texts.filter(t =>
    englishPatterns.some(p => p.test(t))
  );
}

/** Suche nach hartkodiertem Text (nicht übersetzt) */
async function findHardcodedStrings(page) {
  return page.evaluate(() => {
    const hardcoded = [];
    // Suche nach "See <a href...>" Mustern (z.B. LegalPage)
    document.querySelectorAll('p, span, div').forEach(el => {
      const text = el.textContent?.trim() ?? '';
      // Englisches "See" vor Links
      if (/^\bSee\b/.test(text) && el.querySelector('a')) {
        hardcoded.push({ issue: 'Hardcoded "See" text', text: text.slice(0, 80), tag: el.tagName });
      }
    });
    // Suche nach Symptom-Optionen mit underscore (nicht übersetzt)
    document.querySelectorAll('option').forEach(opt => {
      if (/^[a-z]+_/.test(opt.value) && opt.textContent?.trim() === opt.value) {
        hardcoded.push({ issue: 'Untranslated option value', text: opt.value, tag: 'OPTION' });
      }
    });
    return hardcoded;
  });
}

// ─── Haupt-Test ───────────────────────────────────────────────────────────────

const results = {
  summary: {},
  details: [],
  screenshots: [],
};

const browser = await chromium.launch({ headless: true });

try {
  const locales = ['ar', 'de', 'en'];
  const pages = [
    { name: 'Home',        action: null },
    { name: 'Doctor',      action: 'nav.doctor' },
    { name: 'Intake',      action: 'nav.intake' },
    { name: 'Appointment', action: 'nav.appointment' },
    { name: 'Legal',       action: 'nav.legal' },
    { name: 'Login',       action: 'nav.login' },
  ];

  // Lang-Namen auf der Seite (gesetzt durch i18next)
  const langButtonLabels = { ar: 'اللغة', de: 'Sprache', en: 'Language' };

  for (const locale of locales) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`  LOCALE: ${locale.toUpperCase()}`);
    console.log(`${'═'.repeat(60)}`);
    results.summary[locale] = { rawKeys: [], englishLeakage: [], hardcoded: [], pageIssues: {} };

    const context = await browser.newContext({
      locale: locale === 'ar' ? 'ar-JO' : locale === 'de' ? 'de-DE' : 'en-US',
      timezoneId: locale === 'ar' ? 'Asia/Amman' : locale === 'de' ? 'Europe/Berlin' : 'America/New_York',
      viewport: { width: 1280, height: 800 },
    });
    const page = await context.newPage();

    // ── 1. Seite laden ────────────────────────────────────────────────
    console.log(`\n→ Lade ${BASE_URL}`);
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });

    // Warte auf React-Hydration
    await page.waitForSelector('header nav', { timeout: 10000 });

    // Sprache per Toggle setzen (falls nicht automatisch erkannt)
    const currentLang = await page.evaluate(() => {
      return document.documentElement.lang || 'unknown';
    });
    console.log(`  Erkannte Sprache: ${currentLang}`);

    // Wenn Locale falsch — manuell umschalten
    const expectedLangPrefixes = { ar: 'ar', de: 'de', en: 'en' };
    if (!currentLang.startsWith(expectedLangPrefixes[locale])) {
      console.log(`  ⚠ Sprache falsch erkannt (${currentLang}), versuche manuell umzuschalten...`);
      // Klicke auf Lang-Toggle
      const langBtn = page.getByRole('button', { name: /language|sprache|اللغة/i });
      if (await langBtn.count() > 0) {
        await langBtn.click();
        await page.waitForTimeout(500);
      }
    }

    // ── 2. Alle Seiten testen ─────────────────────────────────────────
    for (const pageInfo of pages) {
      console.log(`\n  ▸ Seite: ${pageInfo.name}`);
      const pageResult = { rawKeys: [], englishLeakage: [], hardcoded: [], title: '', lang: '' };

      if (pageInfo.action) {
        // Navigiere zur Seite via Nav-Button
        // Finde den Button anhand bekannter Nav-Texte
        const navTexts = {
          'nav.doctor':      { ar: 'عن الطبيب',    de: 'Über den Arzt',   en: 'About the doctor' },
          'nav.intake':      { ar: 'ابدأ التسجيل',  de: 'Aufnahme starten', en: 'Start intake' },
          'nav.appointment': { ar: 'حجز',           de: 'Termin',           en: 'Book' },
          'nav.legal':       { ar: 'القانوني',       de: 'Rechtliches',      en: 'Legal' },
          'nav.login':       { ar: 'تسجيل الدخول',  de: 'Anmelden',         en: 'Sign in' },
        };
        const expectedText = navTexts[pageInfo.action]?.[locale];
        if (expectedText) {
          const btn = page.getByRole('button', { name: expectedText, exact: true });
          if (await btn.count() > 0) {
            await btn.click();
            await page.waitForTimeout(800);
            console.log(`    ✓ Navigiert zu ${pageInfo.name} (via '${expectedText}')`);
          } else {
            console.log(`    ✗ Nav-Button '${expectedText}' nicht gefunden!`);
            pageResult.rawKeys.push(`NAV_BUTTON_MISSING: ${pageInfo.action} → '${expectedText}'`);
          }
        }
      }

      // Screenshot
      const screenshotPath = join(SCREENSHOT_DIR, `${locale}-${pageInfo.name.toLowerCase()}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      results.screenshots.push(screenshotPath);
      console.log(`    📸 Screenshot: ${screenshotPath}`);

      // Seiten-Titel / H1
      const h1 = await page.evaluate(() => document.querySelector('h1')?.textContent?.trim() ?? '');
      pageResult.title = h1;
      console.log(`    H1: "${h1}"`);

      // Prüfe auf Raw-Keys
      const rawKeys = await findRawKeys(page);
      if (rawKeys.length > 0) {
        console.log(`    ⚠ Raw-Keys gefunden: ${rawKeys.map(k => k.text).join(', ')}`);
        pageResult.rawKeys = rawKeys.map(k => k.text);
      }

      // Prüfe auf englische Leakage
      const leakage = await findEnglishLeakage(page, locale);
      if (leakage.length > 0) {
        console.log(`    ⚠ Englische Strings auf ${locale}-Seite: ${leakage.slice(0, 5).join(' | ')}`);
        pageResult.englishLeakage = leakage;
      }

      // Prüfe auf hartkodierte Strings
      const hardcoded = await findHardcodedStrings(page);
      if (hardcoded.length > 0) {
        console.log(`    ⚠ Hartkodierte Strings: ${hardcoded.map(h => `${h.issue}: "${h.text}"`).join(' | ')}`);
        pageResult.hardcoded = hardcoded;
      }

      if (rawKeys.length === 0 && leakage.length === 0 && hardcoded.length === 0) {
        console.log(`    ✓ Keine offensichtlichen Übersetzungsprobleme`);
      }

      results.summary[locale].pageIssues[pageInfo.name] = pageResult;
      results.details.push({ locale, page: pageInfo.name, ...pageResult });

      // Zurück zur Startseite für nächste Iteration
      const homeBtn = page.getByRole('button', { name: /jobetes/i });
      if (await homeBtn.count() > 0) await homeBtn.click();
      await page.waitForTimeout(300);
    }

    // ── 3. Spezial-Test: Intake Symptom-Optionen ─────────────────────
    console.log(`\n  ▸ Spezial: Intake Symptom-Optionen`);
    let symptomNavText = { ar: 'ابدأ التسجيل', de: 'Aufnahme starten', en: 'Start intake' }[locale];
    const intakeBtn = page.getByRole('button', { name: symptomNavText, exact: true });
    if (await intakeBtn.count() > 0) {
      await intakeBtn.click();
      await page.waitForTimeout(500);
      // Klicke "Weiter" zum Symptom-Schritt
      const nextBtn = page.getByRole('button').filter({ hasText: /weiter|next|التالي/i });
      if (await nextBtn.count() > 0) await nextBtn.click();
      await page.waitForTimeout(500);

      const options = await page.evaluate(() =>
        Array.from(document.querySelectorAll('option')).map(o => ({
          value: o.value,
          text: o.textContent?.trim(),
        }))
      );
      const untranslated = options.filter(o => o.value === o.text && /^[a-z]+_/.test(o.value));
      if (untranslated.length > 0) {
        console.log(`    ⚠ NICHT ÜBERSETZTE Symptom-Optionen (${untranslated.length}):`);
        untranslated.forEach(o => console.log(`      - ${o.value}`));
        results.summary[locale].untranslatedSymptoms = untranslated;
      } else {
        console.log(`    ✓ Symptom-Optionen übersetzt`);
      }
    }

    await context.close();
  }

  // ── 4. Übersetzungs-Vollständigkeitscheck ─────────────────────────
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  ÜBERSETZUNGSTEST: i18next-Schlüsselvergleich`);
  console.log(`${'═'.repeat(60)}`);

  // Lade Übersetzungsdateien direkt
  const { readFileSync } = await import('fs');
  const enKeys = Object.keys(JSON.parse(readFileSync('/workspaces/Jobetes/packages/i18n/locales/en/common.json', 'utf-8')));
  const deKeys = Object.keys(JSON.parse(readFileSync('/workspaces/Jobetes/packages/i18n/locales/de/common.json', 'utf-8')));
  const arKeys = Object.keys(JSON.parse(readFileSync('/workspaces/Jobetes/packages/i18n/locales/ar/common.json', 'utf-8')));

  const missingInDe = enKeys.filter(k => !deKeys.includes(k));
  const missingInAr = enKeys.filter(k => !arKeys.includes(k));
  const extraInDe = deKeys.filter(k => !enKeys.includes(k));
  const extraInAr = arKeys.filter(k => !enKeys.includes(k));

  // Prüfe hero.badge (nur defaultValue, kein Key)
  console.log(`\n  Schlüssel gesamt: EN=${enKeys.length}, DE=${deKeys.length}, AR=${arKeys.length}`);
  if (missingInDe.length > 0) console.log(`  ⚠ Fehlend in DE: ${missingInDe.join(', ')}`);
  else console.log(`  ✓ DE hat alle EN-Schlüssel`);
  if (missingInAr.length > 0) console.log(`  ⚠ Fehlend in AR: ${missingInAr.join(', ')}`);
  else console.log(`  ✓ AR hat alle EN-Schlüssel`);
  if (extraInDe.length > 0) console.log(`  ℹ Nur in DE: ${extraInDe.join(', ')}`);
  if (extraInAr.length > 0) console.log(`  ℹ Nur in AR: ${extraInAr.join(', ')}`);

  // hero.badge defaultValue-Only Check
  const enJson = JSON.parse(readFileSync('/workspaces/Jobetes/packages/i18n/locales/en/common.json', 'utf-8'));
  const hasHeroBadge = 'hero.badge' in enJson;
  console.log(`\n  hero.badge in EN JSON: ${hasHeroBadge ? '✓' : '✗ FEHLT — nur als defaultValue in Code'}`);

  results.translationCheck = {
    en: enKeys.length,
    de: deKeys.length,
    ar: arKeys.length,
    missingInDe,
    missingInAr,
    extraInDe,
    extraInAr,
    heroBadgeMissing: !hasHeroBadge,
  };

  // ── 5. Bericht ────────────────────────────────────────────────────
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  ZUSAMMENFASSUNG`);
  console.log(`${'═'.repeat(60)}`);

  let totalIssues = 0;
  for (const locale of locales) {
    const loc = results.summary[locale];
    const issues = Object.values(loc.pageIssues).reduce((sum, p) => {
      return sum + p.rawKeys.length + p.englishLeakage.length + p.hardcoded.length;
    }, 0);
    totalIssues += issues;
    console.log(`\n  ${locale.toUpperCase()}: ${issues} Problem(e)`);
    for (const [pName, pData] of Object.entries(loc.pageIssues)) {
      const pIssues = pData.rawKeys.length + pData.englishLeakage.length + pData.hardcoded.length;
      if (pIssues > 0) {
        console.log(`    ${pName}: ${pIssues} Problem(e)`);
        if (pData.rawKeys.length > 0) console.log(`      Raw-Keys: ${pData.rawKeys.join(', ')}`);
        if (pData.englishLeakage.length > 0) console.log(`      Englische Strings: ${pData.englishLeakage.slice(0,3).join(' | ')}`);
        if (pData.hardcoded.length > 0) console.log(`      Hartkodiert: ${pData.hardcoded.map(h=>h.text).join(' | ')}`);
      }
    }
  }
  console.log(`\n  GESAMT: ${totalIssues} Problem(e) gefunden`);
  console.log(`  Screenshots: ${results.screenshots.length} Dateien in ${SCREENSHOT_DIR}`);

  // JSON-Report speichern
  const reportPath = '/workspaces/Jobetes/scripts/browser-test-report.json';
  writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n  📄 Bericht gespeichert: ${reportPath}`);

} finally {
  await browser.close();
}

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { PrismaClient, type Deal } from '@prisma/client';
import puppeteer from 'puppeteer';

/**
 * One-shot script: generates a one-page PDF factsheet per deal,
 * uploads to Supabase Storage, and updates deal.pdfUrl.
 *
 * Usage
 * -----
 *   npm run generate:pdfs              # only fill missing pdfUrls
 *   npm run generate:pdfs -- --force   # regenerate every deal's PDF
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in env (Supabase Storage writes
 * need elevated permissions; the anon role can only read).
 *
 * Flow
 * ----
 *   1. Ensure the `deal-documents` bucket exists (idempotent create)
 *   2. Launch headless Chromium via Puppeteer
 *   3. For each candidate deal:
 *       a. Render the HTML factsheet template with deal data
 *       b. Convert to PDF (A4, with margins)
 *       c. Upload to deal-documents/<slug>.pdf with upsert:true
 *       d. UPDATE deal.pdfUrl to the public URL
 *   4. Close browser + Prisma client
 *
 * Why Puppeteer rather than a JS PDF library
 * ------------------------------------------
 * Full HTML/CSS support means the factsheet looks like a real
 * document — typography, layout, flag emojis, custom colors all
 * render correctly. The Chromium install (~250MB) is a one-time
 * local cost, the script never runs on Railway.
 */

const BUCKET = 'deal-documents';

async function main() {
  const force = process.argv.includes('--force');

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  }

  const supabase = createClient(url, serviceKey);
  const prisma = new PrismaClient();

  try {
    // 1. Ensure bucket exists. createBucket errors with "Bucket already
    // exists" if it does — we swallow that specific error so the script
    // is idempotent on re-run.
    const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
      public: true,
    });
    if (createErr && !createErr.message.toLowerCase().includes('already')) {
      throw createErr;
    }

    // 2. Decide which deals to process
    const allDeals = await prisma.deal.findMany({ orderBy: { slug: 'asc' } });
    const targets = force ? allDeals : allDeals.filter((d) => !d.pdfUrl);

    if (targets.length === 0) {
      console.log('All deals already have PDFs. Pass --force to regenerate.');
      return;
    }
    console.log(`Generating PDFs for ${targets.length} deal(s)…\n`);

    // 3. Launch browser once, reuse for all PDFs
    const browser = await puppeteer.launch();
    try {
      for (const deal of targets) {
        const html = renderFactsheetHTML(deal);
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdf = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' },
        });
        await page.close();

        const path = `${deal.slug}.pdf`;
        const { error: uploadErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, pdf, {
            contentType: 'application/pdf',
            upsert: true,
          });
        if (uploadErr) throw uploadErr;

        const { data: publicUrlData } = supabase.storage
          .from(BUCKET)
          .getPublicUrl(path);

        await prisma.deal.update({
          where: { id: deal.id },
          data: { pdfUrl: publicUrlData.publicUrl },
        });

        console.log(`  ✓ ${deal.name.padEnd(30)} → ${path}`);
      }
    } finally {
      await browser.close();
    }

    console.log(`\nDone. ${targets.length} PDF(s) uploaded to bucket "${BUCKET}".`);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Inline HTML template for the factsheet. Rendered by Chromium to PDF.
 *
 * Layout: A4 portrait, sober palette matching the brand colors.
 * Sections (top to bottom): header, key economics, sponsor,
 * sentiment, risks, footer disclaimer.
 *
 * Kept inline (vs a separate .html file + template engine) because
 * (a) there's exactly one template, (b) string interpolation gives
 * us full type-safety on the deal fields, (c) no extra dep needed.
 */
function renderFactsheetHTML(deal: Deal): string {
  // Risks is stored as a JSONB array in the DB; cast to a known shape
  // for rendering.
  const risks = (deal.risks as unknown as Array<{
    category: string;
    severity: 'low' | 'med' | 'high';
    note: string;
  }>) ?? [];
  const signals = (deal.sentimentSignals as unknown as Array<{
    text: string;
    polarity: 'positive' | 'negative';
  }>) ?? [];

  const sentimentColor =
    deal.sentimentLabel === 'bullish'
      ? '#4A7C3A'
      : deal.sentimentLabel === 'cautious'
        ? '#B45309'
        : '#5A6B5F';

  const formatEuro = (n: number) =>
    `€${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

  const formatDate = (d: Date) =>
    new Date(d).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });

  const generatedAt = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${deal.name} — Factsheet</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #1C2820;
    line-height: 1.4;
    margin: 0;
    font-size: 11px;
  }
  header {
    border-bottom: 2px solid #1C2820;
    padding-bottom: 12px;
    margin-bottom: 18px;
  }
  .eyebrow {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #A87432;
    margin-bottom: 4px;
  }
  h1 {
    font-size: 22px;
    margin: 0 0 4px 0;
    font-weight: 500;
    letter-spacing: -0.02em;
  }
  .location {
    color: #5A6B5F;
    font-size: 11px;
  }
  .gen-date {
    float: right;
    color: #8B9285;
    font-size: 9px;
  }
  h2 {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: #5A6B5F;
    margin: 16px 0 8px 0;
    font-weight: 500;
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    gap: 12px;
    margin-bottom: 14px;
  }
  .kpi {
    border: 1px solid #E5E2DC;
    border-radius: 4px;
    padding: 8px 10px;
  }
  .kpi-label {
    font-size: 9px;
    text-transform: uppercase;
    color: #8B9285;
    margin-bottom: 2px;
    letter-spacing: 0.5px;
  }
  .kpi-value {
    font-size: 14px;
    font-weight: 500;
    color: #1C2820;
  }
  .block {
    border: 1px solid #E5E2DC;
    border-radius: 4px;
    padding: 12px 14px;
    margin-bottom: 12px;
  }
  .block p { margin: 0 0 6px 0; font-size: 11px; }
  .sentiment-chip {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 3px;
    background: ${sentimentColor}22;
    color: ${sentimentColor};
    font-size: 10px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  ul { margin: 4px 0 0 0; padding-left: 16px; }
  li { font-size: 10.5px; margin-bottom: 3px; color: #1C2820; }
  .signal-pos { color: #4A7C3A; }
  .signal-neg { color: #B45309; }
  .risk-row {
    display: grid;
    grid-template-columns: 24px 1fr 60px;
    gap: 8px;
    align-items: center;
    padding: 4px 0;
    border-bottom: 1px solid #F0EFEA;
    font-size: 10.5px;
  }
  .risk-row:last-child { border-bottom: 0; }
  .sev-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  .sev-low { background: #4A7C3A; }
  .sev-med { background: #B45309; }
  .sev-high { background: #B91C1C; }
  .sev-label {
    text-align: right;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #8B9285;
  }
  footer {
    margin-top: 16px;
    padding-top: 10px;
    border-top: 1px solid #E5E2DC;
    font-size: 9px;
    color: #8B9285;
    line-height: 1.4;
  }
</style>
</head>
<body>
  <header>
    <span class="gen-date">Generated ${generatedAt}</span>
    <div class="eyebrow">Term-Sheet Factsheet</div>
    <h1>${escapeHtml(deal.name)}</h1>
    <div class="location">${escapeHtml(deal.location)} · ${escapeHtml(deal.assetClass)} · ${deal.instrument.replace(/_/g, ' ')}</div>
  </header>

  <h2>Key economics</h2>
  <div class="grid">
    <div class="kpi"><div class="kpi-label">Target IRR</div><div class="kpi-value">${deal.targetIRR.toFixed(1)}%</div></div>
    <div class="kpi"><div class="kpi-label">Loan-to-value</div><div class="kpi-value">${deal.loanToValue}%</div></div>
    <div class="kpi"><div class="kpi-label">Maturity</div><div class="kpi-value">${deal.maturityMonths} mo</div></div>
    <div class="kpi"><div class="kpi-label">Distribution</div><div class="kpi-value">${deal.distribution === 'quarterly' ? 'Quarterly' : 'At maturity'}</div></div>
    <div class="kpi"><div class="kpi-label">Minimum ticket</div><div class="kpi-value">${formatEuro(deal.minimumTicket)}</div></div>
    <div class="kpi"><div class="kpi-label">Target raise</div><div class="kpi-value">${formatEuro(deal.targetRaise)}</div></div>
    <div class="kpi"><div class="kpi-label">Raised so far</div><div class="kpi-value">${formatEuro(deal.raisedAmount)}</div></div>
    <div class="kpi"><div class="kpi-label">Matures</div><div class="kpi-value">${formatDate(deal.maturityDate)}</div></div>
  </div>

  <h2>Sponsor</h2>
  <div class="block">
    <strong>${escapeHtml(deal.sponsorName)}</strong>
    <p>${escapeHtml(deal.sponsorDescription)}</p>
  </div>

  <h2>FinBERT sentiment</h2>
  <div class="block">
    <span class="sentiment-chip">${deal.sentimentLabel} · ${Math.round(deal.sentimentScore * 100)}%</span>
    ${signals.length > 0 ? `
      <ul>
        ${signals.map((s) => `<li class="${s.polarity === 'positive' ? 'signal-pos' : 'signal-neg'}">${escapeHtml(s.text)}</li>`).join('')}
      </ul>
    ` : ''}
  </div>

  <h2>Risk profile</h2>
  <div class="block">
    ${risks.map((r) => `
      <div class="risk-row">
        <span><span class="sev-dot sev-${r.severity}"></span></span>
        <span><strong>${escapeHtml(r.category)}</strong> — ${escapeHtml(r.note)}</span>
        <span class="sev-label">${r.severity}</span>
      </div>
    `).join('')}
  </div>

  <footer>
    Yeldo Deal Tracker — portfolio demonstration project by Ferdinand Straehuber.
    All investments are virtual. This document is illustrative; not investment advice
    or an offer to purchase securities. ${escapeHtml(deal.description)}
  </footer>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

main().catch((err) => {
  console.error('generate-deal-pdfs failed:', err);
  process.exit(1);
});

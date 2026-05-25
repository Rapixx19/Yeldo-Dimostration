# Brand tokens — Editorial Forest + Brass

The complete design system for the Yeldo Deal Tracker. Every color, typography, spacing, and component convention is defined here.

## Design philosophy

**Editorial. Premium. Distinctive.**

The palette is deliberately distinct from Yeldo's cleaner neutral palette — designed to feel **European luxury wealth platform**. Reads like a printed financial newspaper, not a SaaS dashboard. Two-weight typography (regular + medium) keeps it restrained.

| Choice | Why |
|---|---|
| Cream background, not pure white | Reads as printed paper / editorial — premium feel |
| Deep forest as primary dark, not black | Black is harsh; forest signals wealth + stability |
| Antique brass as accent (not gold) | Gold reads tacky; brass = Sotheby's / Pictet old-money signal |
| Sage green for "positive" | Softer than Yeldo's brighter green — refined |
| Warm forest-tinted secondaries | Cool gray = SaaS template. Warm = bespoke / handcrafted |

## Color tokens

```css
:root {
  /* Backgrounds */
  --bg-page:        #F8F5EE;  /* warm cream — page background */
  --bg-card:        #FFFFFF;  /* clean white — raised surfaces */
  --bg-soft:        #F0EBE0;  /* darker cream — KPI cards, soft fills */

  /* Brand */
  --brand-dark:     #1C2820;  /* deep forest — primary text, nav, CTAs */
  --brand-accent:   #A87432;  /* antique brass — accents, progress bars, highlights */

  /* Semantic */
  --text-success:   #4A7C3A;  /* sage green — positive IRR, gains */
  --text-warning:   #B45309;  /* amber — caution states */
  --text-danger:    #991B1B;  /* deep red — errors, losses */

  /* Text hierarchy */
  --text-primary:   #1C2820;  /* matches brand-dark */
  --text-secondary: #5A6B5F;  /* muted forest — labels, hints */
  --text-tertiary:  #8B9285;  /* further muted — footnotes */

  /* Borders */
  --border-light:   rgba(28, 40, 32, 0.08);
  --border-mid:     rgba(28, 40, 32, 0.15);

  /* Radius */
  --radius-md:      8px;   /* pills, small cards, inputs */
  --radius-lg:      12px;  /* large cards */
  --radius-xl:      16px;  /* hero containers */

  /* Spacing scale */
  --space-1:        4px;
  --space-2:        8px;
  --space-3:        12px;
  --space-4:        16px;
  --space-5:        20px;
  --space-6:        24px;
  --space-8:        32px;
  --space-12:       48px;

  /* Typography */
  --font-sans:      -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
                    Helvetica, Arial, sans-serif;
  --font-mono:      "SF Mono", Menlo, Monaco, Consolas, monospace;
}
```

## Tailwind config

In `frontend/tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        page: '#F8F5EE',
        card: '#FFFFFF',
        soft: '#F0EBE0',
        brand: {
          dark: '#1C2820',
          accent: '#A87432',
        },
        text: {
          primary: '#1C2820',
          secondary: '#5A6B5F',
          tertiary: '#8B9285',
          success: '#4A7C3A',
          warning: '#B45309',
          danger: '#991B1B',
        },
        border: {
          light: 'rgba(28, 40, 32, 0.08)',
          mid: 'rgba(28, 40, 32, 0.15)',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
    },
  },
  plugins: [],
};

export default config;
```

## Typography scale

| Size | Use | Tailwind class |
|---|---|---|
| **24px / 500** | Page title (h1) | `text-2xl font-medium` |
| **20px / 500** | Section heading (h2) | `text-xl font-medium` |
| **18px / 500** | Welcome message, KPI value | `text-lg font-medium` |
| **16px / 500** | Card title | `text-base font-medium` |
| **14px / 400** | Body text, table cells, buttons | `text-sm font-normal` |
| **13px / 400** | Body small, descriptions | `text-[13px]` |
| **12px / 400** | Labels, secondary text | `text-xs font-normal` |
| **11px / 400** | KPI labels (uppercase), footnotes | `text-[11px] uppercase tracking-wide` |

**Strict rule:** only two font weights — 400 (regular) and 500 (medium). No 600, 700, or bold. Heaviness comes from size + color, not weight.

## Component conventions

### KPI metric card
```jsx
<div className="bg-soft rounded-md p-4">
  <div className="text-[11px] text-text-secondary uppercase tracking-wide mb-2">
    Total invested
  </div>
  <div className="text-2xl font-medium text-text-primary">€45,200</div>
  <div className="text-xs text-text-secondary mt-2">across 6 deals</div>
</div>
```

### Pill / badge
```jsx
<span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-medium
                 bg-[rgba(28,40,32,0.08)] text-brand-dark">
  Senior Loan
</span>
```

### Card (raised surface)
```jsx
<div className="bg-card border border-border-light rounded-lg p-5">
  {/* card content */}
</div>
```

### Primary button (CTA)
```jsx
<button className="w-full py-3 bg-brand-dark text-page rounded-md
                   text-sm font-medium hover:opacity-90 transition">
  Invest now
</button>
```

### Progress bar (brass)
```jsx
<div className="w-full h-1 bg-soft rounded-full overflow-hidden">
  <div className="h-full bg-brand-accent rounded-full"
       style={{ width: '75%' }} />
</div>
```

### Sentiment chip (FinBERT)
```jsx
<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                 text-[11px] font-medium bg-text-success/15 text-text-success">
  <span className="w-1.5 h-1.5 rounded-full bg-text-success" />
  BULLISH · 87%
</span>
```

## Spacing rhythm

- Section spacing: `mb-6` (24px) between major sections
- Card internal padding: `p-5` (20px) for cards
- Tight stacks (related items): `gap-2` (8px) or `gap-3` (12px)
- Loose stacks (independent items): `gap-4` (16px)

## Accessibility

- All text on `--bg-page` (#F8F5EE) must use `--text-primary` (#1C2820) or `--text-secondary` (#5A6B5F) — both pass WCAG AA contrast
- Focus rings: 2px solid `--brand-accent` with 2px offset
- Buttons / interactive elements: min 36px tap target
- All ML educational badges have `aria-label` describing what they explain

## Files where this lives in the codebase

- `frontend/src/styles/brand.css` — CSS custom properties (above)
- `frontend/tailwind.config.ts` — Tailwind theme extension
- `frontend/src/styles/typography.css` — text utilities if needed beyond Tailwind defaults

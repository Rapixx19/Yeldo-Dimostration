export function formatEuro(amount: number, opts: { decimals?: boolean } = {}): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: opts.decimals ? 2 : 0,
    maximumFractionDigits: opts.decimals ? 2 : 0,
  }).format(amount);
}

export function formatCompactEuro(amount: number): string {
  if (amount >= 1_000_000) return `€${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `€${(amount / 1_000).toFixed(0)}K`;
  return `€${amount.toFixed(0)}`;
}

export function formatPercent(pct: number, decimals = 1): string {
  return `${pct.toFixed(decimals)}%`;
}

const COUNTRY_NAMES: Record<string, string> = {
  IT: 'Italy',
  ES: 'Spain',
  CH: 'Switzerland',
  DE: 'Germany',
  PT: 'Portugal',
};

export function countryName(code: string): string {
  return COUNTRY_NAMES[code] ?? code;
}

const COUNTRY_FLAGS: Record<string, string> = {
  IT: '🇮🇹',
  ES: '🇪🇸',
  CH: '🇨🇭',
  DE: '🇩🇪',
  PT: '🇵🇹',
};

export function countryFlag(code: string): string {
  return COUNTRY_FLAGS[code] ?? '🌍';
}

const INSTRUMENT_LABELS: Record<string, string> = {
  senior_loan: 'Senior Loan',
  mezzanine: 'Mezzanine Loan',
  senior_debt: 'Senior Debt',
  secured_mezzanine: 'Secured Mezzanine',
};

export function instrumentLabel(instrument: string): string {
  return INSTRUMENT_LABELS[instrument] ?? instrument;
}

export function distributionLabel(distribution: string): string {
  return distribution === 'quarterly' ? 'Quarterly' : 'At maturity';
}

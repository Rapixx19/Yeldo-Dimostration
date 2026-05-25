import { countryFlag, countryName } from '../lib/format';

export function Flag({ country, withName = false }: { country: string; withName?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm" aria-label={countryName(country)}>
      <span aria-hidden="true">{countryFlag(country)}</span>
      {withName && <span>{countryName(country)}</span>}
    </span>
  );
}

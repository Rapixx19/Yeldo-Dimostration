/**
 * Track-record fact extraction from sponsor descriptions.
 *
 * Sponsor descriptions in our seed data follow recognizable patterns
 * for numeric track-record claims:
 *   "20+ properties under management across 9 countries"
 *   "12 completed projects in the Milan luxury market"
 *   "1,200+ purpose-built student housing beds"
 *   "18 successful projects"
 *
 * This helper parses those numbers out so the Sponsor tab can render
 * them as scannable chips. Nothing is invented — if a description
 * has no numeric facts, an empty list is returned.
 *
 * Pattern: <number>(<+>)? <article-words>* <noun>
 *   - number can include commas (1,200) and may end with '+'
 *   - between number and noun we tolerate up to 3 filler words
 *     ("purpose-built", "successful", "completed", "comparable")
 *   - noun is whitelisted to plausible track-record units
 */

export interface TrackRecordFact {
  raw: string;            // the matched substring, for debugging
  number: string;         // e.g. "20+", "1,200+", "9"
  unit: string;           // e.g. "properties", "countries", "projects"
}

const TRACK_NOUNS = [
  'properties',
  'projects',
  'deals',
  'assets',
  'beds',
  'rooms',
  'units',
  'countries',
  'markets',
  'cities',
  'years',
];

// Builds: \b(\d[\d,]*\+?) (?:\w+(?:-\w+)? ){0,3}(NOUNS)\b
const PATTERN = new RegExp(
  String.raw`\b(\d[\d,]*\+?)\s+(?:[A-Za-z]+(?:-[A-Za-z]+)?\s+){0,3}(${TRACK_NOUNS.join('|')})\b`,
  'gi',
);

export function extractTrackRecord(description: string): TrackRecordFact[] {
  const facts: TrackRecordFact[] = [];
  const seen = new Set<string>();
  for (const match of description.matchAll(PATTERN)) {
    const [raw, number, unit] = match;
    if (!number || !unit) continue;
    // De-dupe (e.g. if a description mentions "12 projects" twice)
    const key = `${number}|${unit.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    facts.push({ raw, number, unit: unit.toLowerCase() });
  }
  return facts;
}

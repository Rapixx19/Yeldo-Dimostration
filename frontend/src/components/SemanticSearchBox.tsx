import type { SearchMode } from '../types/search';

interface Props {
  mode: SearchMode;
  onModeChange: (m: SearchMode) => void;
  query: string;
  onQueryChange: (q: string) => void;
  isLoading: boolean;
}

/**
 * Search input + mode toggle. Two modes:
 *   - keyword:  fast client-side filter on name/location/sponsor
 *   - semantic: OpenAI embedding + pgvector cosine similarity
 *
 * The two modes share the same input box so users don't have to retype
 * when they switch. The toggle is visible at all times so the mode is
 * never ambiguous.
 */
export function SemanticSearchBox({
  mode,
  onModeChange,
  query,
  onQueryChange,
  isLoading,
}: Props) {
  const placeholder =
    mode === 'semantic'
      ? 'Try "luxury alpine hotel" or "industrial conversion near Milan"'
      : 'Search by name, location, or sponsor…';

  return (
    <div className="bg-card border border-border-light rounded-lg p-3 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <ModeButton
          active={mode === 'keyword'}
          label="Keyword"
          onClick={() => onModeChange('keyword')}
        />
        <ModeButton
          active={mode === 'semantic'}
          label="Semantic (AI)"
          onClick={() => onModeChange('semantic')}
        />
        {mode === 'semantic' && isLoading && (
          <span className="text-[11px] text-text-tertiary ml-2">Embedding query…</span>
        )}
      </div>
      <input
        type="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder={placeholder}
        maxLength={500}
        className="w-full px-3 py-2 text-sm bg-page border border-border-light rounded-md focus:outline-none focus:border-brand-accent"
      />
      {mode === 'semantic' && (
        <p className="text-[10px] text-text-tertiary mt-1.5 leading-snug">
          Semantic mode ranks deals by cosine similarity between your query and the deal&apos;s
          OpenAI embedding (text-embedding-3-small, 1536-d) stored in pgvector. Debounced 400ms.
        </p>
      )}
    </div>
  );
}

function ModeButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
        active
          ? 'bg-brand-dark text-page'
          : 'text-text-secondary hover:text-text-primary hover:bg-soft'
      }`}
    >
      {label}
    </button>
  );
}

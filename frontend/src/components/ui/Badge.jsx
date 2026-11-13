// Shelter status (FR-34 + glossary): Open, Near Full, Full, Outdated (no update in 24h).
const tones = {
  full: 'bg-status-full text-white border-status-full',
  near: 'bg-status-near text-white border-status-near',
  open: 'bg-status-open text-ink border-status-open',
  outdated: 'bg-surface text-muted border-muted border-dashed',
  neutral: 'bg-surface text-ink border-line',
};

export default function Badge({ tone = 'neutral', children }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

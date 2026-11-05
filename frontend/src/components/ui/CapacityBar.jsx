import { capacityStatus } from '../../mock/shelters.js';

const fill = { full: 'bg-status-full', near: 'bg-status-near', open: 'bg-status-open' };

export default function CapacityBar({ occupied, total, showLabel = true }) {
  const pct = Math.round((occupied / total) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-2.5 w-full min-w-24 rounded-full bg-fill">
        <div className={`h-full rounded-full ${fill[capacityStatus(occupied, total)]}`} style={{ width: `${pct}%` }} />
      </div>
      {showLabel && <span className="w-20 shrink-0 text-right text-xs text-muted">{occupied}/{total} · {pct}%</span>}
    </div>
  );
}

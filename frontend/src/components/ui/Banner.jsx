const tones = {
  alert: 'border-l-4 border-status-full bg-fill',
  info: 'border-l-4 border-line bg-surface',
  success: 'border-l-4 border-status-near bg-surface',
};
const icons = { alert: '⚠', info: 'ℹ', success: '✓' };

export default function Banner({ tone = 'info', title, action, children }) {
  return (
    <div className={`flex items-start justify-between gap-4 rounded-md border border-line px-4 py-3 ${tones[tone]}`}>
      <div className="flex gap-3">
        <span aria-hidden className="text-lg leading-5">{icons[tone]}</span>
        <div className="text-sm">
          {title && <p className="font-semibold">{title}</p>}
          {children && <div className="text-muted">{children}</div>}
        </div>
      </div>
      {action}
    </div>
  );
}

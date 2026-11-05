// Gray box with an X for things not drawn yet: charts, maps, photos, logos.
export default function Placeholder({ label = 'Placeholder', className = 'h-40' }) {
  return (
    <div className={`relative flex items-center justify-center overflow-hidden rounded-md border border-dashed border-muted bg-fill ${className}`}>
      <svg className="absolute inset-0 h-full w-full text-line" preserveAspectRatio="none" aria-hidden>
        <line x1="0" y1="0" x2="100%" y2="100%" stroke="currentColor" />
        <line x1="100%" y1="0" x2="0" y2="100%" stroke="currentColor" />
      </svg>
      <span className="relative bg-fill px-2 text-xs font-medium text-muted">{label}</span>
    </div>
  );
}

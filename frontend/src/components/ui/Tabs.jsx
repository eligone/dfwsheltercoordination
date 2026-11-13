// Static tabs: pass `active` to show the state you are wireframing.
export default function Tabs({ items, active }) {
  return (
    <div className="flex gap-1 border-b border-line">
      {items.map((t) => (
        <span
          key={t}
          className={`px-4 py-2 text-sm ${t === active ? 'border-b-2 border-accent font-semibold' : 'text-muted'}`}
        >
          {t}
        </span>
      ))}
    </div>
  );
}

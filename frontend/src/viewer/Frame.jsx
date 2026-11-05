// One wireframe in one state, with the label strip the assignment asks for
// (use case + owner). Screenshot this whole box.
export default function Frame({ meta, state, children }) {
  return (
    <figure className="overflow-hidden rounded-md border border-line bg-surface shadow-sm" style={{ width: meta.width ?? 1024 }}>
      <figcaption className="flex justify-between gap-4 border-b border-line bg-fill px-3 py-1.5 font-mono text-xs">
        <span>
          {meta.uc ?? 'UC-?'} · {meta.title ?? 'Untitled'} · <b>state: {state}</b>
        </span>
        <span>{meta.owner ?? 'owner?'}</span>
      </figcaption>
      <div className="relative">{children}</div>
    </figure>
  );
}

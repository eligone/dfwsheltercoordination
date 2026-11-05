// Shared wrapper for label + hint + error. Used by Input and Select.
export default function Field({ label, hint, error, children }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label && <span className="font-medium">{label}</span>}
      {children}
      {error ? (
        <span className="text-ink font-medium">⚠ {error}</span>
      ) : (
        hint && <span className="text-muted">{hint}</span>
      )}
    </label>
  );
}

export const controlClass = (error) =>
  `rounded-md border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted ${
    error ? 'border-ink border-2' : 'border-line'
  }`;

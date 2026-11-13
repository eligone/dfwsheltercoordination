// Renders "open" over the frame (the frame is position: relative).
// Wireframes show it open as a state; there is no open/close logic.
export default function Modal({ title, footer, children, width = 'max-w-lg' }) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-ink/40 p-6">
      <div className={`w-full ${width} rounded-lg border border-line bg-surface shadow-lg`}>
        <header className="border-b border-line px-5 py-3 font-semibold">{title}</header>
        <div className="p-5">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</footer>}
      </div>
    </div>
  );
}

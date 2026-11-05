const variants = {
  primary: 'bg-accent text-accent-ink border-accent hover:opacity-90',
  secondary: 'bg-surface text-ink border-line hover:bg-canvas',
  ghost: 'bg-transparent text-ink border-transparent hover:bg-fill',
};
const sizes = { sm: 'px-2.5 py-1 text-sm', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-base' };

export default function Button({ variant = 'primary', size = 'md', className = '', ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-md border font-medium ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}

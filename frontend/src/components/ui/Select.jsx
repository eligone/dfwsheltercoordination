import Field, { controlClass } from './Field.jsx';

export default function Select({ label, hint, error, options = [], className = '', ...props }) {
  return (
    <Field label={label} hint={hint} error={error}>
      <select className={`${controlClass(error)} ${className}`} {...props}>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </Field>
  );
}

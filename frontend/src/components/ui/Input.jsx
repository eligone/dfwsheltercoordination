import Field, { controlClass } from './Field.jsx';

export default function Input({ label, hint, error, className = '', ...props }) {
  return (
    <Field label={label} hint={hint} error={error}>
      <input className={`${controlClass(error)} ${className}`} {...props} />
    </Field>
  );
}

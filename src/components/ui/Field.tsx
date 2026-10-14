import { useId, type ReactNode } from 'react';
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: (id: string) => ReactNode;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children(id)}
      {hint && <small>{hint}</small>}
    </div>
  );
}
export function SelectOptions({
  values,
  placeholder = 'Seleccionar',
}: {
  values: string[];
  placeholder?: string;
}) {
  return (
    <>
      <option value="">{placeholder}</option>
      {values.map((value) => (
        <option key={value} value={value}>
          {value}
        </option>
      ))}
    </>
  );
}

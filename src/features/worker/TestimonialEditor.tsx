import type { Testimonial } from '../../lib/types';
import { Field } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
export function TestimonialEditor({
  value,
  onChange,
}: {
  value: Testimonial[];
  onChange: (value: Testimonial[]) => void;
}) {
  function update(index: number, patch: Partial<Testimonial>) {
    onChange(value.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  }
  return (
    <section>
      <h2>Testimonios (opcionales)</h2>
      <p className="muted">Se mostrarán como “Testimonio aportado por el trabajador”.</p>
      {value.map((t, i) => (
        <div key={i} className="testimonial">
          <Field label="Nombre público del recomendante">
            {(id) => (
              <input
                id={id}
                maxLength={100}
                value={t.name}
                onChange={(e) => update(i, { name: e.target.value })}
              />
            )}
          </Field>
          <Field label="Testimonio">
            {(id) => (
              <textarea
                id={id}
                maxLength={1000}
                value={t.text}
                onChange={(e) => update(i, { text: e.target.value })}
              />
            )}
          </Field>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onChange(value.filter((_, index) => index !== i))}
          >
            Quitar testimonio
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        disabled={value.length >= 10}
        onClick={() => onChange([...value, { name: '', text: '' }])}
      >
        + Agregar testimonio
      </Button>
    </section>
  );
}

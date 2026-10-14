import { useApp } from '../../app/AppContext';
import { Field, SelectOptions } from '../../components/ui/Field';
import type { WorkerProfile } from '../../lib/types';
export function ProfileDetailsFields({
  value: p,
  onChange,
}: {
  value: WorkerProfile;
  onChange: (patch: Partial<WorkerProfile>) => void;
}) {
  const { config } = useApp();
  return (
    <>
      <div className="form-grid">
        <Field label="Nombre público *">
          {(id) => (
            <input
              id={id}
              maxLength={100}
              value={p.name}
              onChange={(e) => onChange({ name: e.target.value })}
            />
          )}
        </Field>
        <Field label="Oficio principal *">
          {(id) => (
            <select
              id={id}
              value={p.category}
              onChange={(e) => onChange({ category: e.target.value })}
            >
              <SelectOptions values={config.categories} />
            </select>
          )}
        </Field>
        <Field label="WhatsApp *" hint="Número internacional, por ejemplo +58 412 123 4567.">
          {(id) => (
            <input
              id={id}
              type="tel"
              value={p.phone}
              onChange={(e) => onChange({ phone: e.target.value })}
            />
          )}
        </Field>
        <Field label="Parroquia donde te ubicas *">
          {(id) => (
            <select
              id={id}
              value={p.location}
              onChange={(e) => onChange({ location: e.target.value })}
            >
              <SelectOptions values={config.parishes} />
            </select>
          )}
        </Field>
      </div>
      <fieldset>
        <legend>Parroquias donde prestas servicios *</legend>
        <div className="checks">
          {config.parishes.map((area) => (
            <label key={area}>
              <input
                type="checkbox"
                checked={p.areas.includes(area)}
                onChange={(e) =>
                  onChange({
                    areas: e.target.checked
                      ? [...p.areas, area]
                      : p.areas.filter((a) => a !== area),
                  })
                }
              />
              {area}
            </label>
          ))}
        </div>
      </fieldset>
      <Field label="Describe tus servicios *">
        {(id) => (
          <textarea
            id={id}
            rows={5}
            maxLength={5000}
            value={p.description}
            onChange={(e) => onChange({ description: e.target.value })}
          />
        )}
      </Field>
      <Field label="Años de experiencia (opcional)">
        {(id) => (
          <input
            id={id}
            type="number"
            min={0}
            max={80}
            value={p.experience}
            onChange={(e) =>
              onChange({ experience: e.target.value === '' ? '' : Number(e.target.value) })
            }
          />
        )}
      </Field>
    </>
  );
}

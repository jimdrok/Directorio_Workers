import { useNavigate } from 'react-router-dom';
import { useApp } from '../../app/AppContext';
import { Field, SelectOptions } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
export function SearchForm({ category = '', parish = '' }: { category?: string; parish?: string }) {
  const { config } = useApp();
  const navigate = useNavigate();
  return (
    <form
      className="search"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        navigate(
          '/buscar?' +
            new URLSearchParams({
              category: String(data.get('category')),
              parish: String(data.get('parish')),
            }),
        );
      }}
    >
      <Field label="¿Qué servicio necesitas?">
        {(id) => (
          <select id={id} name="category" defaultValue={category}>
            <SelectOptions values={config.categories} placeholder="Todos los oficios" />
          </select>
        )}
      </Field>
      <Field label="¿En qué parroquia?">
        {(id) => (
          <select id={id} name="parish" defaultValue={parish}>
            <SelectOptions values={config.parishes} placeholder="Toda La Guaira" />
          </select>
        )}
      </Field>
      <Button>Buscar trabajadores ↗</Button>
    </form>
  );
}

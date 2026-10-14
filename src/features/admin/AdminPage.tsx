import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errorMessage } from '../../lib/api';
import { useResource } from '../../lib/useResource';
import { useApp } from '../../app/AppContext';
import { statusLabels } from '../../lib/types';
import { Feedback, ResourceError } from '../../components/ui/Feedback';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
export function AdminPage() {
  const resource = useResource(useCallback((signal: AbortSignal) => api.admin(signal), []));
  const { refreshConfig } = useApp();
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [name, setName] = useState('');
  async function mutate(action: () => Promise<unknown>) {
    setBusy(true);
    setError('');
    try {
      await action();
      await refreshConfig();
      resource.reload();
      setName('');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Link to="/panel">← Mi panel</Link>
      <h1>Administración</h1>
      {error && <Feedback error>{error}</Feedback>}
      {resource.loading ? (
        <Feedback>Cargando administración…</Feedback>
      ) : resource.error ? (
        <ResourceError message={resource.error} retry={resource.reload} />
      ) : (
        resource.data && (
          <>
            <h2>Perfiles</h2>
            {resource.data.profiles.length ? (
              resource.data.profiles.map((p) => (
                <div className="admin-row" key={p.id}>
                  <span>
                    {p.name || 'Sin nombre'} · {statusLabels[p.status]} {p.hidden ? '· Oculto' : ''}
                  </span>
                  <Button
                    disabled={busy}
                    onClick={() => void mutate(() => api.hideProfile(p.id!, !p.hidden))}
                  >
                    {p.hidden ? 'Restaurar visibilidad' : 'Ocultar'}
                  </Button>
                </div>
              ))
            ) : (
              <p>No hay perfiles todavía.</p>
            )}
            <h2>Categorías</h2>
            {resource.data.categories.map((c) => (
              <div className="admin-row" key={c.id}>
                <span>
                  {c.name} · {c.active ? 'Activa' : 'Inactiva'}
                </span>
                <Button
                  disabled={busy}
                  onClick={() => void mutate(() => api.saveCategory(c.name, !c.active))}
                >
                  {c.active ? 'Desactivar' : 'Activar'}
                </Button>
              </div>
            ))}
            <form
              className="new-category"
              onSubmit={(e) => {
                e.preventDefault();
                void mutate(() => api.saveCategory(name, true));
              }}
            >
              <Field label="Nueva categoría">
                {(id) => (
                  <input
                    id={id}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={80}
                  />
                )}
              </Field>
              <Button disabled={busy}>Agregar categoría</Button>
            </form>
          </>
        )
      )}
    </>
  );
}

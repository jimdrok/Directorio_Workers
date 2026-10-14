import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../app/AppContext';
import { api, errorMessage } from '../../lib/api';
import { useResource } from '../../lib/useResource';
import { Feedback, ResourceError } from '../../components/ui/Feedback';
import { Button } from '../../components/ui/Button';
import { ProfileEditor } from './ProfileEditor';
export function WorkerPage() {
  const { user, refreshUser } = useApp();
  const navigate = useNavigate();
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const resource = useResource(useCallback((signal: AbortSignal) => api.ownProfile(signal), []));
  return (
    <>
      <div className="section-title">
        <div>
          <p className="eyebrow">PANEL DEL TRABAJADOR</p>
          <h1 className="page-title">Tu oficio, tu espacio.</h1>
        </div>
        <div>
          {user?.admin && (
            <>
              <Link to="/admin">Administración</Link>
              {' · '}
            </>
          )}
          <Button
            variant="secondary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await api.logout();
                await refreshUser();
                navigate('/');
              } catch (e) {
                setError(errorMessage(e));
              } finally {
                setBusy(false);
              }
            }}
          >
            Cerrar sesión
          </Button>
        </div>
      </div>
      {error && <Feedback error>{error}</Feedback>}
      {resource.loading ? (
        <Feedback>Cargando tu perfil…</Feedback>
      ) : resource.error ? (
        <ResourceError message={resource.error} retry={resource.reload} />
      ) : (
        resource.data && <ProfileEditor initial={resource.data} />
      )}
    </>
  );
}

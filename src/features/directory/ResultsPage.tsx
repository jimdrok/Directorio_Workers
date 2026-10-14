import { useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { useResource } from '../../lib/useResource';
import { Feedback, ResourceError } from '../../components/ui/Feedback';
import { SearchForm } from './SearchForm';
import { ProfileCard } from './ProfileCard';
export function ResultsPage() {
  const [params] = useSearchParams();
  const query = params.toString();
  const resource = useResource(
    useCallback((signal: AbortSignal) => api.search(query, signal), [query]),
  );
  return (
    <>
      <p className="eyebrow">SERVICIOS EN LA GUAIRA</p>
      <h1 className="page-title">Encuentra buenas manos.</h1>
      <SearchForm
        key={query}
        category={params.get('category') ?? ''}
        parish={params.get('parish') ?? ''}
      />
      {resource.loading ? (
        <Feedback>Buscando trabajadores…</Feedback>
      ) : resource.error ? (
        <ResourceError message={resource.error} retry={resource.reload} />
      ) : resource.data?.length ? (
        <>
          <p className="muted">{resource.data.length} trabajadores disponibles</p>
          <div className="cards">
            {resource.data.map((p) => (
              <ProfileCard key={p.id} profile={p} />
            ))}
          </div>
        </>
      ) : (
        <div className="empty">
          <h2>Aún no hay trabajadores con estos filtros.</h2>
          <p>Prueba otra parroquia u oficio.</p>
          <Link to="/buscar">Ver todos los servicios →</Link>
        </div>
      )}
    </>
  );
}

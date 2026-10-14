import { useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { useResource } from '../../lib/useResource';
import { Feedback, ResourceError } from '../../components/ui/Feedback';
import { Avatar } from './ProfileCard';
export function PublicProfilePage() {
  const { id = '' } = useParams();
  const resource = useResource(
    useCallback((signal: AbortSignal) => api.publicProfile(id, signal), [id]),
  );
  if (resource.loading) return <Feedback>Cargando perfil…</Feedback>;
  if (resource.error) return <ResourceError message={resource.error} retry={resource.reload} />;
  const p = resource.data;
  if (!p) return null;
  const message = `Hola, vi tu perfil en La Guaira Conecta. Estoy buscando un servicio de ${p.category}.`;
  return (
    <>
      <Link className="back" to="/buscar">
        ← Volver a los resultados
      </Link>
      {p.demo && (
        <Feedback>Perfil de demostración: nombre, trayectoria y testimonios ficticios.</Feedback>
      )}
      <section className="profile">
        <div>
          <Avatar name={p.name} src={p.avatar} large />
          <span className="tag">{p.category}</span>
          <h1>{p.name}</h1>
          <p className="muted">
            ⌖ {p.location}
            {p.experience !== '' && ` · ${p.experience} años de experiencia`}
          </p>
          <h2>Servicios que ofrezco</h2>
          <p className="preserve">{p.description}</p>
          <h2>Parroquias donde trabajo</h2>
          <div className="chips">
            {p.areas.map((a) => (
              <span key={a}>{a}</span>
            ))}
          </div>
          {p.photos.length > 0 && (
            <>
              <h2>Mis trabajos</h2>
              <div className="gallery">
                {p.photos.map((src, i) => (
                  <img key={i} src={src} alt={`Trabajo ${i + 1} realizado por ${p.name}`} />
                ))}
              </div>
            </>
          )}
          {p.testimonials.length > 0 && (
            <>
              <h2>Testimonios</h2>
              {p.testimonials.map((t, i) => (
                <blockquote key={i}>
                  <p>“{t.text}”</p>
                  <b>{t.name}</b>
                  <small>Testimonio aportado por el trabajador</small>
                </blockquote>
              ))}
            </>
          )}
        </div>
        <aside>
          <h2>Hablemos de tu proyecto</h2>
          <p>Consulta disponibilidad y coordina directamente con {p.name}.</p>
          {p.demo ? (
            <>
              <button className="whatsapp" disabled>
                Contactar por WhatsApp
              </button>
              <p className="muted">
                Contacto desactivado en este ejemplo. En un perfil real, este botón abre WhatsApp
                con el mensaje del servicio.
              </p>
            </>
          ) : (
            <a
              className="button whatsapp"
              target="_blank"
              rel="noopener noreferrer"
              href={`https://wa.me/${p.phone.slice(1)}?text=${encodeURIComponent(message)}`}
            >
              Contactar por WhatsApp ↗
            </a>
          )}
        </aside>
      </section>
    </>
  );
}

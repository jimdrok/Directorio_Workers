import { Link } from 'react-router-dom';
import type { PublicProfile } from '../../lib/types';
export function Avatar({
  name,
  src,
  large = false,
}: {
  name: string;
  src?: string;
  large?: boolean;
}) {
  return (
    <div className={`avatar ${large ? 'large' : ''}`}>
      {src ? <img src={src} alt={`Foto de ${name}`} /> : name.charAt(0)}
    </div>
  );
}
export function ProfileCard({ profile: p }: { profile: PublicProfile }) {
  return (
    <Link className="card" to={`/perfil/${p.id}`}>
      <Avatar name={p.name} src={p.avatar} />
      <span className="tag">{p.category}</span>
      <h3>{p.name}</h3>
      {p.demo && <p className="muted">Perfil de demostración · Datos ficticios</p>}
      <p className="muted">⌖ {p.location}</p>
      <p>{p.description.slice(0, 140)}</p>
      <div className="card-bottom">
        Ver perfil <span>↗</span>
      </div>
    </Link>
  );
}

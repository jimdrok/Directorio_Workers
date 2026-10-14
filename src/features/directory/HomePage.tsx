import { Link } from 'react-router-dom';
import { useApp } from '../../app/AppContext';
import { SearchForm } from './SearchForm';
const icons = ['⌁', '▧', '✂', '◩', 'ϟ', '✄', '▱', '❄', '✧'];
export function HomePage() {
  const { config } = useApp();
  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">HECHO EN LA GUAIRA · PARA NUESTRA GENTE</p>
          <h1>
            Buenas manos.
            <br />
            <span>Cerca de ti.</span>
          </h1>
          <p className="lead">
            Encuentra a quien sabe hacerlo. Conecta con trabajadores de nuestra costa y dale vida a
            tu próximo proyecto.
          </p>
          <div className="hero-links">
            <Link className="button" to="/buscar">
              Encontrar un trabajador ↗
            </Link>
            <Link to="/registro">Soy trabajador →</Link>
          </div>
          <p className="micro">Sin registro para buscar · Contacto directo por WhatsApp</p>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="sun" />
          <div className="mountain" />
          <div className="sea" />
          <div className="art-label">
            Talento local.
            <br />
            Grandes soluciones.
          </div>
          <span className="art-pin">⌖ La Guaira, Venezuela</span>
        </div>
      </section>
      <section className="search-block">
        <SearchForm />
      </section>
      <section>
        <div className="section-title">
          <div>
            <p className="eyebrow">UN OFICIO PARA CADA NECESIDAD</p>
            <h2>¿Qué necesitas resolver?</h2>
          </div>
          <span className="muted">Personas que saben, aquí mismo.</span>
        </div>
        <div className="categories">
          {config.categories.map((c, i) => (
            <Link key={c} to={'/buscar?category=' + encodeURIComponent(c)}>
              <span>{icons[i % icons.length]}</span>
              <h3>{c}</h3>
              <b>↗</b>
            </Link>
          ))}
        </div>
      </section>
      <section className="join">
        <div>
          <p className="eyebrow">TU OFICIO MERECE SER VISTO</p>
          <h2>
            ¿Trabajas con tus manos?
            <br />
            Que La Guaira te encuentre.
          </h2>
          <p>Publica tus servicios y recibe consultas directamente en tu WhatsApp.</p>
        </div>
        <Link className="button" to="/registro">
          Crear mi perfil gratis ↗
        </Link>
      </section>
    </>
  );
}

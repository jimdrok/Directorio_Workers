import { Link, Outlet } from 'react-router-dom';
import { useApp } from './AppContext';
export function Layout() {
  const { user } = useApp();
  return (
    <>
      <header>
        <Link className="brand" to="/">
          ◈{' '}
          <span>
            La Guaira <b>Conecta</b>
          </span>
        </Link>
        <nav>
          <Link to="/buscar">Buscar servicios</Link>
          <Link className="button small" to="/panel">
            {user ? 'Mi panel ↗' : 'Publicar mis servicios ↗'}
          </Link>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
      <footer>
        <Link className="brand" to="/">
          ◈ La Guaira Conecta
        </Link>
        <p>El talento de nuestra costa, más cerca de ti.</p>
        <small>La Guaira, Venezuela · Contacta y coordina directamente con el trabajador.</small>
      </footer>
    </>
  );
}

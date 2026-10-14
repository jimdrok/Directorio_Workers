import { HashRouter, Link, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AppProvider, useApp } from './AppContext';
import { Layout } from './Layout';
import { HomePage } from '../features/directory/HomePage';
import { ResultsPage } from '../features/directory/ResultsPage';
import { PublicProfilePage } from '../features/directory/PublicProfilePage';
import { AuthPage } from '../features/auth/AuthPage';
import { WorkerPage } from '../features/worker/WorkerPage';
import { AdminPage } from '../features/admin/AdminPage';
function RequireUser({ admin = false }: { admin?: boolean }) {
  const { user } = useApp();
  if (!user) return <Navigate to="/ingresar" replace />;
  if (admin && !user.admin)
    return (
      <div className="empty">
        <h1>Acceso exclusivo para administradores</h1>
        <Link to="/panel">Volver a mi panel</Link>
      </div>
    );
  return <Outlet />;
}
export function App() {
  return (
    <HashRouter>
      <AppProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="buscar" element={<ResultsPage />} />
            <Route path="perfil/:id" element={<PublicProfilePage />} />
            <Route path="registro" element={<AuthPage register />} />
            <Route path="ingresar" element={<AuthPage />} />
            <Route element={<RequireUser />}>
              <Route path="panel" element={<WorkerPage />} />
            </Route>
            <Route element={<RequireUser admin />}>
              <Route path="admin" element={<AdminPage />} />
            </Route>
            <Route
              path="*"
              element={
                <div className="empty">
                  <h1>Esta página no está disponible</h1>
                  <Link to="/">Volver al inicio</Link>
                </div>
              }
            />
          </Route>
        </Routes>
      </AppProvider>
    </HashRouter>
  );
}

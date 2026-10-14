import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, errorMessage } from '../lib/api';
import type { DirectoryConfig, User } from '../lib/types';
import { Feedback, ResourceError } from '../components/ui/Feedback';
interface AppState {
  config: DirectoryConfig;
  user: User | null;
  refreshUser: () => Promise<void>;
  refreshConfig: () => Promise<void>;
}
const Context = createContext<AppState | null>(null);
export function AppProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<DirectoryConfig | null>(null),
    [user, setUser] = useState<User | null>(null),
    [error, setError] = useState('');
  const refreshUser = useCallback(async () => setUser((await api.me()).user), []);
  const refreshConfig = useCallback(async () => setConfig(await api.config()), []);
  const initialize = useCallback(() => {
    setError('');
    Promise.all([refreshConfig(), refreshUser()]).catch((e) => setError(errorMessage(e)));
  }, [refreshConfig, refreshUser]);
  useEffect(initialize, [initialize]);
  if (error) return <ResourceError message={error} retry={initialize} />;
  if (!config) return <Feedback>Cargando…</Feedback>;
  return (
    <Context.Provider value={{ config, user, refreshUser, refreshConfig }}>
      {children}
    </Context.Provider>
  );
}
export function useApp() {
  const context = useContext(Context);
  if (!context) throw Error('Falta AppProvider');
  return context;
}

import type { AdminData, DirectoryConfig, PublicProfile, User, WorkerProfile } from './types';
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
async function request<T>(
  path: string,
  method = 'GET',
  data?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: data === undefined ? undefined : JSON.stringify(data),
    signal,
  });
  if (!response.headers.get('Content-Type')?.includes('application/json')) {
    throw new ApiError(
      'La API no está disponible. Revisa que el backend esté incluido en el despliegue.',
      503,
    );
  }
  const result = await response.json();
  if (!response.ok)
    throw new ApiError(result.error ?? 'No pudimos completar la solicitud.', response.status);
  return result as T;
}
export const api = {
  config: (signal?: AbortSignal) => request<DirectoryConfig>('/config', 'GET', undefined, signal),
  me: () => request<{ user: User | null }>('/me'),
  authenticate: (register: boolean, data: { email: string; password: string }) =>
    request('/' + (register ? 'register' : 'login'), 'POST', data),
  logout: () => request('/logout', 'POST'),
  search: (query: string, signal?: AbortSignal) =>
    request<PublicProfile[]>('/profiles?' + query, 'GET', undefined, signal),
  publicProfile: (id: string, signal?: AbortSignal) =>
    request<PublicProfile>('/profiles/' + encodeURIComponent(id), 'GET', undefined, signal),
  ownProfile: (signal?: AbortSignal) =>
    request<WorkerProfile>('/profile', 'GET', undefined, signal),
  saveProfile: (data: WorkerProfile) => request<WorkerProfile>('/profile', 'PUT', data),
  admin: (signal?: AbortSignal) => request<AdminData>('/admin', 'GET', undefined, signal),
  hideProfile: (id: string, hidden: boolean) => request('/admin/profile', 'PUT', { id, hidden }),
  saveCategory: (name: string, active: boolean) =>
    request('/admin/category', 'PUT', { name, active }),
};
export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Ocurrió un error. Inténtalo nuevamente.';

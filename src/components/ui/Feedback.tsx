import type { ReactNode } from 'react';
import { Button } from './Button';
export function Feedback({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return (
    <p className={`notice ${error ? 'error' : ''}`} role={error ? 'alert' : 'status'}>
      {children}
    </p>
  );
}
export function ResourceError({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div className="empty">
      <Feedback error>{message}</Feedback>
      <Button onClick={retry}>Intentar de nuevo</Button>
    </div>
  );
}

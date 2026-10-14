import { useEffect, useState } from 'react';
import { errorMessage } from './api';
export function useResource<T>(load: (signal: AbortSignal) => Promise<T>) {
  const [state, setState] = useState<{ data: T | null; loading: boolean; error: string }>({
    data: null,
    loading: true,
    error: '',
  });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState({ data: null, loading: true, error: '' });
    load(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setState({ data, loading: false, error: '' });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({ data: null, loading: false, error: errorMessage(error) });
      });
    return () => controller.abort();
  }, [load, revision]);
  return { ...state, reload: () => setRevision((value) => value + 1) };
}

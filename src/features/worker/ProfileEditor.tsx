import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errorMessage } from '../../lib/api';
import {
  emptyProfile,
  statusLabels,
  type PublicationStatus,
  type WorkerProfile,
} from '../../lib/types';
import { Button } from '../../components/ui/Button';
import { Feedback } from '../../components/ui/Feedback';
import { ProfileDetailsFields } from './ProfileDetailsFields';
import { PhotoEditor } from './PhotoEditor';
import { TestimonialEditor } from './TestimonialEditor';
export function ProfileEditor({ initial }: { initial: WorkerProfile }) {
  const [profile, setProfile] = useState<WorkerProfile>({ ...emptyProfile, ...initial });
  const [busy, setBusy] = useState(false),
    [photosBusy, setPhotosBusy] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState(false);
  const patch = (changes: Partial<WorkerProfile>) => setProfile((p) => ({ ...p, ...changes }));
  async function save(status: PublicationStatus) {
    setBusy(true);
    setError(false);
    setMessage('Guardando…');
    try {
      const saved = await api.saveProfile({ ...profile, status });
      setProfile({ ...emptyProfile, ...saved });
      setMessage('Cambios guardados correctamente.');
    } catch (e) {
      setError(true);
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Feedback>
        Estado: <b>{statusLabels[profile.status]}</b>
        {profile.hidden ? ' · Oculto por administración' : ''}
        {profile.status === 'published' && !profile.hidden && (
          <>
            {' · '}
            <Link to={`/perfil/${profile.id}`}>Ver perfil público ↗</Link>
          </>
        )}
      </Feedback>
      <form
        className="editor"
        onSubmit={(e) => {
          e.preventDefault();
          if (!busy && !photosBusy) void save('published');
        }}
      >
        <fieldset className="editor-fields" disabled={busy}>
          <ProfileDetailsFields value={profile} onChange={patch} />
          <PhotoEditor
            avatar={profile.avatar}
            photos={profile.photos}
            onChange={patch}
            onBusyChange={setPhotosBusy}
          />
          <TestimonialEditor
            value={profile.testimonials}
            onChange={(testimonials) => patch({ testimonials })}
          />
        </fieldset>
        {message && <Feedback error={error}>{message}</Feedback>}
        <div className="actions">
          <Button disabled={busy || photosBusy}>
            {profile.status === 'published' ? 'Guardar y mantener publicado' : 'Publicar perfil'} ↗
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={busy || photosBusy}
            onClick={() => void save('draft')}
          >
            Guardar borrador
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={busy || photosBusy}
            onClick={() => void save('paused')}
          >
            Guardar y pausar
          </Button>
        </div>
      </form>
    </>
  );
}

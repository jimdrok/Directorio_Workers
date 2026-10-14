import { useState } from 'react';
import { Field } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { Feedback } from '../../components/ui/Feedback';
import { readImage } from './imageFiles';
import { errorMessage } from '../../lib/api';
export function PhotoEditor({
  avatar,
  photos,
  onChange,
  onBusyChange,
}: {
  avatar: string;
  photos: string[];
  onChange: (patch: { avatar?: string; photos?: string[] }) => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  async function upload(files: File[], kind: 'avatar' | 'photos') {
    setError('');
    setBusy(true);
    onBusyChange(true);
    try {
      if (kind === 'photos' && photos.length + files.length > 6)
        throw Error('Puedes agregar hasta 6 fotos');
      const images = await Promise.all(files.map(readImage));
      onChange(
        kind === 'avatar' ? { avatar: images[0] ?? '' } : { photos: [...photos, ...images] },
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
      onBusyChange(false);
    }
  }
  return (
    <section>
      <div className="form-grid">
        <Field label="Foto de perfil (opcional)">
          {(id) => (
            <>
              <input
                id={id}
                disabled={busy}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  void upload(Array.from(e.target.files ?? []), 'avatar');
                  e.target.value = '';
                }}
              />
              {avatar && (
                <div>
                  <img className="thumb" src={avatar} alt="Vista previa de foto de perfil" />
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={busy}
                    onClick={() => onChange({ avatar: '' })}
                  >
                    Quitar foto
                  </Button>
                </div>
              )}
            </>
          )}
        </Field>
        <Field label="Fotos de trabajos (hasta 6)">
          {(id) => (
            <>
              <input
                id={id}
                disabled={busy}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  void upload(Array.from(e.target.files ?? []), 'photos');
                  e.target.value = '';
                }}
              />
              <div className="photo-preview">
                {photos.map((src, i) => (
                  <div key={i}>
                    <img className="thumb" src={src} alt={`Vista previa de trabajo ${i + 1}`} />
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={busy}
                      onClick={() => onChange({ photos: photos.filter((_, index) => index !== i) })}
                    >
                      Quitar
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </Field>
      </div>
      {busy && <Feedback>Procesando fotos…</Feedback>}
      {error && <Feedback error>{error}</Feedback>}
    </section>
  );
}

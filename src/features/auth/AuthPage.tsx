import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../app/AppContext';
import { api, errorMessage } from '../../lib/api';
import { Field } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { Feedback } from '../../components/ui/Feedback';
export function AuthPage({ register = false }: { register?: boolean }) {
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const { refreshUser } = useApp();
  const navigate = useNavigate();
  return (
    <section className="auth">
      <p className="eyebrow">TU TALENTO, MÁS CERCA</p>
      <h1>{register ? 'Empieza a conectar.' : 'Qué bueno verte.'}</h1>
      <p>
        {register
          ? 'Crea tu cuenta para publicar tus servicios.'
          : 'Ingresa para gestionar tu perfil.'}
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          setBusy(true);
          setError('');
          try {
            await api.authenticate(register, {
              email: String(data.get('email')),
              password: String(data.get('password')),
            });
            await refreshUser();
            navigate('/panel');
          } catch (e) {
            setError(errorMessage(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field label={register ? 'Correo electrónico' : 'Usuario o correo electrónico'}>
          {(id) => (
            <input
              id={id}
              name="email"
              type={register ? 'email' : 'text'}
              autoComplete={register ? 'email' : 'username'}
              required
            />
          )}
        </Field>
        <Field label="Contraseña" hint="Al menos 10 caracteres.">
          {(id) => (
            <input
              id={id}
              name="password"
              type="password"
              autoComplete={register ? 'new-password' : 'current-password'}
              minLength={10}
              maxLength={200}
              required
            />
          )}
        </Field>
        {error && <Feedback error>{error}</Feedback>}
        <Button disabled={busy}>
          {busy ? 'Procesando…' : register ? 'Crear mi cuenta ↗' : 'Iniciar sesión ↗'}
        </Button>
      </form>
      <p>
        {register ? '¿Ya tienes cuenta?' : '¿Primera vez por aquí?'}{' '}
        <Link to={register ? '/ingresar' : '/registro'}>
          {register ? 'Inicia sesión' : 'Regístrate'}
        </Link>
      </p>
    </section>
  );
}

import type { WorkerProfile, User, DirectoryConfig } from '../src/lib/types';
import demoProfiles from './demo.json';
import { ChunkedStorage, type Storage } from './storage';
interface State {
  storage: Storage;
  blockConcurrencyWhile<T>(callback: () => Promise<T>): Promise<T>;
}
interface Env {
  DIRECTORY: {
    idFromName(name: string): unknown;
    get(id: unknown): { fetch(request: Request): Promise<Response> };
  };
  ASSETS: { fetch(request: Request): Promise<Response> };
  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD?: string;
}
interface StoredUser extends User {
  id: string;
  password: string;
  salt: string;
}
interface Session {
  userId: string;
  expires: number;
}
const categories = [
  'Plomería',
  'Albañilería',
  'Estilismo y barbería',
  'Pintura',
  'Electricidad',
  'Costura',
  'Carpintería',
  'Refrigeración',
  'Limpieza',
];
const parishes = [
  'Caraballeda',
  'Carayaca',
  'Carlos Soublette',
  'Caruao',
  'Catia La Mar',
  'El Junko',
  'La Guaira',
  'Macuto',
  'Maiquetía',
  'Naiguatá',
  'Urimare',
];
const json = (data: unknown, status = 200, cookie?: string) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...(cookie ? { 'Set-Cookie': cookie } : {}),
    },
  });
async function hash(password: string, salt: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const result = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 100000, hash: 'SHA-256' },
    key,
    256,
  );
  return Array.from(new Uint8Array(result), (b) => b.toString(16).padStart(2, '0')).join('');
}
function same(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}
function cookie(token: string, secure: boolean, maxAge = 604800) {
  return `session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}
class HttpError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export class Directory {
  private ready: Promise<void>;
  private storage: Storage;
  constructor(
    state: State,
    private env: Env,
  ) {
    this.storage = new ChunkedStorage(state.storage);
    this.ready = state.blockConcurrencyWhile(async () => {
      if (await this.storage.get('initialized')) return;
      const email = (env.ADMIN_EMAIL ?? 'admin@laguaira.local').trim().toLowerCase();
      const password = env.ADMIN_PASSWORD ?? 'guaria2026';
      if (password.length < 10) throw Error('ADMIN_PASSWORD debe tener al menos 10 caracteres');
      const salt = crypto.randomUUID();
      await this.storage.put('user:' + email, {
        id: crypto.randomUUID(),
        email,
        admin: true,
        salt,
        password: await hash(password, salt),
      });
      await this.storage.put(
        'categories',
        categories.map((name, id) => ({ id: id + 1, name, active: 1 })),
      );
      const demoSalt = crypto.randomUUID();
      const demoPassword = await hash('guaria2026', demoSalt);
      for (const p of demoProfiles) {
        await this.storage.put('profile:' + p.userId, p.profile);
        const email = p.userId.replace('demo-user-', '') + '@ejemplo.invalid';
        await this.storage.put('user:' + email, {
          id: p.userId,
          email,
          admin: false,
          salt: demoSalt,
          password: demoPassword,
        });
      }
      await this.storage.put('initialized', true);
    });
  }
  async fetch(request: Request): Promise<Response> {
    try {
      await this.ready;
      return await this.handle(request);
    } catch (e) {
      return json(
        {
          error:
            e instanceof HttpError
              ? e.message
              : 'No pudimos completar la solicitud. Inténtalo nuevamente.',
        },
        e instanceof HttpError ? e.status : 500,
      );
    }
  }
  private async handle(request: Request) {
    const url = new URL(request.url),
      path = url.pathname.slice(4),
      method = request.method,
      storage = this.storage;
    const secure = url.protocol === 'https:';
    let body: Record<string, unknown> = {};
    if (method !== 'GET') {
      const origin = request.headers.get('Origin');
      if (origin && origin !== url.origin) {
        await request.arrayBuffer();
        throw new HttpError('Origen no permitido', 403);
      }
      if (Number(request.headers.get('Content-Length')) > 20000000)
        throw new HttpError('Las fotos exceden el límite permitido', 413);
      const text = await request.text();
      if (text.length > 20000000) throw new HttpError('Las fotos exceden el límite permitido', 413);
      try {
        body = JSON.parse(text || '{}');
        if (!body || typeof body !== 'object' || Array.isArray(body)) throw Error();
      } catch {
        throw new HttpError('Solicitud inválida');
      }
    }
    const token = request.headers
      .get('Cookie')
      ?.split(';')
      .map((x) => x.trim())
      .find((x) => x.startsWith('session='))
      ?.slice(8);
    const session = token ? await storage.get<Session>('session:' + token) : undefined;
    const valid = session && session.expires > Date.now();
    const users = await storage.list<StoredUser>({ prefix: 'user:' });
    const user = valid ? [...users.values()].find((u) => u.id === session.userId) : undefined;
    const allCategories =
      (await storage.get<{ id: number; name: string; active: number }[]>('categories')) ?? [];
    const config: DirectoryConfig = {
      categories: allCategories.filter((c) => c.active).map((c) => c.name),
      parishes,
    };
    if (path === '/config' && method === 'GET') return json(config);
    if (path === '/me' && method === 'GET')
      return json({ user: user ? { email: user.email, admin: user.admin } : null });
    if ((path === '/login' || path === '/register') && method === 'POST') {
      let email = String(body.email ?? '')
        .trim()
        .toLowerCase();
      const password = String(body.password ?? '');
      if (path === '/login' && email === 'admin')
        email = (this.env.ADMIN_EMAIL ?? 'admin@laguaira.local').trim().toLowerCase();
      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        password.length < 10 ||
        password.length > 200
      )
        throw new HttpError('Usa un correo válido y una contraseña de 10 a 200 caracteres');
      const key = 'user:' + email;
      let account = await storage.get<StoredUser>(key);
      if (path === '/register') {
        const salt = crypto.randomUUID();
        const newAccount = {
          id: crypto.randomUUID(),
          email,
          admin: false,
          salt,
          password: await hash(password, salt),
        };
        await storage.transaction(async (tx) => {
          if (await tx.get(key)) throw new HttpError('Este correo ya está registrado');
          await tx.put(key, newAccount);
        });
        account = newAccount;
      } else if (!account || !same(account.password, await hash(password, account.salt)))
        throw new HttpError('Correo o contraseña incorrectos', 401);
      const newToken = crypto.randomUUID() + crypto.randomUUID();
      await storage.put('session:' + newToken, {
        userId: account!.id,
        expires: Date.now() + 604800000,
      });
      return json({ ok: true }, 200, cookie(newToken, secure));
    }
    if (path === '/logout' && method === 'POST') {
      if (token) await storage.delete('session:' + token);
      return json({ ok: true }, 200, cookie('', secure, 0));
    }
    const profiles = await storage.list<WorkerProfile>({ prefix: 'profile:' });
    if (path === '/profiles' && method === 'GET')
      return json(
        [...profiles.values()].filter(
          (p) =>
            p.status === 'published' &&
            !p.hidden &&
            (!url.searchParams.get('category') ||
              p.category === url.searchParams.get('category')) &&
            (!url.searchParams.get('parish') || p.areas.includes(url.searchParams.get('parish')!)),
        ),
      );
    if (path.startsWith('/profiles/') && method === 'GET') {
      const p = [...profiles.values()].find(
        (p) => p.id === path.split('/').pop() && p.status === 'published' && !p.hidden,
      );
      if (!p) throw new HttpError('Este perfil no está disponible', 404);
      return json(p);
    }
    if (!user) throw new HttpError('Inicia sesión para continuar', 401);
    if (path === '/profile') {
      const key = 'profile:' + user.id;
      const current = await storage.get<WorkerProfile>(key);
      if (method === 'GET') return json(current ?? { status: 'draft' });
      if (method === 'PUT') {
        const profile = validate(body, config);
        profile.id = current?.id ?? crypto.randomUUID();
        await storage.transaction(async (tx) => {
          const latest = await tx.get<WorkerProfile>(key);
          profile.hidden = latest?.hidden ?? false;
          profile.demo = latest?.demo ?? false;
          await tx.put(key, profile);
        });
        return json(profile);
      }
    }
    if (path.startsWith('/admin')) {
      if (!user.admin) throw new HttpError('Acceso exclusivo para administradores', 403);
      if (path === '/admin' && method === 'GET')
        return json({ profiles: [...profiles.values()], categories: allCategories });
      if (path === '/admin/profile' && method === 'PUT') {
        const entry = [...profiles.entries()].find(([, p]) => p.id === body.id);
        if (!entry) throw new HttpError('Perfil no encontrado', 404);
        await storage.transaction(async (tx) => {
          const latest = await tx.get<WorkerProfile>(entry[0]);
          if (latest) await tx.put(entry[0], { ...latest, hidden: !!body.hidden });
        });
        return json({ ok: true });
      }
      if (path === '/admin/category' && method === 'PUT') {
        const name = String(body.name ?? '').trim();
        if (!name || name.length > 80)
          throw new HttpError('Indica un nombre de categoría de hasta 80 caracteres');
        await storage.transaction(async (tx) => {
          const list = (await tx.get<typeof allCategories>('categories')) ?? [];
          const current = list.find((c) => c.name === name);
          if (current) current.active = body.active ? 1 : 0;
          else
            list.push({
              id: Math.max(0, ...list.map((c) => c.id)) + 1,
              name,
              active: body.active === false ? 0 : 1,
            });
          await tx.put('categories', list);
        });
        return json({ ok: true });
      }
    }
    throw new HttpError('Ruta no encontrada', 404);
  }
}
function validate(body: Record<string, unknown>, config: DirectoryConfig): WorkerProfile {
  const text = (key: string) => String(body[key] ?? '').trim();
  const status = text('status') || 'draft';
  if (!['draft', 'published', 'paused'].includes(status)) throw new HttpError('Estado inválido');
  const areas = body.areas ?? [],
    photos = body.photos ?? [],
    testimonials = body.testimonials ?? [];
  if (!Array.isArray(areas) || areas.some((a) => typeof a !== 'string' || !parishes.includes(a)))
    throw new HttpError('Selecciona parroquias válidas');
  const location = text('location');
  if (location && !parishes.includes(location)) throw new HttpError('Parroquia inválida');
  const category = text('category');
  if (category && !config.categories.includes(category))
    throw new HttpError('Selecciona un oficio activo');
  let phone = text('phone').replace(/[\s()\-]/g, '');
  if (phone.startsWith('00')) phone = '+' + phone.slice(2);
  if (/^0\d{10}$/.test(phone)) phone = '+58' + phone.slice(1);
  if (/^58\d{10}$/.test(phone)) phone = '+' + phone;
  if (phone && !/^\+[1-9]\d{7,14}$/.test(phone))
    throw new HttpError('WhatsApp: usa un número internacional, por ejemplo +584121234567');
  const experience =
    body.experience === '' || body.experience === undefined ? '' : Number(body.experience);
  if (experience !== '' && (!Number.isInteger(experience) || experience < 0 || experience > 80))
    throw new HttpError('Experiencia: indica entre 0 y 80 años');
  if (!Array.isArray(photos) || photos.length > 6)
    throw new HttpError('Puedes agregar hasta 6 fotos');
  const avatar = text('avatar');
  for (const src of [avatar, ...photos])
    if (
      src &&
      (typeof src !== 'string' ||
        !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(src) ||
        src.length > 2800000)
    )
      throw new HttpError('Usa fotos JPG, PNG o WebP de hasta 2 MB');
  if (!Array.isArray(testimonials) || testimonials.length > 10)
    throw new HttpError('Máximo 10 testimonios');
  const cleanTestimonials = testimonials.map((t) => {
    if (!t || typeof t !== 'object') throw new HttpError('Testimonio inválido');
    const name = String(t.name ?? '')
        .trim()
        .slice(0, 100),
      text = String(t.text ?? '')
        .trim()
        .slice(0, 1000);
    if (!name || !text) throw new HttpError('Completa el nombre y texto de cada testimonio');
    return { name, text };
  });
  const name = text('name'),
    description = text('description');
  if (name.length > 100 || description.length > 5000)
    throw new HttpError('Nombre o descripción demasiado largos');
  if (
    status === 'published' &&
    (!name || !category || !phone || !location || !description || !areas.length)
  )
    throw new HttpError(
      'Completa nombre, oficio, WhatsApp, ubicación, cobertura y servicios para publicar',
    );
  return {
    name,
    description,
    category,
    phone,
    location,
    areas,
    photos,
    avatar,
    experience,
    testimonials: cleanTestimonials,
    status: status as WorkerProfile['status'],
  };
}
export default {
  fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/'))
      return env.DIRECTORY.get(env.DIRECTORY.idFromName('la-guaira')).fetch(request);
    return env.ASSETS.fetch(request);
  },
};

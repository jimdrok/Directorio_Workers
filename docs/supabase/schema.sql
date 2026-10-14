-- PROPUESTA v1 para un proyecto Supabase NUEVO. No aplicada a ningún entorno.
-- Revisar y probar con Supabase CLI antes de convertir en migración de producción.
-- auth.users y storage.objects son gestionadas por Supabase: no crearlas aquí.
begin;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;
create type public.publication_status as enum ('draft','published','paused');
create type public.photo_kind as enum ('avatar','work');

create table private.admin_users (
 user_id uuid primary key references auth.users(id) on delete cascade,
 granted_at timestamptz not null default now(),
 granted_by uuid references auth.users(id) on delete set null
);
create table public.categories (
 id uuid primary key default gen_random_uuid(),
 name text not null unique check(length(trim(name)) between 2 and 80),
 slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 is_active boolean not null default true,
 sort_order integer not null default 0,
 created_at timestamptz not null default now()
);
create table public.parishes (
 id uuid primary key default gen_random_uuid(),
 name text not null unique,
 slug text not null unique,
 is_active boolean not null default true
);
create table public.worker_profiles (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null unique references auth.users(id) on delete cascade,
 public_name text not null default '' check(length(public_name)<=100),
 category_id uuid references public.categories(id) on delete restrict,
 whatsapp_e164 text check(whatsapp_e164 ~ '^\+[1-9][0-9]{7,14}$'),
 location_parish_id uuid references public.parishes(id) on delete restrict,
 services_description text not null default '' check(length(services_description)<=5000),
 years_experience smallint check(years_experience between 0 and 80),
 status public.publication_status not null default 'draft',
 is_demo boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 published_at timestamptz,
 constraint published_required_fields check(status<>'published' or
  (length(trim(public_name))>0 and category_id is not null and whatsapp_e164 is not null
   and location_parish_id is not null and length(trim(services_description))>0))
);
create table public.worker_service_areas (
 profile_id uuid not null references public.worker_profiles(id) on delete cascade,
 parish_id uuid not null references public.parishes(id) on delete restrict,
 primary key(profile_id,parish_id)
);
create table public.worker_photos (
 id uuid primary key default gen_random_uuid(),
 profile_id uuid not null references public.worker_profiles(id) on delete cascade,
 kind public.photo_kind not null,
 position smallint not null,
 storage_path text not null unique,
 alt_text text not null default '' check(length(alt_text)<=180),
 created_at timestamptz not null default now(),
 constraint photo_slots check((kind='avatar' and position=0) or (kind='work' and position between 1 and 6)),
 unique(profile_id,kind,position)
);
create table public.worker_testimonials (
 id uuid primary key default gen_random_uuid(),
 profile_id uuid not null references public.worker_profiles(id) on delete cascade,
 recommender_name text not null check(length(trim(recommender_name)) between 1 and 100),
 body text not null check(length(trim(body)) between 1 and 1000),
 position smallint not null check(position between 1 and 10),
 created_at timestamptz not null default now(),
 unique(profile_id,position)
);
create table public.profile_moderation (
 profile_id uuid primary key references public.worker_profiles(id) on delete cascade,
 is_hidden boolean not null default false,
 reason text check(length(reason)<=1000),
 updated_by uuid references auth.users(id) on delete set null,
 updated_at timestamptz not null default now()
);
create table public.moderation_events (
 id uuid primary key default gen_random_uuid(),
 profile_id uuid references public.worker_profiles(id) on delete set null,
 actor_id uuid references auth.users(id) on delete set null,
 action text not null check(action in ('hide','restore')),
 reason text,
 created_at timestamptz not null default now()
);
create index profiles_category_status on public.worker_profiles(category_id,status);
create index areas_parish_profile on public.worker_service_areas(parish_id,profile_id);
create index moderation_events_profile on public.moderation_events(profile_id,created_at desc);

-- Helpers booleanos: nunca devolver detalles privados ni consultar auth.users desde el cliente.
create function private.is_admin() returns boolean language sql stable security definer
 set search_path='' as $$ select exists(select 1 from private.admin_users where user_id=(select auth.uid())) $$;
create function private.owns_profile(p_id uuid) returns boolean language sql stable security definer
 set search_path='' as $$ select exists(select 1 from public.worker_profiles where id=p_id and owner_id=(select auth.uid())) $$;
create function private.is_public_profile(p_id uuid) returns boolean language sql stable security definer
 set search_path='' as $$ select exists(select 1 from public.worker_profiles p where p.id=p_id
 and p.status='published' and not exists(select 1 from public.profile_moderation m where m.profile_id=p.id and m.is_hidden)) $$;
revoke all on function private.is_admin(),private.owns_profile(uuid),private.is_public_profile(uuid) from public;
grant execute on function private.is_admin(),private.owns_profile(uuid),private.is_public_profile(uuid) to anon,authenticated;

alter table private.admin_users enable row level security;
alter table public.categories enable row level security;
alter table public.parishes enable row level security;
alter table public.worker_profiles enable row level security;
alter table public.worker_service_areas enable row level security;
alter table public.worker_photos enable row level security;
alter table public.worker_testimonials enable row level security;
alter table public.profile_moderation enable row level security;
alter table public.moderation_events enable row level security;

-- Propuesta de acceso: lecturas Data API con RLS; mutaciones únicamente mediante RPC revisadas.
-- No conceder INSERT/UPDATE/DELETE a anon/authenticated hasta implementar las RPC de abajo.
revoke all on private.admin_users from anon,authenticated;
revoke all on public.categories,public.parishes,public.worker_profiles,public.worker_service_areas,
 public.worker_photos,public.worker_testimonials,public.profile_moderation,public.moderation_events from anon,authenticated;
grant select on public.categories,public.parishes,public.worker_profiles,public.worker_service_areas,
 public.worker_photos,public.worker_testimonials to anon,authenticated;
grant select on public.profile_moderation,public.moderation_events to authenticated;

create policy categories_read on public.categories for select to anon,authenticated using(is_active or private.is_admin());
create policy parishes_read on public.parishes for select to anon,authenticated using(is_active or private.is_admin());
create policy profiles_read on public.worker_profiles for select to anon,authenticated
 using(private.is_public_profile(id) or owner_id=(select auth.uid()) or private.is_admin());
create policy areas_read on public.worker_service_areas for select to anon,authenticated
 using(private.is_public_profile(profile_id) or private.owns_profile(profile_id) or private.is_admin());
create policy photos_read on public.worker_photos for select to anon,authenticated
 using(private.is_public_profile(profile_id) or private.owns_profile(profile_id) or private.is_admin());
create policy testimonials_read on public.worker_testimonials for select to anon,authenticated
 using(private.is_public_profile(profile_id) or private.owns_profile(profile_id) or private.is_admin());
create policy moderation_read on public.profile_moderation for select to authenticated
 using(private.owns_profile(profile_id) or private.is_admin());
create policy events_read on public.moderation_events for select to authenticated using(private.is_admin());

-- Bucket privado: una foto pausada no debe seguir siendo públicamente descargable por URL estable.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('worker-media','worker-media',false,2097152,array['image/jpeg','image/png','image/webp']);
-- No agregar políticas permisivas de storage.objects: subir/bajar mediante Edge Functions autorizadas.
-- Formato obligatorio de ruta: {auth.uid()}/{profile_id}/{photo_id}.{extension}.
-- La Edge Function verifica JWT, propiedad/visibilidad, MIME real y tamaño. Nunca recibe owner_id confiable.

insert into public.categories(name,slug,sort_order) values
 ('Plomería','plomeria',1),('Albañilería','albanileria',2),('Estilismo y barbería','estilismo-barberia',3),
 ('Pintura','pintura',4),('Electricidad','electricidad',5),('Costura','costura',6),
 ('Carpintería','carpinteria',7),('Refrigeración','refrigeracion',8),('Limpieza','limpieza',9);
insert into public.parishes(name,slug) values
 ('Caraballeda','caraballeda'),('Carayaca','carayaca'),('Carlos Soublette','carlos-soublette'),
 ('Caruao','caruao'),('Catia La Mar','catia-la-mar'),('El Junko','el-junko'),('La Guaira','la-guaira'),
 ('Macuto','macuto'),('Maiquetía','maiquetia'),('Naiguatá','naiguata'),('Urimare','urimare');
commit;

-- PENDIENTE antes de activar escrituras: implementar/testear las RPC descritas en backend.md:
-- save_my_profile, set_my_publication, admin_moderate_profile, admin_save_category.
-- SECURITY DEFINER + search_path vacío + auth.uid() + comprobación de rol en cada RPC.
-- Bloquear fila del perfil FOR UPDATE, guardar cobertura e hijos y validar publicación en una transacción.
-- Nunca permitir owner_id, is_demo, timestamps administrativos ni is_hidden desde el JSON del trabajador.

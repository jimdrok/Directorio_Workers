const schemaModels = [
  {
    "name": "private.admin_users",
    "purpose": "Asignación administrativa protegida; no editable desde formularios.",
    "managed": false,
    "columns": [
      {
        "name": "user_id",
        "type": "uuid",
        "nullable": false,
        "key": "PK",
        "rule": "primary key references auth.users(id) on delete cascade",
        "description": "Cuenta de Supabase Auth con acceso administrativo."
      },
      {
        "name": "granted_at",
        "type": "timestamptz",
        "nullable": false,
        "key": "",
        "rule": "not null default now()",
        "description": "Fecha de asignación del rol."
      },
      {
        "name": "granted_by",
        "type": "uuid",
        "nullable": true,
        "key": "FK",
        "rule": "references auth.users(id) on delete set null",
        "description": "Usuario que asignó el rol; puede ser nulo al eliminar su cuenta."
      }
    ]
  },
  {
    "name": "public.categories",
    "purpose": "Catálogo de oficios. Se desactiva sin eliminar referencias.",
    "managed": false,
    "columns": [
      {
        "name": "id",
        "type": "uuid",
        "nullable": false,
        "key": "PK",
        "rule": "primary key default gen_random_uuid()",
        "description": "Identificador único UUID."
      },
      {
        "name": "name",
        "type": "text",
        "nullable": false,
        "key": "UNIQUE",
        "rule": "not null unique check(length(trim(name)) between 2 and 80)",
        "description": "Nombre visible del catálogo."
      },
      {
        "name": "slug",
        "type": "text",
        "nullable": false,
        "key": "UNIQUE",
        "rule": "not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')",
        "description": "Identificador legible para rutas y filtros."
      },
      {
        "name": "is_active",
        "type": "boolean",
        "nullable": false,
        "key": "",
        "rule": "not null default true",
        "description": "Disponible para nuevas selecciones."
      },
      {
        "name": "sort_order",
        "type": "integer",
        "nullable": false,
        "key": "",
        "rule": "not null default 0",
        "description": "Orden de presentación."
      },
      {
        "name": "created_at",
        "type": "timestamptz",
        "nullable": false,
        "key": "",
        "rule": "not null default now()",
        "description": "Fecha de creación en UTC."
      }
    ]
  },
  {
    "name": "public.parishes",
    "purpose": "Catálogo territorial de La Guaira.",
    "managed": false,
    "columns": [
      {
        "name": "id",
        "type": "uuid",
        "nullable": false,
        "key": "PK",
        "rule": "primary key default gen_random_uuid()",
        "description": "Identificador único UUID."
      },
      {
        "name": "name",
        "type": "text",
        "nullable": false,
        "key": "UNIQUE",
        "rule": "not null unique",
        "description": "Nombre visible del catálogo."
      },
      {
        "name": "slug",
        "type": "text",
        "nullable": false,
        "key": "UNIQUE",
        "rule": "not null unique",
        "description": "Identificador legible para rutas y filtros."
      },
      {
        "name": "is_active",
        "type": "boolean",
        "nullable": false,
        "key": "",
        "rule": "not null default true",
        "description": "Disponible para nuevas selecciones."
      }
    ]
  },
  {
    "name": "public.worker_profiles",
    "purpose": "Identidad pública, servicios, experiencia y estado de publicación.",
    "managed": false,
    "columns": [
      {
        "name": "id",
        "type": "uuid",
        "nullable": false,
        "key": "PK",
        "rule": "primary key default gen_random_uuid()",
        "description": "Identificador único UUID."
      },
      {
        "name": "owner_id",
        "type": "uuid",
        "nullable": false,
        "key": "FK",
        "rule": "not null unique references auth.users(id) on delete cascade",
        "description": "Usuario autenticado propietario; único por perfil."
      },
      {
        "name": "public_name",
        "type": "text",
        "nullable": false,
        "key": "",
        "rule": "not null default '' check(length(public_name)<=100)",
        "description": "Nombre público del trabajador."
      },
      {
        "name": "category_id",
        "type": "uuid",
        "nullable": true,
        "key": "FK",
        "rule": "references public.categories(id) on delete restrict",
        "description": "Oficio principal; puede estar vacío en un borrador."
      },
      {
        "name": "whatsapp_e164",
        "type": "text",
        "nullable": true,
        "key": "",
        "rule": "check(whatsapp_e164 ~ '^\\+[1-9][0-9]{7,14}$')",
        "description": "Número internacional validado; no almacenar contraseñas ni contactos de clientes."
      },
      {
        "name": "location_parish_id",
        "type": "uuid",
        "nullable": true,
        "key": "FK",
        "rule": "references public.parishes(id) on delete restrict",
        "description": "Ubicación del trabajador; distinta de cobertura."
      },
      {
        "name": "services_description",
        "type": "text",
        "nullable": false,
        "key": "",
        "rule": "not null default '' check(length(services_description)<=5000)",
        "description": "Servicios y presentación; máximo 5.000 caracteres."
      },
      {
        "name": "years_experience",
        "type": "smallint",
        "nullable": true,
        "key": "",
        "rule": "check(years_experience between 0 and 80)",
        "description": "Opcional; entero de 0 a 80."
      },
      {
        "name": "status",
        "type": "public.publication_status",
        "nullable": false,
        "key": "",
        "rule": "not null default 'draft'",
        "description": "draft, published o paused."
      },
      {
        "name": "is_demo",
        "type": "boolean",
        "nullable": false,
        "key": "",
        "rule": "not null default false",
        "description": "Marca reservada al sistema para datos ficticios."
      },
      {
        "name": "created_at",
        "type": "timestamptz",
        "nullable": false,
        "key": "",
        "rule": "not null default now()",
        "description": "Fecha de creación en UTC."
      },
      {
        "name": "updated_at",
        "type": "timestamptz",
        "nullable": false,
        "key": "",
        "rule": "not null default now()",
        "description": "Fecha de cambio; versión optimista para guardado."
      },
      {
        "name": "published_at",
        "type": "timestamptz",
        "nullable": true,
        "key": "",
        "rule": "",
        "description": "Fecha de publicación; la RPC establece el valor."
      }
    ]
  },
  {
    "name": "public.worker_service_areas",
    "purpose": "Cobertura real del trabajador; relación muchos a muchos.",
    "managed": false,
    "columns": [
      {
        "name": "profile_id",
        "type": "uuid",
        "nullable": false,
        "key": "PK + FK",
        "rule": "not null references public.worker_profiles(id) on delete cascade",
        "description": "Perfil relacionado."
      },
      {
        "name": "parish_id",
        "type": "uuid",
        "nullable": false,
        "key": "PK + FK",
        "rule": "not null references public.parishes(id) on delete restrict",
        "description": "Parroquia donde presta servicio."
      }
    ]
  },
  {
    "name": "public.worker_photos",
    "purpose": "Metadatos y rutas privadas del avatar y portafolio.",
    "managed": false,
    "columns": [
      {
        "name": "id",
        "type": "uuid",
        "nullable": false,
        "key": "PK",
        "rule": "primary key default gen_random_uuid()",
        "description": "Identificador único UUID."
      },
      {
        "name": "profile_id",
        "type": "uuid",
        "nullable": false,
        "key": "FK",
        "rule": "not null references public.worker_profiles(id) on delete cascade",
        "description": "Perfil relacionado."
      },
      {
        "name": "kind",
        "type": "public.photo_kind",
        "nullable": false,
        "key": "",
        "rule": "not null",
        "description": "avatar o work."
      },
      {
        "name": "position",
        "type": "smallint",
        "nullable": false,
        "key": "",
        "rule": "not null",
        "description": "Orden: avatar 0; trabajo 1–6; testimonio 1–10."
      },
      {
        "name": "storage_path",
        "type": "text",
        "nullable": false,
        "key": "UNIQUE",
        "rule": "not null unique",
        "description": "Ruta única dentro del bucket privado worker-media."
      },
      {
        "name": "alt_text",
        "type": "text",
        "nullable": false,
        "key": "",
        "rule": "not null default '' check(length(alt_text)<=180)",
        "description": "Texto alternativo para accesibilidad."
      },
      {
        "name": "created_at",
        "type": "timestamptz",
        "nullable": false,
        "key": "",
        "rule": "not null default now()",
        "description": "Fecha de creación en UTC."
      }
    ]
  },
  {
    "name": "public.worker_testimonials",
    "purpose": "Recomendaciones aportadas por el trabajador, sin verificación.",
    "managed": false,
    "columns": [
      {
        "name": "id",
        "type": "uuid",
        "nullable": false,
        "key": "PK",
        "rule": "primary key default gen_random_uuid()",
        "description": "Identificador único UUID."
      },
      {
        "name": "profile_id",
        "type": "uuid",
        "nullable": false,
        "key": "FK",
        "rule": "not null references public.worker_profiles(id) on delete cascade",
        "description": "Perfil relacionado."
      },
      {
        "name": "recommender_name",
        "type": "text",
        "nullable": false,
        "key": "",
        "rule": "not null check(length(trim(recommender_name)) between 1 and 100)",
        "description": "Nombre público del recomendante, aportado por el trabajador."
      },
      {
        "name": "body",
        "type": "text",
        "nullable": false,
        "key": "",
        "rule": "not null check(length(trim(body)) between 1 and 1000)",
        "description": "Texto del testimonio; no es reseña verificada."
      },
      {
        "name": "position",
        "type": "smallint",
        "nullable": false,
        "key": "",
        "rule": "not null check(position between 1 and 10)",
        "description": "Orden: avatar 0; trabajo 1–6; testimonio 1–10."
      },
      {
        "name": "created_at",
        "type": "timestamptz",
        "nullable": false,
        "key": "",
        "rule": "not null default now()",
        "description": "Fecha de creación en UTC."
      }
    ]
  },
  {
    "name": "public.profile_moderation",
    "purpose": "Ocultamiento administrativo independiente de la publicación.",
    "managed": false,
    "columns": [
      {
        "name": "profile_id",
        "type": "uuid",
        "nullable": false,
        "key": "PK",
        "rule": "primary key references public.worker_profiles(id) on delete cascade",
        "description": "Perfil relacionado."
      },
      {
        "name": "is_hidden",
        "type": "boolean",
        "nullable": false,
        "key": "",
        "rule": "not null default false",
        "description": "true impide toda lectura pública del perfil."
      },
      {
        "name": "reason",
        "type": "text",
        "nullable": true,
        "key": "",
        "rule": "check(length(reason)<=1000)",
        "description": "Motivo interno de la acción administrativa."
      },
      {
        "name": "updated_by",
        "type": "uuid",
        "nullable": true,
        "key": "FK",
        "rule": "references auth.users(id) on delete set null",
        "description": "Administrador que realizó el cambio."
      },
      {
        "name": "updated_at",
        "type": "timestamptz",
        "nullable": false,
        "key": "",
        "rule": "not null default now()",
        "description": "Fecha de cambio; versión optimista para guardado."
      }
    ]
  },
  {
    "name": "public.moderation_events",
    "purpose": "Registro de acciones administrativas.",
    "managed": false,
    "columns": [
      {
        "name": "id",
        "type": "uuid",
        "nullable": false,
        "key": "PK",
        "rule": "primary key default gen_random_uuid()",
        "description": "Identificador único UUID."
      },
      {
        "name": "profile_id",
        "type": "uuid",
        "nullable": true,
        "key": "FK",
        "rule": "references public.worker_profiles(id) on delete set null",
        "description": "Perfil relacionado."
      },
      {
        "name": "actor_id",
        "type": "uuid",
        "nullable": true,
        "key": "FK",
        "rule": "references auth.users(id) on delete set null",
        "description": "Cuenta del administrador que ejecutó la acción."
      },
      {
        "name": "action",
        "type": "text",
        "nullable": false,
        "key": "",
        "rule": "not null check(action in ('hide','restore'))",
        "description": "hide o restore."
      },
      {
        "name": "reason",
        "type": "text",
        "nullable": true,
        "key": "",
        "rule": "",
        "description": "Motivo interno de la acción administrativa."
      },
      {
        "name": "created_at",
        "type": "timestamptz",
        "nullable": false,
        "key": "",
        "rule": "not null default now()",
        "description": "Fecha de creación en UTC."
      }
    ]
  },
  {
    "name": "auth.users",
    "purpose": "Cuentas y credenciales administradas por Supabase Auth. Columnas relevantes, no diccionario completo del sistema.",
    "managed": true,
    "columns": [
      {
        "name": "id",
        "type": "uuid",
        "key": "PK",
        "nullable": false,
        "rule": "Gestionado por Supabase",
        "description": "Identidad de la cuenta."
      },
      {
        "name": "email",
        "type": "text",
        "key": "",
        "nullable": true,
        "rule": "Gestionado por Supabase",
        "description": "Correo privado, no visible en el directorio."
      },
      {
        "name": "encrypted_password",
        "type": "text",
        "key": "",
        "nullable": true,
        "rule": "Gestionado por Supabase",
        "description": "Hash administrado por Auth; no consultar ni copiar al frontend."
      },
      {
        "name": "email_confirmed_at",
        "type": "timestamptz",
        "key": "",
        "nullable": true,
        "rule": "Gestionado por Supabase",
        "description": "Confirmación del correo."
      },
      {
        "name": "created_at",
        "type": "timestamptz",
        "key": "",
        "nullable": true,
        "rule": "Gestionado por Supabase",
        "description": "Fecha de registro."
      }
    ]
  },
  {
    "name": "storage.objects",
    "purpose": "Objetos administrados por Supabase Storage; metadatos relevantes, no recrear la tabla.",
    "managed": true,
    "columns": [
      {
        "name": "id",
        "type": "uuid",
        "key": "PK",
        "nullable": false,
        "rule": "Gestionado por Supabase",
        "description": "Identidad del objeto."
      },
      {
        "name": "bucket_id",
        "type": "text",
        "key": "FK",
        "nullable": true,
        "rule": "Gestionado por Supabase",
        "description": "Bucket worker-media."
      },
      {
        "name": "name",
        "type": "text",
        "key": "",
        "nullable": true,
        "rule": "Gestionado por Supabase",
        "description": "Ruta registrada en worker_photos.storage_path."
      },
      {
        "name": "metadata",
        "type": "jsonb",
        "key": "",
        "nullable": true,
        "rule": "Gestionado por Supabase",
        "description": "Metadatos del archivo; el backend verifica tamaño y contenido real."
      },
      {
        "name": "created_at",
        "type": "timestamptz",
        "key": "",
        "nullable": true,
        "rule": "Gestionado por Supabase",
        "description": "Fecha de subida."
      }
    ]
  },
  {
    "name": "storage.buckets",
    "purpose": "Contenedores de Storage. Se configura un bucket privado; no recrear esta tabla.",
    "managed": true,
    "columns": [
      {
        "name": "id",
        "type": "text",
        "key": "PK",
        "nullable": false,
        "rule": "Gestionado por Supabase",
        "description": "Identificador worker-media."
      },
      {
        "name": "name",
        "type": "text",
        "key": "",
        "nullable": true,
        "rule": "Gestionado por Supabase",
        "description": "Nombre del bucket."
      },
      {
        "name": "public",
        "type": "boolean",
        "key": "",
        "nullable": true,
        "rule": "Gestionado por Supabase",
        "description": "false para no exponer archivos por URL pública."
      },
      {
        "name": "file_size_limit",
        "type": "bigint",
        "key": "",
        "nullable": true,
        "rule": "Gestionado por Supabase",
        "description": "2.097.152 bytes."
      },
      {
        "name": "allowed_mime_types",
        "type": "text[]",
        "key": "",
        "nullable": true,
        "rule": "Gestionado por Supabase",
        "description": "image/jpeg, image/png, image/webp."
      }
    ]
  }
];
const schemaRelations = [
  {
    "from": "private.admin_users",
    "column": "user_id",
    "to": "auth.users",
    "target": "id",
    "cardinality": "N:1"
  },
  {
    "from": "private.admin_users",
    "column": "granted_by",
    "to": "auth.users",
    "target": "id",
    "cardinality": "N:1"
  },
  {
    "from": "public.worker_profiles",
    "column": "owner_id",
    "to": "auth.users",
    "target": "id",
    "cardinality": "0..1:1"
  },
  {
    "from": "public.worker_profiles",
    "column": "category_id",
    "to": "public.categories",
    "target": "id",
    "cardinality": "N:1"
  },
  {
    "from": "public.worker_profiles",
    "column": "location_parish_id",
    "to": "public.parishes",
    "target": "id",
    "cardinality": "N:1"
  },
  {
    "from": "public.worker_service_areas",
    "column": "profile_id",
    "to": "public.worker_profiles",
    "target": "id",
    "cardinality": "N:1"
  },
  {
    "from": "public.worker_service_areas",
    "column": "parish_id",
    "to": "public.parishes",
    "target": "id",
    "cardinality": "N:1"
  },
  {
    "from": "public.worker_photos",
    "column": "profile_id",
    "to": "public.worker_profiles",
    "target": "id",
    "cardinality": "N:1"
  },
  {
    "from": "public.worker_testimonials",
    "column": "profile_id",
    "to": "public.worker_profiles",
    "target": "id",
    "cardinality": "N:1"
  },
  {
    "from": "public.profile_moderation",
    "column": "profile_id",
    "to": "public.worker_profiles",
    "target": "id",
    "cardinality": "0..1:1"
  },
  {
    "from": "public.profile_moderation",
    "column": "updated_by",
    "to": "auth.users",
    "target": "id",
    "cardinality": "0..1:1"
  },
  {
    "from": "public.moderation_events",
    "column": "profile_id",
    "to": "public.worker_profiles",
    "target": "id",
    "cardinality": "N:1"
  },
  {
    "from": "public.moderation_events",
    "column": "actor_id",
    "to": "auth.users",
    "target": "id",
    "cardinality": "N:1"
  },
  {
    "from": "storage.objects",
    "column": "bucket_id",
    "to": "storage.buckets",
    "target": "id",
    "cardinality": "N:1"
  },
  {
    "from": "public.worker_photos",
    "column": "storage_path",
    "to": "storage.objects",
    "target": "name + bucket_id",
    "cardinality": "Lógica, no FK SQL"
  }
];

# La Guaira Conecta — Base general v1

Fecha: 14 de octubre de 2026. Estado: **propuesta de arquitectura**, no migración aplicada. El MVP actual usa Python/SQLite local y un Worker/Durable Object en Cloudflare. Esta documentación define su reemplazo por Supabase; no cambia esos sistemas todavía.

## Responsabilidades

| Plataforma | Responsabilidad |
|---|---|
| React + TypeScript | Pantallas, formularios, búsqueda, navegación, carga/error/vacío y enlaces a WhatsApp |
| Cloudflare | Compilar y servir el frontend y sus recursos; dominio, HTTPS y distribución |
| Supabase Auth | Registro, confirmación de correo, login, sesiones, recuperación de contraseña y JWT |
| Supabase PostgreSQL | Tablas, relaciones, restricciones, transacciones y permisos mediante RLS |
| Supabase Data API | Lecturas del directorio y del panel, siempre sujetas a RLS |
| Supabase RPC | Guardado atómico, publicación/pausa, administración y validaciones de negocio |
| Supabase Edge Functions | Subida/entrega de imágenes y operaciones que necesitan secretos o servicios externos |
| Supabase Storage | Fotografías en bucket privado; no guardar imágenes base64 en la tabla del perfil |

Supabase es el backend general. No duplicar perfiles, sesiones ni permisos en Durable Objects o SQLite. Cloudflare puede servir únicamente los archivos del frontend. El Worker de API actual se retira después de completar y verificar la migración. No hace falta un proxy para usar Supabase desde la SPA.

## Usuarios y permisos

- Visitante: busca sin cuenta; solo ve perfiles publicados y no ocultos.
- Trabajador: cuenta de Supabase Auth; crea un único perfil, edita sus datos, publica, pausa y republica.
- Administrador: cuenta de Auth con registro en `private.admin_users`; oculta/restaura perfiles y activa/desactiva categorías. El trabajador no puede quitar un ocultamiento administrativo.

Un administrador también puede gestionar su propio perfil. El rol no se toma de campos editables de `user_metadata` ni del formulario. El primer administrador se asigna desde un entorno privilegiado tras crear su usuario en Auth. Las credenciales de demostración del MVP no son la identidad de producción. Los ejemplos se recrean en un entorno de prueba, no se promocionan como trabajadores reales.

## Estados

`draft` → guardar un perfil incompleto. `published` → cumple los requisitos y puede aparecer públicamente. `paused` → conserva datos y deja de ser público. El ocultamiento administrativo vive en `profile_moderation`, independiente del estado del trabajador.

**Visible = status = published Y moderation.is_hidden no es true.** Que una categoría esté inactiva no pausa automáticamente perfiles existentes; los oculta de las opciones de nuevas publicaciones y filtros. El trabajador debe seleccionar un oficio activo para republicar.

Una publicación exige nombre público, oficio activo, WhatsApp normalizado, parroquia de ubicación, al menos una parroquia de cobertura y descripción de servicios. Experiencia, avatar, trabajos y testimonios son opcionales.

## Flujos

### Visitante

1. Cloudflare entrega la aplicación React.
2. React obtiene categorías y parroquias desde la Data API.
3. Busca con oficio y, opcionalmente, parroquia de `worker_service_areas`.
4. Obtiene resultados paginados de perfiles visibles; RLS mantiene la misma regla si alguien consulta la API directamente.
5. Abre la ficha, obtiene cobertura, fotos y testimonios.
6. WhatsApp abre `https://wa.me/{telefono_sin_+}?text={mensaje_codificado}` con “Hola, vi tu perfil en La Guaira Conecta. Estoy buscando un servicio de [oficio].”

### Trabajador

1. Registro con correo/contraseña en Auth, confirmación de correo y login.
2. Primera edición: `save_my_profile` crea un borrador con `owner_id = auth.uid()`.
3. Completa servicios, cobertura, experiencia e imágenes; el formulario conserva datos localmente si falla una operación.
4. `set_my_publication` valida y publica en una transacción; queda disponible en búsqueda.
5. `save_my_profile` actualiza perfil e hijos de forma atómica, con validaciones si permanece publicado.
6. Al pausar, el perfil y sus hijos dejan de ser consultables por visitantes, incluso con su UUID.

### Administrador

1. Inicia sesión en Auth; la app consulta su capacidad administrativa mediante una RPC booleana.
2. `admin_moderate_profile` verifica rol, cambia moderación y registra un evento en la misma transacción.
3. `admin_save_category` gestiona catálogo sin eliminar categorías ya referenciadas.
4. La app invalida sus consultas y la API aplica inmediatamente la nueva visibilidad.

## Datos

Modelo normalizado con UUID, claves foráneas, fechas UTC y borrado controlado. Un usuario tiene cero o un perfil; un perfil tiene un oficio principal y una ubicación; presta servicios en muchas parroquias. La cobertura no se deduce de la ubicación.

`auth.users` y `storage.objects` pertenecen a Supabase: se documentan, no se recrean ni se exponen al visitante. El correo y la contraseña no se duplican en las tablas de negocio. `owner_id` es una referencia UUID de autorización; el DTO público debe omitirla aunque no sea una contraseña ni un correo.

El índice visual contiene el diccionario de columnas completo. `supabase/schema.sql` es una base revisable de tablas, restricciones y políticas de lectura. Sus escrituras están cerradas hasta implementar y probar las RPC; no es una migración lista para habilitar el producto.

## Diseño por módulos

Ver `modulos.md`. Organización recomendada: `src/features/*` coordina pantallas, `src/components/ui` concentra controles, `src/lib/supabase` crea el cliente y `src/services` traduce respuestas a modelos tipados. Ningún componente construye SQL ni conoce claves privilegiadas.

## Despliegue y configuración

1. Crear proyectos Supabase separados para desarrollo y producción.
2. Convertir la propuesta SQL revisada en migraciones versionadas, probarlas localmente y aplicarlas.
3. Configurar Auth: URL del sitio, URLs permitidas de redirección, confirmación y correo de recuperación. Configurar entrega de correo real.
4. Implementar RPC y Edge Functions; mantener JWT activo en endpoints de escritura. Los endpoints públicos de medios verifican visibilidad antes de entregar el archivo.
5. Crear bucket privado `worker-media` con límite 2 MB y MIME JPEG/PNG/WebP.
6. Configurar `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` en la compilación de Cloudflare. Son configuración pública. Claves secretas/service-role solo en backend Supabase.
7. Compilar React y desplegar en Cloudflare. Las variables Vite se incorporan durante la compilación: cambiar un valor requiere recompilar.
8. Cambiar el frontend de `/api` al cliente Supabase y servicios nuevos. Retirar backend anterior solo después de probar el criterio de aceptación completo.

Las URLs de preview de Cloudflare deben tener redirecciones Auth autorizadas explícitamente; evitar comodines amplios en producción. No habilitar un bucket público para simplificar la demo si se requiere revocar acceso a perfiles pausados.

## Migración del MVP simulado

1. Inventariar qué datos reales se deben conservar; dejar los nueve ejemplos solo en desarrollo.
2. Crear cuentas mediante Auth; no importar hashes scrypt/PBKDF2 del MVP a mano ni usar contraseñas compartidas.
3. Asociar usuarios a perfiles, traducir categorías/parroquias a UUID y normalizar números.
4. Extraer imágenes base64 a Storage y registrar rutas; trasladar testimonios con su etiqueta.
5. Mapear `hidden` a moderación. Preservar borradores y pausados.
6. Probar en staging y definir corte de escrituras del backend anterior para evitar pérdida de cambios.
7. Validar búsqueda y permisos; desplegar el cliente nuevo y mantener un respaldo para revertir el corte.

## Criterio de aceptación y pruebas

- Registro/confirmación/login y creación de un borrador sin datos obligatorios completos.
- Guardado fallido sin pérdida del formulario.
- Publicación incompleta rechazada en el backend.
- Cobertura diferente de ubicación: aparecer por cobertura, no por ubicación solamente.
- Visitante no accede a borradores/pausados/ocultos ni a sus hijos, fotos o testimonios por ID directo.
- Dos usuarios: uno no puede editar datos, cobertura ni archivos del otro, ni transferir propietario.
- Trabajador no puede asignarse rol administrativo ni modificar moderación o `is_demo`.
- Máximo un avatar, seis fotos de trabajos y diez testimonios; nombres/textos obligatorios si hay testimonios.
- Pausa y ocultamiento invalidan lecturas nuevas, incluidos medios privados; república no elimina el ocultamiento.
- Cambio concurrente de cobertura/publicación no deja un perfil publicado sin cobertura.
- Administración genera auditoría y no elimina claves referenciadas.
- Pruebas SQL/RLS con roles anon/authenticated y pruebas HTTP/Storage, no solo pruebas visuales.

## Fuera del MVP

Pagos, reservas, chat interno, estrellas, reseñas verificadas, verificación de identidad y mapas. La trayectoria y formación de los ejemplos están en la descripción; no añadir tablas de empleos, certificados o educación sin ampliar el alcance explícitamente.

## Fuentes oficiales

- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [RLS y grants](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Acceso a Storage](https://supabase.com/docs/guides/storage/security/access-control)
- [Autorización de Edge Functions](https://supabase.com/docs/guides/functions/auth)
- [Cloudflare Static Assets](https://developers.cloudflare.com/workers/static-assets/)

Las decisiones de tablas, módulos y límites de la propuesta son propias del proyecto; las fuentes describen las capacidades de las plataformas.

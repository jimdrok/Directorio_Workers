# Contratos del backend Supabase

Propuesta, no funciones desplegadas. Las RPC y Edge Functions de esta página se implementan después de aprobar el modelo. `schema.sql` crea tablas y lecturas restringidas; no habilita mutaciones desde la Data API.

## Auth

El cliente usa `signUp`, `signInWithPassword`, `signOut`, seguimiento de cambios de sesión y recuperación de contraseña de Supabase. El login definitivo es correo/contraseña; el alias `admin` es una comodidad de la demo actual, no un usuario mágico en producción. Consultar la sesión validada en backend, nunca confiar en una bandera del navegador.

## RPC PostgreSQL

| Función | Entrada | Salida / reglas |
|---|---|---|
| `save_my_profile` | campos editables, categoría, ubicación, UUID de cobertura, testimonios, `expected_updated_at` | Perfil + hijos actualizados en una transacción. `owner_id=auth.uid()`, un perfil por usuario; error de conflicto si la versión cambió |
| `set_my_publication` | perfil propio, estado destino, versión esperada | Valida obligatorios, cobertura y categoría activa al publicar; pausa sin borrar; respeta ocultamiento administrativo |
| `my_capabilities` | ninguna | `{ is_admin }`; no devuelve listado de administradores |
| `admin_moderate_profile` | UUID del perfil, ocultar/restaurar, motivo | Verifica rol; actualiza moderación y evento juntos; no cambia propietario ni estado del trabajador |
| `admin_save_category` | UUID opcional, nombre, slug, orden, activo | Crea/edita/desactiva; nombre/slug únicos; no elimina categorías referenciadas |
| `attach_my_photo` | perfil propio, ruta de subida validada, tipo, slot, texto alternativo | Asocia archivo validado por Edge Function. Rechaza rutas ajenas y slots fuera de 0/1–6 |
| `remove_my_photo` | UUID de foto del perfil propio | Retira referencia; backend limpia archivo; no concede borrado arbitrario de Storage |

Las funciones mutadoras con `SECURITY DEFINER` fijan `search_path=''`, comprueban `auth.uid()` y rol explícitamente, y conceden ejecución solo a `authenticated`. Revocar `EXECUTE` de `PUBLIC`. Ninguna acepta propietario ni moderación dentro de los datos del trabajador. Bloquear la fila del perfil con `FOR UPDATE` para serializar cobertura, fotos y publicación. La publicación final valida cobertura dentro de la misma transacción; la restricción de tabla protege también los obligatorios escalares.

No conceder escrituras directas a tablas hasta diseñar políticas y triggers equivalentes; en esta propuesta todas las mutaciones pasan por RPC. Las lecturas no necesitan elevar privilegios.

## Edge Functions

- `upload-worker-photo`: JWT obligatorio, verificar perfil propio, límite y contenido del archivo. Generar ruta `{user_id}/{profile_id}/{photo_id}.{ext}`; no aceptar una ruta arbitraria. Guardar en bucket privado y devolver token/ruta autorizada para asociación; compensar una asociación fallida.
- `profile-photo`: recibe UUID de foto, consulta la visibilidad actual o identidad del propietario/admin antes de entregar bytes. Para anonimato, desactivar verificación JWT automática únicamente en este endpoint de lectura, con comprobación propia de visibilidad. Usar `Cache-Control: no-store` si se exige revocación inmediata de nuevas lecturas al pausar.
- `cleanup-media`: limpieza de huérfanos y archivos referenciados eliminados; ejecución restringida al sistema, no al visitante.

La clave privilegiada, si se necesita para Storage, permanece en secretos de las Edge Functions. Que una clave omita RLS no autoriza devolver cualquier registro: verificar permisos antes de usarla. Las llamadas de datos del usuario deben propagar su JWT para mantener RLS.

Las URLs firmadas caducan pero pueden seguir funcionando después de una pausa hasta su expiración. Por eso la opción base para revocación estricta es el proxy de medios con comprobación por solicitud. Ningún mecanismo retira una imagen que alguien ya descargó.

## Datos públicos y errores

DTO de búsqueda: `id, public_name, category, location, years_experience, excerpt, avatar_photo_id, is_demo`. DTO de ficha agrega servicios, cobertura, fotos y testimonios; el teléfono se devuelve solo para perfil visible. Omitir correo Auth, `owner_id`, razones internas y datos administrativos.

Errores esperados: `UNAUTHENTICATED`, `FORBIDDEN`, `PROFILE_UNAVAILABLE`, `VALIDATION_FAILED`, `CONFLICT`, `PHOTO_LIMIT`, `UPLOAD_FAILED`. Traducir al español en el cliente. Una ficha pausada/oculta/inexistente usa el mismo mensaje de indisponibilidad para visitantes. Para resultados vacíos devolver una lista vacía, no un error.

## Matriz de acceso

| Recurso | Visitante | Trabajador | Admin |
|---|---|---|---|
| Perfil visible e hijos | Leer | Leer | Leer |
| Perfil no visible e hijos | Denegado | Solo propio | Leer para moderar |
| Editar servicios/cobertura | Denegado | Solo propio vía RPC | Solo propio; no edición arbitraria de terceros |
| Moderación | Denegado | Leer estado propio | Ocultar/restaurar vía RPC |
| Categorías | Activas | Activas | Leer y gestionar todas |
| Roles administrativos | Denegado | Denegado | Alta/baja solo por operación privilegiada fuera del panel MVP |
| Auditoría | Denegado | Denegado | Leer |
| Medios privados | Solo perfil visible, vía función | Propios o visibles | Propios, visibles o por moderación |

RLS, grants y permisos RPC trabajan juntos. Para vistas SQL que se agreguen después, usar `security_invoker=true` y filtros explícitos de publicación; una vista creada por un propietario privilegiado puede eludir RLS si no se configura correctamente.

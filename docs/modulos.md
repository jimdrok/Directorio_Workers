# Módulos de la aplicación

| Módulo | Pantallas / responsabilidades | Datos | Backend |
|---|---|---|---|
| Identidad | Registro, login, logout, confirmación, recuperación y sesión | `auth.users`, sesiones Auth | Supabase Auth; nunca guardar contraseñas de negocio |
| Catálogos | Oficios y parroquias; listas y filtros | `categories`, `parishes` | Data API para lectura; RPC admin para categorías |
| Directorio | Inicio, resultados paginados, filtros por cobertura y ficha pública | Perfiles + cobertura + hijos visibles | Data API con RLS y consultas por relaciones |
| Mi perfil | Borrador, servicios, cobertura, experiencia, guardado/publicación/pausa | `worker_profiles`, `worker_service_areas` | `save_my_profile`, `set_my_publication` |
| Portafolio | Avatar, carga y orden de hasta seis trabajos, eliminación | `worker_photos`, `storage.objects` | Edge Functions de subida/lectura; rutas privadas |
| Testimonios | Nombre del recomendante, texto y orden; etiqueta de origen | `worker_testimonials` | Guardado como parte de RPC atómica; no reseñas verificadas |
| Contacto | WhatsApp y mensaje predefinido | `whatsapp_e164` del perfil visible | React arma enlace; no chat interno ni tabla de mensajes |
| Administración | Ocultar/restaurar y categorías activas | `profile_moderation`, `moderation_events`, `private.admin_users` | RPC con verificación administrativa |
| Infraestructura | Cliente tipado, errores, validaciones, seguridad y despliegue | Configuración y contratos | Supabase backend; Cloudflare frontend |

## Dependencias y límites

Identidad provee la sesión a Mi perfil, Portafolio y Administración. Directorio depende de Catálogos y de los perfiles visibles, pero no exige sesión. Contacto usa la ficha pública. Un formulario no importa componentes internos de administración ni conoce el algoritmo de roles.

Cada módulo contiene componentes, servicios, tipos y validaciones del dominio. Los servicios usan un único cliente Supabase. Los hooks administran carga, error, vacío, cancelación y actualización de consultas. Mantener los tokens y controles React ya definidos.

## Búsqueda

Consulta perfiles visibles con `category_id` opcional y un `EXISTS` en cobertura para `parish_id`. No usar `location_parish_id` como cobertura. Orden estable por `published_at DESC, id`; páginas de 20 registros y límite máximo 50. Limitar el DTO a campos públicos. Los contadores usan los mismos filtros y reglas RLS.

## Formularios

Los campos son controlados. Normalizar teléfono en cliente para ayudar y repetir validación en RPC. Las parroquias se envían como UUID únicos. Mostrar errores por campo y un error general; conservar valores si falla la red. Bloquear doble envío. `updated_at` se usa como versión optimista: si cambió desde la carga, informar conflicto y no sobrescribir silenciosamente.

## Portafolio

Primero crear el borrador para disponer de un UUID. Subir el archivo a una ruta generada por el backend. Verificar tamaño y contenido MIME, no solo extensión. Después asociar la ruta al perfil en una transacción que reserve un slot. Si falla la asociación, limpiar el archivo huérfano. Al eliminar, retirar la referencia y programar el borrado del objeto; nunca permitir que el cliente borre rutas ajenas.

Las escrituras de Storage y PostgreSQL no forman una única transacción: se necesita compensación y limpieza de huérfanos. Al reemplazar una foto usar una ruta nueva para evitar caché antigua.

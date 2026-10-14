# Arquitectura y normas de diseño

## Organización

- `src/app`: proveedores compartidos, rutas y layout.
- `src/features/directory`: inicio, filtros, resultados y perfil público.
- `src/features/auth`: registro e inicio de sesión.
- `src/features/worker`: panel y edición del perfil, fotos y testimonios.
- `src/features/admin`: moderación y categorías.
- `src/components/ui`: controles reutilizables sin lógica de negocio.
- `src/lib`: contratos TypeScript, cliente HTTP y carga de recursos.
- `src/styles`: tokens visuales y estilos globales adaptables.

Las páginas coordinan datos y navegación; los componentes reciben valores y callbacks. Las llamadas HTTP se realizan exclusivamente desde `lib/api.ts`. Las funciones del dominio se colocan junto a la función que las usa; solo se promueven a código compartido cuando hay usos reales en varias funciones.

## Estado y errores

El contexto contiene únicamente configuración y sesión. Los formularios conservan su estado local y usan actualizaciones inmutables. El editor se actualiza con la respuesta normalizada del servidor solo después de guardar con éxito. No se vacía al fallar. Durante el guardado se bloquea la edición para no perder cambios concurrentes.

`useResource` cancela lecturas al desmontar o cambiar filtros y evita aplicar respuestas obsoletas. Cada pantalla maneja carga, error y ausencia de datos. Las mutaciones exponen un estado ocupado y errores visibles. No se almacena sesión en localStorage: se usan cookies HttpOnly del backend.

## Sistema visual y accesibilidad

- Reutilizar colores, tipografías, radios y espaciados de `tokens.css`; agregar allí cualquier nuevo token.
- Reutilizar `Button`, `Field`, `Feedback` y `SelectOptions` antes de crear variantes.
- `Field` genera identificadores estables y conecta etiquetas con controles.
- Mantener navegación mediante enlaces y acciones mediante botones; especificar `type="button"` para acciones dentro de formularios.
- Mostrar foco de teclado, textos alternativos y mensajes con roles de alerta o estado.
- Los campos obligatorios se identifican con un asterisco; el servidor valida requisitos de publicación y permite borradores incompletos.
- Diseñar controles para celulares y evitar depender de hover para ejecutar acciones.
- React escapa contenido de usuarios; no usar `dangerouslySetInnerHTML` para perfiles o testimonios.

## Límites y seguridad

Los guards de React organizan la navegación. La autorización real sigue en Python: propietario desde sesión, lectura pública solo de perfiles publicados y visibles, y operaciones administrativas limitadas a administradores. Ninguna refactorización de interfaz debe trasladar estas reglas al cliente.

## Agregar una función

1. Definir contratos en `lib/types.ts` y operaciones en `lib/api.ts`.
2. Crear la carpeta de función y separar la página de los controles complejos.
3. Añadir la ruta y su guard si corresponde.
4. Reutilizar tokens y controles existentes.
5. Ejecutar `npm run build` y `npm test`. Agregar pruebas de integración cuando cambien reglas de negocio o permisos.

TypeScript usa modo estricto y rechaza variables y parámetros no utilizados. El lockfile debe acompañar cualquier cambio de dependencias. La compilación genera `dist/`; nunca editar esos archivos manualmente.

## Formato del código

Usar `npm run format` antes de entregar cambios y `npm run format:check` para comprobar consistencia. Prettier aplica sangría de dos espacios y líneas de hasta 100 columnas. Mantener componentes con una responsabilidad y preferir props tipadas explícitamente.

## Backend de Cloudflare

`worker/index.ts` implementa el mismo contrato HTTP que Python para despliegues en Workers. El Durable Object `Directory` conserva usuarios, sesiones, categorías y perfiles. `worker/storage.ts` fragmenta los valores grandes para almacenar imágenes sin superar el límite por valor de KV. Las mutaciones de perfiles y categorías se realizan en transacciones; el ocultamiento administrativo se toma del registro persistido y no del cuerpo del cliente. `wrangler.jsonc` dirige `/api/*` al Worker antes del fallback de la SPA.

El MVP usa una sola instancia de directorio. A mayor volumen, separar índices de búsqueda y archivos de imágenes en almacenamiento específico, manteniendo el contrato de API del frontend.

## Arquitectura objetivo con Supabase

La documentación anterior describe el MVP implementado. La arquitectura para la siguiente etapa, con Supabase como backend general y Cloudflare como hosting del frontend, se encuentra en `docs/index.html` y `docs/arquitectura.md`. Es una propuesta aún no aplicada; no confundir con las rutas actuales del Worker.

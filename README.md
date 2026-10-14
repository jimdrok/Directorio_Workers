# La Guaira Conecta

MVP local de un directorio de trabajadores y servicios de La Guaira. Interfaz en español, adaptable a celulares. Frontend con React, TypeScript estricto y Vite. Backend con Python 3.10 o superior y SQLite. Requiere Node.js 22 o posterior y npm.

## Iniciar

```sh
npm install
npm run dev
```

Abrir http://localhost:5173. Este comando inicia Vite y el backend en http://localhost:3000. Vite envía las solicitudes `/api` al backend.

Para servir la compilación local:

```sh
npm run build
npm start
```

Abrir http://localhost:3000. No ejecutar el backend separado si `npm run dev` ya está activo.

## Probar el recorrido

1. Crear una cuenta desde «Publicar mis servicios».
2. Completar nombre, oficio, WhatsApp, ubicación, parroquias de cobertura y descripción.
3. Publicar y buscar por oficio y una parroquia de cobertura.
4. Abrir el perfil y pulsar «Contactar por WhatsApp».
5. Desde el panel, guardar y pausar. El perfil desaparece de las búsquedas y su URL devuelve un aviso de indisponibilidad.

No se incluyen perfiles ficticios. Para explorar el MVP local, hay una cuenta administrativa con usuario `admin` y contraseña `guaria2026`. Los datos se guardan en `data/directorio.sqlite`; las imágenes se almacenan como datos en el perfil. Se admiten JPG, PNG y WebP, hasta 2 MB por foto, una de perfil y seis de trabajos. Testimonios aportados por el trabajador, sin estrellas ni verificación.

## Administración

El acceso local predeterminado es usuario `admin` y contraseña `guaria2026`. También acepta el correo `admin@laguaira.local`. Puedes reemplazar estos valores configurando `ADMIN_EMAIL` y `ADMIN_PASSWORD` (mínimo 10 caracteres) como variables de entorno antes de iniciar el servidor. Esto crea o actualiza esa cuenta administrativa. Iniciar sesión con ella y abrir «Administración» desde el panel. Permite ocultar/restaurar perfiles y agregar, activar o desactivar categorías. Un trabajador no puede revertir el ocultamiento administrativo. Desactivar una categoría la retira de los filtros y de las opciones de publicación; no pausa automáticamente perfiles existentes.

## Validación

```sh
npm test
```

Pruebas HTTP sobre una base temporal: registro, publicación, normalización del teléfono, búsqueda por cobertura, pausa, acceso público, aislamiento de propietarios y ocultamiento administrativo. `npm run build` verifica los tipos de TypeScript y genera la compilación de React.

## Estructura y decisiones

- `server.py`: API, SQLite, contraseñas con scrypt y sesiones persistentes con cookies HttpOnly/SameSite.
- `src/`: interfaz React organizada por funciones, componentes reutilizables y contratos TypeScript.
- `src/styles/`: tokens de diseño y estilos adaptables.
- `ARCHITECTURE.md`: convenciones para extender la aplicación.
- `dist/`: compilación generada por Vite, servida por Python.
- `tests/`: pruebas de integración.
- `mermaid-diagram.png`: referencia del flujo proporcionada por el usuario.

El servidor decide la identidad a partir de la sesión y nunca acepta un propietario enviado por el cliente. Las consultas públicas exigen estado publicado y ausencia de ocultamiento. El guardado fallido conserva el formulario; solo un guardado exitoso lo vuelve a renderizar. Los borradores permiten campos incompletos, pero validan los datos proporcionados.

## Alcance de esta inicialización

Funciona como MVP local. Para alojarlo públicamente: reemplazar las credenciales locales mediante `ADMIN_EMAIL` y `ADMIN_PASSWORD`, usar un servidor de producción detrás de HTTPS, configurar `COOKIE_SECURE=1`, incorporar limitación de intentos de acceso, recuperación de contraseña, copias de seguridad y almacenamiento de imágenes en archivos u objetos. El servidor estándar de Python se usa para desarrollo. No incluye pagos, reservas, chat interno, reseñas verificadas, mapas ni verificación de identidad.

Variables opcionales: `PORT` (3000), `DATABASE_PATH` (ruta SQLite), `COOKIE_SECURE`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`. La aplicación escucha en 127.0.0.1. Las fuentes externas son opcionales: hay tipografías de respaldo del sistema.

## Perfiles de ejemplo

`npm run seed:demo` agrega nueve trabajadores ficticios, uno por categoría inicial. El comando puede repetirse sin reemplazar perfiles existentes. Se muestran como demostración y el contacto por WhatsApp está desactivado. Las parroquias de cobertura varían entre ejemplos para permitir probar los filtros. Cada ficha incluye servicios, años de experiencia, trayectoria, formación y un testimonio ficticio. No se usan fotografías de personas reales.

Para gestionar un ejemplo, ingresa con el correo `<oficio>@ejemplo.invalid` y contraseña `guaria2026`. Los identificadores de oficio son: `plomeria`, `albanileria`, `estilismo`, `pintura`, `electricidad`, `costura`, `carpinteria`, `refrigeracion` y `limpieza`. La cuenta `admin` permite ocultarlos o restaurarlos desde Administración.

## Cloudflare Workers: frontend y API juntos

El despliegue debe usar `wrangler.jsonc`, no publicar únicamente `dist/`. El Worker sirve `/api/*`; los archivos estáticos sirven React. Los datos y sesiones se almacenan en un Durable Object persistente con SQLite, independiente del SQLite local de Python. La migración `v1` crea el almacenamiento al desplegar; no requiere copiar identificadores de bases de datos.

En el panel de Cloudflare Workers configura:

- Comando de compilación: `npm run build`
- Comando de despliegue: `npx wrangler deploy`
- Versión de Node: 22 o posterior
- Directorio raíz: la carpeta que contiene `wrangler.jsonc`

Desde una terminal autenticada en Cloudflare también puedes usar `npm run deploy`. Para probar el Worker local: `npm run dev:cloudflare`, abrir http://localhost:8787. Para probar la integración: `WORKER_TEST_URL=http://localhost:8787 python3 -m unittest discover -s tests -p test_cloudflare.py -v`.

En el primer arranque se crean el administrador (`admin` / `guaria2026`) y nueve perfiles ficticios. Las cuentas de ejemplo conservan los correos descritos arriba. El almacenamiento local de Wrangler y el de producción son independientes. Los datos de `data/directorio.sqlite` no se migran automáticamente. `ADMIN_EMAIL` y `ADMIN_PASSWORD` pueden configurarse como secretos **antes del primer arranque** para sustituir la cuenta predeterminada. Las contraseñas del Worker se derivan con PBKDF2-SHA256 y las cookies de producción usan Secure.

Si aparece HTML en una solicitud `/api/config`, verifica que se haya desplegado el Worker y que `assets.run_worker_first` incluya `/api/*`. Publicar solo los archivos estáticos no ejecuta el backend Python ni el Worker.

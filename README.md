# SofiiBrowss

Aplicación web de reservas y administración para un estudio de cejas y pestañas, desarrollada como proyecto de Práctica Integradora.

Sitio publicado: [sofii-browss.vercel.app](https://sofii-browss.vercel.app).

## Funcionalidades

- Catálogo de servicios, precios y fotografías.
- Solicitud de turnos con consulta de disponibilidad.
- Panel de administración con acceso para dueña y personal.
- Gestión de servicios, galería, turnos, reseñas e información del negocio.
- Contacto por WhatsApp e integración con Google Calendar.
- Diseño adaptable a celulares y computadoras, con modo claro y oscuro.

Las fotografías, los precios y la información cargada por el estudio se almacenan en Supabase. La limpieza del repositorio no modifica esos datos.

## Desarrollo local

Requiere Node.js 22.14 o posterior y acceso al proyecto Supabase existente.

```sh
npm ci
```

Copiar `.env.example` a `.env.local` y completar la URL y la clave pública del proyecto. Las variables son `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`; también se admite la clave pública heredada `VITE_SUPABASE_ANON_KEY`.

```sh
npm run dev
```

Para comprobar el código y generar la versión de producción:

```sh
npm run lint
npm run build
```

`npm run preview` permite revisar la compilación generada en `dist`.

## Estructura

- `src/components`: reserva y panel administrativo.
- `src/lib`: conexión a Supabase, consultas, tipos y adaptadores.
- `src/types.ts`: modelos de la interfaz y valores iniciales.
- `src/index.css`: estilos de la aplicación.
- `public/favicon.svg`: icono del sitio.
- `supabase/functions`: función existente para Google Calendar y su configuración.

La configuración de Calendar está documentada en [su guía](supabase/functions/sync-google-calendar/README.md). Esta entrega conserva el esquema y la integración existentes: no requiere ejecutar migraciones nuevas.

## Presentación

Utilizar la dirección publicada para mostrar el catálogo actualizado y el recorrido de reservas. El panel administrativo se demuestra con una cuenta autorizada. Las mediciones de ahorro, satisfacción y rentabilidad del informe son objetivos o proyecciones hasta contar con registros del negocio.

## Tecnología

React, TypeScript y Vite. Supabase proporciona PostgreSQL, autenticación y almacenamiento de imágenes.

Desarrollo principal: Federico Martorell. Proyecto de Práctica Integradora.

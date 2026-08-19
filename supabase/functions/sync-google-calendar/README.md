# Sincronización con Google Calendar

1. En Google Cloud, crear una **cuenta de servicio**, habilitar Google Calendar API y descargar su JSON.
2. Compartir el calendario de SofiiBrowss con el `client_email` de esa cuenta, con permiso **Hacer cambios en eventos**.
3. En Supabase configurar los secretos `GOOGLE_SERVICE_ACCOUNT_JSON` (el contenido completo del JSON) y `GOOGLE_CALENDAR_ID` (normalmente el email del calendario).
4. Aplicar la migración y desplegar `sync-google-calendar`.
5. En el hosting de la web, configurar `VITE_GOOGLE_CALENDAR_SYNC_ENABLED=true` y volver a compilar.

Las credenciales quedan únicamente en los secretos de Supabase; nunca en el navegador ni en Git.

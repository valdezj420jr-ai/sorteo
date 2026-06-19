# Sorteo QR

Aplicación profesional para un sorteo electrónico con códigos QR y validación automática.

## Arquitectura

- `src/pages/` - páginas Astro para la experiencia del usuario.
- `src/pages/api/` - API REST interna para generar tickets, registrar participantes y consultar datos.
- `src/lib/` - servicios de negocio y capas de acceso a datos.
- `src/components/` - scripts cliente para interactividad en el panel administrativo y la participación.
- `src/styles/` - estilos globales y diseño responsivo.
- `sorteo.db` - base de datos SQLite con los tickets y los registros.

## Requisitos

- Node.js 18+.

## Instalación y uso

1. Abrir una terminal en la carpeta `sorteo-qr`.
2. Ejecutar:
   ```bash
   npm install
   npm run dev
   ```
3. Abrir en el navegador:
   ```
   http://localhost:3000/
   ```
4. El panel administrativo está en `http://localhost:3000/admin`.
5. La página de participación está en `http://localhost:3000/participar`.

## Descripción de la solución

- La generación de tickets ocurre en `POST /api/generate`.
- Cada ticket produce un enlace único y un QR para escanear.
- La validación y el registro se realizan en `POST /api/register`.
- El ticket se consulta en `GET /api/ticket?ticket=...`.
- El panel administrativo usa APIs para mostrar resumen y últimos tickets.

## Buenas prácticas aplicadas

- Separación clara entre API, UI y acceso a datos.
- Uso de `Astro` para páginas estáticas y rutas de servidor.
- Lógica de negocio encapsulada en `src/lib/ticket-service.ts`.
- Estructura preparada para escalar con más APIs y funcionalidades.

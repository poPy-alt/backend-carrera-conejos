# Rabbit Race Game - Backend

Este es el backend del juego Rabbit Race, construido con Node.js, Express y PostgreSQL.

## Requisitos Previos

- [Node.js](https://nodejs.org/) (v16+)
- [PostgreSQL](https://www.postgresql.org/) o una instancia de [Supabase](https://supabase.com/)

## Instalación

1. Navega a la carpeta `backend`:
   ```bash
   cd backend
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura las variables de entorno:
   - Copia `.env.example` a `.env`:
     ```bash
     cp .env.example .env
     ```
   - Edita `.env` con tus credenciales:
     - `PORT`: Puerto en el que correrá el servidor (default: 5000).
     - `DATABASE_URL`: URL de conexión a tu base de datos PostgreSQL.
     - `JWT_SECRET`: Una clave secreta para la generación de tokens JWT.

## Scripts Disponibles

- `npm start`: Inicia el servidor en modo producción.
- `npm run dev`: Inicia el servidor en modo desarrollo utilizando `nodemon`.

## Tecnologías Utilizadas

- **Express**: Framework web para Node.js.
- **PostgreSQL**: Base de datos relacional.
- **Socket.io**: Comunicación bi-direccional en tiempo real.
- **JWT (Json Web Token)**: Autenticación de usuarios.
- **Bcrypt.js**: Encriptación de contraseñas.
- **CORS**: Middleware para habilitar Cross-Origin Resource Sharing.

## Estructura de Carpetas

- `controllers/`: Lógica de negocio para las rutas.
- `routes/`: Definición de endpoints del API.
- `db.js`: Configuración y conexión con la base de datos.
- `index.js`: Punto de entrada de la aplicación.

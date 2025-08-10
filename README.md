# AWS Management System

Sistema completo de gestión de AWS con frontend React, backend Node.js, base de datos PostgreSQL y automatización con N8N.

## 🚀 Características

- **Frontend**: Aplicación React moderna con interfaz de usuario intuitiva
- **Backend**: API REST con Express.js y Node.js
- **Base de Datos**: PostgreSQL para almacenamiento persistente
- **Automatización**: N8N para workflows y automatización de tareas
- **Docker**: Contenedores orquestados con Docker Compose

## 📋 Prerrequisitos

- Docker y Docker Compose instalados
- Git
- Editor de código (VS Code recomendado)

## 🛠️ Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone <tu-repositorio>
cd aws-management
```

### 2. Configurar variables de entorno

Copia el archivo de ejemplo y ajusta los valores:

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus configuraciones:

```bash
# Configuración básica del proyecto
PROJECT_NAME=aws-management
NODE_ENV=development
NETWORK_NAME=aws-manager-net

# Versiones de Docker
NODE_VERSION=20
POSTGRES_VERSION=15
N8N_VERSION=latest

# Puertos de los servicios
BACKEND_PORT=4000
FRONTEND_PORT=3000
N8N_PORT=5678
POSTGRES_PORT=5432

# Configuración de N8N
N8N_USER=admin
N8N_PASSWORD=TuContraseñaSegura2024!
TIMEZONE=America/Mexico_City

# Configuración de PostgreSQL
POSTGRES_USER=aws_user
POSTGRES_PASSWORD=TuContraseñaDBSegura2024!
POSTGRES_DB=aws_management_db
```

### 3. Iniciar los servicios

```bash
docker compose up -d
```

### 4. Verificar que todo funcione

```bash
docker compose ps
```

## 🌐 Acceso a los servicios

Una vez que todos los contenedores estén funcionando, puedes acceder a:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **N8N**: http://localhost:5678
- **PostgreSQL**: localhost:5432

## 📁 Estructura del proyecto

```
aws-management/
├── backend/                 # API REST con Express
│   ├── src/
│   │   └── index.js        # Servidor principal
│   ├── package.json
│   └── Dockerfile
├── frontend/               # Aplicación React
│   ├── src/
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.js
│   ├── public/
│   │   └── index.html
│   ├── package.json
│   └── Dockerfile
├── n8n_data/              # Datos persistentes de N8N
├── postgres_data/         # Datos persistentes de PostgreSQL
├── docker-compose.yml     # Configuración de Docker Compose
├── .env                   # Variables de entorno (no subir al repo)
├── .env.example          # Plantilla de variables de entorno
├── .gitignore            # Archivos a ignorar en Git
└── README.md             # Este archivo
```

## 🔧 Comandos útiles

### Gestión de contenedores

```bash
# Iniciar todos los servicios
docker compose up -d

# Detener todos los servicios
docker compose down

# Ver logs de un servicio específico
docker compose logs backend
docker compose logs frontend
docker compose logs postgres
docker compose logs n8n

# Reiniciar un servicio específico
docker compose restart backend

# Ver estado de los contenedores
docker compose ps
```

### Desarrollo

```bash
# Instalar dependencias del backend (desde el host)
cd backend && npm install

# Instalar dependencias del frontend (desde el host)
cd frontend && npm install

# Ejecutar tests (cuando estén implementados)
cd backend && npm test
cd frontend && npm test
```

### Base de datos

```bash
# Conectar a PostgreSQL
docker compose exec postgres psql -U aws_user -d aws_management_db

# Hacer backup de la base de datos
docker compose exec postgres pg_dump -U aws_user aws_management_db > backup.sql

# Restaurar backup
docker compose exec -T postgres psql -U aws_user -d aws_management_db < backup.sql
```

## 🔒 Seguridad

- **Nunca subas el archivo `.env` al repositorio**
- Cambia las contraseñas por defecto en producción
- Usa HTTPS en producción
- Configura firewalls apropiados
- Mantén las imágenes de Docker actualizadas

## 🐛 Solución de problemas

### Contenedores no inician

```bash
# Ver logs detallados
docker compose logs

# Limpiar y recrear contenedores
docker compose down -v
docker compose up -d
```

### Problemas de permisos con PostgreSQL

```bash
# Corregir permisos del directorio de datos
sudo chown -R 999:999 postgres_data/
```

### Problemas de red

```bash
# Verificar redes de Docker
docker network ls
docker network inspect awsmanagement_aws-manager-net
```

## 📝 Desarrollo

### Agregar nuevas dependencias

**Backend:**
```bash
cd backend
npm install nueva-dependencia
```

**Frontend:**
```bash
cd frontend
npm install nueva-dependencia
```

### Estructura de la API

El backend expone los siguientes endpoints:

- `GET /` - Información del API
- `GET /health` - Estado de salud del servicio
- `GET /api/aws/resources` - Recursos de AWS (pendiente de implementar)

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 📞 Soporte

Si tienes problemas o preguntas:

1. Revisa la sección de solución de problemas
2. Verifica los logs de los contenedores
3. Abre un issue en el repositorio

---

**Nota**: Este es un proyecto en desarrollo. Algunas características pueden estar en implementación.

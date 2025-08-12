# AWS Management System

## 1. Introducción al proyecto

AWS Management System es una plataforma web diseñada para centralizar la gestión de múltiples cuentas de AWS, permitiendo a los usuarios visualizar y administrar recursos, acceder a logs en tiempo real, y generar dashboards personalizados. El objetivo es ofrecer una visión global y controlada de la infraestructura cloud, facilitando la administración, la auditoría y la automatización de tareas. Próximamente, se integrará con N8N para potenciar la automatización y la generación de insights mediante inteligencia artificial.

La aplicación está compuesta por:
- Un **frontend** moderno basado en React.
- Un **backend** robusto construido con Node.js y Express.
- Una base de datos **PostgreSQL** para almacenamiento seguro y persistente.
- Orquestación de servicios mediante **Docker Compose**.
- (Próximamente) Integración con **N8N** para flujos automatizados e IA.

<img width="2400" height="1152" alt="image" src="https://github.com/user-attachments/assets/dd16f64c-600e-4918-99f3-85779a616626" />


## 2. Clonar el repositorio y herramientas necesarias

Para comenzar a usar el proyecto, simplemente clona el repositorio:

```bash
git clone <URL-del-repositorio>
cd aws-management
```

**Herramientas necesarias:**
- Docker y Docker Compose (para levantar los servicios de manera sencilla y reproducible)
- Git (para clonar y gestionar el código)
- (Opcional) Un editor de código como VS Code

> **Nota:** Algunas configuraciones sensibles, como archivos de variables de entorno (`.env`), no se incluyen en el repositorio por seguridad. Deberás crearlos manualmente siguiendo las plantillas o instrucciones proporcionadas en el proyecto.

## 3. Utilidad del sistema

Esta plataforma está pensada para equipos y profesionales que gestionan múltiples cuentas y recursos en AWS, ofreciendo:

- **Gestión centralizada de cuentas AWS:** Añade, visualiza y administra varias cuentas desde un solo lugar.
- **Visualización de recursos:** Consulta información relevante de servicios como EC2, ALB, VPC, entre otros.
- **Acceso a logs en tiempo real:** Visualiza logs y eventos de tus recursos para un monitoreo efectivo.
- **Dashboards personalizables:** Crea paneles con métricas y visualizaciones adaptadas a tus necesidades.
- **Seguridad y control de acceso:** Cada usuario tiene su propio perfil y acceso restringido a sus datos.
- **Automatización (próximamente):** Con N8N, podrás crear flujos automáticos e integrar inteligencia artificial para análisis avanzados y generación de reportes.

El sistema está en constante evolución, incorporando nuevas funcionalidades y servicios para facilitar la administración cloud y la toma de decisiones basada en datos.

## Estructura general del proyecto

```text
aws-management/
├── backend/        # API y lógica de negocio
│   └── src/
├── frontend/       # Aplicación web (React)
│   └── src/
├── n8n_data/       # Datos persistentes de N8N (automatización)
├── postgres_data/  # Datos persistentes de PostgreSQL
├── docker-compose.yml  # Orquestación de servicios
└── README.md       # Documentación general
```

---

**Nota:** Este proyecto es de carácter general y educativo. Para entornos productivos, revisa y adapta las configuraciones de seguridad y despliegue según tus necesidades.

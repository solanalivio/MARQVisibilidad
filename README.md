# Estudio MARQ — Plataforma Empresarial y CRM MARQ Contigo

Transformación de la arquitectura estática original (`solanalivio/marqvisibilidad`) a una **plataforma empresarial completa, modular y desacoplada** para la consultora y desarrolladora inmobiliaria **Estudio MARQ** (Resistencia, Chaco).

---

## 👥 1. Guía para el Equipo (Sin Experiencia Técnica)

Si formas parte del equipo de arquitectura, ventas, administración o marketing y **no tienes experiencia previa en desarrollo de software ni programación**, esta sección es para ti.

### ¿Cómo funciona la plataforma a grandes rasgos?
La plataforma está dividida en 3 partes que trabajan en conjunto automáticamente:
1. **La Web Pública y Mapa 3D (`http://localhost:3000`)**: Es lo que ven los clientes finales cuando ingresan. Muestra los 18 proyectos arquitectónicos, el mapa interactivo de Resistencia con edificios volumétricos en 3D, loteos y los botones de contacto directo por WhatsApp.
2. **El CRM "MARQ Contigo" (`http://localhost:3000/contigo`)**: Es el panel de control interno para el equipo. Aquí se gestionan los clientes interesados (inversores y particulares), el stock de unidades disponibles, los avances de obra y el envío de enlaces a showrooms 3D personalizados.
3. **El Servidor y Base de Datos (Backend y PostgreSQL)**: Funciona en segundo plano. Guarda de forma segura los datos de clientes, usuarios, auditoría e inventario sin que tengas que configurarlo manualmente.

---

### 🟢 Paso a Paso: ¿Cómo abrir y usar el proyecto en tu computadora?

Solo necesitas seguir estos pasos sencillos una única vez:

#### Paso 1: Instalar Docker Desktop (si no lo tienes)
Docker es una herramienta que se encarga de empaquetar y poner en marcha todo el sistema con un solo clic, sin que tengas que instalar bases de datos o librerías complejas.
- Descarga e instala **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** (disponible para Windows y Mac).
- Abre la aplicación de Docker Desktop y asegúrate de que esté abierta (verás el ícono de la ballena verde en tu barra de tareas).

#### Paso 2: Abrir una terminal o consola
- **En Windows:** Abre `PowerShell` o `Símbolo del sistema (CMD)`.
- **En Mac/Linux:** Abre la aplicación `Terminal`.
- Navega hasta la carpeta del proyecto (por ejemplo: `cd ruta/a/MARQVisibilidad`).

#### Paso 3: Crear el archivo de configuración
Copia el archivo de configuración base ejecutando este comando:
```bash
# En Windows (PowerShell):
Copy-Item .env.example .env

# En Mac / Linux:
cp .env.example .env
```

#### Paso 4: Poner en marcha el sistema
Ejecuta el siguiente comando:
```bash
docker compose up -d
```
> ⏱️ *Nota: La primera vez puede tardar unos minutos mientras descarga y prepara todo. Cuando termine, verás mensajes con tildes verdes (`✔ Started` / `✔ Healthy`).*

#### Paso 5: ¡Listo! Acceder desde tu navegador web
Abre Google Chrome, Edge o tu navegador favorito y entra a:
- **Sitio Web y Mapa 3D:** [http://localhost:3000](http://localhost:3000)
- **Panel de Control (CRM MARQ Contigo):** [http://localhost:3000/contigo](http://localhost:3000/contigo)

#### Paso 6: Iniciar Sesión en el CRM
Para probar el sistema, utiliza cualquiera de estos usuarios ya creados:

| Perfil | Correo Electrónico | Contraseña | ¿Para qué sirve? |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@estudiomarq.com.ar` | `Marq2026!Secure` | Acceso a todo el sistema, usuarios y auditoría. |
| **Asesor Comercial** | `comercial@estudiomarq.com.ar` | `Marq2026!Secure` | Para gestionar clientes, llamadas, WhatsApp y stock. |
| **Marketing** | `marketing@estudiomarq.com.ar` | `Marq2026!Secure` | Para métricas de campañas publicitarias. |

---

### 🛑 ¿Cómo apagar el sistema cuando termines de trabajar?
Cuando termines de usarlo, en la misma terminal puedes apagarlo con:
```bash
docker compose down
```
Y cuando quieras volver a usarlo otro día, simplemente repites `docker compose up -d`.

---

## 🏗️ 2. Arquitectura del Monorepo

El repositorio está estructurado bajo **npm workspaces** con separación de responsabilidades y tipado estricto de extremo a extremo:

```
├── packages/
│   ├── shared/                # Contratos HTTP, Enums del dominio y Permisos RBAC
│   └── map3d/                 # Motor 3D desacoplado (MapLibre GL, extrusiones, maquetas)
├── apps/
│   ├── api/                   # Backend empresarial NestJS 11 + Prisma ORM + PostgreSQL 16
│   └── web/                   # Frontend Next.js 15 (App Router, React 19, Server/Client Components)
├── legacy/                    # Archivos estáticos originales preservados como referencia
├── docker-compose.yml         # Orquestación de contenedores (db, migrate, api, web)
└── .env.example               # Variables de entorno documentadas
```

---

## 🔒 3. Seguridad y Cumplimiento OWASP Top 10

1. **Autenticación Robusta:**
   - Hashing criptográfico de contraseñas con algoritmo moderno **Argon2id** (resistente a ataques GPU/ASIC).
   - Bloqueo preventivo de cuentas tras 5 intentos fallidos consecutivos durante 15 minutos.
2. **Manejo Seguro de Sesiones:**
   - Tokens JWT transmitidos exclusivamente mediante **cookies HttpOnly, Secure y SameSite=Strict**.
   - Rotación estricta de Refresh Tokens con detección de reuso por familias (`family_id`).
   - Doble cookie submit para protección **CSRF** (`marq_csrf` validado contra cabecera `X-CSRF-Token` en operaciones mutantes).
3. **Control de Acceso Basado en Roles (RBAC):**
   - Matriz granular de permisos (`clients:read`, `clients:write`, `clients:scope_all`, `projects:write`, `users:manage`, `audit:read`, etc.).
   - Filtrado automático por alcance: los asesores comerciales solo visualizan sus clientes asignados a menos que posean el permiso `clients:scope_all`.
4. **Auditoría Append-Only:**
   - Tabla inmutable `audit_logs` con registro de actor, entidad, acción, resultado (SUCCESS/FAILURE), IP y requestId.
   - Ofuscación y sanitización automática de datos sensibles (`password`, `token`, etc.) antes de persistir en base de datos.
5. **Mitigación de Inyección SQL y XSS:**
   - Consultas 100% parametrizadas a través de Prisma ORM / PostgreSQL.
   - Renderizado declarativo en React sin uso de `dangerouslySetInnerHTML`.

---

## 🌐 4. Módulos y Funcionalidades Principales

### A. Sitio Público y Motor de Mapa 3D (`/`)
- Réplica visual y de experiencia 1:1 de la estética original de Estudio MARQ (`https://estudiomarq.com.ar/`).
- Mapa 3D con extrusiones volumétricas de edificios, loteos urbanos, línea de tiempo (obras terminadas vs desarrollos futuros), maquetas conceptuales y modo tour inmersivo.
- Catálogo interactivo de 18 proyectos arquitectónicos con fotos, memorias descriptivas, fichas técnicas y desglose de equipo profesional.

### B. Showrooms Personalizados (`/showroom/:token`)
- Acceso privado y exclusivo para clientes que consultaron por desarrollos.
- Generación de enlaces con caducidad configurada (30 días) y token criptográfico en base de datos.
- Telemetría en tiempo real: registra aperturas, proyectos explorados y clics de interés en la ficha del CRM.

### C. MARQ Contigo (CRM Comercial)
- **Tablero Resumen (`/contigo/resumen`):**
  - Métricas de cartera activa, leads nuevos de los últimos 7 días vs semana previa, y avance frente a la meta mensual de reuniones.
  - Agenda de visitas en tiempo real (ventana -3 a +3 días) con estado de realización y asistencia.
  - Análisis de canales de adquisición (WhatsApp, Instagram, Web, Referidos).
  - Tabla de campañas publicitarias con cálculo de leads, clientes atribuidos, reuniones, cierres y CPL estimado.
- **Cartera de Inversores (`/contigo/inversores`):**
  - Vista dual (Tablero Kanban deslizable con 7 etapas + Tabla interactiva).
  - Alertas visuales de tareas vencidas o pendientes para el día.
  - Acceso directo a chat de WhatsApp con un solo clic.
- **Cartera de Particulares (`/contigo/particulares`):**
  - Pipeline de compra de vivienda propia y familias.
  - Filtros por proyecto y presupuesto.
- **Ficha de Contacto (`/contigo/contactos/[id]`):**
  - Perfil del cliente, historial de interacciones con trazabilidad y notas.
  - Señales del showroom 3D en tiempo real.
  - Recomendaciones inteligentes de proyectos basadas en afinidad y presupuesto.
  - Modales para registrar interacciones, agendar visitas y emitir nuevos showrooms.
- **Gestión de Desarrollos (`/contigo/proyectos` y `/contigo/proyectos/[slug]`):**
  - Inventario en tiempo real por tipología (m², precio en USD, unidades libres vs reservadas).
  - Publicación de avances de obra y novedades.
  - Asistente de difusión por WhatsApp para contactos interesados en el proyecto.
- **Administración y Auditoría (`/contigo/admin`):**
  - Panel de usuarios, asignación de roles y desbloqueo de cuentas.
  - Visor paginado del registro de auditoría de seguridad con inspector de diffs JSON.

---

## 💻 5. Modo de Desarrollo Local (Para Desarrolladores)

Si vas a modificar código fuente sin usar Docker para toda la aplicación:

1. Instalar dependencias del monorepo:
```bash
npm install
```

2. Iniciar PostgreSQL con Docker:
```bash
docker compose up -d db
```

3. Generar cliente y ejecutar migraciones/semilla:
```bash
cd apps/api
npx prisma migrate dev --name init
npm run seed
cd ../..
```

4. Compilar todos los paquetes:
```bash
npm run build
```

5. Iniciar en modo desarrollo con recarga en caliente:
```bash
# Terminal 1: Backend API (Puerto 3001)
npm run dev:api

# Terminal 2: Frontend Web (Puerto 3000)
npm run dev:web
```

---

## 🧪 6. Scripts Disponibles

- `npm run build`: Compila los paquetes compartidos `@marq/shared`, `@marq/map3d`, el backend `@marq/api` y el frontend `@marq/web`.
- `npm run typecheck`: Valida el tipado TypeScript en todos los workspaces.
- `npm run dev:api`: Inicia el backend NestJS con recarga en caliente (hot reload).
- `npm run dev:web`: Inicia Next.js en modo desarrollo con turbopack.

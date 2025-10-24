# Customers Service - UNAH Shop

Microservicio para la gestión de clientes del proyecto educativo UNAH Shop.

## 🚀 Características

- **CRUD completo**: Crear, leer, actualizar y eliminar clientes
- **Validación robusta**: Validación de datos con Joi
- **Paginación**: Lista de clientes con paginación configurable
- **Búsqueda**: Búsqueda por nombre, apellido y email
- **Estadísticas**: Endpoint para obtener estadísticas de clientes
- **Logging**: Sistema de logs con Winston
- **Seguridad**: Helmet, CORS y validación de entrada
- **Documentación**: API autodocumentada

## 📋 Requisitos

- Node.js >= 18
- NPM >= 9
- Base de datos Supabase configurada
- Variables de entorno configuradas

## 🔧 Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de Supabase
```

## 🏃‍♂️ Uso

### Desarrollo
```bash
# Iniciar en modo desarrollo
npm run dev

# Iniciar con nodemon
npm run start:dev
```

### Producción
```bash
# Iniciar en modo producción
npm start
```

### Pruebas
```bash
# Ejecutar pruebas unitarias
npm test

# Ejecutar pruebas con cobertura
npm run test:coverage

# Probar el servicio en vivo
node test-service.js
```

## 📡 Endpoints

### Health Check
- `GET /health` - Estado del servicio
- `GET /api` - Información del servicio
- `GET /api/docs` - Documentación de la API

### Clientes
- `GET /api/customers` - Listar clientes con paginación
- `GET /api/customers/:id` - Obtener cliente por ID
- `POST /api/customers` - Crear nuevo cliente
- `PUT /api/customers/:id` - Actualizar cliente
- `DELETE /api/customers/:id` - Eliminar cliente
- `GET /api/customers/stats` - Estadísticas de clientes
- `GET /api/customers/search` - Búsqueda avanzada

### Parámetros de consulta para listado

```javascript
// GET /api/customers
{
  page: 1,           // Página (default: 1)
  limit: 10,         // Elementos por página (default: 10, max: 100)
  sort_by: 'created_at', // Campo de ordenamiento
  sort_order: 'desc',    // Orden (asc/desc)
  search: 'juan'         // Búsqueda en nombre, apellido, email
}
```

### Estructura de respuesta

```javascript
// Respuesta exitosa
{
  "success": true,
  "data": { /* datos */ },
  "message": "Operación exitosa",
  "pagination": { /* info de paginación */ }
}

// Respuesta de error
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Descripción del error",
    "details": { /* detalles adicionales */ }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 💾 Modelo de datos

```javascript
// Customer
{
  id: "uuid",                    // UUID único
  email: "user@example.com",     // Email único
  first_name: "Juan",            // Nombre
  last_name: "Pérez",           // Apellido
  phone: "+504 9999-9999",      // Teléfono (opcional)
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z"
}
```

## 🔒 Validaciones

### Crear cliente (POST)
- `email`: Requerido, formato email válido, único
- `first_name`: Requerido, 2-50 caracteres
- `last_name`: Requerido, 2-50 caracteres  
- `phone`: Opcional, formato hondureño (+504 9999-9999)

### Actualizar cliente (PUT)
- Todos los campos son opcionales
- Mismas reglas de validación que crear

## 🔧 Configuración

### Variables de entorno (.env.local)

```bash
# Puerto del servicio
CUSTOMERS_SERVICE_PORT=3001

# Base de datos Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Entorno
NODE_ENV=development
```

## 📁 Estructura del proyecto

```
customers-service/
├── src/
│   ├── config/
│   │   └── database.js      # Configuración de Supabase
│   ├── controllers/
│   │   └── customerController.js  # Controladores HTTP
│   ├── services/
│   │   └── customerService.js     # Lógica de negocio
│   ├── routes/
│   │   └── customerRoutes.js      # Definición de rutas
│   └── middleware/
│       ├── errorHandler.js   # Manejo de errores
│       └── logger.js         # Sistema de logging
├── tests/
│   └── customers.test.js     # Pruebas unitarias
├── index.js                  # Punto de entrada
├── test-service.js          # Script de pruebas en vivo
├── package.json
└── README.md
```

## 🧪 Pruebas

### Pruebas automatizadas
Las pruebas incluyen:
- Health checks
- Validación de endpoints
- Manejo de errores
- Pruebas de performance
- Validación de datos

### Pruebas manuales
Usar el script `test-service.js` para probar el servicio en vivo:

```bash
node test-service.js
```

Este script prueba todos los endpoints y muestra resultados en tiempo real.

## 🚦 Estados de respuesta

- `200 OK` - Operación exitosa
- `201 Created` - Recurso creado exitosamente  
- `400 Bad Request` - Error de validación
- `404 Not Found` - Recurso no encontrado
- `500 Internal Server Error` - Error interno del servidor

## 📝 Logging

El servicio incluye logging detallado:
- Requests HTTP con timestamps
- Eventos de negocio (creación, actualización, etc.)
- Errores con stack traces
- Métricas de performance

## 🔄 Integración con otros servicios

Este microservicio se integra con:
- **Frontend**: Proporciona datos de clientes
- **Orders Service**: Información de clientes para pedidos
- **Cart Service**: Datos de clientes para carritos
- **Products Service**: Recomendaciones personalizadas

## 🛠️ Desarrollo

### Comandos útiles

```bash
# Linting
npm run lint
npm run lint:fix

# Formateo
npm run format

# Análisis de código
npm run analyze

# Build para producción
npm run build
```

### Contribuir

1. Fork el repositorio
2. Crear rama de feature (`git checkout -b feature/amazing-feature`)
3. Commit cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto es para fines educativos - Universidad Nacional Autónoma de Honduras (UNAH).

## 🆘 Soporte

Para reportar problemas o hacer preguntas:
1. Revisar la documentación
2. Ejecutar `node test-service.js` para diagnósticos
3. Verificar logs del servicio
4. Crear issue en el repositorio

## Instalación
```bash
npm install
```

## Desarrollo
```bash
npm run dev
```

## Endpoints

- `GET /api/customers`
- `POST /api/customers`
- `PUT /api/customers/:id`
- `DELETE /api/customers/:id`

## Variables de Entorno Requeridas
```
CUSTOMERS_SERVICE_PORT=30xx
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Testing
```bash
npm test
```

## Arquitectura
```
customers-service/
├── src/
│   ├── routes/         # Definición de rutas
│   ├── controllers/    # Lógica de controladores
│   ├── services/       # Lógica de negocio
│   ├── models/         # Modelos de datos
│   ├── middleware/     # Middleware personalizado
│   └── utils/          # Utilidades
├── tests/              # Pruebas unitarias
└── index.js           # Punto de entrada
```

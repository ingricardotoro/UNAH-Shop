# orders-service

## Descripción
Procesamiento de órdenes

## Instalación
```bash
npm install
```

## Desarrollo
```bash
npm run dev
```

## Endpoints

- `POST /api/orders`
- `GET /api/orders/:userId`
- `GET /api/orders/:id`

## Variables de Entorno Requeridas
```
ORDERS_SERVICE_PORT=30xx
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Testing
```bash
npm test
```

## Arquitectura
```
orders-service/
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

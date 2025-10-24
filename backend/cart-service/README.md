# cart-service

## Descripción
Gestión del carrito de compras

## Instalación
```bash
npm install
```

## Desarrollo
```bash
npm run dev
```

## Endpoints

- `GET /api/cart/:userId`
- `POST /api/cart`
- `PUT /api/cart/:itemId`
- `DELETE /api/cart/:itemId`

## Variables de Entorno Requeridas
```
CART_SERVICE_PORT=30xx
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Testing
```bash
npm test
```

## Arquitectura
```
cart-service/
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

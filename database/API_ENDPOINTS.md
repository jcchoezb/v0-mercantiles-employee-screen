# API Endpoints - Mercantiles Admin Panel

Esta documentación describe los endpoints que tu backend debe implementar para conectar con el frontend.

## Configuración

El frontend buscará la API en la variable de entorno:
\`\`\`
NEXT_PUBLIC_API_URL=http://tu-servidor.com/api
\`\`\`

Si no se configura, usa `http://localhost:8000/api` por defecto.

---

## Autenticación

Todos los endpoints (excepto login) requieren el header:
\`\`\`
Authorization: Bearer {token}
\`\`\`

### POST /api/auth/login
Iniciar sesión de empleado.

**Request:**
\`\`\`json
{
  "email": "carlos@mercantiles.com",
  "password": "admin123"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "token": "jwt_token_aqui",
  "user": {
    "id": "1",
    "nombre": "Carlos Mendoza",
    "email": "carlos@mercantiles.com",
    "rol": "admin",
    "avatar": "https://..."
  }
}
\`\`\`

**Response (401):**
\`\`\`json
{
  "success": false,
  "message": "Credenciales inválidas"
}
\`\`\`

### POST /api/auth/logout
Cerrar sesión.

**Response (200):**
\`\`\`json
{
  "success": true
}
\`\`\`

### GET /api/auth/verify
Verificar si el token es válido.

**Response (200):**
\`\`\`json
{
  "valid": true,
  "user": {
    "id": "1",
    "nombre": "Carlos Mendoza",
    "email": "carlos@mercantiles.com",
    "rol": "admin"
  }
}
\`\`\`

---

## Clientes

### GET /api/clientes
Listar clientes con filtros opcionales.

**Query params:**
- `buscar` (string): Buscar por nombre, email o teléfono
- `estado` (string): Filtrar por estado (activo, pendiente, inactivo)
- `page` (int): Página actual
- `limit` (int): Registros por página

**Response (200):**
\`\`\`json
{
  "data": [
    {
      "id": "1",
      "nombre": "María García",
      "email": "maria@ejemplo.com",
      "telefono": "+593 99 123 4567",
      "empresa": "Empresa ABC",
      "estado": "activo",
      "fuente": "publicidad_facebook",
      "fechaRegistro": "2024-01-15T10:30:00Z",
      "ultimaInteraccion": "2024-01-20T15:45:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "totalPages": 15
}
\`\`\`

### GET /api/clientes/:id
Obtener detalle de un cliente.

**Response (200):**
\`\`\`json
{
  "id": "1",
  "nombre": "María García",
  "email": "maria@ejemplo.com",
  "telefono": "+593 99 123 4567",
  "empresa": "Empresa ABC",
  "estado": "activo",
  "fuente": "publicidad_facebook",
  "fechaRegistro": "2024-01-15T10:30:00Z",
  "ultimaInteraccion": "2024-01-20T15:45:00Z",
  "notas": "Cliente interesado en productos premium"
}
\`\`\`

### POST /api/clientes
Crear nuevo cliente.

**Request:**
\`\`\`json
{
  "nombre": "Juan Pérez",
  "email": "juan@ejemplo.com",
  "telefono": "+593 99 987 6543",
  "empresa": "Mi Empresa",
  "estado": "pendiente",
  "notas": "Contactar la próxima semana"
}
\`\`\`

**Response (201):**
\`\`\`json
{
  "success": true,
  "id": "25"
}
\`\`\`

### PUT /api/clientes/:id
Actualizar cliente.

**Request:**
\`\`\`json
{
  "nombre": "Juan Pérez Actualizado",
  "estado": "activo"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true
}
\`\`\`

### DELETE /api/clientes/:id
Eliminar cliente.

**Response (200):**
\`\`\`json
{
  "success": true
}
\`\`\`

### GET /api/clientes/estadisticas
Obtener estadísticas de clientes.

**Response (200):**
\`\`\`json
{
  "total": 150,
  "activos": 85,
  "pendientes": 45,
  "inactivos": 20
}
\`\`\`

---

## Productos

### GET /api/productos
Listar productos con filtros.

**Query params:**
- `buscar` (string): Buscar por nombre o SKU
- `categoria` (string): Filtrar por categoría
- `activo` (boolean): Filtrar por estado activo/inactivo

**Response (200):**
\`\`\`json
{
  "data": [
    {
      "id": "1",
      "nombre": "Producto Premium",
      "descripcion": "Descripción del producto",
      "precio": 299.99,
      "categoria": "Electrónicos",
      "sku": "ELEC-001",
      "stock": 50,
      "imagen": "https://...",
      "activo": true
    }
  ],
  "total": 45
}
\`\`\`

### GET /api/productos/:id
Obtener detalle de producto.

### POST /api/productos
Crear producto.

**Request:**
\`\`\`json
{
  "nombre": "Nuevo Producto",
  "descripcion": "Descripción completa",
  "precio": 149.99,
  "categoria": "Servicios",
  "sku": "SERV-010",
  "stock": 100,
  "imagen": "https://..."
}
\`\`\`

**Response (201):**
\`\`\`json
{
  "success": true,
  "id": "15"
}
\`\`\`

### PUT /api/productos/:id
Actualizar producto.

### DELETE /api/productos/:id
Eliminar producto.

### GET /api/productos/categorias
Listar categorías de productos.

**Response (200):**
\`\`\`json
[
  { "id": "1", "nombre": "Electrónicos" },
  { "id": "2", "nombre": "Servicios" },
  { "id": "3", "nombre": "Software" }
]
\`\`\`

---

## Conversaciones / Chat

### GET /api/conversaciones?estado=pendiente
Listar conversaciones pendientes (derivadas del chatbot).

**Response (200):**
\`\`\`json
{
  "data": [
    {
      "id": "1",
      "cliente": {
        "id": "5",
        "nombre": "Ana López",
        "avatar": "https://..."
      },
      "ultimoMensaje": "Necesito hablar con un humano",
      "mensajesNoLeidos": 3,
      "fechaInicio": "2024-01-20T10:00:00Z",
      "ultimaActualizacion": "2024-01-20T10:15:00Z",
      "tema": "Consulta sobre precios",
      "estado": "pendiente",
      "empleadoId": null
    }
  ]
}
\`\`\`

### GET /api/conversaciones/mis-conversaciones
Listar conversaciones asignadas al empleado actual.

### GET /api/conversaciones/:id/mensajes
Obtener mensajes de una conversación.

**Response (200):**
\`\`\`json
{
  "conversacion": {
    "id": "1",
    "cliente": {
      "id": "5",
      "nombre": "Ana López",
      "email": "ana@ejemplo.com",
      "telefono": "+593 99 111 2222"
    },
    "tema": "Consulta sobre precios",
    "estado": "en_atencion"
  },
  "mensajes": [
    {
      "id": "1",
      "contenido": "Hola, me interesa conocer los precios",
      "tipo": "cliente",
      "timestamp": "2024-01-20T10:00:00Z",
      "leido": true
    },
    {
      "id": "2",
      "contenido": "¡Hola! Claro, ¿qué producto le interesa?",
      "tipo": "bot",
      "timestamp": "2024-01-20T10:00:05Z",
      "leido": true
    },
    {
      "id": "3",
      "contenido": "Prefiero hablar con alguien",
      "tipo": "cliente",
      "timestamp": "2024-01-20T10:01:00Z",
      "leido": false
    }
  ]
}
\`\`\`

### POST /api/conversaciones/:id/tomar
Tomar una conversación pendiente.

**Response (200):**
\`\`\`json
{
  "success": true
}
\`\`\`

### POST /api/conversaciones/:id/mensajes
Enviar mensaje en una conversación.

**Request:**
\`\`\`json
{
  "contenido": "Hola Ana, soy Carlos. ¿En qué puedo ayudarte?"
}
\`\`\`

**Response (201):**
\`\`\`json
{
  "success": true,
  "mensaje": {
    "id": "4",
    "contenido": "Hola Ana, soy Carlos. ¿En qué puedo ayudarte?",
    "tipo": "agente",
    "timestamp": "2024-01-20T10:05:00Z"
  }
}
\`\`\`

### POST /api/conversaciones/:id/cerrar
Cerrar una conversación.

**Request:**
\`\`\`json
{
  "resolucion": "Cliente satisfecho con la información proporcionada"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true
}
\`\`\`

### POST /api/conversaciones/:id/leido
Marcar mensajes como leídos.

---

## Historial del Chatbot

### GET /api/chatbot/historial
Listar registros generados por el chatbot.

**Query params:**
- `tipo` (string): cita, cotizacion, encuesta, documento
- `buscar` (string): Buscar por cliente o contenido
- `fechaDesde` (date): Fecha inicio
- `fechaHasta` (date): Fecha fin

**Response (200):**
\`\`\`json
{
  "data": [
    {
      "id": "1",
      "tipo": "cita",
      "titulo": "Cita de demostración",
      "descripcion": "Demostración de producto Premium",
      "cliente": {
        "id": "5",
        "nombre": "Ana López"
      },
      "conversacionId": "12",
      "fecha": "2024-01-25T14:00:00Z",
      "estado": "confirmada",
      "metadata": {
        "duracion": 30,
        "ubicacion": "Virtual - Zoom"
      }
    },
    {
      "id": "2",
      "tipo": "cotizacion",
      "titulo": "Cotización #COT-2024-015",
      "descripcion": "3 productos - Total: $899.97",
      "cliente": {
        "id": "8",
        "nombre": "Pedro Ruiz"
      },
      "conversacionId": "15",
      "fecha": "2024-01-20T11:30:00Z",
      "estado": "enviada",
      "metadata": {
        "productos": ["Producto A", "Producto B"],
        "total": 899.97
      }
    }
  ],
  "estadisticas": {
    "citas": 12,
    "cotizaciones": 28,
    "encuestas": 45,
    "documentos": 8
  }
}
\`\`\`

### GET /api/chatbot/historial/:tipo/:id
Obtener detalle de un registro del chatbot.

---

## Dashboard

### GET /api/dashboard/estadisticas
Obtener estadísticas del dashboard.

**Response (200):**
\`\`\`json
{
  "conversacionesPendientes": 5,
  "conversacionesHoy": 23,
  "clientesNuevosHoy": 8,
  "citasHoy": 4,
  "cotizacionesHoy": 6
}
\`\`\`

---

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| 200 | OK |
| 201 | Creado |
| 400 | Datos inválidos |
| 401 | No autenticado |
| 403 | Sin permisos |
| 404 | No encontrado |
| 500 | Error del servidor |

**Formato de error:**
\`\`\`json
{
  "success": false,
  "message": "Descripción del error",
  "errors": {
    "campo": ["Error específico del campo"]
  }
}
\`\`\`

---

## Ejemplo PHP (Laravel)

\`\`\`php
// routes/api.php
Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/verify', [AuthController::class, 'verify']);
    
    Route::apiResource('clientes', ClienteController::class);
    Route::get('/clientes/estadisticas', [ClienteController::class, 'estadisticas']);
    
    Route::apiResource('productos', ProductoController::class);
    Route::get('/productos/categorias', [ProductoController::class, 'categorias']);
    
    Route::get('/conversaciones', [ConversacionController::class, 'index']);
    Route::get('/conversaciones/mis-conversaciones', [ConversacionController::class, 'misConversaciones']);
    Route::get('/conversaciones/{id}/mensajes', [ConversacionController::class, 'mensajes']);
    Route::post('/conversaciones/{id}/tomar', [ConversacionController::class, 'tomar']);
    Route::post('/conversaciones/{id}/mensajes', [ConversacionController::class, 'enviarMensaje']);
    Route::post('/conversaciones/{id}/cerrar', [ConversacionController::class, 'cerrar']);
    
    Route::get('/chatbot/historial', [ChatbotHistorialController::class, 'index']);
    Route::get('/chatbot/historial/{tipo}/{id}', [ChatbotHistorialController::class, 'show']);
    
    Route::get('/dashboard/estadisticas', [DashboardController::class, 'estadisticas']);
});
\`\`\`

## Ejemplo Node.js (Express)

\`\`\`javascript
// routes/api.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

router.post('/auth/login', AuthController.login);

router.use(auth); // Middleware de autenticación

router.post('/auth/logout', AuthController.logout);
router.get('/auth/verify', AuthController.verify);

router.get('/clientes', ClienteController.index);
router.get('/clientes/estadisticas', ClienteController.estadisticas);
router.get('/clientes/:id', ClienteController.show);
router.post('/clientes', ClienteController.store);
router.put('/clientes/:id', ClienteController.update);
router.delete('/clientes/:id', ClienteController.destroy);

// ... resto de rutas
\`\`\`

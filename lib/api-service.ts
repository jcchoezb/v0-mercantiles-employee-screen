// Configuración base de la API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

// Helper para manejar respuestas
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    const msg =
      error?.message ||
      error?.error ||
      (response.status === 401 ? "No autorizado. Inicia sesion nuevamente." :
       response.status === 403 ? "No tienes permisos para esta accion." :
       response.status === 404 ? "Recurso no encontrado." :
       response.status === 500 ? "Error interno del servidor. Intenta mas tarde." :
       `Error ${response.status}`);
    throw new Error(msg);
  }
  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return null as T;
  }
  return response.json().catch(() => null as T);
}

// Helper para obtener headers con autenticación Bearer JWT
function getAuthHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Helper para headers sin Content-Type (evita preflight CORS en PATCH sin body)
function getAuthHeadersSimple(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ============================================
// AUTH API
// ============================================
export const authApi = {
  // POST /api/auth/login
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse<{
      token: string;
      empleadoId: number;
      nombre: string;
      email: string;
      rol: string;
      avatarUrl?: string;
    }>(response);
  },

  // POST /api/auth/cambiar-password
  cambiarPassword: async (passwordActual: string, passwordNueva: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/cambiar-password`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ passwordActual, passwordNueva }),
    });
    return handleResponse<{ message: string }>(response);
  },

  // GET /api/auth/perfil
  perfil: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/perfil`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{
      id: number;
      nombre: string;
      email: string;
      rol: string;
      avatarUrl?: string;
      departamento?: string;
      telefono?: string;
      activo: boolean;
    }>(response);
  },
};

// ============================================
// PRODUCTOS API
// ============================================
export const productosApi = {
  // POST /api/productos (crear)
  crear: async (data: {
    nombre: string;
    descripcion: string;
    precio: number;
    precioOferta?: number;
    categoriaId: number;
    imagenUrl?: string;
    sku: string;
    stock: number;
    stockMinimo?: number;
    activo?: boolean;
    destacado?: boolean;
    caracteristicas?: Record<string, unknown>;
  }) => {
    const response = await fetch(`${API_BASE_URL}/productos`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // POST /api/productos/filtrar
  filtrar: async (filtros: {
    categoriaId?: number;
    activo?: boolean;
    destacado?: boolean;
    precioMin?: number;
    precioMax?: number;
    search?: string;
    bajoStock?: boolean;
  }) => {
    const response = await fetch(`${API_BASE_URL}/productos/filtrar`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(filtros),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // GET /api/productos/:id
  obtener: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/productos/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // PATCH /api/productos/:id/desactivar
  desactivar: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/productos/${id}/desactivar`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // PATCH /api/productos/:id/activar
  activar: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/productos/${id}/activar`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // GET /api/productos (listar todos)
  listar: async () => {
    const response = await fetch(`${API_BASE_URL}/productos`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // GET /api/productos/sku/:sku
  buscarPorSku: async (sku: string) => {
    const response = await fetch(`${API_BASE_URL}/productos/sku/${sku}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // GET /api/productos/buscar?q=...
  buscar: async (query: string) => {
    const response = await fetch(`${API_BASE_URL}/productos/buscar?q=${encodeURIComponent(query)}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // GET /api/productos/destacados
  destacados: async () => {
    const response = await fetch(`${API_BASE_URL}/productos/destacados`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // GET /api/productos/bajo-stock
  bajoStock: async () => {
    const response = await fetch(`${API_BASE_URL}/productos/bajo-stock`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // GET /api/productos/activos
  activos: async () => {
    const response = await fetch(`${API_BASE_URL}/productos/activos`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // GET /api/productos/categoria/:categoriaId
  porCategoria: async (categoriaId: number) => {
    const response = await fetch(`${API_BASE_URL}/productos/categoria/${categoriaId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // GET /api/productos/contar-bajo-stock
  contarBajoStock: async () => {
    const response = await fetch(`${API_BASE_URL}/productos/contar-bajo-stock`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<number>(response);
  },

  // GET /api/productos/contar-activos
  contarActivos: async () => {
    const response = await fetch(`${API_BASE_URL}/productos/contar-activos`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<number>(response);
  },

  // DELETE /api/productos/:id
  eliminar: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/productos/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // PUT /api/productos/:id
  actualizar: async (id: number, data: Record<string, unknown>) => {
    const response = await fetch(`${API_BASE_URL}/productos/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Record<string, unknown>>(response);
  },
};

// ============================================
// CONVERSACIONES API
// ============================================
export const conversacionesApi = {
  // POST /api/conversaciones (crear)
  crear: async (data: {
    clienteId: number;
    empleadoId?: number;
    tema?: string;
    origen: string;
    canal?: string;
    motivoDerivacion?: string;
    mensajeInicial?: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/conversaciones`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // POST /api/conversaciones/:id/asignar
  asignar: async (conversacionId: number, body: { empleadoId: number; motivo?: string }) => {
    const response = await fetch(`${API_BASE_URL}/conversaciones/${conversacionId}/asignar`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // GET /api/conversaciones/:id
  obtener: async (conversacionId: number) => {
    const response = await fetch(`${API_BASE_URL}/conversaciones/${conversacionId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // POST /api/conversaciones/:id/cerrar
  cerrar: async (conversacionId: number) => {
    const response = await fetch(`${API_BASE_URL}/conversaciones/${conversacionId}/cerrar`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // POST /api/conversaciones/:id/calificar?calificacion=N
  calificar: async (conversacionId: number, calificacion: number) => {
    const response = await fetch(
      `${API_BASE_URL}/conversaciones/${conversacionId}/calificar?calificacion=${calificacion}`,
      {
        method: "POST",
        headers: getAuthHeaders(),
      }
    );
    return handleResponse<Record<string, unknown>>(response);
  },

  // GET /api/conversaciones (listar todas)
  listar: async () => {
    const response = await fetch(`${API_BASE_URL}/conversaciones`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // GET /api/conversaciones/pendientes
  pendientes: async () => {
    const response = await fetch(`${API_BASE_URL}/conversaciones/pendientes`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // GET /api/conversaciones/estadisticas
  estadisticas: async () => {
    const response = await fetch(`${API_BASE_URL}/conversaciones/estadisticas`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // GET /api/conversaciones/empleado/:empleadoId
  porEmpleado: async (empleadoId: number) => {
    const response = await fetch(`${API_BASE_URL}/conversaciones/empleado/${empleadoId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // GET /api/conversaciones/cliente/:clienteId
  porCliente: async (clienteId: number) => {
    const response = await fetch(`${API_BASE_URL}/conversaciones/cliente/${clienteId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // GET /api/conversaciones/contar-pendientes
  contarPendientes: async () => {
    const response = await fetch(`${API_BASE_URL}/conversaciones/contar-pendientes`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<number>(response);
  },

  // GET /api/conversaciones/contar-activas
  contarActivas: async () => {
    const response = await fetch(`${API_BASE_URL}/conversaciones/contar-activas`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<number>(response);
  },
};

// ============================================
// MENSAJES API
// ============================================
export const mensajesApi = {
  // POST /api/mensajes/conversacion/:conversacionId (crear mensaje)
  crear: async (
    conversacionId: number,
    data: {
      contenido: string;
      tipoContenido: string;
      archivoUrl?: string;
      remitenteTipo: string;
      remitenteId: number;
    }
  ) => {
    const response = await fetch(`${API_BASE_URL}/mensajes/conversacion/${conversacionId}`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // GET /api/mensajes/conversacion/:conversacionId (listar mensajes)
  listar: async (conversacionId: number) => {
    const response = await fetch(`${API_BASE_URL}/mensajes/conversacion/${conversacionId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // GET /api/mensajes/conversacion/:conversacionId/chat
  chat: async (conversacionId: number) => {
    const response = await fetch(`${API_BASE_URL}/mensajes/conversacion/${conversacionId}/chat`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // PATCH /api/mensajes/conversacion/:conversacionId/leer-todos
  leerTodos: async (conversacionId: number) => {
    const response = await fetch(`${API_BASE_URL}/mensajes/conversacion/${conversacionId}/leer-todos`, {
      method: "PATCH",
      headers: getAuthHeadersSimple(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // PATCH /api/mensajes/:id/leer
  leer: async (mensajeId: number) => {
    const response = await fetch(`${API_BASE_URL}/mensajes/${mensajeId}/leer`, {
      method: "PATCH",
      headers: getAuthHeadersSimple(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // GET /api/mensajes/conversacion/:conversacionId/no-leidos
  noLeidos: async (conversacionId: number) => {
    const response = await fetch(`${API_BASE_URL}/mensajes/conversacion/${conversacionId}/no-leidos`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<number>(response);
  },

  // DELETE /api/mensajes/:id
  eliminar: async (mensajeId: number) => {
    const response = await fetch(`${API_BASE_URL}/mensajes/${mensajeId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // GET /api/mensajes/cliente/:clienteId/historial
  historialCliente: async (clienteId: number) => {
    const response = await fetch(`${API_BASE_URL}/mensajes/cliente/${clienteId}/historial`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },
};

// ============================================
// CITAS API
// ============================================
export const citasApi = {
  // GET /api/citas (listar todas)
  listar: async () => {
    const response = await fetch(`${API_BASE_URL}/citas`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // GET /api/citas?conversacionId=X
  porConversacion: async (conversacionId: number) => {
    const response = await fetch(`${API_BASE_URL}/citas?conversacionId=${conversacionId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // POST /api/citas (crear)
  crear: async (data: {
    clienteId: number;
    empleadoId: number;
    titulo: string;
    descripcion?: string;
    fechaHora: string;
    duracionMinutos: number;
    tipo: string;
    ubicacion?: string;
    enlaceVirtual?: string;
    notas?: string;
    conversacionId?: number;
  }) => {
    const response = await fetch(`${API_BASE_URL}/citas`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // POST /api/citas/filtrar
  filtrar: async (filtros: {
    empleadoId?: number;
    clienteId?: number;
    estado?: string;
    tipo?: string;
    fechaInicio?: string;
    fechaFin?: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/citas/filtrar`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(filtros),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // GET /api/citas/:id
  obtener: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/citas/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // POST /api/citas/:id/completar?notas=...
  completar: async (id: number, notas?: string) => {
    const params = notas ? `?notas=${encodeURIComponent(notas)}` : "";
    const response = await fetch(`${API_BASE_URL}/citas/${id}/completar${params}`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // POST /api/citas/:id/confirmar
  confirmar: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/citas/${id}/confirmar`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // POST /api/citas/:id/cancelar?motivo=...
  cancelar: async (id: number, motivo?: string) => {
    const params = motivo ? `?motivo=${encodeURIComponent(motivo)}` : "";
    const response = await fetch(`${API_BASE_URL}/citas/${id}/cancelar${params}`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // GET /api/citas (listar todas)
  listar: async () => {
    const response = await fetch(`${API_BASE_URL}/citas`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // GET /api/citas/proximas
  proximas: async () => {
    const response = await fetch(`${API_BASE_URL}/citas/proximas`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // GET /api/citas/empleado/:empleadoId
  porEmpleado: async (empleadoId: number) => {
    const response = await fetch(`${API_BASE_URL}/citas/empleado/${empleadoId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // GET /api/citas/contar-pendientes
  contarPendientes: async () => {
    const response = await fetch(`${API_BASE_URL}/citas/contar-pendientes`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<number>(response);
  },

  // GET /api/citas/contar-hoy
  contarHoy: async () => {
    const response = await fetch(`${API_BASE_URL}/citas/contar-hoy`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<number>(response);
  },

  // GET /api/citas/cliente/:clienteId
  porCliente: async (clienteId: number) => {
    const response = await fetch(`${API_BASE_URL}/citas/cliente/${clienteId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // PUT /api/citas/:id
  actualizar: async (id: number, data: Record<string, unknown>) => {
    const response = await fetch(`${API_BASE_URL}/citas/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // DELETE /api/citas/:id
  eliminar: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/citas/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },
};

// ============================================
// COTIZACIONES API
// ============================================
export const cotizacionesApi = {
  // GET /api/cotizaciones (listar todas)
  listar: async () => {
    const response = await fetch(`${API_BASE_URL}/cotizaciones`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // GET /api/cotizaciones?clienteId=X
  porCliente: async (clienteId: number) => {
    const response = await fetch(`${API_BASE_URL}/cotizaciones?clienteId=${clienteId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // GET /api/cotizaciones/:id
  obtener: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/cotizaciones/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },
};

// ============================================
// ENCUESTAS API
// ============================================
export const encuestasApi = {
  // GET /api/encuestas (listar todas)
  listar: async () => {
    const response = await fetch(`${API_BASE_URL}/encuestas`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // GET /api/encuestas?clienteId=X
  porCliente: async (clienteId: number) => {
    const response = await fetch(`${API_BASE_URL}/encuestas?clienteId=${clienteId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // GET /api/encuestas/:id
  obtener: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/encuestas/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },
};

// ============================================
// DOCUMENTOS API
// ============================================
export const documentosApi = {
  // GET /api/documentos (listar todos)
  listar: async () => {
    const response = await fetch(`${API_BASE_URL}/documentos`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // GET /api/documentos?clienteId=X
  porCliente: async (clienteId: number) => {
    const response = await fetch(`${API_BASE_URL}/documentos?clienteId=${clienteId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // GET /api/documentos/:id
  obtener: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/documentos/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },
};

// ============================================
// CATEGORIAS PRODUCTOS API
// ============================================
export const categoriasApi = {
  // POST /api/categorias-productos (crear)
  crear: async (data: { nombre: string; descripcion?: string; icono?: string; orden?: number; activo?: boolean }) => {
    const response = await fetch(`${API_BASE_URL}/categorias-productos`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // GET /api/categorias-productos/:id
  obtener: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/categorias-productos/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // PUT /api/categorias-productos/:id
  actualizar: async (id: number, data: Record<string, unknown>) => {
    const response = await fetch(`${API_BASE_URL}/categorias-productos/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // GET /api/categorias-productos (listar todas)
  listar: async () => {
    const response = await fetch(`${API_BASE_URL}/categorias-productos`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // PATCH /api/categorias-productos/:id/desactivar
  desactivar: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/categorias-productos/${id}/desactivar`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // PATCH /api/categorias-productos/:id/activar
  activar: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/categorias-productos/${id}/activar`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // GET /api/categorias-productos/contar-activas
  contarActivas: async () => {
    const response = await fetch(`${API_BASE_URL}/categorias-productos/contar-activas`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<number>(response);
  },

  // GET /api/categorias-productos/activas
  activas: async () => {
    const response = await fetch(`${API_BASE_URL}/categorias-productos/activas`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },
};

// ============================================
// REPORTES API
// ============================================
export const reportesApi = {
  // GET /api/reportes/ventas?fechaInicio=...&fechaFin=...
  ventas: async (fechaInicio: string, fechaFin: string) => {
    const response = await fetch(
      `${API_BASE_URL}/reportes/ventas?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
      { headers: getAuthHeaders() }
    );
    return handleResponse<Record<string, unknown>>(response);
  },

  // GET /api/reportes/generales
  generales: async () => {
    const response = await fetch(`${API_BASE_URL}/reportes/generales`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // GET /api/reportes/empleados/actividad?fechaInicio=...&fechaFin=...
  actividadEmpleados: async (fechaInicio: string, fechaFin: string) => {
    const response = await fetch(
      `${API_BASE_URL}/reportes/empleados/actividad?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
      { headers: getAuthHeaders() }
    );
    return handleResponse<Record<string, unknown>>(response);
  },

  // GET /api/reportes/conversaciones/diario?fechaInicio=...&fechaFin=...
  conversacionesDiario: async (fechaInicio: string, fechaFin: string) => {
    const response = await fetch(
      `${API_BASE_URL}/reportes/conversaciones/diario?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
      { headers: getAuthHeaders() }
    );
    return handleResponse<Record<string, unknown>>(response);
  },

  // GET /api/reportes/chatbot?fechaInicio=...&fechaFin=...
  chatbot: async (fechaInicio: string, fechaFin: string) => {
    const response = await fetch(
      `${API_BASE_URL}/reportes/chatbot?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
      { headers: getAuthHeaders() }
    );
    return handleResponse<Record<string, unknown>>(response);
  },

  // GET /api/reportes/clientes/mensual/:anio
  clientesMensual: async (anio: number) => {
    const response = await fetch(`${API_BASE_URL}/reportes/clientes/mensual/${anio}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },
};

// ============================================
// EMPLEADOS API
// ============================================
export const empleadosApi = {
  // POST /api/empleados (crear)
  crear: async (data: {
    nombre: string;
    email: string;
    password: string;
    avatarUrl?: string;
    rolId: number;
    departamento?: string;
    telefono?: string;
    activo?: boolean;
  }) => {
    const response = await fetch(`${API_BASE_URL}/empleados`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // GET /api/empleados/:id
  obtener: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/empleados/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // PUT /api/empleados/:id
  actualizar: async (id: number, data: Record<string, unknown>) => {
    const response = await fetch(`${API_BASE_URL}/empleados/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // DELETE /api/empleados/:id
  eliminar: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/empleados/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // GET /api/empleados (listar todos)
  listar: async () => {
    const response = await fetch(`${API_BASE_URL}/empleados`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // PATCH /api/empleados/:id/desactivar
  desactivar: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/empleados/${id}/desactivar`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // PATCH /api/empleados/:id/activar
  activar: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/empleados/${id}/activar`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // GET /api/empleados/:id/perfil
  perfil: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/empleados/${id}/perfil`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // GET /api/empleados/estadisticas/activos
  estadisticasActivos: async () => {
    const response = await fetch(`${API_BASE_URL}/empleados/estadisticas/activos`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<number>(response);
  },

  // GET /api/empleados/activos
  activos: async () => {
    const response = await fetch(`${API_BASE_URL}/empleados/activos`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },
};

// ============================================
// CLIENTES API
// ============================================
export const clientesApi = {
  // POST /api/clientes (crear)
  crear: async (data: {
    nombre: string;
    email: string;
    telefono: string;
    empresa?: string;
    direccion?: string;
    ciudad?: string;
    pais?: string;
    estado?: string;
    notas?: string;
    fuente?: string;
    empleadoAsignadoId?: number;
  }) => {
    const response = await fetch(`${API_BASE_URL}/clientes`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // POST /api/clientes/:id/asignar-empleado/:empleadoId
  asignarEmpleado: async (clienteId: number, empleadoId: number) => {
    const response = await fetch(`${API_BASE_URL}/clientes/${clienteId}/asignar-empleado/${empleadoId}`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // GET /api/clientes/:id
  obtener: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/clientes/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // PUT /api/clientes/:id
  actualizar: async (id: number, data: Record<string, unknown>) => {
    const response = await fetch(`${API_BASE_URL}/clientes/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // DELETE /api/clientes/:id
  eliminar: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/clientes/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // GET /api/clientes (listar todos)
  listar: async () => {
    const response = await fetch(`${API_BASE_URL}/clientes`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // GET /api/clientes/estadisticas
  estadisticas: async () => {
    const response = await fetch(`${API_BASE_URL}/clientes/estadisticas`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // POST /api/clientes/filtrar
  filtrar: async (filtros: {
    estado?: string;
    fuente?: string;
    empleadoAsignadoId?: number;
    search?: string;
    fechaDesde?: string;
    fechaHasta?: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/clientes/filtrar`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(filtros),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // GET /api/clientes/contar
  contar: async () => {
    const response = await fetch(`${API_BASE_URL}/clientes/contar`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<number>(response);
  },

  // GET /api/clientes/contar-activos
  contarActivos: async () => {
    const response = await fetch(`${API_BASE_URL}/clientes/contar-activos`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<number>(response);
  },

  // GET /api/clientes/buscar?q=...
  buscar: async (query: string) => {
    const response = await fetch(`${API_BASE_URL}/clientes/buscar?q=${encodeURIComponent(query)}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },
};

// ============================================
// ORIGENES / CAMPAÑAS API
// ============================================
export const origenesApi = {
  // GET /api/origenes (listar todas)
  listar: async () => {
    const response = await fetch(`${API_BASE_URL}/origenes`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // GET /api/origenes/activos
  listarActivos: async () => {
    const response = await fetch(`${API_BASE_URL}/origenes/activos`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // GET /api/origenes/:id
  obtener: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/origenes/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // GET /api/origenes/identificador/:uuid
  porIdentificador: async (uuid: string) => {
    const response = await fetch(`${API_BASE_URL}/origenes/identificador/${encodeURIComponent(uuid)}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // POST /api/origenes
  crear: async (data: {
    codigoOrigen: string;
    tipoOrigen: string;
    nombre: string;
    descripcion?: string;
    activo?: boolean;
  }) => {
    const response = await fetch(`${API_BASE_URL}/origenes`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // PUT /api/origenes/:id
  actualizar: async (id: number, data: {
    nombre?: string;
    descripcion?: string;
    activo?: boolean;
  }) => {
    const response = await fetch(`${API_BASE_URL}/origenes/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // DELETE /api/origenes/:id
  eliminar: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/origenes/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // PATCH /api/origenes/:id/activar
  activar: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/origenes/${id}/activar`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // PATCH /api/origenes/:id/desactivar
  desactivar: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/origenes/${id}/desactivar`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // GET /api/origenes/tipo/:tipo
  porTipo: async (tipo: string) => {
    const response = await fetch(`${API_BASE_URL}/origenes/tipo/${encodeURIComponent(tipo)}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // PATCH /api/origenes/:id/vincular?conversacionId=X&clienteId=Y
  vincular: async (id: number, conversacionId: number, clienteId: number) => {
    const response = await fetch(
      `${API_BASE_URL}/origenes/${id}/vincular?conversacionId=${conversacionId}&clienteId=${clienteId}`,
      {
        method: "PATCH",
        headers: getAuthHeaders(),
      }
    );
    return handleResponse<Record<string, unknown>>(response);
  },
};

// ============================================
// ORIGEN CONTEXTO API
// ============================================
export const origenContextoApi = {
  // GET /api/origenes/contexto/origen/:origenId
  listarPorOrigen: async (origenId: number) => {
    const response = await fetch(`${API_BASE_URL}/origenes/contexto/origen/${origenId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // POST /api/origenes/contexto
  crear: async (data: {
    origenId: number;
    tipoEntidad: string;
    entidadId: number;
    datosContexto?: Record<string, unknown>;
    prioridad?: number;
  }) => {
    const response = await fetch(`${API_BASE_URL}/origenes/contexto`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // PUT /api/origenes/contexto/:id
  actualizar: async (id: number, data: {
  origenId: number;
  tipoEntidad: string;
  entidadId: number;
  datosContexto: Record<string, unknown>;
  prioridad?: number;
  }) => {
  const response = await fetch(`${API_BASE_URL}/origenes/contexto/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // DELETE /api/origenes/contexto/:id
  eliminar: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/origenes/contexto/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // DELETE /api/origenes/contexto/origen/:origenId
  eliminarTodos: async (origenId: number) => {
    const response = await fetch(`${API_BASE_URL}/origenes/contexto/origen/${origenId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // GET /api/origenes/contexto/origen/:origenId/relevante
  listarRelevante: async (origenId: number) => {
    const response = await fetch(`${API_BASE_URL}/origenes/contexto/origen/${origenId}/relevante`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // GET /api/origenes/contexto/origen/:origenId/tipo/:tipo
  listarPorTipo: async (origenId: number, tipo: string) => {
    const response = await fetch(`${API_BASE_URL}/origenes/contexto/origen/${origenId}/tipo/${encodeURIComponent(tipo)}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },
};

// ============================================
// PARAMETROS API
// ============================================
export const parametrosApi = {
  // GET /api/parametros (listar todos)
  listar: async () => {
    const response = await fetch(`${API_BASE_URL}/parametros`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // GET /api/parametros/activos
  listarActivos: async () => {
    const response = await fetch(`${API_BASE_URL}/parametros/activos`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // GET /api/parametros/:id
  obtener: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/parametros/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // POST /api/parametros
  crear: async (data: {
    codigo: string;
    nombre: string;
    valor: string;
    descripcion?: string;
    ambiente?: string;
    modulo?: string;
    esEncriptado?: boolean;
    usuarioCreacion?: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/parametros`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // PUT /api/parametros/:id
  actualizar: async (id: number, data: {
    codigo?: string;
    nombre?: string;
    valor?: string;
    descripcion?: string;
    ambiente?: string;
    modulo?: string;
    esEncriptado?: boolean;
    usuarioCreacion?: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/parametros/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // DELETE /api/parametros/:id
  eliminar: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/parametros/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // PATCH /api/parametros/:id/activar
  activar: async (id: number, usuario: string = "admin") => {
    const response = await fetch(`${API_BASE_URL}/parametros/${id}/activar?usuario=${encodeURIComponent(usuario)}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // PATCH /api/parametros/:id/desactivar
  desactivar: async (id: number, usuario: string = "admin") => {
    const response = await fetch(`${API_BASE_URL}/parametros/${id}/desactivar?usuario=${encodeURIComponent(usuario)}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // GET /api/parametros/modulo/:modulo
  porModulo: async (modulo: string) => {
    const response = await fetch(`${API_BASE_URL}/parametros/modulo/${encodeURIComponent(modulo)}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // GET /api/parametros/ambiente/:ambiente
  porAmbiente: async (ambiente: string) => {
    const response = await fetch(`${API_BASE_URL}/parametros/ambiente/${encodeURIComponent(ambiente)}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },
};

// ============================================
// CATALOGOS API
// ============================================
export const catalogosApi = {
  // GET /api/catalogos (listar todos)
  listar: async () => {
    const response = await fetch(`${API_BASE_URL}/catalogos`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // GET /api/catalogos/activos
  listarActivos: async () => {
    const response = await fetch(`${API_BASE_URL}/catalogos/activos`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // GET /api/catalogos/:id
  obtener: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/catalogos/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // POST /api/catalogos
  crear: async (data: {
    tipoCatalogo: string;
    codigo: string;
    nombre: string;
    descripcion?: string;
    valorExtra?: string;
    orden?: number;
    usuarioCreacion?: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/catalogos`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // PUT /api/catalogos/:id
  actualizar: async (id: number, data: {
    tipoCatalogo?: string;
    codigo?: string;
    nombre?: string;
    descripcion?: string;
    valorExtra?: string;
    orden?: number;
    usuarioCreacion?: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/catalogos/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // DELETE /api/catalogos/:id
  eliminar: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/catalogos/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // PATCH /api/catalogos/:id/activar
  activar: async (id: number, usuario: string = "admin") => {
    const response = await fetch(`${API_BASE_URL}/catalogos/${id}/activar?usuario=${encodeURIComponent(usuario)}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // PATCH /api/catalogos/:id/desactivar
  desactivar: async (id: number, usuario: string = "admin") => {
    const response = await fetch(`${API_BASE_URL}/catalogos/${id}/desactivar?usuario=${encodeURIComponent(usuario)}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // GET /api/catalogos/tipo/:tipo
  porTipo: async (tipo: string) => {
    const response = await fetch(`${API_BASE_URL}/catalogos/tipo/${encodeURIComponent(tipo)}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // GET /api/catalogos/tipo/:tipo/activos
  porTipoActivos: async (tipo: string) => {
    const response = await fetch(`${API_BASE_URL}/catalogos/tipo/${encodeURIComponent(tipo)}/activos`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },
};

// ============================================
// DASHBOARD API (usa reportes/generales + contadores)
// ============================================
export const dashboardApi = {
  estadisticas: async () => {
    const response = await fetch(`${API_BASE_URL}/reportes/generales`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },
};

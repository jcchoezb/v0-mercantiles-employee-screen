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
      empresaId?: number;
      empresaNombre?: string;
      conversacionesActivas?: number | null;
      citasAsignadas?: number | null;
    }>(response);
  },
};

// ============================================
// CLIENTES API
// ============================================
export const clientesApi = {
  // GET /api/clientes
  listar: async () => {
    const response = await fetch(`${API_BASE_URL}/clientes`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // GET /api/clientes/:id
  obtener: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/clientes/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // POST /api/clientes
  crear: async (data: {
    nombre: string;
    apellido?: string;
    email?: string;
    telefono: string;
    direccion?: string;
    ciudad?: string;
    notas?: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/clientes`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // PUT /api/clientes/:id
  actualizar: async (id: number, data: {
    nombre?: string;
    apellido?: string;
    email?: string;
    telefono?: string;
    direccion?: string;
    ciudad?: string;
    notas?: string;
  }) => {
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

  // GET /api/clientes/buscar?q=texto
  buscar: async (q: string) => {
    const response = await fetch(`${API_BASE_URL}/clientes/buscar?q=${encodeURIComponent(q)}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },
};

// ============================================
// CONVERSACIONES API
// ============================================
export const conversacionesApi = {
  // GET /api/conversaciones
  listar: async () => {
    const response = await fetch(`${API_BASE_URL}/conversaciones`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // GET /api/conversaciones/:id
  obtener: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/conversaciones/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // POST /api/conversaciones
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

  // PUT /api/conversaciones/:id
  actualizar: async (id: number, data: Record<string, unknown>) => {
    const response = await fetch(`${API_BASE_URL}/conversaciones/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // GET /api/conversaciones/cliente/:clienteId
  porCliente: async (clienteId: number) => {
    const response = await fetch(`${API_BASE_URL}/conversaciones/cliente/${clienteId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // GET /api/conversaciones/empleado/:empleadoId
  porEmpleado: async (empleadoId: number) => {
    const response = await fetch(`${API_BASE_URL}/conversaciones/empleado/${empleadoId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // PATCH /api/conversaciones/:id/asignar?empleadoId=X
  asignar: async (id: number, empleadoId: number) => {
    const response = await fetch(
      `${API_BASE_URL}/conversaciones/${id}/asignar?empleadoId=${empleadoId}`,
      {
        method: "PATCH",
        headers: getAuthHeadersSimple(),
      }
    );
    return handleResponse<Record<string, unknown>>(response);
  },

  // PATCH /api/conversaciones/:id/cerrar
  cerrar: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/conversaciones/${id}/cerrar`, {
      method: "PATCH",
      headers: getAuthHeadersSimple(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // PATCH /api/conversaciones/:id/reabrir
  reabrir: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/conversaciones/${id}/reabrir`, {
      method: "PATCH",
      headers: getAuthHeadersSimple(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // GET /api/conversaciones/activas
  activas: async () => {
    const response = await fetch(`${API_BASE_URL}/conversaciones/activas`, {
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
};

// ============================================
// MENSAJES API
// ============================================
export const mensajesApi = {
  // GET /api/mensajes/conversacion/:conversacionId
  porConversacion: async (conversacionId: number) => {
    const response = await fetch(`${API_BASE_URL}/mensajes/conversacion/${conversacionId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // POST /api/mensajes
  enviar: async (data: {
    conversacionId: number;
    contenido: string;
    tipoRemitente: "empleado" | "cliente" | "bot";
    remitenteId?: number;
  }) => {
    const response = await fetch(`${API_BASE_URL}/mensajes`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Record<string, unknown>>(response);
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
    return handleResponse<Record<string, unknown>[]>(response);
  },
};

// ============================================
// EMPLEADOS API
// ============================================
export const empleadosApi = {
  // GET /api/empleados
  listar: async () => {
    const response = await fetch(`${API_BASE_URL}/empleados`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // GET /api/empleados/:id
  obtener: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/empleados/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // POST /api/empleados
  crear: async (data: {
    nombre: string;
    email: string;
    password: string;
    rol: string;
    departamento?: string;
    telefono?: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/empleados`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // PUT /api/empleados/:id
  actualizar: async (id: number, data: {
    nombre?: string;
    email?: string;
    rol?: string;
    departamento?: string;
    telefono?: string;
  }) => {
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

  // PATCH /api/empleados/:id/activar
  activar: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/empleados/${id}/activar`, {
      method: "PATCH",
      headers: getAuthHeadersSimple(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // PATCH /api/empleados/:id/desactivar
  desactivar: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/empleados/${id}/desactivar`, {
      method: "PATCH",
      headers: getAuthHeadersSimple(),
    });
    return handleResponse<Record<string, unknown>>(response);
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
// EMPRESAS API
// ============================================
export const empresasApi = {
  // GET /api/empresas
  listar: async () => {
    const response = await fetch(`${API_BASE_URL}/empresas`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // GET /api/empresas/activas
  activas: async () => {
    const response = await fetch(`${API_BASE_URL}/empresas/activas`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // GET /api/empresas/:id
  obtener: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/empresas/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // POST /api/empresas
  crear: async (data: {
    nombre: string;
    descripcion?: string;
    telefono?: string;
    email?: string;
    direccion?: string;
    sitioWeb?: string;
    logoUrl?: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/empresas`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // PUT /api/empresas/:id
  actualizar: async (id: number, data: {
    nombre?: string;
    descripcion?: string;
    telefono?: string;
    email?: string;
    direccion?: string;
    sitioWeb?: string;
    logoUrl?: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/empresas/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // DELETE /api/empresas/:id
  eliminar: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/empresas/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // PATCH /api/empresas/:id/activar
  activar: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/empresas/${id}/activar`, {
      method: "PATCH",
      headers: getAuthHeadersSimple(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // PATCH /api/empresas/:id/desactivar
  desactivar: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/empresas/${id}/desactivar`, {
      method: "PATCH",
      headers: getAuthHeadersSimple(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },
};

// ============================================
// API CONFIGS API (Configuración de APIs Externas)
// ============================================
export const apiConfigsApi = {
  // GET /api/api-configs
  listar: async () => {
    const response = await fetch(`${API_BASE_URL}/api-configs`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // GET /api/api-configs/activas
  activas: async () => {
    const response = await fetch(`${API_BASE_URL}/api-configs/activas`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // GET /api/api-configs/empresa/:empresaId
  porEmpresa: async (empresaId: number) => {
    const response = await fetch(`${API_BASE_URL}/api-configs/empresa/${empresaId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // GET /api/api-configs/:id
  obtener: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/api-configs/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // POST /api/api-configs
  crear: async (data: {
    nombre: string;
    descripcion?: string;
    baseUrl: string;
    metodoAuth: string;
    headers?: Record<string, string>;
    timeout?: number;
  }) => {
    const response = await fetch(`${API_BASE_URL}/api-configs`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // PUT /api/api-configs/:id
  actualizar: async (id: number, data: {
    nombre?: string;
    descripcion?: string;
    baseUrl?: string;
    metodoAuth?: string;
    headers?: Record<string, string>;
    timeout?: number;
  }) => {
    const response = await fetch(`${API_BASE_URL}/api-configs/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // DELETE /api/api-configs/:id
  eliminar: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/api-configs/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // PATCH /api/api-configs/:id/activar
  activar: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/api-configs/${id}/activar`, {
      method: "PATCH",
      headers: getAuthHeadersSimple(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // PATCH /api/api-configs/:id/desactivar
  desactivar: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/api-configs/${id}/desactivar`, {
      method: "PATCH",
      headers: getAuthHeadersSimple(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // POST /api/api-configs/:id/probar
  probar: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/api-configs/${id}/probar`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },
};

// ============================================
// WORKFLOWS API
// ============================================
export const workflowsApi = {
  // GET /api/workflows
  listar: async () => {
    const response = await fetch(`${API_BASE_URL}/workflows`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // GET /api/workflows/activos
  activos: async () => {
    const response = await fetch(`${API_BASE_URL}/workflows/activos`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // GET /api/workflows/:id
  obtener: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/workflows/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // GET /api/workflows/:id/completo (incluye pasos)
  obtenerCompleto: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/workflows/${id}/completo`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // POST /api/workflows
  crear: async (data: {
    nombre: string;
    descripcion?: string;
    empresaId?: number;
    triggerType: string;
    triggerConfig?: Record<string, unknown>;
  }) => {
    const response = await fetch(`${API_BASE_URL}/workflows`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // PUT /api/workflows/:id
  actualizar: async (id: number, data: {
    nombre?: string;
    descripcion?: string;
    empresaId?: number;
    triggerType?: string;
    triggerConfig?: Record<string, unknown>;
  }) => {
    const response = await fetch(`${API_BASE_URL}/workflows/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // DELETE /api/workflows/:id
  eliminar: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/workflows/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // PATCH /api/workflows/:id/activar
  activar: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/workflows/${id}/activar`, {
      method: "PATCH",
      headers: getAuthHeadersSimple(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // PATCH /api/workflows/:id/desactivar
  desactivar: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/workflows/${id}/desactivar`, {
      method: "PATCH",
      headers: getAuthHeadersSimple(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // POST /api/workflows/:id/duplicar
  duplicar: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/workflows/${id}/duplicar`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // GET /api/workflows/empresa/:empresaId
  porEmpresa: async (empresaId: number) => {
    const response = await fetch(`${API_BASE_URL}/workflows/empresa/${empresaId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },
};

// ============================================
// WORKFLOW STEPS API
// ============================================
export const workflowStepsApi = {
  // GET /api/workflow-steps/workflow/:workflowId
  porWorkflow: async (workflowId: number) => {
    const response = await fetch(`${API_BASE_URL}/workflow-steps/workflow/${workflowId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // GET /api/workflow-steps/:id
  obtener: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/workflow-steps/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // POST /api/workflow-steps
  crear: async (data: {
    workflowId: number;
    tipo: string;
    nombre: string;
    orden: number;
    config?: Record<string, unknown>;
    plantillaMensajeId?: number;
    apiConfigId?: number;
    condicion?: string;
    siguientePasoId?: number;
    siguientePasoSiId?: number;
    siguientePasoNoId?: number;
  }) => {
    const response = await fetch(`${API_BASE_URL}/workflow-steps`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // PUT /api/workflow-steps/:id
  actualizar: async (id: number, data: {
    tipo?: string;
    nombre?: string;
    orden?: number;
    config?: Record<string, unknown>;
    plantillaMensajeId?: number;
    apiConfigId?: number;
    condicion?: string;
    siguientePasoId?: number;
    siguientePasoSiId?: number;
    siguientePasoNoId?: number;
  }) => {
    const response = await fetch(`${API_BASE_URL}/workflow-steps/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // DELETE /api/workflow-steps/:id
  eliminar: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/workflow-steps/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // PATCH /api/workflow-steps/:id/mover
  mover: async (id: number, nuevoOrden: number) => {
    const response = await fetch(`${API_BASE_URL}/workflow-steps/${id}/mover?nuevoOrden=${nuevoOrden}`, {
      method: "PATCH",
      headers: getAuthHeadersSimple(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // POST /api/workflow-steps/reordenar
  reordenar: async (workflowId: number, ordenPasos: number[]) => {
    const response = await fetch(`${API_BASE_URL}/workflow-steps/reordenar`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ workflowId, ordenPasos }),
    });
    return handleResponse<Record<string, unknown>>(response);
  },
};

// ============================================
// PLANTILLAS MENSAJE API
// ============================================
export const plantillasMensajeApi = {
  // GET /api/plantillas-mensaje
  listar: async () => {
    const response = await fetch(`${API_BASE_URL}/plantillas-mensaje`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // GET /api/plantillas-mensaje/activas
  activas: async () => {
    const response = await fetch(`${API_BASE_URL}/plantillas-mensaje/activas`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // GET /api/plantillas-mensaje/:id
  obtener: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/plantillas-mensaje/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // POST /api/plantillas-mensaje
  crear: async (data: {
    nombre: string;
    contenido: string;
    tipo: string;
    descripcion?: string;
    variables?: string[];
  }) => {
    const response = await fetch(`${API_BASE_URL}/plantillas-mensaje`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // PUT /api/plantillas-mensaje/:id
  actualizar: async (id: number, data: {
    nombre?: string;
    contenido?: string;
    tipo?: string;
    descripcion?: string;
    variables?: string[];
  }) => {
    const response = await fetch(`${API_BASE_URL}/plantillas-mensaje/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // DELETE /api/plantillas-mensaje/:id
  eliminar: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/plantillas-mensaje/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // PATCH /api/plantillas-mensaje/:id/activar
  activar: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/plantillas-mensaje/${id}/activar`, {
      method: "PATCH",
      headers: getAuthHeadersSimple(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // PATCH /api/plantillas-mensaje/:id/desactivar
  desactivar: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/plantillas-mensaje/${id}/desactivar`, {
      method: "PATCH",
      headers: getAuthHeadersSimple(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // GET /api/plantillas-mensaje/tipo/:tipo
  porTipo: async (tipo: string) => {
    const response = await fetch(`${API_BASE_URL}/plantillas-mensaje/tipo/${encodeURIComponent(tipo)}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },
};

// ============================================
// REPORTES API
// ============================================
export const reportesApi = {
  // GET /api/reportes/generales
  generales: async () => {
    const response = await fetch(`${API_BASE_URL}/reportes/generales`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // GET /api/reportes/conversaciones-diario?fechaInicio=X&fechaFin=Y
  conversacionesDiario: async (fechaInicio: string, fechaFin: string) => {
    const response = await fetch(
      `${API_BASE_URL}/reportes/conversaciones-diario?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
      { headers: getAuthHeaders() }
    );
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // GET /api/reportes/actividad-empleados?fechaInicio=X&fechaFin=Y
  actividadEmpleados: async (fechaInicio: string, fechaFin: string) => {
    const response = await fetch(
      `${API_BASE_URL}/reportes/actividad-empleados?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
      { headers: getAuthHeaders() }
    );
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // GET /api/reportes/chatbot?fechaInicio=X&fechaFin=Y
  chatbot: async (fechaInicio: string, fechaFin: string) => {
    const response = await fetch(
      `${API_BASE_URL}/reportes/chatbot?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
      { headers: getAuthHeaders() }
    );
    return handleResponse<Record<string, unknown>>(response);
  },

  // GET /api/reportes/clientes-mensual?year=X
  clientesMensual: async (year: number) => {
    const response = await fetch(`${API_BASE_URL}/reportes/clientes-mensual?year=${year}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },

  // GET /api/reportes/workflows?fechaInicio=X&fechaFin=Y
  workflows: async (fechaInicio: string, fechaFin: string) => {
    const response = await fetch(
      `${API_BASE_URL}/reportes/workflows?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
      { headers: getAuthHeaders() }
    );
    return handleResponse<Record<string, unknown>>(response);
  },
};

// ============================================
// DASHBOARD API
// ============================================
export const dashboardApi = {
  // GET /api/dashboard/stats
  stats: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>>(response);
  },

  // GET /api/dashboard/workflows-activos
  workflowsActivos: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/workflows-activos`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Record<string, unknown>[]>(response);
  },
};

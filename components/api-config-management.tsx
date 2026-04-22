"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
  Search,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Download,
  Plug,
  Play,
  Loader2,
} from "lucide-react"
import { apiConfigsApi } from "@/lib/api-service"
import { useAuth } from "@/lib/auth-context"

interface ApiConfig {
  id: number
  empresaId: number
  empresaNombre: string
  nombre: string
  urlBase: string
  metodoHttp: string
  endpoint: string
  authType: string
  authValue?: string
  bodyTemplate: string
  params: string
  headers: string
  activo: boolean
  createdAt: string
  updatedAt: string
}

const HTTP_METHODS = [
  { value: "GET", label: "GET" },
  { value: "POST", label: "POST" },
  { value: "PUT", label: "PUT" },
  { value: "PATCH", label: "PATCH" },
  { value: "DELETE", label: "DELETE" },
]

const AUTH_TYPES = [
  { value: "NONE", label: "Sin autenticacion" },
  { value: "Bearer", label: "Bearer Token" },
  { value: "Basic", label: "Basic Auth" },
  { value: "API_KEY", label: "API Key" },
]

const ITEMS_PER_PAGE = 8

export function ApiConfigManagement() {
  const { employee } = useAuth()
  const [configs, setConfigs] = useState<ApiConfig[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<ApiConfig | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [testingId, setTestingId] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    nombre: "",
    urlBase: "",
    metodoHttp: "GET",
    endpoint: "",
    authType: "NONE",
    authValue: "",
    bodyTemplate: "",
    params: "",
    headers: "",
    activo: true,
  })

  const fetchConfigs = useCallback(async () => {
    if (!employee?.empresaId) return
    try {
      const data = await apiConfigsApi.porEmpresa(employee.empresaId)
      const mapped: ApiConfig[] = (data as Record<string, unknown>[]).map((c) => ({
        id: Number(c.id),
        empresaId: Number(c.empresaId ?? 0),
        empresaNombre: String(c.empresaNombre ?? ""),
        nombre: String(c.nombre ?? ""),
        urlBase: String(c.urlBase ?? ""),
        metodoHttp: String(c.metodoHttp ?? "GET"),
        endpoint: String(c.endpoint ?? ""),
        authType: String(c.authType ?? "NONE"),
        bodyTemplate: String(c.bodyTemplate ?? ""),
        params: String(c.params ?? ""),
        headers: String(c.headers ?? ""),
        activo: Boolean(c.activo),
        createdAt: String(c.createdAt ?? ""),
        updatedAt: String(c.updatedAt ?? ""),
      }))
      setConfigs(mapped)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cargar configuraciones")
    }
  }, [employee?.empresaId])

  useEffect(() => {
    fetchConfigs()
  }, [fetchConfigs])

  const filteredConfigs = configs.filter((config) => {
    const matchesSearch =
      config.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      config.urlBase.toLowerCase().includes(searchTerm.toLowerCase()) ||
      config.endpoint.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && config.activo) ||
      (statusFilter === "inactive" && !config.activo)
    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filteredConfigs.length / ITEMS_PER_PAGE)
  const paginatedConfigs = filteredConfigs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleOpenDialog = (config?: ApiConfig) => {
    if (config) {
      setEditingConfig(config)
      setFormData({
        nombre: config.nombre,
        urlBase: config.urlBase,
        metodoHttp: config.metodoHttp,
        endpoint: config.endpoint,
        authType: config.authType,
        authValue: config.authValue ?? "",
        bodyTemplate: config.bodyTemplate ?? "",
        params: config.params ?? "",
        headers: config.headers ?? "",
        activo: config.activo,
      })
    } else {
      setEditingConfig(null)
      setFormData({
        nombre: "",
        urlBase: "",
        metodoHttp: "GET",
        endpoint: "",
        authType: "NONE",
        authValue: "",
        bodyTemplate: "",
        params: "",
        headers: "",
        activo: true,
      })
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.nombre.trim()) {
      toast.error("El nombre es obligatorio")
      return
    }
    if (!formData.urlBase.trim()) {
      toast.error("La URL base es obligatoria")
      return
    }
    if (!formData.metodoHttp.trim()) {
      toast.error("El metodo HTTP es obligatorio")
      return
    }
    if (!formData.endpoint.trim()) {
      toast.error("El endpoint es obligatorio")
      return
    }
    if (!formData.authType.trim()) {
      toast.error("El tipo de autenticacion es obligatorio")
      return
    }

    setIsLoading(true)
    try {
      const payload = {
        nombre: formData.nombre,
        urlBase: formData.urlBase,
        metodoHttp: formData.metodoHttp,
        endpoint: formData.endpoint,
        authType: formData.authType,
        authValue: formData.authValue || undefined,
        bodyTemplate: formData.bodyTemplate || undefined,
        params: formData.params || undefined,
        headers: formData.headers || undefined,
        activo: formData.activo,
      }

      if (editingConfig) {
        await apiConfigsApi.actualizar(editingConfig.id, { ...payload, empresaId: employee?.empresaId })
        toast.success("Configuracion actualizada correctamente")
      } else {
        await apiConfigsApi.crear({ ...payload, empresaId: employee?.empresaId })
        toast.success("Configuracion creada correctamente")
      }
      setIsDialogOpen(false)
      fetchConfigs()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estas seguro de eliminar esta configuracion?")) return
    try {
      await apiConfigsApi.eliminar(id)
      toast.success("Configuracion eliminada correctamente")
      fetchConfigs()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar")
    }
  }

  const handleToggleStatus = async (config: ApiConfig) => {
    try {
      if (config.activo) {
        await apiConfigsApi.desactivar(config.id)
        toast.success("Configuracion desactivada")
      } else {
        await apiConfigsApi.activar(config.id)
        toast.success("Configuracion activada")
      }
      fetchConfigs()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cambiar estado")
    }
  }

  const handleTest = async (config: ApiConfig) => {
    setTestingId(config.id)
    try {
      await apiConfigsApi.probar(config.id)
      toast.success("Conexion exitosa con la API")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al probar conexion")
    } finally {
      setTestingId(null)
    }
  }

  const handleDownload = () => {
    const headers = ["ID", "Nombre", "URL Base", "Metodo HTTP", "Endpoint", "Auth Type", "Estado"]
    const rows = filteredConfigs.map((c) => [
      c.id,
      c.nombre,
      c.urlBase,
      c.metodoHttp,
      c.endpoint,
      c.authType,
      c.activo ? "Activo" : "Inactivo",
    ])
    const csvContent = [headers, ...rows].map((r) => r.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `api_configs_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getAuthTypeLabel = (type: string) => {
    return AUTH_TYPES.find((t) => t.value === type)?.label ?? type
  }

  const getHttpMethodLabel = (method: string) => {
    return HTTP_METHODS.find((m) => m.value === method)?.label ?? method
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total APIs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{configs.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              APIs Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {configs.filter((c) => c.activo).length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              APIs Inactivas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {configs.filter((c) => !c.activo).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Plug className="h-5 w-5" />
                APIs Externas
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Configura las integraciones con APIs externas para los workflows
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Button size="sm" onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva API
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o URL..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-9 bg-input border-border text-foreground"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-full md:w-[180px] bg-input border-border text-foreground">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 border-border hover:bg-muted/50">
                  <TableHead className="text-muted-foreground">Nombre</TableHead>
                  <TableHead className="text-muted-foreground hidden md:table-cell">
                    Endpoint
                  </TableHead>
                  <TableHead className="text-muted-foreground hidden lg:table-cell">
                    Metodo
                  </TableHead>
                  <TableHead className="text-muted-foreground hidden lg:table-cell">
                    Auth
                  </TableHead>
                  <TableHead className="text-muted-foreground">Estado</TableHead>
                  <TableHead className="text-muted-foreground text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedConfigs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No se encontraron configuraciones
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedConfigs.map((config) => (
                    <TableRow key={config.id} className="border-border hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Plug className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{config.nombre}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {config.urlBase}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <code className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                          {config.endpoint.length > 30
                            ? config.endpoint.substring(0, 30) + "..."
                            : config.endpoint}
                        </code>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="outline" className="text-xs font-mono">
                          {getHttpMethodLabel(config.metodoHttp)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="secondary" className="text-xs">
                          {getAuthTypeLabel(config.authType)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={config.activo ? "default" : "secondary"}
                          className={
                            config.activo
                              ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                              : "bg-muted text-muted-foreground"
                          }
                          onClick={() => handleToggleStatus(config)}
                          style={{ cursor: "pointer" }}
                        >
                          {config.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleTest(config)}
                            disabled={testingId === config.id}
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            title="Probar conexion"
                          >
                            {testingId === config.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(config)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(config.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{" "}
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredConfigs.length)} de{" "}
                {filteredConfigs.length}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editingConfig ? "Editar Configuracion" : "Nueva Configuracion API"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingConfig
                ? "Modifica los datos de la configuracion"
                : "Configura una nueva integracion con API externa"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label className="text-foreground text-sm">Nombre *</Label>
              <Input
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: API de Pagos"
                className="bg-input border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground text-sm">URL Base *</Label>
              <Input
                value={formData.urlBase}
                onChange={(e) => setFormData({ ...formData, urlBase: e.target.value })}
                placeholder="https://api.ejemplo.com"
                className="bg-input border-border text-foreground"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground text-sm">Metodo HTTP *</Label>
                <Select
                  value={formData.metodoHttp}
                  onValueChange={(v) => setFormData({ ...formData, metodoHttp: v })}
                >
                  <SelectTrigger className="bg-input border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {HTTP_METHODS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground text-sm">Endpoint *</Label>
                <Input
                  value={formData.endpoint}
                  onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                  placeholder="/v1/usuarios"
                  className="bg-input border-border text-foreground"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground text-sm">Tipo de Autenticacion *</Label>
                <Select
                  value={formData.authType}
                  onValueChange={(v) => setFormData({ ...formData, authType: v })}
                >
                  <SelectTrigger className="bg-input border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {AUTH_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground text-sm">Valor de Autenticacion</Label>
                <Input
                  value={formData.authValue}
                  onChange={(e) => setFormData({ ...formData, authValue: e.target.value })}
                  placeholder="Token o API Key"
                  className="bg-input border-border text-foreground"
                  type="password"
                />
              </div>
            </div>
            {(formData.metodoHttp === "POST" || formData.metodoHttp === "PUT" || formData.metodoHttp === "PATCH") && (
              <div className="space-y-2">
                <Label className="text-foreground text-sm">Body Template (JSON)</Label>
                <Textarea
                  value={formData.bodyTemplate}
                  onChange={(e) => setFormData({ ...formData, bodyTemplate: e.target.value })}
                  placeholder='{"cedula": "{{cedula}}", "tipo": "natural"}'
                  className="bg-input border-border text-foreground font-mono text-sm resize-none"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Plantilla del body. Usa {"{{variable}}"} para valores dinamicos del workflow
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-foreground text-sm">Query Params (JSON)</Label>
              <Textarea
                value={formData.params}
                onChange={(e) => setFormData({ ...formData, params: e.target.value })}
                placeholder='{"version": "2.0", "formato": "json"}'
                className="bg-input border-border text-foreground font-mono text-sm resize-none"
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                Parametros de query string en formato JSON
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground text-sm">Headers Adicionales (JSON)</Label>
              <Textarea
                value={formData.headers}
                onChange={(e) => setFormData({ ...formData, headers: e.target.value })}
                placeholder='{"X-Correlation-ID": "{{uuid}}", "Accept-Language": "es-EC"}'
                className="bg-input border-border text-foreground font-mono text-sm resize-none"
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                Headers personalizados adicionales en formato JSON
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="activo"
                checked={formData.activo}
                onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="activo" className="text-foreground text-sm cursor-pointer">
                Configuracion activa
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Guardando..." : editingConfig ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

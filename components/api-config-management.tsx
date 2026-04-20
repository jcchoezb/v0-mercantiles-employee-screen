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
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react"
import { apiConfigsApi } from "@/lib/api-service"

interface ApiConfig {
  id: number
  nombre: string
  descripcion: string
  baseUrl: string
  metodoAuth: string
  headers: Record<string, string>
  timeout: number
  activo: boolean
  fechaRegistro: string
}

const AUTH_METHODS = [
  { value: "none", label: "Sin autenticacion" },
  { value: "bearer", label: "Bearer Token" },
  { value: "basic", label: "Basic Auth" },
  { value: "api_key", label: "API Key" },
  { value: "oauth2", label: "OAuth 2.0" },
]

const ITEMS_PER_PAGE = 8

export function ApiConfigManagement() {
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
    descripcion: "",
    baseUrl: "",
    metodoAuth: "none",
    headersJson: "{}",
    timeout: 30000,
  })

  const fetchConfigs = useCallback(async () => {
    try {
      const data = await apiConfigsApi.listar()
      const mapped: ApiConfig[] = (data as Record<string, unknown>[]).map((c) => ({
        id: Number(c.id),
        nombre: String(c.nombre ?? ""),
        descripcion: String(c.descripcion ?? ""),
        baseUrl: String(c.baseUrl ?? ""),
        metodoAuth: String(c.metodoAuth ?? "none"),
        headers: (c.headers as Record<string, string>) ?? {},
        timeout: Number(c.timeout ?? 30000),
        activo: Boolean(c.activo),
        fechaRegistro: String(c.fechaRegistro ?? ""),
      }))
      setConfigs(mapped)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cargar configuraciones")
    }
  }, [])

  useEffect(() => {
    fetchConfigs()
  }, [fetchConfigs])

  const filteredConfigs = configs.filter((config) => {
    const matchesSearch =
      config.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      config.baseUrl.toLowerCase().includes(searchTerm.toLowerCase())
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
        descripcion: config.descripcion,
        baseUrl: config.baseUrl,
        metodoAuth: config.metodoAuth,
        headersJson: JSON.stringify(config.headers, null, 2),
        timeout: config.timeout,
      })
    } else {
      setEditingConfig(null)
      setFormData({
        nombre: "",
        descripcion: "",
        baseUrl: "",
        metodoAuth: "none",
        headersJson: "{}",
        timeout: 30000,
      })
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.nombre.trim()) {
      toast.error("El nombre es obligatorio")
      return
    }
    if (!formData.baseUrl.trim()) {
      toast.error("La URL base es obligatoria")
      return
    }

    let headers: Record<string, string> = {}
    try {
      headers = JSON.parse(formData.headersJson)
    } catch {
      toast.error("Los headers deben ser un JSON valido")
      return
    }

    setIsLoading(true)
    try {
      const payload = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        baseUrl: formData.baseUrl,
        metodoAuth: formData.metodoAuth,
        headers,
        timeout: formData.timeout,
      }

      if (editingConfig) {
        await apiConfigsApi.actualizar(editingConfig.id, payload)
        toast.success("Configuracion actualizada correctamente")
      } else {
        await apiConfigsApi.crear(payload)
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
    const headers = ["ID", "Nombre", "URL Base", "Metodo Auth", "Timeout", "Estado"]
    const rows = filteredConfigs.map((c) => [
      c.id,
      c.nombre,
      c.baseUrl,
      c.metodoAuth,
      c.timeout,
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

  const getAuthMethodLabel = (method: string) => {
    return AUTH_METHODS.find((m) => m.value === method)?.label ?? method
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
                    URL Base
                  </TableHead>
                  <TableHead className="text-muted-foreground hidden lg:table-cell">
                    Autenticacion
                  </TableHead>
                  <TableHead className="text-muted-foreground">Estado</TableHead>
                  <TableHead className="text-muted-foreground text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedConfigs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
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
                              {config.descripcion || "Sin descripcion"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <code className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                          {config.baseUrl.length > 40
                            ? config.baseUrl.substring(0, 40) + "..."
                            : config.baseUrl}
                        </code>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="outline" className="text-xs">
                          {getAuthMethodLabel(config.metodoAuth)}
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
              <Label className="text-foreground text-sm">Descripcion</Label>
              <Textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripcion de la API"
                className="bg-input border-border text-foreground resize-none"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground text-sm">URL Base *</Label>
              <Input
                value={formData.baseUrl}
                onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                placeholder="https://api.ejemplo.com/v1"
                className="bg-input border-border text-foreground"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground text-sm">Metodo de Autenticacion</Label>
                <Select
                  value={formData.metodoAuth}
                  onValueChange={(v) => setFormData({ ...formData, metodoAuth: v })}
                >
                  <SelectTrigger className="bg-input border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {AUTH_METHODS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground text-sm">Timeout (ms)</Label>
                <Input
                  type="number"
                  value={formData.timeout}
                  onChange={(e) =>
                    setFormData({ ...formData, timeout: Number(e.target.value) })
                  }
                  min={1000}
                  max={120000}
                  className="bg-input border-border text-foreground"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground text-sm">Headers (JSON)</Label>
              <Textarea
                value={formData.headersJson}
                onChange={(e) => setFormData({ ...formData, headersJson: e.target.value })}
                placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                className="bg-input border-border text-foreground font-mono text-sm resize-none"
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Ingresa los headers como un objeto JSON valido
              </p>
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

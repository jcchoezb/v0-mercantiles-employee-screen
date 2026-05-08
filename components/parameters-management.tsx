"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { parametrosApi } from "@/lib/api-service"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  SlidersHorizontal,
  Settings2,
  Code,
  Eye,
  EyeOff,
  Power,
  PowerOff,
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
} from "lucide-react"

interface Parametro {
  id: number
  codigo: string
  nombre: string
  valor: string
  descripcion: string
  ambiente: string
  modulo: string
  esEncriptado: boolean
  esEditable: boolean
  estado: string
  fechaCreacion: string
  usuarioCreacion: string
  fechaModificacion: string
  usuarioModificacion: string | null
}

const AMBIENTES = ["DEV", "QA", "STAGING", "PROD"]
const MODULOS = ["WHATSAPP", "EMAIL", "SMS", "SISTEMA", "INTEGRACIONES", "SEGURIDAD"]

export function ParametersManagement() {
  const { employee } = useAuth()
  const [parametros, setParametros] = useState<Parametro[]>([])
  const [filteredParametros, setFilteredParametros] = useState<Parametro[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterModulo, setFilterModulo] = useState<string>("all")
  const [filterAmbiente, setFilterAmbiente] = useState<string>("all")
  const [filterEstado, setFilterEstado] = useState<string>("all")
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  
  // Dialogs
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingParametro, setEditingParametro] = useState<Parametro | null>(null)
  const [deletingParametro, setDeletingParametro] = useState<Parametro | null>(null)
  const [showValores, setShowValores] = useState<Set<number>>(new Set())
  
  // Form state
  const [formData, setFormData] = useState({
    codigo: "",
    nombre: "",
    valor: "",
    descripcion: "",
    ambiente: "DEV",
    modulo: "SISTEMA",
    esEncriptado: false,
  })
  const [isSaving, setIsSaving] = useState(false)

  const fetchParametros = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await parametrosApi.listar()
      const mapped: Parametro[] = (data as Record<string, unknown>[]).map((p) => ({
        id: Number(p.id),
        codigo: String(p.codigo ?? ""),
        nombre: String(p.nombre ?? ""),
        valor: String(p.valor ?? ""),
        descripcion: String(p.descripcion ?? ""),
        ambiente: String(p.ambiente ?? ""),
        modulo: String(p.modulo ?? ""),
        esEncriptado: Boolean(p.esEncriptado),
        esEditable: Boolean(p.esEditable),
        estado: String(p.estado ?? ""),
        fechaCreacion: String(p.fechaCreacion ?? ""),
        usuarioCreacion: String(p.usuarioCreacion ?? ""),
        fechaModificacion: String(p.fechaModificacion ?? ""),
        usuarioModificacion: p.usuarioModificacion ? String(p.usuarioModificacion) : null,
      }))
      setParametros(mapped)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cargar parámetros")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchParametros()
  }, [fetchParametros])

  // Filter logic
  useEffect(() => {
    let filtered = [...parametros]
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.codigo.toLowerCase().includes(term) ||
          p.nombre.toLowerCase().includes(term) ||
          p.descripcion.toLowerCase().includes(term)
      )
    }
    
    if (filterModulo !== "all") {
      filtered = filtered.filter((p) => p.modulo === filterModulo)
    }
    
    if (filterAmbiente !== "all") {
      filtered = filtered.filter((p) => p.ambiente === filterAmbiente)
    }
    
    if (filterEstado !== "all") {
      filtered = filtered.filter((p) => p.estado === filterEstado)
    }
    
    setFilteredParametros(filtered)
    setCurrentPage(1)
  }, [parametros, searchTerm, filterModulo, filterAmbiente, filterEstado])

  // Pagination
  const totalPages = Math.ceil(filteredParametros.length / itemsPerPage)
  const paginatedParametros = filteredParametros.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleOpenDialog = (parametro?: Parametro) => {
    if (parametro) {
      setEditingParametro(parametro)
      setFormData({
        codigo: parametro.codigo,
        nombre: parametro.nombre,
        valor: parametro.valor,
        descripcion: parametro.descripcion,
        ambiente: parametro.ambiente,
        modulo: parametro.modulo,
        esEncriptado: parametro.esEncriptado,
      })
    } else {
      setEditingParametro(null)
      setFormData({
        codigo: "",
        nombre: "",
        valor: "",
        descripcion: "",
        ambiente: "DEV",
        modulo: "SISTEMA",
        esEncriptado: false,
      })
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.codigo || !formData.nombre || !formData.valor) {
      toast.error("Codigo, nombre y valor son requeridos")
      return
    }

    try {
      setIsSaving(true)
      const payload = {
        ...formData,
        usuarioCreacion: employee?.role ?? "admin",
      }

      if (editingParametro) {
        await parametrosApi.actualizar(editingParametro.id, payload)
        toast.success("Parámetro actualizado correctamente")
      } else {
        await parametrosApi.crear(payload)
        toast.success("Parámetro creado correctamente")
      }

      setIsDialogOpen(false)
      fetchParametros()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar parámetro")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingParametro) return

    try {
      await parametrosApi.eliminar(deletingParametro.id)
      toast.success("Parámetro eliminado correctamente")
      setIsDeleteDialogOpen(false)
      setDeletingParametro(null)
      fetchParametros()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar parámetro")
    }
  }

  const handleToggleEstado = async (parametro: Parametro) => {
    try {
      const usuario = employee?.role ?? "admin"
      if (parametro.estado === "ACTIVO") {
        await parametrosApi.desactivar(parametro.id, usuario)
        toast.success("Parámetro desactivado")
      } else {
        await parametrosApi.activar(parametro.id, usuario)
        toast.success("Parámetro activado")
      }
      fetchParametros()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cambiar estado")
    }
  }

  const toggleShowValor = (id: number) => {
    setShowValores((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-"
    try {
      return new Date(dateStr).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return dateStr
    }
  }

  const getEstadoBadge = (estado: string) => {
    if (estado === "ACTIVO") {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Activo</Badge>
    }
    return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Inactivo</Badge>
  }

  const getAmbienteBadge = (ambiente: string) => {
    const colors: Record<string, string> = {
      DEV: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      QA: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      STAGING: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      PROD: "bg-red-500/20 text-red-400 border-red-500/30",
    }
    return <Badge className={colors[ambiente] || "bg-muted text-muted-foreground"}>{ambiente}</Badge>
  }

  const getModuloBadge = (modulo: string) => {
    const colors: Record<string, string> = {
      WHATSAPP: "bg-green-500/20 text-green-400 border-green-500/30",
      EMAIL: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      SMS: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      SISTEMA: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      INTEGRACIONES: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      SEGURIDAD: "bg-red-500/20 text-red-400 border-red-500/30",
    }
    return <Badge className={colors[modulo] || "bg-muted text-muted-foreground"}>{modulo}</Badge>
  }

  // Stats
  const totalParametros = parametros.length
  const activos = parametros.filter((p) => p.estado === "ACTIVO").length
  const encriptados = parametros.filter((p) => p.esEncriptado).length
  const modulosUnicos = new Set(parametros.map((p) => p.modulo)).size

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-card-foreground">{totalParametros}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Power className="h-4 w-4 text-green-400" />
              Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-green-400">{activos}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Lock className="h-4 w-4 text-yellow-400" />
              Encriptados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-yellow-400">{encriptados}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-blue-400" />
              Modulos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-blue-400">{modulosUnicos}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por codigo, nombre o descripcion..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-input border-border text-foreground"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={fetchParametros}
                  className="border-border text-foreground hover:bg-secondary"
                >
                  <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                </Button>
                <Button
                  onClick={() => handleOpenDialog()}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Nuevo Parametro</span>
                  <span className="sm:hidden">Nuevo</span>
                </Button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Select value={filterModulo} onValueChange={setFilterModulo}>
                <SelectTrigger className="w-[140px] bg-input border-border text-foreground">
                  <SelectValue placeholder="Modulo" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">Todos los Modulos</SelectItem>
                  {MODULOS.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterAmbiente} onValueChange={setFilterAmbiente}>
                <SelectTrigger className="w-[140px] bg-input border-border text-foreground">
                  <SelectValue placeholder="Ambiente" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">Todos los Ambientes</SelectItem>
                  {AMBIENTES.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterEstado} onValueChange={setFilterEstado}>
                <SelectTrigger className="w-[130px] bg-input border-border text-foreground">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ACTIVO">Activos</SelectItem>
                  <SelectItem value="INACTIVO">Inactivos</SelectItem>
                </SelectContent>
              </Select>
              
              {(filterModulo !== "all" || filterAmbiente !== "all" || filterEstado !== "all" || searchTerm) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("")
                    setFilterModulo("all")
                    setFilterAmbiente("all")
                    setFilterEstado("all")
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table - Desktop */}
      <Card className="bg-card border-border hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Codigo</TableHead>
                <TableHead className="text-muted-foreground">Nombre</TableHead>
                <TableHead className="text-muted-foreground">Valor</TableHead>
                <TableHead className="text-muted-foreground">Modulo</TableHead>
                <TableHead className="text-muted-foreground">Ambiente</TableHead>
                <TableHead className="text-muted-foreground">Estado</TableHead>
                <TableHead className="text-muted-foreground">Encriptado</TableHead>
                <TableHead className="text-muted-foreground text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Cargando parámetros...
                  </TableCell>
                </TableRow>
              ) : paginatedParametros.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No se encontraron parámetros
                  </TableCell>
                </TableRow>
              ) : (
                paginatedParametros.map((parametro) => (
                  <TableRow key={parametro.id} className="border-border hover:bg-secondary/50">
                    <TableCell className="font-mono text-sm text-card-foreground">
                      <div className="flex items-center gap-2">
                        <Code className="h-4 w-4 text-muted-foreground" />
                        {parametro.codigo}
                      </div>
                    </TableCell>
                    <TableCell className="text-card-foreground">
                      <div>
                        <div className="font-medium">{parametro.nombre}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {parametro.descripcion}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      <div className="flex items-center gap-2">
                        {parametro.esEncriptado ? (
                          showValores.has(parametro.id) ? (
                            <span className="text-card-foreground truncate max-w-[150px]">{parametro.valor}</span>
                          ) : (
                            <span className="text-muted-foreground">********</span>
                          )
                        ) : (
                          <span className="text-card-foreground truncate max-w-[150px]">{parametro.valor}</span>
                        )}
                        {parametro.esEncriptado && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => toggleShowValor(parametro.id)}
                          >
                            {showValores.has(parametro.id) ? (
                              <EyeOff className="h-3 w-3" />
                            ) : (
                              <Eye className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getModuloBadge(parametro.modulo)}</TableCell>
                    <TableCell>{getAmbienteBadge(parametro.ambiente)}</TableCell>
                    <TableCell>{getEstadoBadge(parametro.estado)}</TableCell>
                    <TableCell>
                      {parametro.esEncriptado ? (
                        <Lock className="h-4 w-4 text-yellow-400" />
                      ) : (
                        <Unlock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleEstado(parametro)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title={parametro.estado === "ACTIVO" ? "Desactivar" : "Activar"}
                        >
                          {parametro.estado === "ACTIVO" ? (
                            <PowerOff className="h-4 w-4" />
                          ) : (
                            <Power className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(parametro)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setDeletingParametro(parametro)
                            setIsDeleteDialogOpen(true)
                          }}
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
        </CardContent>
      </Card>

      {/* Cards - Mobile */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <Card className="bg-card border-border p-8">
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <RefreshCw className="h-6 w-6 animate-spin mb-2" />
              Cargando parámetros...
            </div>
          </Card>
        ) : paginatedParametros.length === 0 ? (
          <Card className="bg-card border-border p-8">
            <div className="text-center text-muted-foreground">
              No se encontraron parámetros
            </div>
          </Card>
        ) : (
          paginatedParametros.map((parametro) => (
            <Card key={parametro.id} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Code className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono text-sm font-medium text-card-foreground">
                        {parametro.codigo}
                      </span>
                    </div>
                    <div className="text-sm text-card-foreground">{parametro.nombre}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleEstado(parametro)}
                      className="h-8 w-8"
                    >
                      {parametro.estado === "ACTIVO" ? (
                        <PowerOff className="h-4 w-4" />
                      ) : (
                        <Power className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(parametro)}
                      className="h-8 w-8"
                      title="Editar"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setDeletingParametro(parametro)
                        setIsDeleteDialogOpen(true)
                      }}
                      className="h-8 w-8 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground mb-3">{parametro.descripcion}</div>
                
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-muted-foreground">Valor:</span>
                  <span className="font-mono text-xs text-card-foreground">
                    {parametro.esEncriptado && !showValores.has(parametro.id) ? "********" : parametro.valor}
                  </span>
                  {parametro.esEncriptado && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => toggleShowValor(parametro.id)}
                    >
                      {showValores.has(parametro.id) ? (
                        <EyeOff className="h-3 w-3" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {getModuloBadge(parametro.modulo)}
                  {getAmbienteBadge(parametro.ambiente)}
                  {getEstadoBadge(parametro.estado)}
                  {parametro.esEncriptado && (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                      <Lock className="h-3 w-3 mr-1" />
                      Encriptado
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredParametros.length)} de {filteredParametros.length}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="border-border"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="border-border"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">
              {editingParametro ? "Editar Parametro" : "Nuevo Parametro"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingParametro
                ? "Modifica los datos del parámetro"
                : "Completa los datos para crear un nuevo parámetro"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-card-foreground">Codigo *</label>
                <Input
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                  placeholder="ACCESS_TOKEN"
                  className="bg-input border-border text-foreground font-mono"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-card-foreground">Nombre *</label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Token de acceso"
                  className="bg-input border-border text-foreground"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-card-foreground">Valor *</label>
              <Textarea
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                placeholder="Ingresa el valor del parámetro"
                className="bg-input border-border text-foreground font-mono min-h-[80px] break-all whitespace-pre-wrap resize-y"
                style={{ wordBreak: "break-all", overflowWrap: "anywhere" }}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-card-foreground">Descripcion</label>
              <Textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción del parámetro"
                className="bg-input border-border text-foreground min-h-[60px]"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-card-foreground">Modulo</label>
                <Select
                  value={formData.modulo}
                  onValueChange={(v) => setFormData({ ...formData, modulo: v })}
                >
                  <SelectTrigger className="bg-input border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {MODULOS.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-card-foreground">Ambiente</label>
                <Select
                  value={formData.ambiente}
                  onValueChange={(v) => setFormData({ ...formData, ambiente: v })}
                >
                  <SelectTrigger className="bg-input border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {AMBIENTES.map((a) => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <button
                type="button"
                role="switch"
                aria-checked={formData.esEncriptado}
                onClick={() => setFormData({ ...formData, esEncriptado: !formData.esEncriptado })}
                className={cn(
                  "relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
                  formData.esEncriptado ? "bg-primary" : "bg-muted"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    formData.esEncriptado ? "translate-x-4" : "translate-x-0"
                  )}
                />
              </button>
              <span className="text-sm text-card-foreground">Valor encriptado</span>
            </label>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="border-border text-foreground"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-primary text-primary-foreground"
            >
              {isSaving ? "Guardando..." : editingParametro ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-card-foreground">Eliminar Parametro</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              ¿Estás seguro de que deseas eliminar el parámetro{" "}
              <span className="font-mono font-medium text-card-foreground">{deletingParametro?.codigo}</span>?
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-foreground">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

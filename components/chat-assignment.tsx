"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { toast } from "sonner"
import { conversacionesApi, empleadosApi } from "@/lib/api-service"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Search,
  MessageSquare,
  UserPlus,
  Clock,
  ChevronLeft,
  ChevronRight,
  Download,
  User,
  Mail,
  Phone,
  Hash,
  Calendar,
  UserCheck,
  X,
  Edit,
} from "lucide-react"

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
  ].join("\n")
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${filename}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

interface Conversacion {
  id: number
  clienteId: number
  clienteNombre: string
  clienteEmail: string
  empleadoId: number | null
  empleadoNombre: string | null
  estado: string
  prioridad: string
  tema: string
  origen: string
  canal: string
  mensajesNoLeidos: number
  modoAtencion: string
  createdAt: string
  updatedAt: string
}

interface Empleado {
  id: number
  nombre: string
  email: string
  telefono: string
  rol: string
  activo: boolean
}

type TabType = "pendientes" | "asignados"

export function ChatAssignment() {
  const { employee } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>("pendientes")
  const [conversacionesPendientes, setConversacionesPendientes] = useState<Conversacion[]>([])
  const [conversacionesAsignadas, setConversacionesAsignadas] = useState<Conversacion[]>([])
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedConversacion, setSelectedConversacion] = useState<Conversacion | null>(null)
  const [selectedEmpleadoId, setSelectedEmpleadoId] = useState<string>("")
  const [motivoAsignacion, setMotivoAsignacion] = useState<string>("")
  const [isAssigning, setIsAssigning] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  
  // Date filters
  const [fechaDesde, setFechaDesde] = useState<string>("")
  const [fechaHasta, setFechaHasta] = useState<string>("")
  
  const itemsPerPage = 8

  const mapConversacion = (c: Record<string, unknown>): Conversacion => ({
    id: Number(c.id ?? 0),
    clienteId: Number(c.clienteId ?? 0),
    clienteNombre: String(c.clienteNombre ?? ""),
    clienteEmail: String(c.clienteEmail ?? ""),
    empleadoId: c.empleadoId ? Number(c.empleadoId) : null,
    empleadoNombre: c.empleadoNombre ? String(c.empleadoNombre) : null,
    estado: String(c.estado ?? ""),
    prioridad: String(c.prioridad ?? "normal"),
    tema: String(c.tema ?? ""),
    origen: String(c.origen ?? ""),
    canal: String(c.canal ?? ""),
    mensajesNoLeidos: Number(c.mensajesNoLeidos ?? 0),
    modoAtencion: String(c.modoAtencion ?? ""),
    createdAt: String(c.createdAt ?? ""),
    updatedAt: String(c.updatedAt ?? ""),
  })

  const fetchConversacionesPendientes = useCallback(async () => {
    if (!employee?.empresaId) return
    try {
      setIsLoading(true)
      const data = await conversacionesApi.pendientes(Number(employee.empresaId))
      const mapped = (data as Record<string, unknown>[]).map(mapConversacion)
      setConversacionesPendientes(mapped)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cargar conversaciones pendientes")
    } finally {
      setIsLoading(false)
    }
  }, [employee?.empresaId])

  const fetchConversacionesAsignadas = useCallback(async () => {
    if (!employee?.empresaId) return
    try {
      setIsLoading(true)
      const data = await conversacionesApi.asignados(Number(employee.empresaId))
      const mapped = (data as Record<string, unknown>[]).map(mapConversacion)
      setConversacionesAsignadas(mapped)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cargar conversaciones asignadas")
    } finally {
      setIsLoading(false)
    }
  }, [employee?.empresaId])

  const fetchEmpleados = useCallback(async () => {
    if (!employee?.empresaId) return
    try {
      const data = await empleadosApi.porEmpresa(Number(employee.empresaId))
      const mapped: Empleado[] = (data as Record<string, unknown>[])
        .filter((e) => Boolean(e.activo))
        .map((e) => ({
          id: Number(e.id ?? 0),
          nombre: String(e.nombre ?? ""),
          email: String(e.email ?? ""),
          telefono: String(e.telefono ?? ""),
          rol: String((e.rol as Record<string, unknown>)?.nombre ?? e.rolNombre ?? ""),
          activo: Boolean(e.activo),
        }))
      setEmpleados(mapped)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cargar empleados")
    }
  }, [employee?.empresaId])

  useEffect(() => {
    fetchConversacionesPendientes()
    fetchConversacionesAsignadas()
    fetchEmpleados()
  }, [fetchConversacionesPendientes, fetchConversacionesAsignadas, fetchEmpleados])

  const conversaciones = activeTab === "pendientes" ? conversacionesPendientes : conversacionesAsignadas

  const filteredConversaciones = useMemo(() => {
    return conversaciones.filter((conv) => {
      // Search filter
      const matchesSearch =
        conv.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.clienteEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.tema.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (conv.empleadoNombre?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
      
      if (!matchesSearch) return false

      // Date filters
      if (fechaDesde || fechaHasta) {
        const convDate = new Date(conv.createdAt)
        if (fechaDesde) {
          const desde = new Date(fechaDesde)
          desde.setHours(0, 0, 0, 0)
          if (convDate < desde) return false
        }
        if (fechaHasta) {
          const hasta = new Date(fechaHasta)
          hasta.setHours(23, 59, 59, 999)
          if (convDate > hasta) return false
        }
      }

      return true
    })
  }, [conversaciones, searchTerm, fechaDesde, fechaHasta])

  const totalPages = Math.ceil(filteredConversaciones.length / itemsPerPage)
  const paginatedConversaciones = filteredConversaciones.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, activeTab, fechaDesde, fechaHasta])

  const stats = useMemo(() => ({
    totalPendientes: conversacionesPendientes.length,
    totalAsignadas: conversacionesAsignadas.length,
    whatsappPendientes: conversacionesPendientes.filter((c) => c.canal === "whatsapp").length,
    webPendientes: conversacionesPendientes.filter((c) => c.canal === "web").length,
  }), [conversacionesPendientes, conversacionesAsignadas])

  const handleDownload = () => {
    const headers = activeTab === "pendientes"
      ? ["ID", "Cliente", "Email", "Canal", "Tema", "Mensajes No Leidos", "Fecha Creacion"]
      : ["ID", "Cliente", "Email", "Canal", "Tema", "Asignado A", "Mensajes No Leidos", "Fecha Creacion", "Ultima Actualizacion"]
    
    const rows = filteredConversaciones.map((c) => 
      activeTab === "pendientes"
        ? [String(c.id), c.clienteNombre, c.clienteEmail, c.canal, c.tema, String(c.mensajesNoLeidos), c.createdAt]
        : [String(c.id), c.clienteNombre, c.clienteEmail, c.canal, c.tema, c.empleadoNombre || "-", String(c.mensajesNoLeidos), c.createdAt, c.updatedAt]
    )
    downloadCSV(activeTab === "pendientes" ? "chats-pendientes" : "chats-asignados", headers, rows)
  }

  const handleOpenAssignDialog = (conv: Conversacion, editMode: boolean = false) => {
    setSelectedConversacion(conv)
    setSelectedEmpleadoId(editMode && conv.empleadoId ? String(conv.empleadoId) : "")
    setMotivoAsignacion("")
    setIsEditMode(editMode)
    setIsDialogOpen(true)
  }

  const handleAssign = async () => {
    if (!selectedConversacion || !selectedEmpleadoId) return
    try {
      setIsAssigning(true)
      await conversacionesApi.asignar(selectedConversacion.id, Number(selectedEmpleadoId), motivoAsignacion || undefined)
      toast.success(isEditMode ? "Asignacion actualizada correctamente" : "Chat asignado correctamente")
      setIsDialogOpen(false)
      fetchConversacionesPendientes()
      fetchConversacionesAsignadas()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al asignar el chat")
    } finally {
      setIsAssigning(false)
    }
  }

  const clearFilters = () => {
    setSearchTerm("")
    setFechaDesde("")
    setFechaHasta("")
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-"
    const date = new Date(dateStr)
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getPriorityBadge = (prioridad: string) => {
    const colors: Record<string, string> = {
      alta: "bg-destructive/10 text-destructive border-destructive/20",
      normal: "bg-primary/10 text-primary border-primary/20",
      baja: "bg-muted text-muted-foreground border-border",
    }
    return colors[prioridad] || colors.normal
  }

  const getChannelBadge = (canal: string) => {
    const colors: Record<string, string> = {
      whatsapp: "bg-[#25D366]/10 text-[#25D366] border-[#25D366]/20",
      web: "bg-primary/10 text-primary border-primary/20",
    }
    return colors[canal] || "bg-muted text-muted-foreground border-border"
  }

  const hasActiveFilters = searchTerm || fechaDesde || fechaHasta

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10 flex-shrink-0">
                <Clock className="h-4 w-4 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pendientes</p>
                <p className="text-lg md:text-xl font-bold text-card-foreground">{stats.totalPendientes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                <UserCheck className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Asignados</p>
                <p className="text-lg md:text-xl font-bold text-card-foreground">{stats.totalAsignadas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#25D366]/10 flex-shrink-0">
                <Phone className="h-4 w-4 text-[#25D366]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">WhatsApp Pend.</p>
                <p className="text-lg md:text-xl font-bold text-card-foreground">{stats.whatsappPendientes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                <Hash className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Web Pend.</p>
                <p className="text-lg md:text-xl font-bold text-card-foreground">{stats.webPendientes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("pendientes")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "pendientes"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pendientes
            {stats.totalPendientes > 0 && (
              <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 text-xs">
                {stats.totalPendientes}
              </Badge>
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveTab("asignados")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "asignados"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Asignados
            {stats.totalAsignadas > 0 && (
              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                {stats.totalAsignadas}
              </Badge>
            )}
          </div>
        </button>
      </div>

      {/* Search, Filters and Actions */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3">
            {/* Search and Actions Row */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={activeTab === "pendientes" ? "Buscar por cliente, email o tema..." : "Buscar por cliente, email, tema o empleado..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-input border-border text-foreground"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleDownload}
                  className="h-9 w-9 border-border flex-shrink-0"
                  title="Descargar CSV"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    fetchConversacionesPendientes()
                    fetchConversacionesAsignadas()
                  }}
                  className="border-border text-foreground"
                >
                  Actualizar
                </Button>
              </div>
            </div>

            {/* Date Filters Row */}
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                <div className="flex-1 min-w-[140px]">
                  <label className="text-xs text-muted-foreground mb-1 block">Desde</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={fechaDesde}
                      onChange={(e) => setFechaDesde(e.target.value)}
                      className="pl-10 bg-input border-border text-foreground"
                    />
                  </div>
                </div>
                <div className="flex-1 min-w-[140px]">
                  <label className="text-xs text-muted-foreground mb-1 block">Hasta</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={fechaHasta}
                      onChange={(e) => setFechaHasta(e.target.value)}
                      className="pl-10 bg-input border-border text-foreground"
                    />
                  </div>
                </div>
              </div>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-muted-foreground hover:text-foreground h-9"
                >
                  <X className="h-4 w-4 mr-1" />
                  Limpiar filtros
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Mobile Cards */}
          <div className="block md:hidden divide-y divide-border">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Cargando...</div>
            ) : paginatedConversaciones.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {activeTab === "pendientes" 
                  ? "No hay chats pendientes de asignacion" 
                  : "No hay chats asignados"}
              </div>
            ) : (
              paginatedConversaciones.map((conv) => (
                <div key={conv.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                          {conv.clienteNombre.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-card-foreground truncate">{conv.clienteNombre}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{conv.clienteEmail}</span>
                        </div>
                      </div>
                    </div>
                    <Badge className={`text-xs flex-shrink-0 ${getChannelBadge(conv.canal)}`}>
                      {conv.canal}
                    </Badge>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground truncate">{conv.tema}</div>
                  {activeTab === "asignados" && conv.empleadoNombre && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-primary">
                      <User className="h-3 w-3" />
                      Asignado a: {conv.empleadoNombre}
                    </div>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2 items-center justify-between">
                    <div className="flex gap-2">
                      <Badge className={`text-xs ${getPriorityBadge(conv.prioridad)}`}>
                        {conv.prioridad}
                      </Badge>
                      {conv.mensajesNoLeidos > 0 && (
                        <Badge className="text-xs bg-destructive/10 text-destructive border-destructive/20">
                          {conv.mensajesNoLeidos} sin leer
                        </Badge>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleOpenAssignDialog(conv, activeTab === "asignados")}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {activeTab === "pendientes" ? (
                        <>
                          <UserPlus className="h-4 w-4 mr-1" />
                          Asignar
                        </>
                      ) : (
                        <>
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDate(conv.createdAt)}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Cliente</TableHead>
                  <TableHead className="text-muted-foreground">Tema</TableHead>
                  <TableHead className="text-muted-foreground">Canal</TableHead>
                  {activeTab === "asignados" && (
                    <TableHead className="text-muted-foreground">Asignado A</TableHead>
                  )}
                  <TableHead className="text-muted-foreground">Prioridad</TableHead>
                  <TableHead className="text-muted-foreground">Mensajes</TableHead>
                  <TableHead className="text-muted-foreground">Fecha Creacion</TableHead>
                  {activeTab === "asignados" && (
                    <TableHead className="text-muted-foreground">Actualizado</TableHead>
                  )}
                  <TableHead className="text-muted-foreground text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={activeTab === "asignados" ? 9 : 7} className="text-center py-8 text-muted-foreground">
                      Cargando...
                    </TableCell>
                  </TableRow>
                ) : paginatedConversaciones.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={activeTab === "asignados" ? 9 : 7} className="text-center py-8 text-muted-foreground">
                      {activeTab === "pendientes" 
                        ? "No hay chats pendientes de asignacion" 
                        : "No hay chats asignados"}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedConversaciones.map((conv) => (
                    <TableRow key={conv.id} className="border-border">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                              {conv.clienteNombre.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-card-foreground">{conv.clienteNombre}</p>
                            <p className="text-xs text-muted-foreground">{conv.clienteEmail}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-card-foreground max-w-[200px] truncate">
                        {conv.tema}
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${getChannelBadge(conv.canal)}`}>
                          {conv.canal}
                        </Badge>
                      </TableCell>
                      {activeTab === "asignados" && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-card-foreground">{conv.empleadoNombre || "-"}</span>
                          </div>
                        </TableCell>
                      )}
                      <TableCell>
                        <Badge className={`text-xs ${getPriorityBadge(conv.prioridad)}`}>
                          {conv.prioridad}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {conv.mensajesNoLeidos > 0 ? (
                          <Badge className="text-xs bg-destructive/10 text-destructive border-destructive/20">
                            {conv.mensajesNoLeidos}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(conv.createdAt)}
                      </TableCell>
                      {activeTab === "asignados" && (
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(conv.updatedAt)}
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleOpenAssignDialog(conv, activeTab === "asignados")}
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          {activeTab === "pendientes" ? (
                            <>
                              <UserPlus className="h-4 w-4 mr-1" />
                              Asignar
                            </>
                          ) : (
                            <>
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
                {Math.min(currentPage * itemsPerPage, filteredConversaciones.length)} de{" "}
                {filteredConversaciones.length}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8 border-border"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 border-border"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border text-card-foreground max-w-md">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">
              {isEditMode ? "Editar Asignacion" : "Asignar Chat"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {isEditMode 
                ? "Selecciona un nuevo empleado para reasignar este chat."
                : "Selecciona un empleado para asignar este chat."}
            </DialogDescription>
          </DialogHeader>
          {selectedConversacion && (
            <div className="py-4 space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {selectedConversacion.clienteNombre.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-card-foreground">
                      {selectedConversacion.clienteNombre}
                    </p>
                    <p className="text-xs text-muted-foreground">{selectedConversacion.tema}</p>
                  </div>
                </div>
                {isEditMode && selectedConversacion.empleadoNombre && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Actualmente asignado a: <span className="text-primary font-medium">{selectedConversacion.empleadoNombre}</span>
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-card-foreground">
                  {isEditMode ? "Reasignar a:" : "Asignar a:"}
                </label>
                <Select value={selectedEmpleadoId} onValueChange={setSelectedEmpleadoId}>
                  <SelectTrigger className="bg-input border-border text-foreground">
                    <SelectValue placeholder="Seleccionar empleado" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {empleados.map((emp) => (
                      <SelectItem key={emp.id} value={String(emp.id)}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{emp.nombre}</span>
                          <span className="text-muted-foreground">({emp.rol})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-card-foreground">
                  Motivo (opcional):
                </label>
                <Input
                  value={motivoAsignacion}
                  onChange={(e) => setMotivoAsignacion(e.target.value)}
                  placeholder="Ej: Se requiere respuesta humana"
                  className="bg-input border-border text-foreground"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="border-border text-foreground"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedEmpleadoId || isAssigning}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isAssigning ? (isEditMode ? "Actualizando..." : "Asignando...") : (isEditMode ? "Actualizar" : "Asignar")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

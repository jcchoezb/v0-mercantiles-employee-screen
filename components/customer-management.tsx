"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { clientesApi, conversacionesApi } from "@/lib/api-service"
import { useAuth } from "@/lib/auth-context"
import type { Customer } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Mail,
  Phone,
  Calendar,
  Users,
  UserCheck,
  UserX,
  Clock,
  ChevronLeft,
  ChevronRight,
  Download,
  MessageSquare,
  Loader2,
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

function mapEstado(estado: string): Customer["status"] {
  const e = estado?.toLowerCase()
  if (e === "activo" || e === "active") return "active"
  if (e === "pendiente" || e === "pending") return "pending"
  return "inactive"
}

interface CustomerManagementProps {
  onNavigateToChat?: (conversationId: string) => void
}

export function CustomerManagement({ onNavigateToChat }: CustomerManagementProps) {
  const { employee } = useAuth()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [creatingChatFor, setCreatingChatFor] = useState<string | null>(null)
  const itemsPerPage = 8
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    source: "",
    status: "active" as Customer["status"],
  })

  const fetchCustomers = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await clientesApi.listar()
      const mapped: Customer[] = (data as Record<string, unknown>[]).map((c) => ({
        id: String(c.id ?? ""),
        name: String(c.nombre ?? ""),
        email: String(c.email ?? ""),
        phone: String(c.telefono ?? ""),
        source: String(c.fuente ?? ""),
        createdAt: String(c.fechaCreacion ?? c.createdAt ?? new Date().toISOString()),
        status: mapEstado(String(c.estado ?? "activo")),
      }))
      setCustomers(mapped)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cargar clientes")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || customer.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage)
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

  const stats = {
    total: customers.length,
    active: customers.filter((c) => c.status === "active").length,
    pending: customers.filter((c) => c.status === "pending").length,
    inactive: customers.filter((c) => c.status === "inactive").length,
  }

  const handleDownload = () => {
    const headers = ["Nombre", "Email", "Telefono", "Fuente", "Fecha", "Estado"]
    const rows = filteredCustomers.map((c) => [
      c.name,
      c.email,
      c.phone,
      c.source,
      new Date(c.createdAt).toLocaleDateString("es-MX"),
      c.status === "active" ? "Activo" : c.status === "pending" ? "Pendiente" : "Inactivo",
    ])
    downloadCSV("clientes", headers, rows)
  }

  const handleOpenDialog = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer)
      setFormData({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        source: customer.source,
        status: customer.status,
      })
    } else {
      setEditingCustomer(null)
      setFormData({
        name: "",
        email: "",
        phone: "",
        source: "",
        status: "active",
      })
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      if (editingCustomer) {
        await clientesApi.actualizar(Number(editingCustomer.id), {
          nombre: formData.name,
          email: formData.email,
          telefono: formData.phone,
          fuente: formData.source,
          estado: formData.status === "active" ? "activo" : formData.status === "pending" ? "pendiente" : "inactivo",
        })
      } else {
        await clientesApi.crear({
          nombre: formData.name,
          email: formData.email,
          telefono: formData.phone,
          fuente: formData.source,
          estado: formData.status === "active" ? "activo" : formData.status === "pending" ? "pendiente" : "inactivo",
        })
      }
      setIsDialogOpen(false)
      toast.success(editingCustomer ? "Cliente actualizado correctamente" : "Cliente creado correctamente")
      fetchCustomers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar cliente")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await clientesApi.eliminar(Number(id))
      toast.success("Cliente eliminado correctamente")
      fetchCustomers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar cliente")
    }
  }

  const handleStartChat = async (customer: Customer) => {
    if (!employee) return
    setCreatingChatFor(customer.id)
    try {
      // 1. Verificar si ya tiene conversacion activa
      const existing = await conversacionesApi.porCliente(Number(customer.id))
      const activeConv = (existing as Record<string, unknown>[]).find(
        (c) =>
          c.estado === "activa" ||
          c.estado === "en_atencion" ||
          c.estado === "pendiente" ||
          c.estado === "nueva" ||
          c.estado === "active"
      )

      if (activeConv) {
        toast.success(`${customer.name} ya tiene una conversacion activa. Redirigiendo...`)
        if (onNavigateToChat) onNavigateToChat(String(activeConv.id))
        return
      }

      // 2. Crear nueva conversacion
      const newConv = await conversacionesApi.crear({
        clienteId: Number(customer.id),
        empleadoId: Number(employee.id),
        tema: `Conversacion con ${customer.name}`,
        origen: "web",
        canal: "web",
        mensajeInicial: "Hola, gracias por contactarnos. ¿En qué podemos ayudarte?",
      })

      // 3. Asignar al empleado actual
      if (newConv && newConv.id) {
        await conversacionesApi.asignar(Number(newConv.id), {
          empleadoId: Number(employee.id),
          motivo: "Asignacion directa desde gestion de clientes",
        })
      }

      toast.success(`Chat creado para ${customer.name}. Redirigiendo...`)
      if (onNavigateToChat) onNavigateToChat(String(newConv?.id ?? ""))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al iniciar chat")
    } finally {
      setCreatingChatFor(null)
    }
  }

  const getStatusBadge = (status: Customer["status"]) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
            <UserCheck className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">Activo</span>
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-warning/20 text-warning border-warning/30 text-xs">
            <Clock className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">Pendiente</span>
          </Badge>
        )
      case "inactive":
        return (
          <Badge className="bg-muted text-muted-foreground border-border text-xs">
            <UserX className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">Inactivo</span>
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="p-2 md:p-3 rounded-lg bg-secondary">
                <Users className="h-4 w-4 md:h-5 md:w-5 text-foreground" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Total</p>
                <p className="text-lg md:text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="p-2 md:p-3 rounded-lg bg-primary/20">
                <UserCheck className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Activos</p>
                <p className="text-lg md:text-2xl font-bold text-foreground">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="p-2 md:p-3 rounded-lg bg-warning/20">
                <Clock className="h-4 w-4 md:h-5 md:w-5 text-warning" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Pendientes</p>
                <p className="text-lg md:text-2xl font-bold text-foreground">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="p-2 md:p-3 rounded-lg bg-muted">
                <UserX className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Inactivos</p>
                <p className="text-lg md:text-2xl font-bold text-foreground">{stats.inactive}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="bg-card border-border">
        <CardHeader className="border-b border-border p-4 md:p-6">
          <div className="flex flex-col gap-4">
            <CardTitle className="text-foreground text-base md:text-lg">Gestión de Clientes</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full bg-input border-border text-foreground placeholder:text-muted-foreground text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-32 bg-input border-border text-foreground text-sm">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Activos</SelectItem>
                    <SelectItem value="pending">Pendientes</SelectItem>
                    <SelectItem value="inactive">Inactivos</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleDownload}
                  className="h-9 w-9 border-border"
                  title="Descargar CSV"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => handleOpenDialog()}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
                    >
                      <Plus className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Nuevo</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border max-w-[95vw] sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-foreground">
                        {editingCustomer ? "Editar Cliente" : "Nuevo Cliente"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label className="text-foreground text-sm">Nombre</Label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="bg-input border-border text-foreground text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground text-sm">Email</Label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="bg-input border-border text-foreground text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground text-sm">Teléfono</Label>
                        <Input
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="bg-input border-border text-foreground text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground text-sm">Fuente</Label>
                        <Input
                          value={formData.source}
                          onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                          className="bg-input border-border text-foreground text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground text-sm">Estado</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(value: Customer["status"]) =>
                            setFormData({ ...formData, status: value })
                          }
                        >
                          <SelectTrigger className="bg-input border-border text-foreground text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            <SelectItem value="active">Activo</SelectItem>
                            <SelectItem value="pending">Pendiente</SelectItem>
                            <SelectItem value="inactive">Inactivo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        onClick={handleSave}
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        {editingCustomer ? "Guardar Cambios" : "Crear Cliente"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile Cards View */}
          <div className="block md:hidden divide-y divide-border">
            {paginatedCustomers.map((customer) => (
              <div key={customer.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-foreground text-sm">{customer.name}</div>
                  {getStatusBadge(customer.status)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3 flex-shrink-0" />
                    {customer.phone}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 flex-shrink-0" />
                    {new Date(customer.createdAt).toLocaleDateString("es-MX")}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground">{customer.source}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleStartChat(customer)}
                      disabled={creatingChatFor === customer.id}
                      className="h-8 w-8 text-primary hover:bg-primary/10"
                      title="Ir al chat"
                    >
                      {creatingChatFor === customer.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MessageSquare className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(customer)}
                      className="h-8 w-8 text-foreground hover:bg-secondary"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(customer.id)}
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground text-xs">Cliente</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Contacto</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Fuente</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Fecha</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Estado</TableHead>
                  <TableHead className="text-muted-foreground text-xs text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCustomers.map((customer) => (
                  <TableRow key={customer.id} className="border-border hover:bg-secondary/50">
                    <TableCell>
                      <div className="font-medium text-foreground text-sm">{customer.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {customer.email}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {customer.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground text-sm">{customer.source}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(customer.createdAt).toLocaleDateString("es-MX")}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(customer.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleStartChat(customer)}
                          disabled={creatingChatFor === customer.id}
                          className="h-8 w-8 text-primary hover:bg-primary/10"
                          title="Ir al chat"
                        >
                          {creatingChatFor === customer.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MessageSquare className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(customer)}
                          className="h-8 w-8 text-foreground hover:bg-secondary"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(customer.id)}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <p className="text-xs text-muted-foreground">
                {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredCustomers.length)} de {filteredCustomers.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-foreground font-medium">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

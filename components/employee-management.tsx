"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { empleadosApi } from "@/lib/api-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  DialogTrigger,
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
  Users,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Shield,
  Building2,
  Download,
  Plus,
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

interface Empleado {
  id: number
  nombre: string
  email: string
  telefono: string
  departamento: string
  rol: string
  rolId: number
  activo: boolean
  fechaCreacion: string
}

export function EmployeeManagement() {
  const [employees, setEmployees] = useState<Empleado[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Empleado | null>(null)
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    telefono: "",
    departamento: "",
    rolId: 1,
    activo: true,
  })
  const itemsPerPage = 8

  const fetchEmployees = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await empleadosApi.listar()
      const mapped: Empleado[] = (data as Record<string, unknown>[]).map((e) => ({
        id: Number(e.id ?? 0),
        nombre: String(e.nombre ?? ""),
        email: String(e.email ?? ""),
        telefono: String(e.telefono ?? ""),
        departamento: String(e.departamento ?? ""),
        rol: String((e.rol as Record<string, unknown>)?.nombre ?? e.rolNombre ?? "Sin rol"),
        rolId: Number((e.rol as Record<string, unknown>)?.id ?? e.rolId ?? 1),
        activo: Boolean(e.activo),
        fechaCreacion: String(e.fechaCreacion ?? ""),
      }))
      setEmployees(mapped)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cargar empleados")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.departamento.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && emp.activo) ||
      (statusFilter === "inactive" && !emp.activo)
    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage)
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

  const stats = {
    total: employees.length,
    active: employees.filter((e) => e.activo).length,
    inactive: employees.filter((e) => !e.activo).length,
  }

  const handleDownload = () => {
    const headers = ["Nombre", "Email", "Telefono", "Departamento", "Rol", "Estado"]
    const rows = filteredEmployees.map((e) => [
      e.nombre,
      e.email,
      e.telefono || "-",
      e.departamento || "-",
      e.rol,
      e.activo ? "Activo" : "Inactivo",
    ])
    downloadCSV("empleados", headers, rows)
  }

  const handleOpenDialog = (emp?: Empleado) => {
    if (emp) {
      setEditingEmployee(emp)
      setFormData({
        nombre: emp.nombre,
        email: emp.email,
        password: "",
        telefono: emp.telefono,
        departamento: emp.departamento,
        rolId: emp.rolId,
        activo: emp.activo,
      })
    } else {
      setEditingEmployee(null)
      setFormData({
        nombre: "",
        email: "",
        password: "",
        telefono: "",
        departamento: "",
        rolId: 1,
        activo: true,
      })
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      if (editingEmployee) {
        const updateData: Record<string, unknown> = {
          nombre: formData.nombre,
          email: formData.email,
          telefono: formData.telefono,
          departamento: formData.departamento,
          rolId: formData.rolId,
          activo: formData.activo,
        }
        if (formData.password) {
          updateData.password = formData.password
        }
        await empleadosApi.actualizar(editingEmployee.id, updateData)
      } else {
        await empleadosApi.crear({
          nombre: formData.nombre,
          email: formData.email,
          password: formData.password,
          telefono: formData.telefono,
          departamento: formData.departamento,
          rolId: formData.rolId,
          activo: formData.activo,
        })
      }
      setIsDialogOpen(false)
      toast.success(editingEmployee ? "Empleado actualizado correctamente" : "Empleado creado correctamente")
      fetchEmployees()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar empleado")
    }
  }

  const handleToggleStatus = async (emp: Empleado) => {
    try {
      if (emp.activo) {
        await empleadosApi.desactivar(emp.id)
      } else {
        await empleadosApi.activar(emp.id)
      }
      toast.success(emp.activo ? "Empleado desactivado" : "Empleado activado")
      fetchEmployees()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cambiar estado")
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg md:text-xl font-bold text-card-foreground">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#10b981]/10 flex-shrink-0">
                <UserCheck className="h-4 w-4 text-[#10b981]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Activos</p>
                <p className="text-lg md:text-xl font-bold text-card-foreground">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10 flex-shrink-0">
                <UserX className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Inactivos</p>
                <p className="text-lg md:text-xl font-bold text-card-foreground">{stats.inactive}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search, Filters and Actions */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o departamento..."
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
              {["all", "active", "inactive"].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className={
                    statusFilter === status
                      ? "bg-primary text-primary-foreground"
                      : "border-border text-foreground"
                  }
                >
                  {status === "all" ? "Todos" : status === "active" ? "Activos" : "Inactivos"}
                </Button>
              ))}
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
                <DialogContent className="bg-card border-border text-card-foreground max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="text-card-foreground">
                      {editingEmployee ? "Editar Empleado" : "Nuevo Empleado"}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      {editingEmployee
                        ? "Modifica los datos del empleado."
                        : "Completa la informacion del nuevo empleado."}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nombre" className="text-card-foreground">Nombre</Label>
                        <Input
                          id="nombre"
                          value={formData.nombre}
                          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                          className="bg-input border-border text-foreground"
                          placeholder="Nombre completo"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-card-foreground">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="bg-input border-border text-foreground"
                          placeholder="correo@empresa.com"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-card-foreground">
                          {editingEmployee ? "Nueva Contrasena (opcional)" : "Contrasena"}
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="bg-input border-border text-foreground"
                          placeholder={editingEmployee ? "Dejar vacio para no cambiar" : "Contrasena"}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telefono" className="text-card-foreground">Telefono</Label>
                        <Input
                          id="telefono"
                          value={formData.telefono}
                          onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                          className="bg-input border-border text-foreground"
                          placeholder="+52 999 000 0000"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="departamento" className="text-card-foreground">Departamento</Label>
                        <Input
                          id="departamento"
                          value={formData.departamento}
                          onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                          className="bg-input border-border text-foreground"
                          placeholder="Ventas, Soporte, etc."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rolId" className="text-card-foreground">Rol</Label>
                        <Select
                          value={String(formData.rolId)}
                          onValueChange={(val) => setFormData({ ...formData, rolId: Number(val) })}
                        >
                          <SelectTrigger className="bg-input border-border text-foreground">
                            <SelectValue placeholder="Seleccionar rol" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            <SelectItem value="1">Administrador</SelectItem>
                            <SelectItem value="2">Supervisor</SelectItem>
                            <SelectItem value="3">Agente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estado" className="text-card-foreground">Estado</Label>
                      <Select
                        value={formData.activo ? "activo" : "inactivo"}
                        onValueChange={(val) => setFormData({ ...formData, activo: val === "activo" })}
                      >
                        <SelectTrigger className="bg-input border-border text-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="activo">Activo</SelectItem>
                          <SelectItem value="inactivo">Inactivo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
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
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      disabled={!formData.nombre || !formData.email || (!editingEmployee && !formData.password)}
                    >
                      {editingEmployee ? "Guardar Cambios" : "Crear Empleado"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Mobile Cards */}
          <div className="block md:hidden divide-y divide-border">
            {paginatedEmployees.map((emp) => (
              <div key={emp.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                        {emp.nombre.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-card-foreground truncate">{emp.nombre}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{emp.email}</span>
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={emp.activo ? "default" : "secondary"}
                    className={`text-xs flex-shrink-0 ${
                      emp.activo
                        ? "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20"
                        : "bg-destructive/10 text-destructive border-destructive/20"
                    }`}
                  >
                    {emp.activo ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {emp.telefono && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {emp.telefono}
                    </span>
                  )}
                  {emp.departamento && (
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" /> {emp.departamento}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Shield className="h-3 w-3" /> {emp.rol}
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleOpenDialog(emp)}
                  >
                    <Edit className="h-3 w-3 mr-1" /> Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleToggleStatus(emp)}
                  >
                    {emp.activo ? (
                      <><XCircle className="h-3 w-3 mr-1" /> Desactivar</>
                    ) : (
                      <><CheckCircle className="h-3 w-3 mr-1" /> Activar</>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Empleado</TableHead>
                  <TableHead className="text-muted-foreground">Email</TableHead>
                  <TableHead className="text-muted-foreground">Telefono</TableHead>
                  <TableHead className="text-muted-foreground">Departamento</TableHead>
                  <TableHead className="text-muted-foreground">Rol</TableHead>
                  <TableHead className="text-muted-foreground">Estado</TableHead>
                  <TableHead className="text-muted-foreground text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEmployees.map((emp) => (
                  <TableRow key={emp.id} className="border-border hover:bg-secondary/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {emp.nombre.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-card-foreground">{emp.nombre}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{emp.email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{emp.telefono || "-"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{emp.departamento || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{emp.rol}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={emp.activo ? "default" : "secondary"}
                        className={`text-xs ${
                          emp.activo
                            ? "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20"
                            : "bg-destructive/10 text-destructive border-destructive/20"
                        }`}
                      >
                        {emp.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(emp)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Edit className="h-4 w-4 mr-1" /> Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(emp)}
                          className={
                            emp.activo
                              ? "text-destructive hover:text-destructive hover:bg-destructive/10"
                              : "text-[#10b981] hover:text-[#10b981] hover:bg-[#10b981]/10"
                          }
                        >
                          {emp.activo ? (
                            <><XCircle className="h-4 w-4 mr-1" /> Desactivar</>
                          ) : (
                            <><CheckCircle className="h-4 w-4 mr-1" /> Activar</>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredEmployees.length === 0 && (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-sm">No se encontraron empleados</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <p className="text-xs text-muted-foreground">
                {(currentPage - 1) * itemsPerPage + 1}-
                {Math.min(currentPage * itemsPerPage, filteredEmployees.length)} de{" "}
                {filteredEmployees.length}
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

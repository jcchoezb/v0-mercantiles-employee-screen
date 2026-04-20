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
  Building2,
  Globe,
  Phone,
  Mail,
} from "lucide-react"
import { empresasApi } from "@/lib/api-service"

interface Company {
  id: number
  nombre: string
  descripcion: string
  telefono: string
  email: string
  direccion: string
  sitioWeb: string
  logoUrl: string
  activo: boolean
  fechaRegistro: string
}

const ITEMS_PER_PAGE = 8

export function CompanyManagement() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    telefono: "",
    email: "",
    direccion: "",
    sitioWeb: "",
    logoUrl: "",
  })

  const fetchCompanies = useCallback(async () => {
    try {
      const data = await empresasApi.listar()
      const mapped: Company[] = (data as Record<string, unknown>[]).map((c) => ({
        id: Number(c.id),
        nombre: String(c.nombre ?? ""),
        descripcion: String(c.descripcion ?? ""),
        telefono: String(c.telefono ?? ""),
        email: String(c.email ?? ""),
        direccion: String(c.direccion ?? ""),
        sitioWeb: String(c.sitioWeb ?? ""),
        logoUrl: String(c.logoUrl ?? ""),
        activo: Boolean(c.activo),
        fechaRegistro: String(c.fechaRegistro ?? ""),
      }))
      setCompanies(mapped)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cargar empresas")
    }
  }, [])

  useEffect(() => {
    fetchCompanies()
  }, [fetchCompanies])

  const filteredCompanies = companies.filter((company) => {
    const matchesSearch =
      company.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.telefono.includes(searchTerm)
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && company.activo) ||
      (statusFilter === "inactive" && !company.activo)
    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filteredCompanies.length / ITEMS_PER_PAGE)
  const paginatedCompanies = filteredCompanies.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleOpenDialog = (company?: Company) => {
    if (company) {
      setEditingCompany(company)
      setFormData({
        nombre: company.nombre,
        descripcion: company.descripcion,
        telefono: company.telefono,
        email: company.email,
        direccion: company.direccion,
        sitioWeb: company.sitioWeb,
        logoUrl: company.logoUrl,
      })
    } else {
      setEditingCompany(null)
      setFormData({
        nombre: "",
        descripcion: "",
        telefono: "",
        email: "",
        direccion: "",
        sitioWeb: "",
        logoUrl: "",
      })
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.nombre.trim()) {
      toast.error("El nombre es obligatorio")
      return
    }
    setIsLoading(true)
    try {
      if (editingCompany) {
        await empresasApi.actualizar(editingCompany.id, formData)
        toast.success("Empresa actualizada correctamente")
      } else {
        await empresasApi.crear(formData)
        toast.success("Empresa creada correctamente")
      }
      setIsDialogOpen(false)
      fetchCompanies()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estas seguro de eliminar esta empresa?")) return
    try {
      await empresasApi.eliminar(id)
      toast.success("Empresa eliminada correctamente")
      fetchCompanies()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar")
    }
  }

  const handleToggleStatus = async (company: Company) => {
    try {
      if (company.activo) {
        await empresasApi.desactivar(company.id)
        toast.success("Empresa desactivada")
      } else {
        await empresasApi.activar(company.id)
        toast.success("Empresa activada")
      }
      fetchCompanies()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cambiar estado")
    }
  }

  const handleDownload = () => {
    const headers = ["ID", "Nombre", "Email", "Telefono", "Direccion", "Sitio Web", "Estado"]
    const rows = filteredCompanies.map((c) => [
      c.id,
      c.nombre,
      c.email,
      c.telefono,
      c.direccion,
      c.sitioWeb,
      c.activo ? "Activo" : "Inactivo",
    ])
    const csvContent = [headers, ...rows].map((r) => r.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `empresas_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Empresas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{companies.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Empresas Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {companies.filter((c) => c.activo).length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Empresas Inactivas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {companies.filter((c) => !c.activo).length}
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
                <Building2 className="h-5 w-5" />
                Empresas
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Gestiona las empresas registradas en el sistema
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Button size="sm" onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Empresa
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
                placeholder="Buscar por nombre, email o telefono..."
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
                    Contacto
                  </TableHead>
                  <TableHead className="text-muted-foreground hidden lg:table-cell">
                    Sitio Web
                  </TableHead>
                  <TableHead className="text-muted-foreground">Estado</TableHead>
                  <TableHead className="text-muted-foreground text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCompanies.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No se encontraron empresas
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCompanies.map((company) => (
                    <TableRow key={company.id} className="border-border hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{company.nombre}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {company.descripcion || "Sin descripcion"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="space-y-1">
                          {company.email && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {company.email}
                            </div>
                          )}
                          {company.telefono && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {company.telefono}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {company.sitioWeb ? (
                          <a
                            href={company.sitioWeb}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-primary hover:underline"
                          >
                            <Globe className="h-3 w-3" />
                            {company.sitioWeb.replace(/^https?:\/\//, "")}
                          </a>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={company.activo ? "default" : "secondary"}
                          className={
                            company.activo
                              ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                              : "bg-muted text-muted-foreground"
                          }
                          onClick={() => handleToggleStatus(company)}
                          style={{ cursor: "pointer" }}
                        >
                          {company.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(company)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(company.id)}
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
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredCompanies.length)} de{" "}
                {filteredCompanies.length}
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
        <DialogContent className="bg-card border-border sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editingCompany ? "Editar Empresa" : "Nueva Empresa"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingCompany
                ? "Modifica los datos de la empresa"
                : "Completa los datos para crear una nueva empresa"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-foreground text-sm">Nombre *</Label>
              <Input
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Nombre de la empresa"
                className="bg-input border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground text-sm">Descripcion</Label>
              <Textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripcion de la empresa"
                className="bg-input border-border text-foreground resize-none"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground text-sm">Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@empresa.com"
                  className="bg-input border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground text-sm">Telefono</Label>
                <Input
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="+52 123 456 7890"
                  className="bg-input border-border text-foreground"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground text-sm">Direccion</Label>
              <Input
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                placeholder="Direccion de la empresa"
                className="bg-input border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground text-sm">Sitio Web</Label>
              <Input
                value={formData.sitioWeb}
                onChange={(e) => setFormData({ ...formData, sitioWeb: e.target.value })}
                placeholder="https://www.empresa.com"
                className="bg-input border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground text-sm">URL del Logo</Label>
              <Input
                value={formData.logoUrl}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                placeholder="https://..."
                className="bg-input border-border text-foreground"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Guardando..." : editingCompany ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

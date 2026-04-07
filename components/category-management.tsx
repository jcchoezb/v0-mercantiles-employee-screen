"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { categoriasApi } from "@/lib/api-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Search,
  Plus,
  Edit,
  Tag,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Layers,
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

interface Categoria {
  id: number
  nombre: string
  descripcion: string
  icono: string
  orden: number
  activo: boolean
}

export function CategoryManagement() {
  const [categories, setCategories] = useState<Categoria[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Categoria | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    icono: "",
    orden: 1,
    activo: true,
  })

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await categoriasApi.listar()
      const mapped: Categoria[] = (data as Record<string, unknown>[]).map((c) => ({
        id: Number(c.id ?? 0),
        nombre: String(c.nombre ?? ""),
        descripcion: String(c.descripcion ?? ""),
        icono: String(c.icono ?? ""),
        orden: Number(c.orden ?? 0),
        activo: Boolean(c.activo),
      }))
      setCategories(mapped)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cargar categorias")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const filteredCategories = categories.filter((cat) => {
    const matchesSearch = cat.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && cat.activo) ||
      (statusFilter === "inactive" && !cat.activo)
    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage)
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

  const stats = {
    total: categories.length,
    active: categories.filter((c) => c.activo).length,
    inactive: categories.filter((c) => !c.activo).length,
  }

  const handleDownload = () => {
    const headers = ["Nombre", "Descripcion", "Icono", "Orden", "Estado"]
    const rows = filteredCategories.map((c) => [
      c.nombre,
      c.descripcion,
      c.icono,
      String(c.orden),
      c.activo ? "Activo" : "Inactivo",
    ])
    downloadCSV("categorias", headers, rows)
  }

  const handleOpenDialog = (category?: Categoria) => {
    if (category) {
      setEditingCategory(category)
      setFormData({
        nombre: category.nombre,
        descripcion: category.descripcion,
        icono: category.icono,
        orden: category.orden,
        activo: category.activo,
      })
    } else {
      setEditingCategory(null)
      setFormData({
        nombre: "",
        descripcion: "",
        icono: "",
        orden: categories.length + 1,
        activo: true,
      })
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      if (editingCategory) {
        await categoriasApi.actualizar(editingCategory.id, {
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          icono: formData.icono,
          orden: formData.orden,
          activo: formData.activo,
        })
      } else {
        await categoriasApi.crear({
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          icono: formData.icono,
          orden: formData.orden,
          activo: formData.activo,
        })
      }
      setIsDialogOpen(false)
      toast.success(editingCategory ? "Categoria actualizada correctamente" : "Categoria creada correctamente")
      fetchCategories()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar categoria")
    }
  }

  const handleToggleStatus = async (cat: Categoria) => {
    try {
      if (cat.activo) {
        await categoriasApi.desactivar(cat.id)
      } else {
        await categoriasApi.activar(cat.id)
      }
      toast.success(cat.activo ? "Categoria desactivada" : "Categoria activada")
      fetchCategories()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cambiar estado")
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="p-2 md:p-3 rounded-lg bg-secondary">
                <Layers className="h-4 w-4 md:h-5 md:w-5 text-foreground" />
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
            <div className="flex items-center gap-2 md:gap-4">
              <div className="p-2 md:p-3 rounded-lg bg-primary/20">
                <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Activas</p>
                <p className="text-lg md:text-2xl font-bold text-foreground">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="p-2 md:p-3 rounded-lg bg-destructive/20">
                <XCircle className="h-4 w-4 md:h-5 md:w-5 text-destructive" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Inactivas</p>
                <p className="text-lg md:text-2xl font-bold text-foreground">{stats.inactive}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card className="bg-card border-border">
        <CardHeader className="border-b border-border p-4 md:p-6">
          <div className="flex flex-col gap-4">
            <CardTitle className="text-foreground text-base md:text-lg">Gestion de Categorias</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar categoria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full bg-input border-border text-foreground placeholder:text-muted-foreground text-sm"
                />
              </div>
              <div className="flex gap-2">
                {["all", "active", "inactive"].map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                    className={
                      statusFilter === status
                        ? "bg-primary text-primary-foreground text-xs"
                        : "border-border text-foreground text-xs"
                    }
                  >
                    {status === "all" ? "Todos" : status === "active" ? "Activos" : "Inactivos"}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleDownload}
                  className="h-9 w-9 border-border flex-shrink-0"
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
                      <span className="hidden sm:inline">Nueva</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border max-w-[95vw] sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-foreground">
                        {editingCategory ? "Editar Categoria" : "Nueva Categoria"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label className="text-foreground text-sm">Nombre *</Label>
                        <Input
                          value={formData.nombre}
                          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                          className="bg-input border-border text-foreground text-sm"
                          placeholder="Ej: Comercios"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground text-sm">Descripcion</Label>
                        <Textarea
                          value={formData.descripcion}
                          onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                          className="bg-input border-border text-foreground resize-none text-sm"
                          rows={3}
                          placeholder="Descripcion de la categoria..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-foreground text-sm">Icono (URL)</Label>
                          <Input
                            value={formData.icono}
                            onChange={(e) => setFormData({ ...formData, icono: e.target.value })}
                            className="bg-input border-border text-foreground text-sm"
                            placeholder="https://..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-foreground text-sm">Orden</Label>
                          <Input
                            type="number"
                            value={formData.orden}
                            onChange={(e) => setFormData({ ...formData, orden: Number(e.target.value) })}
                            className="bg-input border-border text-foreground text-sm"
                            min={1}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground text-sm">Estado</Label>
                        <Select
                          value={formData.activo ? "active" : "inactive"}
                          onValueChange={(value) => setFormData({ ...formData, activo: value === "active" })}
                        >
                          <SelectTrigger className="bg-input border-border text-foreground text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            <SelectItem value="active">Activo</SelectItem>
                            <SelectItem value="inactive">Inactivo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        onClick={handleSave}
                        disabled={!formData.nombre.trim()}
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        {editingCategory ? "Guardar Cambios" : "Crear Categoria"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground text-sm">Cargando categorias...</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">Nombre</TableHead>
                      <TableHead className="text-muted-foreground">Descripcion</TableHead>
                      <TableHead className="text-muted-foreground">Orden</TableHead>
                      <TableHead className="text-muted-foreground">Estado</TableHead>
                      <TableHead className="text-muted-foreground text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCategories.map((cat) => (
                      <TableRow key={cat.id} className="border-border hover:bg-secondary/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Tag className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-medium text-foreground text-sm">{cat.nombre}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                          {cat.descripcion || "-"}
                        </TableCell>
                        <TableCell className="text-foreground text-sm">{cat.orden}</TableCell>
                        <TableCell>
                          <Badge
                            className={`text-xs ${
                              cat.activo
                                ? "bg-primary/10 text-primary border-primary/20"
                                : "bg-muted text-muted-foreground border-border"
                            }`}
                          >
                            {cat.activo ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(cat)}
                              className="h-8 w-8 text-foreground hover:bg-secondary"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleStatus(cat)}
                              className="h-8 w-8 text-foreground hover:bg-secondary"
                            >
                              {cat.activo ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="block md:hidden divide-y divide-border">
                {paginatedCategories.map((cat) => (
                  <div key={cat.id} className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Tag className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">{cat.nombre}</p>
                          <p className="text-xs text-muted-foreground">Orden: {cat.orden}</p>
                        </div>
                      </div>
                      <Badge
                        className={`text-xs ${
                          cat.activo
                            ? "bg-primary/10 text-primary border-primary/20"
                            : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        {cat.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                    {cat.descripcion && (
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{cat.descripcion}</p>
                    )}
                    <div className="flex items-center gap-1 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(cat)} className="text-xs h-7">
                        <Edit className="h-3.5 w-3.5 mr-1" /> Editar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(cat)} className="text-xs h-7">
                        {cat.activo ? (
                          <><XCircle className="h-3.5 w-3.5 mr-1" /> Desactivar</>
                        ) : (
                          <><CheckCircle className="h-3.5 w-3.5 mr-1" /> Activar</>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {paginatedCategories.length === 0 && (
                <div className="p-8 text-center">
                  <Layers className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-sm">No se encontraron categorias</p>
                </div>
              )}
            </>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <p className="text-xs text-muted-foreground">
                {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredCategories.length)} de {filteredCategories.length}
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

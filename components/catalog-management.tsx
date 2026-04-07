"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { catalogosApi } from "@/lib/api-service"
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
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  BookOpen,
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

interface Catalogo {
  id: number
  tipoCatalogo: string
  codigo: string
  nombre: string
  descripcion: string
  valorExtra: string
  orden: number
  activo: boolean
}

export function CatalogManagement() {
  const [catalogos, setCatalogos] = useState<Catalogo[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [tipoFilter, setTipoFilter] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCatalogo, setEditingCatalogo] = useState<Catalogo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8
  const [formData, setFormData] = useState({
    tipoCatalogo: "",
    codigo: "",
    nombre: "",
    descripcion: "",
    valorExtra: "",
    orden: 1,
  })

  const fetchCatalogos = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await catalogosApi.listar()
      const mapped: Catalogo[] = (data as Record<string, unknown>[]).map((c) => ({
        id: Number(c.id ?? 0),
        tipoCatalogo: String(c.tipoCatalogo ?? ""),
        codigo: String(c.codigo ?? ""),
        nombre: String(c.nombre ?? ""),
        descripcion: String(c.descripcion ?? ""),
        valorExtra: String(c.valorExtra ?? ""),
        orden: Number(c.orden ?? 0),
        activo: Boolean(c.activo),
      }))
      setCatalogos(mapped)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cargar catalogos")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCatalogos()
  }, [fetchCatalogos])

  const tipos = [...new Set(catalogos.map((c) => c.tipoCatalogo).filter(Boolean))]

  const filteredCatalogos = catalogos.filter((c) => {
    const matchesSearch =
      c.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.tipoCatalogo.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && c.activo) ||
      (statusFilter === "inactive" && !c.activo)
    const matchesTipo = tipoFilter === "all" || c.tipoCatalogo === tipoFilter
    return matchesSearch && matchesStatus && matchesTipo
  })

  const totalPages = Math.ceil(filteredCatalogos.length / itemsPerPage)
  const paginatedCatalogos = filteredCatalogos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleDownload = () => {
    const headers = ["Tipo", "Codigo", "Nombre", "Descripcion", "Orden", "Estado"]
    const rows = filteredCatalogos.map((c) => [
      c.tipoCatalogo,
      c.codigo,
      c.nombre,
      c.descripcion,
      String(c.orden),
      c.activo ? "Activo" : "Inactivo",
    ])
    downloadCSV("catalogos", headers, rows)
  }

  const handleOpenDialog = (cat?: Catalogo) => {
    if (cat) {
      setEditingCatalogo(cat)
      setFormData({
        tipoCatalogo: cat.tipoCatalogo,
        codigo: cat.codigo,
        nombre: cat.nombre,
        descripcion: cat.descripcion,
        valorExtra: cat.valorExtra,
        orden: cat.orden,
      })
    } else {
      setEditingCatalogo(null)
      setFormData({
        tipoCatalogo: "",
        codigo: "",
        nombre: "",
        descripcion: "",
        valorExtra: "",
        orden: 1,
      })
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      if (editingCatalogo) {
        await catalogosApi.actualizar(editingCatalogo.id, {
          ...formData,
          usuarioCreacion: "admin",
        })
        toast.success("Catalogo actualizado correctamente")
      } else {
        await catalogosApi.crear({
          ...formData,
          usuarioCreacion: "admin",
        })
        toast.success("Catalogo creado correctamente")
      }
      setIsDialogOpen(false)
      fetchCatalogos()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar catalogo")
    }
  }

  const handleToggleStatus = async (cat: Catalogo) => {
    try {
      if (cat.activo) {
        await catalogosApi.desactivar(cat.id, "admin")
        toast.success("Catalogo desactivado")
      } else {
        await catalogosApi.activar(cat.id, "admin")
        toast.success("Catalogo activado")
      }
      fetchCatalogos()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cambiar estado")
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-foreground flex items-center gap-2 text-base md:text-lg">
              <BookOpen className="h-5 w-5 text-primary" />
              Catalogos del Sistema ({filteredCatalogos.length})
            </CardTitle>
            <div className="flex items-center gap-2">
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
                <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-foreground">
                      {editingCatalogo ? "Editar Catalogo" : "Nuevo Catalogo"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-foreground text-sm">Tipo Catalogo *</Label>
                        <Input
                          value={formData.tipoCatalogo}
                          onChange={(e) => setFormData({ ...formData, tipoCatalogo: e.target.value })}
                          placeholder="WHATSAPP_WEBHOOK"
                          className="bg-input border-border text-foreground text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground text-sm">Codigo *</Label>
                        <Input
                          value={formData.codigo}
                          onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                          placeholder="messages"
                          className="bg-input border-border text-foreground text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground text-sm">Nombre *</Label>
                      <Input
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        placeholder="Mensajes entrantes"
                        className="bg-input border-border text-foreground text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground text-sm">Descripcion</Label>
                      <Textarea
                        value={formData.descripcion}
                        onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                        placeholder="Descripcion del catalogo..."
                        className="bg-input border-border text-foreground text-sm resize-none"
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-foreground text-sm">Valor Extra</Label>
                        <Input
                          value={formData.valorExtra}
                          onChange={(e) => setFormData({ ...formData, valorExtra: e.target.value })}
                          placeholder="Valor adicional"
                          className="bg-input border-border text-foreground text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground text-sm">Orden</Label>
                        <Input
                          type="number"
                          value={formData.orden}
                          onChange={(e) => setFormData({ ...formData, orden: Number(e.target.value) })}
                          className="bg-input border-border text-foreground text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-border">
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSave}
                      className="bg-primary text-primary-foreground"
                      disabled={!formData.tipoCatalogo || !formData.codigo || !formData.nombre}
                    >
                      {editingCatalogo ? "Guardar" : "Crear"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por codigo, nombre o tipo..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="pl-10 bg-input border-border text-foreground text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Select value={tipoFilter} onValueChange={(v) => { setTipoFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-[180px] bg-input border-border text-foreground text-sm">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {tipos.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {["all", "active", "inactive"].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
                  className={statusFilter === status ? "bg-primary text-primary-foreground" : "border-border text-foreground"}
                >
                  {status === "all" ? "Todos" : status === "active" ? "Activos" : "Inactivos"}
                </Button>
              ))}
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 border-border">
                      <TableHead className="text-muted-foreground font-medium">Tipo</TableHead>
                      <TableHead className="text-muted-foreground font-medium">Codigo</TableHead>
                      <TableHead className="text-muted-foreground font-medium">Nombre</TableHead>
                      <TableHead className="text-muted-foreground font-medium hidden lg:table-cell">Descripcion</TableHead>
                      <TableHead className="text-muted-foreground font-medium hidden md:table-cell">Orden</TableHead>
                      <TableHead className="text-muted-foreground font-medium">Estado</TableHead>
                      <TableHead className="text-muted-foreground font-medium text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCatalogos.map((cat) => (
                      <TableRow key={cat.id} className="border-border hover:bg-muted/30">
                        <TableCell>
                          <Badge variant="outline" className="text-xs font-mono">
                            {cat.tipoCatalogo.length > 18 ? cat.tipoCatalogo.substring(0, 18) + "..." : cat.tipoCatalogo}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-foreground">{cat.codigo}</TableCell>
                        <TableCell className="text-foreground">{cat.nombre}</TableCell>
                        <TableCell className="text-muted-foreground text-sm hidden lg:table-cell">
                          {cat.descripcion.length > 30 ? cat.descripcion.substring(0, 30) + "..." : cat.descripcion || "-"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{cat.orden}</TableCell>
                        <TableCell>
                          <Badge
                            variant={cat.activo ? "default" : "secondary"}
                            className={`text-xs ${cat.activo ? "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20" : "bg-muted text-muted-foreground"}`}
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
                              className={`h-8 w-8 ${cat.activo ? "text-destructive hover:bg-destructive/10" : "text-[#10b981] hover:bg-[#10b981]/10"}`}
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, filteredCatalogos.length)} de {filteredCatalogos.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="h-8 w-8 border-border"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-foreground">
                      {currentPage} / {totalPages}
                    </span>
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

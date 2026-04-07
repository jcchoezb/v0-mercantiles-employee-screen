"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { parametrosApi } from "@/lib/api-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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
  Settings2,
  Lock,
  Unlock,
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

interface Parametro {
  id: number
  codigo: string
  nombre: string
  valor: string
  descripcion: string
  ambiente: string
  modulo: string
  esEncriptado: boolean
  activo: boolean
}

export function ParameterManagement() {
  const [parametros, setParametros] = useState<Parametro[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [moduloFilter, setModuloFilter] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingParametro, setEditingParametro] = useState<Parametro | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8
  const [formData, setFormData] = useState({
    codigo: "",
    nombre: "",
    valor: "",
    descripcion: "",
    ambiente: "DEV",
    modulo: "",
    esEncriptado: false,
  })

  const fetchParametros = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await parametrosApi.listar()
      const mapped: Parametro[] = (data as Record<string, unknown>[]).map((p) => ({
        id: Number(p.id ?? 0),
        codigo: String(p.codigo ?? ""),
        nombre: String(p.nombre ?? ""),
        valor: String(p.valor ?? ""),
        descripcion: String(p.descripcion ?? ""),
        ambiente: String(p.ambiente ?? "DEV"),
        modulo: String(p.modulo ?? ""),
        esEncriptado: Boolean(p.esEncriptado),
        activo: Boolean(p.activo),
      }))
      setParametros(mapped)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cargar parametros")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchParametros()
  }, [fetchParametros])

  const modulos = [...new Set(parametros.map((p) => p.modulo).filter(Boolean))]

  const filteredParametros = parametros.filter((p) => {
    const matchesSearch =
      p.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.modulo.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && p.activo) ||
      (statusFilter === "inactive" && !p.activo)
    const matchesModulo = moduloFilter === "all" || p.modulo === moduloFilter
    return matchesSearch && matchesStatus && matchesModulo
  })

  const totalPages = Math.ceil(filteredParametros.length / itemsPerPage)
  const paginatedParametros = filteredParametros.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleDownload = () => {
    const headers = ["Codigo", "Nombre", "Valor", "Modulo", "Ambiente", "Encriptado", "Estado"]
    const rows = filteredParametros.map((p) => [
      p.codigo,
      p.nombre,
      p.esEncriptado ? "****" : p.valor,
      p.modulo,
      p.ambiente,
      p.esEncriptado ? "Si" : "No",
      p.activo ? "Activo" : "Inactivo",
    ])
    downloadCSV("parametros", headers, rows)
  }

  const handleOpenDialog = (param?: Parametro) => {
    if (param) {
      setEditingParametro(param)
      setFormData({
        codigo: param.codigo,
        nombre: param.nombre,
        valor: param.valor,
        descripcion: param.descripcion,
        ambiente: param.ambiente,
        modulo: param.modulo,
        esEncriptado: param.esEncriptado,
      })
    } else {
      setEditingParametro(null)
      setFormData({
        codigo: "",
        nombre: "",
        valor: "",
        descripcion: "",
        ambiente: "DEV",
        modulo: "",
        esEncriptado: false,
      })
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      if (editingParametro) {
        await parametrosApi.actualizar(editingParametro.id, {
          ...formData,
          usuarioCreacion: "admin",
        })
        toast.success("Parametro actualizado correctamente")
      } else {
        await parametrosApi.crear({
          ...formData,
          usuarioCreacion: "admin",
        })
        toast.success("Parametro creado correctamente")
      }
      setIsDialogOpen(false)
      fetchParametros()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar parametro")
    }
  }

  const handleToggleStatus = async (param: Parametro) => {
    try {
      if (param.activo) {
        await parametrosApi.desactivar(param.id, "admin")
        toast.success("Parametro desactivado")
      } else {
        await parametrosApi.activar(param.id, "admin")
        toast.success("Parametro activado")
      }
      fetchParametros()
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
              <Settings2 className="h-5 w-5 text-primary" />
              Parametros del Sistema ({filteredParametros.length})
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
                      {editingParametro ? "Editar Parametro" : "Nuevo Parametro"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-foreground text-sm">Codigo *</Label>
                        <Input
                          value={formData.codigo}
                          onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                          placeholder="MODO"
                          className="bg-input border-border text-foreground text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground text-sm">Modulo</Label>
                        <Input
                          value={formData.modulo}
                          onChange={(e) => setFormData({ ...formData, modulo: e.target.value })}
                          placeholder="WHATSAPP"
                          className="bg-input border-border text-foreground text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground text-sm">Nombre *</Label>
                      <Input
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        placeholder="Modo de operacion"
                        className="bg-input border-border text-foreground text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground text-sm">Valor *</Label>
                      <Input
                        value={formData.valor}
                        onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                        placeholder="TEST"
                        type={formData.esEncriptado ? "password" : "text"}
                        className="bg-input border-border text-foreground text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground text-sm">Descripcion</Label>
                      <Textarea
                        value={formData.descripcion}
                        onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                        placeholder="Descripcion del parametro..."
                        className="bg-input border-border text-foreground text-sm resize-none"
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-foreground text-sm">Ambiente</Label>
                        <Select
                          value={formData.ambiente}
                          onValueChange={(value) => setFormData({ ...formData, ambiente: value })}
                        >
                          <SelectTrigger className="bg-input border-border text-foreground text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            <SelectItem value="DEV">DEV</SelectItem>
                            <SelectItem value="QA">QA</SelectItem>
                            <SelectItem value="PROD">PROD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground text-sm">Encriptado</Label>
                        <div className="flex items-center gap-2 h-9">
                          <Switch
                            checked={formData.esEncriptado}
                            onCheckedChange={(checked) => setFormData({ ...formData, esEncriptado: checked })}
                          />
                          <span className="text-sm text-muted-foreground">
                            {formData.esEncriptado ? "Si" : "No"}
                          </span>
                        </div>
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
                      disabled={!formData.codigo || !formData.nombre || !formData.valor}
                    >
                      {editingParametro ? "Guardar" : "Crear"}
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
                placeholder="Buscar por codigo, nombre o modulo..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="pl-10 bg-input border-border text-foreground text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Select value={moduloFilter} onValueChange={(v) => { setModuloFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-[140px] bg-input border-border text-foreground text-sm">
                  <SelectValue placeholder="Modulo" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">Todos</SelectItem>
                  {modulos.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
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
                      <TableHead className="text-muted-foreground font-medium">Codigo</TableHead>
                      <TableHead className="text-muted-foreground font-medium">Nombre</TableHead>
                      <TableHead className="text-muted-foreground font-medium hidden md:table-cell">Valor</TableHead>
                      <TableHead className="text-muted-foreground font-medium hidden lg:table-cell">Modulo</TableHead>
                      <TableHead className="text-muted-foreground font-medium hidden lg:table-cell">Ambiente</TableHead>
                      <TableHead className="text-muted-foreground font-medium">Estado</TableHead>
                      <TableHead className="text-muted-foreground font-medium text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedParametros.map((param) => (
                      <TableRow key={param.id} className="border-border hover:bg-muted/30">
                        <TableCell className="font-medium text-foreground">
                          <div className="flex items-center gap-2">
                            {param.esEncriptado ? (
                              <Lock className="h-3 w-3 text-amber-500" />
                            ) : (
                              <Unlock className="h-3 w-3 text-muted-foreground" />
                            )}
                            <span className="font-mono text-xs">{param.codigo}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-foreground">{param.nombre}</TableCell>
                        <TableCell className="text-muted-foreground hidden md:table-cell font-mono text-xs">
                          {param.esEncriptado ? "••••••••" : (param.valor.length > 20 ? param.valor.substring(0, 20) + "..." : param.valor)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Badge variant="outline" className="text-xs">{param.modulo || "-"}</Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Badge variant="secondary" className="text-xs">{param.ambiente}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={param.activo ? "default" : "secondary"}
                            className={`text-xs ${param.activo ? "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20" : "bg-muted text-muted-foreground"}`}
                          >
                            {param.activo ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(param)}
                              className="h-8 w-8 text-foreground hover:bg-secondary"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleStatus(param)}
                              className={`h-8 w-8 ${param.activo ? "text-destructive hover:bg-destructive/10" : "text-[#10b981] hover:bg-[#10b981]/10"}`}
                            >
                              {param.activo ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
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
                    Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, filteredParametros.length)} de {filteredParametros.length}
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

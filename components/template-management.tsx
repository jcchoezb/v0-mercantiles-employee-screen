"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { plantillasMensajeApi } from "@/lib/api-service"
import { useAuth } from "@/lib/auth-context"
import {
  Search,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Copy,
  Eye,
} from "lucide-react"

interface Plantilla {
  id: number
  empresaId: number
  empresaNombre: string
  codigo: string
  contenido: string
  esPregunta: boolean
  variables: string[]
  activo: boolean
}

const ITEMS_PER_PAGE = 10

export function TemplateManagement() {
  const { employee } = useAuth()
  const [plantillas, setPlantillas] = useState<Plantilla[]>([])
  const [filteredPlantillas, setFilteredPlantillas] = useState<Plantilla[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterTipo, setFilterTipo] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)

  // CRUD
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPlantilla, setEditingPlantilla] = useState<Plantilla | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [previewPlantilla, setPreviewPlantilla] = useState<Plantilla | null>(null)

  const [formData, setFormData] = useState({
    codigo: "",
    contenido: "",
    esPregunta: false,
    activo: true,
  })

  const fetchPlantillas = useCallback(async () => {
    if (!employee?.empresaId) return
    setIsLoading(true)
    try {
      const data = await plantillasMensajeApi.listarPorEmpresa(employee.empresaId)
      const mapped: Plantilla[] = (data as Record<string, unknown>[]).map((p) => ({
        id: Number(p.id),
        empresaId: Number(p.empresaId ?? 0),
        empresaNombre: String(p.empresaNombre ?? ""),
        codigo: String(p.codigo ?? ""),
        contenido: String(p.contenido ?? ""),
        esPregunta: Boolean(p.esPregunta),
        variables: extractVariables(String(p.contenido ?? "")),
        activo: Boolean(p.activo),
      }))
      setPlantillas(mapped)
      setFilteredPlantillas(mapped)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cargar plantillas")
    } finally {
      setIsLoading(false)
    }
  }, [employee?.empresaId])

  useEffect(() => {
    fetchPlantillas()
  }, [fetchPlantillas])

  useEffect(() => {
    let filtered = plantillas
    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.contenido.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    if (filterTipo === "pregunta") {
      filtered = filtered.filter((p) => p.esPregunta === true)
    } else if (filterTipo === "respuesta") {
      filtered = filtered.filter((p) => p.esPregunta === false)
    }
    setFilteredPlantillas(filtered)
    setCurrentPage(1)
  }, [searchTerm, filterTipo, plantillas])

  // Extract variables from template content (e.g., {{nombre}}, {{email}})
  function extractVariables(content: string): string[] {
    const regex = /\{\{(\w+)\}\}/g
    const matches = content.match(regex)
    if (!matches) return []
    return [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, "")))]
  }

  // Pagination
  const totalPages = Math.ceil(filteredPlantillas.length / ITEMS_PER_PAGE)
  const paginatedPlantillas = filteredPlantillas.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleOpenDialog = (plantilla?: Plantilla) => {
    if (plantilla) {
      setEditingPlantilla(plantilla)
      setFormData({
        codigo: plantilla.codigo,
        contenido: plantilla.contenido,
        esPregunta: plantilla.esPregunta,
        activo: plantilla.activo,
      })
    } else {
      setEditingPlantilla(null)
      setFormData({ codigo: "", contenido: "", esPregunta: false, activo: true })
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.codigo.trim()) {
      toast.error("El codigo es obligatorio")
      return
    }
    if (!formData.contenido.trim()) {
      toast.error("El contenido es obligatorio")
      return
    }
    try {
      if (editingPlantilla) {
        await plantillasMensajeApi.actualizar(editingPlantilla.id, {
          empresaId: employee?.empresaId,
          codigo: formData.codigo,
          contenido: formData.contenido,
          esPregunta: formData.esPregunta,
          activo: formData.activo,
        })
        toast.success("Plantilla actualizada")
      } else {
        await plantillasMensajeApi.crear({
          empresaId: employee?.empresaId,
          codigo: formData.codigo,
          contenido: formData.contenido,
          esPregunta: formData.esPregunta,
          activo: formData.activo,
        })
        toast.success("Plantilla creada")
      }
      setIsDialogOpen(false)
      fetchPlantillas()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar plantilla")
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await plantillasMensajeApi.eliminar(deleteId)
      toast.success("Plantilla eliminada")
      setDeleteId(null)
      fetchPlantillas()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar plantilla")
    }
  }

  const handleToggle = async (plantilla: Plantilla) => {
    try {
      if (plantilla.activo) {
        await plantillasMensajeApi.desactivar(plantilla.id)
        toast.success("Plantilla desactivada")
      } else {
        await plantillasMensajeApi.activar(plantilla.id)
        toast.success("Plantilla activada")
      }
      fetchPlantillas()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cambiar estado")
    }
  }

  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content)
    toast.success("Contenido copiado al portapapeles")
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Plantillas de Mensaje</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona las plantillas de texto para el chatbot
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Plantilla
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar plantillas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-input border-border text-foreground"
          />
        </div>
        <Select value={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger className="w-[180px] bg-input border-border">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pregunta">Preguntas</SelectItem>
            <SelectItem value="respuesta">Respuestas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Codigo</TableHead>
                <TableHead className="text-muted-foreground hidden md:table-cell">Empresa</TableHead>
                <TableHead className="text-muted-foreground hidden md:table-cell">Tipo</TableHead>
                <TableHead className="text-muted-foreground hidden lg:table-cell">Variables</TableHead>
                <TableHead className="text-muted-foreground">Estado</TableHead>
                <TableHead className="text-muted-foreground text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : paginatedPlantillas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No se encontraron plantillas
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPlantillas.map((plantilla) => (
                  <TableRow key={plantilla.id} className="border-border">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{plantilla.codigo}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {plantilla.contenido.substring(0, 50)}...
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm text-muted-foreground">{plantilla.empresaNombre || "-"}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant={plantilla.esPregunta ? "default" : "secondary"}>
                        {plantilla.esPregunta ? "Pregunta" : "Respuesta"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {plantilla.variables.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {plantilla.variables.slice(0, 3).map((v) => (
                            <Badge key={v} variant="secondary" className="text-xs">
                              {`{{${v}}}`}
                            </Badge>
                          ))}
                          {plantilla.variables.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{plantilla.variables.length - 3}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sin variables</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={plantilla.activo ? "default" : "secondary"}
                        className="cursor-pointer"
                        onClick={() => handleToggle(plantilla)}
                      >
                        {plantilla.activo ? "Activa" : "Inactiva"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setPreviewPlantilla(plantilla)}
                          title="Vista previa"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleCopyContent(plantilla.contenido)}
                          title="Copiar contenido"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenDialog(plantilla)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setDeleteId(plantilla.id)}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{" "}
            {Math.min(currentPage * ITEMS_PER_PAGE, filteredPlantillas.length)} de{" "}
            {filteredPlantillas.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-foreground">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editingPlantilla ? "Editar Plantilla" : "Nueva Plantilla"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingPlantilla
                ? "Modifica la informacion de la plantilla"
                : "Crea una nueva plantilla de mensaje para el chatbot"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-foreground text-sm">Codigo</Label>
              <Input
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                placeholder="Ej: SALUDO_INICIAL"
                className="bg-input border-border text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.esPregunta}
                onCheckedChange={(checked) => setFormData({ ...formData, esPregunta: checked })}
              />
              <Label className="text-foreground text-sm">Es una pregunta</Label>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground text-sm">Contenido</Label>
              <Textarea
                value={formData.contenido}
                onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
                placeholder="Hola {{nombre}}, gracias por contactarnos..."
                className="bg-input border-border text-sm min-h-[150px]"
              />
              <p className="text-xs text-muted-foreground">
                Usa {"{{variable}}"} para insertar variables dinamicas. Ej: {"{{nombre}}"}, {"{{email}}"}
              </p>
            </div>
            {formData.contenido && extractVariables(formData.contenido).length > 0 && (
              <div className="space-y-2">
                <Label className="text-foreground text-sm">Variables detectadas</Label>
                <div className="flex flex-wrap gap-2">
                  {extractVariables(formData.contenido).map((v) => (
                    <Badge key={v} variant="secondary">
                      {`{{${v}}}`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.activo}
                onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
              />
              <Label className="text-foreground text-sm">Plantilla activa</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingPlantilla ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewPlantilla} onOpenChange={() => setPreviewPlantilla(null)}>
        <DialogContent className="bg-card border-border sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-foreground">{previewPlantilla?.codigo}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Vista previa de la plantilla
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2">
              <Badge variant={previewPlantilla?.esPregunta ? "default" : "secondary"}>
                {previewPlantilla?.esPregunta ? "Pregunta" : "Respuesta"}
              </Badge>
              <Badge variant={previewPlantilla?.activo ? "default" : "secondary"}>
                {previewPlantilla?.activo ? "Activa" : "Inactiva"}
              </Badge>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-foreground whitespace-pre-wrap">{previewPlantilla?.contenido}</p>
            </div>
            {previewPlantilla?.variables && previewPlantilla.variables.length > 0 && (
              <div className="space-y-2">
                <Label className="text-foreground text-sm">Variables</Label>
                <div className="flex flex-wrap gap-2">
                  {previewPlantilla.variables.map((v) => (
                    <Badge key={v} variant="secondary">
                      {`{{${v}}}`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewPlantilla(null)}>
              Cerrar
            </Button>
            <Button onClick={() => handleCopyContent(previewPlantilla?.contenido ?? "")}>
              <Copy className="h-4 w-4 mr-2" />
              Copiar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Eliminar Plantilla</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Esta accion no se puede deshacer. Se eliminara permanentemente esta plantilla.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted text-foreground">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

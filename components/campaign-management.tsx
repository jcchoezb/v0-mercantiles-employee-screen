"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { origenesApi, origenContextoApi, productosApi, categoriasApi, citasApi, cotizacionesApi, encuestasApi, documentosApi, clientesApi } from "@/lib/api-service"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
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
import { Switch } from "@/components/ui/switch"
import {
  Search,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Download,
  Megaphone,
  Copy,
  Eye,
  Package,
  ArrowLeft,
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

interface Campaign {
  id: number
  codigoOrigen: string
  tipoOrigen: string
  nombre: string
  descripcion: string
  activo: boolean
  identificadorUnicoClic: string
  fechaRegistro: string
}

interface ContextItem {
  id: number
  origenId: number
  tipoEntidad: string
  entidadId: number
  datosContexto: Record<string, unknown>
  prioridad: number
  createdAt: string
}

interface ProductOption {
  id: number
  nombre: string
  precio: number
}

interface CategoryOption {
  id: number
  nombre: string
}

interface GenericOption {
  id: number
  nombre: string
}

const TIPO_ORIGEN_OPTIONS = [
  { value: "publicidad_facebook", label: "Publicidad Facebook" },
  { value: "publicidad_instagram", label: "Publicidad Instagram" },
  { value: "post_instagram", label: "Post Instagram" },
  { value: "post_facebook", label: "Post Facebook" },
  { value: "google_ads", label: "Google Ads" },
  { value: "email_marketing", label: "Email Marketing" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "referido", label: "Referido" },
  { value: "web", label: "Sitio Web" },
  { value: "otro", label: "Otro" },
]

const TIPO_ENTIDAD_OPTIONS = [
  { value: "producto", label: "Producto" },
  { value: "categoria_producto", label: "Categoria de Producto" },
  { value: "cotizacion", label: "Cotizacion" },
  { value: "cita", label: "Cita" },
  { value: "encuesta", label: "Encuesta" },
  { value: "documento", label: "Documento" },
  { value: "campana", label: "Otra Campana" },
  { value: "cliente_interes", label: "Cliente de Interes" },
]

export function CampaignManagement() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [tipoFilter, setTipoFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  // Detail panel state
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [contextItems, setContextItems] = useState<ContextItem[]>([])
  const [isLoadingContext, setIsLoadingContext] = useState(false)
  const [isContextDialogOpen, setIsContextDialogOpen] = useState(false)
  const [editingContext, setEditingContext] = useState<ContextItem | null>(null)
  const [products, setProducts] = useState<ProductOption[]>([])
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [cotizaciones, setCotizaciones] = useState<GenericOption[]>([])
  const [citas, setCitas] = useState<GenericOption[]>([])
  const [encuestas, setEncuestas] = useState<GenericOption[]>([])
  const [documentos, setDocumentos] = useState<GenericOption[]>([])
  const [campanas, setCampanas] = useState<GenericOption[]>([])
  const [clientes, setClientes] = useState<GenericOption[]>([])

  const [formData, setFormData] = useState({
    codigoOrigen: "",
    tipoOrigen: "",
    nombre: "",
    descripcion: "",
    activo: true,
  })

  const [contextFormData, setContextFormData] = useState({
    tipoEntidad: "producto",
    entidadId: "",
    prioridad: 10,
  })

  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await origenesApi.listar()
      const mapped: Campaign[] = (data as Record<string, unknown>[]).map((c) => ({
        id: Number(c.id),
        codigoOrigen: String(c.codigoOrigen ?? ""),
        tipoOrigen: String(c.tipoOrigen ?? ""),
        nombre: String(c.nombre ?? ""),
        descripcion: String(c.descripcion ?? ""),
        activo: Boolean(c.activo),
        identificadorUnicoClic: String(c.identificadorUnicoClic ?? ""),
        fechaRegistro: String(c.fechaRegistro ?? ""),
      }))
      setCampaigns(mapped)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cargar campanas")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchProducts = useCallback(async () => {
    try {
      const data = await productosApi.activos()
      const mapped: ProductOption[] = (data as Record<string, unknown>[]).map((p) => ({
        id: Number(p.id),
        nombre: String(p.nombre ?? ""),
        precio: Number(p.precio ?? 0),
      }))
      setProducts(mapped)
    } catch {
      // silently fail
    }
  }, [])

  const fetchCategories = useCallback(async () => {
    try {
      const data = await categoriasApi.listar()
      const mapped: CategoryOption[] = (data as Record<string, unknown>[])
        .filter((c) => c.activo)
        .map((c) => ({
          id: Number(c.id),
          nombre: String(c.nombre ?? ""),
        }))
      setCategories(mapped)
    } catch {
      // silently fail
    }
  }, [])

  const fetchCotizaciones = useCallback(async () => {
    try {
      const data = await cotizacionesApi.listar()
      const mapped: GenericOption[] = (data as Record<string, unknown>[]).map((c) => ({
        id: Number(c.id),
        nombre: String(c.titulo ?? c.descripcion ?? `Cotizacion #${c.id}`),
      }))
      setCotizaciones(mapped)
    } catch {
      // silently fail
    }
  }, [])

  const fetchCitas = useCallback(async () => {
    try {
      const data = await citasApi.listar()
      const mapped: GenericOption[] = (data as Record<string, unknown>[]).map((c) => ({
        id: Number(c.id),
        nombre: String(c.titulo ?? `Cita #${c.id}`),
      }))
      setCitas(mapped)
    } catch {
      // silently fail
    }
  }, [])

  const fetchEncuestas = useCallback(async () => {
    try {
      const data = await encuestasApi.listar()
      const mapped: GenericOption[] = (data as Record<string, unknown>[]).map((c) => ({
        id: Number(c.id),
        nombre: String(c.titulo ?? c.nombre ?? `Encuesta #${c.id}`),
      }))
      setEncuestas(mapped)
    } catch {
      // silently fail
    }
  }, [])

  const fetchDocumentos = useCallback(async () => {
    try {
      const data = await documentosApi.listar()
      const mapped: GenericOption[] = (data as Record<string, unknown>[]).map((c) => ({
        id: Number(c.id),
        nombre: String(c.nombre ?? c.titulo ?? `Documento #${c.id}`),
      }))
      setDocumentos(mapped)
    } catch {
      // silently fail
    }
  }, [])

  const fetchCampanasForContext = useCallback(async () => {
    try {
      const data = await origenesApi.listarActivos()
      const mapped: GenericOption[] = (data as Record<string, unknown>[]).map((c) => ({
        id: Number(c.id),
        nombre: String(c.nombre ?? `Campana #${c.id}`),
      }))
      setCampanas(mapped)
    } catch {
      // silently fail
    }
  }, [])

  const fetchClientes = useCallback(async () => {
    try {
      const data = await clientesApi.listar()
      const mapped: GenericOption[] = (data as Record<string, unknown>[]).map((c) => ({
        id: Number(c.id),
        nombre: String(c.nombre ?? "") + " " + String(c.apellido ?? ""),
      }))
      setClientes(mapped)
    } catch {
      // silently fail
    }
  }, [])

  const fetchContextItems = useCallback(async (origenId: number) => {
    setIsLoadingContext(true)
    try {
      const data = await origenContextoApi.listarPorOrigen(origenId)
      const mapped: ContextItem[] = (data as Record<string, unknown>[]).map((c) => ({
        id: Number(c.id),
        origenId: Number(c.origenId),
        tipoEntidad: String(c.tipoEntidad ?? ""),
        entidadId: Number(c.entidadId),
        datosContexto: (c.datosContexto as Record<string, unknown>) ?? {},
        prioridad: Number(c.prioridad ?? 0),
        createdAt: String(c.createdAt ?? ""),
      }))
      setContextItems(mapped)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cargar contexto")
    } finally {
      setIsLoadingContext(false)
    }
  }, [])

  useEffect(() => {
    fetchCampaigns()
    fetchProducts()
    fetchCategories()
    fetchCotizaciones()
    fetchCitas()
    fetchEncuestas()
    fetchDocumentos()
    fetchCampanasForContext()
    fetchClientes()
  }, [fetchCampaigns, fetchProducts, fetchCategories, fetchCotizaciones, fetchCitas, fetchEncuestas, fetchDocumentos, fetchCampanasForContext, fetchClientes])

  useEffect(() => {
    if (selectedCampaign) {
      fetchContextItems(selectedCampaign.id)
    }
  }, [selectedCampaign, fetchContextItems])

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch =
      c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.codigoOrigen.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTipo = tipoFilter === "all" || c.tipoOrigen === tipoFilter
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && c.activo) ||
      (statusFilter === "inactive" && !c.activo)
    return matchesSearch && matchesTipo && matchesStatus
  })

  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage)
  const paginatedCampaigns = filteredCampaigns.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleDownload = () => {
    const headers = ["Codigo", "Tipo", "Nombre", "Descripcion", "UUID", "Fecha", "Estado"]
    const rows = filteredCampaigns.map((c) => [
      c.codigoOrigen,
      c.tipoOrigen,
      c.nombre,
      c.descripcion,
      c.identificadorUnicoClic,
      c.fechaRegistro,
      c.activo ? "Activo" : "Inactivo",
    ])
    downloadCSV("campanas", headers, rows)
  }

  const handleOpenDialog = (campaign?: Campaign) => {
    if (campaign) {
      setEditingCampaign(campaign)
      setFormData({
        codigoOrigen: campaign.codigoOrigen,
        tipoOrigen: campaign.tipoOrigen,
        nombre: campaign.nombre,
        descripcion: campaign.descripcion,
        activo: campaign.activo,
      })
    } else {
      setEditingCampaign(null)
      setFormData({
        codigoOrigen: "",
        tipoOrigen: "",
        nombre: "",
        descripcion: "",
        activo: true,
      })
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      if (editingCampaign) {
        await origenesApi.actualizar(editingCampaign.id, {
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          activo: formData.activo,
        })
        toast.success("Campana actualizada correctamente")
      } else {
        await origenesApi.crear({
          codigoOrigen: formData.codigoOrigen,
          tipoOrigen: formData.tipoOrigen,
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          activo: formData.activo,
        })
        toast.success("Campana creada correctamente")
      }
      setIsDialogOpen(false)
      fetchCampaigns()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar campana")
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await origenesApi.eliminar(id)
      toast.success("Campana eliminada correctamente")
      if (selectedCampaign?.id === id) {
        setSelectedCampaign(null)
      }
      fetchCampaigns()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar campana")
    }
  }

  const handleToggleStatus = async (campaign: Campaign) => {
    try {
      if (campaign.activo) {
        await origenesApi.desactivar(campaign.id)
        toast.success("Campana desactivada")
      } else {
        await origenesApi.activar(campaign.id)
        toast.success("Campana activada")
      }
      fetchCampaigns()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cambiar estado")
    }
  }

  // Context handlers
  const handleOpenContextDialog = (ctx?: ContextItem) => {
    if (ctx) {
      setEditingContext(ctx)
      setContextFormData({
        tipoEntidad: ctx.tipoEntidad,
        entidadId: String(ctx.entidadId),
        prioridad: ctx.prioridad,
      })
    } else {
      setEditingContext(null)
      setContextFormData({
        tipoEntidad: "producto",
        entidadId: "",
        prioridad: 10,
      })
    }
    setIsContextDialogOpen(true)
  }

  const getEntityName = (tipoEntidad: string, entidadId: number): string => {
    switch (tipoEntidad) {
      case "producto":
        return products.find((p) => p.id === entidadId)?.nombre ?? ""
      case "categoria_producto":
        return categories.find((c) => c.id === entidadId)?.nombre ?? ""
      case "cotizacion":
        return cotizaciones.find((c) => c.id === entidadId)?.nombre ?? ""
      case "cita":
        return citas.find((c) => c.id === entidadId)?.nombre ?? ""
      case "encuesta":
        return encuestas.find((e) => e.id === entidadId)?.nombre ?? ""
      case "documento":
        return documentos.find((d) => d.id === entidadId)?.nombre ?? ""
      case "campana":
        return campanas.find((c) => c.id === entidadId)?.nombre ?? ""
      case "cliente_interes":
        return clientes.find((c) => c.id === entidadId)?.nombre ?? ""
      default:
        return ""
    }
  }

  const handleSaveContext = async () => {
    if (!selectedCampaign) return
    
    const newEntidadId = Number(contextFormData.entidadId)
    const newTipoEntidad = contextFormData.tipoEntidad

    // Check for duplicates (exclude current item if editing)
    const isDuplicate = contextItems.some(
      (item) =>
        item.tipoEntidad === newTipoEntidad &&
        item.entidadId === newEntidadId &&
        (!editingContext || item.id !== editingContext.id)
    )

    if (isDuplicate) {
      toast.error("Esta entidad ya existe en el contexto de la campana")
      return
    }

    try {
      const entityName = getEntityName(newTipoEntidad, newEntidadId)
      const datosContexto: Record<string, unknown> = { nombre: entityName }
      
      // Add price for products
      if (newTipoEntidad === "producto") {
        const selectedProduct = products.find((p) => p.id === newEntidadId)
        if (selectedProduct) {
          datosContexto.precio = selectedProduct.precio
        }
      }

      if (editingContext) {
        await origenContextoApi.actualizar(editingContext.id, {
          origenId: selectedCampaign.id,
          tipoEntidad: newTipoEntidad,
          entidadId: newEntidadId,
          datosContexto,
          prioridad: contextFormData.prioridad,
        })
        toast.success("Contexto actualizado")
      } else {
        await origenContextoApi.crear({
          origenId: selectedCampaign.id,
          tipoEntidad: contextFormData.tipoEntidad,
          entidadId: Number(contextFormData.entidadId),
          datosContexto: selectedProduct
            ? { nombre: selectedProduct.nombre, precio: selectedProduct.precio }
            : {},
          prioridad: contextFormData.prioridad,
        })
        toast.success("Contexto agregado")
      }
      setIsContextDialogOpen(false)
      fetchContextItems(selectedCampaign.id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar contexto")
    }
  }

  const handleDeleteContext = async (id: number) => {
    if (!selectedCampaign) return
    try {
      await origenContextoApi.eliminar(id)
      toast.success("Contexto eliminado")
      fetchContextItems(selectedCampaign.id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar contexto")
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("UUID copiado al portapapeles")
  }

  const getTipoLabel = (tipo: string) => {
    return TIPO_ORIGEN_OPTIONS.find((t) => t.value === tipo)?.label ?? tipo
  }

  const isFormValid = editingCampaign
    ? formData.nombre.trim() !== ""
    : formData.codigoOrigen.trim() !== "" &&
      formData.tipoOrigen.trim() !== "" &&
      formData.nombre.trim() !== ""

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    )
  }

  // Detail view (when a campaign is selected)
  if (selectedCampaign) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedCampaign(null)}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-foreground">{selectedCampaign.nombre}</h2>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Campaign Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground border-b border-border pb-2">
                Informacion de la Campana
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Codigo:</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded">{selectedCampaign.codigoOrigen}</code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tipo:</span>
                  <span className="text-sm text-foreground">{getTipoLabel(selectedCampaign.tipoOrigen)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Estado:</span>
                  <Badge
                    variant={selectedCampaign.activo ? "default" : "secondary"}
                    className={`text-xs cursor-pointer ${
                      selectedCampaign.activo
                        ? "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20"
                        : "bg-muted text-muted-foreground"
                    }`}
                    onClick={() => handleToggleStatus(selectedCampaign)}
                  >
                    {selectedCampaign.activo ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">UUID:</span>
                  <div className="flex items-center gap-1">
                    <code className="text-xs bg-muted px-2 py-1 rounded max-w-[180px] truncate">
                      {selectedCampaign.identificadorUnicoClic}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(selectedCampaign.identificadorUnicoClic)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Fecha:</span>
                  <span className="text-sm text-foreground">{selectedCampaign.fechaRegistro}</span>
                </div>
                {selectedCampaign.descripcion && (
                  <div className="pt-2">
                    <span className="text-sm text-muted-foreground">Descripcion:</span>
                    <p className="text-sm text-foreground mt-1">{selectedCampaign.descripcion}</p>
                  </div>
                )}
              </div>

            </div>

            {/* Context Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h3 className="text-sm font-medium text-foreground">Contexto de Campana</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenContextDialog()}
                  className="h-7 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Agregar
                </Button>
              </div>

              {isLoadingContext ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                </div>
              ) : contextItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay productos o entidades vinculadas</p>
                </div>
              ) : (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {contextItems.map((ctx) => {
                      const productName = ctx.datosContexto?.nombre
                        ? String(ctx.datosContexto.nombre)
                        : products.find((p) => p.id === ctx.entidadId)?.nombre ?? `ID: ${ctx.entidadId}`
                      return (
                        <div
                          key={ctx.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Package className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{productName}</p>
                              <p className="text-xs text-muted-foreground">
                                {ctx.tipoEntidad} - Prioridad: {ctx.prioridad}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenContextDialog(ctx)}
                              className="h-7 w-7"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteContext(ctx.id)}
                              className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        </CardContent>

        {/* Context Dialog */}
        <Dialog open={isContextDialogOpen} onOpenChange={setIsContextDialogOpen}>
          <DialogContent className="bg-card border-border sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {editingContext ? "Editar Contexto" : "Agregar Contexto"}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Vincula un producto o entidad a esta campana
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {!editingContext && (
                <div className="space-y-2">
                  <Label className="text-foreground text-sm">Tipo de Entidad</Label>
                  <Select
                    value={contextFormData.tipoEntidad}
                    onValueChange={(value) =>
                      setContextFormData({ ...contextFormData, tipoEntidad: value, entidadId: "" })
                    }
                  >
                    <SelectTrigger className="bg-input border-border text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {TIPO_ENTIDAD_OPTIONS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {contextFormData.tipoEntidad === "producto" && (
                <div className="space-y-2">
                  <Label className="text-foreground text-sm">Producto</Label>
                  {products.length > 0 ? (
                    <Select
                      value={contextFormData.entidadId}
                      onValueChange={(value) =>
                        setContextFormData({ ...contextFormData, entidadId: value })
                      }
                    >
                      <SelectTrigger className="bg-input border-border text-sm">
                        <SelectValue placeholder="Seleccionar producto..." />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                  {products.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.id} - {p.nombre}
                        </SelectItem>
                      ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">No hay productos disponibles</p>
                  )}
                </div>
              )}
              {contextFormData.tipoEntidad === "categoria_producto" && (
                <div className="space-y-2">
                  <Label className="text-foreground text-sm">Categoria de Producto</Label>
                  {categories.length > 0 ? (
                    <Select
                      value={contextFormData.entidadId}
                      onValueChange={(value) =>
                        setContextFormData({ ...contextFormData, entidadId: value })
                      }
                    >
                      <SelectTrigger className="bg-input border-border text-sm">
                        <SelectValue placeholder="Seleccionar categoria..." />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">No hay categorias disponibles</p>
                  )}
                </div>
              )}
              {contextFormData.tipoEntidad === "cotizacion" && (
                <div className="space-y-2">
                  <Label className="text-foreground text-sm">Cotizacion</Label>
                  {cotizaciones.length > 0 ? (
                    <Select
                      value={contextFormData.entidadId}
                      onValueChange={(value) =>
                        setContextFormData({ ...contextFormData, entidadId: value })
                      }
                    >
                      <SelectTrigger className="bg-input border-border text-sm">
                        <SelectValue placeholder="Seleccionar cotizacion..." />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {cotizaciones.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">No hay cotizaciones disponibles</p>
                  )}
                </div>
              )}
              {contextFormData.tipoEntidad === "cita" && (
                <div className="space-y-2">
                  <Label className="text-foreground text-sm">Cita</Label>
                  {citas.length > 0 ? (
                    <Select
                      value={contextFormData.entidadId}
                      onValueChange={(value) =>
                        setContextFormData({ ...contextFormData, entidadId: value })
                      }
                    >
                      <SelectTrigger className="bg-input border-border text-sm">
                        <SelectValue placeholder="Seleccionar cita..." />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {citas.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">No hay citas disponibles</p>
                  )}
                </div>
              )}
              {contextFormData.tipoEntidad === "encuesta" && (
                <div className="space-y-2">
                  <Label className="text-foreground text-sm">Encuesta</Label>
                  {encuestas.length > 0 ? (
                    <Select
                      value={contextFormData.entidadId}
                      onValueChange={(value) =>
                        setContextFormData({ ...contextFormData, entidadId: value })
                      }
                    >
                      <SelectTrigger className="bg-input border-border text-sm">
                        <SelectValue placeholder="Seleccionar encuesta..." />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {encuestas.map((e) => (
                          <SelectItem key={e.id} value={String(e.id)}>
                            {e.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">No hay encuestas disponibles</p>
                  )}
                </div>
              )}
              {contextFormData.tipoEntidad === "documento" && (
                <div className="space-y-2">
                  <Label className="text-foreground text-sm">Documento</Label>
                  {documentos.length > 0 ? (
                    <Select
                      value={contextFormData.entidadId}
                      onValueChange={(value) =>
                        setContextFormData({ ...contextFormData, entidadId: value })
                      }
                    >
                      <SelectTrigger className="bg-input border-border text-sm">
                        <SelectValue placeholder="Seleccionar documento..." />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {documentos.map((d) => (
                          <SelectItem key={d.id} value={String(d.id)}>
                            {d.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">No hay documentos disponibles</p>
                  )}
                </div>
              )}
              {contextFormData.tipoEntidad === "campana" && (
                <div className="space-y-2">
                  <Label className="text-foreground text-sm">Otra Campana</Label>
                  {campanas.length > 0 ? (
                    <Select
                      value={contextFormData.entidadId}
                      onValueChange={(value) =>
                        setContextFormData({ ...contextFormData, entidadId: value })
                      }
                    >
                      <SelectTrigger className="bg-input border-border text-sm">
                        <SelectValue placeholder="Seleccionar campana..." />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {campanas.filter((c) => c.id !== selectedCampaign?.id).map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">No hay campanas disponibles</p>
                  )}
                </div>
              )}
              {contextFormData.tipoEntidad === "cliente_interes" && (
                <div className="space-y-2">
                  <Label className="text-foreground text-sm">Cliente de Interes</Label>
                  {clientes.length > 0 ? (
                    <Select
                      value={contextFormData.entidadId}
                      onValueChange={(value) =>
                        setContextFormData({ ...contextFormData, entidadId: value })
                      }
                    >
                      <SelectTrigger className="bg-input border-border text-sm">
                        <SelectValue placeholder="Seleccionar cliente..." />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {clientes.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">No hay clientes disponibles</p>
                  )}
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-foreground text-sm">Prioridad (1-100)</Label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={contextFormData.prioridad}
                  onChange={(e) =>
                    setContextFormData({ ...contextFormData, prioridad: Number(e.target.value) })
                  }
                  className="bg-input border-border text-sm"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsContextDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSaveContext}
                disabled={!editingContext && !contextFormData.entidadId}
              >
                {editingContext ? "Actualizar" : "Agregar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


      </Card>
    )
  }

  // List view (default)
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-2 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar campana..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-10 bg-input border-border text-foreground text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Select
                value={tipoFilter}
                onValueChange={(v) => {
                  setTipoFilter(v)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-[160px] bg-input border-border text-sm">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {TIPO_ORIGEN_OPTIONS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-[130px] bg-input border-border text-sm">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
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
                  <span className="hidden sm:inline">Nueva</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="text-foreground">
                    {editingCampaign ? "Editar Campana" : "Nueva Campana"}
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    {editingCampaign
                      ? "Modifica los datos de la campana"
                      : "Completa los datos para crear una nueva campana"}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {!editingCampaign && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-foreground text-sm">Codigo de Origen *</Label>
                        <Input
                          value={formData.codigoOrigen}
                          onChange={(e) =>
                            setFormData({ ...formData, codigoOrigen: e.target.value.toUpperCase() })
                          }
                          placeholder="Ej: FB_VIDEO_MARZO"
                          className="bg-input border-border text-foreground text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground text-sm">Tipo de Origen *</Label>
                        <Select
                          value={formData.tipoOrigen}
                          onValueChange={(value) => setFormData({ ...formData, tipoOrigen: value })}
                        >
                          <SelectTrigger className="bg-input border-border text-foreground text-sm">
                            <SelectValue placeholder="Seleccionar tipo..." />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            {TIPO_ORIGEN_OPTIONS.map((t) => (
                              <SelectItem key={t.value} value={t.value}>
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                  <div className="space-y-2">
                    <Label className="text-foreground text-sm">Nombre *</Label>
                    <Input
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      placeholder="Nombre de la campana"
                      className="bg-input border-border text-foreground text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground text-sm">Descripcion</Label>
                    <Textarea
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      placeholder="Descripcion de la campana"
                      className="bg-input border-border text-foreground text-sm resize-none"
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-foreground text-sm">Estado Activo</Label>
                    <Switch
                      checked={formData.activo}
                      onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={!isFormValid}>
                    {editingCampaign ? "Actualizar" : "Crear"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Table */}
        <div className="rounded-md border border-border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Codigo</TableHead>
                <TableHead className="text-muted-foreground">Nombre</TableHead>
                <TableHead className="text-muted-foreground hidden md:table-cell">Tipo</TableHead>
                <TableHead className="text-muted-foreground">Estado</TableHead>
                <TableHead className="text-right text-muted-foreground">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCampaigns.map((campaign) => (
                <TableRow key={campaign.id} className="border-border">
                  <TableCell className="font-medium text-foreground">
                    <code className="text-xs bg-muted px-2 py-1 rounded">{campaign.codigoOrigen}</code>
                  </TableCell>
                  <TableCell className="text-foreground">{campaign.nombre}</TableCell>
                  <TableCell className="text-muted-foreground text-sm hidden md:table-cell">
                    {getTipoLabel(campaign.tipoOrigen)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={campaign.activo ? "default" : "secondary"}
                      className={`text-xs cursor-pointer ${
                        campaign.activo
                          ? "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20"
                          : "bg-muted text-muted-foreground"
                      }`}
                      onClick={() => handleToggleStatus(campaign)}
                    >
                      {campaign.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedCampaign(campaign)}
                        className="h-8 w-8 text-primary hover:bg-primary/10"
                        title="Ver detalles"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(campaign.identificadorUnicoClic)}
                        className="h-8 w-8 text-muted-foreground hover:bg-secondary"
                        title="Copiar UUID"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(campaign)}
                        className="h-8 w-8 text-foreground hover:bg-secondary"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(campaign.id)}
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
          <div className="flex items-center justify-between pt-4">
            <span className="text-sm text-muted-foreground">
              Mostrando {(currentPage - 1) * itemsPerPage + 1} -{" "}
              {Math.min(currentPage * itemsPerPage, filteredCampaigns.length)} de{" "}
              {filteredCampaigns.length}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-foreground px-2">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

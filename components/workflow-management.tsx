"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { workflowsApi, workflowStepsApi, apiConfigsApi, plantillasMensajeApi } from "@/lib/api-service"
import { useAuth } from "@/lib/auth-context"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  Search,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  GitBranch,
  MessageSquare,
  Globe,
  UserCheck,
  GripVertical,
  ArrowLeft,
  Settings,
  Zap,
} from "lucide-react"

interface Workflow {
  id: number
  empresaId: number
  nombre: string
  descripcion: string
  palabraClave: string
  requiereAsignacionHumana: boolean
  activo: boolean
  empresaNombre?: string
  fechaCreacion: string
}

interface WorkflowStep {
  id: number
  workflowId: number
  workflowNombre?: string
  orden: number
  tipo: string
  plantillaId?: number
  plantillaCodigo?: string
  plantillaContenido?: string
  campoDestino?: string
  apiConfigId?: number
  apiConfigNombre?: string
  apiMapping?: string
}

interface ApiConfig {
  id: number
  nombre: string
}

interface Plantilla {
  id: number
  codigo: string
  contenido: string
  }

const STEP_TYPES = [
  { value: "PREGUNTA", label: "Pregunta", icon: MessageSquare, color: "bg-blue-500" },
  { value: "MENSAJE", label: "Mensaje", icon: MessageSquare, color: "bg-green-500" },
  { value: "LLAMADA_API", label: "Llamada API", icon: Globe, color: "bg-purple-500" },
  { value: "DERIVAR_HUMANO", label: "Derivar a Humano", icon: UserCheck, color: "bg-orange-500" },
  { value: "CONDICION", label: "Condicion", icon: GitBranch, color: "bg-yellow-500" },
]

const ITEMS_PER_PAGE = 10

// Sortable Step Component
function SortableStep({
  step,
  onEdit,
  onDelete,
}: {
  step: WorkflowStep
  onEdit: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: step.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const stepType = STEP_TYPES.find((t) => t.value === step.tipo)
  const StepIcon = stepType?.icon ?? Zap

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <div className={`p-2 rounded-lg ${stepType?.color ?? "bg-muted"}`}>
        <StepIcon className="h-4 w-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">Paso {step.orden}</span>
          <Badge variant="outline" className="text-xs">
            {stepType?.label ?? step.tipo}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {step.plantillaCodigo 
            ? `Plantilla: ${step.plantillaCodigo}` 
            : step.campoDestino 
              ? `Campo: ${step.campoDestino}` 
              : step.apiConfigNombre 
                ? `API: ${step.apiConfigNombre}` 
                : `Tipo: ${stepType?.label ?? step.tipo}`}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export function WorkflowManagement() {
  const { employee } = useAuth()
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [filteredWorkflows, setFilteredWorkflows] = useState<Workflow[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)

  // Workflow CRUD
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null)
  const [deleteWorkflowId, setDeleteWorkflowId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    empresaId: "",
    nombre: "",
    descripcion: "",
    palabraClave: "",
    requiereAsignacionHumana: false,
    activo: true,
  })

  // Workflow Builder View
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)
  const [steps, setSteps] = useState<WorkflowStep[]>([])
  const [isStepDialogOpen, setIsStepDialogOpen] = useState(false)
  const [editingStep, setEditingStep] = useState<WorkflowStep | null>(null)
  const [deleteStepId, setDeleteStepId] = useState<number | null>(null)
  const [stepFormData, setStepFormData] = useState({
    tipo: "PREGUNTA",
    plantillaId: undefined as number | undefined,
    campoDestino: "",
    apiConfigId: undefined as number | undefined,
    apiMapping: "",
  })

  // Options for selects
  const [apiConfigs, setApiConfigs] = useState<ApiConfig[]>([])
  const [plantillas, setPlantillas] = useState<Plantilla[]>([])

  // DnD
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const fetchWorkflows = useCallback(async () => {
    if (!employee?.empresaId) return
    setIsLoading(true)
    try {
      const data = await workflowsApi.porEmpresa(employee.empresaId)
      const mapped: Workflow[] = (data as Record<string, unknown>[]).map((w) => ({
        id: Number(w.id),
        empresaId: Number(w.empresaId ?? 0),
        nombre: String(w.nombre ?? ""),
        descripcion: String(w.descripcion ?? ""),
        palabraClave: String(w.palabraClave ?? ""),
        requiereAsignacionHumana: Boolean(w.requiereAsignacionHumana),
        activo: Boolean(w.activo),
        empresaNombre: w.empresa ? String((w.empresa as Record<string, unknown>).nombre ?? "") : undefined,
        fechaCreacion: String(w.fechaCreacion ?? ""),
      }))
      setWorkflows(mapped)
      setFilteredWorkflows(mapped)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cargar workflows")
    } finally {
      setIsLoading(false)
    }
  }, [employee?.empresaId])

  const fetchSteps = useCallback(async (workflowId: number) => {
    try {
      const data = await workflowStepsApi.porWorkflow(workflowId)
      const mapped: WorkflowStep[] = (data as Record<string, unknown>[]).map((s) => ({
        id: Number(s.id),
        workflowId: Number(s.workflowId),
        workflowNombre: s.workflowNombre ? String(s.workflowNombre) : undefined,
        orden: Number(s.orden ?? 0),
        tipo: String(s.tipo ?? "PREGUNTA"),
        plantillaId: s.plantillaId ? Number(s.plantillaId) : undefined,
        plantillaCodigo: s.plantillaCodigo ? String(s.plantillaCodigo) : undefined,
        plantillaContenido: s.plantillaContenido ? String(s.plantillaContenido) : undefined,
        campoDestino: s.campoDestino ? String(s.campoDestino) : undefined,
        apiConfigId: s.apiConfigId ? Number(s.apiConfigId) : undefined,
        apiConfigNombre: s.apiConfigNombre ? String(s.apiConfigNombre) : undefined,
        apiMapping: s.apiMapping ? String(s.apiMapping) : undefined,
      }))
      mapped.sort((a, b) => a.orden - b.orden)
      setSteps(mapped)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cargar pasos")
    }
  }, [])

  const fetchOptions = useCallback(async () => {
    try {
      const [apisData, plantillasData] = await Promise.all([
        apiConfigsApi.listar(),
        plantillasMensajeApi.listar(),
      ])
      setApiConfigs(
        (apisData as Record<string, unknown>[]).map((a) => ({
          id: Number(a.id),
          nombre: String(a.nombre ?? ""),
        }))
      )
setPlantillas(
  (plantillasData as Record<string, unknown>[]).map((p) => ({
  id: Number(p.id),
  codigo: String(p.codigo ?? ""),
  contenido: String(p.contenido ?? ""),
  }))
  )
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    fetchWorkflows()
    fetchOptions()
  }, [fetchWorkflows, fetchOptions])

  useEffect(() => {
    const filtered = workflows.filter(
      (w) =>
        w.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredWorkflows(filtered)
    setCurrentPage(1)
  }, [searchTerm, workflows])

  // Pagination
  const totalPages = Math.ceil(filteredWorkflows.length / ITEMS_PER_PAGE)
  const paginatedWorkflows = filteredWorkflows.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Workflow CRUD Handlers
  const handleOpenDialog = (workflow?: Workflow) => {
    if (workflow) {
      setEditingWorkflow(workflow)
      setFormData({
        empresaId: String(workflow.empresaId),
        nombre: workflow.nombre,
        descripcion: workflow.descripcion,
        palabraClave: workflow.palabraClave,
        requiereAsignacionHumana: workflow.requiereAsignacionHumana,
        activo: workflow.activo,
      })
    } else {
      setEditingWorkflow(null)
      setFormData({ empresaId: "", nombre: "", descripcion: "", palabraClave: "", requiereAsignacionHumana: false, activo: true })
    }
    setIsDialogOpen(true)
  }

  const handleSaveWorkflow = async () => {
    if (!formData.nombre.trim()) {
      toast.error("El nombre es obligatorio")
      return
    }
    if (!formData.palabraClave.trim()) {
      toast.error("La palabra clave es obligatoria")
      return
    }
    try {
      if (editingWorkflow) {
        await workflowsApi.actualizar(editingWorkflow.id, {
          empresaId: formData.empresaId ? Number(formData.empresaId) : undefined,
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          palabraClave: formData.palabraClave,
          requiereAsignacionHumana: formData.requiereAsignacionHumana,
          activo: formData.activo,
        })
        toast.success("Workflow actualizado")
      } else {
        await workflowsApi.crear({
          empresaId: employee?.empresaId ?? (formData.empresaId ? Number(formData.empresaId) : 0),
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          palabraClave: formData.palabraClave,
          requiereAsignacionHumana: formData.requiereAsignacionHumana,
          activo: formData.activo,
        })
        toast.success("Workflow creado")
      }
      setIsDialogOpen(false)
      fetchWorkflows()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar workflow")
    }
  }

  const handleDeleteWorkflow = async () => {
    if (!deleteWorkflowId) return
    try {
      await workflowsApi.eliminar(deleteWorkflowId)
      toast.success("Workflow eliminado")
      setDeleteWorkflowId(null)
      fetchWorkflows()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar workflow")
    }
  }

  const handleToggleWorkflow = async (workflow: Workflow) => {
    try {
      if (workflow.activo) {
        await workflowsApi.desactivar(workflow.id)
        toast.success("Workflow desactivado")
      } else {
        await workflowsApi.activar(workflow.id)
        toast.success("Workflow activado")
      }
      fetchWorkflows()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cambiar estado")
    }
  }

  // Step Builder Handlers
  const handleOpenBuilder = async (workflow: Workflow) => {
    setSelectedWorkflow(workflow)
    await fetchSteps(workflow.id)
  }

  const handleCloseBuilder = () => {
    setSelectedWorkflow(null)
    setSteps([])
  }

  const handleOpenStepDialog = (step?: WorkflowStep) => {
    if (step) {
      setEditingStep(step)
      setStepFormData({
        tipo: step.tipo,
        plantillaId: step.plantillaId,
        campoDestino: step.campoDestino ?? "",
        apiConfigId: step.apiConfigId,
        apiMapping: step.apiMapping ?? "",
      })
    } else {
      setEditingStep(null)
      setStepFormData({
        tipo: "PREGUNTA",
        plantillaId: undefined,
        campoDestino: "",
        apiConfigId: undefined,
        apiMapping: "",
      })
    }
    setIsStepDialogOpen(true)
  }

  const handleSaveStep = async () => {
    if (!selectedWorkflow) return
    try {
      if (editingStep) {
        await workflowStepsApi.actualizar(editingStep.id, {
          workflowId: selectedWorkflow.id,
          orden: editingStep.orden,
          tipo: stepFormData.tipo,
          plantillaId: stepFormData.plantillaId,
          campoDestino: stepFormData.campoDestino || undefined,
          apiConfigId: stepFormData.apiConfigId,
          apiMapping: stepFormData.apiMapping || undefined,
        })
        toast.success("Paso actualizado")
      } else {
        const newOrden = steps.length > 0 ? Math.max(...steps.map((s) => s.orden)) + 1 : 1
        await workflowStepsApi.crear({
          workflowId: selectedWorkflow.id,
          orden: newOrden,
          tipo: stepFormData.tipo,
          plantillaId: stepFormData.plantillaId,
          campoDestino: stepFormData.campoDestino || undefined,
          apiConfigId: stepFormData.apiConfigId,
          apiMapping: stepFormData.apiMapping || undefined,
        })
        toast.success("Paso creado")
      }
      setIsStepDialogOpen(false)
      fetchSteps(selectedWorkflow.id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar paso")
    }
  }

  const handleDeleteStep = async () => {
    if (!deleteStepId || !selectedWorkflow) return
    try {
      await workflowStepsApi.eliminar(deleteStepId)
      toast.success("Paso eliminado")
      setDeleteStepId(null)
      fetchSteps(selectedWorkflow.id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar paso")
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || !selectedWorkflow) return

    const oldIndex = steps.findIndex((s) => s.id === active.id)
    const newIndex = steps.findIndex((s) => s.id === over.id)

    const newSteps = arrayMove(steps, oldIndex, newIndex)
    setSteps(newSteps)

    // Update order in backend
    try {
      await Promise.all(
        newSteps.map((step, index) =>
          workflowStepsApi.actualizar(step.id, {
            workflowId: selectedWorkflow.id,
            orden: index + 1,
            tipo: step.tipo,
            plantillaId: step.plantillaId,
            campoDestino: step.campoDestino,
            apiConfigId: step.apiConfigId,
            apiMapping: step.apiMapping,
          })
        )
      )
      toast.success("Orden actualizado")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al reordenar")
      fetchSteps(selectedWorkflow.id)
    }
  }

  // Render Step Config Form based on type
  const renderStepConfigForm = () => {
    switch (stepFormData.tipo) {
      case "PREGUNTA":
        return (
          <>
            <div className="space-y-2">
              <Label className="text-foreground text-sm">Plantilla de la Pregunta</Label>
              <Select
                value={stepFormData.plantillaId ? String(stepFormData.plantillaId) : "none"}
                onValueChange={(value) =>
                  setStepFormData({
                    ...stepFormData,
                    plantillaId: value === "none" ? undefined : Number(value),
                  })
                }
              >
                <SelectTrigger className="bg-input border-border text-sm">
                  <SelectValue placeholder="Seleccionar plantilla..." />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="none">Sin plantilla</SelectItem>
                  {plantillas.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.codigo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground text-sm">Campo Destino (variable a guardar)</Label>
              <Input
                value={stepFormData.campoDestino}
                onChange={(e) =>
                  setStepFormData({
                    ...stepFormData,
                    campoDestino: e.target.value,
                  })
                }
                placeholder="nombre_cliente"
                className="bg-input border-border text-sm"
              />
            </div>
          </>
        )
      case "MENSAJE":
        return (
          <>
            <div className="space-y-2">
              <Label className="text-foreground text-sm">Plantilla del Mensaje</Label>
              <Select
                value={stepFormData.plantillaId ? String(stepFormData.plantillaId) : "none"}
                onValueChange={(value) =>
                  setStepFormData({
                    ...stepFormData,
                    plantillaId: value === "none" ? undefined : Number(value),
                  })
                }
              >
                <SelectTrigger className="bg-input border-border text-sm">
                  <SelectValue placeholder="Seleccionar plantilla..." />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="none">Sin plantilla</SelectItem>
                  {plantillas.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.codigo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )
      case "LLAMADA_API":
        return (
          <>
            <div className="space-y-2">
              <Label className="text-foreground text-sm">API a llamar</Label>
              <Select
                value={stepFormData.apiConfigId ? String(stepFormData.apiConfigId) : "none"}
                onValueChange={(value) =>
                  setStepFormData({
                    ...stepFormData,
                    apiConfigId: value === "none" ? undefined : Number(value),
                  })
                }
              >
                <SelectTrigger className="bg-input border-border text-sm">
                  <SelectValue placeholder="Seleccionar API..." />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="none">Sin API</SelectItem>
                  {apiConfigs.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground text-sm">API Mapping (JSON)</Label>
              <Textarea
                value={stepFormData.apiMapping}
                onChange={(e) =>
                  setStepFormData({
                    ...stepFormData,
                    apiMapping: e.target.value,
                  })
                }
                placeholder='{"campo_api": "campo_local"}'
                className="bg-input border-border text-sm min-h-[80px] font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground text-sm">Campo Destino</Label>
              <Input
                value={stepFormData.campoDestino}
                onChange={(e) =>
                  setStepFormData({
                    ...stepFormData,
                    campoDestino: e.target.value,
                  })
                }
                placeholder="resultado_api"
                className="bg-input border-border text-sm"
              />
            </div>
          </>
        )
      case "DERIVAR_HUMANO":
        return (
          <>
            <div className="space-y-2">
              <Label className="text-foreground text-sm">Plantilla de mensaje (opcional)</Label>
              <Select
                value={stepFormData.plantillaId ? String(stepFormData.plantillaId) : "none"}
                onValueChange={(value) =>
                  setStepFormData({
                    ...stepFormData,
                    plantillaId: value === "none" ? undefined : Number(value),
                  })
                }
              >
                <SelectTrigger className="bg-input border-border text-sm">
                  <SelectValue placeholder="Seleccionar plantilla..." />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="none">Sin plantilla</SelectItem>
                  {plantillas.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.codigo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )
      case "CONDICION":
        return (
          <>
            <div className="space-y-2">
              <Label className="text-foreground text-sm">Campo Destino (variable a evaluar)</Label>
              <Input
                value={stepFormData.campoDestino}
                onChange={(e) =>
                  setStepFormData({
                    ...stepFormData,
                    campoDestino: e.target.value,
                  })
                }
                placeholder="nombre_cliente"
                className="bg-input border-border text-sm"
              />
            </div>
          </>
        )
      default:
        return null
    }
  }

  // If in builder mode
  if (selectedWorkflow) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleCloseBuilder}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-foreground">
              {selectedWorkflow.nombre}
            </h1>
            <p className="text-sm text-muted-foreground">{selectedWorkflow.descripcion}</p>
          </div>
          <Badge variant={selectedWorkflow.activo ? "default" : "secondary"}>
            {selectedWorkflow.activo ? "Activo" : "Inactivo"}
          </Badge>
        </div>

        {/* Builder Area */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-foreground flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Pasos del Workflow
            </CardTitle>
            <Button size="sm" onClick={() => handleOpenStepDialog()}>
              <Plus className="h-4 w-4 mr-1" />
              Agregar Paso
            </Button>
          </CardHeader>
          <CardContent>
            {steps.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay pasos configurados</p>
                <p className="text-sm">Agrega pasos para construir el flujo del chatbot</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={steps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {steps.map((step) => (
                      <SortableStep
                        key={step.id}
                        step={step}
                        onEdit={() => handleOpenStepDialog(step)}
                        onDelete={() => setDeleteStepId(step.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </CardContent>
        </Card>

        {/* Step Dialog */}
        <Dialog open={isStepDialogOpen} onOpenChange={setIsStepDialogOpen}>
          <DialogContent className="bg-card border-border sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {editingStep ? "Editar Paso" : "Nuevo Paso"}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Configura el comportamiento de este paso del workflow
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label className="text-foreground text-sm">Tipo de Paso</Label>
                <Select
                  value={stepFormData.tipo}
                  onValueChange={(value) =>
                    setStepFormData({ 
                      ...stepFormData, 
                      tipo: value, 
                      plantillaId: undefined,
                      campoDestino: "",
                      apiConfigId: undefined,
                      apiMapping: "",
                    })
                  }
                >
                  <SelectTrigger className="bg-input border-border text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {STEP_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        <div className="flex items-center gap-2">
                          <t.icon className="h-4 w-4" />
                          {t.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {renderStepConfigForm()}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsStepDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveStep}>
                {editingStep ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Step Confirm */}
        <AlertDialog open={!!deleteStepId} onOpenChange={() => setDeleteStepId(null)}>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">Eliminar Paso</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                Esta accion no se puede deshacer. Se eliminara este paso del workflow.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-muted text-foreground">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteStep}
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

  // Main List View
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Gestion de Workflows</h1>
          <p className="text-sm text-muted-foreground">
            Configura los flujos automatizados del chatbot
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Workflow
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar workflows..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-input border-border text-foreground"
          />
        </div>
      </div>

      {/* Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Nombre</TableHead>
                <TableHead className="text-muted-foreground hidden md:table-cell">Palabra Clave</TableHead>
                <TableHead className="text-muted-foreground hidden lg:table-cell">Asignacion</TableHead>
                <TableHead className="text-muted-foreground">Estado</TableHead>
                <TableHead className="text-muted-foreground text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : paginatedWorkflows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No se encontraron workflows
                  </TableCell>
                </TableRow>
              ) : (
                paginatedWorkflows.map((workflow) => (
                  <TableRow key={workflow.id} className="border-border">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <GitBranch className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{workflow.nombre}</p>
                          {workflow.empresaNombre && (
                            <p className="text-xs text-muted-foreground">{workflow.empresaNombre}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className="font-mono text-xs">
                        {workflow.palabraClave || "-"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant={workflow.requiereAsignacionHumana ? "default" : "secondary"}>
                        {workflow.requiereAsignacionHumana ? "Humano" : "Automatico"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={workflow.activo ? "default" : "secondary"}
                        className="cursor-pointer"
                        onClick={() => handleToggleWorkflow(workflow)}
                      >
                        {workflow.activo ? (
                          <>
                            <Play className="h-3 w-3 mr-1" />
                            Activo
                          </>
                        ) : (
                          <>
                            <Pause className="h-3 w-3 mr-1" />
                            Inactivo
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenBuilder(workflow)}
                          title="Configurar pasos"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenDialog(workflow)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setDeleteWorkflowId(workflow.id)}
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
            {Math.min(currentPage * ITEMS_PER_PAGE, filteredWorkflows.length)} de{" "}
            {filteredWorkflows.length}
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

      {/* Workflow Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editingWorkflow ? "Editar Workflow" : "Nuevo Workflow"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingWorkflow
                ? "Modifica la informacion del workflow"
                : "Crea un nuevo flujo automatizado para el chatbot"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-foreground text-sm">Nombre</Label>
              <Input
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Flujo de Atencion al Cliente"
                className="bg-input border-border text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground text-sm">Descripcion</Label>
              <Textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Describe el proposito de este workflow..."
                className="bg-input border-border text-sm min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground text-sm">Palabra Clave</Label>
              <Input
                value={formData.palabraClave}
                onChange={(e) => setFormData({ ...formData, palabraClave: e.target.value })}
                placeholder="Ej: SOPORTE, VENTAS, AYUDA"
                className="bg-input border-border text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Palabra que activa este workflow cuando el usuario la escribe
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.requiereAsignacionHumana}
                onCheckedChange={(checked) => setFormData({ ...formData, requiereAsignacionHumana: checked })}
              />
              <Label className="text-foreground text-sm">Requiere asignacion humana</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.activo}
                onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
              />
              <Label className="text-foreground text-sm">Workflow activo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveWorkflow}>
              {editingWorkflow ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteWorkflowId} onOpenChange={() => setDeleteWorkflowId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Eliminar Workflow</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Esta accion no se puede deshacer. Se eliminaran tambien todos los pasos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted text-foreground">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWorkflow}
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

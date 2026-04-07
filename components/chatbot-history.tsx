"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { citasApi, cotizacionesApi, encuestasApi, documentosApi } from "@/lib/api-service"
import type { ChatbotRecord } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  Calendar,
  FileText,
  ClipboardList,
  MessageSquare,
  Receipt,
  CheckCircle,
  Clock,
  XCircle,
  ExternalLink,
  User,
  ChevronLeft,
  ChevronRight,
  Download,
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

export function ChatbotHistory() {
  const [records, setRecords] = useState<ChatbotRecord[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  const fetchRecords = useCallback(async () => {
    try {
      const allRecords: ChatbotRecord[] = []

      // Fetch citas
      try {
        const citasData = await citasApi.listar()
        const citasMapped: ChatbotRecord[] = (citasData as Record<string, unknown>[]).map((c) => {
          const cliente = c.cliente as Record<string, unknown> | undefined
          return {
            id: `cita-${c.id}`,
            type: "appointment" as const,
            customerId: String(cliente?.id ?? ""),
            customerName: String(cliente?.nombre ?? "Cliente"),
            content: String(c.titulo ?? c.descripcion ?? "Cita agendada"),
            createdAt: String(c.fechaHora ?? c.fechaCreacion ?? new Date().toISOString()),
            conversationId: String(c.conversacionId ?? ""),
            status: mapCitaStatus(String(c.estado ?? "")),
          }
        })
        allRecords.push(...citasMapped)
      } catch {
        // silently fail for citas
      }

      // Fetch cotizaciones
      try {
        const cotizData = await cotizacionesApi.listar()
        const cotizMapped: ChatbotRecord[] = (cotizData as Record<string, unknown>[]).map((c) => {
          const cliente = c.cliente as Record<string, unknown> | undefined
          return {
            id: `cotiz-${c.id}`,
            type: "quote" as const,
            customerId: String(cliente?.id ?? c.clienteId ?? ""),
            customerName: String(cliente?.nombre ?? "Cliente"),
            content: String(c.titulo ?? c.descripcion ?? "Cotizacion generada"),
            createdAt: String(c.fechaCreacion ?? c.fechaRegistro ?? new Date().toISOString()),
            conversationId: String(c.conversacionId ?? ""),
            status: mapGenericStatus(String(c.estado ?? "")),
          }
        })
        allRecords.push(...cotizMapped)
      } catch {
        // silently fail for cotizaciones
      }

      // Fetch encuestas
      try {
        const encuestasData = await encuestasApi.listar()
        const encuestasMapped: ChatbotRecord[] = (encuestasData as Record<string, unknown>[]).map((c) => {
          const cliente = c.cliente as Record<string, unknown> | undefined
          return {
            id: `encuesta-${c.id}`,
            type: "survey" as const,
            customerId: String(cliente?.id ?? c.clienteId ?? ""),
            customerName: String(cliente?.nombre ?? "Cliente"),
            content: String(c.titulo ?? c.nombre ?? "Encuesta realizada"),
            createdAt: String(c.fechaCreacion ?? c.fechaRegistro ?? new Date().toISOString()),
            conversationId: String(c.conversacionId ?? ""),
            status: mapGenericStatus(String(c.estado ?? "")),
          }
        })
        allRecords.push(...encuestasMapped)
      } catch {
        // silently fail for encuestas
      }

      // Fetch documentos
      try {
        const docsData = await documentosApi.listar()
        const docsMapped: ChatbotRecord[] = (docsData as Record<string, unknown>[]).map((c) => {
          const cliente = c.cliente as Record<string, unknown> | undefined
          return {
            id: `doc-${c.id}`,
            type: "document" as const,
            customerId: String(cliente?.id ?? c.clienteId ?? ""),
            customerName: String(cliente?.nombre ?? "Cliente"),
            content: String(c.nombre ?? c.titulo ?? "Documento compartido"),
            createdAt: String(c.fechaCreacion ?? c.fechaRegistro ?? new Date().toISOString()),
            conversationId: String(c.conversacionId ?? ""),
            status: "completed" as const,
          }
        })
        allRecords.push(...docsMapped)
      } catch {
        // silently fail for documentos
      }

      // Sort by date descending
      allRecords.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setRecords(allRecords)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cargar historial")
    }
  }, [])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      record.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || record.type === typeFilter
    const matchesStatus = statusFilter === "all" || record.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage)
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, typeFilter, statusFilter])

  const stats = {
    total: records.length,
    appointments: records.filter((r) => r.type === "appointment").length,
    quotes: records.filter((r) => r.type === "quote").length,
    surveys: records.filter((r) => r.type === "survey").length,
    documents: records.filter((r) => r.type === "document").length,
  }

  const handleDownload = () => {
    const typeLabels: Record<string, string> = { appointment: "Cita", quote: "Cotizacion", survey: "Encuesta", document: "Documento" }
    const statusLabels: Record<string, string> = { pending: "Pendiente", completed: "Completado", cancelled: "Cancelado" }
    const headers = ["Cliente", "Tipo", "Contenido", "Fecha", "Estado"]
    const rows = filteredRecords.map((r) => [
      r.customerName,
      typeLabels[r.type] || r.type,
      r.content,
      new Date(r.createdAt).toLocaleDateString("es-MX"),
      statusLabels[r.status] || r.status,
    ])
    downloadCSV("historial_chatbot", headers, rows)
  }

  const getTypeIcon = (type: ChatbotRecord["type"]) => {
    switch (type) {
      case "appointment":
        return <Calendar className="h-4 w-4" />
      case "quote":
        return <Receipt className="h-4 w-4" />
      case "survey":
        return <ClipboardList className="h-4 w-4" />
      case "document":
        return <FileText className="h-4 w-4" />
    }
  }

  const getTypeBadge = (type: ChatbotRecord["type"]) => {
    const styles = {
      appointment: "bg-chart-1/20 text-chart-1 border-chart-1/30",
      quote: "bg-chart-2/20 text-chart-2 border-chart-2/30",
      survey: "bg-chart-3/20 text-chart-3 border-chart-3/30",
      document: "bg-chart-4/20 text-chart-4 border-chart-4/30",
    }
    const labels = {
      appointment: "Cita",
      quote: "Cotización",
      survey: "Encuesta",
      document: "Documento",
    }
    return (
      <Badge className={`${styles[type]} text-xs`}>
        {getTypeIcon(type)}
        <span className="ml-1 hidden sm:inline">{labels[type]}</span>
      </Badge>
    )
  }

  const getStatusBadge = (status: ChatbotRecord["status"]) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-warning/20 text-warning border-warning/30 text-xs">
            <Clock className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">Pendiente</span>
          </Badge>
        )
      case "completed":
        return (
          <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">Completado</span>
          </Badge>
        )
      case "cancelled":
        return (
          <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-xs">
            <XCircle className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">Cancelado</span>
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-2 rounded-lg bg-secondary">
                <MessageSquare className="h-3 w-3 md:h-4 md:w-4 text-foreground" />
              </div>
              <div>
                <p className="text-[10px] md:text-xs text-muted-foreground">Total</p>
                <p className="text-lg md:text-xl font-bold text-foreground">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-2 rounded-lg bg-chart-1/20">
                <Calendar className="h-3 w-3 md:h-4 md:w-4 text-chart-1" />
              </div>
              <div>
                <p className="text-[10px] md:text-xs text-muted-foreground">Citas</p>
                <p className="text-lg md:text-xl font-bold text-foreground">{stats.appointments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-2 rounded-lg bg-chart-2/20">
                <Receipt className="h-3 w-3 md:h-4 md:w-4 text-chart-2" />
              </div>
              <div>
                <p className="text-[10px] md:text-xs text-muted-foreground">Cotizaciones</p>
                <p className="text-lg md:text-xl font-bold text-foreground">{stats.quotes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border hidden sm:block">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-2 rounded-lg bg-chart-3/20">
                <ClipboardList className="h-3 w-3 md:h-4 md:w-4 text-chart-3" />
              </div>
              <div>
                <p className="text-[10px] md:text-xs text-muted-foreground">Encuestas</p>
                <p className="text-lg md:text-xl font-bold text-foreground">{stats.surveys}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border hidden md:block">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-2 rounded-lg bg-chart-4/20">
                <FileText className="h-3 w-3 md:h-4 md:w-4 text-chart-4" />
              </div>
              <div>
                <p className="text-[10px] md:text-xs text-muted-foreground">Documentos</p>
                <p className="text-lg md:text-xl font-bold text-foreground">{stats.documents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="bg-card border-border">
        <CardHeader className="border-b border-border p-4 md:p-6">
          <div className="flex flex-col gap-4">
            <CardTitle className="text-foreground text-base md:text-lg">Historial del Chatbot</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente o contenido..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full bg-input border-border text-foreground placeholder:text-muted-foreground text-sm"
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
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full sm:w-28 bg-input border-border text-foreground text-sm">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="appointment">Citas</SelectItem>
                    <SelectItem value="quote">Cotizaciones</SelectItem>
                    <SelectItem value="survey">Encuestas</SelectItem>
                    <SelectItem value="document">Documentos</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-28 bg-input border-border text-foreground text-sm">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="completed">Completado</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
            <div className="divide-y divide-border">
              {paginatedRecords.map((record) => (
                <div
                  key={record.id}
                  className="p-3 md:p-4 hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 md:gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="p-2 rounded-lg bg-secondary flex-shrink-0 hidden sm:flex">
                        {getTypeIcon(record.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {getTypeBadge(record.type)}
                          {getStatusBadge(record.status)}
                        </div>
                        <p className="text-foreground mb-2 text-sm line-clamp-2">{record.content}</p>
                        <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span className="truncate max-w-[120px]">{record.customerName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(record.createdAt).toLocaleDateString("es-MX", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:bg-primary/10 text-xs w-full md:w-auto justify-center"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Ver conversación
                    </Button>
                  </div>
                </div>
              ))}
              {paginatedRecords.length === 0 && (
                <div className="p-8 text-center">
                  <MessageSquare className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-sm">No se encontraron registros</p>
                </div>
              )}
            </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <p className="text-xs text-muted-foreground">
                {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredRecords.length)} de {filteredRecords.length} registros
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

function mapCitaStatus(estado: string): ChatbotRecord["status"] {
  const e = estado?.toLowerCase()
  if (e === "pendiente" || e === "pending" || e === "confirmada") return "pending"
  if (e === "completada" || e === "completed") return "completed"
  if (e === "cancelada" || e === "cancelled") return "cancelled"
  return "pending"
}

function mapGenericStatus(estado: string): ChatbotRecord["status"] {
  const e = estado?.toLowerCase()
  if (e === "pendiente" || e === "pending" || e === "enviada" || e === "en_proceso") return "pending"
  if (e === "completada" || e === "completed" || e === "finalizada" || e === "aprobada") return "completed"
  if (e === "cancelada" || e === "cancelled" || e === "rechazada") return "cancelled"
  return "completed"
}

"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { reportesApi, clientesApi, empleadosApi } from "@/lib/api-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Users,
  MessageSquare,
  TrendingUp,
  Calendar,
  BarChart3,
  UserCheck,
  Bot,
  RefreshCw,
  Download,
} from "lucide-react"

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"]

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

interface GeneralStats {
  totalClientes: number
  totalEmpleados: number
  totalConversaciones: number
  totalProductos: number
  clientesActivos: number
  empleadosActivos: number
  conversacionesPendientes: number
  promedioSatisfaccion: number
}

export function ReportsDashboard() {
  const [generalStats, setGeneralStats] = useState<GeneralStats | null>(null)
  const [clientesMensual, setClientesMensual] = useState<{ mes: string; cantidad: number }[]>([])
  const [empleadosList, setEmpleadosList] = useState<Record<string, unknown>[]>([])
  const [clientesList, setClientesList] = useState<Record<string, unknown>[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [anio, setAnio] = useState(String(new Date().getFullYear()))

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [generales, empleados, clientes] = await Promise.allSettled([
        reportesApi.generales(),
        empleadosApi.listar(),
        clientesApi.listar(),
      ])

      if (generales.status === "fulfilled") {
        setGeneralStats(generales.value as unknown as GeneralStats)
      }

      if (empleados.status === "fulfilled") {
        setEmpleadosList(empleados.value)
      }

      if (clientes.status === "fulfilled") {
        setClientesList(clientes.value)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cargar reportes")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchClientesMensual = useCallback(async (year: number) => {
    try {
      const data = await reportesApi.clientesMensual(year)
      const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
      if (Array.isArray(data)) {
        const mapped = (data as { mes?: number; cantidad?: number }[]).map((item, i) => ({
          mes: meses[item.mes ? item.mes - 1 : i] || meses[i],
          cantidad: item.cantidad ?? 0,
        }))
        setClientesMensual(mapped)
      } else if (data && typeof data === "object") {
        const entries = Object.entries(data)
        const mapped = entries.map(([key, val]) => ({
          mes: meses[Number(key) - 1] || key,
          cantidad: Number(val) || 0,
        }))
        setClientesMensual(mapped)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cargar clientes mensual")
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    fetchClientesMensual(Number(anio))
  }, [anio, fetchClientesMensual])

  // Compute employee distribution by role
  const empleadosPorRol = empleadosList.reduce<{ name: string; value: number }[]>((acc, emp) => {
    const rol = String((emp.rol as Record<string, unknown>)?.nombre ?? emp.rolNombre ?? "Sin rol")
    const existing = acc.find((r) => r.name === rol)
    if (existing) {
      existing.value += 1
    } else {
      acc.push({ name: rol, value: 1 })
    }
    return acc
  }, [])

  // Compute client distribution by status
  const clientesPorEstado = clientesList.reduce<{ name: string; value: number }[]>((acc, cl) => {
    const estado = String(cl.estado ?? "desconocido")
    const existing = acc.find((r) => r.name === estado)
    if (existing) {
      existing.value += 1
    } else {
      acc.push({ name: estado, value: 1 })
    }
    return acc
  }, [])

  // Compute client distribution by source
  const clientesPorFuente = clientesList.reduce<{ name: string; value: number }[]>((acc, cl) => {
    const fuente = String(cl.fuente ?? "Directo")
    const existing = acc.find((r) => r.name === fuente)
    if (existing) {
      existing.value += 1
    } else {
      acc.push({ name: fuente, value: 1 })
    }
    return acc
  }, [])

  const statCards = [
    {
      label: "Total Clientes",
      value: generalStats?.totalClientes ?? clientesList.length,
      icon: Users,
      color: "text-[#10b981]",
      bg: "bg-[#10b981]/10",
    },
    {
      label: "Empleados Activos",
      value: generalStats?.empleadosActivos ?? empleadosList.filter((e) => e.activo).length,
      icon: UserCheck,
      color: "text-[#3b82f6]",
      bg: "bg-[#3b82f6]/10",
    },
    {
      label: "Conversaciones",
      value: generalStats?.totalConversaciones ?? 0,
      icon: MessageSquare,
      color: "text-[#f59e0b]",
      bg: "bg-[#f59e0b]/10",
    },
    {
      label: "Productos",
      value: generalStats?.totalProductos ?? 0,
      icon: TrendingUp,
      color: "text-[#8b5cf6]",
      bg: "bg-[#8b5cf6]/10",
    },
  ]

  const handleDownloadClientesPorFuente = () => {
    const headers = ["Fuente", "Cantidad"]
    const rows = clientesPorFuente.map((item) => [item.name, String(item.value)])
    downloadCSV("clientes_por_fuente", headers, rows)
  }

  const handleDownloadClientesPorEstado = () => {
    const headers = ["Estado", "Cantidad"]
    const rows = clientesPorEstado.map((item) => [item.name, String(item.value)])
    downloadCSV("clientes_por_estado", headers, rows)
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Resumen general del sistema - {empleadosList.length} empleados, {clientesList.length} clientes registrados
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Actualizar</span>
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg} flex-shrink-0`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                  <p className="text-xl font-bold text-card-foreground">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Clientes Mensual */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm text-card-foreground">Clientes por Mes</CardTitle>
              </div>
              <Select value={anio} onValueChange={setAnio}>
                <SelectTrigger className="w-24 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <CardDescription className="text-xs">Nuevos clientes registrados por mes</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                cantidad: { label: "Clientes", color: "#10b981" },
              }}
              className="h-[250px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clientesMensual} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="cantidad" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Clientes por Estado */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm text-card-foreground">Clientes por Estado</CardTitle>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDownloadClientesPorEstado} title="Descargar CSV">
                <Download className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
            <CardDescription className="text-xs">Distribucion de clientes segun su estado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <ChartContainer
                config={{
                  value: { label: "Clientes", color: "#10b981" },
                }}
                className="h-[200px] w-full sm:w-1/2"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={clientesPorEstado}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {clientesPorEstado.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
              <div className="space-y-2 w-full sm:w-1/2">
                {clientesPorEstado.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-muted-foreground capitalize">{item.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">{item.value}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Empleados por Rol */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm text-card-foreground">Empleados por Rol</CardTitle>
            </div>
            <CardDescription className="text-xs">Distribucion del equipo por roles</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: { label: "Empleados", color: "#3b82f6" },
              }}
              className="h-[250px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={empleadosPorRol} layout="vertical" margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" width={100} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {empleadosPorRol.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Clientes por Fuente */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm text-card-foreground">Clientes por Fuente</CardTitle>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDownloadClientesPorFuente} title="Descargar CSV">
                <Download className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
            <CardDescription className="text-xs">De donde provienen los clientes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <ChartContainer
                config={{
                  value: { label: "Clientes", color: "#f59e0b" },
                }}
                className="h-[200px] w-full sm:w-1/2"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={clientesPorFuente}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {clientesPorFuente.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
              <div className="space-y-2 w-full sm:w-1/2">
                {clientesPorFuente.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-muted-foreground capitalize">{item.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">{item.value}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


    </div>
  )
}

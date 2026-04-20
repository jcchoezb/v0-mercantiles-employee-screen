"use client"

import { useState, useEffect, useCallback } from "react"
import { AdminSidebar } from "./admin-sidebar"
import { conversacionesApi } from "@/lib/api-service"
import { ChatSupport } from "./chat-support"
import { CustomerManagement } from "./customer-management"
import { WorkflowManagement } from "./workflow-management"
import { ApiConfigManagement } from "./api-config-management"
import { CompanyManagement } from "./company-management"
import { TemplateManagement } from "./template-management"
import { ReportsDashboard } from "./reports-dashboard"
import { EmployeeManagement } from "./employee-management"
import { ChangePassword } from "./change-password"

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("chat")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [pendingConvId, setPendingConvId] = useState<string | null>(null)
  const [chatBadge, setChatBadge] = useState(0)

  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await conversacionesApi.listar()
      // Sum mensajesNoLeidos from all active conversations
      const totalUnread = (data as Record<string, unknown>[])
        .filter((c) => c.estado === "activa" || c.estado === "en_atencion" || c.estado === "pendiente" || c.estado === "nueva")
        .reduce((sum, c) => sum + (Number(c.mensajesNoLeidos) || 0), 0)
      setChatBadge(totalUnread)
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [fetchUnreadCount])

  const renderContent = () => {
    switch (activeTab) {
      case "chat":
        return <ChatSupport autoSelectConvId={pendingConvId} onConvSelected={() => setPendingConvId(null)} />
      case "customers":
        return <CustomerManagement onNavigateToChat={(convId) => { setPendingConvId(convId); setActiveTab("chat"); }} />
      case "workflows":
        return <WorkflowManagement />
      case "apis":
        return <ApiConfigManagement />
      case "companies":
        return <CompanyManagement />
      case "templates":
        return <TemplateManagement />
      case "reports":
        return <ReportsDashboard />
      case "employees":
        return <EmployeeManagement />
      case "settings":
        return <ChangePassword />
      default:
        return <ChatSupport />
    }
  }

  const getPageTitle = () => {
    switch (activeTab) {
      case "chat":
        return "Chat en Vivo"
      case "customers":
        return "Gestion de Clientes"
      case "workflows":
        return "Gestion de Workflows"
      case "apis":
        return "APIs Externas"
      case "companies":
        return "Gestion de Empresas"
      case "templates":
        return "Plantillas de Mensaje"
      case "reports":
        return "Reportes y Estadisticas"
      case "employees":
        return "Gestion de Empleados"
      case "settings":
        return "Configuracion de Cuenta"
      default:
        return "Dashboard"
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        chatBadge={chatBadge}
      />
      <main className="flex-1 overflow-auto w-full">
        <div className="p-4 pt-16 lg:pt-4 md:p-6">
          <header className="mb-6">
            <h1 className="text-xl md:text-2xl font-bold text-foreground">{getPageTitle()}</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Panel de administracion - Mercantiles
            </p>
          </header>
          {renderContent()}
        </div>
      </main>
    </div>
  )
}

"use client"

import { useState, useEffect, useCallback } from "react"
import { AdminSidebar } from "./admin-sidebar"
import { conversacionesApi } from "@/lib/api-service"
import { ChatSupport } from "./chat-support"
import { CustomerManagement } from "./customer-management"
import { ProductManagement } from "./product-management"
import { ChatbotHistory } from "./chatbot-history"
import { CategoryManagement } from "./category-management"
import { ReportsDashboard } from "./reports-dashboard"
import { EmployeeManagement } from "./employee-management"
import { ParameterManagement } from "./parameter-management"
import { CatalogManagement } from "./catalog-management"
import { CampaignManagement } from "./campaign-management"
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
      case "products":
        return <ProductManagement />
      case "categories":
        return <CategoryManagement />
      case "records":
        return <ChatbotHistory />
      case "reports":
        return <ReportsDashboard />
      case "employees":
        return <EmployeeManagement />
      case "parameters":
        return <ParameterManagement />
      case "catalogs":
        return <CatalogManagement />
      case "campaigns":
        return <CampaignManagement />
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
      case "products":
        return "Gestion de Productos"
      case "categories":
        return "Gestion de Categorias"
      case "records":
        return "Historial del Chatbot"
      case "reports":
        return "Reportes y Estadisticas"
      case "employees":
        return "Gestion de Empleados"
      case "parameters":
        return "Gestion de Parametros"
      case "catalogs":
        return "Gestion de Catalogos"
      case "campaigns":
        return "Gestion de Campanas"
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
              Panel de administración - Mercantiles
            </p>
          </header>
          {renderContent()}
        </div>
      </main>
    </div>
  )
}

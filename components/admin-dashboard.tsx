"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { AdminSidebar } from "./admin-sidebar"
import { conversacionesApi } from "@/lib/api-service"
import { Client } from "@stomp/stompjs"
import SockJS from "sockjs-client"
import { ChatSupport } from "./chat-support"
import { CustomerManagement } from "./customer-management"
import { WorkflowManagement } from "./workflow-management"
import { ApiConfigManagement } from "./api-config-management"
import { CompanyManagement } from "./company-management"
import { TemplateManagement } from "./template-management"
import { ReportsDashboard } from "./reports-dashboard"
import { EmployeeManagement } from "./employee-management"
import { ChangePassword } from "./change-password"
import { ChatAssignment } from "./chat-assignment"
import { ParametersManagement } from "./parameters-management"

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

  // WebSocket para actualizar el badge en tiempo real
  const stompClientRef = useRef<Client | null>(null)

  // Lista de IDs de conversaciones para suscribirse a sus mensajes
  const [conversationIds, setConversationIds] = useState<number[]>([])
  const messageSubscriptionsRef = useRef<Map<number, { unsubscribe: () => void }>>(new Map())
  const incrementBadgeFnRef = useRef<((conversationId: number) => void) | null>(null)

  // Función para registrar el callback de incremento de badge desde ChatSupport
  const registerIncrementBadge = useCallback((fn: (conversationId: number) => void) => {
    incrementBadgeFnRef.current = fn
  }, [])

  // Obtener lista de conversaciones para suscribirse a sus mensajes
  const fetchConversationIds = useCallback(async () => {
    try {
      const data = await conversacionesApi.listar()
      const ids = (data as Record<string, unknown>[])
        .filter((c) => c.estado === "activa" || c.estado === "en_atencion" || c.estado === "pendiente" || c.estado === "nueva")
        .map((c) => Number(c.id))
      setConversationIds(ids)
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    fetchConversationIds()
  }, [fetchConversationIds])

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:8080/ws-chat"
    
    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        // Suscribirse a actualizaciones globales de conversaciones
        client.subscribe("/topic/conversaciones", () => {
          fetchUnreadCount()
          fetchConversationIds() // Actualizar lista de conversaciones
        })

        // Suscribirse a mensajes de cada conversación
        conversationIds.forEach((convId) => {
          if (!messageSubscriptionsRef.current.has(convId)) {
            const sub = client.subscribe(`/topic/conversacion/${convId}/mensajes`, () => {
              fetchUnreadCount()
              // Incrementar el badge de la conversación específica en ChatSupport
              if (incrementBadgeFnRef.current) {
                incrementBadgeFnRef.current(convId)
              }
            })
            messageSubscriptionsRef.current.set(convId, sub)
          }
        })
      },
    })

    client.activate()
    stompClientRef.current = client

    return () => {
      // Limpiar suscripciones de mensajes
      messageSubscriptionsRef.current.forEach((sub) => sub.unsubscribe())
      messageSubscriptionsRef.current.clear()
      
      if (stompClientRef.current?.connected) {
        stompClientRef.current.deactivate()
      }
    }
  }, [fetchUnreadCount, fetchConversationIds, conversationIds])

  // Callback para restar mensajes leídos del badge total
  const handleMessagesRead = useCallback((count: number) => {
    setChatBadge((prev) => Math.max(0, prev - count))
  }, [])

  const renderContent = () => {
    switch (activeTab) {
      case "chat":
        return <ChatSupport autoSelectConvId={pendingConvId} onConvSelected={() => setPendingConvId(null)} onMessagesRead={handleMessagesRead} onNewMessage={fetchUnreadCount} registerIncrementBadge={registerIncrementBadge} />
      case "chat-assignment":
        return <ChatAssignment />
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
      case "parameters":
        return <ParametersManagement />
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
      case "chat-assignment":
        return "Asignacion de Chats"
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
      case "parameters":
        return "Gestion de Parametros"
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
              Panel de administracion - TipingIA
            </p>
          </header>
          {renderContent()}
        </div>
      </main>
    </div>
  )
}

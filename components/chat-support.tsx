/*"use client"

import React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import { conversacionesApi, mensajesApi } from "@/lib/api-service"
import type { ChatConversation, ChatMessage } from "@/lib/types"
import chatWebSocket, { MensajeWebSocket } from "@/lib/chat-websocket"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  Send,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  Bot,
  User,
  Headphones,
  ArrowLeft,
  XCircle,
} from "lucide-react"

interface ChatSupportProps {
  autoSelectConvId?: string | null
  onConvSelected?: () => void
  onMessagesRead?: (count: number) => void
  onNewMessage?: () => void
  registerIncrementBadge?: (fn: (conversationId: number) => void) => void
}

export function ChatSupport({ autoSelectConvId, onConvSelected, onMessagesRead, onNewMessage, registerIncrementBadge }: ChatSupportProps) {
  const { employee } = useAuth()
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterTab, setFilterTab] = useState<"all" | "unassigned" | "assigned" | "unread" | "closed">("all")
  const [showConversationList, setShowConversationList] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const PAGE_SIZE = 20

  // Función para incrementar el badge de una conversación específica (llamada desde el padre)
  const incrementBadgeForConversation = useCallback((conversationId: number) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (Number(c.id) === conversationId) {
          // Solo incrementar si NO es la conversación seleccionada
          const isSelected = selectedConversation && Number(selectedConversation.id) === conversationId
          if (!isSelected) {
            return { ...c, mensajesNoLeidos: (c.mensajesNoLeidos || 0) + 1 }
          }
        }
        return c
      })
    )
  }, [selectedConversation])

  // Efecto para registrar la función de incremento con el padre
  useEffect(() => {
    if (registerIncrementBadge) {
      registerIncrementBadge(incrementBadgeForConversation)
    }
  }, [registerIncrementBadge, incrementBadgeForConversation])

  const fetchConversations = useCallback(async () => {
    try {
      // Si el rol es admin, usar listar(). Si es asesor (agent), usar porEmpleado()
      const data = employee?.role === "admin" 
        ? await conversacionesApi.listar()
        : await conversacionesApi.porEmpleado(Number(employee?.id))
      const mapped: ChatConversation[] = (data as Record<string, unknown>[]).map((c) => {
        const cliente = c.cliente as Record<string, unknown> | undefined
        const clienteNombre = String(c.clienteNombre ?? cliente?.nombre ?? "Sin nombre")
        const clienteEmail = String(c.clienteEmail ?? cliente?.email ?? "")
        return {
          id: String(c.id ?? ""),
          customer: {
            id: String(c.clienteId ?? cliente?.id ?? ""),
            name: clienteNombre,
            email: clienteEmail,
            phone: String(cliente?.telefono ?? ""),
            source: String(c.origen ?? ""),
            createdAt: String(c.createdAt ?? c.fechaCreacion ?? new Date().toISOString()),
            status: "active" as const,
          },
          messages: [],
          status: mapConvStatus(String(c.estado ?? "")),
          source: String(c.canal ?? c.origen ?? ""),
          createdAt: String(c.createdAt ?? c.fechaCreacion ?? new Date().toISOString()),
          lastMessage: String(c.ultimoMensaje ?? c.tema ?? ""),
          mensajesNoLeidos: c.mensajesNoLeidos ? Number(c.mensajesNoLeidos) : 0,
          modoAtencion: (c.modoAtencion as "BOT" | "HUMANO") ?? "HUMANO",
          empleadoId: c.empleadoId ? Number(c.empleadoId) : undefined,
          empleadoNombre: c.empleadoNombre ? String(c.empleadoNombre) : undefined,
          updatedAt: String(c.updatedAt ?? c.createdAt ?? new Date().toISOString()),
          estado: String(c.estado ?? ""),
        }
      })
      setConversations(mapped)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cargar conversaciones")
    }
  }, [employee?.role, employee?.id])

  const fetchMessages = useCallback(async (convId: string, page: number = 0, existingMessages: ChatMessage[] = []) => {
    try {
      const data = await mensajesApi.chat(Number(convId), { page, size: PAGE_SIZE })
      const mapped: ChatMessage[] = (data as Record<string, unknown>[]).map((m) => ({
        id: String(m.id ?? ""),
        content: String(m.contenido ?? ""),
        sender: mapSender(String(m.remitenteTipo ?? "")),
        timestamp: String(m.createdAt ?? new Date().toISOString()),
        senderName: String(m.remitenteNombre ?? ""),
      }))
      // Si es la primera página, retornar solo los nuevos mensajes
      // Si es una página anterior, agregar al inicio
      if (page === 0) {
        setHasMoreMessages(mapped.length >= PAGE_SIZE)
        return mapped
      } else {
        setHasMoreMessages(mapped.length >= PAGE_SIZE)
        // Agregar mensajes más antiguos al inicio
        return [...mapped, ...existingMessages]
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cargar mensajes")
      return existingMessages
    }
  }, [PAGE_SIZE])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // Auto-select conversation when redirected from another screen
  useEffect(() => {
    if (!autoSelectConvId || conversations.length === 0) return
    const target = conversations.find((c) => c.id === autoSelectConvId)
    if (target) {
      handleSelectConversation(target)
      if (onConvSelected) onConvSelected()
    }
  }, [autoSelectConvId, conversations]) // eslint-disable-line react-hooks/exhaustive-deps

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [selectedConversation?.messages])

  // Cargar mensajes más antiguos cuando se hace scroll hacia arriba
  const loadMoreMessages = useCallback(async () => {
    if (!selectedConversation || isLoadingMore || !hasMoreMessages) return
    
    setIsLoadingMore(true)
    const nextPage = currentPage + 1
    const updatedMessages = await fetchMessages(
      selectedConversation.id, 
      nextPage, 
      selectedConversation.messages
    )
    
    setSelectedConversation((prev) => {
      if (!prev) return prev
      return { ...prev, messages: updatedMessages }
    })
    setCurrentPage(nextPage)
    setIsLoadingMore(false)
  }, [selectedConversation, isLoadingMore, hasMoreMessages, currentPage, fetchMessages])

  // Manejar scroll para cargar más mensajes
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement
    // Si el scroll está cerca del tope (menos de 50px), cargar más mensajes
    if (target.scrollTop < 50 && hasMoreMessages && !isLoadingMore) {
      loadMoreMessages()
    }
  }, [hasMoreMessages, isLoadingMore, loadMoreMessages])

  // Función para formatear la fecha como separador
  const formatDateSeparator = (dateString: string): string => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const isToday = date.toDateString() === today.toDateString()
    const isYesterday = date.toDateString() === yesterday.toDateString()

    if (isToday) return "Hoy"
    if (isYesterday) return "Ayer"
    
    return date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  // Agrupar mensajes por fecha
  const getMessagesWithDateSeparators = (messages: ChatMessage[]) => {
    const result: { type: "date" | "message"; date?: string; message?: ChatMessage }[] = []
    let lastDate = ""

    messages.forEach((message) => {
      const messageDate = new Date(message.timestamp).toDateString()
      
      if (messageDate !== lastDate) {
        result.push({ type: "date", date: message.timestamp })
        lastDate = messageDate
      }
      result.push({ type: "message", message })
    })

    return result
  }

  // Función para cerrar conversación
  const handleCloseConversation = async () => {
    if (!selectedConversation) return
    try {
      await conversacionesApi.cerrar(Number(selectedConversation.id))
      // Actualizar la conversación en la lista
      setConversations((prev) =>
        prev.map((c) => c.id === selectedConversation.id ? { ...c, estado: "cerrada", status: "resolved" as const } : c)
      )
      setSelectedConversation((prev) => prev ? { ...prev, estado: "cerrada", status: "resolved" as const } : prev)
      toast.success("Conversación cerrada")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cerrar conversación")
    }
  }

  // Función para formatear hora en formato 9:46 a.m. o p.m.
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString.replace(" ", "T"))
      const hours = date.getHours()
      const minutes = date.getMinutes()
      const ampm = hours >= 12 ? "p.m." : "a.m."
      const hour12 = hours % 12 || 12
      return `${hour12}:${minutes.toString().padStart(2, "0")} ${ampm}`
    } catch {
      return ""
    }
  }

  // Contadores para los filtros
  const filterCounts = {
    all: conversations.length,
    unassigned: conversations.filter((c) => !c.empleadoId).length,
    assigned: conversations.filter((c) => c.empleadoId).length,
    unread: conversations.filter((c) => (c.mensajesNoLeidos || 0) > 0).length,
    closed: conversations.filter((c) => c.estado === "cerrada").length,
  }

  const filteredConversations = conversations.filter((conv) => {
    // Filtro por búsqueda
    const matchesSearch = conv.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.source.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Filtro por tab
    let matchesTab = true
    switch (filterTab) {
      case "unassigned":
        matchesTab = !conv.empleadoId
        break
      case "assigned":
        matchesTab = !!conv.empleadoId
        break
      case "unread":
        matchesTab = (conv.mensajesNoLeidos || 0) > 0
        break
      case "closed":
        matchesTab = conv.estado === "cerrada"
        break
      default:
        matchesTab = true
    }
    
    return matchesSearch && matchesTab
  })

  // Callback para mensajes en tiempo real de la conversación seleccionada
  const handleWebSocketMessage = useCallback((mensaje: MensajeWebSocket) => {
    // Actualizar la conversación seleccionada si el mensaje es para ella
    setSelectedConversation((prev) => {
      if (!prev || Number(prev.id) !== mensaje.conversacionId) return prev
      
      // Verificar si el mensaje ya existe para evitar duplicados
      const exists = prev.messages.some(
        (m) => m.id === String(mensaje.id) || m.content === mensaje.contenido
      )
      if (exists) return prev

      const newMessage: ChatMessage = {
        id: String(mensaje.id ?? `ws-${Date.now()}`),
        content: mensaje.contenido,
        sender: mapSender(mensaje.remitenteTipo),
        timestamp: mensaje.createdAt ?? new Date().toISOString(),
        senderName: mensaje.remitenteNombre ?? "",
      }

      return {
        ...prev,
        messages: [...prev.messages, newMessage],
      }
    })
  }, [])

  // Callback para actualizaciones de conversaciones vía WebSocket
  const handleConversationUpdate = useCallback((data: Record<string, unknown>) => {
    const conversacion = data
    const cliente = conversacion.cliente as Record<string, unknown> | undefined
    const clienteNombre = String(conversacion.clienteNombre ?? cliente?.nombre ?? "Sin nombre")
    const clienteEmail = String(conversacion.clienteEmail ?? cliente?.email ?? "")

    const mappedConversation: ChatConversation = {
      id: String(conversacion.id ?? ""),
      customer: {
        id: String(conversacion.clienteId ?? cliente?.id ?? ""),
        name: clienteNombre,
        email: clienteEmail,
        phone: String(cliente?.telefono ?? ""),
        source: String(conversacion.origen ?? ""),
        createdAt: String(conversacion.createdAt ?? conversacion.fechaCreacion ?? new Date().toISOString()),
        status: "active" as const,
      },
      messages: [],
      status: mapConvStatus(String(conversacion.estado ?? "")),
      source: String(conversacion.canal ?? conversacion.origen ?? ""),
      createdAt: String(conversacion.createdAt ?? conversacion.fechaCreacion ?? new Date().toISOString()),
      lastMessage: String(conversacion.ultimoMensaje ?? conversacion.tema ?? ""),
      mensajesNoLeidos: conversacion.mensajesNoLeidos ? Number(conversacion.mensajesNoLeidos) : 0,
      modoAtencion: (conversacion.modoAtencion as "BOT" | "HUMANO") ?? "HUMANO",
      empleadoId: conversacion.empleadoId ? Number(conversacion.empleadoId) : undefined,
      empleadoNombre: conversacion.empleadoNombre ? String(conversacion.empleadoNombre) : undefined,
      updatedAt: String(conversacion.updatedAt ?? conversacion.createdAt ?? new Date().toISOString()),
      estado: String(conversacion.estado ?? ""),
    }

    setConversations((prev) => {
      const index = prev.findIndex((c) => c.id === mappedConversation.id)
      if (index === -1) {
        // Nueva conversación - agregar al inicio
        // Notificar si tiene mensajes no leídos
        if (mappedConversation.mensajesNoLeidos && mappedConversation.mensajesNoLeidos > 0 && onNewMessage) {
          onNewMessage()
        }
        return [mappedConversation, ...prev]
      } else {
        // Actualizar conversación existente
        const updated = [...prev]
        const prevUnread = updated[index].mensajesNoLeidos || 0
        const newUnread = mappedConversation.mensajesNoLeidos || 0
        // Notificar si aumentaron los mensajes no leídos
        if (newUnread > prevUnread && onNewMessage) {
          onNewMessage()
        }
        // Preservar mensajes si la conversación está seleccionada
        updated[index] = {
          ...mappedConversation,
          messages: updated[index].messages,
        }
        return updated
      }
    })
  }, [onNewMessage])

  const handleSelectConversation = async (conv: ChatConversation) => {
    // Desuscribirse de la conversación anterior si existe
    chatWebSocket.unsubscribeFromConversation()
    
    // Limpiar estado inmediatamente antes de cargar nuevos mensajes
    setSelectedConversation({ ...conv, messages: [], mensajesNoLeidos: 0 })
    setShowConversationList(false)
    
    // Resetear paginación
    setCurrentPage(0)
    setHasMoreMessages(true)
    
    // Cargar mensajes de la nueva conversación
    const msgs = await fetchMessages(conv.id, 0, [])
    setSelectedConversation({ ...conv, messages: msgs, mensajesNoLeidos: 0 })

    // Suscribirse a los mensajes de esta conversación específica
    chatWebSocket.subscribeToConversation(Number(conv.id), handleWebSocketMessage)

    // Mark all messages as read when conversation is opened
    const unreadCount = conv.mensajesNoLeidos || 0
    try {
      await mensajesApi.leerTodos(Number(conv.id))
      // Update conversation list to reflect read messages
      setConversations((prev) =>
        prev.map((c) => (c.id === conv.id ? { ...c, mensajesNoLeidos: 0 } : c))
      )
      // Notificar al componente padre para restar del badge total
      if (onMessagesRead && unreadCount > 0) {
        onMessagesRead(unreadCount)
      }
    } catch {
      // silently fail
    }
  }

  // Conectar WebSocket globalmente al montar el componente para recibir actualizaciones de conversaciones
  useEffect(() => {
    chatWebSocket.connectGlobal(handleConversationUpdate)
    return () => {
      chatWebSocket.disconnect()
    }
  }, [handleConversationUpdate])

  const handleBackToList = () => {
    chatWebSocket.unsubscribeFromConversation()
    setShowConversationList(true)
    setSelectedConversation(null)
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !employee) return

    try {
      await mensajesApi.crear(Number(selectedConversation.id), {
        contenido: newMessage,
        remitenteTipo: "empleado",
        remitenteId: Number(employee.id),
        tipoEvento: "MENSAJE",
      })

      const message: ChatMessage = {
        id: `m-${Date.now()}`,
        content: newMessage,
        sender: "agent",
        timestamp: new Date().toISOString(),
        senderName: employee.name,
      }

      setSelectedConversation({
        ...selectedConversation,
        messages: [...selectedConversation.messages, message],
        status: "active",
        assignedTo: employee,
      })
      setNewMessage("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al enviar mensaje")
    }
  }

  const handleTakeConversation = async () => {
    if (!selectedConversation || !employee) return

    try {
      await conversacionesApi.asignar(Number(selectedConversation.id), {
        empleadoId: Number(employee.id),
      })
      setSelectedConversation({
        ...selectedConversation,
        status: "active",
        assignedTo: employee,
      })
      fetchConversations()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al tomar conversacion")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-warning/20 text-warning border-warning/30 text-xs">
            <AlertCircle className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">Pendiente</span>
          </Badge>
        )
      case "active":
        return (
          <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
            <Clock className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">Activo</span>
          </Badge>
        )
      case "resolved":
        return (
          <Badge className="bg-success/20 text-success border-success/30 text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">Resuelto</span>
          </Badge>
        )
      default:
        return null
    }
  }

  const getSenderIcon = (sender: string) => {
    switch (sender) {
      case "bot":
        return <Bot className="h-4 w-4" />
      case "agent":
        return <Headphones className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] lg:h-[calc(100vh-6rem)] gap-4">
  
      <Card
        className={cn(
          "flex flex-col bg-card border-border overflow-hidden",
          "w-full lg:w-80 lg:flex-shrink-0",
          !showConversationList && "hidden lg:flex"
        )}
      >
        <div className="p-3 md:p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-foreground text-sm md:text-base">Conversaciones</h2>
            <Badge variant="secondary" className="text-xs">{filterCounts.all}</Badge>
          </div>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente o fuente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setFilterTab("all")}
              className={cn(
                "px-2 py-1 text-[10px] rounded-full transition-colors",
                filterTab === "all" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterTab("unassigned")}
              className={cn(
                "px-2 py-1 text-[10px] rounded-full transition-colors",
                filterTab === "unassigned" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              No Asignados ({filterCounts.unassigned})
            </button>
            <button
              onClick={() => setFilterTab("assigned")}
              className={cn(
                "px-2 py-1 text-[10px] rounded-full transition-colors",
                filterTab === "assigned" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              Asignados ({filterCounts.assigned})
            </button>
            <button
              onClick={() => setFilterTab("unread")}
              className={cn(
                "px-2 py-1 text-[10px] rounded-full transition-colors",
                filterTab === "unread" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              No Leidos ({filterCounts.unread})
            </button>
            <button
              onClick={() => setFilterTab("closed")}
              className={cn(
                "px-2 py-1 text-[10px] rounded-full transition-colors",
                filterTab === "closed" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              Cerradas ({filterCounts.closed})
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-2 space-y-1">
            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => handleSelectConversation(conv)}
                className={cn(
                  "w-full p-3 rounded-lg text-left transition-colors",
                  selectedConversation?.id === conv.id
                    ? "bg-primary/10 border border-primary/30"
                    : "hover:bg-secondary"
                )}
              >
                <div className="relative flex items-start gap-3 w-full">
                  <Avatar className="h-9 w-9 md:h-10 md:w-10 flex-shrink-0">
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-xs md:text-sm">
                      {conv.customer.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-medium text-foreground text-sm truncate">
                        {conv.customer.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {conv.updatedAt && formatTime(conv.updatedAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground truncate">{conv.source}</p>
                      {conv.empleadoNombre && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/30">
                          {conv.empleadoNombre.split(" ")[0]}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {conv.lastMessage}
                    </p>
                  </div>
                  {typeof conv.mensajesNoLeidos === "number" && conv.mensajesNoLeidos > 0 ? (
                    <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-[#25D366] text-[10px] font-bold text-white shadow-sm">
                      {conv.mensajesNoLeidos > 99 ? 99 : conv.mensajesNoLeidos}
                    </span>
                  ) : null}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
        </div>
      </Card>

  
      <Card
        className={cn(
          "flex-1 flex flex-col bg-card border-border min-h-0",
          showConversationList && !selectedConversation && "hidden lg:flex"
        )}
      >
        {selectedConversation ? (
          <>
    
            <div className="flex items-center justify-between p-3 md:p-4 border-b border-border">
              <div className="flex items-center gap-2 md:gap-3 min-w-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBackToList}
                  className="lg:hidden text-foreground hover:bg-secondary flex-shrink-0"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Avatar className="h-9 w-9 md:h-10 md:w-10 flex-shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs md:text-sm">
                    {selectedConversation.customer.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground text-sm md:text-base truncate">
                    {selectedConversation.customer.name}
                  </h3>
                  {selectedConversation.empleadoNombre && (
                    <p className="text-[10px] text-primary truncate">
                      Asignado a: {selectedConversation.empleadoNombre}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground truncate">
                    <span className="hidden sm:inline">{selectedConversation.customer.phone} | </span>
                    {selectedConversation.source}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                {selectedConversation.estado !== "cerrada" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCloseConversation}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    title="Cerrar conversación"
                  >
                    <XCircle className="h-5 w-5" />
                  </Button>
                )}
                <label className="flex items-center gap-2 cursor-pointer group">
                  <span className="text-xs text-muted-foreground hidden sm:inline">Asistente IA</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={selectedConversation.modoAtencion === "BOT"}
                    onClick={async () => {
                      const nuevoModo = selectedConversation.modoAtencion === "BOT" ? "HUMANO" : "BOT"
                      try {
                        await conversacionesApi.cambiarModo(Number(selectedConversation.id), nuevoModo)
                        setSelectedConversation((prev) => prev ? { ...prev, modoAtencion: nuevoModo } : prev)
                        toast.success(`Modo cambiado a ${nuevoModo === "BOT" ? "Asistente IA" : "Humano"}`)
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Error al cambiar modo")
                      }
                    }}
                    className={cn(
                      "relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
                      selectedConversation.modoAtencion === "BOT" ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                        selectedConversation.modoAtencion === "BOT" ? "translate-x-4" : "translate-x-0"
                      )}
                    />
                  </button>
                </label>
              </div>
            </div>

        
            <div className="flex-1 min-h-0 overflow-hidden">
              <div 
                ref={scrollAreaRef}
                className="h-full overflow-y-auto p-3 md:p-4"
                onScroll={handleScroll}
              >
              
                {isLoadingMore && (
                  <div className="flex justify-center py-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                  </div>
                )}
                {hasMoreMessages && !isLoadingMore && (
                  <div className="flex justify-center py-2">
                    <button 
                      onClick={loadMoreMessages}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Cargar mensajes anteriores
                    </button>
                  </div>
                )}
                <div className="space-y-3 md:space-y-4">
                  {getMessagesWithDateSeparators(selectedConversation.messages).map((item, index) => {
                    if (item.type === "date" && item.date) {
                      return (
                        <div key={`date-${index}`} className="flex items-center justify-center py-2">
                          <div className="bg-muted/50 text-muted-foreground text-xs px-3 py-1 rounded-full">
                            {formatDateSeparator(item.date)}
                          </div>
                        </div>
                      )
                    }
                    
                    if (item.type === "message" && item.message) {
                      const message = item.message
                      return (
                        <div
                          key={`msg-${message.id}-${index}`}
                          className={cn(
                            "flex gap-2 md:gap-3",
                            (message.sender === "agent" || message.sender === "bot") && "flex-row-reverse"
                          )}
                        >
                          <Avatar className="h-7 w-7 md:h-8 md:w-8 flex-shrink-0">
                            <AvatarFallback
                              className={cn(
                                "text-xs",
                                (message.sender === "bot" || message.sender === "agent")
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              {getSenderIcon(message.sender)}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={cn(
                              "max-w-[80%] md:max-w-[70%] rounded-lg p-2 md:p-3",
                              (message.sender === "agent" || message.sender === "bot")
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {message.senderName && (
                              <p className="text-[10px] md:text-xs font-medium mb-1 opacity-80">
                                {message.senderName}
                              </p>
                            )}
                            <p className="text-xs md:text-sm">{message.content}</p>
                            <p className="text-[10px] mt-1 opacity-60">
                              {new Date(message.timestamp).toLocaleTimeString("es-MX", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      )
                    }
                    return null
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>

         
            <div className="p-3 md:p-4 border-t border-border">
              {selectedConversation.status === "pending" &&
              selectedConversation.assignedTo?.id !== employee?.id ? (
                <Button
                  onClick={handleTakeConversation}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Headphones className="mr-2 h-4 w-4" />
                  Tomar conversación
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder={selectedConversation.modoAtencion === "BOT" ? "Asistente IA activo - Entrada deshabilitada" : "Escribe un mensaje..."}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    disabled={selectedConversation.modoAtencion === "BOT"}
                    className={cn(
                      "flex-1 bg-input border-border text-foreground placeholder:text-muted-foreground text-sm",
                      selectedConversation.modoAtencion === "BOT" && "opacity-50 cursor-not-allowed"
                    )}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || selectedConversation.modoAtencion === "BOT"}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <MessageSquare className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-1 text-sm md:text-base">Sin conversación seleccionada</h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                Selecciona una conversación para comenzar a chatear
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

function mapConvStatus(estado: string): ChatConversation["status"] {
  const e = estado?.toLowerCase()
  if (e === "pendiente" || e === "pending" || e === "nueva" || e === "new") return "pending"
  if (e === "en_atencion" || e === "active" || e === "activa" || e === "abierta") return "active"
  if (e === "cerrada" || e === "closed" || e === "resolved" || e === "resuelta") return "resolved"
  return "resolved"
}

function mapSender(tipo: string): ChatMessage["sender"] {
  const t = tipo?.toLowerCase()
  if (t === "bot" || t === "chatbot") return "bot"
  if (t === "empleado" || t === "agent" || t === "agente") return "agent"
  return "customer"
}

function MessageSquare(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}
*/
"use client"

import React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import { conversacionesApi, mensajesApi } from "@/lib/api-service"
import type { ChatConversation, ChatMessage } from "@/lib/types"
import chatWebSocket, { MensajeWebSocket } from "@/lib/chat-websocket"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  Send,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  Bot,
  User,
  Headphones,
  ArrowLeft,
  XCircle,
} from "lucide-react"

interface ChatSupportProps {
  autoSelectConvId?: string | null
  onConvSelected?: () => void
  onMessagesRead?: (count: number) => void
  onNewMessage?: () => void
  registerIncrementBadge?: (fn: (conversationId: number) => void) => void
}

export function ChatSupport({ autoSelectConvId, onConvSelected, onMessagesRead, onNewMessage, registerIncrementBadge }: ChatSupportProps) {
  const { employee } = useAuth()
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterTab, setFilterTab] = useState<"all" | "unassigned" | "assigned" | "unread" | "closed">("all")
  const [showConversationList, setShowConversationList] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const PAGE_SIZE = 20

  // Función para incrementar el badge de una conversación específica (llamada desde el padre)
  const incrementBadgeForConversation = useCallback((conversationId: number) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (Number(c.id) === conversationId) {
          // Solo incrementar si NO es la conversación seleccionada
          const isSelected = selectedConversation && Number(selectedConversation.id) === conversationId
          if (!isSelected) {
            return { ...c, mensajesNoLeidos: (c.mensajesNoLeidos || 0) + 1 }
          }
        }
        return c
      })
    )
  }, [selectedConversation])

  // Efecto para registrar la función de incremento con el padre
useEffect(() => {
  if (registerIncrementBadge) {
    registerIncrementBadge(incrementBadgeForConversation)
  }
}, [registerIncrementBadge, incrementBadgeForConversation])

  const fetchConversations = useCallback(async () => {
    try {
      // Si el rol es admin, usar listar(). Si es asesor (agent), usar porEmpleado()
      const data = employee?.role === "admin" 
        ? await conversacionesApi.listar()
        : await conversacionesApi.porEmpleado(Number(employee?.id))
      const mapped: ChatConversation[] = (data as Record<string, unknown>[]).map((c) => {
        const cliente = c.cliente as Record<string, unknown> | undefined
        const clienteNombre = String(c.clienteNombre ?? cliente?.nombre ?? "Sin nombre")
        const clienteEmail = String(c.clienteEmail ?? cliente?.email ?? "")
        return {
          id: String(c.id ?? ""),
          customer: {
            id: String(c.clienteId ?? cliente?.id ?? ""),
            name: clienteNombre,
            email: clienteEmail,
            phone: String(cliente?.telefono ?? ""),
            source: String(c.origen ?? ""),
            createdAt: String(c.createdAt ?? c.fechaCreacion ?? new Date().toISOString()),
            status: "active" as const,
          },
          messages: [],
          status: mapConvStatus(String(c.estado ?? "")),
          source: String(c.canal ?? c.origen ?? ""),
          createdAt: String(c.createdAt ?? c.fechaCreacion ?? new Date().toISOString()),
          lastMessage: String(c.ultimoMensaje ?? c.tema ?? ""),
          mensajesNoLeidos: c.mensajesNoLeidos ? Number(c.mensajesNoLeidos) : 0,
          modoAtencion: (c.modoAtencion as "BOT" | "HUMANO") ?? "HUMANO",
          empleadoId: c.empleadoId ? Number(c.empleadoId) : undefined,
          empleadoNombre: c.empleadoNombre ? String(c.empleadoNombre) : undefined,
          updatedAt: String(c.updatedAt ?? c.createdAt ?? new Date().toISOString()),
          estado: String(c.estado ?? ""),
        }
      })
      setConversations(mapped)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cargar conversaciones")
    }
  }, [employee?.role, employee?.id])

  const fetchMessages = useCallback(async (convId: string, page: number = 0, existingMessages: ChatMessage[] = []) => {
    try {
      const data = await mensajesApi.chat(Number(convId), { page, size: PAGE_SIZE })
      const mapped: ChatMessage[] = (data as Record<string, unknown>[]).map((m) => ({
        id: String(m.id ?? ""),
        content: String(m.contenido ?? ""),
        sender: mapSender(String(m.remitenteTipo ?? "")),
        timestamp: String(m.createdAt ?? new Date().toISOString()),
        senderName: String(m.remitenteNombre ?? ""),
      }))
      // Si es la primera página, retornar solo los nuevos mensajes
      // Si es una página anterior, agregar al inicio
      if (page === 0) {
        setHasMoreMessages(mapped.length >= PAGE_SIZE)
        return mapped
      } else {
        setHasMoreMessages(mapped.length >= PAGE_SIZE)
        // Agregar mensajes más antiguos al inicio
        return [...mapped, ...existingMessages]
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cargar mensajes")
      return existingMessages
    }
  }, [PAGE_SIZE])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // Auto-select conversation when redirected from another screen
  useEffect(() => {
    if (!autoSelectConvId || conversations.length === 0) return
    const target = conversations.find((c) => c.id === autoSelectConvId)
    if (target) {
      handleSelectConversation(target)
      if (onConvSelected) onConvSelected()
    }
  }, [autoSelectConvId, conversations]) // eslint-disable-line react-hooks/exhaustive-deps

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [selectedConversation?.messages])

  // Cargar mensajes más antiguos cuando se hace scroll hacia arriba
  const loadMoreMessages = useCallback(async () => {
    if (!selectedConversation || isLoadingMore || !hasMoreMessages) return
    
    setIsLoadingMore(true)
    const nextPage = currentPage + 1
    const updatedMessages = await fetchMessages(
      selectedConversation.id, 
      nextPage, 
      selectedConversation.messages
    )
    
    setSelectedConversation((prev) => {
      if (!prev) return prev
      return { ...prev, messages: updatedMessages }
    })
    setCurrentPage(nextPage)
    setIsLoadingMore(false)
  }, [selectedConversation, isLoadingMore, hasMoreMessages, currentPage, fetchMessages])

  // Manejar scroll para cargar más mensajes
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement
    // Si el scroll está cerca del tope (menos de 50px), cargar más mensajes
    if (target.scrollTop < 50 && hasMoreMessages && !isLoadingMore) {
      loadMoreMessages()
    }
  }, [hasMoreMessages, isLoadingMore, loadMoreMessages])

  // Función para formatear la fecha como separador
  const formatDateSeparator = (dateString: string): string => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const isToday = date.toDateString() === today.toDateString()
    const isYesterday = date.toDateString() === yesterday.toDateString()

    if (isToday) return "Hoy"
    if (isYesterday) return "Ayer"
    
    return date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  // Agrupar mensajes por fecha
  const getMessagesWithDateSeparators = (messages: ChatMessage[]) => {
    const result: { type: "date" | "message"; date?: string; message?: ChatMessage }[] = []
    let lastDate = ""

    messages.forEach((message) => {
      const messageDate = new Date(message.timestamp).toDateString()
      
      if (messageDate !== lastDate) {
        result.push({ type: "date", date: message.timestamp })
        lastDate = messageDate
      }
      result.push({ type: "message", message })
    })

    return result
  }

  // Función para cerrar conversación
  const handleCloseConversation = async () => {
    if (!selectedConversation) return
    try {
      await conversacionesApi.cerrar(Number(selectedConversation.id))
      // Actualizar la conversación en la lista
      setConversations((prev) =>
        prev.map((c) => c.id === selectedConversation.id ? { ...c, estado: "cerrada", status: "resolved" as const } : c)
      )
      setSelectedConversation((prev) => prev ? { ...prev, estado: "cerrada", status: "resolved" as const } : prev)
      toast.success("Conversación cerrada")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cerrar conversación")
    }
  }

  // Función para formatear hora en formato 9:46 a.m. o p.m.
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString.replace(" ", "T"))
      const hours = date.getHours()
      const minutes = date.getMinutes()
      const ampm = hours >= 12 ? "p.m." : "a.m."
      const hour12 = hours % 12 || 12
      return `${hour12}:${minutes.toString().padStart(2, "0")} ${ampm}`
    } catch {
      return ""
    }
  }

  // Contadores para los filtros
  const filterCounts = {
    all: conversations.length,
    unassigned: conversations.filter((c) => !c.empleadoId).length,
    assigned: conversations.filter((c) => c.empleadoId).length,
    unread: conversations.filter((c) => (c.mensajesNoLeidos || 0) > 0).length,
    closed: conversations.filter((c) => c.estado === "cerrada").length,
  }

  const filteredConversations = conversations.filter((conv) => {
    // Filtro por búsqueda
    const matchesSearch = conv.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.source.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Filtro por tab
    let matchesTab = true
    switch (filterTab) {
      case "unassigned":
        matchesTab = !conv.empleadoId
        break
      case "assigned":
        matchesTab = !!conv.empleadoId
        break
      case "unread":
        matchesTab = (conv.mensajesNoLeidos || 0) > 0
        break
      case "closed":
        matchesTab = conv.estado === "cerrada"
        break
      default:
        matchesTab = true
    }
    
    return matchesSearch && matchesTab
  })

  // Callback para mensajes en tiempo real de la conversación seleccionada
  const handleWebSocketMessage = useCallback((mensaje: MensajeWebSocket) => {
    // Actualizar la conversación seleccionada si el mensaje es para ella
    setSelectedConversation((prev) => {
      if (!prev || Number(prev.id) !== mensaje.conversacionId) return prev
      
      // Verificar si el mensaje ya existe para evitar duplicados
      const exists = prev.messages.some(
        (m) => m.id === String(mensaje.id) || m.content === mensaje.contenido
      )
      if (exists) return prev

      const newMessage: ChatMessage = {
        id: String(mensaje.id ?? `ws-${Date.now()}`),
        content: mensaje.contenido,
        sender: mapSender(mensaje.remitenteTipo),
        timestamp: mensaje.createdAt ?? new Date().toISOString(),
        senderName: mensaje.remitenteNombre ?? "",
      }

      return {
        ...prev,
        messages: [...prev.messages, newMessage],
      }
    })
  }, [])

  // Callback para actualizaciones de conversaciones vía WebSocket
  const handleConversationUpdate = useCallback((data: unknown) => {
    const conversacion = data as Record<string, unknown>
    const cliente = conversacion.cliente as Record<string, unknown> | undefined
    const clienteNombre = String(conversacion.clienteNombre ?? cliente?.nombre ?? "Sin nombre")
    const clienteEmail = String(conversacion.clienteEmail ?? cliente?.email ?? "")

    const mappedConversation: ChatConversation = {
      id: String(conversacion.id ?? ""),
      customer: {
        id: String(conversacion.clienteId ?? cliente?.id ?? ""),
        name: clienteNombre,
        email: clienteEmail,
        phone: String(cliente?.telefono ?? ""),
        source: String(conversacion.origen ?? ""),
        createdAt: String(conversacion.createdAt ?? conversacion.fechaCreacion ?? new Date().toISOString()),
        status: "active" as const,
      },
      messages: [],
      status: mapConvStatus(String(conversacion.estado ?? "")),
      source: String(conversacion.canal ?? conversacion.origen ?? ""),
      createdAt: String(conversacion.createdAt ?? conversacion.fechaCreacion ?? new Date().toISOString()),
      lastMessage: String(conversacion.ultimoMensaje ?? conversacion.tema ?? ""),
      mensajesNoLeidos: conversacion.mensajesNoLeidos ? Number(conversacion.mensajesNoLeidos) : 0,
      modoAtencion: (conversacion.modoAtencion as "BOT" | "HUMANO") ?? "HUMANO",
      empleadoId: conversacion.empleadoId ? Number(conversacion.empleadoId) : undefined,
      empleadoNombre: conversacion.empleadoNombre ? String(conversacion.empleadoNombre) : undefined,
      updatedAt: String(conversacion.updatedAt ?? conversacion.createdAt ?? new Date().toISOString()),
      estado: String(conversacion.estado ?? ""),
    }

    setConversations((prev) => {
      const index = prev.findIndex((c) => c.id === mappedConversation.id)
      if (index === -1) {
        // Nueva conversación - agregar al inicio
        // Notificar si tiene mensajes no leídos
        if (mappedConversation.mensajesNoLeidos && mappedConversation.mensajesNoLeidos > 0 && onNewMessage) {
          onNewMessage()
        }
        return [mappedConversation, ...prev]
      } else {
        // Actualizar conversación existente
        const updated = [...prev]
        const prevUnread = updated[index].mensajesNoLeidos || 0
        const newUnread = mappedConversation.mensajesNoLeidos || 0
        // Notificar si aumentaron los mensajes no leídos
        if (newUnread > prevUnread && onNewMessage) {
          onNewMessage()
        }
        // Preservar mensajes si la conversación está seleccionada
        updated[index] = {
          ...mappedConversation,
          messages: updated[index].messages,
        }
        return updated
      }
    })
  }, [onNewMessage])

  const handleSelectConversation = async (conv: ChatConversation) => {
    // Desuscribirse de la conversación anterior si existe
    const prevId = selectedConversation?.id ? Number(selectedConversation.id) : null
    if (prevId !== null) {
      chatWebSocket.unsubscribeFromConversation(prevId)
    }
    
    // Limpiar estado inmediatamente antes de cargar nuevos mensajes
    setSelectedConversation({ ...conv, messages: [], mensajesNoLeidos: 0 })
    setShowConversationList(false)
    
    // Resetear paginación
    setCurrentPage(0)
    setHasMoreMessages(true)
    
    // Cargar mensajes de la nueva conversación
    const msgs = await fetchMessages(conv.id, 0, [])
    setSelectedConversation({ ...conv, messages: msgs, mensajesNoLeidos: 0 })

    // Suscribirse a los mensajes de esta conversación específica
    chatWebSocket.subscribeToConversation(Number(conv.id), handleWebSocketMessage)

    // Mark all messages as read when conversation is opened
    const unreadCount = conv.mensajesNoLeidos || 0
    try {
      await mensajesApi.leerTodos(Number(conv.id))
      // Update conversation list to reflect read messages
      setConversations((prev) =>
        prev.map((c) => (c.id === conv.id ? { ...c, mensajesNoLeidos: 0 } : c))
      )
      // Notificar al componente padre para restar del badge total
      if (onMessagesRead && unreadCount > 0) {
        onMessagesRead(unreadCount)
      }
    } catch {
      // silently fail
    }
  }

  // Conectar WebSocket globalmente al montar el componente para recibir actualizaciones de conversaciones
  useEffect(() => {
    // Registrar callback para actualizaciones de lista de conversaciones
    chatWebSocket.setGlobalUpdateCallback(handleConversationUpdate)
    // Conectar si no lo está
   //chatWebSocket.connect()
    return () => {
      // Limpiar: desuscribir conversación activa y desconectar (opcional, pero admin-dashboard ya lo hace)
      if (selectedConversation) {
        chatWebSocket.unsubscribeFromConversation(Number(selectedConversation.id))
      }
      //chatWebSocket.disconnect()
    }
  }, [handleConversationUpdate, selectedConversation])

  const handleBackToList = () => {
    if (selectedConversation) {
      chatWebSocket.unsubscribeFromConversation(Number(selectedConversation.id))
    }
    setShowConversationList(true)
    setSelectedConversation(null)
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !employee) return

    try {
      await mensajesApi.crear(Number(selectedConversation.id), {
        contenido: newMessage,
        remitenteTipo: "empleado",
        remitenteId: Number(employee.id),
        tipoEvento: "MENSAJE",
      })

      const message: ChatMessage = {
        id: `m-${Date.now()}`,
        content: newMessage,
        sender: "agent",
        timestamp: new Date().toISOString(),
        senderName: employee.name,
      }

      setSelectedConversation({
        ...selectedConversation,
        messages: [...selectedConversation.messages, message],
        status: "active",
        assignedTo: employee,
      })
      setNewMessage("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al enviar mensaje")
    }
  }

  const handleTakeConversation = async () => {
    if (!selectedConversation || !employee) return

    try {
     /* await conversacionesApi.asignar(Number(selectedConversation.id), {
        empleadoId: Number(employee.id),
      })*/

await conversacionesApi.asignar(Number(selectedConversation.id), Number(employee.id))

      setSelectedConversation({
        ...selectedConversation,
        status: "active",
        assignedTo: employee,
      })
      fetchConversations()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al tomar conversacion")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-warning/20 text-warning border-warning/30 text-xs">
            <AlertCircle className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">Pendiente</span>
          </Badge>
        )
      case "active":
        return (
          <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
            <Clock className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">Activo</span>
          </Badge>
        )
      case "resolved":
        return (
          <Badge className="bg-success/20 text-success border-success/30 text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">Resuelto</span>
          </Badge>
        )
      default:
        return null
    }
  }

  const getSenderIcon = (sender: string) => {
    switch (sender) {
      case "bot":
        return <Bot className="h-4 w-4" />
      case "agent":
        return <Headphones className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] lg:h-[calc(100vh-6rem)] gap-4">
      {/* Conversations List */}
      <Card
        className={cn(
          "flex flex-col bg-card border-border overflow-hidden",
          "w-full lg:w-80 lg:flex-shrink-0",
          !showConversationList && "hidden lg:flex"
        )}
      >
        <div className="p-3 md:p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-foreground text-sm md:text-base">Conversaciones</h2>
            <Badge variant="secondary" className="text-xs">{filterCounts.all}</Badge>
          </div>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente o fuente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setFilterTab("all")}
              className={cn(
                "px-2 py-1 text-[10px] rounded-full transition-colors",
                filterTab === "all" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterTab("unassigned")}
              className={cn(
                "px-2 py-1 text-[10px] rounded-full transition-colors",
                filterTab === "unassigned" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              No Asignados ({filterCounts.unassigned})
            </button>
            <button
              onClick={() => setFilterTab("assigned")}
              className={cn(
                "px-2 py-1 text-[10px] rounded-full transition-colors",
                filterTab === "assigned" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              Asignados ({filterCounts.assigned})
            </button>
            <button
              onClick={() => setFilterTab("unread")}
              className={cn(
                "px-2 py-1 text-[10px] rounded-full transition-colors",
                filterTab === "unread" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              No Leidos ({filterCounts.unread})
            </button>
            <button
              onClick={() => setFilterTab("closed")}
              className={cn(
                "px-2 py-1 text-[10px] rounded-full transition-colors",
                filterTab === "closed" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              Cerradas ({filterCounts.closed})
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-2 space-y-1">
            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => handleSelectConversation(conv)}
                className={cn(
                  "w-full p-3 rounded-lg text-left transition-colors",
                  selectedConversation?.id === conv.id
                    ? "bg-primary/10 border border-primary/30"
                    : "hover:bg-secondary"
                )}
              >
                <div className="relative flex items-start gap-3 w-full">
                  <Avatar className="h-9 w-9 md:h-10 md:w-10 flex-shrink-0">
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-xs md:text-sm">
                      {conv.customer.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-medium text-foreground text-sm truncate">
                        {conv.customer.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {conv.updatedAt && formatTime(conv.updatedAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground truncate">{conv.source}</p>
                      {conv.empleadoNombre && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/30">
                          {conv.empleadoNombre.split(" ")[0]}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {conv.lastMessage}
                    </p>
                  </div>
                  {typeof conv.mensajesNoLeidos === "number" && conv.mensajesNoLeidos > 0 ? (
                    <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-[#25D366] text-[10px] font-bold text-white shadow-sm">
                      {conv.mensajesNoLeidos > 99 ? 99 : conv.mensajesNoLeidos}
                    </span>
                  ) : null}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
        </div>
      </Card>

      {/* Chat Area */}
      <Card
        className={cn(
          "flex-1 flex flex-col bg-card border-border min-h-0",
          showConversationList && !selectedConversation && "hidden lg:flex"
        )}
      >
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between p-3 md:p-4 border-b border-border">
              <div className="flex items-center gap-2 md:gap-3 min-w-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBackToList}
                  className="lg:hidden text-foreground hover:bg-secondary flex-shrink-0"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Avatar className="h-9 w-9 md:h-10 md:w-10 flex-shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs md:text-sm">
                    {selectedConversation.customer.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground text-sm md:text-base truncate">
                    {selectedConversation.customer.name}
                  </h3>
                  {selectedConversation.empleadoNombre && (
                    <p className="text-[10px] text-primary truncate">
                      Asignado a: {selectedConversation.empleadoNombre}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground truncate">
                    <span className="hidden sm:inline">{selectedConversation.customer.phone} | </span>
                    {selectedConversation.source}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                {selectedConversation.estado !== "cerrada" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCloseConversation}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    title="Cerrar conversación"
                  >
                    <XCircle className="h-5 w-5" />
                  </Button>
                )}
                <label className="flex items-center gap-2 cursor-pointer group">
                  <span className="text-xs text-muted-foreground hidden sm:inline">Asistente IA</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={selectedConversation.modoAtencion === "BOT"}
                    onClick={async () => {
                      const nuevoModo = selectedConversation.modoAtencion === "BOT" ? "HUMANO" : "BOT"
                      try {
                        await conversacionesApi.cambiarModo(Number(selectedConversation.id), nuevoModo)
                        setSelectedConversation((prev) => prev ? { ...prev, modoAtencion: nuevoModo } : prev)
                        toast.success(`Modo cambiado a ${nuevoModo === "BOT" ? "Asistente IA" : "Humano"}`)
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Error al cambiar modo")
                      }
                    }}
                    className={cn(
                      "relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
                      selectedConversation.modoAtencion === "BOT" ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                        selectedConversation.modoAtencion === "BOT" ? "translate-x-4" : "translate-x-0"
                      )}
                    />
                  </button>
                </label>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <div 
                ref={scrollAreaRef}
                className="h-full overflow-y-auto p-3 md:p-4"
                onScroll={handleScroll}
              >
                {/* Indicador de carga de más mensajes */}
                {isLoadingMore && (
                  <div className="flex justify-center py-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                  </div>
                )}
                {hasMoreMessages && !isLoadingMore && (
                  <div className="flex justify-center py-2">
                    <button 
                      onClick={loadMoreMessages}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Cargar mensajes anteriores
                    </button>
                  </div>
                )}
                <div className="space-y-3 md:space-y-4">
                  {getMessagesWithDateSeparators(selectedConversation.messages).map((item, index) => {
                    if (item.type === "date" && item.date) {
                      return (
                        <div key={`date-${index}`} className="flex items-center justify-center py-2">
                          <div className="bg-muted/50 text-muted-foreground text-xs px-3 py-1 rounded-full">
                            {formatDateSeparator(item.date)}
                          </div>
                        </div>
                      )
                    }
                    
                    if (item.type === "message" && item.message) {
                      const message = item.message
                      return (
                        <div
                          key={`msg-${message.id}-${index}`}
                          className={cn(
                            "flex gap-2 md:gap-3",
                            (message.sender === "agent" || message.sender === "bot") && "flex-row-reverse"
                          )}
                        >
                          <Avatar className="h-7 w-7 md:h-8 md:w-8 flex-shrink-0">
                            <AvatarFallback
                              className={cn(
                                "text-xs",
                                (message.sender === "bot" || message.sender === "agent")
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              {getSenderIcon(message.sender)}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={cn(
                              "max-w-[80%] md:max-w-[70%] rounded-lg p-2 md:p-3",
                              (message.sender === "agent" || message.sender === "bot")
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {message.senderName && (
                              <p className="text-[10px] md:text-xs font-medium mb-1 opacity-80">
                                {message.senderName}
                              </p>
                            )}
                            <p className="text-xs md:text-sm">{message.content}</p>
                            <p className="text-[10px] mt-1 opacity-60">
                              {new Date(message.timestamp).toLocaleTimeString("es-MX", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      )
                    }
                    return null
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>

            {/* Message Input */}
            <div className="p-3 md:p-4 border-t border-border">
              {selectedConversation.status === "pending" &&
              selectedConversation.assignedTo?.id !== employee?.id ? (
                <Button
                  onClick={handleTakeConversation}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Headphones className="mr-2 h-4 w-4" />
                  Tomar conversación
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder={selectedConversation.modoAtencion === "BOT" ? "Asistente IA activo - Entrada deshabilitada" : "Escribe un mensaje..."}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    disabled={selectedConversation.modoAtencion === "BOT"}
                    className={cn(
                      "flex-1 bg-input border-border text-foreground placeholder:text-muted-foreground text-sm",
                      selectedConversation.modoAtencion === "BOT" && "opacity-50 cursor-not-allowed"
                    )}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || selectedConversation.modoAtencion === "BOT"}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <MessageSquare className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-1 text-sm md:text-base">Sin conversación seleccionada</h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                Selecciona una conversación para comenzar a chatear
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

function mapConvStatus(estado: string): ChatConversation["status"] {
  const e = estado?.toLowerCase()
  if (e === "pendiente" || e === "pending" || e === "nueva" || e === "new") return "pending"
  if (e === "en_atencion" || e === "active" || e === "activa" || e === "abierta") return "active"
  if (e === "cerrada" || e === "closed" || e === "resolved" || e === "resuelta") return "resolved"
  return "resolved"
}

function mapSender(tipo: string): ChatMessage["sender"] {
  const t = tipo?.toLowerCase()
  if (t === "bot" || t === "chatbot") return "bot"
  if (t === "empleado" || t === "agent" || t === "agente") return "agent"
  return "customer"
}

function MessageSquare(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}
"use client"

import React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import { conversacionesApi, mensajesApi } from "@/lib/api-service"
import type { ChatConversation, ChatMessage } from "@/lib/types"
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
  Phone,
  MoreVertical,
  Clock,
  CheckCircle,
  AlertCircle,
  Bot,
  User,
  Headphones,
  ArrowLeft,
} from "lucide-react"

interface ChatSupportProps {
  autoSelectConvId?: string | null
  onConvSelected?: () => void
}

export function ChatSupport({ autoSelectConvId, onConvSelected }: ChatSupportProps) {
  const { employee } = useAuth()
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [showConversationList, setShowConversationList] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchConversations = useCallback(async () => {
    try {
      const data = await conversacionesApi.listar()
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
          lastMessage: String(c.tema ?? ""),
        }
      })
      setConversations(mapped)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cargar conversaciones")
    }
  }, [])

  const fetchMessages = useCallback(async (convId: string) => {
    try {
      const data = await mensajesApi.chat(Number(convId))
      const mapped: ChatMessage[] = (data as Record<string, unknown>[]).map((m) => ({
        id: String(m.id ?? ""),
        content: String(m.contenido ?? ""),
        sender: mapSender(String(m.remitenteTipo ?? "")),
        timestamp: String(m.fechaEnvio ?? new Date().toISOString()),
        senderName: String(m.remitenteNombre ?? ""),
      }))
      return mapped
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cargar mensajes")
      return []
    }
  }, [])

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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [selectedConversation?.messages])

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.source.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelectConversation = async (conv: ChatConversation) => {
    const msgs = await fetchMessages(conv.id)
    setSelectedConversation({ ...conv, messages: msgs })
    setShowConversationList(false)
    // Mark all messages as read when conversation is opened
    try {
      await mensajesApi.leerTodos(Number(conv.id))
    } catch {
      // silently fail
    }
  }

  const handleBackToList = () => {
    setShowConversationList(true)
    setSelectedConversation(null)
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !employee) return

    try {
      await mensajesApi.crear(Number(selectedConversation.id), {
        contenido: newMessage,
        tipoContenido: "texto",
        remitenteTipo: "empleado",
        remitenteId: Number(employee.id),
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
      {/* Conversations List */}
      <Card
        className={cn(
          "flex flex-col bg-card border-border overflow-hidden",
          "w-full lg:w-80 lg:flex-shrink-0",
          !showConversationList && "hidden lg:flex"
        )}
      >
        <div className="p-3 md:p-4 border-b border-border flex-shrink-0">
          <h2 className="font-semibold text-foreground mb-3 text-sm md:text-base">Conversaciones</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente o fuente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground text-sm"
            />
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
                <div className="flex items-start gap-3">
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
                      {getStatusBadge(conv.status)}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{conv.source}</p>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {conv.lastMessage}
                    </p>
                  </div>
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
                  <p className="text-xs text-muted-foreground truncate">
                    <span className="hidden sm:inline">{selectedConversation.customer.phone} | </span>
                    {selectedConversation.source}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                {getStatusBadge(selectedConversation.status)}
                <Button variant="ghost" size="icon" className="text-foreground hover:bg-secondary hidden sm:flex">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-foreground hover:bg-secondary">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="h-full p-3 md:p-4">
              <div className="space-y-3 md:space-y-4">
                {selectedConversation.messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-2 md:gap-3",
                      message.sender === "agent" && "flex-row-reverse"
                    )}
                  >
                    <Avatar className="h-7 w-7 md:h-8 md:w-8 flex-shrink-0">
                      <AvatarFallback
                        className={cn(
                          "text-xs",
                          message.sender === "bot"
                            ? "bg-secondary text-secondary-foreground"
                            : message.sender === "agent"
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
                        message.sender === "agent"
                          ? "bg-primary text-primary-foreground"
                          : message.sender === "bot"
                            ? "bg-secondary text-secondary-foreground"
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
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
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
                    placeholder="Escribe un mensaje..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    className="flex-1 bg-input border-border text-foreground placeholder:text-muted-foreground text-sm"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
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

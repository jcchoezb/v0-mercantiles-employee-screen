import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";

// URL del WebSocket - ajustar según el entorno
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:8080/ws-chat";

export interface MensajeWebSocket {
  id?: number;
  conversacionId: number;
  contenido: string;
  remitenteTipo: "empleado" | "cliente" | "bot" | "sistema";
  remitenteId?: number;
  remitenteNombre?: string;
  tipoContenido?: string;
  tipoEvento?: string;
  createdAt?: string;
  leido?: boolean;
}

class ChatWebSocket {
  private stompClient: Client | null = null;
  private messageSubscription: { unsubscribe: () => void } | null = null;
  private conversationSubscription: { unsubscribe: () => void } | null = null;
  private onMessageCallback: ((mensaje: MensajeWebSocket) => void) | null = null;
  private onConversationUpdateCallback: ((data: Record<string, unknown>) => void) | null = null;
  private currentConversationId: number | null = null;
  private isConnected: boolean = false;

  // Conectar al WebSocket y suscribirse a una conversación específica
  connect(
    conversationId: number,
    onMessageReceived: (mensaje: MensajeWebSocket) => void,
    onConversationUpdate?: (data: Record<string, unknown>) => void
  ) {
    this.disconnect(); // Cierra conexión anterior si existe
    this.currentConversationId = conversationId;
    this.onMessageCallback = onMessageReceived;
    this.onConversationUpdateCallback = onConversationUpdate || null;

    const socket = new SockJS(WS_URL);
    this.stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log(
          `[WebSocket] Conectado. Suscribiendo a /topic/conversacion/${conversationId}/mensajes`
        );
        this.isConnected = true;

        // Suscripción a mensajes de la conversación
        if (this.stompClient) {
          this.messageSubscription = this.stompClient.subscribe(
            `/topic/conversacion/${conversationId}/mensajes`,
            (message: IMessage) => {
              const nuevoMensaje: MensajeWebSocket = JSON.parse(message.body);
              if (this.onMessageCallback) {
                this.onMessageCallback(nuevoMensaje);
              }
            }
          );

          // Suscripción a actualizaciones de conversaciones (para actualizar lista)
          this.conversationSubscription = this.stompClient.subscribe(
            `/topic/conversaciones`,
            (message: IMessage) => {
              const data = JSON.parse(message.body);
              if (this.onConversationUpdateCallback) {
                this.onConversationUpdateCallback(data);
              }
            }
          );
        }
      },
      onDisconnect: () => {
        console.log("[WebSocket] Desconectado");
        this.isConnected = false;
      },
      onStompError: (frame) => {
        console.error("[WebSocket] Error STOMP:", frame.headers["message"]);
        this.isConnected = false;
      },
    });

    this.stompClient.activate();
  }

  // Desconectar y limpiar suscripciones
  disconnect() {
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
      this.messageSubscription = null;
    }
    if (this.conversationSubscription) {
      this.conversationSubscription.unsubscribe();
      this.conversationSubscription = null;
    }
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
    }
    this.currentConversationId = null;
    this.onMessageCallback = null;
    this.onConversationUpdateCallback = null;
    this.isConnected = false;
  }

  // Enviar mensaje por WebSocket (si el backend lo soporta)
  sendMessage(conversationId: number, mensajeRequest: Partial<MensajeWebSocket>) {
    if (this.stompClient && this.isConnected) {
      this.stompClient.publish({
        destination: `/app/chat/${conversationId}`,
        body: JSON.stringify(mensajeRequest),
      });
      return true;
    }
    console.warn("[WebSocket] No conectado, usando REST fallback");
    return false;
  }

  // Verificar si está conectado
  getIsConnected(): boolean {
    return this.isConnected;
  }

  // Obtener la conversación actual
  getCurrentConversationId(): number | null {
    return this.currentConversationId;
  }
}

// Exportar instancia singleton
const chatWebSocket = new ChatWebSocket();
export default chatWebSocket;

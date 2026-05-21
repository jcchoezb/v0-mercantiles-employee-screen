/*import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";

// URL del WebSocket - ajustar según el entorno
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:8080/api/ws-chat";

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

  // Conectar al WebSocket solo para escuchar actualizaciones de conversaciones (sin seleccionar una específica)
  connectGlobal(onConversationUpdate: (data: Record<string, unknown>) => void) {
    // Si ya está conectado, solo actualizar el callback
    if (this.isConnected && this.stompClient) {
      this.onConversationUpdateCallback = onConversationUpdate;
      return;
    }

    this.disconnect(); // Cierra conexión anterior si existe
    this.onConversationUpdateCallback = onConversationUpdate;

    const socket = new SockJS(WS_URL);
    this.stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log("[WebSocket] Conectado globalmente a /topic/conversaciones");
        this.isConnected = true;

        if (this.stompClient) {
          // Suscripción a actualizaciones de conversaciones
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

  // Suscribirse a una conversación específica (requiere conexión previa con connectGlobal o connect)
  subscribeToConversation(
    conversationId: number,
    onMessageReceived: (mensaje: MensajeWebSocket) => void
  ) {
    this.currentConversationId = conversationId;
    this.onMessageCallback = onMessageReceived;

    if (this.stompClient && this.isConnected) {
      // Desuscribir de la conversación anterior si existe
      if (this.messageSubscription) {
        this.messageSubscription.unsubscribe();
        this.messageSubscription = null;
      }

      console.log(`[WebSocket] Suscribiendo a /topic/conversacion/${conversationId}/mensajes`);
      this.messageSubscription = this.stompClient.subscribe(
        `/topic/conversacion/${conversationId}/mensajes`,
        (message: IMessage) => {
          const nuevoMensaje: MensajeWebSocket = JSON.parse(message.body);
          if (this.onMessageCallback) {
            this.onMessageCallback(nuevoMensaje);
          }
        }
      );
    }
  }

  // Desuscribirse de la conversación actual (pero mantener conexión global)
  unsubscribeFromConversation() {
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
      this.messageSubscription = null;
    }
    this.currentConversationId = null;
    this.onMessageCallback = null;
  }

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
*/



/* //VERSION 2 FUCNIONAL
import { Client, IMessage } from "@stomp/stompjs";

// URL base desde variable de entorno (ej: "http://localhost:8080/api/ws-chat" o "https://...")
const WS_URL_BASE = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/api/ws-chat/websocket";
// Convertir a WS/WSS automáticamente (http -> ws, https -> wss)
const WS_URL = WS_URL_BASE.replace(/^http/, 'ws');

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

  // Conectar globalmente (solo escucha actualizaciones de conversaciones)
  connectGlobal(onConversationUpdate: (data: Record<string, unknown>) => void) {
    if (this.isConnected && this.stompClient) {
      this.onConversationUpdateCallback = onConversationUpdate;
      return;
    }

    this.disconnect();
    this.onConversationUpdateCallback = onConversationUpdate;

    this.stompClient = new Client({
      brokerURL: WS_URL,              // WebSocket nativo (sin SockJS)
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log("[WebSocket] Conectado globalmente a /topic/conversaciones");
        this.isConnected = true;

        if (this.stompClient) {
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

  // Suscribirse a una conversación específica (requiere conexión global previa)
  subscribeToConversation(
    conversationId: number,
    onMessageReceived: (mensaje: MensajeWebSocket) => void
  ) {
    this.currentConversationId = conversationId;
    this.onMessageCallback = onMessageReceived;

    if (this.stompClient && this.isConnected) {
      if (this.messageSubscription) {
        this.messageSubscription.unsubscribe();
        this.messageSubscription = null;
      }

      console.log(`[WebSocket] Suscribiendo a /topic/conversacion/${conversationId}/mensajes`);
      this.messageSubscription = this.stompClient.subscribe(
        `/topic/conversacion/${conversationId}/mensajes`,
        (message: IMessage) => {
          const nuevoMensaje: MensajeWebSocket = JSON.parse(message.body);
          if (this.onMessageCallback) {
            this.onMessageCallback(nuevoMensaje);
          }
        }
      );
    }
  }

  // Desuscribirse de la conversación actual (pero mantener conexión global)
  unsubscribeFromConversation() {
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
      this.messageSubscription = null;
    }
    this.currentConversationId = null;
    this.onMessageCallback = null;
  }

  // Conectar y suscribirse directamente a una conversación (incluye global)
  connect(
    conversationId: number,
    onMessageReceived: (mensaje: MensajeWebSocket) => void,
    onConversationUpdate?: (data: Record<string, unknown>) => void
  ) {
    this.disconnect();
    this.currentConversationId = conversationId;
    this.onMessageCallback = onMessageReceived;
    this.onConversationUpdateCallback = onConversationUpdate || null;

    this.stompClient = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log(
          `[WebSocket] Conectado. Suscribiendo a /topic/conversacion/${conversationId}/mensajes`
        );
        this.isConnected = true;

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

  // Desconectar y limpiar todo
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

  // Enviar mensaje por WebSocket
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

  getIsConnected(): boolean {
    return this.isConnected;
  }

  getCurrentConversationId(): number | null {
    return this.currentConversationId;
  }
}

const chatWebSocket = new ChatWebSocket();
export default chatWebSocket;*/


/* //VERSION 3 FUNCIONAL OK CASI PERFECTA

import { Client, IMessage } from "@stomp/stompjs";

const WS_URL_BASE = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:8080/api/ws-chat";
const WS_URL = WS_URL_BASE.replace(/^http/, 'ws');

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

// Helper para obtener el token (mismo que usa api-service.ts)
function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth_token");
  }
  return null;
}

class ChatWebSocket {
  private stompClient: Client | null = null;
  private messageSubscription: { unsubscribe: () => void } | null = null;
  private conversationSubscription: { unsubscribe: () => void } | null = null;
  private onMessageCallback: ((mensaje: MensajeWebSocket) => void) | null = null;
  private onConversationUpdateCallback: ((data: Record<string, unknown>) => void) | null = null;
  private currentConversationId: number | null = null;
  private isConnected: boolean = false;

  // Obtener headers de autenticación (mismo formato que api-service)
  private getConnectHeaders(): Record<string, string> {
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }

  // Conectar globalmente (solo escucha actualizaciones de conversaciones)
  connectGlobal(onConversationUpdate: (data: Record<string, unknown>) => void) {
    if (this.isConnected && this.stompClient) {
      this.onConversationUpdateCallback = onConversationUpdate;
      return;
    }

    this.disconnect();
    this.onConversationUpdateCallback = onConversationUpdate;

    this.stompClient = new Client({
      brokerURL: WS_URL,
      connectHeaders: this.getConnectHeaders(),  // 👈 Token automático
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log("[WebSocket] Conectado globalmente a /topic/conversaciones");
        this.isConnected = true;

        if (this.stompClient) {
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

  // Suscribirse a una conversación específica
  subscribeToConversation(
    conversationId: number,
    onMessageReceived: (mensaje: MensajeWebSocket) => void
  ) {
    this.currentConversationId = conversationId;
    this.onMessageCallback = onMessageReceived;

    if (this.stompClient && this.isConnected) {
      if (this.messageSubscription) {
        this.messageSubscription.unsubscribe();
        this.messageSubscription = null;
      }

      console.log(`[WebSocket] Suscribiendo a /topic/conversacion/${conversationId}/mensajes`);
      this.messageSubscription = this.stompClient.subscribe(
        `/topic/conversacion/${conversationId}/mensajes`,
        (message: IMessage) => {
          const nuevoMensaje: MensajeWebSocket = JSON.parse(message.body);
          if (this.onMessageCallback) {
            this.onMessageCallback(nuevoMensaje);
          }
        }
      );
    }
  }

  // Desuscribirse de la conversación actual
  unsubscribeFromConversation() {
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
      this.messageSubscription = null;
    }
    this.currentConversationId = null;
    this.onMessageCallback = null;
  }

  // Conectar y suscribirse directamente a una conversación
  connect(
    conversationId: number,
    onMessageReceived: (mensaje: MensajeWebSocket) => void,
    onConversationUpdate?: (data: Record<string, unknown>) => void
  ) {
    this.disconnect();
    this.currentConversationId = conversationId;
    this.onMessageCallback = onMessageReceived;
    this.onConversationUpdateCallback = onConversationUpdate || null;

    this.stompClient = new Client({
      brokerURL: WS_URL,
      connectHeaders: this.getConnectHeaders(),  // 👈 Token automático
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log(
          `[WebSocket] Conectado. Suscribiendo a /topic/conversacion/${conversationId}/mensajes`
        );
        this.isConnected = true;

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

  // Desconectar y limpiar todo
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

  // Enviar mensaje por WebSocket
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

  getIsConnected(): boolean {
    return this.isConnected;
  }

  getCurrentConversationId(): number | null {
    return this.currentConversationId;
  }
}

const chatWebSocket = new ChatWebSocket();
export default chatWebSocket;*/

import { Client, IMessage } from "@stomp/stompjs";

const WS_URL_BASE = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:8080/api/ws-chat";
const WS_URL = WS_URL_BASE.replace(/^http/, 'ws');

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

function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth_token");
  }
  return null;
}

class ChatWebSocket {
  private stompClient: Client | null = null;
  private subscriptions = new Map<number, { unsubscribe: () => void }>();
  private globalSubscription: { unsubscribe: () => void } | null = null;
  private isConnected = false;

  // Callbacks externos
  private onGlobalUpdate: ((data: unknown) => void) | null = null;
  private onMessageCallbacks = new Map<number, (msg: MensajeWebSocket) => void>();

  // Iniciar conexión única
  connect() {
    if (this.stompClient?.connected || this.isConnected) {
      console.log("[WebSocket] Ya conectado, no se crea nueva conexión");
      return;
    }

    const token = getAuthToken();
    if (!token) {
      console.warn("[WebSocket] No hay token, esperando autenticación...");
      return;
    }

    console.log("[WebSocket] Iniciando conexión única...");
    this.stompClient = new Client({
      brokerURL: WS_URL,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log("[WebSocket] ✅ Conectado exitosamente (única instancia)");
        this.isConnected = true;

        // Suscripción global (una sola vez)
        this.globalSubscription = this.stompClient!.subscribe(
          "/topic/conversaciones",
          (msg: IMessage) => {
            const data = JSON.parse(msg.body);
            this.onGlobalUpdate?.(data);
          }
        );

        // Re‑suscribir a todas las conversaciones que ya tenían callback registrado
        for (const [convId, callback] of this.onMessageCallbacks.entries()) {
          this.subscribeToConversationInternal(convId, callback);
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

  // Registrar callback para eventos globales (lista de conversaciones)
  setGlobalUpdateCallback(callback: (data: unknown) => void) {
    this.onGlobalUpdate = callback;
    if (!this.isConnected && !this.stompClient?.connected) {
      this.connect();
    }
  }

  // Suscribirse a una conversación específica (callback para nuevos mensajes)
  subscribeToConversation(conversationId: number, onMessage: (msg: MensajeWebSocket) => void) {
    // Guardar callback
    this.onMessageCallbacks.set(conversationId, onMessage);

    if (this.isConnected && this.stompClient) {
      this.subscribeToConversationInternal(conversationId, onMessage);
    } else {
      this.connect(); // Asegurar conexión antes de suscribir
    }
  }

  private subscribeToConversationInternal(conversationId: number, onMessage: (msg: MensajeWebSocket) => void) {
    if (this.subscriptions.has(conversationId)) {
      console.log(`[WebSocket] Ya suscrito a conversación ${conversationId}`);
      return;
    }
    const sub = this.stompClient!.subscribe(
      `/topic/conversacion/${conversationId}/mensajes`,
      (msg: IMessage) => {
        const mensaje: MensajeWebSocket = JSON.parse(msg.body);
        onMessage(mensaje);
      }
    );
    this.subscriptions.set(conversationId, sub);
    console.log(`[WebSocket] Suscrito a conversación ${conversationId}`);
  }

  // Desuscribirse de una conversación
  unsubscribeFromConversation(conversationId: number) {
    const sub = this.subscriptions.get(conversationId);
    sub?.unsubscribe();
    this.subscriptions.delete(conversationId);
    this.onMessageCallbacks.delete(conversationId);
    console.log(`[WebSocket] Desuscrito de conversación ${conversationId}`);
  }

  // Enviar mensaje por WebSocket
  sendMessage(conversationId: number, mensajeRequest: Partial<MensajeWebSocket>) {
    if (this.isConnected && this.stompClient) {
      this.stompClient.publish({
        destination: `/app/chat/${conversationId}`,
        body: JSON.stringify(mensajeRequest),
      });
      return true;
    }
    console.warn("[WebSocket] No conectado, mensaje no enviado");
    return false;
  }

  // Verificar estado
  getIsConnected(): boolean {
    return this.isConnected;
  }

  // Obtener lista de conversaciones suscritas (útil para depuración)
  getSubscribedConversations(): number[] {
    return Array.from(this.subscriptions.keys());
  }

  // Desconectar completamente
  disconnect() {
    console.log("[WebSocket] Desconectando completamente...");
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions.clear();
    this.globalSubscription?.unsubscribe();
    this.globalSubscription = null;
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
    }
    this.isConnected = false;
    this.onMessageCallbacks.clear();
    this.onGlobalUpdate = null;
  }
}

// Singleton exportado
const chatWebSocket = new ChatWebSocket();
export default chatWebSocket;
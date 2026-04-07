export interface Employee {
  id: string
  name: string
  email: string
  role: "admin" | "agent" | "supervisor"
  avatar?: string
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  source: string
  createdAt: string
  status: "active" | "inactive" | "pending"
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  stock: number
  status: "active" | "inactive"
}

export interface ChatMessage {
  id: string
  content: string
  sender: "customer" | "agent" | "bot"
  timestamp: string
  senderName?: string
}

export interface ChatConversation {
  id: string
  customer: Customer
  messages: ChatMessage[]
  status: "pending" | "active" | "resolved"
  assignedTo?: Employee
  source: string
  createdAt: string
  lastMessage?: string
}

export interface ChatbotRecord {
  id: string
  type: "appointment" | "survey" | "document" | "quote"
  customerId: string
  customerName: string
  content: string
  createdAt: string
  conversationId: string
  status: "pending" | "completed" | "cancelled"
}

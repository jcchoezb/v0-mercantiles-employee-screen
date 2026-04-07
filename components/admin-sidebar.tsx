"use client"

import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  MessageSquare,
  Users,
  Package,
  FileText,
  LogOut,
  Building2,
  ChevronLeft,
  ChevronRight,
  Menu,
  BarChart3,
  UserCog,
  Settings,
  Layers,
  Settings2,
  BookOpen,
  Megaphone,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useState } from "react"

interface AdminSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  collapsed: boolean
  onToggleCollapse: () => void
  chatBadge?: number
}

const menuItems = [
  { id: "chat", label: "Chat en Vivo", icon: MessageSquare, roles: ["admin", "supervisor", "agent"] },
  { id: "customers", label: "Clientes", icon: Users, roles: ["admin", "supervisor", "agent"] },
  { id: "products", label: "Productos", icon: Package, roles: ["admin", "supervisor"] },
  { id: "categories", label: "Categorias", icon: Layers, roles: ["admin", "supervisor"] },
  { id: "records", label: "Historial Bot", icon: FileText, roles: ["admin", "supervisor", "agent"] },
  { id: "reports", label: "Reportes", icon: BarChart3, roles: ["admin", "supervisor", "agent"] },
  { id: "employees", label: "Empleados", icon: UserCog, roles: ["admin"] },
  { id: "parameters", label: "Parametros", icon: Settings2, roles: ["admin"] },
  { id: "catalogs", label: "Catalogos", icon: BookOpen, roles: ["admin"] },
  { id: "campaigns", label: "Campanas", icon: Megaphone, roles: ["admin", "supervisor"] },
  { id: "settings", label: "Configuracion", icon: Settings, roles: ["admin", "supervisor", "agent"] },
]

function SidebarContent({
  activeTab,
  onTabChange,
  collapsed,
  onToggleCollapse,
  chatBadge,
  isMobile = false,
  onClose,
}: AdminSidebarProps & { isMobile?: boolean; onClose?: () => void }) {
  const { employee, logout } = useAuth()

  const handleTabChange = (tab: string) => {
    onTabChange(tab)
    if (isMobile && onClose) {
      onClose()
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-sidebar",
        !isMobile && "border-r border-sidebar-border transition-all duration-300",
        !isMobile && (collapsed ? "w-16" : "w-64")
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        <div className={cn("flex items-center gap-3", collapsed && !isMobile && "justify-center w-full")}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary flex-shrink-0">
            <Building2 className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          {(!collapsed || isMobile) && (
            <span className="font-semibold text-sidebar-foreground">Mercantiles</span>
          )}
        </div>
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className={cn("text-sidebar-foreground hover:bg-sidebar-accent", collapsed && "hidden")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {collapsed && !isMobile && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="mx-auto mt-2 text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}

      <nav className="flex-1 p-2 space-y-1">
        {menuItems.filter((item) => item.roles.includes(employee?.role ?? "agent")).map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            onClick={() => handleTabChange(item.id)}
            className={cn(
              "w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              activeTab === item.id && "bg-sidebar-accent text-sidebar-primary",
              collapsed && !isMobile && "justify-center px-2"
            )}
          >
            <div className="relative">
              <item.icon className="h-5 w-5" />
              {item.id === "chat" && chatBadge !== undefined && chatBadge > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                  {chatBadge > 99 ? "99+" : chatBadge}
                </span>
              )}
            </div>
            {(!collapsed || isMobile) && <span>{item.label}</span>}
          </Button>
        ))}
      </nav>

      <div className="p-2 border-t border-sidebar-border">
        <ThemeToggle collapsed={collapsed && !isMobile} />
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <div className={cn("flex items-center gap-3", collapsed && !isMobile && "justify-center")}>
          <Avatar className="h-9 w-9 bg-sidebar-accent flex-shrink-0">
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-sm">
              {employee?.avatar || "U"}
            </AvatarFallback>
          </Avatar>
          {(!collapsed || isMobile) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {employee?.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">{employee?.role}</p>
            </div>
          )}
          {(!collapsed || isMobile) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-destructive flex-shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
        {collapsed && !isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="w-full mt-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

export function AdminSidebar(props: AdminSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile Menu Button */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-4 left-4 z-50 lg:hidden bg-sidebar border border-sidebar-border text-sidebar-foreground"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64 bg-sidebar border-sidebar-border">
          <SidebarContent {...props} isMobile onClose={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex h-screen sticky top-0">
        <SidebarContent {...props} />
      </aside>
    </>
  )
}

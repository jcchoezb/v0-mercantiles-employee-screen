"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  collapsed?: boolean
  className?: string
}

export function ThemeToggle({ collapsed = false, className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className={cn("h-9 w-9", className)} disabled>
        <Sun className="h-4 w-4" />
      </Button>
    )
  }

  const isDark = theme === "dark"

  return (
    <Button
      variant="ghost"
      size={collapsed ? "icon" : "default"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "text-sidebar-foreground hover:bg-sidebar-accent",
        collapsed ? "h-9 w-9" : "w-full justify-start gap-3",
        className
      )}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      {!collapsed && (
        <span>{isDark ? "Modo Claro" : "Modo Oscuro"}</span>
      )}
    </Button>
  )
}

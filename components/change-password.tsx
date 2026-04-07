"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import { authApi } from "@/lib/api-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, User, Mail, Shield } from "lucide-react"

export function ChangePassword() {
  const { employee } = useAuth()
  const [passwordActual, setPasswordActual] = useState("")
  const [passwordNueva, setPasswordNueva] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (passwordNueva !== passwordConfirm) {
      setMessage({ type: "error", text: "Las contrasenas nuevas no coinciden" })
      return
    }

    if (passwordNueva.length < 6) {
      setMessage({ type: "error", text: "La contrasena nueva debe tener al menos 6 caracteres" })
      return
    }

    try {
      setIsLoading(true)
      await authApi.cambiarPassword(passwordActual, passwordNueva)
      setMessage({ type: "success", text: "Contrasena actualizada correctamente" })
      setPasswordActual("")
      setPasswordNueva("")
      setPasswordConfirm("")
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error al cambiar la contrasena"
      toast.error(errorMsg)
      setMessage({
        type: "error",
        text: errorMsg,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
      {/* Profile Card */}
      <Card className="bg-card border-border lg:col-span-1">
        <CardHeader className="pb-4">
          <CardTitle className="text-base text-card-foreground">Mi Perfil</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <Avatar className="h-20 w-20 bg-primary">
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
              {employee?.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-card-foreground">{employee?.name}</h3>
            <Badge variant="outline" className="mt-1 text-xs border-primary text-primary">
              {employee?.role === "admin"
                ? "Administrador"
                : employee?.role === "supervisor"
                  ? "Supervisor"
                  : "Agente"}
            </Badge>
          </div>
          <div className="w-full space-y-3 pt-2">
            <div className="flex items-center gap-3 text-sm">
              <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">Nombre:</span>
              <span className="text-card-foreground ml-auto truncate">{employee?.name}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">Email:</span>
              <span className="text-card-foreground ml-auto truncate">{employee?.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Shield className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">Rol:</span>
              <span className="text-card-foreground ml-auto">{employee?.role}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card className="bg-card border-border lg:col-span-2">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base text-card-foreground">Cambiar Contrasena</CardTitle>
              <CardDescription>Actualiza tu contrasena de acceso al sistema</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Success / Error message */}
            {message && (
              <div
                className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                  message.type === "success"
                    ? "bg-success/10 text-success border border-success/20"
                    : "bg-destructive/10 text-destructive border border-destructive/20"
                }`}
              >
                {message.type === "success" ? (
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                )}
                {message.text}
              </div>
            )}

            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="current" className="text-card-foreground">
                Contrasena Actual
              </Label>
              <div className="relative">
                <Input
                  id="current"
                  type={showCurrent ? "text" : "password"}
                  value={passwordActual}
                  onChange={(e) => setPasswordActual(e.target.value)}
                  placeholder="Ingresa tu contrasena actual"
                  required
                  className="bg-input border-border text-foreground pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowCurrent(!showCurrent)}
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="new" className="text-card-foreground">
                Contrasena Nueva
              </Label>
              <div className="relative">
                <Input
                  id="new"
                  type={showNew ? "text" : "password"}
                  value={passwordNueva}
                  onChange={(e) => setPasswordNueva(e.target.value)}
                  placeholder="Ingresa la nueva contrasena"
                  required
                  className="bg-input border-border text-foreground pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowNew(!showNew)}
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-card-foreground">
                Confirmar Contrasena Nueva
              </Label>
              <div className="relative">
                <Input
                  id="confirm"
                  type={showConfirm ? "text" : "password"}
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="Repite la nueva contrasena"
                  required
                  className="bg-input border-border text-foreground pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {passwordNueva && passwordConfirm && passwordNueva !== passwordConfirm && (
                <p className="text-xs text-destructive">Las contrasenas no coinciden</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading || !passwordActual || !passwordNueva || !passwordConfirm}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isLoading ? "Actualizando..." : "Cambiar Contrasena"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

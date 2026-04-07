"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { productosApi, categoriasApi } from "@/lib/api-service"
import type { Product } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Package,
  DollarSign,
  Tag,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react"

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
  ].join("\n")
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${filename}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

interface ApiCategoria {
  id: number
  nombre: string
  activo?: boolean
}

export function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [apiCategories, setApiCategories] = useState<ApiCategoria[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 4
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    categoryId: "",
    stock: 999,
    status: "active" as Product["status"],
  })

  const fetchCategories = useCallback(async () => {
    try {
      const data = await categoriasApi.listar()
      setApiCategories(
        (data as ApiCategoria[]).map((c) => ({
          id: Number(c.id),
          nombre: String(c.nombre),
          activo: Boolean(c.activo),
        }))
      )
    } catch {
      // silently fail - categories are non-critical
    }
  }, [])

  const fetchProducts = useCallback(async () => {
    try {
      const data = await productosApi.listar()
      const mapped: Product[] = (data as Record<string, unknown>[]).map((p) => ({
        id: String(p.id ?? ""),
        name: String(p.nombre ?? ""),
        description: String(p.descripcion ?? ""),
        price: Number(p.precio ?? 0),
        category: String((p.categoria as Record<string, unknown>)?.nombre ?? p.categoriaNombre ?? "Sin categoria"),
        stock: Number(p.stock ?? 0),
        status: p.activo ? "active" as const : "inactive" as const,
      }))
      setProducts(mapped)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cargar productos")
    }
  }, [])

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [fetchProducts, fetchCategories])

  const categories = [...new Set(products.map((p) => p.category))]

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, categoryFilter])

  const stats = {
    total: products.length,
    active: products.filter((p) => p.status === "active").length,
    categories: categories.length,
  }

  const handleDownload = () => {
    const headers = ["Nombre", "Descripcion", "Precio", "Categoria", "Stock", "Estado"]
    const rows = filteredProducts.map((p) => [
      p.name,
      p.description,
      String(p.price),
      p.category,
      String(p.stock),
      p.status === "active" ? "Activo" : "Inactivo",
    ])
    downloadCSV("productos", headers, rows)
  }

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      const matchedCat = apiCategories.find((c) => c.nombre === product.category)
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        categoryId: matchedCat ? String(matchedCat.id) : "",
        stock: product.stock,
        status: product.status,
      })
    } else {
      setEditingProduct(null)
      setFormData({
        name: "",
        description: "",
        price: 0,
        categoryId: "",
        stock: 999,
        status: "active",
      })
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (formData.price <= 0) {
      toast.error("El precio debe ser mayor que 0")
      return
    }
    try {
      const catId = formData.categoryId ? Number(formData.categoryId) : undefined
      if (editingProduct) {
        await productosApi.actualizar(Number(editingProduct.id), {
          nombre: formData.name,
          descripcion: formData.description,
          precio: formData.price,
          categoriaId: catId,
          stock: formData.stock,
          activo: formData.status === "active",
        })
      } else {
        await productosApi.crear({
          nombre: formData.name,
          descripcion: formData.description,
          precio: formData.price,
          categoriaId: catId,
          sku: `SKU-${Date.now()}`,
          stock: formData.stock,
          activo: formData.status === "active",
        })
      }
      setIsDialogOpen(false)
      toast.success(editingProduct ? "Producto actualizado correctamente" : "Producto creado correctamente")
      fetchProducts()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar producto")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await productosApi.eliminar(Number(id))
      toast.success("Producto eliminado correctamente")
      fetchProducts()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar producto")
    }
  }

  const toggleStatus = async (id: string) => {
    try {
      const product = products.find((p) => p.id === id)
      if (product?.status === "active") {
        await productosApi.desactivar(Number(id))
      } else {
        await productosApi.activar(Number(id))
      }
      toast.success("Estado actualizado correctamente")
      fetchProducts()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cambiar estado")
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="p-2 md:p-3 rounded-lg bg-secondary">
                <Package className="h-4 w-4 md:h-5 md:w-5 text-foreground" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Total</p>
                <p className="text-lg md:text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="p-2 md:p-3 rounded-lg bg-primary/20">
                <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Activos</p>
                <p className="text-lg md:text-2xl font-bold text-foreground">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="p-2 md:p-3 rounded-lg bg-accent/20">
                <Tag className="h-4 w-4 md:h-5 md:w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Categorías</p>
                <p className="text-lg md:text-2xl font-bold text-foreground">{stats.categories}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="bg-card border-border">
        <CardHeader className="border-b border-border p-4 md:p-6">
          <div className="flex flex-col gap-4">
            <CardTitle className="text-foreground text-base md:text-lg">Gestión de Productos</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar producto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full bg-input border-border text-foreground placeholder:text-muted-foreground text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-32 bg-input border-border text-foreground text-sm">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="all">Todas</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleDownload}
                  className="h-9 w-9 border-border"
                  title="Descargar CSV"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => handleOpenDialog()}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
                    >
                      <Plus className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Nuevo</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border max-w-[95vw] sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-foreground">
                        {editingProduct ? "Editar Producto" : "Nuevo Producto"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label className="text-foreground text-sm">Nombre</Label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="bg-input border-border text-foreground text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground text-sm">Descripción</Label>
                        <Textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="bg-input border-border text-foreground resize-none text-sm"
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
<Label className="text-foreground text-sm">Precio (MXN)</Label>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: Number(e.target.value) })
                    }
                    className="bg-input border-border text-foreground text-sm"
                  />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-foreground text-sm">Categoria</Label>
                          <Select
                            value={formData.categoryId}
                            onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                          >
                            <SelectTrigger className="bg-input border-border text-foreground text-sm">
                              <SelectValue placeholder="Seleccionar..." />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                              {apiCategories.filter((c) => c.activo).map((cat) => (
                                <SelectItem key={cat.id} value={String(cat.id)}>
                                  {cat.nombre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground text-sm">Estado</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(value: Product["status"]) =>
                            setFormData({ ...formData, status: value })
                          }
                        >
                          <SelectTrigger className="bg-input border-border text-foreground text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            <SelectItem value="active">Activo</SelectItem>
                            <SelectItem value="inactive">Inactivo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        onClick={handleSave}
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        {editingProduct ? "Guardar Cambios" : "Crear Producto"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            {paginatedProducts.map((product) => (
              <Card
                key={product.id}
                className={`bg-secondary/30 border-border transition-all hover:border-primary/50 ${
                  product.status === "inactive" ? "opacity-60" : ""
                }`}
              >
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-start justify-between mb-2 md:mb-3 gap-2">
                    <Badge
                      variant="outline"
                      className="bg-secondary text-secondary-foreground border-border text-xs"
                    >
                      {product.category}
                    </Badge>
                    <Badge
                      className={`text-xs ${
                        product.status === "active"
                          ? "bg-primary/20 text-primary border-primary/30"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {product.status === "active" ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          <span className="hidden sm:inline">Activo</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 mr-1" />
                          <span className="hidden sm:inline">Inactivo</span>
                        </>
                      )}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-foreground mb-1 md:mb-2 line-clamp-1 text-sm md:text-base">
                    {product.name}
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm md:text-lg font-bold text-primary">
                      <DollarSign className="h-3 w-3 md:h-4 md:w-4" />
                      <span className="truncate">{product.price.toLocaleString("es-MX")}</span>
                    </div>
                    <div className="flex items-center gap-0.5 md:gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(product)}
                        className="h-7 w-7 md:h-8 md:w-8 text-foreground hover:bg-secondary"
                      >
                        <Edit className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleStatus(product.id)}
                        className="h-7 w-7 md:h-8 md:w-8 text-foreground hover:bg-secondary"
                      >
                        {product.status === "active" ? (
                          <XCircle className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        ) : (
                          <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(product.id)}
                        className="h-7 w-7 md:h-8 md:w-8 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border mt-4 pt-4">
              <p className="text-xs text-muted-foreground">
                {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredProducts.length)} de {filteredProducts.length} productos
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-foreground font-medium">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

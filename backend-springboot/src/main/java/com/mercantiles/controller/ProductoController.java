package com.mercantiles.controller;

import com.mercantiles.dto.ApiResponse;
import com.mercantiles.dto.PageResponse;
import com.mercantiles.dto.ProductoDTO;
import com.mercantiles.entity.CategoriaProducto;
import com.mercantiles.service.ProductoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/productos")
@RequiredArgsConstructor
public class ProductoController {

    private final ProductoService productoService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ProductoDTO.Response>>> listar(
            @RequestParam(required = false) String busqueda,
            @RequestParam(required = false) Long categoriaId,
            @RequestParam(required = false) Boolean activo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("asc") ? 
                Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        PageResponse<ProductoDTO.Response> response = productoService.buscar(busqueda, categoriaId, activo, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<ProductoDTO.Response>>> listarTodos() {
        List<ProductoDTO.Response> productos = productoService.listarTodos();
        return ResponseEntity.ok(ApiResponse.success(productos));
    }

    @GetMapping("/categorias")
    public ResponseEntity<ApiResponse<List<CategoriaProducto>>> listarCategorias() {
        List<CategoriaProducto> categorias = productoService.listarCategorias();
        return ResponseEntity.ok(ApiResponse.success(categorias));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductoDTO.Response>> obtenerPorId(@PathVariable Long id) {
        try {
            ProductoDTO.Response producto = productoService.obtenerPorId(id);
            return ResponseEntity.ok(ApiResponse.success(producto));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProductoDTO.Response>> crear(
            @Valid @RequestBody ProductoDTO.CreateRequest request) {
        try {
            ProductoDTO.Response producto = productoService.crear(request);
            return ResponseEntity.ok(ApiResponse.success(producto, "Producto creado exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductoDTO.Response>> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody ProductoDTO.UpdateRequest request) {
        try {
            ProductoDTO.Response producto = productoService.actualizar(id, request);
            return ResponseEntity.ok(ApiResponse.success(producto, "Producto actualizado"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<ApiResponse<ProductoDTO.Response>> cambiarEstado(
            @PathVariable Long id,
            @RequestParam Boolean activo) {
        try {
            ProductoDTO.Response producto = productoService.cambiarEstado(id, activo);
            return ResponseEntity.ok(ApiResponse.success(producto, "Estado actualizado"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> eliminar(@PathVariable Long id) {
        try {
            productoService.eliminar(id);
            return ResponseEntity.ok(ApiResponse.success(null, "Producto eliminado"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
}

package com.mercantiles.service;

import com.mercantiles.dto.PageResponse;
import com.mercantiles.dto.ProductoDTO;
import com.mercantiles.entity.CategoriaProducto;
import com.mercantiles.entity.Producto;
import com.mercantiles.repository.CategoriaProductoRepository;
import com.mercantiles.repository.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductoService {

    private final ProductoRepository productoRepository;
    private final CategoriaProductoRepository categoriaRepository;

    public PageResponse<ProductoDTO.Response> buscar(String busqueda, Long categoriaId, Boolean activo, Pageable pageable) {
        Page<Producto> page = productoRepository.buscar(busqueda, categoriaId, activo, pageable);
        List<ProductoDTO.Response> content = page.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        return PageResponse.from(page, content);
    }

    public List<ProductoDTO.Response> listarTodos() {
        return productoRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ProductoDTO.Response obtenerPorId(Long id) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
        return mapToResponse(producto);
    }

    @Transactional
    public ProductoDTO.Response crear(ProductoDTO.CreateRequest request) {
        if (productoRepository.existsBySku(request.getSku())) {
            throw new RuntimeException("Ya existe un producto con ese SKU");
        }

        Producto producto = Producto.builder()
                .sku(request.getSku())
                .nombre(request.getNombre())
                .descripcion(request.getDescripcion())
                .descripcionCorta(request.getDescripcionCorta())
                .precio(request.getPrecio())
                .precioOferta(request.getPrecioOferta())
                .stock(request.getStock() != null ? request.getStock() : 0)
                .stockMinimo(request.getStockMinimo() != null ? request.getStockMinimo() : 5)
                .imagen(request.getImagen())
                .imagenes(request.getImagenes())
                .activo(true)
                .destacado(request.getDestacado() != null ? request.getDestacado() : false)
                .especificaciones(request.getEspecificaciones())
                .build();

        if (request.getCategoriaId() != null) {
            CategoriaProducto categoria = categoriaRepository.findById(request.getCategoriaId())
                    .orElseThrow(() -> new RuntimeException("Categoría no encontrada"));
            producto.setCategoria(categoria);
        }

        producto = productoRepository.save(producto);
        return mapToResponse(producto);
    }

    @Transactional
    public ProductoDTO.Response actualizar(Long id, ProductoDTO.UpdateRequest request) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        if (request.getSku() != null && !request.getSku().equals(producto.getSku())) {
            if (productoRepository.existsBySku(request.getSku())) {
                throw new RuntimeException("Ya existe un producto con ese SKU");
            }
            producto.setSku(request.getSku());
        }
        if (request.getNombre() != null) producto.setNombre(request.getNombre());
        if (request.getDescripcion() != null) producto.setDescripcion(request.getDescripcion());
        if (request.getDescripcionCorta() != null) producto.setDescripcionCorta(request.getDescripcionCorta());
        if (request.getPrecio() != null) producto.setPrecio(request.getPrecio());
        if (request.getPrecioOferta() != null) producto.setPrecioOferta(request.getPrecioOferta());
        if (request.getStock() != null) producto.setStock(request.getStock());
        if (request.getStockMinimo() != null) producto.setStockMinimo(request.getStockMinimo());
        if (request.getImagen() != null) producto.setImagen(request.getImagen());
        if (request.getImagenes() != null) producto.setImagenes(request.getImagenes());
        if (request.getActivo() != null) producto.setActivo(request.getActivo());
        if (request.getDestacado() != null) producto.setDestacado(request.getDestacado());
        if (request.getEspecificaciones() != null) producto.setEspecificaciones(request.getEspecificaciones());
        
        if (request.getCategoriaId() != null) {
            CategoriaProducto categoria = categoriaRepository.findById(request.getCategoriaId())
                    .orElseThrow(() -> new RuntimeException("Categoría no encontrada"));
            producto.setCategoria(categoria);
        }

        producto = productoRepository.save(producto);
        return mapToResponse(producto);
    }

    @Transactional
    public ProductoDTO.Response cambiarEstado(Long id, Boolean activo) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
        producto.setActivo(activo);
        producto = productoRepository.save(producto);
        return mapToResponse(producto);
    }

    @Transactional
    public void eliminar(Long id) {
        if (!productoRepository.existsById(id)) {
            throw new RuntimeException("Producto no encontrado");
        }
        productoRepository.deleteById(id);
    }

    public List<CategoriaProducto> listarCategorias() {
        return categoriaRepository.findByActivo(true);
    }

    private ProductoDTO.Response mapToResponse(Producto producto) {
        return ProductoDTO.Response.builder()
                .id(producto.getId())
                .sku(producto.getSku())
                .nombre(producto.getNombre())
                .descripcion(producto.getDescripcion())
                .descripcionCorta(producto.getDescripcionCorta())
                .categoriaId(producto.getCategoria() != null ? producto.getCategoria().getId() : null)
                .categoriaNombre(producto.getCategoria() != null ? producto.getCategoria().getNombre() : null)
                .precio(producto.getPrecio())
                .precioOferta(producto.getPrecioOferta())
                .stock(producto.getStock())
                .stockMinimo(producto.getStockMinimo())
                .imagen(producto.getImagen())
                .imagenes(producto.getImagenes())
                .activo(producto.getActivo())
                .destacado(producto.getDestacado())
                .especificaciones(producto.getEspecificaciones())
                .createdAt(producto.getCreatedAt())
                .updatedAt(producto.getUpdatedAt())
                .build();
    }
}

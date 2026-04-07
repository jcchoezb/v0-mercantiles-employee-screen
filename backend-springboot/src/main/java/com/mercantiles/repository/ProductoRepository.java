package com.mercantiles.repository;

import com.mercantiles.entity.Producto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {
    
    Optional<Producto> findBySku(String sku);
    
    boolean existsBySku(String sku);
    
    List<Producto> findByActivo(Boolean activo);
    
    List<Producto> findByDestacado(Boolean destacado);
    
    Page<Producto> findByCategoriaId(Long categoriaId, Pageable pageable);
    
    @Query("SELECT p FROM Producto p WHERE " +
           "(:busqueda IS NULL OR " +
           "LOWER(p.nombre) LIKE LOWER(CONCAT('%', :busqueda, '%')) OR " +
           "LOWER(p.sku) LIKE LOWER(CONCAT('%', :busqueda, '%')) OR " +
           "LOWER(p.descripcion) LIKE LOWER(CONCAT('%', :busqueda, '%'))) " +
           "AND (:categoriaId IS NULL OR p.categoria.id = :categoriaId) " +
           "AND (:activo IS NULL OR p.activo = :activo)")
    Page<Producto> buscar(String busqueda, Long categoriaId, Boolean activo, Pageable pageable);
    
    @Query("SELECT p FROM Producto p WHERE p.stock <= p.stockMinimo")
    List<Producto> findProductosStockBajo();
    
    @Query("SELECT COUNT(p) FROM Producto p WHERE p.activo = true")
    Long countActivos();
}

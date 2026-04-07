package com.mercantiles.repository;

import com.mercantiles.entity.CategoriaProducto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoriaProductoRepository extends JpaRepository<CategoriaProducto, Long> {
    
    Optional<CategoriaProducto> findByNombre(String nombre);
    
    List<CategoriaProducto> findByActivo(Boolean activo);
}

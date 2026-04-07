package com.mercantiles.repository;

import com.mercantiles.entity.Cliente;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    
    Optional<Cliente> findByEmail(String email);
    
    boolean existsByEmail(String email);
    
    Page<Cliente> findByEstado(Cliente.EstadoCliente estado, Pageable pageable);
    
    @Query("SELECT c FROM Cliente c WHERE " +
           "(:busqueda IS NULL OR " +
           "LOWER(c.nombre) LIKE LOWER(CONCAT('%', :busqueda, '%')) OR " +
           "LOWER(c.apellido) LIKE LOWER(CONCAT('%', :busqueda, '%')) OR " +
           "LOWER(c.email) LIKE LOWER(CONCAT('%', :busqueda, '%')) OR " +
           "LOWER(c.empresa) LIKE LOWER(CONCAT('%', :busqueda, '%'))) " +
           "AND (:estado IS NULL OR c.estado = :estado)")
    Page<Cliente> buscar(String busqueda, Cliente.EstadoCliente estado, Pageable pageable);
    
    @Query("SELECT COUNT(c) FROM Cliente c WHERE c.estado = :estado")
    Long countByEstado(Cliente.EstadoCliente estado);
    
    @Query("SELECT c.fuenteOrigen, COUNT(c) FROM Cliente c GROUP BY c.fuenteOrigen")
    Object[][] countByFuenteOrigen();
}

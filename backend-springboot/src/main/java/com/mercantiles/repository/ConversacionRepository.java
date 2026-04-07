package com.mercantiles.repository;

import com.mercantiles.entity.Conversacion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConversacionRepository extends JpaRepository<Conversacion, Long> {
    
    List<Conversacion> findByEstado(Conversacion.EstadoConversacion estado);
    
    List<Conversacion> findByEmpleadoId(Long empleadoId);
    
    List<Conversacion> findByClienteId(Long clienteId);
    
    @Query("SELECT c FROM Conversacion c WHERE c.estado = 'pendiente' ORDER BY c.prioridad DESC, c.createdAt ASC")
    List<Conversacion> findPendientes();
    
    @Query("SELECT c FROM Conversacion c WHERE c.empleado.id = :empleadoId AND c.estado IN ('activa', 'en_espera')")
    List<Conversacion> findActivasByEmpleado(Long empleadoId);
    
    @Query("SELECT c FROM Conversacion c WHERE " +
           "(:estado IS NULL OR c.estado = :estado) " +
           "ORDER BY c.updatedAt DESC")
    Page<Conversacion> buscar(Conversacion.EstadoConversacion estado, Pageable pageable);
    
    @Query("SELECT COUNT(c) FROM Conversacion c WHERE c.estado = :estado")
    Long countByEstado(Conversacion.EstadoConversacion estado);
    
    @Query("SELECT c.estado, COUNT(c) FROM Conversacion c GROUP BY c.estado")
    Object[][] countGroupByEstado();
}

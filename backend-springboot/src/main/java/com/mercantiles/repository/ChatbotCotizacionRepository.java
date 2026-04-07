package com.mercantiles.repository;

import com.mercantiles.entity.ChatbotCotizacion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatbotCotizacionRepository extends JpaRepository<ChatbotCotizacion, Long> {
    
    Optional<ChatbotCotizacion> findByNumero(String numero);
    
    List<ChatbotCotizacion> findByClienteId(Long clienteId);
    
    List<ChatbotCotizacion> findByConversacionId(Long conversacionId);
    
    List<ChatbotCotizacion> findByEstado(ChatbotCotizacion.EstadoCotizacion estado);
    
    @Query("SELECT c FROM ChatbotCotizacion c WHERE c.validaHasta < CURRENT_TIMESTAMP AND c.estado = 'enviada'")
    List<ChatbotCotizacion> findExpiradas();
    
    Page<ChatbotCotizacion> findAllByOrderByCreatedAtDesc(Pageable pageable);
    
    @Query("SELECT SUM(c.total) FROM ChatbotCotizacion c WHERE c.estado = 'aceptada'")
    Double sumTotalAceptadas();
}

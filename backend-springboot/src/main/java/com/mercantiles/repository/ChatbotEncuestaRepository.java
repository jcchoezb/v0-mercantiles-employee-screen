package com.mercantiles.repository;

import com.mercantiles.entity.ChatbotEncuesta;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatbotEncuestaRepository extends JpaRepository<ChatbotEncuesta, Long> {
    
    List<ChatbotEncuesta> findByClienteId(Long clienteId);
    
    List<ChatbotEncuesta> findByConversacionId(Long conversacionId);
    
    List<ChatbotEncuesta> findByTipoEncuesta(String tipoEncuesta);
    
    @Query("SELECT AVG(e.puntuacion) FROM ChatbotEncuesta e WHERE e.tipoEncuesta = :tipo")
    Double promedioPuntuacionByTipo(String tipo);
    
    @Query("SELECT AVG(e.puntuacion) FROM ChatbotEncuesta e")
    Double promedioPuntuacionGeneral();
    
    Page<ChatbotEncuesta> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
